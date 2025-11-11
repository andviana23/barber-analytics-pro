/**
 * @fileoverview Componente de Visualização de Forecast de Fluxo de Caixa
 * @module molecules/CashflowForecastChart
 * @description Componente React para exibir previsões de fluxo de caixa com histórico
 *
 * Features:
 * - Gráfico de área combinando histórico + forecast
 * - Intervalo de confiança visual
 * - Cards de resumo com saldos previstos
 * - Suporte a dark mode
 * - Responsivo
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.2.2
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useCashflowForecast } from '../../hooks/useCashflowForecast';

/**
 * Formata valor monetário
 */
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

/**
 * Formata data para o gráfico
 */
const formatDateForChart = (dateString) => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'dd/MM', { locale: ptBR });
};

/**
 * Tooltip customizado para o gráfico
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const isForecast = data.isForecast || false;
  const dateLabel = format(parseISO(data.date), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div className="card-theme min-w-64 rounded-lg border border-light-border p-4 shadow-lg dark:border-dark-border dark:bg-dark-surface">
      <div className="text-theme-primary dark:text-dark-text-primary mb-3 font-semibold">
        {dateLabel}
        {isForecast && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
            (Previsão)
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Saldo Previsto:
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {formatCurrency(data.forecastedBalance)}
          </span>
        </div>

        {data.confidenceInterval && (
          <div className="border-t border-light-border pt-2 dark:border-dark-border">
            <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-1 text-xs">
              Intervalo de Confiança (95%):
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Mínimo:</span>
              <span className="font-medium">
                {formatCurrency(data.confidenceInterval.lower)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Máximo:</span>
              <span className="font-medium">
                {formatCurrency(data.confidenceInterval.upper)}
              </span>
            </div>
          </div>
        )}

        {data.trend && (
          <div className="flex items-center gap-2 pt-2">
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
              Tendência:
            </span>
            {data.trend === 'up' && (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            {data.trend === 'down' && (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            {data.trend === 'stable' && (
              <TrendingFlat className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
            <span className="text-xs font-medium capitalize">{data.trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente: CashflowForecastChart
 *
 * Exibe gráfico de forecast de fluxo de caixa com histórico e previsões
 *
 * @param {Object} props
 * @param {string} props.unitId - ID da unidade
 * @param {string|null} [props.accountId] - ID da conta bancária (opcional)
 * @param {number} [props.days=30] - Período de previsão: 30, 60 ou 90 dias
 * @param {Array} [props.historicalData] - Dados históricos (opcional, se não fornecido busca via hook)
 * @param {string} [props.title] - Título do gráfico
 * @param {number} [props.height=400] - Altura do gráfico
 * @param {Function} [props.onRefresh] - Callback para refresh
 */
const CashflowForecastChart = ({
  unitId,
  accountId = null,
  days = 30,
  historicalData = null,
  title = 'Previsão de Fluxo de Caixa',
  height = 400,
  onRefresh = null,
}) => {
  // Buscar forecast via hook (se não fornecido historicalData)
  const {
    data: forecastData,
    isLoading,
    error,
    refetch,
  } = useCashflowForecast({
    unitId,
    accountId,
    days,
    enabled: !!unitId && !historicalData, // Só busca se não tiver historicalData
  });

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    // Se fornecido historicalData, usar ele; senão usar forecastData
    const data = historicalData || forecastData?.forecast || [];

    if (data.length === 0) return [];

    return data.map((item) => ({
      date: item.date,
      displayDate: formatDateForChart(item.date),
      forecastedBalance: item.forecastedBalance || item.forecasted_balance || 0,
      confidenceLower:
        item.confidenceInterval?.lower || item.confidence_interval?.lower || 0,
      confidenceUpper:
        item.confidenceInterval?.upper || item.confidence_interval?.upper || 0,
      trend: item.trend || 'stable',
      isForecast: item.isForecast !== undefined ? item.isForecast : true,
    }));
  }, [historicalData, forecastData]);

  // Dados de resumo
  const summary = useMemo(() => {
    if (!forecastData?.summary) {
      return null;
    }

    return {
      currentBalance: forecastData.summary.currentBalance || 0,
      forecastedBalance30d: forecastData.summary.forecastedBalance30d || null,
      forecastedBalance60d: forecastData.summary.forecastedBalance60d || null,
      forecastedBalance90d: forecastData.summary.forecastedBalance90d || null,
      trend: forecastData.summary.trend || 'stable',
    };
  }, [forecastData]);

  // Estados de loading e erro
  if (isLoading && !historicalData) {
    return (
      <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-theme-secondary dark:text-dark-text-muted">
              Carregando previsão de fluxo de caixa...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !historicalData) {
    return (
      <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="mb-2 text-red-600 dark:text-red-400">
              Erro ao carregar previsão
            </p>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4 text-sm">
              {error.message}
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="btn-theme-primary rounded-lg px-4 py-2"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Calendar className="mx-auto mb-4 h-8 w-8 text-gray-400" />
            <p className="text-theme-secondary dark:text-dark-text-muted">
              Nenhum dado disponível para exibir
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-theme rounded-lg border border-light-border p-6 dark:border-dark-border">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            {title}
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Previsão para os próximos {days} dias
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Cards de Resumo */}
      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="mb-1 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Saldo Atual
              </span>
            </div>
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {formatCurrency(summary.currentBalance)}
            </p>
          </div>

          {summary.forecastedBalance30d !== null && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Previsão 30d
                </span>
              </div>
              <p className="text-lg font-bold text-green-800 dark:text-green-200">
                {formatCurrency(summary.forecastedBalance30d)}
              </p>
            </div>
          )}

          {summary.forecastedBalance60d !== null && (
            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
              <div className="mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Previsão 60d
                </span>
              </div>
              <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                {formatCurrency(summary.forecastedBalance60d)}
              </p>
            </div>
          )}

          {summary.forecastedBalance90d !== null && (
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
              <div className="mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Previsão 90d
                </span>
              </div>
              <p className="text-lg font-bold text-orange-800 dark:text-orange-200">
                {formatCurrency(summary.forecastedBalance90d)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gráfico */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="displayDate"
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Intervalo de confiança (área sombreada) */}
            <Area
              type="monotone"
              dataKey="confidenceUpper"
              stroke="none"
              fill="url(#confidenceGradient)"
              name="Intervalo de Confiança"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="confidenceLower"
              stroke="none"
              fill="#fff"
              name=""
              isAnimationActive={false}
            />

            {/* Linha de forecast */}
            <Area
              type="monotone"
              dataKey="forecastedBalance"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#forecastGradient)"
              name="Saldo Previsto"
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />

            {/* Linha de referência (zero) */}
            <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Indicador de tendência */}
      {summary && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Tendência geral:
          </span>
          {summary.trend === 'up' && (
            <>
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-600 dark:text-green-400">
                Crescente
              </span>
            </>
          )}
          {summary.trend === 'down' && (
            <>
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-600 dark:text-red-400">
                Decrescente
              </span>
            </>
          )}
          {summary.trend === 'stable' && (
            <>
              <TrendingFlat className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Estável
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

CashflowForecastChart.propTypes = {
  unitId: PropTypes.string.isRequired,
  accountId: PropTypes.string,
  days: PropTypes.oneOf([30, 60, 90]),
  historicalData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      forecastedBalance: PropTypes.number.isRequired,
      confidenceInterval: PropTypes.shape({
        lower: PropTypes.number.isRequired,
        upper: PropTypes.number.isRequired,
      }),
      trend: PropTypes.oneOf(['up', 'down', 'stable']),
    })
  ),
  title: PropTypes.string,
  height: PropTypes.number,
  onRefresh: PropTypes.func,
};

export default CashflowForecastChart;

