/**
 * @fileoverview Telegram Bot Service for Purchase Requests
 * @module lib/services/telegramPurchaseBot
 * @description Serviço para notificações e aprovações de solicitações de compra via Telegram
 *
 * Features:
 * - Notificações de nova solicitação com botões inline
 * - Aprovação/Rejeição via callback buttons
 * - Notificações de status para solicitante
 * - Formatação rica com Markdown
 *
 * Workflow:
 * 1. Barbeiro submete solicitação → Notificação para gerente/admin
 * 2. Gerente clica [Aprovar] ou [Rejeitar] → Callback processado
 * 3. Status atualizado → Notificação para solicitante
 *
 * @see Sprint 3.2 - Telegram Bot Integration
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { sendTelegramMessage } from '../telegram.ts';
import { logger } from '../logger';
import { supabase } from '../supabaseAdmin';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Emojis por prioridade
 */
const PRIORITY_EMOJIS = {
  URGENT: '🚨',
  HIGH: '🔴',
  NORMAL: '🟡',
  LOW: '🟢',
};

/**
 * Emojis por status
 */
const STATUS_EMOJIS = {
  DRAFT: '📝',
  SUBMITTED: '📤',
  APPROVED: '✅',
  REJECTED: '❌',
  CANCELLED: '🚫',
};

/**
 * Labels de prioridade
 */
const PRIORITY_LABELS = {
  URGENT: 'URGENTE',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
};

/**
 * Labels de status (para uso futuro)
 */
// const STATUS_LABELS = {
//   DRAFT: 'Rascunho',
//   SUBMITTED: 'Aguardando Aprovação',
//   APPROVED: 'Aprovada',
//   REJECTED: 'Rejeitada',
//   CANCELLED: 'Cancelada',
// };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formata valor em BRL
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado (R$ 1.234,56)
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data em português
 * @param {Date|string} date - Data
 * @returns {string} Data formatada (13/11/2025 14:30)
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Busca chat_id dos gerentes/admins de uma unidade
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<string[]>} Array de chat_ids
 */
async function getManagerChatIds(unitId) {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('telegram_chat_id')
      .eq('unit_id', unitId)
      .in('role', ['gerente', 'admin'])
      .eq('is_active', true)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      logger.error('Erro ao buscar chat_ids dos gerentes', { error, unitId });
      return [];
    }

    return data.map(p => p.telegram_chat_id).filter(Boolean);
  } catch (error) {
    logger.error('Erro ao buscar chat_ids dos gerentes', { error, unitId });
    return [];
  }
}

/**
 * Busca chat_id do solicitante
 * @param {string} professionalId - UUID do profissional
 * @returns {Promise<string|null>} Chat ID ou null
 */
async function getRequesterChatId(professionalId) {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('telegram_chat_id')
      .eq('id', professionalId)
      .single();

    if (error || !data) {
      logger.error('Erro ao buscar chat_id do solicitante', {
        error,
        professionalId,
      });
      return null;
    }

    return data.telegram_chat_id;
  } catch (error) {
    logger.error('Erro ao buscar chat_id do solicitante', {
      error,
      professionalId,
    });
    return null;
  }
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Envia notificação de nova solicitação para gerentes
 *
 * @param {Object} request - Dados da solicitação
 * @param {string} request.id - UUID da solicitação
 * @param {string} request.request_number - Número da solicitação (REQ-2025-001)
 * @param {string} request.priority - Prioridade (URGENT, HIGH, NORMAL, LOW)
 * @param {string} request.justification - Justificativa
 * @param {string} request.notes - Notas adicionais
 * @param {number} request.total_amount - Valor total
 * @param {Object} request.unit - Dados da unidade
 * @param {string} request.unit.name - Nome da unidade
 * @param {Object} request.professional - Dados do solicitante
 * @param {string} request.professional.name - Nome do solicitante
 * @param {Array} request.items - Array de itens
 * @param {string} request.items[].product_name - Nome do produto
 * @param {number} request.items[].quantity - Quantidade
 * @param {string} request.items[].unit_measurement - Unidade de medida
 * @returns {Promise<{success: boolean, sentCount: number, errors: string[]}>}
 */
export async function sendPurchaseRequestNotification(request) {
  logger.info('Enviando notificação de solicitação de compra', {
    requestId: request.id,
    requestNumber: request.request_number,
    priority: request.priority,
  });

  // Buscar chat_ids dos gerentes da unidade
  const managerChatIds = await getManagerChatIds(
    request.unit_id || request.unit?.id
  );

  if (managerChatIds.length === 0) {
    logger.warn('Nenhum gerente com Telegram configurado para a unidade', {
      unitId: request.unit_id || request.unit?.id,
    });
    return {
      success: false,
      sentCount: 0,
      errors: ['Nenhum gerente com Telegram configurado'],
    };
  }

  // Formatar mensagem
  const emoji = PRIORITY_EMOJIS[request.priority] || '📦';
  const priorityLabel = PRIORITY_LABELS[request.priority] || request.priority;

  let message = `${emoji} *NOVA SOLICITAÇÃO DE COMPRA*\n\n`;
  message += `📋 *Número:* \`${request.request_number}\`\n`;
  message += `🏢 *Unidade:* ${request.unit?.name || 'N/A'}\n`;
  message += `👤 *Solicitante:* ${request.professional?.name || 'N/A'}\n`;
  message += `⚡ *Prioridade:* ${priorityLabel}\n`;
  message += `💰 *Valor Total:* ${formatCurrency(request.total_amount || 0)}\n\n`;

  message += `📝 *Justificativa:*\n${request.justification}\n\n`;

  if (request.notes) {
    message += `📌 *Observações:*\n${request.notes}\n\n`;
  }

  // Items table
  message += `🛒 *Itens (${request.items?.length || 0}):*\n`;
  if (request.items && request.items.length > 0) {
    request.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name} - ${item.quantity} ${item.unit_measurement}\n`;
    });
  }

  message += `\n⏰ *Enviado em:* ${formatDate(new Date())}\n\n`;
  message += `👇 *Ações Disponíveis:*\n`;
  message += `• Acesse o sistema para aprovar ou rejeitar esta solicitação`;

  // Enviar para todos os gerentes
  const results = await Promise.allSettled(
    managerChatIds.map(chatId =>
      sendTelegramMessage(message, {
        chatId,
        parseMode: 'Markdown',
        disablePreview: true,
      })
    )
  );

  // Contar sucessos e erros
  const sentCount = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  const errors = results
    .filter(r => r.status === 'rejected' || !r.value?.success)
    .map(r => (r.status === 'rejected' ? r.reason : r.value?.error))
    .filter(Boolean);

  logger.info('Notificação de solicitação enviada', {
    requestId: request.id,
    sentCount,
    totalManagers: managerChatIds.length,
    errors: errors.length,
  });

  return {
    success: sentCount > 0,
    sentCount,
    errors,
  };
}

/**
 * Envia notificação de aprovação para o solicitante
 *
 * @param {Object} request - Dados da solicitação
 * @param {string} request.id - UUID da solicitação
 * @param {string} request.request_number - Número da solicitação
 * @param {string} request.priority - Prioridade
 * @param {string} request.justification - Justificativa
 * @param {number} request.total_amount - Valor total
 * @param {Object} request.professional - Solicitante
 * @param {string} request.professional.id - UUID do solicitante
 * @param {string} request.professional.name - Nome do solicitante
 * @param {Object} request.approver - Aprovador
 * @param {string} request.approver.name - Nome do aprovador
 * @param {string} request.approved_at - Data de aprovação
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendApprovalNotification(request) {
  logger.info('Enviando notificação de aprovação', {
    requestId: request.id,
    requestNumber: request.request_number,
  });

  // Buscar chat_id do solicitante
  const requesterChatId = await getRequesterChatId(
    request.requested_by || request.professional?.id
  );

  if (!requesterChatId) {
    logger.warn('Solicitante sem Telegram configurado', {
      professionalId: request.requested_by || request.professional?.id,
    });
    return {
      success: false,
      error: 'Solicitante sem Telegram configurado',
    };
  }

  // Formatar mensagem
  const emoji = STATUS_EMOJIS.APPROVED;
  const priorityEmoji = PRIORITY_EMOJIS[request.priority] || '📦';

  let message = `${emoji} *SOLICITAÇÃO APROVADA*\n\n`;
  message += `📋 *Número:* \`${request.request_number}\`\n`;
  message += `${priorityEmoji} *Prioridade:* ${PRIORITY_LABELS[request.priority] || request.priority}\n`;
  message += `💰 *Valor Total:* ${formatCurrency(request.total_amount || 0)}\n\n`;

  message += `📝 *Justificativa:*\n${request.justification}\n\n`;

  message += `✅ *Aprovado por:* ${request.approver?.name || 'N/A'}\n`;
  message += `⏰ *Data:* ${formatDate(request.approved_at || new Date())}\n\n`;

  message += `🎉 Sua solicitação foi aprovada! O processo de cotação será iniciado em breve.`;

  const result = await sendTelegramMessage(message, {
    chatId: requesterChatId,
    parseMode: 'Markdown',
    disablePreview: true,
  });

  logger.info('Notificação de aprovação enviada', {
    requestId: request.id,
    success: result.success,
    error: result.error,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Envia notificação de rejeição para o solicitante
 *
 * @param {Object} request - Dados da solicitação
 * @param {string} request.id - UUID da solicitação
 * @param {string} request.request_number - Número da solicitação
 * @param {string} request.priority - Prioridade
 * @param {string} request.justification - Justificativa
 * @param {number} request.total_amount - Valor total
 * @param {Object} request.professional - Solicitante
 * @param {string} request.professional.id - UUID do solicitante
 * @param {string} request.professional.name - Nome do solicitante
 * @param {Object} request.rejector - Rejeitador
 * @param {string} request.rejector.name - Nome do rejeitador
 * @param {string} request.rejection_reason - Motivo da rejeição
 * @param {string} request.rejected_at - Data de rejeição
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendRejectionNotification(request) {
  logger.info('Enviando notificação de rejeição', {
    requestId: request.id,
    requestNumber: request.request_number,
  });

  // Buscar chat_id do solicitante
  const requesterChatId = await getRequesterChatId(
    request.requested_by || request.professional?.id
  );

  if (!requesterChatId) {
    logger.warn('Solicitante sem Telegram configurado', {
      professionalId: request.requested_by || request.professional?.id,
    });
    return {
      success: false,
      error: 'Solicitante sem Telegram configurado',
    };
  }

  // Formatar mensagem
  const emoji = STATUS_EMOJIS.REJECTED;
  const priorityEmoji = PRIORITY_EMOJIS[request.priority] || '📦';

  let message = `${emoji} *SOLICITAÇÃO REJEITADA*\n\n`;
  message += `📋 *Número:* \`${request.request_number}\`\n`;
  message += `${priorityEmoji} *Prioridade:* ${PRIORITY_LABELS[request.priority] || request.priority}\n`;
  message += `💰 *Valor Total:* ${formatCurrency(request.total_amount || 0)}\n\n`;

  message += `📝 *Justificativa:*\n${request.justification}\n\n`;

  message += `❌ *Rejeitado por:* ${request.rejector?.name || 'N/A'}\n`;
  message += `📌 *Motivo:* ${request.rejection_reason}\n`;
  message += `⏰ *Data:* ${formatDate(request.rejected_at || new Date())}\n\n`;

  message += `💡 Você pode revisar e enviar uma nova solicitação se necessário.`;

  const result = await sendTelegramMessage(message, {
    chatId: requesterChatId,
    parseMode: 'Markdown',
    disablePreview: true,
  });

  logger.info('Notificação de rejeição enviada', {
    requestId: request.id,
    success: result.success,
    error: result.error,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Envia notificação de cotação selecionada para gerente que registrou
 *
 * @param {Object} quote - Dados da cotação
 * @param {string} quote.id - UUID da cotação
 * @param {string} quote.quote_number - Número da cotação (COT-2025-001)
 * @param {number} quote.total_amount - Valor total
 * @param {Object} quote.supplier - Fornecedor
 * @param {string} quote.supplier.name - Nome do fornecedor
 * @param {Object} quote.request - Solicitação relacionada
 * @param {string} quote.request.request_number - Número da solicitação
 * @param {string} quote.selection_reason - Motivo da seleção
 * @param {Object} quote.selector - Quem selecionou
 * @param {string} quote.selector.name - Nome do seletor
 * @param {string} quote.selected_at - Data de seleção
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendQuoteSelectedNotification(quote) {
  logger.info('Enviando notificação de cotação selecionada', {
    quoteId: quote.id,
    quoteNumber: quote.quote_number,
  });

  // Buscar chat_id do gerente que registrou a cotação
  const managerChatId = await getRequesterChatId(quote.quoted_by);

  if (!managerChatId) {
    logger.warn('Gerente sem Telegram configurado', {
      professionalId: quote.quoted_by,
    });
    return {
      success: false,
      error: 'Gerente sem Telegram configurado',
    };
  }

  // Formatar mensagem
  let message = `🎯 *COTAÇÃO SELECIONADA*\n\n`;
  message += `📋 *Solicitação:* \`${quote.request?.request_number || 'N/A'}\`\n`;
  message += `📄 *Cotação:* \`${quote.quote_number}\`\n`;
  message += `🏪 *Fornecedor:* ${quote.supplier?.name || 'N/A'}\n`;
  message += `💰 *Valor:* ${formatCurrency(quote.total_amount || 0)}\n\n`;

  message += `✅ *Selecionado por:* ${quote.selector?.name || 'N/A'}\n`;
  message += `📌 *Motivo:* ${quote.selection_reason}\n`;
  message += `⏰ *Data:* ${formatDate(quote.selected_at || new Date())}\n\n`;

  message += `📦 Aguardando geração da ordem de compra.`;

  const result = await sendTelegramMessage(message, {
    chatId: managerChatId,
    parseMode: 'Markdown',
    disablePreview: true,
  });

  logger.info('Notificação de cotação selecionada enviada', {
    quoteId: quote.id,
    success: result.success,
    error: result.error,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  sendPurchaseRequestNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  sendQuoteSelectedNotification,
};
