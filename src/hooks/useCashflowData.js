import { useState, useEffect, useCallback, useRef } from 'react';
import { cashflowService } from '../services/cashflowService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar dados de fluxo de caixa
 * 
 * @param {string} unitId - ID da unidade
 * @param {string} startDate - Data de início (ISO string)
 * @param {string} endDate - Data de fim (ISO string)
 * @param {string} accountId - ID da conta (opcional)
 * @returns {Object} { entries, summary, loading, error, refetch, refreshSummary }
 */
export const useCashflowData = (unitId, startDate, endDate, accountId = null) => {
  const [state, setState] = useState({
    entries: [],
    summary: null,
    loading: true,
    error: null
  });

  const { addToast } = useToast();
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Função para gerar chave de cache
  const getCacheKey = useCallback((type, unitId, startDate, endDate, accountId) => {
    return `cashflow_${type}_${unitId}_${startDate}_${endDate}_${accountId || 'all'}`;
  }, []);

  // Função para buscar entries do fluxo de caixa
  const fetchCashflowEntries = useCallback(async () => {
    if (!unitId || !startDate || !endDate) {
      return { data: [], error: null };
    }

    const cacheKey = getCacheKey('entries', unitId, startDate, endDate, accountId);
    
    // Verificar cache (TTL: 60 segundos para entries)
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 60000) {
      return { data: cachedData.data, error: null };
    }

    try {
      const { data, error } = await cashflowService.getCashflowEntries(
        unitId, 
        startDate, 
        endDate, 
        accountId
      );

      if (error) throw error;

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data: data || [],
        timestamp: Date.now()
      });

      return { data: data || [], error: null };

    } catch (err) {
      return { data: [], error: err };
    }
  }, [unitId, startDate, endDate, accountId, getCacheKey]);

  // Função para buscar summary do fluxo de caixa
  const fetchCashflowSummary = useCallback(async () => {
    if (!unitId || !startDate || !endDate) {
      return { data: null, error: null };
    }

    const period = `${startDate}_${endDate}`;
    const cacheKey = getCacheKey('summary', unitId, period, '', accountId);
    
    // Verificar cache (TTL: 120 segundos para summary)
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 120000) {
      return { data: cachedData.data, error: null };
    }

    try {
      const { data, error } = await cashflowService.getCashflowSummary(
        unitId, 
        period,
        accountId
      );

      if (error) throw error;

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data: data || null,
        timestamp: Date.now()
      });

      return { data: data || null, error: null };

    } catch (err) {
      return { data: null, error: err };
    }
  }, [unitId, startDate, endDate, accountId, getCacheKey]);

  // Função principal para buscar todos os dados
  const fetchData = useCallback(async (showLoading = true) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      // Buscar entries e summary em paralelo
      const [entriesResult, summaryResult] = await Promise.all([
        fetchCashflowEntries(),
        fetchCashflowSummary()
      ]);

      // Verificar se houve erros
      if (entriesResult.error || summaryResult.error) {
        const error = entriesResult.error || summaryResult.error;
        throw error;
      }

      setState(prev => ({
        ...prev,
        entries: entriesResult.data,
        summary: summaryResult.data,
        loading: false,
        error: null
      }));

    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Erro ao carregar dados do fluxo de caixa'
        }));
        
        addToast({
          type: 'error',
          title: 'Erro ao carregar fluxo de caixa',
          message: 'Não foi possível carregar os dados do fluxo de caixa'
        });
      }
    }
  }, [fetchCashflowEntries, fetchCashflowSummary, addToast]);

  // Função para refresh apenas do summary (útil após operações)
  const refreshSummary = useCallback(async () => {
    try {
      // Limpar cache do summary
      const period = `${startDate}_${endDate}`;
      const cacheKey = getCacheKey('summary', unitId, period, '', accountId);
      cacheRef.current.delete(cacheKey);

      const summaryResult = await fetchCashflowSummary();
      
      if (summaryResult.error) throw summaryResult.error;

      setState(prev => ({
        ...prev,
        summary: summaryResult.data
      }));

      return { success: true };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar resumo',
        message: 'Não foi possível atualizar o resumo do fluxo de caixa'
      });
      
      return { success: false, error: err.message };
    }
  }, [startDate, endDate, unitId, accountId, getCacheKey, fetchCashflowSummary, addToast]);

  // Função para refetch (limpa cache)
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchData();
  }, [fetchData]);

  // Effect para buscar dados quando parâmetros mudarem
  useEffect(() => {
    fetchData();
    
    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Cleanup do cache quando componente for desmontado
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    entries: state.entries,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    refetch,
    refreshSummary
  };
};

export default useCashflowData;