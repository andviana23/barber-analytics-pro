/**
 * @fileoverview Structured Logging Utilities
 * @module lib/logger
 * @description Logging estruturado com correlation IDs para facilitar debugging
 */

export interface LogContext {
  jobId?: string;
  unitId?: string;
  userId?: string;
  correlationId?: string;
  [key: string]: any;
}

class Logger {
  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      correlationId: context?.correlationId || this.generateCorrelationId()
    };
    return JSON.stringify(logEntry);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatLog('INFO', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatLog('ERROR', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('WARN', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();

