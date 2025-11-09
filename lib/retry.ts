/**
 * @fileoverview Retry Utilities with Exponential Backoff
 * @module lib/retry
 * @description Implementa retry com backoff exponencial para operações que podem falhar temporariamente
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executa uma função com retry e backoff exponencial
 * @param fn Função assíncrona a ser executada
 * @param options Opções de retry
 * @returns Resultado da função
 * @throws Último erro se todas as tentativas falharem
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
    onRetry
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Verificar se o erro é retryable
      const isRetryable =
        retryableErrors.some(code =>
          error.code === code || error.message?.includes(code)
        ) ||
        (error.status >= 500 && error.status < 600) || // Erros 5xx
        error.type === 'system' || // Erros de sistema
        error.name === 'AbortError'; // Timeouts

      if (!isRetryable) {
        // Erro não é retryable, lançar imediatamente
        throw error;
      }

      if (attempt === maxAttempts) {
        // Última tentativa falhou
        throw error;
      }

      // Chamar callback de retry se fornecido
      if (onRetry) {
        onRetry(attempt, error);
      }

      // Aguardar antes de retry
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Retry failed: todas as tentativas falharam');
}

/**
 * Wrapper para retry com logging automático
 */
export async function retryWithLogging<T>(
  fn: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  return retryWithBackoff(fn, {
    ...options,
    onRetry: (attempt, error) => {
      console.warn(`[${context}] Tentativa ${attempt} falhou:`, error.message);
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    }
  });
}

