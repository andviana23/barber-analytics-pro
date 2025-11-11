/**
 * @fileoverview Cron Secret Validation Helper
 * @module lib/middleware/cronAuth
 * @description Helper para validar CRON_SECRET em rotas cron
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.5.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

/**
 * Valida CRON_SECRET em requisições de rotas cron
 *
 * @param request - Next.js request object
 * @returns Objeto com resultado da validação
 */
export function validateCronSecret(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error('CRON_SECRET não configurado');
    return {
      valid: false,
      error: 'CRON_SECRET not configured',
    };
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Tentativa de acesso não autorizada a rota cron', {
      authHeader: authHeader ? 'present' : 'missing',
    });
    return {
      valid: false,
      error: 'Unauthorized',
    };
  }

  return { valid: true };
}

/**
 * Middleware para validar CRON_SECRET em rotas cron
 *
 * @param request - Next.js request object
 * @returns NextResponse com erro 401 se inválido, ou null se válido
 */
export function cronAuthMiddleware(request: NextRequest): NextResponse | null {
  const validation = validateCronSecret(request);

  if (!validation.valid) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: validation.error || 'Invalid CRON_SECRET',
      },
      { status: 401 }
    );
  }

  return null; // null indica que a requisição pode prosseguir
}
