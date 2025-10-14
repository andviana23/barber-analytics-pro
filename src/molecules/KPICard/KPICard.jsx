import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Componente de card para exibir KPIs
 * @param {object} props 
 * @param {string} props.title - Título do KPI
 * @param {string|number} props.value - Valor principal
 * @param {string} props.subtitle - Subtítulo opcional
 * @param {number} props.change - Percentual de mudança
 * @param {string} props.trend - Tendência: 'up', 'down' ou 'neutral'
 * @param {React.Component} props.icon - Ícone do card
 * @param {string} props.color - Cor do tema
 * @param {boolean} props.loading - Estado de carregamento
 */
const KPICard = ({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'text-blue-600',
  loading = false
}) => {
  const formatValue = (val) => {
    if (loading) return '---';
    if (typeof val === 'number') {
      if (title?.toLowerCase().includes('receita') || 
          title?.toLowerCase().includes('faturamento') ||
          title?.toLowerCase().includes('lucro') ||
          title?.toLowerCase().includes('ticket')) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      }
      if (title?.toLowerCase().includes('margem') ||
          title?.toLowerCase().includes('%')) {
        return `${val.toFixed(1)}%`;
      }
      return val.toLocaleString('pt-BR');
    }
    return val;
  };

  const formatChange = (val) => {
    if (!val || loading) return null;
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const getTrendColor = () => {
    if (loading || !change) return 'text-gray-500';
    if (trend === 'up' || change > 0) return 'text-green-600';
    if (trend === 'down' || change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const renderTrendIcon = () => {
    if (loading || !change) return null;
    if (trend === 'up' || change > 0) return <TrendingUp className="h-4 w-4" />;
    if (trend === 'down' || change < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
            <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${color}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {change !== undefined && (
          <span className={`text-sm font-medium flex items-center gap-1 ${getTrendColor()}`}>
            {renderTrendIcon()}
            {formatChange(change)}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {title}
        </p>
        <p className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default KPICard;