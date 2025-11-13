/**
 * SuppliersTable Component
 * @module components/suppliers/SuppliersTable
 * @description Tabela responsiva de fornecedores com filtros e ações
 * @author Andrey Viana
 * @version 1.0.0
 * @date 2025-11-13
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Edit,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Badge de status com cores
 */
const StatusBadge = ({ status }) => {
  const config = {
    ATIVO: {
      label: 'Ativo',
      className:
        'bg-feedback-light-success/10 text-feedback-light-success dark:bg-feedback-dark-success/10 dark:text-feedback-dark-success',
    },
    INATIVO: {
      label: 'Inativo',
      className:
        'bg-light-secondary/20 text-light-secondary dark:bg-dark-secondary/20 dark:text-dark-secondary',
    },
    BLOQUEADO: {
      label: 'Bloqueado',
      className:
        'bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error',
    },
  };

  const { label, className } = config[status] || config.INATIVO;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['ATIVO', 'INATIVO', 'BLOQUEADO']).isRequired,
};

/**
 * Card mobile (exibido em telas pequenas)
 */
const SupplierCard = ({ supplier, onEdit, onView, onArchive }) => {
  return (
    <div className="card-theme rounded-lg border p-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-light-bg p-2 dark:bg-dark-hover">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-theme-primary text-sm font-semibold">
              {supplier.name}
            </h3>
            <p className="text-theme-secondary text-xs">
              {supplier.cnpj_cpf_formatted || 'Sem CNPJ/CPF'}
            </p>
          </div>
        </div>
        <StatusBadge status={supplier.status} />
      </div>

      {/* Info */}
      <div className="mb-3 space-y-1 text-xs">
        {supplier.phone_formatted && (
          <p className="text-theme-secondary">📞 {supplier.phone_formatted}</p>
        )}
        {supplier.email && (
          <p className="text-theme-secondary">✉️ {supplier.email}</p>
        )}
        {(supplier.city || supplier.state) && (
          <p className="text-theme-secondary">
            📍{' '}
            {supplier.city && supplier.state
              ? `${supplier.city} / ${supplier.state}`
              : supplier.city || supplier.state}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(supplier)}
          className="btn-theme-secondary flex-1 py-1.5 text-xs"
        >
          <Eye className="mr-1 h-3.5 w-3.5" />
          Ver
        </button>
        <button
          onClick={() => onEdit(supplier)}
          className="btn-theme-primary flex-1 py-1.5 text-xs"
        >
          <Edit className="mr-1 h-3.5 w-3.5" />
          Editar
        </button>
        <button
          onClick={() => onArchive(supplier)}
          className="btn-theme-secondary px-2 py-1.5 text-xs"
          title="Arquivar"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

SupplierCard.propTypes = {
  supplier: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
};

/**
 * Linha da tabela desktop
 */
const SupplierRow = ({ supplier, onEdit, onView, onArchive }) => {
  return (
    <tr className="border-b border-light-border transition-colors hover:bg-light-bg dark:border-dark-border dark:hover:bg-dark-hover">
      <td className="text-theme-primary px-4 py-3 text-sm font-medium">
        {supplier.name}
      </td>
      <td className="text-theme-secondary px-4 py-3 text-sm">
        {supplier.cnpj_cpf_formatted || '-'}
      </td>
      <td className="text-theme-secondary px-4 py-3 text-sm">
        {supplier.phone_formatted || '-'}
      </td>
      <td className="text-theme-secondary px-4 py-3 text-sm">
        {supplier.city && supplier.state
          ? `${supplier.city} / ${supplier.state}`
          : supplier.city || supplier.state || '-'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={supplier.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onView(supplier)}
            className="text-theme-secondary rounded p-1 transition-colors hover:text-primary"
            title="Ver detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(supplier)}
            className="text-theme-secondary rounded p-1 transition-colors hover:text-primary"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onArchive(supplier)}
            className="text-theme-secondary rounded p-1 transition-colors hover:text-feedback-light-error dark:hover:text-feedback-dark-error"
            title="Arquivar"
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

SupplierRow.propTypes = {
  supplier: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
};

/**
 * Skeleton para loading
 */
const TableSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="card-theme h-16 animate-pulse rounded-lg" />
      ))}
    </div>
  );
};

/**
 * Empty state
 */
const EmptyState = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="card-theme flex flex-col items-center justify-center rounded-lg py-12">
      <Building2 className="text-theme-secondary mb-4 h-12 w-12 opacity-50" />
      <h3 className="text-theme-primary mb-2 text-lg font-semibold">
        {hasFilters
          ? 'Nenhum resultado encontrado'
          : 'Nenhum fornecedor cadastrado'}
      </h3>
      <p className="text-theme-secondary mb-4 text-center text-sm">
        {hasFilters
          ? 'Tente ajustar os filtros ou limpar a busca'
          : 'Comece adicionando seu primeiro fornecedor'}
      </p>
      {hasFilters && (
        <button onClick={onClearFilters} className="btn-theme-secondary">
          Limpar filtros
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  hasFilters: PropTypes.bool.isRequired,
  onClearFilters: PropTypes.func.isRequired,
};

/**
 * Componente principal: SuppliersTable
 */
export default function SuppliersTable({
  suppliers = [],
  isLoading = false,
  pagination,
  filters,
  onFiltersChange,
  onEdit,
  onView,
  onArchive,
}) {
  const [searchInput, setSearchInput] = useState(filters?.search || '');

  // Aplicar busca com debounce
  const handleSearchChange = e => {
    const value = e.target.value;
    setSearchInput(value);

    // Debounce simples de 500ms
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }

    window.searchTimeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: value, offset: 0 });
    }, 500);
  };

  // Mudança de status filter
  const handleStatusChange = e => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      status: value === 'ALL' ? undefined : value,
      offset: 0,
    });
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({ offset: 0, limit: filters?.limit || 50 });
  };

  // Paginação
  const handlePreviousPage = () => {
    const newOffset = Math.max(
      0,
      (filters?.offset || 0) - (filters?.limit || 50)
    );
    onFiltersChange({ ...filters, offset: newOffset });
  };

  const handleNextPage = () => {
    const newOffset = (filters?.offset || 0) + (filters?.limit || 50);
    onFiltersChange({ ...filters, offset: newOffset });
  };

  const hasFilters = Boolean(filters?.search || filters?.status);

  // Loading state
  if (isLoading && suppliers.length === 0) {
    return <TableSkeleton />;
  }

  // Empty state
  if (suppliers.length === 0) {
    return (
      <EmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="card-theme flex flex-col gap-3 rounded-lg p-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="text-theme-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ/CPF..."
            value={searchInput}
            onChange={handleSearchChange}
            className="input-theme w-full pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="text-theme-secondary h-4 w-4" />
          <select
            value={filters?.status || 'ALL'}
            onChange={handleStatusChange}
            className="input-theme min-w-[140px]"
          >
            <option value="ALL">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
            <option value="BLOQUEADO">Bloqueados</option>
          </select>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-theme-secondary text-sm"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {suppliers.map(supplier => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            onEdit={onEdit}
            onView={onView}
            onArchive={onArchive}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="card-theme hidden overflow-hidden rounded-lg md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-bg dark:bg-dark-hover">
              <tr>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  Nome
                </th>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  CNPJ/CPF
                </th>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  Telefone
                </th>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  Cidade/UF
                </th>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="text-theme-primary px-4 py-3 text-left text-sm font-semibold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <SupplierRow
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={onEdit}
                  onView={onView}
                  onArchive={onArchive}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="card-theme flex items-center justify-between rounded-lg p-4">
          <div className="text-theme-secondary text-sm">
            Mostrando {pagination.offset + 1} a{' '}
            {Math.min(
              pagination.offset + pagination.limit,
              pagination.totalCount || 0
            )}{' '}
            de {pagination.totalCount || 0} fornecedores
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={!pagination.hasPrevious}
              className="btn-theme-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-theme-primary text-sm font-medium">
              Página {pagination.currentPage} de {pagination.totalPages || 1}
            </span>

            <button
              onClick={handleNextPage}
              disabled={!pagination.hasMore}
              className="btn-theme-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

SuppliersTable.propTypes = {
  suppliers: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    hasMore: PropTypes.bool,
    hasPrevious: PropTypes.bool,
    offset: PropTypes.number,
    limit: PropTypes.number,
    totalCount: PropTypes.number,
  }),
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    offset: PropTypes.number,
    limit: PropTypes.number,
  }),
  onFiltersChange: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onArchive: PropTypes.func.isRequired,
};
