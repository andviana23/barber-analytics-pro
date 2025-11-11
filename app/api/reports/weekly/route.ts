/**
 * @fileoverview API Endpoint: Weekly Report
 * @module app/api/reports/weekly
 * @description Endpoint para gerar relatório semanal completo com métricas e análise IA
 *
 * GET /api/reports/weekly?unitId={id}&weekStartDate={date}
 *
 * Autenticação: Bearer JWT (Supabase Auth)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasUnitAccess } from '@/lib/auth/apiAuth';
import { aiMetricsRepository } from '@/lib/repositories/aiMetricsRepository';
import { alertsRepository } from '@/lib/repositories/alertsRepository';
import { logger } from '@/lib/logger';
import { getFromCache, setToCache } from '@/lib/cache';

/**
 * GET /api/reports/weekly
 *
 * Gera relatório semanal completo com métricas e análise IA
 *
 * Query Parameters:
 * - unitId (obrigatório) - ID da unidade
 * - weekStartDate (opcional) - Data de início da semana (YYYY-MM-DD, padrão: início da semana atual)
 *
 * @param request - Next.js request object
 * @returns JSON com relatório semanal completo
 */
export async function GET(request: NextRequest) {
  const correlationId = `weekly-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Relatório semanal solicitado', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  try {
    // 1. Autenticar requisição
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated) {
      logger.warn('Tentativa de acesso não autenticada', {
        correlationId,
        error: authResult.error,
      });
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: authResult.error || 'Authentication required',
          correlationId,
        },
        { status: 401 }
      );
    }

    // 2. Extrair query parameters
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const weekStartDateParam = searchParams.get('weekStartDate');

    if (!unitId) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'unitId is required',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 3. Validar acesso à unidade
    if (!hasUnitAccess(authResult, unitId)) {
      logger.warn('Tentativa de acesso a unidade não autorizada', {
        correlationId,
        userId: authResult.userId,
        unitId,
        userUnits: authResult.unitIds,
      });
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have access to this unit',
          correlationId,
        },
        { status: 403 }
      );
    }

    // 4. Calcular datas da semana
    let weekStartDate: Date;
    if (weekStartDateParam) {
      weekStartDate = new Date(weekStartDateParam);
      if (isNaN(weekStartDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'weekStartDate must be a valid date (YYYY-MM-DD)',
            correlationId,
          },
          { status: 400 }
        );
      }
    } else {
      // Início da semana atual (segunda-feira)
      weekStartDate = new Date();
      const dayOfWeek = weekStartDate.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Segunda = 1, Domingo = 0
      weekStartDate.setDate(weekStartDate.getDate() - diff);
      weekStartDate.setHours(0, 0, 0, 0);
    }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    logger.info('Parâmetros validados', {
      correlationId,
      userId: authResult.userId,
      unitId,
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      weekEndDate: weekEndDate.toISOString().split('T')[0],
    });

    // 5. Verificar cache (TTL: 1 hora)
    const cacheKey = `weekly-report-${unitId}-${weekStartDate.toISOString().split('T')[0]}`;
    const cachedResult = await getFromCache<any>(cacheKey, 3600);

    if (cachedResult) {
      logger.info('Relatório retornado do cache', {
        correlationId,
        cacheKey,
      });

      return NextResponse.json({
        ...cachedResult,
        cached: true,
        correlationId,
        durationMs: Date.now() - startTime,
      });
    }

    // 6. Buscar métricas da semana
    const { data: weekMetrics, error: metricsError } =
      await aiMetricsRepository.findByPeriod(unitId, weekStartDate, weekEndDate);

    if (metricsError) {
      logger.error('Erro ao buscar métricas', {
        correlationId,
        unitId,
        error: metricsError,
      });
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: 'Failed to fetch metrics',
          correlationId,
        },
        { status: 500 }
      );
    }

    // 7. Buscar métricas da semana anterior para comparação
    const previousWeekStart = new Date(weekStartDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(weekStartDate);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

    const { data: previousWeekMetrics } = await aiMetricsRepository.findByPeriod(
      unitId,
      previousWeekStart,
      previousWeekEnd
    );

    // 8. Calcular métricas agregadas
    const currentWeek = {
      grossRevenue: weekMetrics?.reduce((sum, m) => sum + (m.gross_revenue || 0), 0) || 0,
      totalExpenses: weekMetrics?.reduce((sum, m) => sum + (m.total_expenses || 0), 0) || 0,
      marginPercentage: 0,
      averageTicket: 0,
      transactionsCount: weekMetrics?.reduce((sum, m) => sum + (m.revenues_count || 0), 0) || 0,
      daysCount: weekMetrics?.length || 0,
    };

    currentWeek.marginPercentage =
      currentWeek.grossRevenue > 0
        ? ((currentWeek.grossRevenue - currentWeek.totalExpenses) / currentWeek.grossRevenue) * 100
        : 0;

    currentWeek.averageTicket =
      currentWeek.transactionsCount > 0
        ? currentWeek.grossRevenue / currentWeek.transactionsCount
        : 0;

    const previousWeek = {
      grossRevenue: previousWeekMetrics?.reduce((sum, m) => sum + (m.gross_revenue || 0), 0) || 0,
      totalExpenses: previousWeekMetrics?.reduce((sum, m) => sum + (m.total_expenses || 0), 0) || 0,
      marginPercentage: 0,
      averageTicket: 0,
      transactionsCount: previousWeekMetrics?.reduce((sum, m) => sum + (m.revenues_count || 0), 0) || 0,
    };

    if (previousWeek.grossRevenue > 0) {
      previousWeek.marginPercentage =
        ((previousWeek.grossRevenue - previousWeek.totalExpenses) / previousWeek.grossRevenue) * 100;
    }

    if (previousWeek.transactionsCount > 0) {
      previousWeek.averageTicket = previousWeek.grossRevenue / previousWeek.transactionsCount;
    }

    // 9. Calcular variações
    const revenueChange =
      previousWeek.grossRevenue > 0
        ? ((currentWeek.grossRevenue - previousWeek.grossRevenue) / previousWeek.grossRevenue) * 100
        : currentWeek.grossRevenue > 0 ? 100 : 0;

    const marginChange = currentWeek.marginPercentage - previousWeek.marginPercentage;

    // 10. Buscar alertas da semana
    const { data: weekAlerts } = await alertsRepository.findByUnit(unitId, 'OPEN', 50);
    const weekAlertsFiltered = (weekAlerts || []).filter(alert => {
      const alertDate = new Date(alert.created_at);
      return alertDate >= weekStartDate && alertDate <= weekEndDate;
    });

    // 11. Preparar análise básica (sem IA por enquanto)
    const analysis = {
      summary: `Semana de ${weekStartDate.toISOString().split('T')[0]} a ${weekEndDate.toISOString().split('T')[0]}`,
      highlights: [] as string[],
      concerns: [] as string[],
      recommendations: [] as string[],
    };

    if (revenueChange > 5) {
      analysis.highlights.push(`Receita aumentou ${revenueChange.toFixed(1)}% em relação à semana anterior`);
    } else if (revenueChange < -5) {
      analysis.concerns.push(`Receita diminuiu ${Math.abs(revenueChange).toFixed(1)}% em relação à semana anterior`);
    }

    if (currentWeek.marginPercentage < 20) {
      analysis.concerns.push(`Margem abaixo de 20% (${currentWeek.marginPercentage.toFixed(1)}%)`);
      analysis.recommendations.push('Revisar despesas e otimizar custos operacionais');
    }

    if (weekAlertsFiltered.length > 0) {
      analysis.concerns.push(`${weekAlertsFiltered.length} alerta(s) aberto(s) durante a semana`);
    }

    if (currentWeek.averageTicket > previousWeek.averageTicket) {
      analysis.highlights.push(`Ticket médio aumentou de R$ ${previousWeek.averageTicket.toFixed(2)} para R$ ${currentWeek.averageTicket.toFixed(2)}`);
    }

    // 12. Preparar resposta
    const response = {
      success: true,
      unitId,
      period: {
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        weekEndDate: weekEndDate.toISOString().split('T')[0],
        weekNumber: getWeekNumber(weekStartDate),
      },
      metrics: {
        current: {
          grossRevenue: Math.round(currentWeek.grossRevenue * 100) / 100,
          totalExpenses: Math.round(currentWeek.totalExpenses * 100) / 100,
          marginPercentage: Math.round(currentWeek.marginPercentage * 100) / 100,
          averageTicket: Math.round(currentWeek.averageTicket * 100) / 100,
          transactionsCount: currentWeek.transactionsCount,
          daysCount: currentWeek.daysCount,
        },
        previous: {
          grossRevenue: Math.round(previousWeek.grossRevenue * 100) / 100,
          totalExpenses: Math.round(previousWeek.totalExpenses * 100) / 100,
          marginPercentage: Math.round(previousWeek.marginPercentage * 100) / 100,
          averageTicket: Math.round(previousWeek.averageTicket * 100) / 100,
          transactionsCount: previousWeek.transactionsCount,
        },
        changes: {
          revenueChange: Math.round(revenueChange * 100) / 100,
          marginChange: Math.round(marginChange * 100) / 100,
          averageTicketChange: Math.round((currentWeek.averageTicket - previousWeek.averageTicket) * 100) / 100,
        },
      },
      alerts: weekAlertsFiltered.map(alert => ({
        id: alert.id,
        type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        createdAt: alert.created_at,
      })),
      analysis,
      cached: false,
      correlationId,
      durationMs: Date.now() - startTime,
    };

    // 13. Salvar no cache (TTL: 1 hora)
    await setToCache(cacheKey, response, 3600);

    logger.info('Relatório semanal gerado com sucesso', {
      correlationId,
      unitId,
      revenueChange,
      marginPercentage: currentWeek.marginPercentage,
      alertsCount: weekAlertsFiltered.length,
      durationMs: response.durationMs,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro ao gerar relatório semanal', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate weekly report',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

/**
 * Calcula o número da semana do ano
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

