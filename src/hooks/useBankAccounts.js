import { useState, useEffect, useCallback } from 'react';
import { bankAccountsService } from '../services';

/**
 * Hook customizado para gerenciar estado de contas bancárias
 * @param {Object} initialFilters - Filtros iniciais (unitId, incluirInativas)
 * @returns {Object} Estado e funções para gerenciar contas bancárias
 */
export function useBankAccounts(initialFilters = {}) {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  /**
   * Carrega a lista de contas bancárias
   */
  const loadBankAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { unitId, incluirInativas = false } = filters;
      const data = await bankAccountsService.getBankAccounts(
        unitId,
        incluirInativas
      );

      setBankAccounts(data);
    } catch (err) {
      setError(err.message);
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Cria uma nova conta bancária
   */
  const createBankAccount = useCallback(async accountData => {
    try {
      setLoading(true);
      setError(null);

      const newAccount =
        await bankAccountsService.createBankAccount(accountData);

      // Atualiza a lista local
      setBankAccounts(prev => [newAccount, ...prev]);

      return newAccount;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza uma conta bancária
   */
  const updateBankAccount = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const updatedAccount = await bankAccountsService.updateBankAccount(
        id,
        updateData
      );

      // Atualiza a lista local
      setBankAccounts(prev =>
        prev.map(account => (account.id === id ? updatedAccount : account))
      );

      return updatedAccount;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Exclui uma conta bancária (soft delete)
   */
  const deleteBankAccount = useCallback(
    async id => {
      try {
        setLoading(true);
        setError(null);

        await bankAccountsService.deleteBankAccount(id);

        // Remove da lista local se não incluir inativas
        if (!filters.incluirInativas) {
          setBankAccounts(prev => prev.filter(account => account.id !== id));
        } else {
          // Atualiza o status para inativo
          setBankAccounts(prev =>
            prev.map(account =>
              account.id === id ? { ...account, is_active: false } : account
            )
          );
        }

        return true;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [filters.incluirInativas]
  );

  /**
   * Reativa uma conta bancária
   */
  const reactivateBankAccount = useCallback(async id => {
    try {
      setLoading(true);
      setError(null);

      await bankAccountsService.reactivateBankAccount(id);

      // Atualiza o status para ativo
      setBankAccounts(prev =>
        prev.map(account =>
          account.id === id ? { ...account, is_active: true } : account
        )
      );

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca uma conta bancária específica por ID
   */
  const getBankAccountById = useCallback(async id => {
    try {
      setLoading(true);
      setError(null);

      const account = await bankAccountsService.getBankAccountById(id);
      return account;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verifica se uma conta já existe
   */
  const checkAccountExists = useCallback(
    async (bank, agency, accountNumber, unitId, excludeId = null) => {
      try {
        return await bankAccountsService.checkAccountExists(
          bank,
          agency,
          accountNumber,
          unitId,
          excludeId
        );
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    []
  );

  /**
   * Obtém estatísticas das contas bancárias
   */
  const getBankAccountsStats = useCallback(async (unitId = null) => {
    try {
      setLoading(true);
      setError(null);

      const stats = await bankAccountsService.getBankAccountsStats(unitId);
      return stats;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza os filtros
   */
  const updateFilters = useCallback(newFilters => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Limpa o erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Recarrega a lista
   */
  const refetch = useCallback(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  // Carrega os dados iniciais quando os filtros mudam
  useEffect(() => {
    loadBankAccounts();
  }, [loadBankAccounts]);

  return {
    // Estado
    bankAccounts,
    loading,
    error,
    filters,

    // Ações CRUD
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    reactivateBankAccount,
    getBankAccountById,

    // Utilitários
    checkAccountExists,
    getBankAccountsStats,

    // Controles
    updateFilters,
    clearError,
    refetch,
    reload: loadBankAccounts,
  };
}

export default useBankAccounts;
