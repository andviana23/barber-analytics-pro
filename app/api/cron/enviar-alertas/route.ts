/**
 * @fileoverview Cron: Envio de Alertas
 * @module app/api/cron/enviar-alertas
 * @description Envia alertas pendentes via Telegram
 *
 * Schedule: */15 * * * * (A cada 15 minutos)
 *
 * Fluxo:
 * 1. Buscar alertas pendentes (status = 'OPEN')
 * 2. Enviar via Telegram
 * 3. Atualizar status para 'ACKNOWLEDGED'
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 6.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';
import { logger } from '@/lib/logger';
import { alertsRepository } from '@/lib/repositories/alertsRepository';
import { sendTelegramAlert } from '@/lib/telegram';
import { checkAndNotifyUpcomingExpenses } from '@/lib/services/recurringExpenseNotifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/cron/enviar-alertas
 *
 * Envia alertas pendentes via Telegram
 */
export async function GET(request: NextRequest) {
  const correlationId = `send-alerts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Envio de alertas iniciado', {
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Verificar autenticação
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  try {
    // 2. Buscar alertas pendentes (status = 'OPEN')
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts_events')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: true })
      .limit(50); // Limitar para evitar sobrecarga

    if (alertsError) {
      logger.error('Erro ao buscar alertas', {
        correlationId,
        error: alertsError.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch alerts',
          correlationId,
        },
        { status: 500 }
      );
    }

    if (!alerts || alerts.length === 0) {
      logger.info('Nenhum alerta pendente encontrado', {
        correlationId,
      });
      return NextResponse.json({
        success: true,
        alertsSent: 0,
        message: 'Nenhum alerta pendente',
        correlationId,
      });
    }

    logger.info('Alertas pendentes encontrados', {
      correlationId,
      alertsCount: alerts.length,
    });

    // 3. Enviar cada alerta via Telegram
    let sentCount = 0;
    let failedCount = 0;

    for (const alert of alerts) {
      try {
        // Buscar informações da unidade
        const { data: unit } = await supabase
          .from('units')
          .select('id, name')
          .eq('id', alert.unit_id)
          .single();

        const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
          LOW: 'LOW',
          MEDIUM: 'MEDIUM',
          HIGH: 'HIGH',
          CRITICAL: 'CRITICAL',
        };

        await sendTelegramAlert({
          message: alert.message,
          severity: severityMap[alert.severity] || 'MEDIUM',
          unitId: alert.unit_id,
          unitName: unit?.name,
          metadata: {
            'Tipo': alert.alert_type,
            'Severidade': alert.severity,
            'Criado em': new Date(alert.created_at).toLocaleString('pt-BR'),
          },
        });

        // 4. Atualizar status para ACKNOWLEDGED
        await supabase
          .from('alerts_events')
          .update({ status: 'ACKNOWLEDGED', acknowledged_at: new Date().toISOString() })
          .eq('id', alert.id);

        sentCount++;

        logger.info('Alerta enviado com sucesso', {
          correlationId,
          alertId: alert.id,
          alertType: alert.alert_type,
          unitId: alert.unit_id,
        });
      } catch (error: any) {
        failedCount++;
        logger.error('Erro ao enviar alerta', {
          correlationId,
          alertId: alert.id,
          error: error.message,
        });
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('Envio de alertas concluído', {
      correlationId,
      alertsFound: alerts.length,
      alertsSent: sentCount,
      alertsFailed: failedCount,
      durationMs,
    });

    // 4. Verificar e enviar notificações de despesas recorrentes com vencimento próximo
    logger.info('Verificando despesas recorrentes com vencimento próximo', {
      correlationId,
    });

    const recurringResult = await checkAndNotifyUpcomingExpenses(7); // 7 dias à frente

    logger.info('Verificação de despesas recorrentes concluída', {
      correlationId,
      expensesFound: recurringResult.expensesFound,
      notificationsSent: recurringResult.sent,
      errors: recurringResult.errors,
    });

    return NextResponse.json({
      success: true,
      correlationId,
      alertsFound: alerts.length,
      alertsSent: sentCount,
      alertsFailed: failedCount,
      recurringExpensesFound: recurringResult.expensesFound,
      recurringNotificationsSent: recurringResult.sent,
      recurringErrors: recurringResult.errors,
      durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro crítico no envio de alertas', {
      correlationId,
      error: error.message,
      stack: error.stack,
      durationMs,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        correlationId,
        durationMs,
      },
      { status: 500 }
    );
  }
}

