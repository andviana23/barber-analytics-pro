/**
 * @fileoverview API Endpoint: KPIs Health
 * @module app/api/kpis/health
 * @description Endpoint para buscar KPIs de saúde financeira
 *
 * GET /api/kpis/health?unitId={id}&startDate={date}&endDate={date}&granularity={daily|weekly|monthly}
 *
 * Autenticação: Bearer JWT (Supabase Auth)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasUnitAccess } from '@/lib/auth/apiAuth';
import { aiMetricsRepository } from '@/lib/repositories/aiMetricsRepository';
import { alertsRepository } from '@/lib/repositories/alertsRepository';
import { logger } from '@/lib/logger';
import { getFromCache, setToCache } from '@/lib/cache';
import { rateLimitMiddleware, defaultRateLimit } from '@/lib/middleware/rateLimit';

/**
 * Tipo de granularidade para agregação
 */
type Granularity = 'daily' | 'weekly' | 'monthly';

/**
 * Tipo de tendência
 */
type Trend = 'INCREASING' | 'DECREASING' | 'STABLE';

/**
 * Interface para resposta de KPIs
 */
interface KPIsHealthResponse {
  grossRevenue: number;
  totalExpenses: number;
  marginPercentage: number;
  averageTicket: number;
  trend: Trend;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  period: {
    startDate: string;
    endDate: string;
    granularity: Granularity;
  };
}

/**
 * Calcula tendência comparando período atual com anterior
 */
function calculateTrend(
  currentRevenue: number,
  previousRevenue: number
): Trend {
  if (previousRevenue === 0) {
    return currentRevenue > 0 ? 'INCREASING' : 'STABLE';
  }

  const growthPercentage = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  // Considera estável se variação < 5%
  if (Math.abs(growthPercentage) < 5) {
    return 'STABLE';
  }

  return growthPercentage > 0 ? 'INCREASING' : 'DECREASING';
}

/**
 * Agrega métricas por granularidade
 */
function aggregateMetrics(
  metrics: Array<{
    gross_revenue: number;
    total_expenses: number;
    margin_percentage: number;
    average_ticket: number;
    revenues_count: number;
    date: string;
  }>,
  granularity: Granularity
): {
  grossRevenue: number;
  totalExpenses: number;
  marginPercentage: number;
  averageTicket: number;
} {
  const totalRevenue = metrics.reduce(
    (sum, m) => sum + (m.gross_revenue || 0),
    0
  );
  const totalExpenses = metrics.reduce(
    (sum, m) => sum + (m.total_expenses || 0),
    0
  );
  const totalTransactions = metrics.reduce(
    (sum, m) => sum + (m.revenues_count || 0),
    0
  );

  const marginPercentage =
    totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
  const averageTicket =
    totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return {
    grossRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    marginPercentage: Math.round(marginPercentage * 100) / 100,
    averageTicket: Math.round(averageTicket * 100) / 100,
  };
}

/**
 * GET /api/kpis/health
 *
 * Retorna KPIs de saúde financeira para uma unidade
 *
 * Query Parameters:
 * - unitId (obrigatório) - ID da unidade
 * - startDate (opcional) - Data inicial (YYYY-MM-DD, padrão: 30 dias atrás)
 * - endDate (opcional) - Data final (YYYY-MM-DD, padrão: hoje)
 * - granularity (opcional) - Granularidade: daily, weekly, monthly (padrão: daily)
 *
 * @param request - Next.js request object
 * @returns JSON com KPIs de saúde financeira
 */
export async function GET(request: NextRequest) {
  const correlationId = `kpis-health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('KPIs de saúde financeira solicitados', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 0. Verificar rate limit (100 req/min por IP)
  const rateLimitError = rateLimitMiddleware(request, defaultRateLimit);
  if (rateLimitError) {
    return rateLimitError;
  }

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
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const granularityParam = searchParams.get('granularity') || 'daily';

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

    // 4. Validar granularity
    const granularity = granularityParam as Granularity;
    if (!['daily', 'weekly', 'monthly'].includes(granularity)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'granularity must be daily, weekly, or monthly',
          correlationId,
        },
        { status: 400 }
      );
    }

    // 5. Calcular datas padrão se não fornecidas
    const endDate = endDateParam
      ? new Date(endDateParam)
      : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() - 30);
          return date;
        })();

    if (startDate > endDate) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'startDate must be before endDate',
          correlationId,
        },
        { status: 400 }
      );
    }

    logger.info('Parâmetros validados', {
      correlationId,
      userId: authResult.userId,
      unitId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      granularity,
    });

    // 6. Verificar cache (TTL: 5 minutos = 300 segundos)
    const cacheKey = `kpis-health-${unitId}-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}-${granularity}`;
    const cachedResult = await getFromCache<KPIsHealthResponse>(cacheKey, 300);

    if (cachedResult) {
      logger.info('KPIs retornados do cache', {
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

    // 7. Buscar métricas do período atual
    const { data: currentMetrics, error: metricsError } =
      await aiMetricsRepository.findByPeriod(unitId, startDate, endDate);

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

    if (!currentMetrics || currentMetrics.length === 0) {
      logger.warn('Nenhuma métrica encontrada para o período', {
        correlationId,
        unitId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      return NextResponse.json({
        grossRevenue: 0,
        totalExpenses: 0,
        marginPercentage: 0,
        averageTicket: 0,
        trend: 'STABLE' as Trend,
        alerts: [],
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          granularity,
        },
        cached: false,
        correlationId,
        durationMs: Date.now() - startTime,
      });
    }

    // 8. Agregar métricas
    const aggregated = aggregateMetrics(currentMetrics, granularity);

    // 9. Calcular tendência comparando com período anterior
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate);

    const { data: previousMetrics } = await aiMetricsRepository.findByPeriod(
      unitId,
      previousStartDate,
      previousEndDate
    );

    const previousRevenue = previousMetrics
      ? previousMetrics.reduce((sum, m) => sum + (m.gross_revenue || 0), 0)
      : 0;
    const trend = calculateTrend(aggregated.grossRevenue, previousRevenue);

    // 10. Buscar alertas abertos da unidade
    const { data: openAlerts } = await alertsRepository.findByUnit(
      unitId,
      'OPEN',
      10
    );

    const alerts = (openAlerts || []).map(alert => ({
      type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
    }));

    // 11. Preparar resposta
    const response: KPIsHealthResponse = {
      grossRevenue: aggregated.grossRevenue,
      totalExpenses: aggregated.totalExpenses,
      marginPercentage: aggregated.marginPercentage,
      averageTicket: aggregated.averageTicket,
      trend,
      alerts,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        granularity,
      },
    };

    // 12. Salvar no cache (TTL: 5 minutos = 300 segundos)
    await setToCache(cacheKey, response, 300);

    logger.info('KPIs calculados com sucesso', {
      correlationId,
      unitId,
      grossRevenue: aggregated.grossRevenue,
      marginPercentage: aggregated.marginPercentage,
      trend,
      alertsCount: alerts.length,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      ...response,
      cached: false,
      correlationId,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro ao buscar KPIs de saúde financeira', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Failed to fetch KPIs',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

