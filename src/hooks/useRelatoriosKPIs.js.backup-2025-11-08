/**
 * @file useRelatoriosKPIs.js
 * @description Hook para consumir KPIs da view vw_relatorios_kpis
 * @module Hooks/Relatorios
 */

import { useState, useEffect, useCallback } from 'react';
import relatoriosService from '../services/relatoriosService';
import { useToast } from '../context/ToastContext';

/**
 * Hook para buscar KPIs consolidados
 * @param {Object} filters - Filtros de busca
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { kpis, loading, error, refetch }
 */
export const useRelatoriosKPIs = (filters = {}, autoLoad = true) => {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getKPIs(filters);

      if (fetchError) throw fetchError;

      setKpis(data || []);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar KPIs: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is an object, comparing by properties
  }, [
    filters.unitId,
    filters.startDate,
    filters.endDate,
    filters.limit,
    showToast,
  ]);

  useEffect(() => {
    if (autoLoad) {
      fetchKPIs();
    }
  }, [fetchKPIs, autoLoad]);

  return { kpis, loading, error, refetch: fetchKPIs };
};

/**
 * Hook para buscar KPI do período atual
 * @param {string} unitId - ID da unidade
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { summary, loading, error, refetch }
 */
export const useCurrentPeriodSummary = (unitId, autoLoad = true) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchSummary = useCallback(async () => {
    if (!unitId || unitId === 'todas') {
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getCurrentPeriodSummary(unitId);

      if (fetchError) throw fetchError;

      setSummary(data);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar resumo: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [unitId, showToast]);

  useEffect(() => {
    if (autoLoad) {
      fetchSummary();
    }
  }, [fetchSummary, autoLoad]);

  return { summary, loading, error, refetch: fetchSummary };
};

/**
 * Hook para buscar tendência de receita
 * @param {string} unitId - ID da unidade
 * @param {number} months - Quantidade de meses (padrão: 6)
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { trend, loading, error, refetch }
 */
export const useRevenueTrend = (unitId, months = 6, autoLoad = true) => {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchTrend = useCallback(async () => {
    if (!unitId || unitId === 'todas') {
      setTrend([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getRevenueTrend(unitId, months);

      if (fetchError) throw fetchError;

      setTrend(data || []);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar tendência: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [unitId, months, showToast]);

  useEffect(() => {
    if (autoLoad) {
      fetchTrend();
    }
  }, [fetchTrend, autoLoad]);

  return { trend, loading, error, refetch: fetchTrend };
};
