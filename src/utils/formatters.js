/**
 * Utilitários de formatação de dados
 * @module utils/formatters
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata valor monetário para Real Brasileiro
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
export const formatCurrency = value => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata data para formato brasileiro
 * @param {string|Date} date - Data a ser formatada (string ISO ou objeto Date)
 * @param {string} pattern - Padrão de formatação (padrão: 'dd/MM/yyyy')
 * @returns {string} Data formatada (ex: "31/12/2023")
 */
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) {
    return '-';
  }

  try {
    let dateObj;

    if (typeof date === 'string') {
      // Se é uma string no formato 'YYYY-MM-DD', criar data local explicitamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day); // Cria data local, não UTC
      } else {
        dateObj = parseISO(date);
      }
    } else {
      dateObj = date;
    }

    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Erro ao formatar data:', error);
    return '-';
  }
};

/**
 * Formata data e hora para formato brasileiro
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data e hora formatadas (ex: "31/12/2023 14:30")
 */
export const formatDateTime = date => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Converte data para formato ISO (yyyy-MM-dd) preservando a data original
 * @param {Date|string} date - Data para converter
 * @returns {string} Data em formato ISO
 */
export const formatDateForDB = date => {
  if (!date) return null;

  let dateObj;

  if (typeof date === 'string') {
    // Se é uma string no formato 'YYYY-MM-DD', criar data local explicitamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // Cria data local, não UTC
    } else {
      dateObj = parseISO(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) return null;

  // Usar componentes locais da data (não UTC) para manter a data correta
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}; /**
 * Formata percentual
 * @param {number} value - Valor decimal (ex: 0.15 para 15%)
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} Percentual formatado (ex: "15,00%")
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formata número com separadores de milhares
 * @param {number} value - Número a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 0)
 * @returns {string} Número formatado (ex: "1.234,56")
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formata CPF
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado (ex: "123.456.789-00")
 */
export const formatCPF = cpf => {
  if (!cpf) return '';

  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} CNPJ formatado (ex: "12.345.678/0001-90")
 */
export const formatCNPJ = cnpj => {
  if (!cnpj) return '';

  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;

  return cleaned.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Formata telefone
 * @param {string} phone - Telefone sem formatação
 * @returns {string} Telefone formatado (ex: "(11) 98765-4321")
 */
export const formatPhone = phone => {
  if (!phone) return '';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
};
