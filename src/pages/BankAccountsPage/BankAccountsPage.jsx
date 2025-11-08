import React, { useState, useEffect } from 'react';
import { Building2, Wallet, Plus, RefreshCw, Edit3, Trash2, Eye, EyeOff, TrendingUp, TrendingDown, DollarSign, Calendar, Clock, AlertCircle, CheckCircle, Sparkles, History, X } from 'lucide-react';
import { useUnit } from '../../context/UnitContext';
import bankAccountsService from '../../services/bankAccountsService';
import { UnitSelector } from '../../atoms';

/**
 * Página de Contas Bancárias - Design System Compliant
 * Com integração de saldos em tempo real
 */
export function BankAccountsPage() {
  const {
    selectedUnit
  } = useUnit();
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
      const accountsData = await bankAccountsService.getBankAccounts(selectedUnit.id, showInactive);
      setAccounts(accountsData);

      // Buscar saldo consolidado
      const {
        data: consolidated
      } = await bankAccountsService.getConsolidatedBalance(selectedUnit.id);
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
      maximumFractionDigits: 2
    }).format(value || 0);
  };
  return <div className="min-h-screen bg-light-bg p-6 dark:bg-dark-bg">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              <Wallet className="h-9 w-9 text-primary" />
              Contas Bancárias
            </h1>
            <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary">
              Gerencie contas e acompanhe saldos em tempo real
            </p>
          </div>

          <div className="flex items-center gap-4">
            <UnitSelector userId="current-user" />
            <button onClick={fetchAccounts} disabled={loading} className="btn-theme-primary flex items-center gap-2 rounded-xl px-5 py-3 shadow-lg transition-all hover:shadow-xl disabled:opacity-50">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button onClick={() => setModalCreate(true)} className="text-dark-text-primary flex items-center gap-2 rounded-xl bg-gradient-success px-5 py-3 font-semibold shadow-lg transition-all hover:scale-105 hover:opacity-90 hover:shadow-xl">
              <Plus className="h-5 w-5" />
              Nova Conta
            </button>
          </div>
        </div>

        {selectedUnit && <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary-light px-4 py-2 dark:bg-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                Unidade:
              </span>
              <span className="font-bold text-primary">
                {selectedUnit.name}
              </span>
            </div>

            <button onClick={() => setShowBalances(!showBalances)} className="card-theme inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:bg-dark-surface dark:hover:bg-gray-700">
              {showBalances ? <>
                  <Eye className="h-4 w-4" />
                  Ocultar Saldos
                </> : <>
                  <EyeOff className="h-4 w-4" />
                  Mostrar Saldos
                </>}
            </button>

            <button onClick={() => setShowInactive(!showInactive)} className="card-theme inline-flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:bg-dark-surface dark:hover:bg-gray-700">
              <CheckCircle className="h-4 w-4" />
              {showInactive ? 'Apenas Ativas' : 'Incluir Inativas'}
            </button>
          </div>}
      </div>

      {/* Saldo Consolidado */}
      {consolidatedBalance && <div className="card-theme mb-8 rounded-3xl border-2 border-blue-200 bg-blue-50 p-8 shadow-2xl dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-blue-500 p-3 shadow-lg">
                  <DollarSign className="text-dark-text-primary h-7 w-7" />
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

              <div className="mt-6 grid grid-cols-3 gap-8">
                <div>
                  <p className="mb-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Saldo Inicial
                  </p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                    {showBalances ? formatCurrency(consolidatedBalance.total_initial_balance) : '••••••'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Saldo Atual
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {showBalances ? formatCurrency(consolidatedBalance.total_current_balance) : '••••••'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Saldo Disponível
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {showBalances ? formatCurrency(consolidatedBalance.total_available_balance) : '••••••'}
                  </p>
                </div>
              </div>
            </div>

            <Sparkles className="h-16 w-16 text-blue-400 opacity-30 dark:text-blue-600" />
          </div>
        </div>}

      {/* Grid de Contas */}
      {loading ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card-theme animate-pulse rounded-2xl p-6 shadow-lg">
              <div className="mb-4 h-20 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-3 h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>)}
        </div> : accounts.length === 0 ? <div className="card-theme rounded-3xl p-12 text-center shadow-xl">
          <div className="card-theme mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl dark:bg-dark-surface">
            <Wallet className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary h-10 w-10" />
          </div>
          <h3 className="mb-3 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Nenhuma conta cadastrada
          </h3>
          <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
            Cadastre sua primeira conta bancária para começar
          </p>
          <button onClick={() => setModalCreate(true)} className="text-dark-text-primary inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-semibold shadow-lg transition-all hover:from-blue-700 hover:to-blue-800">
            <Plus className="h-5 w-5" />
            Cadastrar Primeira Conta
          </button>
        </div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => <BankAccountCard key={account.id} account={account} showBalances={showBalances} onEditBalance={() => {
        setSelectedAccount(account);
        setModalEditBalance(true);
      }} onViewHistory={() => {
        setSelectedAccount(account);
        setModalHistory(true);
      }} onRefresh={fetchAccounts} />)}
        </div>}

      {/* Modais */}
      {modalEditBalance && selectedAccount && <EditBalanceModal account={selectedAccount} onClose={() => {
      setModalEditBalance(false);
      setSelectedAccount(null);
    }} onSuccess={fetchAccounts} />}

      {modalHistory && selectedAccount && <BalanceHistoryModal account={selectedAccount} onClose={() => {
      setModalHistory(false);
      setSelectedAccount(null);
    }} />}
    </div>;
}

// Componente Card de Conta Bancária
const BankAccountCard = ({
  account,
  showBalances,
  onEditBalance,
  onViewHistory,
  onRefresh
}) => {
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };
  const balanceVariation = account.current_balance - account.initial_balance;
  const isPositive = balanceVariation >= 0;
  return <div className={`card-theme rounded-2xl border-2 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl ${account.is_active ? 'border-light-border dark:border-dark-border' : 'border-red-300 opacity-60 dark:border-red-800'}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500 p-3 shadow-md">
            <Wallet className="text-dark-text-primary h-6 w-6" />
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

        {!account.is_active && <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
            Inativa
          </span>}
      </div>

      {/* Dados da Conta */}
      <div className="mb-4 rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-dark-surface/50">
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
      <div className="mb-4 space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Saldo Inicial
            </span>
            <button onClick={onEditBalance} className="hover:card-theme rounded p-1 transition-colors dark:hover:bg-gray-700" title="Editar saldo inicial">
              <Edit3 className="h-4 w-4 text-primary" />
            </button>
          </div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
            {showBalances ? formatCurrency(account.initial_balance) : '••••••'}
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Saldo Atual
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {showBalances ? formatCurrency(account.current_balance) : '••••••'}
          </p>
        </div>

        <div>
          <p className="mb-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Saldo Disponível
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">
            {showBalances ? formatCurrency(account.available_balance) : '••••••'}
          </p>
        </div>
      </div>

      {/* Variação */}
      <div className="mb-4 rounded-lg bg-gradient-light p-3 dark:from-gray-800 dark:to-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Variação
          </span>
          <div className="flex items-center gap-2">
            {isPositive ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
            <span className={`font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {showBalances ? formatCurrency(Math.abs(balanceVariation)) : '••••••'}
            </span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button onClick={onViewHistory} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
          <History className="h-4 w-4" />
          Histórico
        </button>
        <button onClick={onRefresh} className="card-theme rounded-lg px-3 py-2 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" title="Recalcular saldo">
          <RefreshCw className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
        </button>
      </div>
    </div>;
};

// Modal de Edição de Saldo Inicial
const EditBalanceModal = ({
  account,
  onClose,
  onSuccess
}) => {
  const [newValue, setNewValue] = useState(account.initial_balance || 0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const {
        data,
        error: updateError
      } = await bankAccountsService.updateInitialBalance(account.id, parseFloat(newValue), null,
      // userId será pego do auth context
      reason || 'Edição manual do saldo inicial');
      if (updateError) throw new Error(updateError);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar saldo');
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Editar Saldo Inicial
          </h3>
          <button onClick={onClose} className="hover:card-theme rounded-lg p-2 transition-colors dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <p className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-300">
              {account.name}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {account.bank_name} - Ag: {account.agency}, CC:{' '}
              {account.account_number}
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Novo Saldo Inicial *
            </label>
            <input type="number" step="0.01" value={newValue} onChange={e => setNewValue(e.target.value)} className="card-theme w-full rounded-lg border-2 border-light-border px-4 py-3 text-text-light-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:text-text-dark-primary" required />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              Motivo da Alteração (Opcional)
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="card-theme w-full resize-none rounded-lg border-2 border-light-border px-4 py-3 text-text-light-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-dark-border dark:text-text-dark-primary" placeholder="Ex: Ajuste de saldo após auditoria" />
          </div>

          {error && <div className="mb-4 flex items-center gap-2 rounded-lg border-2 border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="card-theme flex-1 rounded-lg px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-theme-secondary dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-theme-primary flex-1 rounded-lg px-4 py-3 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};

// Modal de Histórico de Alterações
const BalanceHistoryModal = ({
  account,
  onClose
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const {
          data
        } = await bankAccountsService.getBalanceHistory(account.id, 20);
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
      currency: 'BRL'
    }).format(value || 0);
  };
  const formatDate = date => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Histórico de Alterações
            </h3>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              {account.name} - {account.bank_name}
            </p>
          </div>
          <button onClick={onClose} className="hover:card-theme rounded-lg p-2 transition-colors dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>)}
          </div> : history.length === 0 ? <div className="py-12 text-center">
            <Clock className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-3 h-12 w-12" />
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Nenhuma alteração registrada
            </p>
          </div> : <div className="space-y-3">
            {history.map(log => <div key={log.id} className="rounded-lg border-2 border-light-border p-4 transition-colors hover:bg-light-bg dark:border-dark-border dark:bg-dark-bg dark:hover:bg-dark-surface/50">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.profiles?.full_name && <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      {log.profiles.full_name}
                    </span>}
                </div>

                <div className="mb-2 flex items-center gap-4">
                  <div>
                    <p className="mb-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      Valor Anterior
                    </p>
                    <p className="font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(log.old_value)}
                    </p>
                  </div>
                  <TrendingUp className="text-light-text-muted dark:text-dark-text-muted h-5 w-5" />
                  <div>
                    <p className="mb-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      Novo Valor
                    </p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(log.new_value)}
                    </p>
                  </div>
                </div>

                {log.change_reason && <p className="text-sm italic text-text-light-secondary dark:text-text-dark-secondary">
                    {log.change_reason}
                  </p>}
              </div>)}
          </div>}
      </div>
    </div>;
};