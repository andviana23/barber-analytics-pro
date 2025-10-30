import { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * 🗓️ Hook para gerenciar filtros de período (Dia/Semana/Mês)
 *
 * Features:
 * - Calcula automaticamente início e fim do período
 * - Suporta Dia, Semana (seg-dom) e Mês completo
 * - Retorna intervalo formatado para queries
 * - Estado persistente e reativo
 *
 * @param {string} initialPeriod - Período inicial ('day', 'week', 'month')
 * @param {Date} initialDate - Data de referência inicial
 * @returns {object} Estado e funções de controle
 */
const usePeriodFilter = (initialPeriod = 'week', initialDate = new Date()) => {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // ✅ Calcular intervalo de datas baseado no período selecionado
  const dateRange = useMemo(() => {
    let startDate;
    let endDate;

    // Usar a data como está, sem conversões complexas
    const baseDate =
      selectedDate instanceof Date ? selectedDate : new Date(selectedDate);

    console.log('🗓️ usePeriodFilter - Calculando dateRange:', {
      selectedPeriod,
      selectedDate: baseDate,
    });

    switch (selectedPeriod) {
      case 'day':
        // Apenas o dia selecionado
        startDate = startOfDay(baseDate);
        endDate = endOfDay(baseDate);
        break;

      case 'week':
        // Segunda-feira a domingo da semana vigente
        startDate = startOfWeek(baseDate, {
          locale: ptBR,
          weekStartsOn: 1,
        });
        endDate = endOfWeek(baseDate, { locale: ptBR, weekStartsOn: 1 });
        break;

      case 'month':
        // Dia 01 até último dia do mês
        startDate = startOfMonth(baseDate);
        endDate = endOfMonth(baseDate);
        break;

      default:
        // Fallback: semana vigente
        startDate = startOfWeek(baseDate, {
          locale: ptBR,
          weekStartsOn: 1,
        });
        endDate = endOfWeek(baseDate, { locale: ptBR, weekStartsOn: 1 });
    }

    const result = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      startDateObj: startDate,
      endDateObj: endDate,
    };

    console.log('✅ usePeriodFilter - dateRange calculado:', result);

    return result;
  }, [selectedPeriod, selectedDate]);

  // ✅ Descrição amigável do período
  const periodDescription = useMemo(() => {
    const { startDateObj, endDateObj } = dateRange;

    switch (selectedPeriod) {
      case 'day':
        return format(startDateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

      case 'week':
        if (format(startDateObj, 'MM/yyyy') === format(endDateObj, 'MM/yyyy')) {
          // Mesma mês
          return `${format(startDateObj, 'dd', { locale: ptBR })} a ${format(
            endDateObj,
            "dd 'de' MMMM 'de' yyyy",
            { locale: ptBR }
          )}`;
        } else {
          // Meses diferentes
          return `${format(startDateObj, "dd 'de' MMMM", {
            locale: ptBR,
          })} a ${format(endDateObj, "dd 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}`;
        }

      case 'month':
        return format(startDateObj, "MMMM 'de' yyyy", { locale: ptBR });

      default:
        return '';
    }
  }, [selectedPeriod, dateRange]);

  // ✅ Handler para mudança de período
  const handlePeriodChange = period => {
    setSelectedPeriod(period);
  };

  // ✅ Handler para mudança de data
  const handleDateChange = date => {
    setSelectedDate(date);
  };

  // ✅ Reset para hoje
  const resetToToday = () => {
    setSelectedDate(new Date());
  };

  // ✅ Navegar para período anterior
  const goToPreviousPeriod = () => {
    const newDate = new Date(selectedDate);

    switch (selectedPeriod) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    setSelectedDate(newDate);
  };

  // ✅ Navegar para próximo período
  const goToNextPeriod = () => {
    const newDate = new Date(selectedDate);

    switch (selectedPeriod) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    setSelectedDate(newDate);
  };

  // ✅ Verificar se é o período atual
  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    const todayFormatted = format(today, 'yyyy-MM-dd');

    return (
      todayFormatted >= dateRange.startDate &&
      todayFormatted <= dateRange.endDate
    );
  }, [dateRange]);

  return {
    // Estado
    selectedPeriod,
    selectedDate,
    dateRange,
    periodDescription,
    isCurrentPeriod,

    // Handlers
    handlePeriodChange,
    handleDateChange,
    resetToToday,
    goToPreviousPeriod,
    goToNextPeriod,
  };
};

export default usePeriodFilter;
