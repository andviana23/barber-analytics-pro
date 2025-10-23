import React, { useState, useEffect } from 'react';
import {
  Building2,
  Wallet,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  History,
  X,
} from 'lucide-react';
import { useUnit } from '../../context/UnitContext';
import bankAccountsService from '../../services/bankAccountsService';
import { UnitSelector } from '../../atoms';

/**
 * Página de Contas Bancárias - Design System Compliant
 * Com integração de saldos em tempo real
 */
export function BankAccountsPage() {
  const { selectedUnit } = useUnit();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [consolidatedBalance, setConsolidatedBalance] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalEditBalance, setModalEditBalance] = useState(false);
  const [modalHistory, setModalHistory] = useState(false);
  const [modalCreate, setModalCreate] = useState(false);

  // Buscar contas e saldo consolidado
  const fetchAccounts = async () => {
    if (!selectedUnit?.id) return;

    setLoading(true);
    try {
      const accountsData = await bankAccountsService.getBankAccounts(
        selectedUnit.id,
        showInactive
      );
      setAccounts(accountsData);

      // Buscar saldo consolidado
      const { data: consolidated } =
        await bankAccountsService.getConsolidatedBalance(selectedUnit.id);
      setConsolidatedBalance(consolidated);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUnit?.id) {
      fetchAccounts();
    }
  }, [selectedUnit, showInactive]);

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2 flex items-center gap-3">
              <Wallet className="w-9 h-9 text-primary" />
              Contas Bancárias
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg">
              Gerencie contas e acompanhe saldos em tempo real
            </p>
          </div>

          <div className="flex items-center gap-4">
            <UnitSelector userId="current-user" />
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="btn-theme-primary px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
            <button
              onClick={() => setModalCreate(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Nova Conta
            </button>
          </div>
        </div>

        {selectedUnit && (
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary/20 rounded-lg border-2 border-primary/30">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                Unidade:
              </span>
              <span className="text-primary font-bold">
                {selectedUnit.name}
              </span>
            </div>

            <button
              onClick={() => setShowBalances(!showBalances)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {showBalances ? (
                <>
                  <Eye className="w-4 h-4" />
                  Ocultar Saldos
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Mostrar Saldos
                </>
              )}
            </button>

            <button
              onClick={() => setShowInactive(!showInactive)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {showInactive ? 'Apenas Ativas' : 'Incluir Inativas'}
            </button>
          </div>
        )}
      </div>

      {/* Saldo Consolidado */}
      {consolidatedBalance && (
        <div className="card-theme p-8 rounded-3xl shadow-2xl mb-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                    Saldo Consolidado
                  </h2>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {consolidatedBalance.total_accounts} contas ativas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 mt-6">
                <div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Saldo Inicial
                  </p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {showBalances
                      ? formatCurrency(
                          consolidatedBalance.total_initial_balance
                        )
                      : '••••••'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Saldo Atual
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {showBalances
                      ? formatCurrency(
                          consolidatedBalance.total_current_balance
                        )
                      : '••••••'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
                    Saldo Disponível
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {showBalances
                      ? formatCurrency(
                          consolidatedBalance.total_available_balance
                        )
                      : '••••••'}
                  </p>
                </div>
              </div>
            </div>

            <Sparkles className="w-16 h-16 text-blue-400 dark:text-blue-600 opacity-30" />
          </div>
        </div>
      )}

      {/* Grid de Contas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card-theme p-6 rounded-2xl shadow-lg animate-pulse"
            >
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card-theme p-12 rounded-3xl shadow-xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl mb-6">
            <Wallet className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-3">
            Nenhuma conta cadastrada
          </h3>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6">
            Cadastre sua primeira conta bancária para começar
          </p>
          <button
            onClick={() => setModalCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Primeira Conta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={account}
              showBalances={showBalances}
              onEditBalance={() => {
                setSelectedAccount(account);
                setModalEditBalance(true);
              }}
              onViewHistory={() => {
                setSelectedAccount(account);
                setModalHistory(true);
              }}
              onRefresh={fetchAccounts}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {modalEditBalance && selectedAccount && (
        <EditBalanceModal
          account={selectedAccount}
          onClose={() => {
            setModalEditBalance(false);
            setSelectedAccount(null);
          }}
          onSuccess={fetchAccounts}
        />
      )}

      {modalHistory && selectedAccount && (
        <BalanceHistoryModal
          account={selectedAccount}
          onClose={() => {
            setModalHistory(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Card de Conta Bancária
const BankAccountCard = ({
  account,
  showBalances,
  onEditBalance,
  onViewHistory,
  onRefresh,
}) => {
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const balanceVariation = account.current_balance - account.initial_balance;
  const isPositive = balanceVariation >= 0;

  return (
    <div
      className={`card-theme p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${
        account.is_active
          ? 'border-light-border dark:border-dark-border'
          : 'border-red-300 dark:border-red-800 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
              {account.name}
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {account.bank_name}
            </p>
          </div>
        </div>

        {!account.is_active && (
          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold">
            Inativa
          </span>
        )}
      </div>

      {/* Dados da Conta */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              Agência:
            </span>
            <span className="ml-2 font-semibold text-text-light-primary dark:text-text-dark-primary">
              {account.agency}
            </span>
          </div>
          <div>
            <span className="text-text-light-secondary dark:text-text-dark-secondary">
              Conta:
            </span>
            <span className="ml-2 font-semibold text-text-light-primary dark:text-text-dark-primary">
              {account.account_number}
            </span>
          </div>
        </div>
      </div>

      {/* Saldos */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Saldo Inicial
            </span>
            <button
              onClick={onEditBalance}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Editar saldo inicial"
            >
              <Edit3 className="w-4 h-4 text-primary" />
            </button>
          </div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {showBalances ? formatCurrency(account.initial_balance) : '••••••'}
          </p>
        </div>

        <div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Saldo Atual
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {showBalances ? formatCurrency(account.current_balance) : '••••••'}
          </p>
        </div>

        <div>
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Saldo Disponível
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {showBalances ? formatCurrency(account.saldo_disponivel) : '••••••'}
          </p>
        </div>
      </div>

      {/* Variação */}
      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Variação
          </span>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`font-bold ${
                isPositive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {showBalances
                ? formatCurrency(Math.abs(balanceVariation))
                : '••••••'}
            </span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={onViewHistory}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-semibold"
        >
          <History className="w-4 h-4" />
          Histórico
        </button>
        <button
          onClick={onRefresh}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Recalcular saldo"
        >
          <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Modal de Edição de Saldo Inicial
const EditBalanceModal = ({ account, onClose, onSuccess }) => {
  const [newValue, setNewValue] = useState(account.initial_balance || 0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: updateError } =
        await bankAccountsService.updateInitialBalance(
          account.id,
          parseFloat(newValue),
          null, // userId será pego do auth context
          reason || 'Edição manual do saldo inicial'
        );

      if (updateError) throw new Error(updateError);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar saldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-theme max-w-md w-full p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Editar Saldo Inicial
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              {account.name}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {account.bank_name} - Ag: {account.agency}, CC:{' '}
              {account.account_number}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
              Novo Saldo Inicial *
            </label>
            <input
              type="number"
              step="0.01"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
              Motivo da Alteração (Opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border-2 border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              placeholder="Ex: Ajuste de saldo após auditoria"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-theme-primary px-4 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Histórico de Alterações
const BalanceHistoryModal = ({ account, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await bankAccountsService.getBalanceHistory(
          account.id,
          20
        );
        setHistory(data || []);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [account.id]);

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = date => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card-theme max-w-2xl w-full p-6 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-1">
              Histórico de Alterações
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {account.name} - {account.bank_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Nenhuma alteração registrada
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(log => (
              <div
                key={log.id}
                className="p-4 border-2 border-light-border dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.profiles?.full_name && (
                    <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {log.profiles.full_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                      Valor Anterior
                    </p>
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(log.old_value)}
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary mb-1">
                      Novo Valor
                    </p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(log.new_value)}
                    </p>
                  </div>
                </div>

                {log.change_reason && (
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary italic">
                    {log.change_reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
