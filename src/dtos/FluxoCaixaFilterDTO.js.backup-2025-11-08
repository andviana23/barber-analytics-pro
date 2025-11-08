/**
 * 📝 Fluxo de Caixa Filter DTO
 *
 * @class FluxoCaixaFilterDTO
 * @description Data Transfer Object para validação de filtros de fluxo de caixa
 *
 * Responsabilidades:
 * - Validar filtros de entrada
 * - Normalizar formatos de data
 * - Garantir type safety
 * - Retornar erros descritivos
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { format, isValid, parseISO } from 'date-fns';

export class FluxoCaixaFilterDTO {
  /**
   * @param {Object} data
   * @param {string} data.unitId - ID da unidade (UUID)
   * @param {string|Date} data.startDate - Data inicial
   * @param {string|Date} data.endDate - Data final
   * @param {boolean} [data.includeWeekends=false] - Incluir fins de semana?
   */
  constructor(data = {}) {
    this.unitId = data.unitId;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.includeWeekends = data.includeWeekends ?? false;
    this.errors = [];
  }

  /**
   * Valida todos os campos
   * @returns {boolean} True se todos os campos são válidos
   */
  isValid() {
    this.errors = [];

    // Validar unitId
    if (!this.unitId) {
      this.errors.push('unitId é obrigatório');
    } else if (typeof this.unitId !== 'string' || this.unitId.trim() === '') {
      this.errors.push('unitId deve ser uma string não vazia');
    }

    // Validar startDate
    if (!this.startDate) {
      this.errors.push('startDate é obrigatório');
    } else {
      const startDateObj = this._parseDate(this.startDate);
      if (!startDateObj) {
        this.errors.push('startDate inválido (use YYYY-MM-DD ou objeto Date)');
      }
    }

    // Validar endDate
    if (!this.endDate) {
      this.errors.push('endDate é obrigatório');
    } else {
      const endDateObj = this._parseDate(this.endDate);
      if (!endDateObj) {
        this.errors.push('endDate inválido (use YYYY-MM-DD ou objeto Date)');
      }
    }

    // Validar que startDate <= endDate
    if (this.startDate && this.endDate) {
      const start = this._parseDate(this.startDate);
      const end = this._parseDate(this.endDate);

      if (start && end && start > end) {
        this.errors.push('startDate deve ser anterior ou igual a endDate');
      }
    }

    // Validar includeWeekends
    if (typeof this.includeWeekends !== 'boolean') {
      this.errors.push('includeWeekends deve ser um boolean');
    }

    return this.errors.length === 0;
  }

  /**
   * Retorna erros de validação
   * @returns {string} String com todos os erros separados por vírgula
   */
  getErrors() {
    return this.errors.join(', ');
  }

  /**
   * Retorna objeto validado e normalizado
   * @returns {Object} Objeto com dados validados
   */
  toObject() {
    return {
      unitId: this.unitId.trim(),
      startDate: this._formatDate(this.startDate),
      endDate: this._formatDate(this.endDate),
      includeWeekends: this.includeWeekends,
    };
  }

  /**
   * Parse date (aceita string ou Date)
   * @private
   * @param {string|Date} date
   * @returns {Date|null}
   */
  _parseDate(date) {
    if (!date) return null;

    // Se já é Date
    if (date instanceof Date) {
      return isValid(date) ? date : null;
    }

    // Se é string
    if (typeof date === 'string') {
      const parsed = parseISO(date);
      return isValid(parsed) ? parsed : null;
    }

    return null;
  }

  /**
   * Formata data para YYYY-MM-DD
   * @private
   * @param {string|Date} date
   * @returns {string}
   */
  _formatDate(date) {
    const parsed = this._parseDate(date);
    return parsed ? format(parsed, 'yyyy-MM-dd') : '';
  }
}
