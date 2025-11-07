/**
 * @fileoverview DTOs para Demonstrativo de Fluxo de Caixa Acumulado
 * @module dtos/demonstrativoFluxoDTO
 * @description Validação e transformação de dados do Demonstrativo de Fluxo de Caixa Acumulado
 *              usando Zod para garantir type safety e validação robusta.
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @architecture Clean Architecture - Domain Layer
 * @dependencies zod@3.x
 *
 * Schemas:
 * - DemonstrativoFluxoFiltersSchema: Validação de filtros de busca
 * - DemonstrativoFluxoEntrySchema: Validação de entrada diária do fluxo
 * - DemonstrativoFluxoSummarySchema: Validação de resumo/totalizadores
 */

import { z } from 'zod';

// ==================================================================================
// SCHEMAS DE VALIDAÇÃO
// ==================================================================================

/**
 * Schema: Filtros de Busca
 * Valida parâmetros de entrada para buscar dados do demonstrativo
 *
 * Regras:
 * - unitId: UUID obrigatório (multi-tenant)
 * - accountId: UUID opcional (NULL = todas as contas)
 * - startDate: Data ISO obrigatória (YYYY-MM-DD)
 * - endDate: Data ISO obrigatória (YYYY-MM-DD)
 * - Validação cross-field: startDate <= endDate
 */
export const DemonstrativoFluxoFiltersSchema = z
  .object({
    unitId: z
      .string({
        required_error: 'Unit ID é obrigatório',
        invalid_type_error: 'Unit ID deve ser uma string',
      })
      .uuid('Unit ID deve ser um UUID válido')
      .describe('ID da unidade (multi-tenant)'),

    accountId: z
      .string()
      .uuid('Account ID deve ser um UUID válido')
      .nullable()
      .optional()
      .describe('ID da conta bancária (NULL = todas as contas)'),

    startDate: z
      .string({
        required_error: 'Data inicial é obrigatória',
        invalid_type_error: 'Data inicial deve ser uma string',
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Data inicial deve estar no formato YYYY-MM-DD'
      )
      .describe('Data inicial do período (ISO 8601)'),

    endDate: z
      .string({
        required_error: 'Data final é obrigatória',
        invalid_type_error: 'Data final deve ser uma string',
      })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Data final deve estar no formato YYYY-MM-DD'
      )
      .describe('Data final do período (ISO 8601)'),
  })
  .refine(
    data => {
      // Validação: startDate <= endDate
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: 'Data inicial não pode ser maior que data final',
      path: ['startDate'], // Marca o erro no campo startDate
    }
  )
  .refine(
    data => {
      // Validação: período não pode ultrapassar 2 anos (performance)
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      return diffDays <= 730; // 2 anos = ~730 dias
    },
    {
      message: 'Período não pode ultrapassar 2 anos (limite de performance)',
      path: ['endDate'],
    }
  );

/**
 * Schema: Entrada Diária do Fluxo
 * Valida cada linha retornada pela VIEW vw_demonstrativo_fluxo
 *
 * Estrutura:
 * - transaction_date: Data da transação (YYYY-MM-DD)
 * - entradas: Valor total de receitas do dia (>= 0)
 * - saidas: Valor total de despesas do dia (>= 0)
 * - saldo_dia: Diferença do dia (entradas - saidas)
 * - saldo_acumulado: Saldo progressivo até a data
 */
export const DemonstrativoFluxoEntrySchema = z.object({
  transaction_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Data da transação deve estar no formato YYYY-MM-DD'
    )
    .describe('Data da transação (regime de caixa)'),

  entradas: z
    .number({
      required_error: 'Entradas são obrigatórias',
      invalid_type_error: 'Entradas devem ser um número',
    })
    .nonnegative('Entradas não podem ser negativas')
    .finite('Entradas devem ser um número finito')
    .describe('Valor total de receitas recebidas no dia'),

  saidas: z
    .number({
      required_error: 'Saídas são obrigatórias',
      invalid_type_error: 'Saídas devem ser um número',
    })
    .nonnegative('Saídas não podem ser negativas')
    .finite('Saídas devem ser um número finito')
    .describe('Valor total de despesas pagas no dia'),

  saldo_dia: z
    .number({
      required_error: 'Saldo do dia é obrigatório',
      invalid_type_error: 'Saldo do dia deve ser um número',
    })
    .finite('Saldo do dia deve ser um número finito')
    .describe('Saldo do dia = entradas - saidas'),

  saldo_acumulado: z
    .number({
      required_error: 'Saldo acumulado é obrigatório',
      invalid_type_error: 'Saldo acumulado deve ser um número',
    })
    .finite('Saldo acumulado deve ser um número finito')
    .describe('Saldo progressivo acumulado até esta data'),
});

/**
 * Schema: Resumo/Totalizadores
 * Valida totalizadores calculados do período completo
 *
 * Estrutura:
 * - totalEntradas: Soma de todas as entradas do período
 * - totalSaidas: Soma de todas as saídas do período
 * - saldoInicial: Saldo no início do período (antes da startDate)
 * - saldoFinal: Saldo no final do período (última linha)
 * - variacao: Diferença entre saldo final e inicial
 * - totalDias: Quantidade de dias com movimentação
 */
export const DemonstrativoFluxoSummarySchema = z.object({
  totalEntradas: z
    .number({
      required_error: 'Total de entradas é obrigatório',
      invalid_type_error: 'Total de entradas deve ser um número',
    })
    .nonnegative('Total de entradas não pode ser negativo')
    .finite('Total de entradas deve ser um número finito')
    .describe('Soma total de receitas do período'),

  totalSaidas: z
    .number({
      required_error: 'Total de saídas é obrigatório',
      invalid_type_error: 'Total de saídas deve ser um número',
    })
    .nonnegative('Total de saídas não pode ser negativo')
    .finite('Total de saídas deve ser um número finito')
    .describe('Soma total de despesas do período'),

  saldoInicial: z
    .number({
      required_error: 'Saldo inicial é obrigatório',
      invalid_type_error: 'Saldo inicial deve ser um número',
    })
    .finite('Saldo inicial deve ser um número finito')
    .describe('Saldo antes da data inicial do período'),

  saldoFinal: z
    .number({
      required_error: 'Saldo final é obrigatório',
      invalid_type_error: 'Saldo final deve ser um número',
    })
    .finite('Saldo final deve ser um número finito')
    .describe('Saldo ao final do período (última transação)'),

  variacao: z
    .number({
      required_error: 'Variação é obrigatória',
      invalid_type_error: 'Variação deve ser um número',
    })
    .finite('Variação deve ser um número finito')
    .describe('Diferença entre saldo final e inicial'),

  totalDias: z
    .number({
      required_error: 'Total de dias é obrigatório',
      invalid_type_error: 'Total de dias deve ser um número',
    })
    .int('Total de dias deve ser um inteiro')
    .nonnegative('Total de dias não pode ser negativo')
    .describe('Quantidade de dias com movimentação'),
});

// ==================================================================================
// CLASSES DE VALIDAÇÃO (Pattern: DTO)
// ==================================================================================

/**
 * Classe: DemonstrativoFluxoFiltersDTO
 * Valida e transforma filtros de entrada
 *
 * @example
 * const dto = new DemonstrativoFluxoFiltersDTO({
 *   unitId: '123e4567-e89b-12d3-a456-426614174000',
 *   accountId: '223e4567-e89b-12d3-a456-426614174000',
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31'
 * });
 *
 * if (!dto.isValid()) {
 *   console.error(dto.getErrors());
 *   return;
 * }
 *
 * const filters = dto.toObject();
 */
export class DemonstrativoFluxoFiltersDTO {
  constructor(data) {
    this.data = data;
    this.errors = null;
    this.validatedData = null;
  }

  /**
   * Valida os dados de entrada
   * @returns {boolean} true se válido, false caso contrário
   */
  isValid() {
    try {
      this.validatedData = DemonstrativoFluxoFiltersSchema.parse(this.data);
      this.errors = null;
      return true;
    } catch (error) {
      // Tratamento robusto do erro Zod
      if (error?.errors && Array.isArray(error.errors)) {
        this.errors = error.errors.map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Erro de validação',
        }));
      } else {
        // Fallback para erro genérico
        this.errors = [
          {
            field: 'unknown',
            message: String(
              error?.message || error || 'Erro de validação desconhecido'
            ),
          },
        ];
      }
      return false;
    }
  }

  /**
   * Retorna os erros de validação
   * @returns {Array|null} Array de erros ou null se válido
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Retorna os dados validados
   * @returns {Object|null} Dados validados ou null se inválido
   */
  toObject() {
    return this.validatedData;
  }

  /**
   * Retorna os dados validados com transformações adicionais
   * @returns {Object|null} Dados enriquecidos ou null se inválido
   */
  toEnrichedObject() {
    if (!this.validatedData) return null;

    return {
      ...this.validatedData,
      // Adiciona propriedades calculadas
      periodDays: this._calculatePeriodDays(),
      periodFormatted: this._formatPeriod(),
    };
  }

  /**
   * Calcula quantidade de dias no período
   * @private
   * @returns {number}
   */
  _calculatePeriodDays() {
    if (!this.validatedData) return 0;

    const start = new Date(this.validatedData.startDate);
    const end = new Date(this.validatedData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia final
    return diffDays;
  }

  /**
   * Formata período para exibição
   * @private
   * @returns {string}
   */
  _formatPeriod() {
    if (!this.validatedData) return '';

    const start = new Date(this.validatedData.startDate);
    const end = new Date(this.validatedData.endDate);

    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `${formatter.format(start)} a ${formatter.format(end)}`;
  }
}

/**
 * Classe: DemonstrativoFluxoEntryDTO
 * Valida e transforma entradas diárias
 *
 * @example
 * const dto = new DemonstrativoFluxoEntryDTO({
 *   transaction_date: '2025-01-15',
 *   entradas: 5000.00,
 *   saidas: 2000.00,
 *   saldo_dia: 3000.00,
 *   saldo_acumulado: 15000.00
 * });
 */
export class DemonstrativoFluxoEntryDTO {
  constructor(data) {
    this.data = data;
    this.errors = null;
    this.validatedData = null;
  }

  isValid() {
    try {
      this.validatedData = DemonstrativoFluxoEntrySchema.parse(this.data);
      this.errors = null;
      return true;
    } catch (error) {
      // Tratamento robusto do erro Zod
      if (error?.errors && Array.isArray(error.errors)) {
        this.errors = error.errors.map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Erro de validação',
        }));
      } else {
        // Fallback para erro genérico
        this.errors = [
          {
            field: 'unknown',
            message: String(
              error?.message || error || 'Erro de validação desconhecido'
            ),
          },
        ];
      }
      return false;
    }
  }

  getErrors() {
    return this.errors;
  }

  toObject() {
    return this.validatedData;
  }
}

/**
 * Classe: DemonstrativoFluxoSummaryDTO
 * Valida e transforma resumo/totalizadores
 *
 * @example
 * const dto = new DemonstrativoFluxoSummaryDTO({
 *   totalEntradas: 50000.00,
 *   totalSaidas: 30000.00,
 *   saldoInicial: 10000.00,
 *   saldoFinal: 30000.00,
 *   variacao: 20000.00,
 *   totalDias: 31
 * });
 */
export class DemonstrativoFluxoSummaryDTO {
  constructor(data) {
    this.data = data;
    this.errors = null;
    this.validatedData = null;
  }

  isValid() {
    try {
      this.validatedData = DemonstrativoFluxoSummarySchema.parse(this.data);
      this.errors = null;
      return true;
    } catch (error) {
      // Tratamento robusto do erro Zod
      if (error?.errors && Array.isArray(error.errors)) {
        this.errors = error.errors.map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Erro de validação',
        }));
      } else {
        // Fallback para erro genérico
        this.errors = [
          {
            field: 'unknown',
            message: String(
              error?.message || error || 'Erro de validação desconhecido'
            ),
          },
        ];
      }
      return false;
    }
  }

  getErrors() {
    return this.errors;
  }

  toObject() {
    return this.validatedData;
  }

  /**
   * Retorna os dados validados com indicadores adicionais
   * @returns {Object|null} Dados enriquecidos ou null se inválido
   */
  toEnrichedObject() {
    if (!this.validatedData) return null;

    return {
      ...this.validatedData,
      // Indicadores calculados
      mediaEntradaDiaria: this._calculateAvgDailyInflow(),
      mediaSaidaDiaria: this._calculateAvgDailyOutflow(),
      mediaSaldoDiario: this._calculateAvgDailyBalance(),
      variacaoPercentual: this._calculatePercentVariation(),
      tendencia: this._calculateTrend(),
    };
  }

  /**
   * Calcula média de entrada diária
   * @private
   * @returns {number}
   */
  _calculateAvgDailyInflow() {
    if (!this.validatedData || this.validatedData.totalDias === 0) return 0;
    return this.validatedData.totalEntradas / this.validatedData.totalDias;
  }

  /**
   * Calcula média de saída diária
   * @private
   * @returns {number}
   */
  _calculateAvgDailyOutflow() {
    if (!this.validatedData || this.validatedData.totalDias === 0) return 0;
    return this.validatedData.totalSaidas / this.validatedData.totalDias;
  }

  /**
   * Calcula média de saldo diário
   * @private
   * @returns {number}
   */
  _calculateAvgDailyBalance() {
    if (!this.validatedData || this.validatedData.totalDias === 0) return 0;
    return this.validatedData.variacao / this.validatedData.totalDias;
  }

  /**
   * Calcula variação percentual do período
   * @private
   * @returns {number}
   */
  _calculatePercentVariation() {
    if (!this.validatedData || this.validatedData.saldoInicial === 0) return 0;
    return (
      (this.validatedData.variacao /
        Math.abs(this.validatedData.saldoInicial)) *
      100
    );
  }

  /**
   * Determina tendência do período
   * @private
   * @returns {string} 'positiva', 'negativa' ou 'estável'
   */
  _calculateTrend() {
    if (!this.validatedData) return 'estável';

    if (this.validatedData.variacao > 0) return 'positiva';
    if (this.validatedData.variacao < 0) return 'negativa';
    return 'estável';
  }
}

// ==================================================================================
// EXPORTAÇÕES
// ==================================================================================

export default {
  // Schemas
  DemonstrativoFluxoFiltersSchema,
  DemonstrativoFluxoEntrySchema,
  DemonstrativoFluxoSummarySchema,

  // Classes
  DemonstrativoFluxoFiltersDTO,
  DemonstrativoFluxoEntryDTO,
  DemonstrativoFluxoSummaryDTO,
};
