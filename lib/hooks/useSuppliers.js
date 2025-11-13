/**
 * useSuppliers Hook
 * @module lib/hooks/useSuppliers
 * @description Custom hook para gerenciar fornecedores com TanStack Query
 * @author Andrey Viana
 * @version 1.0.0
 * @date 2025-11-13
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import { toast } from 'sonner';

/**
 * Hook principal para gerenciar fornecedores
 * @param {Object} options - Opções de configuração
 * @param {string} options.unitId - ID da unidade (obrigatório)
 * @param {Object} options.filters - Filtros de busca
 * @param {string} options.filters.status - Status do fornecedor (ATIVO, INATIVO, BLOQUEADO)
 * @param {string} options.filters.search - Busca por nome ou CNPJ/CPF
 * @param {number} options.filters.offset - Offset para paginação
 * @param {number} options.filters.limit - Limite de resultados
 * @param {boolean} options.enabled - Se deve buscar automaticamente (padrão: true)
 * @param {number} options.refetchInterval - Intervalo de refetch em ms (padrão: 30000)
 * @returns {Object} Estado e funções para gerenciar fornecedores
 */
export function useSuppliers({
  unitId,
  filters = {},
  enabled = true,
  refetchInterval = 30000,
} = {}) {
  // Query para listar fornecedores
  const {
    data: suppliersData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['suppliers', unitId, filters],
    queryFn: async () => {
      const result = await supplierService.listSuppliers(unitId, filters);
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: enabled && !!unitId,
    staleTime: 5000, // 5s
    refetchInterval,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000,
  });

  const suppliers = suppliersData?.data || [];
  const totalCount = suppliersData?.totalCount || 0;

  // Calcular informações de paginação
  const currentOffset = filters.offset || 0;
  const currentLimit = filters.limit || 50;
  const currentPage = Math.floor(currentOffset / currentLimit) + 1;
  const totalPages = Math.ceil(totalCount / currentLimit);
  const hasMore = currentOffset + currentLimit < totalCount;
  const hasPrevious = currentOffset > 0;

  return {
    suppliers,
    totalCount,
    isLoading,
    isFetching,
    error,
    refetch,
    pagination: {
      currentPage,
      totalPages,
      hasMore,
      hasPrevious,
      offset: currentOffset,
      limit: currentLimit,
    },
  };
}

/**
 * Hook para buscar um fornecedor específico
 * @param {string} supplierId - ID do fornecedor
 * @param {string} unitId - ID da unidade
 * @param {boolean} enabled - Se deve buscar automaticamente
 * @returns {Object} Estado do fornecedor
 */
export function useSupplier(supplierId, unitId, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => {
      const result = await supplierService.getSupplier(supplierId, unitId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!supplierId && !!unitId,
    staleTime: 10000, // 10s
    retry: 2,
  });

  return {
    supplier: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar fornecedores ativos (dropdown)
 * @param {string} unitId - ID da unidade
 * @param {boolean} enabled - Se deve buscar automaticamente
 * @returns {Object} Lista de fornecedores ativos
 */
export function useActiveSuppliers(unitId, enabled = true) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', 'active', unitId],
    queryFn: async () => {
      const result = await supplierService.getActiveSuppliers(unitId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!unitId,
    staleTime: 60000, // 1min (lista simples, não muda muito)
  });

  return {
    activeSuppliers: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook para buscar histórico de compras do fornecedor
 * @param {string} supplierId - ID do fornecedor
 * @param {number} limit - Limite de resultados
 * @param {boolean} enabled - Se deve buscar automaticamente
 * @returns {Object} Histórico de compras
 */
export function usePurchaseHistory(supplierId, limit = 10, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-purchases', supplierId, limit],
    queryFn: async () => {
      const result = await supplierService.getPurchaseHistory(
        supplierId,
        limit
      );
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!supplierId,
    staleTime: 30000, // 30s
  });

  return {
    purchases: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para criar fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para criar fornecedor
 */
export function useCreateSupplier({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, user }) => {
      const result = await supplierService.createSupplier(data, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: data => {
      // Invalidar lista de fornecedores
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor criado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao criar fornecedor: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para atualizar fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para atualizar fornecedor
 */
export function useUpdateSupplier({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data, user }) => {
      const result = await supplierService.updateSupplier(id, data, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar lista E fornecedor específico
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      toast.success('Fornecedor atualizado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao atualizar fornecedor: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para deletar/arquivar fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para deletar fornecedor
 */
export function useDeleteSupplier({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user }) => {
      const result = await supplierService.deleteSupplier(id, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Update otimista: remover da lista
      queryClient.setQueryData(['suppliers'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter(s => s.id !== variables.id),
          totalCount: oldData.totalCount - 1,
        };
      });

      // Invalidar depois para refetch real
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fornecedor arquivado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao arquivar fornecedor: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para mudar status do fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para mudar status
 */
export function useChangeSupplierStatus({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newStatus, user }) => {
      const result = await supplierService.changeStatus(id, newStatus, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Update otimista: atualizar status na lista
      queryClient.setQueryData(['suppliers'], oldData => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map(s =>
            s.id === variables.id ? { ...s, status: variables.newStatus } : s
          ),
        };
      });

      // Invalidar lista e fornecedor específico
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', variables.id] });
      toast.success('Status alterado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao alterar status: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para adicionar contato ao fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para adicionar contato
 */
export function useAddSupplierContact({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, data, user }) => {
      const result = await supplierService.addContact(supplierId, data, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar fornecedor específico (vai buscar com contatos atualizados)
      queryClient.invalidateQueries({
        queryKey: ['supplier', variables.supplierId],
      });
      toast.success('Contato adicionado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao adicionar contato: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para atualizar contato do fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para atualizar contato
 */
export function useUpdateSupplierContact({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, data, user }) => {
      const result = await supplierService.updateContact(contactId, data, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: data => {
      // Invalidar todos os fornecedores (não sabemos qual é o dono do contato)
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
      toast.success('Contato atualizado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao atualizar contato: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para deletar contato do fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para deletar contato
 */
export function useDeleteSupplierContact({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, user }) => {
      const result = await supplierService.deleteContact(contactId, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: data => {
      // Invalidar todos os fornecedores
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
      toast.success('Contato removido com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao remover contato: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para adicionar arquivo ao fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para adicionar arquivo
 */
export function useAddSupplierFile({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ supplierId, data, user }) => {
      const result = await supplierService.addFile(supplierId, data, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar fornecedor específico
      queryClient.invalidateQueries({
        queryKey: ['supplier', variables.supplierId],
      });
      toast.success('Arquivo adicionado com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao adicionar arquivo: ${error.message}`);
      onError?.(error);
    },
  });
}

/**
 * Hook para deletar arquivo do fornecedor
 * @param {Object} options - Opções de configuração
 * @returns {Object} Mutation para deletar arquivo
 */
export function useDeleteSupplierFile({ onSuccess, onError } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, user }) => {
      const result = await supplierService.deleteFile(fileId, user);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: data => {
      // Invalidar todos os fornecedores
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
      toast.success('Arquivo removido com sucesso!');
      onSuccess?.(data);
    },
    onError: error => {
      toast.error(`Erro ao remover arquivo: ${error.message}`);
      onError?.(error);
    },
  });
}
