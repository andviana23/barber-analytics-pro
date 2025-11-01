import { supabase } from './supabase';

/**
 * Serviço para gerenciar dados do dashboard
 */
class DashboardService {
  /**
   * Busca KPIs financeiros do período atual
   * @param {string} unitId - ID da unidade (opcional)
   * @param {Date} startDate - Data de início (opcional, padrão: início do mês)
   * @param {Date} endDate - Data de fim (opcional, padrão: hoje)
   */
  async getFinancialKPIs(unitId = null, startDate = null, endDate = null) {
    try {
      // Se não especificado, usa período do mês atual
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(1); // Primeiro dia do mês
      }

      if (!endDate) {
        endDate = new Date(); // Hoje
      }

      // Buscar receitas do período
      let revenuesQuery = supabase
        .from('revenues')
        .select('value, date, professional_id, unit_id')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (unitId) {
        revenuesQuery = revenuesQuery.eq('unit_id', unitId);
      }

      const { data: revenues, error: revError } = await revenuesQuery;

      if (revError) throw revError;

      // Buscar despesas do período
      let expensesQuery = supabase
        .from('expenses')
        .select('value, date, unit_id')
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (unitId) {
        expensesQuery = expensesQuery.eq('unit_id', unitId);
      }

      const { data: expenses, error: expError } = await expensesQuery;

      if (expError) throw expError;

      // Calcular KPIs
      const totalRevenue =
        revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) || 0;
      const totalExpenses =
        expenses?.reduce((sum, exp) => sum + Number(exp.value), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin =
        totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Contar atendimentos únicos
      const uniqueAttendances = revenues?.length || 0;
      const averageTicket =
        uniqueAttendances > 0 ? totalRevenue / uniqueAttendances : 0;

      // Comparar com mês anterior
      const lastMonth = new Date(startDate);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthEnd = new Date(endDate);
      lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

      const { data: lastMonthRevenues } = await supabase
        .from('revenues')
        .select('value')
        .gte('date', lastMonth.toISOString().split('T')[0])
        .lte('date', lastMonthEnd.toISOString().split('T')[0]);

      const lastMonthRevenue =
        lastMonthRevenues?.reduce((sum, rev) => sum + Number(rev.value), 0) ||
        0;
      const revenueGrowth =
        lastMonthRevenue > 0
          ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        averageTicket,
        totalAttendances: uniqueAttendances,
        revenueGrowth,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar KPIs:', error);
      throw error;
    }
  }

  /**
   * Busca dados para gráfico de evolução mensal
   * @param {string} unitId - ID da unidade (opcional)
   * @param {number} months - Número de meses para buscar (padrão: 12)
   */
  async getMonthlyEvolution(unitId = null, months = 12) {
    try {
      let query = supabase
        .from('vw_dashboard_financials')
        .select('*')
        .order('month', { ascending: true })
        .limit(months);

      // Note: unitId filtering would be implemented when the view supports it
      if (unitId) {
        // Future implementation for unit-specific data
      }

      const { data, error } = await query;

      if (error) throw error;

      return (
        data?.map(item => ({
          month: item.month,
          revenues: Number(item.total_revenues || 0),
          expenses: Number(item.total_expenses || 0),
          profit: Number(item.net_profit || 0),
          margin: Number(item.profit_margin || 0) * 100,
        })) || []
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar evolução mensal:', error);
      throw error;
    }
  }

  /**
   * Busca ranking de profissionais
   * @param {string} unitId - ID da unidade (opcional)
   * @param {number} limit - Limite de resultados (padrão: 10)
   */
  async getProfessionalsRanking(unitId = null, limit = 10) {
    try {
      let query = supabase
        .from('professionals')
        .select(
          `
          id,
          name,
          commission_rate,
          unit_id,
          revenues:revenues(value, date)
        `
        )
        .eq('is_active', true);

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;

      // Calcular totais para cada profissional
      const ranking =
        data?.map(prof => {
          const totalRevenue =
            prof.revenues?.reduce((sum, rev) => sum + Number(rev.value), 0) ||
            0;
          const attendances = prof.revenues?.length || 0;
          const averageTicket =
            attendances > 0 ? totalRevenue / attendances : 0;

          return {
            id: prof.id,
            name: prof.name,
            totalRevenue,
            attendances,
            averageTicket,
            commissionRate: prof.commission_rate,
          };
        }) || [];

      // Ordenar por faturamento
      return ranking.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar ranking:', error);
      throw error;
    }
  }

  /**
   * Busca comparativo entre unidades
   */
  async getUnitsComparison() {
    try {
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('status', true);

      if (unitsError) throw unitsError;

      const comparison = [];

      for (const unit of units || []) {
        const kpis = await this.getFinancialKPIs(unit.id);
        comparison.push({
          unitId: unit.id,
          unitName: unit.name,
          ...kpis,
        });
      }

      return comparison;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar comparativo:', error);
      throw error;
    }
  }

  /**
   * Busca distribuição de receitas por tipo
   * @param {string} unitId - ID da unidade (opcional)
   */
  async getRevenueDistribution(unitId = null) {
    try {
      let query = supabase.from('revenues').select('type, value');

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por tipo
      const distribution = {};

      data?.forEach(revenue => {
        const type = revenue.type || 'outros';
        distribution[type] = (distribution[type] || 0) + Number(revenue.value);
      });

      return Object.entries(distribution).map(([type, value]) => ({
        name: type,
        value: value,
        percentage: 0, // Será calculado no frontend
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar distribuição:', error);
      throw error;
    }
  }

  /**
   * Busca agendamentos/atendimentos recentes
   * @param {string} unitId - ID da unidade (opcional)
   * @param {number} limit - Limite de resultados (padrão: 10)
   */
  async getRecentBookings(unitId = null, limit = 10) {
    try {
      let query = supabase
        .from('bookings')
        .select(
          `
          id,
          service_type,
          service_value,
          date,
          professional:professionals(name),
          unit:units(name)
        `
        )
        .order('date', { ascending: false });

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;

      return (
        data?.map(booking => ({
          id: booking.id,
          service: booking.service_type,
          value: Number(booking.service_value),
          date: booking.date,
          professional: booking.professional?.name || 'N/A',
          unit: booking.unit?.name || 'N/A',
        })) || []
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }
}

// Instância única do serviço
const dashboardService = new DashboardService();

export default dashboardService;
