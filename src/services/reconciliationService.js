import { supabase } from './supabase';

/**
 * Service para gerenciar operações de conciliação bancária
 */
export class ReconciliationService {
  
  /**
   * Busca conciliações com filtros
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.accountId - ID da conta bancária
   * @param {string} filters.startDate - Data inicial
   * @param {string} filters.endDate - Data final
   * @param {string} filters.status - Status da conciliação
   * @param {string} filters.referenceType - Tipo de referência (Revenue/Expense)
   * @returns {Object} { data: Reconciliation[], error: string|null }
   */
  static async getReconciliations(filters = {}) {
    try {
      const { accountId, startDate, endDate, status, referenceType } = filters;

      let query = supabase
        .from('reconciliations')
        .select(`
          *,
          bank_statements(
            id,
            transaction_date,
            description,
            amount,
            type,
            bank_account_id,
            bank_accounts(
              bank_name,
              account_number,
              nickname
            )
          )
        `)
        .order('reconciliation_date', { ascending: false });

      // Filtrar por conta bancária se especificado
      if (accountId) {
        query = query.eq('bank_statements.bank_account_id', accountId);
      }

      // Filtrar por período
      if (startDate) {
        query = query.gte('reconciliation_date', startDate);
      }
      if (endDate) {
        query = query.lte('reconciliation_date', endDate);
      }

      // Filtrar por status
      if (status) {
        query = query.eq('status', status);
      }

      // Filtrar por tipo de referência
      if (referenceType) {
        query = query.eq('reference_type', referenceType);
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
   * Busca uma conciliação específica por ID
   * @param {string} id - ID da conciliação
   * @returns {Object} { data: Reconciliation|null, error: string|null }
   */
  static async getReconciliationById(id) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('reconciliations')
        .select(`
          *,
          bank_statements(
            id,
            transaction_date,
            description,
            amount,
            type,
            bank_account_id,
            bank_accounts(
              bank_name,
              account_number,
              nickname
            )
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
   * Executa auto-match de conciliação para uma conta
   * @param {Object} params - Parâmetros do auto-match
   * @param {string} params.accountId - ID da conta bancária
   * @param {Object} params.options - Opções do algoritmo
   * @param {number} params.options.daysTolerance - Tolerância em dias (padrão: 2)
   * @param {number} params.options.amountTolerance - Tolerância percentual de valor (padrão: 5)
   * @param {number} params.options.minScore - Score mínimo para match (padrão: 70)
   * @returns {Object} { data: Match[], error: string|null }
   */
  static async autoMatch(params) {
    try {
      const { accountId, options = {} } = params;
      
      if (!accountId) {
        return { data: null, error: 'Account ID é obrigatório' };
      }

      const {
        daysTolerance = 2,
        amountTolerance = 5,
        minScore = 70
      } = options;

      // Buscar extratos não conciliados
      const { data: statements, error: statementsError } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('bank_account_id', accountId)
        .eq('reconciled', false)
        .order('transaction_date', { ascending: false });

      if (statementsError) {
        return { data: null, error: statementsError.message };
      }

      if (!statements || statements.length === 0) {
        return { data: [], error: null };
      }

      // Buscar receitas e despesas não conciliadas para a unidade da conta
      const { data: bankAccount, error: accountError } = await supabase
        .from('bank_accounts')
        .select('unit_id')
        .eq('id', accountId)
        .single();

      if (accountError || !bankAccount) {
        return { data: null, error: 'Conta bancária não encontrada' };
      }

      // Buscar receitas não conciliadas
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select(`
          id,
          description,
          value,
          date,
          actual_receipt_date,
          expected_receipt_date,
          party_id,
          status,
          parties(nome)
        `)
        .eq('unit_id', bankAccount.unit_id)
        .neq('status', 'Conciliado')
        .eq('is_active', true);

      if (revenuesError) {
        return { data: null, error: revenuesError.message };
      }

      // Buscar despesas não conciliadas
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          value,
          date,
          actual_payment_date,
          expected_payment_date,
          party_id,
          status,
          parties(nome)
        `)
        .eq('unit_id', bankAccount.unit_id)
        .neq('status', 'Conciliado')
        .eq('is_active', true);

      if (expensesError) {
        return { data: null, error: expensesError.message };
      }

      // Executar algoritmo de matching
      const matches = this.calculateMatches(
        statements,
        [...(revenues || []), ...(expenses || [])],
        { daysTolerance, amountTolerance, minScore }
      );

      return { data: matches, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Calcula matches entre extratos e lançamentos financeiros
   * @param {Array} statements - Extratos bancários
   * @param {Array} transactions - Receitas e despesas
   * @param {Object} options - Opções do algoritmo
   * @returns {Array} Array de matches encontrados
   * @private
   */
  static calculateMatches(statements, transactions, options) {
    const { daysTolerance, amountTolerance, minScore } = options;
    const matches = [];

    for (const statement of statements) {
      const statementDate = new Date(statement.transaction_date);
      const statementAmount = Math.abs(statement.amount);
      const isCredit = statement.type === 'Credit' || statement.amount > 0;

      for (const transaction of transactions) {
        // Definir tipo de transação e datas relevantes
        const isRevenue = 'actual_receipt_date' in transaction;
        const transactionDate = new Date(
          isRevenue 
            ? (transaction.actual_receipt_date || transaction.expected_receipt_date || transaction.date)
            : (transaction.actual_payment_date || transaction.expected_payment_date || transaction.date)
        );
        const transactionAmount = Math.abs(transaction.value);

        // Verificar compatibilidade de tipo (receita = crédito, despesa = débito)
        const typeMatch = (isRevenue && isCredit) || (!isRevenue && !isCredit);
        if (!typeMatch) continue;

        // Calcular score do match
        const score = this.calculateMatchScore(
          {
            date: statementDate,
            amount: statementAmount,
            description: statement.description
          },
          {
            date: transactionDate,
            amount: transactionAmount,
            description: transaction.description,
            partyName: transaction.parties?.nome
          },
          { daysTolerance, amountTolerance }
        );

        // Se o score atende o mínimo, adicionar como match
        if (score >= minScore) {
          matches.push({
            statement_id: statement.id,
            transaction_id: transaction.id,
            transaction_type: isRevenue ? 'Revenue' : 'Expense',
            score,
            confidence: this.getConfidenceLevel(score),
            statement: {
              id: statement.id,
              date: statement.transaction_date,
              description: statement.description,
              amount: statement.amount,
              type: statement.type
            },
            transaction: {
              id: transaction.id,
              type: isRevenue ? 'Revenue' : 'Expense',
              date: transactionDate.toISOString().split('T')[0],
              description: transaction.description,
              amount: transaction.value,
              party_name: transaction.parties?.nome
            },
            difference: Math.abs(statementAmount - transactionAmount),
            date_difference: Math.abs(statementDate - transactionDate) / (1000 * 60 * 60 * 24) // dias
          });
        }
      }
    }

    // Ordenar por score descendente
    matches.sort((a, b) => b.score - a.score);

    // Remover matches duplicados (mesmo extrato com múltiplas transações)
    // Manter apenas o de maior score para cada extrato
    const uniqueMatches = [];
    const usedStatements = new Set();

    for (const match of matches) {
      if (!usedStatements.has(match.statement_id)) {
        uniqueMatches.push(match);
        usedStatements.add(match.statement_id);
      }
    }

    return uniqueMatches;
  }

  /**
   * Calcula score de compatibilidade entre extrato e transação
   * @param {Object} statement - Dados do extrato
   * @param {Object} transaction - Dados da transação
   * @param {Object} options - Opções do cálculo
   * @returns {number} Score de 0 a 100
   * @private
   */
  static calculateMatchScore(statement, transaction, options) {
    const { daysTolerance, amountTolerance } = options;
    let score = 0;

    // Score por diferença de data (40 pontos máximo)
    const daysDiff = Math.abs(statement.date - transaction.date) / (1000 * 60 * 60 * 24);
    if (daysDiff <= daysTolerance) {
      score += Math.max(0, 40 - (daysDiff * 10)); // Penaliza 10 pontos por dia de diferença
    }

    // Score por diferença de valor (40 pontos máximo)
    const amountDiff = Math.abs(statement.amount - transaction.amount);
    const amountPercent = (amountDiff / Math.max(statement.amount, transaction.amount)) * 100;
    if (amountPercent <= amountTolerance) {
      score += Math.max(0, 40 - (amountPercent * 2)); // Penaliza 2 pontos por % de diferença
    }

    // Score por similaridade de descrição (20 pontos máximo)
    const descriptionScore = this.calculateDescriptionSimilarity(
      statement.description,
      transaction.description,
      transaction.partyName
    );
    score += descriptionScore * 20;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calcula similaridade entre descrições
   * @param {string} desc1 - Descrição do extrato
   * @param {string} desc2 - Descrição da transação
   * @param {string} partyName - Nome da party (opcional)
   * @returns {number} Similaridade de 0 a 1
   * @private
   */
  static calculateDescriptionSimilarity(desc1, desc2, partyName) {
    if (!desc1 || !desc2) return 0;

    const text1 = desc1.toLowerCase().trim();
    const text2 = desc2.toLowerCase().trim();
    const party = partyName?.toLowerCase().trim() || '';

    // Verificar se a party está mencionada na descrição do extrato
    let partyBonus = 0;
    if (party && text1.includes(party)) {
      partyBonus = 0.3;
    }

    // Calcular similaridade básica por palavras em comum
    const words1 = text1.split(/\s+/).filter(word => word.length > 2);
    const words2 = text2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return partyBonus;

    let commonWords = 0;
    for (const word of words1) {
      if (words2.some(w => w.includes(word) || word.includes(w))) {
        commonWords++;
      }
    }

    const similarity = commonWords / Math.max(words1.length, words2.length);
    return Math.min(1, similarity + partyBonus);
  }

  /**
   * Determina nível de confiança baseado no score
   * @param {number} score - Score do match
   * @returns {string} Nível de confiança
   * @private
   */
  static getConfidenceLevel(score) {
    if (score >= 95) return 'Exato';
    if (score >= 85) return 'Alto';
    if (score >= 70) return 'Médio';
    return 'Baixo';
  }

  /**
   * Confirma uma conciliação automática ou manual
   * @param {Object} params - Parâmetros da conciliação
   * @param {string} params.statementId - ID do extrato bancário
   * @param {string} params.referenceType - Tipo da referência (Revenue/Expense)
   * @param {string} params.referenceId - ID da receita ou despesa
   * @param {number} params.difference - Diferença entre valores (opcional)
   * @param {string} params.notes - Observações (opcional)
   * @returns {Object} { data: Reconciliation|null, error: string|null }
   */
  static async confirmReconciliation(params) {
    try {
      const { statementId, referenceType, referenceId, difference = 0, notes = '' } = params;

      if (!statementId || !referenceType || !referenceId) {
        return { data: null, error: 'Statement ID, Reference Type e Reference ID são obrigatórios' };
      }

      if (!['Revenue', 'Expense'].includes(referenceType)) {
        return { data: null, error: 'Reference Type deve ser Revenue ou Expense' };
      }

      // Verificar se o extrato existe e não está conciliado
      const { data: statement, error: statementError } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('id', statementId)
        .single();

      if (statementError || !statement) {
        return { data: null, error: 'Extrato bancário não encontrado' };
      }

      if (statement.reconciled) {
        return { data: null, error: 'Extrato já está conciliado' };
      }

      // Verificar se a referência existe
      const tableName = referenceType.toLowerCase() === 'revenue' ? 'revenues' : 'expenses';
      const { data: reference, error: referenceError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', referenceId)
        .single();

      if (referenceError || !reference) {
        return { data: null, error: `${referenceType} não encontrada` };
      }

      // Criar conciliação
      const reconciliationData = {
        bank_statement_id: statementId,
        reference_type: referenceType,
        reference_id: referenceId,
        reconciliation_date: new Date().toISOString(),
        status: Math.abs(difference) > 0.01 ? 'Divergent' : 'Reconciled',
        difference: difference,
        notes: notes.trim()
      };

      const { data: reconciliation, error: reconciliationError } = await supabase
        .from('reconciliations')
        .insert(reconciliationData)
        .select()
        .single();

      if (reconciliationError) {
        return { data: null, error: reconciliationError.message };
      }

      // O trigger automaticamente atualizará o banco de dados:
      // - bank_statements.reconciled = true
      // - revenues/expenses.status = 'Conciliado' (se difference <= 0.01)

      return { data: reconciliation, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Rejeita uma conciliação (remove vínculo)
   * @param {string} reconciliationId - ID da conciliação
   * @returns {Object} { data: boolean, error: string|null }
   */
  static async rejectReconciliation(reconciliationId) {
    try {
      if (!reconciliationId) {
        return { data: false, error: 'Reconciliation ID é obrigatório' };
      }

      const { error } = await supabase
        .from('reconciliations')
        .delete()
        .eq('id', reconciliationId);

      if (error) {
        return { data: false, error: error.message };
      }

      // O trigger automaticamente atualizará o status do extrato para não conciliado

      return { data: true, error: null };
    } catch (err) {
      return { data: false, error: err.message };
    }
  }

  /**
   * Vinculação manual entre extrato e lançamento
   * @param {Object} params - Parâmetros da vinculação manual
   * @param {string} params.statementId - ID do extrato
   * @param {string} params.referenceType - Tipo da referência (Revenue/Expense)
   * @param {string} params.referenceId - ID da referência
   * @param {number} params.adjustmentAmount - Valor de ajuste (opcional)
   * @param {string} params.notes - Observações
   * @returns {Object} { data: Reconciliation|null, error: string|null }
   */
  static async manualLink(params) {
    try {
      const { statementId, referenceType, referenceId, adjustmentAmount = 0, notes } = params;

      if (!statementId || !referenceType || !referenceId) {
        return { data: null, error: 'Todos os parâmetros são obrigatórios para vinculação manual' };
      }

      // Buscar dados do extrato e da referência para calcular diferença
      const { data: statement } = await supabase
        .from('bank_statements')
        .select('amount')
        .eq('id', statementId)
        .single();

      const tableName = referenceType.toLowerCase() === 'revenue' ? 'revenues' : 'expenses';
      const { data: reference } = await supabase
        .from(tableName)
        .select('value')
        .eq('id', referenceId)
        .single();

      if (!statement || !reference) {
        return { data: null, error: 'Extrato ou lançamento não encontrado' };
      }

      // Calcular diferença considerando o ajuste
      const difference = Math.abs(statement.amount) - Math.abs(reference.value) - adjustmentAmount;

      // Confirmar conciliação
      return await this.confirmReconciliation({
        statementId,
        referenceType,
        referenceId,
        difference,
        notes: notes || 'Vinculação manual'
      });
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca estatísticas de conciliação
   * @param {Object} filters - Filtros para as estatísticas
   * @param {string} filters.accountId - ID da conta bancária
   * @param {string} filters.startDate - Data inicial
   * @param {string} filters.endDate - Data final
   * @returns {Object} { data: Stats, error: string|null }
   */
  static async getReconciliationStats(filters = {}) {
    try {
      const { accountId, startDate, endDate } = filters;

      // Usar a view de resumo de conciliação se disponível
      let query = supabase.from('vw_reconciliation_summary').select('*');

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      if (startDate && endDate) {
        query = query.gte('period', startDate).lte('period', endDate);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Calcular estatísticas agregadas
      const stats = {
        total_statements: 0,
        total_reconciled: 0,
        total_pending: 0,
        reconciliation_percentage: 0,
        total_amount: 0,
        reconciled_amount: 0,
        pending_amount: 0,
        divergent_amount: 0,
        accounts_summary: data || []
      };

      if (data && data.length > 0) {
        stats.total_statements = data.reduce((sum, item) => sum + item.total_statements, 0);
        stats.total_reconciled = data.reduce((sum, item) => sum + item.total_reconciled, 0);
        stats.total_pending = stats.total_statements - stats.total_reconciled;
        stats.reconciliation_percentage = stats.total_statements > 0 
          ? Math.round((stats.total_reconciled / stats.total_statements) * 100)
          : 0;
        stats.total_amount = data.reduce((sum, item) => sum + item.total_amount, 0);
        stats.reconciled_amount = data.reduce((sum, item) => sum + item.reconciled_amount, 0);
        stats.pending_amount = stats.total_amount - stats.reconciled_amount;
        stats.divergent_amount = data.reduce((sum, item) => sum + item.divergent_amount, 0);
      }

      return { data: stats, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
}

export const reconciliationService = new ReconciliationService();
export default ReconciliationService;