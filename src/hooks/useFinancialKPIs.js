import { useState, useEffect, useCallback } from 'react';
import { financeiroService } from '../services/financeiroService';
import { useAuth } from '../context/AuthContext';

/**
 * Calcula trends comparando período atual vs anterior
 */
const calculateTrends = (current, previous) => {
  const calculateGrowthAndDirection = (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) {
      return {
        growth: currentValue > 0 ? 100 : 0,
        direction: currentValue > 0 ? 'up' : 'stable'
      };
    }

    const growth = ((currentValue - previousValue) / previousValue) * 100;
    const roundedGrowth = Math.round(growth * 100) / 100; // 2 casas decimais

    let direction = 'stable';
    if (Math.abs(growth) >= 5) {
      direction = growth > 0 ? 'up' : 'down';
    }

    return {
      growth: roundedGrowth,
      direction
    };
  };

  const revenue = calculateGrowthAndDirection(
    current.total_revenue || 0,
    previous.total_revenue || 0
  );

  const profit = calculateGrowthAndDirection(
    current.net_profit || 0,
    previous.net_profit || 0
  );

  const expense = calculateGrowthAndDirection(
    current.total_expense || 0,
    previous.total_expense || 0
  );

  // Calcular métricas adicionais se disponíveis
  const result = {
    revenue_growth: revenue.growth,
    revenue_direction: revenue.direction,
    profit_growth: profit.growth,
    profit_direction: profit.direction,
    expense_growth: expense.growth,
    expense_direction: expense.direction,
  };

  // Adicionar margin_improvement se ambos períodos tiverem profit_margin
  if (current.profit_margin !== undefined && previous.profit_margin !== undefined) {
    result.margin_improvement = Math.round(((current.profit_margin - previous.profit_margin) * 100) * 10) / 10;
  }

  // Adicionar overdue_change se ambos períodos tiverem overdue_revenue
  if (current.overdue_revenue !== undefined && previous.overdue_revenue !== undefined) {
    result.overdue_change = current.overdue_revenue - previous.overdue_revenue;
  }

  return result;
};

/**
 * Helper para calcular período anterior
 */
const getPreviousPeriod = (currentPeriod) => {
  if (!currentPeriod || typeof currentPeriod !== 'string') {
    const now = new Date();
    const prev = new Date(now);
    prev.setMonth(prev.getMonth() - 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }

  const [year, month] = currentPeriod.split('-').map(Number);
  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
};

/**
 * Hook para buscar KPIs financeiros com comparação de trends
 * @param {string} unitId - ID da unidade
 * @param {string} currentPeriod - Período atual (YYYY-MM)
 * @returns {Object} { data: {current, previous, trends}, isLoading, error, refetch }
 */
export const useFinancialKPIs = (unitId, currentPeriod) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchKPIs = useCallback(async () => {
    if (!unitId || !user?.id || !currentPeriod) {
      setIsLoading(false);
      setData(undefined);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calcular período anterior
      const previousPeriod = getPreviousPeriod(currentPeriod);

      // Buscar dados dos dois períodos em paralelo
      const [currentResult, previousResult] = await Promise.all([
        financeiroService.getKPIs(unitId, currentPeriod),
        financeiroService.getKPIs(unitId, previousPeriod),
      ]);

      // Verificar erros
      if (currentResult.error) {
        throw new Error(currentResult.error);
      }

      if (previousResult.error) {
        throw new Error(previousResult.error);
      }

      // Extrair dados dos períodos
      const currentData = currentResult.data?.current_period || {};
      const previousData = previousResult.data?.current_period || {};

      // Calcular trends
      const trends = calculateTrends(currentData, previousData);

      // Montar resultado final
      setData({
        current: currentData,
        previous: previousData,
        trends
      });

    } catch (err) {
      setError(err.message || 'Erro ao buscar KPIs financeiros');
      setData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [unitId, currentPeriod, user?.id]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    data,
    isLoading,
    loading: isLoading, // Mantido para compatibilidade
    error,
    refetch: fetchKPIs
  };
};

export default useFinancialKPIs;