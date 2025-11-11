#!/usr/bin/env tsx
/**
 * 🔍 Script: Descobrir Chat ID do Bot da Unidade Nova Lima
 *
 * Este script busca o Chat ID do bot Telegram da Nova Lima.
 *
 * INSTRUÇÕES:
 * 1. Envie qualquer mensagem para o bot no Telegram
 * 2. Execute este script: pnpm tsx scripts/get-nova-lima-chat-id.ts
 * 3. O script exibirá o Chat ID encontrado
 *
 * Bot Token: 8195784375:AAHhhgVPXAsHy1byr_pX7wSDeFgw9koBUTc
 *
 * @author Andrey Viana
 * @since 2025-11-11
 */

import 'dotenv/config';
import { randomBytes } from 'crypto';

// Bot token da Nova Lima
const NOVA_LIMA_BOT_TOKEN = '8195784375:AAHhhgVPXAsHy1byr_pX7wSDeFgw9koBUTc';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name: string;
      username?: string;
      type: string;
    };
    date: number;
    text: string;
  };
}

interface TelegramResponse {
  ok: boolean;
  result: TelegramUpdate[];
}

/**
 * Busca atualizações (mensagens) recebidas pelo bot
 */
async function getUpdates(): Promise<TelegramResponse> {
  const url = `https://api.telegram.org/bot${NOVA_LIMA_BOT_TOKEN}/getUpdates`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar atualizações: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Envia mensagem de teste para confirmar o Chat ID
 */
async function sendTestMessage(chatId: number): Promise<boolean> {
  const url = `https://api.telegram.org/bot${NOVA_LIMA_BOT_TOKEN}/sendMessage`;

  const message = `✅ *Chat ID Configurado com Sucesso!*

🏢 *Unidade:* Nova Lima
📱 *Chat ID:* \`${chatId}\`
🤖 *Bot:* Barber Analytics Pro

━━━━━━━━━━━━━━━━━━

Você começará a receber:
• 📊 Relatórios diários às 21:00
• 🧠 Insights com IA (ApoIA)
• 🎯 Progresso de metas
• 📈 Análises de tendências

━━━━━━━━━━━━━━━━━━

_Configuração realizada em ${new Date().toLocaleString('pt-BR')}_`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao enviar mensagem de teste: ${response.statusText}`);
  }

  return true;
}

/**
 * Gera um webhook secret aleatório
 */
function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Main function
 */
async function main() {
  console.log('\n🔍 ================================================');
  console.log('     DESCOBRIR CHAT ID - UNIDADE NOVA LIMA');
  console.log('================================================\n');

  console.log('🤖 Bot Token: 8195784375:AAHh...koBUTc (Nova Lima)');
  console.log(
    '\n📱 INSTRUÇÕES:\n   1. Abra o Telegram\n   2. Envie qualquer mensagem para o bot\n   3. Aguarde...\n'
  );

  try {
    // 1. Buscar atualizações
    console.log('🔄 Buscando mensagens recentes...\n');
    const data = await getUpdates();

    if (!data.ok) {
      console.error('❌ Erro na resposta da API do Telegram');
      process.exit(1);
    }

    if (data.result.length === 0) {
      console.log('⚠️  Nenhuma mensagem encontrada!');
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   1. Abra o Telegram');
      console.log('   2. Procure pelo bot da Nova Lima');
      console.log('   3. Envie qualquer mensagem (ex: /start, olá)');
      console.log('   4. Execute este script novamente\n');
      process.exit(0);
    }

    console.log(`✅ ${data.result.length} mensagem(ns) encontrada(s)\n`);

    // 2. Extrair Chat IDs únicos
    const chatIds = new Set<number>();
    const users: Map<
      number,
      { name: string; username?: string; lastMessage: string }
    > = new Map();

    data.result.forEach(update => {
      if (update.message) {
        const chatId = update.message.chat.id;
        chatIds.add(chatId);

        users.set(chatId, {
          name: update.message.from.first_name,
          username: update.message.from.username,
          lastMessage: update.message.text,
        });
      }
    });

    console.log('👥 Usuários que enviaram mensagens:\n');

    Array.from(chatIds).forEach((chatId, index) => {
      const user = users.get(chatId);
      console.log(`   ${index + 1}. Chat ID: ${chatId}`);
      console.log(`      Nome: ${user?.name}`);
      if (user?.username) {
        console.log(`      Username: @${user.username}`);
      }
      console.log(`      Última mensagem: "${user?.lastMessage}"`);
      console.log('');
    });

    // 3. Se houver apenas 1 chat, usar automaticamente
    if (chatIds.size === 1) {
      const chatId = Array.from(chatIds)[0];
      const user = users.get(chatId);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('✅ CHAT ID ENCONTRADO!\n');
      console.log(`   Chat ID: ${chatId}`);
      console.log(
        `   Usuário: ${user?.name}${user?.username ? ` (@${user.username})` : ''}`
      );
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 4. Gerar Webhook Secret
      const webhookSecret = generateWebhookSecret();

      console.log('🔐 WEBHOOK SECRET GERADO:\n');
      console.log(`   ${webhookSecret}\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 5. Enviar mensagem de teste
      console.log('📱 Enviando mensagem de confirmação...\n');
      await sendTestMessage(chatId);
      console.log('✅ Mensagem enviada com sucesso!\n');

      // 6. Exibir SQL para configurar no banco
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💾 SQL PARA CONFIGURAR NO BANCO:\n');
      console.log(`UPDATE units
SET
  telegram_bot_token = '8195784375:AAHhhgVPXAsHy1byr_pX7wSDeFgw9koBUTc',
  telegram_chat_id = '${chatId}',
  telegram_enabled = true,
  updated_at = NOW()
WHERE name = 'Nova Lima' AND is_active = true;
`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // 7. Atualizar .env (opcional)
      console.log('📝 ATUALIZAR .ENV (Opcional):\n');
      console.log('Adicione estas linhas na seção Nova Lima:\n');
      console.log(`# Chat ID: ${chatId}`);
      console.log(`# Webhook Secret: ${webhookSecret}\n`);

      console.log('✅ Configuração concluída!\n');
      console.log('🎯 PRÓXIMOS PASSOS:');
      console.log('   1. Execute o SQL acima no banco de dados');
      console.log(
        '   2. Teste o relatório: pnpm tsx scripts/test-relatorio-diario.ts'
      );
      console.log('   3. Verifique se recebeu a mensagem no Telegram\n');
    } else {
      // Múltiplos chats encontrados
      console.log(
        '⚠️  Múltiplos chats encontrados. Identifique qual é o correto e execute:\n'
      );
      console.log('   pnpm tsx scripts/configure-nova-lima.ts <CHAT_ID>\n');
    }
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📋 Detalhes:', error);
    process.exit(1);
  }
}

// Executar
main();
