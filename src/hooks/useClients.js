import { useState, useEffect, useCallback, useRef } from 'react';
import { partiesService } from '../services/partiesService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar clientes
 *
 * @param {string} unitId - ID da unidade
 * @param {Object} options - Opções do hook
 * @param {boolean} options.includeInactive - Incluir clientes inativos
 * @param {boolean} options.enableCache - Habilitar cache
 * @returns {Object} Estado e funções para gerenciar clientes
 */
export const useClients = (unitId, options = {}) => {
  const { includeInactive = false, enableCache = true } = options;

  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null,
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const toast = useToast();
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Safe toast function
  const safeShowToast = useCallback(
    (type, title, message) => {
      if (toast?.showToast) {
        toast.showToast({ type, title, message });
      }
    },
    [toast]
  );

  // Gerar chave de cache
  const getCacheKey = useCallback(
    (unitId, includeInactive) => `clients_${unitId}_${includeInactive}`,
    []
  );

  // Buscar clientes
  const fetchClients = useCallback(
    async (showLoading = true) => {
      if (!unitId) {
        setState({ data: [], loading: false, error: null });
        return;
      }

      // Cancelar requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const cacheKey = getCacheKey(unitId, includeInactive);

      // Verificar cache (TTL: 30 segundos)
      if (enableCache) {
        const cachedData = cacheRef.current.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 30000) {
          setState({
            data: cachedData.data,
            loading: false,
            error: null,
          });
          calculateStats(cachedData.data);
          return;
        }
      }

      if (showLoading) {
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      try {
        const { data, error } = await partiesService.getParties({
          unitId,
          tipo: 'Cliente',
          isActive: !includeInactive,
        });

        if (error) throw new Error(error);

        // Armazenar no cache
        if (enableCache) {
          cacheRef.current.set(cacheKey, {
            data: data || [],
            timestamp: Date.now(),
          });
        }

        setState({
          data: data || [],
          loading: false,
          error: null,
        });

        calculateStats(data || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState(prev => ({
            ...prev,
            loading: false,
            error: err.message || 'Erro ao carregar clientes',
          }));

          safeShowToast(
            'error',
            'Erro ao carregar clientes',
            'Não foi possível carregar a lista de clientes'
          );
        }
      }
    },
    [unitId, includeInactive, enableCache, getCacheKey, safeShowToast]
  );

  // Calcular estatísticas
  const calculateStats = useCallback(data => {
    const total = data.length;
    const active = data.filter(client => client.is_active).length;
    const inactive = total - active;

    setStats({ total, active, inactive });
  }, []);

  // Criar cliente
  const createClient = useCallback(
    async clientData => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const { data, error } = await partiesService.createParty({
          ...clientData,
          unit_id: unitId,
          tipo: 'Cliente',
        });

        if (error) throw new Error(error);

        // Limpar cache
        cacheRef.current.clear();

        // Recarregar lista
        await fetchClients(false);

        safeShowToast(
          'success',
          'Cliente criado',
          'Cliente cadastrado com sucesso'
        );

        return { success: true, data };
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));

        safeShowToast(
          'error',
          'Erro ao criar cliente',
          err.message || 'Não foi possível cadastrar o cliente'
        );

        return { success: false, error: err.message };
      }
    },
    [unitId, fetchClients, safeShowToast]
  );

  // Atualizar cliente
  const updateClient = useCallback(
    async (id, updateData) => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const { data, error } = await partiesService.updateParty(
          id,
          updateData
        );

        if (error) throw new Error(error);

        // Limpar cache
        cacheRef.current.clear();

        // Recarregar lista
        await fetchClients(false);

        safeShowToast(
          'success',
          'Cliente atualizado',
          'Dados do cliente atualizados com sucesso'
        );

        return { success: true, data };
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));

        safeShowToast(
          'error',
          'Erro ao atualizar cliente',
          err.message || 'Não foi possível atualizar o cliente'
        );

        return { success: false, error: err.message };
      }
    },
    [fetchClients, safeShowToast]
  );

  // Desativar cliente
  const deleteClient = useCallback(
    async id => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const { error } = await partiesService.deleteParty(id);

        if (error) throw new Error(error);

        // Limpar cache
        cacheRef.current.clear();

        // Recarregar lista
        await fetchClients(false);

        safeShowToast(
          'success',
          'Cliente desativado',
          'Cliente desativado com sucesso'
        );

        return { success: true };
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));

        safeShowToast(
          'error',
          'Erro ao desativar cliente',
          err.message || 'Não foi possível desativar o cliente'
        );

        return { success: false, error: err.message };
      }
    },
    [fetchClients, safeShowToast]
  );

  // Reativar cliente
  const activateClient = useCallback(
    async id => {
      try {
        setState(prev => ({ ...prev, loading: true }));

        const { data, error } = await partiesService.reactivateParty(id);

        if (error) throw new Error(error);

        // Limpar cache
        cacheRef.current.clear();

        // Recarregar lista
        await fetchClients(false);

        safeShowToast(
          'success',
          'Cliente reativado',
          'Cliente reativado com sucesso'
        );

        return { success: true, data };
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));

        safeShowToast(
          'error',
          'Erro ao reativar cliente',
          err.message || 'Não foi possível reativar o cliente'
        );

        return { success: false, error: err.message };
      }
    },
    [fetchClients, safeShowToast]
  );

  // Effect para buscar clientes quando unitId mudar
  useEffect(() => {
    fetchClients();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchClients]);

  // Cleanup do cache
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    stats,
    createClient,
    updateClient,
    deleteClient,
    activateClient,
    refetch: fetchClients,
  };
};

export default useClients;
