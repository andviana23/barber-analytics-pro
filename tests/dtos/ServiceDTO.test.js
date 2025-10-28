/**
 * @file ServiceDTO.test.js
 * @description Testes unitários para ServiceDTO
 * @module Tests/DTOs/Service
 * @author Andrey Viana
 * @date 2025-01-24
 */

import { describe, it, expect } from 'vitest';
import {
  validateCreateService,
  validateUpdateService,
  calculateCommission,
} from '../../src/dtos/ServiceDTO';

describe('ServiceDTO', () => {
  describe('validateCreateService', () => {
    describe('Validações de sucesso', () => {
      it('deve aceitar dados válidos completos', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Corte de Cabelo',
          durationMinutes: 30,
          price: 50.0,
          commissionPercentage: 30,
          active: true,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('deve aceitar nome com 3 caracteres (mínimo)', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Spa',
          durationMinutes: 60,
          price: 100.0,
          commissionPercentage: 25,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
      });

      it('deve aceitar comissão de 0%', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço Especial',
          durationMinutes: 45,
          price: 75.0,
          commissionPercentage: 0,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
        expect(result.data.commissionPercentage).toBe(0);
      });

      it('deve aceitar comissão de 100%', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço Especial',
          durationMinutes: 45,
          price: 75.0,
          commissionPercentage: 100,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
        expect(result.data.commissionPercentage).toBe(100);
      });

      it('deve ter active=true como padrão', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Corte Simples',
          durationMinutes: 20,
          price: 30.0,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
        expect(result.data.active).toBe(true);
      });

      it('deve ter commissionPercentage=0 como padrão', () => {
        const validData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Corte Simples',
          durationMinutes: 20,
          price: 30.0,
        };

        const result = validateCreateService(validData);

        expect(result.success).toBe(true);
        expect(result.data.commissionPercentage).toBe(0);
      });
    });

    describe('Validações de falha', () => {
      it('deve rejeitar nome muito curto (< 3 caracteres)', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'AB',
          durationMinutes: 30,
          price: 50.0,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('mínimo 3');
      });

      it('deve rejeitar nome muito longo (> 100 caracteres)', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'a'.repeat(101),
          durationMinutes: 30,
          price: 50.0,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('100');
      });

      it('deve rejeitar preço zero', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço',
          durationMinutes: 30,
          price: 0,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('maior que zero');
      });

      it('deve rejeitar preço negativo', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço',
          durationMinutes: 30,
          price: -10,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar comissão negativa', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço',
          durationMinutes: 30,
          price: 50.0,
          commissionPercentage: -5,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('negativa');
      });

      it('deve rejeitar comissão maior que 100%', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço',
          durationMinutes: 30,
          price: 50.0,
          commissionPercentage: 101,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('100');
      });

      it('deve rejeitar duração negativa', () => {
        const invalidData = {
          unitId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Serviço',
          durationMinutes: -10,
          price: 50.0,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('deve rejeitar sem unitId', () => {
        const invalidData = {
          name: 'Serviço',
          durationMinutes: 30,
          price: 50.0,
        };

        const result = validateCreateService(invalidData);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateUpdateService', () => {
    it('deve aceitar atualização parcial de um campo', () => {
      const validData = {
        price: 60.0,
      };

      const result = validateUpdateService(validData);

      expect(result.success).toBe(true);
      expect(result.data.price).toBe(60.0);
    });

    it('deve aceitar múltiplos campos para atualização', () => {
      const validData = {
        name: 'Novo nome',
        price: 80.0,
        commissionPercentage: 35,
      };

      const result = validateUpdateService(validData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Novo nome');
      expect(result.data.price).toBe(80.0);
      expect(result.data.commissionPercentage).toBe(35);
    });

    it('deve rejeitar objeto vazio', () => {
      const invalidData = {};

      const result = validateUpdateService(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pelo menos um campo');
    });

    it('deve rejeitar valores inválidos mesmo em update', () => {
      const invalidData = {
        price: -50,
      };

      const result = validateUpdateService(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('maior que zero');
    });
  });

  describe('calculateCommission', () => {
    it('deve calcular comissão corretamente', () => {
      const commission = calculateCommission(100, 30);

      expect(commission).toBe(30); // 100 * 30% = 30
    });

    it('deve calcular comissão de 0%', () => {
      const commission = calculateCommission(100, 0);

      expect(commission).toBe(0);
    });

    it('deve calcular comissão de 100%', () => {
      const commission = calculateCommission(50, 100);

      expect(commission).toBe(50);
    });

    it('deve calcular com quantidade', () => {
      const commission = calculateCommission(50, 30, 2);

      expect(commission).toBe(30); // 50 * 2 * 30% = 30
    });

    it('deve retornar 0 para preço zero', () => {
      const commission = calculateCommission(0, 30);

      expect(commission).toBe(0);
    });

    it('deve retornar 0 para quantidade zero', () => {
      const commission = calculateCommission(50, 30, 0);

      expect(commission).toBe(0);
    });

    it('deve retornar 0 para comissão negativa', () => {
      const commission = calculateCommission(50, -10);

      expect(commission).toBe(0);
    });

    it('deve lidar com valores decimais', () => {
      const commission = calculateCommission(75.5, 25);

      expect(commission).toBe(18.875); // 75.50 * 25% = 18.875
    });
  });
});
