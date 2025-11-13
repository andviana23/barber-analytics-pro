/**
 * @fileoverview Testes do useFinancialKPIs hook
 * Testa chamadas ao financeiroService.getKPIs para período atual e anterior,
 * cálculo de trends corretamente (up/down/%)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFinancialKPIs } from '../useFinancialKPIs';
import { financeiroService } from '../../services/financeiroService';
import { DateHelpers } from '../../../tests/__fixtures__/financial';

// Mock do financeiroService
vi.mock('../../services/financeiroService', () => ({
  financeiroService: {
    getKPIs: vi.fn(),
  },
}));

// Mock do AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-123',
      email: 'test@test.com',
    },
  }),
}));

const mockFinanceiroService = financeiroService as {
  getKPIs: ReturnType<typeof vi.fn>;
};

// Helper para criar wrapper com QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useFinancialKPIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve carregar KPIs e calcular trends corretamente (crescimento)', async () => {
    // Arrange
    const unitId = 'unit-123';
    const currentPeriod = DateHelpers.currentMonth();
    const previousPeriod = DateHelpers.lastMonth();

    // Mock: Período atual melhor que anterior
    mockFinanceiroService.getKPIs
      .mockResolvedValueOnce({
        // Primeira chamada - período atual
        success: true,
        data: {
          current_period: {
            total_revenue: 5000,
            received_revenue: 4500,
            pending_revenue: 500,
            total_expense: 3000,
            net_profit: 2000,
          },
        },
      })
      .mockResolvedValueOnce({
        // Segunda chamada - período anterior
        success: true,
        data: {
          current_period: {
            total_revenue: 4000,
            received_revenue: 3800,
            pending_revenue: 200,
            total_expense: 2500,
            net_profit: 1500,
          },
        },
      });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs(unitId, currentPeriod),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      current: {
        total_revenue: 5000,
        received_revenue: 4500,
        pending_revenue: 500,
        total_expense: 3000,
        net_profit: 2000,
      },
      previous: {
        total_revenue: 4000,
        received_revenue: 3800,
        pending_revenue: 200,
        total_expense: 2500,
        net_profit: 1500,
      },
      trends: {
        revenue_growth: 25, // (5000 - 4000) / 4000 * 100
        revenue_direction: 'up',
        profit_growth: 33.33, // (2000 - 1500) / 1500 * 100
        profit_direction: 'up',
        expense_growth: 20, // (3000 - 2500) / 2500 * 100
        expense_direction: 'up',
      },
    });

    // Verificar que service foi chamado duas vezes
    expect(mockFinanceiroService.getKPIs).toHaveBeenCalledTimes(2);

    // Verificar que foi chamado com ambos os períodos (ordem não importa devido a Promise.all)
    expect(mockFinanceiroService.getKPIs).toHaveBeenCalledWith(
      unitId,
      currentPeriod
    );
    expect(mockFinanceiroService.getKPIs).toHaveBeenCalledWith(
      unitId,
      previousPeriod
    );
  });

  it('deve calcular trends de declínio corretamente', async () => {
    // Arrange - Período atual pior que anterior
    mockFinanceiroService.getKPIs
      .mockResolvedValueOnce({
        // Período atual
        success: true,
        data: {
          current_period: {
            total_revenue: 3000,
            net_profit: 800,
            total_expense: 2200,
          },
        },
      })
      .mockResolvedValueOnce({
        // Período anterior
        success: true,
        data: {
          current_period: {
            total_revenue: 4000,
            net_profit: 1500,
            total_expense: 2500,
          },
        },
      });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.trends).toEqual({
      revenue_growth: -25, // (3000 - 4000) / 4000 * 100
      revenue_direction: 'down',
      profit_growth: -46.67, // (800 - 1500) / 1500 * 100
      profit_direction: 'down',
      expense_growth: -12, // (2200 - 2500) / 2500 * 100
      expense_direction: 'down',
    });
  });

  it('deve calcular trends estáveis quando variação < 5%', async () => {
    // Arrange - Variação pequena
    mockFinanceiroService.getKPIs
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 1020,
            net_profit: 510,
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 1000,
            net_profit: 500,
          },
        },
      });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.trends.revenue_direction).toBe('stable'); // +2%
    expect(result.current.data.trends.profit_direction).toBe('stable'); // +2%
  });

  it('deve lidar com período anterior sem dados (base zero)', async () => {
    // Arrange
    mockFinanceiroService.getKPIs
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 1000,
            net_profit: 300,
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 0,
            net_profit: 0,
          },
        },
      });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Quando base é zero, crescimento é 100%
    expect(result.current.data.trends.revenue_growth).toBe(100);
    expect(result.current.data.trends.revenue_direction).toBe('up');
  });

  it('deve lidar com erro no service graciosamente', async () => {
    // Arrange
    mockFinanceiroService.getKPIs.mockResolvedValue({
      success: false,
      error: 'Erro de conexão',
    });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it('deve refetch quando unitId ou period mudam', async () => {
    // Arrange
    mockFinanceiroService.getKPIs.mockResolvedValue({
      success: true,
      data: {
        current_period: {
          total_revenue: 1000,
          net_profit: 300,
        },
      },
    });

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ unitId, period }) => useFinancialKPIs(unitId, period),
      {
        wrapper,
        initialProps: {
          unitId: 'unit-123',
          period: '2025-01',
        },
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.clearAllMocks();

    // Act - Mudar unitId
    rerender({ unitId: 'unit-456', period: '2025-01' });

    // Assert
    await waitFor(() => {
      expect(mockFinanceiroService.getKPIs).toHaveBeenCalledWith(
        'unit-456',
        '2025-01'
      );
    });
  });

  it('deve implementar cache - não refetch se dados não mudaram', async () => {
    // Arrange
    mockFinanceiroService.getKPIs.mockResolvedValue({
      success: true,
      data: {
        current_period: {
          total_revenue: 1000,
        },
      },
    });

    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      () => useFinancialKPIs('unit-123', '2025-01'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFinanceiroService.getKPIs).toHaveBeenCalledTimes(2); // Current + previous

    // Act - Re-render com mesmos parâmetros
    rerender();

    // Assert - Não deve chamar service novamente (cache)
    expect(mockFinanceiroService.getKPIs).toHaveBeenCalledTimes(2);
  });

  it('deve calcular métricas adicionais quando disponíveis', async () => {
    // Arrange
    mockFinanceiroService.getKPIs
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 5000,
            received_revenue: 4500,
            pending_revenue: 500,
            overdue_revenue: 200,
            total_expense: 3000,
            net_profit: 2000,
            profit_margin: 0.4, // 40%
          },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          current_period: {
            total_revenue: 4000,
            received_revenue: 3800,
            pending_revenue: 200,
            overdue_revenue: 100,
            total_expense: 2500,
            net_profit: 1500,
            profit_margin: 0.375, // 37.5%
          },
        },
      });

    // Act
    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
      { wrapper }
    );

    // Assert
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.current).toEqual(
      expect.objectContaining({
        overdue_revenue: 200,
        profit_margin: 0.4,
      })
    );

    expect(result.current.data.trends).toEqual(
      expect.objectContaining({
        margin_improvement: 2.5, // 40% - 37.5%
        overdue_change: 100, // 200 - 100
      })
    );
  });

  describe('Edge cases', () => {
    it('deve lidar com unitId undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFinancialKPIs(undefined as any, DateHelpers.currentMonth()),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFinanceiroService.getKPIs).not.toHaveBeenCalled();
    });

    it('deve lidar com period undefined', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFinancialKPIs('unit-123', undefined as any),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockFinanceiroService.getKPIs).not.toHaveBeenCalled();
    });

    it('deve retornar loading=true durante fetch inicial', () => {
      // Arrange - Promise pendente
      mockFinanceiroService.getKPIs.mockReturnValue(new Promise(() => {}));

      const wrapper = createWrapper();
      const { result } = renderHook(
        () => useFinancialKPIs('unit-123', DateHelpers.currentMonth()),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });
});
