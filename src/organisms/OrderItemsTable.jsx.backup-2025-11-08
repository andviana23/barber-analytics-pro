import React from 'react';
import PropTypes from 'prop-types';
import { OrderItemRow } from '../molecules';
import { formatCurrency } from '../utils/formatters';

/**
 * OrderItemsTable - Tabela de itens de comanda
 *
 * Organism que exibe tabela de itens/serviços de uma comanda
 * com totalizadores e opções de edição.
 *
 * @component
 * @example
 * ```jsx
 * <OrderItemsTable
 *   items={orderItems}
 *   onRemoveItem={handleRemove}
 *   onAddItem={handleAdd}
 *   editable={order.status === 'open'}
 * />
 * ```
 */
const OrderItemsTable = ({
  items = [],
  onRemoveItem,
  onAddItem,
  editable = false,
  showCommission = true,
  loading = false,
  emptyMessage = 'Nenhum serviço adicionado ainda',
  className = '',
}) => {
  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
    const totalCommission = items.reduce((sum, item) => {
      const commission = (item.price * (item.commission_percentage || 0)) / 100;
      return sum + commission * (item.quantity || 1);
    }, 0);
    return {
      subtotal,
      totalCommission,
      total: subtotal,
    };
  };
  const totals = calculateTotals();
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
        <div className="p-8 text-center">
          <div className="border-3 mb-3 inline-block h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-theme-secondary">Carregando itens...</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`overflow-hidden rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
    >
      {/* Header */}
      <div className="border-b border-light-border bg-light-surface/50 px-6 py-4 dark:border-dark-border dark:bg-dark-hover/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-theme-primary text-lg font-semibold">
              Serviços da Comanda
            </h3>
            <p className="text-theme-secondary mt-1 text-sm">
              {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
            </p>
          </div>
          {onAddItem && editable && (
            <button
              onClick={onAddItem}
              className="hover:bg-primary-dark text-dark-text-primary inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Adicionar Serviço
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="p-12 text-center">
          <svg
            className="text-theme-secondary/50 mx-auto mb-4 h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            {emptyMessage}
          </h3>
          {onAddItem && editable && (
            <p className="text-theme-secondary mb-4">
              Adicione serviços para começar a comanda.
            </p>
          )}
          {onAddItem && editable && (
            <button
              onClick={onAddItem}
              className="hover:bg-primary-dark text-dark-text-primary inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Adicionar Primeiro Serviço
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div
            className="grid items-center gap-3 border-b border-light-border bg-light-surface/30 px-4 py-3 dark:border-dark-border dark:bg-dark-hover/30"
            style={{
              gridTemplateColumns: showCommission
                ? 'minmax(150px, 2fr) minmax(120px, 1.5fr) 80px 100px 100px 100px 40px'
                : 'minmax(150px, 2fr) minmax(120px, 1.5fr) 80px 100px 40px',
            }}
          >
            <div className="text-theme-secondary text-xs font-semibold uppercase tracking-wider">
              Serviço
            </div>
            <div className="text-theme-secondary text-xs font-semibold uppercase tracking-wider">
              Profissional
            </div>
            <div className="text-theme-secondary text-center text-xs font-semibold uppercase tracking-wider">
              Qtd
            </div>
            <div className="text-theme-secondary text-right text-xs font-semibold uppercase tracking-wider">
              Preço Unit.
            </div>
            {showCommission && (
              <div className="text-theme-secondary text-right text-xs font-semibold uppercase tracking-wider">
                Comissão
              </div>
            )}
            <div className="text-theme-secondary text-right text-xs font-semibold uppercase tracking-wider">
              Total
            </div>
            <div className="text-theme-secondary text-right text-xs font-semibold uppercase tracking-wider">
              {editable ? 'Ações' : ''}
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {items.map(item => (
              <OrderItemRow
                key={item.id}
                item={item}
                onRemove={onRemoveItem}
                editable={editable}
                showCommission={showCommission}
              />
            ))}
          </div>

          {/* Totals Footer */}
          <div className="border-t-2 border-light-border bg-light-surface/50 px-4 py-4 dark:border-dark-border dark:bg-dark-hover/50">
            <div className="ml-auto flex max-w-md flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm font-medium">
                  Subtotal:
                </span>
                <span className="text-theme-primary text-base font-semibold">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              {showCommission && (
                <div className="flex items-center justify-between">
                  <span className="text-theme-secondary text-sm font-medium">
                    Total Comissões:
                  </span>
                  <span className="text-base font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(totals.totalCommission)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-light-border pt-2 dark:border-dark-border">
                <span className="text-theme-primary text-lg font-semibold">
                  Total:
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totals.total)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
OrderItemsTable.propTypes = {
  /** Lista de itens da comanda */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      service_name: PropTypes.string.isRequired,
      professional_name: PropTypes.string,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number,
      commission_percentage: PropTypes.number,
      duration_minutes: PropTypes.number,
    })
  ),
  /** Callback para remover item */
  onRemoveItem: PropTypes.func,
  /** Callback para adicionar item */
  onAddItem: PropTypes.func,
  /** Se a tabela é editável */
  editable: PropTypes.bool,
  /** Se deve mostrar coluna de comissão */
  showCommission: PropTypes.bool,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Mensagem quando vazio */
  emptyMessage: PropTypes.string,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default OrderItemsTable;
