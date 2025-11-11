/**
 * @fileoverview Rate Limiting Middleware
 * @module lib/middleware/rateLimit
 * @description Implementa rate limiting para rotas API
 *
 * Limites:
 * - 100 req/min por IP
 * - 10 req/hora por usuário (para rotas que requerem autenticação)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.5.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

/**
 * Armazenamento em memória para rate limiting
 * Em produção, usar Redis ou similar
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Opções de rate limiting
 */
export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Número máximo de requisições
  identifier?: string; // Identificador customizado (ex: userId)
}

/**
 * Resultado da verificação de rate limit
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Verifica rate limit para uma requisição
 *
 * @param request - Next.js request object
 * @param options - Opções de rate limiting
 * @returns Resultado da verificação
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): RateLimitResult {
  cleanupExpiredEntries();

  // Identificar requisição (IP ou userId)
  const identifier = options.identifier || getClientIP(request);
  const key = `${identifier}:${options.windowMs}`;

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Nova janela de tempo
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    };
  }

  if (entry.count >= options.maxRequests) {
    // Rate limit excedido
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  // Incrementar contador
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware de rate limiting para rotas API
 *
 * @param request - Next.js request object
 * @param options - Opções de rate limiting
 * @returns NextResponse com headers de rate limit ou null se permitido
 */
export function rateLimitMiddleware(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(request, options);

  if (!result.allowed) {
    logger.warn('Rate limit excedido', {
      identifier: options.identifier || getClientIP(request),
      retryAfter: result.retryAfter,
    });

    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(options.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  // Adicionar headers de rate limit na resposta
  return null; // null indica que a requisição pode prosseguir
}

/**
 * Obtém IP do cliente da requisição
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return request.ip || 'unknown';
}

/**
 * Rate limit padrão: 100 req/min por IP
 */
export const defaultRateLimit = {
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100,
};

/**
 * Rate limit para Telegram: 10 req/hora por usuário
 */
export const telegramRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
};
