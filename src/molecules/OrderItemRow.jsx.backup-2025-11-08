import React from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../utils/formatters';

/**
 * OrderItemRow - Linha de item de comanda
 *
 * Molecule que representa um item/serviço dentro de uma comanda.
 * Usado em tabelas de itens com informações de serviço, profissional, comissão, etc.
 *
 * @component
 * @example
 * ```jsx
 * <OrderItemRow
 *   item={item}
 *   onRemove={handleRemove}
 *   editable={order.status === 'open'}
 * />
 * ```
 */
const OrderItemRow = ({
  item,
  onRemove,
  editable = false,
  showCommission = true,
  compact = false,
  className = '',
}) => {
  const handleRemove = () => {
    if (onRemove && editable) {
      onRemove(item);
    }
  };
  const calculateCommission = () => {
    if (!item.commission_percentage || !item.price) return 0;
    return (item.price * item.commission_percentage) / 100;
  };
  const commission = calculateCommission();
  return (
    <div
      className={`grid items-center gap-3 border-b border-light-border px-4 py-3 transition-colors hover:bg-light-surface/30 dark:border-dark-border dark:hover:bg-dark-hover/30 ${compact ? 'text-sm' : ''} ${className} `}
      style={{
        gridTemplateColumns: showCommission
          ? 'minmax(150px, 2fr) minmax(120px, 1.5fr) 80px 100px 100px 100px 40px'
          : 'minmax(150px, 2fr) minmax(120px, 1.5fr) 80px 100px 40px',
      }}
    >
      {/* Serviço */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
          <svg
            className="h-4 w-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-theme-primary truncate font-medium"
            title={item.service_name}
          >
            {item.service_name}
          </p>
          {item.duration_minutes && (
            <p className="text-theme-secondary text-xs">
              {item.duration_minutes >= 60
                ? `${Math.floor(item.duration_minutes / 60)}h ${item.duration_minutes % 60}min`
                : `${item.duration_minutes} min`}
            </p>
          )}
        </div>
      </div>

      {/* Profissional */}
      <div className="flex min-w-0 items-center gap-2">
        <svg
          className="text-theme-secondary h-4 w-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span
          className="text-theme-secondary truncate"
          title={item.professional_name}
        >
          {item.professional_name || 'Não atribuído'}
        </span>
      </div>

      {/* Quantidade */}
      <div className="text-center">
        <span className="card-theme text-theme-primary inline-flex h-10 w-10 items-center justify-center rounded-md font-medium">
          {item.quantity || 1}
        </span>
      </div>

      {/* Preço unitário */}
      <div className="text-theme-primary text-right font-medium">
        {formatCurrency(item.price)}
      </div>

      {/* Comissão (opcional) */}
      {showCommission && (
        <div className="text-right">
          <div className="text-theme-secondary mb-0.5 text-xs">
            {item.commission_percentage}%
          </div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(commission)}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="text-theme-primary text-right font-semibold">
        {formatCurrency((item.price || 0) * (item.quantity || 1))}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-end">
        {editable && onRemove ? (
          <button
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            aria-label="Remover item"
            title="Remover item"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </div>
  );
};
OrderItemRow.propTypes = {
  /** Dados do item */
  item: PropTypes.shape({
    id: PropTypes.string,
    service_name: PropTypes.string.isRequired,
    professional_name: PropTypes.string,
    price: PropTypes.number.isRequired,
    quantity: PropTypes.number,
    commission_percentage: PropTypes.number,
    duration_minutes: PropTypes.number,
  }).isRequired,
  /** Callback para remover item */
  onRemove: PropTypes.func,
  /** Se o item pode ser editado/removido */
  editable: PropTypes.bool,
  /** Se deve mostrar coluna de comissão */
  showCommission: PropTypes.bool,
  /** Modo compacto (texto menor) */
  compact: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default OrderItemRow;
