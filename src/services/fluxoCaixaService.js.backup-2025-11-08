/**
 * 💼 Fluxo de Caixa Service
 *
 * @module fluxoCaixaService
 * @description Service com regras de negócio para fluxo de caixa
 *
 * Responsabilidades:
 * - Validar filtros (via DTOs)
 * - Buscar dados (via Repository)
 * - Processar dados diários (UMA ÚNICA camada de processamento)
 * - Calcular KPIs e resumos
 * - Retornar sempre { data, error }
 *
 * ⚠️ IMPORTANTE: Esta é a ÚNICA camada que processa dados diários.
 * Elimina as 4 layers conflitantes do código antigo:
 * - CLEANUP-LAYER ❌ (removido)
 * - FILTRO-FINAL DEFENSIVO ❌ (removido)
 * - Cálculo manual acumulado ❌ (removido)
 * - Múltiplos filtros de fim de semana ❌ (removido)
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { eachDayOfInterval, format, isWeekend, parseISO } from 'date-fns';
import { FluxoCaixaFilterDTO } from '../dtos/FluxoCaixaFilterDTO';
import { FluxoCaixaSummaryDTO } from '../dtos/FluxoCaixaSummaryDTO';
import { fluxoCaixaRepository } from '../repositories/fluxoCaixaRepository';

export const fluxoCaixaService = {
  /**
   * Busca dados completos do fluxo de caixa
   *
   * @param {Object} filters
   * @param {string} filters.unitId - ID da unidade
   * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} filters.endDate - Data final (YYYY-MM-DD)
   * @param {boolean} filters.includeWeekends - Incluir fins de semana? (default: false)
   * @returns {Promise<{data: Object, error: Error|null}>}
   */
  async getFluxoCaixaData(filters) {
    // 1. Validar filtros com DTO
    const filterDTO = new FluxoCaixaFilterDTO(filters);
    if (!filterDTO.isValid()) {
      const error = `Filtros inválidos: ${filterDTO.getErrors()}`;
      return { data: null, error };
    }

    const validFilters = filterDTO.toObject();
    const { unitId, startDate, endDate, includeWeekends } = validFilters;

    try {
      // 2. Buscar dados em paralelo (otimização)
      const [
        revenuesResult,
        expensesResult,
        balanceResult,
        revenueDistResult,
        expenseDistResult,
      ] = await Promise.all([
        fluxoCaixaRepository.fetchRevenues({ unitId, startDate, endDate }),
        fluxoCaixaRepository.fetchExpenses({ unitId, startDate, endDate }),
        fluxoCaixaRepository.fetchInitialBalance({ unitId, startDate }),
        fluxoCaixaRepository.fetchRevenueDistribution({
          unitId,
          startDate,
          endDate,
        }),
        fluxoCaixaRepository.fetchExpenseDistribution({
          unitId,
          startDate,
          endDate,
        }),
      ]);

      // 3. Verificar erros
      if (revenuesResult.error || expensesResult.error || balanceResult.error) {
        const error =
          revenuesResult.error || expensesResult.error || balanceResult.error;
        return { data: null, error };
      }

      // 4. Processar dados diários (UMA ÚNICA camada de processamento)
      const daily = this._processDailyData({
        revenues: revenuesResult.data,
        expenses: expensesResult.data,
        initialBalance: balanceResult.data,
        startDate,
        endDate,
        includeWeekends,
      });

      // 5. Calcular resumo/KPIs
      const summary = this._calculateSummary({
        daily,
        revenues: revenuesResult.data,
        expenses: expensesResult.data,
      });

      // 6. Retornar dados estruturados
      return {
        data: {
          daily,
          summary,
          revenueDistribution: revenueDistResult.data || [],
          expenseDistribution: expenseDistResult.data || [],
          filters,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * 🔥 ÚNICA CAMADA DE PROCESSAMENTO DE DADOS DIÁRIOS
   *
   * Elimina todas as layers conflitantes do código antigo.
   * Responsável por:
   * 1. Agrupar receitas/despesas por dia
   * 2. Preencher dias sem movimentação
   * 3. Filtrar fins de semana (se configurado)
   * 4. Calcular saldo diário e acumulado on-the-fly
   *
   * @private
   * @param {Object} params
   * @param {Array} params.revenues - Receitas do período
   * @param {Array} params.expenses - Despesas do período
   * @param {number} params.initialBalance - Saldo inicial
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @param {boolean} params.includeWeekends - Incluir fins de semana?
   * @returns {Array<Object>} Array de objetos com dados diários
   */
  _processDailyData({
    revenues,
    expenses,
    initialBalance,
    startDate,
    endDate,
    includeWeekends,
  }) {
    // 1. Criar mapa de dias
    const dailyMap = new Map();

    // 2. Processar receitas (entradas)
    revenues.forEach(revenue => {
      const date = revenue.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, entries: 0, exits: 0 });
      }
      dailyMap.get(date).entries += Number(revenue.value);
    });

    // 3. Processar despesas (saídas)
    expenses.forEach(expense => {
      const date = expense.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, entries: 0, exits: 0 });
      }
      dailyMap.get(date).exits += Number(expense.value);
    });

    // 4. Preencher dias sem movimentação (importante para continuidade)
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const allDates = eachDayOfInterval({ start, end });

    allDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { date: dateStr, entries: 0, exits: 0 });
      }
    });

    // 5. Converter para array e ordenar
    let dailyArray = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // 6. FILTRO DE FINS DE SEMANA (única camada de filtro)
    if (!includeWeekends) {
      dailyArray = dailyArray.filter(day => {
        const date = parseISO(day.date);
        return !isWeekend(date);
      });
    }

    // 7. CÁLCULO DE SALDO DIÁRIO E ACUMULADO (on-the-fly)
    let accumulated = initialBalance;

    dailyArray.forEach(day => {
      // Saldo do dia = entradas - saídas
      day.dailyBalance = day.entries - day.exits;

      // Acumulado = acumulado anterior + saldo do dia
      accumulated += day.dailyBalance;
      day.accumulated = accumulated;
    });

    // 8. Adicionar linha SALDO_INICIAL no início
    dailyArray.unshift({
      date: 'SALDO_INICIAL',
      entries: 0,
      exits: 0,
      dailyBalance: 0,
      accumulated: initialBalance,
      isSaldoInicial: true,
    });

    return dailyArray;
  },

  /**
   * Calcula resumo e KPIs do fluxo de caixa
   *
   * @private
   * @param {Object} params
   * @param {Array} params.daily - Dados diários processados
   * @param {Array} params.revenues - Receitas brutas
   * @param {Array} params.expenses - Despesas brutas
   * @returns {Object} Resumo com KPIs
   */
  _calculateSummary({ daily, revenues, expenses }) {
    // Filtrar SALDO_INICIAL para calcular totais
    const dataWithoutInitial = daily.filter(
      day => day.date !== 'SALDO_INICIAL'
    );

    const totalEntries = dataWithoutInitial.reduce(
      (sum, day) => sum + day.entries,
      0
    );
    const totalExits = dataWithoutInitial.reduce(
      (sum, day) => sum + day.exits,
      0
    );
    const finalBalance = daily[daily.length - 1]?.accumulated || 0;
    const initialBalance = daily[0]?.accumulated || 0;
    const netProfit = totalEntries - totalExits;

    // Contadores
    const totalRevenues = revenues.length;
    const totalExpenses = expenses.length;
    const daysWithMovement = dataWithoutInitial.filter(
      day => day.entries > 0 || day.exits > 0
    ).length;

    // Criar e validar Summary DTO
    const summaryDTO = new FluxoCaixaSummaryDTO({
      totalEntries,
      totalExits,
      finalBalance,
      initialBalance,
      netProfit,
      totalRevenues,
      totalExpenses,
      daysWithMovement,
      profitMargin: totalEntries > 0 ? (netProfit / totalEntries) * 100 : 0,
    });

    // Retornar objeto normalizado
    return summaryDTO.toObject();
  },

  /**
   * Calcula dados para o gráfico de timeline (entradas vs saídas ao longo do tempo)
   *
   * @param {Array} daily - Dados diários processados
   * @returns {Array} Dados formatados para Recharts
   */
  getTimelineData(daily) {
    // Remover SALDO_INICIAL
    const dataWithoutInitial = daily.filter(
      day => day.date !== 'SALDO_INICIAL'
    );

    return dataWithoutInitial.map(day => ({
      date: day.date,
      entradas: day.entries,
      saidas: day.exits,
      saldo: day.dailyBalance,
      acumulado: day.accumulated,
    }));
  },
};
