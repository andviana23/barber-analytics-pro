import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Edit,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  Users,
  Settings,
  MoreVertical,
  ChevronRight,
  Star,
  Shield,
  Zap,
} from 'lucide-react';
import useBankAccounts from '../../hooks/useBankAccounts';
import BankAccountCard from '../../molecules/BankAccountCard/BankAccountCard';
import { useAuth } from '../../context/AuthContext';
import CreateBankAccountModal from '../../organisms/BankAccountModals/CreateBankAccountModal';
import EditBankAccountModal from '../../organisms/BankAccountModals/EditBankAccountModal';
import DeleteBankAccountModal from '../../organisms/BankAccountModals/DeleteBankAccountModal';
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
    unitId: globalFilters?.unitId || null, // Usar filtro global de unidade
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
      <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:-translate-y-1">
        {/* Header do Card */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              {account.is_active && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {account.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                {account.bank_name || account.bank}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(account)}
                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                title="Editar conta"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(account)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Excluir conta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Detalhes da Conta */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Agência
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {account.agency}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Conta
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {account.account_number}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SALDOS - NOVO LAYOUT */}
        <div className="space-y-3 mb-5">
          {/* Saldo Inicial */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
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
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all"
                  title="Editar saldo inicial"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Saldo Atual */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                    Saldo Atual
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(account.current_balance || 0)}
                  </p>
                </div>
              </div>
              {balanceVariation !== 0 && (
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                    isPositiveVariation
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  {isPositiveVariation ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      isPositiveVariation
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}
                  >
                    {formatCurrency(Math.abs(balanceVariation))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Saldo Disponível */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
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
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Movimentações
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receitas
                  </p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(account.total_revenues || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              account.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {account.is_active ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativa
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Inativa
              </>
            )}
          </span>

          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(account.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Linha da Tabela Melhorado
  const TableRow = ({ account }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {account.is_active && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {account.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {account.bank}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {account.agency}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {account.account_number}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-green-600 dark:text-green-400">
          {formatCurrency(account.balance)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            account.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {account.is_active ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {formatDate(account.created_at)}
      </td>
      {canManage && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => handleEdit(account)}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(account)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
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
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏦 Contas Bancárias</h1>
              <p className="text-blue-100 text-lg">Carregando informações...</p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>

        {/* Cards de Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Erro ao carregar contas
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              Contas Bancárias
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gerencie todas as contas bancárias do sistema
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            {canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Conta
              </button>
            )}
          </div>
        </div>

        {/* Cards de Estatísticas - Saldos Consolidados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                  Saldo Inicial Total
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(stats.totalInitialBalance)}
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  {stats.total} conta{stats.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                  Saldo Atual Total
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(stats.totalCurrentBalance)}
                </p>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.active} ativa{stats.active !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                  Saldo Disponível
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(stats.totalAvailableBalance)}
                </p>
                <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  Líquido compensado
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700/50 dark:to-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Banco Principal
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {stats.topBank || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mais utilizado
                </p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-600/50 rounded-xl">
                <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumo de Movimentações */}
        {(stats.totalRevenues > 0 || stats.totalExpenses > 0) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                    Total de Receitas
                  </p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(stats.totalRevenues)}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">
                    Total de Despesas
                  </p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, banco, agência ou conta..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Filtro por banco */}
            <select
              value={selectedBank}
              onChange={e => setSelectedBank(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrar inativas
              </span>
            </label>

            {/* Toggle de visualização */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Visualização em Grid"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                title="Visualização em Lista"
              >
                <Activity className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredAndSortedAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {bankAccounts?.length === 0
                ? 'Nenhuma conta cadastrada'
                : 'Nenhuma conta encontrada'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {bankAccounts?.length === 0
                ? 'Cadastre a primeira conta bancária para começar.'
                : 'Tente ajustar os filtros de busca.'}
            </p>
            {bankAccounts?.length === 0 && canManage && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Primeira Conta
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedAccounts.map(account => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Criada em
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
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
