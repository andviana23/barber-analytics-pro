import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
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
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState(null);
  const [expenseActionsOpen, setExpenseActionsOpen] = useState(null);
  const { showToast } = useToast();

  // Filtros de data
  const [filters, setFilters] = useState({
    emissionDateFrom: '',
    emissionDateTo: '',
    paymentDateFrom: '',
    paymentDateTo: '',
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

  // Buscar despesas
  const fetchExpenses = async () => {
    if (!globalFilters.unitId) return;

    try {
      setLoading(true);
      console.log('🔄 Buscando despesas para unidade:', globalFilters.unitId);

      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(id, name),
          party:parties(id, nome),
          account:bank_accounts(id, name, bank_name)
        `)
        .eq('unit_id', globalFilters.unitId);

      // Aplicar filtros de data
      if (filters.emissionDateFrom) {
        query = query.gte('date', filters.emissionDateFrom);
      }
      if (filters.emissionDateTo) {
        query = query.lte('date', filters.emissionDateTo);
      }
      if (filters.paymentDateFrom) {
        query = query.gte('actual_payment_date', filters.paymentDateFrom);
      }
      if (filters.paymentDateTo) {
        query = query.lte('actual_payment_date', filters.paymentDateTo);
      }
      if (filters.dueDateFrom) {
        query = query.gte('expected_payment_date', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('expected_payment_date', filters.dueDateTo);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      console.log('✅ Despesas carregadas:', data?.length || 0);
      setExpenses(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      showToast({ type: 'error', message: 'Erro ao carregar despesas', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Carregar despesas quando mudar filtros ou unidade
  useEffect(() => {
    fetchExpenses();
  }, [globalFilters.unitId, filters]);

  // Filtrar despesas por termo de busca
  const filteredExpenses = useMemo(() => {
    if (!searchTerm) return expenses;
    
    return expenses.filter(expense => 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.party?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  // Calcular totais
  const totals = useMemo(() => {
    const totalTitles = filteredExpenses.reduce((sum, expense) => sum + (expense.value || 0), 0);
    const totalPaid = filteredExpenses.reduce((sum, expense) => 
      sum + (expense.status === 'Paid' ? (expense.value || 0) : 0), 0
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
      emissionDateFrom: '',
      emissionDateTo: '',
      paymentDateFrom: '',
      paymentDateTo: '',
      dueDateFrom: '',
      dueDateTo: '',
    });
  };

  // Exportar dados
  const exportData = () => {
    showToast({ type: 'success', message: 'Exportação iniciada' });
    // TODO: Implementar exportação
  };

  // Abrir modal de pagamento
  const openPaymentModal = (expense) => {
    setSelectedExpenseForPayment(expense);
    setPaymentData({
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      bankId: '',
      paidValue: expense.value?.toString() || '',
      interestValue: '',
      discountValue: '',
      observation: '',
    });
    setIsPaymentModalOpen(true);
    setExpenseActionsOpen(null);
  };

  // Processar pagamento
  const processPayment = async () => {
    if (!selectedExpenseForPayment) return;

    try {
      // Criar registro de pagamento detalhado
      const { error: paymentError } = await supabase
        .from('expense_payments')
        .insert({
          expense_id: selectedExpenseForPayment.id,
          unit_id: globalFilters.unitId,
          payment_date: paymentData.paymentDate,
          bank_id: paymentData.bankId || null,
          paid_value: parseFloat(paymentData.paidValue) || 0,
          interest_value: parseFloat(paymentData.interestValue) || 0,
          discount_value: parseFloat(paymentData.discountValue) || 0,
          observation: paymentData.observation,
        });

      if (paymentError) throw paymentError;

      // Atualizar status da despesa
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          status: 'Paid',
          actual_payment_date: paymentData.paymentDate,
          observations: paymentData.observation,
        })
        .eq('id', selectedExpenseForPayment.id);

      if (expenseError) throw expenseError;

      showToast({ type: 'success', message: 'Pagamento processado com sucesso!' });
      setIsPaymentModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      showToast({ type: 'error', message: 'Erro ao processar pagamento', description: error.message });
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
      showToast({ type: 'error', message: 'Erro ao atualizar status', description: error.message });
    }
  };

  // Obter cor do status
  const getStatusColor = (status) => {
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
  const getStatusText = (status) => {
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
    <div className="space-y-6">
      {/* Filtros de Data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Data de Emissão */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data de Emissão
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.emissionDateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, emissionDateFrom: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.emissionDateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, emissionDateTo: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data de Pagamento
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.paymentDateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentDateFrom: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.paymentDateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentDateTo: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data de Vencimento
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dueDateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dueDateFrom: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="date"
                value={filters.dueDateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dueDateTo: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchExpenses}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </button>
          <button
            onClick={clearFilters}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar filtros
          </button>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-auto">
            <Filter className="w-4 h-4 mr-2" />
            Mais opções de busca
          </button>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Controles da Tabela */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>10 resultados por página</option>
              <option>25 resultados por página</option>
              <option>50 resultados por página</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Emissão
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plano de Contas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pessoa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Valor Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma despesa encontrada
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {expense.description || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.date ? format(parseISO(expense.date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.category?.name || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.party?.nome || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.expected_payment_date ? format(parseISO(expense.expected_payment_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {expense.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.status === 'Paid' ? expense.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {expense.actual_payment_date ? format(parseISO(expense.actual_payment_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                        {getStatusText(expense.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setExpenseActionsOpen(expenseActionsOpen === expense.id ? null : expense.id)}
                          className="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        
                        {expenseActionsOpen === expense.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setExpenseActionsOpen(null);
                                  // TODO: Implementar edição
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setExpenseActionsOpen(null);
                                  // TODO: Implementar detalhes
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Detalhes
                              </button>
                              <button
                                onClick={() => openPaymentModal(expense)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <ArrowDown className="w-4 h-4 mr-2" />
                                Baixar
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
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando de 1 até {filteredExpenses.length} de {filteredExpenses.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Anterior</button>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">2</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">3</button>
            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Próximo</button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total de Títulos</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.totalTitles.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Pago</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totals.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
        
        <div className="bg-red-600 rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Total em Aberto</h3>
            <p className="text-2xl font-bold text-white">
              {totals.totalOpen.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Dados da Baixa */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dados da Baixa</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Baixa
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banco *
                </label>
                <select
                  value={paymentData.bankId}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, bankId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Selecione o banco</option>
                  <option value="sicoob">Sicoob</option>
                  <option value="bradesco">Bradesco</option>
                  <option value="itau">Itaú</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor Pago
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.paidValue}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paidValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor Juros
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.interestValue}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, interestValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor Desconto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentData.discountValue}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observação da Baixa
                </label>
                <textarea
                  value={paymentData.observation}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, observation: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={processPayment}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Efetuar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DespesasAccrualTab;