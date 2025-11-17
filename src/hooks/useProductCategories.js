/**
 * @file useProductCategories.js
 * @description Custom hook para gerenciar categorias de produtos com TanStack Query
 * @module Hooks/ProductCategories
 * @author Andrey Viana
 * @date 14/11/2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productCategoryService } from '../services/productCategoryService';
import { useToast } from '../context/ToastContext';

/**
 * Hook para buscar todas as categorias de produtos
 * @returns {Object} Query result com data, isLoading, error, refetch
 */
export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await productCategoryService.findAll();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar categoria de produto por ID
 * @param {string} id - ID da categoria
 * @returns {Object} Query result
 */
export function useProductCategory(id) {
  return useQuery({
    queryKey: ['product-category', id],
    queryFn: async () => {
      const result = await productCategoryService.findById(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para buscar categorias de receita (Revenue) para vincular
 * @param {string} unitId - ID da unidade
 * @returns {Object} Query result
 */
export function useRevenueCategories(unitId) {
  return useQuery({
    queryKey: ['revenue-categories', unitId],
    queryFn: async () => {
      const result = await productCategoryService.getRevenueCategories(unitId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!unitId,
    staleTime: 10 * 60 * 1000, // 10 minutos (mudam raramente)
  });
}

/**
 * Hook para criar categoria de produto
 * @returns {Object} Mutation result
 */
export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async data => {
      const result = await productCategoryService.create(data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      showToast({
        type: 'success',
        title: 'Categoria criada',
        message: 'Categoria de produto criada com sucesso!',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao criar categoria',
        message: error.message || 'Não foi possível criar a categoria',
      });
    },
  });
}

/**
 * Hook para atualizar categoria de produto
 * @returns {Object} Mutation result
 */
export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await productCategoryService.update(id, data);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['product-category', variables.id],
      });
      showToast({
        type: 'success',
        title: 'Categoria atualizada',
        message: 'Categoria de produto atualizada com sucesso!',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar categoria',
        message: error.message || 'Não foi possível atualizar a categoria',
      });
    },
  });
}

/**
 * Hook para deletar categoria de produto (soft delete)
 * @returns {Object} Mutation result
 */
export function useDeleteProductCategory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async id => {
      const result = await productCategoryService.delete(id);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      showToast({
        type: 'success',
        title: 'Categoria excluída',
        message: 'Categoria de produto excluída com sucesso!',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Erro ao excluir categoria',
        message: error.message || 'Não foi possível excluir a categoria',
      });
    },
  });
}
