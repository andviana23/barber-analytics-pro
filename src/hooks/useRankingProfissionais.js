/**
 * @file useRankingProfissionais.js
 * @description Hook para consumir ranking de profissionais da view vw_ranking_profissionais
 * @module Hooks/Relatorios
 */

import { useState, useEffect, useCallback } from 'react';
import relatoriosService from '../services/relatoriosService';
import { useToast } from '../context/ToastContext';

/**
 * Hook para buscar ranking de profissionais
 * @param {Object} filters - Filtros de busca
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { ranking, loading, error, refetch }
 */
export const useRankingProfissionais = (filters = {}, autoLoad = true) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getRankingProfissionais(filters);

      if (fetchError) throw fetchError;

      setRanking(data || []);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar ranking: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is an object, comparing by properties
  }, [
    filters.unitId,
    filters.professionalId,
    filters.period,
    filters.startDate,
    filters.endDate,
    filters.limit,
    showToast,
  ]);

  useEffect(() => {
    if (autoLoad) {
      fetchRanking();
    }
  }, [fetchRanking, autoLoad]);

  return { ranking, loading, error, refetch: fetchRanking };
};

/**
 * Hook para buscar top performers
 * @param {Object} filters - Filtros de busca
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { topPerformers, loading, error, refetch }
 */
export const useTopPerformers = (filters = {}, autoLoad = true) => {
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchTopPerformers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getTopPerformers(filters);

      if (fetchError) throw fetchError;

      setTopPerformers(data || []);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar top performers: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is an object, comparing by properties
  }, [filters.unitId, filters.period, showToast]);

  useEffect(() => {
    if (autoLoad) {
      fetchTopPerformers();
    }
  }, [fetchTopPerformers, autoLoad]);

  return { topPerformers, loading, error, refetch: fetchTopPerformers };
};
