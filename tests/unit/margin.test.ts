/**
 * @file margin.test.ts
 * @description Testes unitários para cálculo de margem de lucro
 * @author Andrey Viana
 * @date 2025-11-10
 */

import { describe, it, expect } from 'vitest';
import { calculateMargin } from '../../lib/analytics/calculations';

describe('calculateMargin', () => {
  describe('Margem positiva', () => {
    it('deve calcular margem corretamente para receita > despesas', () => {
      const grossRevenue = 10000;
      const totalExpenses = 6000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(40); // (10000 - 6000) / 10000 * 100 = 40%
    });

    it('deve calcular margem corretamente para valores decimais', () => {
      const grossRevenue = 1234.56;
      const totalExpenses = 789.01;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBeCloseTo(36.08, 2); // ~36.08%
    });

    it('deve calcular margem baixa corretamente', () => {
      const grossRevenue = 1000;
      const totalExpenses = 950;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(5); // 5%
    });
  });

  describe('Margem negativa (prejuízo)', () => {
    it('deve retornar margem negativa quando despesas > receitas', () => {
      const grossRevenue = 5000;
      const totalExpenses = 7000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(-40); // (5000 - 7000) / 5000 * 100 = -40%
    });

    it('deve limitar margem negativa em -100%', () => {
      const grossRevenue = 1000;
      const totalExpenses = 3000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      // Função limita margem entre -100% e 100%
      expect(result).toBe(-100); // Limitado em -100%
    });
  });

  describe('Margem zero', () => {
    it('deve retornar 0 quando receita = despesas', () => {
      const grossRevenue = 5000;
      const totalExpenses = 5000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(0);
    });

    it('deve retornar 0 quando receita é zero', () => {
      const grossRevenue = 0;
      const totalExpenses = 0;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(0);
    });
  });

  describe('Casos extremos', () => {
    it('deve retornar 100% quando não há despesas', () => {
      const grossRevenue = 10000;
      const totalExpenses = 0;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(100);
    });

    it('deve retornar 0 quando receita é zero mas há despesas', () => {
      const grossRevenue = 0;
      const totalExpenses = 1000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      // Função retorna 0 quando receita <= 0
      expect(result).toBe(0);
    });

    it('deve lidar com valores muito grandes', () => {
      const grossRevenue = 1_000_000;
      const totalExpenses = 750_000;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(25);
    });

    it('deve lidar com valores muito pequenos', () => {
      const grossRevenue = 0.5;
      const totalExpenses = 0.3;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBe(40);
    });
  });

  describe('Validação de tipos', () => {
    it('deve retornar número válido para inputs válidos', () => {
      const result = calculateMargin(100, 50);

      expect(typeof result).toBe('number');
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  describe('Casos reais do negócio', () => {
    it('deve calcular margem para unidade Mangabeiras (exemplo real)', () => {
      // Exemplo: Mangabeiras em novembro/2024
      const grossRevenue = 48_500; // R$ 48.500
      const totalExpenses = 33_950; // R$ 33.950

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBeCloseTo(30, 0); // ~30% de margem
    });

    it('deve calcular margem para unidade Nova Lima (exemplo real)', () => {
      // Exemplo: Nova Lima em novembro/2024
      const grossRevenue = 35_200;
      const totalExpenses = 24_640;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBeCloseTo(30, 0); // ~30% de margem
    });

    it('deve identificar margem baixa (<20%)', () => {
      const grossRevenue = 10_000;
      const totalExpenses = 8_500;

      const result = calculateMargin(grossRevenue, totalExpenses);

      expect(result).toBeLessThan(20);
      expect(result).toBe(15);
    });
  });
});
