/**
 * @fileoverview Análise com IA
 * @module lib/ai/analysis
 * @description Geração de insights financeiros usando OpenAI com cache e monitoramento
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.3
 */

import { callOpenAI, OpenAICallOptions } from './openai';
import {
  getWeeklyAnalysisPrompt,
  getAlertPrompt,
  getWhatIfPrompt,
  getMonthlyExecutiveSummary,
  type WeeklyMetrics,
  type MonthlyMetrics,
  type AlertType,
} from './prompts';
import {
  getCachedAnalysis,
  setCachedAnalysis,
  generateCacheKey,
} from '../cache';
import { logger } from '../logger';
import { anonymizeMetrics } from './anonymization';

/**
 * Tipo de prompt disponível
 */
export type PromptType = 'WEEKLY' | 'ALERT' | 'WHAT_IF' | 'MONTHLY_EXECUTIVE';

/**
 * Interface para resultado de análise
 */
export interface AnalysisResult {
  content: string;
  parsed?: any; // JSON parseado se disponível
  cached: boolean;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Gera análise usando OpenAI com cache e circuit breaker
 *
 * @param unitId - ID da unidade
 * @param metrics - Métricas a analisar
 * @param promptType - Tipo de prompt a usar
 * @param options - Opções adicionais (scenario para WHAT_IF, alertType para ALERT)
 * @returns Resultado da análise
 */
export async function generateAnalysis(
  unitId: string,
  metrics: WeeklyMetrics | MonthlyMetrics,
  promptType: PromptType,
  options: {
    scenario?: string; // Para WHAT_IF
    alertType?: AlertType; // Para ALERT
    alertData?: Record<string, any>; // Para ALERT
  } = {}
): Promise<AnalysisResult> {
  const correlationId = `analysis-${unitId}-${Date.now()}`;
  const startTime = Date.now();

  logger.info('Gerando análise com IA', {
    correlationId,
    unitId,
    promptType,
  });

  try {
    // 1. Anonimizar métricas (remover PII)
    const anonymizedMetrics = anonymizeMetrics(metrics);

    // 2. Gerar chave de cache
    const cacheKey = generateCacheKey(unitId, {
      ...anonymizedMetrics,
      promptType,
      scenario: options.scenario,
      alertType: options.alertType,
    });

    // 3. Verificar cache (TTL: 24 horas)
    const cachedAnalysis = await getCachedAnalysis(cacheKey, { ttl: 86400 });

    if (cachedAnalysis) {
      logger.info('Análise retornada do cache', {
        correlationId,
        cacheKey,
      });

      try {
        const parsed = JSON.parse(cachedAnalysis);
        return {
          content: cachedAnalysis,
          parsed,
          cached: true,
        };
      } catch {
        return {
          content: cachedAnalysis,
          cached: true,
        };
      }
    }

    // 4. Gerar prompt baseado no tipo
    let messages: any[];

    switch (promptType) {
      case 'WEEKLY':
        messages = getWeeklyAnalysisPrompt(anonymizedMetrics as WeeklyMetrics);
        break;
      case 'ALERT':
        if (!options.alertType) {
          throw new Error('alertType é obrigatório para prompt ALERT');
        }
        messages = getAlertPrompt(
          options.alertType,
          anonymizedMetrics,
          options.alertData
        );
        break;
      case 'WHAT_IF':
        if (!options.scenario) {
          throw new Error('scenario é obrigatório para prompt WHAT_IF');
        }
        messages = getWhatIfPrompt(options.scenario, anonymizedMetrics);
        break;
      case 'MONTHLY_EXECUTIVE':
        messages = getMonthlyExecutiveSummary(
          anonymizedMetrics as MonthlyMetrics
        );
        break;
      default:
        throw new Error(`Tipo de prompt inválido: ${promptType}`);
    }

    // 5. Chamar OpenAI com circuit breaker e retry
    const response = await callOpenAI(messages, {
      unitId,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: parseInt(
        process.env.OPENAI_MAX_TOKENS_PER_REQUEST || '2000',
        10
      ),
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    // 6. Tentar parsear JSON se possível
    let parsed: any = null;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      logger.warn('Não foi possível parsear JSON da resposta', {
        correlationId,
        error:
          parseError instanceof Error ? parseError.message : 'Unknown error',
      });
    }

    // 7. Salvar no cache
    await setCachedAnalysis(cacheKey, content, { ttl: 86400 });

    const durationMs = Date.now() - startTime;

    logger.info('Análise gerada com sucesso', {
      correlationId,
      unitId,
      promptType,
      tokensUsed,
      cached: false,
      durationMs,
    });

    return {
      content,
      parsed,
      cached: false,
      tokensUsed,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro ao gerar análise', {
      correlationId,
      unitId,
      promptType,
      error: error.message,
      durationMs,
    });

    throw error;
  }
}
