import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { reconciliationService } from '../services/reconciliationService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar matches de conciliação bancária
 * 
 * @param {string} accountId - ID da conta bancária
 * @param {Object} options - Opções do auto-matching { tolerance, windowDays, confidenceThreshold }
 * @returns {Object} { matches, loading, error, refetch, confirmMatch, rejectMatch, adjustMatch, runAutoMatch }
 */
export const useReconciliationMatches = (accountId, options = {}) => {
  const defaultOptions = useMemo(() => ({
    tolerance: 0.05, // 5%
    windowDays: 2,
    confidenceThreshold: 0.5,
    ...options
  }), [options]);

  const [state, setState] = useState({
    matches: [],
    loading: true,
    error: null
  });

  // Proteção contra ausência de ToastContext
  const toast = useToast();
  const safeAddToast = useCallback((toastData) => {
    if (toast?.addToast) {
      toast.addToast(toastData);
    }
  }, [toast]);

  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Função para gerar chave de cache
  const getCacheKey = useCallback((accountId, options) => {
    return `reconciliation_matches_${accountId}_${JSON.stringify(options)}`;
  }, []);

  // Função para buscar matches existentes
  const fetchMatches = useCallback(async (showLoading = true) => {
    if (!accountId) {
      setState(prev => ({ ...prev, matches: [], loading: false }));
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const cacheKey = getCacheKey(accountId, defaultOptions);

    // Verificar cache (TTL: 30 segundos)
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      setState(prev => ({
        ...prev,
        matches: cachedData.data,
        loading: false,
        error: null
      }));
      return;
    }

    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const { data, error } = await reconciliationService.getMatches(accountId);

      if (error) throw error;

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        matches: data || [],
        loading: false,
        error: null
      }));

    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Erro ao carregar matches'
        }));
        
        safeAddToast({
          type: 'error',
          title: 'Erro ao carregar matches',
          message: 'Não foi possível carregar os matches de conciliação'
        });
      }
    }
  }, [accountId, defaultOptions, getCacheKey, safeAddToast]);

  // Função para executar auto-matching
  const runAutoMatch = useCallback(async () => {
    if (!accountId) return { success: false, error: 'Account ID é obrigatório' };

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { data, error } = await reconciliationService.autoMatch(accountId, defaultOptions);

      if (error) throw error;

      // Limpar cache para forçar recarregamento
      cacheRef.current.clear();

      setState(prev => ({
        ...prev,
        matches: data || [],
        loading: false
      }));

      safeAddToast({
        type: 'success',
        title: 'Auto-matching concluído',
        message: `${data?.length || 0} matches encontrados`
      });

      return { success: true, data };

    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));

      safeAddToast({
        type: 'error',
        title: 'Erro no auto-matching',
        message: err.message || 'Não foi possível executar o auto-matching'
      });

      return { success: false, error: err.message };
    }
  }, [accountId, defaultOptions, safeAddToast]);

  // Função para confirmar um match
  const confirmMatch = useCallback(async (matchId, adjustmentData = null) => {
    try {
      const { error } = await reconciliationService.confirmReconciliation(matchId, adjustmentData);
      
      if (error) throw error;

      // Remover match confirmado do estado local
      setState(prev => ({
        ...prev,
        matches: prev.matches.filter(match => match.id !== matchId)
      }));

      // Limpar cache para garantir sincronização
      cacheRef.current.clear();

      safeAddToast({
        type: 'success',
        title: 'Match confirmado',
        message: 'Conciliação confirmada com sucesso'
      });

      return { success: true };

    } catch (err) {
      safeAddToast({
        type: 'error',
        title: 'Erro ao confirmar match',
        message: err.message || 'Não foi possível confirmar o match'
      });
      
      return { success: false, error: err.message };
    }
  }, [safeAddToast]);

  // Função para rejeitar um match
  const rejectMatch = useCallback(async (matchId, reason = '') => {
    try {
      const { error } = await reconciliationService.rejectReconciliation(matchId, reason);
      
      if (error) throw error;

      // Remover match rejeitado do estado local
      setState(prev => ({
        ...prev,
        matches: prev.matches.filter(match => match.id !== matchId)
      }));

      safeAddToast({
        type: 'info',
        title: 'Match rejeitado',
        message: 'Match rejeitado com sucesso'
      });

      return { success: true };

    } catch (err) {
      safeAddToast({
        type: 'error',
        title: 'Erro ao rejeitar match',
        message: err.message || 'Não foi possível rejeitar o match'
      });
      
      return { success: false, error: err.message };
    }
  }, [safeAddToast]);

  // Função para ajustar um match (criar vinculação manual)
  const adjustMatch = useCallback(async (statementId, transactionType, transactionId, adjustmentData) => {
    try {
      const { error } = await reconciliationService.manualLink(
        statementId, 
        transactionType, 
        transactionId, 
        adjustmentData
      );
      
      if (error) throw error;

      // Limpar cache e recarregar matches
      cacheRef.current.clear();
      await fetchMatches(false);

      safeAddToast({
        type: 'success',
        title: 'Vinculação manual criada',
        message: 'Vinculação manual criada com sucesso'
      });

      return { success: true };

    } catch (err) {
      safeAddToast({
        type: 'error',
        title: 'Erro na vinculação manual',
        message: err.message || 'Não foi possível criar a vinculação manual'
      });
      
      return { success: false, error: err.message };
    }
  }, [safeAddToast, fetchMatches]);

  // Função para refetch (limpa cache)
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchMatches();
  }, [fetchMatches]);

  // Effect para buscar matches quando parâmetros mudarem
  useEffect(() => {
    fetchMatches();
    
    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [accountId, JSON.stringify(defaultOptions)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup do cache quando componente for desmontado
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    matches: state.matches,
    loading: state.loading,
    error: state.error,
    refetch,
    runAutoMatch,
    confirmMatch,
    rejectMatch,
    adjustMatch
  };
};

export default useReconciliationMatches;