/**
 * @fileoverview Componente Organism - Tabela do Demonstrativo de Fluxo
 * @module organisms/DemonstrativoFluxoTable
 * @description Tabela responsiva com dados do Demonstrativo de Fluxo de Caixa Acumulado.
 *              Suporta ordenação, paginação, loading states e empty states.
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @architecture Atomic Design - Organism
 * @dependencies react@19.x
 *
 * @usage
 * ```jsx
 * <DemonstrativoFluxoTable
 *   data={data}
 *   loading={loading}
 *   error={error}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

/**
 * SortIcon Component
 * Mostra ícone de ordenação (ChevronUp ou ChevronDown)
 */
const SortIcon = ({ field, sortField, sortDirection }) => {
  if (sortField !== field) return null;
  return sortDirection === 'asc' ? (
    <ChevronUp className="ml-1 inline h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 inline h-4 w-4" />
  );
};

/**
 * DemonstrativoFluxoTable
 * Tabela responsiva com dados do fluxo acumulado
 *
 * @param {Object} props
 * @param {Array} props.data - Array de entradas do fluxo
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.error - Mensagem de erro
 * @param {number} props.itemsPerPage - Itens por página (padrão: 30)
 */
export function DemonstrativoFluxoTable({
  data = [],
  loading = false,
  error = null,
  itemsPerPage = 30,
}) {
  // ==================================================================================
  // STATE
  // ==================================================================================

  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' ou 'desc'
  const [currentPage, setCurrentPage] = useState(1);

  // ==================================================================================
  // SORTING
  // ==================================================================================

  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Conversão de tipos
      if (sortField === 'transaction_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [data, sortField, sortDirection]);

  // ==================================================================================
  // PAGINATION
  // ==================================================================================

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedData.length / itemsPerPage);
  }, [sortedData.length, itemsPerPage]);

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleSort = field => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ==================================================================================
  // RENDER HELPERS
  // ==================================================================================

  const renderSaldoCell = (valor, isPositivo) => {
    const colorClass = isPositivo
      ? 'text-feedback-light-success dark:text-feedback-dark-success'
      : 'text-feedback-light-error dark:text-feedback-dark-error';

    const Icon = isPositivo ? TrendingUp : TrendingDown;

    return (
      <div className={`flex items-center gap-2 font-semibold ${colorClass}`}>
        <Icon className="h-4 w-4" />
        {valor}
      </div>
    );
  };

  // ==================================================================================
  // LOADING STATE
  // ==================================================================================

  if (loading) {
    return (
      <div className="card-theme flex min-h-[400px] items-center justify-center rounded-xl border p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-theme-secondary text-lg">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // ERROR STATE
  // ==================================================================================

  if (error) {
    return (
      <div className="card-theme flex min-h-[400px] items-center justify-center rounded-xl border p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-feedback-light-error dark:text-feedback-dark-error" />
          <p className="text-theme-primary text-lg font-semibold">
            Erro ao carregar dados
          </p>
          <p className="text-theme-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // EMPTY STATE
  // ==================================================================================

  if (!data || data.length === 0) {
    return (
      <div className="card-theme flex min-h-[400px] items-center justify-center rounded-xl border p-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <Calendar className="text-theme-secondary h-12 w-12" />
          <p className="text-theme-primary text-lg font-semibold">
            Nenhum dado encontrado
          </p>
          <p className="text-theme-secondary text-sm">
            Selecione os filtros e clique em &quot;Buscar&quot; para visualizar
            o demonstrativo
          </p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // TABLE RENDER
  // ==================================================================================

  return (
    <div className="card-theme overflow-hidden rounded-xl border">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="border-b bg-light-bg dark:bg-dark-hover">
            <tr>
              <th
                className="text-theme-primary cursor-pointer px-6 py-4 text-left text-sm font-semibold transition-colors hover:bg-light-hover dark:hover:bg-dark-bg"
                onClick={() => handleSort('transaction_date')}
              >
                Data
                <SortIcon
                  field="transaction_date"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </th>
              <th
                className="text-theme-primary cursor-pointer px-6 py-4 text-right text-sm font-semibold transition-colors hover:bg-light-hover dark:hover:bg-dark-bg"
                onClick={() => handleSort('entradas')}
              >
                Entradas
                <SortIcon
                  field="entradas"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </th>
              <th
                className="text-theme-primary cursor-pointer px-6 py-4 text-right text-sm font-semibold transition-colors hover:bg-light-hover dark:hover:bg-dark-bg"
                onClick={() => handleSort('saidas')}
              >
                Saídas
                <SortIcon
                  field="saidas"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </th>
              <th
                className="text-theme-primary cursor-pointer px-6 py-4 text-right text-sm font-semibold transition-colors hover:bg-light-hover dark:hover:bg-dark-bg"
                onClick={() => handleSort('saldo_dia')}
              >
                Saldo do Dia
                <SortIcon
                  field="saldo_dia"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </th>
              <th
                className="text-theme-primary cursor-pointer px-6 py-4 text-right text-sm font-semibold transition-colors hover:bg-light-hover dark:hover:bg-dark-bg"
                onClick={() => handleSort('saldo_acumulado')}
              >
                Saldo Acumulado
                <SortIcon
                  field="saldo_acumulado"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {paginatedData.map((row, index) => (
              <tr
                key={row.transaction_date || index}
                className="transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
              >
                <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-sm">
                  {row.dateFormatted || row.transaction_date}
                </td>
                <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-right text-sm">
                  {row.entradasFormatted || `R$ ${row.entradas.toFixed(2)}`}
                </td>
                <td className="text-theme-primary whitespace-nowrap px-6 py-4 text-right text-sm">
                  {row.saidasFormatted || `R$ ${row.saidas.toFixed(2)}`}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  {renderSaldoCell(
                    row.saldoDiaFormatted || `R$ ${row.saldo_dia.toFixed(2)}`,
                    row.saldoDiaPositivo !== undefined
                      ? row.saldoDiaPositivo
                      : row.saldo_dia >= 0
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                  {renderSaldoCell(
                    row.saldoAcumuladoFormatted ||
                      `R$ ${row.saldo_acumulado.toFixed(2)}`,
                    row.saldoAcumuladoPositivo !== undefined
                      ? row.saldoAcumuladoPositivo
                      : row.saldo_acumulado >= 0
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-light-bg px-6 py-4 dark:bg-dark-hover">
          <div className="text-theme-secondary text-sm">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} de{' '}
            {sortedData.length} registros
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-theme-secondary px-3 py-2 text-sm disabled:opacity-50"
            >
              Anterior
            </button>

            <span className="text-theme-secondary px-4 text-sm">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-theme-secondary px-3 py-2 text-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemonstrativoFluxoTable;
