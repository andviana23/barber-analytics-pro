import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
  Lock,
} from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import CashRegisterCard from '../components/molecules/CashRegisterCard';
import { OpenCashModal, CloseCashModal, CashReportModal } from '../templates';
import useCashRegister from '../hooks/useCashRegister';
import useUserPermissions from '../hooks/useUserPermissions';
import { useUnit } from '../context/UnitContext'; // ✅ Adicionar contexto de unidade
import { useAuth } from '../context/AuthContext'; // ✅ Adicionar contexto de auth
import { formatCurrency, formatDateTime } from '../utils/formatters';
import toast from 'react-hot-toast';

/**
 * CashRegisterPage - Página de gerenciamento de caixa
 *
 * Features:
 * - Exibe status do caixa atual (aberto/fechado)
 * - Botão "Abrir Caixa" (apenas Recepcionista, Gerente, Admin)
 * - Card com informações do caixa ativo
 * - Histórico de caixas em tabela responsiva
 * - Filtros por período
 * - Proteção por permissões (RLS + UI)
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @page
 */
const CashRegisterPage = () => {
  // Hooks
  const { selectedUnit } = useUnit(); // ✅ Obter unidade selecionada
  const { user } = useAuth(); // ✅ Obter usuário logado

  const {
    activeCashRegister,
    cashRegisterHistory,
    loading,
    openCashRegister,
    closeCashRegister,
    fetchActiveCashRegister,
    fetchCashRegisterHistory,
    getCashRegisterReport,
  } = useCashRegister(selectedUnit?.id); // ✅ PASSAR unitId para o hook

  const {
    canOpenCashRegister,
    canCloseCashRegister,
    canManageCashRegister,
    userId, // ✅ Obter userId do hook de permissões
  } = useUserPermissions();

  // Estado dos modais
  const [isOpenModalVisible, setIsOpenModalVisible] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);

  // Estado do relatório
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Estado dos filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  // Carrega dados ao montar
  useEffect(() => {
    if (canManageCashRegister) {
      fetchActiveCashRegister();
      fetchCashRegisterHistory();
    }
  }, [canManageCashRegister]);

  // Handler de abertura de caixa
  const handleOpenCash = async data => {
    console.log('🚀 handleOpenCash CHAMADO!', { data }); // ✅ Log imediato

    try {
      // 🐛 DEBUG: Verificar valores
      console.log('🔍 DEBUG handleOpenCash:', {
        selectedUnit,
        userId,
        user,
        data,
      });

      // ⚠️ Validação: Verificar se tem unitId e userId
      if (!selectedUnit?.id) {
        toast.error('Selecione uma unidade antes de abrir o caixa');
        return;
      }

      if (!userId) {
        toast.error('Usuário não identificado. Faça login novamente.');
        return;
      }

      // ✅ Adicionar openedBy aos dados (unitId já é adicionado pelo hook)
      const cashData = {
        ...data,
        openedBy: userId,
      };

      console.log('📦 cashData a ser enviado:', cashData);

      const result = await openCashRegister(cashData);

      // Service já exibe toast de sucesso/erro
      if (!result.error) {
        setIsOpenModalVisible(false);
        fetchActiveCashRegister();
        fetchCashRegisterHistory();
      }
    } catch (error) {
      console.error('Erro ao abrir caixa:', error);
      toast.error('Erro ao abrir caixa');
    }
  };

  // Handler de fechamento de caixa
  const handleCloseCash = async data => {
    try {
      const result = await closeCashRegister(activeCashRegister.id, data);

      // Service já exibe toast de sucesso/erro com diferença calculada
      if (!result.error) {
        setIsCloseModalVisible(false);
        fetchActiveCashRegister();
        fetchCashRegisterHistory();
      }
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
    }
  };

  // Handler de filtros
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchCashRegisterHistory(filters);
  };

  const handleClearFilters = () => {
    setFilters({ startDate: '', endDate: '' });
    fetchCashRegisterHistory();
  };

  // Handler para visualizar relatório
  const handleViewReport = async () => {
    if (!activeCashRegister?.id) {
      toast.error('Nenhum caixa ativo para gerar relatório');
      return;
    }

    setReportLoading(true);
    setIsReportModalVisible(true);

    try {
      const result = await getCashRegisterReport(activeCashRegister.id);

      if (result.error) {
        toast.error('Erro ao carregar relatório do caixa');
        setIsReportModalVisible(false);
      } else {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório do caixa');
      setIsReportModalVisible(false);
    } finally {
      setReportLoading(false);
    }
  };

  // Handler para fechar caixa a partir do relatório
  const handleCloseCashFromReport = () => {
    setIsReportModalVisible(false);
    setReportData(null);
    setIsCloseModalVisible(true);
  };

  // Verificação de permissão
  if (!canManageCashRegister) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card-theme max-w-2xl mx-auto text-center py-12">
          <Lock className="w-16 h-16 mx-auto mb-4 text-theme-muted" />
          <h2 className="text-2xl font-bold text-theme-primary mb-2">
            Acesso Restrito
          </h2>
          <p className="text-theme-muted">
            Você não tem permissão para acessar o gerenciamento de caixa.
          </p>
          <p className="text-sm text-theme-muted mt-2">
            Esta funcionalidade é restrita a Recepcionistas, Gerentes e
            Administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-theme-primary mb-2">
          <DollarSign className="w-8 h-8 inline mr-2" />
          Gerenciamento de Caixa
        </h1>
        <p className="text-theme-muted">
          Controle de abertura, fechamento e histórico de caixas da unidade
        </p>
      </div>

      {/* Caixa Atual */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-theme-primary">
            Caixa Atual
          </h2>

          {!activeCashRegister && canOpenCashRegister && (
            <Button
              variant="primary"
              onClick={() => setIsOpenModalVisible(true)}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Abrir Caixa
            </Button>
          )}
        </div>

        {loading ? (
          <div className="card-theme text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-theme-muted">
              Carregando informações do caixa...
            </p>
          </div>
        ) : activeCashRegister ? (
          <CashRegisterCard
            cashRegister={activeCashRegister}
            onClose={() => setIsCloseModalVisible(true)}
            onViewReport={handleViewReport}
          />
        ) : (
          <div className="card-theme text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-theme-muted" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
              Nenhum caixa aberto
            </h3>
            <p className="text-theme-muted mb-6">
              Abra um caixa para começar a registrar vendas e comandas
            </p>

            {canOpenCashRegister && (
              <Button
                variant="primary"
                onClick={() => setIsOpenModalVisible(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Abrir Caixa Agora
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-theme-primary mb-4">
          <FileText className="w-5 h-5 inline mr-2" />
          Histórico de Caixas
        </h2>

        {/* Filtros */}
        <div className="card-theme mb-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Data Final
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={handleApplyFilters}
                className="flex-1"
              >
                Filtrar
              </Button>
              <Button variant="secondary" onClick={handleClearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Tabela de Histórico */}
        <div className="card-theme overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-theme-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Saldo Inicial
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Saldo Final
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Diferença
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {cashRegisterHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-theme-muted"
                    >
                      Nenhum registro encontrado
                    </td>
                  </tr>
                ) : (
                  cashRegisterHistory.map(cash => {
                    const difference =
                      (cash.closingBalance || 0) - (cash.expectedBalance || 0);

                    return (
                      <tr
                        key={cash.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-theme-primary font-medium">
                            {formatDateTime(cash.openingTime)}
                          </div>
                          {cash.closingTime && (
                            <div className="text-xs text-theme-muted">
                              até {formatDateTime(cash.closingTime)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary">
                          {cash.openedByName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-theme-primary font-medium">
                          {formatCurrency(cash.openingBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-theme-primary font-medium">
                          {cash.closingBalance
                            ? formatCurrency(cash.closingBalance)
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {cash.status === 'closed' ? (
                            <span
                              className={`font-medium flex items-center justify-end gap-1 ${
                                Math.abs(difference) < 0.01
                                  ? 'text-gray-600 dark:text-gray-400'
                                  : difference > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {Math.abs(difference) < 0.01 ? (
                                <>
                                  <span>-</span>
                                </>
                              ) : difference > 0 ? (
                                <>
                                  <TrendingUp className="w-4 h-4" />
                                  <span>+{formatCurrency(difference)}</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4" />
                                  <span>{formatCurrency(difference)}</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-theme-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              cash.status === 'open'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {cash.status === 'open' ? 'Aberto' : 'Fechado'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-theme-border">
            {cashRegisterHistory.length === 0 ? (
              <div className="p-8 text-center text-theme-muted">
                Nenhum registro encontrado
              </div>
            ) : (
              cashRegisterHistory.map(cash => {
                const difference =
                  (cash.closingBalance || 0) - (cash.expectedBalance || 0);

                return (
                  <div key={cash.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-theme-primary">
                        {formatDateTime(cash.openingTime)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cash.status === 'open'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {cash.status === 'open' ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-theme-muted">Responsável:</span>
                        <p className="text-theme-primary font-medium">
                          {cash.openedByName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-theme-muted">Saldo Inicial:</span>
                        <p className="text-theme-primary font-medium">
                          {formatCurrency(cash.openingBalance)}
                        </p>
                      </div>
                    </div>

                    {cash.status === 'closed' && (
                      <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-theme-border">
                        <div>
                          <span className="text-theme-muted">Saldo Final:</span>
                          <p className="text-theme-primary font-medium">
                            {formatCurrency(cash.closingBalance)}
                          </p>
                        </div>
                        <div>
                          <span className="text-theme-muted">Diferença:</span>
                          <p
                            className={`font-medium ${
                              Math.abs(difference) < 0.01
                                ? 'text-gray-600 dark:text-gray-400'
                                : difference > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {Math.abs(difference) < 0.01
                              ? '-'
                              : formatCurrency(difference)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <OpenCashModal
        isOpen={isOpenModalVisible}
        onClose={() => setIsOpenModalVisible(false)}
        onConfirm={handleOpenCash}
        unitId={selectedUnit?.id}
        loading={loading}
      />

      <CloseCashModal
        isOpen={isCloseModalVisible}
        onClose={() => setIsCloseModalVisible(false)}
        onConfirm={handleCloseCash}
        cashRegister={activeCashRegister}
        expectedBalance={activeCashRegister?.openingBalance || 0}
        loading={loading}
      />

      <CashReportModal
        isOpen={isReportModalVisible}
        onClose={() => {
          setIsReportModalVisible(false);
          setReportData(null);
        }}
        cashRegister={{
          ...(reportData?.cashRegister || activeCashRegister),
          status: activeCashRegister?.status,
        }}
        transactions={reportData?.transactions || []}
        loading={reportLoading}
        onCloseCash={
          activeCashRegister?.status === 'open'
            ? handleCloseCashFromReport
            : undefined
        }
      />
    </div>
  );
};

export default CashRegisterPage;
