/**
 * 🎣 useFluxoCaixa Hook
 *
 * @module useFluxoCaixa
 * @description Custom hook para gerenciar dados de fluxo de caixa com TanStack Query
 *
 * Responsabilidades:
 * - Integrar com fluxoCaixaService
 * - Gerenciar cache (TanStack Query)
 * - Fornecer estados: loading, error, data
 * - Suportar refetch sob demanda
 * - Invalidação automática de cache
 *
 * Features:
 * - Cache de 5 minutos (staleTime)
 * - Refetch automático ao focar janela
 * - Retry em caso de erro (3 tentativas)
 * - Toast de feedback ao usuário
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { useQuery } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { fluxoCaixaService } from '../services/fluxoCaixaService';

/**
 * Hook para buscar dados de fluxo de caixa
 *
 * @param {Object} params
 * @param {string} params.unitId - ID da unidade
 * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
 * @param {string} params.endDate - Data final (YYYY-MM-DD)
 * @param {boolean} [params.includeWeekends=false] - Incluir fins de semana?
 * @param {boolean} [params.enabled=true] - Hook habilitado?
 *
 * @returns {Object} Estado do hook
 * @returns {Object|null} data - Dados do fluxo de caixa
 * @returns {Array} data.daily - Dados diários
 * @returns {Object} data.summary - Resumo/KPIs
 * @returns {Array} data.revenueDistribution - Distribuição de receitas
 * @returns {Array} data.expenseDistribution - Distribuição de despesas
 * @returns {Object} data.filters - Filtros aplicados
 * @returns {boolean} loading - Estado de carregamento
 * @returns {Error|null} error - Erro, se houver
 * @returns {Function} refetch - Função para recarregar dados
 * @returns {boolean} isFetching - Está buscando dados?
 * @returns {boolean} isRefetching - Está refazendo a busca?
 *
 * @example
 * const { data, loading, error, refetch } = useFluxoCaixa({
 *   unitId: 'uuid-123',
 *   startDate: '2025-11-01',
 *   endDate: '2025-11-30',
 *   includeWeekends: false,
 * });
 */
export function useFluxoCaixa({
  unitId,
  startDate,
  endDate,
  includeWeekends = false,
  enabled = true,
}) {
  const { showToast } = useToast();

  const query = useQuery({
    // Query key única para cada combinação de filtros
    queryKey: ['fluxo-caixa', { unitId, startDate, endDate, includeWeekends }],

    // Função de busca
    queryFn: async () => {
      const result = await fluxoCaixaService.getFluxoCaixaData({
        unitId,
        startDate,
        endDate,
        includeWeekends,
      });

      // Se houve erro, lançar exceção para TanStack Query tratar
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },

    // Configurações de cache e refetch
    enabled: enabled && !!unitId && !!startDate && !!endDate, // Só buscar se tiver filtros válidos
    staleTime: 1000 * 60 * 5, // 5 minutos (dados considerados "frescos")
    gcTime: 1000 * 60 * 30, // 30 minutos (garbage collection - antes era cacheTime)
    refetchOnWindowFocus: true, // Refetch ao focar janela
    refetchOnMount: false, // Não refetch ao montar se já tem cache
    retry: 3, // 3 tentativas em caso de erro
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

    // Callbacks
    onError: error => {
      showToast(`Erro ao carregar fluxo de caixa: ${error.message}`, 'error');
    },

    onSuccess: () => {
      // Success feedback via UI components
    },
  });

  return {
    // Dados
    data: query.data ?? null,

    // Estados
    loading: query.isLoading, // Carregando pela primeira vez
    error: query.error ?? null,
    isFetching: query.isFetching, // Buscando dados (primeira vez ou refetch)
    isRefetching: query.isRefetching, // Refazendo busca (já tem dados em cache)

    // Funções
    refetch: query.refetch, // Refetch manual

    // Metadados úteis
    isStale: query.isStale, // Dados estão obsoletos?
    dataUpdatedAt: query.dataUpdatedAt, // Timestamp da última atualização
  };
}

/**
 * Hook simplificado para casos onde não precisa de todos os estados
 *
 * @param {Object} params - Mesmos parâmetros de useFluxoCaixa
 * @returns {Object} Estado simplificado { data, loading, error, refetch }
 *
 * @example
 * const { data, loading, refetch } = useFluxoCaixaSimple({
 *   unitId: 'uuid-123',
 *   startDate: '2025-11-01',
 *   endDate: '2025-11-30',
 * });
 */
export function useFluxoCaixaSimple(params) {
  const { data, loading, error, refetch } = useFluxoCaixa(params);

  return { data, loading, error, refetch };
}
