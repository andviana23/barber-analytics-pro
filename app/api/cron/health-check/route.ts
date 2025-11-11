/**
 * @fileoverview Cron: Health Check
 * @module app/api/cron/health-check
 * @description Verifica saúde do sistema e dispara alertas quando necessário
 *
 * Schedule: */5 * * * * (A cada 5 minutos)
 *
 * Checks:
 * - Supabase conectividade
 * - OpenAI quota/custos
 * - Última execução de cron
 * - Storage usage
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 6.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';
import { logger } from '@/lib/logger';
import { checkCostThreshold, getMonthlyOpenAICost } from '@/lib/monitoring';
import { sendTelegramAlert } from '@/lib/telegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/health-check
 *
 * Executa health check do sistema
 */
export async function GET(request: NextRequest) {
  const correlationId = `health-check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Health check iniciado', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Verificar autenticação
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  const healthChecks: Record<string, { status: 'healthy' | 'warning' | 'critical'; message: string }> = {};

  try {
    // 2. Check: Supabase conectividade
    try {
      const { error: supabaseError } = await supabase.from('units').select('id').limit(1);
      if (supabaseError) {
        healthChecks.supabase = {
          status: 'critical',
          message: `Erro de conexão: ${supabaseError.message}`,
        };
      } else {
        healthChecks.supabase = {
          status: 'healthy',
          message: 'Conexão OK',
        };
      }
    } catch (error: any) {
      healthChecks.supabase = {
        status: 'critical',
        message: `Erro ao conectar: ${error.message}`,
      };
    }

    // 3. Check: OpenAI custos
    try {
      const costCheck = await checkCostThreshold();
      if (costCheck.exceeded) {
        healthChecks.openaiCosts = {
          status: 'critical',
          message: `Custo excedido: $${costCheck.current.toFixed(2)} / $${costCheck.threshold}`,
        };
      } else if (costCheck.percentage >= 80) {
        healthChecks.openaiCosts = {
          status: 'warning',
          message: `Custo próximo do limite: $${costCheck.current.toFixed(2)} / $${costCheck.threshold} (${costCheck.percentage.toFixed(1)}%)`,
        };
      } else {
        healthChecks.openaiCosts = {
          status: 'healthy',
          message: `Custo OK: $${costCheck.current.toFixed(2)} / $${costCheck.threshold} (${costCheck.percentage.toFixed(1)}%)`,
        };
      }
    } catch (error: any) {
      healthChecks.openaiCosts = {
        status: 'warning',
        message: `Erro ao verificar custos: ${error.message}`,
      };
    }

    // 4. Check: Última execução de cron (ETL)
    try {
      const { data: lastEtlRun, error: etlError } = await supabase
        .from('etl_runs')
        .select('*')
        .eq('run_type', 'ETL_DIARIO')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (etlError || !lastEtlRun) {
        healthChecks.lastEtlRun = {
          status: 'warning',
          message: 'Nenhuma execução de ETL encontrada',
        };
      } else {
        const lastRunDate = new Date(lastEtlRun.created_at);
        const hoursSinceLastRun = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastRun > 25) {
          healthChecks.lastEtlRun = {
            status: 'critical',
            message: `Última execução há ${hoursSinceLastRun.toFixed(1)} horas`,
          };
        } else if (hoursSinceLastRun > 24) {
          healthChecks.lastEtlRun = {
            status: 'warning',
            message: `Última execução há ${hoursSinceLastRun.toFixed(1)} horas`,
          };
        } else {
          healthChecks.lastEtlRun = {
            status: 'healthy',
            message: `Última execução há ${hoursSinceLastRun.toFixed(1)} horas (${lastRunDate.toLocaleString('pt-BR')})`,
          };
        }
      }
    } catch (error: any) {
      healthChecks.lastEtlRun = {
        status: 'warning',
        message: `Erro ao verificar ETL: ${error.message}`,
      };
    }

    // 5. Check: Storage usage (tamanho das tabelas principais)
    try {
      const { data: storageData, error: storageError } = await supabase.rpc('pg_total_relation_size', {
        relation_name: 'revenues',
      });

      if (!storageError && storageData) {
        const sizeMB = (storageData as number) / (1024 * 1024);
        healthChecks.storage = {
          status: sizeMB > 1000 ? 'warning' : 'healthy',
          message: `Tamanho aproximado: ${sizeMB.toFixed(2)} MB`,
        };
      } else {
        healthChecks.storage = {
          status: 'healthy',
          message: 'Não foi possível verificar tamanho',
        };
      }
    } catch (error: any) {
      healthChecks.storage = {
        status: 'healthy',
        message: 'Verificação de storage não disponível',
      };
    }

    // 6. Determinar status geral
    const criticalCount = Object.values(healthChecks).filter(c => c.status === 'critical').length;
    const warningCount = Object.values(healthChecks).filter(c => c.status === 'warning').length;

    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) {
      overallStatus = 'critical';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    }

    // 7. Enviar alerta se necessário
    if (overallStatus !== 'healthy') {
      const alertMessage =
        `⚠️ *Health Check - ${overallStatus.toUpperCase()}*\n\n` +
        Object.entries(healthChecks)
          .map(([key, check]) => {
            const emoji = check.status === 'critical' ? '🔴' : check.status === 'warning' ? '⚠️' : '✅';
            return `${emoji} *${key}:* ${check.message}`;
          })
          .join('\n');

      await sendTelegramAlert({
        message: alertMessage,
        severity: overallStatus === 'critical' ? 'CRITICAL' : 'HIGH',
        metadata: {
          'Status Geral': overallStatus.toUpperCase(),
          'Críticos': criticalCount.toString(),
          'Avisos': warningCount.toString(),
        },
      });
    }

    const durationMs = Date.now() - startTime;

    logger.info('Health check concluído', {
      correlationId,
      overallStatus,
      criticalCount,
      warningCount,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      correlationId,
      overallStatus,
      checks: healthChecks,
      summary: {
        critical: criticalCount,
        warning: warningCount,
        healthy: Object.values(healthChecks).length - criticalCount - warningCount,
      },
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico no health check', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

