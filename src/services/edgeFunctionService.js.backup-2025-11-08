/**
 * @fileoverview Edge Function Service - Wrapper para chamar Edge Functions do Supabase
 * @module services/edgeFunctionService
 * @description Centraliza chamadas a Edge Functions com tratamento de erros padronizado
 * @author Andrey Viana
 * @created 28/10/2025
 */

import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

/**
 * Wrapper genérico para invocar Edge Functions
 * @param {string} functionName - Nome da Edge Function
 * @param {Object} payload - Dados a enviar
 * @param {Object} options - Opções adicionais
 * @returns {Promise<{data: any, error: any}>}
 */
const invokeEdgeFunction = async (functionName, payload = {}, options = {}) => {
  try {
    const { showToast = true, timeout = 30000 } = options;

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`❌ Erro ao chamar Edge Function ${functionName}:`, error);

      if (showToast) {
        toast.error(
          `Erro ao processar: ${error.message || 'Erro desconhecido'}`
        );
      }

      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`❌ Exceção ao chamar Edge Function ${functionName}:`, error);

    const errorMessage =
      error.name === 'AbortError'
        ? 'Tempo limite excedido. Tente novamente.'
        : error.message || 'Erro ao processar requisição';

    if (options.showToast !== false) {
      toast.error(errorMessage);
    }

    return {
      data: null,
      error: { message: errorMessage, originalError: error },
    };
  }
};

/**
 * Calcula totais de uma comanda (subtotal, desconto, comissões)
 * @param {string} orderId - UUID da comanda
 * @returns {Promise<{data: {subtotal, discount, total, commission_total, items}, error: any}>}
 */
export const calculateOrderTotals = async orderId => {
  if (!orderId) {
    toast.error('ID da comanda é obrigatório');
    return {
      data: null,
      error: { message: 'ID da comanda é obrigatório' },
    };
  }

  const { data, error } = await invokeEdgeFunction(
    'calculate-order-totals',
    { order_id: orderId },
    { showToast: true, timeout: 15000 }
  );

  if (error) {
    return { data: null, error };
  }

  // Validar estrutura do retorno
  if (!data || typeof data.total !== 'number') {
    // eslint-disable-next-line no-console
    console.error('❌ Retorno inválido da Edge Function:', data);
    toast.error('Erro ao calcular totais da comanda');
    return {
      data: null,
      error: { message: 'Retorno inválido da Edge Function' },
    };
  }

  return { data, error: null };
};

/**
 * Valida se uma comanda pode ser fechada
 * @param {string} orderId - UUID da comanda
 * @param {string} paymentMethodId - UUID da forma de pagamento
 * @param {string} accountId - UUID da conta de destino
 * @returns {Promise<{data: {valid: boolean, errors?: string[], order?: Object}, error: any}>}
 */
export const validateOrderClose = async (
  orderId,
  paymentMethodId,
  accountId
) => {
  if (!orderId || !paymentMethodId || !accountId) {
    const missingFields = [];
    if (!orderId) missingFields.push('ID da comanda');
    if (!paymentMethodId) missingFields.push('Forma de pagamento');
    if (!accountId) missingFields.push('Conta de destino');

    const errorMsg = `Campos obrigatórios: ${missingFields.join(', ')}`;
    toast.error(errorMsg);

    return {
      data: {
        valid: false,
        errors: [errorMsg],
      },
      error: null,
    };
  }

  // Chamar RPC do Supabase (não é Edge Function)
  const { data, error } = await supabase.rpc('fn_validate_order_close', {
    p_order_id: orderId,
    p_payment_method_id: paymentMethodId,
    p_account_id: accountId,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Erro ao validar fechamento de comanda:', error);
    toast.error('Erro ao validar comanda');
    return { data: null, error };
  }

  // Se não for válido, mostrar erros
  if (data && !data.valid && data.errors?.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Validação de comanda falhou:', data.errors);
    data.errors.forEach(err => toast.error(err));
  }

  return { data, error: null };
};

/**
 * Wrapper genérico para outras Edge Functions futuras
 * @param {string} functionName - Nome da função
 * @param {Object} payload - Dados
 * @param {Object} options - Opções
 * @returns {Promise<{data: any, error: any}>}
 */
export const callEdgeFunction = invokeEdgeFunction;

export default {
  calculateOrderTotals,
  validateOrderClose,
  callEdgeFunction,
};
