/**
 * AI Metrics Repository - Acesso aos dados de métricas diárias da IA
 *
 * Responsável por:
 * - CRUD de métricas diárias (ai_metrics_daily)
 * - Consultas históricas para análise de tendências
 * - Agregações para relatórios
 *
 * @module lib/repositories/aiMetricsRepository
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3
 */

import { supabaseAdmin } from '../supabaseAdmin';

/**
 * Interface para métricas diárias
 */
export interface AiMetricDaily {
  id: string;
  unit_id: string;
  date: string;
  gross_revenue: number;
  total_expenses: number;
  margin_percentage: number;
  average_ticket: number;
  revenues_count: number;
  expenses_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para input de criação/atualização
 */
export interface AiMetricInput {
  unit_id: string;
  date: Date | string;
  gross_revenue: number;
  total_expenses: number;
  margin_percentage: number;
  average_ticket: number;
  revenues_count: number;
  expenses_count: number;
}

/**
 * Insere ou atualiza métricas diárias (upsert)
 *
 * Se já existir registro para a mesma unidade e data, atualiza.
 * Caso contrário, cria novo registro.
 *
 * @param data - Dados das métricas a salvar
 * @returns Promise com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await aiMetricsRepository.upsert({
 *   unit_id: 'unit-123',
 *   date: new Date('2025-11-09'),
 *   gross_revenue: 5000,
 *   total_expenses: 1500,
 *   margin_percentage: 70,
 *   average_ticket: 125,
 *   revenues_count: 40,
 *   expenses_count: 8
 * });
 * ```
 */
export async function upsert(data: AiMetricInput): Promise<{
  data: AiMetricDaily | null;
  error: any;
}> {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .upsert(
        {
          unit_id: data.unit_id,
          date:
            typeof data.date === 'string'
              ? data.date
              : data.date.toISOString().split('T')[0],
          receita_bruta: data.gross_revenue,
          despesas_totais: data.total_expenses,
          margem_percentual: data.margin_percentage,
          ticket_medio: data.average_ticket,
          receitas_count: data.revenues_count,
          despesas_count: data.expenses_count,
        },
        {
          onConflict: 'unit_id,date', // Chave de conflito
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[aiMetricsRepository] Error upserting metric:', error);
      return { data: null, error };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('[aiMetricsRepository] Exception in upsert:', error);
    return { data: null, error };
  }
}

/**
 * Busca métricas de uma unidade em um período
 *
 * @param unitId - ID da unidade
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Promise com array de métricas
 *
 * @example
 * ```typescript
 * const metrics = await aiMetricsRepository.findByPeriod(
 *   'unit-123',
 *   new Date('2025-11-01'),
 *   new Date('2025-11-30')
 * );
 * ```
 */
export async function findByPeriod(
  unitId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  data: AiMetricDaily[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .select('*')
      .eq('unit_id', unitId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('[aiMetricsRepository] Error finding by period:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[aiMetricsRepository] Exception in findByPeriod:', error);
    return { data: null, error };
  }
}

/**
 * Busca métricas de um dia específico
 *
 * @param unitId - ID da unidade
 * @param date - Data a buscar
 * @returns Promise com métrica do dia
 *
 * @example
 * ```typescript
 * const metric = await aiMetricsRepository.findByDate(
 *   'unit-123',
 *   new Date('2025-11-09')
 * );
 * ```
 */
export async function findByDate(
  unitId: string,
  date: Date
): Promise<{
  data: AiMetricDaily | null;
  error: any;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .select('*')
      .eq('unit_id', unitId)
      .eq('date', date.toISOString().split('T')[0])
      .single();

    if (error) {
      console.error('[aiMetricsRepository] Error finding by date:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[aiMetricsRepository] Exception in findByDate:', error);
    return { data: null, error };
  }
}

/**
 * Busca últimas N métricas de uma unidade
 *
 * @param unitId - ID da unidade
 * @param limit - Quantidade de registros
 * @returns Promise com array de métricas
 *
 * @example
 * ```typescript
 * const last30Days = await aiMetricsRepository.findLast('unit-123', 30);
 * ```
 */
export async function findLast(
  unitId: string,
  limit: number
): Promise<{
  data: AiMetricDaily[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .select('*')
      .eq('unit_id', unitId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[aiMetricsRepository] Error finding last metrics:', error);
      return { data: null, error };
    }

    // Reverter ordem para ficar cronológico (mais antigo primeiro)
    return { data: data.reverse(), error: null };
  } catch (error) {
    console.error('[aiMetricsRepository] Exception in findLast:', error);
    return { data: null, error };
  }
}

/**
 * Busca agregação mensal de métricas
 *
 * @param unitId - ID da unidade
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Promise com totais do mês
 *
 * @example
 * ```typescript
 * const monthly = await aiMetricsRepository.findMonthlyAggregation(
 *   'unit-123',
 *   2025,
 *   11
 * );
 * // Retorna: {
 * //   total_gross_revenue: 150000,
 * //   total_expenses: 45000,
 * //   avg_margin: 70,
 * //   total_revenues_count: 1200
 * // }
 * ```
 */
export async function findMonthlyAggregation(
  unitId: string,
  year: number,
  month: number
): Promise<{
  data: any | null;
  error: any;
}> {
  try {
    // Construir datas de início e fim do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último dia do mês

    const { data, error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .select(
        'gross_revenue, total_expenses, margin_percentage, revenues_count, expenses_count'
      )
      .eq('unit_id', unitId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
      console.error(
        '[aiMetricsRepository] Error finding monthly aggregation:',
        error
      );
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return {
        data: {
          total_gross_revenue: 0,
          total_expenses: 0,
          avg_margin: 0,
          total_revenues_count: 0,
          total_expenses_count: 0,
          days_count: 0,
        },
        error: null,
      };
    }

    // Agregar dados manualmente
    const aggregated = {
      total_gross_revenue: data.reduce(
        (sum: number, row: any) => sum + (row.gross_revenue || 0),
        0
      ),
      total_expenses: data.reduce(
        (sum: number, row: any) => sum + (row.total_expenses || 0),
        0
      ),
      avg_margin:
        data.reduce(
          (sum: number, row: any) => sum + (row.margin_percentage || 0),
          0
        ) / data.length,
      total_revenues_count: data.reduce(
        (sum: number, row: any) => sum + (row.revenues_count || 0),
        0
      ),
      total_expenses_count: data.reduce(
        (sum: number, row: any) => sum + (row.expenses_count || 0),
        0
      ),
      days_count: data.length,
    };

    return { data: aggregated, error: null };
  } catch (error) {
    console.error(
      '[aiMetricsRepository] Exception in findMonthlyAggregation:',
      error
    );
    return { data: null, error };
  }
}

/**
 * Deleta métricas de uma data específica
 *
 * @param unitId - ID da unidade
 * @param date - Data a deletar
 * @returns Promise com resultado da operação
 */
export async function deleteByDate(
  unitId: string,
  date: Date
): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabaseAdmin
      .from('ai_metrics_daily')
      .delete()
      .eq('unit_id', unitId)
      .eq('date', date.toISOString().split('T')[0]);

    if (error) {
      console.error('[aiMetricsRepository] Error deleting metric:', error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('[aiMetricsRepository] Exception in deleteByDate:', error);
    return { success: false, error };
  }
}

export const aiMetricsRepository = {
  upsert,
  findByPeriod,
  findByDate,
  findLast,
  findMonthlyAggregation,
  deleteByDate,
};
