/**
 * 📊 Cron Job: Relatório Diário de Receitas
 *
 * Schedule: Todos os dias às 21:00 (9 PM)
 * Vercel Cron: 0 21 * * *
 *
 * Funcionalidades:
 * - Categoriza receitas (assinaturas, produtos, avulso)
 * - Compara com semana anterior
 * - Calcula progresso das metas
 * - Detecta padrões comportamentais
 * - Gera insights com IA (ApoIA)
 * - Envia via Telegram formatado em Markdown
 *
 * @module api/cron/relatorio-diario
 * @author Andrey Viana
 * @since 2025-11-11
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/middleware/cronAuth';
import { getDailyRevenues } from '@/lib/services/revenueCategorizationService';
import { compareWithLastWeek } from '@/lib/services/revenueComparison';
import { calculateAllGoalsProgress } from '@/lib/services/goalTracking';
import {
  detectPatterns,
  generateLearnedInsights,
  saveDailyReport,
  DailyReportData,
} from '@/lib/services/reportLearning';
import { getUnitsWithTelegram } from '@/lib/services/unitTelegramConfig';
import { sendTelegramMessage } from '@/lib/telegram';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos

export async function GET(request: NextRequest) {
  const correlationId = `daily-report-${Date.now()}`;

  try {
    logger.info('🚀 Iniciando geração de relatórios diários', {
      correlationId,
    });

    // 1. Verificar autenticação do cron
    if (!verifyCronAuth(request)) {
      logger.warn('Tentativa de acesso não autorizado ao cron', {
        correlationId,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Buscar todas as unidades com Telegram habilitado
    const units = await getUnitsWithTelegram();

    if (!units || units.length === 0) {
      logger.info('Nenhuma unidade com Telegram habilitado encontrada', {
        correlationId,
      });
      return NextResponse.json({
        success: true,
        message: 'No units with Telegram enabled',
        reports_sent: 0,
      });
    }

    const results = [];
    // ⚠️ IMPORTANTE: Buscar dados do DIA ANTERIOR (D-1)
    // Motivo: Cron roda às 21:00, mas queremos dados do dia que já fechou
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const reportDate = yesterday; // Data para o relatório (dia anterior)

    // 3. Gerar relatório para cada unidade
    for (const unit of units) {
      try {
        logger.info(`Gerando relatório para unidade: ${unit.unitName}`, {
          unitId: unit.unitId,
          reportDate: reportDate.toISOString().split('T')[0],
        });

        // Validar configuração do Telegram
        if (!unit.botToken || !unit.chatId) {
          logger.warn(
            `Unidade ${unit.unitName} sem Telegram configurado corretamente`,
            { unitId: unit.unitId }
          );
          continue;
        }

        // 3.1. Buscar receitas do DIA ANTERIOR
        const revenue = await getDailyRevenues(unit.unitId, reportDate);

        // 3.2. Comparar com semana anterior (baseado no dia anterior)
        const comparison = await compareWithLastWeek(unit.unitId, reportDate);

        // 3.3. Calcular progresso das metas (mês do dia anterior)
        const goals = await calculateAllGoalsProgress(
          unit.unitId,
          reportDate.getFullYear(),
          reportDate.getMonth() + 1
        );

        // 3.4. Detectar padrões
        const patterns = await detectPatterns(unit.unitId);

        // 3.5. Gerar insights com IA
        const reportData: DailyReportData = {
          date: reportDate.toISOString().split('T')[0], // Data do dia anterior
          unit_id: unit.unitId,
          revenue,
          comparison,
          goals,
          insights: [],
          patterns: patterns.map((p: any) => p.description),
        };

        const insights = await generateLearnedInsights(
          unit.unitId,
          reportData,
          patterns
        );
        reportData.insights = insights;

        // 3.6. Formatar mensagem Telegram (passando data do relatório)
        const message = formatTelegramMessage(unit.unitName, reportDate, reportData);

        // 3.7. Enviar via Telegram usando credenciais da unidade
        await sendTelegramMessage(message, {
          botToken: unit.botToken,
          chatId: unit.chatId,
          parseMode: 'Markdown',
        });

        // 3.8. Salvar histórico
        await saveDailyReport(reportData);

        results.push({
          unit_id: unit.unitId,
          unit_name: unit.unitName,
          revenue: revenue.total,
          sent: true,
          timestamp: new Date().toISOString(),
        });

        logger.info(`✅ Relatório enviado para ${unit.unitName}`, {
          unitId: unit.unitId,
          revenue: revenue.total,
        });
      } catch (unitError: any) {
        logger.error(`Erro ao processar unidade ${unit.unitName}`, {
          unitId: unit.unitId,
          error: unitError.message,
        });

        results.push({
          unit_id: unit.unitId,
          unit_name: unit.unitName,
          revenue: 0,
          sent: false,
          error: unitError.message,
        });
      }
    }

    logger.info('✅ Relatórios diários finalizados', {
      correlationId,
      total_units: units.length,
      sent: results.filter(r => r.sent).length,
      failed: results.filter(r => !r.sent).length,
    });

    return NextResponse.json({
      success: true,
      correlationId,
      timestamp: new Date().toISOString(),
      reports_sent: results.filter(r => r.sent).length,
      reports_failed: results.filter(r => !r.sent).length,
      results,
    });
  } catch (error: any) {
    logger.error('Erro fatal ao gerar relatórios diários', {
      correlationId,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        correlationId,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Formata mensagem do relatório para Telegram
 * @param unitName Nome da unidade
 * @param reportDate Data do relatório (DIA ANTERIOR)
 * @param reportData Dados consolidados
 */
function formatTelegramMessage(
  unitName: string,
  reportDate: Date,
  reportData: DailyReportData
): string {
  const { revenue, comparison, goals } = reportData;

  const message = `
📊 *RELATÓRIO DIÁRIO - ${unitName}*
_${reportDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}_

━━━━━━━━━━━━━━━━━━

💰 *FATURAMENTO DO DIA*
• 💳 Assinaturas: ${formatCurrency(revenue.subscriptions)}
• 🛍️ Produtos: ${formatCurrency(revenue.products)}
• ✂️ Avulso: ${formatCurrency(revenue.walkIns)}

━━━━━━━━━━━━━━━━━━
*💵 TOTAL: ${formatCurrency(revenue.total)}*

━━━━━━━━━━━━━━━━━━

📈 *COMPARATIVO SEMANAL*
Semana passada: ${formatCurrency(comparison.previous.total)}
Variação: ${comparison.percentChange >= 0 ? '+' : ''}${comparison.percentChange.toFixed(1)}%
${getTrendEmoji(comparison.trend)} ${getTrendText(comparison.trend)}

━━━━━━━━━━━━━━━━━━

🎯 *PROGRESSO DAS METAS*
${formatGoalsProgress(goals)}

━━━━━━━━━━━━━━━━━━

🧠 *INSIGHTS DA IA (ApoIA)*
${
  reportData.insights.length > 0
    ? reportData.insights
        .map((insight: string, i: number) => `${i + 1}. ${insight}`)
        .join('\n')
    : '_Sem insights disponíveis hoje_'
}

━━━━━━━━━━━━━━━━━━

${reportData.patterns.length > 0 ? `📊 *Padrões Detectados*\n${reportData.patterns.map((p: string) => `• ${p}`).join('\n')}\n\n━━━━━━━━━━━━━━━━━━\n\n` : ''}

_Relatório gerado automaticamente às ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}_
  `.trim();

  return message;
}

/**
 * Formata progresso das metas
 */
function formatGoalsProgress(goals: any): string {
  const parts: string[] = [];

  if (goals.monthlyRevenue) {
    const goal = goals.monthlyRevenue;
    const statusEmoji = getGoalStatusEmoji(goal.status);

    parts.push(`*Receita Mensal*`);
    parts.push(`${statusEmoji} Meta: ${formatCurrency(goal.targetValue)}`);
    parts.push(
      `   Atual: ${formatCurrency(goal.currentProgress)} (${goal.percentComplete.toFixed(1)}%)`
    );
    parts.push(`   Falta: ${formatCurrency(goal.gap)}`);
    parts.push(
      `   Por dia: ${formatCurrency(goal.dailyRequired)} (${goal.daysRemaining} dias)`
    );
    parts.push('');
  }

  if (goals.subscriptions && goals.subscriptions.targetValue > 0) {
    const goal = goals.subscriptions;
    parts.push(`*Assinaturas*`);
    parts.push(
      `   ${goal.percentComplete.toFixed(1)}% - ${formatCurrency(goal.currentProgress)}/${formatCurrency(goal.targetValue)}`
    );
    parts.push('');
  }

  if (goals.products && goals.products.targetValue > 0) {
    const goal = goals.products;
    parts.push(`*Produtos*`);
    parts.push(
      `   ${goal.percentComplete.toFixed(1)}% - ${formatCurrency(goal.currentProgress)}/${formatCurrency(goal.targetValue)}`
    );
  }

  return parts.join('\n') || '_Sem metas cadastradas_';
}

/**
 * Emoji baseado na tendência
 */
function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
}

/**
 * Texto baseado na tendência
 */
function getTrendText(trend: string): string {
  switch (trend) {
    case 'up':
      return 'Crescimento!';
    case 'down':
      return 'Queda';
    default:
      return 'Estável';
  }
}

/**
 * Emoji baseado no status da meta
 */
function getGoalStatusEmoji(status: string): string {
  switch (status) {
    case 'ahead':
      return '🎉';
    case 'on_track':
      return '✅';
    case 'behind':
      return '⚠️';
    case 'at_risk':
      return '🚨';
    default:
      return '📊';
  }
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}
