/**
 * @fileoverview React Hook para gerenciamento de despesas
 * @module hooks/useExpenses
 * @requires services/expenseService
 * @requires @tanstack/react-query
 * @description
 * Custom React Hook com TanStack Query para estado e cache de despesas.
 * Segue Clean Architecture - Hook Pattern.
 * Gerencia loading, error, refetch e cache invalidation.
 *
 * @author Andrey Viana
 * @date 07/11/2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import expenseService from '@/services/expenseService';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook principal: busca despesas por período
 * @param {string} unitId - ID da unidade
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @param {Object} options - Opções do React Query
 * @returns {{data: Array, isLoading: boolean, error: any, refetch: Function}}
 */
export function useExpenses(unitId, startDate, endDate, options = {}) {
  const queryKey = [
    'expenses',
    unitId,
    startDate?.toISOString(),
    endDate?.toISOString(),
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await expenseService.findByPeriod(
        unitId,
        startDate,
        endDate
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!(unitId && startDate && endDate),
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar uma despesa por ID
 * @param {string} expenseId - ID da despesa
 * @returns {{data: Object, isLoading: boolean, error: any}}
 */
export function useExpense(expenseId) {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const result = await expenseService.findById(expenseId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!expenseId,
  });
}

/**
 * Hook para criar despesa única
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async expenseData => {
      const result = await expenseService.create(expenseData, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidar cache de despesas
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Despesa criada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao criar despesa');
    },
  });
}

/**
 * Hook para criar despesa recorrente
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async recurringData => {
      const result = await expenseService.createRecurring(recurringData, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: data => {
      // Invalidar cache de despesas e recorrências
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success(data.message || 'Despesa recorrente criada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao criar despesa recorrente');
    },
  });
}

/**
 * Hook para atualizar despesa
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const result = await expenseService.update(id, updates, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Despesa atualizada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao atualizar despesa');
    },
  });
}

/**
 * Hook para deletar despesa
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async expenseId => {
      const result = await expenseService.delete(expenseId, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      toast.success('Despesa excluída com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao excluir despesa');
    },
  });
}

// =====================================================
// 🔁 HOOKS DE DESPESAS RECORRENTES
// =====================================================

/**
 * Hook para buscar recorrências de uma unidade
 * @param {string} unitId - ID da unidade
 * @returns {{data: Array, isLoading: boolean, error: any, refetch: Function}}
 */
export function useRecurringExpenses(unitId) {
  return useQuery({
    queryKey: ['recurring-expenses', unitId],
    queryFn: async () => {
      const result = await expenseService.findRecurringByUnit(unitId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!unitId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar série completa de parcelas
 * @param {string} seriesId - ID da série (expense_id da primeira parcela)
 * @returns {{data: Array, isLoading: boolean, error: any}}
 */
export function useExpenseSeries(seriesId) {
  return useQuery({
    queryKey: ['expense-series', seriesId],
    queryFn: async () => {
      const result = await expenseService.findSeries(seriesId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!seriesId,
  });
}

/**
 * Hook para pausar recorrência
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function usePauseRecurring() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async recurringExpenseId => {
      const result = await expenseService.pauseRecurring(
        recurringExpenseId,
        user
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Recorrência pausada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao pausar recorrência');
    },
  });
}

/**
 * Hook para retomar recorrência
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useResumeRecurring() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async recurringExpenseId => {
      const result = await expenseService.resumeRecurring(
        recurringExpenseId,
        user
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      toast.success('Recorrência retomada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao retomar recorrência');
    },
  });
}

/**
 * Hook para cancelar série de recorrência
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useCancelRecurringSeries() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ recurringExpenseId, deleteFutureOnly = true }) => {
      const result = await expenseService.cancelRecurringSeries(
        recurringExpenseId,
        deleteFutureOnly,
        user
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Série cancelada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao cancelar série');
    },
  });
}

/**
 * Hook para gerar manualmente próxima parcela
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useGenerateNextInstallment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async recurringExpenseId => {
      const result = await expenseService.generateNextInstallment(
        recurringExpenseId,
        user
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Próxima parcela gerada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao gerar parcela');
    },
  });
}

/**
 * Hook agregado para toggle (pause/resume)
 * Detecta automaticamente o estado atual e alterna
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useToggleRecurring() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ recurringExpenseId, currentStatus }) => {
      // Se pausado, retoma; se ativo, pausa
      const action = currentStatus === 'pausado' ? 'resume' : 'pause';

      const result =
        action === 'pause'
          ? await expenseService.pauseRecurring(recurringExpenseId, user)
          : await expenseService.resumeRecurring(recurringExpenseId, user);

      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      const message =
        variables.currentStatus === 'pausado'
          ? 'Recorrência retomada com sucesso!'
          : 'Recorrência pausada com sucesso!';
      toast.success(message);
    },
    onError: error => {
      toast.error(error.message || 'Erro ao alternar recorrência');
    },
  });
}

export default {
  useExpenses,
  useExpense,
  useCreateExpense,
  useCreateRecurringExpense,
  useUpdateExpense,
  useDeleteExpense,
  useRecurringExpenses,
  useExpenseSeries,
  usePauseRecurring,
  useResumeRecurring,
  useCancelRecurringSeries,
  useGenerateNextInstallment,
  useToggleRecurring,
};
