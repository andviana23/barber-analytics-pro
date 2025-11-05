import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Edit,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import useBankAccounts from '../../hooks/useBankAccounts';
import FinancialSeparationDemo from '../../molecules/FinancialSeparationDemo';
import CreateBankAccountModal from '../../organisms/BankAccountModals/CreateBankAccountModal';
import DeleteBankAccountModal from '../../organisms/BankAccountModals/DeleteBankAccountModal';
import EditBankAccountModal from '../../organisms/BankAccountModals/EditBankAccountModal';
import EditInitialBalanceModal from '../../organisms/BankAccountModals/EditInitialBalanceModal';

/**
 * 🏦 Contas Bancárias - Tab Refatorada
 *
 * ✨ Features:
 * - Dashboard visual com KPIs avançados
 * - Cards detalhados com informações completas
 * - Filtros inteligentes e busca avançada
 * - Layout responsivo e moderno
 * - Animações suaves e feedback visual
 * - Gestão completa de contas bancárias
 */
const ContasBancariasTab = ({ globalFilters }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedBank, setSelectedBank] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('created_at'); // 'name', 'balance', 'created_at'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' ou 'desc'

  // Estados dos modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Hook para carregar contas bancárias com novos saldos calculados
  const { bankAccounts, loading, error, refetch } = useBankAccounts({
    unitId: globalFilters?.unitId || null,
    // Usar filtro global de unidade
    incluirInativas: showInactive,
  });
  console.log(
    '🏦 ContasBancariasTab - Contas carregadas:',
    bankAccounts?.length || 0,
    bankAccounts
  );

  // Verificar permissões
  const canManage = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Filtrar e ordenar contas
  const filteredAndSortedAccounts = useMemo(() => {
    if (!bankAccounts) return [];
    let filtered = bankAccounts.filter(account => {
      // Filtro de busca
      const matchesSearch =
        searchTerm === '' ||
        account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.agency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Filtro de banco
      const matchesBank =
        selectedBank === 'all' || account.bank === selectedBank;
      return matchesSearch && matchesBank;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'balance':
          aValue = a.balance || 0;
          bValue = b.balance || 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
      }
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    return filtered;
  }, [bankAccounts, searchTerm, selectedBank, sortBy, sortOrder]);

  // Obter lista de bancos únicos
  const uniqueBanks = useMemo(() => {
    if (!bankAccounts) return [];
    const banks = [...new Set(bankAccounts.map(acc => acc.bank))];
    return banks.sort();
  }, [bankAccounts]);

  // Estatísticas avançadas com saldos calculados
  const stats = useMemo(() => {
    if (!bankAccounts)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalInitialBalance: 0,
        totalCurrentBalance: 0,
        totalAvailableBalance: 0,
        totalRevenues: 0,
        totalExpenses: 0,
        topBank: '',
        recentActivity: 0,
      };
    const total = bankAccounts.length;
    const active = bankAccounts.filter(acc => acc.is_active).length;
    const inactive = total - active;

    // Somar saldos calculados
    const totalInitialBalance = bankAccounts.reduce(
      (sum, acc) => sum + (parseFloat(acc.initial_balance) || 0),
      0
    );
    const totalCurrentBalance = bankAccounts.reduce(
      (sum, acc) => sum + (parseFloat(acc.current_balance) || 0),
      0
    );
    const totalAvailableBalance = bankAccounts.reduce(
      (sum, acc) => sum + (parseFloat(acc.available_balance) || 0),
      0
    );
    const totalRevenues = bankAccounts.reduce(
      (sum, acc) => sum + (parseFloat(acc.total_revenues) || 0),
      0
    );
    const totalExpenses = bankAccounts.reduce(
      (sum, acc) => sum + (parseFloat(acc.total_expenses) || 0),
      0
    );

    // Banco mais comum
    const bankCounts = bankAccounts.reduce((acc, account) => {
      const bankName = account.bank_name || account.bank;
      acc[bankName] = (acc[bankName] || 0) + 1;
      return acc;
    }, {});
    const topBank = Object.keys(bankCounts).reduce(
      (a, b) => (bankCounts[a] > bankCounts[b] ? a : b),
      ''
    );
    return {
      total,
      active,
      inactive,
      totalInitialBalance,
      totalCurrentBalance,
      totalAvailableBalance,
      totalRevenues,
      totalExpenses,
      topBank,
      recentActivity: bankAccounts.filter(acc => {
        const createdDate = new Date(acc.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length,
    };
  }, [bankAccounts]);

  // Handlers
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };
  const handleEdit = account => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };
  const handleDelete = account => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };
  const handleEditBalance = account => {
    setSelectedAccount(account);
    setIsEditBalanceModalOpen(true);
  };
  const handleSuccess = () => {
    refetch(); // Recarregar lista
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsEditBalanceModalOpen(false);
    setSelectedAccount(null);
  };
  const handleRefresh = () => {
    refetch();
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };
  const formatDate = date => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Componente de Card de Conta Melhorado com Saldos Calculados
  const AccountCard = ({ account }) => {
    // 🔍 DEBUG - Verificar dados da conta
    console.log('💳 Conta:', account.name, {
      initial_balance: account.initial_balance,
      current_balance: account.current_balance,
      available_balance: account.available_balance,
      total_revenues: account.total_revenues,
      total_expenses: account.total_expenses,
    });
    const balanceVariation =
      (account.current_balance || 0) - (account.initial_balance || 0);
    const isPositiveVariation = balanceVariation >= 0;
    return (
      <div className="card-theme group rounded-2xl border border-light-border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-2xl dark:border-dark-border dark:bg-dark-surface dark:hover:border-blue-500">
        {/* Header do Card */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
                <Building2 className="text-dark-text-primary h-6 w-6" />
              </div>
              {account.is_active && (
                <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full border-2 border-light-surface bg-green-500 dark:border-dark-surface dark:border-gray-800" />
              )}
            </div>
            <div>
              <h3 className="text-theme-primary dark:text-dark-text-primary text-xl font-bold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {account.name}
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5" />
                {account.bank_name || account.bank}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => handleEdit(account)}
                className="text-light-text-muted dark:text-dark-text-muted rounded-lg p-2 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                title="Editar conta"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(account)}
                className="text-light-text-muted dark:text-dark-text-muted rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Excluir conta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Detalhes da Conta */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-gray-700/50">
              <MapPin className="text-light-text-muted dark:text-dark-text-muted h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                  Agência
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary text-sm font-semibold">
                  {account.agency}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg bg-light-bg p-3 dark:bg-dark-bg dark:bg-gray-700/50">
              <CreditCard className="text-light-text-muted dark:text-dark-text-muted h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                  Conta
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary text-sm font-semibold">
                  {account.account_number}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SALDOS - NOVO LAYOUT */}
        <div className="mb-5 space-y-3">
          {/* Saldo Inicial */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800/30 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/40">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    Saldo Inicial
                  </p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(account.initial_balance || 0)}
                  </p>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => handleEditBalance(account)}
                  className="rounded-lg p-2 text-blue-600 transition-all hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
                  title="Editar saldo inicial"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Saldo Atual */}
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/40">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-green-600 dark:text-green-400">
                    Saldo Atual
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(account.current_balance || 0)}
                  </p>
                </div>
              </div>
              {balanceVariation !== 0 && (
                <div
                  className={`flex items-center space-x-1 rounded-lg px-2 py-1 ${isPositiveVariation ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
                >
                  {isPositiveVariation ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${isPositiveVariation ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
                  >
                    {formatCurrency(Math.abs(balanceVariation))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Saldo Disponível */}
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-800/30 dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/40">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
                    Saldo Disponível
                  </p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(account.available_balance || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de Movimentações */}
        {(account.total_revenues > 0 || account.total_expenses > 0) && (
          <div className="mb-4 border-t border-light-border pt-4 dark:border-dark-border">
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-3 text-xs font-medium uppercase tracking-wide">
              Movimentações
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Receitas
                  </p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(account.total_revenues || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                    Despesas
                  </p>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(account.total_expenses || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status e Data de Criação */}
        <div className="flex items-center justify-between border-t border-light-border pt-4 dark:border-dark-border">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${account.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
          >
            {account.is_active ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Ativa
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Inativa
              </>
            )}
          </span>

          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center space-x-1 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(account.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Linha da Tabela Melhorado
  const TableRow = ({ account }) => (
    <tr className="group transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700/50">
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="relative">
            <div className="rounded-lg bg-gradient-primary p-2">
              <Building2 className="text-dark-text-primary h-5 w-5" />
            </div>
            {account.is_active && (
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-light-surface bg-green-500 dark:border-dark-surface"></div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-theme-primary dark:text-dark-text-primary text-sm font-semibold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {account.name}
            </div>
            <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              {account.bank}
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
          {account.agency}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
          {account.account_number}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <div className="text-sm font-bold text-green-600 dark:text-green-400">
          {formatCurrency(account.balance)}
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${account.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
        >
          {account.is_active ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted whitespace-nowrap px-6 py-4 text-sm">
        {formatDate(account.created_at)}
      </td>
      {canManage && (
        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(account)}
              className="text-blue-600 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(account)}
              className="text-red-600 transition-colors hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header com Loading */}
        <div className="text-dark-text-primary rounded-2xl bg-gradient-primary p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">🏦 Contas Bancárias</h1>
              <p className="text-lg text-blue-100">Carregando informações...</p>
            </div>
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-light-surface dark:border-dark-surface"></div>
          </div>
        </div>

        {/* Cards de Loading */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, i) => (
            <div
              key={i}
              className="card-theme animate-pulse rounded-xl p-6 dark:bg-dark-surface"
            >
              <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
            Erro ao carregar contas
          </h3>
          <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-dark-text-primary inline-flex items-center rounded-lg bg-red-600 px-4 py-2 transition-colors hover:bg-red-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary mb-1 text-2xl font-semibold">
              Contas Bancárias
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              Gerencie todas as contas bancárias do sistema
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary dark:text-theme-secondary p-2 transition-colors dark:text-gray-600 dark:hover:text-gray-300"
              title="Atualizar"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            {canManage && (
              <button
                onClick={handleCreate}
                className="text-dark-text-primary inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </button>
            )}
          </div>
        </div>

        {/* Cards de Estatísticas - Saldos Consolidados */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-800/30 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Saldo Inicial Total
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(stats.totalInitialBalance)}
                </p>
                <p className="mt-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                  {stats.total} conta{stats.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/40">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 p-5 dark:border-green-800/30 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                  Saldo Atual Total
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(stats.totalCurrentBalance)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-green-600/70 dark:text-green-400/70">
                  <TrendingUp className="h-3 w-3" />
                  {stats.active} ativa{stats.active !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="rounded-xl bg-green-100 p-3 dark:bg-green-900/40">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-5 dark:border-purple-800/30 dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                  Saldo Disponível
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(stats.totalAvailableBalance)}
                </p>
                <p className="mt-1 text-xs text-purple-600/70 dark:text-purple-400/70">
                  Líquido compensado
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/40">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-light-border bg-gray-50 p-5 dark:border-dark-border dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-1 text-xs font-semibold uppercase tracking-wide">
                  Banco Principal
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary truncate text-lg font-bold">
                  {stats.topBank || 'N/A'}
                </p>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
                  Mais utilizado
                </p>
              </div>
              <div className="card-theme rounded-xl p-3 dark:bg-gray-600/50">
                <Building2 className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de Movimentações */}
        {(stats.totalRevenues > 0 || stats.totalExpenses > 0) && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-green-100 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                    Total de Receitas
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(stats.totalRevenues)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    Total de Despesas
                  </p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Separação Financeira - Demonstração para primeira conta ativa */}
      <FinancialSeparationDemo accounts={filteredAndSortedAccounts} />

      {/* Filtros e Controles */}
      <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            {/* Busca */}
            <div className="relative">
              <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Buscar por nome, banco, agência ou conta..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border px-4 py-2 pl-10 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700 dark:placeholder-gray-400 sm:w-80"
              />
            </div>

            {/* Filtro por banco */}
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="card-theme text-theme-primary dark:text-dark-text-primary rounded-lg border border-light-border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
            >
              <option value="all">Todos os Bancos</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>

            {/* Ordenação */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="card-theme text-theme-primary dark:text-dark-text-primary rounded-lg border border-light-border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
            >
              <option value="created_at-desc">Mais Recentes</option>
              <option value="created_at-asc">Mais Antigas</option>
              <option value="name-asc">Nome A-Z</option>
              <option value="name-desc">Nome Z-A</option>
              <option value="balance-desc">Maior Saldo</option>
              <option value="balance-asc">Menor Saldo</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Mostrar inativas */}
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded border-light-border text-blue-600 focus:ring-blue-500 dark:border-dark-border"
              />
              <span className="dark:text-theme-secondary text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Mostrar inativas
              </span>
            </label>

            {/* Toggle de visualização */}
            <div className="card-theme flex rounded-lg p-1 dark:bg-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                title="Visualização em Grid"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                title="Visualização em Lista"
              >
                <Activity className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="card-theme overflow-hidden rounded-xl border border-light-border dark:border-dark-border dark:bg-dark-surface">
        {filteredAndSortedAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
              {bankAccounts?.length === 0
                ? 'Nenhuma conta cadastrada'
                : 'Nenhuma conta encontrada'}
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
              {bankAccounts?.length === 0
                ? 'Cadastre a primeira conta bancária para começar.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
            {bankAccounts?.length === 0 && canManage && (
              <button
                onClick={handleCreate}
                className="text-dark-text-primary inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold transition-colors hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Cadastrar Primeira Conta
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedAccounts.map(account => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                <tr>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Agência
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Criada em
                  </th>
                  {canManage && (
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="card-theme divide-y divide-gray-200 dark:divide-gray-700 dark:bg-dark-surface">
                {filteredAndSortedAccounts.map(account => (
                  <TableRow key={account.id} account={account} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Aviso de Permissões */}
      {!canManage && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ℹ️ Você tem permissão apenas para visualizar as contas bancárias.
            Apenas administradores e gerentes podem criar, editar ou excluir
            contas.
          </p>
        </div>
      )}

      {/* Modals */}
      <CreateBankAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditBankAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSuccess}
        account={selectedAccount}
      />

      <DeleteBankAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleSuccess}
        account={selectedAccount}
      />

      <EditInitialBalanceModal
        isOpen={isEditBalanceModalOpen}
        onClose={() => setIsEditBalanceModalOpen(false)}
        onSuccess={handleSuccess}
        account={selectedAccount}
      />
    </div>
  );
};
export default ContasBancariasTab;
