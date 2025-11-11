/**
 * @fileoverview Telegram Webhook Handler
 * @module app/api/telegram/webhook
 * @description Recebe e processa updates do Telegram Bot
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 7.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { sendTelegramMessage } from '@/lib/telegram';
import { handleTelegramCommand } from '@/lib/telegram/commands';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

/**
 * Valida o webhook secret
 */
function validateWebhookSecret(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    return true; // Se não configurado, permite (para desenvolvimento)
  }

  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  return secret === WEBHOOK_SECRET;
}

/**
 * POST /api/telegram/webhook
 *
 * Recebe updates do Telegram Bot
 */
export async function POST(request: NextRequest) {
  const correlationId = `telegram-webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // 1. Validar webhook secret
    if (!validateWebhookSecret(request)) {
      logger.warn('Webhook secret inválido', { correlationId });
      return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
    }

    // 2. Validar bot token
    if (!BOT_TOKEN) {
      logger.error('TELEGRAM_BOT_TOKEN não configurado', { correlationId });
      return NextResponse.json({ ok: false, error: 'Bot token not configured' }, { status: 500 });
    }

    // 3. Parsear update do Telegram
    const update = await request.json();

    logger.info('Update recebido do Telegram', {
      correlationId,
      updateId: update.update_id,
      messageId: update.message?.message_id,
      chatId: update.message?.chat?.id,
      userId: update.message?.from?.id,
      username: update.message?.from?.username,
    });

    // 4. Processar mensagem
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const userId = message.from?.id;
      const text = message.text;

      // Ignorar mensagens antigas
      const messageDate = new Date(message.date * 1000);
      const now = new Date();
      const ageMinutes = (now.getTime() - messageDate.getTime()) / (1000 * 60);

      if (ageMinutes > 5) {
        logger.info('Mensagem antiga ignorada', {
          correlationId,
          ageMinutes: ageMinutes.toFixed(1),
        });
        return NextResponse.json({ ok: true });
      }

      // Processar comandos
      if (text && text.startsWith('/')) {
        await handleTelegramCommand({
          chatId,
          userId: userId?.toString(),
          username: message.from?.username,
          firstName: message.from?.first_name,
          command: text,
          correlationId,
        });
      } else {
        // Mensagem de texto normal - enviar ajuda
        await sendTelegramMessage(
          `Olá! 👋\n\nUse os seguintes comandos:\n` +
            `/status - Ver saúde financeira\n` +
            `/semanal - Relatório semanal\n` +
            `/alertas - Listar alertas pendentes\n` +
            `/whatif <cenário> - Simular cenário\n` +
            `/help - Ver ajuda`,
          { chatId, parseMode: 'Markdown' }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('Erro ao processar webhook do Telegram', {
      correlationId,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/telegram/webhook
 *
 * Verificação de webhook (usado pelo Telegram)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: 'Telegram webhook is active',
    timestamp: new Date().toISOString(),
  });
}

