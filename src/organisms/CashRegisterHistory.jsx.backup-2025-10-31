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
          className="w-4 h-4 text-theme-secondary/50"
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
        className="w-4 h-4 text-primary"
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
        className="w-4 h-4 text-primary"
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
        className={`bg-white dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border ${className}`}
      >
        <div className="p-8 text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-theme-secondary">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border ${className}`}
      >
        <div className="p-12 text-center">
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
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
      className={`bg-white dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden ${className}`}
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-light-surface dark:bg-dark-hover border-b border-light-border dark:border-dark-border">
            <tr>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('opened_at')}
                  className="flex items-center gap-2 font-semibold text-sm text-theme-primary hover:text-primary transition-colors"
                >
                  Abertura
                  <SortIcon field="opened_at" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('closed_at')}
                  className="flex items-center gap-2 font-semibold text-sm text-theme-primary hover:text-primary transition-colors"
                >
                  Fechamento
                  <SortIcon field="closed_at" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="font-semibold text-sm text-theme-primary">
                  Responsável
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('opening_balance')}
                  className="flex items-center gap-2 font-semibold text-sm text-theme-primary hover:text-primary transition-colors ml-auto"
                >
                  Saldo Inicial
                  <SortIcon field="opening_balance" />
                </button>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => handleSort('closing_balance')}
                  className="flex items-center gap-2 font-semibold text-sm text-theme-primary hover:text-primary transition-colors ml-auto"
                >
                  Saldo Final
                  <SortIcon field="closing_balance" />
                </button>
              </th>
              <th className="px-6 py-3 text-center">
                <span className="font-semibold text-sm text-theme-primary">
                  Status
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="font-semibold text-sm text-theme-primary">
                  Ações
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {sortedHistory.map(cash => (
              <tr
                key={cash.id}
                className="hover:bg-light-surface/50 dark:hover:bg-dark-hover/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-theme-primary font-medium">
                    {formatDateTime(cash.opened_at, 'short')}
                  </div>
                  <div className="text-xs text-theme-secondary">
                    {cash.opened_by_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cash.closed_at ? (
                    <>
                      <div className="text-sm text-theme-primary font-medium">
                        {formatDateTime(cash.closed_at, 'short')}
                      </div>
                      <div className="text-xs text-theme-secondary">
                        {cash.closed_by_name}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-theme-secondary italic">
                      Em aberto
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                      {cash.opened_by_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm text-theme-primary">
                      {cash.opened_by_name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-theme-primary">
                    {formatCurrency(cash.opening_balance || 0)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
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
                    <span className="text-sm text-theme-secondary">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      cash.status === 'open'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {cash.status === 'open' ? 'Aberto' : 'Fechado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onViewDetails && onViewDetails(cash)}
                    className="text-primary hover:text-primary-dark font-medium text-sm inline-flex items-center gap-1"
                  >
                    Ver detalhes
                    <svg
                      className="w-4 h-4"
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
        <div className="px-6 py-4 border-t border-light-border dark:border-dark-border bg-light-surface/50 dark:bg-dark-hover/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-theme-secondary">
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
