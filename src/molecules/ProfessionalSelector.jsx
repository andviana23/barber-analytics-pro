import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ProfessionalSelector - Seletor de profissionais
 *
 * Molecule que permite selecionar profissionais de uma lista com filtros.
 * Exibe nome, função e permite seleção.
 *
 * @component
 * @example
 * ```jsx
 * <ProfessionalSelector
 *   professionals={professionals}
 *   onSelect={handleSelectProfessional}
 *   value={selectedProfessionalId}
 *   filterByRole="barbeiro"
 * />
 * ```
 */
const ProfessionalSelector = ({
  professionals = [],
  onSelect,
  value = null,
  loading = false,
  disabled = false,
  error = null,
  placeholder = 'Selecione um profissional',
  label = 'Profissional',
  required = false,
  filterByRole = null,
  filterByUnit = null,
  showRole = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedProfessional = professionals.find(p => p.id === value);

  // Filtra profissionais por busca, role e unidade
  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole = !filterByRole || professional.role === filterByRole;
    const matchesUnit = !filterByUnit || professional.unit_id === filterByUnit;
    const isActive = professional.is_active !== false;
    return matchesSearch && matchesRole && matchesUnit && isActive;
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
  const handleSelect = professional => {
    if (onSelect) {
      onSelect(professional);
    }
    setIsOpen(false);
    setSearchTerm('');
  };
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  const getRoleLabel = role => {
    const labels = {
      admin: 'Administrador',
      gerente: 'Gerente',
      barbeiro: 'Barbeiro',
      recepcionista: 'Recepcionista',
    };
    return labels[role] || role;
  };
  const getInitials = name => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="text-theme-primary mb-2 block text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left transition-all ${disabled || loading ? 'cursor-not-allowed bg-light-surface/50 opacity-60 dark:bg-dark-surface/50' : 'cursor-pointer bg-white hover:border-primary dark:bg-dark-surface'} ${error ? 'border-red-500 dark:border-red-400' : isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-light-border dark:border-dark-border'} `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {selectedProfessional ? (
            <>
              {/* Avatar */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(selectedProfessional.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-theme-primary truncate font-medium">
                  {selectedProfessional.name}
                </p>
                {showRole && selectedProfessional.role && (
                  <p className="text-theme-secondary text-sm">
                    {getRoleLabel(selectedProfessional.role)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <span className="text-theme-secondary">{placeholder}</span>
          )}
        </div>

        {/* Icon */}
        <svg
          className={`text-theme-secondary h-5 w-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        <div className="card-theme absolute z-50 mt-2 flex max-h-80 w-full flex-col rounded-lg border border-light-border shadow-lg dark:border-dark-border dark:bg-dark-surface">
          {/* Search Input */}
          <div className="border-b border-light-border p-3 dark:border-dark-border">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar profissional..."
                className="text-theme-primary placeholder-theme-secondary w-full rounded-md border border-light-border bg-light-surface py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-hover"
              />
              <svg
                className="text-theme-secondary absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
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

          {/* Professionals List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-theme-secondary mt-2 text-sm">
                  Carregando profissionais...
                </p>
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="text-theme-secondary/50 mx-auto mb-2 h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-theme-secondary text-sm">
                  {searchTerm
                    ? 'Nenhum profissional encontrado'
                    : 'Nenhum profissional disponível'}
                </p>
              </div>
            ) : (
              <div role="listbox">
                {filteredProfessionals.map(professional => (
                  <button
                    key={professional.id}
                    type="button"
                    onClick={() => handleSelect(professional)}
                    className={`w-full border-b border-light-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-light-surface dark:border-dark-border/50 dark:hover:bg-dark-hover ${value === professional.id ? 'bg-primary/5' : ''} `}
                    role="option"
                    aria-selected={value === professional.id}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {getInitials(professional.name)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-theme-primary truncate font-medium">
                          {professional.name}
                        </p>
                        {showRole && professional.role && (
                          <p className="text-theme-secondary text-sm">
                            {getRoleLabel(professional.role)}
                          </p>
                        )}
                      </div>

                      {/* Checkmark if selected */}
                      {value === professional.id && (
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
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
ProfessionalSelector.propTypes = {
  /** Lista de profissionais */
  professionals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string,
      unit_id: PropTypes.string,
      is_active: PropTypes.bool,
    })
  ),
  /** Callback ao selecionar */
  onSelect: PropTypes.func,
  /** ID do profissional selecionado */
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
  /** Filtrar por função específica */
  filterByRole: PropTypes.string,
  /** Filtrar por unidade específica */
  filterByUnit: PropTypes.string,
  /** Se deve mostrar a função */
  showRole: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default ProfessionalSelector;
