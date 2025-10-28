/**
 * @file orderService.js
 * @description Service Layer para Orders (Comandas) - Business Logic
 * @module Services/Order
 * @author Andrey Viana
 * @date 2025-10-24
 */

import orderRepository from '../repositories/orderRepository';
import cashRegisterRepository from '../repositories/cashRegisterRepository';
import serviceRepository from '../repositories/serviceRepository';
import financeiroService from './financeiroService'; // FASE 6: Integração com módulo financeiro
import { getProfessionalCommissions } from './professionalCommissionService';
import {
  validateCreateOrder,
  validateCloseOrder,
  validateCancelOrder,
} from '../dtos/OrderDTO';
import {
  validateAddOrderItem,
  calculateOrderTotals,
} from '../dtos/OrderItemDTO';
import { toast } from 'react-hot-toast';

/**
 * Service para gerenciar regras de negócio de Orders
 * Camada intermediária entre Controller/UI e Repository
 */
class OrderService {
  /**
   * Cria uma nova comanda
   *
   * Regras de negócio:
   * - Deve existir um caixa aberto na unidade
   * - Cliente e profissional devem ser válidos
   *
   * @param {Object} data - Dados da comanda
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createOrder(data) {
    try {
      // Validação do DTO
      const validation = validateCreateOrder(data);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Verifica se existe caixa aberto
      const { data: activeCash, error: cashError } =
        await cashRegisterRepository.getActiveCashRegister(data.unitId);

      if (cashError) {
        toast.error('Erro ao verificar caixa aberto');
        return { data: null, error: cashError };
      }

      if (!activeCash) {
        const error = new Error(
          'Não há caixa aberto. Abra um caixa antes de criar comandas.'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Vincula ao caixa aberto
      const orderData = {
        ...validation.data,
        cashRegisterId: activeCash.id,
      };

      // Cria a comanda
      const result = await orderRepository.createOrder(orderData);

      if (result.error) {
        toast.error('Erro ao criar comanda');
        return result;
      }

      toast.success('Comanda criada com sucesso!');

      // Log de auditoria
      console.info('[OrderService] Comanda criada:', {
        orderId: result.data.id,
        unitId: data.unitId,
        clientId: data.clientId,
        professionalId: data.professionalId,
        cashRegisterId: activeCash.id,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao criar comanda');
      return { data: null, error };
    }
  }

  /**
   * Adiciona um serviço à comanda
   *
   * Regras de negócio:
   * - Comanda deve estar aberta
   * - Serviço deve estar ativo
   * - Calcula comissão automaticamente
   *
   * @param {string} orderId - ID da comanda
   * @param {Object} serviceData - Dados do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async addServiceToOrder(orderId, serviceData) {
    try {
      // Busca a comanda
      const { data: order, error: orderError } =
        await orderRepository.getOrderById(orderId);

      if (orderError) {
        toast.error('Erro ao buscar comanda');
        return { data: null, error: orderError };
      }

      // Valida se comanda está aberta
      if (order.status !== 'open') {
        const error = new Error(
          'Não é possível adicionar serviços a uma comanda fechada ou cancelada'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Busca dados do serviço
      const { data: service, error: serviceError } =
        await serviceRepository.getServiceById(serviceData.serviceId);

      if (serviceError) {
        toast.error('Erro ao buscar dados do serviço');
        return { data: null, error: serviceError };
      }

      if (!service.active) {
        const error = new Error('Este serviço está desativado');
        toast.error(error.message);
        return { data: null, error };
      }

      // Busca comissão personalizada do profissional para este serviço
      const professionalId = serviceData.professionalId || order.professional_id;
      const { data: professionalCommissions } = 
        await getProfessionalCommissions(professionalId);
      
      // Verifica se há comissão personalizada para este serviço
      const customCommission = professionalCommissions?.find(
        comm => comm.service_id === serviceData.serviceId
      );
      
      // Usa comissão personalizada se existir, senão usa a padrão do serviço
      const commissionPercentage = customCommission 
        ? customCommission.commission_percentage 
        : service.commission_percentage;

      // Prepara dados do item
      const itemData = {
        orderId,
        serviceId: serviceData.serviceId,
        professionalId,
        quantity: serviceData.quantity || 1,
        unitPrice: service.price,
        commissionPercentage,
      };

      // Validação do DTO
      const validation = validateAddOrderItem(itemData);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Adiciona o item
      const result = await orderRepository.addOrderItem(validation.data);

      if (result.error) {
        toast.error('Erro ao adicionar serviço');
        return result;
      }

      toast.success(`Serviço "${service.name}" adicionado!`);

      // Log de auditoria
      console.info('[OrderService] Serviço adicionado à comanda:', {
        orderId,
        itemId: result.data.id,
        serviceId: service.id,
        serviceName: service.name,
        quantity: validation.data.quantity,
        commissionType: customCommission ? 'personalizada' : 'padrão',
        commissionPercentage: validation.data.commissionPercentage,
        defaultCommission: service.commission_percentage,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao adicionar serviço');
      return { data: null, error };
    }
  }

  /**
   * Remove um serviço da comanda
   *
   * @param {string} itemId - ID do item
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async removeServiceFromOrder(itemId) {
    try {
      // Busca o item para validar
      const { data: item, error: itemError } =
        await orderRepository.getOrderItemById(itemId);

      if (itemError) {
        toast.error('Erro ao buscar item');
        return { data: null, error: itemError };
      }

      // Busca a comanda
      const { data: order, error: orderError } =
        await orderRepository.getOrderById(item.order_id);

      if (orderError) {
        toast.error('Erro ao buscar comanda');
        return { data: null, error: orderError };
      }

      // Valida se comanda está aberta
      if (order.status !== 'open') {
        const error = new Error(
          'Não é possível remover serviços de uma comanda fechada ou cancelada'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Remove o item
      const result = await orderRepository.removeOrderItem(itemId);

      if (result.error) {
        toast.error('Erro ao remover serviço');
        return result;
      }

      toast.success('Serviço removido da comanda!');

      // Log de auditoria
      console.info('[OrderService] Serviço removido da comanda:', {
        itemId,
        orderId: item.order_id,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao remover serviço');
      return { data: null, error };
    }
  }

  /**
   * Fecha uma comanda e gera receita
   *
   * Regras de negócio:
   * - Comanda deve estar aberta
   * - Deve ter pelo menos um item
   * - Gera receita automaticamente
   *
   * @param {string} orderId - ID da comanda
   * @param {Object} data - Dados de fechamento
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async closeOrder(orderId, data) {
    try {
      // Validação do DTO
      const validation = validateCloseOrder(data);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Busca a comanda
      const { data: order, error: orderError } =
        await orderRepository.getOrderById(orderId);

      if (orderError) {
        toast.error('Erro ao buscar comanda');
        return { data: null, error: orderError };
      }

      // Valida se comanda está aberta
      if (order.status !== 'open') {
        const error = new Error('Esta comanda já está fechada ou cancelada');
        toast.error(error.message);
        return { data: null, error };
      }

      // Valida se tem itens
      if (!order.items || order.items.length === 0) {
        const error = new Error(
          'Não é possível fechar uma comanda sem serviços'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Fecha a comanda e gera receita
      const result = await orderRepository.closeOrder(
        orderId,
        validation.data.paymentMethodId,
        validation.data.accountId
      );

      if (result.error) {
        toast.error('Erro ao fechar comanda');
        return result;
      }

      const totals = calculateOrderTotals(order.items);

      // FASE 6: Integrar com módulo financeiro
      // Criar receita automaticamente a partir da comanda
      const revenueData = {
        orderId,
        totalAmount: totals.totalAmount,
        clientId: order.client_id,
        professionalId: order.professional_id,
        unitId: order.unit_id,
        userId: order.user_id || validation.data.userId,
        paymentMethodId: validation.data.paymentMethodId,
        accountId: validation.data.accountId,
        date: new Date().toISOString().split('T')[0],
        observations: `Receita gerada automaticamente da comanda. Itens: ${order.items.length}, Comissão total: R$ ${totals.totalCommission.toFixed(2)}`,
      };

      // eslint-disable-next-line no-console
      console.log('💰 [OrderService] Criando receita da comanda:', revenueData);

      const revenueResult =
        await financeiroService.createReceitaFromOrder(revenueData);

      if (revenueResult.error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ [OrderService] Erro ao criar receita:',
          revenueResult.error
        );
        toast.error(
          'Comanda fechada, mas houve erro ao gerar receita. Contate o suporte.'
        );

        return {
          data: {
            orderId,
            revenueId: null,
            revenueError: revenueResult.error,
            totals,
          },
          error: null, // Comanda foi fechada, apenas a receita falhou
        };
      }

      toast.success(
        `✅ Comanda fechada! Total: R$ ${totals.totalAmount.toFixed(2)} | Receita gerada`
      );

      // Log de auditoria
      // eslint-disable-next-line no-console
      console.info('[OrderService] Comanda fechada com receita gerada:', {
        orderId,
        revenueId: revenueResult.data?.id,
        totalAmount: totals.totalAmount,
        totalCommission: totals.totalCommission,
        itemsCount: totals.itemsCount,
      });

      return {
        data: {
          orderId,
          revenueId: revenueResult.data?.id,
          totals,
        },
        error: null,
      };
    } catch (error) {
      toast.error('Erro inesperado ao fechar comanda');
      return { data: null, error };
    }
  }

  /**
   * Cancela uma comanda
   *
   * @param {string} orderId - ID da comanda
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async cancelOrder(orderId, reason) {
    try {
      // Validação do DTO
      const validation = validateCancelOrder({ reason });

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Busca a comanda
      const { data: order, error: orderError } =
        await orderRepository.getOrderById(orderId);

      if (orderError) {
        toast.error('Erro ao buscar comanda');
        return { data: null, error: orderError };
      }

      // Valida se comanda está aberta
      if (order.status !== 'open') {
        const error = new Error('Esta comanda já está fechada ou cancelada');
        toast.error(error.message);
        return { data: null, error };
      }

      // Cancela a comanda
      const result = await orderRepository.cancelOrder(orderId, reason);

      if (result.error) {
        toast.error('Erro ao cancelar comanda');
        return result;
      }

      toast.success('Comanda cancelada!');

      // Log de auditoria
      console.info('[OrderService] Comanda cancelada:', {
        orderId,
        reason,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao cancelar comanda');
      return { data: null, error };
    }
  }

  /**
   * Busca detalhes de uma comanda
   *
   * @param {string} orderId - ID da comanda
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getOrderDetails(orderId) {
    try {
      const { data: order, error } =
        await orderRepository.getOrderById(orderId);

      if (error) {
        toast.error('Erro ao buscar comanda');
        return { data: null, error };
      }

      // Calcula totais
      const totals = calculateOrderTotals(order.items || []);

      return {
        data: {
          ...order,
          totals,
        },
        error: null,
      };
    } catch (error) {
      toast.error('Erro inesperado ao buscar comanda');
      return { data: null, error };
    }
  }

  /**
   * Lista comandas com filtros
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listOrders(unitId, filters = {}) {
    try {
      const result = await orderRepository.listOrders(unitId, filters);

      if (result.error) {
        toast.error('Erro ao listar comandas');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao listar comandas');
      return { data: null, error, count: null };
    }
  }

  /**
   * Calcula total de uma comanda
   *
   * @param {string} orderId - ID da comanda
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async calculateOrderTotal(orderId) {
    try {
      const { data: items, error } =
        await orderRepository.getOrderItems(orderId);

      if (error) {
        toast.error('Erro ao buscar itens da comanda');
        return { data: null, error };
      }

      const totals = calculateOrderTotals(items);

      return { data: totals, error: null };
    } catch (error) {
      toast.error('Erro inesperado ao calcular total');
      return { data: null, error };
    }
  }

  /**
   * Gera relatório de comissões por profissional
   *
   * @param {string} professionalId - ID do profissional
   * @param {Object} dateRange - Período do relatório
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async generateCommissionReport(professionalId, dateRange) {
    try {
      const { data: orders, error } =
        await orderRepository.getOrdersByProfessional(
          professionalId,
          dateRange
        );

      if (error) {
        toast.error('Erro ao buscar comandas do profissional');
        return { data: null, error };
      }

      // Calcula totais de comissão
      let totalCommission = 0;
      let totalServices = 0;
      let totalOrders = orders?.length || 0;

      orders?.forEach(order => {
        order.items?.forEach(item => {
          totalCommission += item.commission_value || 0;
          totalServices += item.quantity || 0;
        });
      });

      const report = {
        professionalId,
        period: dateRange,
        totalOrders,
        totalServices,
        totalCommission,
        averageCommissionPerOrder:
          totalOrders > 0 ? totalCommission / totalOrders : 0,
        orders,
      };

      return { data: report, error: null };
    } catch (error) {
      toast.error('Erro inesperado ao gerar relatório');
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
      const result =
        await orderRepository.getOrdersByCashRegister(cashRegisterId);

      if (result.error) {
        toast.error('Erro ao buscar comandas do caixa');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao buscar comandas');
      return { data: null, error };
    }
  }

  /**
   * Gera relatório de comissões com filtros avançados
   *
   * FASE 6.2 - Relatório completo de comissões
   *
   * @param {Object} filters - Filtros para o relatório
   * @param {string} filters.professionalId - ID do profissional (opcional)
   * @param {string} filters.startDate - Data início (opcional)
   * @param {string} filters.endDate - Data fim (opcional)
   * @param {string} filters.status - Status da comissão: 'all', 'paid', 'pending'
   * @param {string} filters.orderId - ID da comanda (opcional)
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getCommissionReport(filters = {}) {
    try {
      const { professionalId, startDate, endDate, status, orderId } = filters;

      // Busca itens de comanda com join completo
      const { data: items, error } = await orderRepository.getOrderDetails({
        professionalId,
        startDate,
        endDate,
        orderId,
      });

      if (error) {
        toast.error('Erro ao buscar dados de comissões');
        return { data: null, error };
      }

      // Filtra por status se especificado
      let filteredItems = items || [];

      if (status && status !== 'all') {
        filteredItems = filteredItems.filter(
          item => item.commission_status === status
        );
      }

      // Transforma dados para formato do relatório
      const reportData = filteredItems.map(item => ({
        id: item.item_id,
        orderId: item.order_id,
        orderNumber: item.order_number,
        professionalId: item.professional_id,
        professionalName: item.professional_name,
        clientId: item.client_id,
        clientName: item.client_name,
        serviceId: item.service_id,
        serviceName: item.service_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        commissionPercentage: item.commission_percentage,
        commissionValue: item.commission_value,
        status: item.commission_status || 'pending',
        date: item.order_date,
        paymentDate: item.commission_payment_date || null,
      }));

      return { data: reportData, error: null };
    } catch (error) {
      toast.error('Erro inesperado ao gerar relatório de comissões');
      return { data: null, error };
    }
  }
}

export default new OrderService();
