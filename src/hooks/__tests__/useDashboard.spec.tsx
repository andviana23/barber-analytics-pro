/**
 * @fileoverview Testes dos hooks de dashboard
 * Testa KPIs financeiros e distribuição de receitas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRevenueDistribution } from '../useDashboard';
import { FinancialFixtures } from '@tests/__fixtures__/financial';

// Mock do dashboardService usando vi.hoisted
const mockDashboardService = vi.hoisted(() => ({
  getRevenueDistribution: vi.fn(),
  getFinancialKPIs: vi.fn(),
}));

vi.mock('../../services/dashboardService', () => ({
  default: mockDashboardService,
  dashboardService: mockDashboardService,
}));

// Mock do AuthContext
let mockAuth = {
  user: {
    id: 'user-123',
    user_metadata: { role: 'admin' },
  },
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

describe('useRevenueDistribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar com loading=true e dados vazios', () => {
    // Arrange
    const unitId = 'unit-123';

    // Act
    const { result } = renderHook(() => useRevenueDistribution(unitId));

    // Assert
    expect(result.current.loading).toBe(true);
    expect(result.current.distribution).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('deve carregar distribuição de receitas com sucesso', async () => {
    // Arrange
    const mockDistribution = [
      { category: 'Cortes', value: 1500, label: 'Serviços de Corte' },
      { category: 'Produtos', value: 800, label: 'Venda de Produtos' },
      { category: 'Outros', value: 200, label: 'Outros Serviços' },
    ];

    mockDashboardService.getRevenueDistribution.mockResolvedValue(
      mockDistribution
    );

    // Act
    const { result } = renderHook(() => useRevenueDistribution('unit-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    // Verificar se percentuais foram calculados
    const expectedTotal = 1500 + 800 + 200; // 2500
    expect(result.current.distribution).toHaveLength(3);
    expect(result.current.distribution[0]).toEqual({
      category: 'Cortes',
      value: 1500,
      label: 'Serviços de Corte',
      percentage: (1500 / expectedTotal) * 100, // 60%
    });
    expect(result.current.distribution[1]).toEqual({
      category: 'Produtos',
      value: 800,
      label: 'Venda de Produtos',
      percentage: (800 / expectedTotal) * 100, // 32%
    });
  });

  it('deve lidar com erro do service', async () => {
    // Arrange
    const errorMessage = 'Erro ao buscar dados';
    mockDashboardService.getRevenueDistribution.mockRejectedValue(
      new Error(errorMessage)
    );

    // Act
    const { result } = renderHook(() => useRevenueDistribution('unit-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.distribution).toEqual([]);
  });

  it('deve calcular percentuais corretamente quando total = 0', async () => {
    // Arrange
    const mockDistribution = [
      { category: 'Cortes', value: 0, label: 'Serviços de Corte' },
      { category: 'Produtos', value: 0, label: 'Venda de Produtos' },
    ];

    mockDashboardService.getRevenueDistribution.mockResolvedValue(
      mockDistribution
    );

    // Act
    const { result } = renderHook(() => useRevenueDistribution('unit-123'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(result.current.distribution).toHaveLength(2);
    expect(result.current.distribution[0].percentage).toBe(0);
    expect(result.current.distribution[1].percentage).toBe(0);
  });

  it('deve recarregar dados quando unitId mudar', async () => {
    // Arrange
    mockDashboardService.getRevenueDistribution.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ unitId }) => useRevenueDistribution(unitId),
      { initialProps: { unitId: 'unit-123' } }
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockDashboardService.getRevenueDistribution).toHaveBeenCalledTimes(
      1
    );
    expect(mockDashboardService.getRevenueDistribution).toHaveBeenCalledWith(
      'unit-123'
    );

    // Act - Mudar unitId
    rerender({ unitId: 'unit-456' });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockDashboardService.getRevenueDistribution).toHaveBeenCalledTimes(
      2
    );
    expect(
      mockDashboardService.getRevenueDistribution
    ).toHaveBeenLastCalledWith('unit-456');
  });

  it('deve funcionar com unitId null (todas as unidades)', async () => {
    // Arrange
    const mockDistribution = [
      { category: 'Total', value: 5000, label: 'Todas as Unidades' },
    ];

    mockDashboardService.getRevenueDistribution.mockResolvedValue(
      mockDistribution
    );

    // Act
    const { result } = renderHook(() => useRevenueDistribution());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Assert
    expect(mockDashboardService.getRevenueDistribution).toHaveBeenCalledWith(
      null
    );
    expect(result.current.distribution).toHaveLength(1);
    expect(result.current.distribution[0].percentage).toBe(100);
  });

  it('não deve carregar dados se não houver usuário autenticado', () => {
    // Arrange - Mock sem usuário
    mockAuth.user = null as any;

    // Act
    const { result } = renderHook(() => useRevenueDistribution('unit-123'));

    // Assert
    expect(result.current.loading).toBe(true);
    expect(mockDashboardService.getRevenueDistribution).not.toHaveBeenCalled();
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      // Restaurar usuário para outros testes
      mockAuth.user = {
        id: 'user-123',
        user_metadata: { role: 'admin' },
      };
    });

    it('deve lidar com array vazio do service', async () => {
      mockDashboardService.getRevenueDistribution.mockResolvedValue([]);

      const { result } = renderHook(() => useRevenueDistribution('unit-123'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.distribution).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com valores decimais na distribuição', async () => {
      const mockDistribution = [
        { category: 'A', value: 33.33, label: 'Categoria A' },
        { category: 'B', value: 33.33, label: 'Categoria B' },
        { category: 'C', value: 33.34, label: 'Categoria C' },
      ];

      mockDashboardService.getRevenueDistribution.mockResolvedValue(
        mockDistribution
      );

      const { result } = renderHook(() => useRevenueDistribution('unit-123'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const total = 33.33 + 33.33 + 33.34;
      expect(result.current.distribution[0].percentage).toBeCloseTo(
        (33.33 / total) * 100,
        2
      );
    });

    it('deve lidar com dados malformados', async () => {
      const mockDistribution = [
        { category: 'A', value: null, label: 'Categoria A' },
        { category: 'B', value: undefined, label: 'Categoria B' },
        { category: 'C', value: 'invalid', label: 'Categoria C' },
      ];

      mockDashboardService.getRevenueDistribution.mockResolvedValue(
        mockDistribution
      );

      const { result } = renderHook(() => useRevenueDistribution('unit-123'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Deve tratar valores inválidos como 0
      expect(result.current.distribution).toHaveLength(3);
      expect(result.current.distribution[0].percentage).toBe(0);
      expect(result.current.distribution[1].percentage).toBe(0);
      expect(result.current.distribution[2].percentage).toBe(0);
    });
  });
});
