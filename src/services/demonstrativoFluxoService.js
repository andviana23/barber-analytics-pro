/**
 * @fileoverview Service - Demonstrativo de Fluxo de Caixa Acumulado
 * @module services/demonstrativoFluxoService
 * @description Serviço dedicado para lógica de negócio do Demonstrativo de Fluxo de Caixa.
 *              Separado de cashflowService para seguir Single Responsibility Principle.
 *
 * @author Andrey Viana
 * @created 2025-11-07
 * @updated 2025-11-07
 *
 * @architecture Clean Architecture - Domain Layer
 * @dependencies
 * - demonstrativoFluxoRepository (Infrastructure)
 * - DemonstrativoFluxoFiltersDTO (Domain)
 * - formatters (Utils)
 *
 * @usage
 * ```javascript
 * const result = await demonstrativoFluxoService.getDemonstrativo({
 *   unitId: 'unit-123',
 *   accountId: 'account-456',
 *   startDate: '2025-11-01',
 *   endDate: '2025-11-30',
 * });
 * ```
 */

import { demonstrativoFluxoRepository } from '../repositories/demonstrativoFluxoRepository';
import { DemonstrativoFluxoFiltersDTO } from '../dtos/demonstrativoFluxoDTO';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Service: DemonstrativoFluxoService
 * Gerencia lógica de negócio do Demonstrativo de Fluxo de Caixa Acumulado
 */
class DemonstrativoFluxoService {
  // ==================================================================================
  // MÉTODO PRINCIPAL
  // ==================================================================================

  /**
   * Buscar demonstrativo completo com saldo acumulado
   *
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade (obrigatório)
   * @param {string|null} filters.accountId - ID da conta bancária (null = todas)
   * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} filters.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data, error, summary}>}
   */
  async getDemonstrativo(filters) {
    try {
      // ========================================
      // ETAPA 1: Validar filtros via DTO
      // ========================================
      const filtersDTO = new DemonstrativoFluxoFiltersDTO(filters);

      if (!filtersDTO.isValid()) {
        const errors = filtersDTO.getErrors();
        const errorMessage =
          errors?.map(e => `${e.field}: ${e.message}`).join('; ') ||
          'Filtros inválidos';

        return {
          data: null,
          error: errorMessage,
          summary: null,
        };
      }

      const validatedFilters = filtersDTO.toObject();

      // ========================================
      // ETAPA 2: Buscar saldo inicial
      // ========================================
      const { data: saldoInicial, error: saldoInicialError } =
        await demonstrativoFluxoRepository.fetchInitialBalance(
          validatedFilters.unitId,
          validatedFilters.accountId,
          validatedFilters.startDate
        );

      if (saldoInicialError) {
        return {
          data: null,
          error: `Erro ao buscar saldo inicial: ${saldoInicialError}`,
          summary: null,
        };
      }

      // ========================================
      // ETAPA 3: Buscar dados da VIEW
      // ========================================
      const { data: entries, error: entriesError } =
        await demonstrativoFluxoRepository.fetchDemonstrativoData(
          validatedFilters.unitId,
          validatedFilters.accountId,
          validatedFilters.startDate,
          validatedFilters.endDate
        );

      if (entriesError) {
        return {
          data: null,
          error: `Erro ao buscar dados: ${entriesError}`,
          summary: null,
        };
      }

      // ========================================
      // ETAPA 4: Preencher todos os dias do período
      // ========================================
      const completeEntries = this.fillAllDaysInPeriod(
        entries || [],
        validatedFilters.startDate,
        validatedFilters.endDate,
        saldoInicial || 0.0
      );

      // Se não há dados, retornar resumo vazio
      if (!completeEntries || completeEntries.length === 0) {
        return {
          data: [],
          error: null,
          summary: this.createEmptySummary(saldoInicial || 0.0),
        };
      }

      // ========================================
      // ETAPA 5: Enriquecer dados com formatação e metadados
      // ========================================
      const enrichedEntries = this.enrichEntries(completeEntries);

      // ========================================
      // ETAPA 6: Calcular resumo (summary)
      // ========================================
      const summary = this.calculateSummary(
        enrichedEntries,
        saldoInicial || 0.0
      );

      // ========================================
      // ETAPA 7: Validar e retornar
      // ========================================
      return {
        data: enrichedEntries,
        error: null,
        summary,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ [demonstrativoFluxoService] Erro ao processar demonstrativo:',
        {
          message: error?.message,
          stack: error?.stack,
          filters: filters,
          errorDetails: error,
        }
      );
      return {
        data: null,
        error: error?.message || 'Erro ao processar demonstrativo',
        summary: null,
      };
    }
  }

  // ==================================================================================
  // MÉTODOS AUXILIARES - PROCESSAMENTO DE DADOS
  // ==================================================================================

  /**
   * Preencher todos os dias do período (incluindo dias sem movimentação)
   *
   * @param {Array} entries - Entradas com movimentação
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @param {number} initialBalance - Saldo inicial
   * @returns {Array} Entradas completas (todos os dias)
   */
  fillAllDaysInPeriod(entries, startDate, endDate, initialBalance) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const entriesMap = new Map();

    // Mapear entradas existentes por data
    entries.forEach(entry => {
      entriesMap.set(entry.transaction_date, entry);
    });

    // Preencher todos os dias
    const completeEntries = [];
    let currentDate = new Date(start);
    let saldoAcumulado = initialBalance;

    while (currentDate <= end) {
      const dateStr = this.formatDateISO(currentDate);
      const existingEntry = entriesMap.get(dateStr);

      const entradas = existingEntry?.entradas || 0.0;
      const saidas = existingEntry?.saidas || 0.0;
      const saldoDia = entradas - saidas;
      saldoAcumulado += saldoDia;

      completeEntries.push({
        transaction_date: dateStr,
        entradas,
        saidas,
        saldo_dia: saldoDia,
        saldo_acumulado: saldoAcumulado,
      });

      // Próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return completeEntries;
  }

  /**
   * Enriquecer entradas com campos formatados
   * Não usa DTO para evitar overhead de validação
   *
   * @param {Array} entries - Entradas processadas
   * @returns {Array} Entradas enriquecidas
   */
  enrichEntries(entries) {
    if (!Array.isArray(entries)) {
      // eslint-disable-next-line no-console
      console.error('❌ [enrichEntries] Erro: entries não é array', entries);
      return [];
    }

    return entries
      .map((entry, index) => {
        try {
          // Retornar entrada formatada diretamente
          // (sem validação DTO para evitar overhead)
          const entradasValue = Number(entry.entradas) || 0;
          const saidasValue = Number(entry.saidas) || 0;
          const saldoDiaValue = Number(entry.saldo_dia) || 0;
          const saldoAcumuladoValue = Number(entry.saldo_acumulado) || 0;

          return {
            // Dados originais
            transaction_date: entry.transaction_date,
            entradas: entradasValue,
            saidas: saidasValue,
            saldo_dia: saldoDiaValue,
            saldo_acumulado: saldoAcumuladoValue,

            // Formatados para exibição
            entradasFormatted: formatCurrency(entradasValue),
            saidasFormatted: formatCurrency(saidasValue),
            saldoDiaFormatted: formatCurrency(saldoDiaValue),
            saldoAcumuladoFormatted: formatCurrency(saldoAcumuladoValue),
            dateFormatted: formatDate(entry.transaction_date),

            // Indicadores visuais
            saldoDiaPositivo: saldoDiaValue > 0,
            saldoAcumuladoPositivo: saldoAcumuladoValue > 0,
            hasMovement: entradasValue > 0 || saidasValue > 0,
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            `❌ [enrichEntries] Erro ao enriquecer entrada ${index}:`,
            error,
            entry
          );
          return null;
        }
      })
      .filter(Boolean); // Remove nulls
  } /**
   * Calcular resumo do período (KPIs)
   *
   * @param {Array} entries - Entradas enriquecidas
   * @param {number} initialBalance - Saldo inicial
   * @returns {Object} Resumo com KPIs
   */
  calculateSummary(entries, initialBalance) {
    if (!entries || entries.length === 0) {
      return this.createEmptySummary(initialBalance);
    }

    // Calcular totais
    const totalEntradas = entries.reduce(
      (sum, e) => sum + (e.entradas || 0),
      0
    );
    const totalSaidas = entries.reduce((sum, e) => sum + (e.saidas || 0), 0);
    const saldoFinal =
      entries[entries.length - 1]?.saldo_acumulado || initialBalance;
    const totalDias = entries.length;

    // Calcular variação
    const variacao =
      initialBalance === 0
        ? 0
        : ((saldoFinal - initialBalance) / Math.abs(initialBalance)) * 100;

    // Determinar tendência
    const tendencia = this.calculateTrend(variacao);

    // Calcular médias
    const mediaEntradaDiaria = totalDias > 0 ? totalEntradas / totalDias : 0;
    const mediaSaidaDiaria = totalDias > 0 ? totalSaidas / totalDias : 0;
    const mediaSaldoDiario =
      totalDias > 0 ? (saldoFinal - initialBalance) / totalDias : 0;

    // Retornar resumo formatado diretamente
    return {
      saldo_inicial: initialBalance,
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      saldo_final: saldoFinal,
      variacao: variacao,
      total_dias: totalDias,
      media_entrada_diaria: mediaEntradaDiaria,
      media_saida_diaria: mediaSaidaDiaria,
      media_saldo_diario: mediaSaldoDiario,
      tendencia: tendencia,
      // Formatados para exibição
      saldo_inicial_formatted: formatCurrency(initialBalance),
      total_entradas_formatted: formatCurrency(totalEntradas),
      total_saidas_formatted: formatCurrency(totalSaidas),
      saldo_final_formatted: formatCurrency(saldoFinal),
      variacao_formatted: `${variacao.toFixed(2)}%`,
      media_entrada_diaria_formatted: formatCurrency(mediaEntradaDiaria),
      media_saida_diaria_formatted: formatCurrency(mediaSaidaDiaria),
      media_saldo_diario_formatted: formatCurrency(mediaSaldoDiario),
    };
  }

  /**
   * Criar resumo vazio (quando não há dados)
   *
   * @param {number} initialBalance - Saldo inicial
   * @returns {Object} Resumo vazio
   */
  createEmptySummary(initialBalance) {
    return {
      saldo_inicial: initialBalance,
      total_entradas: 0,
      total_saidas: 0,
      saldo_final: initialBalance,
      variacao: 0,
      total_dias: 0,
      media_entrada_diaria: 0,
      media_saida_diaria: 0,
      media_saldo_diario: 0,
      tendencia: 'neutra',
      // Formatados
      saldo_inicial_formatted: formatCurrency(initialBalance),
      total_entradas_formatted: formatCurrency(0),
      total_saidas_formatted: formatCurrency(0),
      saldo_final_formatted: formatCurrency(initialBalance),
      variacao_formatted: '0,00%',
    };
  }

  /**
   * Calcular tendência com base na variação
   *
   * @param {number} variacao - Variação percentual
   * @returns {string} 'positiva' | 'negativa' | 'neutra'
   */
  calculateTrend(variacao) {
    if (variacao > 5) return 'positiva'; // Crescimento significativo (>5%)
    if (variacao < -5) return 'negativa'; // Queda significativa (<-5%)
    return 'neutra'; // Estável (-5% a +5%)
  }

  // ==================================================================================
  // MÉTODOS AUXILIARES - VALIDAÇÃO
  // ==================================================================================

  /**
   * Validar filtros (usado por hooks antes de buscar)
   *
   * @param {Object} filters - Filtros a validar
   * @returns {Object} { isValid, errors }
   */
  validateFilters(filters) {
    const dto = new DemonstrativoFluxoFiltersDTO(filters);
    return {
      isValid: dto.isValid(),
      errors: dto.getErrors(),
    };
  }

  // ==================================================================================
  // MÉTODOS AUXILIARES - FORMATAÇÃO
  // ==================================================================================

  /**
   * Formatar data para ISO (YYYY-MM-DD)
   *
   * @param {Date} date - Data a formatar
   * @returns {string} Data ISO (YYYY-MM-DD)
   */
  formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// ==================================================================================
// EXPORT
// ==================================================================================

export const demonstrativoFluxoService = new DemonstrativoFluxoService();
export default demonstrativoFluxoService;
