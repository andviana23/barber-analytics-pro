/**
 * @fileoverview Testes do CashflowService
 * Testa fluxo de caixa: previsto vs realizado, inclusão de receitas recebidas/despesas pagas no período correto
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { CashflowService } from '../cashflowService';
import { FinancialFixtures, DateHelpers } from '../../../tests/__fixtures__/financial';

// Mock do CashflowService usando vi.hoisted
const mockCashflowServiceMethods = vi.hoisted(() => ({
  getCashflowProjection: vi.fn(),
  getActualCashflow: vi.fn(),
  getCashflowComparison: vi.fn(),
  getCashflowEntries: vi.fn(),
}));

vi.mock('../cashflowService', () => ({
  CashflowService: mockCashflowServiceMethods,
}));

// Mock dos repositories (simulação)
const mockRevenueRepository = {
  findAll: vi.fn(),
};

const mockExpenseRepository = {
  findAll: vi.fn(),
};

describe('CashflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCashflowProjection', () => {
    it('deve calcular fluxo de caixa previsto corretamente', async () => {
      // Arrange
      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      };

      // Receitas previstas mas não recebidas
      const expectedRevenues = [
        {
          ...FinancialFixtures.makeServiceRevenue(1000),
          status: 'pending',
          expected_receipt_date: '2025-01-15',
        },
        {
          ...FinancialFixtures.makeServiceRevenue(500),
          status: 'scheduled',
          expected_receipt_date: '2025-01-25',
        },
      ];

      // Despesas previstas mas não pagas
      const expectedExpenses = [
        {
          ...FinancialFixtures.makeRentExpense(2000),
          status: 'pending',
          expected_payment_date: '2025-01-05',
        },
        {
          ...FinancialFixtures.makeExpense(300),
          status: 'scheduled',
          expected_payment_date: '2025-01-20',
        },
      ];

      mockRevenueRepository.findAll.mockResolvedValue({
        data: expectedRevenues,
        error: null,
      });

      mockExpenseRepository.findAll.mockResolvedValue({
        data: expectedExpenses,
        error: null,
      });

      // Act
      const result = await CashflowService.getCashflowProjection(period);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          period: period,
          projected: {
            total_revenue: 1500, // 1000 + 500
            total_expense: 2300, // 2000 + 300
            net_cashflow: -800, // 1500 - 2300
          },
          daily_projection: expect.any(Array),
        })
      );
    });

    it('deve gerar projeção diária detalhada', async () => {
      // Arrange
      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-03',
        unit_id: 'unit-123',
      };

      const revenues = [
        {
          ...FinancialFixtures.makeServiceRevenue(500),
          expected_receipt_date: '2025-01-01',
        },
        {
          ...FinancialFixtures.makeServiceRevenue(300),
          expected_receipt_date: '2025-01-03',
        },
      ];

      const expenses = [
        {
          ...FinancialFixtures.makeExpense(200),
          expected_payment_date: '2025-01-02',
        },
      ];

      mockRevenueRepository.findAll.mockResolvedValue({ data: revenues, error: null });
      mockExpenseRepository.findAll.mockResolvedValue({ data: expenses, error: null });

      // Act
      const result = await CashflowService.getCashflowProjection(period);

      // Assert
      expect(result.data.daily_projection).toHaveLength(3);
      expect(result.data.daily_projection[0]).toEqual(
        expect.objectContaining({
          date: '2025-01-01',
          revenue: 500,
          expense: 0,
          net: 500,
          cumulative: 500,
        })
      );
      expect(result.data.daily_projection[1]).toEqual(
        expect.objectContaining({
          date: '2025-01-02',
          revenue: 0,
          expense: 200,
          net: -200,
          cumulative: 300,
        })
      );
      expect(result.data.daily_projection[2]).toEqual(
        expect.objectContaining({
          date: '2025-01-03',
          revenue: 300,
          expense: 0,
          net: 300,
          cumulative: 600,
        })
      );
    });
  });

  describe('getActualCashflow', () => {
    it('deve calcular fluxo de caixa realizado (apenas items recebidos/pagos)', async () => {
      // Arrange
      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      };

      // Receitas efetivamente recebidas no período
      const receivedRevenues = [
        {
          ...FinancialFixtures.makeReceivedRevenue(),
          value: 800,
          actual_receipt_date: '2025-01-10',
        },
        {
          ...FinancialFixtures.makeReceivedRevenue(),
          value: 600,
          actual_receipt_date: '2025-01-20',
        },
      ];

      // Despesas efetivamente pagas no período
      const paidExpenses = [
        {
          ...FinancialFixtures.makePaidExpense(),
          value: 1500,
          actual_payment_date: '2025-01-05',
        },
        {
          ...FinancialFixtures.makePaidExpense(),
          value: 400,
          actual_payment_date: '2025-01-25',
        },
      ];

      mockRevenueRepository.findAll.mockResolvedValue({
        data: receivedRevenues,
        error: null,
      });

      mockExpenseRepository.findAll.mockResolvedValue({
        data: paidExpenses,
        error: null,
      });

      // Act
      const result = await CashflowService.getActualCashflow(period);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          period: period,
          actual: {
            total_revenue: 1400, // 800 + 600
            total_expense: 1900, // 1500 + 400
            net_cashflow: -500, // 1400 - 1900
          },
        })
      );

      // Verificar que apenas receitas/despesas realizadas foram consultadas
      expect(mockRevenueRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'received',
          actual_receipt_date_gte: '2025-01-01',
          actual_receipt_date_lte: '2025-01-31',
        })
      );

      expect(mockExpenseRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
          actual_payment_date_gte: '2025-01-01',
          actual_payment_date_lte: '2025-01-31',
        })
      );
    });

    it('deve incluir apenas transações com data de realização no período', async () => {
      // Arrange
      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      };

      const revenues = [
        // Incluir: recebida no período
        {
          ...FinancialFixtures.makeReceivedRevenue(),
          actual_receipt_date: '2025-01-15',
          value: 500,
        },
        // Excluir: recebida fora do período (mas criada dentro)
        {
          ...FinancialFixtures.makeReceivedRevenue(),
          date: '2025-01-20', // Criada no período
          actual_receipt_date: '2025-02-05', // Recebida fora
          value: 300,
        },
      ];

      mockRevenueRepository.findAll.mockResolvedValue({
        data: [revenues[0]], // Repository já filtra por actual_receipt_date
        error: null,
      });

      mockExpenseRepository.findAll.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      const result = await CashflowService.getActualCashflow(period);

      // Assert
      expect(result.data.actual.total_revenue).toBe(500); // Apenas a do período
    });
  });

  describe('getCashflowComparison', () => {
    it('deve comparar fluxo previsto vs realizado com análise de variance', async () => {
      // Arrange
      const period = {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      };

      // Mock do previsto
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({ // Chamada para projeção
          data: [
            { ...FinancialFixtures.makeServiceRevenue(1000), status: 'pending' },
            { ...FinancialFixtures.makeServiceRevenue(500), status: 'scheduled' },
          ],
          error: null,
        })
        .mockResolvedValueOnce({ // Chamada para realizado
          data: [
            { ...FinancialFixtures.makeReceivedRevenue(), value: 1200 },
          ],
          error: null,
        });

      mockExpenseRepository.findAll
        .mockResolvedValueOnce({ // Chamada para projeção
          data: [
            { ...FinancialFixtures.makeExpense(800), status: 'pending' },
          ],
          error: null,
        })
        .mockResolvedValueOnce({ // Chamada para realizado
          data: [
            { ...FinancialFixtures.makePaidExpense(), value: 900 },
          ],
          error: null,
        });

      // Act
      const result = await CashflowService.getCashflowComparison(period);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          projected: {
            total_revenue: 1500,
            total_expense: 800,
            net_cashflow: 700,
          },
          actual: {
            total_revenue: 1200,
            total_expense: 900,
            net_cashflow: 300,
          },
          variance: {
            revenue_variance: -300, // 1200 - 1500
            expense_variance: 100, // 900 - 800 (mais gasto que previsto)
            net_variance: -400, // 300 - 700
            revenue_accuracy: 80, // 1200/1500 * 100
            expense_accuracy: 112.5, // 900/800 * 100
          },
          analysis: {
            performance: 'below_projection', // Net < projetado
            main_variance_driver: 'revenue', // Maior desvio absoluto
          },
        })
      );
    });

    it('deve identificar driver principal de variância corretamente', async () => {
      // Caso: Despesas muito acima do previsto
      mockRevenueRepository.findAll
        .mockResolvedValueOnce({ data: [{ value: 1000, status: 'pending' }], error: null })
        .mockResolvedValueOnce({ data: [{ value: 1000 }], error: null });

      mockExpenseRepository.findAll
        .mockResolvedValueOnce({ data: [{ value: 500, status: 'pending' }], error: null })
        .mockResolvedValueOnce({ data: [{ value: 1200 }], error: null }); // +700 de variância

      const result = await CashflowService.getCashflowComparison({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      });

      expect(result.data.analysis.main_variance_driver).toBe('expense');
      expect(result.data.analysis.performance).toBe('below_projection');
    });

    it('deve classificar performance corretamente', async () => {
      const testCases = [
        {
          projectedNet: 1000,
          actualNet: 1100,
          expectedPerformance: 'above_projection',
        },
        {
          projectedNet: 1000,
          actualNet: 950,
          expectedPerformance: 'on_target', // -5% ainda é "on target"
        },
        {
          projectedNet: 1000,
          actualNet: 800,
          expectedPerformance: 'below_projection', // -20%
        },
      ];

      for (const testCase of testCases) {
        // Setup mocks para cada caso
        mockRevenueRepository.findAll
          .mockResolvedValueOnce({ data: [{ value: testCase.projectedNet, status: 'pending' }], error: null })
          .mockResolvedValueOnce({ data: [{ value: testCase.actualNet }], error: null });

        mockExpenseRepository.findAll
          .mockResolvedValueOnce({ data: [], error: null })
          .mockResolvedValueOnce({ data: [], error: null });

        const result = await CashflowService.getCashflowComparison({
          start_date: '2025-01-01',
          end_date: '2025-01-31',
          unit_id: 'unit-123',
        });

        expect(result.data.analysis.performance).toBe(testCase.expectedPerformance);
        vi.clearAllMocks();
      }
    });
  });

  describe('Edge cases e validações', () => {
    it('deve lidar com períodos sem transações', async () => {
      mockRevenueRepository.findAll.mockResolvedValue({ data: [], error: null });
      mockExpenseRepository.findAll.mockResolvedValue({ data: [], error: null });

      const result = await CashflowService.getCashflowProjection({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      });

      expect(result.success).toBe(true);
      expect(result.data.projected.total_revenue).toBe(0);
      expect(result.data.projected.total_expense).toBe(0);
      expect(result.data.projected.net_cashflow).toBe(0);
    });

    it('deve validar formato de período', async () => {
      const invalidPeriod = {
        start_date: '2025-01-31',
        end_date: '2025-01-01', // Data fim antes da inicial
        unit_id: 'unit-123',
      };

      const result = await CashflowService.getCashflowProjection(invalidPeriod);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Data de fim deve ser posterior à data de início');
    });

    it('deve limitar período máximo para evitar consultas muito pesadas', async () => {
      const largePeriod = {
        start_date: '2025-01-01',
        end_date: '2027-12-31', // 3 anos
        unit_id: 'unit-123',
      };

      const result = await CashflowService.getCashflowProjection(largePeriod);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Período não pode ser superior a 1 ano');
    });

    it('deve tratar erros de repository graciosamente', async () => {
      mockRevenueRepository.findAll.mockResolvedValue({
        data: null,
        error: 'Erro de conexão',
      });

      const result = await CashflowService.getCashflowProjection({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        unit_id: 'unit-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erro de conexão');
    });

    // ⚠️ TODO(test): Implementar cache para consultas pesadas de cashflow
    // Baseado em performance requirements
    it.todo('deve implementar cache para períodos já calculados');

    // ⚠️ TODO(test): Adicionar validação de permissões de unidade
    it.todo('deve validar RLS - usuário só pode ver cashflow de suas unidades');
  });
});
