import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ServiceCard } from '../molecules';
import ProtectedButton from '../atoms/ProtectedButton';

/**
 * ServicesTable - Tabela de serviços
 *
 * Organism que exibe catálogo de serviços com CRUD, filtros e busca.
 * Permite criar, editar, ativar/desativar serviços.
 *
 * @component
 * @example
 * ```jsx
 * <ServicesTable
 *   services={services}
 *   onEdit={handleEdit}
 *   onCreate={handleCreate}
 *   onToggleActive={handleToggle}
 * />
 * ```
 */
const ServicesTable = ({
  services = [],
  onEdit,
  onCreate,
  onToggleActive,
  loading = false,
  searchTerm = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const filterServices = () => {
    let filtered = [...services];

    // Filtro por status
    if (filters.showInactive === false) {
      filtered = filtered.filter(service => service.is_active !== false);
    }

    // Busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(search)
      );
    }

    // Ordenação
    const sortField = filters.sortBy || 'name';
    const sortDirection = filters.sortDirection || 'asc';

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });

    return filtered;
  };

  const filteredServices = filterServices();
  const activeCount = services.filter(s => s.is_active !== false).length;
  const inactiveCount = services.length - activeCount;

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
              placeholder="Buscar serviço por nome..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-surface text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          {/* Mostrar inativos */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-surface cursor-pointer hover:bg-light-surface dark:hover:bg-dark-hover transition-colors">
            <input
              type="checkbox"
              checked={filters.showInactive !== false}
              onChange={e =>
                onFilterChange &&
                onFilterChange({ ...filters, showInactive: e.target.checked })
              }
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-theme-primary">
              Mostrar inativos ({inactiveCount})
            </span>
          </label>

          {/* Ordenação */}
          <select
            value={filters.sortBy || 'name'}
            onChange={e =>
              onFilterChange &&
              onFilterChange({ ...filters, sortBy: e.target.value })
            }
            className="px-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="name">Nome</option>
            <option value="price">Preço</option>
            <option value="duration_minutes">Duração</option>
            <option value="commission_percentage">Comissão</option>
          </select>

          {/* Toggle de visualização */}
          <div className="flex rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-dark-surface text-theme-secondary hover:bg-light-surface dark:hover:bg-dark-hover'
              }`}
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
              className={`px-3 py-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-dark-surface text-theme-secondary hover:bg-light-surface dark:hover:bg-dark-hover'
              }`}
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

          {/* Botão criar serviço */}
          {onCreate && (
            <ProtectedButton
              variant="primary"
              onClick={onCreate}
              requiredRoles={['gerente', 'admin']}
              icon={
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
              }
              iconPosition="left"
            >
              Novo Serviço
            </ProtectedButton>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {activeCount}{' '}
              {activeCount === 1 ? 'serviço ativo' : 'serviços ativos'}
            </span>
          </div>
        </div>
        {inactiveCount > 0 && filters.showInactive !== false && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-600 dark:bg-gray-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {inactiveCount}{' '}
                {inactiveCount === 1 ? 'serviço inativo' : 'serviços inativos'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de serviços */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-theme-secondary">Carregando serviços...</p>
        </div>
      ) : filteredServices.length === 0 ? (
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
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-theme-primary mb-2">
            {searchTerm
              ? 'Nenhum serviço encontrado'
              : 'Nenhum serviço cadastrado'}
          </h3>
          <p className="text-theme-secondary mb-4">
            {searchTerm
              ? 'Tente ajustar a busca.'
              : 'Crie o primeiro serviço para começar.'}
          </p>
          {onCreate && !searchTerm && (
            <ProtectedButton
              variant="primary"
              size="lg"
              onClick={onCreate}
              requiredRoles={['gerente', 'admin']}
              icon={
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
              }
              iconPosition="left"
            >
              Criar Primeiro Serviço
            </ProtectedButton>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
          }
        >
          {filteredServices.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

ServicesTable.propTypes = {
  /** Lista de serviços */
  services: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      duration_minutes: PropTypes.number.isRequired,
      price: PropTypes.number.isRequired,
      commission_percentage: PropTypes.number.isRequired,
      is_active: PropTypes.bool,
    })
  ),
  /** Callback para editar serviço */
  onEdit: PropTypes.func,
  /** Callback para criar serviço */
  onCreate: PropTypes.func,
  /** Callback para ativar/desativar */
  onToggleActive: PropTypes.func,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Termo de busca */
  searchTerm: PropTypes.string,
  /** Callback para alterar busca */
  onSearchChange: PropTypes.func,
  /** Filtros ativos */
  filters: PropTypes.object,
  /** Callback para alterar filtros */
  onFilterChange: PropTypes.func,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default ServicesTable;
