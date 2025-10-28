/**
 * @file CashRegisterDTO.test.js
 * @description Testes unitários para CashRegisterDTO
 * @module Tests/DTOs/CashRegister
 * @author Andrey Viana
 * @date 2025-01-24
 */

import { describe, it, expect } from 'vitest';
import {
  validateOpenCashRegister,
  validateCloseCashRegister,
} from '../../src/dtos/CashRegisterDTO';

describe('CashRegisterDTO', () => {
  describe('validateOpenCashRegister', () => {
    describe('Validações de sucesso', () => {
      it('deve aceitar dados válidos completos', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 100.0,
          observations: 'Abertura normal do caixa',
        };

        const result = validateOpenCashRegister(validData);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('deve aceitar dados válidos sem observações', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 100.0,
        };

        const result = validateOpenCashRegister(validData);

        expect(result.success).toBe(true);
      });

      it('deve aceitar saldo zero', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 0,
        };

        const result = validateOpenCashRegister(validData);

        expect(result.success).toBe(true);
      });

      it('deve usar saldo 0 como padrão quando não informado', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
        };

        const result = validateOpenCashRegister(validData);

        expect(result.success).toBe(true);
        expect(result.data.openingBalance).toBe(0);
      });
    });

    describe('Validações de falha', () => {
      it('deve rejeitar saldo negativo', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: -50,
        };

        const result = validateOpenCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('maior ou igual');
      });

      it('deve rejeitar sem unitId', () => {
        const invalidData = {
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 100.0,
        };

        const result = validateOpenCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar sem openedBy', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openingBalance: 100.0,
        };

        const result = validateOpenCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar unitId inválido', () => {
        const invalidData = {
          unitId: 'invalid-uuid',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 100.0,
        };

        const result = validateOpenCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('UUID');
      });

      it('deve rejeitar observações muito longas', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          openedBy: '123e4567-e89b-12d3-a456-426614174001',
          openingBalance: 100.0,
          observations: 'a'.repeat(501),
        };

        const result = validateOpenCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('500');
      });
    });
  });

  describe('validateCloseCashRegister', () => {
    describe('Validações de sucesso', () => {
      it('deve aceitar dados válidos completos', () => {
        const validData = {
          closedBy: '123e4567-e89b-12d3-a456-426614174001',
          closingBalance: 500.0,
          observations: 'Fechamento sem pendências',
        };

        const result = validateCloseCashRegister(validData);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('deve aceitar saldo zero no fechamento', () => {
        const validData = {
          closedBy: '123e4567-e89b-12d3-a456-426614174001',
          closingBalance: 0,
        };

        const result = validateCloseCashRegister(validData);

        expect(result.success).toBe(true);
      });

      it('deve aceitar sem observações', () => {
        const validData = {
          closedBy: '123e4567-e89b-12d3-a456-426614174001',
          closingBalance: 500.0,
        };

        const result = validateCloseCashRegister(validData);

        expect(result.success).toBe(true);
      });
    });

    describe('Validações de falha', () => {
      it('deve rejeitar saldo negativo', () => {
        const invalidData = {
          closedBy: '123e4567-e89b-12d3-a456-426614174001',
          closingBalance: -50,
        };

        const result = validateCloseCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('maior ou igual');
      });

      it('deve rejeitar sem closedBy', () => {
        const invalidData = {
          closingBalance: 500.0,
        };

        const result = validateCloseCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar closedBy inválido', () => {
        const invalidData = {
          closedBy: 'invalid-uuid',
          closingBalance: 500.0,
        };

        const result = validateCloseCashRegister(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('UUID');
      });
    });
  });
});
