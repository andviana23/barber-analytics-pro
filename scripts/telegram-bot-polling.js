#!/usr/bin/env node

/**
 * 🤖 BOT TELEGRAM - Modo Polling (Desenvolvimento)
 *
 * Escuta comandos do Telegram sem precisar de webhook
 * Ideal para testes locais
 *
 * Uso:
 *   node scripts/telegram-bot-polling.js
 *
 * Comandos disponíveis:
 *   /status   - Status financeiro
 *   /semanal  - Relatório semanal
 *   /alertas  - Alertas abertos
 *   /whatif   - Simular cenários
 *   /help     - Ajuda
 *
 * @author Andrey Viana
 * @date 2025-11-13
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const POLLING_INTERVAL = 2000; // 2 segundos
let lastUpdateId = 0;

console.log('🤖 Telegram Bot - Modo Polling\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Bot Token:', TELEGRAM_BOT_TOKEN?.substring(0, 20) + '...');
console.log('⏱️  Intervalo:', POLLING_INTERVAL + 'ms');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado');
  process.exit(1);
}

/**
 * Buscar atualizações do Telegram
 */
async function getUpdates(offset = 0) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;

    https
      .get(url, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      })
      .on('error', error => {
        reject(error);
      });
  });
}

/**
 * Enviar mensagem
 */
async function sendMessage(chatId, text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, res => {
      let body = '';

      res.on('data', chunk => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);

          // Log detalhado
          console.log(`   📤 Status: ${res.statusCode}`);
          console.log(`   📤 Chat ID: ${chatId}`);

          if (response.ok) {
            console.log(`   ✅ Message ID: ${response.result.message_id}`);
          } else {
            console.log(`   ❌ Erro: ${response.description}`);
          }

          resolve(response);
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Processar comando
 */
async function handleCommand(chatId, username, command) {
  console.log(`📨 Comando recebido de @${username}: ${command}`);

  let response = '';

  const [cmd, ...args] = command.split(' ');

  switch (cmd.toLowerCase()) {
    case '/status':
      response = `📊 *Status Financeiro - DEMO*

💰 Receita (30 dias): R$ 15.450,00
💸 Despesas (30 dias): R$ 8.200,00
📈 Margem: 46.9%
🎫 Ticket Médio: R$ 125,50
📦 Transações: 123
📊 Tendência: 📈 CRESCENDO

⚠️ Alertas Abertos: 2

⏰ ${new Date().toLocaleString('pt-BR')}

_Dados de demonstração_
_Para dados reais, configure o webhook em produção_`;
      break;

    case '/semanal':
      response = `📊 *Relatório Semanal - DEMO*

📅 Período: 04/11 a 10/11/2025

💰 Receita: R$ 8.500,00
💸 Despesas: R$ 4.200,00
📈 Margem: 50.6%
🎫 Ticket Médio: R$ 142,00

🧠 *Análise da IA:*
• Semana com bom desempenho
• Margem acima da média
• Recomenda manter estratégia

_Dados de demonstração_`;
      break;

    case '/alertas':
      response = `⚠️ *Alertas - DEMO*

1. 🔴 Saldo baixo em conta principal
   12/11/2025 14:30

2. ⚠️ 3 despesas vencidas não pagas
   10/11/2025 09:15

_Dados de demonstração_`;
      break;

    case '/whatif':
      const scenario = args.join(' ') || 'aumentar preço em 10%';
      response = `🔮 *Simulação - DEMO*

💡 Cenário: "${scenario}"

📊 Métricas Atuais:
• Receita: R$ 15.000,00/mês
• Ticket médio: R$ 120,00

📈 Projeção:
• Nova receita: R$ 16.500,00/mês (+10%)
• Novo ticket: R$ 132,00
• Impacto margem: +4.2%

🧠 *Análise da IA:*
Cenário positivo com riscos moderados.
Recomenda teste gradual.

_Dados de demonstração_`;
      break;

    case '/help':
    case '/start':
      response = `🤖 *Comandos Disponíveis*

/status - Ver saúde financeira atual
/semanal - Relatório semanal completo
/alertas - Listar alertas pendentes
/whatif <cenário> - Simular cenário
   Exemplo: /whatif aumentar preço 10%
/help - Ver esta ajuda

💡 Use os comandos para acompanhar sua unidade!

⚠️ *MODO DESENVOLVIMENTO*
Você está usando o bot em modo polling (desenvolvimento).
Para dados reais em produção, configure o webhook.`;
      break;

    default:
      response = `❓ Comando desconhecido: ${cmd}

Use /help para ver os comandos disponíveis.`;
  }

  await sendMessage(chatId, response);
  console.log(`✅ Resposta enviada\n`);
}

/**
 * Loop principal
 */
async function poll() {
  try {
    const result = await getUpdates(lastUpdateId + 1);

    if (result.ok && result.result.length > 0) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;

        const message = update.message;
        if (!message) continue;

        const chatId = message.chat.id;
        const username = message.from.username || message.from.first_name;
        const text = message.text;

        if (text && text.startsWith('/')) {
          await handleCommand(chatId, username, text);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }

  // Próxima iteração
  setTimeout(poll, POLLING_INTERVAL);
}

/**
 * Iniciar bot
 */
async function start() {
  console.log('✅ Bot iniciado e aguardando comandos...');
  console.log('📱 Vá no Telegram e envie: /status\n');
  console.log('Press Ctrl+C to stop\n');

  poll();
}

// Iniciar
start();
