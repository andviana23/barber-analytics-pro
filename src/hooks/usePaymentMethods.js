/**
 * Custom Hook: usePaymentMethods
 * 
 * Hook para gerenciar estado das formas de pagamento com suporte a:
 * - Cache com TTL (5 minutos)
 * - Realtime subscriptions do Supabase
 * - Loading states
 * - Error handling
 * - Refetch manual
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import paymentMethodsService from '../services/paymentMethodsService';

// Cache TTL: 5 minutos
const CACHE_TTL = 5 * 60 * 1000;

// Cache global para evitar múltiplas requisições
const cache = new Map();

/**
 * Hook para buscar formas de pagamento de uma unidade
 * 
 * @param {string} unitId - UUID da unidade
 * @param {Object} options - Opções do hook
 * @param {boolean} options.includeInactive - Incluir formas inativas
 * @param {boolean} options.enableRealtime - Habilitar atualizações em tempo real
 * @param {boolean} options.enableCache - Habilitar cache
 * @returns {Object} Estado das formas de pagamento
 */
export const usePaymentMethods = (unitId, options = {}) => {
  const {
    includeInactive = false,
    enableRealtime = true,
    enableCache = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Ref para subscription do realtime
  const subscriptionRef = useRef(null);
  
  // Ref para controlar se o componente está montado
  const isMountedRef = useRef(true);
  
  // Ref para armazenar última versão dos parâmetros
  const paramsRef = useRef({ unitId, includeInactive, enableCache });
  
  // Atualizar refs quando parâmetros mudarem e resetar loading imediatamente
  useEffect(() => {
    paramsRef.current = { unitId, includeInactive, enableCache };
    
    // Reset loading quando unitId ou includeInactive mudar para feedback rápido
    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }
  }, [unitId, includeInactive, enableCache]);

  /**
   * Buscar formas de pagamento
   * IMPORTANTE: Não tem dependências para evitar loop infinito
   */
  const fetchPaymentMethods = useCallback(async (forceRefresh = false) => {
    try {
      // Usar refs para pegar valores atuais sem causar re-render
      const { unitId: currentUnitId, includeInactive: currentIncludeInactive, enableCache: currentEnableCache } = paramsRef.current;
      
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Chave do cache
      const cacheKey = `payment_methods_${currentUnitId}_${currentIncludeInactive}`;

      // Verificar cache
      if (currentEnableCache && !forceRefresh) {
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          if (isMountedRef.current) {
            setData(cached.data);
            setStats(cached.stats);
            setLoading(false);
          }
          return;
        }
      }

      // Buscar dados do serviço
      const { data: paymentMethods, error: fetchError } = await paymentMethodsService.getPaymentMethods(
        currentUnitId,
        currentIncludeInactive
      );

      if (fetchError) {
        throw fetchError;
      }

      // Calcular estatísticas
      const { data: statsData } = await paymentMethodsService.getPaymentMethodsStats(currentUnitId);

      if (isMountedRef.current) {
        setData(paymentMethods || []);
        setStats(statsData || null);

        // Atualizar cache
        if (currentEnableCache) {
          cache.set(cacheKey, {
            data: paymentMethods || [],
            stats: statsData || null,
            timestamp: Date.now()
          });
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar formas de pagamento:', err);
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // ✅ SEM dependências!

  /**
   * Configurar subscription do Realtime
   */
  useEffect(() => {
    if (!enableRealtime) return;

    // Criar subscription
    const channelName = unitId ? `payment_methods_${unitId}` : 'payment_methods_all';
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'payment_methods',
          // Se unitId existe, filtrar por ele; senão, escutar todas as mudanças
          ...(unitId ? { filter: `unit_id=eq.${unitId}` } : {})
        },
        () => {
          // Forçar refetch ao receber mudanças
          fetchPaymentMethods(true);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [enableRealtime, unitId, fetchPaymentMethods]);

  /**
   * Fetch inicial e quando parâmetros mudarem
   */
  useEffect(() => {
    // Garantir que isMountedRef está true no início
    isMountedRef.current = true;
    
    fetchPaymentMethods();
    
    // Cleanup apenas quando componente desmontar (não quando parâmetros mudam)
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, includeInactive]); // Dispara quando parâmetros mudam

  /**
   * Refetch manual
   */
  const refetch = useCallback(() => {
    return fetchPaymentMethods(true);
  }, [fetchPaymentMethods]);

  /**
   * Criar nova forma de pagamento
   */
  const createPaymentMethod = useCallback(async (paymentMethodData) => {
    try {
      setError(null);
      
      const { unitId: currentUnitId } = paramsRef.current;
      
      // Priorizar unit_id do paymentMethodData (do modal), fallback para unitId do hook
      const { data: newPaymentMethod, error: createError } = await paymentMethodsService.createPaymentMethod({
        ...paymentMethodData,
        unit_id: paymentMethodData.unit_id || currentUnitId
      });

      if (createError) {
        throw createError;
      }

      // Invalidar cache e refetch
      const { includeInactive: currentIncludeInactive } = paramsRef.current;
      const cacheKey = `payment_methods_${currentUnitId}_${currentIncludeInactive}`;
      cache.delete(cacheKey);
      await fetchPaymentMethods(true);

      return { data: newPaymentMethod, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar forma de pagamento:', err);
      setError(err);
      return { data: null, error: err };
    }
  }, [fetchPaymentMethods]);

  /**
   * Atualizar forma de pagamento
   */
  const updatePaymentMethod = useCallback(async (id, updates) => {
    try {
      setError(null);
      
      const { data: updatedPaymentMethod, error: updateError } = await paymentMethodsService.updatePaymentMethod(
        id,
        updates
      );

      if (updateError) {
        throw updateError;
      }

      // Invalidar cache e refetch
      const { unitId: currentUnitId, includeInactive: currentIncludeInactive } = paramsRef.current;
      const cacheKey = `payment_methods_${currentUnitId}_${currentIncludeInactive}`;
      cache.delete(cacheKey);
      await fetchPaymentMethods(true);

      return { data: updatedPaymentMethod, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar forma de pagamento:', err);
      setError(err);
      return { data: null, error: err };
    }
  }, [fetchPaymentMethods]);

  /**
   * Deletar (soft delete) forma de pagamento
   */
  const deletePaymentMethod = useCallback(async (id) => {
    try {
      setError(null);
      
      const { data: deletedPaymentMethod, error: deleteError } = await paymentMethodsService.deletePaymentMethod(id);

      if (deleteError) {
        throw deleteError;
      }

      // Invalidar cache e refetch
      const { unitId: currentUnitId, includeInactive: currentIncludeInactive } = paramsRef.current;
      const cacheKey = `payment_methods_${currentUnitId}_${currentIncludeInactive}`;
      cache.delete(cacheKey);
      await fetchPaymentMethods(true);

      return { data: deletedPaymentMethod, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao deletar forma de pagamento:', err);
      setError(err);
      return { data: null, error: err };
    }
  }, [fetchPaymentMethods]);

  /**
   * Ativar forma de pagamento
   */
  const activatePaymentMethod = useCallback(async (id) => {
    try {
      setError(null);
      
      const { data: activatedPaymentMethod, error: activateError } = await paymentMethodsService.activatePaymentMethod(id);

      if (activateError) {
        throw activateError;
      }

      // Invalidar cache e refetch
      const { unitId: currentUnitId, includeInactive: currentIncludeInactive } = paramsRef.current;
      const cacheKey = `payment_methods_${currentUnitId}_${currentIncludeInactive}`;
      cache.delete(cacheKey);
      await fetchPaymentMethods(true);

      return { data: activatedPaymentMethod, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao ativar forma de pagamento:', err);
      setError(err);
      return { data: null, error: err };
    }
  }, [fetchPaymentMethods]);

  return {
    data,
    loading,
    error,
    stats,
    refetch,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    activatePaymentMethod
  };
};

export default usePaymentMethods;
