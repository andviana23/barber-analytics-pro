/**
 * 🔌 PRODUCT HOOKS - TanStack Query v5
 * Barber Analytics Pro - v2.0.0
 *
 * @module useProducts
 * @description Modern hooks para gerenciamento de produtos com cache automático
 * @author Andrey Viana
 * @created 2025-11-13
 * @architecture Clean Architecture + TanStack Query + Realtime
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { productService } from '../../lib/services/productService';
import { useAuth } from '../context/AuthContext';

// ========================================
// QUERY KEYS
// ========================================

export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: filters => [...productKeys.lists(), filters],
  details: () => [...productKeys.all, 'detail'],
  detail: id => [...productKeys.details(), id],
  lowStock: unitId => [...productKeys.all, 'low-stock', unitId],
  outOfStock: unitId => [...productKeys.all, 'out-of-stock', unitId],
  statistics: unitId => [...productKeys.all, 'statistics', unitId],
};

// ========================================
// QUERIES
// ========================================

/**
 * Hook para listar produtos com filtros e paginação
 * @param {Object} filters - Filtros (unit_id, search, category, brand, is_active)
 * @param {Object} options - Opções do useQuery
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useProducts(filters = {}, options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const result = await productService.getProducts(filters, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && !!filters.unit_id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar um produto específico por ID
 * @param {string} id - ID do produto
 * @param {Object} options - Opções do useQuery
 * @returns {Object} { data, isLoading, error }
 */
export function useProduct(id, options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const result = await productService.getProductById(id, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Hook para buscar produtos com estoque baixo
 * @param {string} unitId - ID da unidade
 * @param {Object} options - Opções do useQuery
 * @returns {Object} { data, isLoading, error }
 */
export function useLowStockProducts(unitId, options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: productKeys.lowStock(unitId),
    queryFn: async () => {
      const result = await productService.getLowStockProducts(unitId, user);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!user && !!unitId,
    staleTime: 1000 * 60 * 2, // 2 minutos (mais frequente)
    ...options,
  });
}

/**
 * Hook para buscar produtos sem estoque
 * @param {string} unitId - ID da unidade
 * @param {Object} options - Opções do useQuery
 * @returns {Object} { data, isLoading, error }
 */
export function useOutOfStockProducts(unitId, options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: productKeys.outOfStock(unitId),
    queryFn: async () => {
      const result = await productService.getOutOfStockProducts(unitId, user);
      if (result.error) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!user && !!unitId,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
}

/**
 * Hook para buscar estatísticas de produtos
 * @param {string} unitId - ID da unidade
 * @param {Object} options - Opções do useQuery
 * @returns {Object} { data, isLoading, error }
 */
export function useProductStatistics(unitId, options = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: productKeys.statistics(unitId),
    queryFn: async () => {
      const result = await productService.getProductStatistics(unitId, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && !!unitId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

// ========================================
// MUTATIONS
// ========================================

/**
 * Mutation para criar novo produto
 * @param {Object} options - Opções do useMutation
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useCreateProduct(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async productData => {
      const result = await productService.createProduct(productData, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: data => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.statistics(data.unit_id),
      });

      toast.success('Produto criado com sucesso!');
    },
    onError: error => {
      toast.error(`Erro ao criar produto: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Mutation para atualizar produto
 * @param {Object} options - Opções do useMutation
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useUpdateProduct(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const result = await productService.updateProduct(id, updates, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.statistics(data.unit_id),
      });

      toast.success('Produto atualizado com sucesso!');
    },
    onError: error => {
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Mutation para ajustar estoque manualmente
 * @param {Object} options - Opções do useMutation
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useAdjustStock(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quantity, operation }) => {
      const result = await productService.adjustStock(
        id,
        quantity,
        operation,
        user
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.lowStock(data.unit_id),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.outOfStock(data.unit_id),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.statistics(data.unit_id),
      });

      toast.success('Estoque ajustado com sucesso!');
    },
    onError: error => {
      toast.error(`Erro ao ajustar estoque: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Mutation para soft delete de produto
 * @param {Object} options - Opções do useMutation
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useDeleteProduct(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async id => {
      const result = await productService.deleteProduct(id, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: data => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: productKeys.statistics(data.unit_id),
      });

      toast.success('Produto excluído com sucesso!');
    },
    onError: error => {
      toast.error(`Erro ao excluir produto: ${error.message}`);
    },
    ...options,
  });
}

/**
 * Mutation para restaurar produto inativo
 * @param {Object} options - Opções do useMutation
 * @returns {Object} { mutate, mutateAsync, isLoading, error }
 */
export function useRestoreProduct(options = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async id => {
      const result = await productService.restoreProduct(id, user);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: data => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: productKeys.statistics(data.unit_id),
      });

      toast.success('Produto restaurado com sucesso!');
    },
    onError: error => {
      toast.error(`Erro ao restaurar produto: ${error.message}`);
    },
    ...options,
  });
}

// ========================================
// REALTIME
// ========================================

/**
 * Hook para subscrever mudanças em tempo real nos produtos
 * @param {string} unitId - ID da unidade
 * @param {Function} onUpdate - Callback quando houver atualização
 */
export function useProductsRealtime(unitId, onUpdate) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!unitId) return;

    const channel = supabase
      .channel(`products:unit_id=eq.${unitId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `unit_id=eq.${unitId}`,
        },
        payload => {
          // Invalidar cache
          queryClient.invalidateQueries({ queryKey: productKeys.lists() });
          queryClient.invalidateQueries({
            queryKey: productKeys.statistics(unitId),
          });

          // Se for INSERT ou UPDATE, invalidar também o detail específico
          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: productKeys.detail(payload.new.id),
            });
          }

          // Callback customizado
          if (onUpdate) {
            onUpdate(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unitId, queryClient, onUpdate]);
}

// ========================================
// UTILITIES
// ========================================

/**
 * Hook utilitário para refetch manual de produtos
 * @returns {Object} Funções de refetch
 */
export function useProductsRefetch() {
  const queryClient = useQueryClient();

  return {
    refetchLists: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
    refetchDetails: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.details() }),
    refetchAll: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
  };
}

/**
 * Hook para acessar produto do cache sem fazer request
 * @param {string} id - ID do produto
 * @returns {Object|undefined} Dados do produto no cache
 */
export function useProductFromCache(id) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData(productKeys.detail(id));
}

// ========================================
// EXPORTS
// ========================================

export default {
  // Queries
  useProducts,
  useProduct,
  useLowStockProducts,
  useOutOfStockProducts,
  useProductStatistics,

  // Mutations
  useCreateProduct,
  useUpdateProduct,
  useAdjustStock,
  useDeleteProduct,
  useRestoreProduct,

  // Realtime
  useProductsRealtime,

  // Utilities
  useProductsRefetch,
  useProductFromCache,

  // Keys
  productKeys,
};
