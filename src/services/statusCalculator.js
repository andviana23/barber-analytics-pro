/**
 * statusCalculator.js
 * 
 * Calculadora automática de status baseada em datas de vencimento e pagamento.
 * Integração com expected_dates e actual_dates para receitas e despesas.
 * Status: pending, overdue, paid, partially_paid, cancelled.
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

/**
 * Classe para cálculo automático de status financeiros
 */
export class StatusCalculator {
  constructor() {
    // Configurações de status
    this.config = {
      // Status disponíveis
      statuses: {
        PENDING: 'pending',           // Pendente
        OVERDUE: 'overdue',          // Vencido
        PAID: 'paid',                // Pago
        PARTIALLY_PAID: 'partially_paid', // Pago parcialmente
        CANCELLED: 'cancelled',      // Cancelado
        SCHEDULED: 'scheduled'       // Agendado (futuro)
      },
      
      // Configurações de vencimento
      overdueThreshold: {
        days: 1,                     // Considera vencido após 1 dia
        gracePeriod: 0               // Período de carência em dias
      },
      
      // Configurações de tolerância para pagamento parcial
      partialPaymentTolerance: {
        percentage: 0.05,            // 5% de tolerância
        minimumAmount: 1.00         // Mínimo R$ 1,00 de diferença
      },
      
      // Configurações de agendamento
      scheduledThreshold: {
        days: 0                     // Considera agendado se data futura
      }
    };

    // Cache para performance
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Calcula status para uma transação individual
   * @param {Object} transaction - Dados da transação
   * @param {Object} options - Opções adicionais
   * @returns {Object} Status calculado com detalhes
   */
  calculateStatus(transaction, options = {}) {
    try {
      const referenceDate = options.referenceDate ? 
        new Date(options.referenceDate) : 
        new Date();

      // Validar dados da transação
      const validation = this.validateTransaction(transaction);
      if (!validation.isValid) {
        return {
          status: this.config.statuses.PENDING,
          reason: 'invalid_data',
          details: validation.errors,
          calculatedAt: referenceDate.toISOString()
        };
      }

      // Verificar se foi cancelado
      if (transaction.is_active === false || transaction.status === 'cancelled') {
        return {
          status: this.config.statuses.CANCELLED,
          reason: 'manually_cancelled',
          calculatedAt: referenceDate.toISOString()
        };
      }

      // Extrair datas relevantes
      const dates = this.extractTransactionDates(transaction);
      const amounts = this.extractTransactionAmounts(transaction);

      // Calcular status baseado na lógica de negócio
      const statusResult = this.determineStatus(dates, amounts, referenceDate, options);

      return {
        ...statusResult,
        transactionId: transaction.id,
        calculatedAt: referenceDate.toISOString(),
        dates: dates,
        amounts: amounts
      };

    } catch (error) {
      return {
        status: this.config.statuses.PENDING,
        reason: 'calculation_error',
        error: error.message,
        calculatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Calcula status para múltiplas transações em lote
   * @param {Array} transactions - Array de transações
   * @param {Object} options - Opções adicionais
   * @returns {Array} Array com status calculados
   */
  calculateBatchStatus(transactions, options = {}) {
    const results = [];
    const referenceDate = options.referenceDate ? 
      new Date(options.referenceDate) : 
      new Date();

    for (const transaction of transactions) {
      const cacheKey = this.generateCacheKey(transaction, referenceDate);
      
      // Verificar cache
      if (this.cache.has(cacheKey) && !options.forceRecalculate) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          results.push(cached.result);
          continue;
        }
      }

      // Calcular status
      const statusResult = this.calculateStatus(transaction, { 
        ...options, 
        referenceDate: referenceDate 
      });

      // Armazenar no cache
      this.cache.set(cacheKey, {
        result: statusResult,
        timestamp: Date.now()
      });

      results.push(statusResult);
    }

    return results;
  }

  /**
   * Valida dados da transação
   * @param {Object} transaction - Transação para validar
   * @returns {Object} Resultado da validação
   */
  validateTransaction(transaction) {
    const errors = [];
    
    if (!transaction) {
      errors.push('Transação não fornecida');
      return { isValid: false, errors };
    }

    if (!transaction.id) {
      errors.push('ID da transação obrigatório');
    }

    // Validar pelo menos uma data de referência
    const hasValidDate = !!(
      transaction.date ||
      transaction.expected_receipt_date ||
      transaction.expected_payment_date ||
      transaction.accrual_start_date
    );

    if (!hasValidDate) {
      errors.push('Nenhuma data de referência válida encontrada');
    }

    // Validar valor
    const hasValidAmount = !!(
      transaction.value ||
      transaction.amount ||
      transaction.gross_amount ||
      transaction.net_amount
    );

    if (!hasValidAmount) {
      errors.push('Nenhum valor válido encontrado');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Extrai datas relevantes da transação
   * @param {Object} transaction - Dados da transação
   * @returns {Object} Datas estruturadas
   */
  extractTransactionDates(transaction) {
    const dates = {
      // Datas principais
      transaction: transaction.date ? new Date(transaction.date) : null,
      
      // Datas de competência
      accrualStart: transaction.accrual_start_date ? new Date(transaction.accrual_start_date) : null,
      accrualEnd: transaction.accrual_end_date ? new Date(transaction.accrual_end_date) : null,
      
      // Datas esperadas
      expectedReceipt: transaction.expected_receipt_date ? new Date(transaction.expected_receipt_date) : null,
      expectedPayment: transaction.expected_payment_date ? new Date(transaction.expected_payment_date) : null,
      
      // Datas reais
      actualReceipt: transaction.actual_receipt_date ? new Date(transaction.actual_receipt_date) : null,
      actualPayment: transaction.actual_payment_date ? new Date(transaction.actual_payment_date) : null,
      
      // Data de vencimento (calculada)
      due: null,
      
      // Data de referência para cálculos
      reference: null
    };

    // Determinar data de vencimento baseada no tipo de transação
    if (transaction.type === 'revenue' || transaction.expected_receipt_date) {
      dates.due = dates.expectedReceipt || dates.transaction || dates.accrualStart;
    } else {
      dates.due = dates.expectedPayment || dates.transaction || dates.accrualStart;
    }

    // Data de referência para status
    dates.reference = dates.due || dates.transaction || dates.accrualStart;

    return dates;
  }

  /**
   * Extrai valores relevantes da transação
   * @param {Object} transaction - Dados da transação
   * @returns {Object} Valores estruturados
   */
  extractTransactionAmounts(transaction) {
    const amounts = {
      // Valor principal
      expected: transaction.value || transaction.amount || transaction.net_amount || transaction.gross_amount || 0,
      
      // Valores específicos
      gross: transaction.gross_amount || 0,
      net: transaction.net_amount || 0,
      fees: transaction.fees || 0,
      
      // Valores pagos/recebidos
      paid: 0,
      received: 0,
      
      // Diferenças
      remaining: 0,
      difference: 0
    };

    // Calcular valor pago/recebido baseado nas datas reais
    if (transaction.actual_receipt_date || transaction.actual_payment_date) {
      amounts.paid = amounts.expected;
      amounts.received = amounts.expected;
      amounts.remaining = 0;
    } else {
      amounts.remaining = amounts.expected;
    }

    amounts.difference = amounts.expected - amounts.paid;

    return amounts;
  }

  /**
   * Determina o status baseado nas datas e valores
   * @param {Object} dates - Datas extraídas
   * @param {Object} amounts - Valores extraídos
   * @param {Date} referenceDate - Data de referência
   * @param {Object} options - Opções adicionais
   * @returns {Object} Status determinado
   */
  determineStatus(dates, amounts, referenceDate, options = {}) {
    // 1. Verificar se foi pago/recebido
    if (dates.actualReceipt || dates.actualPayment) {
      // Verificar se foi pago completamente
      if (this.isAmountFullyPaid(amounts)) {
        return {
          status: this.config.statuses.PAID,
          reason: 'fully_paid',
          paidDate: dates.actualReceipt || dates.actualPayment,
          details: {
            paidAmount: amounts.paid,
            expectedAmount: amounts.expected,
            difference: amounts.difference
          }
        };
      } else {
        return {
          status: this.config.statuses.PARTIALLY_PAID,
          reason: 'partially_paid',
          paidDate: dates.actualReceipt || dates.actualPayment,
          details: {
            paidAmount: amounts.paid,
            expectedAmount: amounts.expected,
            remainingAmount: amounts.remaining
          }
        };
      }
    }

    // 2. Verificar se está agendado (futuro)
    if (dates.reference && dates.reference > referenceDate) {
      const daysUntilDue = Math.ceil((dates.reference - referenceDate) / (1000 * 60 * 60 * 24));
      
      return {
        status: this.config.statuses.SCHEDULED,
        reason: 'future_due_date',
        dueDate: dates.reference,
        details: {
          daysUntilDue: daysUntilDue,
          expectedAmount: amounts.expected
        }
      };
    }

    // 3. Verificar se está vencido
    if (dates.reference && this.isOverdue(dates.reference, referenceDate)) {
      const daysOverdue = Math.ceil((referenceDate - dates.reference) / (1000 * 60 * 60 * 24));
      
      return {
        status: this.config.statuses.OVERDUE,
        reason: 'past_due_date',
        dueDate: dates.reference,
        details: {
          daysOverdue: daysOverdue,
          expectedAmount: amounts.expected,
          gracePeriodExpired: daysOverdue > this.config.overdueThreshold.gracePeriod
        }
      };
    }

    // 4. Status padrão: pendente
    return {
      status: this.config.statuses.PENDING,
      reason: 'awaiting_payment',
      dueDate: dates.reference,
      details: {
        expectedAmount: amounts.expected,
        dueToday: dates.reference && this.isSameDay(dates.reference, referenceDate)
      }
    };
  }

  /**
   * Verifica se o valor foi pago completamente
   * @param {Object} amounts - Valores da transação
   * @returns {boolean} True se pago completamente
   */
  isAmountFullyPaid(amounts) {
    const tolerance = Math.max(
      amounts.expected * this.config.partialPaymentTolerance.percentage,
      this.config.partialPaymentTolerance.minimumAmount
    );

    return Math.abs(amounts.difference) <= tolerance;
  }

  /**
   * Verifica se a transação está vencida
   * @param {Date} dueDate - Data de vencimento
   * @param {Date} referenceDate - Data de referência
   * @returns {boolean} True se vencida
   */
  isOverdue(dueDate, referenceDate) {
    const diffTime = referenceDate - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > this.config.overdueThreshold.days;
  }

  /**
   * Verifica se duas datas são do mesmo dia
   * @param {Date} date1 - Primeira data
   * @param {Date} date2 - Segunda data
   * @returns {boolean} True se mesmo dia
   */
  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  /**
   * Atualiza status de uma transação no banco
   * @param {string} transactionId - ID da transação
   * @param {string} table - Tabela (revenues ou expenses)
   * @param {Object} statusData - Dados do status calculado
   * @param {Object} supabaseClient - Cliente Supabase
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateTransactionStatus(transactionId, table, statusData, supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from(table)
        .update({
          status: statusData.status,
          status_calculated_at: statusData.calculatedAt,
          status_reason: statusData.reason
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Atualiza status de múltiplas transações em lote
   * @param {Array} statusUpdates - Array de atualizações [{id, table, status}]
   * @param {Object} supabaseClient - Cliente Supabase
   * @returns {Promise<Object>} Resultado das atualizações
   */
  async updateBatchStatus(statusUpdates, supabaseClient) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Agrupar por tabela para eficiência
    const updatesByTable = {};
    
    statusUpdates.forEach(update => {
      if (!updatesByTable[update.table]) {
        updatesByTable[update.table] = [];
      }
      updatesByTable[update.table].push(update);
    });

    // Executar updates por tabela
    for (const [table, updates] of Object.entries(updatesByTable)) {
      try {
        // Preparar dados para update em lote
        const updatePromises = updates.map(update => 
          this.updateTransactionStatus(
            update.id, 
            table, 
            update.statusData, 
            supabaseClient
          )
        );

        const batchResults = await Promise.allSettled(updatePromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push({
              id: updates[index].id,
              table: table,
              error: result.reason?.message || result.value?.error || 'Unknown error'
            });
          }
        });

      } catch (error) {
        results.failed += updates.length;
        results.errors.push({
          table: table,
          error: error.message,
          count: updates.length
        });
      }
    }

    return results;
  }

  /**
   * Obtém estatísticas de status
   * @param {Array} statusResults - Array de resultados de status
   * @returns {Object} Estatísticas consolidadas
   */
  getStatusStatistics(statusResults) {
    const stats = {
      total: statusResults.length,
      byStatus: {},
      amounts: {
        total: 0,
        pending: 0,
        overdue: 0,
        paid: 0,
        scheduled: 0
      },
      overdue: {
        count: 0,
        totalAmount: 0,
        averageDaysOverdue: 0,
        maxDaysOverdue: 0
      },
      dueToday: {
        count: 0,
        totalAmount: 0
      }
    };

    // Inicializar contadores por status
    Object.values(this.config.statuses).forEach(status => {
      stats.byStatus[status] = 0;
    });

    let totalOverdueDays = 0;
    let maxOverdue = 0;

    // Processar resultados
    statusResults.forEach(result => {
      const status = result.status;
      const amount = result.amounts?.expected || 0;

      // Contar por status
      stats.byStatus[status]++;
      
      // Somar valores por status
      stats.amounts.total += amount;
      
      switch (status) {
        case this.config.statuses.PENDING:
          stats.amounts.pending += amount;
          if (result.details?.dueToday) {
            stats.dueToday.count++;
            stats.dueToday.totalAmount += amount;
          }
          break;
          
        case this.config.statuses.OVERDUE:
          stats.amounts.overdue += amount;
          stats.overdue.count++;
          stats.overdue.totalAmount += amount;
          
          const daysOverdue = result.details?.daysOverdue || 0;
          totalOverdueDays += daysOverdue;
          maxOverdue = Math.max(maxOverdue, daysOverdue);
          break;
          
        case this.config.statuses.PAID:
          stats.amounts.paid += amount;
          break;
          
        case this.config.statuses.SCHEDULED:
          stats.amounts.scheduled += amount;
          break;
      }
    });

    // Calcular médias
    if (stats.overdue.count > 0) {
      stats.overdue.averageDaysOverdue = Math.round(totalOverdueDays / stats.overdue.count);
      stats.overdue.maxDaysOverdue = maxOverdue;
    }

    return stats;
  }

  /**
   * Gera chave de cache para uma transação
   * @param {Object} transaction - Transação
   * @param {Date} referenceDate - Data de referência
   * @returns {string} Chave de cache
   */
  generateCacheKey(transaction, referenceDate) {
    const key = `${transaction.id}_${referenceDate.toDateString()}_${transaction.updated_at || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Atualiza configurações do calculador
   * @param {Object} newConfig - Novas configurações
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
      statuses: {
        ...this.config.statuses,
        ...(newConfig.statuses || {})
      },
      overdueThreshold: {
        ...this.config.overdueThreshold,
        ...(newConfig.overdueThreshold || {})
      },
      partialPaymentTolerance: {
        ...this.config.partialPaymentTolerance,
        ...(newConfig.partialPaymentTolerance || {})
      }
    };

    // Limpar cache após mudança de configuração
    this.cache.clear();
  }

  /**
   * Obtém configuração atual
   * @returns {Object} Configuração atual
   */
  getConfig() {
    return { ...this.config };
  }
}

// Exportar instância singleton
export const statusCalculator = new StatusCalculator();

// Exportar classe para instanciação customizada
export default StatusCalculator;