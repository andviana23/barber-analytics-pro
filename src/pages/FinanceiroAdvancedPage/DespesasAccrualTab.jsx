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

      const { data, error } = await query.order('date', { ascending: false });

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
      bankId: expense.account_id || '', // Pré-selecionar o banco da despesa
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

  // Mudar status da despesa
  const changeStatus = async (expenseId, newStatus) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: newStatus })
        .eq('id', expenseId);

      if (error) throw error;

      showToast({ type: 'success', message: 'Status atualizado com sucesso!' });
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Filtros Ultra Compactos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.dueDateFrom}
              onChange={e =>
                setFilters(prev => ({ ...prev, dueDateFrom: e.target.value }))
              }
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={filters.dueDateTo}
              onChange={e =>
                setFilters(prev => ({ ...prev, dueDateTo: e.target.value }))
              }
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={fetchExpenses}
            className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Search className="w-3 h-3 mr-1" />
            Buscar
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </button>
        </div>
      </div>

      {/* Tabela com Container Controlado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col min-h-0">
        {/* Controles da Tabela */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <select className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
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
            <Search className="w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-2 py-1 text-xs w-48 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Tabela com Scroll Horizontal e Vertical */}
        <div className="flex-1 overflow-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="w-8 px-2 py-1 text-left">
                  <input type="checkbox" className="rounded w-3 h-3" />
                </th>
                <th className="min-w-[250px] px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Documento
                </th>
                <th className="w-24 px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Emissão
                </th>
                <th className="w-32 px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Plano
                </th>
                <th className="w-32 px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pessoa
                </th>
                <th className="w-24 px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Venc.
                </th>
                <th className="w-28 px-2 py-1 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Valor
                </th>
                <th className="w-28 px-2 py-1 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pago
                </th>
                <th className="w-24 px-2 py-1 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Pgto
                </th>
                <th className="w-20 px-2 py-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="w-16 px-2 py-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Carregando...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhuma despesa encontrada
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-2 py-1">
                      <input type="checkbox" className="rounded w-3 h-3" />
                    </td>
                    <td className="px-2 py-1 text-[11px] font-medium text-gray-900 dark:text-white">
                      <div className="line-clamp-1">
                        {expense.description || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {expense.date
                        ? format(parseISO(expense.date), 'dd/MM/yy', {
                            locale: ptBR,
                          })
                        : '-'}
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className="truncate">
                        {expense.category?.name || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <div className="truncate">
                        {expense.party?.nome || '-'}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {expense.expected_payment_date
                        ? format(
                            parseISO(expense.expected_payment_date),
                            'dd/MM/yy',
                            { locale: ptBR }
                          )
                        : '-'}
                    </td>
                    <td className="px-2 py-1 text-[11px] font-semibold text-gray-900 dark:text-white text-right whitespace-nowrap">
                      {expense.value?.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }) || '-'}
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">
                      {expense.status === 'Paid'
                        ? expense.value?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : 'R$ 0,00'}
                    </td>
                    <td className="px-2 py-1 text-[11px] text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {expense.actual_payment_date
                        ? format(
                            parseISO(expense.actual_payment_date),
                            'dd/MM/yy',
                            { locale: ptBR }
                          )
                        : '-'}
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getStatusColor(expense.status)}`}
                      >
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-center">
                      <div className="relative dropdown-container">
                        <button
                          onClick={() =>
                            setExpenseActionsOpen(
                              expenseActionsOpen === expense.id
                                ? null
                                : expense.id
                            )
                          }
                          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {expenseActionsOpen === expense.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-[9999] overflow-hidden">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  openDetailsModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Eye className="w-4 h-4 mr-3" />
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => {
                                  openEditModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  openPaymentModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <ArrowDown className="w-4 h-4 mr-3" />
                                Baixar Pagamento
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                              <button
                                onClick={() => {
                                  openDeleteModal(expense);
                                  setExpenseActionsOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
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
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando de 1 até {filteredExpenses.length} de{' '}
            {filteredExpenses.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Anterior
            </button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              2
            </button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              3
            </button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total de Títulos
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.totalTitles.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Pago
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.totalPaid.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>

        <div className="bg-red-600 rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Total em Aberto
            </h3>
            <p className="text-2xl font-bold text-white">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  💳 Dados da Baixa
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Processar pagamento da despesa
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Informações da Despesa */}
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                📋 Despesa Selecionada
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Descrição:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedExpenseForPayment.description || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
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
            <div className="p-6 space-y-6">
              {/* Data de Baixa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏦 Banco *
                </label>
                {selectedExpenseForPayment?.account_id ? (
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>
                        {selectedExpenseForPayment.account?.name} -{' '}
                        {selectedExpenseForPayment.account?.bank_name}
                        {selectedExpenseForPayment.account?.account_number &&
                          ` (${selectedExpenseForPayment.account.account_number})`}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-500 px-2 py-1 rounded">
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
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ Nenhum banco cadastrado nesta unidade
                    </p>
                  )}
              </div>

              {/* Valores Financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    💰 Valor Pago *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.paidValue}
                      onChange={e =>
                        handleCurrencyChange('paidValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📈 Juros
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.interestValue}
                      onChange={e =>
                        handleCurrencyChange('interestValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    📉 Desconto
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      value={paymentData.discountValue}
                      onChange={e =>
                        handleCurrencyChange('discountValue', e.target.value)
                      }
                      placeholder="0,00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
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
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {paymentLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
