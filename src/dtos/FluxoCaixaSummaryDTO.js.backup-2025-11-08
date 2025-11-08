/**
 * 📝 Fluxo de Caixa Summary DTO
 *
 * @class FluxoCaixaSummaryDTO
 * @description Data Transfer Object para validação de resumo/KPIs de fluxo de caixa
 *
 * Responsabilidades:
 * - Validar estrutura de resumo
 * - Normalizar KPIs
 * - Calcular métricas derivadas
 * - Retornar erros descritivos
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

export class FluxoCaixaSummaryDTO {
  /**
   * @param {Object} data
   * @param {number} data.totalEntries - Total de entradas
   * @param {number} data.totalExits - Total de saídas
   * @param {number} data.finalBalance - Saldo final
   * @param {number} data.initialBalance - Saldo inicial
   * @param {number} data.netProfit - Lucro líquido (entradas - saídas)
   * @param {number} [data.totalRevenues] - Quantidade de receitas
   * @param {number} [data.totalExpenses] - Quantidade de despesas
   * @param {number} [data.daysWithMovement] - Dias com movimentação
   * @param {number} [data.profitMargin] - Margem de lucro (%)
   */
  constructor(data = {}) {
    this.totalEntries = data.totalEntries ?? 0;
    this.totalExits = data.totalExits ?? 0;
    this.finalBalance = data.finalBalance ?? 0;
    this.initialBalance = data.initialBalance ?? 0;
    this.netProfit = data.netProfit ?? 0;
    this.totalRevenues = data.totalRevenues ?? 0;
    this.totalExpenses = data.totalExpenses ?? 0;
    this.daysWithMovement = data.daysWithMovement ?? 0;
    this.profitMargin = data.profitMargin ?? 0;
    this.errors = [];
  }

  /**
   * Valida todos os campos
   * @returns {boolean} True se todos os campos são válidos
   */
  isValid() {
    this.errors = [];

    // Validar totalEntries
    if (typeof this.totalEntries !== 'number' || this.totalEntries < 0) {
      this.errors.push('totalEntries deve ser um número não negativo');
    }

    // Validar totalExits
    if (typeof this.totalExits !== 'number' || this.totalExits < 0) {
      this.errors.push('totalExits deve ser um número não negativo');
    }

    // Validar finalBalance
    if (typeof this.finalBalance !== 'number') {
      this.errors.push('finalBalance deve ser um número');
    }

    // Validar initialBalance
    if (typeof this.initialBalance !== 'number') {
      this.errors.push('initialBalance deve ser um número');
    }

    // Validar netProfit
    if (typeof this.netProfit !== 'number') {
      this.errors.push('netProfit deve ser um número');
    }

    // Validar consistência: netProfit = totalEntries - totalExits
    const expectedNetProfit = this.totalEntries - this.totalExits;
    if (Math.abs(this.netProfit - expectedNetProfit) > 0.01) {
      this.errors.push(
        `netProfit inconsistente: esperado ${expectedNetProfit}, recebido ${this.netProfit}`
      );
    }

    // Validar consistência: finalBalance = initialBalance + netProfit
    const expectedFinalBalance = this.initialBalance + this.netProfit;
    if (Math.abs(this.finalBalance - expectedFinalBalance) > 0.01) {
      this.errors.push(
        `finalBalance inconsistente: esperado ${expectedFinalBalance}, recebido ${this.finalBalance}`
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
      totalEntries: Number(this.totalEntries.toFixed(2)),
      totalExits: Number(this.totalExits.toFixed(2)),
      finalBalance: Number(this.finalBalance.toFixed(2)),
      initialBalance: Number(this.initialBalance.toFixed(2)),
      netProfit: Number(this.netProfit.toFixed(2)),
      totalRevenues: this.totalRevenues,
      totalExpenses: this.totalExpenses,
      daysWithMovement: this.daysWithMovement,
      profitMargin: Number(this.profitMargin.toFixed(2)),
    };
  }

  /**
   * Retorna resumo formatado para exibição
   * @param {Function} formatCurrency - Função de formatação de moeda
   * @returns {Object} Resumo formatado
   */
  toFormatted(formatCurrency) {
    return {
      totalEntries: formatCurrency(this.totalEntries),
      totalExits: formatCurrency(this.totalExits),
      finalBalance: formatCurrency(this.finalBalance),
      initialBalance: formatCurrency(this.initialBalance),
      netProfit: formatCurrency(this.netProfit),
      totalRevenues: this.totalRevenues,
      totalExpenses: this.totalExpenses,
      daysWithMovement: this.daysWithMovement,
      profitMargin: `${this.profitMargin.toFixed(2)}%`,
    };
  }
}
