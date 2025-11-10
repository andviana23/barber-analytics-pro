/**
 * @fileoverview TrendChart Component
 * @module components/molecules/TrendChart
 * @description Gráfico de linha para tendências seguindo Design System
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.4.2
 * @see docs/DESIGN_SYSTEM.md
 */

'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface TrendChartProps {
  data: Array<Record<string, any>>;
  xKey: string; // Chave para eixo X (ex: 'date')
  yKey: string; // Chave para eixo Y (ex: 'gross_revenue')
  color?: string; // Cor da linha (padrão: primary)
  height?: number; // Altura do gráfico (padrão: 300)
  showGrid?: boolean; // Mostrar grid (padrão: true)
  showLegend?: boolean; // Mostrar legenda (padrão: false)
  formatXAxis?: (value: any) => string; // Formatar valores do eixo X
  formatYAxis?: (value: any) => string; // Formatar valores do eixo Y
  formatTooltip?: (value: any, name: string) => [string, string]; // Formatar tooltip
  className?: string;
}

/**
 * Componente TrendChart
 *
 * Gráfico de linha responsivo e acessível seguindo Design System
 */
export function TrendChart({
  data,
  xKey,
  yKey,
  color = '#1E8CFF', // primary color
  height = 300,
  showGrid = true,
  showLegend = false,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  className = '',
}: TrendChartProps) {
  const defaultFormatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [
        value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        name,
      ];
    }
    return [String(value), name];
  };

  const tooltipFormatter = formatTooltip || defaultFormatTooltip;

  return (
    <div className={`card-theme rounded-xl border p-6 ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          accessibilityLayer
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="opacity-20"
              strokeWidth={0.5}
            />
          )}
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
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

