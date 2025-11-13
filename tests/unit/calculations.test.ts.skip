/**
 * @fileoverview Testes Unitários - Cálculos de KPIs e Forecast
 * @module tests/unit/calculations.test
 * @description Testes para funções de cálculo de KPIs, saldo acumulado e forecast
 *
 * Comando: pnpm test tests/unit/calculations.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAverageTicket,
  calculateMargin,
  calculateAccumulatedBalance,
  forecastCashflow,
} from '../../lib/analytics/calculations';
import {
  calculateAccumulatedBalanceFromData,
  validateAccumulatedBalance,
} from '../../lib/analytics/cashflowForecast';

describe('Cálculos de KPIs', () => {
  describe('calculateAverageTicket', () => {
    it('deve calcular ticket médio corretamente', () => {
      const result = calculateAverageTicket(15000, 100);
      expect(result).toBe(150);
    });

    it('deve retornar 0 quando não há transações', () => {
      const result = calculateAverageTicket(15000, 0);
      expect(result).toBe(0);
    });

    it('deve calcular com valores decimais', () => {
      const result = calculateAverageTicket(15250.50, 100);
      expect(result).toBeCloseTo(152.505, 2);
    });
  });

  describe('calculateMargin', () => {
    it('deve calcular margem percentual corretamente', () => {
      const result = calculateMargin(10000, 3000);
      expect(result).toBe(70);
    });

    it('deve retornar 0 quando receita é 0', () => {
      const result = calculateMargin(0, 3000);
      expect(result).toBe(0);
    });

    it('deve calcular margem negativa quando despesas superam receitas', () => {
      const result = calculateMargin(10000, 15000);
      expect(result).toBe(-50);
    });

    it('deve limitar margem entre -100% e 100%', () => {
      const result1 = calculateMargin(1000, 3000);
      expect(result1).toBeGreaterThanOrEqual(-100);

      const result2 = calculateMargin(1000, -500);
      expect(result2).toBeLessThanOrEqual(100);
    });
  });
});

describe('Cálculo de Saldo Acumulado', () => {
  describe('calculateAccumulatedBalance', () => {
    it('deve calcular saldo acumulado simples sem agrupamento', () => {
      const data = [
        { date: new Date('2025-11-01'), entradas: 1000, saidas: 500 },
        { date: new Date('2025-11-02'), entradas: 1200, saidas: 600 },
        { date: new Date('2025-11-03'), entradas: 800, saidas: 400 },
      ];

      const result = calculateAccumulatedBalance(data);

      expect(result).toHaveLength(3);
      expect(result[0].saldo_dia).toBe(500);
      expect(result[0].saldo_acumulado).toBe(500);
      expect(result[1].saldo_dia).toBe(600);
      expect(result[1].saldo_acumulado).toBe(1100);
      expect(result[2].saldo_dia).toBe(400);
      expect(result[2].saldo_acumulado).toBe(1500);
    });

    it('deve calcular saldo acumulado com agrupamento por unit_id', () => {
      const data = [
        { date: new Date('2025-11-01'), unit_id: 'unit-1', entradas: 1000, saidas: 500 },
        { date: new Date('2025-11-02'), unit_id: 'unit-1', entradas: 1200, saidas: 600 },
        { date: new Date('2025-11-01'), unit_id: 'unit-2', entradas: 2000, saidas: 1000 },
        { date: new Date('2025-11-02'), unit_id: 'unit-2', entradas: 1500, saidas: 750 },
      ];

      const result = calculateAccumulatedBalance(data, 'unit_id');

      expect(result).toHaveLength(4);

      // Verificar unit-1
      const unit1Results = result.filter(r => r.unit_id === 'unit-1');
      expect(unit1Results[0].saldo_acumulado).toBe(500);
      expect(unit1Results[1].saldo_acumulado).toBe(1100);

      // Verificar unit-2
      const unit2Results = result.filter(r => r.unit_id === 'unit-2');
      expect(unit2Results[0].saldo_acumulado).toBe(1000);
      expect(unit2Results[1].saldo_acumulado).toBe(1750);
    });

    it('deve ordenar por data corretamente', () => {
      const data = [
        { date: new Date('2025-11-03'), entradas: 800, saidas: 400 },
        { date: new Date('2025-11-01'), entradas: 1000, saidas: 500 },
        { date: new Date('2025-11-02'), entradas: 1200, saidas: 600 },
      ];

      const result = calculateAccumulatedBalance(data);

      expect(result[0].date).toEqual(new Date('2025-11-01'));
      expect(result[1].date).toEqual(new Date('2025-11-02'));
      expect(result[2].date).toEqual(new Date('2025-11-03'));
    });

    it('deve retornar array vazio quando não há dados', () => {
      const result = calculateAccumulatedBalance([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateAccumulatedBalanceFromData', () => {
    it('deve calcular saldo acumulado a partir de dados de fluxo', () => {
      const data = [
        { date: '2025-11-01', entradas: 1000, saidas: 500, unit_id: 'unit-1' },
        { date: '2025-11-02', entradas: 1200, saidas: 600, unit_id: 'unit-1' },
      ];

      const result = calculateAccumulatedBalanceFromData(data, 'unit_id');

      expect(result).toHaveLength(2);
      expect(result[0].saldo_acumulado).toBe(500);
      expect(result[1].saldo_acumulado).toBe(1100);
    });
  });
});

describe('Forecast de Fluxo de Caixa', () => {
  describe('forecastCashflow', () => {
    it('deve gerar forecast para 30 dias com dados suficientes', () => {
      // Criar 30 dias de dados históricos
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2025, 10, i + 1), // Novembro 2025
        balance: 10000 + (i * 100), // Tendência crescente
      }));

      const result = forecastCashflow(history, 30);

      expect(result).toHaveLength(30);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('forecasted_balance');
      expect(result[0]).toHaveProperty('confidence_interval');
      expect(result[0]).toHaveProperty('trend');
      expect(result[0].confidence_interval).toHaveProperty('lower');
      expect(result[0].confidence_interval).toHaveProperty('upper');
    });

    it('deve usar último valor quando dados insuficientes (< 30 dias)', () => {
      const history = [
        { date: new Date('2025-11-01'), balance: 10000 },
        { date: new Date('2025-11-02'), balance: 10500 },
      ];

      const result = forecastCashflow(history, 30);

      expect(result).toHaveLength(30);
      // Todos devem ter o último valor conhecido (com tolerância)
      expect(result[0].forecasted_balance).toBeCloseTo(10500, -2);
    });

    it('deve calcular intervalo de confiança corretamente', () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2025, 10, i + 1),
        balance: 10000 + (i * 50), // Tendência estável
      }));

      const result = forecastCashflow(history, 7);

      result.forEach(forecast => {
        expect(forecast.confidence_interval.lower).toBeLessThan(forecast.forecasted_balance);
        expect(forecast.confidence_interval.upper).toBeGreaterThan(forecast.forecasted_balance);
      });
    });

    it('deve identificar tendência crescente', () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2025, 10, i + 1),
        balance: 10000 + (i * 200), // Crescimento significativo
      }));

      const result = forecastCashflow(history, 7);

      // Pelo menos alguns forecasts devem ter tendência 'up'
      const hasUpTrend = result.some(f => f.trend === 'up');
      expect(hasUpTrend || result[0].trend === 'up').toBeTruthy();
    });

    it('deve identificar tendência decrescente', () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2025, 10, i + 1),
        balance: 20000 - (i * 200), // Decréscimo significativo
      }));

      const result = forecastCashflow(history, 7);

      // Pelo menos alguns forecasts devem ter tendência 'down'
      const hasDownTrend = result.some(f => f.trend === 'down');
      expect(hasDownTrend || result[0].trend === 'down').toBeTruthy();
    });
  });
});

describe('Validação de Saldo Acumulado', () => {
  // Mock da função fetchHistoricalCashflow para testes
  // Em testes reais, isso seria mockado
  it('deve validar estrutura de dados', () => {
    const testData = [
      { date: '2025-11-01', entradas: 1000, saidas: 500, unit_id: 'unit-1' },
      { date: '2025-11-02', entradas: 1200, saidas: 600, unit_id: 'unit-1' },
    ];

    const result = calculateAccumulatedBalanceFromData(testData, 'unit_id');

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('saldo_dia');
    expect(result[0]).toHaveProperty('saldo_acumulado');
    expect(result[0].saldo_dia).toBe(500);
    expect(result[0].saldo_acumulado).toBe(500);
  });
});

