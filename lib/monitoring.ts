/**
 * @fileoverview Monitoring and Cost Tracking
 * @module lib/monitoring
 * @description Monitoramento de custos OpenAI e métricas do sistema
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CostTracking {
  date: string;
  unitId: string;
  tokensUsed: number;
  costUSD: number;
  model: string;
}

/**
 * Registra o custo de uma chamada OpenAI
 */
export async function trackOpenAICost(
  unitId: string,
  tokensUsed: number,
  model: string,
  costUSD: number
): Promise<void> {
  try {
    await supabase.from('openai_cost_tracking').insert({
      unit_id: unitId,
      date: new Date().toISOString().split('T')[0],
      tokens_used: tokensUsed,
      cost_usd: costUSD,
      model
    });
  } catch (error) {
    console.error('Erro ao registrar custo OpenAI:', error);
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
      console.error('Erro ao buscar custos:', error);
      return 0;
    }

    return (
      data?.reduce((sum, record) => sum + parseFloat(record.cost_usd || '0'), 0) ||
      0
    );
  } catch (error) {
    console.error('Erro ao calcular custo mensal:', error);
    return 0;
  }
}

/**
 * Verifica se o custo está próximo do limite e envia alerta se necessário
 */
export async function checkCostThreshold(): Promise<{
  exceeded: boolean;
  current: number;
  threshold: number;
}> {
  const threshold = parseFloat(process.env.OPENAI_COST_ALERT_THRESHOLD || '100');
  const current = await getMonthlyOpenAICost();

  if (current >= threshold * 0.8) {
    // Enviar alerta via Telegram (se disponível)
    try {
      const { sendTelegramAlert } = await import('./telegram');
      await sendTelegramAlert({
        message: `⚠️ Custo OpenAI próximo do limite: $${current.toFixed(2)} / $${threshold}`,
        current,
        threshold
      });
    } catch (error) {
      console.error('Erro ao enviar alerta de custo:', error);
    }
  }

  return {
    exceeded: current >= threshold,
    current,
    threshold
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
    const { data } = await supabase
      .from('openai_cache')
      .select('id')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const cacheHits = data?.length || 0;
    return cacheHits * avgCostPerAnalysis;
  } catch (error) {
    console.error('Erro ao calcular economia do cache:', error);
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

    if (error || !data) {
      return [];
    }

    const costsByUnit = data.reduce((acc, record) => {
      const unitId = record.unit_id;
      if (!acc[unitId]) {
        acc[unitId] = { unitId, totalCost: 0, requests: 0 };
      }
      acc[unitId].totalCost += parseFloat(record.cost_usd || '0');
      acc[unitId].requests += 1;
      return acc;
    }, {} as Record<string, { unitId: string; totalCost: number; requests: number }>);

    return Object.values(costsByUnit);
  } catch (error) {
    console.error('Erro ao buscar custos por unidade:', error);
    return [];
  }
}

