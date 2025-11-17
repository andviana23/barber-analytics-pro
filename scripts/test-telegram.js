#!/usr/bin/env node

/**
 * 🧪 Script de Teste - Enviar Notificação no Telegram
 *
 * Uso: node scripts/test-telegram.js
 *
 * Testa a integração com o Telegram Bot enviando uma mensagem de teste
 * para a unidade Mangabeiras (configurada no banco)
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('🧪 Teste de Envio de Notificação Telegram\n');
console.log('📋 Configuração:');
console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN?.substring(0, 20)}...`);
console.log(`   Chat ID: ${TELEGRAM_CHAT_ID}`);
console.log('');

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error(
    '❌ ERRO: Variáveis TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configuradas'
  );
  process.exit(1);
}

/**
 * Enviar mensagem para o Telegram
 */
function sendTelegramMessage(message, parseMode = 'HTML') {
  return new Promise((resolve, reject) => {
    // Debug: Log message being sent
    console.log(`[DEBUG] Enviando mensagem (${message.length} caracteres):`);
    console.log(`[DEBUG] Primeiros 100 chars: ${message.substring(0, 100)}`);
    console.log(
      `[DEBUG] Últimos 100 chars: ${message.substring(message.length - 100)}`
    );

    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    };

    // Só adicionar parse_mode se não for string vazia
    if (parseMode && parseMode.trim() !== '') {
      payload.parse_mode = parseMode;
    }

    const data = JSON.stringify(payload);

    console.log(`[DEBUG] Payload JSON (${data.length} bytes)`);

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
          // Debug: Log raw response
          if (!body) {
            reject(new Error('Empty response from Telegram API'));
            return;
          }

          // If response starts with HTML, it's an error
          if (body.startsWith('<')) {
            reject(
              new Error(
                `HTTP Error: ${res.statusCode} - ${body.substring(0, 100)}`
              )
            );
            return;
          }

          const response = JSON.parse(body);

          if (response.ok) {
            resolve({
              success: true,
              messageId: response.result.message_id,
              response,
            });
          } else {
            reject(new Error(`Telegram API Error: ${response.description}`));
          }
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
 * Enviar teste de saúde
 */
async function testHealthCheck() {
  const message = `🏥 <b>TESTE DE SAÚDE - BARBER ANALYTICS PRO</b>

✅ Sistema está funcionando corretamente!

📊 <b>Detalhes:</b>
- Data/Hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
- Versão: 2.0.0 (VPS)
- Status: Operacional
- Timezone: BRT (America/Sao_Paulo)

🔗 Endpoint: /api/cron/health-check
🎯 Unidade: Mangabeiras`;

  console.log('📤 Enviando teste de saúde...\n');

  try {
    const result = await sendTelegramMessage(message);
    console.log('✅ Mensagem enviada com sucesso!');
    console.log(`   ID da mensagem: ${result.messageId}`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:');
    console.error(`   ${error.message}`);
    return false;
  }
}

/**
 * Enviar teste de relatório diário
 */
async function testDailyReport() {
  const date = new Date();
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);

  const message = `RELATORIO DIARIO

Unidade: Mangabeiras
Data: ${yesterday.toLocaleDateString('pt-BR')}

Receitas: R$ 2830,50
Despesas: R$ 1780,00
Lucro: R$ 1050,50

Sistema: app.tratodebarbados.com`;

  console.log('📤 Enviando teste de relatório diário...\n');

  try {
    const result = await sendTelegramMessage(message, '');
    console.log('✅ Relatório enviado com sucesso!');
    console.log(`   ID da mensagem: ${result.messageId}`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar relatório:');
    console.error(`   ${error.message}`);
    return false;
  }
}

/**
 * Enviar teste de alerta crítico
 */
async function testCriticalAlert() {
  const message = `🚨 ALERTA CRÍTICO - TESTE

⚠️ Saldo em Conta Baixo

🏢 Mangabeiras
💳 Conta Principal
� Saldo: R$ 245,50

⚡ Ação recomendada:
- Realizar depósito urgente
- Verificar despesas pendentes
- Contatar gerente

📞 Suporte: (31) 9999-9999
⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

  console.log('📤 Enviando teste de alerta crítico...\n');

  try {
    // Tentar sem HTML parsing
    const result = await sendTelegramMessage(message, 'Markdown');
    console.log('✅ Alerta enviado com sucesso!');
    console.log(`   ID da mensagem: ${result.messageId}`);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar alerta:');
    console.error(`   ${error.message}`);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('🔄 Iniciando testes de notificação...\n');
  console.log('='.repeat(60));

  const results = [];

  // Teste 1: Health Check
  console.log('\n[1/3] Health Check\n');
  results.push(await testHealthCheck());

  // Teste 2: Relatório Diário
  console.log('[2/3] Relatório Diário\n');
  results.push(await testDailyReport());

  // Teste 3: Alerta Crítico
  console.log('[3/3] Alerta Crítico\n');
  results.push(await testCriticalAlert());

  // Resumo
  console.log('='.repeat(60));
  console.log('\n📊 RESUMO DOS TESTES:\n');

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`✅ Testes passaram: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 Todos os testes foram bem-sucedidos!');
    console.log('   O Telegram está funcionando corretamente.');
    console.log('   Os cron jobs poderão enviar notificações normalmente.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Alguns testes falharam!');
    console.log('   Verifique a configuração do Telegram Bot.\n');
    process.exit(1);
  }
}

// Executar testes
runAllTests().catch(error => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});
