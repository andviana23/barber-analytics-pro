/**
 * Utilitário para cálculo de dias úteis
 * Considera finais de semana e feriados nacionais brasileiros
 */

import { addDays, isWeekend, getYear, format } from 'date-fns';

/**
 * Feriados fixos brasileiros (dia/mês)
 */
const FIXED_HOLIDAYS = [
  '01/01', // Ano Novo
  '21/04', // Tiradentes
  '01/05', // Dia do Trabalho
  '07/09', // Independência
  '12/10', // Nossa Senhora Aparecida
  '02/11', // Finados
  '15/11', // Proclamação da República
  '25/12', // Natal
];

/**
 * Feriados móveis brasileiros por ano
 * Atualizar anualmente ou calcular dinamicamente
 */
const MOVABLE_HOLIDAYS = {
  2024: [
    '2024-02-13', // Carnaval
    '2024-03-29', // Sexta-feira Santa
    '2024-05-30', // Corpus Christi
  ],
  2025: [
    '2025-03-04', // Carnaval
    '2025-04-18', // Sexta-feira Santa
    '2025-06-19', // Corpus Christi
  ],
  2026: [
    '2026-02-17', // Carnaval
    '2026-04-03', // Sexta-feira Santa
    '2026-06-04', // Corpus Christi
  ],
};

/**
 * Verifica se uma data é feriado
 * @param {Date} date - Data a verificar
 * @returns {boolean} - True se for feriado
 */
export function isHoliday(date) {
  const dayMonth = format(date, 'dd/MM');
  const fullDate = format(date, 'yyyy-MM-dd');
  const year = getYear(date);

  // Verifica feriados fixos
  if (FIXED_HOLIDAYS.includes(dayMonth)) {
    return true;
  }

  // Verifica feriados móveis
  const yearHolidays = MOVABLE_HOLIDAYS[year] || [];
  if (yearHolidays.includes(fullDate)) {
    return true;
  }

  return false;
}

/**
 * Verifica se uma data é dia útil (não é fim de semana nem feriado)
 * @param {Date} date - Data a verificar
 * @returns {boolean} - True se for dia útil
 */
export function isBusinessDay(date) {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Adiciona dias CORRIDOS e ajusta para o próximo dia útil se necessário
 * Usado para calcular previsão de recebimento de pagamentos
 *
 * @param {Date} startDate - Data inicial
 * @param {number} calendarDays - Número de dias corridos a adicionar
 * @returns {Date} - Data final ajustada para dia útil
 *
 * @example
 * // 18/10/2025 (sábado) + 1 dia corrido = 19/10 (domingo) → ajusta para 20/10 (segunda)
 * addBusinessDays(new Date('2025-10-18'), 1) // 2025-10-20
 */
export function addCalendarDaysAndAdjustToBusinessDay(startDate, calendarDays) {
  // Adicionar dias corridos
  let resultDate = addDays(startDate, calendarDays);

  // Ajustar para o próximo dia útil se cair em fim de semana ou feriado
  while (!isBusinessDay(resultDate)) {
    resultDate = addDays(resultDate, 1);
  }

  return resultDate;
}

/**
 * Adiciona dias ÚTEIS (pula finais de semana e feriados)
 * @param {Date} startDate - Data inicial
 * @param {number} businessDays - Número de dias úteis a adicionar
 * @returns {Date} - Data final
 *
 * @example
 * // 18/10/2025 (sábado) + 1 dia útil = 20/10 (segunda)
 * addBusinessDays(new Date('2025-10-18'), 1) // 2025-10-20
 */
export function addBusinessDays(startDate, businessDays) {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    currentDate = addDays(currentDate, 1);
    if (isBusinessDay(currentDate)) {
      daysAdded++;
    }
  }

  return currentDate;
}

/**
 * Calcula a diferença em dias úteis entre duas datas
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {number} - Número de dias úteis entre as datas
 */
export function getBusinessDaysBetween(startDate, endDate) {
  let currentDate = new Date(startDate);
  let count = 0;

  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}
