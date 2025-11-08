/**
 * 📝 Fluxo de Caixa Daily DTO
 *
 * @class FluxoCaixaDailyDTO
 * @description Data Transfer Object para validação de dados diários de fluxo de caixa
 *
 * Responsabilidades:
 * - Validar estrutura de dados diários
 * - Normalizar valores numéricos
 * - Garantir consistência de cálculos
 * - Retornar erros descritivos
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { isValid, parseISO } from 'date-fns';

export class FluxoCaixaDailyDTO {
  /**
   * @param {Object} data
   * @param {string} data.date - Data (YYYY-MM-DD ou 'SALDO_INICIAL')
   * @param {number} data.entries - Entradas (receitas)
   * @param {number} data.exits - Saídas (despesas)
   * @param {number} data.dailyBalance - Saldo do dia (calculado)
   * @param {number} data.accumulated - Saldo acumulado
   * @param {boolean} [data.isSaldoInicial=false] - É linha de saldo inicial?
   */
  constructor(data = {}) {
    this.date = data.date;
    this.entries = data.entries ?? 0;
    this.exits = data.exits ?? 0;
    this.dailyBalance = data.dailyBalance ?? 0;
    this.accumulated = data.accumulated ?? 0;
    this.isSaldoInicial = data.isSaldoInicial ?? false;
    this.errors = [];
  }

  /**
   * Valida todos os campos
   * @returns {boolean} True se todos os campos são válidos
   */
  isValid() {
    this.errors = [];

    // Validar date
    if (!this.date) {
      this.errors.push('date é obrigatório');
    } else if (this.date !== 'SALDO_INICIAL') {
      const dateObj = parseISO(this.date);
      if (!isValid(dateObj)) {
        this.errors.push(
          'date deve ser uma data válida (YYYY-MM-DD) ou "SALDO_INICIAL"'
        );
      }
    }

    // Validar entries
    if (typeof this.entries !== 'number' || this.entries < 0) {
      this.errors.push('entries deve ser um número não negativo');
    }

    // Validar exits
    if (typeof this.exits !== 'number' || this.exits < 0) {
      this.errors.push('exits deve ser um número não negativo');
    }

    // Validar dailyBalance
    if (typeof this.dailyBalance !== 'number') {
      this.errors.push('dailyBalance deve ser um número');
    }

    // Validar accumulated
    if (typeof this.accumulated !== 'number') {
      this.errors.push('accumulated deve ser um número');
    }

    // Validar consistência: dailyBalance = entries - exits
    const expectedDailyBalance = this.entries - this.exits;
    if (Math.abs(this.dailyBalance - expectedDailyBalance) > 0.01) {
      this.errors.push(
        `dailyBalance inconsistente: esperado ${expectedDailyBalance}, recebido ${this.dailyBalance}`
      );
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
      date: this.date,
      entries: Number(this.entries.toFixed(2)),
      exits: Number(this.exits.toFixed(2)),
      dailyBalance: Number(this.dailyBalance.toFixed(2)),
      accumulated: Number(this.accumulated.toFixed(2)),
      isSaldoInicial: this.isSaldoInicial,
    };
  }

  /**
   * Valida array de dados diários
   * @static
   * @param {Array} dailyArray - Array de objetos com dados diários
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  static validateArray(dailyArray) {
    if (!Array.isArray(dailyArray)) {
      return {
        isValid: false,
        errors: ['dailyArray deve ser um array'],
      };
    }

    if (dailyArray.length === 0) {
      return {
        isValid: false,
        errors: ['dailyArray não pode estar vazio'],
      };
    }

    const errors = [];
    dailyArray.forEach((item, index) => {
      const dto = new FluxoCaixaDailyDTO(item);
      if (!dto.isValid()) {
        errors.push(`Item ${index}: ${dto.getErrors()}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normaliza array de dados diários
   * @static
   * @param {Array} dailyArray - Array de objetos com dados diários
   * @returns {Array} Array normalizado
   */
  static normalizeArray(dailyArray) {
    return dailyArray.map(item => new FluxoCaixaDailyDTO(item).toObject());
  }
}
