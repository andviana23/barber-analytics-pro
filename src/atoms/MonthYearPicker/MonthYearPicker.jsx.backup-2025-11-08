/**
 * MonthYearPicker.jsx
 *
 * Seletor de Mês e Ano para filtros
 * Design System compliant
 *
 * @author Andrey Viana
 * @created 2025-11-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MonthYearPicker = ({
  selectedDate,
  onChange,
  label = 'Mês de Referência',
  className = '',
}) => {
  // Converter Date para string no formato YYYY-MM
  const dateValue =
    selectedDate instanceof Date
      ? format(selectedDate, 'yyyy-MM')
      : selectedDate;

  const handleChange = e => {
    const value = e.target.value; // YYYY-MM
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    onChange(date);
  };

  // Gerar label do mês selecionado
  const monthLabel =
    selectedDate instanceof Date
      ? format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })
      : 'Selecione o mês';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-theme-primary flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-blue-500" />
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          type="month"
          value={dateValue}
          onChange={handleChange}
          className="input-theme flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
        />

        <div className="card-theme rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-800 dark:bg-blue-900/20">
          <span className="text-theme-primary text-sm font-bold capitalize">
            {monthLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

MonthYearPicker.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
  ]).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string,
};

export default MonthYearPicker;
