import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../utils/formatters';

/**
 * CommissionBadge - Badge de exibição de comissão
 *
 * Molecule que destaca valores de comissão com porcentagem e valor calculado.
 * Usado em itens de pedido e resumos financeiros.
 *
 * @component
 * @example
 * ```jsx
 * <CommissionBadge
 *   percentage={45}
 *   baseValue={100}
 *   showTooltip
 * />
 * ```
 */
const CommissionBadge = ({
  percentage,
  baseValue,
  showPercentage = true,
  showValue = true,
  showTooltip = false,
  size = 'md',
  variant = 'success',
  inline = false,
  className = '',
}) => {
  const calculatedValue = baseValue ? (baseValue * percentage) / 100 : 0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const variantClasses = {
    success:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    primary: 'bg-primary/10 text-primary border-primary/20',
    neutral:
      'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const tooltipText = `Comissão: ${percentage}% de ${formatCurrency(baseValue || 0)} = ${formatCurrency(calculatedValue)}`;

  const BadgeContent = () => (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-md border font-medium
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      title={showTooltip ? tooltipText : undefined}
      aria-label={tooltipText}
    >
      {/* Icon */}
      <svg
        className={iconSizes[size]}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>

      {/* Content */}
      {inline ? (
        <span>
          {showPercentage && <>{percentage}%</>}
          {showPercentage && showValue && ' • '}
          {showValue && <>{formatCurrency(calculatedValue)}</>}
        </span>
      ) : (
        <div className="flex flex-col items-start gap-0.5">
          {showPercentage && (
            <span className="leading-none">{percentage}%</span>
          )}
          {showValue && (
            <span
              className={`leading-none ${showPercentage ? 'opacity-80' : ''}`}
            >
              {formatCurrency(calculatedValue)}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative group inline-block">
        <BadgeContent />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
          {tooltipText}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  return <BadgeContent />;
};

CommissionBadge.propTypes = {
  /** Porcentagem de comissão */
  percentage: PropTypes.number.isRequired,
  /** Valor base para cálculo */
  baseValue: PropTypes.number,
  /** Se deve mostrar a porcentagem */
  showPercentage: PropTypes.bool,
  /** Se deve mostrar o valor calculado */
  showValue: PropTypes.bool,
  /** Se deve mostrar tooltip com detalhes */
  showTooltip: PropTypes.bool,
  /** Tamanho do badge */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Variante de cor */
  variant: PropTypes.oneOf(['success', 'primary', 'neutral']),
  /** Layout inline (porcentagem e valor na mesma linha) */
  inline: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default CommissionBadge;
