import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * CashRegisterHistory - Histórico de caixas
 *
 * Organism que exibe tabela de histórico de aberturas/fechamentos de caixa
 * com paginação, filtros e detalhes.
 *
 * @component
 * @example
 * ```jsx
 * <CashRegisterHistory
 *   history={cashHistory}
 *   onViewDetails={handleViewDetails}
 *   loading={isLoading}
 * />
 * ```
 */
const CashRegisterHistory = ({
  history = [],
  onViewDetails,
  loading = false,
  pagination = {},
  onPageChange,
  className = '',
}) => {
  const [sortField, setSortField] = useState('opened_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedHistory = [...history].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const modifier = sortDirection === 'asc' ? 1 : -1;

    if (aValue < bValue) return -1 * modifier;
    if (aValue > bValue) return 1 * modifier;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg
          className="text-theme-secondary/50 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
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
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
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
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
        <div className="p-8 text-center">
          <div className="border-3 mb-3 inline-block h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-theme-secondary">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            Nenhum histórico encontrado
          </h3>
          <p className="text-theme-secondary">
            Não há registros de caixas abertos ou fechados ainda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-hover">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('opened_at')}
                  className="text-theme-primary flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                >
                  Abertura
                  <SortIcon field="opened_at" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('closed_at')}
                  className="text-theme-primary flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                >
                  Fechamento
                  <SortIcon field="closed_at" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-theme-primary text-sm font-semibold">
                  Responsável
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('opening_balance')}
                  className="text-theme-primary ml-auto flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                >
                  Saldo Inicial
                  <SortIcon field="opening_balance" />
                </button>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('closing_balance')}
                  className="text-theme-primary ml-auto flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                >
                  Saldo Final
                  <SortIcon field="closing_balance" />
                </button>
              </th>
              <th className="px-6 py-3 text-center">
                <span className="text-theme-primary text-sm font-semibold">
                  Status
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-theme-primary text-sm font-semibold">
                  Ações
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {sortedHistory.map(cash => (
              <tr
                key={cash.id}
                className="transition-colors hover:bg-light-surface/50 dark:hover:bg-dark-hover/50"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-theme-primary text-sm font-medium">
                    {formatDateTime(cash.opened_at, 'short')}
                  </div>
                  <div className="text-theme-secondary text-xs">
                    {cash.opened_by_name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {cash.closed_at ? (
                    <>
                      <div className="text-theme-primary text-sm font-medium">
                        {formatDateTime(cash.closed_at, 'short')}
                      </div>
                      <div className="text-theme-secondary text-xs">
                        {cash.closed_by_name}
                      </div>
                    </>
                  ) : (
                    <span className="text-theme-secondary text-sm italic">
                      Em aberto
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {cash.opened_by_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-theme-primary text-sm">
                      {cash.opened_by_name}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <span className="text-theme-primary text-sm font-medium">
                    {formatCurrency(cash.opening_balance || 0)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  {cash.closing_balance !== null &&
                  cash.closing_balance !== undefined ? (
                    <span
                      className={`text-sm font-semibold ${
                        cash.closing_balance >= cash.opening_balance
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(cash.closing_balance)}
                    </span>
                  ) : (
                    <span className="text-theme-secondary text-sm">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      cash.status === 'open'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}
                  >
                    {cash.status === 'open' ? 'Aberto' : 'Fechado'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetails && onViewDetails(cash)}
                    className="hover:text-primary-dark inline-flex items-center gap-1 text-sm font-medium text-primary"
                  >
                    Ver detalhes
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-light-border bg-light-surface/50 px-6 py-4 dark:border-dark-border dark:bg-dark-hover/50">
          <div className="flex items-center justify-between">
            <p className="text-theme-secondary text-sm">
              Mostrando {pagination.from || 1} a{' '}
              {pagination.to || history.length} de{' '}
              {pagination.total || history.length} registros
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
        </div>
      )}
    </div>
  );
};

CashRegisterHistory.propTypes = {
  /** Lista de histórico de caixas */
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['open', 'closed']).isRequired,
      opened_at: PropTypes.string.isRequired,
      opened_by_name: PropTypes.string,
      closed_at: PropTypes.string,
      closed_by_name: PropTypes.string,
      opening_balance: PropTypes.number,
      closing_balance: PropTypes.number,
    })
  ),
  /** Callback para ver detalhes */
  onViewDetails: PropTypes.func,
  /** Estado de carregamento */
  loading: PropTypes.bool,
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

export default CashRegisterHistory;
