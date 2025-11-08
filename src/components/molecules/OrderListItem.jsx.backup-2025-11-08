/**
 * @file OrderListItem.jsx
 * @description Componente Molecule - Item de lista de comandas
 * @module Components/Molecules
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  User,
  Scissors,
  DollarSign,
  Calendar,
  MoreVertical,
} from 'lucide-react';
import { StatusBadge } from '../../atoms/StatusBadge';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

/**
 * Item de lista de comanda com informações principais
 * Segue padrões do Design System
 */
const OrderListItem = ({
  order,
  onClick,
  onClose,
  onCancel,
  canClose = false,
  canCancel = false,
  className = '',
}) => {
  const isOpen = order.status === 'open';
  const isClosed = order.status === 'closed';
  const isCanceled =
    order.status === 'canceled' || order.status === 'cancelled';
  const handleClick = () => {
    if (onClick) {
      onClick(order);
    }
  };
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };
  return (
    <div
      className={`card-theme group p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''} ${className} `}
      onClick={handleClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="text-theme-primary text-base font-semibold">
              Comanda #{order.id?.slice(0, 8) || 'N/A'}
            </h4>
            <StatusBadge status={order.status} size="sm" />
          </div>
          <p className="text-theme-muted text-xs">
            {formatDateTime(new Date(order.created_at))}
          </p>
        </div>

        {/* Menu de ações */}
        {(canClose || canCancel) && isOpen && (
          <div className="relative">
            <button
              className="hover:card-theme rounded-lg p-2 transition-colors dark:hover:bg-dark-surface"
              onClick={e => e.stopPropagation()}
              aria-label="Ações"
            >
              <MoreVertical size={18} className="text-theme-muted" />
            </button>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Cliente */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <User size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-theme-muted text-xs">Cliente</p>
            <p className="text-theme-primary truncate text-sm font-medium">
              {order.client?.name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Profissional */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Scissors
              size={16}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-theme-muted text-xs">Profissional</p>
            <p className="text-theme-primary truncate text-sm font-medium">
              {order.professional?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Total e Itens */}
      <div className="border-theme-border flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2">
          <DollarSign
            size={18}
            className="text-green-600 dark:text-green-400"
          />
          <div>
            <p className="text-theme-muted text-xs">Total</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(order.total_amount || 0)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-theme-muted text-xs">Serviços</p>
          <p className="text-theme-primary text-sm font-semibold">
            {order.items?.length || 0}{' '}
            {order.items?.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>

      {/* Data de Fechamento */}
      {isClosed && order.closed_at && (
        <div className="border-theme-border mt-3 border-t pt-3">
          <div className="text-theme-muted flex items-center gap-2 text-xs">
            <Calendar size={14} />
            <span>Fechado em {formatDateTime(new Date(order.closed_at))}</span>
          </div>
        </div>
      )}

      {/* Motivo de Cancelamento */}
      {isCanceled && order.cancel_reason && (
        <div className="border-theme-border mt-3 border-t pt-3">
          <p className="mb-1 text-xs font-medium text-red-600 dark:text-red-400">
            Motivo do cancelamento:
          </p>
          <p className="text-theme-muted text-sm italic">
            {order.cancel_reason}
          </p>
        </div>
      )}

      {/* Ações */}
      {isOpen && (canClose || canCancel) && (
        <div className="mt-4 flex gap-2">
          {canClose && onClose && (
            <button
              onClick={e => handleActionClick(e, () => onClose(order))}
              className="btn-theme-primary flex-1 py-2 text-sm"
            >
              Fechar Comanda
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={e => handleActionClick(e, () => onCancel(order))}
              className="btn-theme-danger px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
OrderListItem.propTypes = {
  /** Dados da comanda */
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['open', 'closed', 'canceled', 'cancelled'])
      .isRequired,
    total_amount: PropTypes.number,
    created_at: PropTypes.string.isRequired,
    closed_at: PropTypes.string,
    cancel_reason: PropTypes.string,
    client: PropTypes.shape({
      name: PropTypes.string,
    }),
    professional: PropTypes.shape({
      name: PropTypes.string,
    }),
    items: PropTypes.array,
  }).isRequired,
  /** Callback ao clicar no item */
  onClick: PropTypes.func,
  /** Callback para fechar comanda */
  onClose: PropTypes.func,
  /** Callback para cancelar comanda */
  onCancel: PropTypes.func,
  /** Se usuário pode fechar */
  canClose: PropTypes.bool,
  /** Se usuário pode cancelar */
  canCancel: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default OrderListItem;
