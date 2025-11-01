/**
 * @file useCashRegister.js
 * @description Hook para gerenciar caixa
 * @module Hooks
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import cashRegisterService from '../services/cashRegisterService';
import { supabase } from '../services/supabase';
import useUserPermissions from './useUserPermissions';

/**
 * Hook para gestão de caixa
 *
 * @param {string} unitId - ID da unidade
 * @param {boolean} enableRealtime - Habilitar subscriptions real-time
 * @returns {Object}
 */
const useCashRegister = (unitId, enableRealtime = true) => {
  const { user, canManageCashRegister } = useUserPermissions();

  const [activeCashRegister, setActiveCashRegister] = useState(null);
  const [cashRegisters, setCashRegisters] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]); // ✅ Adicionar estado para history
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  // Ref para controlar subscription
  const subscriptionRef = useRef(null);

  /**
   * Busca caixa aberto
   */
  const fetchActiveCashRegister = useCallback(async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);

    const { data, error: err } =
      await cashRegisterService.getActiveCashRegister(unitId);

    if (err) {
      setError(err.message);
      setActiveCashRegister(null);
    } else {
      setActiveCashRegister(data);
    }

    setLoading(false);
  }, [unitId]);

  /**
   * Lista todos os caixas com filtros
   */
  const fetchCashRegisters = useCallback(
    async (filters = {}) => {
      if (!unitId) return;

      setLoading(true);
      setError(null);

      const {
        data,
        error: err,
        count: total,
      } = await cashRegisterService.listCashRegisters(unitId, filters);

      if (err) {
        setError(err.message);
        setCashRegisters([]);
      } else {
        setCashRegisters(data || []);
        setCount(total || 0);
      }

      setLoading(false);
    },
    [unitId]
  );

  /**
   * Abre um novo caixa
   */
  const openCashRegister = useCallback(
    async data => {
      if (!canManageCashRegister) {
        setError('Você não tem permissão para abrir caixa');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await cashRegisterService.openCashRegister(
        {
          ...data,
          unitId,
        },
        user
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza caixa ativo
        await fetchActiveCashRegister();
      }

      setLoading(false);
      return result;
    },
    [unitId, user, canManageCashRegister, fetchActiveCashRegister]
  );

  /**
   * Fecha o caixa
   */
  const closeCashRegister = useCallback(
    async (id, data) => {
      if (!canManageCashRegister) {
        setError('Você não tem permissão para fechar caixa');
        return { data: null, error: new Error('Sem permissão') };
      }

      setLoading(true);
      setError(null);

      const result = await cashRegisterService.closeCashRegister(
        id,
        data,
        user
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        // Atualiza caixa ativo
        setActiveCashRegister(null);
        await fetchActiveCashRegister();
      }

      setLoading(false);
      return result;
    },
    [user, canManageCashRegister, fetchActiveCashRegister]
  );

  /**
   * Busca relatório de um caixa
   */
  const getCashRegisterReport = useCallback(async id => {
    setLoading(true);
    setError(null);

    const result = await cashRegisterService.getCashRegisterReport(id);

    if (result.error) {
      setError(result.error.message);
    }

    setLoading(false);
    return result;
  }, []);

  /**
   * Busca histórico de caixas
   */
  const fetchCashRegisterHistory = useCallback(
    async (limit = 10) => {
      if (!unitId) {
        setCashRegisterHistory([]); // ✅ Limpar se não tem unitId
        return { data: null, error: null };
      }

      setLoading(true);
      setError(null);

      const result = await cashRegisterService.getCashRegisterHistory(
        unitId,
        limit
      );

      if (result.error) {
        setError(result.error.message);
        setCashRegisterHistory([]); // ✅ Limpar em caso de erro
      } else {
        setCashRegisterHistory(result.data || []); // ✅ Atualizar estado
      }

      setLoading(false);
      return result;
    },
    [unitId]
  );

  /**
   * Carrega caixa ativo ao montar
   */
  useEffect(() => {
    if (unitId && canManageCashRegister) {
      fetchActiveCashRegister();
    }
  }, [unitId, canManageCashRegister, fetchActiveCashRegister]);

  /**
   * Configurar subscription do Realtime para caixa
   */
  useEffect(() => {
    if (!enableRealtime || !unitId) return;

    const channelName = `cash_registers_${unitId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'cash_registers',
          filter: `unit_id=eq.${unitId}`,
        },
        () => {
          // Refetch caixa ativo quando houver mudanças
          fetchActiveCashRegister();
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
  }, [enableRealtime, unitId, fetchActiveCashRegister]);

  return {
    // Estado
    activeCashRegister,
    cashRegisters,
    cashRegisterHistory, // ✅ Adicionar estado ao retorno
    loading,
    error,
    count,

    // Ações
    openCashRegister,
    closeCashRegister,
    fetchActiveCashRegister,
    fetchCashRegisters,
    fetchCashRegisterHistory, // ✅ Adicionar função ao retorno
    getCashRegisterReport,

    // Helpers
    hasActiveCashRegister: !!activeCashRegister,
    canManage: canManageCashRegister,
  };
};

export default useCashRegister;
