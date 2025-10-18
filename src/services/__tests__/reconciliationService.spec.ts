/**
 * @fileoverview Testes do ReconciliationService
 * Testa tolerâncias de valor/data, status pendente→conciliado, prevenção de duplicação
 */

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { ReconciliationService } from '../reconciliationService';
import { 
  FinancialFixtures, 
  DateHelpers, 
  RevenueBuilder, 
  BankStatementBuilder,
  ReconciliationBuilder 
} from '../../../tests/__fixtures__/financial';

// Mock do Supabase com vi.hoisted
const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQuery),
  };

  return { mockSupabase, mockQuery };
});

vi.mock('../supabase', () => ({
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

      // Mock das chamadas sequenciais: primeiro bank_statements, depois receitas
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [statement], 
        error: null 
      });
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [revenue], 
        error: null 
      });

      const options = {
        account_id: 'acc-1', // Corrigido para 'acc-1' que é o padrão dos builders
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

      // Mock das chamadas sequenciais: primeiro bank_statements, depois receitas
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [statement], 
        error: null 
      });
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [revenue], 
        error: null 
      });

      const options = {
        account_id: 'acc-1',
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

      // Mock das chamadas sequenciais: primeiro bank_statements, depois receitas
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [statement], 
        error: null 
      });
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [revenue], 
        error: null 
      });

      const options = {
        account_id: 'acc-1',
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

      // Mock das chamadas sequenciais: primeiro bank_statements, depois receitas
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [statement], 
        error: null 
      });
      mockQuery.limit.mockResolvedValueOnce({ 
        data: [revenue], 
        error: null 
      });

      const options = {
        account_id: 'acc-1',
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
          expectedScore: 73, // Ambas as diferenças
        },
      ];

      for (const testCase of testCases) {
        const baseDate = '2025-01-15';
        
        const statement = BankStatementBuilder.create()
          .withAmount(150.00)
          .withDate(baseDate)
          .build();

        // Calculate target date based on the base date plus the difference
        const baseDateTime = new Date(baseDate);
        const targetDateTime = new Date(baseDateTime.getTime() + (testCase.dateDiff * 24 * 60 * 60 * 1000));
        const targetDate = targetDateTime.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const revenue = RevenueBuilder.create()
          .withValue(150.00 + testCase.amountDiff)
          .withReceiptDates(targetDate)
          .build();

        mockQuery.limit
          .mockResolvedValueOnce({ data: [statement], error: null })
          .mockResolvedValueOnce({ data: [revenue], error: null });

        const result = await ReconciliationService.autoReconcile({
          account_id: 'acc-1',
          tolerance: 2.00,
          date_tolerance: 3,
        });

        expect(result.data.matches[0].confidence_score).toBeCloseTo(
          testCase.expectedScore, 
          -1  // Allow 1 point difference
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

      mockQuery.limit
        .mockResolvedValueOnce({ data: [statement], error: null })
        .mockResolvedValueOnce({ 
          data: [exactRevenue, approximateRevenue], 
          error: null 
        });

      // Act
      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-1',
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
        .reconciled() // Já conciliado status = 'reconciled'
        .build();

      // O algoritmo espera 2 queries: statements + revenues
      mockQuery.limit
        .mockResolvedValueOnce({ data: [reconciledStatement], error: null }) // Statements (incluindo já reconciliado)
        .mockResolvedValueOnce({ data: [], error: null }); // Empty revenues

      // Act
      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-1',
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
        account_id: 'acc-1',
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

      mockQuery.single.mockResolvedValue({
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
        .confirmed() // status = 'confirmed'
        .build();

      // O código chama: supabase.from('reconciliations').select('*').eq('id', reconciliationId).single()
      mockQuery.single.mockResolvedValueOnce({
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

      // Mock para buscar reconciliação pendente
      mockQuery.single.mockResolvedValueOnce({
        data: reconciliation,
        error: null,
      });

      // Mock para atualização da reconciliação (1ª chamada update)
      mockQuery.single.mockResolvedValueOnce({
        data: { ...reconciliation, status: 'confirmed' },
        error: null,
      });
      
      // Mock para atualização do statement (2ª chamada update)
      mockQuery.single.mockResolvedValueOnce({
        data: { status: 'reconciled' },
        error: null,
      });

      // Act
      await ReconciliationService.confirmReconciliation('rec-123');

      // Assert
      expect(mockQuery.update).toHaveBeenCalledTimes(2);
      expect(mockQuery.update).toHaveBeenNthCalledWith(2, {
        status: 'reconciled',
      });
    });
  });

  describe('Edge cases e validações', () => {
    it('deve lidar com conta sem statements', async () => {
      mockQuery.limit.mockResolvedValue({
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
        account_id: 'acc-1',
        tolerance: -1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tolerância deve ser maior que zero');

      // Tolerância muito alta
      result = await ReconciliationService.autoReconcile({
        account_id: 'acc-1',
        tolerance: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tolerância não pode ser superior a R$ 100');
    });

    it('deve lidar com erro de conexão com banco', async () => {
      mockQuery.limit.mockResolvedValue({
        data: null,
        error: 'Connection timeout',
      });

      const result = await ReconciliationService.autoReconcile({
        account_id: 'acc-1',
      });

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
      expect(result.error).toContain('Connection timeout');
    });

    it('deve aplicar limit para evitar consultas muito pesadas', async () => {
      // Arrange - Muitos statements
      const manyStatements = Array.from({ length: 1000 }, (_, i) => 
        BankStatementBuilder.create().withId(`stmt-${i}`).build()
      );

      mockQuery.limit.mockResolvedValue({
        data: manyStatements,
        error: null,
      });

      // Act
      await ReconciliationService.autoReconcile({
        account_id: 'acc-1',
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
