/**
 * @fileoverview Validação de Saldo Acumulado em Produção
 * @module lib/analytics/validateBalance
 * @description Script para validar se o cálculo de saldo acumulado bate com a VIEW
 *
 * Uso recomendado:
 * - Executar periodicamente via cron job
 * - Executar após migrations que alterem dados financeiros
 * - Executar como health check
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Próximos Passos
 */

import { validateAccumulatedBalance } from './cashflowForecast';
import { logger } from '../logger';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Valida saldo acumulado para todas as unidades ativas
 *
 * @param {Object} options
 * @param {number} [options.days=30] - Número de dias para validar
 * @param {string|null} [options.accountId] - ID da conta específica (null = todas)
 * @returns {Promise<{valid: boolean, results: Array}>}
 */
export async function validateAllUnitsBalance({ days = 30, accountId = null } = {}) {
  const correlationId = `validate-balance-${Date.now()}`;
  const startTime = Date.now();

  logger.info('Iniciando validação de saldo acumulado para todas as unidades', {
    correlationId,
    days,
    accountId: accountId || 'all',
  });

  try {
    // 1. Buscar unidades ativas
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (unitsError) {
      logger.error('Erro ao buscar unidades', {
        correlationId,
        error: unitsError.message,
      });
      throw unitsError;
    }

    if (!units || units.length === 0) {
      logger.warn('Nenhuma unidade ativa encontrada', { correlationId });
      return {
        valid: true,
        results: [],
      };
    }

    // 2. Calcular período de validação
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 3. Validar cada unidade
    const results = await Promise.all(
      units.map(async (unit) => {
        try {
          const validation = await validateAccumulatedBalance(
            unit.id,
            accountId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );

          return {
            unitId: unit.id,
            unitName: unit.name,
            ...validation,
          };
        } catch (error) {
          logger.error('Erro ao validar unidade', {
            correlationId,
            unitId: unit.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          return {
            unitId: unit.id,
            unitName: unit.name,
            isValid: false,
            differences: -1,
            maxDifference: -1,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    // 4. Calcular estatísticas
    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.filter(r => !r.isValid).length;
    const totalDifferences = results.reduce((sum, r) => sum + (r.differences || 0), 0);
    const maxDifference = Math.max(...results.map(r => r.maxDifference || 0));

    const durationMs = Date.now() - startTime;

    logger.info('Validação de saldo acumulado concluída', {
      correlationId,
      totalUnits: units.length,
      validCount,
      invalidCount,
      totalDifferences,
      maxDifference,
      durationMs,
    });

    // 5. Alertar se houver diferenças significativas
    if (invalidCount > 0 || totalDifferences > 0) {
      logger.warn('Diferenças encontradas na validação de saldo acumulado', {
        correlationId,
        invalidCount,
        totalDifferences,
        maxDifference,
        results: results.filter(r => !r.isValid || (r.differences || 0) > 0),
      });
    }

    return {
      valid: invalidCount === 0 && totalDifferences === 0,
      summary: {
        totalUnits: units.length,
        validCount,
        invalidCount,
        totalDifferences,
        maxDifference,
        durationMs,
      },
      results,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico na validação de saldo acumulado', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      durationMs,
    });

    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
    };
  }
}

/**
 * Valida saldo acumulado para uma unidade específica
 *
 * @param {string} unitId - ID da unidade
 * @param {string|null} accountId - ID da conta bancária (opcional)
 * @param {number} days - Número de dias para validar
 * @returns {Promise<{isValid: boolean, differences: number, maxDifference: number}>}
 */
export async function validateUnitBalance(unitId, accountId = null, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return validateAccumulatedBalance(
    unitId,
    accountId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
}

