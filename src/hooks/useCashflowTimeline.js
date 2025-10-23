/**
 * useCashflowTimeline.js
 *
 * Hook para buscar dados históricos do fluxo de caixa
 * Para alimentar o gráfico de linha do tempo
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2025-01-17
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const useCashflowTimeline = (unitId, months = 12) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimelineData = useCallback(async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);

    try {
      // Calcular período de busca
      const endDate = endOfMonth(new Date());
      const startDate = startOfMonth(subMonths(new Date(), months));

      // Buscar receitas do período
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas receitas ativas
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'Received');

      if (revenuesError) throw revenuesError;

      // Buscar despesas do período
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'Paid');

      if (expensesError) throw expensesError;

      // Agrupar dados por mês
      const monthlyData = {};

      // Processar receitas
      revenues?.forEach(revenue => {
        const monthKey = format(new Date(revenue.date), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: `${monthKey}-01`,
            revenues: 0,
            expenses: 0,
          };
        }
        monthlyData[monthKey].revenues += revenue.value || 0;
      });

      // Processar despesas
      expenses?.forEach(expense => {
        const monthKey = format(new Date(expense.date), 'yyyy-MM');
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: `${monthKey}-01`,
            revenues: 0,
            expenses: 0,
          };
        }
        monthlyData[monthKey].expenses += expense.value || 0;
      });

      // Converter para array e ordenar
      const timelineData = Object.values(monthlyData).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      setData(timelineData);
    } catch (err) {
      console.error('Erro ao buscar dados do timeline:', err);
      setError(err.message || 'Erro ao carregar dados históricos');
    } finally {
      setLoading(false);
    }
  }, [unitId, months]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  return {
    data,
    loading,
    error,
    refetch: fetchTimelineData,
  };
};

export default useCashflowTimeline;
