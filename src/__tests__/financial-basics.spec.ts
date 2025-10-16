/**
 * @fileoverview Testes básicos do sistema financeiro
 * Validação de regras de negócio e formatação
 */

import { describe, it, expect } from 'vitest';

describe('Sistema Financeiro - Regras Básicas', () => {
  describe('Formatação de moeda', () => {
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    it('deve formatar valores positivos corretamente', () => {
      expect(formatCurrency(1500.50)).toMatch(/R\$\s*1\.500,50/);
      expect(formatCurrency(100)).toMatch(/R\$\s*100,00/);
      expect(formatCurrency(0.99)).toMatch(/R\$\s*0,99/);
    });

    it('deve formatar valores negativos corretamente', () => {
      expect(formatCurrency(-1500.50)).toMatch(/-R\$\s*1\.500,50/);
      expect(formatCurrency(-100)).toMatch(/-R\$\s*100,00/);
    });

    it('deve formatar zero corretamente', () => {
      expect(formatCurrency(0)).toMatch(/R\$\s*0,00/);
    });
  });

  describe('Validação de status', () => {
    type RevenueStatus = 'pending' | 'received' | 'cancelled';

    const isValidStatusTransition = (from: RevenueStatus, to: RevenueStatus): boolean => {
      const validTransitions: Record<RevenueStatus, RevenueStatus[]> = {
        'pending': ['received', 'cancelled'],
        'received': [],
        'cancelled': []
      };
      
      return validTransitions[from].includes(to);
    };

    it('deve permitir transições válidas de status', () => {
      expect(isValidStatusTransition('pending', 'received')).toBe(true);
      expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
    });

    it('deve rejeitar transições inválidas de status', () => {
      expect(isValidStatusTransition('received', 'pending')).toBe(false);
      expect(isValidStatusTransition('received', 'cancelled')).toBe(false);
      expect(isValidStatusTransition('cancelled', 'received')).toBe(false);
      expect(isValidStatusTransition('cancelled', 'pending')).toBe(false);
    });
  });

  describe('Cálculo de percentuais', () => {
    const calculatePercentage = (value: number, total: number): number => {
      if (total === 0) return 0;
      return (value / total) * 100;
    };

    it('deve calcular percentuais corretamente', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(33.33, 100)).toBeCloseTo(33.33, 2);
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 2);
    });

    it('deve lidar com total zero', () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });
  });

  describe('Validação de valores', () => {
    const isValidAmount = (value: any): boolean => {
      return typeof value === 'number' && 
             value > 0 && 
             isFinite(value) && 
             !isNaN(value);
    };

    it('deve validar valores válidos', () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(0.01)).toBe(true);
      expect(isValidAmount(999999.99)).toBe(true);
    });

    it('deve rejeitar valores inválidos', () => {
      expect(isValidAmount(0)).toBe(false);
      expect(isValidAmount(-10)).toBe(false);
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
      expect(isValidAmount('100')).toBe(false);
      expect(isValidAmount(null)).toBe(false);
      expect(isValidAmount(undefined)).toBe(false);
    });
  });

  describe('Utilitários de data', () => {
    const DateUtils = {
      formatDate: (date: Date): string => {
        return date.toLocaleDateString('pt-BR');
      },
      
      isToday: (date: Date): boolean => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
      },
      
      addDays: (date: Date, days: number): Date => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }
    };

    it('deve formatar datas corretamente', () => {
      const testDate = new Date(2025, 0, 15); // 15 de janeiro de 2025
      expect(DateUtils.formatDate(testDate)).toBe('15/01/2025');
    });

    it('deve detectar se é hoje', () => {
      const today = new Date();
      const yesterday = DateUtils.addDays(today, -1);
      
      expect(DateUtils.isToday(today)).toBe(true);
      expect(DateUtils.isToday(yesterday)).toBe(false);
    });

    it('deve adicionar dias corretamente', () => {
      const baseDate = new Date(2025, 0, 1); // 1 de janeiro de 2025
      const futureDate = DateUtils.addDays(baseDate, 10);
      
      expect(futureDate.getDate()).toBe(11);
      expect(futureDate.getMonth()).toBe(0);
      expect(futureDate.getFullYear()).toBe(2025);
    });
  });

  describe('Aggregação de dados', () => {
    interface RevenueItem {
      id: string;
      amount: number;
      status: 'pending' | 'received' | 'cancelled';
      category: string;
    }

    const sampleData: RevenueItem[] = [
      { id: '1', amount: 100, status: 'received', category: 'servicos' },
      { id: '2', amount: 200, status: 'received', category: 'produtos' },
      { id: '3', amount: 150, status: 'pending', category: 'servicos' },
      { id: '4', amount: 80, status: 'cancelled', category: 'servicos' },
    ];

    it('deve calcular total por status', () => {
      const totalReceived = sampleData
        .filter(item => item.status === 'received')
        .reduce((sum, item) => sum + item.amount, 0);

      const totalPending = sampleData
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + item.amount, 0);

      expect(totalReceived).toBe(300);
      expect(totalPending).toBe(150);
    });

    it('deve agrupar por categoria', () => {
      const byCategory = sampleData.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { count: 0, total: 0 };
        }
        acc[item.category].count += 1;
        acc[item.category].total += item.amount;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      expect(byCategory.servicos).toEqual({ count: 3, total: 330 });
      expect(byCategory.produtos).toEqual({ count: 1, total: 200 });
    });

    it('deve filtrar dados por critérios múltiplos', () => {
      const filtered = sampleData.filter(item => 
        item.status === 'received' && item.amount > 100
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });
  });

  describe('Performance com grandes datasets', () => {
    it('deve processar 10000 itens rapidamente', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        value: Math.random() * 1000,
        category: i % 2 === 0 ? 'A' : 'B'
      }));

      const startTime = performance.now();
      
      // Operações que devem ser rápidas
      const total = largeDataset.reduce((sum, item) => sum + item.value, 0);
      const categoryA = largeDataset.filter(item => item.category === 'A');
      const average = total / largeDataset.length;
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Asserts de performance
      expect(processingTime).toBeLessThan(50); // Menos de 50ms
      expect(total).toBeGreaterThan(0);
      expect(categoryA.length).toBe(5000);
      expect(average).toBeGreaterThan(0);
    });
  });

  describe('Casos extremos', () => {
    it('deve lidar com arrays vazios', () => {
      const emptyArray: any[] = [];
      
      const sum = emptyArray.reduce((acc, item) => acc + item.value, 0);
      const filtered = emptyArray.filter(item => item.status === 'active');
      
      expect(sum).toBe(0);
      expect(filtered).toHaveLength(0);
    });

    it('deve lidar com valores muito grandes', () => {
      const largeValue = 999999999.99;
      
      expect(typeof largeValue).toBe('number');
      expect(isFinite(largeValue)).toBe(true);
      expect(largeValue > 0).toBe(true);
    });

    it('deve lidar com precisão decimal', () => {
      const result = 0.1 + 0.2;
      
      // Floating point precision issue
      expect(result).not.toBe(0.3);
      expect(result).toBeCloseTo(0.3, 10);
      
      // Solução: arredondar para 2 casas decimais
      const rounded = Math.round(result * 100) / 100;
      expect(rounded).toBe(0.3);
    });
  });
});