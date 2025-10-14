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
  static async getCashflowEntries(filters = {}) {
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

      // Enriquecer dados com informações formatadas
      const enrichedEntries = (data || []).map(entry => ({
        ...entry,
        inflows_formatted: this.formatAmount(entry.inflows),
        outflows_formatted: this.formatAmount(entry.outflows),
        daily_balance_formatted: this.formatAmount(entry.daily_balance),
        accumulated_balance_formatted: this.formatAmount(entry.accumulated_balance),
        date_formatted: this.formatDate(entry.transaction_date),
        net_flow: entry.inflows - entry.outflows,
        net_flow_formatted: this.formatAmount(entry.inflows - entry.outflows)
      }));

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
  static async getCashflowSummary(filters) {
    try {
      const { unitId, period, startDate, endDate, accountId } = filters;
      
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      // Calcular datas baseado no período
      let periodDates;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          return { data: null, error: 'Start date e end date são obrigatórios para período customizado' };
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
        accountId
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
  static calculateSummary(entries, periodDates) {
    const summary = {
      period: {
        start_date: periodDates.startDate,
        end_date: periodDates.endDate,
        days_count: this.calculateDaysBetween(periodDates.startDate, periodDates.endDate)
      },
      totals: {
        total_inflows: 0,
        total_outflows: 0,
        net_flow: 0,
        opening_balance: 0,
        closing_balance: 0
      },
      averages: {
        avg_daily_inflow: 0,
        avg_daily_outflow: 0,
        avg_daily_net: 0
      },
      statistics: {
        positive_days: 0,
        negative_days: 0,
        zero_days: 0,
        best_day: null,
        worst_day: null
      },
      trend: {
        direction: 'stable',
        slope: 0,
        growth_rate: 0
      }
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
        summary.totals.opening_balance = (entry.accumulated_balance || 0) - (entry.daily_balance || 0);
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
      if (!summary.statistics.best_day || netFlow > summary.statistics.best_day.net_flow) {
        summary.statistics.best_day = {
          date: entry.transaction_date,
          net_flow: netFlow,
          formatted: this.formatAmount(netFlow)
        };
      }

      if (!summary.statistics.worst_day || netFlow < summary.statistics.worst_day.net_flow) {
        summary.statistics.worst_day = {
          date: entry.transaction_date,
          net_flow: netFlow,
          formatted: this.formatAmount(netFlow)
        };
      }
    });

    summary.totals.net_flow = summary.totals.total_inflows - summary.totals.total_outflows;

    // Calcular médias
    const daysWithData = entries.length;
    if (daysWithData > 0) {
      summary.averages.avg_daily_inflow = summary.totals.total_inflows / daysWithData;
      summary.averages.avg_daily_outflow = summary.totals.total_outflows / daysWithData;
      summary.averages.avg_daily_net = summary.totals.net_flow / daysWithData;
    }

    // Calcular tendência
    if (entries.length >= 2) {
      const firstBalance = summary.totals.opening_balance;
      const lastBalance = summary.totals.closing_balance;
      
      summary.trend.growth_rate = firstBalance !== 0 
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
    summary.totals.total_inflows_formatted = this.formatAmount(summary.totals.total_inflows);
    summary.totals.total_outflows_formatted = this.formatAmount(summary.totals.total_outflows);
    summary.totals.net_flow_formatted = this.formatAmount(summary.totals.net_flow);
    summary.totals.opening_balance_formatted = this.formatAmount(summary.totals.opening_balance);
    summary.totals.closing_balance_formatted = this.formatAmount(summary.totals.closing_balance);
    
    summary.averages.avg_daily_inflow_formatted = this.formatAmount(summary.averages.avg_daily_inflow);
    summary.averages.avg_daily_outflow_formatted = this.formatAmount(summary.averages.avg_daily_outflow);
    summary.averages.avg_daily_net_formatted = this.formatAmount(summary.averages.avg_daily_net);

    return summary;
  }

  /**
   * Calcula inclinação da tendência usando regressão linear
   * @param {Array} entries - Entradas do fluxo de caixa
   * @returns {number} Inclinação da tendência
   * @private
   */
  static calculateTrendSlope(entries) {
    if (entries.length < 2) return 0;

    const n = entries.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

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
  static calculatePeriodDates(period) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (period) {
      case 'month':
        return {
          startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      
      case 'quarter': {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          startDate: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
          endDate: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      }
      
      case 'year':
        return {
          startDate: `${currentYear}-01-01`,
          endDate: `${currentYear}-12-31`
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
  static calculateDaysBetween(startDate, endDate) {
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
  static async getCashflowChartData(filters) {
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
        fluxoLiquido: (entry.inflows || 0) - (entry.outflows || 0)
      }));

      return { data: chartData, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca projeção de fluxo de caixa baseada em tendências
   * @param {Object} filters - Filtros de busca
   * @param {number} daysToProject - Dias para projetar (padrão: 30)
   * @returns {Object} { data: ProjectionData[], error: string|null }
   */
  static async getCashflowProjection(filters, daysToProject = 30) {
    try {
      // Buscar dados históricos (últimos 30 dias)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: historicalEntries, error } = await this.getCashflowEntries({
        ...filters,
        startDate,
        endDate
      });

      if (error) {
        return { data: null, error };
      }

      if (!historicalEntries || historicalEntries.length === 0) {
        return { data: [], error: null };
      }

      // Calcular médias históricas
      const avgInflow = historicalEntries.reduce((sum, entry) => sum + (entry.inflows || 0), 0) / historicalEntries.length;
      const avgOutflow = historicalEntries.reduce((sum, entry) => sum + (entry.outflows || 0), 0) / historicalEntries.length;
      
      // Último saldo conhecido
      const lastEntry = historicalEntries[historicalEntries.length - 1];
      let currentBalance = lastEntry?.accumulated_balance || 0;

      // Gerar projeção
      const projection = [];
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1); // Começar do próximo dia

      for (let i = 0; i < daysToProject; i++) {
        const projectionDate = new Date(baseDate);
        projectionDate.setDate(baseDate.getDate() + i);

        // Aplicar variação aleatória pequena nas médias (±20%)
        const variationFactor = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
        const projectedInflow = avgInflow * variationFactor;
        const projectedOutflow = avgOutflow * variationFactor;
        
        currentBalance += projectedInflow - projectedOutflow;

        projection.push({
          date: projectionDate.toISOString().split('T')[0],
          dateFormatted: this.formatDate(projectionDate.toISOString().split('T')[0]),
          projected_inflow: projectedInflow,
          projected_outflow: projectedOutflow,
          projected_balance: currentBalance,
          is_projection: true
        });
      }

      return { data: projection, error: null };
    } catch (err) {
      return { data: null, error: err.message };
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
  static async compareCashflowPeriods(params) {
    try {
      const { currentPeriod, comparisonPeriod, unitId } = params;

      // Buscar dados dos dois períodos
      const [currentResult, comparisonResult] = await Promise.all([
        this.getCashflowSummary({
          unitId,
          period: 'custom',
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate
        }),
        this.getCashflowSummary({
          unitId,
          period: 'custom',
          startDate: comparisonPeriod.startDate,
          endDate: comparisonPeriod.endDate
        })
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
          inflows_change: this.calculatePercentageChange(comparison.totals.total_inflows, current.totals.total_inflows),
          outflows_change: this.calculatePercentageChange(comparison.totals.total_outflows, current.totals.total_outflows),
          net_flow_change: this.calculatePercentageChange(comparison.totals.net_flow, current.totals.net_flow),
          balance_change: this.calculatePercentageChange(comparison.totals.closing_balance, current.totals.closing_balance)
        }
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
  static calculatePercentageChange(oldValue, newValue) {
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
   * Formata data
   * @param {string|Date} date - Data a ser formatada
   * @returns {string} Data formatada
   * @private
   */
  static formatDate(date) {
    if (!date) return '';
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('pt-BR');
  }
}

export const cashflowService = new CashflowService();
export default CashflowService;