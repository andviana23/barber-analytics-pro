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
   * 🛡️ CORREÇÃO BUG-005: Algoritmo de matching único que previne múltiplas correspondências
   * Calcula matches entre extratos e lançamentos financeiros usando algoritmo otimizado
   * @param {Array} statements - Extratos bancários
   * @param {Array} transactions - Receitas e despesas
   * @param {Object} options - Opções do algoritmo
   * @returns {Array} Array de matches únicos encontrados
   * @private
   */
  static calculateMatches(statements, transactions, options) {
    const { daysTolerance, amountTolerance, minScore } = options;
    
    // ✅ Usar Sets para rastrear itens já correspondidos
    const usedStatements = new Set();
    const usedTransactions = new Set();
    const finalMatches = [];

    for (const statement of statements) {
      if (usedStatements.has(statement.id)) continue;

      const statementDate = new Date(statement.transaction_date);
      const statementAmount = Math.abs(statement.amount);
      const isCredit = statement.type === 'Credit' || statement.amount > 0;

      // ✅ Encontrar TODOS os candidatos para este statement
      const candidates = [];

      for (const transaction of transactions) {
        if (usedTransactions.has(transaction.id)) continue;

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

        // ✅ Se o score atende o mínimo, adicionar como candidato
        if (score >= minScore) {
          candidates.push({
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
            date_difference: Math.abs(statementDate - transactionDate) / (1000 * 60 * 60 * 24), // dias
            // ✅ Adicionar confiança ponderada para desempate
            weightedScore: score + (score > 80 ? 10 : 0) // Bonus para matches de alta confiança
          });
        }
      }

      // ✅ Se há candidatos, escolher o MELHOR e marcar ambos como usados
      if (candidates.length > 0) {
        // Ordenar por score ponderado (melhor primeiro)
        candidates.sort((a, b) => b.weightedScore - a.weightedScore);
        
        const bestMatch = candidates[0];
        
        // ✅ Marcar ambos como usados para prevenir duplicatas
        usedStatements.add(bestMatch.statement_id);
        usedTransactions.add(bestMatch.transaction_id);
        
        // Remover propriedade auxiliar antes de adicionar
        delete bestMatch.weightedScore;
        
        finalMatches.push(bestMatch);
      }
    }

    // ✅ Retornar matches únicos ordenados por confiança
    return finalMatches.sort((a, b) => b.score - a.score);
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
  static async confirmReconciliation(reconciliationId, statementId, referenceType, referenceId, difference = 0, notes = '') {
    try {
      // Aceitar tanto chamada com objeto quanto parâmetros individuais (compatibilidade)
      if (typeof reconciliationId === 'object' && reconciliationId !== null) {
        const params = reconciliationId;
        reconciliationId = params.reconciliationId;
        statementId = params.statementId;
        referenceType = params.referenceType;
        referenceId = params.referenceId;
        difference = params.difference || 0;
        notes = params.notes || '';
      }

      // Validação: ou reconciliationId ou os outros parâmetros
      if (!reconciliationId && (!statementId || !referenceType || !referenceId)) {
        return { success: false, data: null, error: 'Reconciliation ID ou (Statement ID, Reference Type e Reference ID) são obrigatórios' };
      }

      // Se reconciliationId foi fornecido, buscar a reconciliação existente
      if (reconciliationId) {
        const { data: existing, error: existingError } = await supabase
          .from('reconciliations')
          .select('*')
          .eq('id', reconciliationId)
          .single();

        if (existingError || !existing) {
          return { success: false, data: null, error: 'Reconciliação não encontrada' };
        }

        if (existing.status === 'confirmed') {
          return { success: false, data: null, error: 'Reconciliação já foi confirmada' };
        }

        // Atualizar status para confirmed
        const { data: updated, error: updateError } = await supabase
          .from('reconciliations')
          .update({ 
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            notes: notes || existing.notes
          })
          .eq('id', reconciliationId)
          .select()
          .single();

        if (updateError) {
          return { success: false, data: null, error: updateError.message };
        }

        // Atualizar status do bank_statement para "reconciled"
        await supabase
          .from('bank_statements')
          .update({ status: 'reconciled' })
          .eq('id', existing.statement_id);

        return { success: true, data: updated, error: null };
      }

      // Fluxo tradicional: criar nova reconciliação
      if (!['Revenue', 'Expense'].includes(referenceType)) {
        return { success: false, data: null, error: 'Reference Type deve ser Revenue ou Expense' };
      }

      // Verificar se o extrato existe e não está conciliado
      const { data: statement, error: statementError } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('id', statementId)
        .single();

      if (statementError || !statement) {
        return { success: false, data: null, error: 'Extrato bancário não encontrado' };
      }

      if (statement.reconciled) {
        return { success: false, data: null, error: 'Extrato já está conciliado' };
      }

      // Verificar se a referência existe
      const tableName = referenceType.toLowerCase() === 'revenue' ? 'revenues' : 'expenses';
      const { data: reference, error: referenceError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', referenceId)
        .single();

      if (referenceError || !reference) {
        return { success: false, data: null, error: `${referenceType} não encontrada` };
      }

      // Criar conciliação
      const reconciliationData = {
        bank_statement_id: statementId,
        reference_type: referenceType,
        reference_id: referenceId,
        reconciliation_date: new Date().toISOString(),
        status: Math.abs(difference) > 0.01 ? 'Divergent' : 'confirmed',
        difference: difference,
        notes: notes.trim()
      };

      const { data: reconciliation, error: reconciliationError } = await supabase
        .from('reconciliations')
        .insert(reconciliationData)
        .select()
        .single();

      if (reconciliationError) {
        return { success: false, data: null, error: reconciliationError.message };
      }

      // Atualizar status do bank_statement para "reconciled"
      await supabase
        .from('bank_statements')
        .update({ status: 'reconciled' })
        .eq('id', statementId);

      return { success: true, data: reconciliation, error: null };
    } catch (err) {
      return { success: false, data: null, error: err.message };
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

  /**
   * Executa reconciliação automática entre receitas e extratos bancários
   * @param {Object} options - Opções de reconciliação
   * @param {string} options.account_id - ID da conta bancária
   * @param {number} options.tolerance - Tolerância de valor (default: 0.01)
   * @param {number} options.dateTolerance - Tolerância de data em dias (default: 2)
   * @param {number} options.limit - Limite de registros (default: 100)
   * @returns {Object} { data: Reconciliation[], error: string|null }
   */
  static async autoReconcile(options = {}) {
    try {
      const {
        account_id,
        tolerance = 0.01,
        date_tolerance = 2,
        limit = 100
      } = options;

      // Validações
      if (!account_id) {
        return { success: false, data: null, error: 'account_id é obrigatório' };
      }

      if (tolerance < 0) {
        return { success: false, data: null, error: 'Tolerância deve ser maior que zero' };
      }

      if (tolerance > 100) {
        return { success: false, data: null, error: 'Tolerância não pode ser superior a R$ 100' };
      }

      // Buscar extratos (todos para contar reconciliados + não reconciliados para matching)
      const { data: statements, error: statementsError } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('account_id', account_id)
        .limit(limit);

      if (statementsError) {
        return { success: false, data: null, error: statementsError.message };
      }

      if (!statements || statements.length === 0) {
        return { 
          success: true, 
          data: { 
            matches: [], 
            summary: { 
              total_statements: 0, 
              total_revenues: 0, 
              matches_found: 0,
              already_reconciled: 0 
            } 
          }, 
          error: null 
        };
      }

      // Buscar receitas não reconciliadas para a mesma conta
      const { data: revenues, error: revenuesError } = await supabase
        .from('receitas')
        .select('*')
        .eq('account_id', account_id)
        .in('status', ['Pending', 'Scheduled'])
        .limit(limit);

      if (revenuesError) {
        return { success: false, data: null, error: revenuesError.message };
      }

      if (!revenues || revenues.length === 0) {
        return { 
          success: true, 
          data: { 
            matches: [], 
            summary: { 
              total_statements: statements.length, 
              total_revenues: 0, 
              matches_found: 0,
              already_reconciled: 0 
            } 
          }, 
          error: null 
        };
      }

      const matches = [];
      let alreadyReconciledCount = 0;

      // Contar statements já reconciliados antes do matching
      for (const statement of statements) {
        if (statement.status === 'reconciled') {
          alreadyReconciledCount++;
        }
      }

      // Algoritmo de matching
      for (const statement of statements) {
        // Skip se statement já foi reconciliado
        if (statement.status === 'reconciled') {
          continue;
        }

        for (const revenue of revenues) {
          // Skip se já foram reconciliados
          if (statement.status !== 'pending' || 
              !['Pending', 'Scheduled'].includes(revenue.status)) {
            continue;
          }

          // Calcular diferenças
          const valueDiff = Math.abs(statement.amount - revenue.value);
          const statementDate = new Date(statement.transaction_date);
          // Usar expected_receipt_date se disponível, senão usar date
          const revenueCompareDate = revenue.expected_receipt_date || revenue.date;
          const revenueDate = new Date(revenueCompareDate);
          const dateDiff = Math.abs(statementDate - revenueDate) / (1000 * 60 * 60 * 24);

          // Verificar tolerâncias
          const withinValueTolerance = valueDiff <= tolerance;
          const withinDateTolerance = dateDiff <= date_tolerance;

          if (withinValueTolerance && withinDateTolerance) {
            // Calcular confidence score (0-100)
            let confidence_score = 100;
            
            if (tolerance > 0 && valueDiff > 0) {
              const valuePenalty = (valueDiff / tolerance) * 15; // Max 15% penalty  
              confidence_score -= Math.min(15, valuePenalty);
            }
            
            if (date_tolerance > 0 && dateDiff > 0) {
              const datePenalty = (dateDiff / date_tolerance) * 30; // Max 30% penalty
              confidence_score -= Math.min(30, datePenalty);
            }
            
            confidence_score = Math.max(50, Math.round(confidence_score)); // Min 50%

            matches.push({
              id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              statement_id: statement.id,
              revenue_id: revenue.id,
              amount_difference: valueDiff,
              date_difference: Math.round(dateDiff),
              confidence_score,
              status: 'pending',
              created_at: new Date().toISOString()
            });

            // Marcar como processados para evitar duplicação nesta execução
            statement.reconciliation_status = 'processing';
            revenue.reconciliation_status = 'processing';
            break; // Uma receita por extrato
          }
        }
      }

      // Ordenar por confidence_score (maior primeiro)
      matches.sort((a, b) => b.confidence_score - a.confidence_score);

      return { 
        success: true, 
        data: { 
          matches, 
          summary: { 
            total_statements: statements.length, 
            total_revenues: revenues.length, 
            matches_found: matches.length,
            already_reconciled: alreadyReconciledCount 
          } 
        }, 
        error: null 
      };

    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
}

export const reconciliationService = new ReconciliationService();
export default ReconciliationService;