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
    (acc, item) => {
      // ✅ Aceita tanto unit_price (snake_case) quanto unitPrice (camelCase)
      const unitPrice = item.unit_price || item.unitPrice || 0;
      const quantity = item.quantity || 1;
      const commissionPercentage =
        item.commission_percentage || item.commissionPercentage || 0;
      const itemTotal = unitPrice * quantity;
      return {
        subtotal: acc.subtotal + itemTotal,
        commission: acc.commission + (itemTotal * commissionPercentage) / 100,
        quantity: acc.quantity + quantity,
      };
    },
    {
      subtotal: 0,
      commission: 0,
      quantity: 0,
    }
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
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-theme-border border-b bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50">
            <tr>
              <th className="text-theme-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Serviço
              </th>
              <th className="text-theme-muted px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Profissional
              </th>
              <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                Qtd
              </th>
              <th className="text-theme-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Preço Unit.
              </th>
              {showCommission && (
                <th className="text-theme-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                  Comissão
                </th>
              )}
              <th className="text-theme-muted px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                Total
              </th>
              {canEdit && onRemoveItem && (
                <th className="text-theme-muted px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-theme-border divide-y">
            {items.map(item => {
              // ✅ Aceita ambos os formatos
              const unitPrice = item.unit_price || item.unitPrice || 0;
              const quantity = item.quantity || 1;
              const commissionPercentage =
                item.commission_percentage || item.commissionPercentage || 0;
              const itemTotal = unitPrice * quantity;
              const itemCommission = (itemTotal * commissionPercentage) / 100;
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-dark-surface/30"
                >
                  <td className="px-4 py-3">
                    <p className="text-theme-primary text-sm font-medium">
                      {item.service?.name || item.serviceName || 'Serviço'}
                    </p>
                    {item.service?.duration_minutes && (
                      <p className="text-theme-muted text-xs">
                        {item.service.duration_minutes} min
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-theme-muted" />
                      <span className="text-theme-primary text-sm">
                        {item.professional?.name ||
                          item.professionalName ||
                          'Sem profissional'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-theme-primary text-sm font-semibold">
                      {quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-theme-primary text-sm">
                      {formatCurrency(unitPrice)}
                    </span>
                  </td>
                  {showCommission && (
                    <td className="px-4 py-3 text-right">
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {formatCurrency(itemCommission)}
                        </p>
                        <p className="text-theme-muted text-xs">
                          {commissionPercentage}%
                        </p>
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span className="text-theme-primary text-sm font-bold">
                      {formatCurrency(itemTotal)}
                    </span>
                  </td>
                  {canEdit && onRemoveItem && (
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
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
      <div className="divide-theme-border divide-y md:hidden">
        {items.map(item => {
          // ✅ Aceita ambos os formatos
          const unitPrice = item.unit_price || item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const commissionPercentage =
            item.commission_percentage || item.commissionPercentage || 0;
          const itemTotal = unitPrice * quantity;
          const itemCommission = (itemTotal * commissionPercentage) / 100;
          return (
            <div key={item.id} className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="text-theme-primary truncate text-sm font-semibold">
                    {item.service?.name || item.serviceName || 'Serviço'}
                  </h4>
                  <p className="text-theme-muted mt-1 text-xs">
                    {item.professional?.name ||
                      item.professionalName ||
                      'Sem profissional'}
                  </p>
                </div>
                {canEdit && onRemoveItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item)}
                    className="ml-2 flex-shrink-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-theme-muted">Quantidade:</span>
                  <span className="text-theme-primary ml-1 font-semibold">
                    {quantity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-theme-muted">Preço Unit.:</span>
                  <span className="text-theme-primary ml-1 font-semibold">
                    {formatCurrency(unitPrice)}
                  </span>
                </div>
                {showCommission && (
                  <>
                    <div>
                      <span className="text-theme-muted">Comissão:</span>
                      <span className="ml-1 font-semibold text-purple-600 dark:text-purple-400">
                        {commissionPercentage}%
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

              <div className="border-theme-border mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-theme-muted text-xs font-medium">
                  Total:
                </span>
                <span className="text-theme-primary text-base font-bold">
                  {formatCurrency(itemTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer com Totais */}
      <div className="border-theme-border border-t bg-light-bg p-4 dark:bg-dark-bg dark:bg-dark-surface/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-theme-muted text-sm font-medium">
              Total de Serviços:
            </span>
            <span className="text-theme-primary text-sm font-semibold">
              {totals.quantity} {totals.quantity === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {showCommission && (
            <div className="flex items-center justify-between">
              <span className="text-theme-muted text-sm font-medium">
                Total em Comissões:
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totals.commission)}
              </span>
            </div>
          )}

          <div className="border-theme-border flex items-center justify-between border-t pt-2">
            <span className="text-theme-primary text-base font-bold">
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
