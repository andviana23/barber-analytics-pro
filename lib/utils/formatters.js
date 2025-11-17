/**
 * Formatters Utilities
 * Barber Analytics Pro - v2.0.0
 *
 * @module formatters
 * @description Funções de formatação reutilizáveis
 * @author Andrey Viana
 * @created 2025-11-13
 */

/**
 * Formata valor monetário para Real Brasileiro
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata número com separadores de milhar
 * @param {number} value - Número para formatar
 * @param {number} decimals - Casas decimais (padrão: 2)
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formata porcentagem
 * @param {number} value - Valor para formatar (0-100)
 * @param {number} decimals - Casas decimais (padrão: 1)
 * @returns {string}
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${formatNumber(value, decimals)}%`;
}

/**
 * Formata CPF (###.###.###-##)
 * @param {string} cpf - CPF para formatar
 * @returns {string}
 */
export function formatCPF(cpf) {
  if (!cpf) return '';

  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (##.###.###/####-##)
 * @param {string} cnpj - CNPJ para formatar
 * @returns {string}
 */
export function formatCNPJ(cnpj) {
  if (!cnpj) return '';

  const cleaned = cnpj.replace(/\D/g, '');

  if (cleaned.length !== 14) return cnpj;

  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone para formatar
 * @returns {string} (##) #####-#### ou (##) ####-####
 */
export function formatPhone(phone) {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    // Celular: (11) 91234-5678
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (11) 1234-5678
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Formata CEP (#####-###)
 * @param {string} cep - CEP para formatar
 * @returns {string}
 */
export function formatCEP(cep) {
  if (!cep) return '';

  const cleaned = cep.replace(/\D/g, '');

  if (cleaned.length !== 8) return cep;

  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Trunca texto com reticências
 * @param {string} text - Texto para truncar
 * @param {number} maxLength - Comprimento máximo
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza primeira letra
 * @param {string} text - Texto para capitalizar
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return '';

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Converte para title case
 * @param {string} text - Texto para converter
 * @returns {string}
 */
export function titleCase(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCPF,
  formatCNPJ,
  formatPhone,
  formatCEP,
  truncate,
  capitalize,
  titleCase,
};
