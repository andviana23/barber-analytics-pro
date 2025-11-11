/**
 * @fileoverview useHealthKPIs Hook
 * @module hooks/useHealthKPIs
 * @description Hook para buscar KPIs de saúde financeira usando TanStack Query
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.1.2
 */

'use client';

import { useQuery } from '@tanstack/react-query';

export interface HealthKPIsParams {
  unitId: string;
  startDate?: Date | string;
  endDate?: Date | string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

export interface HealthKPIsData {
  grossRevenue: number;
  totalExpenses: number;
  marginPercentage: number;
  averageTicket: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    createdAt: string;
  }>;
  period: {
    startDate: string;
    endDate: string;
    granularity: string;
  };
}

/**
 * Hook para buscar KPIs de saúde financeira
 *
 * @param params - Parâmetros da query
 * @returns Dados dos KPIs, loading state e error
 */
export function useHealthKPIs(params: HealthKPIsParams) {
  const { unitId, startDate, endDate, granularity = 'daily' } = params;

  return useQuery<HealthKPIsData>({
    queryKey: ['health-kpis', unitId, startDate, endDate, granularity],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        unitId,
        granularity,
      });

      if (startDate) {
        searchParams.append(
          'startDate',
          startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate
        );
      }

      if (endDate) {
        searchParams.append(
          'endDate',
          endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate
        );
      }

      const response = await fetch(`/api/kpis/health?${searchParams.toString()}`, {
        credentials: 'include', // Inclui cookies para autenticação
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health KPIs: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch health KPIs');
      }

      return {
        grossRevenue: data.grossRevenue,
        totalExpenses: data.totalExpenses,
        marginPercentage: data.marginPercentage,
        averageTicket: data.averageTicket,
        trend: data.trend,
        alerts: data.alerts || [],
        period: data.period,
      };
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antigo cacheTime)
  });
}

