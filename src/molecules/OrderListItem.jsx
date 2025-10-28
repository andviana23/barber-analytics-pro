import React from 'react';
import PropTypes from 'prop-types';
import { StatusBadge } from '../atoms/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * OrderListItem - Item de lista de comandas
 *
 * Molecule que representa uma comanda na listagem.
 * Exibe informações resumidas e permite navegação para detalhes.
 *
 * @component
 * @example
 * ```jsx
 * <OrderListItem
 *   order={order}
 *   onClick={handleViewDetails}
 *   selected={selectedOrderId === order.id}
 * />
 * ```
 */
const OrderListItem = ({
  order,
  onClick,
  selected = false,
  showProfessional = true,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) onClick(order);
  };

  const getStatusConfig = status => {
    const configs = {
      open: { status: 'warning', text: 'Aberta', icon: 'clock' },
      closed: { status: 'success', text: 'Fechada', icon: 'check' },
      cancelled: { status: 'error', text: 'Cancelada', icon: 'x' },
    };
    return configs[status] || configs.open;
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div
      className={`
        group relative p-4 rounded-lg border transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''}
        ${
          selected
            ? 'bg-primary/5 border-primary shadow-md'
            : 'bg-white dark:bg-dark-surface border-light-border dark:border-dark-border hover:bg-light-surface/50 dark:hover:bg-dark-hover'
        }
        ${className}
      `}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Comanda ${order.order_number} - ${order.client_name || 'Cliente não informado'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Número da comanda */}
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
            #{order.order_number}
          </div>

          {/* Informações principais */}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-theme-primary truncate">
              {order.client_name || 'Cliente não informado'}
            </h3>
            <p className="text-sm text-theme-secondary">
              {formatDateTime(order.created_at, 'short')}
            </p>
          </div>
        </div>

        {/* Status */}
        <StatusBadge
          status={statusConfig.status}
          text={statusConfig.text}
          size="sm"
        />
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        {/* Profissional */}
        {showProfessional && order.professional_name && (
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-theme-secondary flex-shrink-0"
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
              title={order.professional_name}
            >
              {order.professional_name}
            </span>
          </div>
        )}

        {/* Quantidade de serviços */}
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="w-4 h-4 text-theme-secondary flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-theme-secondary">
            {order.items_count || 0}{' '}
            {order.items_count === 1 ? 'serviço' : 'serviços'}
          </span>
        </div>

        {/* Total */}
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="w-4 h-4 text-theme-secondary flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold text-theme-primary">
            {formatCurrency(order.total_amount || 0)}
          </span>
        </div>
      </div>

      {/* Observações (se houver) */}
      {order.observations && (
        <div className="pt-3 border-t border-light-border dark:border-dark-border">
          <p
            className="text-sm text-theme-secondary italic line-clamp-2"
            title={order.observations}
          >
            {order.observations}
          </p>
        </div>
      )}

      {/* Indicador visual de seleção */}
      {selected && (
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary animate-pulse" />
      )}

      {/* Seta de navegação (hover) */}
      {onClick && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

OrderListItem.propTypes = {
  /** Dados da comanda */
  order: PropTypes.shape({
    id: PropTypes.string,
    order_number: PropTypes.number.isRequired,
    client_name: PropTypes.string,
    professional_name: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed', 'cancelled']).isRequired,
    total_amount: PropTypes.number,
    items_count: PropTypes.number,
    observations: PropTypes.string,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  /** Callback ao clicar no item */
  onClick: PropTypes.func,
  /** Se o item está selecionado */
  selected: PropTypes.bool,
  /** Se deve mostrar o nome do profissional */
  showProfessional: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default OrderListItem;
