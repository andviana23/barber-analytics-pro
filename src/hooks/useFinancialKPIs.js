import { useState, useEffect, useCallback } from 'react';
import { financeiroService } from '../services/financeiroService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para buscar KPIs financeiros
 * @param {string} unitId - ID da unidade
 * @param {Object} options - Opções de configuração
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFinancialKPIs = (unitId, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchKPIs = useCallback(async () => {
    if (!unitId || !user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await financeiroService.getKPIs({
        unitId,
        ...options
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data);
    } catch (err) {
      setError(err.message || 'Erro ao buscar KPIs financeiros');
    } finally {
      setLoading(false);
    }
  }, [unitId, user, options]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    data,
    loading,
    error,
    refetch: fetchKPIs
  };
};

export default useFinancialKPIs;