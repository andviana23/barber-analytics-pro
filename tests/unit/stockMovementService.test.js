/**
 * @fileoverview Testes unitários para StockMovementService
 * @module tests/unit/stockMovementService.test
 * @requires vitest
 * @description
 * Testa lógica de negócio, validações de permissão e regras:
 * - recordEntry, recordExit, adjustStock
 * - getStockHistory, revertMovement
 * - Permission checks (barbeiro, gerente, admin)
 *
 * @author Andrey Viana
 * @date 13/11/2025
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import stockMovementService from '@/services/stockMovementService';

// Mock do repository
vi.mock('@/repositories/stockMovementRepository', () => ({
  default: {
    create: vi.fn(),
    findByUnit: vi.fn(),
    findByProductAndDate: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    revert: vi.fn(),
    getSummaryByPeriod: vi.fn(),
  },
}));

const createSupabaseQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
});

const supabaseQueryBuilder = createSupabaseQueryBuilder();

// Mock do Supabase compartilhando o mesmo query builder para toda chamada
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => supabaseQueryBuilder),
  },
}));

const MOCK_IDS = Object.freeze({
  unit: '11111111-1111-4111-8111-111111111111',
  product: '22222222-2222-4222-8222-222222222222',
  professional: '33333333-3333-4333-8333-333333333333',
  reference: '44444444-4444-4444-8444-444444444444',
  movement: '55555555-5555-4555-8555-555555555555',
  user: '66666666-6666-4666-8666-666666666666',
});

async function configureSupabaseSingles(sequence) {
  const { supabase } = await import('@/services/supabase');
  const singleSpy = supabase.from().single;
  singleSpy.mockReset();
  sequence.forEach(result => singleSpy.mockResolvedValueOnce(result));
  return supabase;
}

describe('StockMovementService - recordEntry', () => {
  const validUser = {
    id: MOCK_IDS.user,
    email: 'barbeiro@test.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await configureSupabaseSingles([
      { data: { role: 'barbeiro', is_active: true }, error: null },
    ]);
  });

  it('deve registrar entrada com dados válidos', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.create.mockResolvedValue({
      data: {
        id: MOCK_IDS.movement,
        movement_type: 'ENTRADA',
        quantity: 50,
      },
      error: null,
    });

    const result = await stockMovementService.recordEntry(
      MOCK_IDS.product,
      50,
      'COMPRA',
      10.0,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      'Compra mensal',
      null,
      null,
      validUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    expect(stockMovementRepository.create).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar usuário sem permissão', async () => {
    await configureSupabaseSingles([
      { data: null, error: { message: 'Not found' } },
    ]);

    const result = await stockMovementService.recordEntry(
      MOCK_IDS.product,
      50,
      'COMPRA',
      10.0,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Sem permissão');
  });

  it('deve rejeitar quantity negativa', async () => {
    const result = await stockMovementService.recordEntry(
      MOCK_IDS.product,
      -10,
      'COMPRA',
      10.0,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Dados inválidos');
  });

  it('deve rejeitar reason inválido', async () => {
    const result = await stockMovementService.recordEntry(
      MOCK_IDS.product,
      50,
      'MOTIVO_INVALIDO',
      10.0,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Dados inválidos');
  });

  it('deve aceitar reference_id + reference_type', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.create.mockResolvedValue({
      data: { id: MOCK_IDS.movement },
      error: null,
    });

    const result = await stockMovementService.recordEntry(
      MOCK_IDS.product,
      50,
      'COMPRA',
      10.0,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      MOCK_IDS.reference,
      'PURCHASE',
      validUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });
});

describe('StockMovementService - recordExit', () => {
  const validUser = {
    id: MOCK_IDS.user,
    email: 'barbeiro@test.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await configureSupabaseSingles([
      { data: { role: 'barbeiro', is_active: true }, error: null },
      { data: { current_stock: 100, name: 'Produto Teste' }, error: null },
    ]);
  });

  it('deve registrar saída com estoque suficiente', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.create.mockResolvedValue({
      data: { id: MOCK_IDS.movement, movement_type: 'SAIDA' },
      error: null,
    });

    const result = await stockMovementService.recordExit(
      MOCK_IDS.product,
      20,
      'VENDA',
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('deve rejeitar saída com estoque insuficiente', async () => {
    await configureSupabaseSingles([
      { data: { role: 'barbeiro', is_active: true }, error: null },
      { data: { current_stock: 5, name: 'Produto Teste' }, error: null },
    ]);

    const result = await stockMovementService.recordExit(
      MOCK_IDS.product,
      20,
      'VENDA',
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Estoque insuficiente');
    expect(result.error).toContain('Disponível: 5');
    expect(result.error).toContain('Solicitado: 20');
  });

  it('deve rejeitar se produto não existir', async () => {
    await configureSupabaseSingles([
      { data: { role: 'barbeiro', is_active: true }, error: null },
      { data: null, error: { message: 'Not found' } },
    ]);

    const result = await stockMovementService.recordExit(
      MOCK_IDS.product,
      10,
      'VENDA',
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Produto não encontrado');
  });
});

describe('StockMovementService - adjustStock', () => {
  const gerenteUser = {
    id: 'user-gerente',
    email: 'gerente@test.com',
  };

  const barbeiroUser = {
    id: 'user-barbeiro',
    email: 'barbeiro@test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve permitir ajuste positivo para gerente', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'gerente', is_active: true },
      error: null,
    });

    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.create.mockResolvedValue({
      data: { id: MOCK_IDS.movement, movement_type: 'ENTRADA' },
      error: null,
    });

    const result = await stockMovementService.adjustStock(
      MOCK_IDS.product,
      10,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      'Ajuste de inventário',
      gerenteUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('deve permitir ajuste negativo para admin', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase
      .from()
      .single.mockResolvedValueOnce({
        data: { role: 'admin', is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { current_stock: 50 },
        error: null,
      });

    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.create.mockResolvedValue({
      data: { id: MOCK_IDS.movement, movement_type: 'SAIDA' },
      error: null,
    });

    const result = await stockMovementService.adjustStock(
      MOCK_IDS.product,
      -5,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      'Correção de estoque',
      { id: 'admin-user', email: 'admin@test.com' }
    );

    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
  });

  it('deve rejeitar ajuste de barbeiro', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'barbeiro', is_active: true },
      error: null,
    });

    const result = await stockMovementService.adjustStock(
      MOCK_IDS.product,
      10,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      'Tentativa de ajuste',
      barbeiroUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain(
      'Apenas gerentes e administradores podem ajustar estoque'
    );
  });

  it('deve rejeitar ajuste sem observações', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'gerente', is_active: true },
      error: null,
    });

    const result = await stockMovementService.adjustStock(
      MOCK_IDS.product,
      10,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      '', // Notes vazias
      gerenteUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Observações são obrigatórias');
  });

  it('deve rejeitar ajuste negativo com estoque insuficiente', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase
      .from()
      .single.mockResolvedValueOnce({
        data: { role: 'gerente', is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { current_stock: 5 },
        error: null,
      });

    const result = await stockMovementService.adjustStock(
      MOCK_IDS.product,
      -10,
      MOCK_IDS.unit,
      MOCK_IDS.professional,
      'Ajuste negativo',
      gerenteUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('Estoque insuficiente para ajuste');
  });
});

describe('StockMovementService - getStockHistory', () => {
  const validUser = {
    id: MOCK_IDS.user,
    email: 'barbeiro@test.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const { supabase } = await import('@/services/supabase');
    supabase.from().single.mockResolvedValue({
      data: { role: 'barbeiro', is_active: true },
      error: null,
    });
  });

  it('deve buscar histórico com paginação', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.findByUnit.mockResolvedValue({
      data: [
        { id: '1', quantity: 10 },
        { id: '2', quantity: 20 },
      ],
      error: null,
      totalCount: 2,
    });

    const result = await stockMovementService.getStockHistory(
      {
        unit_id: MOCK_IDS.unit,
        page: 1,
        page_size: 20,
      },
      validUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('deve rejeitar busca sem unit_id', async () => {
    const result = await stockMovementService.getStockHistory(
      {
        page: 1,
        page_size: 20,
      },
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain('unit_id é obrigatório');
  });

  it('deve aplicar filtros corretamente', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.findByUnit.mockResolvedValue({
      data: [],
      error: null,
      totalCount: 0,
    });

    await stockMovementService.getStockHistory(
      {
        unit_id: MOCK_IDS.unit,
        product_id: MOCK_IDS.product,
        movement_type: 'ENTRADA',
        page: 1,
        page_size: 20,
      },
      validUser
    );

    expect(stockMovementRepository.findByUnit).toHaveBeenCalledWith(
      MOCK_IDS.unit,
      expect.objectContaining({
        product_id: MOCK_IDS.product,
        movement_type: 'ENTRADA',
      }),
      expect.any(Number),
      expect.any(Number)
    );
  });
});

describe('StockMovementService - revertMovement', () => {
  const gerenteUser = {
    id: 'user-gerente',
    email: 'gerente@test.com',
  };

  const barbeiroUser = {
    id: 'user-barbeiro',
    email: 'barbeiro@test.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve permitir reversão para gerente', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'gerente', is_active: true },
      error: null,
    });

    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.revert.mockResolvedValue({
      data: true,
      error: null,
    });

    const result = await stockMovementService.revertMovement(
      MOCK_IDS.movement,
      gerenteUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it('deve permitir reversão para admin', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'admin', is_active: true },
      error: null,
    });

    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.revert.mockResolvedValue({
      data: true,
      error: null,
    });

    const result = await stockMovementService.revertMovement(
      MOCK_IDS.movement,
      {
        id: 'admin-user',
        email: 'admin@test.com',
      }
    );

    expect(result.error).toBeNull();
    expect(result.data).toBe(true);
  });

  it('deve rejeitar reversão de barbeiro', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'barbeiro', is_active: true },
      error: null,
    });

    const result = await stockMovementService.revertMovement(
      MOCK_IDS.movement,
      barbeiroUser
    );

    expect(result.data).toBe(false);
    expect(result.error).toContain(
      'Apenas gerentes e administradores podem reverter'
    );
  });

  it('deve rejeitar reversão sem ID', async () => {
    const { supabase } = await import('@/services/supabase');

    supabase.from().single.mockResolvedValue({
      data: { role: 'gerente', is_active: true },
      error: null,
    });

    const result = await stockMovementService.revertMovement(null, gerenteUser);

    expect(result.data).toBe(false);
    expect(result.error).toContain('ID da movimentação é obrigatório');
  });
});

describe('StockMovementService - getSummaryByPeriod', () => {
  const validUser = {
    id: MOCK_IDS.user,
    email: 'barbeiro@test.com',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await configureSupabaseSingles([
      { data: { role: 'barbeiro', is_active: true }, error: null },
    ]);
  });

  it('deve buscar resumo com sucesso', async () => {
    const stockMovementRepository = (
      await import('@/repositories/stockMovementRepository')
    ).default;

    stockMovementRepository.getSummaryByPeriod.mockResolvedValue({
      data: {
        total_entries: 100,
        total_exits: 50,
        net_movement: 50,
      },
      error: null,
    });

    const result = await stockMovementService.getSummaryByPeriod(
      MOCK_IDS.unit,
      new Date('2025-11-01'),
      new Date('2025-11-30'),
      validUser
    );

    expect(result.error).toBeNull();
    expect(result.data).toHaveProperty('total_entries', 100);
    expect(result.data).toHaveProperty('total_exits', 50);
  });

  it('deve rejeitar busca sem parâmetros obrigatórios', async () => {
    const result = await stockMovementService.getSummaryByPeriod(
      null,
      null,
      null,
      validUser
    );

    expect(result.data).toBeNull();
    expect(result.error).toContain(
      'unit_id, startDate e endDate são obrigatórios'
    );
  });
});
