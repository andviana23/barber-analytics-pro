/**
 * @file cashRegisterRepository.test.js
 * @description Testes de Repository - cashRegisterRepository (Data Access Layer)
 * @module Tests/Repositories/CashRegisterRepository
 * @author Andrey Viana
 * @date 2025-01-20
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// MOCKS - Devem vir ANTES dos imports que os utilizam
// ============================================================================

// Mock do Supabase client - inline para evitar hoisting issues
vi.mock('../../src/config/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

// ============================================================================
// IMPORTS - Após os mocks
// ============================================================================

import cashRegisterRepository from '../../src/repositories/cashRegisterRepository';
import { supabase } from '../../src/services/supabase';

// Extrair chain mockado para facilitar testes
const mockSupabaseChain = supabase.from();

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

// Mock de console para silenciar logs
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

const validUUIDs = {
  cashRegister: '550e8400-e29b-41d4-a716-446655440001',
  unit: '550e8400-e29b-41d4-a716-446655440002',
  user: '550e8400-e29b-41d4-a716-446655440003',
};

const mockCashRegisterData = {
  id: validUUIDs.cashRegister,
  unit_id: validUUIDs.unit,
  opened_by: validUUIDs.user,
  opening_balance: 100.0,
  opening_time: '2025-01-20T08:00:00Z',
  status: 'open',
  observations: 'Abertura de caixa teste',
  closing_balance: null,
  closing_time: null,
  closed_by: null,
};

// ============================================================================
// TESTES
// ============================================================================

describe('CashRegisterRepository - openCashRegister', () => {
  it('deve abrir um novo caixa com sucesso', async () => {
    // Arrange
    mockSupabaseChain.single.mockResolvedValue({
      data: mockCashRegisterData,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.openCashRegister({
      unitId: validUUIDs.unit,
      openedBy: validUUIDs.user,
      openingBalance: 100.0,
      observations: 'Abertura de caixa teste',
    });

    // Assert
    expect(result.data).toEqual(mockCashRegisterData);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('cash_registers');
    expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        unit_id: validUUIDs.unit,
        opened_by: validUUIDs.user,
        opening_balance: 100.0,
        status: 'open',
      })
    );
  });

  it('deve propagar erro do Supabase ao abrir caixa', async () => {
    // Arrange
    const dbError = new Error('Duplicate key violation');
    mockSupabaseChain.single.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await cashRegisterRepository.openCashRegister({
      unitId: validUUIDs.unit,
      openedBy: validUUIDs.user,
      openingBalance: 100.0,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });

  it('deve capturar exceção ao abrir caixa', async () => {
    // Arrange
    const exception = new Error('Network error');
    mockSupabaseChain.single.mockRejectedValue(exception);

    // Act
    const result = await cashRegisterRepository.openCashRegister({
      unitId: validUUIDs.unit,
      openedBy: validUUIDs.user,
      openingBalance: 100.0,
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(exception);
  });
});

describe('CashRegisterRepository - getActiveCashRegister', () => {
  it('deve retornar caixa ativo da unidade', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: mockCashRegisterData,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.getActiveCashRegister(
      validUUIDs.unit
    );

    // Assert
    expect(result.data).toEqual(mockCashRegisterData);
    expect(result.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('cash_registers');
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
      'unit_id',
      validUUIDs.unit
    );
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith('status', 'open');
    expect(mockSupabaseChain.limit).toHaveBeenCalledWith(1);
  });

  it('deve retornar null se não houver caixa ativo', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.getActiveCashRegister(
      validUUIDs.unit
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('deve propagar erro do Supabase', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await cashRegisterRepository.getActiveCashRegister(
      validUUIDs.unit
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('CashRegisterRepository - closeCashRegister', () => {
  it('deve fechar caixa com sucesso', async () => {
    // Arrange
    const closedCashRegister = {
      ...mockCashRegisterData,
      status: 'closed',
      closed_by: validUUIDs.user,
      closing_balance: 250.0,
      closing_time: '2025-01-20T18:00:00Z',
    };

    mockSupabaseChain.single.mockResolvedValue({
      data: closedCashRegister,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.closeCashRegister(
      validUUIDs.cashRegister,
      {
        closedBy: validUUIDs.user,
        closingBalance: 250.0,
        observations: 'Fechamento normal',
      }
    );

    // Assert
    expect(result.data).toEqual(closedCashRegister);
    expect(result.error).toBeNull();
    expect(mockSupabaseChain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'closed',
        closed_by: validUUIDs.user,
        closing_balance: 250.0,
      })
    );
  });

  it('deve propagar erro ao fechar caixa', async () => {
    // Arrange
    const dbError = new Error('Update failed');
    mockSupabaseChain.single.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await cashRegisterRepository.closeCashRegister(
      validUUIDs.cashRegister,
      {
        closedBy: validUUIDs.user,
        closingBalance: 250.0,
      }
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('CashRegisterRepository - getCashRegisterById', () => {
  it('deve buscar caixa por ID', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: mockCashRegisterData,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.getCashRegisterById(
      validUUIDs.cashRegister
    );

    // Assert
    expect(result.data).toEqual(mockCashRegisterData);
    expect(result.error).toBeNull();
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
      'id',
      validUUIDs.cashRegister
    );
  });

  it('deve retornar null se caixa não existe', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.getCashRegisterById(
      validUUIDs.cashRegister
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });
});

describe('CashRegisterRepository - listCashRegisters', () => {
  it('deve listar caixas com filtros', async () => {
    // Arrange
    const mockCashRegisters = [mockCashRegisterData];
    mockSupabaseChain.eq.mockReturnThis();
    mockSupabaseChain.order.mockReturnThis();
    mockSupabaseChain.limit.mockResolvedValue({
      data: mockCashRegisters,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.listCashRegisters(
      validUUIDs.unit,
      { status: 'open', limit: 10 }
    );

    // Assert
    expect(result.data).toEqual(mockCashRegisters);
    expect(result.error).toBeNull();
    expect(mockSupabaseChain.eq).toHaveBeenCalledWith(
      'unit_id',
      validUUIDs.unit
    );
  });

  it('deve propagar erro ao listar caixas', async () => {
    // Arrange
    const dbError = new Error('Query failed');
    mockSupabaseChain.limit.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await cashRegisterRepository.listCashRegisters(
      validUUIDs.unit
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('CashRegisterRepository - hasActiveCashRegister', () => {
  it('deve retornar true se houver caixa ativo', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: mockCashRegisterData,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.hasActiveCashRegister(
      validUUIDs.unit
    );

    // Assert
    expect(result).toBe(true);
  });

  it('deve retornar false se não houver caixa ativo', async () => {
    // Arrange
    mockSupabaseChain.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.hasActiveCashRegister(
      validUUIDs.unit
    );

    // Assert
    expect(result).toBe(false);
  });
});

describe('CashRegisterRepository - countOpenOrders', () => {
  it('deve contar comandas abertas', async () => {
    // Arrange
    mockSupabaseChain.single.mockResolvedValue({
      data: { count: 5 },
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.countOpenOrders(
      validUUIDs.cashRegister
    );

    // Assert
    expect(result.data).toBe(5);
    expect(result.error).toBeNull();
  });

  it('deve retornar 0 se não houver comandas', async () => {
    // Arrange
    mockSupabaseChain.single.mockResolvedValue({
      data: { count: 0 },
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.countOpenOrders(
      validUUIDs.cashRegister
    );

    // Assert
    expect(result.data).toBe(0);
    expect(result.error).toBeNull();
  });

  it('deve propagar erro ao contar comandas', async () => {
    // Arrange
    const dbError = new Error('Count failed');
    mockSupabaseChain.single.mockResolvedValue({
      data: null,
      error: dbError,
    });

    // Act
    const result = await cashRegisterRepository.countOpenOrders(
      validUUIDs.cashRegister
    );

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe('CashRegisterRepository - getCashRegisterHistory', () => {
  it('deve buscar histórico de caixas', async () => {
    // Arrange
    const mockHistory = [mockCashRegisterData];
    mockSupabaseChain.limit.mockResolvedValue({
      data: mockHistory,
      error: null,
    });

    // Act
    const result = await cashRegisterRepository.getCashRegisterHistory(
      validUUIDs.unit,
      10
    );

    // Assert
    expect(result.data).toEqual(mockHistory);
    expect(result.error).toBeNull();
    expect(mockSupabaseChain.limit).toHaveBeenCalledWith(10);
  });

  it('deve usar limite padrão de 10', async () => {
    // Arrange
    mockSupabaseChain.limit.mockResolvedValue({
      data: [],
      error: null,
    });

    // Act
    await cashRegisterRepository.getCashRegisterHistory(validUUIDs.unit);

    // Assert
    expect(mockSupabaseChain.limit).toHaveBeenCalledWith(10);
  });
});
