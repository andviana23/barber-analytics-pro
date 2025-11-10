/**
 * @fileoverview ForecastAreaChart Component
 * @module components/molecules/ForecastAreaChart
 * @description Gráfico de área com histórico e previsão seguindo Design System
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.4.3
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface ForecastAreaChartProps {
  historicalData: Array<Record<string, any>>;
  forecastData: Array<Record<string, any>>;
  confidenceInterval?: {
    upper: string; // Chave para valor superior
    lower: string; // Chave para valor inferior
  };
  xKey: string; // Chave para eixo X (ex: 'date')
  yKey: string; // Chave para eixo Y (ex: 'balance')
  height?: number; // Altura do gráfico (padrão: 400)
  formatXAxis?: (value: any) => string;
  formatYAxis?: (value: any) => string;
  formatTooltip?: (value: any, name: string) => [string, string];
  className?: string;
}

/**
 * Componente ForecastAreaChart
 *
 * Gráfico de área mostrando histórico e previsão com intervalo de confiança
 */
export function ForecastAreaChart({
  historicalData,
  forecastData,
  confidenceInterval,
  xKey,
  yKey,
  height = 400,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className = '',
}: ForecastAreaChartProps) {
  // Combinar dados históricos e de previsão
  const combinedData = [
    ...historicalData.map((item) => ({ ...item, type: 'historical' })),
    ...forecastData.map((item) => ({ ...item, type: 'forecast' })),
  ];

  const defaultFormatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [
        value.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        name,
      ];
    }
    return [String(value), name];
  };

  const tooltipFormatter = formatTooltip || defaultFormatTooltip;

  return (
    <div className={`card-theme rounded-xl border p-6 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={combinedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1E8CFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1E8CFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
            </linearGradient>
            {confidenceInterval && (
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="opacity-20"
            strokeWidth={0.5}
          />
          <XAxis
            dataKey={xKey}
            tickFormatter={formatXAxis}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-theme-secondary"
            stroke="currentColor"
            strokeWidth={0.5}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-theme-secondary"
            stroke="currentColor"
            strokeWidth={0.5}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-light-surface)',
              border: '1px solid var(--color-light-border)',
              borderRadius: '8px',
              color: 'var(--color-text-light-primary)',
            }}
            formatter={tooltipFormatter}
            labelStyle={{ color: 'var(--color-text-light-primary)' }}
          />
          <Legend />

          {/* Intervalo de confiança (se fornecido) */}
          {confidenceInterval && (
            <Area
              type="monotone"
              dataKey={confidenceInterval.upper}
              stroke="none"
              fill="url(#colorConfidence)"
              fillOpacity={0.3}
              name="Intervalo de Confiança"
            />
          )}

          {/* Dados históricos */}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#1E8CFF"
            strokeWidth={2}
            fill="url(#colorHistorical)"
            name="Histórico"
            connectNulls
          />

          {/* Dados de previsão */}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorForecast)"
            name="Previsão"
            connectNulls
            filter={(entry: any) => entry.type === 'forecast'}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

