import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency, parseCurrency } from '@/utils/formatters';
import PropTypes from 'prop-types';

/**
 * CurrencyInput - Input formatado para valores monetários (R$)
 *
 * Componente atom que formata automaticamente valores em Real brasileiro.
 * Segue Design System com classes temáticas e validações.
 *
 * @component
 * @example
 * ```jsx
 * <CurrencyInput
 *   value={500.00}
 *   onChange={(value) => setSaldo(value)}
 *   placeholder="Digite o valor"
 *   label="Saldo Inicial"
 * />
 * ```
 */
const CurrencyInput = ({
  value = 0,
  onChange,
  placeholder = 'R$ 0,00',
  label,
  disabled = false,
  error = null,
  min = 0,
  max = null,
  required = false,
  className = '',
  id,
  name,
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Formata número para moeda brasileira
  const formatCurrency = num => {
    if (num === null || num === undefined || isNaN(num)) return '';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Remove formatação e converte para número
  const unformatCurrency = str => {
    if (!str) return 0;

    // Remove tudo exceto números e vírgula
    const cleaned = str.replace(/[^\d,]/g, '');
    // Substitui vírgula por ponto
    const normalized = cleaned.replace(',', '.');
    const num = parseFloat(normalized);

    return isNaN(num) ? 0 : num;
  };

  // Atualiza display quando value externo muda
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
    // Ignorar displayValue nas dependências para evitar loops
  }, [value, isFocused]);

  // Handler de mudança
  const handleChange = e => {
    let inputValue = e.target.value;

    // Permite apenas números, vírgula e ponto
    inputValue = inputValue.replace(/[^\d,]/g, '');

    setDisplayValue(inputValue);

    // Converte para número e chama onChange
    const numericValue = unformatCurrency(inputValue);

    // Validação de range
    if (min !== null && numericValue < min) return;
    if (max !== null && numericValue > max) return;

    onChange(numericValue);
  };

  // Handler de focus
  const handleFocus = () => {
    setIsFocused(true);
    // No focus, mostra apenas o número sem formatação
    setDisplayValue(value > 0 ? value.toString().replace('.', ',') : '');
  };

  // Handler de blur
  const handleBlur = () => {
    setIsFocused(false);
    // No blur, formata o valor
    setDisplayValue(formatCurrency(value));
  };

  // Gera ID único se não fornecido
  const generatedId = useId();
  const inputId = id || `currency-input-${name || generatedId}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-theme-primary mb-1.5 block text-sm font-medium"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-theme-secondary text-sm">R$</span>
        </div>

        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-label={label || 'Valor em moeda'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`text-theme-primary placeholder:text-theme-secondary/50 w-full rounded-md border py-2.5 pl-12 pr-4 transition-all duration-200 focus:outline-none focus:ring-2 ${
            error
              ? 'border-red-500 bg-red-50 focus:ring-red-500/20 dark:bg-red-950/10'
              : 'border-light-border bg-light-surface focus:ring-primary/20 dark:border-dark-border dark:bg-dark-surface'
          } ${
            disabled
              ? 'cursor-not-allowed bg-light-bg opacity-50 dark:bg-dark-bg'
              : 'hover:border-primary/50'
          } `}
        />
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Helper text para range */}
      {!error && (min !== null || max !== null) && (
        <p className="text-theme-secondary mt-1 text-xs">
          {min !== null && max !== null
            ? `Valor entre ${formatCurrency(min)} e ${formatCurrency(max)}`
            : min !== null
              ? `Valor mínimo: ${formatCurrency(min)}`
              : `Valor máximo: ${formatCurrency(max)}`}
        </p>
      )}
    </div>
  );
};

CurrencyInput.propTypes = {
  /** Valor numérico atual */
  value: PropTypes.number,
  /** Callback chamado quando o valor muda */
  onChange: PropTypes.func.isRequired,
  /** Texto do placeholder */
  placeholder: PropTypes.string,
  /** Label do input */
  label: PropTypes.string,
  /** Se o input está desabilitado */
  disabled: PropTypes.bool,
  /** Mensagem de erro */
  error: PropTypes.string,
  /** Valor mínimo permitido */
  min: PropTypes.number,
  /** Valor máximo permitido */
  max: PropTypes.number,
  /** Se o campo é obrigatório */
  required: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
  /** ID do input */
  id: PropTypes.string,
  /** Nome do input */
  name: PropTypes.string,
  /** Auto focus no mount */
  autoFocus: PropTypes.bool,
};

export default CurrencyInput;
