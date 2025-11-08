/**
 * METRIC CARD COMPONENT
 *
 * Componente molecule para exibição de métricas comparativas entre unidades.
 * Segue os padrões Atomic Design e Design System.
 */

import { MoreVertical } from 'lucide-react';

/**
 * Utilitários para formatação
 */
const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

const formatNumber = value => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const formatPercentage = value => {
  return `${(value || 0).toFixed(1)}%`;
};

/**
 * Componente MetricCard
 */
const MetricCard = ({
  title,
  subtitle = null,
  metrics = [], // Array de { label, value, type, trend }
  headerAction = null,
  size = 'medium', // small, medium, large
  variant = 'default', // default, highlighted
  loading = false,
  className = '',
  ...props
}) => {
  /**
   * Formatação de valor baseada no tipo
   */
  const formatValue = (value, type = 'number') => {
    if (loading) return '---';

    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      default:
        return value;
    }
  };

  /**
   * Classes CSS baseadas no tamanho
   */
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-4',
          title: 'text-sm font-semibold',
          subtitle: 'text-xs',
          metric: 'py-2',
          label: 'text-xs',
          value: 'text-sm font-medium',
        };
      case 'large':
        return {
          container: 'p-8',
          title: 'text-xl font-bold',
          subtitle: 'text-base',
          metric: 'py-4',
          label: 'text-base',
          value: 'text-lg font-semibold',
        };
      case 'medium':
      default:
        return {
          container: 'p-6',
          title: 'text-lg font-semibold',
          subtitle: 'text-sm',
          metric: 'py-3',
          label: 'text-sm',
          value: 'text-base font-medium',
        };
    }
  };

  /**
   * Classes CSS baseadas na variante
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'highlighted':
        return 'card-theme border-primary/30 bg-primary/5';
      case 'default':
      default:
        return 'card-theme';
    }
  };

  /**
   * Cor da tendência
   */
  const getTrendColor = trend => {
    if (!trend) return '';

    if (trend > 0)
      return 'text-feedback-light-success dark:text-feedback-dark-success';
    if (trend < 0)
      return 'text-feedback-light-error dark:text-feedback-dark-error';
    return 'text-theme-secondary';
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();

  const cardClasses = `
    ${variantClasses}
    ${sizeClasses.container}
    rounded-xl border transition-shadow hover:shadow-lg
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  return (
    <div className={cardClasses} {...props}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className={`text-theme-primary ${sizeClasses.title}`}>{title}</h3>
          {subtitle && (
            <p className={`text-theme-secondary mt-1 ${sizeClasses.subtitle}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Action button */}
        {headerAction ? (
          <div>{headerAction}</div>
        ) : (
          <button className="text-theme-secondary hover:text-theme-primary transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Métricas */}
      <div className="space-y-1">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`flex items-center justify-between ${sizeClasses.metric} ${
              index < metrics.length - 1
                ? 'border-b border-light-border dark:border-dark-border'
                : ''
            }`}
          >
            {/* Label da métrica */}
            <span className={`text-theme-secondary ${sizeClasses.label}`}>
              {metric.label}
            </span>

            {/* Valor e tendência */}
            <div className="flex items-center space-x-2">
              <span className={`text-theme-primary ${sizeClasses.value}`}>
                {formatValue(metric.value, metric.type)}
              </span>

              {/* Indicador de tendência */}
              {metric.trend !== undefined && metric.trend !== null && (
                <span
                  className={`text-xs font-medium ${getTrendColor(metric.trend)}`}
                >
                  {metric.trend > 0 ? '+' : ''}
                  {metric.trend.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {metrics.length === 0 && !loading && (
        <div className="py-8 text-center">
          <p className="text-theme-secondary text-sm">
            Nenhuma métrica disponível
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 w-1/3 rounded bg-light-bg dark:bg-dark-bg"></div>
              <div className="h-4 w-1/4 rounded bg-light-bg dark:bg-dark-bg"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
