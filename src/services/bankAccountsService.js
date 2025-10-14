/**
 * BANK ACCOUNTS SERVICE
 * Serviço para gerenciamento de contas bancárias
 * 
 * Funcionalidades:
 * - CRUD completo de contas bancárias
 * - Listagem por unidade
 * - Gestão de status (ativa/inativa)
 * - Validações de dados
 */

import { supabase } from './supabase';

class BankAccountsService {
  /**
   * Listar todas as contas bancárias
   * @param {string} unitId - ID da unidade (opcional para filtrar)
   * @param {boolean} incluirInativas - Se deve incluir contas inativas
   * @returns {Promise<Array>} Lista de contas bancárias
   */
  async getBankAccounts(unitId = null, incluirInativas = false) {
    try {
      let query = supabase
        .from('bank_accounts')
        .select(`
          *,
          units (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      if (!incluirInativas) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw new Error('Falha ao carregar contas bancárias: ' + error.message);
    }
  }

  /**
   * Buscar conta bancária por ID
   * @param {string} id - ID da conta bancária
   * @returns {Promise<Object>} Dados da conta bancária
   */
  async getBankAccountById(id) {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select(`
          *,
          units (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error('Conta bancária não encontrada: ' + error.message);
    }
  }

  /**
   * Criar nova conta bancária
   * @param {Object} accountData - Dados da conta bancária
   * @returns {Promise<Object>} Conta bancária criada
   */
  async createBankAccount(accountData) {
    try {
      // Validar dados obrigatórios
      this._validateAccountData(accountData);

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          name: accountData.name.trim(),
          bank: accountData.bank.trim(),
          agency: accountData.agency.trim(),
          account_number: accountData.account_number.trim(),
          unit_id: accountData.unit_id,
          initial_balance: accountData.initial_balance || 0,
          is_active: true
        }])
        .select(`
          *,
          units (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error('Falha ao criar conta bancária: ' + error.message);
    }
  }

  /**
   * Atualizar conta bancária
   * @param {string} id - ID da conta bancária
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Conta bancária atualizada
   */
  async updateBankAccount(id, updateData) {
    try {
      // Validar dados obrigatórios
      this._validateAccountData(updateData, false);

      const updates = {};
      
      if (updateData.name !== undefined) {
        updates.name = updateData.name.trim();
      }
      if (updateData.bank !== undefined) {
        updates.bank = updateData.bank.trim();
      }
      if (updateData.agency !== undefined) {
        updates.agency = updateData.agency.trim();
      }
      if (updateData.account_number !== undefined) {
        updates.account_number = updateData.account_number.trim();
      }
      if (updateData.unit_id !== undefined) {
        updates.unit_id = updateData.unit_id;
      }
      if (updateData.initial_balance !== undefined) {
        updates.initial_balance = updateData.initial_balance;
      }
      if (updateData.is_active !== undefined) {
        updates.is_active = updateData.is_active;
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          units (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error('Falha ao atualizar conta bancária: ' + error.message);
    }
  }

  /**
   * Excluir conta bancária (soft delete)
   * @param {string} id - ID da conta bancária
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteBankAccount(id) {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error('Falha ao excluir conta bancária: ' + error.message);
    }
  }

  /**
   * Reativar conta bancária
   * @param {string} id - ID da conta bancária
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async reactivateBankAccount(id) {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      throw new Error('Falha ao reativar conta bancária: ' + error.message);
    }
  }

  /**
   * Verificar se conta já existe para uma unidade
   * @param {string} bank - Nome do banco
   * @param {string} agency - Agência
   * @param {string} accountNumber - Número da conta
   * @param {string} unitId - ID da unidade
   * @param {string} excludeId - ID para excluir da verificação (usado na edição)
   * @returns {Promise<boolean>} Se a conta já existe
   */
  async checkAccountExists(bank, agency, accountNumber, unitId, excludeId = null) {
    try {
      let query = supabase
        .from('bank_accounts')
        .select('id')
        .eq('bank', bank.trim())
        .eq('agency', agency.trim())
        .eq('account_number', accountNumber.trim())
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data && data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Obter estatísticas das contas bancárias
   * @param {string} unitId - ID da unidade (opcional)
   * @returns {Promise<Object>} Estatísticas das contas
   */
  async getBankAccountsStats(unitId = null) {
    try {
      let query = supabase
        .from('bank_accounts')
        .select('id, is_active, initial_balance');

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        active: data.filter(account => account.is_active).length,
        inactive: data.filter(account => !account.is_active).length,
        totalBalance: data
          .filter(account => account.is_active)
          .reduce((sum, account) => sum + (account.initial_balance || 0), 0)
      };

      return stats;
    } catch (error) {
      throw new Error('Falha ao carregar estatísticas: ' + error.message);
    }
  }

  /**
   * Validar dados da conta bancária
   * @private
   * @param {Object} data - Dados para validação
   * @param {boolean} isCreate - Se é operação de criação (campos obrigatórios)
   * @throws {Error} Se dados inválidos
   */
  _validateAccountData(data, isCreate = true) {
    if (isCreate) {
      if (!data.name || !data.name.trim()) {
        throw new Error('Nome da conta é obrigatório');
      }
      if (!data.bank || !data.bank.trim()) {
        throw new Error('Nome do banco é obrigatório');
      }
      if (!data.agency || !data.agency.trim()) {
        throw new Error('Agência é obrigatória');
      }
      if (!data.account_number || !data.account_number.trim()) {
        throw new Error('Número da conta é obrigatório');
      }
      if (!data.unit_id) {
        throw new Error('Unidade é obrigatória');
      }
    }

    // Validações de formato
    if (data.name && data.name.trim().length < 3) {
      throw new Error('Nome da conta deve ter pelo menos 3 caracteres');
    }
    if (data.bank && data.bank.trim().length < 2) {
      throw new Error('Nome do banco deve ter pelo menos 2 caracteres');
    }
    if (data.agency && !/^[\d-]+$/.test(data.agency.trim())) {
      throw new Error('Agência deve conter apenas números e hífen');
    }
    if (data.account_number && !/^[\d-]+$/.test(data.account_number.trim())) {
      throw new Error('Número da conta deve conter apenas números e hífen');
    }
    if (data.initial_balance !== undefined && data.initial_balance < 0) {
      throw new Error('Saldo inicial não pode ser negativo');
    }
  }
}

// Exportar instância singleton
const bankAccountsService = new BankAccountsService();
export default bankAccountsService;