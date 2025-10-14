/**
 * BANK ACCOUNTS PAGE
 * 
 * Página para gerenciamento de contas bancárias
 * Acessível apenas para administradores
 */

import React, { useState } from 'react';
import { Plus, Search, CreditCard, AlertCircle } from 'lucide-react';

import { Button, Input } from '../../atoms';
import { 
  CreateBankAccountModal, 
  EditBankAccountModal, 
  DeleteBankAccountModal 
} from '../../organisms';

import { useBankAccounts, useUnits } from '../../hooks';
import { useAuth } from '../../context';

const BankAccountsPage = () => {
  const { user } = useAuth();
  const { bankAccounts, loading, error, updateFilters } = useBankAccounts();
  const { units } = useUnits();

  // Estados dos modais
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false
  });

  const [selectedAccount, setSelectedAccount] = useState(null);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const showInactive = false; // Simplificado: sempre mostra apenas ativas por padrão

  // Verificar permissão de admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Acesso Restrito
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Esta página é acessível apenas para administradores do sistema.
        </p>
      </div>
    );
  }

  // Filtrar contas bancárias
  const filteredAccounts = bankAccounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.agency.includes(searchTerm) ||
      account.account_number.includes(searchTerm);

    const matchesUnit = !selectedUnit || account.unit_id === selectedUnit;
    const matchesStatus = showInactive || account.is_active;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  // Handlers dos modals
  const handleOpenModal = (modal, account = null) => {
    setSelectedAccount(account);
    setModals(prev => ({ ...prev, [modal]: true }));
  };

  const handleCloseModal = (modal) => {
    setModals(prev => ({ ...prev, [modal]: false }));
    setSelectedAccount(null);
  };

  const handleModalSuccess = () => {
    // Os modals já atualizam a lista via hook
  };

  // Handlers dos filtros
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleUnitChange = (e) => {
    const unitId = e.target.value;
    setSelectedUnit(unitId);
    updateFilters({ unitId: unitId || null });
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Filtros e ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, banco, agência ou conta..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full sm:w-80"
            />
          </div>

          {/* Filtro por unidade */}
          <select
            value={selectedUnit}
            onChange={handleUnitChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as unidades</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => handleOpenModal('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {/* Tabela de contas bancárias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-1">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Erro ao carregar contas bancárias</span>
              </div>
              <p className="text-red-700 dark:text-red-300 text-sm ml-7">{error}</p>
            </div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {bankAccounts.length === 0 ? "Nenhuma conta cadastrada" : "Nenhuma conta encontrada"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {bankAccounts.length === 0
                ? "Comece cadastrando a primeira conta bancária"
                : "Tente ajustar os filtros de busca"}
            </p>
            {bankAccounts.length === 0 && (
              <Button 
                onClick={() => handleOpenModal('create')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeira Conta
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conta
                  </th>
                  {!selectedUnit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Unidade
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saldo Inicial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccounts.map((account) => (
                  <tr 
                    key={account.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {account.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{account.bank}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{account.agency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{account.account_number}</div>
                    </td>
                    {!selectedUnit && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {account.units?.name || '-'}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(account.initial_balance || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {account.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenModal('edit', account)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenModal('delete', account)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBankAccountModal
        isOpen={modals.create}
        onClose={() => handleCloseModal('create')}
        onSuccess={handleModalSuccess}
      />

      <EditBankAccountModal
        isOpen={modals.edit}
        onClose={() => handleCloseModal('edit')}
        onSuccess={handleModalSuccess}
        account={selectedAccount}
      />

      <DeleteBankAccountModal
        isOpen={modals.delete}
        onClose={() => handleCloseModal('delete')}
        onSuccess={handleModalSuccess}
        account={selectedAccount}
      />
    </div>
  );
};

export default BankAccountsPage;