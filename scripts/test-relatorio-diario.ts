#!/usr/bin/env tsx
/**
 * 🧪 Script de Teste: Relatório Diário
 *
 * Testa a geração e envio do relatório diário via Telegram
 * Simula exatamente o que o cron job fará às 21h
 *
 * Uso:
 *   pnpm tsx scripts/test-relatorio-diario.ts
 *
 * @author Andrey Viana
 * @since 2025-11-11
 */

import 'dotenv/config';
import { getDailyRevenues } from '../lib/services/revenueCategorizationService';
import { compareWithLastWeek } from '../lib/services/revenueComparison';
import { calculateAllGoalsProgress } from '../lib/services/goalTracking';
import {
  detectPatterns,
  generateLearnedInsights,
  saveDailyReport,
  DailyReportData,
} from '../lib/services/reportLearning';
import { getUnitsWithTelegram } from '../lib/services/unitTelegramConfig';
import { sendTelegramMessage } from '../lib/telegram';
import { logger } from '../lib/logger';

// ============================================================================
// Formatação da mensagem (mesma do cron job)
// ============================================================================

function formatTelegramMessage(
  unitName: string,
  date: Date,
  reportData: DailyReportData
): string {
  const { revenue, comparison, goals } = reportData;

  const message = `
📊 *RELATÓRIO DIÁRIO - ${unitName}*
_${date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}_

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

_Relatório de teste gerado em ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}_
  `.trim();

  return message;
}

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

// ============================================================================
// Função principal de teste
// ============================================================================

async function testDailyReport() {
  console.log('\n🧪 ============================================');
  console.log('    TESTE: Relatório Diário via Telegram');
  console.log('============================================\n');

  const startTime = Date.now();

  try {
    // 1. Buscar unidades com Telegram habilitado
    console.log('📋 1. Buscando unidades com Telegram habilitado...');
    const units = await getUnitsWithTelegram();

    if (!units || units.length === 0) {
      console.log('⚠️  Nenhuma unidade com Telegram habilitado encontrada');
      console.log('\n💡 Para habilitar o Telegram em uma unidade, execute:');
      console.log(`
UPDATE units
SET
  telegram_bot_token = 'SEU_BOT_TOKEN',
  telegram_chat_id = 'SEU_CHAT_ID',
  telegram_enabled = true
WHERE name = 'NOME_DA_UNIDADE';
      `);
      return;
    }

    console.log(`✅ ${units.length} unidade(s) encontrada(s)\n`);

    const today = new Date();
    const results = [];

    // 2. Processar cada unidade
    for (const unit of units) {
      console.log(`\n📊 Processando: ${unit.unitName}`);
      console.log('─'.repeat(50));

      try {
        // Validar configuração do Telegram
        if (!unit.botToken || !unit.chatId) {
          console.log(
            `   ⚠️  Telegram não configurado corretamente para ${unit.unitName}`
          );
          continue;
        }

        // 2.1. Buscar receitas do dia
        console.log('   💰 Buscando receitas do dia...');
        const revenue = await getDailyRevenues(unit.unitId, today);
        console.log(`      ✓ Total: ${formatCurrency(revenue.total)}`);
        console.log(
          `      ✓ Assinaturas: ${formatCurrency(revenue.subscriptions)}`
        );
        console.log(`      ✓ Produtos: ${formatCurrency(revenue.products)}`);
        console.log(`      ✓ Avulso: ${formatCurrency(revenue.walkIns)}`);

        // 2.2. Comparar com semana anterior
        console.log('\n   📈 Comparando com semana anterior...');
        const comparison = await compareWithLastWeek(unit.unitId, today);
        console.log(
          `      ✓ Semana passada: ${formatCurrency(comparison.previous.total)}`
        );
        console.log(
          `      ✓ Variação: ${comparison.percentChange >= 0 ? '+' : ''}${comparison.percentChange.toFixed(1)}%`
        );
        console.log(`      ✓ Tendência: ${comparison.trend}`);

        // 2.3. Calcular progresso das metas
        console.log('\n   🎯 Calculando progresso das metas...');
        const goals = await calculateAllGoalsProgress(
          unit.unitId,
          today.getFullYear(),
          today.getMonth() + 1
        );

        if (goals.monthlyRevenue) {
          console.log(
            `      ✓ Meta mensal: ${goals.monthlyRevenue.percentComplete.toFixed(1)}%`
          );
          console.log(`      ✓ Status: ${goals.monthlyRevenue.status}`);
        } else {
          console.log('      ⚠️  Sem meta mensal cadastrada');
        }

        // 2.4. Detectar padrões
        console.log('\n   📊 Detectando padrões...');
        const patterns = await detectPatterns(unit.unitId);
        console.log(`      ✓ ${patterns.length} padrão(ões) detectado(s)`);
        patterns.forEach(p => {
          console.log(
            `        • ${p.pattern_type}: ${p.description} (${(p.confidence * 100).toFixed(0)}%)`
          );
        });

        // 2.5. Gerar insights com IA
        console.log('\n   🧠 Gerando insights com IA...');
        const reportData: DailyReportData = {
          date: today.toISOString().split('T')[0],
          unit_id: unit.unitId,
          revenue,
          comparison,
          goals,
          insights: [],
          patterns: patterns.map(p => p.description),
        };

        const insights = await generateLearnedInsights(
          unit.unitId,
          reportData,
          patterns
        );
        reportData.insights = insights;
        console.log(`      ✓ ${insights.length} insight(s) gerado(s)`);
        insights.forEach((insight, i) => {
          console.log(`        ${i + 1}. ${insight}`);
        });

        // 2.6. Formatar mensagem
        console.log('\n   📝 Formatando mensagem...');
        const message = formatTelegramMessage(unit.unitName, today, reportData);
        console.log('      ✓ Mensagem formatada\n');

        // Exibir prévia da mensagem
        console.log('┌─────────────────────────────────────────────────┐');
        console.log('│           PRÉVIA DA MENSAGEM TELEGRAM           │');
        console.log('└─────────────────────────────────────────────────┘\n');
        console.log(message);
        console.log('\n┌─────────────────────────────────────────────────┐');
        console.log('│                  FIM DA PRÉVIA                  │');
        console.log('└─────────────────────────────────────────────────┘\n');

        // 2.7. Enviar via Telegram usando credenciais da unidade
        console.log('   📱 Enviando para Telegram...');
        await sendTelegramMessage(message, {
          botToken: unit.botToken,
          chatId: unit.chatId,
          parseMode: 'Markdown',
        });
        console.log('      ✓ Mensagem enviada com sucesso!');

        // 2.8. Salvar histórico
        console.log('\n   💾 Salvando histórico...');
        await saveDailyReport(reportData);
        console.log('      ✓ Histórico salvo');

        results.push({
          unit_id: unit.unitId,
          unit_name: unit.unitName,
          revenue: revenue.total,
          sent: true,
          timestamp: new Date().toISOString(),
        });

        console.log(`\n✅ Relatório enviado para ${unit.unitName}`);
      } catch (unitError: any) {
        console.error(
          `\n❌ Erro ao processar ${unit.unitName}:`,
          unitError.message
        );
        results.push({
          unit_id: unit.unitId,
          unit_name: unit.unitName,
          revenue: 0,
          sent: false,
          error: unitError.message,
        });
      }
    }

    // 3. Resumo final
    const duration = Date.now() - startTime;
    const sent = results.filter(r => r.sent).length;
    const failed = results.filter(r => !r.sent).length;

    console.log('\n\n🎯 ============================================');
    console.log('              RESUMO DO TESTE');
    console.log('============================================\n');
    console.log(`✅ Enviados com sucesso: ${sent}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`⏱️  Tempo total: ${(duration / 1000).toFixed(2)}s`);
    console.log('\n============================================\n');

    // Detalhes dos resultados
    console.log('📋 Detalhes:\n');
    results.forEach(r => {
      if (r.sent) {
        console.log(`✅ ${r.unit_name}: ${formatCurrency(r.revenue)}`);
      } else {
        console.log(`❌ ${r.unit_name}: ${r.error}`);
      }
    });

    console.log('\n✅ Teste concluído! Verifique o Telegram.\n');
  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================================================
// Executar teste
// ============================================================================

testDailyReport()
  .then(() => {
    console.log('👋 Encerrando...\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro não tratado:', error);
    process.exit(1);
  });
