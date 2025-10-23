/**
 * @file useComparativos.js
 * @description Hook para consumir comparativos de períodos da view vw_comparativo_periodos
 * @module Hooks/Relatorios
 */

import { useState, useEffect, useCallback } from 'react';
import relatoriosService from '../services/relatoriosService';
import { useToast } from '../context/ToastContext';

/**
 * Hook para buscar comparativos entre períodos (MoM, YoY)
 * @param {Object} filters - Filtros de busca
 * @param {boolean} autoLoad - Carregar automaticamente (padrão: true)
 * @returns {Object} { comparativos, loading, error, refetch }
 */
export const useComparativos = (filters = {}, autoLoad = true) => {
  const [comparativos, setComparativos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchComparativos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } =
        await relatoriosService.getComparativos(filters);

      if (fetchError) throw fetchError;

      setComparativos(data || []);
    } catch (err) {
      setError(err.message);
      showToast(`Erro ao carregar comparativos: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is an object, comparing by properties
  }, [
    filters.unitId,
    filters.period,
    filters.startDate,
    filters.endDate,
    filters.limit,
    showToast,
  ]);

  useEffect(() => {
    if (autoLoad) {
      fetchComparativos();
    }
  }, [fetchComparativos, autoLoad]);

  return { comparativos, loading, error, refetch: fetchComparativos };
};
