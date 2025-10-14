import { useState, useEffect, useCallback, useRef } from 'react';
import { partiesService } from '../services/partiesService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar parties (clientes e fornecedores)
 * 
 * @param {string} unitId - ID da unidade
 * @param {string} tipo - Tipo de party ('Cliente', 'Fornecedor', 'All')
 * @returns {Object} { parties, loading, error, refetch, createParty, updateParty, deleteParty, getPartyById }
 */
export const useParties = (unitId, tipo = 'All') => {
  const [state, setState] = useState({
    parties: [],
    loading: true,
    error: null
  });

  const { addToast } = useToast();
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Função para gerar chave de cache
  const getCacheKey = useCallback((unitId, tipo) => {
    return `parties_${unitId}_${tipo}`;
  }, []);

  // Função para buscar parties
  const fetchParties = useCallback(async (showLoading = true) => {
    if (!unitId) {
      setState(prev => ({ ...prev, parties: [], loading: false }));
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const cacheKey = getCacheKey(unitId, tipo);

    // Verificar cache (TTL: 120 segundos)
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 120000) {
      setState(prev => ({
        ...prev,
        parties: cachedData.data,
        loading: false,
        error: null
      }));
      return;
    }

    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const tipoParam = tipo === 'All' ? null : tipo;
      const filters = { unitId };
      if (tipoParam) {
        filters.tipo = tipoParam;
      }

      const { data, error } = await partiesService.getParties(filters);

      if (error) throw error;

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        parties: data || [],
        loading: false,
        error: null
      }));

    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Erro ao carregar parties'
        }));
        
        addToast({
          type: 'error',
          title: 'Erro ao carregar parties',
          message: 'Não foi possível carregar clientes e fornecedores'
        });
      }
    }
  }, [unitId, tipo, getCacheKey, addToast]);

  // Função para buscar party por ID
  const getPartyById = useCallback(async (partyId) => {
    try {
      const { data, error } = await partiesService.getPartyById(partyId);
      
      if (error) throw error;

      return { success: true, data };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao buscar party',
        message: 'Não foi possível encontrar os dados do cliente/fornecedor'
      });
      
      return { success: false, error: err.message };
    }
  }, [addToast]);

  // Função para criar novo party
  const createParty = useCallback(async (partyData) => {
    try {
      const { data, error } = await partiesService.createParty({
        ...partyData,
        unit_id: unitId
      });
      
      if (error) throw error;

      // Adicionar novo party ao estado local
      setState(prev => ({
        ...prev,
        parties: [...prev.parties, data]
      }));

      // Limpar cache para forçar recarregamento em outras instâncias
      cacheRef.current.clear();

      addToast({
        type: 'success',
        title: 'Party criado',
        message: `${partyData.tipo} criado com sucesso`
      });

      return { success: true, data };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao criar party',
        message: err.message || 'Não foi possível criar o cliente/fornecedor'
      });
      
      return { success: false, error: err.message };
    }
  }, [unitId, addToast]);

  // Função para atualizar party
  const updateParty = useCallback(async (partyId, partyData) => {
    try {
      const { data, error } = await partiesService.updateParty(partyId, partyData);
      
      if (error) throw error;

      // Atualizar party no estado local
      setState(prev => ({
        ...prev,
        parties: prev.parties.map(party => 
          party.id === partyId ? { ...party, ...data } : party
        )
      }));

      // Limpar cache para forçar recarregamento
      cacheRef.current.clear();

      addToast({
        type: 'success',
        title: 'Party atualizado',
        message: 'Dados atualizados com sucesso'
      });

      return { success: true, data };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar party',
        message: err.message || 'Não foi possível atualizar os dados'
      });
      
      return { success: false, error: err.message };
    }
  }, [addToast]);

  // Função para deletar party (soft delete)
  const deleteParty = useCallback(async (partyId) => {
    try {
      const { error } = await partiesService.deleteParty(partyId);
      
      if (error) throw error;

      // Remover party do estado local
      setState(prev => ({
        ...prev,
        parties: prev.parties.filter(party => party.id !== partyId)
      }));

      // Limpar cache para forçar recarregamento
      cacheRef.current.clear();

      addToast({
        type: 'success',
        title: 'Party removido',
        message: 'Cliente/Fornecedor removido com sucesso'
      });

      return { success: true };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao remover party',
        message: err.message || 'Não foi possível remover o cliente/fornecedor'
      });
      
      return { success: false, error: err.message };
    }
  }, [addToast]);

  // Função para refetch (limpa cache)
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchParties();
  }, [fetchParties]);

  // Effect para buscar parties quando parâmetros mudarem
  useEffect(() => {
    fetchParties();
    
    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchParties]);

  // Cleanup do cache quando componente for desmontado
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    parties: state.parties,
    loading: state.loading,
    error: state.error,
    refetch,
    createParty,
    updateParty,
    deleteParty,
    getPartyById
  };
};

export default useParties;
