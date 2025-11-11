/**
 * @fileoverview API Endpoint: Forecasts Cashflow
 * @module app/api/forecasts/cashflow
 * @description Endpoint para gerar previsões de fluxo de caixa
 *
 * GET /api/forecasts/cashflow?unitId={id}&accountId={id}&days={30|60|90}
 *
 * Autenticação: Bearer JWT (Supabase Auth)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasUnitAccess } from '@/lib/auth/apiAuth';
import { generateCashflowForecast } from '@/lib/analytics/cashflowForecast';
import { logger } from '@/lib/logger';
import { getFromCache, setToCache } from '@/lib/cache';

/**
 * GET /api/forecasts/cashflow
 *
 * Gera previsões de fluxo de caixa para uma unidade
 *
 * Query Parameters:
 * - unitId (obrigatório) - ID da unidade
 * - accountId (opcional) - ID da conta bancária
 * - days (opcional) - Período de previsão: 30, 60 ou 90 dias (padrão: 30)
 *
 * @param request - Next.js request object
 * @returns JSON com previsões de fluxo de caixa
 */
export async function GET(request: NextRequest) {
  const correlationId = `forecast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Forecast de fluxo de caixa solicitado', {
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
    const accountId = searchParams.get('accountId');
    const daysParam = searchParams.get('days');

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

    // 4. Validar e parsear parâmetro days
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    if (![30, 60, 90].includes(days)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'days must be 30, 60, or 90',
          correlationId,
        },
        { status: 400 }
      );
    }

    logger.info('Parâmetros validados', {
      correlationId,
      userId: authResult.userId,
      unitId,
      accountId: accountId || 'all',
      days,
    });

    // 5. Verificar cache
    const cacheKey = `cashflow-forecast-${unitId}-${accountId || 'all'}-${days}`;
    const cachedResult = await getFromCache<{
      forecast: any;
      summary: any;
      cached: boolean;
    }>(cacheKey);

    if (cachedResult) {
      logger.info('Forecast retornado do cache', {
        correlationId,
        cacheKey,
      });

      return NextResponse.json({
        success: true,
        ...cachedResult,
        cached: true,
        correlationId,
        durationMs: Date.now() - startTime,
      });
    }

    // 6. Gerar forecast
    logger.info('Gerando forecast de fluxo de caixa', {
      correlationId,
      unitId,
      accountId: accountId || null,
      days,
    });

    const forecastResult = await generateCashflowForecast(
      unitId,
      accountId || null,
      90 // Usar 90 dias históricos para melhor precisão
    );

    if (!forecastResult) {
      logger.warn('Nenhum dado histórico encontrado para forecast', {
        correlationId,
        unitId,
        accountId: accountId || null,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'No historical data available',
          message: 'Insufficient historical data to generate forecast',
          correlationId,
          durationMs: Date.now() - startTime,
        },
        { status: 404 }
      );
    }

    // 7. Filtrar forecast pelo período solicitado
    const filteredForecast = forecastResult.forecast.slice(0, days);

    // 8. Preparar resposta
    const response = {
      success: true,
      unitId,
      accountId: accountId || null,
      period: days,
      historical: {
        count: forecastResult.historical.length,
        startDate: forecastResult.historical[0]?.date,
        endDate: forecastResult.historical[forecastResult.historical.length - 1]?.date,
      },
      forecast: filteredForecast.map(f => ({
        date: f.date.toISOString().split('T')[0],
        forecastedBalance: f.forecasted_balance,
        confidenceInterval: f.confidence_interval,
        trend: f.trend,
      })),
      summary: {
        currentBalance: forecastResult.summary.current_balance,
        forecastedBalance30d: days >= 30 ? filteredForecast[29]?.forecasted_balance : null,
        forecastedBalance60d: days >= 60 ? filteredForecast[59]?.forecasted_balance : null,
        forecastedBalance90d: days >= 90 ? filteredForecast[89]?.forecasted_balance : null,
        trend: forecastResult.summary.trend,
      },
      cached: false,
      correlationId,
      durationMs: Date.now() - startTime,
    };

    // 9. Salvar no cache (TTL: 1 hora)
    await setToCache(cacheKey, {
      forecast: response.forecast,
      summary: response.summary,
      cached: true,
    }, 3600);

    logger.info('Forecast gerado com sucesso', {
      correlationId,
      unitId,
      forecastCount: filteredForecast.length,
      durationMs: response.durationMs,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro ao gerar forecast de fluxo de caixa', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error.message || 'Failed to generate forecast',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

