/**
 * HOOK USE RELATÓRIOS
 *
 * Hook responsável por gerenciar estado e cache dos relatórios usando TanStack Query.
 * Segue os padrões Clean Architecture - Presentation Layer.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { relatoriosService } from '../services/relatoriosService';

/**
 * Chaves de cache para TanStack Query
 */
const QUERY_KEYS = {
  comparativoUnidades: 'relatorios.comparativo-unidades',
  rankingUnidades: 'relatorios.ranking-unidades',
  unitDashboard: 'relatorios.unit-dashboard',
  export: 'relatorios.export',
};

/**
 * Hook principal para relatórios
 */
export function useRelatorios() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Comparativo entre unidades
   */
  const useComparativoUnidades = (filters = {}, options = {}) => {
    return useQuery({
      queryKey: [QUERY_KEYS.comparativoUnidades, filters],
      queryFn: async () => {
        console.log(
          '🔍 [useRelatorios] Executando comparativo unidades...',
          filters
        );

        const result = await relatoriosService.getComparativoUnidades(filters);

        if (result.error) {
          throw new Error(result.error.message || 'Erro ao gerar comparativo');
        }

        console.log(
          '✅ [useRelatorios] Comparativo concluído:',
          result.data?.summary
        );
        return result.data;
      },
      enabled: options.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      retry: 2,
      onError: error => {
        console.error('❌ [useRelatorios] Erro no comparativo:', error);
        addToast({
          type: 'error',
          title: 'Erro no Comparativo',
          message: error.message || 'Falha ao carregar dados do comparativo',
        });
      },
      ...options,
    });
  };

  /**
   * Ranking de unidades
   */
  const useRankingUnidades = (filters = {}, options = {}) => {
    return useQuery({
      queryKey: [QUERY_KEYS.rankingUnidades, filters],
      queryFn: async () => {
        console.log(
          '🔍 [useRelatorios] Executando ranking unidades...',
          filters
        );

        const result = await relatoriosService.getRankingUnidades(filters);

        if (result.error) {
          throw new Error(result.error.message || 'Erro ao gerar ranking');
        }

        console.log(
          '✅ [useRelatorios] Ranking concluído:',
          result.data?.ranking?.length || 0,
          'unidades'
        );
        return result.data;
      },
      enabled: options.enabled !== false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 30 * 60 * 1000, // 30 minutos
      retry: 2,
      onError: error => {
        console.error('❌ [useRelatorios] Erro no ranking:', error);
        addToast({
          type: 'error',
          title: 'Erro no Ranking',
          message: error.message || 'Falha ao carregar ranking de unidades',
        });
      },
      ...options,
    });
  };

  /**
   * Dashboard de unidade específica
   */
  const useUnitDashboard = (unitId, filters = {}, options = {}) => {
    return useQuery({
      queryKey: [QUERY_KEYS.unitDashboard, unitId, filters],
      queryFn: async () => {
        console.log(
          '🔍 [useRelatorios] Executando dashboard da unidade...',
          unitId,
          filters
        );

        if (!unitId) {
          throw new Error('ID da unidade é obrigatório');
        }

        const result = await relatoriosService.getUnitDashboard(
          unitId,
          filters
        );

        if (result.error) {
          throw new Error(result.error.message || 'Erro ao carregar dashboard');
        }

        console.log('✅ [useRelatorios] Dashboard concluído:', unitId);
        return result.data;
      },
      enabled: options.enabled !== false && Boolean(unitId),
      staleTime: 2 * 60 * 1000, // 2 minutos
      cacheTime: 15 * 60 * 1000, // 15 minutos
      retry: 2,
      onError: error => {
        console.error('❌ [useRelatorios] Erro no dashboard:', error);
        addToast({
          type: 'error',
          title: 'Erro no Dashboard',
          message: error.message || 'Falha ao carregar dados da unidade',
        });
      },
      ...options,
    });
  };

  /**
   * Mutation para exportação de relatórios
   */
  const useExportRelatorio = () => {
    return useMutation({
      mutationFn: async ({ type, filters = {} }) => {
        console.log(
          '🔍 [useRelatorios] Iniciando exportação...',
          type,
          filters
        );

        const result = await relatoriosService.exportToExcel(type, filters);

        if (result.error) {
          throw new Error(result.error.message || 'Erro na exportação');
        }

        console.log(
          '✅ [useRelatorios] Exportação concluída:',
          result.data?.filename
        );
        return result.data;
      },
      onSuccess: data => {
        addToast({
          type: 'success',
          title: 'Exportação Concluída',
          message: `Arquivo ${data.filename} gerado com sucesso`,
        });
      },
      onError: error => {
        console.error('❌ [useRelatorios] Erro na exportação:', error);
        addToast({
          type: 'error',
          title: 'Erro na Exportação',
          message: error.message || 'Falha ao exportar relatório',
        });
      },
    });
  };

  /**
   * Função para invalidar cache de relatórios
   */
  const invalidateReports = async (type = 'all') => {
    console.log('🔄 [useRelatorios] Invalidando cache:', type);

    try {
      if (type === 'all') {
        await queryClient.invalidateQueries([QUERY_KEYS.comparativoUnidades]);
        await queryClient.invalidateQueries([QUERY_KEYS.rankingUnidades]);
        await queryClient.invalidateQueries([QUERY_KEYS.unitDashboard]);
      } else if (type === 'comparativo') {
        await queryClient.invalidateQueries([QUERY_KEYS.comparativoUnidades]);
      } else if (type === 'ranking') {
        await queryClient.invalidateQueries([QUERY_KEYS.rankingUnidades]);
      } else if (type === 'dashboard') {
        await queryClient.invalidateQueries([QUERY_KEYS.unitDashboard]);
      }

      console.log('✅ [useRelatorios] Cache invalidado:', type);
    } catch (error) {
      console.error('❌ [useRelatorios] Erro ao invalidar cache:', error);
    }
  };

  /**
   * Função para refetch de relatórios
   */
  const refetchReports = async (type = 'all') => {
    console.log('🔄 [useRelatorios] Refetch de relatórios:', type);

    try {
      if (type === 'all') {
        await queryClient.refetchQueries([QUERY_KEYS.comparativoUnidades]);
        await queryClient.refetchQueries([QUERY_KEYS.rankingUnidades]);
        await queryClient.refetchQueries([QUERY_KEYS.unitDashboard]);
      } else if (type === 'comparativo') {
        await queryClient.refetchQueries([QUERY_KEYS.comparativoUnidades]);
      } else if (type === 'ranking') {
        await queryClient.refetchQueries([QUERY_KEYS.rankingUnidades]);
      } else if (type === 'dashboard') {
        await queryClient.refetchQueries([QUERY_KEYS.unitDashboard]);
      }

      console.log('✅ [useRelatorios] Refetch concluído:', type);
    } catch (error) {
      console.error('❌ [useRelatorios] Erro no refetch:', error);
    }
  };

  return {
    // Queries
    useComparativoUnidades,
    useRankingUnidades,
    useUnitDashboard,

    // Mutations
    useExportRelatorio,

    // Utils
    invalidateReports,
    refetchReports,

    // Estado global
    loading,
    error,

    // Query keys para referência externa
    QUERY_KEYS,
  };
}

/**
 * Hook específico para comparativo de unidades
 */
export function useComparativoUnidades(filters = {}, options = {}) {
  const { useComparativoUnidades } = useRelatorios();
  return useComparativoUnidades(filters, options);
}

/**
 * Hook específico para ranking de unidades
 */
export function useRankingUnidades(filters = {}, options = {}) {
  const { useRankingUnidades } = useRelatorios();
  return useRankingUnidades(filters, options);
}

/**
 * Hook específico para dashboard de unidade
 */
export function useUnitDashboard(unitId, filters = {}, options = {}) {
  const { useUnitDashboard } = useRelatorios();
  return useUnitDashboard(unitId, filters, options);
}

/**
 * Hook específico para exportação
 */
export function useExportRelatorio() {
  const { useExportRelatorio } = useRelatorios();
  return useExportRelatorio();
}

/**
 * Hook para cache e invalidação
 */
export function useRelatoriosCache() {
  const { invalidateReports, refetchReports, QUERY_KEYS } = useRelatorios();

  return {
    invalidateReports,
    refetchReports,
    QUERY_KEYS,
  };
}

export default useRelatorios;
