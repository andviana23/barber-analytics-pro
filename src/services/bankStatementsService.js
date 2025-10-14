import { supabase } from './supabase';

/**
 * Service para gerenciar operações de extratos bancários
 */
export class BankStatementsService {
  
  /**
   * Lista extratos bancários com filtros
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.accountId - ID da conta bancária (obrigatório)
   * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} filters.endDate - Data final (YYYY-MM-DD)
   * @param {boolean} filters.reconciled - Filtro por status de conciliação
   * @param {string} filters.type - Tipo da transação ('Credit' ou 'Debit')
   * @returns {Object} { data: BankStatement[], error: string|null }
   */
  static async getStatements(filters = {}) {
    try {
      const { accountId, startDate, endDate, reconciled, type } = filters;
      
      if (!accountId) {
        return { data: null, error: 'Account ID é obrigatório' };
      }

      let query = supabase
        .from('bank_statements')
        .select(`
          *,
          bank_accounts(
            id,
            bank_name,
            account_number,
            nickname
          )
        `)
        .eq('bank_account_id', accountId)
        .order('transaction_date', { ascending: false });

      // Filtrar por período se especificado
      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      // Filtrar por status de conciliação
      if (typeof reconciled === 'boolean') {
        query = query.eq('reconciled', reconciled);
      }

      // Filtrar por tipo
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca extratos não conciliados
   * @param {string} accountId - ID da conta bancária
   * @param {number} limit - Limite de resultados (padrão: 100)
   * @returns {Object} { data: BankStatement[], error: string|null }
   */
  static async getUnreconciledStatements(accountId, limit = 100) {
    try {
      if (!accountId) {
        return { data: null, error: 'Account ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('bank_statements')
        .select(`
          *,
          bank_accounts(
            id,
            bank_name,
            account_number,
            nickname
          )
        `)
        .eq('bank_account_id', accountId)
        .eq('reconciled', false)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca um extrato específico por ID
   * @param {string} id - ID do extrato
   * @returns {Object} { data: BankStatement|null, error: string|null }
   */
  static async getStatementById(id) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('bank_statements')
        .select(`
          *,
          bank_accounts(
            id,
            bank_name,
            account_number,
            nickname
          ),
          reconciliations(
            id,
            reference_type,
            reference_id,
            reconciliation_date,
            status,
            difference,
            notes
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Importa extratos bancários de arquivo ou dados processados
   * @param {Object} params - Parâmetros de importação
   * @param {string} params.accountId - ID da conta bancária
   * @param {Array} params.statements - Array de objetos com dados dos extratos
   * @param {Object} params.options - Opções de importação
   * @returns {Object} { data: ImportResult, error: string|null }
   */
  static async importStatements(params) {
    try {
      const { accountId, statements } = params;

      if (!accountId) {
        return { data: null, error: 'Account ID é obrigatório' };
      }

      if (!Array.isArray(statements) || statements.length === 0) {
        return { data: null, error: 'Lista de extratos é obrigatória e não pode estar vazia' };
      }

      // Validar estrutura dos extratos
      const validation = this.validateStatementsStructure(statements);
      if (!validation.isValid) {
        return { data: null, error: validation.error };
      }

      // Preparar dados para inserção com hash único para detecção de duplicatas
      const processedStatements = statements.map(statement => {
        // Gerar hash único para detecção de duplicatas
        const hashString = `${accountId}-${statement.transaction_date}-${statement.amount}-${statement.description}`;
        const hash_unique = this.generateHash(hashString);

        return {
          bank_account_id: accountId,
          transaction_date: statement.transaction_date,
          description: statement.description?.trim() || '',
          amount: parseFloat(statement.amount),
          type: statement.type || (statement.amount >= 0 ? 'Credit' : 'Debit'),
          balance_after: statement.balance_after ? parseFloat(statement.balance_after) : null,
          reconciled: false,
          hash_unique
        };
      });

      // Inserir extratos em batch
      const { data, error } = await supabase
        .from('bank_statements')
        .insert(processedStatements)
        .select();

      if (error) {
        // Se o erro for de violação de unicidade (duplicata), tentar inserir um por um
        if (error.code === '23505') { // Unique violation
          return await this.insertStatementsOneByOne(processedStatements);
        }
        return { data: null, error: error.message };
      }

      return { 
        data: {
          imported: data.length,
          duplicates: 0,
          total: statements.length,
          statements: data
        }, 
        error: null 
      };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Insere extratos um por um para lidar com duplicatas
   * @param {Array} statements - Array de extratos processados
   * @returns {Object} Resultado da importação
   * @private
   */
  static async insertStatementsOneByOne(statements) {
    let imported = 0;
    let duplicates = 0;
    const importedStatements = [];

    for (const statement of statements) {
      try {
        const { data, error } = await supabase
          .from('bank_statements')
          .insert(statement)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') { // Unique violation - duplicata
            duplicates++;
          } else {
            throw error;
          }
        } else {
          imported++;
          importedStatements.push(data);
        }
      } catch {
        // Log do erro, mas continua processando os demais
        continue;
      }
    }

    return {
      data: {
        imported,
        duplicates,
        total: statements.length,
        statements: importedStatements
      },
      error: null
    };
  }

  /**
   * Valida estrutura dos extratos antes da importação
   * @param {Array} statements - Array de extratos para validar
   * @returns {Object} { isValid: boolean, error: string|null }
   * @private
   */
  static validateStatementsStructure(statements) {
    const requiredFields = ['transaction_date', 'description', 'amount'];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      for (const field of requiredFields) {
        if (!(field in statement) || statement[field] === null || statement[field] === undefined) {
          return { 
            isValid: false, 
            error: `Extrato ${i + 1}: Campo obrigatório '${field}' está ausente ou vazio` 
          };
        }
      }

      // Validar data
      const date = new Date(statement.transaction_date);
      if (isNaN(date.getTime())) {
        return { 
          isValid: false, 
          error: `Extrato ${i + 1}: Data da transação inválida: ${statement.transaction_date}` 
        };
      }

      // Validar valor
      const amount = parseFloat(statement.amount);
      if (isNaN(amount)) {
        return { 
          isValid: false, 
          error: `Extrato ${i + 1}: Valor inválido: ${statement.amount}` 
        };
      }

      // Validar tipo se fornecido
      if (statement.type && !['Credit', 'Debit'].includes(statement.type)) {
        return { 
          isValid: false, 
          error: `Extrato ${i + 1}: Tipo deve ser 'Credit' ou 'Debit': ${statement.type}` 
        };
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Atualiza status de conciliação de um extrato
   * @param {string} id - ID do extrato
   * @param {boolean} reconciled - Status de conciliação
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async updateReconciliationStatus(id, reconciled) {
    try {
      if (!id) {
        return { data: false, error: 'ID é obrigatório' };
      }

      const { error } = await supabase
        .from('bank_statements')
        .update({ reconciled })
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Remove um extrato bancário
   * @param {string} id - ID do extrato
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async deleteStatement(id) {
    try {
      if (!id) {
        return { data: false, error: 'ID é obrigatório' };
      }

      // Verificar se o extrato está conciliado
      const { data: statement } = await this.getStatementById(id);
      if (statement?.reconciled) {
        return { data: false, error: 'Não é possível excluir extrato que já foi conciliado' };
      }

      const { error } = await supabase
        .from('bank_statements')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Busca extratos por período com resumo financeiro
   * @param {Object} params - Parâmetros da consulta
   * @param {string} params.accountId - ID da conta bancária
   * @param {string} params.startDate - Data inicial
   * @param {string} params.endDate - Data final
   * @returns {Object} { data: { statements, summary }, error: string|null }
   */
  static async getStatementsWithSummary(params) {
    try {
      const { accountId, startDate, endDate } = params;

      // Buscar extratos
      const statementsResult = await this.getStatements({
        accountId,
        startDate,
        endDate
      });

      if (statementsResult.error) {
        return statementsResult;
      }

      const statements = statementsResult.data || [];

      // Calcular resumo
      const summary = {
        total_transactions: statements.length,
        total_credits: 0,
        total_debits: 0,
        net_amount: 0,
        reconciled_count: 0,
        unreconciled_count: 0,
        reconciliation_percentage: 0
      };

      statements.forEach(statement => {
        if (statement.type === 'Credit' || statement.amount > 0) {
          summary.total_credits += Math.abs(statement.amount);
        } else {
          summary.total_debits += Math.abs(statement.amount);
        }

        if (statement.reconciled) {
          summary.reconciled_count++;
        } else {
          summary.unreconciled_count++;
        }
      });

      summary.net_amount = summary.total_credits - summary.total_debits;
      summary.reconciliation_percentage = statements.length > 0 
        ? Math.round((summary.reconciled_count / statements.length) * 100)
        : 0;

      return {
        data: {
          statements,
          summary
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Gera hash MD5 simples para detecção de duplicatas
   * @param {string} str - String para gerar hash
   * @returns {string} Hash gerado
   * @private
   */
  static generateHash(str) {
    // Implementação simples de hash para detecção de duplicatas
    // Em produção, considerar usar uma biblioteca como crypto-js
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32bit
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Formata valor monetário para exibição
   * @param {number} amount - Valor a ser formatado
   * @returns {string} Valor formatado em reais
   */
  static formatAmount(amount) {
    if (typeof amount !== 'number') {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  /**
   * Formata data para exibição
   * @param {string|Date} date - Data a ser formatada
   * @returns {string} Data formatada
   */
  static formatDate(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('pt-BR');
  }

  /**
   * Valida se uma conta bancária existe e está ativa
   * @param {string} accountId - ID da conta bancária
   * @returns {Object} { isValid: boolean, error: string|null }
   */
  static async validateBankAccount(accountId) {
    try {
      if (!accountId) {
        return { isValid: false, error: 'Account ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, is_active')
        .eq('id', accountId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { isValid: false, error: 'Conta bancária não encontrada ou inativa' };
      }

      return { isValid: true, error: null };
    } catch (err) {
      return { isValid: false, error: err.message };
    }
  }
}

// Alias compatível com hooks/componentes que utilizam export nomeado
export const bankStatementsService = BankStatementsService;

export default BankStatementsService;
