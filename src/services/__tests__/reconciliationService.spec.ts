/**
 * @fileoverview Testes do ReconciliationService
 * Testa tolerâncias de valor/data, status pendente→conciliado, prevenção de duplicação
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { ReconciliationService } from '../../services/reconciliationService';
import { 
  FinancialFixtures, 
  DateHelpers, 
  RevenueBuilder, 
  BankStatementBuilder,
  ReconciliationBuilder 
} from '../../../tests/__fixtures__/financial';

// Mock do Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

vi.mock('../../../services/supabase', () => ({
  supabase: mockSupabase,
}));

describe('ReconciliationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autoReconcile', () => {
    it('deve encontrar correspondência exata (valor e data)', async () => {
      // Arrange
      const statement = BankStatementBuilder.create()
        .withAmount(150.00)
        .withDate('2025-01-15')
        .build();

      const revenue = RevenueBuilder.create()
        .withValue(150.00)
        .withReceiptDates('2025-01-15')
        .build();

      const mockQuery = mockSupabase.from().select();
      mockQuery.single.mockResolvedValueOnce({ 
        data: [statement], 
        error: null 
      });
      mockQuery.single.mockResolvedValueOnce({ 
        data: [revenue], 
        error: null 
      });

      const options = {
        account_id: 'acc-123',
        tolerance: 0.01,
        date_tolerance: 0, // Exata
      };

      // Act
      const result = await ReconciliationService.autoReconcile(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.matches).toHaveLength(1);
      expect(result.data.matches[0]).toEqual(
        expect.objectContaining({
          statement_id: statement.id,
          revenue_id: revenue.id,
          amount_difference: 0,
          date_difference: 0,
          confidence_score: 100,
        })
      );
    });

    it('deve encontrar correspondência dentro da tolerância de valor', async () => {
      // Arrange - Diferença de R$ 0,50 com tolerância de R$ 1,00
      const statement = BankStatementBuilder.create()
        .withAmount(150.00)
        .build();

      const revenue = RevenueBuilder.create()
        .withValue(150.50) // +R$ 0,50
        .build();

      mockSupabase.from().select().single
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ data: [revenue], error: null });

      const options = {
        account_id: 'acc-123',
        tolerance: 1.00, // R$ 1,00 de tolerância
        date_tolerance: 1,
      };

      // Act
      const result = await ReconciliationService.autoReconcile(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.matches[0]).toEqual(
        expect.objectContaining({
          amount_difference: 0.50,
          confidence_score: expect.any(Number),
        })
      );
    });

    it('deve rejeitar correspondência fora da tolerância de valor', async () => {
      // Arrange - Diferença de R$ 2,00 com tolerância de R$ 1,00
      const statement = BankStatementBuilder.create()
        .withAmount(150.00)
        .build();

      const revenue = RevenueBuilder.create()
        .withValue(152.00) // +R$ 2,00 (acima da tolerância)
        .build();

      mockSupabase.from().select().single
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ data: [revenue], error: null });

      const options = {
        account_id: 'acc-123',
        tolerance: 1.00,
        date_tolerance: 1,
      };

      // Act
      const result = await ReconciliationService.autoReconcile(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.matches).toHaveLength(0); // Nenhuma correspondência
    });

    it('deve encontrar correspondência dentro da tolerância de data', async () => {
      // Arrange - Diferença de 2 dias com tolerância de 3 dias
      const statement = BankStatementBuilder.create()
        .withDate('2025-01-15')
        .withAmount(150.00)
        .build();

      const revenue = RevenueBuilder.create()
        .withValue(150.00)
        .withReceiptDates('2025-01-17') // +2 dias
        .build();

      mockSupabase.from().select().single
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ data: [revenue], error: null });

      const options = {
        account_id: 'acc-123',
        tolerance: 0.01,
        date_tolerance: 3, // 3 dias de tolerância
      };

      // Act
      const result = await ReconciliationService.autoReconcile(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.matches[0]).toEqual(
        expect.objectContaining({
          date_difference: 2,
          confidence_score: expect.any(Number),
        })
      );
    });

    it('deve calcular confidence_score baseado nas diferenças', async () => {
      // Arrange - Match perfeito = 100%, diferenças reduzem score
      const testCases = [
        {
          amountDiff: 0,
          dateDiff: 0,
          expectedScore: 100,
        },
        {
          amountDiff: 0.50,
          dateDiff: 0,
          expectedScore: 95, // Pequena diferença de valor
        },
        {
          amountDiff: 0,
          dateDiff: 1,
          expectedScore: 90, // 1 dia de diferença
        },
        {
          amountDiff: 1.00,
          dateDiff: 2,
          expectedScore: 80, // Ambas as diferenças
        },
      ];

      for (const testCase of testCases) {
        const statement = BankStatementBuilder.create()
          .withAmount(150.00)
          .withDate('2025-01-15')
          .build();

        const revenue = RevenueBuilder.create()
          .withValue(150.00 + testCase.amountDiff)
          .withReceiptDates(DateHelpers.daysFromNow(testCase.dateDiff))
          .build();

        mockSupabase.from().select().single
          .mockResolvedValueOnce({ data: [statement], error: null })
          .mockResolvedValueOnce({ data: [revenue], error: null });

        const result = await ReconciliationService.autoReconcile({
          account_id: 'acc-123',
          tolerance: 2.00,
          date_tolerance: 3,
        });

        expect(result.data.matches[0].confidence_score).toBeCloseTo(
          testCase.expectedScore, 
          0
        );

        vi.clearAllMocks();
      }
    });

    it('deve priorizar matches com maior confidence_score', async () => {
      // Arrange - 1 statement, 2 revenues possíveis
      const statement = BankStatementBuilder.create()
        .withAmount(150.00)
        .withDate('2025-01-15')
        .build();

      const exactRevenue = RevenueBuilder.create()
        .withId('exact-match')
        .withValue(150.00) // Exato
        .withReceiptDates('2025-01-15') // Exato
        .build();

      const approximateRevenue = RevenueBuilder.create()
        .withId('approx-match')
        .withValue(151.00) // +R$ 1,00
        .withReceiptDates('2025-01-17') // +2 dias
        .build();

      mockSupabase.from().select().single
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ 
          data: [exactRevenue, approximateRevenue], 
          error: null 
        });

      // Act
      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
        tolerance: 2.00,
        date_tolerance: 3,
      });

      // Assert
      expect(result.data.matches).toHaveLength(1);
      expect(result.data.matches[0].revenue_id).toBe('exact-match');
      expect(result.data.matches[0].confidence_score).toBe(100);
    });

    it('deve evitar duplicação - não conciliar statement já conciliado', async () => {
      // Arrange
      const reconciledStatement = BankStatementBuilder.create()
        .reconciled() // Já conciliado
        .build();

      mockSupabase.from().select().single.mockResolvedValueOnce({ 
        data: [reconciledStatement], 
        error: null 
      });

      // Act
      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
      });

      // Assert
      expect(result.data.matches).toHaveLength(0);
      expect(result.data.summary.already_reconciled).toBe(1);
    });

    it('deve evitar duplicação - não conciliar revenue já conciliado', async () => {
      // Arrange
      const statement = BankStatementBuilder.create().build();
      
      // Revenue já tem reconciliação
      const reconciledRevenue = RevenueBuilder.create()
        .withValue(150.00)
        .build();

      mockSupabase.from().select().single
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ data: [reconciledRevenue], error: null })
        .mockResolvedValueOnce({ // Verificação de reconciliação existente
          data: [{ revenue_id: reconciledRevenue.id }], 
          error: null 
        });

      // Act
      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
      });

      // Assert
      expect(result.data.matches).toHaveLength(0);
    });
  });

  describe('confirmReconciliation', () => {
    it('deve confirmar reconciliação pendente e atualizar status', async () => {
      // Arrange
      const reconciliationId = 'rec-123';
      const pendingReconciliation = ReconciliationBuilder.create()
        .withId(reconciliationId)
        .build(); // Status 'pending' por padrão

      mockSupabase.from().select().single.mockResolvedValue({
        data: pendingReconciliation,
        error: null,
      });

      mockSupabase.from().update().eq().single.mockResolvedValue({
        data: { ...pendingReconciliation, status: 'confirmed' },
        error: null,
      });

      // Act
      const result = await ReconciliationService.confirmReconciliation(reconciliationId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        status: 'confirmed',
        confirmed_at: expect.any(String),
      });
    });

    it('deve rejeitar confirmação de reconciliação já confirmada', async () => {
      // Arrange
      const confirmedReconciliation = ReconciliationBuilder.create()
        .confirmed()
        .build();

      mockSupabase.from().select().single.mockResolvedValue({
        data: confirmedReconciliation,
        error: null,
      });

      // Act
      const result = await ReconciliationService.confirmReconciliation('rec-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('já foi confirmada');
      expect(mockSupabase.from().update).not.toHaveBeenCalled();
    });

    it('deve atualizar status do bank_statement para "reconciled"', async () => {
      // Arrange
      const reconciliation = ReconciliationBuilder.create().build();

      mockSupabase.from().select().single.mockResolvedValue({
        data: reconciliation,
        error: null,
      });

      mockSupabase.from().update().eq().single
        .mockResolvedValueOnce({ // Atualização da reconciliação
          data: { ...reconciliation, status: 'confirmed' },
          error: null,
        })
        .mockResolvedValueOnce({ // Atualização do statement
          data: { status: 'reconciled' },
          error: null,
        });

      // Act
      await ReconciliationService.confirmReconciliation('rec-123');

      // Assert
      expect(mockSupabase.from().update).toHaveBeenCalledTimes(2);
      expect(mockSupabase.from().update).toHaveBeenNthCalledWith(2, {
        status: 'reconciled',
      });
    });
  });

  describe('Edge cases e validações', () => {
    it('deve lidar com conta sem statements', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-vazia',
      });

      expect(result.success).toBe(true);
      expect(result.data.matches).toHaveLength(0);
      expect(result.data.summary.total_statements).toBe(0);
    });

    it('deve validar tolerâncias mínimas e máximas', async () => {
      // Tolerância negativa
      let result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
        tolerance: -1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tolerância deve ser maior que zero');

      // Tolerância muito alta
      result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
        tolerance: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tolerância não pode ser superior a R$ 100');
    });

    it('deve lidar com erro de conexão com banco', async () => {
      mockSupabase.from().select().single.mockResolvedValue({
        data: null,
        error: 'Connection timeout',
      });

      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });

    it('deve aplicar limit para evitar consultas muito pesadas', async () => {
      // Arrange - Muitos statements
      const manyStatements = Array.from({ length: 1000 }, (_, i) => 
        BankStatementBuilder.create().withId(`stmt-${i}`).build()
      );

      mockSupabase.from().select().single.mockResolvedValue({
        data: manyStatements,
        error: null,
      });

      // Act
      await ReconciliationService.autoReconcile({
        account_id: 'acc-123',
      });

      // Assert - Deve limitar consulta
      expect(mockSupabase.from().select).toHaveBeenCalledWith(
        expect.stringContaining('*')
      );
      // ⚠️ TODO(test): Verificar se limit foi aplicado na query
    });

    // ⚠️ TODO(test): Implementar testes de performance para large datasets
    it.todo('deve processar reconciliação em batches para grandes volumes');

    // ⚠️ TODO(test): Implementar testes de concorrência 
    it.todo('deve lidar com reconciliações simultâneas do mesmo statement');
  });
});
