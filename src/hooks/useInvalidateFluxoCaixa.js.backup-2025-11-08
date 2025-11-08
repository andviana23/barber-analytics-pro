/**
 * 🔄 useInvalidateFluxoCaixa Hook
 *
 * @module useInvalidateFluxoCaixa
 * @description Hook para invalidar cache de fluxo de caixa
 *
 * Usado quando:
 * - Criar/editar/excluir receita
 * - Criar/editar/excluir despesa
 * - Editar saldo inicial
 * - Fechar caixa
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook para invalidar cache de fluxo de caixa
 *
 * @returns {Object} Funções de invalidação
 * @returns {Function} invalidateAll - Invalida todo o cache de fluxo de caixa
 * @returns {Function} invalidateByUnit - Invalida cache de uma unidade específica
 * @returns {Function} invalidateByPeriod - Invalida cache de um período específico
 *
 * @example
 * const { invalidateAll, invalidateByUnit } = useInvalidateFluxoCaixa();
 *
 * // Após criar receita
 * await createRevenue(data);
 * invalidateByUnit(unitId);
 */
export function useInvalidateFluxoCaixa() {
  const queryClient = useQueryClient();

  /**
   * Invalida todo o cache de fluxo de caixa
   */
  const invalidateAll = useCallback(() => {
    console.log(
      '🔄 [useInvalidateFluxoCaixa] Invalidando todo o cache de fluxo de caixa'
    );
    queryClient.invalidateQueries({
      queryKey: ['fluxo-caixa'],
    });
  }, [queryClient]);

  /**
   * Invalida cache de uma unidade específica
   * @param {string} unitId - ID da unidade
   */
  const invalidateByUnit = useCallback(
    unitId => {
      console.log(
        '🔄 [useInvalidateFluxoCaixa] Invalidando cache da unidade:',
        unitId
      );
      queryClient.invalidateQueries({
        queryKey: ['fluxo-caixa'],
        predicate: query => {
          const filters = query.queryKey[1];
          return filters?.unitId === unitId;
        },
      });
    },
    [queryClient]
  );

  /**
   * Invalida cache de um período específico
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial
   * @param {string} params.endDate - Data final
   */
  const invalidateByPeriod = useCallback(
    ({ unitId, startDate, endDate }) => {
      console.log(
        '🔄 [useInvalidateFluxoCaixa] Invalidando cache do período:',
        {
          unitId,
          startDate,
          endDate,
        }
      );
      queryClient.invalidateQueries({
        queryKey: ['fluxo-caixa', { unitId, startDate, endDate }],
      });
    },
    [queryClient]
  );

  /**
   * Remove cache específico (mais agressivo que invalidate)
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial
   * @param {string} params.endDate - Data final
   */
  const removeCache = useCallback(
    ({ unitId, startDate, endDate }) => {
      console.log('🗑️ [useInvalidateFluxoCaixa] Removendo cache:', {
        unitId,
        startDate,
        endDate,
      });
      queryClient.removeQueries({
        queryKey: ['fluxo-caixa', { unitId, startDate, endDate }],
      });
    },
    [queryClient]
  );

  return {
    invalidateAll,
    invalidateByUnit,
    invalidateByPeriod,
    removeCache,
  };
}
