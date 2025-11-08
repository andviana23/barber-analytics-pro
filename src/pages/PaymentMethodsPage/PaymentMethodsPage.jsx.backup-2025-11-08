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
import {
  Plus,
  Search,
  CreditCard,
  Percent,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
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
    activatePaymentMethod,
  } = usePaymentMethods(selectedUnit?.id, {
    includeInactive: showInactive,
    enableRealtime: true,
  });

  // Verificar permissões - APENAS ADMIN pode gerenciar formas de pagamento
  const isAdmin = useMemo(() => {
    return user?.user_metadata?.role === 'admin';
  }, [user]);

  // Filtrar formas de pagamento
  const filteredMethods = useMemo(() => {
    return paymentMethods.filter(method => {
      // Filtro de busca
      const matchesSearch =
        searchTerm === '' ||
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
  const handleEdit = method => {
    setSelectedMethod(method);
    setIsModalOpen(true);
  };
  const handleDelete = async method => {
    if (
      !window.confirm(
        `Deseja realmente desativar a forma de pagamento "${method.name}"?`
      )
    ) {
      return;
    }
    setDeletingId(method.id);
    try {
      const { error } = await deletePaymentMethod(method.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao desativar forma de pagamento',
          description: error.message || 'Tente novamente mais tarde',
        });
      } else {
        showToast({
          type: 'success',
          message: 'Forma de pagamento desativada com sucesso',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao desativar forma de pagamento',
        description: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  };
  const handleActivate = async method => {
    try {
      const { error } = await activatePaymentMethod(method.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao ativar forma de pagamento',
          description: error.message || 'Tente novamente mais tarde',
        });
      } else {
        showToast({
          type: 'success',
          message: 'Forma de pagamento ativada com sucesso',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao ativar forma de pagamento',
        description: err.message,
      });
    }
  };
  const handleSave = async data => {
    try {
      let result;
      if (selectedMethod) {
        // Editar
        result = await updatePaymentMethod(selectedMethod.id, data);
        if (result.error) {
          showToast({
            type: 'error',
            message: 'Erro ao atualizar forma de pagamento',
            description: result.error.message || 'Tente novamente mais tarde',
          });
          return;
        }
        showToast({
          type: 'success',
          message: 'Forma de pagamento atualizada com sucesso',
        });
      } else {
        // Criar
        result = await createPaymentMethod(data);
        if (result.error) {
          showToast({
            type: 'error',
            message: 'Erro ao criar forma de pagamento',
            description: result.error.message || 'Tente novamente mais tarde',
          });
          return;
        }
        showToast({
          type: 'success',
          message: 'Forma de pagamento criada com sucesso',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado ao salvar forma de pagamento',
        description: err.message,
      });
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <Layout activeMenuItem="cadastros">
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="text-center">
            <Loader className="text-primary-light-500 dark:text-primary-dark-500 mx-auto mb-4 h-12 w-12 animate-spin" />
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
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Erro ao carregar formas de pagamento
            </h3>
            <p className="mb-4 text-text-light-secondary dark:text-text-dark-secondary">
              {error.message || 'Ocorreu um erro inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-light-500 dark:bg-primary-dark-500 text-dark-text-primary hover:bg-primary-light-600 dark:hover:bg-primary-dark-600 rounded-lg px-4 py-2"
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
      <div className="space-y-6 p-6">
        {/* Aviso para não-admin */}
        {!isAdmin && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Acesso Restrito
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Apenas administradores podem criar, editar ou excluir formas de
                pagamento. Você pode visualizar as formas de pagamento
                cadastradas, mas não pode modificá-las.
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
            <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
              Gerencie as formas de pagamento aceitas pela sua barbearia
            </p>
          </div>

          {/* Botão criar - apenas para ADMIN */}
          {isAdmin ? (
            <button
              onClick={handleCreate}
              className="text-dark-text-primary hover:bg-primary-600 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 transition-colors duration-300"
            >
              <Plus className="h-5 w-5" />
              Nova Forma de Pagamento
            </button>
          ) : (
            <div
              className="card-theme text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary flex cursor-not-allowed items-center gap-2 rounded-lg px-4 py-2 dark:bg-gray-700"
              title="Apenas administradores podem criar formas de pagamento"
            >
              <Plus className="h-5 w-5" />
              Nova Forma de Pagamento
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Total
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary mt-1 text-2xl font-bold">
                  {stats?.total || 0}
                </p>
              </div>
              <CreditCard className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Ativas
                </p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.active || 0}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Taxa Média
                </p>
                <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(stats?.averageFee || 0).toFixed(2)}%
                </p>
              </div>
              <Percent className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary dark:border-dark-border dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Filtro por Unidade (apenas para visualização) */}
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={e => setShowInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-light-border text-primary focus:ring-primary dark:border-dark-border"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Mostrar inativas
                </span>
              </label>
            </div>
          </div>

          {/* Informação da unidade filtrada */}
          {selectedUnit && (
            <div className="mt-3 border-t border-light-border pt-3 dark:border-dark-border">
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Exibindo formas de pagamento da unidade:{' '}
                <span className="text-theme-primary dark:text-dark-text-primary font-semibold">
                  {selectedUnit.name}
                </span>
              </p>
            </div>
          )}
          {!selectedUnit && (
            <div className="mt-3 border-t border-light-border pt-3 dark:border-dark-border">
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Exibindo formas de pagamento de{' '}
                <span className="text-theme-primary dark:text-dark-text-primary font-semibold">
                  todas as unidades
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Lista de Formas de Pagamento */}
        <div className="card-theme overflow-hidden rounded-lg border border-light-border dark:border-dark-border dark:bg-dark-surface">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                <tr>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Taxa (%)
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Prazo (dias)
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="card-theme divide-y divide-gray-200 dark:divide-gray-700 dark:bg-dark-surface">
                {filteredMethods.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 6 : 5}
                      className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-8 text-center"
                    >
                      Nenhuma forma de pagamento encontrada
                    </td>
                  </tr>
                ) : (
                  filteredMethods.map(method => (
                    <tr
                      key={method.id}
                      className="hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <CreditCard className="text-light-text-muted dark:text-dark-text-muted mr-3 h-5 w-5" />
                          <span className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                            {method.name}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                          {method.units?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <Percent className="mr-2 h-4 w-4 text-orange-500" />
                          <span className="text-theme-primary dark:text-dark-text-primary text-sm">
                            {method.fee_percentage.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                          <span className="text-theme-primary dark:text-dark-text-primary text-sm">
                            {method.receipt_days === 0
                              ? 'Imediato'
                              : `${method.receipt_days} dias`}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {method.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                            <XCircle className="h-3 w-3" />
                            Inativa
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(method)}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                              disabled={deletingId === method.id}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {method.is_active ? (
                              <button
                                onClick={() => handleDelete(method)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
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
