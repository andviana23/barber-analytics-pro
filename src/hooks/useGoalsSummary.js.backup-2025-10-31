import { useState, useEffect, useCallback } from 'react';
import { goalsService } from '@/services/goalsService';

/**
 * Hook para buscar resumo das metas do mês atual
 * Usado no dashboard para exibir metas ativas
 *
 * @param {string} unitId - ID da unidade
 * @param {number} year - Ano (opcional, padrão: ano atual)
 * @param {number} month - Mês (opcional, padrão: mês atual)
 * @returns {Object} { goals, loading, error, refetch }
 */
export const useGoalsSummary = (unitId, year = null, month = null) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDate = new Date();
  const targetYear = year || currentDate.getFullYear();
  const targetMonth = month || currentDate.getMonth() + 1;

  const fetchGoals = useCallback(async () => {
    if (!unitId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filters = {
        unit_id: unitId,
        year: targetYear,
        month: targetMonth,
        is_active: true, // Apenas metas ativas
      };

      const { data, error: fetchError } = await goalsService.getGoals(filters);

      if (fetchError) {
        throw new Error(fetchError);
      }

      // Ordenar por prioridade (profit, revenue_general, etc)
      const sortedGoals = (data || []).sort((a, b) => {
        const priority = {
          profit: 1,
          revenue_general: 2,
          subscription: 3,
          product_sales: 4,
          expenses: 5,
        };
        return (priority[a.goal_type] || 99) - (priority[b.goal_type] || 99);
      });

      setGoals(sortedGoals);
    } catch (err) {
      setError(err.message || 'Erro ao buscar metas');
    } finally {
      setLoading(false);
    }
  }, [unitId, targetYear, targetMonth]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
  };
};
