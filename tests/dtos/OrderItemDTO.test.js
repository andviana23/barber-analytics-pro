/**
 * @file OrderItemDTO.test.js
 * @description Testes unitários para OrderItemDTO
 * @module Tests/DTOs/OrderItem
 * @author Andrey Viana
 * @date 2025-01-24
 */

import { describe, it, expect } from 'vitest';
import {
  validateAddOrderItem,
  calculateItemTotal,
  calculateItemCommission,
  calculateOrderTotals,
} from '../../src/dtos/OrderItemDTO';

describe('OrderItemDTO', () => {
  describe('validateAddOrderItem', () => {
    describe('Validações de sucesso', () => {
      it('deve aceitar dados válidos completos', () => {
        const validData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 1,
          unitPrice: 50.0,
          commissionPercentage: 30,
        };

        const result = validateAddOrderItem(validData);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('deve aceitar quantidade maior que 1', () => {
        const validData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 5,
          unitPrice: 50.0,
          commissionPercentage: 30,
        };

        const result = validateAddOrderItem(validData);

        expect(result.success).toBe(true);
        expect(result.data.quantity).toBe(5);
      });

      it('deve ter quantity=1 como padrão', () => {
        const validData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          unitPrice: 50.0,
        };

        const result = validateAddOrderItem(validData);

        expect(result.success).toBe(true);
        expect(result.data.quantity).toBe(1);
      });
    });

    describe('Validações de falha', () => {
      it('deve rejeitar quantidade zero', () => {
        const invalidData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 0,
          unitPrice: 50.0,
        };

        const result = validateAddOrderItem(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('maior que zero');
      });

      it('deve rejeitar quantidade negativa', () => {
        const invalidData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: -1,
          unitPrice: 50.0,
        };

        const result = validateAddOrderItem(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar sem orderId', () => {
        const invalidData = {
          serviceId: '123e4567-e89b-12d3-a456-426614174001',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 1,
          unitPrice: 50.0,
        };

        const result = validateAddOrderItem(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar sem serviceId', () => {
        const invalidData = {
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          professionalId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 1,
          unitPrice: 50.0,
        };

        const result = validateAddOrderItem(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('calculateItemTotal', () => {
    it('deve calcular total para quantidade 1', () => {
      const total = calculateItemTotal(50.0, 1);
      expect(total).toBe(50.0);
    });

    it('deve calcular total para múltiplas quantidades', () => {
      const total = calculateItemTotal(40.0, 3);
      expect(total).toBe(120.0);
    });

    it('deve retornar 0 para preço zero', () => {
      const total = calculateItemTotal(0, 5);
      expect(total).toBe(0);
    });

    it('deve retornar 0 para quantidade zero', () => {
      const total = calculateItemTotal(50.0, 0);
      expect(total).toBe(0);
    });
  });

  describe('calculateItemCommission', () => {
    it('deve calcular comissão corretamente', () => {
      const commission = calculateItemCommission(50.0, 1, 30);
      expect(commission).toBe(15.0); // 50 * 1 * 30% = 15
    });

    it('deve calcular comissão zero quando percentual é 0', () => {
      const commission = calculateItemCommission(100.0, 1, 0);
      expect(commission).toBe(0);
    });

    it('deve calcular comissão 100%', () => {
      const commission = calculateItemCommission(50.0, 1, 100);
      expect(commission).toBe(50.0);
    });

    it('deve calcular para múltiplas quantidades', () => {
      const commission = calculateItemCommission(40.0, 3, 25);
      expect(commission).toBe(30.0); // 40 * 3 * 25% = 30
    });
  });

  describe('calculateOrderTotals', () => {
    it('deve calcular totais de comanda com um item', () => {
      const items = [
        { unitPrice: 50.0, quantity: 1, commissionPercentage: 30 },
      ];

      const result = calculateOrderTotals(items);

      expect(result.subtotal).toBe(50.0);
      expect(result.totalCommission).toBe(15.0);
      expect(result.totalAmount).toBe(50.0);
      expect(result.itemsCount).toBe(1);
    });

    it('deve calcular totais de comanda com múltiplos itens', () => {
      const items = [
        { unitPrice: 50.0, quantity: 1, commissionPercentage: 30 },
        { unitPrice: 30.0, quantity: 2, commissionPercentage: 25 },
        { unitPrice: 40.0, quantity: 1, commissionPercentage: 35 },
      ];

      const result = calculateOrderTotals(items);

      expect(result.subtotal).toBe(150.0); // 50 + 60 + 40
      expect(result.totalCommission).toBe(44.0); // 15 + 15 + 14
      expect(result.totalAmount).toBe(150.0);
      expect(result.itemsCount).toBe(3);
    });

    it('deve retornar zero para comanda vazia', () => {
      const result = calculateOrderTotals([]);

      expect(result.subtotal).toBe(0);
      expect(result.totalCommission).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.itemsCount).toBe(0);
    });

    it('deve calcular corretamente com itens sem comissão', () => {
      const items = [
        { unitPrice: 50.0, quantity: 1, commissionPercentage: 0 },
        { unitPrice: 30.0, quantity: 1, commissionPercentage: 0 },
      ];

      const result = calculateOrderTotals(items);

      expect(result.subtotal).toBe(80.0);
      expect(result.totalCommission).toBe(0);
      expect(result.itemsCount).toBe(2);
    });

    it('deve lidar com valores null/undefined gracefully', () => {
      const items = [
        { unitPrice: 50.0, quantity: 1, commissionPercentage: null },
        { unitPrice: 30.0, quantity: 1, commissionPercentage: undefined },
      ];

      const result = calculateOrderTotals(items);

      expect(result.subtotal).toBe(80.0);
      expect(result.totalCommission).toBe(0); // Tratado como 0
    });
  });
});
