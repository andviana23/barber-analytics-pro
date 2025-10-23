import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  subDays,
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
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';

// Services
import fluxoExportService from '../../services/fluxoExportService';

// Custom Hooks
import { useCashflowData } from '../../hooks/useCashflowData';
import useCashflowTimeline from '../../hooks/useCashflowTimeline';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../services/supabase';

// Components
import DateRangePicker from '../../atoms/DateRangePicker/DateRangePicker';
import { CashflowTimelineChart } from '../../molecules/CashflowTimelineChart';

/**
 * 📊 Tab do Fluxo de Caixa - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Tabela de fluxo diário consolidado (PAGO/EM ABERTO)
 * - ✅ KPIs principais com gradientes temáticos
 * - ✅ Gráfico de linha da evolução (12 meses)
 * - ✅ Gráficos de pizza (Receitas/Despesas)
 * - ✅ Análise completa de entradas/saídas
 * - ✅ UI ultra moderna com hover effects
 * - ✅ Dark mode completo
 */
const FluxoTabRefactored = ({ globalFilters, units = [] }) => {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  // 📅 Estado do mês selecionado (formato: YYYY-MM)
  // ✅ Removido: Sempre mostraremos apenas o mês vigente

  // ✅ SEMPRE MOSTRAR APENAS O MÊS VIGENTE (MÊS ATUAL)
  const dateRange = useMemo(() => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  }, []); // ✅ Sempre o mês atual, sem dependências

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

  // Hook para dados históricos do timeline
  const {
    data: timelineData,
    loading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = useCashflowTimeline(globalFilters.unitId, 12);

  // ✅ Buscar saldo final do mês anterior
  const fetchPreviousMonthBalance = async () => {
    if (!globalFilters.unitId) return 0;

    try {
      const today = new Date();
      const previousMonth = subMonths(today, 1);
      const startOfPreviousMonth = startOfMonth(previousMonth);
      const endOfPreviousMonth = endOfMonth(previousMonth);

      console.log('📊 Buscando saldo do mês anterior:', {
        start: format(startOfPreviousMonth, 'yyyy-MM-dd'),
        end: format(endOfPreviousMonth, 'yyyy-MM-dd'),
      });

      // Buscar receitas do mês anterior
      const { data: prevRevenues } = await supabase
        .from('revenues')
        .select('value, status, date, expected_receipt_date')
        .eq('unit_id', globalFilters.unitId)
        .eq('is_active', true)
        .gte('date', format(startOfPreviousMonth, 'yyyy-MM-dd'))
        .lte('date', format(endOfPreviousMonth, 'yyyy-MM-dd'));

      // Buscar despesas do mês anterior
      const { data: prevExpenses } = await supabase
        .from('expenses')
        .select('value, status, date, expected_payment_date')
        .eq('unit_id', globalFilters.unitId)
        .eq('is_active', true)
        .gte('date', format(startOfPreviousMonth, 'yyyy-MM-dd'))
        .lte('date', format(endOfPreviousMonth, 'yyyy-MM-dd'));

      // Calcular saldo do mês anterior
      const totalRevenues = (prevRevenues || []).reduce(
        (sum, r) => sum + (r.value || 0),
        0
      );
      const totalExpenses = (prevExpenses || []).reduce(
        (sum, e) => sum + (e.value || 0),
        0
      );
      const previousBalance = totalRevenues - totalExpenses;

      console.log('📊 Saldo do mês anterior calculado:', {
        receitas: totalRevenues,
        despesas: totalExpenses,
        saldo: previousBalance,
      });

      return previousBalance;
    } catch (error) {
      console.error('❌ Erro ao buscar saldo do mês anterior:', error);
      return 0;
    }
  };

  // Buscar dados completos do fluxo de caixa
  const fetchCompleteCashflowData = async () => {
    if (!globalFilters.unitId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Buscando dados completos do fluxo de caixa...');

      // ✅ Buscar saldo inicial do mês anterior
      const saldoInicial = await fetchPreviousMonthBalance();

      // 1. Buscar receitas PAGAS (por date = Data Pgto)
      const { data: paidRevenues, error: paidRevenuesError } = await supabase
        .from('revenues')
        .select(
          `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .eq('status', 'Received')
        .eq('is_active', true)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (paidRevenuesError) throw paidRevenuesError;

      // 2. Buscar receitas PENDENTES - BUSCAR TODAS E FILTRAR DEPOIS
      const { data: pendingRevenues, error: pendingRevenuesError } =
        await supabase
          .from('revenues')
          .select(
            `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
          )
          .eq('unit_id', globalFilters.unitId)
          .eq('status', 'Pending')
          .eq('is_active', true)
          .order('expected_receipt_date');

      if (pendingRevenuesError) throw pendingRevenuesError;

      // Combinar receitas pagas e pendentes
      const revenues = [...(paidRevenues || []), ...(pendingRevenues || [])];

      // 3. Buscar despesas PAGAS (por date = Data Pgto)
      const { data: paidExpenses, error: paidExpensesError } = await supabase
        .from('expenses')
        .select(
          `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .eq('status', 'Paid')
        .eq('is_active', true)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      if (paidExpensesError) throw paidExpensesError;

      // 4. Buscar despesas PENDENTES (por expected_payment_date = Prev. Pgto)
      // 4. Buscar despesas PENDENTES - BUSCAR TODAS E FILTRAR DEPOIS
      const { data: pendingExpenses, error: pendingExpensesError } =
        await supabase
          .from('expenses')
          .select(
            `
          *,
          category:categories(id, name, category_type),
          party:parties(id, nome)
        `
          )
          .eq('unit_id', globalFilters.unitId)
          .eq('status', 'Pending')
          .eq('is_active', true)
          .order('expected_payment_date');

      if (pendingExpensesError) throw pendingExpensesError;

      // Combinar despesas pagas e pendentes
      const expenses = [...(paidExpenses || []), ...(pendingExpenses || [])];

      // 3. Processar dados diários com saldo inicial
      const dailyData = processDailyData(
        revenues || [],
        expenses || [],
        saldoInicial,
        dateRange
      );

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

  // Processar dados diários - LÓGICA MELHORADA COM SEPARAÇÃO CLARA E SALDO INICIAL
  const processDailyData = (
    revenues,
    expenses,
    saldoInicial = 0,
    dateRange
  ) => {
    const dailyMap = new Map();

    // ✅ PREENCHER TODOS OS DIAS DO MÊS SELECIONADO
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    // Criar entrada para cada dia do mês
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = format(d, 'yyyy-MM-dd');
      dailyMap.set(dateKey, {
        date: dateKey,
        // ✅ SEPARAÇÃO CLARA: RECEBIDAS vs PENDENTES
        received_inflows: 0,
        pending_inflows: 0,
        total_inflows: 0,
        // ✅ SEPARAÇÃO CLARA: PAGAS vs PENDENTES
        paid_outflows: 0,
        pending_outflows: 0,
        total_outflows: 0,
        // ✅ SALDOS CALCULADOS
        dailyBalance: 0,
        accumulatedBalance: 0,
        // ✅ CONTAGEM DE TRANSAÇÕES
        transaction_count: 0,
        // ✅ DETALHES PARA AUDITORIA
        revenues: { received: [], pending: [] },
        expenses: { paid: [], pending: [] },
      });
    }

    // ✅ PROCESSAR RECEITAS COM SEPARAÇÃO POR STATUS - APENAS MÊS VIGENTE
    revenues.forEach(revenue => {
      let date;
      let category;

      if (revenue.status === 'Received') {
        date = format(new Date(revenue.date), 'yyyy-MM-dd');
        category = 'received';
      } else {
        date = format(
          new Date(revenue.expected_receipt_date || revenue.date),
          'yyyy-MM-dd'
        );
        category = 'pending';
      }

      // ✅ FILTRAR APENAS DATAS DO MÊS VIGENTE - VALIDAÇÃO RIGOROSA
      const revenueDate = new Date(date);
      const filterStartDate = new Date(dateRange.startDate);
      const filterEndDate = new Date(dateRange.endDate);

      if (
        revenueDate >= filterStartDate &&
        revenueDate <= filterEndDate &&
        dailyMap.has(date)
      ) {
        const dayData = dailyMap.get(date);

        if (category === 'received') {
          dayData.received_inflows += revenue.value || 0;
          dayData.revenues.received.push(revenue);
        } else {
          dayData.pending_inflows += revenue.value || 0;
          dayData.revenues.pending.push(revenue);
        }

        dayData.transaction_count++;
      } else {
        console.log('🚫 Receita filtrada fora do mês vigente:', {
          revenueId: revenue.id,
          date: date,
          expectedDate: revenue.expected_receipt_date,
          status: revenue.status,
          monthRange: `${dateRange.startDate} - ${dateRange.endDate}`,
        });
      }
    });

    // ✅ PROCESSAR DESPESAS COM SEPARAÇÃO POR STATUS - APENAS MÊS VIGENTE
    expenses.forEach(expense => {
      let date;
      let category;

      if (expense.status === 'Paid') {
        date = format(new Date(expense.date), 'yyyy-MM-dd');
        category = 'paid';
      } else {
        date = format(
          new Date(expense.expected_payment_date || expense.date),
          'yyyy-MM-dd'
        );
        category = 'pending';
      }

      // ✅ FILTRAR APENAS DATAS DO MÊS VIGENTE - VALIDAÇÃO RIGOROSA
      const expenseDate = new Date(date);
      const filterStartDate = new Date(dateRange.startDate);
      const filterEndDate = new Date(dateRange.endDate);

      if (
        expenseDate >= filterStartDate &&
        expenseDate <= filterEndDate &&
        dailyMap.has(date)
      ) {
        const dayData = dailyMap.get(date);

        if (category === 'paid') {
          dayData.paid_outflows += expense.value || 0;
          dayData.expenses.paid.push(expense);
        } else {
          dayData.pending_outflows += expense.value || 0;
          dayData.expenses.pending.push(expense);
        }

        dayData.transaction_count++;
      } else {
        console.log('🚫 Despesa filtrada fora do mês vigente:', {
          expenseId: expense.id,
          date: date,
          expectedDate: expense.expected_payment_date,
          status: expense.status,
          monthRange: `${dateRange.startDate} - ${dateRange.endDate}`,
        });
      }
    });

    // ✅ CALCULAR TOTAIS E SALDOS - ORDENADO POR DATA COM SALDO INICIAL
    const sortedDates = Array.from(dailyMap.keys()).sort();
    let accumulatedBalance = saldoInicial; // ✅ Começar com saldo inicial

    const result = sortedDates.map((date, index) => {
      const dayData = dailyMap.get(date);

      // Calcular totais
      dayData.total_inflows =
        dayData.received_inflows + dayData.pending_inflows;
      dayData.total_outflows = dayData.paid_outflows + dayData.pending_outflows;

      // Calcular saldo do dia
      dayData.dailyBalance = dayData.total_inflows - dayData.total_outflows;

      // Calcular acumulado
      dayData.accumulatedBalance = accumulatedBalance + dayData.dailyBalance;
      accumulatedBalance = dayData.accumulatedBalance;

      return {
        ...dayData,
        dayNumber: index + 1,
      };
    });

    // ✅ ADICIONAR LINHA DE SALDO INICIAL NO INÍCIO
    const saldoInicialRow = {
      date: format(subDays(new Date(dateRange.startDate), 1), 'yyyy-MM-dd'),
      isSaldoInicial: true,
      received_inflows: 0,
      pending_inflows: 0,
      total_inflows: 0,
      paid_outflows: 0,
      pending_outflows: 0,
      total_outflows: 0,
      dailyBalance: 0,
      accumulatedBalance: saldoInicial,
      transaction_count: 0,
      revenues: { received: [], pending: [] },
      expenses: { paid: [], pending: [] },
      dayNumber: 0,
    };

    return [saldoInicialRow, ...result];
  };

  // ✅ FUNÇÃO SIMPLIFICADA - AGORA USAMOS APENAS OS DADOS CONSOLIDADOS
  const separatePaidPending = dailyData => {
    // Como agora temos uma tabela única consolidada,
    // esta função apenas retorna os dados já processados
    return {
      paid: dailyData, // Mesmos dados para ambos
      pending: dailyData, // pois já estão separados por status
      daily: dailyData, // Dados consolidados para a nova tabela
    };
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

  // Atualizar dateRange quando o mês selecionado mudar
  // ✅ Removido: Sempre usa o mês vigente automaticamente

  // ✅ Carregar dados do mês vigente automaticamente
  useEffect(() => {
    console.log('🔄 FluxoTab: Recarregando dados do mês vigente...', {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      unitId: globalFilters.unitId,
    });
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

  const handleExport = async format => {
    const dataToExport = cashflowData.daily || [];

    if (dataToExport.length === 0) {
      showToast('Não há dados para exportar', 'warning');
      return;
    }

    setExporting(true);
    try {
      const filters = {
        periodo: {
          tipo: 'custom',
          dataInicio: dateRange.startDate,
          dataFim: dateRange.endDate,
        },
      };

      let result;
      switch (format) {
        case 'csv':
          result = fluxoExportService.exportAsCSV(dataToExport, filters);
          break;
        case 'excel':
          result = fluxoExportService.exportAsExcel(dataToExport, filters);
          break;
        case 'pdf':
          result = fluxoExportService.exportAsPDF(dataToExport, filters);
          break;
        default:
          throw new Error('Formato não suportado');
      }

      if (result.success) {
        showToast(
          `Relatório exportado como ${format.toUpperCase()}`,
          'success'
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast(`Erro ao exportar: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
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
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-theme-secondary font-medium">
          Carregando fluxo de caixa...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <TrendingDown className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-semibold text-theme-primary mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-theme-secondary mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="btn-theme-primary px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📊 Header com Controles - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-theme-primary">
                Fluxo de Caixa
              </h2>
              <p className="text-sm text-theme-secondary">
                Visão consolidada do mês vigente
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mês Vigente Badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-800">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {format(new Date(), 'MMMM/yyyy', { locale: ptBR })}
              </span>
            </div>

            {/* Botão Atualizar */}
            <button
              onClick={handleRefresh}
              className="p-2.5 text-theme-secondary hover:text-theme-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Botões de Exportação */}
            <button
              onClick={() => handleExport('csv')}
              disabled={
                exporting ||
                !cashflowData.daily ||
                cashflowData.daily.length === 0
              }
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-theme-secondary border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-theme-primary transition-all disabled:opacity-50"
              title="Exportar CSV"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={
                exporting ||
                !cashflowData.daily ||
                cashflowData.daily.length === 0
              }
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-theme-secondary border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-theme-primary transition-all disabled:opacity-50"
              title="Exportar Excel"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={
                exporting ||
                !cashflowData.daily ||
                cashflowData.daily.length === 0
              }
              className="btn-theme-primary px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              title="Exportar PDF"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* 📈 Timeline de 12 Meses - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl p-6 border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-theme-primary">
              Timeline dos Últimos 12 Meses
            </h3>
            <p className="text-sm text-theme-secondary">
              Evolução histórica do fluxo de caixa
            </p>
          </div>
        </div>

        {/* Chart Component */}
        <CashflowTimelineChart
          data={timelineData}
          loading={timelineLoading}
          error={timelineError}
          title="Evolução do Fluxo de Caixa"
          height={400}
          onRefresh={refetchTimeline}
          onExport={handleExport}
        />
      </div>

      {/* 📊 Tabela Consolidada: ACUMULADO - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b-2 border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-theme-primary">
              Fluxo Diário Consolidado
            </h3>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-theme-secondary uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                  Entradas
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                  Saídas
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                  Saldo do Dia
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-theme-secondary uppercase tracking-wider">
                  Acumulado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cashflowData.daily.map((day, index) => {
                const isWeekend = [0, 6].includes(new Date(day.date).getDay());
                const totalInflows = day.received_inflows + day.pending_inflows;
                const totalOutflows = day.paid_outflows + day.pending_outflows;
                const isSaldoInicial = day.isSaldoInicial;

                return (
                  <tr
                    key={day.date}
                    className={`group transition-all duration-200 ${
                      isSaldoInicial
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30'
                        : isWeekend
                          ? 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10'
                          : 'hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10'
                    }`}
                  >
                    {/* Data */}
                    <td className="px-6 py-4">
                      {isSaldoInicial ? (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            SALDO INICIAL
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-theme-primary">
                            {format(new Date(day.date), 'dd/MM', {
                              locale: ptBR,
                            })}
                          </span>
                          {isWeekend && (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded-full">
                              {format(new Date(day.date), 'EEE', {
                                locale: ptBR,
                              }).toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Entradas */}
                    <td className="px-6 py-4 text-right">
                      {isSaldoInicial ? (
                        <span className="text-sm text-theme-secondary">-</span>
                      ) : totalInflows > 0 ? (
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(totalInflows)}
                        </span>
                      ) : (
                        <span className="text-sm text-theme-secondary">-</span>
                      )}
                    </td>

                    {/* Saídas */}
                    <td className="px-6 py-4 text-right">
                      {isSaldoInicial ? (
                        <span className="text-sm text-theme-secondary">-</span>
                      ) : totalOutflows > 0 ? (
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(totalOutflows)}
                        </span>
                      ) : (
                        <span className="text-sm text-theme-secondary">-</span>
                      )}
                    </td>

                    {/* Saldo do Dia */}
                    <td className="px-6 py-4 text-right">
                      {isSaldoInicial ? (
                        <span className="text-sm text-theme-secondary">-</span>
                      ) : (
                        <span
                          className={`text-sm font-bold ${
                            day.dailyBalance >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(day.dailyBalance)}
                        </span>
                      )}
                    </td>

                    {/* Acumulado */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`text-base font-bold ${
                            day.accumulatedBalance >= 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-orange-600 dark:text-orange-400'
                          }`}
                        >
                          {formatCurrency(day.accumulatedBalance)}
                        </span>
                        {day.accumulatedBalance >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400 opacity-60" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-orange-500 dark:text-orange-400 opacity-60" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📊 Gráficos de Distribuição - DESIGN SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Receitas */}
        <div className="card-theme rounded-xl p-6 border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-primary">
                  Distribuição de Receitas
                </h3>
                <p className="text-xs text-theme-secondary">Por categoria</p>
              </div>
            </div>
          </div>

          {/* Lista de categorias */}
          <div className="space-y-3">
            {cashflowData.revenueDistribution.map((item, index) => (
              <div
                key={item.name}
                className="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  {/* Categoria */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{
                        backgroundColor:
                          chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="text-sm font-semibold text-theme-primary group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Valores */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {item.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-theme-secondary">
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição de Despesas */}
        <div className="card-theme rounded-xl p-6 border-2 border-transparent hover:border-red-300 dark:hover:border-red-700 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-primary">
                  Distribuição de Despesas
                </h3>
                <p className="text-xs text-theme-secondary">Por categoria</p>
              </div>
            </div>
          </div>

          {/* Lista de categorias */}
          <div className="space-y-3">
            {cashflowData.expenseDistribution.map((item, index) => (
              <div
                key={item.name}
                className="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50 dark:hover:from-red-900/10 dark:hover:to-pink-900/10 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  {/* Categoria */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{
                        backgroundColor:
                          chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="text-sm font-semibold text-theme-primary group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Valores */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                      {item.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-theme-secondary">
                      {formatCurrency(item.value)}
                    </div>
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
