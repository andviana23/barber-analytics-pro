/**
 * @file OrderItemsTable.jsx
 * @description Componente Organism - Tabela de itens da comanda
 * @module Components/Organisms
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Trash2, User } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { formatCurrency } from '../../utils/formatters';

/**
 * Tabela completa de itens da comanda com totais
 * Segue padrões do Design System
 */
const OrderItemsTable = ({
  items = [],
  onRemoveItem,
  canEdit = false,
  showCommission = true,
  className = '',
}) => {
  // Calcula totais
  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + (item.unit_price || 0) * (item.quantity || 1),
      commission:
        acc.commission +
        ((item.unit_price || 0) *
          (item.quantity || 1) *
          (item.commission_percentage || 0)) /
          100,
      quantity: acc.quantity + (item.quantity || 1),
    }),
    { subtotal: 0, commission: 0, quantity: 0 }
  );

  if (items.length === 0) {
    return (
      <div className="card-theme p-8 text-center">
        <p className="text-theme-muted">Nenhum serviço adicionado</p>
      </div>
    );
  }

  return (
    <div className={`card-theme overflow-hidden ${className}`}>
      {/* Tabela Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-theme-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Serviço
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Profissional
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Qtd
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Preço Unit.
              </th>
              {showCommission && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Comissão
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold text-theme-muted uppercase tracking-wider">
                Total
              </th>
              {canEdit && onRemoveItem && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-theme-muted uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {items.map(item => {
              const itemTotal = (item.unit_price || 0) * (item.quantity || 1);
              const itemCommission =
                (itemTotal * (item.commission_percentage || 0)) / 100;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-theme-primary">
                      {item.service?.name || 'Serviço'}
                    </p>
                    {item.service?.duration_minutes && (
                      <p className="text-xs text-theme-muted">
                        {item.service.duration_minutes} min
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-theme-muted" />
                      <span className="text-sm text-theme-primary">
                        {item.professional?.name || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-theme-primary">
                      {item.quantity || 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-theme-primary">
                      {formatCurrency(item.unit_price || 0)}
                    </span>
                  </td>
                  {showCommission && (
                    <td className="px-4 py-3 text-right">
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {formatCurrency(itemCommission)}
                        </p>
                        <p className="text-xs text-theme-muted">
                          {item.commission_percentage || 0}%
                        </p>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-theme-primary">
                      {formatCurrency(itemTotal)}
                    </span>
                  </td>
                  {canEdit && onRemoveItem && (
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Remover item"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden divide-y divide-theme-border">
        {items.map(item => {
          const itemTotal = (item.unit_price || 0) * (item.quantity || 1);
          const itemCommission =
            (itemTotal * (item.commission_percentage || 0)) / 100;

          return (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-theme-primary truncate">
                    {item.service?.name || 'Serviço'}
                  </h4>
                  <p className="text-xs text-theme-muted mt-1">
                    {item.professional?.name || 'N/A'}
                  </p>
                </div>
                {canEdit && onRemoveItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item)}
                    className="text-red-600 hover:text-red-700 flex-shrink-0 ml-2"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-theme-muted">Quantidade:</span>
                  <span className="ml-1 font-semibold text-theme-primary">
                    {item.quantity || 1}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-theme-muted">Preço Unit.:</span>
                  <span className="ml-1 font-semibold text-theme-primary">
                    {formatCurrency(item.unit_price || 0)}
                  </span>
                </div>
                {showCommission && (
                  <>
                    <div>
                      <span className="text-theme-muted">Comissão:</span>
                      <span className="ml-1 font-semibold text-purple-600 dark:text-purple-400">
                        {item.commission_percentage || 0}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(itemCommission)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-theme-border flex items-center justify-between">
                <span className="text-xs font-medium text-theme-muted">
                  Total:
                </span>
                <span className="text-base font-bold text-theme-primary">
                  {formatCurrency(itemTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer com Totais */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-theme-border p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-muted">
              Total de Serviços:
            </span>
            <span className="text-sm font-semibold text-theme-primary">
              {totals.quantity} {totals.quantity === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {showCommission && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-theme-muted">
                Total em Comissões:
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totals.commission)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-theme-border">
            <span className="text-base font-bold text-theme-primary">
              Total Geral:
            </span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

OrderItemsTable.propTypes = {
  /** Array de itens da comanda */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      quantity: PropTypes.number,
      unit_price: PropTypes.number,
      commission_percentage: PropTypes.number,
      service: PropTypes.shape({
        name: PropTypes.string,
        duration_minutes: PropTypes.number,
      }),
      professional: PropTypes.shape({
        name: PropTypes.string,
      }),
    })
  ),
  /** Callback para remover item */
  onRemoveItem: PropTypes.func,
  /** Se pode editar/remover itens */
  canEdit: PropTypes.bool,
  /** Se deve mostrar coluna de comissão */
  showCommission: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default OrderItemsTable;
