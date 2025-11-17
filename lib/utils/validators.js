/**
 * Validators Utilities
 * Barber Analytics Pro - v2.0.0
 *
 * @module validators
 * @description Funções de validação reutilizáveis
 * @author Andrey Viana
 * @created 2025-11-13
 */

/**
 * Valida se uma string é um UUID válido (v4)
 * @param {string} uuid - String para validar
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(uuid);
}

/**
 * Valida se uma string é um email válido
 * @param {string} email - Email para validar
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma string é um CPF válido
 * @param {string} cpf - CPF para validar (apenas números)
 * @returns {boolean}
 */
export function isValidCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }

  // Remove formatação
  cpf = cpf.replace(/\D/g, '');

  if (cpf.length !== 11) {
    return false;
  }

  // Verifica sequências inválidas
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Valida dígitos verificadores
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * Valida se uma string é um CNPJ válido
 * @param {string} cnpj - CNPJ para validar (apenas números)
 * @returns {boolean}
 */
export function isValidCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }

  // Remove formatação
  cnpj = cnpj.replace(/\D/g, '');

  if (cnpj.length !== 14) {
    return false;
  }

  // Verifica sequências inválidas
  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  // Valida primeiro dígito verificador
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Valida se uma string é um telefone brasileiro válido
 * @param {string} phone - Telefone para validar
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  // Remove formatação
  phone = phone.replace(/\D/g, '');

  // Aceita formatos: 10 dígitos (fixo) ou 11 dígitos (celular)
  if (phone.length !== 10 && phone.length !== 11) {
    return false;
  }

  // Validação básica de DDD (11-99)
  const ddd = parseInt(phone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  return true;
}

/**
 * Valida se uma URL é válida
 * @param {string} url - URL para validar
 * @returns {boolean}
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se um valor está dentro de um range
 * @param {number} value - Valor para validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean}
 */
export function isInRange(value, min, max) {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Valida se uma data é válida
 * @param {Date|string} date - Data para validar
 * @returns {boolean}
 */
export function isValidDate(date) {
  if (!date) {
    return false;
  }

  const d = date instanceof Date ? date : new Date(date);
  return !isNaN(d.getTime());
}

export default {
  isValidUUID,
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  isValidURL,
  isInRange,
  isValidDate,
};
