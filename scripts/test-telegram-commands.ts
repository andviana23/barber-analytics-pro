#!/usr/bin/env tsx

/**
 * Test Telegram Bot Commands
 * ---------------------------
 * Testa comandos do bot enviando mensagens diretas
 */

import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

import { sendTelegramMessage } from '../lib/telegram';

async function main() {
  console.log('🤖 Testando mensagens do Telegram Bot...\n');

  const chatId = process.env.TELEGRAM_CHAT_ID!;

  try {
    // Mensagem de ajuda com comandos
    const helpMessage = `
🤖 *Barber Analytics Pro - Comandos Disponíveis*

Use estes comandos para interagir com o bot:

📊 */status* - Status financeiro da sua unidade
📈 */semanal* - Relatório semanal resumido
🚨 */alertas* - Ver alertas abertos
❓ */whatif* _cenário_ - Simular cenários
ℹ️ */help* - Ver esta mensagem de ajuda

_Para usar os comandos, envie no chat do Telegram_
    `.trim();

    console.log('📍 Enviando mensagem de ajuda...');
    const result = await sendTelegramMessage(helpMessage, {
      chatId,
      parseMode: 'Markdown',
    });

    if (result.success) {
      console.log('✅ Mensagem enviada com sucesso!');
      console.log(`   Message ID: ${result.messageId}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('� Comandos Disponíveis para Testar:');
      console.log('   /status   - Status financeiro');
      console.log('   /semanal  - Relatório semanal');
      console.log('   /alertas  - Alertas abertos');
      console.log('   /whatif   - Simular cenários');
      console.log('   /help     - Ajuda');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📱 Agora vá no Telegram e teste os comandos manualmente!');
      console.log('   Bot: @TratoFinanceBot');
      console.log(`   Chat ID: ${chatId}`);
      process.exit(0);
    } else {
      console.error('❌ Falha ao enviar mensagem:', result.error);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Erro ao testar comandos:', error.message);
    process.exit(1);
  }
}

main();
