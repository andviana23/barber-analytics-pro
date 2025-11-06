import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  DollarSign,
  Building2,
  Edit,
  Eye,
  ArrowDown,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExpenseDetailsModal from '../../components/modals/ExpenseDetailsModal';
import ExpenseEditModal from '../../components/modals/ExpenseEditModal';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import ImportExpensesFromOFXButton from '../../components/finance/ImportExpensesFromOFXButton';

/**
 * Tab de Despesas Refatorada
 *
 * Interface inspirada nas imagens fornecidas:
 * - Filtros de data (emissão, pagamento, vencimento)
 * - Tabela completa com todas as colunas necessárias
 * - Cards de resumo financeiro
 * - Modal de dados da baixa
 * - Ações de mudar status e dar baixa
 */
const DespesasAccrualTab = ({ globalFilters }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] =
    useState(null);
  const [expenseActionsOpen, setExpenseActionsOpen] = useState(null);

  // Estados dos modais
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpenseForAction, setSelectedExpenseForAction] =
    useState(null);
  const { showToast } = useToast();

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = event => {
      if (expenseActionsOpen && !event.target.closest('.dropdown-container')) {
        setExpenseActionsOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expenseActionsOpen]);

  // Filtros de data - apenas Data de Vencimento
  const [filters, setFilters] = useState({
    dueDateFrom: '',
    dueDateTo: '',
  });

  // Dados do modal de pagamento
  const [paymentData, setPaymentData] = useState({
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    bankId: '',
    paidValue: '',
    interestValue: '',
    discountValue: '',
    observation: '',
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Carregar bancos da unidade
  const fetchBankAccounts = async () => {
    if (!globalFilters.unitId) return;
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name, account_number')
        .eq('unit_id', globalFilters.unitId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar bancos:', error);
      showToast({
        type: 'error',
        message: 'Erro ao carregar bancos',
        description: error.message,
      });
    }
  };

  // Buscar despesas
  const fetchExpenses = async () => {
    if (!globalFilters.unitId) return;
    try {
      setLoading(true);
      console.log('🔄 Buscando despesas para unidade:', globalFilters.unitId);
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
        .eq('unit_id', globalFilters.unitId);

      // Filtro automático para mês vigente (se não há filtros manuais)
      const hasManualFilters = filters.dueDateFrom || filters.dueDateTo;
      if (!hasManualFilters) {
        // Aplicar filtro automático do mês vigente
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        query = query
          .gte(
            'expected_payment_date',
            startOfMonth.toISOString().split('T')[0]
          )
          .lte('expected_payment_date', endOfMonth.toISOString().split('T')[0]);
        console.log('📅 Aplicando filtro automático do mês vigente:', {
          startOfMonth: startOfMonth.toISOString().split('T')[0],
          endOfMonth: endOfMonth.toISOString().split('T')[0],
        });
      } else {
        // Aplicar filtros manuais de data de vencimento
        if (filters.dueDateFrom) {
          query = query.gte('expected_payment_date', filters.dueDateFrom);
        }
        if (filters.dueDateTo) {
          query = query.lte('expected_payment_date', filters.dueDateTo);
        }
        console.log('📅 Aplicando filtros manuais:', filters);
      }
      const { data, error } = await query.order('date', {
        ascending: false,
      });
      if (error) throw error;
      console.log('✅ Despesas carregadas:', data?.length || 0);
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

  // Carregar despesas quando mudar filtros ou unidade
  useEffect(() => {
    fetchExpenses();
    fetchBankAccounts();
  }, [globalFilters.unitId, filters]);

  // Filtrar despesas por termo de busca
  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    return expenses.filter(
      expense =>
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.party?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalTitles = filteredExpenses.reduce(
      (sum, expense) => sum + (expense.value || 0),
      0
    );
    const totalPaid = filteredExpenses.reduce(
      (sum, expense) =>
        sum + (expense.status === 'Paid' ? expense.value || 0 : 0),
      0
    );
    const totalOpen = totalTitles - totalPaid;
    return {
      totalTitles,
      totalPaid,
      totalOpen,
    };
  }, [filteredExpenses]);

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      dueDateFrom: '',
      dueDateTo: '',
    });
  };

  // Abrir modal de pagamento
  const openPaymentModal = expense => {
    setSelectedExpenseForPayment(expense);
    setPaymentData({
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      bankId: expense.account_id || '',
      // Pré-selecionar o banco da despesa
      paidValue: expense.value ? expense.value.toFixed(2) : '',
      interestValue: '',
      discountValue: '',
      observation: '',
    });
    setIsPaymentModalOpen(true);
    setExpenseActionsOpen(null);
  };

  // Abrir modal de detalhes
  const openDetailsModal = expense => {
    setSelectedExpenseForAction(expense);
    setIsDetailsModalOpen(true);
    setExpenseActionsOpen(null);
  };

  // Abrir modal de edição
  const openEditModal = expense => {
    setSelectedExpenseForAction(expense);
    setIsEditModalOpen(true);
    setExpenseActionsOpen(null);
  };

  // Abrir modal de exclusão
  const openDeleteModal = expense => {
    setSelectedExpenseForAction(expense);
    setIsDeleteModalOpen(true);
    setExpenseActionsOpen(null);
  };

  // Fechar todos os modais
  const closeAllModals = () => {
    setIsPaymentModalOpen(false);
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedExpenseForPayment(null);
    setSelectedExpenseForAction(null);
  };

  // Funções de formatação monetária
  const formatCurrency = value => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toFixed(2);
  };
  const parseCurrency = value => {
    if (!value) return '';
    return value.replace(/[^\d.,]/g, '').replace(',', '.');
  };
  const handleCurrencyChange = (field, value) => {
    const parsedValue = parseCurrency(value);
    setPaymentData(prev => ({
      ...prev,
      [field]: parsedValue,
    }));
  };

  // Processar pagamento
  const processPayment = async () => {
    if (!selectedExpenseForPayment) return;

    // Validações
    const bankId = paymentData.bankId || selectedExpenseForPayment.account_id;
    if (!bankId) {
      showToast({
        type: 'error',
        message: 'Banco não encontrado',
        description: 'Não foi possível identificar o banco para o pagamento',
      });
      return;
    }
    if (!paymentData.paidValue || parseFloat(paymentData.paidValue) <= 0) {
      showToast({
        type: 'error',
        message: 'Valor inválido',
        description: 'O valor pago deve ser maior que zero',
      });
      return;
    }
    try {
      setPaymentLoading(true);

      // Obter usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Criar registro de pagamento detalhado
      const { error: paymentError } = await supabase
        .from('expense_payments')
        .insert({
          expense_id: selectedExpenseForPayment.id,
          unit_id: globalFilters.unitId,
          payment_date: paymentData.paymentDate,
          bank_id: bankId,
          paid_value: parseFloat(paymentData.paidValue),
          interest_value: parseFloat(paymentData.interestValue) || 0,
          discount_value: parseFloat(paymentData.discountValue) || 0,
          observation: paymentData.observation,
          created_by: user?.id,
        });
      if (paymentError) throw paymentError;

      // Atualizar status da despesa para "Paid"
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          status: 'Paid',
          actual_payment_date: paymentData.paymentDate,
          observations: paymentData.observation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedExpenseForPayment.id);
      if (expenseError) throw expenseError;
      showToast({
        type: 'success',
        message: 'Pagamento processado com sucesso!',
        description: 'A despesa foi marcada como paga',
      });
      setIsPaymentModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      showToast({
        type: 'error',
        message: 'Erro ao processar pagamento',
        description: error.message,
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // ✨ Dar Baixa Rápida (sem modal) - Marca como pago na data atual
  const darBaixaRapida = async expense => {
    if (!expense) return;
    try {
      const hoje = new Date().toISOString().split('T')[0];

      // Atualizar status para Paid e registrar data de pagamento
      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'Paid',
          actual_payment_date: hoje,
          payment_date: hoje,
        })
        .eq('id', expense.id);
      if (error) throw error;
      showToast({
        type: 'success',
        message: 'Baixa realizada com sucesso!',
        description: `Despesa "${expense.description}" marcada como paga.`,
      });
      fetchExpenses();
    } catch (error) {
      console.error('❌ Erro ao dar baixa:', error);
      showToast({
        type: 'error',
        message: 'Erro ao dar baixa',
        description: error.message,
      });
    }
  };

  // Mudar status da despesa
  const changeStatus = async (expenseId, newStatus) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          status: newStatus,
        })
        .eq('id', expenseId);
      if (error) throw error;
      showToast({
        type: 'success',
        message: 'Status atualizado com sucesso!',
      });
      fetchExpenses();
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      showToast({
        type: 'error',
        message: 'Erro ao atualizar status',
        description: error.message,
      });
    }
  };

  // Obter cor do status
  const getStatusColor = status => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-light-surface/50 text-theme-secondary dark:bg-dark-surface/50 dark:text-dark-text-muted';
    }
  };

  // Obter texto do status
  const getStatusText = status => {
    switch (status) {
      case 'Paid':
        return 'Pago';
      case 'Pending':
        return 'Aberto';
      case 'Overdue':
        return 'Vencido';
      default:
        return status;
    }
  };
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Filtros Ultra Compactos */}
      <div className="card-theme mb-2 rounded-lg border border-light-border p-2 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[300px] flex-1 items-center gap-2">
            <Calendar className="text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
            <input
              type="date"
              value={filters.dueDateFrom}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  dueDateFrom: e.target.value,
                }))
              }
              className="card-theme text-theme-primary dark:text-dark-text-primary flex-1 rounded border border-light-border px-2 py-1 text-xs dark:border-dark-border dark:bg-gray-700"
            />
            <span className="text-light-text-muted dark:text-dark-text-muted text-xs">
              até
            </span>
            <input
              type="date"
              value={filters.dueDateTo}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  dueDateTo: e.target.value,
                }))
              }
              className="card-theme text-theme-primary dark:text-dark-text-primary flex-1 rounded border border-light-border px-2 py-1 text-xs dark:border-dark-border dark:bg-gray-700"
            />
          </div>
          <button
            onClick={fetchExpenses}
            className="text-dark-text-primary flex items-center rounded bg-green-600 px-2 py-1 text-xs transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            <Search className="mr-1 h-3 w-3" />
            Buscar
          </button>
          <button
            onClick={clearFilters}
            className="btn-theme-secondary flex items-center rounded px-2 py-1 text-xs transition-colors"
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela com Container Controlado */}
      <div className="card-theme flex min-h-0 flex-1 flex-col rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
        {/* Controles da Tabela */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-light-border p-2 dark:border-dark-border">
          <div className="flex items-center gap-2">
            <select className="card-theme text-theme-primary dark:text-dark-text-primary rounded border border-light-border px-2 py-1 text-xs dark:border-dark-border dark:bg-gray-700">
              <option>10 por página</option>
              <option>25 por página</option>
              <option>50 por página</option>
            </select>
            <ImportExpensesFromOFXButton
              onImportSuccess={result => {
                showToast({
                  type: 'success',
                  message: 'Importação concluída!',
                  description: `${result.sucesso || result.imported} despesas importadas.`,
                });
                fetchExpenses();
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <Search className="text-light-text-muted dark:text-dark-text-muted h-3 w-3" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="card-theme text-theme-primary dark:text-dark-text-primary w-48 rounded border border-light-border px-2 py-1 text-xs dark:border-dark-border dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Tabela com Scroll Horizontal e Vertical */}
        <div className="flex-1 overflow-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="sticky top-0 z-10 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface">
              <tr>
                <th className="w-8 px-2 py-1 text-left">
                  <input type="checkbox" className="h-3 w-3 rounded" />
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted min-w-[250px] px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Documento
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-24 px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Emissão
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-32 px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Plano
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-32 px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Pessoa
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-24 px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Venc.
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-28 px-2 py-1 text-right text-[10px] font-medium uppercase">
                  Valor
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-28 px-2 py-1 text-right text-[10px] font-medium uppercase">
                  Pago
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-24 px-2 py-1 text-left text-[10px] font-medium uppercase">
                  Pgto
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-20 px-2 py-1 text-center text-[10px] font-medium uppercase">
                  Status
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-16 px-2 py-1 text-center text-[10px] font-medium uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="card-theme divide-y divide-gray-200 dark:divide-gray-700 dark:bg-dark-surface">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                      <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted ml-2">
                        Carregando...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-8 text-center"
                  >
                    Nenhuma despesa encontrada
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr
                    key={expense.id}
                    className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700"
                  >
                    <td className="px-2 py-1">
                      <input type="checkbox" className="h-3 w-3 rounded" />
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary px-2 py-1 text-[11px] font-medium">
                      <div className="line-clamp-1">
                        {expense.description || '-'}
                      </div>
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted whitespace-nowrap px-2 py-1 text-[11px]">
                      {expense.date
                        ? format(parseISO(expense.date), 'dd/MM/yy', {
                            locale: ptBR,
                          })
                        : '-'}
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-2 py-1 text-[11px]">
                      <div className="truncate">
                        {expense.category?.name || '-'}
                      </div>
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-2 py-1 text-[11px]">
                      <div className="truncate">
                        {expense.party?.nome || '-'}
                      </div>
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted whitespace-nowrap px-2 py-1 text-[11px]">
                      {expense.expected_payment_date
                        ? format(
                            parseISO(expense.expected_payment_date),
                            'dd/MM/yy',
                            {
                              locale: ptBR,
                            }
                          )
                        : '-'}
                    </td>
                    <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-2 py-1 text-right text-[11px] font-semibold">
                      {expense.value?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }) || '-'}
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted whitespace-nowrap px-2 py-1 text-right text-[11px]">
                      {expense.status === 'Paid'
                        ? expense.value?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : 'R$ 0,00'}
                    </td>
                    <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted whitespace-nowrap px-2 py-1 text-[11px]">
                      {expense.actual_payment_date
                        ? format(
                            parseISO(expense.actual_payment_date),
                            'dd/MM/yy',
                            {
                              locale: ptBR,
                            }
                          )
                        : '-'}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getStatusColor(expense.status)}`}
                      >
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <div className="dropdown-container relative">
                        <button
                          onClick={() =>
                            setExpenseActionsOpen(
                              expenseActionsOpen === expense.id
                                ? null
                                : expense.id
                            )
                          }
                          className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme flex h-8 w-8 items-center justify-center rounded-full transition-colors dark:hover:bg-gray-700"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {expenseActionsOpen === expense.id && (
                          <div className="card-theme absolute bottom-full right-0 z-[9999] mb-1 w-48 overflow-hidden rounded-lg border border-light-border shadow-2xl dark:border-dark-border dark:bg-dark-surface">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  openDetailsModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="text-theme-secondary hover:card-theme flex w-full items-center px-4 py-2.5 text-sm transition-colors dark:hover:bg-gray-700"
                              >
                                <Eye className="mr-3 h-4 w-4" />
                                Ver Detalhes
                              </button>

                              {/* Botão Dar Baixa - Só aparece se status != Paid */}
                              {expense.status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    darBaixaRapida(expense);
                                    setExpenseActionsOpen(null);
                                  }}
                                  className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                >
                                  <CheckCircle className="mr-3 h-4 w-4" />
                                  Dar Baixa
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  openEditModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="text-theme-secondary hover:card-theme flex w-full items-center px-4 py-2.5 text-sm transition-colors dark:hover:bg-gray-700"
                              >
                                <Edit className="mr-3 h-4 w-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  openPaymentModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="text-theme-secondary hover:card-theme flex w-full items-center px-4 py-2.5 text-sm transition-colors dark:hover:bg-gray-700"
                              >
                                <ArrowDown className="mr-3 h-4 w-4" />
                                Baixar Pagamento
                              </button>
                              <div className="my-1 border-t border-light-border dark:border-dark-border"></div>
                              <button
                                onClick={() => {
                                  openDeleteModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                Deletar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-light-border px-4 py-3 dark:border-dark-border">
          <div className="text-theme-secondary text-sm">
            Mostrando de 1 até {filteredExpenses.length} de{' '}
            {filteredExpenses.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button className="text-theme-secondary hover:text-theme-primary px-3 py-1 text-sm transition-colors">
              Anterior
            </button>
            <button className="text-dark-text-primary rounded bg-green-600 px-3 py-1 text-sm dark:bg-green-700">
              1
            </button>
            <button className="text-theme-secondary hover:text-theme-primary px-3 py-1 text-sm transition-colors">
              2
            </button>
            <button className="text-theme-secondary hover:text-theme-secondary px-3 py-1 text-sm dark:hover:text-gray-300">
              3
            </button>
            <button className="text-theme-secondary hover:text-theme-secondary px-3 py-1 text-sm dark:hover:text-gray-300">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="mt-4 grid flex-shrink-0 grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="text-center">
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
              Total de Títulos
            </h3>
            <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
              {totals.totalTitles.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>

        <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="text-center">
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
              Total Pago
            </h3>
            <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
              {totals.totalPaid.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-red-600 p-6 shadow-sm">
          <div className="text-center">
            <h3 className="text-dark-text-primary mb-2 text-lg font-semibold">
              Total em Aberto
            </h3>
            <p className="text-dark-text-primary text-2xl font-bold">
              {totals.totalOpen.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ExpenseDetailsModal
        expense={selectedExpenseForAction}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      <ExpenseEditModal
        expense={selectedExpenseForAction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={fetchExpenses}
      />

      <DeleteConfirmationModal
        expense={selectedExpenseForAction}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={fetchExpenses}
      />

      {/* Modal de Dados da Baixa - Versão Melhorada */}
      {isPaymentModalOpen && selectedExpenseForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="card-theme mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl shadow-2xl dark:bg-dark-surface">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
              <div>
                <h3 className="text-theme-primary dark:text-dark-text-primary text-xl font-semibold">
                  💳 Dados da Baixa
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                  Processar pagamento da despesa
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Informações da Despesa */}
            <div className="border-b border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-gray-700/50">
              <h4 className="text-theme-secondary mb-3 text-sm font-medium">
                📋 Despesa Selecionada
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                    Descrição:
                  </span>
                  <p className="text-theme-primary dark:text-dark-text-primary font-medium">
                    {selectedExpenseForPayment.description || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                    Valor Original:
                  </span>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {selectedExpenseForPayment.value?.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }) || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="space-y-6 p-6">
              {/* Data de Baixa */}
              <div>
                <label className="text-theme-secondary mb-2 block text-sm font-medium">
                  📅 Data de Baixa *
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={e =>
                    setPaymentData(prev => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>

              {/* Banco */}
              <div>
                <label className="text-theme-secondary mb-2 block text-sm font-medium">
                  🏦 Banco *
                </label>
                {selectedExpenseForPayment?.account_id ? (
                  <div className="card-theme text-theme-secondary w-full rounded-lg border border-light-border px-4 py-3 dark:border-dark-border dark:bg-dark-hover">
                    <div className="flex items-center justify-between">
                      <span>
                        {selectedExpenseForPayment.account?.name} -{' '}
                        {selectedExpenseForPayment.account?.bank_name}
                        {selectedExpenseForPayment.account?.account_number &&
                          ` (${selectedExpenseForPayment.account.account_number})`}
                      </span>
                      <span className="text-theme-secondary rounded bg-light-hover px-2 py-1 text-xs dark:bg-dark-surface">
                        Banco Original
                      </span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={paymentData.bankId}
                    onChange={e =>
                      setPaymentData(prev => ({
                        ...prev,
                        bankId: e.target.value,
                      }))
                    }
                    className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                  >
                    <option value="">Selecione o banco</option>
                    {bankAccounts.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} - {bank.bank_name}
                        {bank.account_number && ` (${bank.account_number})`}
                      </option>
                    ))}
                  </select>
                )}
                {bankAccounts.length === 0 &&
                  !selectedExpenseForPayment?.account_id && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Nenhum banco cadastrado nesta unidade
                    </p>
                  )}
              </div>

              {/* Valores Financeiros */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-theme-secondary mb-2 block text-sm font-medium">
                    💰 Valor Pago *
                  </label>
                  <div className="relative">
                    <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2 transform text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.paidValue}
                      onChange={e =>
                        handleCurrencyChange('paidValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-3 pl-8 pr-4 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-theme-secondary mb-2 block text-sm font-medium">
                    📈 Juros
                  </label>
                  <div className="relative">
                    <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2 transform text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.interestValue}
                      onChange={e =>
                        handleCurrencyChange('interestValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-3 pl-8 pr-4 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-theme-secondary mb-2 block text-sm font-medium">
                    📉 Desconto
                  </label>
                  <div className="relative">
                    <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 -translate-y-1/2 transform text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.discountValue}
                      onChange={e =>
                        handleCurrencyChange('discountValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-3 pl-8 pr-4 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-theme-secondary mb-2 block text-sm font-medium">
                  📝 Observação da Baixa
                </label>
                <textarea
                  value={paymentData.observation}
                  onChange={e =>
                    setPaymentData(prev => ({
                      ...prev,
                      observation: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Informações adicionais sobre o pagamento..."
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full resize-none rounded-lg border border-light-border px-4 py-3 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="rounded-b-xl border-t border-light-border bg-light-bg p-6 dark:border-dark-border dark:bg-gray-700/50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-theme-secondary flex-1 rounded-lg px-4 py-3 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  disabled={
                    paymentLoading ||
                    (!paymentData.bankId &&
                      !selectedExpenseForPayment?.account_id) ||
                    !paymentData.paidValue
                  }
                  className="text-dark-text-primary flex flex-1 items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-medium transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  {paymentLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-light-surface dark:border-dark-surface"></div>
                      Processando...
                    </>
                  ) : (
                    <>✅ Efetuar Baixa</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DespesasAccrualTab;
