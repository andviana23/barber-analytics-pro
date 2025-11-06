import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OrderListItem } from '../molecules';

/**
 * OrdersTable - Tabela de comandas
 *
 * Organism que exibe lista de comandas com filtros, busca e paginação.
 * Usado na página principal de comandas.
 *
 * @component
 * @example
 * ```jsx
 * <OrdersTable
 *   orders={orders}
 *   onSelectOrder={handleSelect}
 *   onCreateOrder={handleCreate}
 *   loading={isLoading}
 * />
 * ```
 */
const OrdersTable = ({
  orders = [],
  onSelectOrder,
  onCreateOrder,
  selectedOrderId = null,
  loading = false,
  filters = {},
  onFilterChange,
  searchTerm = '',
  onSearchChange,
  pagination = {},
  onPageChange,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const filterOrders = () => {
    let filtered = [...orders];

    // Filtro por status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro por profissional
    if (filters.professionalId) {
      filtered = filtered.filter(
        order => order.professional_id === filters.professionalId
      );
    }

    // Busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.order_number?.toString().includes(search) ||
          order.client_name?.toLowerCase().includes(search) ||
          order.professional_name?.toLowerCase().includes(search)
      );
    }
    return filtered;
  };
  const filteredOrders = filterOrders();
  const statusOptions = [
    {
      value: 'all',
      label: 'Todos os Status',
      count: orders.length,
    },
    {
      value: 'open',
      label: 'Abertas',
      count: orders.filter(o => o.status === 'open').length,
    },
    {
      value: 'closed',
      label: 'Fechadas',
      count: orders.filter(o => o.status === 'closed').length,
    },
    {
      value: 'cancelled',
      label: 'Canceladas',
      count: orders.filter(o => o.status === 'cancelled').length,
    },
  ];
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com busca e filtros */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Busca */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar por número, cliente ou profissional..."
              className="card-theme text-theme-primary placeholder-theme-secondary w-full rounded-lg border border-light-border py-2.5 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surface"
            />
            <svg
              className="text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Filtros e ações */}
        <div className="flex flex-wrap gap-3">
          {/* Filtro de status */}
          <select
            value={filters.status || 'all'}
            onChange={e =>
              onFilterChange &&
              onFilterChange({
                ...filters,
                status: e.target.value,
              })
            }
            className="card-theme text-theme-primary rounded-lg border border-light-border px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surface"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>

          {/* Toggle de visualização */}
          <div className="flex overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-theme-secondary bg-white hover:bg-light-surface dark:bg-dark-surface dark:hover:bg-dark-hover'}`}
              title="Visualização em grade"
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
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-theme-secondary bg-white hover:bg-light-surface dark:bg-dark-surface dark:hover:bg-dark-hover'}`}
              title="Visualização em lista"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Botão criar comanda */}
          {onCreateOrder && (
            <button
              onClick={onCreateOrder}
              className="hover:bg-primary-dark text-dark-text-primary inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium transition-colors"
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
              Nova Comanda
            </button>
          )}
        </div>
      </div>

      {/* Lista de comandas */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="border-3 mb-3 inline-block h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-theme-secondary">Carregando comandas...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            {searchTerm || filters.status !== 'all'
              ? 'Nenhuma comanda encontrada'
              : 'Nenhuma comanda ainda'}
          </h3>
          <p className="text-theme-secondary mb-4">
            {searchTerm || filters.status !== 'all'
              ? 'Tente ajustar os filtros ou busca.'
              : 'Crie a primeira comanda para começar.'}
          </p>
          {onCreateOrder && !searchTerm && filters.status === 'all' && (
            <button
              onClick={onCreateOrder}
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
              Criar Primeira Comanda
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Grid ou Lista */}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-3'
            }
          >
            {filteredOrders.map(order => (
              <OrderListItem
                key={order.id}
                order={order}
                onClick={onSelectOrder}
                selected={selectedOrderId === order.id}
              />
            ))}
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-theme-secondary text-sm">
                Mostrando {pagination.from || 1} a{' '}
                {pagination.to || filteredOrders.length} de{' '}
                {pagination.total || filteredOrders.length} comandas
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onPageChange && onPageChange(pagination.currentPage - 1)
                  }
                  disabled={pagination.currentPage === 1}
                  className="text-theme-primary rounded-md border border-light-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-hover"
                >
                  Anterior
                </button>
                <span className="text-theme-secondary px-3 py-1.5 text-sm">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    onPageChange && onPageChange(pagination.currentPage + 1)
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="text-theme-primary rounded-md border border-light-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:hover:bg-dark-hover"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
OrdersTable.propTypes = {
  /** Lista de comandas */
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      order_number: PropTypes.number.isRequired,
      client_name: PropTypes.string,
      professional_id: PropTypes.string,
      professional_name: PropTypes.string,
      status: PropTypes.oneOf(['open', 'closed', 'cancelled']).isRequired,
      total_amount: PropTypes.number,
      items_count: PropTypes.number,
      observations: PropTypes.string,
      created_at: PropTypes.string.isRequired,
    })
  ),
  /** Callback ao selecionar comanda */
  onSelectOrder: PropTypes.func,
  /** Callback para criar comanda */
  onCreateOrder: PropTypes.func,
  /** ID da comanda selecionada */
  selectedOrderId: PropTypes.string,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Filtros ativos */
  filters: PropTypes.object,
  /** Callback para alterar filtros */
  onFilterChange: PropTypes.func,
  /** Termo de busca */
  searchTerm: PropTypes.string,
  /** Callback para alterar busca */
  onSearchChange: PropTypes.func,
  /** Configuração de paginação */
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    total: PropTypes.number,
    from: PropTypes.number,
    to: PropTypes.number,
  }),
  /** Callback para mudar de página */
  onPageChange: PropTypes.func,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default OrdersTable;
