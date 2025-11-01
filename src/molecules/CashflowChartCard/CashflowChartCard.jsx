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
    <div className="card-theme dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg p-3 min-w-48">
      <div className="font-medium text-theme-primary dark:text-dark-text-primary mb-2">
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
                className="w-3 h-3 rounded mr-2"
                style={{
                  backgroundColor: entry.color,
                }}
              />
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                {entry.name}:
              </span>
            </div>
            <span className="font-medium text-theme-primary dark:text-dark-text-primary">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}

        {data.saldoDiario !== undefined && (
          <div className="border-t border-light-border dark:border-dark-border pt-1 mt-1">
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
          <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
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
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary mb-2">
            Erro ao carregar dados
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4">
            {error}
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-dark-text-primary rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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
      <div className="p-4 border-b border-light-border dark:border-dark-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* View toggles com Dark Mode */}
            <div className="flex card-theme dark:bg-dark-surface/50 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveView('combined')}
                className={`px-2 py-1 text-xs rounded transition-colors ${activeView === 'combined' ? 'bg-light-surface dark:bg-dark-hover text-theme-primary dark:text-dark-text-primary shadow-sm' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Completo
              </button>
              <button
                type="button"
                onClick={() => setActiveView('bars')}
                className={`px-2 py-1 text-xs rounded transition-colors ${activeView === 'bars' ? 'bg-light-surface dark:bg-dark-hover text-theme-primary dark:text-dark-text-primary shadow-sm' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Barras
              </button>
              <button
                type="button"
                onClick={() => setActiveView('line')}
                className={`px-2 py-1 text-xs rounded transition-colors ${activeView === 'line' ? 'bg-light-surface dark:bg-dark-hover text-theme-primary dark:text-dark-text-primary shadow-sm' : 'text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary'}`}
              >
                Linha
              </button>
            </div>

            {/* Actions */}
            {onExport && (
              <button
                type="button"
                onClick={onExport}
                className="p-2 text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary rounded-md hover:card-theme"
                title="Exportar dados"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {onFullscreen && (
              <button
                type="button"
                onClick={onFullscreen}
                className="p-2 text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary rounded-md hover:card-theme"
                title="Tela cheia"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className={`p-2 text-theme-secondary dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary rounded-md hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors ${loading ? 'animate-spin' : ''}`}
                title="Atualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Métricas resumo com Dark Mode */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Entradas
              </div>
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrencyLocal(metrics.totalEntradas)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Saídas
              </div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{formatCurrencyLocal(metrics.totalSaidas)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Saldo Final
              </div>
              <div
                className={`text-lg font-semibold ${metrics.saldoFinal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrencyLocal(metrics.saldoFinal)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Variação
              </div>
              <div
                className={`text-lg font-semibold flex items-center justify-center ${metrics.variacao >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {metrics.variacao >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
            <span className="ml-2 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Carregando dados...
            </span>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            <Calendar className="w-12 h-12 mb-4" />
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
          <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>{metrics.diasPositivos} dias positivos</span>
                </div>
                {metrics.diasNegativos > 0 && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
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
    <div className="space-y-6 p-4 max-w-6xl">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
