/**
 * KPI CARD COMPONENT
 *
 * Componente atom para exibição de indicadores-chave de performance.
 * Segue os padrões Atomic Design e Design System.
 */

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * Utilitários para formatação
 */
const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

const formatPercentage = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format((value || 0) / 100);
};

const formatNumber = value => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};

/**
 * Componente KPICard
 */
const KPICard = ({
  title,
  value,
  type = 'currency', // currency, percentage, number, custom
  trend = null, // positive, negative, neutral, null
  trendValue = null,
  subtitle = null,
  icon: IconComponent = null,
  size = 'medium', // small, medium, large
  variant = 'default', // default, primary, success, warning, danger
  loading = false,
  onClick = null,
  className = '',
  ...props
}) => {
  /**
   * Formatação do valor principal
   */
  const getFormattedValue = () => {
    if (loading) return '---';

    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'custom':
        return value;
      default:
        return value;
    }
  };

  /**
   * Ícone e cor da tendência
   */
  const getTrendConfig = () => {
    if (!trend || trendValue === null || trendValue === undefined) {
      return { icon: null, color: '', text: '' };
    }

    const formattedTrendValue =
      type === 'percentage'
        ? formatPercentage(trendValue)
        : Math.abs(trendValue).toFixed(1);

    switch (trend) {
      case 'positive':
        return {
          icon: TrendingUp,
          color: 'text-feedback-light-success dark:text-feedback-dark-success',
          text: `+${formattedTrendValue}`,
        };
      case 'negative':
        return {
          icon: TrendingDown,
          color: 'text-feedback-light-error dark:text-feedback-dark-error',
          text: `-${formattedTrendValue}`,
        };
      case 'neutral':
        return {
          icon: Minus,
          color: 'text-theme-secondary',
          text: `${formattedTrendValue}`,
        };
      default:
        return { icon: null, color: '', text: '' };
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
          value: 'text-lg font-bold',
          title: 'text-xs font-medium',
          subtitle: 'text-xs',
          trend: 'text-xs',
          icon: 'h-4 w-4',
          trendIcon: 'h-3 w-3',
        };
      case 'large':
        return {
          container: 'p-8',
          value: 'text-4xl font-bold',
          title: 'text-base font-semibold',
          subtitle: 'text-sm',
          trend: 'text-sm',
          icon: 'h-8 w-8',
          trendIcon: 'h-5 w-5',
        };
      case 'medium':
      default:
        return {
          container: 'p-6',
          value: 'text-2xl font-bold',
          title: 'text-sm font-medium',
          subtitle: 'text-sm',
          trend: 'text-sm',
          icon: 'h-6 w-6',
          trendIcon: 'h-4 w-4',
        };
    }
  };

  /**
   * Classes CSS baseadas na variante
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary/20 bg-primary/5';
      case 'success':
        return 'border-feedback-light-success/20 bg-feedback-light-success/5 dark:border-feedback-dark-success/20 dark:bg-feedback-dark-success/5';
      case 'warning':
        return 'border-feedback-light-warning/20 bg-feedback-light-warning/5 dark:border-feedback-dark-warning/20 dark:bg-feedback-dark-warning/5';
      case 'danger':
        return 'border-feedback-light-error/20 bg-feedback-light-error/5 dark:border-feedback-dark-error/20 dark:bg-feedback-dark-error/5';
      case 'default':
      default:
        return 'card-theme';
    }
  };

  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const trendConfig = getTrendConfig();
  const TrendIcon = trendConfig.icon;

  const cardClasses = `
    ${variantClasses}
    ${sizeClasses.container}
    rounded-xl border transition-all duration-200
    ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
    ${loading ? 'animate-pulse' : ''}
    ${className}
  `.trim();

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Header com ícone e tendência */}
      <div className="mb-4 flex items-center justify-between">
        {/* Ícone principal */}
        {IconComponent && (
          <div className="rounded-lg bg-light-bg p-2 dark:bg-dark-hover">
            <IconComponent className={`${sizeClasses.icon} text-primary`} />
          </div>
        )}

        {/* Tendência */}
        {TrendIcon && (
          <div className={`flex items-center space-x-1 ${trendConfig.color}`}>
            <TrendIcon className={sizeClasses.trendIcon} />
            <span className={`font-medium ${sizeClasses.trend}`}>
              {trendConfig.text}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div>
        {/* Título */}
        <p
          className={`text-theme-secondary mb-1 uppercase tracking-wide ${sizeClasses.title}`}
        >
          {title}
        </p>

        {/* Valor principal */}
        <p className={`text-theme-primary ${sizeClasses.value}`}>
          {getFormattedValue()}
        </p>

        {/* Subtítulo */}
        {subtitle && (
          <p className={`text-theme-secondary mt-1 ${sizeClasses.subtitle}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-light-surface/80 dark:bg-dark-surface/80">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default KPICard;
