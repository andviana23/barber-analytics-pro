/**
 * @fileoverview Testes do RevenueRepository
 * Testa paginação, filtros (unit_id, intervalo de datas), erro do Supabase
 * Mock do client Supabase e assert de parâmetros passados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { revenueRepository } from '../revenueRepository';
import { FinancialFixtures, DateHelpers, createSupabaseMock } from '../../../tests/__fixtures__/financial';

// Mock do Supabase usando vi.hoisted
const mockSupabase = vi.hoisted(() => {
  return {
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }))
  };
});

vi.mock('../../services/supabase', () => ({
  supabase: mockSupabase,
}));

describe('RevenueRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('deve inserir receita com dados sanitizados', async () => {
      // Arrange
      const revenueData = {
        type: 'service',
        value: 150.00,
        date: DateHelpers.today(),
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        user_id: 'user-789',
        account_id: 'acc-abc',
        // Campos que devem ser ignorados
        id: 'should-be-ignored',
        created_at: 'should-be-ignored',
      };

      const createdRevenue = FinancialFixtures.makeServiceRevenue(150);
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: createdRevenue,
        error: null,
      });

      // Act
      const result = await revenueRepository.create(revenueData);

      // Assert
      expect(result.data).toEqual(createdRevenue);
      expect(result.error).toBeNull();

      // Verificar que campos proibidos foram removidos
      expect(mockSupabase.from).toHaveBeenCalledWith('revenues');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.not.objectContaining({
          id: expect.anything(),
          created_at: expect.anything(),
        })
      );

      // Verificar que campos permitidos foram incluídos
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'service',
          value: 150.00,
          unit_id: 'unit-123',
        })
      );
    });

    it('deve retornar erro quando Supabase falha', async () => {
      // Arrange
      const revenueData = FinancialFixtures.makeServiceRevenue(150);
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed', code: 'NETWORK_ERROR' },
      });

      // Act
      const result = await revenueRepository.create(revenueData);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe('Erro de conexão. Verifique sua internet e tente novamente.');
    });

    it('deve normalizar erro de constraint violation', async () => {
      // Arrange
      const duplicateData = FinancialFixtures.makeServiceRevenue(150);
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      });

      // Act
      const result = await revenueRepository.create(duplicateData);

      // Assert
      expect(result.error).toBe('Já existe um registro com essas informações.');
    });

    it('deve aplicar timeout de 10 segundos', async () => {
      // Arrange
      const revenueData = FinancialFixtures.makeServiceRevenue(150);
      
      // Simular timeout
      mockSupabase.from().insert().select().single.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 50)
        )
      );

      // Act
      const result = await revenueRepository.create(revenueData);

      // Assert
      expect(result.error).toBe('Operação demorou muito para ser concluída. Tente novamente.');
    });
  });

  describe('findAll', () => {
    it('deve buscar receitas sem filtros', async () => {
      // Arrange
      const mockRevenues = [
        FinancialFixtures.makeServiceRevenue(100),
        FinancialFixtures.makeServiceRevenue(200),
      ];

      mockSupabase.from().select().mockResolvedValue({
        data: mockRevenues,
        error: null,
        count: 2,
      });

      // Act
      const result = await revenueRepository.findAll();

      // Assert
      expect(result.data).toEqual(mockRevenues);
      expect(result.count).toBe(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('revenues');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('*');
    });

    it('deve aplicar filtro de unit_id', async () => {
      // Arrange
      const filters = { unit_id: 'unit-123' };
      
      mockSupabase.from().select().eq.mockReturnThis();
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await revenueRepository.findAll(filters);

      // Assert
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('unit_id', 'unit-123');
    });

    it('deve aplicar filtros de intervalo de datas', async () => {
      // Arrange
      const filters = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      };

      const mockQuery = mockSupabase.from().select();
      mockQuery.gte.mockReturnThis();
      mockQuery.lte.mockReturnThis();
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await revenueRepository.findAll(filters);

      // Assert
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
    });

    it('deve aplicar filtro de status', async () => {
      // Arrange
      const filters = { status: 'received' };
      
      mockSupabase.from().select().eq.mockReturnThis();
      mockSupabase.from().select().mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await revenueRepository.findAll(filters);

      // Assert
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('status', 'received');
    });

    it('deve aplicar múltiplos filtros simultaneamente', async () => {
      // Arrange
      const filters = {
        unit_id: 'unit-123',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'received',
      };

      const mockQuery = mockSupabase.from().select();
      mockQuery.eq.mockReturnThis();
      mockQuery.gte.mockReturnThis();
      mockQuery.lte.mockReturnThis();
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await revenueRepository.findAll(filters);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith('unit_id', 'unit-123');
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'received');
    });

    it('deve aplicar paginação quando especificada', async () => {
      // Arrange
      const pagination = { page: 2, limit: 10 };
      
      const mockQuery = mockSupabase.from().select();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockReturnThis();
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await revenueRepository.findAll({}, pagination);

      // Assert
      // Página 2 com limit 10 = range(10, 19)
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('deve aplicar ordenação padrão por data de criação', async () => {
      // Arrange
      const mockQuery = mockSupabase.from().select();
      mockQuery.order.mockReturnThis();
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await revenueRepository.findAll();

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('deve aplicar ordenação personalizada quando especificada', async () => {
      // Arrange
      const options = {
        sort_by: 'value',
        sort_order: 'asc',
      };

      const mockQuery = mockSupabase.from().select();
      mockQuery.order.mockReturnThis();
      mockQuery.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await revenueRepository.findAll({}, null, options);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith('value', { ascending: true });
    });
  });

  describe('findById', () => {
    it('deve buscar receita por ID', async () => {
      // Arrange
      const revenueId = 'rev-123';
      const mockRevenue = FinancialFixtures.makeServiceRevenue(150);
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockRevenue,
        error: null,
      });

      // Act
      const result = await revenueRepository.findById(revenueId);

      // Assert
      expect(result.data).toEqual(mockRevenue);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('id', revenueId);
      expect(mockSupabase.from().select().eq().single).toHaveBeenCalled();
    });

    it('deve retornar null quando receita não existe', async () => {
      // Arrange
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' },
      });

      // Act
      const result = await revenueRepository.findById('rev-inexistente');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toContain('não encontrada');
    });
  });

  describe('update', () => {
    it('deve atualizar receita com dados sanitizados', async () => {
      // Arrange
      const revenueId = 'rev-123';
      const updateData = {
        status: 'received',
        actual_receipt_date: DateHelpers.today(),
        // Campo proibido
        id: 'should-be-ignored',
      };

      const updatedRevenue = {
        ...FinancialFixtures.makeReceivedRevenue(),
        id: revenueId,
      };

      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedRevenue,
        error: null,
      });

      // Act
      const result = await revenueRepository.update(revenueId, updateData);

      // Assert
      expect(result.data).toEqual(updatedRevenue);
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          id: expect.anything(),
        })
      );
      expect(mockSupabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'received',
          actual_receipt_date: DateHelpers.today(),
        })
      );
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', revenueId);
    });

    it('deve retornar erro quando receita não existe para atualização', async () => {
      // Arrange
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Act
      const result = await revenueRepository.update('rev-inexistente', { status: 'received' });

      // Assert
      expect(result.error).toContain('não encontrada');
    });
  });

  describe('delete', () => {
    it('deve fazer soft delete (is_active = false)', async () => {
      // Arrange
      const revenueId = 'rev-123';
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: { id: revenueId, is_active: false },
        error: null,
      });

      // Act
      const result = await revenueRepository.delete(revenueId);

      // Assert
      expect(result.data).toEqual({ id: revenueId, is_active: false });
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        is_active: false,
        deleted_at: expect.any(String),
      });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', revenueId);
    });

    it('deve permitir hard delete quando especificado', async () => {
      // Arrange
      const revenueId = 'rev-123';
      
      mockSupabase.from().delete().eq().mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await revenueRepository.delete(revenueId, { hard: true });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', revenueId);
    });
  });

  describe('Edge cases e validações', () => {
    it('deve validar parâmetros obrigatórios', async () => {
      // ID vazio
      let result = await revenueRepository.findById('');
      expect(result.error).toContain('ID é obrigatório');

      // Dados vazios para criação
      result = await revenueRepository.create({});
      expect(result.error).toContain('Dados são obrigatórios');

      // ID e dados vazios para atualização
      result = await revenueRepository.update('', {});
      expect(result.error).toContain('ID e dados são obrigatórios');
    });

    it('deve lidar com filtros inválidos graciosamente', async () => {
      // Data inválida
      const filters = {
        start_date: 'invalid-date',
        end_date: '2025-01-31',
      };

      const result = await revenueRepository.findAll(filters);
      
      expect(result.error).toContain('formato de data inválido');
    });

    it('deve limitar paginação para evitar consultas muito pesadas', async () => {
      // Limite muito alto
      const pagination = { page: 1, limit: 10000 };
      
      const result = await revenueRepository.findAll({}, pagination);
      
      expect(result.error).toContain('Limite máximo é 1000 registros');
    });

    it('deve tratar timeout de rede', async () => {
      // Arrange
      mockSupabase.from().select().mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 50)
        )
      );

      // Act
      const result = await revenueRepository.findAll();

      // Assert
      expect(result.error).toContain('Operação demorou muito');
    });

    // ⚠️ TODO(test): Implementar testes de RLS no repository
    // Verificar se queries respeitam unit_id do usuário
    it.todo('deve aplicar RLS filters automaticamente baseado no contexto do usuário');

    // ⚠️ TODO(test): Implementar cache no repository level
    it.todo('deve implementar cache para consultas frequentes');

    // ⚠️ TODO(test): Implementar retry logic para falhas transientes
    it.todo('deve fazer retry automático para erros de rede transientes');
  });
});