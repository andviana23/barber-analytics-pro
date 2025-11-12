/**
 * @fileoverview Cashflow Forecast Utilities
 * @module lib/analytics/cashflowForecast
 * @description Funções específicas para previsão de fluxo de caixa
 *
 * Integra com:
 * - calculateAccumulatedBalance() para calcular saldo acumulado
 * - forecastCashflow() para gerar previsões futuras
 * - vw_demonstrativo_fluxo para validar cálculos
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.2.3 e 3.2.4
 */

import { calculateAccumulatedBalance, forecastCashflow } from './calculations';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Interface para dados de fluxo de caixa diário
 */
export interface DailyCashflowData {
  date: Date | string;
  unit_id: string;
  account_id?: string;
  entradas: number;
  saidas: number;
  saldo_dia?: number;
  saldo_acumulado?: number;
}

/**
 * Interface para resultado de forecast
 */
export interface CashflowForecastResult {
  historical: DailyCashflowData[];
  forecast: Array<{
    date: Date;
    forecasted_balance: number;
    confidence_interval: { lower: number; upper: number };
    trend: 'up' | 'down' | 'stable';
  }>;
  summary: {
    current_balance: number;
    forecasted_balance_30d: number;
    forecasted_balance_60d: number;
    forecasted_balance_90d: number;
    trend: 'up' | 'down' | 'stable';
  };
}

/**
 * Busca dados históricos de fluxo de caixa da VIEW vw_demonstrativo_fluxo
 *
 * @param unitId - ID da unidade
 * @param accountId - ID da conta bancária (opcional)
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Dados históricos com saldo acumulado
 */
export async function fetchHistoricalCashflow(
  unitId: string,
  accountId: string | null,
  startDate: Date | string,
  endDate: Date | string
): Promise<DailyCashflowData[]> {
  try {
    const startDateStr =
      typeof startDate === 'string'
        ? startDate
        : startDate.toISOString().split('T')[0];
    const endDateStr =
      typeof endDate === 'string'
        ? endDate
        : endDate.toISOString().split('T')[0];

    let query = supabase
      .from('vw_demonstrativo_fluxo')
      .select('*')
      .eq('unit_id', unitId)
      .gte('transaction_date', startDateStr)
      .lte('transaction_date', endDateStr)
      .order('transaction_date', { ascending: true });

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar histórico de fluxo de caixa', {
        unitId,
        accountId,
        error: error.message,
      });
      throw error;
    }

    return (data || []).map(item => ({
      date: item.transaction_date,
      unit_id: item.unit_id,
      account_id: item.account_id,
      entradas: parseFloat(item.entradas || 0),
      saidas: parseFloat(item.saidas || 0),
      saldo_dia: parseFloat(item.saldo_dia || 0),
      saldo_acumulado: parseFloat(item.saldo_acumulado || 0),
    }));
  } catch (error) {
    logger.error('Exceção ao buscar histórico de fluxo de caixa', {
      unitId,
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Calcula saldo acumulado usando função de cálculo (valida contra VIEW)
 *
 * @param dailyData - Dados diários de entradas e saídas
 * @param groupBy - Campo para agrupar ('unit_id' ou 'account_id')
 * @returns Dados com saldo acumulado calculado
 */
export function calculateAccumulatedBalanceFromData(
  dailyData: Array<{
    date: Date | string;
    entradas: number;
    saidas: number;
    unit_id?: string;
    account_id?: string;
  }>,
  groupBy: 'unit_id' | 'account_id' = 'unit_id'
): DailyCashflowData[] {
  return calculateAccumulatedBalance(dailyData, groupBy) as DailyCashflowData[];
}

/**
 * Gera forecast completo de fluxo de caixa (30/60/90 dias)
 *
 * Combina histórico + previsões usando média móvel de 30 dias + tendência linear.
 *
 * @param unitId - ID da unidade
 * @param accountId - ID da conta bancária (opcional)
 * @param historicalDays - Número de dias históricos para usar (padrão: 90)
 * @returns Forecast completo com histórico e previsões
 */
export async function generateCashflowForecast(
  unitId: string,
  accountId: string | null = null,
  historicalDays: number = 90
): Promise<CashflowForecastResult | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - historicalDays);

    logger.info('Gerando forecast de fluxo de caixa', {
      unitId,
      accountId,
      historicalDays,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // 1. Buscar histórico da VIEW
    const historical = await fetchHistoricalCashflow(
      unitId,
      accountId,
      startDate,
      endDate
    );

    if (historical.length === 0) {
      logger.warn('Nenhum dado histórico encontrado para forecast', {
        unitId,
        accountId,
      });
      return null;
    }

    // 2. Preparar dados para forecast (usar saldo acumulado)
    const balanceHistory = historical.map(item => ({
      date: item.date,
      balance: item.saldo_acumulado || 0,
    }));

    // 3. Gerar previsões para 30, 60 e 90 dias
    const forecast30 = forecastCashflow(balanceHistory, 30);
    const forecast60 = forecastCashflow(balanceHistory, 60);
    const forecast90 = forecastCashflow(balanceHistory, 90);

    // 4. Calcular resumo
    const currentBalance =
      balanceHistory[balanceHistory.length - 1]?.balance || 0;
    const forecastedBalance30d =
      forecast30[forecast30.length - 1]?.forecasted_balance || currentBalance;
    const forecastedBalance60d =
      forecast60[forecast60.length - 1]?.forecasted_balance || currentBalance;
    const forecastedBalance90d =
      forecast90[forecast90.length - 1]?.forecasted_balance || currentBalance;

    // Determinar tendência geral (baseado na última previsão)
    const overallTrend = forecast90[forecast90.length - 1]?.trend || 'stable';

    logger.info('Forecast de fluxo de caixa gerado com sucesso', {
      unitId,
      accountId,
      currentBalance,
      forecastedBalance30d,
      forecastedBalance60d,
      forecastedBalance90d,
      trend: overallTrend,
    });

    return {
      historical,
      forecast: forecast90, // Retornar previsão completa de 90 dias
      summary: {
        current_balance: Math.round(currentBalance * 100) / 100,
        forecasted_balance_30d: Math.round(forecastedBalance30d * 100) / 100,
        forecasted_balance_60d: Math.round(forecastedBalance60d * 100) / 100,
        forecasted_balance_90d: Math.round(forecastedBalance90d * 100) / 100,
        trend: overallTrend,
      },
    };
  } catch (error) {
    logger.error('Erro ao gerar forecast de fluxo de caixa', {
      unitId,
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Valida se o cálculo de saldo acumulado bate com a VIEW vw_demonstrativo_fluxo
 *
 * @param unitId - ID da unidade
 * @param accountId - ID da conta bancária (opcional)
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Resultado da validação
 */
export async function validateAccumulatedBalance(
  unitId: string,
  accountId: string | null,
  startDate: Date | string,
  endDate: Date | string
): Promise<{ isValid: boolean; differences: number; maxDifference: number }> {
  try {
    // Buscar dados da VIEW
    const viewData = await fetchHistoricalCashflow(
      unitId,
      accountId,
      startDate,
      endDate
    );

    if (viewData.length === 0) {
      return { isValid: true, differences: 0, maxDifference: 0 };
    }

    // Calcular saldo acumulado usando função
    const calculatedData = calculateAccumulatedBalanceFromData(
      viewData.map(item => ({
        date: item.date,
        entradas: item.entradas,
        saidas: item.saidas,
        unit_id: item.unit_id,
        account_id: item.account_id,
      })),
      accountId ? 'account_id' : 'unit_id'
    );

    // Comparar resultados
    let differences = 0;
    let maxDifference = 0;

    viewData.forEach((viewItem, index) => {
      const calculatedItem = calculatedData[index];
      if (calculatedItem) {
        const viewBalance = viewItem.saldo_acumulado || 0;
        const calculatedBalance = calculatedItem.saldo_acumulado || 0;
        const difference = Math.abs(viewBalance - calculatedBalance);

        if (difference > 0.01) {
          // Tolerância de 1 centavo
          differences++;
          maxDifference = Math.max(maxDifference, difference);
        }
      }
    });

    const isValid = differences === 0;

    logger.info('Validação de saldo acumulado concluída', {
      unitId,
      accountId,
      isValid,
      differences,
      maxDifference,
      totalRecords: viewData.length,
    });

    return { isValid, differences, maxDifference };
  } catch (error) {
    logger.error('Erro ao validar saldo acumulado', {
      unitId,
      accountId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { isValid: false, differences: -1, maxDifference: -1 };
  }
}
