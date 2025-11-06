import React from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';

/**
 * 📅 Componente de Filtro de Período - Atomic Design
 *
 * Permite selecionar entre:
 * - Dia: Mostra apenas o dia selecionado
 * - Semana: Segunda a domingo da semana vigente
 * - Mês: Do dia 01 até o último dia do mês
 *
 * @param {string} selectedPeriod - Período selecionado ('day', 'week', 'month')
 * @param {function} onPeriodChange - Callback ao mudar o período
 * @param {Date} selectedDate - Data selecionada para o filtro
 * @param {function} onDateChange - Callback ao mudar a data
 */
const PeriodFilter = ({
  selectedPeriod = 'week',
  onPeriodChange,
  selectedDate = new Date(),
  onDateChange,
}) => {
  const periods = [
    {
      id: 'day',
      label: 'Dia',
      icon: Calendar,
      description: 'Visualizar apenas um dia',
    },
    {
      id: 'week',
      label: 'Semana',
      icon: CalendarDays,
      description: 'Visualizar semana completa (seg-dom)',
    },
    {
      id: 'month',
      label: 'Mês',
      icon: CalendarRange,
      description: 'Visualizar mês completo',
    },
  ];
  return (
    <div className="space-y-4">
      {/* Seletor de Período */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-theme-secondary text-xs font-bold uppercase tracking-wider">
          Período:
        </label>
        <div className="card-theme flex items-center gap-2 rounded-xl p-1 dark:bg-dark-surface">
          {periods.map(period => {
            const Icon = period.icon;
            const isActive = selectedPeriod === period.id;
            return (
              <button
                key={period.id}
                onClick={() => onPeriodChange(period.id)}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${isActive ? 'scale-105 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-theme-secondary hover:text-theme-primary hover:bg-white dark:hover:bg-gray-700'} `}
                title={period.description}
              >
                <Icon
                  className={`h-4 w-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                <span>{period.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor de Data (Calendário) */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="period-date"
          className="text-theme-secondary text-xs font-bold uppercase tracking-wider"
        >
          Data de Referência:
        </label>
        <input
          id="period-date"
          type="date"
          value={
            selectedDate instanceof Date && !isNaN(selectedDate)
              ? selectedDate.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          }
          onChange={e => onDateChange(new Date(e.target.value))}
          className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-2 font-semibold transition-all duration-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:hover:border-blue-500 dark:focus:ring-blue-400"
        />
      </div>
    </div>
  );
};
export default PeriodFilter;
