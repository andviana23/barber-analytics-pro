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
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar por número, cliente ou profissional..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border card-theme dark:bg-dark-surface text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-secondary"
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
            className="px-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>

          {/* Toggle de visualização */}
          <div className="flex rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white dark:bg-dark-surface text-theme-secondary hover:bg-light-surface dark:hover:bg-dark-hover'}`}
              title="Visualização em grade"
            >
              <svg
                className="w-5 h-5"
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
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-dark-surface text-theme-secondary hover:bg-light-surface dark:hover:bg-dark-hover'}`}
              title="Visualização em lista"
            >
              <svg
                className="w-5 h-5"
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
              className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-dark-text-primary font-medium rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-theme-secondary">Carregando comandas...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-theme-secondary/50 mb-4"
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
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
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
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-dark-text-primary font-medium rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
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
              <p className="text-sm text-theme-secondary">
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
                  className="px-3 py-1.5 rounded-md border border-light-border dark:border-dark-border text-sm font-medium text-theme-primary hover:bg-light-surface dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-sm text-theme-secondary">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    onPageChange && onPageChange(pagination.currentPage + 1)
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1.5 rounded-md border border-light-border dark:border-dark-border text-sm font-medium text-theme-primary hover:bg-light-surface dark:hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
