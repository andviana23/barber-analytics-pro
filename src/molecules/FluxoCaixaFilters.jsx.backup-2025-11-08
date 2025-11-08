/**
 * 🔍 FluxoCaixaFilters Component
 *
 * @component
 * @description Filtros do fluxo de caixa (período e fins de semana)
 *
 * Features:
 * - Seletor de período (Dia, Semana, Mês, Trimestre, Ano, Personalizado)
 * - Toggle de fins de semana
 * - Data picker para período personalizado
 * - Design System 100%
 * - Dark mode automático
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { Calendar } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.filters - Filtros atuais
 * @param {Function} props.onFilterChange - Callback ao mudar filtros
 * @param {boolean} props.includeWeekends - Incluir fins de semana?
 * @param {Function} props.onToggleWeekends - Callback ao mudar toggle
 */
export function FluxoCaixaFilters({
  filters,
  onFilterChange,
  includeWeekends,
  onToggleWeekends,
}) {
  const periods = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="card-theme rounded-xl border p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Período */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-theme-secondary text-sm font-medium">
            Período:
          </span>
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() =>
                onFilterChange({ ...filters, period: period.value })
              }
              className={`btn-theme-secondary px-3 py-1.5 text-sm transition-colors ${
                filters?.period === period.value ? 'btn-theme-primary' : ''
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Toggle Fins de Semana */}
        <div className="flex items-center gap-3">
          <span className="text-theme-secondary text-sm font-medium">
            Incluir fins de semana:
          </span>
          <button
            onClick={onToggleWeekends}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              includeWeekends
                ? 'bg-primary'
                : 'bg-light-border dark:bg-dark-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeWeekends ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Período Personalizado (se selecionado) */}
      {filters?.period === 'custom' && (
        <div className="mt-4 flex flex-col gap-3 border-t border-light-border pt-4 dark:border-dark-border sm:flex-row">
          <div className="flex-1">
            <label className="text-theme-secondary mb-1 block text-xs font-medium">
              Data Inicial
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters?.startDate || ''}
                onChange={e =>
                  onFilterChange({ ...filters, startDate: e.target.value })
                }
                className="input-theme w-full"
              />
              <Calendar className="text-theme-secondary pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-theme-secondary mb-1 block text-xs font-medium">
              Data Final
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters?.endDate || ''}
                onChange={e =>
                  onFilterChange({ ...filters, endDate: e.target.value })
                }
                className="input-theme w-full"
              />
              <Calendar className="text-theme-secondary pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FluxoCaixaFilters;
