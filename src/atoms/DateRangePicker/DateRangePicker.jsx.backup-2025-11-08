/**
 * DateRangePicker.jsx
 *
 * Seletor de período com presets e data customizada
 * Presets: Hoje, Esta semana, Este mês, Últimos 30 dias, Personalizado
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  addDays,
  parseISO,
  isValid,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronDown, X } from 'lucide-react';
const DateRangePicker = ({
  value,
  onChange,
  presets = true,
  placeholder = 'Selecione o período',
  className = '',
  disabled = false,
  clearable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Presets de período
  const datePresets = [
    {
      id: 'today',
      label: 'Hoje',
      getValue: () => ({
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date()),
      }),
    },
    {
      id: 'yesterday',
      label: 'Ontem',
      getValue: () => {
        const yesterday = subDays(new Date(), 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
        };
      },
    },
    {
      id: 'thisWeek',
      label: 'Esta semana',
      getValue: () => ({
        startDate: startOfWeek(new Date(), {
          locale: ptBR,
        }),
        endDate: endOfWeek(new Date(), {
          locale: ptBR,
        }),
      }),
    },
    {
      id: 'lastWeek',
      label: 'Semana passada',
      getValue: () => {
        const lastWeek = subDays(new Date(), 7);
        return {
          startDate: startOfWeek(lastWeek, {
            locale: ptBR,
          }),
          endDate: endOfWeek(lastWeek, {
            locale: ptBR,
          }),
        };
      },
    },
    {
      id: 'thisMonth',
      label: 'Este mês',
      getValue: () => ({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
      }),
    },
    {
      id: 'lastMonth',
      label: 'Mês passado',
      getValue: () => {
        const lastMonth = subDays(startOfMonth(new Date()), 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
      },
    },
    {
      id: 'last30Days',
      label: 'Últimos 30 dias',
      getValue: () => ({
        startDate: startOfDay(subDays(new Date(), 29)),
        endDate: endOfDay(new Date()),
      }),
    },
    {
      id: 'last90Days',
      label: 'Últimos 90 dias',
      getValue: () => ({
        startDate: startOfDay(subDays(new Date(), 89)),
        endDate: endOfDay(new Date()),
      }),
    },
  ];

  // Detectar preset ativo baseado no valor atual
  useEffect(() => {
    if (value?.startDate && value?.endDate) {
      const currentStart = new Date(value.startDate).getTime();
      const currentEnd = new Date(value.endDate).getTime();
      const matchingPreset = datePresets.find(preset => {
        const presetValue = preset.getValue();
        return (
          presetValue.startDate.getTime() === currentStart &&
          presetValue.endDate.getTime() === currentEnd
        );
      });
      setSelectedPreset(matchingPreset?.id || 'custom');

      // Se é customizado, preencher campos
      if (!matchingPreset) {
        setCustomStartDate(format(new Date(value.startDate), 'yyyy-MM-dd'));
        setCustomEndDate(format(new Date(value.endDate), 'yyyy-MM-dd'));
      }
    } else {
      setSelectedPreset(null);
    }
  }, [value]);

  // Aplicar preset selecionado
  const handlePresetSelect = presetId => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getValue();
      setSelectedPreset(presetId);
      onChange(range);
      setIsOpen(false);
    }
  };

  // Aplicar datas customizadas
  const handleCustomDateApply = () => {
    if (!customStartDate || !customEndDate) return;
    const startDate = parseISO(customStartDate);
    const endDate = parseISO(customEndDate);
    if (!isValid(startDate) || !isValid(endDate)) return;
    if (startDate > endDate) return;
    setSelectedPreset('custom');
    onChange({
      startDate: startOfDay(startDate),
      endDate: endOfDay(endDate),
    });
    setIsOpen(false);
  };

  // Limpar seleção
  const handleClear = e => {
    e.stopPropagation();
    setSelectedPreset(null);
    setCustomStartDate('');
    setCustomEndDate('');
    onChange(null);
  };

  // Formatar valor para exibição
  const formatDisplayValue = () => {
    if (!value?.startDate || !value?.endDate) {
      return placeholder;
    }
    const preset = datePresets.find(p => p.id === selectedPreset);
    if (preset) {
      return preset.label;
    }

    // Formato customizado
    const startStr = format(new Date(value.startDate), 'dd/MM/yyyy', {
      locale: ptBR,
    });
    const endStr = format(new Date(value.endDate), 'dd/MM/yyyy', {
      locale: ptBR,
    });
    if (startStr === endStr) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  };
  const containerClasses = `relative inline-block ${className}`;
  const triggerClasses = `
    flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md
    bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
    ${value ? 'text-gray-900' : 'text-gray-500'}
  `;
  return (
    <div className={containerClasses}>
      {/* Trigger - Usando div para evitar button aninhado */}
      <div
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
        aria-disabled={disabled}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <Calendar className="text-light-text-muted dark:text-dark-text-muted mr-2 h-4 w-4" />
          <span className="truncate">{formatDisplayValue()}</span>
        </div>

        <div className="ml-2 flex items-center">
          {clearable && value && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                handleClear(e);
              }}
              className="hover:card-theme rounded p-0.5"
              title="Limpar"
            >
              <X className="text-light-text-muted dark:text-dark-text-muted h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={`ml-1 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="card-theme absolute z-50 mt-1 w-80 rounded-md border border-light-border shadow-lg dark:border-dark-border">
          <div className="p-4">
            {/* Presets */}
            {presets && (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Períodos Rápidos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {datePresets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`rounded-md px-3 py-2 text-left text-xs transition-colors ${selectedPreset === preset.id ? 'border border-blue-200 bg-blue-100 text-blue-700' : 'border border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100'} `}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divisor */}
            {presets && (
              <div className="-mx-4 mb-4 border-t border-light-border dark:border-dark-border"></div>
            )}

            {/* Datas customizadas */}
            <div className="-mx-4 px-4">
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Período Personalizado
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-theme-secondary mb-1 block text-xs font-medium">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="w-full rounded-md border border-light-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  />
                </div>

                <div>
                  <label className="text-theme-secondary mb-1 block text-xs font-medium">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="w-full rounded-md border border-light-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-theme-secondary hover:text-theme-primary px-3 py-1.5 text-sm"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleCustomDateApply}
                    disabled={!customStartDate || !customEndDate}
                    className="text-dark-text-primary rounded-md bg-blue-600 px-4 py-1.5 text-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
DateRangePicker.propTypes = {
  /**
   * Valor atual do range selecionado
   */
  value: PropTypes.shape({
    startDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    endDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
  }),
  /**
   * Callback quando o valor muda
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Mostrar presets rápidos
   */
  presets: PropTypes.bool,
  /**
   * Placeholder quando nenhum valor selecionado
   */
  placeholder: PropTypes.string,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
  /**
   * Componente desabilitado
   */
  disabled: PropTypes.bool,
  /**
   * Permite limpar seleção
   */
  clearable: PropTypes.bool,
};

// Componente de preview para demonstração
export const DateRangePickerPreview = () => {
  const [selectedRange, setSelectedRange] = useState(null);
  return (
    <div className="max-w-md space-y-4 p-4">
      <h3 className="text-lg font-semibold">DateRangePicker Preview</h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Selecione um período:
        </label>
        <DateRangePicker
          value={selectedRange}
          onChange={setSelectedRange}
          placeholder="Escolha o período"
        />
      </div>

      {selectedRange && (
        <div className="mt-4 rounded-md bg-light-bg p-3 dark:bg-dark-bg">
          <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
            Valor selecionado:
          </h4>
          <pre className="text-theme-secondary text-xs">
            {JSON.stringify(
              {
                startDate: format(
                  new Date(selectedRange.startDate),
                  'yyyy-MM-dd'
                ),
                endDate: format(new Date(selectedRange.endDate), 'yyyy-MM-dd'),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Versão sem presets */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Sem presets:
        </label>
        <DateRangePicker
          value={selectedRange}
          onChange={setSelectedRange}
          presets={false}
          placeholder="Somente datas customizadas"
        />
      </div>

      {/* Versão desabilitada */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
          Desabilitado:
        </label>
        <DateRangePicker
          value={selectedRange}
          onChange={setSelectedRange}
          disabled={true}
          placeholder="Componente desabilitado"
        />
      </div>
    </div>
  );
};
export default DateRangePicker;
