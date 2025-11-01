import { supabase } from './supabase';

/**
 * Service para gerenciar operações de fluxo de caixa
 */
export class CashflowService {
  /**
   * Busca entradas do fluxo de caixa usando a VIEW vw_cashflow_entries
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade (obrigatório)
   * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} filters.endDate - Data final (YYYY-MM-DD)
   * @param {string} filters.accountId - ID da conta bancária (opcional)
   * @returns {Object} { data: CashflowEntry[], error: string|null }
   */
  async getCashflowEntries(filters = {}) {
    try {
      const { unitId, startDate, endDate, accountId } = filters;

      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      let query = supabase
        .from('vw_cashflow_entries')
        .select('*')
        .eq('unit_id', unitId)
        .order('transaction_date', { ascending: true });

      // Filtrar por período se especificado
      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }

      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      // Filtrar por conta bancária
      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Validar estrutura dos dados
      if (!Array.isArray(data)) {
        return { data: [], error: null };
      }

      // Calcular saldo acumulado progressivamente
      let accumulatedBalance = 0;
      const enrichedEntries = (data || []).map(entry => {
        const inflows = entry.inflows || 0;
        const outflows = entry.outflows || 0;
        accumulatedBalance += inflows - outflows;

        return {
          ...entry,
          accumulated_balance: accumulatedBalance, // ✅ Campo calculado progressivamente
          inflows_formatted: this.formatAmount(inflows),
          outflows_formatted: this.formatAmount(outflows),
          daily_balance_formatted: this.formatAmount(entry.daily_balance || 0),
          accumulated_balance_formatted: this.formatAmount(accumulatedBalance),
          date_formatted: this.formatDate(entry.transaction_date),
          net_flow: inflows - outflows,
          net_flow_formatted: this.formatAmount(inflows - outflows),
        };
      });

      return { data: enrichedEntries, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca resumo do fluxo de caixa para um período
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade
   * @param {string} filters.period - Período (month, quarter, year) ou custom
   * @param {string} filters.startDate - Data inicial (para period=custom)
   * @param {string} filters.endDate - Data final (para period=custom)
   * @param {string} filters.accountId - ID da conta bancária (opcional)
   * @returns {Object} { data: CashflowSummary, error: string|null }
   */
  async getCashflowSummary(filters) {
    try {
      const { unitId, period, startDate, endDate, accountId } = filters;

      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      // Calcular datas baseado no período
      let periodDates;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          return {
            data: null,
            error:
              'Start date e end date são obrigatórios para período customizado',
          };
        }
        periodDates = { startDate, endDate };
      } else {
        periodDates = this.calculatePeriodDates(period);
        if (!periodDates) {
          return { data: null, error: 'Período inválido' };
        }
      }

      // Buscar entradas do fluxo de caixa
      const { data: entries, error } = await this.getCashflowEntries({
        unitId,
        startDate: periodDates.startDate,
        endDate: periodDates.endDate,
        accountId,
      });

      if (error) {
        return { data: null, error };
      }

      // Calcular resumo
      const summary = this.calculateSummary(entries || [], periodDates);

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Calcula resumo do fluxo de caixa
   * @param {Array} entries - Entradas do fluxo de caixa
   * @param {Object} periodDates - Datas do período
   * @returns {Object} Resumo calculado
   * @private
   */
  calculateSummary(entries, periodDates) {
    const summary = {
      period: {
        start_date: periodDates.startDate,
        end_date: periodDates.endDate,
        days_count: this.calculateDaysBetween(
          periodDates.startDate,
          periodDates.endDate
        ),
      },
      totals: {
        total_inflows: 0,
        total_outflows: 0,
        net_flow: 0,
        opening_balance: 0,
        closing_balance: 0,
      },
      averages: {
        avg_daily_inflow: 0,
        avg_daily_outflow: 0,
        avg_daily_net: 0,
      },
      statistics: {
        positive_days: 0,
        negative_days: 0,
        zero_days: 0,
        best_day: null,
        worst_day: null,
      },
      trend: {
        direction: 'stable',
        slope: 0,
        growth_rate: 0,
      },
    };

    if (entries.length === 0) {
      return summary;
    }

    // Calcular totais
    entries.forEach((entry, index) => {
      summary.totals.total_inflows += entry.inflows || 0;
      summary.totals.total_outflows += entry.outflows || 0;

      // Saldo inicial é o saldo acumulado do primeiro dia menos o fluxo do dia
      if (index === 0) {
        summary.totals.opening_balance =
          (entry.accumulated_balance || 0) - (entry.daily_balance || 0);
      }

      // Saldo final é o saldo acumulado do último dia
      if (index === entries.length - 1) {
        summary.totals.closing_balance = entry.accumulated_balance || 0;
      }

      // Estatísticas por dia
      const netFlow = (entry.inflows || 0) - (entry.outflows || 0);
      if (netFlow > 0) {
        summary.statistics.positive_days++;
      } else if (netFlow < 0) {
        summary.statistics.negative_days++;
      } else {
        summary.statistics.zero_days++;
      }

      // Melhor e pior dia
      if (
        !summary.statistics.best_day ||
        netFlow > summary.statistics.best_day.net_flow
      ) {
        summary.statistics.best_day = {
          date: entry.transaction_date,
          net_flow: netFlow,
          formatted: this.formatAmount(netFlow),
        };
      }

      if (
        !summary.statistics.worst_day ||
        netFlow < summary.statistics.worst_day.net_flow
      ) {
        summary.statistics.worst_day = {
          date: entry.transaction_date,
          net_flow: netFlow,
          formatted: this.formatAmount(netFlow),
        };
      }
    });

    summary.totals.net_flow =
      summary.totals.total_inflows - summary.totals.total_outflows;

    // Calcular médias
    const daysWithData = entries.length;
    if (daysWithData > 0) {
      summary.averages.avg_daily_inflow =
        summary.totals.total_inflows / daysWithData;
      summary.averages.avg_daily_outflow =
        summary.totals.total_outflows / daysWithData;
      summary.averages.avg_daily_net = summary.totals.net_flow / daysWithData;
    }

    // Calcular tendência
    if (entries.length >= 2) {
      const firstBalance = summary.totals.opening_balance;
      const lastBalance = summary.totals.closing_balance;

      summary.trend.growth_rate =
        firstBalance !== 0
          ? ((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100
          : 0;

      if (summary.trend.growth_rate > 5) {
        summary.trend.direction = 'growing';
      } else if (summary.trend.growth_rate < -5) {
        summary.trend.direction = 'declining';
      } else {
        summary.trend.direction = 'stable';
      }

      // Calcular inclinação usando regressão linear simples nos saldos acumulados
      summary.trend.slope = this.calculateTrendSlope(entries);
    }

    // Formattar valores
    summary.totals.total_inflows_formatted = this.formatAmount(
      summary.totals.total_inflows
    );
    summary.totals.total_outflows_formatted = this.formatAmount(
      summary.totals.total_outflows
    );
    summary.totals.net_flow_formatted = this.formatAmount(
      summary.totals.net_flow
    );
    summary.totals.opening_balance_formatted = this.formatAmount(
      summary.totals.opening_balance
    );
    summary.totals.closing_balance_formatted = this.formatAmount(
      summary.totals.closing_balance
    );

    summary.averages.avg_daily_inflow_formatted = this.formatAmount(
      summary.averages.avg_daily_inflow
    );
    summary.averages.avg_daily_outflow_formatted = this.formatAmount(
      summary.averages.avg_daily_outflow
    );
    summary.averages.avg_daily_net_formatted = this.formatAmount(
      summary.averages.avg_daily_net
    );

    return summary;
  }

  /**
   * Calcula inclinação da tendência usando regressão linear
   * @param {Array} entries - Entradas do fluxo de caixa
   * @returns {number} Inclinação da tendência
   * @private
   */
  calculateTrendSlope(entries) {
    if (entries.length < 2) return 0;

    const n = entries.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    entries.forEach((entry, index) => {
      const x = index;
      const y = entry.accumulated_balance || 0;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Calcula datas baseado no período
   * @param {string} period - Período (month, quarter, year)
   * @returns {Object|null} { startDate, endDate }
   * @private
   */
  calculatePeriodDates(period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'month':
        return {
          startDate: new Date(currentYear, currentMonth, 1)
            .toISOString()
            .split('T')[0],
          endDate: new Date(currentYear, currentMonth + 1, 0)
            .toISOString()
            .split('T')[0],
        };

      case 'quarter': {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          startDate: new Date(currentYear, quarterStart, 1)
            .toISOString()
            .split('T')[0],
          endDate: new Date(currentYear, quarterStart + 3, 0)
            .toISOString()
            .split('T')[0],
        };
      }

      case 'year':
        return {
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-12-31`,
        };

      default:
        return null;
    }
  }

  /**
   * Calcula dias entre duas datas
   * @param {string} startDate - Data inicial
   * @param {string} endDate - Data final
   * @returns {number} Número de dias
   * @private
   */
  calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Busca dados para gráfico de fluxo de caixa
   * @param {Object} filters - Filtros de busca
   * @returns {Object} { data: ChartData[], error: string|null }
   */
  async getCashflowChartData(filters) {
    try {
      const { data: entries, error } = await this.getCashflowEntries(filters);

      if (error) {
        return { data: null, error };
      }

      // Preparar dados para gráfico (formato para Recharts)
      const chartData = (entries || []).map(entry => ({
        date: entry.transaction_date,
        dateFormatted: this.formatDate(entry.transaction_date),
        entradas: entry.inflows || 0,
        saidas: Math.abs(entry.outflows || 0), // Valores positivos para visualização
        saldoAcumulado: entry.accumulated_balance || 0,
        fluxoLiquido: (entry.inflows || 0) - (entry.outflows || 0),
      }));

      return { data: chartData, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca fluxo de caixa realizado (apenas itens recebidos/pagos)
   * @param {Object} period - Período para análise
   * @param {string} period.start_date - Data de início (YYYY-MM-DD)
   * @param {string} period.end_date - Data de fim (YYYY-MM-DD)
   * @param {string} period.unit_id - ID da unidade
   * @returns {Object} { success: boolean, data: ActualCashflowData|null, error: string|null }
   */
  async getActualCashflow(period) {
    try {
      if (!period.start_date || !period.end_date) {
        return {
          success: false,
          data: null,
          error: 'Data de início e fim são obrigatórias',
        };
      }

      if (new Date(period.end_date) <= new Date(period.start_date)) {
        return {
          success: false,
          data: null,
          error: 'Data de fim deve ser posterior à data de início',
        };
      }

      // Buscar apenas receitas recebidas (com actual_receipt_date)
      const { data: revenues, error: revenueError } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', period.unit_id)
        .not('actual_receipt_date', 'is', null)
        .gte('actual_receipt_date', period.start_date)
        .lte('actual_receipt_date', period.end_date);

      if (revenueError) {
        return {
          success: false,
          data: null,
          error: revenueError.message,
        };
      }

      // Buscar apenas despesas pagas (com actual_payment_date)
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', period.unit_id)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .not('actual_payment_date', 'is', null)
        .gte('actual_payment_date', period.start_date)
        .lte('actual_payment_date', period.end_date);

      if (expenseError) {
        return {
          success: false,
          data: null,
          error: expenseError.message,
        };
      }

      // Calcular totais
      const total_revenue =
        revenues?.reduce((sum, rev) => sum + (rev.value || 0), 0) || 0;
      const total_expense =
        expenses?.reduce((sum, exp) => sum + (exp.value || 0), 0) || 0;
      const net_cashflow = total_revenue - total_expense;

      return {
        success: true,
        data: {
          period: {
            start_date: period.start_date,
            end_date: period.end_date,
          },
          actual: {
            total_revenue,
            total_expense,
            net_cashflow,
            revenue_count: revenues?.length || 0,
            expense_count: expenses?.length || 0,
          },
          details: {
            revenues: revenues || [],
            expenses: expenses || [],
          },
        },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Compara fluxo previsto vs realizado com análise de variance
   * @param {Object} period - Período para análise
   * @param {string} period.start_date - Data de início (YYYY-MM-DD)
   * @param {string} period.end_date - Data de fim (YYYY-MM-DD)
   * @param {string} period.unit_id - ID da unidade
   * @returns {Object} { success: boolean, data: ComparisonData|null, error: string|null }
   */
  async getCashflowComparison(period) {
    try {
      if (!period.start_date || !period.end_date) {
        return {
          success: false,
          data: null,
          error: 'Data de início e fim são obrigatórias',
        };
      }

      // Buscar dados projetados (receitas e despesas pendentes)
      const { data: projectedRevenues, error: projRevError } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', period.unit_id)
        .gte('expected_receipt_date', period.start_date)
        .lte('expected_receipt_date', period.end_date);

      if (projRevError) {
        return {
          success: false,
          data: null,
          error: projRevError.message,
        };
      }

      const { data: projectedExpenses, error: projExpError } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', period.unit_id)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .gte('expected_payment_date', period.start_date)
        .lte('expected_payment_date', period.end_date);

      if (projExpError) {
        return {
          success: false,
          data: null,
          error: projExpError.message,
        };
      }

      // Buscar dados realizados
      const actualResult = await this.getActualCashflow(period);

      if (!actualResult.success) {
        return actualResult;
      }

      const actual = actualResult.data.actual;

      // Calcular projetados
      const projected_revenue =
        projectedRevenues?.reduce((sum, rev) => sum + (rev.value || 0), 0) || 0;
      const projected_expense =
        projectedExpenses?.reduce((sum, exp) => sum + (exp.value || 0), 0) || 0;
      const projected_net = projected_revenue - projected_expense;

      // Calcular variâncias
      const revenue_variance = actual.total_revenue - projected_revenue;
      const expense_variance = actual.total_expense - projected_expense;
      const net_variance = actual.net_cashflow - projected_net;

      // Determinar driver principal de variância
      const absRevenueVariance = Math.abs(revenue_variance);
      const absExpenseVariance = Math.abs(expense_variance);
      const main_variance_driver =
        absRevenueVariance > absExpenseVariance ? 'revenue' : 'expense';

      // Determinar performance
      let performance;
      if (net_variance > projected_net * 0.05) {
        // 5% acima
        performance = 'above_projection';
      } else if (net_variance < projected_net * -0.05) {
        // 5% abaixo
        performance = 'below_projection';
      } else {
        performance = 'on_target';
      }

      return {
        success: true,
        data: {
          period: {
            start_date: period.start_date,
            end_date: period.end_date,
          },
          projected: {
            total_revenue: projected_revenue,
            total_expense: projected_expense,
            net_cashflow: projected_net,
          },
          actual: {
            total_revenue: actual.total_revenue,
            total_expense: actual.total_expense,
            net_cashflow: actual.net_cashflow,
          },
          variance: {
            revenue_variance,
            expense_variance,
            net_variance,
            revenue_variance_percent: projected_revenue
              ? (revenue_variance / projected_revenue) * 100
              : 0,
            expense_variance_percent: projected_expense
              ? (expense_variance / projected_expense) * 100
              : 0,
            net_variance_percent: projected_net
              ? (net_variance / projected_net) * 100
              : 0,
          },
          analysis: {
            main_variance_driver,
            performance,
          },
        },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Busca projeção de fluxo de caixa baseada em tendências
   * @param {Object} period - Período para análise
   * @param {string} period.start_date - Data de início (YYYY-MM-DD)
   * @param {string} period.end_date - Data de fim (YYYY-MM-DD)
   * @param {string} period.unit_id - ID da unidade
   * @param {number} [daysToProject=30] - Dias para projetar
   * @returns {Object} { success: boolean, data: ProjectionData|null, error: string|null }
   */
  async getCashflowProjection(period, daysToProject = 30) {
    try {
      // Validações de entrada
      if (!period.start_date || !period.end_date) {
        return {
          success: false,
          data: null,
          error: 'Data de início e fim são obrigatórias',
        };
      }

      if (new Date(period.end_date) <= new Date(period.start_date)) {
        return {
          success: false,
          data: null,
          error: 'Data de fim deve ser posterior à data de início',
        };
      }

      // Validar período máximo (1 ano)
      const daysDifference = Math.ceil(
        (new Date(period.end_date) - new Date(period.start_date)) /
          (1000 * 60 * 60 * 24)
      );
      if (daysDifference > 365) {
        return {
          success: false,
          data: null,
          error: 'Período não pode ser superior a 1 ano',
        };
      }

      // Buscar dados históricos do período especificado
      const { data: revenues, error: revenueError } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', period.unit_id)
        .gte('expected_receipt_date', period.start_date)
        .lte('expected_receipt_date', period.end_date);

      if (revenueError) {
        return {
          success: false,
          data: null,
          error: revenueError.message,
        };
      }

      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', period.unit_id)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .gte('expected_payment_date', period.start_date)
        .lte('expected_payment_date', period.end_date);

      if (expenseError) {
        return {
          success: false,
          data: null,
          error: expenseError.message,
        };
      }

      // Calcular totais do período
      const total_revenue =
        revenues?.reduce((sum, rev) => sum + (rev.value || 0), 0) || 0;
      const total_expense =
        expenses?.reduce((sum, exp) => sum + (exp.value || 0), 0) || 0;
      const net_cashflow = total_revenue - total_expense;

      // Calcular médias diárias para projeção
      const avg_daily_revenue =
        daysDifference > 0 ? total_revenue / daysDifference : 0;
      const avg_daily_expense =
        daysDifference > 0 ? total_expense / daysDifference : 0;

      // Gerar projeção diária
      const daily_projection = [];
      let current_balance = net_cashflow; // Começar com o saldo do período

      for (let i = 0; i < daysToProject; i++) {
        const projectionDate = new Date(period.end_date);
        projectionDate.setDate(projectionDate.getDate() + i + 1);

        // Aplicar variação pequena nas médias (±10%)
        const variationFactor = 0.9 + Math.random() * 0.2;
        const projected_revenue = avg_daily_revenue * variationFactor;
        const projected_expense = avg_daily_expense * variationFactor;
        const daily_net = projected_revenue - projected_expense;

        current_balance += daily_net;

        daily_projection.push({
          date: projectionDate.toISOString().split('T')[0],
          projected_revenue,
          projected_expense,
          daily_net,
          accumulated_balance: current_balance,
        });
      }

      return {
        success: true,
        data: {
          period: {
            start_date: period.start_date,
            end_date: period.end_date,
          },
          projected: {
            total_revenue,
            total_expense,
            net_cashflow,
            avg_daily_revenue,
            avg_daily_expense,
          },
          daily_projection,
          projection_days: daysToProject,
        },
        error: null,
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Compara fluxo de caixa entre períodos
   * @param {Object} params - Parâmetros da comparação
   * @param {Object} params.currentPeriod - Período atual
   * @param {Object} params.comparisonPeriod - Período de comparação
   * @param {string} params.unitId - ID da unidade
   * @returns {Object} { data: ComparisonData, error: string|null }
   */
  async compareCashflowPeriods(params) {
    try {
      const { currentPeriod, comparisonPeriod, unitId } = params;

      // Buscar dados dos dois períodos
      const [currentResult, comparisonResult] = await Promise.all([
        this.getCashflowSummary({
          unitId,
          period: 'custom',
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
        }),
        this.getCashflowSummary({
          unitId,
          period: 'custom',
          startDate: comparisonPeriod.startDate,
          endDate: comparisonPeriod.endDate,
        }),
      ]);

      if (currentResult.error) {
        return { data: null, error: currentResult.error };
      }

      if (comparisonResult.error) {
        return { data: null, error: comparisonResult.error };
      }

      const current = currentResult.data;
      const comparison = comparisonResult.data;

      // Calcular comparações percentuais
      const comparison_data = {
        current_period: current,
        comparison_period: comparison,
        changes: {
          inflows_change: this.calculatePercentageChange(
            comparison.totals.total_inflows,
            current.totals.total_inflows
          ),
          outflows_change: this.calculatePercentageChange(
            comparison.totals.total_outflows,
            current.totals.total_outflows
          ),
          net_flow_change: this.calculatePercentageChange(
            comparison.totals.net_flow,
            current.totals.net_flow
          ),
          balance_change: this.calculatePercentageChange(
            comparison.totals.closing_balance,
            current.totals.closing_balance
          ),
        },
      };

      return { data: comparison_data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Calcula mudança percentual entre dois valores
   * @param {number} oldValue - Valor antigo
   * @param {number} newValue - Valor novo
   * @returns {number} Mudança percentual
   * @private
   */
  calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) {
      return newValue === 0 ? 0 : 100;
    }
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }

  /**
   * Formata valor monetário
   * @param {number} amount - Valor a ser formatado
   * @returns {string} Valor formatado
   * @private
   */
  formatAmount(amount) {
    if (typeof amount !== 'number') {
      return 'R$ 0,00';
    }

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  }

  /**
   * Formata data
   * @param {string|Date} date - Data a ser formatada
   * @returns {string} Data formatada
   * @private
   */
  formatDate(date) {
    if (!date) return '';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toLocaleDateString('pt-BR');
  }
}

export const cashflowService = new CashflowService();
export default CashflowService;
