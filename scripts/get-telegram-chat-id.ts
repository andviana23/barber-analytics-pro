#!/usr/bin/env tsx

/**
 * Get Telegram Chat ID
 * --------------------
 * Script para descobrir o Chat ID do Telegram
 *
 * Como usar:
 * 1. Execute este script
 * 2. Envie qualquer mensagem para o bot no Telegram
 * 3. O script mostrará o seu Chat ID
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

async function getChatId() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  console.log('🤖 Buscando atualizações do Telegram Bot...\n');
  console.log('📱 Envie qualquer mensagem para o bot agora!\n');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Erro desconhecido');
    }

    if (data.result.length === 0) {
      console.log('⚠️  Nenhuma mensagem encontrada!');
      console.log('\n📋 Instruções:');
      console.log('  1. Abra o Telegram');
      console.log(
        '  2. Procure pelo seu bot (verifique o username no @BotFather)'
      );
      console.log('  3. Envie /start ou qualquer mensagem');
      console.log('  4. Execute este script novamente');
      process.exit(0);
    }

    console.log('✅ Mensagens encontradas!\n');
    console.log('📋 Chat IDs disponíveis:\n');

    const chatIds = new Set();

    data.result.forEach((update: any, index: number) => {
      const chat = update.message?.chat || update.callback_query?.message?.chat;

      if (chat) {
        chatIds.add(chat.id);
        console.log(`${index + 1}. Chat ID: ${chat.id}`);
        console.log(
          `   Nome: ${chat.first_name || ''} ${chat.last_name || ''}`
        );
        console.log(`   Username: @${chat.username || 'N/A'}`);
        console.log(`   Tipo: ${chat.type}`);
        console.log('');
      }
    });

    if (chatIds.size > 0) {
      const firstChatId = Array.from(chatIds)[0];
      console.log('\n💡 Configure no .env:');
      console.log(`TELEGRAM_CHAT_ID=${firstChatId}`);
    }
  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

getChatId();
