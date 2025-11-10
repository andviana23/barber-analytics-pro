/**
 * @fileoverview Cache Layer for OpenAI Responses
 * @module lib/cache
 * @description Cache inteligente para análises OpenAI, reduzindo custos em até 60%
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CacheOptions {
  ttl?: number; // Time to live em segundos
  keyPrefix?: string;
}

/**
 * Gera uma chave de cache baseada nas métricas principais
 * Métricas similares (arredondadas) geram a mesma chave
 */
export function generateCacheKey(unitId: string, metrics: any): string {
  const keyData = {
    unitId,
    receitaBruta: Math.round((metrics.receitaBruta || 0) / 100) * 100, // Arredondar para similaridade
    despesasTotais: Math.round((metrics.despesasTotais || 0) / 100) * 100,
    margemPercentual: Math.round(metrics.margemPercentual || 0),
    period: metrics.period || 'daily',
    reportType: metrics.reportType || 'standard'
  };

  return `openai:${unitId}:${JSON.stringify(keyData)}`;
}

/**
 * Busca uma análise do cache
 * @param cacheKey Chave do cache
 * @param options Opções de cache
 * @returns Resposta em cache ou null se não encontrada/expirada
 */
export async function getCachedAnalysis(
  cacheKey: string,
  options: CacheOptions = {}
): Promise<string | null> {
  const { ttl = 86400 } = options; // 24 horas padrão

  try {
    const { data, error } = await supabase
      .from('openai_cache')
      .select('response, created_at')
      .eq('cache_key', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    const createdAt = new Date(data.created_at);
    const ageInSeconds = (Date.now() - createdAt.getTime()) / 1000;

    if (ageInSeconds > ttl) {
      // Cache expirado, remover
      await supabase.from('openai_cache').delete().eq('cache_key', cacheKey);
      return null;
    }

    return data.response;
  } catch (error) {
    console.error('Erro ao buscar cache:', error);
    return null;
  }
}

/**
 * Salva uma análise no cache
 * @param cacheKey Chave do cache
 * @param response Resposta da OpenAI
 * @param options Opções de cache
 */
export async function setCachedAnalysis(
  cacheKey: string,
  response: string,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const { error } = await supabase.from('openai_cache').upsert({
      cache_key: cacheKey,
      response,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Erro ao salvar cache:', error);
    }
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

/**
 * Limpa cache antigo (mais de 7 dias)
 */
export async function cleanupOldCache(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const { data, error } = await supabase
      .from('openai_cache')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Erro ao limpar cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return 0;
  }
}

/**
 * Calcula estatísticas de cache
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  hitRate: number; // Estimado
  oldestEntry: string | null;
  newestEntry: string | null;
}> {
  try {
    const { data } = await supabase
      .from('openai_cache')
      .select('created_at')
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      return {
        totalEntries: 0,
        hitRate: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }

    return {
      totalEntries: data.length,
      hitRate: 0, // Seria calculado com métricas de acesso
      oldestEntry: data[data.length - 1]?.created_at || null,
      newestEntry: data[0]?.created_at || null
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas de cache:', error);
    return {
      totalEntries: 0,
      hitRate: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

/**
 * Cache genérico para qualquer tipo de dado
 * Usa a tabela openai_cache com chaves prefixadas
 */

/**
 * Busca um valor do cache genérico
 * @param cacheKey Chave do cache
 * @param ttl Time to live em segundos (padrão: 300 = 5 minutos)
 * @returns Valor em cache ou null se não encontrado/expirado
 */
export async function getFromCache<T>(cacheKey: string, ttl: number = 300): Promise<T | null> {
  try {
    const prefixedKey = `generic:${cacheKey}`;
    const { data, error } = await supabase
      .from('openai_cache')
      .select('response, created_at')
      .eq('cache_key', prefixedKey)
      .single();

    if (error || !data) {
      return null;
    }

    const createdAt = new Date(data.created_at);
    const ageInSeconds = (Date.now() - createdAt.getTime()) / 1000;

    if (ageInSeconds > ttl) {
      // Cache expirado, remover
      await supabase.from('openai_cache').delete().eq('cache_key', prefixedKey);
      return null;
    }

    // Parsear JSON do cache
    try {
      return JSON.parse(data.response) as T;
    } catch (parseError) {
      console.error('Erro ao parsear cache:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cache genérico:', error);
    return null;
  }
}

/**
 * Salva um valor no cache genérico
 * @param cacheKey Chave do cache
 * @param value Valor a ser cacheado (será convertido para JSON)
 * @param ttl Time to live em segundos (padrão: 300 = 5 minutos)
 */
export async function setToCache<T>(cacheKey: string, value: T, ttl: number = 300): Promise<void> {
  try {
    const prefixedKey = `generic:${cacheKey}`;
    const jsonValue = JSON.stringify(value);

    const { error } = await supabase.from('openai_cache').upsert({
      cache_key: prefixedKey,
      response: jsonValue,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Erro ao salvar cache genérico:', error);
    }
  } catch (error) {
    console.error('Erro ao salvar cache genérico:', error);
  }
}


