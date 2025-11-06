import {
  addDays,
  differenceInDays,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Services
import { balanceAdjustmentService } from '../../services';
import fluxoExportService from '../../services/fluxoExportService';

// Custom Hooks
import { useToast } from '../../context/ToastContext';
import { useCashflowData } from '../../hooks/useCashflowData';
import { useCashflowTable } from '../../hooks/useCashflowTable';
import useCashflowTimeline from '../../hooks/useCashflowTimeline';
import usePeriodFilter from '../../hooks/usePeriodFilter';
import { supabase } from '../../services/supabase';

// Components
import PeriodFilter from '../../atoms/PeriodFilter/PeriodFilter';
import {
  CashflowTable,
  createCashflowColumns,
} from '../../molecules/CashflowTable';
import { CashflowTimelineChart } from '../../molecules/CashflowTimelineChart';
import { PieChartCard } from '../../molecules/PieChartCard';
import EditInitialBalanceModal from '../../organisms/EditInitialBalanceModal/EditInitialBalanceModal';

/**
 * ✅ FUNÇÃO HELPER: Verifica se uma data é final de semana (timezone-safe)
 * @param {string} dateString - Data no formato 'YYYY-MM-DD'
 * @returns {boolean} - true se sábado ou domingo
 */
const isWeekend = dateString => {
  const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * ✅ FUNÇÃO HELPER: Move data de fim de semana para próxima segunda-feira
 * @param {Date} date - Data a ser ajustada
 * @returns {Date} - Data ajustada (segunda se for fim de semana, original caso contrário)
 */
const moveWeekendToMonday = date => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) {
    // Domingo → +1 dia
    return addDays(date, 1);
  } else if (dayOfWeek === 6) {
    // Sábado → +2 dias
    return addDays(date, 2);
  }
  return date;
};

/**
 * 📊 Tab do Fluxo de Caixa - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Filtros de período: Dia, Semana, Mês
 * - ✅ Semana vigente como padrão
 * - ✅ Tabela de fluxo diário consolidado (PAGO/EM ABERTO)
 * - ✅ KPIs principais com gradientes temáticos
 * - ✅ Gráfico de linha da evolução (12 meses)
 * - ✅ Gráficos de pizza (Receitas/Despesas)
 * - ✅ Análise completa de entradas/saídas
 * - ✅ UI ultra moderna com hover effects
 * - ✅ Dark mode completo
 * - ✅ Funções helper timezone-safe para finais de semana
 */
const FluxoTabRefactored = ({ globalFilters, units = [] }) => {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  // 💰 Estados do Modal de Saldo Inicial
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState('');

  // �️ Hook para gerenciar filtros de período (Dia/Semana/Mês)
  // ✅ PADRÃO: Semana vigente
  const {
    selectedPeriod,
    selectedDate,
    dateRange,
    periodDescription,
    isCurrentPeriod,
    handlePeriodChange,
    handleDateChange,
    resetToToday,
    goToPreviousPeriod,
    goToNextPeriod,
  } = usePeriodFilter('week', new Date());

  // 🔍 DEBUG: Log do intervalo de datas calculado
  useEffect(() => {
    console.log('📅 Filtro de Período Atualizado:', {
      selectedPeriod,
      selectedDate:
        selectedDate instanceof Date
          ? format(selectedDate, 'yyyy-MM-dd')
          : selectedDate,
      dateRange,
      periodDescription,
      isCurrentPeriod,
    });
  }, [selectedPeriod, selectedDate, dateRange]);
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

  // ✅ Buscar saldo final do período anterior ao selecionado
  const fetchPreviousMonthBalance = async () => {
    if (!globalFilters.unitId) return 0;
    try {
      // ✅ CORRIGIDO: Usar selectedDate do filtro ao invés de new Date()
      const referenceDate =
        selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const currentPeriod = format(referenceDate, 'yyyy-MM');

      console.log(
        '💰 Buscando saldo inicial ajustado para período:',
        currentPeriod
      );

      // 🎯 PRIORIDADE 1: Verificar se há ajuste manual do saldo inicial
      const { data: balanceData, error: balanceError } =
        await balanceAdjustmentService.getAdjustedInitialBalance(
          globalFilters.unitId,
          currentPeriod
        );

      if (balanceError) {
        console.warn('⚠️ Erro ao buscar ajuste de saldo:', balanceError);
        // Se houver erro de autenticação ou acesso, continuar com cálculo normal
      } else if (balanceData?.adjustedBalance !== undefined) {
        console.log(
          '✅ Saldo inicial ajustado encontrado:',
          balanceData.adjustedBalance
        );
        return balanceData.adjustedBalance;
      }

      // 🎯 PRIORIDADE 2: Calcular saldo com base no mês anterior
      const previousMonth = subMonths(referenceDate, 1);
      const startOfPreviousMonth = startOfMonth(previousMonth);
      const endOfPreviousMonth = endOfMonth(previousMonth);

      console.log('📊 Calculando saldo do mês anterior:', {
        referenceDate: format(referenceDate, 'yyyy-MM-dd'),
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

      // 1. Buscar receitas PAGAS - USAR expected_receipt_date para regime de competência
      const { data: paidRevenues, error: paidRevenuesError } = await supabase
        .from('revenues')
        .select(
          `
          *,
          fees,
          payment_method_id,
          category:categories(id, name, category_type),
          party:parties(id, nome),
          payment_method:payment_methods(id, name, fee_percentage)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .eq('status', 'Received')
        .eq('is_active', true)
        .gte('expected_receipt_date', dateRange.startDate)
        .lte('expected_receipt_date', dateRange.endDate)
        .order('expected_receipt_date');
      if (paidRevenuesError) throw paidRevenuesError;

      // 2. Buscar receitas PENDENTES - filtrar por expected_receipt_date no período
      const { data: pendingRevenues, error: pendingRevenuesError } =
        await supabase
          .from('revenues')
          .select(
            `
          *,
          fees,
          payment_method_id,
          category:categories(id, name, category_type),
          party:parties(id, nome),
          payment_method:payment_methods(id, name, fee_percentage)
        `
          )
          .eq('unit_id', globalFilters.unitId)
          .eq('status', 'Pending')
          .eq('is_active', true)
          .gte('expected_receipt_date', dateRange.startDate)
          .lte('expected_receipt_date', dateRange.endDate)
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

      // 6. Distribuição de receitas (baseado em data de competência)
      const revenueDistribution = calculateRevenueDistribution(
        revenues || [],
        dateRange
      );

      // 7. Distribuição de despesas (baseado em data de competência)
      const expenseDistribution = calculateExpenseDistribution(
        expenses || [],
        dateRange
      );

      // 🔍 DEBUG CRÍTICO: Ver o que está sendo passado para setCashflowData
      console.log('🚨 [ANTES-SET-STATE] dailyData retornado:', {
        length: dailyData.length,
        isArray: Array.isArray(dailyData),
        firstItem: dailyData[0],
        lastItem: dailyData[dailyData.length - 1],
        allDates: dailyData.map(d => d.date),
      });

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

    // ✅ PREENCHER TODOS OS DIAS DO PERÍODO SELECIONADO (CORRIGIDO TIMEZONE)
    // 🔧 FIX: Usar parseISO + startOfDay para garantir timezone consistente
    const startDate = startOfDay(parseISO(dateRange.startDate));
    const endDate = startOfDay(parseISO(dateRange.endDate));
    console.log('📊 Processando período:', {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      totalDays: differenceInDays(endDate, startDate) + 1,
    });

    // Criar entrada para cada dia do período
    let currentDate = startOfDay(startDate); // ✅ Usar mesmo padrão das receitas
    let dayCount = 0;
    console.log('🔍 DEBUG: Iniciando criação do dailyMap');

    // ✅ FIX: Extrair ano e mês do range para validação rigorosa
    const [yearNum, monthNum] = dateRange.startDate.split('-').map(Number);

    while (currentDate <= endDate && dayCount < 100) {
      // Safety limit
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      // ✅ VALIDAÇÃO RIGOROSA: Excluir datas fora do mês selecionado
      const [dateYear, dateMonth] = dateKey.split('-').map(Number);
      if (dateYear !== yearNum || dateMonth !== monthNum) {
        console.log(
          `⚠️ IGNORANDO data fora do mês: ${dateKey} (esperado: ${yearNum}-${monthNum})`
        );
        currentDate = addDays(currentDate, 1);
        dayCount++;
        continue;
      }

      const dayOfWeek = format(currentDate, 'EEEE', { locale: ptBR });

      console.log(
        `📅 Criando entrada para: ${dateKey} (${dayOfWeek}) - DOW=${currentDate.getDay()}`
      );

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
        revenues: {
          received: [],
          pending: [],
        },
        expenses: {
          paid: [],
          pending: [],
        },
      });

      // Avançar para o próximo dia usando addDays do date-fns (evita problemas de timezone)
      currentDate = addDays(currentDate, 1);
      dayCount++;
    }

    console.log('✅ dailyMap criado com', dailyMap.size, 'dias');

    // ✅ PROCESSAR RECEITAS COM SEPARAÇÃO POR STATUS - REGIME DE COMPETÊNCIA
    // 💡 SEMPRE usa expected_receipt_date para alocação no fluxo (regime de competência)
    // A data de pagamento (revenue.date) serve apenas para separar PAGO vs PENDENTE
    console.log('🔍 DEBUG: Processando', revenues.length, 'receitas');

    // 🛡️ VERIFICAR SE HÁ RECEITAS DUPLICADAS POR ID
    const revenueIds = revenues.map(r => r.id);
    const uniqueIds = new Set(revenueIds);
    if (revenueIds.length !== uniqueIds.size) {
      console.warn('⚠️ AVISO: Receitas duplicadas detectadas!', {
        total: revenueIds.length,
        unique: uniqueIds.size,
        duplicates: revenueIds.filter(
          (id, index) => revenueIds.indexOf(id) !== index
        ),
      });
    }

    revenues.forEach(revenue => {
      // 🎯 NORMALIZAR DATA PARA EVITAR PROBLEMAS DE TIMEZONE
      const expectedDate = revenue.expected_receipt_date || revenue.date;

      // ✅ USAR parseISO + startOfDay para garantir data absolutamente limpa
      let cleanDate = startOfDay(parseISO(expectedDate));

      // 🚫 REGRA DE NEGÓCIO: Não há trabalho em fins de semana
      // Se a data cair em fim de semana, mover para a próxima segunda-feira usando helper
      cleanDate = moveWeekendToMonday(cleanDate);

      const date = format(cleanDate, 'yyyy-MM-dd');
      const category = revenue.status === 'Received' ? 'received' : 'pending';

      // ✅ FILTRAR APENAS DATAS DO MÊS VIGENTE - VALIDAÇÃO RIGOROSA
      const revenueDate = cleanDate; // Usar a data já limpa
      const filterStartDate = startOfDay(parseISO(dateRange.startDate));
      const filterEndDate = startOfDay(parseISO(dateRange.endDate));

      const isInRange =
        revenueDate >= filterStartDate && revenueDate <= filterEndDate;
      const hasDateEntry = dailyMap.has(date);

      if (isInRange && hasDateEntry) {
        const dayData = dailyMap.get(date);

        // 💰 CALCULAR VALOR LÍQUIDO (DESCONTANDO TAXAS) - IGUAL AO DRE
        const grossValue = revenue.value || 0;
        const fees = revenue.fees || 0;
        const netValue = grossValue - fees;

        console.log(
          `✅ Adicionando R$ ${netValue} (líquido) em ${date} como ${category}`
        );

        if (category === 'received') {
          // ✅ APENAS RECEITAS RECEBIDAS CONTAM COMO ENTRADA
          dayData.received_inflows += netValue;
          dayData.revenues.received.push(revenue);
        } else {
          // ❌ RECEITAS PENDENTES NÃO DEVEM APARECER COMO ENTRADAS
          // Comentado conforme solicitado pelo usuário
          // dayData.pending_inflows += netValue;
          dayData.revenues.pending.push(revenue);
        }
        dayData.transaction_count++;
      }
    });

    // ✅ PROCESSAR DESPESAS COM SEPARAÇÃO POR STATUS - REGIME DE COMPETÊNCIA
    // 💡 SEMPRE usa expected_payment_date para alocação no fluxo (regime de competência)
    // A data de pagamento (expense.date) serve apenas para separar PAGO vs PENDENTE
    expenses.forEach(expense => {
      // 🎯 USAR SEMPRE A DATA ESPERADA PARA ALOCAÇÃO NO FLUXO
      const date = format(
        new Date(expense.expected_payment_date || expense.date),
        'yyyy-MM-dd'
      );
      const category = expense.status === 'Paid' ? 'paid' : 'pending';

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

      // Calcular totais (mantendo para compatibilidade)
      dayData.total_inflows =
        dayData.received_inflows + dayData.pending_inflows;
      dayData.total_outflows = dayData.paid_outflows + dayData.pending_outflows;

      // ✅ CALCULAR SALDO DO DIA USANDO APENAS RECEITAS RECEBIDAS (conforme solicitado)
      const netInflows = dayData.received_inflows; // Apenas recebidas
      const netOutflows = dayData.total_outflows; // Pagas + pendentes
      dayData.dailyBalance = netInflows - netOutflows;

      // Calcular acumulado
      dayData.accumulatedBalance = accumulatedBalance + dayData.dailyBalance;
      accumulatedBalance = dayData.accumulatedBalance;
      return {
        ...dayData,
        dayNumber: index + 1,
      };
    });

    // ✅ ADICIONAR LINHA DE SALDO INICIAL NO INÍCIO (com chave única)
    const saldoInicialRow = {
      date: 'SALDO_INICIAL',
      // Chave única para evitar conflito com primeiro dia
      displayDate: dateRange.startDate,
      // Data para exibição
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
      revenues: {
        received: [],
        pending: [],
      },
      expenses: {
        paid: [],
        pending: [],
      },
      dayNumber: 0, // Dia 0 = Saldo Inicial
    };

    const finalResult = [saldoInicialRow, ...result];

    // 🚫 LIMPEZA FINAL: Garantir que fins de semana estejam zerados
    const cleanedResult = finalResult.map(day => {
      if (!day.isSaldoInicial && isWeekend(day.date)) {
        // Forçar zeramento completo de fins de semana
        return {
          ...day,
          received_inflows: 0,
          pending_inflows: 0,
          total_inflows: 0,
          paid_outflows: 0,
          pending_outflows: 0,
          total_outflows: 0,
          dailyBalance: 0,
          transaction_count: 0,
          revenues: { received: [], pending: [] },
          expenses: { paid: [], pending: [] },
        };
      }
      return day;
    });

    // 🔍 DEBUG FINAL: Resumo do range processado
    console.log(`[FLUXO-CAIXA-FINAL] Range processado:`, {
      totalDays: cleanedResult.length,
      firstDate: cleanedResult[0]?.date,
      lastDate: cleanedResult[cleanedResult.length - 1]?.date,
      weekendDays: cleanedResult.filter(d => {
        const dow = new Date(d.date + 'T12:00:00').getDay();
        return dow === 0 || dow === 6;
      }).length,
      expectedMonth: dateRange.startDate.substring(0, 7), // 'YYYY-MM'
    });

    // 🚨 FILTRO FINAL DEFENSIVO: Garantir que APENAS datas do mês selecionado sejam retornadas
    // (Inclui linha de SALDO INICIAL)
    const [expectedYear, expectedMonth] = dateRange.startDate
      .split('-')
      .map(Number);
    const filteredByMonth = cleanedResult.filter(day => {
      // Permitir linha de SALDO INICIAL
      if (day.isSaldoInicial || day.date === 'SALDO_INICIAL') {
        return true;
      }

      // Validar datas reais
      const [dayYear, dayMonth] = day.date.split('-').map(Number);
      const isInRange = dayYear === expectedYear && dayMonth === expectedMonth;

      if (!isInRange) {
        console.warn(
          `⚠️ [FILTRO-FINAL] Data fora do range REMOVIDA: ${day.date} (esperado: ${expectedYear}-${String(expectedMonth).padStart(2, '0')})`
        );
      }

      return isInRange;
    });

    console.log(
      `✅ [FILTRO-FINAL] Dias antes: ${cleanedResult.length}, depois: ${filteredByMonth.length}`
    );

    return filteredByMonth;
  };

  // ✅ FUNÇÃO SIMPLIFICADA - AGORA USAMOS APENAS OS DADOS CONSOLIDADOS
  const separatePaidPending = dailyData => {
    // Como agora temos uma tabela única consolidada,
    // esta função apenas retorna os dados já processados
    return {
      paid: dailyData,
      // Mesmos dados para ambos
      pending: dailyData,
      // pois já estão separados por status
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
        month: format(new Date(), 'MMM/yy', {
          locale: ptBR,
        }),
      },
      last12Months: {
        revenues: last12MonthsRevenues,
        expenses: last12MonthsExpenses,
        result: last12MonthsResult,
        profitMargin,
      },
    };
  };

  // Distribuição de receitas por categoria (baseado em data de pagamento)
  const calculateRevenueDistribution = (revenues, dateRange) => {
    const distribution = new Map();

    // Filtrar receitas pela data de pagamento (date) dentro do período
    const filteredRevenues = revenues.filter(revenue => {
      if (!revenue.date) {
        return false; // Ignora receitas sem data de pagamento
      }
      const paymentDate = new Date(revenue.date + 'T00:00:00');
      const periodStart = new Date(dateRange.startDate + 'T00:00:00');
      const periodEnd = new Date(dateRange.endDate + 'T23:59:59');

      // Incluir se a data de pagamento está dentro do período selecionado
      return paymentDate >= periodStart && paymentDate <= periodEnd;
    });
    filteredRevenues.forEach(revenue => {
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

  // Distribuição de despesas por categoria (baseado em data de vencimento esperada)
  const calculateExpenseDistribution = (expenses, dateRange) => {
    const distribution = new Map();

    // Filtrar despesas pela data de vencimento esperada (expected_payment_date)
    // independente do status (paga ou pendente)
    const filteredExpenses = expenses.filter(expense => {
      // Usar expected_payment_date se disponível, senão usar date
      const referenceDate = expense.expected_payment_date || expense.date;
      if (!referenceDate) {
        return false; // Ignora despesas sem data
      }
      const expenseDate = new Date(referenceDate + 'T00:00:00');
      const periodStart = new Date(dateRange.startDate + 'T00:00:00');
      const periodEnd = new Date(dateRange.endDate + 'T23:59:59');

      // Incluir se a data de vencimento esperada está dentro do período
      return expenseDate >= periodStart && expenseDate <= periodEnd;
    });
    filteredExpenses.forEach(expense => {
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

  // ✅ Carregar dados automaticamente quando período ou unidade mudar
  useEffect(() => {
    console.log('🔄 FluxoTab: Recarregando dados...', {
      period: selectedPeriod,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      unitId: globalFilters.unitId,
      description: periodDescription,
    });
    fetchCompleteCashflowData();
  }, [globalFilters.unitId, dateRange.startDate, dateRange.endDate]);

  // 🔍 DEBUG: Monitorar mudanças no cashflowData
  useEffect(() => {
    console.log('🔄 [CASHFLOW-STATE-CHANGE] Estado cashflowData atualizado:', {
      timestamp: new Date().toISOString(),
      hasCashflowData: !!cashflowData,
      hasDaily: !!cashflowData?.daily,
      dailyLength: cashflowData?.daily?.length || 0,
      dailyIsArray: Array.isArray(cashflowData?.daily),
      firstItem: cashflowData?.daily?.[0],
      allDates: cashflowData?.daily?.map(d => d.date) || [],
    });
  }, [cashflowData]);

  // Handlers
  // NOTA: handleDateRangeChange não é mais necessário pois usamos usePeriodFilter hook
  // const handleDateRangeChange = newRange => {
  //   if (newRange.startDate && newRange.endDate) {
  //     setDateRange({
  //       startDate: format(new Date(newRange.startDate), 'yyyy-MM-dd'),
  //       endDate: format(new Date(newRange.endDate), 'yyyy-MM-dd'),
  //     });
  //   }
  // };

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

  // 💰 Funções do Modal de Saldo Inicial
  const handleEditBalance = () => {
    // SEMPRE usar o mês vigente atual (novembro 2025), não o período do filtro
    const currentDate = new Date();
    const period = format(currentDate, 'yyyy-MM');
    setCurrentPeriod(period);
    setIsEditBalanceModalOpen(true);
  };

  const handleBalanceModalClose = () => {
    setIsEditBalanceModalOpen(false);
    setCurrentPeriod('');
  };

  const handleBalanceModalSuccess = () => {
    // Recarregar dados após sucesso
    handleRefresh();
    handleBalanceModalClose();
  };

  // 🎯 CRIAR COLUNAS DA TABELA TANSTACK
  const columns = useMemo(
    () => createCashflowColumns(formatCurrency, handleEditBalance),
    [formatCurrency, handleEditBalance]
  );

  // 🎯 CRIAR TABELA COM HOOK CUSTOMIZADO
  const { table, stats } = useCashflowTable({
    data: cashflowData.daily,
    columns,
    dateRange,
    includeWeekends: false, // ✅ Fins de semana REMOVIDOS automaticamente
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-theme-secondary font-medium">
          Carregando fluxo de caixa...
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <TrendingDown className="mb-4 h-16 w-16 text-red-400" />
        <h3 className="text-theme-primary mb-2 text-xl font-semibold">
          Erro ao carregar dados
        </h3>
        <p className="text-theme-secondary mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="btn-theme-primary flex items-center gap-2 rounded-xl px-6 py-3"
        >
          <RefreshCw className="h-5 w-5" />
          Tentar Novamente
        </button>
      </div>
    );
  }
  // DEBUG RENDER: listar as datas que serão renderizadas na tabela
  // Ajuda a confirmar no console do navegador se o bundle atual já contém o filtro final
  console.log('🔍 [RENDER-DATA] cashflowData.daily:', {
    exists: !!cashflowData,
    hasDaily: !!cashflowData?.daily,
    dailyLength: cashflowData?.daily?.length || 0,
    dailyIsArray: Array.isArray(cashflowData?.daily),
    dates: (cashflowData?.daily || []).map(d => d.date),
    fullData: cashflowData,
  });
  return (
    <div className="space-y-6">
      {/* 📊 Header com Controles - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl p-6">
        <div className="flex flex-col gap-6">
          {/* Linha 1: Título e Ações */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
                <BarChart3 className="text-dark-text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-theme-primary text-2xl font-bold">
                  Fluxo de Caixa
                </h2>
                <p className="text-theme-secondary text-sm">
                  Análise consolidada com filtros de período
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Botão Atualizar */}
              <button
                onClick={handleRefresh}
                className="text-theme-secondary hover:text-theme-primary rounded-xl p-2.5 transition-all hover:bg-light-hover dark:hover:bg-dark-hover"
                title="Atualizar"
              >
                <RefreshCw className="h-5 w-5" />
              </button>

              {/* Botões de Exportação */}
              <button
                onClick={() => handleExport('csv')}
                disabled={
                  exporting ||
                  !cashflowData.daily ||
                  cashflowData.daily.length === 0
                }
                className="text-theme-secondary hover:text-theme-primary flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-2.5 text-sm font-medium transition-all hover:bg-light-hover disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-hover"
                title="Exportar CSV"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
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
                className="text-theme-secondary hover:text-theme-primary flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-2.5 text-sm font-medium transition-all hover:bg-light-hover disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-hover"
                title="Exportar Excel"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
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
                className="btn-theme-primary flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                title="Exportar PDF"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF
              </button>
            </div>
          </div>

          {/* Linha 2: Filtros de Período */}
          <div className="border-t-2 border-light-border pt-6 dark:border-dark-border">
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>

          {/* Linha 3: Navegação de Período e Descrição */}
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border-2 border-light-border bg-primary/5 p-4 dark:border-dark-border dark:bg-primary/10 sm:flex-row">
            {/* Navegação */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousPeriod}
                className="rounded-lg p-2 text-primary transition-all hover:bg-light-hover dark:hover:bg-dark-hover"
                title="Período anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="card-theme flex items-center gap-2 rounded-lg border border-light-border px-4 py-2 dark:border-dark-border dark:bg-dark-surface">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-theme-primary text-sm font-bold">
                  {periodDescription}
                </span>
              </div>

              <button
                onClick={goToNextPeriod}
                className="rounded-lg p-2 text-primary transition-all hover:bg-light-hover dark:hover:bg-dark-hover"
                title="Próximo período"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Botão Hoje */}
            {!isCurrentPeriod && (
              <button
                onClick={resetToToday}
                className="btn-theme-primary rounded-lg px-4 py-2 shadow-md transition-all hover:shadow-lg"
              >
                Voltar para Hoje
              </button>
            )}

            {/* Badge Período Atual */}
            {isCurrentPeriod && (
              <div className="flex items-center gap-2 rounded-full border-2 border-green-200 bg-green-50 px-3 py-1.5 dark:border-green-800 dark:bg-green-900/20">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  PERÍODO ATUAL
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📈 Timeline de 12 Meses - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl border-2 border-transparent p-6 transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-700">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-500 p-2.5 shadow-lg">
            <TrendingUp className="text-dark-text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-theme-primary text-lg font-bold">
              Timeline dos Últimos 12 Meses
            </h3>
            <p className="text-theme-secondary text-sm">
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

      {/* 🎯 TABELA TANSTACK TABLE - Fluxo Diário Consolidado */}
      <CashflowTable
        table={table}
        loading={loading}
        emptyMessage="Nenhum dado de fluxo de caixa disponível para o período selecionado"
      />

      {/* 📊 Gráficos de Distribuição - PIE CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição de Receitas */}
        <PieChartCard
          title="Distribuição de Receitas"
          subtitle="Por categoria (data de pagamento)"
          data={cashflowData.revenueDistribution}
          type="revenue"
          formatValue={formatCurrency}
        />

        {/* Distribuição de Despesas */}
        <PieChartCard
          title="Distribuição de Despesas"
          subtitle="Por categoria (data de vencimento)"
          data={cashflowData.expenseDistribution}
          type="expense"
          formatValue={formatCurrency}
        />
      </div>

      {/* 💰 Modal de Edição do Saldo Inicial */}
      <EditInitialBalanceModal
        isOpen={isEditBalanceModalOpen}
        onClose={handleBalanceModalClose}
        onSuccess={handleBalanceModalSuccess}
        unitId={globalFilters.unitId}
        period={currentPeriod}
      />
    </div>
  );
};
export default FluxoTabRefactored;
