/**
 * @fileoverview Dashboard de Fluxo de Caixa
 * @module app/ia-financeira/fluxo/page
 * @description Página de dashboard com gráficos de fluxo de caixa e previsões
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.2
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ForecastAreaChart } from '../../../components/molecules/ForecastAreaChart';
import { TrendChart } from '../../../components/molecules/TrendChart';

/**
 * Página: Dashboard de Fluxo de Caixa
 */
export default function FluxoCaixaPage() {
  const [unitId, setUnitId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Buscar dados históricos da view vw_demonstrativo_fluxo
  const { data: historicalData, isLoading: loadingHistorical } = useQuery({
    queryKey: ['cashflow-historical', unitId, startDate, endDate],
    queryFn: async () => {
      if (!unitId) return [];

      // TODO: Criar endpoint específico ou usar RPC
      const response = await fetch(
        `/api/forecasts/cashflow?unitId=${unitId}&startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.historical || [];
    },
    enabled: !!unitId,
    staleTime: 5 * 60 * 1000,
  });

  // Buscar previsões (30/60/90 dias)
  const { data: forecastData, isLoading: loadingForecast } = useQuery({
    queryKey: ['cashflow-forecast', unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const response = await fetch(
        `/api/forecasts/cashflow?unitId=${unitId}&days=90`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      return data.forecast || [];
    },
    enabled: !!unitId,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
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
            Selecione uma unidade para visualizar o fluxo de caixa
          </p>
        </div>
      </div>
    );
  }

  const isLoading = loadingHistorical || loadingForecast;

  return (
    <div className="min-h-screen bg-light-bg p-6 dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-theme-primary mb-2 text-3xl font-bold">
            Fluxo de Caixa
          </h1>
          <p className="text-theme-secondary text-sm">
            Histórico e previsões de saldo acumulado
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-theme"
            />
          </div>
          <div>
            <label className="text-theme-primary mb-1 block text-sm font-medium">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-theme"
            />
          </div>
        </div>

        {/* Gráfico de Previsão */}
        {isLoading ? (
          <div className="card-theme rounded-xl border p-12 text-center">
            <p className="text-theme-secondary">Carregando dados...</p>
          </div>
        ) : (
          <>
            {historicalData && forecastData && (
              <div className="mb-8">
                <ForecastAreaChart
                  historicalData={historicalData.map((item: any) => ({
                    date: item.date || item.created_at,
                    balance: item.saldo_acumulado || item.balance,
                  }))}
                  forecastData={forecastData.map((item: any) => ({
                    date: item.forecast_date || item.date,
                    balance: item.forecasted_balance || item.balance,
                    upper: item.upper_bound,
                    lower: item.lower_bound,
                  }))}
                  confidenceInterval={
                    forecastData[0]?.upper_bound
                      ? { upper: 'upper', lower: 'lower' }
                      : undefined
                  }
                  xKey="date"
                  yKey="balance"
                  height={400}
                  formatYAxis={value =>
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value)
                  }
                  formatTooltip={value => [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value),
                    'Saldo',
                  ]}
                />
              </div>
            )}

            {/* Gráfico de linha histórico */}
            {historicalData && historicalData.length > 0 && (
              <TrendChart
                data={historicalData.map((item: any) => ({
                  date: item.date || item.created_at,
                  balance: item.saldo_acumulado || item.balance,
                }))}
                xKey="date"
                yKey="balance"
                height={300}
                formatYAxis={value =>
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(value)
                }
                formatTooltip={value => [
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(value),
                  'Saldo',
                ]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
