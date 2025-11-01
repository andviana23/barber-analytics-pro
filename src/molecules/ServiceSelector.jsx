import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatCurrency } from '../utils/formatters';

/**
 * ServiceSelector - Seletor de serviços com busca
 *
 * Molecule que permite selecionar serviços de uma lista com busca/filtro.
 * Exibe nome, duração, preço e permite seleção.
 *
 * @component
 * @example
 * ```jsx
 * <ServiceSelector
 *   services={services}
 *   onSelect={handleSelectService}
 *   value={selectedServiceId}
 *   loading={isLoading}
 * />
 * ```
 */
const ServiceSelector = ({
  services = [],
  onSelect,
  value = null,
  loading = false,
  disabled = false,
  error = null,
  placeholder = 'Selecione um serviço',
  label = 'Serviço',
  required = false,
  showInactive = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedService = services.find(s => s.id === value);

  // Filtra serviços por busca e status
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesActive = showInactive || service.is_active !== false;
    return matchesSearch && matchesActive;
  });

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Foca input de busca ao abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };
  const handleSelect = service => {
    if (onSelect) {
      onSelect(service);
    }
    setIsOpen(false);
    setSearchTerm('');
  };
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-theme-primary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`
          w-full px-4 py-3 rounded-lg border text-left transition-all
          flex items-center justify-between gap-2
          ${disabled || loading ? 'bg-light-surface/50 dark:bg-dark-surface/50 cursor-not-allowed opacity-60' : 'bg-white dark:bg-dark-surface hover:border-primary cursor-pointer'}
          ${error ? 'border-red-500 dark:border-red-400' : isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-light-border dark:border-dark-border'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <div className="flex-1 min-w-0">
          {selectedService ? (
            <div>
              <p className="font-medium text-theme-primary truncate">
                {selectedService.name}
              </p>
              <p className="text-sm text-theme-secondary">
                {selectedService.duration_minutes >= 60
                  ? `${Math.floor(selectedService.duration_minutes / 60)}h ${selectedService.duration_minutes % 60}min`
                  : `${selectedService.duration_minutes} min`}{' '}
                • {formatCurrency(selectedService.price)}
              </p>
            </div>
          ) : (
            <span className="text-theme-secondary">{placeholder}</span>
          )}
        </div>

        {/* Icon */}
        <svg
          className={`w-5 h-5 text-theme-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 card-theme dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg max-h-80 flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b border-light-border dark:border-dark-border">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar serviço..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-hover text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-secondary"
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

          {/* Services List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-theme-secondary">
                  Carregando serviços...
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-theme-secondary/50 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-theme-secondary">
                  {searchTerm
                    ? 'Nenhum serviço encontrado'
                    : 'Nenhum serviço disponível'}
                </p>
              </div>
            ) : (
              <div role="listbox">
                {filteredServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelect(service)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors border-b border-light-border/50 dark:border-dark-border/50 last:border-b-0
                      hover:bg-light-surface dark:hover:bg-dark-hover
                      ${value === service.id ? 'bg-primary/5' : ''}
                      ${service.is_active === false ? 'opacity-60' : ''}
                    `}
                    role="option"
                    aria-selected={value === service.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-theme-primary truncate">
                            {service.name}
                          </p>
                          {service.is_active === false && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full card-theme dark:bg-dark-surface text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-theme-secondary">
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {service.duration_minutes >= 60
                              ? `${Math.floor(service.duration_minutes / 60)}h ${service.duration_minutes % 60}min`
                              : `${service.duration_minutes} min`}
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {service.commission_percentage}% comissão
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-theme-primary">
                          {formatCurrency(service.price)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
ServiceSelector.propTypes = {
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
  /** Callback ao selecionar */
  onSelect: PropTypes.func,
  /** ID do serviço selecionado */
  value: PropTypes.string,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Se está desabilitado */
  disabled: PropTypes.bool,
  /** Mensagem de erro */
  error: PropTypes.string,
  /** Texto de placeholder */
  placeholder: PropTypes.string,
  /** Label do campo */
  label: PropTypes.string,
  /** Se é obrigatório */
  required: PropTypes.bool,
  /** Se deve mostrar serviços inativos */
  showInactive: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default ServiceSelector;
