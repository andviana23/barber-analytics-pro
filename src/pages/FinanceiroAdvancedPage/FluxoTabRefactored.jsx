import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

// Custom Hooks
import { useCashflowData } from '../../hooks/useCashflowData';
import { supabase } from '../../services/supabase';

// Components
import DateRangePicker from '../../atoms/DateRangePicker/DateRangePicker';

/**
 * Tab do Fluxo de Caixa - Refatorado
 *
 * Features:
 * - Tabela de fluxo diário (PAGO/EM ABERTO)
 * - KPIs principais (Mês Atual, 12 meses, Margem)
 * - Gráfico de linha da evolução
 * - Gráficos de pizza (Receitas/Despesas)
 * - Análise completa de entradas/saídas
 */
const FluxoTabRefactored = ({ globalFilters, units = [] }) => {
  // Estados principais
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 2);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  });

  const [cashflowData, setCashflowData] = useState({
    daily: [],
    paid: [],
    pending: [],
    kpis: {},
    revenueDistribution: [],
    expenseDistribution: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook para dados básicos do fluxo
  const {
    entries,
    summary,
    loading: cashflowLoading,
    error: cashflowError,
    refetch,
  } = useCashflowData(
    globalFilters.unitId,
    dateRange.startDate,
    dateRange.endDate,
    globalFilters.accountId
  );

  // Buscar dados completos do fluxo de caixa
  const fetchCompleteCashflowData = async () => {
    if (!globalFilters.unitId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Buscando dados completos do fluxo de caixa...');

      // 1. Buscar receitas (entradas)
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select(
          `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (revenuesError) throw revenuesError;

      // 2. Buscar despesas (saídas)
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(
          `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (expensesError) throw expensesError;

      // 3. Processar dados diários
      const dailyData = processDailyData(revenues || [], expenses || []);

      // 4. Separar PAGO vs EM ABERTO
      const { paid, pending } = separatePaidPending(dailyData);

      // 5. Calcular KPIs
      const kpis = calculateKPIs(revenues || [], expenses || []);

      // 6. Distribuição de receitas
      const revenueDistribution = calculateRevenueDistribution(revenues || []);

      // 7. Distribuição de despesas
      const expenseDistribution = calculateExpenseDistribution(expenses || []);

      setCashflowData({
        daily: dailyData,
        paid,
        pending,
        kpis,
        revenueDistribution,
        expenseDistribution,
      });

      console.log('✅ Dados do fluxo de caixa carregados:', {
        daily: dailyData.length,
        paid: paid.length,
        pending: pending.length,
        kpis,
        revenueDistribution: revenueDistribution.length,
        expenseDistribution: expenseDistribution.length,
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados do fluxo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Processar dados diários
  const processDailyData = (revenues, expenses) => {
    const dailyMap = new Map();

    // Processar receitas
    revenues.forEach(revenue => {
      const date = format(new Date(revenue.date), 'yyyy-MM-dd');
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          inflows: 0,
          outflows: 0,
          dailyBalance: 0,
          accumulatedBalance: 0,
          revenues: [],
          expenses: [],
        });
      }

      const dayData = dailyMap.get(date);
      dayData.inflows += revenue.value || 0;
      dayData.revenues.push(revenue);
    });

    // Processar despesas
    expenses.forEach(expense => {
      const date = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          inflows: 0,
          outflows: 0,
          dailyBalance: 0,
          accumulatedBalance: 0,
          revenues: [],
          expenses: [],
        });
      }

      const dayData = dailyMap.get(date);
      dayData.outflows += expense.value || 0;
      dayData.expenses.push(expense);
    });

    // Calcular saldos
    const sortedDates = Array.from(dailyMap.keys()).sort();
    let accumulatedBalance = 0;

    return sortedDates.map(date => {
      const dayData = dailyMap.get(date);
      dayData.dailyBalance = dayData.inflows - dayData.outflows;
      dayData.accumulatedBalance = accumulatedBalance + dayData.dailyBalance;
      accumulatedBalance = dayData.accumulatedBalance;

      return {
        ...dayData,
        dayNumber: sortedDates.indexOf(date) + 1,
      };
    });
  };

  // Separar PAGO vs EM ABERTO
  const separatePaidPending = dailyData => {
    const paid = [];
    const pending = [];

    dailyData.forEach(day => {
      // Receitas pagas (status = 'Received')
      const paidRevenues = day.revenues.filter(r => r.status === 'Received');
      const pendingRevenues = day.revenues.filter(r => r.status !== 'Received');

      // Despesas pagas (status = 'Paid')
      const paidExpenses = day.expenses.filter(e => e.status === 'Paid');
      const pendingExpenses = day.expenses.filter(e => e.status !== 'Paid');

      // Calcular totais pagos
      const paidInflows = paidRevenues.reduce(
        (sum, r) => sum + (r.value || 0),
        0
      );
      const paidOutflows = paidExpenses.reduce(
        (sum, e) => sum + (e.value || 0),
        0
      );
      const paidBalance = paidInflows - paidOutflows;

      // Calcular totais em aberto
      const pendingInflows = pendingRevenues.reduce(
        (sum, r) => sum + (r.value || 0),
        0
      );
      const pendingOutflows = pendingExpenses.reduce(
        (sum, e) => sum + (e.value || 0),
        0
      );
      const pendingBalance = pendingInflows - pendingOutflows;

      paid.push({
        ...day,
        inflows: paidInflows,
        outflows: paidOutflows,
        dailyBalance: paidBalance,
        revenues: paidRevenues,
        expenses: paidExpenses,
      });

      pending.push({
        ...day,
        inflows: pendingInflows,
        outflows: pendingOutflows,
        dailyBalance: pendingBalance,
        revenues: pendingRevenues,
        expenses: pendingExpenses,
      });
    });

    return { paid, pending };
  };

  // Calcular KPIs
  const calculateKPIs = (revenues, expenses) => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
    const lastYear = format(subMonths(new Date(), 12), 'yyyy-MM');

    // Receitas do mês atual
    const currentMonthRevenues = revenues
      .filter(r => format(new Date(r.date), 'yyyy-MM') === currentMonth)
      .reduce((sum, r) => sum + (r.value || 0), 0);

    // Despesas do mês atual
    const currentMonthExpenses = expenses
      .filter(e => format(new Date(e.date), 'yyyy-MM') === currentMonth)
      .reduce((sum, e) => sum + (e.value || 0), 0);

    // Resultado do mês atual
    const currentMonthResult = currentMonthRevenues - currentMonthExpenses;

    // Receitas dos últimos 12 meses
    const last12MonthsRevenues = revenues
      .filter(r => format(new Date(r.date), 'yyyy-MM') >= lastYear)
      .reduce((sum, r) => sum + (r.value || 0), 0);

    // Despesas dos últimos 12 meses
    const last12MonthsExpenses = expenses
      .filter(e => format(new Date(e.date), 'yyyy-MM') >= lastYear)
      .reduce((sum, e) => sum + (e.value || 0), 0);

    // Resultado dos últimos 12 meses
    const last12MonthsResult = last12MonthsRevenues - last12MonthsExpenses;

    // Margem de lucro
    const profitMargin =
      last12MonthsRevenues > 0
        ? (last12MonthsResult / last12MonthsRevenues) * 100
        : 0;

    return {
      currentMonth: {
        revenues: currentMonthRevenues,
        expenses: currentMonthExpenses,
        result: currentMonthResult,
        month: format(new Date(), 'MMM/yy', { locale: ptBR }),
      },
      last12Months: {
        revenues: last12MonthsRevenues,
        expenses: last12MonthsExpenses,
        result: last12MonthsResult,
        profitMargin,
      },
    };
  };

  // Distribuição de receitas por categoria
  const calculateRevenueDistribution = revenues => {
    const distribution = new Map();

    revenues.forEach(revenue => {
      const categoryName = revenue.category?.name || 'Outras Receitas';
      if (!distribution.has(categoryName)) {
        distribution.set(categoryName, 0);
      }
      distribution.set(
        categoryName,
        distribution.get(categoryName) + (revenue.value || 0)
      );
    });

    const total = Array.from(distribution.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    return Array.from(distribution.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Distribuição de despesas por categoria
  const calculateExpenseDistribution = expenses => {
    const distribution = new Map();

    expenses.forEach(expense => {
      const categoryName = expense.category?.name || 'Outras Despesas';
      if (!distribution.has(categoryName)) {
        distribution.set(categoryName, 0);
      }
      distribution.set(
        categoryName,
        distribution.get(categoryName) + (expense.value || 0)
      );
    });

    const total = Array.from(distribution.values()).reduce(
      (sum, val) => sum + val,
      0
    );

    return Array.from(distribution.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Carregar dados ao montar e quando mudar filtros
  useEffect(() => {
    fetchCompleteCashflowData();
  }, [globalFilters.unitId, dateRange]);

  // Handlers
  const handleDateRangeChange = newRange => {
    if (newRange.startDate && newRange.endDate) {
      setDateRange({
        startDate: format(new Date(newRange.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(newRange.endDate), 'yyyy-MM-dd'),
      });
    }
  };

  const handleRefresh = () => {
    fetchCompleteCashflowData();
    refetch();
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log('Exportar dados do fluxo de caixa');
  };

  // Formatação de moeda
  const formatCurrency = value => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Cores para gráficos
  const chartColors = [
    '#3B82F6',
    '#EF4444',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6B7280',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando fluxo de caixa...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <TrendingDown className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Fluxo de Caixa
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
            />

            <button
              onClick={handleRefresh}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </button>

            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Mês Atual */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Mês Atual: {cashflowData.kpis.currentMonth?.month}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashflowData.kpis.currentMonth?.result || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Resultado
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">
                Entradas:
              </span>
              <span className="font-medium">
                {formatCurrency(cashflowData.kpis.currentMonth?.revenues || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Saídas:</span>
              <span className="font-medium">
                {formatCurrency(cashflowData.kpis.currentMonth?.expenses || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Últimos 12 Meses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Últimos 12 Meses
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(cashflowData.kpis.last12Months?.result || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Resultado Total
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Margem:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {cashflowData.kpis.last12Months?.profitMargin?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Total Entradas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Entradas
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(cashflowData.kpis.last12Months?.revenues || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Últimos 12 meses
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Saídas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Saídas
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(cashflowData.kpis.last12Months?.expenses || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Últimos 12 meses
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabelas de Fluxo Diário */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PAGO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              PAGO
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Dia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Entradas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Saídas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Saldo do Dia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acumulado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cashflowData.paid.slice(0, 10).map((day, index) => (
                  <tr
                    key={day.date}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {day.inflows > 0 ? formatCurrency(day.inflows) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {day.outflows > 0 ? formatCurrency(day.outflows) : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        day.dailyBalance >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(day.dailyBalance)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        day.accumulatedBalance >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(day.accumulatedBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EM ABERTO */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              EM ABERTO
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Dia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Entradas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Saídas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Saldo do Dia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Acumulado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cashflowData.pending.slice(0, 10).map((day, index) => (
                  <tr
                    key={day.date}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {day.inflows > 0 ? formatCurrency(day.inflows) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {day.outflows > 0 ? formatCurrency(day.outflows) : '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        day.dailyBalance >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(day.dailyBalance)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        day.accumulatedBalance >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(day.accumulatedBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gráficos de Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Receitas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              DISTRIBUIÇÃO DE RECEITAS
            </h3>
            <PieChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="space-y-4">
            {cashflowData.revenueDistribution.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              DISTRIBUIÇÃO DE DESPESAS
            </h3>
            <PieChart className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>

          <div className="space-y-4">
            {cashflowData.expenseDistribution.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.percentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FluxoTabRefactored;
