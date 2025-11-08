/**
 * 📊 FluxoCaixaKPIs Component
 *
 * @component
 * @description Cards de KPIs do fluxo de caixa com Design System
 *
 * Features:
 * - 4 cards principais: Total Entradas, Total Saídas, Lucro Líquido, Saldo Final
 * - Ícones temáticos (TrendingUp, TrendingDown, DollarSign, Wallet)
 * - Cores semânticas (verde para positivo, vermelho para negativo)
 * - Dark mode automático
 * - Responsivo (grid adaptativo)
 * - Loading skeleton
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

/**
 * @param {Object} props
 * @param {Object} props.summary - Resumo do fluxo de caixa
 * @param {number} props.summary.totalEntries - Total de entradas
 * @param {number} props.summary.totalExits - Total de saídas
 * @param {number} props.summary.netProfit - Lucro líquido
 * @param {number} props.summary.finalBalance - Saldo final
 * @param {number} props.summary.profitMargin - Margem de lucro (%)
 * @param {boolean} props.loading - Estado de carregamento
 */
export function FluxoCaixaKPIs({ summary, loading = false }) {
  if (loading) {
    return <FluxoCaixaKPIsLoading />;
  }

  if (!summary) {
    return null;
  }

  const kpis = [
    {
      id: 'entries',
      title: 'Total de Entradas',
      value: summary.totalEntries,
      icon: TrendingUp,
      colorClass: 'text-feedback-light-success dark:text-feedback-dark-success',
      bgClass: 'bg-feedback-light-success/10 dark:bg-feedback-dark-success/20',
      trend: null,
    },
    {
      id: 'exits',
      title: 'Total de Saídas',
      value: summary.totalExits,
      icon: TrendingDown,
      colorClass: 'text-feedback-light-error dark:text-feedback-dark-error',
      bgClass: 'bg-feedback-light-error/10 dark:bg-feedback-dark-error/20',
      trend: null,
    },
    {
      id: 'profit',
      title: 'Lucro Líquido',
      value: summary.netProfit,
      icon: DollarSign,
      colorClass:
        summary.netProfit >= 0
          ? 'text-feedback-light-success dark:text-feedback-dark-success'
          : 'text-feedback-light-error dark:text-feedback-dark-error',
      bgClass:
        summary.netProfit >= 0
          ? 'bg-feedback-light-success/10 dark:bg-feedback-dark-success/20'
          : 'bg-feedback-light-error/10 dark:bg-feedback-dark-error/20',
      trend: summary.profitMargin,
    },
    {
      id: 'balance',
      title: 'Saldo Final',
      value: summary.finalBalance,
      icon: Wallet,
      colorClass:
        summary.finalBalance >= 0
          ? 'text-primary'
          : 'text-feedback-light-error dark:text-feedback-dark-error',
      bgClass:
        summary.finalBalance >= 0
          ? 'bg-primary/10 dark:bg-primary/20'
          : 'bg-feedback-light-error/10 dark:bg-feedback-dark-error/20',
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map(kpi => (
        <KPICard key={kpi.id} {...kpi} />
      ))}
    </div>
  );
}

/**
 * Card individual de KPI
 */
function KPICard({ title, value, icon: Icon, colorClass, bgClass, trend }) {
  return (
    <div className="card-theme rounded-xl border p-6 transition-shadow hover:shadow-lg">
      {/* Header - Ícone e Trend */}
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-lg p-2 ${bgClass}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
        {trend !== null && (
          <span
            className={`text-sm font-medium ${
              trend >= 0
                ? 'text-feedback-light-success dark:text-feedback-dark-success'
                : 'text-feedback-light-error dark:text-feedback-dark-error'
            }`}
          >
            {trend >= 0 ? '+' : ''}
            {trend.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Título */}
      <p className="text-theme-secondary mb-1 text-sm font-medium">{title}</p>

      {/* Valor */}
      <p className={`text-2xl font-bold ${colorClass}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

/**
 * Loading skeleton para KPIs
 */
function FluxoCaixaKPIsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card-theme animate-pulse rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-9 w-9 rounded-lg bg-light-hover dark:bg-dark-hover" />
            <div className="h-5 w-16 rounded bg-light-hover dark:bg-dark-hover" />
          </div>
          <div className="mb-2 h-4 w-32 rounded bg-light-hover dark:bg-dark-hover" />
          <div className="h-8 w-24 rounded bg-light-hover dark:bg-dark-hover" />
        </div>
      ))}
    </div>
  );
}

export default FluxoCaixaKPIs;
