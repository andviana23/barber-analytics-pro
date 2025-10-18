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
        .select('*')
        .order('created_at', { ascending: false });

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      if (!incluirInativas) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar contas bancárias:', error);
        throw error;
      }

      // Buscar dados das unidades separadamente
      if (data && data.length > 0) {
        const unitIds = [...new Set(data.map(acc => acc.unit_id))];
        const { data: units } = await supabase
          .from('units')
          .select('id, name')
          .in('id', unitIds);

        if (units) {
          // Mapear unidades aos dados
          const unitsMap = {};
          units.forEach(unit => {
            unitsMap[unit.id] = unit;
          });

          data.forEach(account => {
            if (account.unit_id && unitsMap[account.unit_id]) {
              account.units = unitsMap[account.unit_id];
            }
            // ✅ Adicionar campo 'bank' para compatibilidade com o frontend
            account.bank = account.bank_name;
          });
        }
      }

      return data || [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro completo:', error);
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
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar conta bancária:', error);
        throw error;
      }

      // Buscar dados da unidade separadamente
      if (data && data.unit_id) {
        const { data: unit } = await supabase
          .from('units')
          .select('id, name')
          .eq('id', data.unit_id)
          .single();
        
        if (unit) {
          data.units = unit;
        }
      }

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro completo:', error);
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
          bank_name: accountData.bank.trim(), // ✅ Corrigido: bank → bank_name
          agency: accountData.agency.trim(),
          account_number: accountData.account_number.trim(),
          unit_id: accountData.unit_id,
          initial_balance: accountData.initial_balance || 0,
          nickname: accountData.nickname?.trim() || null,
          is_active: true
        }])
        .select('*')
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao criar conta bancária:', error);
        throw error;
      }

      // Buscar dados da unidade separadamente se necessário
      if (data && data.unit_id) {
        const { data: unit } = await supabase
          .from('units')
          .select('id, name')
          .eq('id', data.unit_id)
          .single();
        
        if (unit) {
          data.units = unit;
        }
      }

      // ✅ Adicionar campo 'bank' para compatibilidade com o frontend
      if (data) {
        data.bank = data.bank_name;
      }

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro completo:', error);
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
        updates.bank_name = updateData.bank.trim(); // ✅ Corrigido: bank → bank_name
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
      if (updateData.nickname !== undefined) {
        updates.nickname = updateData.nickname?.trim() || null;
      }
      if (updateData.is_active !== undefined) {
        updates.is_active = updateData.is_active;
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao atualizar conta bancária:', error);
        throw error;
      }

      // Buscar dados da unidade separadamente se necessário
      if (data && data.unit_id) {
        const { data: unit } = await supabase
          .from('units')
          .select('id, name')
          .eq('id', data.unit_id)
          .single();
        
        if (unit) {
          data.units = unit;
        }
      }

      // ✅ Adicionar campo 'bank' para compatibilidade com o frontend
      if (data) {
        data.bank = data.bank_name;
      }

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro completo:', error);
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
        .select('id', { count: 'exact', head: false })
        .eq('bank_name', bank.trim()) // ✅ Corrigido: bank → bank_name
        .eq('agency', agency.trim())
        .eq('account_number', accountNumber.trim())
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error, count } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao verificar conta existente:', error);
        return false;
      }

      return count > 0 || (data && data.length > 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro inesperado ao verificar conta:', err);
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