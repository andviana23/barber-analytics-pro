/**
 * Payment Methods Service
 *
 * Serviço para gerenciar formas de pagamento (métodos de recebimento).
 * Inclui CRUD completo com soft delete pattern.
 */

// Service agora usa repository e DTOs; acesso direto ao Supabase removido daqui
import { paymentMethodsRepository } from '../repositories/paymentMethodsRepository';
import {
  CreatePaymentMethodDTO,
  UpdatePaymentMethodDTO,
  PaymentMethodResponseDTO,
} from '../dtos/paymentMethodDTO';

/**
 * Buscar todas as formas de pagamento de uma unidade
 *
 * @param {string} unitId - UUID da unidade
 * @param {boolean} includeInactive - Se deve incluir formas de pagamento inativas
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getPaymentMethods = async (unitId, includeInactive = false) => {
  try {
    const { data, error } = await paymentMethodsRepository.findAll({
      unitId,
      includeInactive,
    });

    if (error) {
      return { data: null, error };
    }

    const mapped = (data || []).map(row =>
      new PaymentMethodResponseDTO(row).toObject()
    );
    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Buscar uma forma de pagamento por ID
 *
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPaymentMethodById = async id => {
  try {
    const { data, error } = await paymentMethodsRepository.findById(id);

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Criar nova forma de pagamento
 *
 * @param {Object} paymentMethodData - Dados da forma de pagamento
 * @param {string} paymentMethodData.unit_id - UUID da unidade
 * @param {string} paymentMethodData.name - Nome da forma de pagamento
 * @param {number} paymentMethodData.fee_percentage - Taxa percentual (0-100)
 * @param {number} paymentMethodData.receipt_days - Prazo de recebimento em dias CORRIDOS (padrão mercado financeiro)
 * @param {boolean} [paymentMethodData.is_active=true] - Se está ativa
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 *
 * @example
 * // Cartão de crédito - 30 dias corridos
 * createPaymentMethod({
 *   unit_id: 'uuid',
 *   name: 'Cartão Crédito 30 dias',
 *   fee_percentage: 3.5,
 *   receipt_days: 30 // Dias corridos, ajustado automaticamente para dia útil
 * })
 */
export const createPaymentMethod = async paymentMethodData => {
  try {
    const dto = new CreatePaymentMethodDTO(paymentMethodData);
    if (!dto.isValid()) {
      return { data: null, error: new Error(dto.getErrors().join(' | ')) };
    }

    const { data, error } = await paymentMethodsRepository.create(
      dto.toDatabase()
    );

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Atualizar forma de pagamento existente
 *
 * @param {string} id - UUID da forma de pagamento
 * @param {Object} updates - Dados a serem atualizados
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updatePaymentMethod = async (id, updates) => {
  try {
    const dto = new UpdatePaymentMethodDTO(updates);
    if (!dto.isValid()) {
      return { data: null, error: new Error(dto.getErrors().join(' | ')) };
    }

    const { data, error } = await paymentMethodsRepository.update(
      id,
      dto.toDatabase()
    );

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Soft delete - Desativar forma de pagamento
 *
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deletePaymentMethod = async id => {
  try {
    const { data, error } = await paymentMethodsRepository.softDelete(id);

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Ativar forma de pagamento
 *
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const activatePaymentMethod = async id => {
  try {
    const { data, error } = await paymentMethodsRepository.activate(id);

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Hard delete - Deletar forma de pagamento permanentemente
 * ATENÇÃO: Use com cuidado! Apenas admins podem executar.
 * Recomendado usar soft delete (deletePaymentMethod) ao invés disso.
 *
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const hardDeletePaymentMethod = async id => {
  try {
    const { data, error } = await paymentMethodsRepository.hardDelete(id);

    if (error) {
      return { data: null, error };
    }

    return {
      data: data ? new PaymentMethodResponseDTO(data).toObject() : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Obter estatísticas das formas de pagamento de uma unidade
 *
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPaymentMethodsStats = async unitId => {
  try {
    const { data: allMethods, error: allError } = await getPaymentMethods(
      unitId,
      true
    );

    if (allError) {
      return { data: null, error: allError };
    }

    const activeMethods = allMethods.filter(method => method.is_active);

    const stats = {
      total: allMethods.length,
      active: activeMethods.length,
      inactive: allMethods.length - activeMethods.length,
      averageFee:
        activeMethods.length > 0
          ? activeMethods.reduce(
              (sum, m) => sum + Number(m.fee_percentage),
              0
            ) / activeMethods.length
          : 0,
      averageReceiptDays:
        activeMethods.length > 0
          ? activeMethods.reduce((sum, m) => sum + Number(m.receipt_days), 0) /
            activeMethods.length
          : 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export default {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  activatePaymentMethod,
  hardDeletePaymentMethod,
  getPaymentMethodsStats,
};
