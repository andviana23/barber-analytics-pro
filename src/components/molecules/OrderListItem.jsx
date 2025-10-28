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
      className={`
        group
        card-theme
        p-4
        transition-all
        duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01]' : ''}
        ${className}
      `}
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
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-theme-primary">
              Comanda #{order.id?.slice(0, 8) || 'N/A'}
            </h4>
            <StatusBadge status={order.status} size="sm" />
          </div>
          <p className="text-xs text-theme-muted">
            {formatDateTime(new Date(order.created_at))}
          </p>
        </div>

        {/* Menu de ações */}
        {(canClose || canCancel) && isOpen && (
          <div className="relative">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={e => e.stopPropagation()}
              aria-label="Ações"
            >
              <MoreVertical size={18} className="text-theme-muted" />
            </button>
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Cliente */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-theme-muted">Cliente</p>
            <p className="text-sm font-medium text-theme-primary truncate">
              {order.client?.name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Profissional */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <Scissors
              size={16}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-theme-muted">Profissional</p>
            <p className="text-sm font-medium text-theme-primary truncate">
              {order.professional?.name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Total e Itens */}
      <div className="flex items-center justify-between pt-3 border-t border-theme-border">
        <div className="flex items-center gap-2">
          <DollarSign
            size={18}
            className="text-green-600 dark:text-green-400"
          />
          <div>
            <p className="text-xs text-theme-muted">Total</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(order.total_amount || 0)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-theme-muted">Serviços</p>
          <p className="text-sm font-semibold text-theme-primary">
            {order.items?.length || 0}{' '}
            {order.items?.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>

      {/* Data de Fechamento */}
      {isClosed && order.closed_at && (
        <div className="mt-3 pt-3 border-t border-theme-border">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <Calendar size={14} />
            <span>Fechado em {formatDateTime(new Date(order.closed_at))}</span>
          </div>
        </div>
      )}

      {/* Motivo de Cancelamento */}
      {isCanceled && order.cancel_reason && (
        <div className="mt-3 pt-3 border-t border-theme-border">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            Motivo do cancelamento:
          </p>
          <p className="text-sm text-theme-muted italic">
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
              className="btn-theme-primary flex-1 text-sm py-2"
            >
              Fechar Comanda
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={e => handleActionClick(e, () => onCancel(order))}
              className="btn-theme-danger text-sm py-2 px-4"
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
