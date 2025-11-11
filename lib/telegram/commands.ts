/**
 * @fileoverview Telegram Commands Handler
 * @module lib/telegram/commands
 * @description Processa comandos do Telegram Bot
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 7.2
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../logger';
import { sendTelegramMessage } from '../telegram';
import { aiMetricsRepository } from '../repositories/aiMetricsRepository';
import { alertsRepository } from '../repositories/alertsRepository';
import { generateAnalysis } from '../ai/analysis';
import {
  calculateAverageTicket,
  calculateGrowthRate,
} from '../analytics/calculations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca unidade associada ao usuário do Telegram
 */
async function getUserUnit(
  telegramUserId: string
): Promise<{ unitId: string; unitName: string } | null> {
  try {
    // Buscar usuário por telegram_user_id ou criar mapeamento
    // Assumindo que há uma tabela users com campo telegram_user_id ou similar
    // Por enquanto, vamos buscar pela primeira unidade ativa (pode ser melhorado)
    const { data: units, error } = await supabase
      .from('units')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error || !units) {
      return null;
    }

    return {
      unitId: units.id,
      unitName: units.name,
    };
  } catch (error: any) {
    logger.error('Erro ao buscar unidade do usuário Telegram', {
      telegramUserId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Interface para comando do Telegram
 */
interface TelegramCommand {
  chatId: number;
  userId?: string;
  username?: string;
  firstName?: string;
  command: string;
  correlationId: string;
}

/**
 * Processa comandos do Telegram
 */
export async function handleTelegramCommand(
  cmd: TelegramCommand
): Promise<void> {
  const { chatId, userId, command, correlationId } = cmd;

  try {
    // Buscar unidade do usuário
    const userUnit = userId ? await getUserUnit(userId) : null;

    if (!userUnit) {
      await sendTelegramMessage(
        '❌ Não foi possível identificar sua unidade. Entre em contato com o administrador.',
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    const [commandName, ...args] = command.split(' ');

    switch (commandName.toLowerCase()) {
      case '/status':
        await handleStatusCommand(chatId, userUnit, correlationId);
        break;

      case '/semanal':
        await handleSemanalCommand(chatId, userUnit, correlationId);
        break;

      case '/alertas':
        await handleAlertasCommand(chatId, userUnit, correlationId);
        break;

      case '/whatif':
        const scenario = args.join(' ');
        await handleWhatIfCommand(chatId, userUnit, scenario, correlationId);
        break;

      case '/help':
      case '/start':
        await handleHelpCommand(chatId);
        break;

      default:
        await sendTelegramMessage(
          `❓ Comando desconhecido: ${commandName}\n\nUse /help para ver os comandos disponíveis.`,
          { chatId, parseMode: 'Markdown' }
        );
    }
  } catch (error: any) {
    logger.error('Erro ao processar comando do Telegram', {
      correlationId,
      command,
      error: error.message,
      stack: error.stack,
    });

    await sendTelegramMessage(
      '❌ Erro ao processar comando. Tente novamente mais tarde.',
      {
        chatId,
        parseMode: 'Markdown',
      }
    );
  }
}

/**
 * Comando /status - Retorna saúde financeira atual
 */
async function handleStatusCommand(
  chatId: number,
  userUnit: { unitId: string; unitName: string },
  correlationId: string
): Promise<void> {
  try {
    // Buscar métricas dos últimos 30 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const { data: metrics, error } = await aiMetricsRepository.findByPeriod(
      userUnit.unitId,
      startDate,
      endDate
    );

    if (error || !metrics || metrics.length === 0) {
      await sendTelegramMessage(
        `📊 *Status Financeiro - ${userUnit.unitName}*\n\n` +
          `❌ Nenhuma métrica encontrada.`,
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    // Calcular métricas agregadas
    const totalRevenue = metrics.reduce(
      (sum, m) => sum + (m.gross_revenue || 0),
      0
    );
    const totalExpenses = metrics.reduce(
      (sum, m) => sum + (m.total_expenses || 0),
      0
    );
    const marginPercentage =
      totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;
    const transactionsCount = metrics.reduce(
      (sum, m) => sum + (m.revenues_count || 0),
      0
    );
    const averageTicket = calculateAverageTicket(
      totalRevenue,
      transactionsCount
    );

    // Buscar alertas abertos
    const { data: alerts } = await alertsRepository.findByUnit(
      userUnit.unitId,
      'OPEN',
      5
    );

    // Calcular tendência
    let trend = 'STABLE';
    if (metrics.length >= 2) {
      const recent = metrics.slice(-7);
      const older = metrics.slice(-14, -7);
      const recentRevenue = recent.reduce(
        (sum, m) => sum + (m.gross_revenue || 0),
        0
      );
      const olderRevenue = older.reduce(
        (sum, m) => sum + (m.gross_revenue || 0),
        0
      );
      const growth = calculateGrowthRate(recentRevenue, olderRevenue);
      if (growth > 5) trend = '📈 CRESCENDO';
      else if (growth < -5) trend = '📉 DIMINUINDO';
      else trend = '➡️ ESTÁVEL';
    }

    const message =
      `📊 *Status Financeiro - ${userUnit.unitName}*\n\n` +
      `💰 *Receita (30 dias):* R$ ${totalRevenue.toFixed(2)}\n` +
      `💸 *Despesas (30 dias):* R$ ${totalExpenses.toFixed(2)}\n` +
      `📈 *Margem:* ${marginPercentage.toFixed(1)}%\n` +
      `🎫 *Ticket Médio:* R$ ${averageTicket.toFixed(2)}\n` +
      `📦 *Transações:* ${transactionsCount}\n` +
      `📊 *Tendência:* ${trend}\n\n` +
      (alerts && alerts.length > 0
        ? `⚠️ *Alertas Abertos:* ${alerts.length}\n`
        : `✅ *Nenhum alerta aberto*\n`) +
      `\n⏰ ${new Date().toLocaleString('pt-BR')}`;

    await sendTelegramMessage(message, { chatId, parseMode: 'Markdown' });
  } catch (error: any) {
    logger.error('Erro ao processar comando /status', {
      correlationId,
      unitId: userUnit.unitId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Comando /semanal - Envia relatório semanal completo
 */
async function handleSemanalCommand(
  chatId: number,
  userUnit: { unitId: string; unitName: string },
  correlationId: string
): Promise<void> {
  try {
    await sendTelegramMessage('⏳ Gerando relatório semanal...', {
      chatId,
      parseMode: 'Markdown',
    });

    // Calcular semana anterior
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    // Buscar métricas
    const { data: metrics } = await aiMetricsRepository.findByPeriod(
      userUnit.unitId,
      lastMonday,
      lastSunday
    );

    if (!metrics || metrics.length === 0) {
      await sendTelegramMessage(
        `📊 *Relatório Semanal - ${userUnit.unitName}*\n\n` +
          `❌ Nenhuma métrica encontrada para a semana anterior.`,
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    // Calcular métricas agregadas
    const aggregated = {
      grossRevenue: metrics.reduce((sum, m) => sum + (m.gross_revenue || 0), 0),
      totalExpenses: metrics.reduce(
        (sum, m) => sum + (m.total_expenses || 0),
        0
      ),
      marginPercentage: 0,
      averageTicket: 0,
      transactionsCount: metrics.reduce(
        (sum, m) => sum + (m.revenues_count || 0),
        0
      ),
    };

    if (aggregated.grossRevenue > 0) {
      aggregated.marginPercentage =
        ((aggregated.grossRevenue - aggregated.totalExpenses) /
          aggregated.grossRevenue) *
        100;
    }

    if (aggregated.transactionsCount > 0) {
      aggregated.averageTicket =
        aggregated.grossRevenue / aggregated.transactionsCount;
    }

    // Gerar análise via OpenAI
    const analysis = await generateAnalysis(
      userUnit.unitId,
      aggregated,
      'WEEKLY',
      {}
    );

    const analysisText = analysis.parsed
      ? `📝 *Análise:*\n${analysis.parsed.summary || analysis.content.substring(0, 300)}`
      : `📝 *Análise:*\n${analysis.content.substring(0, 300)}...`;

    const message =
      `📊 *Relatório Semanal - ${userUnit.unitName}*\n\n` +
      `📅 *Período:* ${lastMonday.toISOString().split('T')[0]} a ${lastSunday.toISOString().split('T')[0]}\n\n` +
      `💰 *Receita:* R$ ${aggregated.grossRevenue.toFixed(2)}\n` +
      `💸 *Despesas:* R$ ${aggregated.totalExpenses.toFixed(2)}\n` +
      `📈 *Margem:* ${aggregated.marginPercentage.toFixed(1)}%\n` +
      `🎫 *Ticket Médio:* R$ ${aggregated.averageTicket.toFixed(2)}\n` +
      `📦 *Transações:* ${aggregated.transactionsCount}\n\n` +
      analysisText;

    await sendTelegramMessage(message, { chatId, parseMode: 'Markdown' });
  } catch (error: any) {
    logger.error('Erro ao processar comando /semanal', {
      correlationId,
      unitId: userUnit.unitId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Comando /alertas - Lista alertas pendentes
 */
async function handleAlertasCommand(
  chatId: number,
  userUnit: { unitId: string; unitName: string },
  correlationId: string
): Promise<void> {
  try {
    const { data: alerts, error } = await alertsRepository.findByUnit(
      userUnit.unitId,
      'OPEN',
      10
    );

    if (error || !alerts || alerts.length === 0) {
      await sendTelegramMessage(
        `⚠️ *Alertas - ${userUnit.unitName}*\n\n` +
          `✅ Nenhum alerta pendente.`,
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    const severityEmoji: Record<string, string> = {
      LOW: 'ℹ️',
      MEDIUM: '⚠️',
      HIGH: '🔴',
      CRITICAL: '🚨',
    };

    let message = `⚠️ *Alertas Pendentes - ${userUnit.unitName}*\n\n`;

    alerts.forEach((alert, index) => {
      const emoji = severityEmoji[alert.severity] || '⚠️';
      const date = new Date(alert.created_at).toLocaleDateString('pt-BR');
      message += `${index + 1}. ${emoji} *${alert.alert_type}* (${alert.severity})\n`;
      message += `   ${alert.message}\n`;
      message += `   📅 ${date}\n\n`;
    });

    await sendTelegramMessage(message, { chatId, parseMode: 'Markdown' });
  } catch (error: any) {
    logger.error('Erro ao processar comando /alertas', {
      correlationId,
      unitId: userUnit.unitId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Comando /whatif - Gera simulação via OpenAI
 */
async function handleWhatIfCommand(
  chatId: number,
  userUnit: { unitId: string; unitName: string },
  scenario: string,
  correlationId: string
): Promise<void> {
  try {
    if (!scenario || scenario.trim().length === 0) {
      await sendTelegramMessage(
        '❌ Use: `/whatif <cenário>`\n\nExemplo: `/whatif aumentar preço em 10%`',
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    await sendTelegramMessage('⏳ Gerando simulação...', {
      chatId,
      parseMode: 'Markdown',
    });

    // Buscar métricas atuais (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    const { data: metrics } = await aiMetricsRepository.findByPeriod(
      userUnit.unitId,
      startDate,
      endDate
    );

    if (!metrics || metrics.length === 0) {
      await sendTelegramMessage(
        '❌ Nenhuma métrica encontrada para simulação.',
        {
          chatId,
          parseMode: 'Markdown',
        }
      );
      return;
    }

    // Calcular métricas atuais
    const current = {
      grossRevenue: metrics.reduce((sum, m) => sum + (m.gross_revenue || 0), 0),
      totalExpenses: metrics.reduce(
        (sum, m) => sum + (m.total_expenses || 0),
        0
      ),
      marginPercentage: 0,
      averageTicket: 0,
      transactionsCount: metrics.reduce(
        (sum, m) => sum + (m.revenues_count || 0),
        0
      ),
    };

    if (current.grossRevenue > 0) {
      current.marginPercentage =
        ((current.grossRevenue - current.totalExpenses) /
          current.grossRevenue) *
        100;
    }

    if (current.transactionsCount > 0) {
      current.averageTicket = current.grossRevenue / current.transactionsCount;
    }

    // Gerar simulação via OpenAI
    const simulation = await generateAnalysis(
      userUnit.unitId,
      current,
      'WHAT_IF',
      {
        scenario: scenario.trim(),
      }
    );

    const simData = simulation.parsed;

    if (!simData) {
      await sendTelegramMessage(
        `📊 *Simulação: ${scenario}*\n\n` +
          `❌ Erro ao gerar simulação. Tente novamente.`,
        { chatId, parseMode: 'Markdown' }
      );
      return;
    }

    const message =
      `📊 *Simulação: ${scenario}*\n\n` +
      `💰 *Receita Projetada:* R$ ${simData.projectedMetrics?.grossRevenue?.toFixed(2) || 'N/A'}\n` +
      `📈 *Margem Projetada:* ${simData.projectedMetrics?.marginPercentage?.toFixed(1) || 'N/A'}%\n` +
      `📊 *Mudança na Receita:* ${simData.changes?.revenueChange > 0 ? '+' : ''}${simData.changes?.revenueChange?.toFixed(1) || 'N/A'}%\n` +
      `📈 *Mudança na Margem:* ${simData.changes?.marginChange > 0 ? '+' : ''}${simData.changes?.marginChange?.toFixed(1) || 'N/A'} pontos\n\n` +
      `💡 *Recomendação:*\n${simData.recommendation || 'Consulte um especialista.'}\n\n` +
      (simData.risks && simData.risks.length > 0
        ? `⚠️ *Riscos:*\n${simData.risks.map((r: string) => `• ${r}`).join('\n')}\n\n`
        : '');

    await sendTelegramMessage(message, { chatId, parseMode: 'Markdown' });
  } catch (error: any) {
    logger.error('Erro ao processar comando /whatif', {
      correlationId,
      unitId: userUnit.unitId,
      scenario,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Comando /help - Mostra ajuda
 */
async function handleHelpCommand(chatId: number): Promise<void> {
  const message =
    `🤖 *Comandos Disponíveis*\n\n` +
    `/status - Ver saúde financeira atual da unidade\n` +
    `/semanal - Relatório semanal completo com análise IA\n` +
    `/alertas - Listar alertas pendentes\n` +
    `/whatif <cenário> - Simular cenário financeiro\n` +
    `   Exemplo: /whatif aumentar preço em 10%\n` +
    `/help - Ver esta ajuda\n\n` +
    `💡 Use os comandos para acompanhar sua unidade!`;

  await sendTelegramMessage(message, { chatId, parseMode: 'Markdown' });
}
