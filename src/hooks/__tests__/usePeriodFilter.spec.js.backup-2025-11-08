import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import usePeriodFilter from '../usePeriodFilter';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

describe('usePeriodFilter', () => {
  describe('Inicialização', () => {
    it('deve inicializar com período "week" por padrão', () => {
      const { result } = renderHook(() => usePeriodFilter());

      expect(result.current.selectedPeriod).toBe('week');
      expect(result.current.selectedDate).toBeInstanceOf(Date);
    });

    it('deve aceitar período inicial customizado', () => {
      const { result } = renderHook(() => usePeriodFilter('month'));

      expect(result.current.selectedPeriod).toBe('month');
    });

    it('deve aceitar data inicial customizada', () => {
      const customDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('day', customDate));

      const resultDate = format(result.current.selectedDate, 'yyyy-MM-dd');
      expect(resultDate).toBe('2025-10-15');
    });
  });

  describe('Cálculo de intervalo - Dia', () => {
    it('deve calcular intervalo correto para um dia', () => {
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('day', testDate));

      expect(result.current.dateRange.startDate).toBe('2025-10-15');
      expect(result.current.dateRange.endDate).toBe('2025-10-15');
    });
  });

  describe('Cálculo de intervalo - Semana', () => {
    it('deve calcular semana de segunda a domingo (semana normal)', () => {
      // 15/10/2025 é uma quarta-feira
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      // Segunda: 13/10, Domingo: 19/10
      expect(result.current.dateRange.startDate).toBe('2025-10-13');
      expect(result.current.dateRange.endDate).toBe('2025-10-19');
    });

    it('deve calcular semana quando data é segunda-feira', () => {
      // 13/10/2025 é segunda-feira
      const testDate = new Date('2025-10-13T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      expect(result.current.dateRange.startDate).toBe('2025-10-13');
      expect(result.current.dateRange.endDate).toBe('2025-10-19');
    });

    it('deve calcular semana quando data é domingo', () => {
      // 19/10/2025 é domingo
      const testDate = new Date('2025-10-19T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      expect(result.current.dateRange.startDate).toBe('2025-10-13');
      expect(result.current.dateRange.endDate).toBe('2025-10-19');
    });
  });

  describe('Cálculo de intervalo - Mês', () => {
    it('deve calcular mês completo (dia 01 até último dia)', () => {
      const testDate = new Date('2025-10-15');
      const { result } = renderHook(() => usePeriodFilter('month', testDate));

      expect(result.current.dateRange.startDate).toBe('2025-10-01');
      expect(result.current.dateRange.endDate).toBe('2025-10-31');
    });

    it('deve calcular fevereiro corretamente (28 dias em ano não bissexto)', () => {
      const testDate = new Date('2025-02-15');
      const { result } = renderHook(() => usePeriodFilter('month', testDate));

      expect(result.current.dateRange.startDate).toBe('2025-02-01');
      expect(result.current.dateRange.endDate).toBe('2025-02-28');
    });

    it('deve calcular fevereiro em ano bissexto (29 dias)', () => {
      const testDate = new Date('2024-02-15');
      const { result } = renderHook(() => usePeriodFilter('month', testDate));

      expect(result.current.dateRange.startDate).toBe('2024-02-01');
      expect(result.current.dateRange.endDate).toBe('2024-02-29');
    });
  });

  describe('Mudança de período', () => {
    it('deve alterar período de "week" para "day"', () => {
      const { result } = renderHook(() => usePeriodFilter('week'));

      act(() => {
        result.current.handlePeriodChange('day');
      });

      expect(result.current.selectedPeriod).toBe('day');
    });

    it('deve recalcular intervalo ao mudar período', () => {
      const testDate = new Date('2025-10-15');
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      // Semana: 13/10 a 19/10
      expect(result.current.dateRange.startDate).toBe('2025-10-13');
      expect(result.current.dateRange.endDate).toBe('2025-10-19');

      act(() => {
        result.current.handlePeriodChange('month');
      });

      // Mês: 01/10 a 31/10
      expect(result.current.dateRange.startDate).toBe('2025-10-01');
      expect(result.current.dateRange.endDate).toBe('2025-10-31');
    });
  });

  describe('Navegação de períodos', () => {
    it('deve navegar para o dia anterior (modo day)', () => {
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('day', testDate));

      act(() => {
        result.current.goToPreviousPeriod();
      });

      expect(format(result.current.selectedDate, 'yyyy-MM-dd')).toBe(
        '2025-10-14'
      );
    });

    it('deve navegar para a semana anterior (modo week)', () => {
      const testDate = new Date('2025-10-15T12:00:00'); // Quarta
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      // Semana atual: 13/10 a 19/10
      expect(result.current.dateRange.startDate).toBe('2025-10-13');

      act(() => {
        result.current.goToPreviousPeriod();
      });

      // Semana anterior: 06/10 a 12/10
      expect(result.current.dateRange.startDate).toBe('2025-10-06');
      expect(result.current.dateRange.endDate).toBe('2025-10-12');
    });

    it('deve navegar para o mês anterior (modo month)', () => {
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('month', testDate));

      act(() => {
        result.current.goToPreviousPeriod();
      });

      // Setembro: 01/09 a 30/09
      expect(result.current.dateRange.startDate).toBe('2025-09-01');
      expect(result.current.dateRange.endDate).toBe('2025-09-30');
    });

    it('deve navegar para o próximo período', () => {
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('day', testDate));

      act(() => {
        result.current.goToNextPeriod();
      });

      expect(format(result.current.selectedDate, 'yyyy-MM-dd')).toBe(
        '2025-10-16'
      );
    });
  });

  describe('Reset para hoje', () => {
    it('deve resetar para a data atual', () => {
      const pastDate = new Date('2025-01-01');
      const { result } = renderHook(() => usePeriodFilter('week', pastDate));

      act(() => {
        result.current.resetToToday();
      });

      const today = new Date();
      const selectedDateFormatted = format(
        result.current.selectedDate,
        'yyyy-MM-dd'
      );
      const todayFormatted = format(today, 'yyyy-MM-dd');

      expect(selectedDateFormatted).toBe(todayFormatted);
    });
  });

  describe('Verificação de período atual', () => {
    it('deve identificar quando está no período atual (dia)', () => {
      const today = new Date();
      const { result } = renderHook(() => usePeriodFilter('day', today));

      expect(result.current.isCurrentPeriod).toBe(true);
    });

    it('deve identificar quando NÃO está no período atual', () => {
      const pastDate = new Date('2025-01-01');
      const { result } = renderHook(() => usePeriodFilter('day', pastDate));

      expect(result.current.isCurrentPeriod).toBe(false);
    });

    it('deve identificar período atual para semana vigente', () => {
      const today = new Date();
      const { result } = renderHook(() => usePeriodFilter('week', today));

      expect(result.current.isCurrentPeriod).toBe(true);
    });
  });

  describe('Descrição do período', () => {
    it('deve gerar descrição correta para dia', () => {
      const testDate = new Date('2025-10-15T12:00:00');
      const { result } = renderHook(() => usePeriodFilter('day', testDate));

      expect(result.current.periodDescription).toBe('15 de outubro de 2025');
    });

    it('deve gerar descrição correta para semana (mesmo mês)', () => {
      const testDate = new Date('2025-10-15');
      const { result } = renderHook(() => usePeriodFilter('week', testDate));

      expect(result.current.periodDescription).toBe(
        '13 a 19 de outubro de 2025'
      );
    });

    it('deve gerar descrição correta para mês', () => {
      const testDate = new Date('2025-10-15');
      const { result } = renderHook(() => usePeriodFilter('month', testDate));

      expect(result.current.periodDescription).toBe('outubro de 2025');
    });
  });
});
