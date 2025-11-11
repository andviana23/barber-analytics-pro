/**
 * @fileoverview React Hook para gerenciamento de comissões
 * @module hooks/useCommissions
 * @requires services/commissionService
 * @requires @tanstack/react-query
 * @description
 * Custom React Hook com TanStack Query para estado e cache de comissões.
 * Segue Clean Architecture - Hook Pattern.
 * Gerencia loading, error, refetch e cache invalidation.
 *
 * @author Andrey Viana
 * @date 08/11/2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import commissionService from '../services/commissionService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook principal: busca comissões com filtros
 * @param {Object} filters - Filtros de busca
 * @param {Object} options - Opções do React Query
 * @returns {{data: Array, isLoading: boolean, error: any, refetch: Function, count: number}}
 */
export function useCommissions(filters = {}, options = {}) {
  const { user } = useAuth();
  const queryKey = ['commissions', filters, user?.id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await commissionService.findByFilters(filters, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar uma comissão por ID
 * @param {string} commissionId - ID da comissão
 * @returns {{data: Object, isLoading: boolean, error: any}}
 */
export function useCommission(commissionId) {
  return useQuery({
    queryKey: ['commission', commissionId],
    queryFn: async () => {
      const result = await commissionService.findById(commissionId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!commissionId,
  });
}

/**
 * Hook para criar comissão
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useCreateCommission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async commissionData => {
      const result = await commissionService.create(commissionData, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidar cache de comissões
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-totals'] });
      toast.success('Comissão criada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao criar comissão');
    },
  });
}

/**
 * Hook para atualizar comissão
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useUpdateCommission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...commissionData }) => {
      const result = await commissionService.update(id, commissionData, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['commission-totals'] });
      toast.success('Comissão atualizada com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao atualizar comissão');
    },
  });
}

/**
 * Hook para marcar comissão como paga
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useMarkCommissionPaid() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, notes }) => {
      const result = await commissionService.markAsPaid(id, user, notes);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['commission-totals'] });
      toast.success('Comissão marcada como paga!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao marcar comissão como paga');
    },
  });
}

/**
 * Hook para excluir comissão
 * @returns {{mutate: Function, isLoading: boolean, error: any}}
 */
export function useDeleteCommission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async id => {
      const result = await commissionService.delete(id, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-totals'] });
      toast.success('Comissão excluída com sucesso!');
    },
    onError: error => {
      toast.error(error.message || 'Erro ao excluir comissão');
    },
  });
}

/**
 * Hook para buscar totalizadores de comissões
 * @param {Object} filters - Filtros de busca
 * @returns {{data: Object, isLoading: boolean, error: any}}
 */
export function useCommissionTotals(filters = {}) {
  const { user } = useAuth();
  const queryKey = ['commission-totals', filters, user?.id];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await commissionService.getTotals(filters);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export default {
  useCommissions,
  useCommission,
  useCreateCommission,
  useUpdateCommission,
  useMarkCommissionPaid,
  useDeleteCommission,
  useCommissionTotals,
};
