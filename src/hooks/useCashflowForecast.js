/**
 * @fileoverview React Hook para Forecast de Fluxo de Caixa
 * @module hooks/useCashflowForecast
 * @description Custom hook com TanStack Query para previsões de fluxo de caixa
 *
 * Integra com:
 * - API endpoint: /api/forecasts/cashflow (Next.js API route)
 * - TanStack Query para cache e estado
 * - Autenticação JWT automática via AuthContext
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.2
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Busca forecast de fluxo de caixa da API
 *
 * @param {string} unitId - ID da unidade
 * @param {string|null} accountId - ID da conta bancária (opcional)
 * @param {number} days - Período de previsão: 30, 60 ou 90 dias (padrão: 30)
 * @param {string} token - JWT access token
 * @returns {Promise} Resposta da API com forecast
 */
async function fetchCashflowForecast(unitId, accountId, days, token) {
  // Usar URL base do Next.js (ajustar conforme necessário)
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const apiUrl = `${baseUrl}/api/forecasts/cashflow`;

  const params = new URLSearchParams({
    unitId,
    days: days.toString(),
  });

  if (accountId) {
    params.append('accountId', accountId);
  }

  const response = await fetch(`${apiUrl}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook: useCashflowForecast
 *
 * Gerencia estado e cache de previsões de fluxo de caixa usando TanStack Query
 *
 * @param {Object} params
 * @param {string} params.unitId - ID da unidade (obrigatório)
 * @param {string|null} [params.accountId] - ID da conta bancária (opcional)
 * @param {number} [params.days=30] - Período de previsão: 30, 60 ou 90 dias
 * @param {boolean} [params.enabled=true] - Hook habilitado?
 *
 * @returns {Object} Estado do hook
 * @returns {Object|null} data - Dados do forecast
 * @returns {Array} data.forecast - Array de previsões diárias
 * @returns {Object} data.summary - Resumo com saldos previstos
 * @returns {boolean} isLoading - Estado de carregamento inicial
 * @returns {boolean} isFetching - Está buscando dados?
 * @returns {Error|null} error - Erro, se houver
 * @returns {Function} refetch - Função para recarregar dados
 *
 * @example
 * ```jsx
 * const { data, isLoading, error, refetch } = useCashflowForecast({
 *   unitId: 'unit-123',
 *   accountId: null,
 *   days: 30,
 * });
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <ForecastChart data={data.forecast} summary={data.summary} />
 * );
 * ```
 */
export function useCashflowForecast({
  unitId,
  accountId = null,
  days = 30,
  enabled = true,
}) {
  const { session } = useAuth();
  const token = session?.access_token;

  const queryKey = ['cashflow-forecast', unitId, accountId, days];

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const result = await fetchCashflowForecast(unitId, accountId, days, token);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao gerar forecast');
      }

      return result;
    },
    enabled: enabled && !!unitId && !!token && [30, 60, 90].includes(days),
    staleTime: 60 * 60 * 1000, // 1 hora (mesmo TTL do cache da API)
    gcTime: 2 * 60 * 60 * 1000, // 2 horas (cacheTime renomeado para gcTime no v5)
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('[useCashflowForecast] Erro ao buscar forecast:', error);
      toast.error(`Erro ao carregar previsão: ${error.message}`);
    },
  });
}

/**
 * Hook: useCashflowForecast30
 *
 * Conveniência para forecast de 30 dias
 */
export function useCashflowForecast30({ unitId, accountId = null, enabled = true }) {
  return useCashflowForecast({ unitId, accountId, days: 30, enabled });
}

/**
 * Hook: useCashflowForecast60
 *
 * Conveniência para forecast de 60 dias
 */
export function useCashflowForecast60({ unitId, accountId = null, enabled = true }) {
  return useCashflowForecast({ unitId, accountId, days: 60, enabled });
}

/**
 * Hook: useCashflowForecast90
 *
 * Conveniência para forecast de 90 dias
 */
export function useCashflowForecast90({ unitId, accountId = null, enabled = true }) {
  return useCashflowForecast({ unitId, accountId, days: 90, enabled });
}

