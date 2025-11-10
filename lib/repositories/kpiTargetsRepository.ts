/**
 * KPI Targets Repository - Acesso aos dados de targets de KPIs
 *
 * Responsável por:
 * - Buscar targets de KPIs por unidade
 * - Buscar target específico por nome (ex: 'MARGIN')
 *
 * @module lib/repositories/kpiTargetsRepository
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.3.3
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Nomes de KPI suportados
 */
export type KPIName = 'MARGIN' | 'AVERAGE_TICKET' | 'MONTHLY_REVENUE' | 'MAX_EXPENSE';

/**
 * Períodos de target
 */
export type KPIPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

/**
 * Interface para target de KPI
 */
export interface KPITarget {
  id: string;
  unit_id: string;
  kpi_name: KPIName;
  target_value: number;
  period: KPIPeriod;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Busca target de um KPI específico para uma unidade
 *
 * Retorna o target ativo mais recente para o KPI especificado.
 *
 * @param unitId - ID da unidade
 * @param kpiName - Nome do KPI (ex: 'MARGIN')
 * @returns Promise com target do KPI ou null se não encontrado
 *
 * @example
 * ```typescript
 * const marginTarget = await kpiTargetsRepository.findByKPI('unit-123', 'MARGIN');
 * if (marginTarget) {
 *   console.log(`Target de margem: ${marginTarget.target_value}%`);
 * }
 * ```
 */
export async function findByKPI(
  unitId: string,
  kpiName: KPIName
): Promise<{
  data: KPITarget | null;
  error: any;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .eq('unit_id', unitId)
      .eq('kpi_name', kpiName)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Se não encontrou registro, não é erro crítico
      if (error.code === 'PGRST116') {
        logger.debug('Target de KPI não encontrado', {
          unitId,
          kpiName,
        });
        return { data: null, error: null };
      }

      logger.error('Erro ao buscar target de KPI', {
        error: error.message,
        unitId,
        kpiName,
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    logger.error('Exceção ao buscar target de KPI', {
      error: error.message,
      unitId,
      kpiName,
    });
    return { data: null, error };
  }
}

/**
 * Busca todos os targets ativos de uma unidade
 *
 * @param unitId - ID da unidade
 * @returns Promise com array de targets
 */
export async function findByUnit(unitId: string): Promise<{
  data: KPITarget[] | null;
  error: any;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('kpi_name', { ascending: true })
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar targets de KPI', {
        error: error.message,
        unitId,
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    logger.error('Exceção ao buscar targets de KPI', {
      error: error.message,
      unitId,
    });
    return { data: null, error };
  }
}

export const kpiTargetsRepository = {
  findByKPI,
  findByUnit,
};

