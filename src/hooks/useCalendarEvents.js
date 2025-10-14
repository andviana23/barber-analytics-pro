import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarService } from '../services/calendarService';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook para gerenciar eventos do calendário financeiro
 * 
 * @param {string} unitId - ID da unidade
 * @param {string} startDate - Data de início (ISO string)
 * @param {string} endDate - Data de fim (ISO string) 
 * @param {Object} filters - Filtros aplicados { accountId, tipo, status }
 * @returns {Object} { events, loading, error, refetch, updateEventStatus }
 */
export const useCalendarEvents = (unitId, startDate, endDate, filters = {}) => {
  const [state, setState] = useState({
    events: [],
    loading: true,
    error: null
  });

  const { addToast } = useToast();
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Função para gerar chave de cache
  const getCacheKey = useCallback((unitId, startDate, endDate, filters) => {
    return `calendar_events_${unitId}_${startDate}_${endDate}_${JSON.stringify(filters)}`;
  }, []);

  // Função para buscar eventos
  const fetchEvents = useCallback(async (showLoading = true) => {
    if (!unitId || !startDate || !endDate) {
      setState(prev => ({ ...prev, events: [], loading: false }));
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const cacheKey = getCacheKey(unitId, startDate, endDate, filters);

    // Verificar cache (TTL: 30 segundos)
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < 30000) {
      setState(prev => ({
        ...prev,
        events: cachedData.data,
        loading: false,
        error: null
      }));
      return;
    }

    if (showLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const { data, error } = await calendarService.getCalendarEvents(
        unitId, 
        startDate, 
        endDate, 
        filters
      );

      if (error) throw error;

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        events: data || [],
        loading: false,
        error: null
      }));

    } catch (err) {
      if (err.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Erro ao carregar eventos'
        }));
        
        addToast({
          type: 'error',
          title: 'Erro ao carregar eventos',
          message: 'Não foi possível carregar os eventos do calendário'
        });
      }
    }
  }, [unitId, startDate, endDate, filters, getCacheKey, addToast]);

  // Função para atualizar status de um evento
  const updateEventStatus = useCallback(async (eventId, status) => {
    try {
      const { error } = await calendarService.updateEventStatus(eventId, status);
      
      if (error) throw error;

      // Atualizar evento no estado local
      setState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === eventId 
            ? { ...event, status }
            : event
        )
      }));

      // Limpar cache para forçar recarregamento
      cacheRef.current.clear();

      addToast({
        type: 'success',
        title: 'Status atualizado',
        message: 'Status do evento atualizado com sucesso'
      });

      return { success: true };

    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar status',
        message: err.message || 'Não foi possível atualizar o status'
      });
      
      return { success: false, error: err.message };
    }
  }, [addToast]);

  // Função para refetch (limpa cache)
  const refetch = useCallback(() => {
    cacheRef.current.clear();
    fetchEvents();
  }, [fetchEvents]);

  // Effect para buscar eventos quando parâmetros mudarem
  useEffect(() => {
    fetchEvents();
    
    // Cleanup na desmontagem
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEvents]);

  // Cleanup do cache quando componente for desmontado
  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      cache.clear();
    };
  }, []);

  return {
    events: state.events,
    loading: state.loading,
    error: state.error,
    refetch,
    updateEventStatus
  };
};

export default useCalendarEvents;