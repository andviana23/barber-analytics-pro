/**
 * @file orderService.test.js
 * @description Testes Unitários para orderService (Business Logic)
 * @module Tests/Services/OrderService
 * @author Andrey Viana
 * @date 2025-01-20
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// MOCKS - Devem vir ANTES dos imports que os utilizam
// ============================================================================

// Mock do toast (react-hot-toast)
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Mock do orderRepository
vi.mock('../../src/repositories/orderRepository', () => ({
  default: {
    createOrder: vi.fn(),
    getOrderById: vi.fn(),
    addOrderItem: vi.fn(),
    getOrderItemById: vi.fn(),
    removeOrderItem: vi.fn(),
    closeOrder: vi.fn(),
    cancelOrder: vi.fn(),
    listOrders: vi.fn(),
    getOrderItems: vi.fn(),
    getOrdersByProfessional: vi.fn(),
    getOrdersByCashRegister: vi.fn(),
    getOrderDetails: vi.fn(),
  },
}));

// Mock do cashRegisterRepository
vi.mock('../../src/repositories/cashRegisterRepository', () => ({
  default: {
    getActiveCashRegister: vi.fn(),
  },
}));

// Mock do serviceRepository
vi.mock('../../src/repositories/serviceRepository', () => ({
  default: {
    getServiceById: vi.fn(),
  },
}));

// Mock do financeiroService
vi.mock('../../src/services/financeiroService', () => ({
  default: {
    createReceitaFromOrder: vi.fn(),
  },
}));

// ============================================================================
// IMPORTS - Após os mocks
// ============================================================================

import { toast } from 'react-hot-toast';
import orderService from '../../src/services/orderService';
import orderRepository from '../../src/repositories/orderRepository';
import cashRegisterRepository from '../../src/repositories/cashRegisterRepository';
import serviceRepository from '../../src/repositories/serviceRepository';
import financeiroService from '../../src/services/financeiroService';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

// Mock de console.info para silenciar logs nos testes
const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// MOCK DATA
// ============================================================================

// UUIDs válidos para testes
const validUUIDs = {
  unit: '550e8400-e29b-41d4-a716-446655440001',
  cash: '550e8400-e29b-41d4-a716-446655440002',
  client: '550e8400-e29b-41d4-a716-446655440003',
  professional: '550e8400-e29b-41d4-a716-446655440004',
  service: '550e8400-e29b-41d4-a716-446655440005',
  order: '550e8400-e29b-41d4-a716-446655440006',
  item: '550e8400-e29b-41d4-a716-446655440007',
  revenue: '550e8400-e29b-41d4-a716-446655440008',
  paymentMethod: '550e8400-e29b-41d4-a716-446655440009',
  account: '550e8400-e29b-41d4-a716-44665544000a',
  user: '550e8400-e29b-41d4-a716-44665544000b',
};

const mockActiveCash = {
  id: validUUIDs.cash,
  unit_id: validUUIDs.unit,
  opened_at: '2025-01-20T08:00:00Z',
  opened_by: validUUIDs.user,
  status: 'open',
};

const mockService = {
  id: validUUIDs.service,
  name: 'Corte de Cabelo',
  price: 50.0,
  commission_percentage: 40,
  active: true,
};

const mockOrderData = {
  unitId: validUUIDs.unit,
  clientId: validUUIDs.client,
  professionalId: validUUIDs.professional,
};

const mockOpenOrder = {
  id: validUUIDs.order,
  status: 'open',
  unit_id: validUUIDs.unit,
  client_id: validUUIDs.client,
  professional_id: validUUIDs.professional,
  cash_register_id: validUUIDs.cash,
  items: [
    {
      id: validUUIDs.item,
      service_id: validUUIDs.service,
      quantity: 1,
      unitPrice: 50.0, // calculateOrderTotals usa camelCase
      commissionPercentage: 40, // calculateOrderTotals usa camelCase
      commission_value: 20.0,
    },
  ],
};

const mockClosedOrder = {
  ...mockOpenOrder,
  status: 'closed',
};

const mockOrderItem = {
  id: validUUIDs.item,
  order_id: validUUIDs.order,
  service_id: validUUIDs.service,
  quantity: 1,
  unit_price: 50.0,
  commission_percentage: 40,
  commission_value: 20.0,
};

const mockRevenue = {
  id: validUUIDs.revenue,
  order_id: validUUIDs.order,
  total_amount: 50.0,
};

// ============================================================================
// TESTES - createOrder
// ============================================================================

describe('OrderService - createOrder', () => {
  it('deve criar comanda quando há caixa aberto', async () => {
    // Arrange
    cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
      data: mockActiveCash,
      error: null,
    });

    orderRepository.createOrder.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    // Act
    const result = await orderService.createOrder(mockOrderData);

    // Assert
    expect(result.data).toEqual(mockOpenOrder);
    expect(result.error).toBeNull();
    expect(cashRegisterRepository.getActiveCashRegister).toHaveBeenCalledWith(
      validUUIDs.unit
    );
    expect(orderRepository.createOrder).toHaveBeenCalledWith({
      ...mockOrderData,
      cashRegisterId: validUUIDs.cash,
    });
    expect(toast.success).toHaveBeenCalledWith('Comanda criada com sucesso!');
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('deve falhar se não houver caixa aberto', async () => {
    // Arrange
    cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
      data: null,
      error: null,
    });

    // Act
    const result = await orderService.createOrder(mockOrderData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Não há caixa aberto. Abra um caixa antes de criar comandas.'
    );
    expect(orderRepository.createOrder).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Não há caixa aberto. Abra um caixa antes de criar comandas.'
    );
  });

  it('deve falhar se DTO for inválido', async () => {
    // Arrange
    const invalidData = { unitId: validUUIDs.unit }; // Falta clientId e professionalId

    // Act
    const result = await orderService.createOrder(invalidData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(cashRegisterRepository.getActiveCashRegister).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('deve propagar erro do repository ao buscar caixa', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.createOrder(mockOrderData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao verificar caixa aberto');
  });

  it('deve propagar erro do repository ao criar comanda', async () => {
    // Arrange
    const dbError = new Error('Insert failed');
    cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
      data: mockActiveCash,
      error: null,
    });
    orderRepository.createOrder.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.createOrder(mockOrderData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao criar comanda');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    cashRegisterRepository.getActiveCashRegister.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await orderService.createOrder(mockOrderData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao criar comanda'
    );
  });
});

// ============================================================================
// TESTES - addServiceToOrder
// ============================================================================

describe('OrderService - addServiceToOrder', () => {
  it('deve adicionar serviço à comanda aberta', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    serviceRepository.getServiceById.mockResolvedValue({
      data: mockService,
      error: null,
    });

    orderRepository.addOrderItem.mockResolvedValue({
      data: mockOrderItem,
      error: null,
    });

    const serviceData = {
      serviceId: validUUIDs.service,
      quantity: 1,
    };

    // Act
    const result = await orderService.addServiceToOrder(
      validUUIDs.order,
      serviceData
    );

    // Assert
    expect(result.data).toEqual(mockOrderItem);
    expect(result.error).toBeNull();
    expect(orderRepository.getOrderById).toHaveBeenCalledWith(validUUIDs.order);
    expect(serviceRepository.getServiceById).toHaveBeenCalledWith(
      validUUIDs.service
    );
    expect(orderRepository.addOrderItem).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Serviço "Corte de Cabelo" adicionado!'
    );
  });

  it('deve falhar se comanda estiver fechada', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockClosedOrder,
      error: null,
    });

    // Act
    const result = await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Não é possível adicionar serviços a uma comanda fechada ou cancelada'
    );
    expect(serviceRepository.getServiceById).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });

  it('deve falhar se serviço estiver desativado', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    serviceRepository.getServiceById.mockResolvedValue({
      data: { ...mockService, active: false },
      error: null,
    });

    // Act
    const result = await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Este serviço está desativado');
    expect(orderRepository.addOrderItem).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Este serviço está desativado');
  });

  it('deve usar professionalId da comanda se não fornecido', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    serviceRepository.getServiceById.mockResolvedValue({
      data: mockService,
      error: null,
    });

    orderRepository.addOrderItem.mockResolvedValue({
      data: mockOrderItem,
      error: null,
    });

    // Act
    await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    const callArgs = orderRepository.addOrderItem.mock.calls[0][0];
    expect(callArgs.professionalId).toBe(validUUIDs.professional); // Do mockOpenOrder
  });

  it('deve propagar erro ao buscar comanda', async () => {
    // Arrange
    const dbError = new Error('Order not found');
    orderRepository.getOrderById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar comanda');
  });

  it('deve propagar erro ao buscar serviço', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    const dbError = new Error('Service not found');
    serviceRepository.getServiceById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar dados do serviço');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderById.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.addServiceToOrder(validUUIDs.order, {
      serviceId: validUUIDs.service,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao adicionar serviço'
    );
  });
});

// ============================================================================
// TESTES - removeServiceFromOrder
// ============================================================================

describe('OrderService - removeServiceFromOrder', () => {
  it('deve remover serviço de comanda aberta', async () => {
    // Arrange
    orderRepository.getOrderItemById.mockResolvedValue({
      data: mockOrderItem,
      error: null,
    });

    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    orderRepository.removeOrderItem.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    // Act
    const result = await orderService.removeServiceFromOrder(validUUIDs.item);

    // Assert
    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
    expect(orderRepository.removeOrderItem).toHaveBeenCalledWith(
      validUUIDs.item
    );
    expect(toast.success).toHaveBeenCalledWith('Serviço removido da comanda!');
  });

  it('deve falhar se comanda estiver fechada', async () => {
    // Arrange
    orderRepository.getOrderItemById.mockResolvedValue({
      data: mockOrderItem,
      error: null,
    });

    orderRepository.getOrderById.mockResolvedValue({
      data: mockClosedOrder,
      error: null,
    });

    // Act
    const result = await orderService.removeServiceFromOrder(validUUIDs.item);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Não é possível remover serviços de uma comanda fechada ou cancelada'
    );
    expect(orderRepository.removeOrderItem).not.toHaveBeenCalled();
  });

  it('deve propagar erro ao buscar item', async () => {
    // Arrange
    const dbError = new Error('Item not found');
    orderRepository.getOrderItemById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.removeServiceFromOrder(validUUIDs.item);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar item');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderItemById.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await orderService.removeServiceFromOrder(validUUIDs.item);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao remover serviço'
    );
  });
});

// ============================================================================
// TESTES - closeOrder (FASE 6 Integration)
// ============================================================================

describe('OrderService - closeOrder', () => {
  const closeData = {
    paymentMethodId: validUUIDs.paymentMethod,
    accountId: validUUIDs.account,
    userId: validUUIDs.user,
  };

  it('deve fechar comanda e gerar receita automaticamente', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    orderRepository.closeOrder.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    financeiroService.createReceitaFromOrder.mockResolvedValue({
      data: mockRevenue,
      error: null,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.orderId).toBe(validUUIDs.order);
    expect(result.data.revenueId).toBe(validUUIDs.revenue);
    expect(result.data.totals).toBeDefined();
    expect(result.error).toBeNull();
    expect(orderRepository.closeOrder).toHaveBeenCalledWith(
      validUUIDs.order,
      validUUIDs.paymentMethod,
      validUUIDs.account
    );
    expect(financeiroService.createReceitaFromOrder).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    // console.log foi mockado para não poluir output
  });

  it('deve fechar comanda mesmo se geração de receita falhar', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    orderRepository.closeOrder.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const revenueError = new Error('Failed to create revenue');
    financeiroService.createReceitaFromOrder.mockResolvedValue({
      data: null,
      error: revenueError,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.orderId).toBe(validUUIDs.order);
    expect(result.data.revenueId).toBeNull();
    expect(result.data.revenueError).toBe(revenueError);
    expect(result.error).toBeNull(); // Comanda foi fechada
    expect(toast.error).toHaveBeenCalledWith(
      'Comanda fechada, mas houve erro ao gerar receita. Contate o suporte.'
    );
    // console.error foi mockado para não poluir output
  });

  it('deve falhar se comanda já estiver fechada', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockClosedOrder,
      error: null,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Esta comanda já está fechada ou cancelada'
    );
    expect(orderRepository.closeOrder).not.toHaveBeenCalled();
  });

  it('deve falhar se comanda não tiver itens', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: { ...mockOpenOrder, items: [] },
      error: null,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Não é possível fechar uma comanda sem serviços'
    );
    expect(orderRepository.closeOrder).not.toHaveBeenCalled();
  });

  it('deve falhar se DTO for inválido', async () => {
    // Arrange
    const invalidData = {}; // Falta paymentMethodId e accountId

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, invalidData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(orderRepository.getOrderById).not.toHaveBeenCalled();
  });

  it('deve propagar erro ao buscar comanda', async () => {
    // Arrange
    const dbError = new Error('Order not found');
    orderRepository.getOrderById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar comanda');
  });

  it('deve propagar erro ao fechar comanda no repository', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    const dbError = new Error('Failed to close order');
    orderRepository.closeOrder.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao fechar comanda');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderById.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.closeOrder(validUUIDs.order, closeData);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao fechar comanda'
    );
  });
});

// ============================================================================
// TESTES - cancelOrder
// ============================================================================

describe('OrderService - cancelOrder', () => {
  it('deve cancelar comanda aberta', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    orderRepository.cancelOrder.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    // Act
    const result = await orderService.cancelOrder(
      validUUIDs.order,
      'Cliente desistiu'
    );

    // Assert
    expect(result.data).toEqual({ success: true });
    expect(result.error).toBeNull();
    expect(orderRepository.cancelOrder).toHaveBeenCalledWith(
      validUUIDs.order,
      'Cliente desistiu'
    );
    expect(toast.success).toHaveBeenCalledWith('Comanda cancelada!');
  });

  it('deve falhar se comanda já estiver fechada', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockClosedOrder,
      error: null,
    });

    // Act
    const result = await orderService.cancelOrder(
      validUUIDs.order,
      'Motivo qualquer'
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      'Esta comanda já está fechada ou cancelada'
    );
    expect(orderRepository.cancelOrder).not.toHaveBeenCalled();
  });

  it('deve falhar se motivo for inválido', async () => {
    // Act
    const result = await orderService.cancelOrder(validUUIDs.order, ''); // Motivo vazio

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(orderRepository.getOrderById).not.toHaveBeenCalled();
  });

  it('deve propagar erro ao buscar comanda', async () => {
    // Arrange
    const dbError = new Error('Order not found');
    orderRepository.getOrderById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.cancelOrder(
      validUUIDs.order,
      'Motivo válido'
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar comanda');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderById.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.cancelOrder(
      validUUIDs.order,
      'Motivo válido'
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao cancelar comanda'
    );
  });
});

// ============================================================================
// TESTES - getOrderDetails
// ============================================================================

describe('OrderService - getOrderDetails', () => {
  it('deve retornar detalhes da comanda com totais calculados', async () => {
    // Arrange
    orderRepository.getOrderById.mockResolvedValue({
      data: mockOpenOrder,
      error: null,
    });

    // Act
    const result = await orderService.getOrderDetails(validUUIDs.order);

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.id).toBe(validUUIDs.order);
    expect(result.data.totals).toBeDefined();
    expect(result.data.totals.totalAmount).toBe(50.0);
    expect(result.data.totals.totalCommission).toBe(20.0);
    expect(result.error).toBeNull();
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Order not found');
    orderRepository.getOrderById.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.getOrderDetails(validUUIDs.order);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar comanda');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderById.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.getOrderDetails(validUUIDs.order);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao buscar comanda'
    );
  });
});

// ============================================================================
// TESTES - listOrders
// ============================================================================

describe('OrderService - listOrders', () => {
  it('deve listar comandas com filtros', async () => {
    // Arrange
    const mockOrders = [mockOpenOrder, mockClosedOrder];
    orderRepository.listOrders.mockResolvedValue({
      data: mockOrders,
      error: null,
      count: 2,
    });

    const filters = { status: 'open' };

    // Act
    const result = await orderService.listOrders(validUUIDs.unit, filters);

    // Assert
    expect(result.data).toEqual(mockOrders);
    expect(result.count).toBe(2);
    expect(result.error).toBeNull();
    expect(orderRepository.listOrders).toHaveBeenCalledWith(
      validUUIDs.unit,
      filters
    );
  });

  it('deve listar sem filtros (default)', async () => {
    // Arrange
    orderRepository.listOrders.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    // Act
    const result = await orderService.listOrders(validUUIDs.unit);

    // Assert
    expect(result.data).toEqual([]);
    expect(orderRepository.listOrders).toHaveBeenCalledWith(
      validUUIDs.unit,
      {}
    );
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Query failed');
    orderRepository.listOrders.mockResolvedValue({
      data: null,
      error: dbError,
      count: null,
    });

    // Act
    const result = await orderService.listOrders(validUUIDs.unit);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao listar comandas');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.listOrders.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.listOrders(validUUIDs.unit);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao listar comandas'
    );
  });
});

// ============================================================================
// TESTES - calculateOrderTotal
// ============================================================================

describe('OrderService - calculateOrderTotal', () => {
  it('deve calcular total de comanda', async () => {
    // Arrange
    orderRepository.getOrderItems.mockResolvedValue({
      data: mockOpenOrder.items,
      error: null,
    });

    // Act
    const result = await orderService.calculateOrderTotal(validUUIDs.order);

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.totalAmount).toBe(50.0);
    expect(result.data.totalCommission).toBe(20.0);
    expect(result.data.itemsCount).toBe(1);
    expect(result.error).toBeNull();
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Failed to fetch items');
    orderRepository.getOrderItems.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.calculateOrderTotal(validUUIDs.order);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith('Erro ao buscar itens da comanda');
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderItems.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await orderService.calculateOrderTotal(validUUIDs.order);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao calcular total'
    );
  });
});

// ============================================================================
// TESTES - generateCommissionReport
// ============================================================================

describe('OrderService - generateCommissionReport', () => {
  it('deve gerar relatório de comissões para profissional', async () => {
    // Arrange
    const dateRange = { startDate: '2025-01-01', endDate: '2025-01-31' };
    const mockOrders = [mockOpenOrder];

    orderRepository.getOrdersByProfessional.mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    // Act
    const result = await orderService.generateCommissionReport(
      validUUIDs.professional,
      dateRange
    );

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.professionalId).toBe(validUUIDs.professional);
    expect(result.data.totalOrders).toBe(1);
    expect(result.data.totalServices).toBe(1);
    expect(result.data.totalCommission).toBe(20.0);
    expect(result.data.averageCommissionPerOrder).toBe(20.0);
    expect(result.error).toBeNull();
  });

  it('deve retornar relatório vazio se não houver comandas', async () => {
    // Arrange
    orderRepository.getOrdersByProfessional.mockResolvedValue({
      data: [],
      error: null,
    });

    // Act
    const result = await orderService.generateCommissionReport(
      validUUIDs.professional,
      {}
    );

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.totalOrders).toBe(0);
    expect(result.data.totalCommission).toBe(0);
    expect(result.data.averageCommissionPerOrder).toBe(0);
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Query failed');
    orderRepository.getOrdersByProfessional.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.generateCommissionReport(
      validUUIDs.professional,
      {}
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao buscar comandas do profissional'
    );
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrdersByProfessional.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await orderService.generateCommissionReport(
      validUUIDs.professional,
      {}
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao gerar relatório'
    );
  });
});

// ============================================================================
// TESTES - getOrdersByCashRegister
// ============================================================================

describe('OrderService - getOrdersByCashRegister', () => {
  it('deve retornar comandas de um caixa', async () => {
    // Arrange
    const mockOrders = [mockOpenOrder];
    orderRepository.getOrdersByCashRegister.mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    // Act
    const result = await orderService.getOrdersByCashRegister(validUUIDs.cash);

    // Assert
    expect(result.data).toEqual(mockOrders);
    expect(result.error).toBeNull();
    expect(orderRepository.getOrdersByCashRegister).toHaveBeenCalledWith(
      validUUIDs.cash
    );
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Query failed');
    orderRepository.getOrdersByCashRegister.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.getOrdersByCashRegister(validUUIDs.cash);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao buscar comandas do caixa'
    );
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrdersByCashRegister.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await orderService.getOrdersByCashRegister(validUUIDs.cash);

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao buscar comandas'
    );
  });
});

// ============================================================================
// TESTES - getCommissionReport (FASE 6.2)
// ============================================================================

describe('OrderService - getCommissionReport', () => {
  const mockReportData = [
    {
      item_id: validUUIDs.item,
      order_id: validUUIDs.order,
      order_number: 'CMD-001',
      professional_id: validUUIDs.professional,
      professional_name: 'João',
      client_id: 'client-1',
      client_name: 'Maria',
      service_id: validUUIDs.service,
      service_name: 'Corte',
      quantity: 1,
      unit_price: 50.0,
      commission_percentage: 40,
      commission_value: 20.0,
      commission_status: 'pending',
      order_date: '2025-01-20',
      commission_payment_date: null,
    },
  ];

  it('deve retornar relatório completo de comissões', async () => {
    // Arrange
    orderRepository.getOrderDetails.mockResolvedValue({
      data: mockReportData,
      error: null,
    });

    const filters = {
      professionalId: validUUIDs.professional,
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    };

    // Act
    const result = await orderService.getCommissionReport(filters);

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].professionalId).toBe(validUUIDs.professional);
    expect(result.data[0].commissionValue).toBe(20.0);
    expect(result.error).toBeNull();
  });

  it('deve filtrar por status de comissão', async () => {
    // Arrange
    const mixedData = [
      { ...mockReportData[0], commission_status: 'pending' },
      { ...mockReportData[0], item_id: 'item-2', commission_status: 'paid' },
    ];

    orderRepository.getOrderDetails.mockResolvedValue({
      data: mixedData,
      error: null,
    });

    // Act
    const result = await orderService.getCommissionReport({
      status: 'pending',
    });

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].status).toBe('pending');
  });

  it('deve retornar todos os status quando status = "all"', async () => {
    // Arrange
    const mixedData = [
      { ...mockReportData[0], commission_status: 'pending' },
      { ...mockReportData[0], item_id: 'item-2', commission_status: 'paid' },
    ];

    orderRepository.getOrderDetails.mockResolvedValue({
      data: mixedData,
      error: null,
    });

    // Act
    const result = await orderService.getCommissionReport({ status: 'all' });

    // Assert
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(2);
  });

  it('deve propagar erro do repository', async () => {
    // Arrange
    const dbError = new Error('Query failed');
    orderRepository.getOrderDetails.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await orderService.getCommissionReport({});

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro ao buscar dados de comissões'
    );
  });

  it('deve tratar exceções inesperadas', async () => {
    // Arrange
    orderRepository.getOrderDetails.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    const result = await orderService.getCommissionReport({});

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(toast.error).toHaveBeenCalledWith(
      'Erro inesperado ao gerar relatório de comissões'
    );
  });
});
