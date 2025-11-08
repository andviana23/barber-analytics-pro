/**
 * @fileoverview Custom Hook - Demonstrativo de Fluxo de Caixa Acumulado
 * @module hooks/useDemonstrativoFluxo
 * @description Hook React para gerenciar estado e lógica do Demonstrativo de Fluxo Acumulado.
 *              Integra TanStack Query para cache, loading states e refetch automático.
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @architecture Clean Architecture - Application Layer
 * @dependencies
 * - @tanstack/react-query@5.x
 * - react@19.x
 * - cashflowService
 *
 * @usage
 * ```jsx
 * const {
 *   data,
 *   summary,
 *   loading,
 *   error,
 *   filters,
 *   setFilters,
 *   refetch,
 *   exportToExcel,
 *   exportToPDF,
 *   exportToCSV
 * } = useDemonstrativoFluxo({ unitId, accountId, startDate, endDate });
 * ```
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { demonstrativoFluxoService } from '../services/demonstrativoFluxoService';
import { toast } from 'sonner';

/**
 * Hook: useDemonstrativoFluxo
 * Gerencia estado, filtros, cache e exportação do Demonstrativo de Fluxo
 *
 * @param {Object} initialFilters - Filtros iniciais
 * @param {string} initialFilters.unitId - ID da unidade (obrigatório)
 * @param {string|null} initialFilters.accountId - ID da conta bancária (null = todas)
 * @param {string} initialFilters.startDate - Data inicial (YYYY-MM-DD)
 * @param {string} initialFilters.endDate - Data final (YYYY-MM-DD)
 * @returns {Object} Estado e métodos do hook
 */
export function useDemonstrativoFluxo(initialFilters = {}) {
  // ==================================================================================
  // STATE MANAGEMENT
  // ==================================================================================

  const [filters, setFilters] = useState({
    unitId: initialFilters.unitId || null,
    accountId: initialFilters.accountId || null,
    startDate: initialFilters.startDate || getDefaultStartDate(),
    endDate: initialFilters.endDate || getDefaultEndDate(),
  });

  // Sincronizar unitId quando ele chegar do UnitContext (inicialização ou mudança)
  useEffect(() => {
    if (initialFilters.unitId) {
      setFilters(prev => {
        // Se não tem unitId ainda (primeira inicialização), apenas seta
        if (!prev.unitId) {
          console.log('🎯 Inicializando unitId:', initialFilters.unitId);
          return {
            ...prev,
            unitId: initialFilters.unitId,
          };
        }

        // Se unitId mudou, reseta accountId
        if (prev.unitId !== initialFilters.unitId) {
          console.log('🔄 Mudança de unidade detectada, resetando accountId');
          return {
            ...prev,
            unitId: initialFilters.unitId,
            accountId: null,
          };
        }

        // Sem mudanças
        return prev;
      });
    }
  }, [initialFilters.unitId]);

  // ==================================================================================
  // TANSTACK QUERY - DATA FETCHING
  // ==================================================================================

  const {
    data: queryData,
    isLoading,
    isError,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      'demonstrativo-fluxo',
      filters.unitId,
      filters.accountId,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: async () => {
      // Validação de filtros obrigatórios
      if (!filters.unitId) {
        throw new Error('Unit ID é obrigatório para buscar o demonstrativo');
      }

      if (!filters.startDate || !filters.endDate) {
        throw new Error('Período (data inicial e final) é obrigatório');
      }

      // Chamar novo service dedicado
      const result = await demonstrativoFluxoService.getDemonstrativo({
        unitId: filters.unitId,
        accountId: filters.accountId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      // Tratar erro do service
      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    },
    enabled: !!filters.unitId && !!filters.startDate && !!filters.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 1,
    onError: error => {
      toast.error(`Erro ao carregar demonstrativo: ${error.message}`);
    },
  });

  // ==================================================================================
  // COMPUTED VALUES
  // ==================================================================================

  const data = useMemo(() => queryData?.data || [], [queryData]);
  const summary = useMemo(() => queryData?.summary || null, [queryData]);
  const hasData = useMemo(() => data.length > 0, [data]);

  // ==================================================================================
  // FILTER HANDLERS
  // ==================================================================================

  /**
   * Atualiza filtros e dispara nova busca
   * @param {Object} newFilters - Novos filtros parciais
   */
  const handleFilterChange = useCallback(newFilters => {
    console.log('🔄 handleFilterChange chamado:', {
      newFilters,
    });
    setFilters(prev => {
      const merged = { ...prev, ...newFilters };
      console.log('📦 setFilters merge:', {
        prev,
        newFilters,
        merged,
      });
      return merged;
    });
  }, []); // ✅ SEM dependências - usa setFilters(prev => ...)

  /**
   * Reseta filtros para valores padrão
   */
  const resetFilters = useCallback(() => {
    setFilters({
      unitId: initialFilters.unitId || null,
      accountId: null,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
    });
  }, [initialFilters.unitId]);

  /**
   * Valida se os filtros atuais são válidos
   * @returns {boolean} true se válidos
   */
  const validateFilters = useCallback(() => {
    if (!filters.unitId) {
      toast.error('Selecione uma unidade');
      return false;
    }

    if (!filters.startDate || !filters.endDate) {
      toast.error('Selecione o período (data inicial e final)');
      return false;
    }

    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);

    if (start > end) {
      toast.error('Data inicial não pode ser maior que data final');
      return false;
    }

    // Validar período máximo de 2 anos
    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffInDays > 730) {
      toast.error('Período máximo permitido é de 2 anos');
      return false;
    }

    return true;
  }, [filters]);

  // ==================================================================================
  // EXPORT HANDLERS
  // ==================================================================================

  /**
   * Exporta dados para Excel
   */
  const exportToExcel = useCallback(async () => {
    if (!hasData) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      // Implementação será feita na próxima task
      toast.info('Funcionalidade de exportação será implementada em breve');
    } catch (error) {
      toast.error(`Erro ao exportar para Excel: ${error.message}`);
    }
  }, [hasData]);

  /**
   * Exporta dados para PDF
   */
  const exportToPDF = useCallback(async () => {
    if (!hasData) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      // Implementação será feita na próxima task
      toast.info('Funcionalidade de exportação será implementada em breve');
    } catch (error) {
      toast.error(`Erro ao exportar para PDF: ${error.message}`);
    }
  }, [hasData]);

  /**
   * Exporta dados para CSV
   */
  const exportToCSV = useCallback(async () => {
    if (!hasData) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      // Implementação será feita na próxima task
      toast.info('Funcionalidade de exportação será implementada em breve');
    } catch (error) {
      toast.error(`Erro ao exportar para CSV: ${error.message}`);
    }
  }, [hasData]);

  // ==================================================================================
  // RETURN HOOK API
  // ==================================================================================

  return {
    // Data
    data,
    summary,
    hasData,

    // Loading states
    loading: isLoading || isFetching,
    isLoading,
    isFetching,

    // Error handling
    error: isError ? queryError?.message || 'Erro ao carregar dados' : null,
    isError,

    // Filters
    filters,
    handleFilterChange, // ✅ Exportando com nome correto
    resetFilters,
    validateFilters,

    // Actions
    refetch,
    exportToExcel,
    exportToPDF,
    exportToCSV,

    // Metadata
    isEmpty: !isLoading && !hasData,
    isFirstLoad: isLoading && !queryData,
  };
}

// ==================================================================================
// HELPER FUNCTIONS
// ==================================================================================

/**
 * Retorna data inicial padrão (primeiro dia do mês atual)
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getDefaultStartDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Retorna data final padrão (último dia do mês atual)
 * @returns {string} Data no formato YYYY-MM-DD
 */
function getDefaultEndDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const lastDay = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  return `${year}-${monthStr}-${lastDay}`;
}

// ==================================================================================
// EXPORT DEFAULT
// ==================================================================================

export default useDemonstrativoFluxo;
