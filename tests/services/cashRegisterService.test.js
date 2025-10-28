/**
 * @file cashRegisterService.test.js
 * @description Testes unitários para cashRegisterService
 * @module Tests/Services/CashRegister
 * @author Andrey Viana
 * @date 2025-01-24
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do toast - ANTES dos imports (inline para evitar hoisting issues)
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do repository - ANTES dos imports
vi.mock('../../src/repositories/cashRegisterRepository', () => ({
  default: {
    hasActiveCashRegister: vi.fn(),
    openCashRegister: vi.fn(),
    closeCashRegister: vi.fn(),
    countOpenOrders: vi.fn(),
    getCashRegisterSummary: vi.fn(),
    getActiveCashRegister: vi.fn(),
    getCashRegisterById: vi.fn(),
    listCashRegisters: vi.fn(),
    getCashRegisterHistory: vi.fn(),
  },
}));

// Imports DEPOIS dos mocks
import cashRegisterService from '../../src/services/cashRegisterService';
import cashRegisterRepository from '../../src/repositories/cashRegisterRepository';
import { toast } from 'react-hot-toast';

// Mock do console.info para evitar poluir os logs de teste
vi.spyOn(console, 'info').mockImplementation(() => {});

describe('CashRegisterService', () => {
  // Mock user válido
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'gerente',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  // Mock user sem permissão
  const mockUserNoPerm = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    role: 'profissional',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openCashRegister', () => {
    const validData = {
      unitId: '123e4567-e89b-12d3-a456-426614174001',
      openingBalance: 100.0,
      observations: 'Abertura normal',
    };

    it('deve abrir caixa com sucesso para usuário autorizado', async () => {
      // Arrange
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: false,
        error: null,
      });

      cashRegisterRepository.openCashRegister.mockResolvedValue({
        data: {
          id: 'cash-123',
          ...validData,
          openedBy: mockUser.id,
          status: 'open',
        },
        error: null,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        mockUser
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data.status).toBe('open');
      expect(toast.success).toHaveBeenCalledWith('Caixa aberto com sucesso!');
      expect(cashRegisterRepository.openCashRegister).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar abertura se usuário não tiver permissão', async () => {
      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('não tem permissão');
      expect(toast.error).toHaveBeenCalledWith(
        'Usuário não tem permissão para abrir caixa'
      );
      expect(cashRegisterRepository.openCashRegister).not.toHaveBeenCalled();
    });

    it('deve rejeitar se já existe caixa aberto', async () => {
      // Arrange
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: true,
        error: null,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Já existe um caixa aberto');
      expect(toast.error).toHaveBeenCalled();
      expect(cashRegisterRepository.openCashRegister).not.toHaveBeenCalled();
    });

    it('deve rejeitar dados inválidos (saldo negativo)', async () => {
      // Arrange
      const invalidData = {
        ...validData,
        openingBalance: -50,
      };

      // Act
      const result = await cashRegisterService.openCashRegister(
        invalidData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(toast.error).toHaveBeenCalled();
      expect(cashRegisterRepository.openCashRegister).not.toHaveBeenCalled();
    });

    it('deve lidar com erro ao verificar caixa ativo', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao verificar caixa ativo');
    });

    it('deve lidar com erro ao abrir caixa', async () => {
      // Arrange
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: false,
        error: null,
      });

      const dbError = new Error('Insert failed');
      cashRegisterRepository.openCashRegister.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao abrir caixa');
    });

    it('deve permitir abertura para recepcionista', async () => {
      // Arrange
      const recepcionistaUser = { ...mockUser, role: 'recepcionista' };
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: false,
        error: null,
      });
      cashRegisterRepository.openCashRegister.mockResolvedValue({
        data: { id: 'cash-123', status: 'open' },
        error: null,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        recepcionistaUser
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve permitir abertura para administrador', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: 'administrador' };
      cashRegisterRepository.hasActiveCashRegister.mockResolvedValue({
        data: false,
        error: null,
      });
      cashRegisterRepository.openCashRegister.mockResolvedValue({
        data: { id: 'cash-123', status: 'open' },
        error: null,
      });

      // Act
      const result = await cashRegisterService.openCashRegister(
        validData,
        adminUser
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('closeCashRegister', () => {
    const cashRegisterId = 'cash-123';
    const closeData = {
      closingBalance: 500.0,
      observations: 'Fechamento normal',
    };

    it('deve fechar caixa com sucesso quando não há comandas abertas', async () => {
      // Arrange
      cashRegisterRepository.countOpenOrders.mockResolvedValue({
        data: 0,
        error: null,
      });

      cashRegisterRepository.getCashRegisterSummary.mockResolvedValue({
        data: {
          expected_balance: 500.0,
          total_revenue: 400.0,
        },
        error: null,
      });

      cashRegisterRepository.closeCashRegister.mockResolvedValue({
        data: {
          id: cashRegisterId,
          status: 'closed',
          closingBalance: 500.0,
        },
        error: null,
      });

      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        closeData,
        mockUser
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data.summary.difference).toBe(0);
      expect(toast.success).toHaveBeenCalledWith(
        'Caixa fechado com sucesso! Saldo confere. ✅'
      );
    });

    it('deve rejeitar fechamento se usuário não tiver permissão', async () => {
      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        closeData,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('não tem permissão');
      expect(cashRegisterRepository.closeCashRegister).not.toHaveBeenCalled();
    });

    it('deve rejeitar fechamento se existem comandas abertas', async () => {
      // Arrange
      cashRegisterRepository.countOpenOrders.mockResolvedValue({
        data: 3,
        error: null,
      });

      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        closeData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('3 comanda(s) aberta(s)');
      expect(toast.error).toHaveBeenCalled();
      expect(cashRegisterRepository.closeCashRegister).not.toHaveBeenCalled();
    });

    it('deve calcular e exibir sobra quando saldo é maior que esperado', async () => {
      // Arrange
      cashRegisterRepository.countOpenOrders.mockResolvedValue({
        data: 0,
        error: null,
      });

      cashRegisterRepository.getCashRegisterSummary.mockResolvedValue({
        data: { expected_balance: 400.0 },
        error: null,
      });

      cashRegisterRepository.closeCashRegister.mockResolvedValue({
        data: { id: cashRegisterId, status: 'closed' },
        error: null,
      });

      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        { closingBalance: 500.0 },
        mockUser
      );

      // Assert
      expect(result.data.summary.difference).toBe(100.0);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Sobra de R$ 100.00')
      );
    });

    it('deve calcular e exibir falta quando saldo é menor que esperado', async () => {
      // Arrange
      cashRegisterRepository.countOpenOrders.mockResolvedValue({
        data: 0,
        error: null,
      });

      cashRegisterRepository.getCashRegisterSummary.mockResolvedValue({
        data: { expected_balance: 500.0 },
        error: null,
      });

      cashRegisterRepository.closeCashRegister.mockResolvedValue({
        data: { id: cashRegisterId, status: 'closed' },
        error: null,
      });

      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        { closingBalance: 450.0 },
        mockUser
      );

      // Assert
      expect(result.data.summary.difference).toBe(-50.0);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Falta de R$ 50.00')
      );
    });

    it('deve rejeitar dados inválidos (saldo negativo)', async () => {
      // Arrange
      const invalidData = { closingBalance: -100 };

      // Act
      const result = await cashRegisterService.closeCashRegister(
        cashRegisterId,
        invalidData,
        mockUser
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('getActiveCashRegister', () => {
    it('deve retornar caixa ativo quando existe', async () => {
      // Arrange
      const mockCashRegister = {
        id: 'cash-123',
        status: 'open',
        openingBalance: 100.0,
      };

      cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
        data: mockCashRegister,
        error: null,
      });

      // Act
      const result = await cashRegisterService.getActiveCashRegister(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toEqual(mockCashRegister);
      expect(result.error).toBeNull();
    });

    it('deve retornar null quando não há caixa ativo', async () => {
      // Arrange
      cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await cashRegisterService.getActiveCashRegister(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Database error');
      // Quando o repository retorna erro, ele não lança exception
      // Retorna {data: null, error: dbError}
      cashRegisterRepository.getActiveCashRegister.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await cashRegisterService.getActiveCashRegister(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      // O service apenas propaga o erro do repository, não chama toast
      // O toast só é chamado quando há um throw (catch)
    });
  });

  describe('getCashRegisterReport', () => {
    const cashRegisterId = 'cash-123';

    it('deve gerar relatório completo com sucesso', async () => {
      // Arrange
      const mockCashRegister = {
        id: cashRegisterId,
        status: 'closed',
        openingBalance: 100.0,
        closingBalance: 600.0,
      };

      const mockSummary = {
        total_revenue: 500.0,
        closed_orders_count: 10,
        open_orders_count: 0,
        canceled_orders_count: 1,
        expected_balance: 600.0,
        balance_difference: 0,
        duration_hours: 8.5,
      };

      cashRegisterRepository.getCashRegisterById.mockResolvedValue({
        data: mockCashRegister,
        error: null,
      });

      cashRegisterRepository.getCashRegisterSummary.mockResolvedValue({
        data: mockSummary,
        error: null,
      });

      // Act
      const result =
        await cashRegisterService.getCashRegisterReport(cashRegisterId);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data.id).toBe(cashRegisterId);
      expect(result.data.summary.totalRevenue).toBe(500.0);
      expect(result.data.summary.closedOrdersCount).toBe(10);
      expect(result.data.summary.durationHours).toBe(8.5);
    });

    it('deve lidar com erro ao buscar dados do caixa', async () => {
      // Arrange
      const dbError = new Error('Not found');
      cashRegisterRepository.getCashRegisterById.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result =
        await cashRegisterService.getCashRegisterReport(cashRegisterId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao buscar dados do caixa');
    });

    it('deve lidar com erro ao buscar resumo', async () => {
      // Arrange
      cashRegisterRepository.getCashRegisterById.mockResolvedValue({
        data: { id: cashRegisterId },
        error: null,
      });

      const dbError = new Error('Summary error');
      cashRegisterRepository.getCashRegisterSummary.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result =
        await cashRegisterService.getCashRegisterReport(cashRegisterId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao buscar resumo do caixa'
      );
    });
  });

  describe('listCashRegisters', () => {
    it('deve listar caixas com sucesso', async () => {
      // Arrange
      const mockCashRegisters = [
        { id: 'cash-1', status: 'open' },
        { id: 'cash-2', status: 'closed' },
      ];

      cashRegisterRepository.listCashRegisters.mockResolvedValue({
        data: mockCashRegisters,
        error: null,
        count: 2,
      });

      // Act
      const result = await cashRegisterService.listCashRegisters(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toEqual(mockCashRegisters);
      expect(result.count).toBe(2);
      expect(result.error).toBeNull();
    });

    it('deve aplicar filtros corretamente', async () => {
      // Arrange
      const filters = { status: 'closed', page: 1, limit: 10 };

      cashRegisterRepository.listCashRegisters.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await cashRegisterService.listCashRegisters(mockUser.unitId, filters);

      // Assert
      expect(cashRegisterRepository.listCashRegisters).toHaveBeenCalledWith(
        mockUser.unitId,
        filters
      );
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Query failed');
      cashRegisterRepository.listCashRegisters.mockResolvedValue({
        data: null,
        error: dbError,
        count: null,
      });

      // Act
      const result = await cashRegisterService.listCashRegisters(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao listar caixas');
    });
  });

  describe('getCashRegisterHistory', () => {
    it('deve buscar histórico com sucesso', async () => {
      // Arrange
      const mockHistory = [
        { id: 'cash-1', closingTime: '2025-01-23' },
        { id: 'cash-2', closingTime: '2025-01-22' },
      ];

      cashRegisterRepository.getCashRegisterHistory.mockResolvedValue({
        data: mockHistory,
        error: null,
      });

      // Act
      const result = await cashRegisterService.getCashRegisterHistory(
        mockUser.unitId,
        10
      );

      // Assert
      expect(result.data).toEqual(mockHistory);
      expect(result.error).toBeNull();
      expect(
        cashRegisterRepository.getCashRegisterHistory
      ).toHaveBeenCalledWith(mockUser.unitId, 10);
    });

    it('deve usar limite padrão de 10 quando não especificado', async () => {
      // Arrange
      cashRegisterRepository.getCashRegisterHistory.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await cashRegisterService.getCashRegisterHistory(mockUser.unitId);

      // Assert
      expect(
        cashRegisterRepository.getCashRegisterHistory
      ).toHaveBeenCalledWith(mockUser.unitId, 10);
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('History query failed');
      cashRegisterRepository.getCashRegisterHistory.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await cashRegisterService.getCashRegisterHistory(
        mockUser.unitId
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao buscar histórico de caixas'
      );
    });
  });
});
