/**
 * Alerts Repository - Acesso aos dados de alertas do sistema
 *
 * Responsável por:
 * - CRUD de alertas (alerts_events)
 * - Consultas de alertas por unidade e tipo
 * - Criação de alertas de anomalias
 *
 * @module lib/repositories/alertsRepository
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.3
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Tipos de alerta suportados
 */
export type AlertType =
  | 'LOW_MARGIN'
  | 'REVENUE_DROP'
  | 'ANOMALY'
  | 'HIGH_EXPENSE';

/**
 * Níveis de severidade
 */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Status do alerta
 */
export type AlertStatus = 'OPEN' | 'RESOLVED' | 'IGNORED';

/**
 * Interface para alerta
 */
export interface AlertEvent {
  id: string;
  unit_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
}

/**
 * Interface para criação de alerta
 */
export interface CreateAlertInput {
  unit_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Cria um novo alerta no banco de dados
 *
 * @param data - Dados do alerta a criar
 * @returns Promise com resultado da operação
 *
 * @example
 * ```typescript
 * const result = await alertsRepository.create({
 *   unit_id: 'unit-123',
 *   alert_type: 'REVENUE_DROP',
 *   severity: 'MEDIUM',
 *   message: 'Queda de 15% na receita detectada',
 *   metadata: { dropPercentage: 15, average7Days: 6000 }
 * });
 * ```
 */
export async function createAlert(data: CreateAlertInput): Promise<{
  data: AlertEvent | null;
  error: any;
}> {
  try {
    const { data: result, error } = await supabase
      .from('alerts_events')
      .insert({
        unit_id: data.unit_id,
        alert_type: data.alert_type,
        severity: data.severity,
        message: data.message,
        metadata: data.metadata || {},
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar alerta', {
        error: error.message,
        alertType: data.alert_type,
        unitId: data.unit_id,
      });
      return { data: null, error };
    }

    logger.info('Alerta criado com sucesso', {
      alertId: result.id,
      alertType: data.alert_type,
      unitId: data.unit_id,
    });

    return { data: result, error: null };
  } catch (error: any) {
    logger.error('Exceção ao criar alerta', {
      error: error.message,
      alertType: data.alert_type,
      unitId: data.unit_id,
    });
    return { data: null, error };
  }
}

/**
 * Busca alertas de uma unidade
 *
 * @param unitId - ID da unidade
 * @param status - Status do alerta (opcional)
 * @param limit - Limite de resultados (padrão: 50)
 * @returns Promise com array de alertas
 */
export async function findByUnit(
  unitId: string,
  status?: AlertStatus,
  limit: number = 50
): Promise<{
  data: AlertEvent[] | null;
  error: any;
}> {
  try {
    let query = supabase
      .from('alerts_events')
      .select('*')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar alertas', {
        error: error.message,
        unitId,
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    logger.error('Exceção ao buscar alertas', {
      error: error.message,
      unitId,
    });
    return { data: null, error };
  }
}

/**
 * Busca alertas por tipo
 *
 * @param alertType - Tipo do alerta
 * @param unitId - ID da unidade (opcional)
 * @param limit - Limite de resultados (padrão: 50)
 * @returns Promise com array de alertas
 */
export async function findByType(
  alertType: AlertType,
  unitId?: string,
  limit: number = 50
): Promise<{
  data: AlertEvent[] | null;
  error: any;
}> {
  try {
    let query = supabase
      .from('alerts_events')
      .select('*')
      .eq('alert_type', alertType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao buscar alertas por tipo', {
        error: error.message,
        alertType,
        unitId,
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    logger.error('Exceção ao buscar alertas por tipo', {
      error: error.message,
      alertType,
      unitId,
    });
    return { data: null, error };
  }
}

/**
 * Resolve um alerta
 *
 * @param alertId - ID do alerta
 * @returns Promise com resultado da operação
 */
export async function resolveAlert(alertId: string): Promise<{
  success: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase
      .from('alerts_events')
      .update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      logger.error('Erro ao resolver alerta', {
        error: error.message,
        alertId,
      });
      return { success: false, error };
    }

    logger.info('Alerta resolvido', { alertId });
    return { success: true, error: null };
  } catch (error: any) {
    logger.error('Exceção ao resolver alerta', {
      error: error.message,
      alertId,
    });
    return { success: false, error };
  }
}

export const alertsRepository = {
  create: createAlert,
  findByUnit,
  findByType,
  resolve: resolveAlert,
};

