/**
 * @fileoverview OpenAI Client Configuration
 * @module lib/ai/openai
 * @description Cliente OpenAI com circuit breaker, retry e monitoramento de custos
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.1
 */

import OpenAI from 'openai';
import { openaiCircuitBreaker } from '../circuitBreaker';
import { retryWithBackoff } from '../retry';
import { logger } from '../logger';
import { trackOpenAICost } from '../monitoring';

let _openai: OpenAI | null = null;

/**
 * Getter lazy para OpenAI client - cria apenas quando necessário
 * Permite que variáveis de ambiente sejam carregadas antes da criação
 */
function getOpenAI(): OpenAI {
  if (_openai) {
    return _openai;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY deve estar configurado');
  }

  _openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return _openai;
}

/**
 * Cliente OpenAI configurado (proxy para lazy loading)
 */
export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    return getOpenAI()[prop as keyof OpenAI];
  },
});

/**
 * Modelo padrão e fallback
 */
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const FALLBACK_MODEL = process.env.OPENAI_MODEL_FALLBACK || 'gpt-3.5-turbo';
const MAX_TOKENS = parseInt(
  process.env.OPENAI_MAX_TOKENS_PER_REQUEST || '2000',
  10
);

/**
 * Preços por token (USD) - atualizados para modelos atuais
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 }, // $0.15/$0.60 por 1M tokens
  'gpt-3.5-turbo': { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 }, // $0.50/$1.50 por 1M tokens
  'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 }, // $2.50/$10 por 1M tokens
};

/**
 * Calcula custo de uma requisição OpenAI
 */
function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model] || PRICING['gpt-4o-mini'];
  return inputTokens * pricing.input + outputTokens * pricing.output;
}

/**
 * Interface para opções de chamada OpenAI
 */
export interface OpenAICallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  unitId?: string; // Para rastreamento de custos
}

/**
 * Chama OpenAI com circuit breaker, retry e monitoramento
 *
 * @param messages - Mensagens para o chat
 * @param options - Opções da chamada
 * @returns Resposta do OpenAI
 */
export async function callOpenAI(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: OpenAICallOptions = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const model = options.model || DEFAULT_MODEL;
  const unitId = options.unitId || 'system';

  return openaiCircuitBreaker.execute(async () => {
    return retryWithBackoff(
      async () => {
        const startTime = Date.now();

        try {
          const response = await openai.chat.completions.create({
            model,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || MAX_TOKENS,
          });

          const durationMs = Date.now() - startTime;

          // Calcular custos
          const inputTokens = response.usage?.prompt_tokens || 0;
          const outputTokens = response.usage?.completion_tokens || 0;
          const totalTokens = response.usage?.total_tokens || 0;
          const cost = calculateCost(model, inputTokens, outputTokens);

          // Registrar custo
          await trackOpenAICost(unitId, totalTokens, model, cost);

          logger.info('Chamada OpenAI bem-sucedida', {
            model,
            unitId,
            inputTokens,
            outputTokens,
            totalTokens,
            cost: cost.toFixed(6),
            durationMs,
          });

          return response;
        } catch (error: any) {
          const durationMs = Date.now() - startTime;

          logger.error('Erro na chamada OpenAI', {
            model,
            unitId,
            error: error.message,
            status: error.status,
            durationMs,
          });

          // Tentar fallback se erro não for 4xx
          if (error.status >= 400 && error.status < 500) {
            throw error; // Não tentar fallback para erros 4xx
          }

          // Tentar com modelo fallback
          if (model !== FALLBACK_MODEL) {
            logger.warn('Tentando com modelo fallback', {
              originalModel: model,
              fallbackModel: FALLBACK_MODEL,
            });

            return openai.chat.completions.create({
              model: FALLBACK_MODEL,
              messages,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.maxTokens || MAX_TOKENS,
            });
          }

          throw error;
        }
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        retryableErrors: [
          'ECONNRESET',
          'ETIMEDOUT',
          'ENOTFOUND',
          'ECONNREFUSED',
        ],
      }
    );
  });
}

/**
 * Testa conexão com OpenAI
 *
 * @returns true se conexão bem-sucedida
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await callOpenAI(
      [
        {
          role: 'user',
          content: 'Teste de conexão. Responda apenas "OK".',
        },
      ],
      {
        model: DEFAULT_MODEL,
        maxTokens: 10,
        unitId: 'system',
      }
    );

    return true;
  } catch (error) {
    logger.error('Teste de conexão OpenAI falhou', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}
