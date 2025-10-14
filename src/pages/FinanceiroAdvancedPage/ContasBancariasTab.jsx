import React, { useState, useMemo } from 'react';
import { Plus, Search, Building2, CreditCard } from 'lucide-react';
import useBankAccounts from '../../hooks/useBankAccounts';
import BankAccountCard from '../../molecules/BankAccountCard/BankAccountCard';
import { useAuth } from '../../context/AuthContext';

/**
 * Tab de Gestão de Contas Bancárias
 * 
 * Features:
 * - Listagem de contas bancárias
 * - Busca e filtros
 * - CRUD completo de contas
 * - Gestão por unidade
 */
const ContasBancariasTab = ({ globalFilters }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedBank, setSelectedBank] = useState('all');

  // Hook para carregar contas bancárias
  const {
    bankAccounts,
    loading,
    error,
    refetch
  } = useBankAccounts({
    unitId: globalFilters.unitId,
    incluirInativas: showInactive
  });

  // Verificar permissões
  const canManage = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Filtrar contas
  const filteredAccounts = useMemo(() => {
    if (!bankAccounts) return [];

    return bankAccounts.filter(account => {
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.agency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de banco
      const matchesBank = selectedBank === 'all' || account.bank === selectedBank;

      return matchesSearch && matchesBank;
    });
  }, [bankAccounts, searchTerm, selectedBank]);

  // Obter lista de bancos únicos
  const uniqueBanks = useMemo(() => {
    if (!bankAccounts) return [];
    const banks = [...new Set(bankAccounts.map(acc => acc.bank))];
    return banks.sort();
  }, [bankAccounts]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredAccounts.length;
    const active = filteredAccounts.filter(acc => acc.is_active).length;
    const totalBalance = filteredAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return { total, active, totalBalance };
  }, [filteredAccounts]);

  // Handlers (placeholder - implementar modais)
  const handleCreate = () => {
    // TODO: Abrir modal de criação
    alert('Funcionalidade de criação será implementada');
  };

  const handleEdit = (account) => {
    // TODO: Abrir modal de edição
    alert(`Editar conta: ${account.name}`);
  };

  const handleDelete = (account) => {
    // TODO: Abrir modal de confirmação
    alert(`Excluir conta: ${account.name}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Contas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Contas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Contas Ativas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contas Ativas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Saldo Total */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(stats.totalBalance)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Controles e Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, banco, agência ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro de Banco */}
          <div className="w-full lg:w-64">
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Bancos</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Toggle Inativas */}
          <div className="flex items-center gap-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mostrar inativas
              </span>
            </label>
          </div>

          {/* Botão Criar */}
          {canManage && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Nova Conta
            </button>
          )}
        </div>
      </div>

      {/* Lista de Contas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-300">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm || selectedBank !== 'all' ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedBank !== 'all' 
              ? 'Tente ajustar os filtros de busca.'
              : 'Cadastre a primeira conta bancária para começar.'}
          </p>
          {canManage && !searchTerm && selectedBank === 'all' && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Cadastrar Primeira Conta
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAccounts.map(account => (
            <BankAccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canManage}
              canDelete={canManage}
              showUnit={!globalFilters.unitId}
            />
          ))}
        </div>
      )}

      {/* Informação sobre permissões */}
      {!canManage && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ℹ️ Você tem permissão apenas para visualizar as contas bancárias. 
            Apenas administradores e gerentes podem criar, editar ou excluir contas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ContasBancariasTab;
