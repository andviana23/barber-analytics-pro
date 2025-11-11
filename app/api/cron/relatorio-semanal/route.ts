/**
 * @fileoverview Cron: Relatório Semanal
 * @module app/api/cron/relatorio-semanal
 * @description Gera e envia relatório semanal com análise IA
 *
 * Schedule: 0 6 * * 1 (Segunda-feira às 06:00 BRT)
 *
 * Fluxo:
 * 1. Buscar métricas da semana anterior
 * 2. Gerar análise via OpenAI
 * 3. Salvar relatório
 * 4. Enviar via Telegram
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 6.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';
import { logger } from '@/lib/logger';
import { aiMetricsRepository } from '@/lib/repositories/aiMetricsRepository';
import { generateAnalysis } from '@/lib/ai/analysis';
import { sendTelegramAlert } from '@/lib/telegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/relatorio-semanal
 *
 * Gera e envia relatório semanal com análise IA
 */
export async function GET(request: NextRequest) {
  const correlationId = `weekly-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Relatório semanal iniciado', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Verificar autenticação
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  try {
    // 2. Calcular semana anterior (segunda a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday - 7); // Semana anterior
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    logger.info('Período da semana anterior calculado', {
      correlationId,
      weekStart: lastMonday.toISOString().split('T')[0],
      weekEnd: lastSunday.toISOString().split('T')[0],
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

    logger.info('Unidades ativas encontradas', {
      correlationId,
      unitsCount: units.length,
    });

    // 4. Processar cada unidade
    const reports = [];

    for (const unit of units) {
      try {
        logger.info('Gerando relatório para unidade', {
          correlationId,
          unitId: unit.id,
          unitName: unit.name,
        });

        // Buscar métricas da semana anterior
        const { data: metrics, error: metricsError } =
          await aiMetricsRepository.findByPeriod(unit.id, lastMonday, lastSunday);

        if (metricsError || !metrics || metrics.length === 0) {
          logger.warn('Nenhuma métrica encontrada para unidade', {
            correlationId,
            unitId: unit.id,
            error: metricsError?.message,
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

        // Gerar análise via OpenAI
        const analysis = await generateAnalysis(
          unit.id,
          aggregated,
          'WEEKLY',
          {}
        );

        // Salvar relatório (opcional - pode criar tabela weekly_reports)
        const report = {
          unitId: unit.id,
          unitName: unit.name,
          weekStart: lastMonday.toISOString().split('T')[0],
          weekEnd: lastSunday.toISOString().split('T')[0],
          metrics: aggregated,
          analysis: analysis.parsed || analysis.content,
          generatedAt: new Date().toISOString(),
        };

        reports.push(report);

        // Enviar via Telegram
        const telegramMessage = `📊 *Relatório Semanal - ${unit.name}*\n\n` +
          `📅 Período: ${lastMonday.toISOString().split('T')[0]} a ${lastSunday.toISOString().split('T')[0]}\n\n` +
          `💰 Receita: R$ ${aggregated.grossRevenue.toFixed(2)}\n` +
          `💸 Despesas: R$ ${aggregated.totalExpenses.toFixed(2)}\n` +
          `📈 Margem: ${aggregated.marginPercentage.toFixed(1)}%\n` +
          `🎫 Ticket Médio: R$ ${aggregated.averageTicket.toFixed(2)}\n\n` +
          `📝 *Análise:*\n${analysis.parsed?.summary || analysis.content.substring(0, 200)}...`;

        await sendTelegramAlert({
          message: telegramMessage,
          severity: 'MEDIUM',
          unitId: unit.id,
          unitName: unit.name,
          metadata: {
            'Receita': `R$ ${aggregated.grossRevenue.toFixed(2)}`,
            'Margem': `${aggregated.marginPercentage.toFixed(1)}%`,
            'Ticket Médio': `R$ ${aggregated.averageTicket.toFixed(2)}`,
          },
        });

        logger.info('Relatório gerado e enviado para unidade', {
          correlationId,
          unitId: unit.id,
        });
      } catch (error: any) {
        logger.error('Erro ao processar unidade', {
          correlationId,
          unitId: unit.id,
          error: error.message,
          stack: error.stack,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('Relatório semanal concluído', {
      correlationId,
      reportsGenerated: reports.length,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      correlationId,
      reportsGenerated: reports.length,
      weekStart: lastMonday.toISOString().split('T')[0],
      weekEnd: lastSunday.toISOString().split('T')[0],
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico no relatório semanal', {
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

