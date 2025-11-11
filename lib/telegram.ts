/**
 * @fileoverview Telegram Service
 * @module lib/telegram
 * @description Serviço para envio de mensagens via Telegram Bot
 *
 * Features:
 * - Envio de mensagens simples
 * - Envio de mensagens formatadas (Markdown)
 * - Circuit breaker para proteção contra falhas
 * - Retry automático com backoff exponencial
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 7.3
 */

import { logger } from './logger';
import { retryWithBackoff } from './retry';
import { CircuitBreaker } from './circuitBreaker';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Getters para variáveis de ambiente (lazy loading)
function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function getChatId(): string | undefined {
  return process.env.TELEGRAM_CHAT_ID;
}

// Circuit breaker para Telegram
const telegramCircuitBreaker = new CircuitBreaker('Telegram', {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minuto
});

/**
 * Envia mensagem simples via Telegram
 *
 * @param {string} message - Mensagem a enviar
 * @param {Object} options - Opções adicionais
 * @param {string|number} [options.chatId] - ID do chat (se não fornecido, usa CHAT_ID do env)
 * @param {string} [options.botToken] - Token do bot (se não fornecido, usa BOT_TOKEN do env)
 * @param {string} [options.parseMode='Markdown'] - Modo de parsing (Markdown ou HTML)
 * @param {boolean} [options.disablePreview=true] - Desabilitar preview de links
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendTelegramMessage(
  message: string,
  options: {
    chatId?: string | number;
    botToken?: string;
    parseMode?: 'Markdown' | 'HTML';
    disablePreview?: boolean;
  } = {}
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const botToken = options.botToken || getBotToken();
  const chatId = options.chatId || getChatId();

  if (!botToken || !chatId) {
    logger.warn('Telegram não configurado', {
      hasBotToken: !!botToken,
      hasChatId: !!chatId,
    });
    return {
      success: false,
      error: 'Telegram não configurado',
    };
  }

  try {
    const result = await telegramCircuitBreaker.execute(async () => {
      return await retryWithBackoff(
        async () => {
          const response = await fetch(
            `${TELEGRAM_API_URL}${botToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: options.parseMode || 'Markdown',
                disable_web_page_preview: options.disablePreview !== false,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.description ||
                `HTTP ${response.status}: ${response.statusText}`
            );
          }

          const data = await response.json();
          return data;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
        }
      );
    });

    logger.info('Mensagem Telegram enviada com sucesso', {
      messageId: result.result?.message_id,
    });

    return {
      success: true,
      messageId: result.result?.message_id,
    };
  } catch (error: any) {
    logger.error('Erro ao enviar mensagem Telegram', {
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

/**
 * Envia alerta formatado via Telegram
 *
 * @param {Object} alert - Dados do alerta
 * @param {string} alert.message - Mensagem do alerta
 * @param {string} [alert.severity] - Severidade: LOW, MEDIUM, HIGH, CRITICAL
 * @param {string} [alert.unitId] - ID da unidade
 * @param {string} [alert.unitName] - Nome da unidade
 * @param {Object} [alert.metadata] - Metadados adicionais
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
export async function sendTelegramAlert(alert: {
  message: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  unitId?: string;
  unitName?: string;
  metadata?: any;
}): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const emojiMap = {
    LOW: 'ℹ️',
    MEDIUM: '⚠️',
    HIGH: '🔴',
    CRITICAL: '🚨',
  };

  const emoji = emojiMap[alert.severity || 'MEDIUM'] || '⚠️';
  const severityLabel = alert.severity || 'MEDIUM';

  let formattedMessage = `${emoji} *${severityLabel}*\n\n`;
  formattedMessage += `${alert.message}\n\n`;

  if (alert.unitName) {
    formattedMessage += `📍 *Unidade:* ${alert.unitName}\n`;
  }

  if (alert.unitId) {
    formattedMessage += `🆔 *ID:* \`${alert.unitId}\`\n`;
  }

  if (alert.metadata) {
    formattedMessage += `\n📊 *Detalhes:*\n`;
    Object.entries(alert.metadata).forEach(([key, value]) => {
      formattedMessage += `• *${key}:* ${value}\n`;
    });
  }

  formattedMessage += `\n⏰ ${new Date().toLocaleString('pt-BR')}`;

  return sendTelegramMessage(formattedMessage, {
    parseMode: 'Markdown',
    disablePreview: true,
  });
}

/**
 * Envia alerta de validação de saldo acumulado
 *
 * @param {Object} validationResult - Resultado da validação
 * @param {boolean} validationResult.valid - Se a validação passou
 * @param {Array} validationResult.results - Resultados por unidade
 * @returns {Promise<{success: boolean}>}
 */
export async function sendBalanceValidationAlert(validationResult: {
  valid: boolean;
  results: Array<{
    unitId: string;
    unitName: string;
    isValid: boolean;
    differences: number;
    maxDifference: number;
  }>;
}): Promise<{ success: boolean }> {
  if (validationResult.valid) {
    // Não enviar alerta se tudo estiver válido
    return { success: true };
  }

  const invalidUnits = validationResult.results.filter(
    r => !r.isValid || r.differences > 0
  );

  if (invalidUnits.length === 0) {
    return { success: true };
  }

  let message = `⚠️ *Validação de Saldo Acumulado*\n\n`;
  message += `Diferenças encontradas em ${invalidUnits.length} unidade(s):\n\n`;

  invalidUnits.forEach(unit => {
    message += `📍 *${unit.unitName}*\n`;
    message += `• Diferenças: ${unit.differences}\n`;
    message += `• Maior diferença: ${unit.maxDifference.toFixed(2)}\n\n`;
  });

  message += `🔍 Verifique os logs para mais detalhes.`;

  const result = await sendTelegramMessage(message, {
    parseMode: 'Markdown',
    disablePreview: true,
  });

  return { success: result.success };
}
