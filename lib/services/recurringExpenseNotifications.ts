/**
 * @fileoverview Serviço de Notificações de Vencimento de Despesas Recorrentes
 * @module lib/services/recurringExpenseNotifications
 * @description Envia notificações quando despesas recorrentes estão próximas do vencimento
 *
 * @author Andrey Viana
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { sendTelegramMessage } from '@/lib/telegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca despesas recorrentes com vencimento próximo
 *
 * @param {number} daysAhead - Número de dias à frente para verificar (padrão: 7)
 * @returns {Promise<Array>} Lista de despesas com vencimento próximo
 */
export async function getUpcomingRecurringExpenses(daysAhead = 7) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Buscar despesas recorrentes pendentes com vencimento nos próximos N dias
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        value,
        expected_payment_date,
        status,
        unit_id,
        recurring_series_id,
        installment_number,
        units:unit_id (
          id,
          name
        ),
        categories:category_id (
          id,
          name
        ),
        parties:party_id (
          id,
          nome
        )
      `)
      .eq('is_recurring', true)
      .eq('is_active', true)
      .eq('status', 'pending')
      .gte('expected_payment_date', today.toISOString().split('T')[0])
      .lte('expected_payment_date', futureDate.toISOString().split('T')[0])
      .order('expected_payment_date', { ascending: true });

    if (error) {
      throw error;
    }

    return expenses || [];
  } catch (error: any) {
    logger.error('Erro ao buscar despesas recorrentes com vencimento próximo', {
      error: error.message,
    });
    return [];
  }
}

/**
 * Envia notificações de vencimento via Telegram
 *
 * @param {Array} expenses - Lista de despesas com vencimento próximo
 * @param {string|number} chatId - ID do chat do Telegram (opcional)
 * @returns {Promise<{success: boolean, sent: number, errors: number}>}
 */
export async function sendUpcomingExpenseNotifications(
  expenses: any[],
  chatId?: string | number
) {
  if (!expenses || expenses.length === 0) {
    return { success: true, sent: 0, errors: 0 };
  }

  // Agrupar por unidade
  const byUnit = expenses.reduce((acc, expense) => {
    const unitId = expense.unit_id;
    if (!acc[unitId]) {
      acc[unitId] = {
        unitName: expense.units?.name || 'Unidade Desconhecida',
        expenses: [],
      };
    }
    acc[unitId].expenses.push(expense);
    return acc;
  }, {} as Record<string, { unitName: string; expenses: any[] }>);

  let sent = 0;
  let errors = 0;

  // Enviar uma mensagem por unidade
  for (const [unitId, data] of Object.entries(byUnit)) {
    try {
      const totalValue = data.expenses.reduce(
        (sum, exp) => sum + parseFloat(exp.value || 0),
        0
      );

      const expensesList = data.expenses
        .map((exp) => {
          const date = new Date(exp.expected_payment_date);
          const daysUntil = Math.ceil(
            (date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysLabel = daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dias`;

          return `  • ${exp.description || 'Sem descrição'} - R$ ${parseFloat(exp.value || 0).toFixed(2)} (${daysLabel})`;
        })
        .join('\n');

      const message = `🔔 *Despesas Recorrentes com Vencimento Próximo*\n\n` +
        `🏢 *${data.unitName}*\n\n` +
        `${expensesList}\n\n` +
        `💰 *Total:* R$ ${totalValue.toFixed(2)}\n` +
        `📅 *${data.expenses.length}* despesa${data.expenses.length > 1 ? 's' : ''} com vencimento nos próximos 7 dias`;

      const result = await sendTelegramMessage(message, { chatId });

      if (result.success) {
        sent++;
        logger.info('Notificação de vencimento enviada', {
          unitId,
          unitName: data.unitName,
          count: data.expenses.length,
        });
      } else {
        errors++;
        logger.error('Erro ao enviar notificação', {
          unitId,
          error: result.error,
        });
      }
    } catch (error: any) {
      errors++;
      logger.error('Erro ao processar notificação de unidade', {
        unitId,
        error: error.message,
      });
    }
  }

  return { success: errors === 0, sent, errors };
}

/**
 * Verifica e envia notificações de vencimento
 *
 * @param {number} daysAhead - Número de dias à frente para verificar (padrão: 7)
 * @param {string|number} chatId - ID do chat do Telegram (opcional)
 * @returns {Promise<{success: boolean, expensesFound: number, sent: number, errors: number}>}
 */
export async function checkAndNotifyUpcomingExpenses(
  daysAhead = 7,
  chatId?: string | number
) {
  try {
    const expenses = await getUpcomingRecurringExpenses(daysAhead);

    if (expenses.length === 0) {
      logger.info('Nenhuma despesa recorrente com vencimento próximo encontrada', {
        daysAhead,
      });
      return {
        success: true,
        expensesFound: 0,
        sent: 0,
        errors: 0,
      };
    }

    logger.info('Despesas recorrentes com vencimento próximo encontradas', {
      count: expenses.length,
      daysAhead,
    });

    const result = await sendUpcomingExpenseNotifications(expenses, chatId);

    return {
      success: result.success,
      expensesFound: expenses.length,
      sent: result.sent,
      errors: result.errors,
    };
  } catch (error: any) {
    logger.error('Erro ao verificar e notificar despesas recorrentes', {
      error: error.message,
    });

    return {
      success: false,
      expensesFound: 0,
      sent: 0,
      errors: 1,
    };
  }
}

