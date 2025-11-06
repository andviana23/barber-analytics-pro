/**
 * CashflowChartCard.jsx
 *
 * Card com gráfico de fluxo de caixa usando Recharts
 * Exibe entradas vs saídas por período com linha de saldo acumulado
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
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
} from 'lucide-react';

// Função auxiliar para formatar datas completas
const formatFullDate = (dateString, periodType) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  switch (periodType) {
    case 'daily':
      return format(date, "EEEE, dd 'de' MMMM", {
        locale: ptBR,
      });
    case 'weekly':
      return `Semana de ${format(date, 'dd/MM/yyyy', {
        locale: ptBR,
      })}`;
    case 'monthly':
      return format(date, "MMMM 'de' yyyy", {
        locale: ptBR,
      });
    default:
      return format(date, 'dd/MM/yyyy', {
        locale: ptBR,
      });
  }
};

// Função auxiliar para formatar valores monetários
const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// Formatação de data baseada no período
const formatDateForPeriod = (dateString, periodType) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  switch (periodType) {
    case 'daily':
      return format(date, 'dd/MM', {
        locale: ptBR,
      });
    case 'weekly':
      return format(date, 'dd/MM', {
        locale: ptBR,
      });
    case 'monthly':
      return format(date, 'MMM/yy', {
        locale: ptBR,
      });
    case 'yearly':
      return format(date, 'yyyy', {
        locale: ptBR,
      });
    default:
      return format(date, 'dd/MM', {
        locale: ptBR,
      });
  }
};

// Tooltip customizado com Dark Mode - MOVIDO PARA FORA DO COMPONENTE
const CustomTooltip = ({ active, payload, period }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="card-theme min-w-48 rounded-lg border border-light-border p-3 shadow-lg dark:border-dark-border dark:bg-dark-surface">
      <div className="text-theme-primary dark:text-dark-text-primary mb-2 font-medium">
        {formatFullDate(data.date, period)}
      </div>

      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div
            key={`${entry.dataKey}-${idx}`}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center">
              <div
                className="mr-2 h-3 w-3 rounded"
                style={{
                  backgroundColor: entry.color,
                }}
              />
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                {entry.name}:
              </span>
            </div>
            <span className="text-theme-primary dark:text-dark-text-primary font-medium">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}

        {data.saldoDiario !== undefined && (
          <div className="mt-1 border-t border-light-border pt-1 dark:border-dark-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Saldo do dia:
              </span>
              <span
                className={`font-medium ${data.saldoDiario >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(data.saldoDiario)}
              </span>
            </div>
          </div>
        )}

        {data.transactions_count > 0 && (
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
            {data.transactions_count} transações
          </div>
        )}
      </div>
    </div>
  );
};
const CashflowChartCard = ({
  data = [],
  title = 'Fluxo de Caixa',
  subtitle,
  period = 'daily',
  showBalance = true,
  showBars = true,
  showLine = true,
  height = 300,
  loading = false,
  error = null,
  onRefresh,
  onExport,
  onFullscreen,
  className = '',
}) => {
  const [activeView, setActiveView] = useState('combined'); // 'combined', 'bars', 'line'

  // Processar dados para o gráfico
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(entry => ({
      ...entry,
      date: entry.date,
      displayDate: formatDateForPeriod(entry.date, period),
      entradas: entry.inflows || entry.entradas || 0,
      saidas: Math.abs(entry.outflows || entry.saidas || 0),
      // Sempre positivo para visualização
      saldoAcumulado: entry.accumulated_balance || entry.saldoAcumulado || 0,
      saldoDiario:
        (entry.inflows || entry.entradas || 0) -
        Math.abs(entry.outflows || entry.saidas || 0),
      // Adicionar metadados para tooltip
      transactions_count: entry.transactions_count || 0,
      reconciled_percentage: entry.reconciled_percentage || 0,
    }));
  }, [data, period]);

  // Calcular métricas
  const metrics = useMemo(() => {
    if (processedData.length === 0) return null;
    const totalEntradas = processedData.reduce(
      (sum, item) => sum + item.entradas,
      0
    );
    const totalSaidas = processedData.reduce(
      (sum, item) => sum + item.saidas,
      0
    );
    const saldoFinal =
      processedData[processedData.length - 1]?.saldoAcumulado || 0;
    const saldoInicial =
      processedData[0]?.saldoAcumulado - processedData[0]?.saldoDiario || 0;
    const variacao = saldoFinal - saldoInicial;
    const variacaoPercentual =
      saldoInicial !== 0 ? (variacao / Math.abs(saldoInicial)) * 100 : 0;
    return {
      totalEntradas,
      totalSaidas,
      saldoInicial,
      saldoFinal,
      variacao,
      variacaoPercentual,
      maiorEntrada: Math.max(...processedData.map(d => d.entradas)),
      maiorSaida: Math.max(...processedData.map(d => d.saidas)),
      diasPositivos: processedData.filter(d => d.saldoDiario > 0).length,
      diasNegativos: processedData.filter(d => d.saldoDiario < 0).length,
    };
  }, [processedData]);

  // Formatação de moeda local (para uso no componente)
  const formatCurrencyLocal = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  // Classes CSS com Dark Mode
  const cardClasses = `
    card-theme border border-light-border dark:border-dark-border rounded-lg shadow-sm hover:shadow-md transition-shadow
    ${className}
  `;
  if (error) {
    return (
      <div className={cardClasses}>
        <div className="p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
            Erro ao carregar dados
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4">
            {error}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="text-dark-text-primary inline-flex items-center rounded-md bg-blue-600 px-4 py-2 hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={cardClasses}>
      {/* Header com Dark Mode */}
      <div className="border-b border-light-border p-4 dark:border-dark-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                {subtitle}
              </p>
            )}
          </div>

          <div className="ml-4 flex items-center space-x-2">
            {/* View toggles com Dark Mode */}
            <div className="card-theme flex rounded-lg p-1 dark:bg-dark-surface/50">
              <button
                type="button"
                onClick={() => setActiveView('combined')}
                className={`rounded px-2 py-1 text-xs transition-colors ${activeView === 'combined' ? 'text-theme-primary dark:text-dark-text-primary bg-light-surface shadow-sm dark:bg-dark-hover' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Completo
              </button>
              <button
                type="button"
                onClick={() => setActiveView('bars')}
                className={`rounded px-2 py-1 text-xs transition-colors ${activeView === 'bars' ? 'text-theme-primary dark:text-dark-text-primary bg-light-surface shadow-sm dark:bg-dark-hover' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Barras
              </button>
              <button
                type="button"
                onClick={() => setActiveView('line')}
                className={`rounded px-2 py-1 text-xs transition-colors ${activeView === 'line' ? 'text-theme-primary dark:text-dark-text-primary bg-light-surface shadow-sm dark:bg-dark-hover' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Linha
              </button>
            </div>

            {/* Actions */}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-md p-2"
                title="Exportar dados"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {onFullscreen && (
              <button
                type="button"
                onClick={onFullscreen}
                className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary hover:card-theme rounded-md p-2"
                title="Tela cheia"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className={`text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary rounded-md p-2 transition-colors hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 ${loading ? 'animate-spin' : ''}`}
                title="Atualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Métricas resumo com Dark Mode */}
        {metrics && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Entradas
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrencyLocal(metrics.totalEntradas)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Saídas
              </div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{formatCurrencyLocal(metrics.totalSaidas)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Saldo Final
              </div>
              <div
                className={`text-lg font-semibold ${metrics.saldoFinal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrencyLocal(metrics.saldoFinal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Variação
              </div>
              <div
                className={`flex items-center justify-center text-lg font-semibold ${metrics.variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {metrics.variacao >= 0 ? (
                  <TrendingUp className="mr-1 h-4 w-4" />
                ) : (
                  <TrendingDown className="mr-1 h-4 w-4" />
                )}
                {Math.abs(metrics.variacaoPercentual).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 dark:border-blue-400"></div>
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted ml-2">
              Carregando dados...
            </span>
          </div>
        ) : processedData.length === 0 ? (
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex h-64 flex-col items-center justify-center">
            <Calendar className="mb-4 h-12 w-12" />
            <p>Nenhum dado disponível para o período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart
              data={processedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="displayDate"
                tick={{
                  fontSize: 12,
                }}
                stroke="#6b7280"
              />
              <YAxis
                yAxisId="bars"
                orientation="left"
                tick={{
                  fontSize: 12,
                }}
                stroke="#6b7280"
                tickFormatter={value =>
                  formatCurrencyLocal(value).replace('R$', 'R$')
                }
              />
              {showBalance && showLine && (
                <YAxis
                  yAxisId="line"
                  orientation="right"
                  tick={{
                    fontSize: 12,
                  }}
                  stroke="#6b7280"
                  tickFormatter={value =>
                    formatCurrencyLocal(value).replace('R$', 'R$')
                  }
                />
              )}
              <Tooltip content={<CustomTooltip period={period} />} />
              <Legend />

              {/* Reference line at zero for accumulated balance */}
              {showBalance && showLine && (
                <ReferenceLine
                  yAxisId="line"
                  y={0}
                  stroke="#6b7280"
                  strokeDasharray="2 2"
                />
              )}

              {/* Bars for inflows/outflows */}
              {showBars &&
                (activeView === 'combined' || activeView === 'bars') && (
                  <>
                    <Bar
                      yAxisId="bars"
                      dataKey="entradas"
                      name="Entradas"
                      fill="#10b981"
                      radius={[2, 2, 0, 0]}
                      opacity={0.8}
                    />
                    <Bar
                      yAxisId="bars"
                      dataKey="saidas"
                      name="Saídas"
                      fill="#ef4444"
                      radius={[2, 2, 0, 0]}
                      opacity={0.8}
                    />
                  </>
                )}

              {/* Line for accumulated balance */}
              {showBalance &&
                showLine &&
                (activeView === 'combined' || activeView === 'line') && (
                  <Line
                    yAxisId={
                      showBars && activeView === 'combined' ? 'line' : 'bars'
                    }
                    type="monotone"
                    dataKey="saldoAcumulado"
                    name="Saldo Acumulado"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      fill: '#3b82f6',
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: '#3b82f6',
                      strokeWidth: 2,
                      fill: '#ffffff',
                    }}
                  />
                )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer com insights */}
      {metrics && !loading && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-light-bg p-3 dark:bg-dark-bg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  <span>{metrics.diasPositivos} dias positivos</span>
                </div>
                {metrics.diasNegativos > 0 && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    <span>{metrics.diasNegativos} dias negativos</span>
                  </div>
                )}
              </div>
              <div className="text-theme-secondary text-xs">
                Período: {processedData.length}{' '}
                {period === 'daily' ? 'dias' : 'períodos'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
CashflowChartCard.propTypes = {
  /**
   * Dados do fluxo de caixa
   */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      inflows: PropTypes.number,
      outflows: PropTypes.number,
      accumulated_balance: PropTypes.number,
      entradas: PropTypes.number,
      saidas: PropTypes.number,
      saldoAcumulado: PropTypes.number,
      transactions_count: PropTypes.number,
      reconciled_percentage: PropTypes.number,
    })
  ),
  /**
   * Título do card
   */
  title: PropTypes.string,
  /**
   * Subtítulo do card
   */
  subtitle: PropTypes.string,
  /**
   * Período dos dados
   */
  period: PropTypes.oneOf(['daily', 'weekly', 'monthly', 'yearly']),
  /**
   * Mostrar linha de saldo acumulado
   */
  showBalance: PropTypes.bool,
  /**
   * Mostrar barras de entrada/saída
   */
  showBars: PropTypes.bool,
  /**
   * Mostrar linha
   */
  showLine: PropTypes.bool,
  /**
   * Altura do gráfico
   */
  height: PropTypes.number,
  /**
   * Estado de loading
   */
  loading: PropTypes.bool,
  /**
   * Mensagem de erro
   */
  error: PropTypes.string,
  /**
   * Callback para atualizar dados
   */
  onRefresh: PropTypes.func,
  /**
   * Callback para exportar dados
   */
  onExport: PropTypes.func,
  /**
   * Callback para tela cheia
   */
  onFullscreen: PropTypes.func,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
};

// Componente de preview para demonstração
export const CashflowChartCardPreview = () => {
  // Mock data para 30 dias - movido para useMemo para evitar re-renderizações
  const mockData = useMemo(() => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    let accumulatedBalance = 5000; // Saldo inicial

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Usar valores baseados no índice para evitar Math.random no render
      const seedValue = (i * 137 + 42) % 1000; // Pseudo-random determinístico
      const entradas = (seedValue % 1000) + 200; // 200-1200
      const saidas = (seedValue % 800) + 100; // 100-900
      const dailyBalance = entradas - saidas;
      accumulatedBalance += dailyBalance;
      data.push({
        date: date.toISOString().split('T')[0],
        inflows: entradas,
        outflows: saidas,
        accumulated_balance: accumulatedBalance,
        transactions_count: (i % 10) + 1,
        reconciled_percentage: 70 + (i % 30), // 70-100%
      });
    }
    return data;
  }, []); // Array vazio significa que só gera uma vez

  const handleAction = action => {
    alert(`Ação: ${action}`);
  };
  return (
    <div className="max-w-6xl space-y-6 p-4">
      <h3 className="text-lg font-semibold">CashflowChartCard Preview</h3>

      <CashflowChartCard
        data={mockData}
        title="Fluxo de Caixa - Últimos 30 dias"
        subtitle="Entradas, saídas e saldo acumulado por dia"
        period="daily"
        onRefresh={() => handleAction('Refresh')}
        onExport={() => handleAction('Export')}
        onFullscreen={() => handleAction('Fullscreen')}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CashflowChartCard
          data={mockData.slice(-14)}
          title="Últimas 2 semanas"
          period="daily"
          height={250}
          showBalance={true}
          showBars={false}
          showLine={true}
        />

        <CashflowChartCard
          data={mockData.slice(-7)}
          title="Última semana"
          period="daily"
          height={250}
          showBalance={false}
          showBars={true}
          showLine={false}
        />
      </div>

      <CashflowChartCard data={[]} title="Sem dados" loading={false} />

      <CashflowChartCard
        data={mockData}
        title="Estado de loading"
        loading={true}
      />

      <CashflowChartCard
        data={mockData}
        title="Com erro"
        error="Erro ao conectar com o servidor"
        onRefresh={() => handleAction('Retry')}
      />
    </div>
  );
};
export default CashflowChartCard;
