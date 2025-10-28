import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

/**
 * CategoryHierarchicalDropdown - Molecule Component
 *
 * Componente de seleção de categorias com hierarquia visual (pai → filho)
 * Segue princípios de Atomic Design e usabilidade (Don Norman, Steve Krug)
 *
 * Funcionalidades:
 * - Exibe categorias pai como headers (não selecionáveis)
 * - Exibe categorias filhas indentadas (selecionáveis)
 * - Suporte a dark mode
 * - Validação visual (required, error states)
 *
 * Princípios aplicados:
 * - Clean Code: Nomes semânticos, funções pequenas
 * - Usabilidade: Hierarquia visual clara, feedback imediato
 * - Acessibilidade: ARIA labels, contraste adequado
 *
 * @example
 * <CategoryHierarchicalDropdown
 *   categories={categoriesTree}
 *   value={selectedCategoryId}
 *   onChange={(categoryId) => setSelectedCategoryId(categoryId)}
 *   placeholder="Selecionar categoria..."
 *   required
 *   disabled={false}
 * />
 */
const CategoryHierarchicalDropdown = ({
  categories = [],
  value = '',
  onChange = () => {},
  placeholder = 'Selecionar categoria...',
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  className = '',
  label = null,
  showIcon = true,
}) => {
  /**
   * Valida se categorias possui formato correto
   * Deve ser array de objetos com: id, name, parent_id, children
   */
  const isValidCategoriesFormat = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) return false;

    return categories.every(
      cat =>
        cat &&
        typeof cat === 'object' &&
        'id' in cat &&
        'name' in cat &&
        'children' in cat
    );
  }, [categories]);

  /**
   * Renderiza opções hierárquicas
   * - Categorias pai: desabilitadas, bold, sem indentação
   * - Categorias filhas: habilitadas, indentadas com "└─"
   */
  const renderOptions = useMemo(() => {
    if (!isValidCategoriesFormat) {
      return <option disabled>Erro: formato de categorias inválido</option>;
    }

    const options = [];

    categories.forEach(parent => {
      // Categoria PAI (não selecionável)
      options.push(
        <option
          key={`parent-${parent.id}`}
          disabled
          style={{
            fontWeight: 'bold',
            color: '#1f2937', // gray-800
            backgroundColor: '#f9fafb', // gray-50
          }}
        >
          {parent.name}
        </option>
      );

      // Categorias FILHAS (selecionáveis)
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(child => {
          options.push(
            <option
              key={child.id}
              value={child.id}
              style={{
                paddingLeft: '1.5rem',
              }}
            >
              └─ {child.name}
            </option>
          );
        });
      }
    });

    return options;
  }, [categories, isValidCategoriesFormat]);

  /**
   * Handler de mudança de valor
   */
  const handleChange = e => {
    const newValue = e.target.value;
    if (typeof onChange === 'function') {
      onChange(newValue);
    }
  };

  /**
   * Classes CSS dinâmicas baseadas no estado
   */
  const selectClasses = useMemo(() => {
    const baseClasses =
      'w-full px-3 py-2 pr-10 border rounded-lg transition-colors focus:outline-none focus:ring-2';

    const stateClasses = error
      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10'
      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700';

    const textClasses =
      'text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
      : 'cursor-pointer';

    return `${baseClasses} ${stateClasses} ${textClasses} ${disabledClasses} ${className}`;
  }, [error, disabled, className]);

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className={selectClasses}
          aria-label={label || 'Categoria'}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? 'error-message' : helperText ? 'helper-text' : undefined
          }
        >
          {/* Placeholder Option */}
          <option value="" disabled={required}>
            {placeholder}
          </option>

          {/* Hierarquia de Categorias */}
          {renderOptions}
        </select>

        {/* Ícone de Dropdown */}
        {showIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown
              className={`w-5 h-5 ${
                error
                  ? 'text-red-400 dark:text-red-500'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            />
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p
          id="helper-text"
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          id="error-message"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

CategoryHierarchicalDropdown.propTypes = {
  /** Árvore de categorias (formato: [{id, name, parent_id, children: [...]}]) */
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      parent_id: PropTypes.string,
      children: PropTypes.array,
    })
  ),
  /** ID da categoria selecionada */
  value: PropTypes.string,
  /** Callback executado ao selecionar categoria */
  onChange: PropTypes.func,
  /** Texto do placeholder */
  placeholder: PropTypes.string,
  /** Se o campo é obrigatório */
  required: PropTypes.bool,
  /** Se o campo está desabilitado */
  disabled: PropTypes.bool,
  /** Mensagem de erro */
  error: PropTypes.string,
  /** Texto de ajuda */
  helperText: PropTypes.string,
  /** Classes CSS adicionais */
  className: PropTypes.string,
  /** Label do campo */
  label: PropTypes.string,
  /** Se deve exibir ícone de dropdown */
  showIcon: PropTypes.bool,
};

export default CategoryHierarchicalDropdown;
