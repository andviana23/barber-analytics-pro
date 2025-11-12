/**
 * 🧪 SCRIPT DE TESTE - Relatório Telegram
 *
 * Testa o envio de relatório diário para o Telegram
 * usando dados do DIA ANTERIOR (D-1)
 *
 * Uso:
 * ```bash
 * npx tsx scripts/test-telegram-report.ts
 * ```
 *
 * @author Andrey Viana
 * @date 2025-11-12
 */

import 'dotenv/config';

// Configuração do Telegram (Mangabeiras)
const TELEGRAM_BOT_TOKEN = '8573847906:AAEZJVhpfGcpiLJs8lkerUM51f_haXF_G10';
const TELEGRAM_CHAT_ID = '6799154772';

/**
 * Envia mensagem para o Telegram
 */
async function sendTelegramMessage(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }

  return data;
}

/**
 * Gera relatório de teste
 */
function generateTestReport() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const reportDate = yesterday.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const message = `
📊 *TESTE - RELATÓRIO DIÁRIO - Mangabeiras*
_${reportDate}_

━━━━━━━━━━━━━━━━━━

💰 *FATURAMENTO DO DIA*
• 💳 Assinaturas: R$ 1.500,00
• 🛍️ Produtos: R$ 850,00
• ✂️ Avulso: R$ 2.300,00

━━━━━━━━━━━━━━━━━━
*💵 TOTAL: R$ 4.650,00*

━━━━━━━━━━━━━━━━━━

📈 *COMPARATIVO SEMANAL*
Semana passada: R$ 4.200,00
Variação: +10.7%
📈 Crescimento!

━━━━━━━━━━━━━━━━━━

🎯 *PROGRESSO DAS METAS*

*Receita Mensal*
✅ Meta: R$ 45.000,00
   Atual: R$ 28.500,00 (63.3%)
   Falta: R$ 16.500,00
   Por dia: R$ 1.100,00 (15 dias)

*Assinaturas*
   75.0% - R$ 15.000,00/R$ 20.000,00

*Produtos*
   42.5% - R$ 8.500,00/R$ 20.000,00

━━━━━━━━━━━━━━━━━━

🧠 *INSIGHTS DA IA (ApoIA)*
1. Excelente desempenho em serviços avulsos (+15% vs. média)
2. Produtos abaixo da meta - considere promoções
3. Assinaturas estáveis - oportunidade de upsell
4. Quinta-feira foi o dia mais forte da semana

━━━━━━━━━━━━━━━━━━

📊 *Padrões Detectados*
• Pico de faturamento entre 14h-18h
• Produtos mais vendidos: Pomadas e Óleos
• 3 clientes novos captados via indicação

━━━━━━━━━━━━━━━━━━

⚠️ *ESTE É UM TESTE AUTOMÁTICO*
_Relatório gerado automaticamente às ${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}_
  `.trim();

  return message;
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando teste de envio para Telegram...\n');

    // Gerar relatório
    console.log('📝 Gerando relatório de teste...');
    const message = generateTestReport();

    // Enviar para Telegram
    console.log('📤 Enviando para Telegram...');
    const result = await sendTelegramMessage(message);

    console.log('\n✅ Mensagem enviada com sucesso!');
    console.log('📱 Chat ID:', TELEGRAM_CHAT_ID);
    console.log('🤖 Bot Token:', TELEGRAM_BOT_TOKEN.substring(0, 20) + '...');
    console.log('📊 Message ID:', result.result.message_id);
    console.log('\n💡 Verifique seu Telegram para confirmar o recebimento!');
  } catch (error: any) {
    console.error('\n❌ Erro ao enviar mensagem:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar
main();
