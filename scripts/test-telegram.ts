#!/usr/bin/env tsx

/**
 * Test Telegram Bot
 * -----------------
 * Testa a conexão com o Telegram e envia mensagem de teste
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

// Garantir que NEXT_PUBLIC_SUPABASE_URL está disponível
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

import { sendTelegramMessage } from '../lib/telegram';
import { logger } from '../lib/logger';

async function main() {
  console.log('📱 Testando conexão com Telegram Bot...\n');

  // Verificar configurações
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN não configurado no .env');
    process.exit(1);
  }

  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ TELEGRAM_CHAT_ID não configurado no .env');
    process.exit(1);
  }

  const tokenPreview = process.env.TELEGRAM_BOT_TOKEN.substring(0, 15) + '...';
  console.log(`📋 Bot Token: ${tokenPreview}`);
  console.log(`📋 Chat ID: ${process.env.TELEGRAM_CHAT_ID}\n`);

  try {
    console.log('🔄 Enviando mensagem de teste...');

    const message = `
🤖 *Teste de Conexão - Barber Analytics Pro*

✅ Sistema funcionando corretamente!
📅 Data: ${new Date().toLocaleDateString('pt-BR')}
⏰ Hora: ${new Date().toLocaleTimeString('pt-BR')}

_Este é um teste automatizado do bot._
    `.trim();

    const result = await sendTelegramMessage(message);

    if (result.success) {
      console.log('\n✅ Mensagem enviada com sucesso!');
      console.log('✅ Bot Telegram configurado corretamente');
      console.log('✅ Chat ID válido e acessível');
      console.log('\n📱 Verifique seu Telegram para ver a mensagem!');
      process.exit(0);
    } else {
      console.log('\n❌ Falha ao enviar mensagem!');
      console.log('Erro:', result.error);
      console.log('\nVerifique:');
      console.log('  1. Bot Token está válido e ativo');
      console.log('  2. Chat ID está correto');
      console.log('  3. Bot foi adicionado ao chat/grupo');
      console.log('  4. Bot tem permissão para enviar mensagens');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao testar Telegram:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  }
}

main();
