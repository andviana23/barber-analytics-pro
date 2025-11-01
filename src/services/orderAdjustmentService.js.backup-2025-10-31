import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

/**
 * OrderAdjustmentService
 * Serviço para gerenciar descontos e taxas em comandas
 *
 * @service
 * @layer Business Logic
 */

/**
 * Aplica desconto em uma comanda
 *
 * @param {string} orderId - ID da comanda
 * @param {Object} discountData - Dados do desconto
 * @param {string} discountData.type - Tipo: 'percentage' ou 'fixed'
 * @param {number} discountData.value - Valor do desconto
 * @param {string} discountData.reason - Motivo do desconto
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const applyDiscount = async (orderId, discountData) => {
  try {
    // Validações
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    if (
      !discountData.type ||
      !['percentage', 'fixed'].includes(discountData.type)
    ) {
      throw new Error('Tipo de desconto inválido');
    }

    if (!discountData.value || discountData.value <= 0) {
      throw new Error('Valor do desconto deve ser maior que zero');
    }

    if (!discountData.reason || discountData.reason.trim().length < 3) {
      throw new Error('Motivo do desconto é obrigatório (mínimo 3 caracteres)');
    }

    // Buscar ID do usuário atual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Chamar RPC para aplicar desconto
    const { data, error } = await supabase.rpc('fn_apply_discount', {
      p_order_id: orderId,
      p_discount_type: discountData.type,
      p_discount_value: discountData.value,
      p_reason: discountData.reason.trim(),
      p_user_id: user.id,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao aplicar desconto:', error);
      throw new Error(error.message || 'Erro ao aplicar desconto');
    }

    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no applyDiscount:', error);
    return { data: null, error };
  }
};

/**
 * Aplica taxa em uma comanda
 *
 * @param {string} orderId - ID da comanda
 * @param {Object} feeData - Dados da taxa
 * @param {string} feeData.type - Tipo: 'percentage' ou 'fixed'
 * @param {number} feeData.value - Valor da taxa
 * @param {string} feeData.reason - Motivo da taxa
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const applyFee = async (orderId, feeData) => {
  try {
    // Validações
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    if (!feeData.type || !['percentage', 'fixed'].includes(feeData.type)) {
      throw new Error('Tipo de taxa inválido');
    }

    if (!feeData.value || feeData.value <= 0) {
      throw new Error('Valor da taxa deve ser maior que zero');
    }

    if (!feeData.reason || feeData.reason.trim().length < 3) {
      throw new Error('Motivo da taxa é obrigatório (mínimo 3 caracteres)');
    }

    // Buscar ID do usuário atual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Chamar RPC para aplicar taxa
    const { data, error } = await supabase.rpc('fn_apply_fee', {
      p_order_id: orderId,
      p_fee_type: feeData.type,
      p_fee_value: feeData.value,
      p_reason: feeData.reason.trim(),
      p_user_id: user.id,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao aplicar taxa:', error);
      throw new Error(error.message || 'Erro ao aplicar taxa');
    }

    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no applyFee:', error);
    return { data: null, error };
  }
};

/**
 * Calcula o total final da comanda com descontos e taxas
 *
 * @param {string} orderId - ID da comanda
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const calculateOrderFinalTotal = async orderId => {
  try {
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    const { data, error } = await supabase.rpc(
      'fn_calculate_order_final_total',
      {
        p_order_id: orderId,
      }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao calcular total:', error);
      throw new Error(error.message || 'Erro ao calcular total da comanda');
    }

    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no calculateOrderFinalTotal:', error);
    return { data: null, error };
  }
};

/**
 * Busca histórico de ajustes de uma comanda
 *
 * @param {string} orderId - ID da comanda
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export const getOrderAdjustments = async orderId => {
  try {
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    const { data, error } = await supabase
      .from('order_adjustments')
      .select(
        `
        *,
        applied_by_user:applied_by (
          id,
          email,
          raw_user_meta_data
        ),
        reverted_by_user:reverted_by (
          id,
          email,
          raw_user_meta_data
        )
      `
      )
      .eq('order_id', orderId)
      .order('applied_at', { ascending: false });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar ajustes:', error);
      throw new Error(error.message || 'Erro ao buscar histórico de ajustes');
    }

    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no getOrderAdjustments:', error);
    return { data: null, error };
  }
};

/**
 * Remove desconto de uma comanda
 *
 * @param {string} orderId - ID da comanda
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const removeDiscount = async orderId => {
  try {
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        discount_type: null,
        discount_value: 0,
        discount_reason: null,
        discount_applied_by: null,
        discount_applied_at: null,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao remover desconto:', error);
      throw new Error(error.message || 'Erro ao remover desconto');
    }

    toast.success('Desconto removido com sucesso!');
    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no removeDiscount:', error);
    toast.error(error.message || 'Erro ao remover desconto');
    return { data: null, error };
  }
};

/**
 * Remove taxa de uma comanda
 *
 * @param {string} orderId - ID da comanda
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const removeFee = async orderId => {
  try {
    if (!orderId) {
      throw new Error('ID da comanda é obrigatório');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        fee_type: null,
        fee_value: 0,
        fee_reason: null,
        fee_applied_by: null,
        fee_applied_at: null,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao remover taxa:', error);
      throw new Error(error.message || 'Erro ao remover taxa');
    }

    toast.success('Taxa removida com sucesso!');
    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro no removeFee:', error);
    toast.error(error.message || 'Erro ao remover taxa');
    return { data: null, error };
  }
};

export default {
  applyDiscount,
  applyFee,
  calculateOrderFinalTotal,
  getOrderAdjustments,
  removeDiscount,
  removeFee,
};
