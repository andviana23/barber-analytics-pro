/**
 * @fileoverview Testes do FinanceiroService
 * Testa criação de receita com DTO válido, aplicação de regras de negócio,
 * interação com repository mockado e idempotência
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import financeiroService from '../financeiroService';
import { CreateRevenueDTO } from '../../dtos/revenueDTO';
import { revenueRepository } from '../../repositories/revenueRepository';
import { FinancialFixtures, DateHelpers } from '../../../tests/__fixtures__/financial';

// Constantes UUID válidas para testes
const TEST_UUIDS = {
  UNIT_ID: '550e8400-e29b-41d4-a716-446655440000',
  PROFESSIONAL_ID: '550e8400-e29b-41d4-a716-446655440001',
  USER_ID: '550e8400-e29b-41d4-a716-446655440002',
  ACCOUNT_ID: '550e8400-e29b-41d4-a716-446655440003'
};

// Mock do repository usando vi.hoisted
const mockRevenueRepositoryMethods = vi.hoisted(() => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../repositories/revenueRepository', () => ({
  default: mockRevenueRepositoryMethods,
}));

const mockRevenueRepository = mockRevenueRepositoryMethods;

describe('FinanceiroService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRevenue', () => {
    it('deve criar receita com DTO válido e aplicar regras de negócio', async () => {
      // Arrange
      const validRevenueData = {
        type: 'service' as const,
        value: 150.00,
        date: DateHelpers.today(),
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
        payment_method: 'credit_card',
      };

      const createdRevenue = FinancialFixtures.makeServiceRevenue(150);
      mockRevenueRepository.create.mockResolvedValue({
        data: createdRevenue,
        error: null,
      });

      // Act
      const result = await financeiroService.createRevenue(validRevenueData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdRevenue);
      expect(result.error).toBeNull();
      
      // Verificar que repository foi chamado corretamente
      expect(mockRevenueRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRevenueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'service',
          value: 150.00,
          status: 'pending', // Status padrão aplicado
        })
      );
    });

    it('deve aplicar regras de competência para receitas recorrentes', async () => {
      // Arrange
      const recurringRevenueData = {
        type: 'service' as const,
        value: 300.00,
        date: DateHelpers.today(),
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
        payment_method: 'monthly_plan',
        accrual_start_date: '2025-01-01',
        accrual_end_date: '2025-01-31',
      };

      mockRevenueRepository.create.mockResolvedValue({
        data: FinancialFixtures.makeServiceRevenue(300),
        error: null,
      });

      // Act
      const result = await financeiroService.createRevenue(recurringRevenueData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRevenueRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          accrual_start_date: '2025-01-01',
          accrual_end_date: '2025-01-31',
          status: 'pending',
        })
      );
    });

    it('deve calcular settlement_date baseado no payment_method', async () => {
      // ⚠️ TODO(test): Implementar matriz de prazos baseada em FINANCIAL_MODULE.md
      // D+0: cash, pix
      // D+1: debit_card  
      // D+30: monthly_plan
      // Considera dias úteis
      
      const testCases = [
        { method: 'cash', expectedDays: 0 },
        { method: 'pix', expectedDays: 0 },
        { method: 'debit_card', expectedDays: 1 },
        { method: 'credit_card', expectedDays: 30 },
      ];

      for (const testCase of testCases) {
        // Arrange
        const revenueData = {
          type: 'service' as const,
          value: 150.00,
          date: DateHelpers.today(),
          unit_id: TEST_UUIDS.UNIT_ID,
          professional_id: TEST_UUIDS.PROFESSIONAL_ID,
          user_id: TEST_UUIDS.USER_ID,
          account_id: TEST_UUIDS.ACCOUNT_ID,
          payment_method: testCase.method,
        };

        mockRevenueRepository.create.mockResolvedValue({
          data: FinancialFixtures.makeServiceRevenue(150),
          error: null,
        });

        // Act
        await financeiroService.createRevenue(revenueData);

        // Assert
        const expectedSettlementDate = DateHelpers.daysFromNow(testCase.expectedDays);
        expect(mockRevenueRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            expected_receipt_date: expectedSettlementDate,
          })
        );

        vi.clearAllMocks();
      }
    });

    it('deve retornar erro quando DTO é inválido', async () => {
      // Arrange
      const invalidRevenueData = {
        type: 'invalid_type' as any,
        value: -50, // Valor negativo
        // Faltam campos obrigatórios
      };

      // Act
      const result = await financeiroService.createRevenue(invalidRevenueData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('tipo deve ser um dos valores válidos');
      expect(result.error).toContain('valor deve ser maior que zero');
      
      // Repository não deve ser chamado
      expect(mockRevenueRepository.create).not.toHaveBeenCalled();
    });

    it('deve propagar erro do repository', async () => {
      // Arrange
      const validRevenueData = {
        type: 'service' as const,
        value: 150.00,
        date: DateHelpers.today(),
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
      };

      mockRevenueRepository.create.mockResolvedValue({
        data: null,
        error: 'Erro de conexão com banco de dados',
      });

      // Act
      const result = await financeiroService.createRevenue(validRevenueData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro de conexão com banco de dados');
      expect(result.data).toBeNull();
    });

    it('deve implementar idempotência básica - não duplicar receitas idênticas', async () => {
      // Arrange
      const revenueData = {
        type: 'service' as const,
        value: 150.00,
        date: DateHelpers.today(),
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
        idempotency_key: 'unique-key-123',
      };

      // Primeira chamada - sucesso
      mockRevenueRepository.create.mockResolvedValueOnce({
        data: FinancialFixtures.makeServiceRevenue(150),
        error: null,
      });

      // Segunda chamada - duplicate key error
      mockRevenueRepository.create.mockResolvedValueOnce({
        data: null,
        error: 'duplicate key value violates unique constraint',
      });

      // Act
      const firstResult = await financeiroService.createRevenue(revenueData);
      const secondResult = await financeiroService.createRevenue(revenueData);

      // Assert
      expect(firstResult.success).toBe(true);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('já existe');
    });
  });

  describe('getRevenues', () => {
    it('deve buscar receitas com filtros aplicados', async () => {
      // Arrange
      const filters = {
        unit_id: TEST_UUIDS.UNIT_ID,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        status: 'Received',
      };

      const mockRevenues = [
        FinancialFixtures.makeReceivedRevenue(),
        FinancialFixtures.makeServiceRevenue(200),
      ];

      mockRevenueRepository.findAll.mockResolvedValue({
        data: mockRevenues,
        error: null,
        count: 2,
      });

      // Act
      const result = await financeiroService.getRevenues(filters);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRevenues);
      expect(result.count).toBe(2);
      expect(mockRevenueRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('deve aplicar paginação quando especificada', async () => {
      // Arrange
      const pagination = { page: 2, limit: 10 };
      mockRevenueRepository.findAll.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await financeiroService.getRevenues({}, pagination);

      // Assert
      expect(mockRevenueRepository.findAll).toHaveBeenCalledWith({}, pagination);
    });

    it('deve retornar lista vazia quando não há receitas', async () => {
      // Arrange
      mockRevenueRepository.findAll.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      const result = await financeiroService.getRevenues({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('getKPIs', () => {
    it('deve calcular KPIs financeiros corretamente', async () => {
      // Arrange
      const currentPeriod = DateHelpers.currentMonth();
      const previousPeriod = DateHelpers.lastMonth();

      // Mock de dados do período atual
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({ // Receitas período atual
          data: [
            FinancialFixtures.makeReceivedRevenue(),
            FinancialFixtures.makeServiceRevenue(300),
          ],
          error: null,
        })
        .mockResolvedValueOnce({ // Receitas período anterior
          data: [
            FinancialFixtures.makeServiceRevenue(200),
          ],
          error: null,
        });

      // Act
      const result = await financeiroService.getKPIs(TEST_UUIDS.UNIT_ID, currentPeriod);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          current_period: {
            total_revenue: expect.any(Number),
            received_revenue: expect.any(Number),
            pending_revenue: expect.any(Number),
          },
          trends: {
            revenue_growth: expect.any(Number),
            growth_direction: expect.stringMatching(/^(up|down|stable)$/),
          },
        })
      );
    });

    it('deve calcular tendências corretamente (crescimento)', async () => {
      // Arrange - Período atual maior que anterior
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({
          data: [FinancialFixtures.makeServiceRevenue(1000)], // Atual
          error: null,
        })
        .mockResolvedValueOnce({
          data: [FinancialFixtures.makeServiceRevenue(800)], // Anterior
          error: null,
        });

      // Act
      const result = await financeiroService.getKPIs(TEST_UUIDS.UNIT_ID, DateHelpers.currentMonth());

      // Assert
      expect(result.data.trends.growth_direction).toBe('up');
      expect(result.data.trends.revenue_growth).toBeCloseTo(25, 1); // +25%
    });

    it('deve calcular tendências corretamente (declínio)', async () => {
      // Arrange - Período atual menor que anterior
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({
          data: [FinancialFixtures.makeServiceRevenue(600)], // Atual
          error: null,
        })
        .mockResolvedValueOnce({
          data: [FinancialFixtures.makeServiceRevenue(800)], // Anterior
          error: null,
        });

      // Act
      const result = await financeiroService.getKPIs(TEST_UUIDS.UNIT_ID, DateHelpers.currentMonth());

      // Assert
      expect(result.data.trends.growth_direction).toBe('down');
      expect(result.data.trends.revenue_growth).toBeCloseTo(-25, 1); // -25%
    });

    it('deve tratar período anterior vazio graciosamente', async () => {
      // Arrange
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({
          data: [FinancialFixtures.makeServiceRevenue(1000)], // Atual
          error: null,
        })
        .mockResolvedValueOnce({
          data: [], // Anterior vazio
          error: null,
        });

      // Act
      const result = await financeiroService.getKPIs(TEST_UUIDS.UNIT_ID, DateHelpers.currentMonth());

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.trends.growth_direction).toBe('up');
      expect(result.data.trends.revenue_growth).toBe(100); // 100% quando base é zero
    });
  });

  describe('updateRevenueStatus', () => {
    it('deve atualizar status de receita com validações', async () => {
      // Arrange
      const revenueId = 'rev-123';
      const newStatus = 'Received';
      const actualReceiptDate = DateHelpers.today();

      mockRevenueRepository.findById.mockResolvedValue({
        data: FinancialFixtures.makeServiceRevenue(150),
        error: null,
      });

      mockRevenueRepository.update.mockResolvedValue({
        data: { ...FinancialFixtures.makeReceivedRevenue() },
        error: null,
      });

      // Act
      const result = await financeiroService.updateRevenueStatus(
        revenueId, 
        newStatus, 
        { actual_receipt_date: actualReceiptDate }
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockRevenueRepository.update).toHaveBeenCalledWith(
        revenueId,
        expect.objectContaining({
          status: 'Received',
          actual_receipt_date: actualReceiptDate,
        })
      );
    });

    it('deve rejeitar transições de status inválidas', async () => {
      // Arrange
      const revenueId = 'rev-123';
      const cancelledRevenue = { 
        ...FinancialFixtures.makeServiceRevenue(150),
        status: 'cancelled'
      };

      mockRevenueRepository.findById.mockResolvedValue({
        data: cancelledRevenue,
        error: null,
      });

      // Act
      const result = await financeiroService.updateRevenueStatus(
        revenueId, 
        'Received' // Não pode receber receita cancelada
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Transição de status inválida');
      expect(mockRevenueRepository.update).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando receita não existe', async () => {
      // Arrange
      mockRevenueRepository.findById.mockResolvedValue({
        data: null,
        error: 'Receita não encontrada',
      });

      // Act
      const result = await financeiroService.updateRevenueStatus('rev-inexistente', 'Received');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Receita não encontrada');
    });
  });

  describe('Edge cases e validações', () => {
    it('deve lidar com valores extremos graciosamente', async () => {
      // Arrange - Valor muito pequeno
      const minRevenueData = {
        type: 'service' as const,
        value: 0.01,
        date: DateHelpers.today(),
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
      };

      mockRevenueRepository.create.mockResolvedValue({
        data: FinancialFixtures.makeServiceRevenue(0.01),
        error: null,
      });

      // Act
      const result = await financeiroService.createRevenue(minRevenueData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve rejeitar receitas com data futura muito distante', async () => {
      // Arrange
      const futureRevenueData = {
        type: 'service' as const,
        value: 150.00,
        date: DateHelpers.daysFromNow(365 * 2), // 2 anos no futuro
        unit_id: TEST_UUIDS.UNIT_ID,
        professional_id: TEST_UUIDS.PROFESSIONAL_ID,
        user_id: TEST_UUIDS.USER_ID,
        account_id: TEST_UUIDS.ACCOUNT_ID,
      };

      // Act
      const result = await financeiroService.createRevenue(futureRevenueData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Data não pode ser superior a 1 ano no futuro');
    });

    // ⚠️ TODO(test): Implementar validação de RLS no service layer
    // Verificar se unit_id pertence ao usuário autenticado
    it.todo('deve validar RLS - receita só pode ser criada para unidade do usuário');

    // ⚠️ TODO(test): Implementar validação de business rules
    // Status transitions, approval workflows, etc.
    it.todo('deve implementar workflow de aprovação para receitas >R$1000');
  });
});
