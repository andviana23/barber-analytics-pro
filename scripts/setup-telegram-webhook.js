#!/usr/bin/env node

/**
 * 🔧 SCRIPT: Configurar Webhook do Telegram
 *
 * Configura o webhook do Telegram Bot para receber comandos
 *
 * Uso:
 *   node scripts/setup-telegram-webhook.js
 *
 * @author Andrey Viana
 * @date 2025-11-13
 */

import https from 'https';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://app.tratodebarbados.com';
const WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');

console.log('🔧 Configurando Webhook do Telegram Bot\n');
console.log('📋 Configuração:');
console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN?.substring(0, 20)}...`);
console.log(`   Webhook URL: ${WEBHOOK_URL}/api/telegram/webhook`);
console.log(`   Webhook Secret: ${WEBHOOK_SECRET.substring(0, 20)}...\n`);

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
  process.exit(1);
}

/**
 * Configurar webhook no Telegram
 */
async function setWebhook() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;

    const data = JSON.stringify({
      url: `${WEBHOOK_URL}/api/telegram/webhook`,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = https.request(url, options, res => {
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
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Obter informações do webhook atual
 */
async function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`;

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
 * Deletar webhook (para testar localmente com polling)
 */
async function deleteWebhook() {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`;

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
 * Main
 */
async function main() {
  try {
    console.log('🔄 1. Verificando webhook atual...\n');

    const currentInfo = await getWebhookInfo();

    if (currentInfo.ok && currentInfo.result.url) {
      console.log('📍 Webhook atual:');
      console.log(`   URL: ${currentInfo.result.url}`);
      console.log(
        `   Pending: ${currentInfo.result.pending_update_count} updates`
      );

      if (currentInfo.result.last_error_date) {
        console.log(
          `   ⚠️ Last error: ${currentInfo.result.last_error_message}`
        );
      }
      console.log('');
    } else {
      console.log('ℹ️  Nenhum webhook configurado\n');
    }

    console.log('🔄 2. Configurando novo webhook...\n');

    const result = await setWebhook();

    if (result.ok) {
      console.log('✅ Webhook configurado com sucesso!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 INFORMAÇÕES IMPORTANTES\n');
      console.log('1️⃣ Webhook URL configurada:');
      console.log(`   ${WEBHOOK_URL}/api/telegram/webhook\n`);
      console.log('2️⃣ Adicione esta variável no .env (se ainda não tiver):');
      console.log(`   TELEGRAM_WEBHOOK_SECRET=${WEBHOOK_SECRET}\n`);
      console.log('3️⃣ No Vercel/VPS, configure a variável de ambiente:');
      console.log(`   TELEGRAM_WEBHOOK_SECRET=${WEBHOOK_SECRET}\n`);
      console.log('4️⃣ Teste enviando um comando no Telegram:');
      console.log('   /status\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Verificar webhook configurado
      console.log('🔄 3. Verificando webhook configurado...\n');

      const newInfo = await getWebhookInfo();

      if (newInfo.ok) {
        console.log('✅ Webhook ativo:');
        console.log(`   URL: ${newInfo.result.url}`);
        console.log(
          `   Allowed updates: ${newInfo.result.allowed_updates?.join(', ') || 'all'}`
        );
        console.log(
          `   Max connections: ${newInfo.result.max_connections || 40}`
        );
        console.log('');
      }

      console.log(
        '✅ Configuração completa! Agora você pode usar os comandos do Telegram.\n'
      );
    } else {
      console.error('❌ Erro ao configurar webhook:');
      console.error(`   ${result.description || 'Erro desconhecido'}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
