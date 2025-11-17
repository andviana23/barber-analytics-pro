import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import stockMovementService from '../services/stockMovementService';
import { useUnit } from '../context/UnitContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar movimentações de estoque
 * Utiliza TanStack Query para cache, paginação e refetch automático
 *
 * @param {Object} options - Opções de configuração
 * @param {Object} options.filters - Filtros para busca (productId, movementType, reason, etc)
 * @param {boolean} options.enabled - Se o hook está habilitado (default: true)
 * @param {number} options.refetchInterval - Intervalo de refetch em ms (default: 30000)
 * @returns {Object} Estados e ações do hook
 */
export function useStockMovements(options = {}) {
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    filters = {},
    enabled = true,
    refetchInterval = 30000, // 30 segundos
  } = options;

  const unitId = selectedUnit?.id;

  // Query para listar movimentações
  const {
    data: movementsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['stock-movements', unitId, filters],
    queryFn: async () => {
      if (!unitId) {
        return { data: [], totalCount: 0, page: 1, pageSize: 20 };
      }

      const result = await stockMovementService.getStockHistory(unitId, {
        productId: filters.productId,
        movementType: filters.movementType,
        reason: filters.reason,
        startDate: filters.startDate,
        endDate: filters.endDate,
        performedBy: filters.performedBy,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: enabled && !!unitId,
    refetchInterval,
    staleTime: 5000, // 5 segundos
    retry: 2,
  });

  // Mutation: Registrar entrada
  const recordEntry = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      reason,
      unitCost,
      referenceId,
      referenceType,
      notes,
    }) => {
      if (!unitId || !user?.id) {
        throw new Error('Usuário ou unidade não identificados');
      }

      const result = await stockMovementService.recordEntry(
        productId,
        quantity,
        reason,
        unitCost,
        unitId,
        user.id,
        notes,
        referenceId,
        referenceType,
        user
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: data => {
      showToast({
        type: 'success',
        title: 'Entrada registrada',
        message: `${data?.quantity || 0} unidades adicionadas ao estoque`,
      });
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao registrar entrada',
        message: error.message,
      });
    },
  });

  // Mutation: Registrar saída
  const recordExit = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      reason,
      referenceId,
      referenceType,
      notes,
    }) => {
      if (!unitId || !user?.id) {
        throw new Error('Usuário ou unidade não identificados');
      }

      const result = await stockMovementService.recordExit(
        productId,
        quantity,
        reason,
        user.id,
        notes,
        referenceId,
        referenceType,
        user
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: data => {
      showToast({
        type: 'success',
        title: 'Saída registrada',
        message: `${data?.quantity || 0} unidades removidas do estoque`,
      });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao registrar saída',
        message: error.message,
      });
    },
  });

  // Mutation: Ajustar estoque (apenas gerente/admin)
  const adjustStock = useMutation({
    mutationFn: async ({ productId, adjustQuantity, reason, notes }) => {
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      const result = await stockMovementService.adjustStock(
        productId,
        adjustQuantity,
        reason,
        notes,
        user.id,
        user
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: data => {
      const qty = data?.quantity || 0;
      showToast({
        type: 'success',
        title: 'Estoque ajustado',
        message: `Ajuste de ${qty > 0 ? '+' : ''}${qty} unidades realizado`,
      });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao ajustar estoque',
        message: error.message,
      });
    },
  });

  // Mutation: Atualizar notas
  const updateNotes = useMutation({
    mutationFn: async ({ movementId, notes }) => {
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      const result = await stockMovementService.updateNotes(
        movementId,
        notes,
        user.id
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Observações atualizadas',
        message: 'As observações foram salvas com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar observações',
        message: error.message,
      });
    },
  });

  // Mutation: Reverter movimentação (apenas gerente/admin)
  const revertMovement = useMutation({
    mutationFn: async movementId => {
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      const result = await stockMovementService.revertMovement(
        movementId,
        user.id
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Movimentação revertida',
        message: 'O estoque foi recalculado corretamente',
      });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao reverter movimentação',
        message: error.message,
      });
    },
  });

  // Mutation: Deletar movimentação (soft delete)
  const deleteMovement = useMutation({
    mutationFn: async movementId => {
      if (!user?.id) {
        throw new Error('Usuário não identificado');
      }

      const result = await stockMovementService.deleteMovement(
        movementId,
        user.id
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Movimentação removida',
        message: 'A movimentação foi removida do histórico',
      });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao remover movimentação',
        message: error.message,
      });
    },
  });

  // Computed values
  const movements = movementsData?.data || [];
  const totalCount = movementsData?.totalCount || 0;
  const currentPage = movementsData?.page || 1;
  const pageSize = movementsData?.pageSize || 20;
  const hasMore = currentPage * pageSize < totalCount;

  return {
    // Data
    movements,
    totalCount,
    currentPage,
    pageSize,
    hasMore,

    // States
    isLoading,
    isFetching,
    error: error?.message || null,

    // Actions
    refetch,
    recordEntry: recordEntry.mutate,
    recordExit: recordExit.mutate,
    adjustStock: adjustStock.mutate,
    updateNotes: updateNotes.mutate,
    revertMovement: revertMovement.mutate,
    deleteMovement: deleteMovement.mutate,

    // Mutation states
    isRecordingEntry: recordEntry.isPending,
    isRecordingExit: recordExit.isPending,
    isAdjusting: adjustStock.isPending,
    isUpdatingNotes: updateNotes.isPending,
    isReverting: revertMovement.isPending,
    isDeleting: deleteMovement.isPending,
  };
}

/**
 * Hook para resumo de movimentações por período
 *
 * @param {Date} [startDate] - Data inicial
 * @param {Date} [endDate] - Data final
 * @returns {Object} Resumo de movimentações
 */
export function useStockSummary(startDate, endDate) {
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();
  const { user } = useAuth();
  const unitId = selectedUnit?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-summary', unitId, startDate, endDate],
    queryFn: async () => {
      if (!unitId) {
        return null;
      }

      const result = await stockMovementService.getSummaryByPeriod(
        unitId,
        startDate,
        endDate,
        user
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!unitId,
    staleTime: 60000, // 1 minuto
    retry: 2,
  });

  if (error && !isLoading) {
    showToast({
      type: 'error',
      title: 'Erro ao carregar resumo',
      message: error.message,
    });
  }

  return {
    summary: data || null,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}

/**
 * Hook para histórico de um produto específico
 *
 * @param {string} productId - ID do produto
 * @param {Date} [startDate] - Data inicial
 * @param {Date} [endDate] - Data final
 * @returns {Object} Histórico do produto
 */
export function useProductHistory(productId, startDate, endDate) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product-history', productId, startDate, endDate],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      const result = await stockMovementService.getProductHistory(
        productId,
        startDate,
        endDate,
        user
      );

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!productId,
    staleTime: 30000, // 30 segundos
    retry: 2,
  });

  if (error && !isLoading) {
    showToast({
      type: 'error',
      title: 'Erro ao carregar histórico',
      message: error.message,
    });
  }

  return {
    history: data || [],
    isLoading,
    error: error?.message || null,
    refetch,
  };
}
