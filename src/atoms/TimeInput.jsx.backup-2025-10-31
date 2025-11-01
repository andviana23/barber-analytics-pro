import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * TimeInput - Input para duração em minutos
 *
 * Componente atom para entrada de tempo/duração.
 * Converte automaticamente entre minutos e formato legível (ex: "45 min", "1h 30min").
 * Segue Design System com classes temáticas.
 *
 * @component
 * @example
 * ```jsx
 * <TimeInput
 *   value={45}
 *   onChange={(minutes) => setDuracao(minutes)}
 *   label="Duração do Serviço"
 *   min={15}
 *   max={480}
 * />
 * ```
 */
const TimeInput = ({
  value = 0,
  onChange,
  placeholder = '0 min',
  label,
  disabled = false,
  error = null,
  min = 0,
  max = 480,
  step = 5,
  required = false,
  className = '',
  id,
  name,
  autoFocus = false,
  showFormatted = true,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Formata minutos para formato legível
  const formatMinutes = minutes => {
    if (
      minutes === null ||
      minutes === undefined ||
      isNaN(minutes) ||
      minutes === 0
    ) {
      return '';
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  };

  // Converte string para minutos
  const parseMinutes = str => {
    if (!str) return 0;

    // Remove espaços extras
    const cleaned = str.trim().toLowerCase();

    // Padrão: "1h 30min" ou "1h30min" ou "1h 30" ou "90min" ou "90"
    const hourMinPattern = /(\d+)\s*h\s*(\d+)?/;
    const minPattern = /(\d+)\s*m(?:in)?/;
    const numPattern = /^(\d+)$/;

    let totalMinutes = 0;

    // Tenta extrair horas
    const hourMatch = cleaned.match(hourMinPattern);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1], 10);
      const mins = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
      totalMinutes = hours * 60 + mins;
    } else {
      // Tenta extrair apenas minutos
      const minMatch = cleaned.match(minPattern);
      if (minMatch) {
        totalMinutes = parseInt(minMatch[1], 10);
      } else {
        // Tenta extrair número puro
        const numMatch = cleaned.match(numPattern);
        if (numMatch) {
          totalMinutes = parseInt(numMatch[1], 10);
        }
      }
    }

    return totalMinutes;
  };

  // Atualiza display quando value externo muda
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(showFormatted ? formatMinutes(value) : value.toString());
    }
  }, [value, isFocused, showFormatted]);

  // Handler de mudança
  const handleChange = e => {
    let inputValue = e.target.value;

    // Permite apenas números, h, m, i, n e espaços
    inputValue = inputValue.replace(/[^\dhmins\s]/gi, '');

    setDisplayValue(inputValue);

    // Converte para minutos
    const minutes = parseMinutes(inputValue);

    // Validação de range
    if (min !== null && minutes < min) return;
    if (max !== null && minutes > max) return;

    onChange(minutes);
  };

  // Handler de increment/decrement com teclado
  const handleKeyDown = e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min((value || 0) + step, max);
      onChange(newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max((value || 0) - step, min);
      onChange(newValue);
    }
  };

  // Handler de focus
  const handleFocus = () => {
    setIsFocused(true);
    // No focus, mostra apenas o número
    setDisplayValue(value > 0 ? value.toString() : '');
  };

  // Handler de blur
  const handleBlur = () => {
    setIsFocused(false);
    // No blur, formata se necessário
    if (showFormatted) {
      setDisplayValue(formatMinutes(value));
    }
  };

  // Gera ID único se não fornecido
  const inputId =
    id || `time-input-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-theme-primary mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-theme-secondary"
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
        </div>

        <input
          id={inputId}
          name={name}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoFocus={autoFocus}
          aria-label={label || 'Duração em minutos'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-helper`}
          className={`
            w-full pl-10 pr-4 py-2.5 
            rounded-md border
            text-theme-primary
            placeholder:text-theme-secondary/50
            transition-all duration-200
            focus:outline-none focus:ring-2
            ${
              error
                ? 'border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-950/10'
                : 'border-light-border dark:border-dark-border focus:ring-primary/20 bg-light-surface dark:bg-dark-surface'
            }
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed bg-light-bg dark:bg-dark-bg'
                : 'hover:border-primary/50'
            }
          `}
        />

        {/* Botões de increment/decrement */}
        {!disabled && (
          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={() => onChange(Math.min((value || 0) + step, max))}
              className="px-2 py-1 text-theme-secondary hover:text-primary hover:bg-primary/5 transition-colors rounded-tr-md"
              aria-label="Aumentar tempo"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.max((value || 0) - step, min))}
              className="px-2 py-1 text-theme-secondary hover:text-primary hover:bg-primary/5 transition-colors rounded-br-md"
              aria-label="Diminuir tempo"
              tabIndex={-1}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1 text-xs text-theme-secondary"
        >
          {min !== null && max !== null
            ? `Entre ${min} e ${max} minutos (use ↑↓ para ajustar)`
            : 'Use ↑↓ para ajustar ou digite (ex: 1h 30min, 90min, 90)'}
        </p>
      )}
    </div>
  );
};

TimeInput.propTypes = {
  /** Valor em minutos */
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
  /** Valor mínimo em minutos */
  min: PropTypes.number,
  /** Valor máximo em minutos */
  max: PropTypes.number,
  /** Incremento/decremento em minutos */
  step: PropTypes.number,
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
  /** Se deve mostrar valor formatado (1h 30min) ou apenas número */
  showFormatted: PropTypes.bool,
};

export default TimeInput;
