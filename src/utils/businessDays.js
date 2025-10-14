/**
 * BUSINESS DAYS UTILITY
 * Funções para cálculo de dias úteis (segunda a sexta, excluindo feriados)
 */

/**
 * Feriados nacionais brasileiros fixos e variáveis
 * Formato: { month: [day1, day2, ...] } para feriados fixos
 */
const FIXED_HOLIDAYS = {
  1: [1],      // Ano Novo
  4: [21],     // Tiradentes
  5: [1],      // Dia do Trabalho
  9: [7],      // Independência
  10: [12],    // Nossa Senhora Aparecida
  11: [2, 15], // Finados, Proclamação da República
  12: [25]     // Natal
};

/**
 * Calcula feriados móveis (Páscoa, Carnaval, Corpus Christi)
 * Baseado no algoritmo de Meeus/Jones/Butcher
 */
const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
};

/**
 * Retorna array com todos os feriados do ano (fixos + móveis)
 */
const getHolidays = (year) => {
  const holidays = [];
  
  // Feriados fixos
  Object.entries(FIXED_HOLIDAYS).forEach(([month, days]) => {
    days.forEach(day => {
      holidays.push(new Date(year, parseInt(month) - 1, day));
    });
  });
  
  // Feriados móveis baseados na Páscoa
  const easter = getEasterDate(year);
  
  // Carnaval (47 dias antes da Páscoa)
  const carnaval = new Date(easter);
  carnaval.setDate(easter.getDate() - 47);
  holidays.push(carnaval);
  
  // Sexta-feira Santa (2 dias antes da Páscoa)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push(goodFriday);
  
  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  holidays.push(corpusChristi);
  
  return holidays;
};

/**
 * Verifica se uma data é feriado
 */
export const isHoliday = (date) => {
  const year = date.getFullYear();
  const holidays = getHolidays(year);
  
  return holidays.some(holiday => 
    holiday.getDate() === date.getDate() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getFullYear() === date.getFullYear()
  );
};

/**
 * Verifica se uma data é dia útil (segunda a sexta, não feriado)
 */
export const isBusinessDay = (date) => {
  const dayOfWeek = date.getDay();
  
  // 0 = Domingo, 6 = Sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Verifica se é feriado
  if (isHoliday(date)) {
    return false;
  }
  
  return true;
};

/**
 * Adiciona N dias úteis a uma data
 * @param {Date} startDate - Data inicial
 * @param {number} businessDays - Quantidade de dias úteis a adicionar
 * @returns {Date} - Data final após adicionar os dias úteis
 */
export const addBusinessDays = (startDate, businessDays) => {
  if (businessDays === 0) {
    return new Date(startDate);
  }
  
  const result = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    
    if (isBusinessDay(result)) {
      daysAdded++;
    }
  }
  
  return result;
};

/**
 * Adiciona N dias CORRIDOS a uma data e ajusta para o próximo dia útil
 * Esta função implementa o padrão real do mercado financeiro:
 * - Adiciona dias corridos (incluindo sábados, domingos e feriados)
 * - Se o dia final cair em final de semana ou feriado, avança para o próximo dia útil
 * 
 * @param {Date} startDate - Data inicial (data de pagamento/competência)
 * @param {number} calendarDays - Quantidade de dias corridos a adicionar (ex: 30, 14, 7)
 * @returns {Date} - Data final ajustada para dia útil
 * 
 * @example
 * // Pagamento em 01/10/2025
 * const paymentDate = new Date(2025, 9, 1);
 * const receiptDate = addCalendarDaysWithBusinessDayAdjustment(paymentDate, 30);
 * // Resultado: 31/10/2025 (se for dia útil) ou próximo dia útil
 * // Se 31/10 for sábado, retorna 02/11 (segunda-feira)
 */
export const addCalendarDaysWithBusinessDayAdjustment = (startDate, calendarDays) => {
  if (calendarDays === 0) {
    return new Date(startDate);
  }
  
  // 1. Adiciona os dias corridos
  const result = new Date(startDate);
  result.setDate(result.getDate() + calendarDays);
  
  // 2. Se cair em dia não útil, avança para o próximo dia útil
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
};

/**
 * Calcula a diferença em dias úteis entre duas datas
 * @param {Date} startDate - Data inicial
 * @param {Date} endDate - Data final
 * @returns {number} - Quantidade de dias úteis entre as datas
 */
export const countBusinessDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

/**
 * Formata uma data para exibição
 * @param {Date} date - Data a formatar
 * @returns {string} - Data formatada (DD/MM/YYYY)
 */
export const formatDate = (date) => {
  return date.toLocaleDateString('pt-BR');
};

/**
 * Exemplo de uso:
 * 
 * import { addBusinessDays, isBusinessDay, countBusinessDays } from '@/utils/businessDays';
 * 
 * // Adicionar 30 dias úteis a partir de hoje
 * const today = new Date();
 * const receiptDate = addBusinessDays(today, 30);
 * console.log(`Recebimento em: ${formatDate(receiptDate)}`);
 * 
 * // Verificar se uma data é dia útil
 * const isWorkDay = isBusinessDay(new Date(2024, 0, 1)); // false (feriado)
 * 
 * // Contar dias úteis entre duas datas
 * const days = countBusinessDays(new Date(2024, 0, 1), new Date(2024, 0, 31));
 * console.log(`Dias úteis em janeiro/2024: ${days}`);
 */
