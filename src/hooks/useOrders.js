/**
 * @file useOrders.js
 * @description Hook para gerenciar comandas
 * @module Hooks
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import orderService from '../services/orderService';
import { supabase } from '../services/supabase';
import useUserPermissions from './useUserPermissions';
import { filterOrdersByPermission } from '../utils/permissions';

/**
 * Hook para gestão de comandas
 *
 * @param {string} unitId - ID da unidade
 * @param {boolean} enableRealtime - Habilitar subscriptions real-time
 * @returns {Object}
 */
const useOrders = (unitId, enableRealtime = true) => {
  const {
    user,
    canCreateOrder,
    canViewAllOrders,
    canCloseOrder,
    canCancelOrder,
  } = useUserPermissions();

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  // Ref para controlar subscription
  const subscriptionRef = useRef(null);

  /**
   * Lista comandas com filtros
   */
  const fetchOrders = useCallback(
    async (filters = {}) => {
      if (!unitId) return;

      setLoading(true);
      setError(null);

      const {
        data,
        error: err,
        count: total,
      } = await orderService.listOrders(unitId, filters);

      if (err) {
        setError(err.message);
        setOrders([]);
      } else {
        // Filtra comandas baseado nas permissões
        const filteredOrders = filterOrdersByPermission(data || [], user);
        setOrders(filteredOrders);
        setCount(total || 0);
      }

      setLoading(false);
    },
    [unitId, user]
  );

  /**
   * Busca detalhes de uma comanda
   */
  const fetchOrderDetails = useCallback(async orderId => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await orderService.getOrderDetails(orderId);

    if (err) {
      setError(err.message);
      setCurrentOrder(null);
    } else {
      setCurrentOrder(data);
    }

    setLoading(false);
    return { data, error: err };
  }, []);

  /**
   * Cria uma nova comanda
   */
  const createOrder = useCallback(
    async data => {
      if (!canCreateOrder) {
        setError('Você não tem permissão para criar comandas');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await orderService.createOrder({
        ...data,
        unitId,
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza lista
        await fetchOrders();
      }

      setLoading(false);
      return result;
    },
    [unitId, canCreateOrder, fetchOrders]
  );

  /**
   * Adiciona serviço à comanda
   */
  const addServiceToOrder = useCallback(
    async (orderId, serviceData) => {
      setLoading(true);
      setError(null);

      const result = await orderService.addServiceToOrder(orderId, serviceData);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza detalhes da comanda
        await fetchOrderDetails(orderId);
      }

      setLoading(false);
      return result;
    },
    [fetchOrderDetails]
  );

  /**
   * Remove serviço da comanda
   */
  const removeServiceFromOrder = useCallback(
    async (itemId, orderId) => {
      setLoading(true);
      setError(null);

      const result = await orderService.removeServiceFromOrder(itemId);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza detalhes da comanda
        if (orderId) {
          await fetchOrderDetails(orderId);
        }
      }

      setLoading(false);
      return result;
    },
    [fetchOrderDetails]
  );

  /**
   * Fecha uma comanda
   */
  const closeOrder = useCallback(
    async (orderId, data) => {
      if (!canCloseOrder) {
        setError('Você não tem permissão para fechar comandas');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await orderService.closeOrder(orderId, data);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza lista
        await fetchOrders();
      }

      setLoading(false);
      return result;
    },
    [canCloseOrder, fetchOrders]
  );

  /**
   * Cancela uma comanda
   */
  const cancelOrder = useCallback(
    async (orderId, reason) => {
      if (!canCancelOrder) {
        setError('Você não tem permissão para cancelar comandas');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await orderService.cancelOrder(orderId, reason);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza lista
        await fetchOrders();
      }

      setLoading(false);
      return result;
    },
    [canCancelOrder, fetchOrders]
  );

  /**
   * Calcula total de uma comanda
   */
  const calculateOrderTotal = useCallback(async orderId => {
    setLoading(true);
    setError(null);

    const result = await orderService.calculateOrderTotal(orderId);

    if (result.error) {
      setError(result.error.message);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Gera relatório de comissões
   */
  const generateCommissionReport = useCallback(
    async (professionalId, dateRange) => {
      setLoading(true);
      setError(null);

      const result = await orderService.generateCommissionReport(
        professionalId,
        dateRange
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
   * Configurar subscription do Realtime para comandas
   */
  useEffect(() => {
    if (!enableRealtime || !unitId) return;

    const channelName = `orders_${unitId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          // Refetch orders quando houver mudanças
          fetchOrders();
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
  }, [enableRealtime, unitId, fetchOrders]);

  return {
    // Estado
    orders,
    currentOrder,
    loading,
    error,
    count,

    // Ações
    createOrder,
    fetchOrders,
    fetchOrderDetails,
    addServiceToOrder,
    removeServiceFromOrder,
    closeOrder,
    cancelOrder,
    calculateOrderTotal,
    generateCommissionReport,

    // Helpers
    canCreate: canCreateOrder,
    canViewAll: canViewAllOrders,
    canClose: canCloseOrder,
    canCancel: canCancelOrder,
  };
};

export default useOrders;
