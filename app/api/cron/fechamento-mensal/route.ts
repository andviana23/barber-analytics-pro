/**
 * @fileoverview Cron: Fechamento Mensal
 * @module app/api/cron/fechamento-mensal
 * @description Gera e envia relatório de fechamento mensal com DRE e análise executiva
 *
 * Schedule: 0 7 1 * * (Dia 1 do mês às 07:00 BRT)
 *
 * Fluxo:
 * 1. Calcular DRE do mês anterior (função fn_calculate_dre())
 * 2. Gerar sumário executivo via OpenAI
 * 3. Comparar com targets (tabela kpi_targets)
 * 4. Enviar relatório completo
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 6.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';
import { logger } from '@/lib/logger';
import { aiMetricsRepository } from '@/lib/repositories/aiMetricsRepository';
import { kpiTargetsRepository } from '@/lib/repositories/kpiTargetsRepository';
import { generateAnalysis } from '@/lib/ai/analysis';
import { sendTelegramAlert } from '@/lib/telegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/fechamento-mensal
 *
 * Gera e envia relatório de fechamento mensal
 */
export async function GET(request: NextRequest) {
  const correlationId = `monthly-closing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Fechamento mensal iniciado', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Verificar autenticação
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  try {
    // 2. Calcular mês anterior
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    logger.info('Período do mês anterior calculado', {
      correlationId,
      monthStart: lastMonth.toISOString().split('T')[0],
      monthEnd: lastMonthEnd.toISOString().split('T')[0],
    });

    // 3. Buscar unidades ativas
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (unitsError || !units || units.length === 0) {
      logger.warn('Nenhuma unidade ativa encontrada', {
        correlationId,
        error: unitsError?.message,
      });
      return NextResponse.json({
        success: true,
        message: 'Nenhuma unidade ativa para processar',
        correlationId,
      });
    }

    // 4. Processar cada unidade
    const reports = [];

    for (const unit of units) {
      try {
        logger.info('Gerando fechamento mensal para unidade', {
          correlationId,
          unitId: unit.id,
          unitName: unit.name,
        });

        // 5. Calcular DRE usando função do banco
        const { data: dreData, error: dreError } = await supabase.rpc('fn_calculate_dre', {
          p_unit_id: unit.id,
          p_start_date: lastMonth.toISOString().split('T')[0],
          p_end_date: lastMonthEnd.toISOString().split('T')[0],
        });

        if (dreError) {
          logger.error('Erro ao calcular DRE', {
            correlationId,
            unitId: unit.id,
            error: dreError.message,
          });
          continue;
        }

        // 6. Buscar métricas do mês
        const { data: metrics, error: metricsError } = await aiMetricsRepository.findByPeriod(
          unit.id,
          lastMonth,
          lastMonthEnd
        );

        if (metricsError || !metrics || metrics.length === 0) {
          logger.warn('Nenhuma métrica encontrada para unidade', {
            correlationId,
            unitId: unit.id,
          });
          continue;
        }

        // Calcular métricas agregadas
        const aggregated = {
          grossRevenue: metrics.reduce((sum, m) => sum + (m.gross_revenue || 0), 0),
          totalExpenses: metrics.reduce((sum, m) => sum + (m.total_expenses || 0), 0),
          marginPercentage: 0,
          averageTicket: 0,
          transactionsCount: metrics.reduce((sum, m) => sum + (m.revenues_count || 0), 0),
        };

        if (aggregated.grossRevenue > 0) {
          aggregated.marginPercentage =
            ((aggregated.grossRevenue - aggregated.totalExpenses) / aggregated.grossRevenue) * 100;
        }

        if (aggregated.transactionsCount > 0) {
          aggregated.averageTicket = aggregated.grossRevenue / aggregated.transactionsCount;
        }

        // 7. Buscar targets e comparar
        const { data: marginTarget } = await kpiTargetsRepository.findByKPI(unit.id, 'MARGIN');
        const { data: revenueTarget } = await kpiTargetsRepository.findByKPI(
          unit.id,
          'MONTHLY_REVENUE'
        );

        const targetsComparison = {
          margin: {
            target: marginTarget?.target_value || null,
            actual: aggregated.marginPercentage,
            achieved: marginTarget
              ? aggregated.marginPercentage >= marginTarget.target_value
              : null,
          },
          revenue: {
            target: revenueTarget?.target_value || null,
            actual: aggregated.grossRevenue,
            achieved: revenueTarget
              ? aggregated.grossRevenue >= revenueTarget.target_value
              : null,
          },
        };

        // 8. Gerar sumário executivo via OpenAI
        const analysis = await generateAnalysis(
          unit.id,
          {
            ...aggregated,
            trends: {
              revenueChange: 0, // Poderia calcular comparando com mês anterior
              marginChange: 0,
            },
          },
          'MONTHLY_EXECUTIVE',
          {}
        );

        // 9. Preparar relatório
        const report = {
          unitId: unit.id,
          unitName: unit.name,
          month: lastMonth.toISOString().split('T')[0].substring(0, 7),
          dre: dreData,
          metrics: aggregated,
          targetsComparison,
          executiveSummary: analysis.parsed || analysis.content,
          generatedAt: new Date().toISOString(),
        };

        reports.push(report);

        // 10. Enviar relatório via Telegram
        const telegramMessage =
          `📊 *Fechamento Mensal - ${unit.name}*\n\n` +
          `📅 Mês: ${lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n\n` +
          `💰 Receita: R$ ${aggregated.grossRevenue.toFixed(2)}` +
          (targetsComparison.revenue.target
            ? ` (Target: R$ ${targetsComparison.revenue.target.toFixed(2)}) ${
                targetsComparison.revenue.achieved ? '✅' : '❌'
              }`
            : '') +
          `\n` +
          `💸 Despesas: R$ ${aggregated.totalExpenses.toFixed(2)}\n` +
          `📈 Margem: ${aggregated.marginPercentage.toFixed(1)}%` +
          (targetsComparison.margin.target
            ? ` (Target: ${targetsComparison.margin.target.toFixed(1)}%) ${
                targetsComparison.margin.achieved ? '✅' : '❌'
              }`
            : '') +
          `\n` +
          `🎫 Ticket Médio: R$ ${aggregated.averageTicket.toFixed(2)}\n\n` +
          `📝 *Sumário Executivo:*\n${analysis.parsed?.executiveSummary || analysis.content.substring(0, 300)}...`;

        await sendTelegramAlert({
          message: telegramMessage,
          severity: 'HIGH',
          unitId: unit.id,
          unitName: unit.name,
          metadata: {
            'Receita': `R$ ${aggregated.grossRevenue.toFixed(2)}`,
            'Margem': `${aggregated.marginPercentage.toFixed(1)}%`,
            'Targets Alcançados': `${
              [targetsComparison.margin.achieved, targetsComparison.revenue.achieved].filter(
                Boolean
              ).length
            }/2`,
          },
        });

        logger.info('Fechamento mensal gerado e enviado para unidade', {
          correlationId,
          unitId: unit.id,
        });
      } catch (error: any) {
        logger.error('Erro ao processar unidade no fechamento mensal', {
          correlationId,
          unitId: unit.id,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('Fechamento mensal concluído', {
      correlationId,
      reportsGenerated: reports.length,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      correlationId,
      reportsGenerated: reports.length,
      month: lastMonth.toISOString().split('T')[0].substring(0, 7),
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico no fechamento mensal', {
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

