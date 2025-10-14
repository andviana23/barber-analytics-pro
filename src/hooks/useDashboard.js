import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para buscar KPIs do dashboard
 * @param {string} unitId - ID da unidade
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 */
export const useDashboardKPIs = (unitId = null, startDate = null, endDate = null) => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getFinancialKPIs(unitId, startDate, endDate);
      setKpis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId, startDate, endDate]);

  useEffect(() => {
    if (user) {
      fetchKPIs();
    }
  }, [user, fetchKPIs]);

  const refetch = useCallback(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    kpis,
    loading,
    error,
    refetch
  };
};

/**
 * Hook para buscar evolução mensal
 * @param {string} unitId - ID da unidade
 * @param {number} months - Número de meses
 */
export const useMonthlyEvolution = (unitId = null, months = 12) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const evolution = await dashboardService.getMonthlyEvolution(unitId, months);
      setData(evolution);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId, months]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook para buscar ranking de profissionais
 * @param {string} unitId - ID da unidade
 * @param {number} limit - Limite de resultados
 */
export const useRankingProfissionais = (unitId = null, limit = 10) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getProfessionalsRanking(unitId, limit);
      setRanking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId, limit]);

  useEffect(() => {
    if (user) {
      fetchRanking();
    }
  }, [user, fetchRanking]);

  return {
    ranking,
    loading,
    error,
    refetch: fetchRanking
  };
};

/**
 * Hook para buscar comparativo entre unidades
 */
export const useComparativoUnidades = () => {
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getUnitsComparison();
      setComparison(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchComparison();
    }
  }, [user, fetchComparison]);

  return {
    comparison,
    loading,
    error,
    refetch: fetchComparison
  };
};

/**
 * Hook para buscar distribuição de receitas
 * @param {string} unitId - ID da unidade
 */
export const useRevenueDistribution = (unitId = null) => {
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchDistribution = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getRevenueDistribution(unitId);
      
      // Calcular percentuais
      const total = data.reduce((sum, item) => sum + item.value, 0);
      const withPercentages = data.map(item => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0
      }));
      
      setDistribution(withPercentages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    if (user) {
      fetchDistribution();
    }
  }, [user, fetchDistribution]);

  return {
    distribution,
    loading,
    error,
    refetch: fetchDistribution
  };
};

/**
 * Hook para buscar agendamentos recentes
 * @param {string} unitId - ID da unidade
 * @param {number} limit - Limite de resultados
 */
export const useRecentBookings = (unitId = null, limit = 10) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getRecentBookings(unitId, limit);
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unitId, limit]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings
  };
};

export default {
  useDashboardKPIs,
  useMonthlyEvolution,
  useRankingProfissionais,
  useComparativoUnidades,
  useRevenueDistribution,
  useRecentBookings
};