/**
 * @fileoverview Circuit Breaker Pattern Implementation
 * @module lib/circuitBreaker
 * @description Protege contra falhas em cascata em APIs externas
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringWindow?: number;
  successThreshold?: number; // Para transição de HALF_OPEN para CLOSED
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;
  private failureHistory: number[] = []; // Timestamps das falhas

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minuto
      monitoringWindow: 300000, // 5 minutos
      successThreshold: 2, // 2 sucessos consecutivos para fechar
      ...options
    };
  }

  /**
   * Executa uma função protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] Transicionando para HALF_OPEN`);
      } else {
        const timeUntilReset = this.getTimeUntilReset();
        throw new Error(
          `Circuit breaker is OPEN. Tente novamente em ${Math.ceil(timeUntilReset / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.state = 'CLOSED';
        this.lastFailureTime = null;
        this.failureHistory = [];
        console.log(`[CircuitBreaker:${this.name}] Transicionando para CLOSED`);
      }
    } else if (this.state === 'CLOSED') {
      // Resetar contador de falhas em caso de sucesso
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.failureHistory.push(Date.now());

    // Limpar histórico antigo
    const cutoff = Date.now() - this.options.monitoringWindow!;
    this.failureHistory = this.failureHistory.filter(timestamp => timestamp > cutoff);

    // Verificar se deve abrir o circuit breaker
    if (
      this.failures >= this.options.failureThreshold! ||
      this.failureHistory.length >= this.options.failureThreshold!
    ) {
      if (this.state !== 'OPEN') {
        this.state = 'OPEN';
        console.error(
          `[CircuitBreaker:${this.name}] Circuit breaker ABERTO após ${this.failures} falhas`
        );
      }
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return timeSinceLastFailure >= this.options.resetTimeout!;
  }

  private getTimeUntilReset(): number {
    if (!this.lastFailureTime) {
      return 0;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    return Math.max(0, this.options.resetTimeout! - timeSinceLastFailure);
  }

  /**
   * Retorna o estado atual do circuit breaker
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Retorna estatísticas do circuit breaker
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successCount: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Reseta manualmente o circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.failureHistory = [];
    console.log(`[CircuitBreaker:${this.name}] Resetado manualmente`);
  }
}

// Instâncias singleton por serviço
export const openaiCircuitBreaker = new CircuitBreaker('OpenAI', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minuto
  successThreshold: 2
});

export const telegramCircuitBreaker = new CircuitBreaker('Telegram', {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 segundos
  successThreshold: 1
});


