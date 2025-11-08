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
    console.log('🚀 handleOpenCash CHAMADO!', {
      data,
    }); // ✅ Log imediato

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
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleApplyFilters = () => {
    fetchCashRegisterHistory(filters);
  };
  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
    });
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
        <div className="card-theme mx-auto max-w-2xl py-12 text-center">
          <Lock className="text-theme-muted mx-auto mb-4 h-16 w-16" />
          <h2 className="text-theme-primary mb-2 text-2xl font-bold">
            Acesso Restrito
          </h2>
          <p className="text-theme-muted">
            Você não tem permissão para acessar o gerenciamento de caixa.
          </p>
          <p className="text-theme-muted mt-2 text-sm">
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
        <h1 className="text-theme-primary mb-2 text-3xl font-bold">
          <DollarSign className="mr-2 inline h-8 w-8" />
          Gerenciamento de Caixa
        </h1>
        <p className="text-theme-muted">
          Controle de abertura, fechamento e histórico de caixas da unidade
        </p>
      </div>

      {/* Caixa Atual */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-theme-primary text-xl font-semibold">
            Caixa Atual
          </h2>

          {!activeCashRegister && canOpenCashRegister && (
            <Button
              variant="primary"
              onClick={() => setIsOpenModalVisible(true)}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Abrir Caixa
            </Button>
          )}
        </div>

        {loading ? (
          <div className="card-theme py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
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
          <div className="card-theme py-12 text-center">
            <Clock className="text-theme-muted mx-auto mb-4 h-16 w-16" />
            <h3 className="text-theme-primary mb-2 text-lg font-semibold">
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
                <Plus className="mr-2 h-4 w-4" />
                Abrir Caixa Agora
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Histórico */}
      <div className="mb-8">
        <h2 className="text-theme-primary mb-4 text-xl font-semibold">
          <FileText className="mr-2 inline h-5 w-5" />
          Histórico de Caixas
        </h2>

        {/* Filtros */}
        <div className="card-theme mb-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-theme-primary mb-2 block text-sm font-medium">
                Data Inicial
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
              />
            </div>

            <div>
              <label className="text-theme-primary mb-2 block text-sm font-medium">
                Data Final
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
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
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-theme-border border-b bg-light-bg dark:bg-dark-bg dark:bg-dark-surface">
                <tr>
                  <th className="text-theme-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Período
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Saldo Inicial
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Saldo Final
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Diferença
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-theme-border divide-y">
                {cashRegisterHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-theme-muted px-6 py-12 text-center"
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
                        className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-dark-surface/50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-theme-primary text-sm font-medium">
                            {formatDateTime(cash.openingTime)}
                          </div>
                          {cash.closingTime && (
                            <div className="text-theme-muted text-xs">
                              até {formatDateTime(cash.closingTime)}
                            </div>
                          )}
                        </td>
                        <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-sm">
                          {cash.openedByName || 'N/A'}
                        </td>
                        <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          {formatCurrency(cash.openingBalance)}
                        </td>
                        <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          {cash.closingBalance
                            ? formatCurrency(cash.closingBalance)
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          {cash.status === 'closed' ? (
                            <span
                              className={`flex items-center justify-end gap-1 font-medium ${Math.abs(difference) < 0.01 ? 'text-gray-600 dark:text-gray-400' : difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                            >
                              {Math.abs(difference) < 0.01 ? (
                                <>
                                  <span>-</span>
                                </>
                              ) : difference > 0 ? (
                                <>
                                  <TrendingUp className="h-4 w-4" />
                                  <span>+{formatCurrency(difference)}</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="h-4 w-4" />
                                  <span>{formatCurrency(difference)}</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-theme-muted">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cash.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
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
          <div className="divide-theme-border divide-y md:hidden">
            {cashRegisterHistory.length === 0 ? (
              <div className="text-theme-muted p-8 text-center">
                Nenhum registro encontrado
              </div>
            ) : (
              cashRegisterHistory.map(cash => {
                const difference =
                  (cash.closingBalance || 0) - (cash.expectedBalance || 0);
                return (
                  <div key={cash.id} className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-primary text-sm font-medium">
                        {formatDateTime(cash.openingTime)}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${cash.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
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
                      <div className="border-theme-border grid grid-cols-2 gap-2 border-t pt-2 text-sm">
                        <div>
                          <span className="text-theme-muted">Saldo Final:</span>
                          <p className="text-theme-primary font-medium">
                            {formatCurrency(cash.closingBalance)}
                          </p>
                        </div>
                        <div>
                          <span className="text-theme-muted">Diferença:</span>
                          <p
                            className={`font-medium ${Math.abs(difference) < 0.01 ? 'text-gray-600 dark:text-gray-400' : difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
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
