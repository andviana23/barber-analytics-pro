/**
 * @fileoverview Monitoring and Cost Tracking
 * @module lib/monitoring
 * @description Monitoramento de custos OpenAI e métricas do sistema
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.4
 */

import { supabaseAdmin as supabase } from './supabaseAdmin';
import { logger } from './logger';

export interface CostTracking {
  date: string;
  unitId: string;
  tokensUsed: number;
  costUSD: number;
  model: string;
}

/**
 * Registra o custo de uma chamada OpenAI
 *
 * @param unitId - ID da unidade
 * @param tokensUsed - Número total de tokens usados
 * @param model - Modelo OpenAI usado
 * @param costUSD - Custo em USD
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.4.1
 */
export async function trackOpenAICost(
  unitId: string,
  tokensUsed: number,
  model: string,
  costUSD: number
): Promise<void> {
  const correlationId = `cost-tracking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { data, error } = await supabase.from('openai_cost_tracking').insert({
      unit_id: unitId,
      date: new Date().toISOString().split('T')[0],
      tokens_used: tokensUsed,
      cost_usd: costUSD.toFixed(8), // Precisão de 8 casas decimais
      model,
    });

    if (error) {
      logger.error('Erro ao registrar custo OpenAI', {
        correlationId,
        unitId,
        tokensUsed,
        model,
        costUSD,
        error: error.message,
      });
      throw error;
    }

    logger.info('Custo OpenAI registrado com sucesso', {
      correlationId,
      unitId,
      tokensUsed,
      model,
      costUSD: costUSD.toFixed(6),
    });
  } catch (error: any) {
    logger.error('Erro ao registrar custo OpenAI', {
      correlationId,
      unitId,
      tokensUsed,
      model,
      costUSD,
      error: error.message || 'Unknown error',
      stack: error.stack,
    });
    // Não lançar erro para não quebrar o fluxo principal
    // O custo será perdido, mas a análise continuará
  }
}

/**
 * Calcula o custo total do mês atual
 */
export async function getMonthlyOpenAICost(): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('openai_cost_tracking')
      .select('cost_usd')
      .gte('date', startOfMonth.toISOString().split('T')[0]);

    if (error) {
      logger.error('Erro ao buscar custos mensais', {
        error: error.message,
        startDate: startOfMonth.toISOString().split('T')[0],
      });
      return 0;
    }

    const total =
      data?.reduce(
        (sum, record) => sum + parseFloat(record.cost_usd || '0'),
        0
      ) || 0;

    logger.debug('Custo mensal calculado', {
      total: total.toFixed(2),
      records: data?.length || 0,
      startDate: startOfMonth.toISOString().split('T')[0],
    });

    return total;
  } catch (error: any) {
    logger.error('Erro ao calcular custo mensal', {
      error: error.message || 'Unknown error',
      stack: error.stack,
    });
    return 0;
  }
}

/**
 * Verifica se o custo está próximo do limite e envia alerta se necessário
 *
 * Envia alerta via Telegram quando custo >= 80% do threshold
 *
 * @returns Objeto com informações sobre o status do custo
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.4.2
 */
export async function checkCostThreshold(): Promise<{
  exceeded: boolean;
  current: number;
  threshold: number;
  percentage: number;
  alertSent: boolean;
}> {
  const correlationId = `cost-threshold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const threshold = parseFloat(
    process.env.OPENAI_COST_ALERT_THRESHOLD || '100'
  );
  const current = await getMonthlyOpenAICost();
  const percentage = (current / threshold) * 100;
  let alertSent = false;

  logger.info('Verificando threshold de custo OpenAI', {
    correlationId,
    current: current.toFixed(2),
    threshold,
    percentage: percentage.toFixed(1),
  });

  if (current >= threshold * 0.8) {
    // Enviar alerta via Telegram (se disponível)
    try {
      const { sendTelegramAlert } = await import('./telegram');
      const severity = current >= threshold ? 'CRITICAL' : 'HIGH';
      const alertMessage =
        current >= threshold
          ? `Custo OpenAI EXCEDEU o limite: $${current.toFixed(2)} / $${threshold}`
          : `Custo OpenAI próximo do limite: $${current.toFixed(2)} / $${threshold} (${percentage.toFixed(1)}%)`;

      await sendTelegramAlert({
        message: alertMessage,
        severity,
        metadata: {
          'Custo Atual': `$${current.toFixed(2)}`,
          Limite: `$${threshold}`,
          Percentual: `${percentage.toFixed(1)}%`,
          Status: current >= threshold ? 'EXCEDIDO' : 'PRÓXIMO DO LIMITE',
        },
      });

      alertSent = true;

      logger.warn('Alerta de custo OpenAI enviado', {
        correlationId,
        current: current.toFixed(2),
        threshold,
        percentage: percentage.toFixed(1),
        exceeded: current >= threshold,
        severity,
      });
    } catch (error: any) {
      logger.error('Erro ao enviar alerta de custo via Telegram', {
        correlationId,
        current: current.toFixed(2),
        threshold,
        error: error.message || 'Unknown error',
      });
      // Não lançar erro, apenas logar
    }
  }

  return {
    exceeded: current >= threshold,
    current,
    threshold,
    percentage,
    alertSent,
  };
}

/**
 * Calcula economia gerada pelo cache
 */
export async function calculateCacheSavings(): Promise<number> {
  try {
    // Estimar custo médio por análise
    const avgCostPerAnalysis = 0.05; // $0.05 por análise (estimativa)

    // Buscar número de entradas no cache (cada entrada = 1 análise economizada)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data, error } = await supabase
      .from('openai_cache')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      logger.error('Erro ao buscar entradas do cache', {
        error: error.message,
        startDate: thirtyDaysAgo.toISOString(),
      });
      return 0;
    }

    const cacheHits = data?.length || 0;
    const savings = cacheHits * avgCostPerAnalysis;

    logger.debug('Economia do cache calculada', {
      cacheHits,
      avgCostPerAnalysis,
      savings: savings.toFixed(2),
      period: '30 dias',
    });

    return savings;
  } catch (error: any) {
    logger.error('Erro ao calcular economia do cache', {
      error: error.message || 'Unknown error',
      stack: error.stack,
    });
    return 0;
  }
}

/**
 * Busca estatísticas de custo por unidade
 */
export async function getCostByUnit(
  startDate: string,
  endDate: string
): Promise<Array<{ unitId: string; totalCost: number; requests: number }>> {
  try {
    const { data, error } = await supabase
      .from('openai_cost_tracking')
      .select('unit_id, cost_usd')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      logger.error('Erro ao buscar custos por unidade', {
        error: error.message,
        startDate,
        endDate,
      });
      return [];
    }

    if (!data || data.length === 0) {
      logger.debug('Nenhum custo encontrado no período', {
        startDate,
        endDate,
      });
      return [];
    }

    const costsByUnit = data.reduce(
      (acc, record) => {
        const unitId = record.unit_id;
        if (!acc[unitId]) {
          acc[unitId] = { unitId, totalCost: 0, requests: 0 };
        }
        acc[unitId].totalCost += parseFloat(record.cost_usd || '0');
        acc[unitId].requests += 1;
        return acc;
      },
      {} as Record<
        string,
        { unitId: string; totalCost: number; requests: number }
      >
    );

    const result = Object.values(costsByUnit);

    logger.debug('Custos por unidade calculados', {
      units: result.length,
      totalRecords: data.length,
      startDate,
      endDate,
    });

    return result;
  } catch (error: any) {
    logger.error('Erro ao buscar custos por unidade', {
      error: error.message || 'Unknown error',
      stack: error.stack,
      startDate,
      endDate,
    });
    return [];
  }
}
