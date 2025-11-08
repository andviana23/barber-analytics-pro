/**
 * useCashflowTimeline.js
 *
 * Hook para buscar dados históricos do fluxo de caixa
 * Para alimentar o gráfico de linha do tempo
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2025-01-17
 * Atualizado: 2025-11-07 - Períodos personalizados + Mês específico
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const useCashflowTimeline = (unitId, period = '12', referenceMonth = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimelineData = useCallback(async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);

    try {
      // Determinar tipo de agrupamento baseado no período
      const periodMonths = parseInt(period);

      // Calcular período de busca
      let endDate, startDate;

      if (periodMonths === 1 && referenceMonth) {
        // ✅ PERÍODO DE 1 MÊS: Usar mês de referência
        const refDate =
          referenceMonth instanceof Date ? referenceMonth : new Date();
        startDate = startOfMonth(refDate);
        endDate = endOfMonth(refDate);
      } else {
        // ✅ OUTROS PERÍODOS: Usar meses retroativos
        endDate = endOfMonth(new Date());
        startDate = startOfMonth(subMonths(new Date(), periodMonths));
      }

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

      // Agrupar dados baseado no período
      const timelineData = [];

      if (periodMonths <= 3) {
        // ✅ AGRUPAMENTO SEMANAL (1m ou 3m)
        const weeklyData = {};

        // Processar receitas por semana
        revenues?.forEach(revenue => {
          const date = new Date(revenue.date);
          const weekStart = format(
            new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - date.getDay()
            ),
            'yyyy-MM-dd'
          );

          if (!weeklyData[weekStart]) {
            weeklyData[weekStart] = {
              date: weekStart,
              revenues: 0,
              expenses: 0,
              label: format(new Date(weekStart), "'Sem.' dd/MM", {
                locale: ptBR,
              }),
            };
          }
          weeklyData[weekStart].revenues += revenue.value || 0;
        });

        // Processar despesas por semana
        expenses?.forEach(expense => {
          const date = new Date(expense.date);
          const weekStart = format(
            new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() - date.getDay()
            ),
            'yyyy-MM-dd'
          );

          if (!weeklyData[weekStart]) {
            weeklyData[weekStart] = {
              date: weekStart,
              revenues: 0,
              expenses: 0,
              label: format(new Date(weekStart), "'Sem.' dd/MM", {
                locale: ptBR,
              }),
            };
          }
          weeklyData[weekStart].expenses += expense.value || 0;
        });

        // Converter para array e ordenar
        timelineData.push(
          ...Object.values(weeklyData).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          )
        );
      } else {
        // ✅ AGRUPAMENTO MENSAL (6m ou 1a)
        const monthlyData = {};

        // Processar receitas por mês
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

        // Processar despesas por mês
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
        timelineData.push(
          ...Object.values(monthlyData).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          )
        );
      }

      setData(timelineData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar dados do timeline:', err);
      setError(err.message || 'Erro ao carregar dados históricos');
    } finally {
      setLoading(false);
    }
  }, [unitId, period, referenceMonth]);

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
