/**
 * CashflowTimelineChart.jsx
 *
 * Gráfico de linha do tempo para fluxo de caixa
 * Substitui os cards estáticos por visualização temporal interativa
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2025-01-17
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Download,
  Maximize2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
  DollarSign,
} from 'lucide-react';

// Função auxiliar para formatar valores monetários
const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

// Função auxiliar para formatar datas
const formatDateForChart = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'MMM/yy', {
    locale: ptBR,
  });
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="card-theme min-w-64 rounded-lg border border-light-border p-4 shadow-lg dark:border-dark-border dark:bg-dark-surface">
      <div className="text-theme-primary dark:text-dark-text-primary mb-3 font-semibold">
        {format(new Date(data.date), "MMMM 'de' yyyy", {
          locale: ptBR,
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              Entradas:
            </span>
          </div>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(data.revenues)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              Saídas:
            </span>
          </div>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(data.expenses)}
          </span>
        </div>

        <div className="mt-2 border-t border-light-border pt-2 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <span className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
              Resultado:
            </span>
            <span
              className={`font-bold ${data.result >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatCurrency(data.result)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
              Margem:
            </span>
            <span
              className={`font-semibold ${data.margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {data.margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
const CashflowTimelineChart = ({
  data = [],
  loading = false,
  error = null,
  title = 'Evolução do Fluxo de Caixa',
  height = 400,
  showLegend = true,
  showGrid = true,
  onRefresh = null,
  onExport = null,
  className = '',
}) => {
  const [chartType, setChartType] = useState('area'); // 'area', 'line'
  const [timeRange, setTimeRange] = useState('12'); // '6', '12', '24'

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filtrar dados baseado no período selecionado
    const monthsToShow = parseInt(timeRange);
    const cutoffDate = subMonths(new Date(), monthsToShow);
    return data
      .filter(item => new Date(item.date) >= cutoffDate)
      .map(item => ({
        ...item,
        date: item.date,
        displayDate: formatDateForChart(item.date),
        result: item.revenues - item.expenses,
        margin:
          item.revenues > 0
            ? ((item.revenues - item.expenses) / item.revenues) * 100
            : 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, timeRange]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalRevenues: 0,
        totalExpenses: 0,
        netResult: 0,
        avgMargin: 0,
        trend: 'neutral',
        trendValue: 0,
      };
    }
    const totalRevenues = chartData.reduce(
      (sum, item) => sum + item.revenues,
      0
    );
    const totalExpenses = chartData.reduce(
      (sum, item) => sum + item.expenses,
      0
    );
    const netResult = totalRevenues - totalExpenses;
    const avgMargin = totalRevenues > 0 ? (netResult / totalRevenues) * 100 : 0;

    // Calcular tendência (comparar últimos 3 meses com anteriores)
    const recentMonths = chartData.slice(-3);
    const previousMonths = chartData.slice(-6, -3);
    const recentAvg =
      recentMonths.reduce(
        (sum, item) => sum + (item.revenues - item.expenses),
        0
      ) / recentMonths.length;
    const previousAvg =
      previousMonths.length > 0
        ? previousMonths.reduce(
            (sum, item) => sum + (item.revenues - item.expenses),
            0
          ) / previousMonths.length
        : recentAvg;
    const trendValue =
      previousAvg !== 0
        ? ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100
        : 0;
    const trend = trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'neutral';
    return {
      totalRevenues,
      totalExpenses,
      netResult,
      avgMargin,
      trend,
      trendValue: Math.abs(trendValue),
    };
  }, [chartData]);

  // Estados de loading e erro
  if (loading) {
    return (
      <div
        className={`card-theme rounded-lg border border-light-border p-6 dark:border-dark-border ${className}`}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-theme-secondary dark:text-dark-text-muted">
              Carregando dados do fluxo de caixa...
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}
      >
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="mb-2 text-red-600 dark:text-red-400">
              Erro ao carregar dados
            </p>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4 text-sm">
              {error}
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-dark-text-primary rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-light-border p-6 dark:border-dark-border">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                {title}
              </h3>
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Evolução temporal dos últimos {timeRange} meses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Controles de período */}
            <div className="card-theme flex items-center gap-1 rounded-lg p-1 dark:bg-gray-700">
              {['6', '12', '24'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeRange(period)}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${timeRange === period ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                >
                  {period}m
                </button>
              ))}
            </div>

            {/* Controles de tipo de gráfico */}
            <div className="card-theme flex items-center gap-1 rounded-lg p-1 dark:bg-gray-700">
              <button
                onClick={() => setChartType('area')}
                className={`rounded-md p-2 transition-colors ${chartType === 'area' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                title="Gráfico de Área"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`rounded-md p-2 transition-colors ${chartType === 'line' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
                title="Gráfico de Linha"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
            </div>

            {/* Ações */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary hover:card-theme rounded-lg p-2 transition-colors dark:hover:bg-gray-700"
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary hover:card-theme rounded-lg p-2 transition-colors dark:hover:bg-gray-700"
                title="Exportar gráfico"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Total Entradas
              </span>
            </div>
            <p className="text-lg font-bold text-green-800 dark:text-green-200">
              {formatCurrency(stats.totalRevenues)}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="mb-1 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Total Saídas
              </span>
            </div>
            <p className="text-lg font-bold text-red-800 dark:text-red-200">
              {formatCurrency(stats.totalExpenses)}
            </p>
          </div>

          <div
            className={`rounded-lg p-3 ${stats.netResult >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
          >
            <div className="mb-1 flex items-center gap-2">
              <DollarSign
                className={`h-4 w-4 ${stats.netResult >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              />
              <span
                className={`text-sm font-medium ${stats.netResult >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
              >
                Resultado Líquido
              </span>
            </div>
            <p
              className={`text-lg font-bold ${stats.netResult >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}
            >
              {formatCurrency(stats.netResult)}
            </p>
          </div>

          <div
            className={`rounded-lg p-3 ${stats.avgMargin >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}
          >
            <div className="mb-1 flex items-center gap-2">
              <Activity
                className={`h-4 w-4 ${stats.avgMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}
              />
              <span
                className={`text-sm font-medium ${stats.avgMargin >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}
              >
                Margem Média
              </span>
            </div>
            <p
              className={`text-lg font-bold ${stats.avgMargin >= 0 ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'}`}
            >
              {stats.avgMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="p-6">
        <div
          style={{
            height: `${height}px`,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <defs>
                  <linearGradient
                    id="revenuesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="expensesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="revenues"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenuesGradient)"
                  name="Entradas"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expensesGradient)"
                  name="Saídas"
                />

                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />

                <Line
                  type="monotone"
                  dataKey="revenues"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{
                    fill: '#10b981',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#10b981',
                    strokeWidth: 2,
                  }}
                  name="Entradas"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    fill: '#ef4444',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#ef4444',
                    strokeWidth: 2,
                  }}
                  name="Saídas"
                />

                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
CashflowTimelineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      revenues: PropTypes.number.isRequired,
      expenses: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool,
  onRefresh: PropTypes.func,
  onExport: PropTypes.func,
  className: PropTypes.string,
};
export default CashflowTimelineChart;
