/**
 * @fileoverview Cron Job: Validação de Saldo Acumulado
 * @module app/api/cron/validate-balance/route
 * @description Valida periodicamente se o cálculo de saldo acumulado bate com a VIEW
 *
 * Schedule: 0 4 * * * (04:00 BRT diariamente, após o ETL)
 *
 * Fluxo:
 * 1. Buscar todas as unidades ativas
 * 2. Validar saldo acumulado de cada unidade (últimos 30 dias)
 * 3. Registrar diferenças encontradas
 * 4. Enviar alerta via Telegram se houver diferenças significativas
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Próximos Passos
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAllUnitsBalance } from '@/lib/analytics/validateBalance';
import { sendBalanceValidationAlert } from '@/lib/telegram';
import { logger } from '@/lib/logger';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';

/**
 * GET /api/cron/validate-balance
 *
 * Valida saldo acumulado para todas as unidades ativas
 *
 * Autenticação: Bearer token via CRON_SECRET header
 *
 * @param request - Next.js request object
 * @returns JSON com resultado da validação
 */
export async function GET(request: NextRequest) {
  const correlationId = `validate-balance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Validação de saldo acumulado iniciada', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Validar CRON_SECRET usando middleware
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  try {
    // 2. Executar validação
    const result = await validateAllUnitsBalance({ days: 30 });

    const durationMs = Date.now() - startTime;

    logger.info('Validação de saldo acumulado concluída', {
      correlationId,
      valid: result.valid,
      summary: result.summary,
      durationMs,
    });

    // 3. Preparar resposta
    const response = {
      success: true,
      valid: result.valid,
      correlationId,
      durationMs,
      summary: result.summary,
      results: result.results?.map(r => ({
        unitId: r.unitId,
        unitName: r.unitName,
        isValid: r.isValid,
        differences: r.differences,
        maxDifference: r.maxDifference,
        error: r.error || null,
      })),
    };

    // 4. Enviar alerta Telegram se houver diferenças
    if (!result.valid && result.results && result.results.length > 0) {
      try {
        await sendBalanceValidationAlert({
          valid: result.valid,
          results: result.results,
        });
        logger.info('Alerta Telegram enviado para diferenças encontradas', {
          correlationId,
          invalidUnits: result.results.filter(r => !r.isValid || r.differences > 0).length,
        });
      } catch (alertError) {
        logger.error('Erro ao enviar alerta Telegram', {
          correlationId,
          error: alertError instanceof Error ? alertError.message : 'Unknown error',
        });
        // Não falhar o cron job se o alerta falhar
      }
    }

    logger.info('Validação de saldo acumulado concluída', {
      correlationId,
      valid: result.valid,
      summary: result.summary,
      durationMs,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico na validação de saldo acumulado', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

