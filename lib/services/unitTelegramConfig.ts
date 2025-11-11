/**
 * 📱 Unit Telegram Configuration Service
 *
 * Gerencia configurações de Telegram por unidade.
 * Cada unidade pode ter seu próprio bot e chat ID.
 *
 * @module lib/services/unitTelegramConfig
 * @author Andrey Viana
 * @since 2025-11-11
 */

import { supabase } from '../cache';
import { logger } from '../logger';

export interface UnitTelegramConfig {
  unitId: string;
  unitName: string;
  botToken: string | null;
  chatId: string | null;
  enabled: boolean;
}

/**
 * Busca configuração de Telegram para uma unidade específica
 *
 * @param unitId - ID da unidade
 * @returns Configuração do Telegram ou null se não encontrado
 *
 * @example
 * ```typescript
 * const config = await getUnitTelegramConfig('unit-123');
 * if (config?.enabled && config.botToken && config.chatId) {
 *   await sendTelegramMessage(message, {
 *     botToken: config.botToken,
 *     chatId: config.chatId,
 *   });
 * }
 * ```
 */
export async function getUnitTelegramConfig(
  unitId: string
): Promise<UnitTelegramConfig | null> {
  try {
    const { data, error } = await supabase
      .from('units')
      .select(
        'id, name, telegram_bot_token, telegram_chat_id, telegram_enabled'
      )
      .eq('id', unitId)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Erro ao buscar configuração de Telegram da unidade', {
        unitId,
        error: error.message,
      });
      return null;
    }

    if (!data) {
      logger.warn('Unidade não encontrada', { unitId });
      return null;
    }

    return {
      unitId: data.id,
      unitName: data.name,
      botToken: data.telegram_bot_token,
      chatId: data.telegram_chat_id,
      enabled: data.telegram_enabled ?? false,
    };
  } catch (error: any) {
    logger.error('Erro ao buscar configuração de Telegram', {
      unitId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Busca todas as unidades com Telegram habilitado
 *
 * @returns Array de configurações de Telegram das unidades ativas
 *
 * @example
 * ```typescript
 * const units = await getUnitsWithTelegram();
 * for (const unit of units) {
 *   await sendReport(unit);
 * }
 * ```
 */
export async function getUnitsWithTelegram(): Promise<UnitTelegramConfig[]> {
  try {
    const { data, error } = await supabase
      .from('units')
      .select(
        'id, name, telegram_bot_token, telegram_chat_id, telegram_enabled'
      )
      .eq('is_active', true)
      .eq('telegram_enabled', true)
      .not('telegram_bot_token', 'is', null)
      .not('telegram_chat_id', 'is', null);

    if (error) {
      logger.error('Erro ao buscar unidades com Telegram', {
        error: error.message,
      });
      return [];
    }

    if (!data || data.length === 0) {
      logger.info('Nenhuma unidade com Telegram habilitado encontrada');
      return [];
    }

    return data.map(unit => ({
      unitId: unit.id,
      unitName: unit.name,
      botToken: unit.telegram_bot_token,
      chatId: unit.telegram_chat_id,
      enabled: unit.telegram_enabled ?? false,
    }));
  } catch (error: any) {
    logger.error('Erro ao buscar unidades com Telegram', {
      error: error.message,
    });
    return [];
  }
}

/**
 * Habilita/desabilita Telegram para uma unidade
 *
 * @param unitId - ID da unidade
 * @param enabled - true para habilitar, false para desabilitar
 * @returns true se atualizado com sucesso
 *
 * @example
 * ```typescript
 * // Habilitar
 * await setUnitTelegramEnabled('unit-123', true);
 *
 * // Desabilitar
 * await setUnitTelegramEnabled('unit-123', false);
 * ```
 */
export async function setUnitTelegramEnabled(
  unitId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('units')
      .update({
        telegram_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId);

    if (error) {
      logger.error('Erro ao atualizar status do Telegram', {
        unitId,
        enabled,
        error: error.message,
      });
      return false;
    }

    logger.info(`Telegram ${enabled ? 'habilitado' : 'desabilitado'}`, {
      unitId,
    });
    return true;
  } catch (error: any) {
    logger.error('Erro ao atualizar status do Telegram', {
      unitId,
      enabled,
      error: error.message,
    });
    return false;
  }
}

/**
 * Atualiza configuração de Telegram de uma unidade
 *
 * @param unitId - ID da unidade
 * @param config - Configuração do Telegram
 * @returns true se atualizado com sucesso
 *
 * @example
 * ```typescript
 * await updateUnitTelegramConfig('unit-123', {
 *   botToken: '123456:ABC-DEF',
 *   chatId: '987654321',
 *   enabled: true,
 * });
 * ```
 */
export async function updateUnitTelegramConfig(
  unitId: string,
  config: {
    botToken?: string;
    chatId?: string;
    enabled?: boolean;
  }
): Promise<boolean> {
  try {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (config.botToken !== undefined) {
      updates.telegram_bot_token = config.botToken;
    }

    if (config.chatId !== undefined) {
      updates.telegram_chat_id = config.chatId;
    }

    if (config.enabled !== undefined) {
      updates.telegram_enabled = config.enabled;
    }

    const { error } = await supabase
      .from('units')
      .update(updates)
      .eq('id', unitId);

    if (error) {
      logger.error('Erro ao atualizar configuração do Telegram', {
        unitId,
        error: error.message,
      });
      return false;
    }

    logger.info('Configuração do Telegram atualizada', { unitId, config });
    return true;
  } catch (error: any) {
    logger.error('Erro ao atualizar configuração do Telegram', {
      unitId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Valida se uma unidade tem Telegram configurado corretamente
 *
 * @param unitId - ID da unidade
 * @returns Objeto com status de validação
 *
 * @example
 * ```typescript
 * const validation = await validateUnitTelegramConfig('unit-123');
 * if (!validation.valid) {
 *   console.error(validation.errors);
 * }
 * ```
 */
export async function validateUnitTelegramConfig(unitId: string): Promise<{
  valid: boolean;
  errors: string[];
  config: UnitTelegramConfig | null;
}> {
  const errors: string[] = [];

  const config = await getUnitTelegramConfig(unitId);

  if (!config) {
    errors.push('Unidade não encontrada');
    return { valid: false, errors, config: null };
  }

  if (!config.enabled) {
    errors.push('Telegram não habilitado para esta unidade');
  }

  if (!config.botToken || config.botToken.trim() === '') {
    errors.push('Bot token não configurado');
  }

  if (!config.chatId || config.chatId.trim() === '') {
    errors.push('Chat ID não configurado');
  }

  // Validar formato do bot token (deve ter formato: 123456789:ABC-DEF...)
  if (config.botToken && !/^\d+:[A-Za-z0-9_-]+$/.test(config.botToken)) {
    errors.push('Formato do bot token inválido');
  }

  // Validar formato do chat ID (deve ser numérico ou começar com -)
  if (config.chatId && !/^-?\d+$/.test(config.chatId)) {
    errors.push('Formato do chat ID inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
    config,
  };
}
