/**
 * Payment Methods Service
 * 
 * Serviço para gerenciar formas de pagamento (métodos de recebimento).
 * Inclui CRUD completo com soft delete pattern.
 */

import { supabase } from './supabase';

/**
 * Buscar todas as formas de pagamento de uma unidade
 * 
 * @param {string} unitId - UUID da unidade
 * @param {boolean} includeInactive - Se deve incluir formas de pagamento inativas
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getPaymentMethods = async (unitId, includeInactive = false) => {
  try {
    let query = supabase
      .from('payment_methods')
      .select(`
        *,
        units:unit_id (
          id,
          name
        )
      `);
    
    // Filtrar por unidade se unitId for fornecido
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }
    
    query = query.order('name', { ascending: true });

    // Filtrar apenas ativos se includeInactive for false
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar formas de pagamento:', error);
    return { data: null, error };
  }
};

/**
 * Buscar uma forma de pagamento por ID
 * 
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPaymentMethodById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar forma de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao buscar forma de pagamento:', error);
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
export const createPaymentMethod = async (paymentMethodData) => {
  try {
    // Obter o user_id do usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();

    // Validações básicas
    if (!paymentMethodData.unit_id) {
      return { data: null, error: new Error('unit_id é obrigatório') };
    }

    if (!paymentMethodData.name || paymentMethodData.name.trim() === '') {
      return { data: null, error: new Error('Nome é obrigatório') };
    }

    if (paymentMethodData.fee_percentage < 0 || paymentMethodData.fee_percentage > 100) {
      return { data: null, error: new Error('Taxa deve estar entre 0% e 100%') };
    }

    if (paymentMethodData.receipt_days < 0) {
      return { data: null, error: new Error('Prazo de recebimento não pode ser negativo') };
    }

    // Preparar dados para inserção
    const insertData = {
      unit_id: paymentMethodData.unit_id,
      name: paymentMethodData.name.trim(),
      fee_percentage: Number(paymentMethodData.fee_percentage),
      receipt_days: Number(paymentMethodData.receipt_days),
      is_active: paymentMethodData.is_active !== undefined ? paymentMethodData.is_active : true,
      created_by: user?.id || null
    };

    const { data, error } = await supabase
      .from('payment_methods')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar forma de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao criar forma de pagamento:', error);
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
    // Validações básicas
    if (updates.name !== undefined && updates.name.trim() === '') {
      return { data: null, error: new Error('Nome não pode ser vazio') };
    }

    if (updates.fee_percentage !== undefined && 
        (updates.fee_percentage < 0 || updates.fee_percentage > 100)) {
      return { data: null, error: new Error('Taxa deve estar entre 0% e 100%') };
    }

    if (updates.receipt_days !== undefined && updates.receipt_days < 0) {
      return { data: null, error: new Error('Prazo de recebimento não pode ser negativo') };
    }

    // Preparar dados para atualização
    const updateData = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }

    if (updates.fee_percentage !== undefined) {
      updateData.fee_percentage = Number(updates.fee_percentage);
    }

    if (updates.receipt_days !== undefined) {
      updateData.receipt_days = Number(updates.receipt_days);
    }

    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar forma de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao atualizar forma de pagamento:', error);
    return { data: null, error };
  }
};

/**
 * Soft delete - Desativar forma de pagamento
 * 
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const deletePaymentMethod = async (id) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao desativar forma de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao desativar forma de pagamento:', error);
    return { data: null, error };
  }
};

/**
 * Ativar forma de pagamento
 * 
 * @param {string} id - UUID da forma de pagamento
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const activatePaymentMethod = async (id) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao ativar forma de pagamento:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao ativar forma de pagamento:', error);
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
export const hardDeletePaymentMethod = async (id) => {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao deletar forma de pagamento permanentemente:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro inesperado ao deletar forma de pagamento:', error);
    return { data: null, error };
  }
};

/**
 * Obter estatísticas das formas de pagamento de uma unidade
 * 
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getPaymentMethodsStats = async (unitId) => {
  try {
    const { data: allMethods, error: allError } = await getPaymentMethods(unitId, true);

    if (allError) {
      return { data: null, error: allError };
    }

    const activeMethods = allMethods.filter(method => method.is_active);
    
    const stats = {
      total: allMethods.length,
      active: activeMethods.length,
      inactive: allMethods.length - activeMethods.length,
      averageFee: activeMethods.length > 0
        ? activeMethods.reduce((sum, m) => sum + Number(m.fee_percentage), 0) / activeMethods.length
        : 0,
      averageReceiptDays: activeMethods.length > 0
        ? activeMethods.reduce((sum, m) => sum + Number(m.receipt_days), 0) / activeMethods.length
        : 0
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Erro ao calcular estatísticas das formas de pagamento:', error);
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
  getPaymentMethodsStats
};
