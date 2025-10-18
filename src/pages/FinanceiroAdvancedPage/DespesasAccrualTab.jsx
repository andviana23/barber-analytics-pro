import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Calendar,
  DollarSign,
  Building2,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Components
import NovaDespesaModal from '../../templates/NovaDespesaModal';

/**
 * Tab de Despesas por Competência
 *
 * Features:
 * - Toggle entre modo Caixa e Competência
 * - NovaDespesaModal para criar despesas com competência
 * - Lista e filtros de despesas por competência
 */
const DespesasAccrualTab = ({ globalFilters }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accrualMode, setAccrualMode] = useState(true); // true = Competência, false = Caixa
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Buscar despesas
  const fetchExpenses = async () => {
    if (!globalFilters.unitId) return;

    try {
      setLoading(true);
      console.log('🔄 Buscando despesas para unidade:', globalFilters.unitId);

      const { data, error } = await supabase
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
        .order('data_competencia', { ascending: false });

      if (error) throw error;

      console.log('✅ Despesas carregadas:', data?.length || 0);
      setExpenses(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar despesas',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar despesas ao montar e quando mudar a unidade
  useEffect(() => {
    fetchExpenses();
  }, [globalFilters.unitId]);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchExpenses(); // Recarregar lista
    addToast({
      type: 'success',
      title: 'Despesa criada!',
      message: 'A despesa foi cadastrada com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com toggle - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Despesas
              </h3>
            </div>

            {/* Toggle Caixa/Competência - Dark Mode */}
            <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setAccrualMode(false)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  !accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Caixa
              </button>
              <button
                onClick={() => setAccrualMode(true)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  accrualMode
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Competência
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </button>
          </div>
        </div>

        {/* Descrição do modo - Dark Mode */}
        <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
          <p className="text-sm text-orange-800 dark:text-orange-300">
            {accrualMode ? (
              <>
                <strong>Modo Competência:</strong> As despesas são registradas
                no período em que foram incorridas (competência),
                independentemente da data de pagamento.
              </>
            ) : (
              <>
                <strong>Modo Caixa:</strong> As despesas são registradas apenas
                quando efetivamente pagas pela empresa.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Conteúdo principal - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {accrualMode ? (
          // Modo Competência - Lista com campos de competência
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Carregando despesas...
                </p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma despesa cadastrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Comece cadastrando sua primeira despesa por competência.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira despesa
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Competência
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map(expense => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {expense.category?.name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="w-4 h-4 mr-2" />
                            {expense.party?.nome || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            {expense.data_competencia
                              ? format(
                                  new Date(expense.data_competencia),
                                  'dd/MM/yyyy',
                                  { locale: ptBR }
                                )
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-semibold text-red-600 dark:text-red-400">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {expense.value.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              expense.status === 'Paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}
                          >
                            {expense.status === 'Paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          // Modo Caixa - Redirecionar para aba original
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              💳
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Modo Caixa
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Para visualizar despesas em modo caixa, utilize a aba de despesas
              tradicional no módulo financeiro principal.
            </p>
            <button
              onClick={() => setAccrualMode(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Voltar para Competência
            </button>
          </div>
        )}
      </div>

      {/* Modal de nova despesa */}
      <NovaDespesaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateSuccess}
        unidadeId={globalFilters.unitId}
        availableCategories={[]}
        availableAccounts={[]}
        availableCostCenters={[]}
        availableSuppliers={[]}
      />
    </div>
  );
};

export default DespesasAccrualTab;
