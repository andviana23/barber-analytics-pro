/**
 * 📈 FluxoCaixaTimeline Component
 *
 * @component
 * @description Gráfico de timeline (Entradas vs Saídas) com Recharts
 *
 * Features:
 * - Linha de Entradas (verde)
 * - Linha de Saídas (vermelho)
 * - Área de Saldo Acumulado
 * - Tooltip interativo
 * - Grid suave
 * - Dark mode automático
 * - Responsivo
 * - Loading state
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

/**
 * @param {Object} props
 * @param {Array} props.data - Dados diários do fluxo de caixa
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.chartType - Tipo de gráfico: 'line' ou 'area' (default: 'line')
 */
export function FluxoCaixaTimeline({
  data,
  loading = false,
  chartType = 'line',
}) {
  // Transformar dados para formato Recharts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Remover SALDO_INICIAL
    const dataWithoutInitial = data.filter(day => day.date !== 'SALDO_INICIAL');

    return dataWithoutInitial.map(day => ({
      date: day.date,
      dateFormatted: format(parseISO(day.date), 'dd/MM', { locale: ptBR }),
      entradas: day.entries || 0,
      saidas: day.exits || 0,
      saldo: day.dailyBalance || 0,
      acumulado: day.accumulated || 0,
    }));
  }, [data]);

  if (loading) {
    return <FluxoCaixaTimelineLoading />;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card-theme flex h-96 items-center justify-center rounded-xl border">
        <p className="text-theme-secondary text-sm">
          Nenhum dado disponível para exibir o gráfico
        </p>
      </div>
    );
  }

  return (
    <div className="card-theme rounded-xl border p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-theme-primary text-lg font-semibold">
          Fluxo de Caixa - Timeline
        </h3>
        <p className="text-theme-secondary text-sm">
          Evolução de entradas e saídas ao longo do período
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-light-border dark:stroke-dark-border"
            />
            <XAxis
              dataKey="dateFormatted"
              className="text-theme-secondary text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-theme-secondary text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area
              type="monotone"
              dataKey="entradas"
              stroke="#10b981"
              fill="url(#colorEntradas)"
              strokeWidth={2}
              name="Entradas"
            />
            <Area
              type="monotone"
              dataKey="saidas"
              stroke="#ef4444"
              fill="url(#colorSaidas)"
              strokeWidth={2}
              name="Saídas"
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-light-border dark:stroke-dark-border"
            />
            <XAxis
              dataKey="dateFormatted"
              className="text-theme-secondary text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-theme-secondary text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={value => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Entradas"
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="Saídas"
            />
            <Line
              type="monotone"
              dataKey="acumulado"
              stroke="#1e8cff"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Acumulado"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Tooltip customizado para o gráfico
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="card-theme rounded-lg border p-3 shadow-lg">
      <p className="text-theme-primary mb-2 text-sm font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <span className="text-xs" style={{ color: entry.color }}>
            {entry.name}:
          </span>
          <span className="text-xs font-bold" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton para o gráfico
 */
function FluxoCaixaTimelineLoading() {
  return (
    <div className="card-theme animate-pulse rounded-xl border p-6">
      <div className="mb-6">
        <div className="mb-2 h-6 w-48 rounded bg-light-hover dark:bg-dark-hover" />
        <div className="h-4 w-64 rounded bg-light-hover dark:bg-dark-hover" />
      </div>
      <div className="h-96 rounded bg-light-hover dark:bg-dark-hover" />
    </div>
  );
}

export default FluxoCaixaTimeline;
