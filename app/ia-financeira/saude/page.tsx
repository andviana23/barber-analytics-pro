/**
 * @fileoverview Dashboard de Saúde Financeira
 * @module app/ia-financeira/saude/page
 * @description Página de dashboard com KPIs de saúde financeira
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.1
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, AlertTriangle, ShoppingCart } from 'lucide-react';
import { KPICard } from '../../../components/molecules/KPICard';
import { TrendChart } from '../../../components/molecules/TrendChart';
import { useHealthKPIs } from '../../../hooks/useHealthKPIs';

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata percentual
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Página: Dashboard de Saúde Financeira
 */
export default function SaudeFinanceiraPage() {
  // TODO: Obter unitId do contexto ou query params
  const [unitId, setUnitId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Calcular datas padrão (últimos 30 dias)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  // Buscar KPIs de saúde
  const {
    data: kpisData,
    isLoading,
    error,
  } = useHealthKPIs({
    unitId: unitId || '',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    granularity: period,
  });

  // Buscar dados históricos para gráficos
  const { data: historicalData } = useQuery({
    queryKey: ['health-kpis-historical', unitId, startDate, endDate],
    queryFn: async () => {
      if (!unitId) return [];

      const response = await fetch(
        `/api/kpis/health?unitId=${unitId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&granularity=daily`,
        { credentials: 'include' }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.historicalData || [];
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar alertas recentes
  const { data: alertsData } = useQuery({
    queryKey: ['health-alerts', unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const response = await fetch(`/api/alerts/query?unitId=${unitId}&status=OPEN&limit=10`, {
        credentials: 'include',
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.alerts || [];
    },
    enabled: !!unitId,
    staleTime: 2 * 60 * 1000,
  });

  // TODO: Obter unitId do contexto de unidades quando disponível
  useEffect(() => {
    // Por enquanto, usar primeira unidade ou buscar de localStorage
    const savedUnitId = localStorage.getItem('selected_unit_id');
    if (savedUnitId) {
      setUnitId(savedUnitId);
    }
  }, []);

  if (!unitId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="card-theme rounded-xl border p-8 text-center">
          <p className="text-theme-primary text-lg font-medium">
            Selecione uma unidade para visualizar os KPIs
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-theme-secondary">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="card-theme rounded-xl border p-8 text-center">
          <p className="text-theme-primary text-lg font-medium text-feedback-light-error dark:text-feedback-dark-error">
            Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  const trendValue =
    kpisData?.trend === 'INCREASING'
      ? 5.0
      : kpisData?.trend === 'DECREASING'
        ? -5.0
        : undefined;

  return (
    <div className="min-h-screen bg-light-bg p-6 dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-theme-primary mb-2 text-3xl font-bold">Saúde Financeira</h1>
          <p className="text-theme-secondary text-sm">
            Visão geral dos principais indicadores financeiros
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="input-theme w-auto"
          >
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>

        {/* Cards de KPI */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Receita Bruta"
            value={formatCurrency(kpisData?.grossRevenue || 0)}
            trend={trendValue}
            icon={DollarSign}
            formatValue={formatCurrency}
          />
          <KPICard
            title="Despesas Totais"
            value={formatCurrency(kpisData?.totalExpenses || 0)}
            icon={TrendingUp}
            formatValue={formatCurrency}
          />
          <KPICard
            title="Margem de Lucro"
            value={formatPercentage(kpisData?.marginPercentage || 0)}
            icon={TrendingUp}
            formatValue={formatPercentage}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(kpisData?.averageTicket || 0)}
            icon={ShoppingCart}
            formatValue={formatCurrency}
          />
        </div>

        {/* Gráficos */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de tendência de receita */}
          {historicalData && historicalData.length > 0 && (
            <TrendChart
              data={historicalData}
              xKey="date"
              yKey="gross_revenue"
              height={300}
              formatYAxis={(value) => formatCurrency(value)}
              formatTooltip={(value) => [formatCurrency(value), 'Receita']}
            />
          )}

          {/* Gráfico de margem */}
          {historicalData && historicalData.length > 0 && (
            <TrendChart
              data={historicalData}
              xKey="date"
              yKey="margin_percentage"
              height={300}
              color="#16A34A"
              formatYAxis={(value) => `${value.toFixed(1)}%`}
              formatTooltip={(value) => [`${value.toFixed(1)}%`, 'Margem']}
            />
          )}
        </div>

        {/* Tabela de Alertas Recentes */}
        <div className="card-theme rounded-xl border p-6">
          <h2 className="text-theme-primary mb-4 text-xl font-semibold">Alertas Recentes</h2>
          {alertsData && alertsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-bg dark:bg-dark-hover">
                  <tr>
                    <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                      Tipo
                    </th>
                    <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                      Severidade
                    </th>
                    <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                      Mensagem
                    </th>
                    <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {alertsData.map((alert: any) => (
                    <tr
                      key={alert.id}
                      className="transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
                    >
                      <td className="text-theme-primary px-4 py-3">{alert.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error'
                              : alert.severity === 'HIGH'
                                ? 'bg-feedback-light-warning/10 text-feedback-light-warning dark:bg-feedback-dark-warning/10 dark:text-feedback-dark-warning'
                                : 'bg-light-bg text-theme-secondary dark:bg-dark-hover'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="text-theme-secondary px-4 py-3">{alert.message}</td>
                      <td className="text-theme-secondary px-4 py-3">
                        {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-theme-secondary py-8 text-center">
              <AlertTriangle className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>Nenhum alerta aberto no momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

