/**
 * @file KPIDashboard.jsx
 * @description Dashboard de KPIs com dados reais das SQL views
 * @module RelatoriosPage/Components
 */

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

/**
 * Componente de card de KPI individual
 */
const KPICard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  format = 'currency',
  trend = null,
  status = null,
  testId,
}) => {
  const formatValue = (val, fmt) => {
    if (fmt === 'currency') return formatCurrency(val);
    if (fmt === 'percentage') return formatPercentage(val);
    if (fmt === 'number') return new Intl.NumberFormat('pt-BR').format(val);
    return val;
  };
  const getStatusIcon = () => {
    if (!status) return null;
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'good':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'attention':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="text-theme-secondary h-4 w-4" />;
    }
  };
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };
  return (
    <div
      className={`${bgColor} rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md dark:border-gray-700`}
      data-testid={testId}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm font-medium">
            {title}
          </p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="flex items-end justify-between">
        <p
          className={`text-2xl font-bold ${color}`}
          data-testid={`${testId}-value`}
        >
          {formatValue(value, format)}
        </p>

        {trend !== null && (
          <div
            className="flex items-center space-x-1"
            data-testid={`${testId}-trend`}
          >
            {getTrendIcon()}
            <span
              className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatPercentage(Math.abs(trend))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Componente principal de dashboard de KPIs
 */
const KPIDashboard = ({ kpis = [], loading = false }) => {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        data-testid="kpi-dashboard-loading"
      >
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface"
          >
            <div className="animate-pulse">
              <div className="mb-3 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (!kpis || kpis.length === 0) {
    return (
      <div
        className="card-theme rounded-lg border border-light-border p-8 text-center dark:border-dark-border dark:bg-dark-surface"
        data-testid="kpi-dashboard-empty"
      >
        <Activity className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-3 h-12 w-12" />
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
          Nenhum dado disponível
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Ajuste os filtros para visualizar os KPIs
        </p>
      </div>
    );
  }

  // Pegar primeiro KPI (ou consolidado)
  const kpi = kpis[0];
  const metrics = [
    {
      title: 'Receita Total',
      value: kpi.total_revenue || 0,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      format: 'currency',
      trend: kpi.revenue_growth_percent,
      status: kpi.performance_status,
      testId: 'kpi-total-revenue',
    },
    {
      title: 'Receita Recebida',
      value: kpi.received_revenue || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      format: 'currency',
      testId: 'kpi-received-revenue',
    },
    {
      title: 'Receita Pendente',
      value: kpi.pending_revenue || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      format: 'currency',
      testId: 'kpi-pending-revenue',
    },
    {
      title: 'Receita Vencida',
      value: kpi.overdue_revenue || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      format: 'currency',
      testId: 'kpi-overdue-revenue',
    },
    {
      title: 'Despesas Total',
      value: kpi.total_expenses || 0,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      format: 'currency',
      testId: 'kpi-total-expenses',
    },
    {
      title: 'Despesas Pagas',
      value: kpi.paid_expenses || 0,
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      format: 'currency',
      testId: 'kpi-paid-expenses',
    },
    {
      title: 'Lucro Líquido',
      value: kpi.net_profit || 0,
      icon: Target,
      color: kpi.net_profit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor:
        kpi.net_profit >= 0
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-red-50 dark:bg-red-900/20',
      format: 'currency',
      testId: 'kpi-net-profit',
    },
    {
      title: 'Margem de Lucro',
      value: kpi.profit_margin_percent || 0,
      icon: Activity,
      color:
        kpi.profit_margin_percent >= 0 ? 'text-purple-600' : 'text-red-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      format: 'percentage',
      status: kpi.performance_status,
      testId: 'kpi-profit-margin',
    },
  ];
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
      data-testid="kpi-dashboard"
    >
      {metrics.map((metric, index) => (
        <KPICard key={index} {...metric} />
      ))}
    </div>
  );
};
export default KPIDashboard;
