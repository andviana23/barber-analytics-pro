/**
 * 🗄️ Fluxo de Caixa Repository
 *
 * @module fluxoCaixaRepository
 * @description Repository para acesso aos dados de fluxo de caixa no Supabase
 *
 * Responsabilidades:
 * - Buscar receitas do período
 * - Buscar despesas do período
 * - Buscar saldo inicial
 * - Retornar sempre { data, error }
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { supabase } from '../services/supabase';

export const fluxoCaixaRepository = {
  /**
   * Busca receitas recebidas do período
   *
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async fetchRevenues({ unitId, startDate, endDate }) {
    try {
      // Validação de parâmetros obrigatórios
      if (!unitId || !startDate || !endDate) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ [fluxoCaixaRepository.fetchRevenues] Parâmetros inválidos:',
          {
            unitId,
            startDate,
            endDate,
          }
        );
        return {
          data: null,
          error: new Error(
            `Parâmetros obrigatórios faltando: unitId=${unitId}, startDate=${startDate}, endDate=${endDate}`
          ),
        };
      }

      // eslint-disable-next-line no-console
      console.log(
        '✅ [fluxoCaixaRepository.fetchRevenues] Parâmetros válidos:',
        {
          unitId,
          startDate,
          endDate,
        }
      );

      const { data, error } = await supabase
        .from('revenues')
        .select(
          `
          id,
          value,
          date,
          observations,
          status,
          payment_method_id,
          professional_id,
          party_id,
          category_id,
          payment_method:payment_methods(id, name),
          professional:professionals(id, name),
          party:parties(id, nome),
          category:categories(id, name)
        `
        )
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Received')
        .order('date', { ascending: true });

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ [fluxoCaixaRepository.fetchRevenues] Erro do Supabase:',
          {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Busca despesas pagas do período
   *
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async fetchExpenses({ unitId, startDate, endDate }) {
    try {
      // Validação de parâmetros obrigatórios
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: new Error(
            `Parâmetros obrigatórios faltando: unitId=${unitId}, startDate=${startDate}, endDate=${endDate}`
          ),
        };
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(
          `
          id,
          value,
          date,
          observations,
          status,
          category_id,
          party_id,
          category:categories(id, name),
          party:parties(id, nome)
        `
        )
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Paid')
        .order('date', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Busca saldo inicial (último saldo fechado antes do período)
   *
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @returns {Promise<{data: number, error: Error|null}>}
   */
  async fetchInitialBalance({ unitId, startDate }) {
    try {
      // Validação de parâmetros obrigatórios
      if (!unitId || !startDate) {
        return {
          data: 0,
          error: new Error(
            `Parâmetros obrigatórios faltando: unitId=${unitId}, startDate=${startDate}`
          ),
        };
      }

      // Buscar último registro de caixa fechado antes da data inicial
      const { data, error } = await supabase
        .from('cash_registers')
        .select('closing_balance')
        .eq('unit_id', unitId)
        .lt('closing_time', startDate)
        .eq('status', 'fechado')
        .order('closing_time', { ascending: false })
        .limit(1);

      if (error) {
        return { data: 0, error };
      }

      // Se não houver registro, retornar 0
      const initialBalance = data?.[0]?.closing_balance || 0;
      return { data: initialBalance, error: null };
    } catch (error) {
      return { data: 0, error };
    }
  },

  /**
   * Busca distribuição de receitas por categoria/serviço
   *
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async fetchRevenueDistribution({ unitId, startDate, endDate }) {
    try {
      // Validação de parâmetros obrigatórios
      if (!unitId || !startDate || !endDate) {
        return {
          data: [],
          error: new Error(
            `Parâmetros obrigatórios faltando: unitId=${unitId}, startDate=${startDate}, endDate=${endDate}`
          ),
        };
      }

      const { data, error } = await supabase
        .from('revenues')
        .select(
          `
          category_id,
          category:categories(id, name),
          value
        `
        )
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Received');

      if (error) {
        return { data: null, error };
      }

      // Agrupar por categoria e calcular total
      const distribution = data.reduce((acc, item) => {
        const categoryId = item.category_id;
        const categoryName = item.category?.name || 'Não categorizado';
        const amount = Number(item.value);

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            total: 0,
            count: 0,
          };
        }

        acc[categoryId].total += amount;
        acc[categoryId].count += 1;

        return acc;
      }, {});

      return { data: Object.values(distribution), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Busca distribuição de despesas por categoria
   *
   * @param {Object} params
   * @param {string} params.unitId - ID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async fetchExpenseDistribution({ unitId, startDate, endDate }) {
    try {
      // Validação de parâmetros obrigatórios
      if (!unitId || !startDate || !endDate) {
        return {
          data: [],
          error: new Error(
            `Parâmetros obrigatórios faltando: unitId=${unitId}, startDate=${startDate}, endDate=${endDate}`
          ),
        };
      }

      const { data, error } = await supabase
        .from('expenses')
        .select(
          `
          category_id,
          category:categories(id, name),
          value
        `
        )
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('status', 'Paid');

      if (error) {
        return { data: null, error };
      }

      // Agrupar por categoria e calcular total
      const distribution = data.reduce((acc, item) => {
        const categoryId = item.category_id;
        const categoryName = item.category?.name || 'Não categorizado';
        const amount = Number(item.value);

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            total: 0,
            count: 0,
          };
        }

        acc[categoryId].total += amount;
        acc[categoryId].count += 1;

        return acc;
      }, {});

      return { data: Object.values(distribution), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
