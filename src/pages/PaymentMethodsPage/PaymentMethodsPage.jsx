/**
 * PAYMENT METHODS PAGE
 * Página para gerenciamento de formas de pagamento
 * 
 * Features:
 * - Listagem de formas de pagamento
 * - Criar nova forma de pagamento
 * - Editar forma de pagamento existente
 * - Desativar/ativar forma de pagamento
 * - Busca e filtros
 * - KPIs (Total, Ativas, Taxa média)
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, CreditCard, Percent, Calendar, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import NovaFormaPagamentoModal from '../../molecules/NovaFormaPagamentoModal/NovaFormaPagamentoModal';
import usePaymentMethods from '../../hooks/usePaymentMethods';

const PaymentMethodsPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Hook para buscar formas de pagamento
  const { 
    data: paymentMethods, 
    loading, 
    error,
    stats,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    activatePaymentMethod
  } = usePaymentMethods(selectedUnit?.id, {
    includeInactive: showInactive,
    enableRealtime: true
  });

  // Verificar permissões - APENAS ADMIN pode gerenciar formas de pagamento
  const isAdmin = useMemo(() => {
    return user?.user_metadata?.role === 'admin';
  }, [user]);

  // Filtrar formas de pagamento
  const filteredMethods = useMemo(() => {
    return paymentMethods.filter(method => {
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        method.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus = showInactive || method.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [paymentMethods, searchTerm, showInactive]);

  // Estatísticas locais (removido - usando stats do hook)

  // Handlers
  const handleCreate = () => {
    setSelectedMethod(null);
    setIsModalOpen(true);
  };

  const handleEdit = (method) => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };

  const handleDelete = async (method) => {
    if (!window.confirm(`Deseja realmente desativar a forma de pagamento "${method.name}"?`)) {
      return;
    }

    setDeletingId(method.id);
    
    try {
      const { error } = await deletePaymentMethod(method.id);
      
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao desativar forma de pagamento',
          description: error.message || 'Tente novamente mais tarde'
        });
      } else {
        showToast({
          type: 'success',
          message: 'Forma de pagamento desativada com sucesso'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao desativar forma de pagamento',
        description: err.message
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivate = async (method) => {
    try {
      const { error } = await activatePaymentMethod(method.id);
      
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao ativar forma de pagamento',
          description: error.message || 'Tente novamente mais tarde'
        });
      } else {
        showToast({
          type: 'success',
          message: 'Forma de pagamento ativada com sucesso'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao ativar forma de pagamento',
        description: err.message
      });
    }
  };

  const handleSave = async (data) => {
    try {
      let result;
      
      if (selectedMethod) {
        // Editar
        result = await updatePaymentMethod(selectedMethod.id, data);
        
        if (result.error) {
          showToast({
            type: 'error',
            message: 'Erro ao atualizar forma de pagamento',
            description: result.error.message || 'Tente novamente mais tarde'
          });
          return;
        }
        
        showToast({
          type: 'success',
          message: 'Forma de pagamento atualizada com sucesso'
        });
      } else {
        // Criar
        result = await createPaymentMethod(data);
        
        if (result.error) {
          showToast({
            type: 'error',
            message: 'Erro ao criar forma de pagamento',
            description: result.error.message || 'Tente novamente mais tarde'
          });
          return;
        }
        
        showToast({
          type: 'success',
          message: 'Forma de pagamento criada com sucesso'
        });
      }
      
      setIsModalOpen(false);
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao salvar forma de pagamento',
        description: err.message
      });
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <Layout activeMenuItem="cadastros">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-primary-light-500 dark:text-primary-dark-500 mx-auto mb-4" />
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Carregando formas de pagamento...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Layout activeMenuItem="cadastros">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
              Erro ao carregar formas de pagamento
            </h3>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mb-4">
              {error.message || 'Ocorreu um erro inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-light-500 dark:bg-primary-dark-500 text-white rounded-lg hover:bg-primary-light-600 dark:hover:bg-primary-dark-600"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout activeMenuItem="cadastros">
      <div className="p-6 space-y-6">
        {/* Aviso para não-admin */}
        {!isAdmin && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Acesso Restrito
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Apenas administradores podem criar, editar ou excluir formas de pagamento. 
                Você pode visualizar as formas de pagamento cadastradas, mas não pode modificá-las.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Formas de Pagamento
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Gerencie as formas de pagamento aceitas pela sua barbearia
            </p>
          </div>

          {/* Botão criar - apenas para ADMIN */}
          {isAdmin ? (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
            >
              <Plus className="h-5 w-5" />
              Nova Forma de Pagamento
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed" title="Apenas administradores podem criar formas de pagamento">
              <Plus className="h-5 w-5" />
              Nova Forma de Pagamento
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.total || 0}
                </p>
              </div>
              <CreditCard className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats?.active || 0}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa Média</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {(stats?.averageFee || 0).toFixed(2)}%
                </p>
              </div>
              <Percent className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Unidade (apenas para visualização) */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrar inativas
                </span>
              </label>
            </div>
          </div>

          {/* Informação da unidade filtrada */}
          {selectedUnit && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exibindo formas de pagamento da unidade: <span className="font-semibold text-gray-900 dark:text-white">{selectedUnit.name}</span>
              </p>
            </div>
          )}
          {!selectedUnit && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exibindo formas de pagamento de <span className="font-semibold text-gray-900 dark:text-white">todas as unidades</span>
              </p>
            </div>
          )}
        </div>

        {/* Lista de Formas de Pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taxa (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Prazo (dias)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMethods.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma forma de pagamento encontrada
                    </td>
                  </tr>
                ) : (
                  filteredMethods.map((method) => (
                    <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {method.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {method.units?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 text-orange-500 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {method.fee_percentage.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {method.receipt_days === 0 ? 'Imediato' : `${method.receipt_days} dias`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {method.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <XCircle className="h-3 w-3" />
                            Inativa
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(method)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                              title="Editar"
                              disabled={deletingId === method.id}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {method.is_active ? (
                              <button
                                onClick={() => handleDelete(method)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                title="Desativar"
                                disabled={deletingId === method.id}
                              >
                                {deletingId === method.id ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(method)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Ativar"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nova/Editar Forma de Pagamento */}
      <NovaFormaPagamentoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        paymentMethod={selectedMethod}
      />
    </Layout>
  );
};

export default PaymentMethodsPage;
