import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Building2,
  Edit,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Repeat,
  Pause,
  Play,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import expenseRepository from '../../repositories/expenseRepository';
import expenseService from '../../services/expenseService';
import { useToggleRecurring } from '../../hooks/useExpenses';

/**
 * 💳 Tab de Despesas (Competência) - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ 3 KPI Cards premium com gradientes temáticos
 * - ✅ Filtros compactos e elegantes
 * - ✅ Tabela moderna com hover effects
 * - ✅ Modais profissionais (Detalhes, Editar, Excluir)
 * - ✅ Seleção múltipla com ações em lote
 * - ✅ UI ultra moderna com feedback visual
 * - ✅ Dark mode completo
 * - ✅ Importação OFX integrada
 */
const DespesasAccrualTabRefactored = ({ globalFilters }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const { showToast } = useToast();

  // Estados dos modais
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentDateModalOpen, setIsPaymentDateModalOpen] = useState(false);
  const [selectedExpenseForAction, setSelectedExpenseForAction] =
    useState(null);
  const [selectedPaymentDate, setSelectedPaymentDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [recurringConfigs, setRecurringConfigs] = useState({}); // Cache de configurações de recorrência
  const [expandingSeries, setExpandingSeries] = useState(new Set()); // IDs de séries expandidas
  const [seriesData, setSeriesData] = useState({}); // Cache de séries de parcelas
  const { mutate: toggleRecurring, isLoading: isTogglingRecurring } =
    useToggleRecurring();

  // Filtros compactos
  const [filters, setFilters] = useState({
    dueDateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dueDateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'all', // all, paid, pending, overdue
    recurring: 'all', // all, recurring, non-recurring
  });

  // Buscar despesas
  const fetchExpenses = async () => {
    if (!globalFilters.unitId) return;
    try {
      setLoading(true);
      let query = supabase
        .from('expenses')
        .select(
          `
          *,
          category:categories(id, name),
          party:parties(id, nome),
          account:bank_accounts(id, name, bank_name)
        `
        )
        .eq('unit_id', globalFilters.unitId)
        .eq('is_active', true)
        .order('expected_payment_date', {
          ascending: false,
        });

      // Aplicar filtro de recorrência
      if (filters.recurring === 'recurring') {
        query = query.eq('is_recurring', true);
      } else if (filters.recurring === 'non-recurring') {
        query = query.eq('is_recurring', false);
      }

      // Aplicar filtro de data
      if (filters.dueDateFrom) {
        query = query.gte('expected_payment_date', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('expected_payment_date', filters.dueDateTo);
      }
      const { data, error } = await query;
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      showToast({
        type: 'error',
        message: 'Erro ao carregar despesas',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchExpenses();
  }, [
    globalFilters.unitId,
    filters.dueDateFrom,
    filters.dueDateTo,
    filters.recurring,
  ]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const paid = expenses.filter(e => e.status?.toLowerCase() === 'paid');
    const pending = expenses.filter(e => e.status?.toLowerCase() === 'pending');
    const overdue = expenses.filter(e => {
      if (e.status?.toLowerCase() === 'paid') return false;
      const dueDate = parseISO(e.expected_payment_date);
      return isBefore(dueDate, now);
    });
    return {
      paid: {
        count: paid.length,
        total: paid.reduce((sum, e) => sum + (e.paid_value || e.value || 0), 0),
      },
      pending: {
        count: pending.length,
        total: pending.reduce((sum, e) => sum + (e.value || 0), 0),
      },
      overdue: {
        count: overdue.length,
        total: overdue.reduce((sum, e) => sum + (e.value || 0), 0),
      },
    };
  }, [expenses]);

  // Filtrar despesas por busca e status
  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.description?.toLowerCase().includes(search) ||
          e.party?.nome?.toLowerCase().includes(search) ||
          e.category?.name?.toLowerCase().includes(search)
      );
    }

    // Filtro de status
    if (filters.status !== 'all') {
      const now = new Date();
      if (filters.status === 'paid') {
        filtered = filtered.filter(e => e.status?.toLowerCase() === 'paid');
      } else if (filters.status === 'pending') {
        filtered = filtered.filter(
          e =>
            e.status?.toLowerCase() === 'pending' &&
            !isBefore(parseISO(e.expected_payment_date), now)
        );
      } else if (filters.status === 'overdue') {
        filtered = filtered.filter(e => {
          if (e.status?.toLowerCase() === 'paid') return false;
          const dueDate = parseISO(e.expected_payment_date);
          return isBefore(dueDate, now);
        });
      }
    }
    return filtered;
  }, [expenses, searchTerm, filters.status]);

  // Formatação de valores
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };
  const formatDate = dateStr => {
    if (!dateStr) return '-';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', {
        locale: ptBR,
      });
    } catch {
      return dateStr;
    }
  };

  // Status badge
  const getStatusBadge = expense => {
    const now = new Date();
    const dueDate = parseISO(expense.expected_payment_date);
    const isOverdue =
      isBefore(dueDate, now) && expense.status?.toLowerCase() !== 'paid';
    if (expense.status?.toLowerCase() === 'paid') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Pago
        </span>
      );
    }
    if (isOverdue) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mr-1 h-3 w-3" />
          Atrasado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        <Clock className="mr-1 h-3 w-3" />
        Pendente
      </span>
    );
  };

  // Handlers de ações
  const handleViewDetails = expense => {
    setSelectedExpenseForAction(expense);
    setIsDetailsModalOpen(true);
  };
  const handleEdit = expense => {
    setSelectedExpenseForAction(expense);
    setIsEditModalOpen(true);
  };
  const handleDelete = expense => {
    console.log('🗑️ handleDelete chamado para despesa:', expense);
    setSelectedExpenseForAction(expense);
    setIsDeleteModalOpen(true);
  };

  // ✨ Dar Baixa Rápida - Marca despesa como paga
  const handleDarBaixa = async expense => {
    setSelectedExpenseForAction(expense);
    setIsPaymentDateModalOpen(true);
  };

  // Confirmar baixa com data selecionada
  const handleConfirmDarBaixa = async () => {
    if (!selectedPaymentDate || !selectedExpenseForAction) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'Paid',
          actual_payment_date: selectedPaymentDate,
        })
        .eq('id', selectedExpenseForAction.id);
      if (error) throw error;
      showToast({
        type: 'success',
        message: 'Baixa realizada!',
        description: `Despesa "${selectedExpenseForAction.description}" marcada como paga.`,
      });
      setIsPaymentDateModalOpen(false);
      setSelectedPaymentDate(null);
      setSelectedExpenseForAction(null);
      fetchExpenses();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao dar baixa',
        description: error.message,
      });
    }
  };

  // Carregar configuração de recorrência para uma despesa
  const loadRecurringConfig = async expenseId => {
    if (recurringConfigs[expenseId]) {
      return recurringConfigs[expenseId];
    }

    try {
      const { data, error } =
        await expenseRepository.findRecurringByExpenseId(expenseId);
      if (error || !data) {
        return null;
      }

      setRecurringConfigs(prev => ({
        ...prev,
        [expenseId]: data,
      }));

      return data;
    } catch (error) {
      console.error('Erro ao carregar configuração de recorrência:', error);
      return null;
    }
  };

  // Carregar série de parcelas
  const loadSeries = async seriesId => {
    if (seriesData[seriesId]) {
      return seriesData[seriesId];
    }

    try {
      const { data, error } = await expenseRepository.findBySeries(seriesId);
      if (error || !data) {
        return [];
      }

      setSeriesData(prev => ({
        ...prev,
        [seriesId]: data,
      }));

      return data;
    } catch (error) {
      console.error('Erro ao carregar série:', error);
      return [];
    }
  };

  // Toggle expandir série
  const toggleSeriesExpansion = async expense => {
    const seriesId = expense.recurring_series_id || expense.id;

    if (expandingSeries.has(seriesId)) {
      setExpandingSeries(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesId);
        return newSet;
      });
    } else {
      setExpandingSeries(prev => new Set(prev).add(seriesId));
      await loadSeries(seriesId);
    }
  };

  // Pausar/Retomar recorrência
  const handleToggleRecurring = async expense => {
    const seriesId = expense.recurring_series_id || expense.id;
    const config = await loadRecurringConfig(seriesId);
    if (!config) {
      showToast({
        type: 'error',
        message: 'Erro',
        description: 'Configuração de recorrência não encontrada',
      });
      return;
    }

    toggleRecurring(
      {
        recurringExpenseId: config.id,
        currentStatus: config.status,
      },
      {
        onSuccess: () => {
          fetchExpenses();
          setRecurringConfigs(prev => ({
            ...prev,
            [seriesId]: null, // Limpar cache para recarregar
          }));
        },
      }
    );
  };
  return (
    <div className="space-y-6">
      {/* 💳 KPI Cards Premium - DESIGN SYSTEM */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card: Despesas Pagas */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-green-300 dark:hover:border-green-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-success p-3 shadow-lg">
              <CheckCircle className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingDown className="h-5 w-5 text-green-500 opacity-60 dark:text-green-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Despesas Pagas
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(kpis.paid.total)}
          </p>
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            {kpis.paid.count} despesa{kpis.paid.count !== 1 ? 's' : ''} pagas no
            período
          </p>
        </div>

        {/* Card: Despesas a Pagar */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-yellow-300 dark:hover:border-yellow-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 p-3 shadow-lg">
              <Clock className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-yellow-500 opacity-60 dark:text-yellow-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Despesas a Pagar
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(kpis.pending.total)}
          </p>
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
            {kpis.pending.count} despesa{kpis.pending.count !== 1 ? 's' : ''}{' '}
            pendentes
          </p>
        </div>

        {/* Card: Despesas Atrasadas */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-red-300 dark:hover:border-red-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-red-500 to-pink-600 p-3 shadow-lg">
              <AlertTriangle className="text-dark-text-primary h-6 w-6" />
            </div>
            <AlertCircle className="h-5 w-5 text-red-500 opacity-60 dark:text-red-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Despesas Atrasadas
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(kpis.overdue.total)}
          </p>
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {kpis.overdue.count} despesa{kpis.overdue.count !== 1 ? 's' : ''}{' '}
            vencidas
          </p>
        </div>
      </div>

      {/* 🎛️ Filtros e Ações Premium - DESIGN SYSTEM */}
      <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-light-border dark:border-dark-border dark:hover:border-dark-border">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca, Filtros e Botão Nova Despesa */}
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            {/* Busca Premium */}
            <div className="relative max-w-md flex-1">
              <Search className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Buscar por descrição, fornecedor ou categoria..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 placeholder-gray-400 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
              />
            </div>

            {/* Filtros Compactos */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
              >
                <option value="all">📋 Todos os Status</option>
                <option value="paid">✅ Pagas</option>
                <option value="pending">⏳ Pendentes</option>
                <option value="overdue">⚠️ Atrasadas</option>
              </select>

              {/* Filtro de Recorrência */}
              <select
                value={filters.recurring}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    recurring: e.target.value,
                  }))
                }
                className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
              >
                <option value="all">🔄 Todas</option>
                <option value="recurring">🔁 Recorrentes</option>
                <option value="non-recurring">📝 Não Recorrentes</option>
              </select>

              {/* Data Início */}
              <div className="card-theme flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <input
                  type="date"
                  value={filters.dueDateFrom}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      dueDateFrom: e.target.value,
                    }))
                  }
                  className="text-theme-primary cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
                />
              </div>

              {/* Data Fim */}
              <div className="card-theme flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <input
                  type="date"
                  value={filters.dueDateTo}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      dueDateTo: e.target.value,
                    }))
                  }
                  className="text-theme-primary cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
                />
              </div>

              {/* Botão Nova Despesa */}
              <button
                onClick={() => {
                  setSelectedExpenseForAction(null);
                  setIsEditModalOpen(true);
                }}
                className="text-dark-text-primary flex transform items-center gap-2 rounded-xl bg-gradient-primary bg-gradient-to-r px-5 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Nova Despesa
              </button>

              {/* Botão Importar OFX */}
              <ImportExpensesFromOFXButton
                unitId={globalFilters.unitId}
                onSuccess={fetchExpenses}
              />
            </div>
          </div>

          {/* Linha 2: Ações de Seleção Múltipla */}
          {filteredExpenses.length > 0 && (
            <div className="flex items-center gap-3 border-t-2 border-light-border pt-4 dark:border-dark-border">
              <button
                onClick={() => {
                  if (selectedExpenses.length === filteredExpenses.length) {
                    setSelectedExpenses([]);
                  } else {
                    setSelectedExpenses(filteredExpenses.map(e => e.id));
                  }
                }}
                className="flex items-center gap-2 rounded-xl border-2 border-transparent px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:hover:border-blue-800 dark:hover:bg-blue-900/20"
              >
                <CheckCircle className="h-4 w-4" />
                {selectedExpenses.length === filteredExpenses.length
                  ? 'Desmarcar Todas'
                  : 'Selecionar Todas'}
              </button>

              {selectedExpenses.length > 0 && (
                <>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-theme-primary text-sm font-semibold">
                    {selectedExpenses.length} despesa
                    {selectedExpenses.length !== 1 ? 's' : ''} selecionada
                    {selectedExpenses.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={async () => {
                      if (
                        window.confirm(
                          `Tem certeza que deseja excluir ${selectedExpenses.length} despesa${selectedExpenses.length !== 1 ? 's' : ''}?`
                        )
                      ) {
                        try {
                          const { error } = await supabase
                            .from('expenses')
                            .update({
                              is_active: false,
                            })
                            .in('id', selectedExpenses);
                          if (error) throw error;
                          showToast({
                            type: 'success',
                            message: 'Despesas excluídas',
                            description: `${selectedExpenses.length} despesa${selectedExpenses.length !== 1 ? 's' : ''} excluída${selectedExpenses.length !== 1 ? 's' : ''} com sucesso!`,
                          });
                          setSelectedExpenses([]);
                          fetchExpenses();
                        } catch (error) {
                          console.error('❌ Erro ao excluir despesas:', error);
                          showToast({
                            type: 'error',
                            message: 'Erro ao excluir despesas',
                            description:
                              error.message ||
                              'Não foi possível excluir as despesas.',
                          });
                        }
                      }
                    }}
                    className="text-dark-text-primary flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 px-4 py-2.5 text-sm font-semibold shadow-lg transition-all duration-200 hover:from-red-700 hover:to-pink-700 hover:shadow-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir Selecionadas
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 📊 Tabela Premium - DESIGN SYSTEM */}
      <div className="card-theme overflow-hidden rounded-xl border-2 border-transparent transition-all duration-300 hover:border-light-border dark:border-dark-border dark:hover:border-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="dark:to-gray-750 border-b-2 border-light-border bg-gradient-light dark:border-dark-border dark:from-gray-800">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedExpenses.length === filteredExpenses.length &&
                      filteredExpenses.length > 0
                    }
                    onChange={() => {
                      if (selectedExpenses.length === filteredExpenses.length) {
                        setSelectedExpenses([]);
                      } else {
                        setSelectedExpenses(filteredExpenses.map(e => e.id));
                      }
                    }}
                    className="card-theme h-4 w-4 cursor-pointer rounded border-light-border text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  />
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Documento
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Pessoa
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Valor
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Pago
                </th>
                <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="text-theme-secondary px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      <span className="text-theme-secondary font-medium">
                        Carregando despesas...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-theme-secondary px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <CreditCard className="dark:text-theme-secondary h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Nenhuma despesa encontrada</p>
                      <p className="text-xs">
                        Tente ajustar os filtros ou adicione uma nova despesa
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <React.Fragment key={expense.id}>
                    <tr
                      className={`group transition-all duration-200 ${selectedExpenses.includes(expense.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'dark:hover:to-gray-750/50 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/50 dark:hover:from-gray-800/50'}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedExpenses(prev => [
                                ...prev,
                                expense.id,
                              ]);
                            } else {
                              setSelectedExpenses(prev =>
                                prev.filter(id => id !== expense.id)
                              );
                            }
                          }}
                          className="card-theme h-4 w-4 cursor-pointer rounded border-light-border text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-gradient-to-br from-red-100 to-pink-100 p-2 dark:from-red-900/30 dark:to-pink-900/30">
                            <CreditCard className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-theme-primary text-sm font-semibold">
                                {expense.description || 'Sem descrição'}
                              </p>
                              {expense.is_recurring && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                  <Repeat className="h-3 w-3" />
                                  Recorrente
                                </span>
                              )}
                              {expense.installment_number && (
                                <span className="text-theme-secondary text-xs">
                                  Parcela {expense.installment_number}
                                </span>
                              )}
                            </div>
                            <p className="text-theme-secondary mt-1 text-xs">
                              {expense.category?.name || 'Sem categoria'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-theme-primary text-sm font-medium">
                          {expense.party?.nome || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-theme-primary text-sm font-medium">
                          {formatDate(expense.expected_payment_date)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(expense.value)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {expense.paid_value ? (
                          <>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(expense.paid_value)}
                            </p>
                            {expense.payment_date && (
                              <p className="text-theme-secondary text-xs">
                                {formatDate(expense.payment_date)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-theme-secondary text-sm">-</p>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(expense)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(expense)}
                            className="rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Botão Dar Baixa - Só aparece se status != Paid */}
                          {expense.status !== 'Paid' && (
                            <button
                              onClick={() => handleDarBaixa(expense)}
                              className="rounded-lg p-2 text-green-600 transition-all duration-200 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                              title="Dar Baixa"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* Botões para Despesas Recorrentes */}
                          {expense.is_recurring && (
                            <>
                              {/* Botão Ver Série */}
                              <button
                                onClick={() => toggleSeriesExpansion(expense)}
                                className="rounded-lg p-2 text-purple-600 transition-all duration-200 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
                                title="Ver série de parcelas"
                              >
                                <Repeat className="h-4 w-4" />
                              </button>

                              {/* Botão Pausar/Retomar */}
                              <button
                                onClick={() => handleToggleRecurring(expense)}
                                disabled={isTogglingRecurring}
                                className="rounded-lg p-2 text-orange-600 transition-all duration-200 hover:bg-orange-100 disabled:opacity-50 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                title="Pausar/Retomar recorrência"
                              >
                                {recurringConfigs[
                                  expense.recurring_series_id || expense.id
                                ]?.status === 'pausado' ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Pause className="h-4 w-4" />
                                )}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleEdit(expense)}
                            className="rounded-lg p-2 text-yellow-600 transition-all duration-200 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expense.is_recurring &&
                      expandingSeries.has(
                        expense.recurring_series_id || expense.id
                      ) &&
                      seriesData[expense.recurring_series_id || expense.id] && (
                        <tr
                          key={`${expense.id}-series`}
                          className="bg-purple-50/50 dark:bg-purple-900/10"
                        >
                          <td colSpan="8" className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="mb-3 flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <h4 className="text-theme-primary text-sm font-semibold">
                                  Série de Parcelas (
                                  {seriesData[
                                    expense.recurring_series_id || expense.id
                                  ]?.length || 0}{' '}
                                  parcelas)
                                </h4>
                              </div>
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                {seriesData[
                                  expense.recurring_series_id || expense.id
                                ]?.map(installment => (
                                  <div
                                    key={installment.id}
                                    className={`rounded-lg border-2 p-3 ${
                                      installment.id === expense.id
                                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-theme-primary text-xs font-semibold">
                                          Parcela{' '}
                                          {installment.installment_number}
                                        </p>
                                        <p className="text-theme-secondary text-xs">
                                          {formatDate(
                                            installment.expected_payment_date
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                          {formatCurrency(installment.value)}
                                        </p>
                                        {installment.status === 'Paid' && (
                                          <span className="text-xs text-green-600 dark:text-green-400">
                                            ✓ Paga
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {isDetailsModalOpen && selectedExpenseForAction && (
        <ExpenseDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedExpenseForAction(null);
          }}
          expense={selectedExpenseForAction}
        />
      )}

      {isEditModalOpen && (
        <NovaDespesaModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedExpenseForAction(null);
          }}
          initialData={selectedExpenseForAction}
          isEditing={!!selectedExpenseForAction}
          unidadeId={globalFilters.unitId}
          onSave={() => {
            fetchExpenses();
            setIsEditModalOpen(false);
            setSelectedExpenseForAction(null);
          }}
        />
      )}

      {isDeleteModalOpen && selectedExpenseForAction && (
        <DeleteConfirmationModal
          expense={selectedExpenseForAction}
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedExpenseForAction(null);
          }}
          onDelete={() => {
            // Callback chamado após exclusão bem-sucedida
            setIsDeleteModalOpen(false);
            setSelectedExpenseForAction(null);
            fetchExpenses();
          }}
        />
      )}

      {/* Modal de Seleção de Data de Pagamento */}
      {isPaymentDateModalOpen && selectedExpenseForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card-theme w-full max-w-md space-y-4 rounded-lg p-6 shadow-2xl dark:bg-dark-surface">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-border pb-4 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                  <CheckCircle className="text-dark-text-primary h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                    Dar Baixa na Despesa
                  </h3>
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    {selectedExpenseForAction.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentDateModalOpen(false);
                  setSelectedExpenseForAction(null);
                  setSelectedPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                }}
                className="hover:card-theme rounded-lg p-1 transition-colors dark:hover:bg-gray-700"
              >
                <X className="text-theme-secondary h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              <div>
                <label className="dark:text-theme-secondary mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  value={selectedPaymentDate}
                  onChange={e => setSelectedPaymentDate(e.target.value)}
                  max={format(new Date(), 'yyyy-MM-dd')} // Não permite datas futuras
                  min={format(startOfMonth(new Date()), 'yyyy-MM-dd')} // Apenas no mês atual
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border-2 border-light-border px-4 py-3 text-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-dark-border dark:bg-gray-700"
                />
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-2 text-xs">
                  ⚠️ A data deve ser hoje ou anterior, dentro do mês atual.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="mb-1 font-medium">Atenção:</p>
                    <p>
                      Ao confirmar, a despesa será marcada como{' '}
                      <strong>PAGA</strong> e refletirá em todos os relatórios
                      financeiros.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentDateModalOpen(false);
                  setSelectedExpenseForAction(null);
                  setSelectedPaymentDate(format(new Date(), 'yyyy-MM-dd'));
                }}
                className="dark:text-theme-secondary card-theme flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDarBaixa}
                disabled={!selectedPaymentDate}
                className="text-dark-text-primary flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-success px-4 py-2.5 text-sm font-medium shadow-md transition-all hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DespesasAccrualTabRefactored;
