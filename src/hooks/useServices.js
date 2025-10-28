/**
 * @file useServices.js
 * @description Hook para gerenciar serviços
 * @module Hooks
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import serviceService from '../services/serviceService';
import { supabase } from '../services/supabase';
import useUserPermissions from './useUserPermissions';

/**
 * Hook para gestão de serviços
 *
 * @param {string} unitId - ID da unidade
 * @param {boolean} enableRealtime - Habilitar subscriptions real-time
 * @returns {Object}
 */
const useServices = (unitId, enableRealtime = true) => {
  const { user, canManageServices } = useUserPermissions();

  const [services, setServices] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [currentService, setCurrentService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref para controlar subscription
  const subscriptionRef = useRef(null);

  /**
   * Lista todos os serviços
   */
  const fetchServices = useCallback(
    async (filters = {}) => {
      if (!unitId) return;

      setLoading(true);
      setError(null);

      const { data, error: err } = await serviceService.listServices(
        unitId,
        filters
      );

      if (err) {
        setError(err.message);
        setServices([]);
      } else {
        setServices(data || []);
      }

      setLoading(false);
    },
    [unitId]
  );

  /**
   * Lista apenas serviços ativos (para dropdowns)
   */
  const fetchActiveServices = useCallback(async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);

    const { data, error: err } =
      await serviceService.listActiveServices(unitId);

    if (err) {
      setError(err.message);
      setActiveServices([]);
    } else {
      setActiveServices(data || []);
    }

    setLoading(false);
  }, [unitId]);

  /**
   * Busca detalhes de um serviço
   */
  const fetchServiceById = useCallback(async serviceId => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await serviceService.getServiceById(serviceId);

    if (err) {
      setError(err.message);
      setCurrentService(null);
    } else {
      setCurrentService(data);
    }

    setLoading(false);
    return { data, error: err };
  }, []);

  /**
   * Cria um novo serviço
   */
  const createService = useCallback(
    async data => {
      if (!canManageServices) {
        setError('Você não tem permissão para criar serviços');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await serviceService.createService(
        {
          ...data,
          unitId,
        },
        user
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza lista
        await fetchServices();
        await fetchActiveServices();
      }

      setLoading(false);
      return result;
    },
    [unitId, user, canManageServices, fetchServices, fetchActiveServices]
  );

  /**
   * Atualiza um serviço
   */
  const updateService = useCallback(
    async (serviceId, data) => {
      if (!canManageServices) {
        setError('Você não tem permissão para editar serviços');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await serviceService.updateService(serviceId, data, user);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza listas
        await fetchServices();
        await fetchActiveServices();
      }

      setLoading(false);
      return result;
    },
    [user, canManageServices, fetchServices, fetchActiveServices]
  );

  /**
   * Deleta (desativa) um serviço
   */
  const deleteService = useCallback(
    async serviceId => {
      if (!canManageServices) {
        setError('Você não tem permissão para deletar serviços');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await serviceService.deleteService(serviceId, user);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza listas
        await fetchServices();
        await fetchActiveServices();
      }

      setLoading(false);
      return result;
    },
    [user, canManageServices, fetchServices, fetchActiveServices]
  );

  /**
   * Reativa um serviço
   */
  const reactivateService = useCallback(
    async serviceId => {
      if (!canManageServices) {
        setError('Você não tem permissão para reativar serviços');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await serviceService.reactivateService(serviceId, user);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza listas
        await fetchServices();
        await fetchActiveServices();
      }

      setLoading(false);
      return result;
    },
    [user, canManageServices, fetchServices, fetchActiveServices]
  );

  /**
   * Calcula comissão de um serviço
   */
  const calculateServiceCommission = useCallback(
    async (serviceId, quantity = 1) => {
      setLoading(true);
      setError(null);

      const result = await serviceService.calculateServiceCommission(
        serviceId,
        quantity
      );

      if (result.error) {
        setError(result.error.message);
      }

      setLoading(false);
      return result;
    },
    []
  );

  /**
   * Busca serviços mais populares
   */
  const getPopularServices = useCallback(
    async (limit = 10) => {
      if (!unitId) return { data: null, error: null };

      setLoading(true);
      setError(null);

      const result = await serviceService.getPopularServices(unitId, limit);

      if (result.error) {
        setError(result.error.message);
      }

      setLoading(false);
      return result;
    },
    [unitId]
  );

  /**
   * Carrega serviços ativos ao montar
   */
  useEffect(() => {
    if (unitId) {
      fetchActiveServices();
    }
  }, [unitId, fetchActiveServices]);

  /**
   * Configurar subscription do Realtime para serviços
   */
  useEffect(() => {
    if (!enableRealtime || !unitId) return;

    const channelName = `services_${unitId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'services',
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          // Refetch serviços ativos quando houver mudanças
          fetchActiveServices();
          fetchServices();
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
  }, [enableRealtime, unitId, fetchActiveServices, fetchServices]);

  return {
    // Estado
    services,
    activeServices,
    currentService,
    loading,
    error,

    // Ações
    createService,
    updateService,
    deleteService,
    reactivateService,
    fetchServices,
    fetchActiveServices,
    fetchServiceById,
    calculateServiceCommission,
    getPopularServices,

    // Helpers
    canManage: canManageServices,
  };
};

export default useServices;
