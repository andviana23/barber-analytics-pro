/**
 * @file orderRepository.js
 * @description Repository para operações de Orders (Comandas) e Order Items
 * @module Repositories/Order
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { supabase } from '../services/supabase';

/**
 * Repository para gerenciar operações de comandas no banco de dados
 * Segue padrão Repository do Clean Architecture
 */
class OrderRepository {
  /**
   * Cria uma nova comanda
   *
   * @param {Object} data - Dados da comanda
   * @param {string} data.unitId - ID da unidade
   * @param {string} data.clientId - ID do cliente
   * @param {string} data.professionalId - ID do profissional responsável
   * @param {string} data.cashRegisterId - ID do caixa
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createOrder(data) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          unit_id: data.unitId,
          client_id: data.clientId,
          professional_id: data.professionalId,
          cash_register_id: data.cashRegisterId,
          status: 'open',
          total_amount: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao criar comanda:', error);
        return { data: null, error };
      }

      console.log('[OrderRepository] Comanda criada com sucesso:', order.id);
      return { data: order, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao criar comanda:', error);
      return { data: null, error };
    }
  }

  /**
   * Adiciona um item à comanda
   *
   * @param {Object} data - Dados do item
   * @param {string} data.orderId - ID da comanda
   * @param {string} data.serviceId - ID do serviço
   * @param {string} data.professionalId - ID do profissional que executará o serviço
   * @param {number} data.quantity - Quantidade
   * @param {number} data.unitPrice - Preço unitário
   * @param {number} data.commissionPercentage - Percentual de comissão
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async addOrderItem(data) {
    try {
      const commissionValue =
        (data.unitPrice * data.quantity * data.commissionPercentage) / 100;

      const { data: item, error } = await supabase
        .from('order_items')
        .insert({
          order_id: data.orderId,
          service_id: data.serviceId,
          professional_id: data.professionalId,
          quantity: data.quantity,
          unit_price: data.unitPrice,
          commission_percentage: data.commissionPercentage,
          commission_value: commissionValue,
        })
        .select()
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao adicionar item:', error);
        return { data: null, error };
      }

      console.log('[OrderRepository] Item adicionado com sucesso:', item.id);
      return { data: item, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao adicionar item:', error);
      return { data: null, error };
    }
  }

  /**
   * Remove um item da comanda
   *
   * @param {string} id - ID do item
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async removeOrderItem(id) {
    try {
      const { data: item, error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao remover item:', error);
        return { data: null, error };
      }

      console.log('[OrderRepository] Item removido com sucesso:', id);
      return { data: item, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao remover item:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca uma comanda por ID com todos os detalhes
   *
   * @param {string} id - ID da comanda
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getOrderById(id) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          unit:units(id, name),
          client:parties!client_id(id, name, cpf_cnpj, phone),
          professional:professionals!professional_id(id, name, role),
          cash_register:cash_registers(id, status, opening_time),
          items:order_items(
            *,
            service:services(id, name, duration_minutes),
            professional:professionals!professional_id(id, name)
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error(
          '[OrderRepository] Erro ao buscar comanda por ID:',
          error
        );
        return { data: null, error };
      }

      return { data: order, error: null };
    } catch (error) {
      console.error(
        '[OrderRepository] Exceção ao buscar comanda por ID:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Lista comandas com filtros e paginação
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.cashRegisterId] - ID do caixa
   * @param {string} [filters.professionalId] - ID do profissional
   * @param {string} [filters.clientId] - ID do cliente
   * @param {string} [filters.status] - Status da comanda
   * @param {string} [filters.startDate] - Data inicial
   * @param {string} [filters.endDate] - Data final
   * @param {number} [filters.page=1] - Página atual
   * @param {number} [filters.limit=20] - Limite de registros por página
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listOrders(unitId, filters = {}) {
    try {
      const {
        cashRegisterId,
        professionalId,
        clientId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;

      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(
          `
          *,
          client:parties!client_id(id, name),
          professional:professionals!professional_id(id, name)
        `,
          { count: 'exact' }
        )
        .eq('unit_id', unitId);

      if (cashRegisterId) {
        query = query.eq('cash_register_id', cashRegisterId);
      }

      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: orders, error, count } = await query;

      if (error) {
        console.error('[OrderRepository] Erro ao listar comandas:', error);
        return { data: null, error, count: null };
      }

      return { data: orders, error: null, count };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao listar comandas:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Fecha uma comanda chamando a função do banco de dados
   *
   * @param {string} id - ID da comanda
   * @param {string} paymentMethodId - ID da forma de pagamento
   * @param {string} [accountId] - ID da conta bancária
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async closeOrder(id, paymentMethodId, accountId = null) {
    try {
      const { data: result, error } = await supabase.rpc(
        'fn_close_order_and_generate_revenue',
        {
          p_order_id: id,
          p_payment_method_id: paymentMethodId,
          p_account_id: accountId,
        }
      );

      if (error) {
        console.error('[OrderRepository] Erro ao fechar comanda:', error);
        return { data: null, error };
      }

      console.log('[OrderRepository] Comanda fechada com sucesso:', id);
      return { data: result, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao fechar comanda:', error);
      return { data: null, error };
    }
  }

  /**
   * Cancela uma comanda
   *
   * @param {string} id - ID da comanda
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async cancelOrder(id, reason) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'canceled',
          closed_at: new Date().toISOString(),
          // Note: você pode adicionar um campo 'cancel_reason' na tabela se necessário
        })
        .eq('id', id)
        .eq('status', 'open')
        .select()
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao cancelar comanda:', error);
        return { data: null, error };
      }

      if (!order) {
        return {
          data: null,
          error: new Error(
            'Comanda não encontrada ou já está fechada/cancelada'
          ),
        };
      }

      console.log('[OrderRepository] Comanda cancelada com sucesso:', id);
      return { data: order, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao cancelar comanda:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca comandas de um profissional em um período
   *
   * @param {string} professionalId - ID do profissional
   * @param {Object} dateRange - Intervalo de datas
   * @param {string} dateRange.startDate - Data inicial
   * @param {string} dateRange.endDate - Data final
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getOrdersByProfessional(professionalId, dateRange) {
    try {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          client:parties!client_id(id, name),
          items:order_items(
            *,
            service:services(id, name)
          )
        `
        )
        .eq('professional_id', professionalId);

      if (dateRange?.startDate) {
        query = query.gte('created_at', dateRange.startDate);
      }

      if (dateRange?.endDate) {
        query = query.lte('created_at', dateRange.endDate);
      }

      query = query.order('created_at', { ascending: false });

      const { data: orders, error } = await query;

      if (error) {
        console.error(
          '[OrderRepository] Erro ao buscar comandas do profissional:',
          error
        );
        return { data: null, error };
      }

      return { data: orders, error: null };
    } catch (error) {
      console.error(
        '[OrderRepository] Exceção ao buscar comandas do profissional:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Busca comandas de um caixa
   *
   * @param {string} cashRegisterId - ID do caixa
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getOrdersByCashRegister(cashRegisterId) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          client:parties!client_id(id, name),
          professional:professionals!professional_id(id, name)
        `
        )
        .eq('cash_register_id', cashRegisterId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(
          '[OrderRepository] Erro ao buscar comandas do caixa:',
          error
        );
        return { data: null, error };
      }

      return { data: orders, error: null };
    } catch (error) {
      console.error(
        '[OrderRepository] Exceção ao buscar comandas do caixa:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Atualiza um item da comanda
   *
   * @param {string} id - ID do item
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateOrderItem(id, data) {
    try {
      const updateData = {};

      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.professionalId !== undefined) {
        updateData.professional_id = data.professionalId;
      }
      if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
      if (data.commissionPercentage !== undefined) {
        updateData.commission_percentage = data.commissionPercentage;
      }

      // Recalcula comissão se houver mudanças relevantes
      if (
        data.unitPrice !== undefined ||
        data.quantity !== undefined ||
        data.commissionPercentage !== undefined
      ) {
        const item = await this.getOrderItemById(id);
        if (item.data) {
          const quantity = data.quantity || item.data.quantity;
          const unitPrice = data.unitPrice || item.data.unit_price;
          const commissionPercentage =
            data.commissionPercentage || item.data.commission_percentage;
          updateData.commission_value =
            (unitPrice * quantity * commissionPercentage) / 100;
        }
      }

      const { data: item, error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao atualizar item:', error);
        return { data: null, error };
      }

      console.log('[OrderRepository] Item atualizado com sucesso:', id);
      return { data: item, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao atualizar item:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca um item da comanda por ID
   *
   * @param {string} id - ID do item
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getOrderItemById(id) {
    try {
      const { data: item, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[OrderRepository] Erro ao buscar item por ID:', error);
        return { data: null, error };
      }

      return { data: item, error: null };
    } catch (error) {
      console.error('[OrderRepository] Exceção ao buscar item por ID:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca itens de uma comanda
   *
   * @param {string} orderId - ID da comanda
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getOrderItems(orderId) {
    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select(
          `
          *,
          service:services(id, name, duration_minutes),
          professional:professionals!professional_id(id, name)
        `
        )
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(
          '[OrderRepository] Erro ao buscar itens da comanda:',
          error
        );
        return { data: null, error };
      }

      return { data: items, error: null };
    } catch (error) {
      console.error(
        '[OrderRepository] Exceção ao buscar itens da comanda:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Busca detalhes de comandas usando a view vw_order_details
   *
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getOrderDetails(filters = {}) {
    try {
      let query = supabase.from('vw_order_details').select('*');

      if (filters.orderId) {
        query = query.eq('order_id', filters.orderId);
      }

      if (filters.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }

      if (filters.professionalId) {
        query = query.eq('professional_id', filters.professionalId);
      }

      const { data: details, error } = await query;

      if (error) {
        console.error(
          '[OrderRepository] Erro ao buscar detalhes das comandas:',
          error
        );
        return { data: null, error };
      }

      return { data: details, error: null };
    } catch (error) {
      console.error(
        '[OrderRepository] Exceção ao buscar detalhes das comandas:',
        error
      );
      return { data: null, error };
    }
  }
}

export default new OrderRepository();
