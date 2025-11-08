/**
 * RELATÓRIOS REPOSITORY
 *
 * Responsável pelo acesso direto aos dados do Supabase para relatórios e análises.
 * Segue os padrões Clean Architecture - Repository Pattern.
 */

import { supabase } from '../services/supabase';

/**
 * Utilitários para tratamento de erros
 */
const buildError = (message, code = null) => ({
  message,
  code,
  timestamp: new Date().toISOString(),
});

/**
 * Utilitários para formatação de datas
 */
const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    };
  }

  return { startDate, endDate };
};

/**
 * Repository para operações de relatórios
 */
class RelatoriosRepository {
  /**
   * Busca estatísticas financeiras de uma unidade para comparativo
   */
  async getUnitFinancialStats(unitId, month, year) {
    try {
      const { data: revenues, error: revenueError } = await supabase
        .from('revenues')
        .select(
          `
          id,
          value,
          status,
          type,
          payment_date,
          created_at
        `
        )
        .eq('unit_id', unitId)
        .gte('payment_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lt('payment_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
        .eq('is_active', true);

      if (revenueError) {
        return {
          data: null,
          error: buildError(revenueError.message, 'REVENUE_FETCH_ERROR'),
        };
      }

      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select(
          `
          id,
          value,
          status,
          type,
          payment_date,
          created_at
        `
        )
        .eq('unit_id', unitId)
        .gte('payment_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lt('payment_date', `${year}-${String(month + 1).padStart(2, '0')}-01`)
        .eq('is_active', true);

      if (expenseError) {
        return {
          data: null,
          error: buildError(expenseError.message, 'EXPENSE_FETCH_ERROR'),
        };
      }

      return {
        data: {
          revenues: revenues || [],
          expenses: expenses || [],
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar dados financeiros: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca dados de atendimentos de uma unidade
   */
  async getUnitAttendanceStats(unitId, month, year) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_value,
          status,
          created_at,
          professional_id,
          professionals!inner(
            name,
            unit_id
          )
        `
        )
        .eq('professionals.unit_id', unitId)
        .gte('created_at', `${year}-${String(month).padStart(2, '0')}-01`)
        .lt('created_at', `${year}-${String(month + 1).padStart(2, '0')}-01`)
        .eq('status', 'completed')
        .eq('is_active', true);

      if (error) {
        return {
          data: null,
          error: buildError(error.message, 'ATTENDANCE_FETCH_ERROR'),
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar atendimentos: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca dados de profissionais ativos de uma unidade
   */
  async getUnitProfessionalsStats(unitId) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select(
          `
          id,
          name,
          role,
          commission_percentage,
          is_active,
          created_at
        `
        )
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (error) {
        return {
          data: null,
          error: buildError(error.message, 'PROFESSIONALS_FETCH_ERROR'),
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar profissionais: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca comparativo de crescimento entre períodos
   */
  async getUnitGrowthComparison(unitId, currentMonth, currentYear) {
    try {
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Dados do período atual
      const currentData = await this.getUnitFinancialStats(
        unitId,
        currentMonth,
        currentYear
      );
      if (currentData.error) return currentData;

      // Dados do período anterior
      const previousData = await this.getUnitFinancialStats(
        unitId,
        previousMonth,
        previousYear
      );
      if (previousData.error) return previousData;

      return {
        data: {
          current: currentData.data,
          previous: previousData.data,
          period: {
            current: { month: currentMonth, year: currentYear },
            previous: { month: previousMonth, year: previousYear },
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar comparativo de crescimento: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca todas as unidades ativas para comparação
   */
  async getActiveUnits() {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(
          `
          id,
          name,
          is_active,
          created_at
        `
        )
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          data: null,
          error: buildError(error.message, 'UNITS_FETCH_ERROR'),
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar unidades: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca dados completos para comparativo entre unidades
   */
  async getUnitsComparisonData(month, year) {
    try {
      // Primeiro, buscar todas as unidades ativas
      const unitsResult = await this.getActiveUnits();
      if (unitsResult.error) return unitsResult;

      const units = unitsResult.data;

      // Buscar dados de cada unidade em paralelo
      const unitsData = await Promise.all(
        units.map(async unit => {
          const [
            financialResult,
            attendanceResult,
            professionalsResult,
            growthResult,
          ] = await Promise.all([
            this.getUnitFinancialStats(unit.id, month, year),
            this.getUnitAttendanceStats(unit.id, month, year),
            this.getUnitProfessionalsStats(unit.id),
            this.getUnitGrowthComparison(unit.id, month, year),
          ]);

          return {
            unit,
            financial: financialResult.data,
            attendance: attendanceResult.data,
            professionals: professionalsResult.data,
            growth: growthResult.data,
            errors: [
              financialResult.error,
              attendanceResult.error,
              professionalsResult.error,
              growthResult.error,
            ].filter(Boolean),
          };
        })
      );

      return { data: unitsData, error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar dados do comparativo: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca dados do DRE para uma unidade específica
   */
  async getUnitDREData(unitId, month, year) {
    try {
      const { data, error } = await supabase.rpc('fn_calculate_dre', {
        p_unit_id: unitId,
        p_month: month,
        p_year: year,
      });

      if (error) {
        return {
          data: null,
          error: buildError(error.message, 'DRE_FETCH_ERROR'),
        };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao buscar DRE: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }

  /**
   * Busca ranking de unidades por métrica específica
   */
  async getUnitsRanking(metric = 'revenue', month, year, limit = 10) {
    try {
      const comparisonResult = await this.getUnitsComparisonData(month, year);
      if (comparisonResult.error) return comparisonResult;

      // Processar dados para ranking
      const processedData = comparisonResult.data.map(unitData => {
        const totalRevenue = (unitData.financial?.revenues || []).reduce(
          (sum, revenue) => sum + (revenue.value || 0),
          0
        );

        const totalExpenses = (unitData.financial?.expenses || []).reduce(
          (sum, expense) => sum + (expense.value || 0),
          0
        );

        const profit = totalRevenue - totalExpenses;
        const attendanceCount = (unitData.attendance || []).length;
        const professionalsCount = (unitData.professionals || []).length;

        return {
          ...unitData.unit,
          metrics: {
            revenue: totalRevenue,
            profit,
            attendances: attendanceCount,
            professionals: professionalsCount,
            averageTicket:
              attendanceCount > 0 ? totalRevenue / attendanceCount : 0,
            revenuePerProfessional:
              professionalsCount > 0 ? totalRevenue / professionalsCount : 0,
          },
        };
      });

      // Ordenar por métrica selecionada
      const sortedData = processedData.sort((a, b) => {
        const valueA = a.metrics[metric] || 0;
        const valueB = b.metrics[metric] || 0;
        return valueB - valueA;
      });

      return {
        data: sortedData.slice(0, limit),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: buildError(
          `Erro ao gerar ranking: ${error.message}`,
          'UNKNOWN_ERROR'
        ),
      };
    }
  }
}

const relatoriosRepository = new RelatoriosRepository();

export default relatoriosRepository;
