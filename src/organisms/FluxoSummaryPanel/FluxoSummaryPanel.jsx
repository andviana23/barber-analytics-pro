/**
 * FluxoSummaryPanel.jsx
 *
 * Painel de resumo e análise de fluxo de caixa
 * Combina CashflowChartCard com KPIs e análises avançadas
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  Download,
  RefreshCw,
  Settings,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { CashflowChartCard } from '../../molecules/CashflowChartCard';
import DateRangePicker from '../../atoms/DateRangePicker';
import { StatusBadge } from '../../atoms/StatusBadge';
const FluxoSummaryPanel = ({
  // Dados financeiros
  cashflowData = [],
  periodComparison = null,
  // Período selecionado
  dateRange,
  onDateRangeChange,
  // Configurações de visualização
  chartViewMode = 'combined',
  // 'combined', 'bars', 'line'
  onChartViewModeChange,
  showPreviousPeriod = true,
  onShowPreviousPeriodChange,
  kpiLayout = 'grid',
  // 'grid', 'horizontal'
  onKpiLayoutChange,
  // Configurações de análise
  showTrendAnalysis = true,
  showProjections = false,
  onShowProjectionsChange,
  projectionDays = 30,
  onProjectionDaysChange,
  // Callbacks
  onExportData,
  onRefreshData,
  onOpenSettings,
  // Estados
  loading = false,
  error = null,
  // Configuração da interface
  compactMode = false,
  className = '',
}) => {
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [expandedSections, setExpandedSections] = useState(
    new Set(['overview', 'trends'])
  );

  // Cálculo de métricas principais
  const metrics = useMemo(() => {
    if (!cashflowData || cashflowData.length === 0) {
      return {
        totalReceitas: 0,
        totalDespesas: 0,
        saldoLiquido: 0,
        receitaMedia: 0,
        despesaMedia: 0,
        maiorReceita: 0,
        maiorDespesa: 0,
        diasPositivos: 0,
        diasNegativos: 0,
        tendenciaReceitas: 0,
        tendenciaDespesas: 0,
        tendenciaSaldo: 0,
        projecaoSaldo: 0,
        burnRate: 0,
        runwayDays: 0,
      };
    }
    const receitas = cashflowData.filter(
      item => item.tipo === 'receita' || item.inflows > 0
    );
    const despesas = cashflowData.filter(
      item => item.tipo === 'despesa' || item.outflows > 0
    );
    const totalReceitas = receitas.reduce(
      (sum, item) => sum + (item.inflows || item.valor || 0),
      0
    );
    const totalDespesas = despesas.reduce(
      (sum, item) => sum + Math.abs(item.outflows || item.valor || 0),
      0
    );
    const saldoLiquido = totalReceitas - totalDespesas;
    const receitaMedia =
      receitas.length > 0 ? totalReceitas / receitas.length : 0;
    const despesaMedia =
      despesas.length > 0 ? totalDespesas / despesas.length : 0;
    const maiorReceita = Math.max(
      ...receitas.map(r => r.inflows || r.valor || 0),
      0
    );
    const maiorDespesa = Math.max(
      ...despesas.map(d => Math.abs(d.outflows || d.valor || 0)),
      0
    );

    // Análise de tendências (últimos vs primeiros 50% do período)
    const midPoint = Math.floor(cashflowData.length / 2);
    const firstHalf = cashflowData.slice(0, midPoint);
    const secondHalf = cashflowData.slice(midPoint);
    const receitasPrimeira = firstHalf.reduce(
      (sum, item) => sum + (item.inflows || 0),
      0
    );
    const receitasSegunda = secondHalf.reduce(
      (sum, item) => sum + (item.inflows || 0),
      0
    );
    const tendenciaReceitas =
      receitasPrimeira > 0
        ? ((receitasSegunda - receitasPrimeira) / receitasPrimeira) * 100
        : 0;
    const despesasPrimeira = firstHalf.reduce(
      (sum, item) => sum + Math.abs(item.outflows || 0),
      0
    );
    const despesasSegunda = secondHalf.reduce(
      (sum, item) => sum + Math.abs(item.outflows || 0),
      0
    );
    const tendenciaDespesas =
      despesasPrimeira > 0
        ? ((despesasSegunda - despesasPrimeira) / despesasPrimeira) * 100
        : 0;
    const saldoPrimeiro = receitasPrimeira - despesasPrimeira;
    const saldoSegundo = receitasSegunda - despesasSegunda;
    const tendenciaSaldo =
      saldoPrimeiro !== 0
        ? ((saldoSegundo - saldoPrimeiro) / Math.abs(saldoPrimeiro)) * 100
        : 0;

    // Dias positivos e negativos
    const diasPositivos = cashflowData.filter(
      item => (item.balance || item.inflows - Math.abs(item.outflows)) > 0
    ).length;
    const diasNegativos = cashflowData.filter(
      item => (item.balance || item.inflows - Math.abs(item.outflows)) < 0
    ).length;

    // Burn rate e runway (baseado na média de despesas)
    const burnRate = despesaMedia;
    const runwayDays =
      saldoLiquido > 0 && burnRate > 0
        ? Math.floor(saldoLiquido / burnRate)
        : 0;

    // Projeção simples baseada na tendência
    const mediaReceitas = receitaMedia;
    const mediaDespesas = despesaMedia;
    const projecaoSaldo =
      saldoLiquido + projectionDays * (mediaReceitas - mediaDespesas);
    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      receitaMedia,
      despesaMedia,
      maiorReceita,
      maiorDespesa,
      diasPositivos,
      diasNegativos,
      tendenciaReceitas,
      tendenciaDespesas,
      tendenciaSaldo,
      projecaoSaldo,
      burnRate,
      runwayDays,
    };
  }, [cashflowData, projectionDays]);

  // Comparação com período anterior
  const periodComparisonMetrics = useMemo(() => {
    if (!periodComparison || !periodComparison.cashflowData) {
      return null;
    }
    const prevData = periodComparison.cashflowData;
    const prevReceitas = prevData.reduce(
      (sum, item) => sum + (item.inflows || 0),
      0
    );
    const prevDespesas = prevData.reduce(
      (sum, item) => sum + Math.abs(item.outflows || 0),
      0
    );
    const prevSaldo = prevReceitas - prevDespesas;
    const receitasVariacao =
      prevReceitas > 0
        ? ((metrics.totalReceitas - prevReceitas) / prevReceitas) * 100
        : 0;
    const despesasVariacao =
      prevDespesas > 0
        ? ((metrics.totalDespesas - prevDespesas) / prevDespesas) * 100
        : 0;
    const saldoVariacao =
      prevSaldo !== 0
        ? ((metrics.saldoLiquido - prevSaldo) / Math.abs(prevSaldo)) * 100
        : 0;
    return {
      receitasVariacao,
      despesasVariacao,
      saldoVariacao,
      prevReceitas,
      prevDespesas,
      prevSaldo,
    };
  }, [periodComparison, metrics]);

  // Formatação de valores
  const formatCurrency = useCallback(value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  }, []);
  const formatPercentage = useCallback((value, showSign = true) => {
    const formatted = `${Math.abs(value || 0).toFixed(1)}%`;
    if (!showSign) return formatted;
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  }, []);

  // Toggle seção expandida
  const toggleSection = useCallback(section => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Renderizar KPI card com Dark Mode
  const renderKPICard = useCallback(
    ({
      title,
      value,
      previousValue,
      variation,
      icon: Icon,
      colorClass = 'blue',
      format = 'currency',
      subtitle = null,
      trend = null,
    }) => {
      const isSelected = selectedKPI === title;
      const hasVariation = variation !== null && variation !== undefined;
      const isPositive = variation > 0;
      const isNegative = variation < 0;

      // Color classes mapping para dark mode
      const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green:
          'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        orange:
          'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      };
      return (
        <div
          className={`cursor-pointer rounded-lg border bg-white p-6 transition-all dark:bg-gray-800 ${isSelected ? 'border-blue-200 shadow-lg ring-2 ring-blue-500 dark:border-blue-700 dark:ring-blue-400' : 'border-gray-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600'} ${compactMode ? 'p-4' : ''}`}
          onClick={() => setSelectedKPI(isSelected ? null : title)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`rounded-lg p-2 ${colorClasses[colorClass] || colorClasses.blue}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={`${compactMode ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}
                >
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-xs">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {hasVariation && (
              <div
                className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {isPositive ? (
                  <ArrowUp className="mr-1 h-4 w-4" />
                ) : isNegative ? (
                  <ArrowDown className="mr-1 h-4 w-4" />
                ) : (
                  <Minus className="mr-1 h-4 w-4" />
                )}
                {formatPercentage(variation)}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div
              className={`${compactMode ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 dark:text-white`}
            >
              {format === 'currency'
                ? formatCurrency(value)
                : format === 'percentage'
                  ? formatPercentage(value, false)
                  : format === 'number'
                    ? Math.round(value).toLocaleString('pt-BR')
                    : value}
            </div>

            {previousValue !== null && previousValue !== undefined && (
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Período anterior:{' '}
                {format === 'currency'
                  ? formatCurrency(previousValue)
                  : previousValue}
              </div>
            )}

            {trend && (
              <div className="mt-2">
                <StatusBadge
                  status={
                    trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'
                  }
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      );
    },
    [selectedKPI, compactMode, formatCurrency, formatPercentage]
  );

  // Renderizar seção de KPIs com Dark Mode
  const renderKPISection = () => (
    <div className="card-theme rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="border-b border-light-border p-6 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Indicadores Principais
          </h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => toggleSection('overview')}
              className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary hover:text-theme-secondary hover:card-theme rounded-md p-2 transition-colors dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title={
                expandedSections.has('overview')
                  ? 'Ocultar seção'
                  : 'Expandir seção'
              }
            >
              {expandedSections.has('overview') ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expandedSections.has('overview') && (
        <div className="p-6">
          <div
            className={`grid ${kpiLayout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}
          >
            {renderKPICard({
              title: 'Total de Receitas',
              value: metrics.totalReceitas,
              previousValue: periodComparisonMetrics?.prevReceitas,
              variation: periodComparisonMetrics?.receitasVariacao,
              icon: TrendingUp,
              colorClass: 'green',
              subtitle: `Média: ${formatCurrency(metrics.receitaMedia)}`,
            })}

            {renderKPICard({
              title: 'Total de Despesas',
              value: metrics.totalDespesas,
              previousValue: periodComparisonMetrics?.prevDespesas,
              variation: periodComparisonMetrics?.despesasVariacao,
              icon: TrendingDown,
              colorClass: 'red',
              subtitle: `Média: ${formatCurrency(metrics.despesaMedia)}`,
            })}

            {renderKPICard({
              title: 'Saldo Líquido',
              value: metrics.saldoLiquido,
              previousValue: periodComparisonMetrics?.prevSaldo,
              variation: periodComparisonMetrics?.saldoVariacao,
              icon: DollarSign,
              colorClass: metrics.saldoLiquido >= 0 ? 'green' : 'red',
              trend: metrics.tendenciaSaldo,
            })}

            {renderKPICard({
              title: 'Taxa de Crescimento',
              value: metrics.tendenciaReceitas,
              icon: Target,
              colorClass: 'blue',
              format: 'percentage',
              subtitle: 'Receitas no período',
            })}

            {renderKPICard({
              title: 'Burn Rate',
              value: metrics.burnRate,
              icon: Activity,
              colorClass: 'orange',
              subtitle: `Runway: ${metrics.runwayDays} dias`,
            })}

            {showProjections &&
              renderKPICard({
                title: 'Projeção 30 dias',
                value: metrics.projecaoSaldo,
                icon: Calendar,
                colorClass: metrics.projecaoSaldo >= 0 ? 'green' : 'red',
                subtitle: 'Baseada na tendência atual',
              })}
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar seção de gráficos com Dark Mode
  const renderChartsSection = () => (
    <div className="card-theme rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="border-b border-light-border p-6 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Fluxo de Caixa
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={chartViewMode}
              onChange={e =>
                onChartViewModeChange && onChartViewModeChange(e.target.value)
              }
              className="card-theme text-theme-primary dark:text-dark-text-primary rounded-md border border-light-border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            >
              <option value="combined">Combinado</option>
              <option value="bars">Barras</option>
              <option value="line">Linha</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <CashflowChartCard
          data={cashflowData}
          viewMode={chartViewMode}
          showPreviousPeriod={showPreviousPeriod}
          previousPeriodData={periodComparison?.cashflowData}
          height={compactMode ? 300 : 400}
          onExport={onExportData}
        />
      </div>
    </div>
  );

  // Renderizar seção de análises com Dark Mode melhorado
  const renderAnalysisSection = () => (
    <div className="card-theme rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="border-b border-light-border p-6 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Análises e Tendências
          </h2>
          <button
            type="button"
            onClick={() => toggleSection('trends')}
            className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary hover:text-theme-secondary hover:card-theme rounded-md p-2 transition-colors dark:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title={
              expandedSections.has('trends')
                ? 'Ocultar seção'
                : 'Expandir seção'
            }
          >
            {expandedSections.has('trends') ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expandedSections.has('trends') && (
        <div className="space-y-6 p-6">
          {/* Análise de tendências com Dark Mode */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                  Tendência Receitas
                </h4>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatPercentage(metrics.tendenciaReceitas)}
              </div>
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                {metrics.tendenciaReceitas > 0
                  ? '📈 Crescimento'
                  : metrics.tendenciaReceitas < 0
                    ? '📉 Declínio'
                    : '➡️ Estável'}
              </p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Tendência Despesas
                </h4>
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-200">
                {formatPercentage(metrics.tendenciaDespesas)}
              </div>
              <p className="mt-2 text-sm text-red-700 dark:text-red-400">
                {metrics.tendenciaDespesas > 0
                  ? '📈 Aumento'
                  : metrics.tendenciaDespesas < 0
                    ? '📉 Redução'
                    : '➡️ Estável'}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Saldo Líquido
                </h4>
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatPercentage(metrics.tendenciaSaldo)}
              </div>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                {metrics.tendenciaSaldo > 0
                  ? '✅ Melhoria'
                  : metrics.tendenciaSaldo < 0
                    ? '⚠️ Deterioração'
                    : '➡️ Estável'}
              </p>
            </div>
          </div>

          {/* Estatísticas adicionais com Dark Mode */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-light-border bg-light-bg p-4 text-center transition-shadow hover:shadow-md dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700/50">
              <div className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {metrics.diasPositivos}
              </div>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Dias Positivos
              </div>
            </div>

            <div className="rounded-lg border border-light-border bg-light-bg p-4 text-center transition-shadow hover:shadow-md dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700/50">
              <div className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                {metrics.diasNegativos}
              </div>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Dias Negativos
              </div>
            </div>

            <div className="rounded-lg border border-light-border bg-light-bg p-4 text-center transition-shadow hover:shadow-md dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700/50">
              <div className="text-theme-primary dark:text-dark-text-primary text-xl font-bold">
                {formatCurrency(metrics.maiorReceita)}
              </div>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Maior Receita
              </div>
            </div>

            <div className="rounded-lg border border-light-border bg-light-bg p-4 text-center transition-shadow hover:shadow-md dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700/50">
              <div className="text-theme-primary dark:text-dark-text-primary text-xl font-bold">
                {formatCurrency(metrics.maiorDespesa)}
              </div>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
                Maior Despesa
              </div>
            </div>
          </div>

          {/* Alertas e recomendações com Dark Mode */}
          {metrics.runwayDays < 30 && metrics.runwayDays > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    ⚠️ Atenção: Runway Baixo
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    Com o burn rate atual, você tem apenas{' '}
                    <strong>{metrics.runwayDays} dias</strong> de runway.
                    Considere reduzir despesas ou aumentar receitas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Renderizar cabeçalho do painel com Dark Mode
  const renderPanelHeader = () => (
    <div className="card-theme border-b border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
            Resumo Financeiro
          </h1>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
            Análise completa do fluxo de caixa e indicadores financeiros
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-full sm:w-64"
          />

          <button
            type="button"
            onClick={() => onRefreshData && onRefreshData()}
            disabled={loading}
            className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary hover:card-theme rounded-md p-2 transition-colors disabled:opacity-50 dark:hover:bg-gray-700"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onExportData && (
            <button
              type="button"
              onClick={() => onExportData('full')}
              className="text-dark-text-primary flex items-center rounded-md bg-blue-600 px-4 py-2 shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => onOpenSettings()}
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted hover:text-theme-primary dark:hover:text-dark-text-primary hover:card-theme rounded-md p-2 transition-colors dark:hover:bg-gray-700"
              title="Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
  const containerClasses = `bg-gray-50 dark:bg-gray-900 min-h-full ${className}`;
  if (loading && (!cashflowData || cashflowData.length === 0)) {
    return (
      <div className={containerClasses}>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500 dark:text-blue-400" />
              <div className="absolute inset-0 mx-auto h-12 w-12 animate-ping rounded-full bg-blue-500/10 dark:bg-blue-400/10"></div>
            </div>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted font-medium">
              Carregando dados financeiros...
            </p>
            <p className="text-theme-secondary dark:text-theme-secondary mt-2 text-sm">
              Isso pode levar alguns segundos
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Melhor tratamento: apenas exibir erro se for um erro real, não falta de dados
  if (error && typeof error === 'string' && error.length > 0) {
    return (
      <div className={containerClasses}>
        <div className="flex h-96 items-center justify-center">
          <div className="mx-auto max-w-md p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
              Erro ao carregar dados
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-6">
              {error ||
                'Não foi possível carregar os dados financeiros. Verifique sua conexão e tente novamente.'}
            </p>
            <button
              type="button"
              onClick={() => onRefreshData && onRefreshData()}
              className="text-dark-text-primary inline-flex items-center rounded-md bg-blue-600 px-6 py-3 shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={containerClasses}>
      {/* Cabeçalho */}
      {renderPanelHeader()}

      {/* Conteúdo principal */}
      <div className="space-y-6 p-6">
        {/* KPIs */}
        {renderKPISection()}

        {/* Gráfico principal */}
        {renderChartsSection()}

        {/* Análises */}
        {showTrendAnalysis && renderAnalysisSection()}
      </div>
    </div>
  );
};
FluxoSummaryPanel.propTypes = {
  /**
   * Dados do fluxo de caixa
   */
  cashflowData: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      inflows: PropTypes.number,
      outflows: PropTypes.number,
      balance: PropTypes.number,
      tipo: PropTypes.string,
    })
  ),
  /**
   * Dados do período anterior para comparação
   */
  periodComparison: PropTypes.shape({
    cashflowData: PropTypes.array,
    label: PropTypes.string,
  }),
  /**
   * Range de datas
   */
  dateRange: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }),
  /**
   * Callback para mudança de período
   */
  onDateRangeChange: PropTypes.func,
  /**
   * Modo de visualização do gráfico
   */
  chartViewMode: PropTypes.oneOf(['combined', 'bars', 'line']),
  /**
   * Callback para mudança do modo do gráfico
   */
  onChartViewModeChange: PropTypes.func,
  /**
   * Mostrar período anterior
   */
  showPreviousPeriod: PropTypes.bool,
  /**
   * Layout dos KPIs
   */
  kpiLayout: PropTypes.oneOf(['grid', 'horizontal']),
  /**
   * Mostrar análise de tendências
   */
  showTrendAnalysis: PropTypes.bool,
  /**
   * Mostrar projeções
   */
  showProjections: PropTypes.bool,
  /**
   * Dias para projeção
   */
  projectionDays: PropTypes.number,
  /**
   * Callback para exportar dados
   */
  onExportData: PropTypes.func,
  /**
   * Callback para atualizar dados
   */
  onRefreshData: PropTypes.func,
  /**
   * Callback para abrir configurações
   */
  onOpenSettings: PropTypes.func,
  /**
   * Estado de carregamento
   */
  loading: PropTypes.bool,
  /**
   * Erro nos dados
   */
  error: PropTypes.string,
  /**
   * Modo compacto
   */
  compactMode: PropTypes.bool,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
};

// Componente de preview para demonstração
export const FluxoSummaryPanelPreview = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 2, 31),
  });
  const [chartViewMode, setChartViewMode] = useState('combined');
  const [showProjections, setShowProjections] = useState(false);

  // Mock data - usar useMemo para evitar Math.random em render
  const mockData = useMemo(() => {
    const data = [];
    const startDate = new Date(2024, 0, 1);
    for (let i = 0; i < 90; i++) {
      const date = addDays(startDate, i);
      const baseInflow = 1000 + Math.sin(i / 30) * 500;
      const baseOutflow = 800 + Math.cos(i / 20) * 300;
      const variance = (i * 7) % 400; // Usar função determinística

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        inflows: baseInflow + variance,
        outflows: baseOutflow + variance * 0.5,
        balance: baseInflow - baseOutflow + (variance - 200),
      });
    }
    return data;
  }, []);
  const mockPreviousPeriod = useMemo(
    () => ({
      cashflowData: mockData.map(item => ({
        ...item,
        inflows: item.inflows * 0.9,
        outflows: item.outflows * 0.85,
      })),
      label: 'Período anterior',
    }),
    [mockData]
  );
  const handleAction = (action, data) => {
    // eslint-disable-next-line no-console
    console.log(`Ação: ${action}`, data);
  };
  return (
    <div className="max-w-7xl space-y-6 p-4">
      <h3 className="text-lg font-semibold">FluxoSummaryPanel Preview</h3>

      {/* Painel completo */}
      <div className="h-screen">
        <FluxoSummaryPanel
          cashflowData={mockData}
          periodComparison={mockPreviousPeriod}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          chartViewMode={chartViewMode}
          onChartViewModeChange={setChartViewMode}
          showProjections={showProjections}
          onShowProjectionsChange={setShowProjections}
          showTrendAnalysis={true}
          onExportData={type => handleAction('Export Data', type)}
          onRefreshData={() => handleAction('Refresh Data')}
          onOpenSettings={() => handleAction('Open Settings')}
          onDrillDown={data => handleAction('Drill Down', data)}
        />
      </div>

      {/* Versão compacta */}
      <div className="h-96">
        <h4 className="text-md mb-2 font-medium">Modo compacto</h4>
        <FluxoSummaryPanel
          cashflowData={mockData.slice(0, 30)}
          compactMode={true}
          showTrendAnalysis={false}
          kpiLayout="horizontal"
        />
      </div>
    </div>
  );
};
export default FluxoSummaryPanel;
