/**
 * @fileoverview Repository para Demonstrativo de Fluxo de Caixa Acumulado
 * @module repositories/demonstrativoFluxoRepository
 * @description Encapsula acesso aos dados da VIEW vw_demonstrativo_fluxo
 *              seguindo Repository Pattern e Clean Architecture.
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @architecture Clean Architecture - Infrastructure Layer
 * @dependencies supabase@2.x
 *
 * Princípios:
 * - Single Responsibility: Apenas acesso a dados
 * - Dependency Inversion: Service depende de abstração, não de implementação
 * - Clean Architecture: Camada de infraestrutura isolada
 * - Repository Pattern: Abstrai detalhes de persistência
 *
 * Métodos:
 * - fetchDemonstrativoData(): Busca dados do demonstrativo filtrado
 * - fetchInitialBalance(): Calcula saldo inicial antes do período
 * - countTotalDays(): Conta dias com movimentação no período
 */

import { supabase } from '../services/supabase';

/**
 * Classe: DemonstrativoFluxoRepository
 * Repository Pattern para acesso à VIEW vw_demonstrativo_fluxo
 */
class DemonstrativoFluxoRepository {
  /**
   * Nome da VIEW no banco de dados
   * @private
   */
  viewName = 'vw_demonstrativo_fluxo';

  /**
   * Timeout padrão para operações de rede (15 segundos)
   * @private
   */
  defaultTimeout = 15000;

  /**
   * Normaliza erros do Supabase para mensagens amigáveis
   * @param {Object} error - Erro do Supabase
   * @returns {string} - Mensagem de erro normalizada
   * @private
   */
  normalizeError(error) {
    if (!error) return 'Erro desconhecido';

    // Erros de conectividade
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    // Erros de timeout
    if (
      error.message?.includes('timeout') ||
      error.message?.includes('timed out')
    ) {
      return 'Operação demorou muito. Tente reduzir o período de consulta.';
    }

    // Erros de autenticação
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return 'Sessão expirada. Faça login novamente.';
    }

    // Erros de permissão
    if (error.code === '42501' || error.message?.includes('permission')) {
      return 'Você não tem permissão para acessar esses dados.';
    }

    // Erro de VIEW não encontrada
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return 'Recurso de demonstrativo não encontrado. Contacte o suporte.';
    }

    // Fallback para erro genérico
    return error.message || 'Erro interno do sistema. Tente novamente.';
  }

  /**
   * Buscar dados do demonstrativo filtrado por período e conta
   *
   * @param {string} unitId - ID da unidade (multi-tenant)
   * @param {string|null} accountId - ID da conta bancária (NULL = todas as contas)
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Array|null, error: string|null}>}
   *
   * @example
   * const { data, error } = await repository.fetchDemonstrativoData(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   '223e4567-e89b-12d3-a456-426614174000',
   *   '2025-01-01',
   *   '2025-01-31'
   * );
   */
  async fetchDemonstrativoData(unitId, accountId, startDate, endDate) {
    try {
      // Validação básica de entrada (defesa redundante)
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error:
            'Parâmetros obrigatórios ausentes (unitId, startDate, endDate)',
        };
      }

      // Query base na VIEW
      let query = supabase
        .from(this.viewName)
        .select('*')
        .eq('unit_id', unitId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: true });

      // Filtro opcional de conta bancária
      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      // Executar query com timeout
      const { data, error } = await Promise.race([
        query,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Query timeout')),
            this.defaultTimeout
          )
        ),
      ]);

      if (error) {
        return {
          data: null,
          error: this.normalizeError(error),
        };
      }

      // Retorna array vazio se não houver dados
      if (!data || data.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      // Garantir tipos corretos (PostgreSQL pode retornar strings)
      const normalizedData = data.map(row => ({
        transaction_date: row.transaction_date,
        entradas: parseFloat(row.entradas) || 0.0,
        saidas: parseFloat(row.saidas) || 0.0,
        saldo_dia: parseFloat(row.saldo_dia) || 0.0,
        saldo_acumulado: parseFloat(row.saldo_acumulado) || 0.0,
      }));

      return {
        data: normalizedData,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Calcular saldo inicial antes do período
   * Busca o último saldo acumulado ANTES da startDate
   *
   * @param {string} unitId - ID da unidade
   * @param {string|null} accountId - ID da conta bancária (NULL = todas as contas)
   * @param {string} startDate - Data inicial do período (YYYY-MM-DD)
   * @returns {Promise<{data: number|null, error: string|null}>}
   *
   * @description
   * Estratégia: Busca o último registro da VIEW ANTES da startDate.
   * Se não houver dados anteriores, retorna 0.00 (saldo inicial zero).
   *
   * @example
   * const { data: saldoInicial, error } = await repository.fetchInitialBalance(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   '223e4567-e89b-12d3-a456-426614174000',
   *   '2025-01-01'
   * );
   * // data = 5000.00 (saldo acumulado até 2024-12-31)
   */
  async fetchInitialBalance(unitId, accountId, startDate) {
    try {
      // Validação básica
      if (!unitId || !startDate) {
        return {
          data: null,
          error: 'Parâmetros obrigatórios ausentes (unitId, startDate)',
        };
      }

      // Query: último registro ANTES da startDate
      let query = supabase
        .from(this.viewName)
        .select('saldo_acumulado')
        .eq('unit_id', unitId)
        .lt('transaction_date', startDate) // Menor que (antes de) startDate
        .order('transaction_date', { ascending: false }) // Mais recente primeiro
        .limit(1); // Apenas o último registro

      // Filtro opcional de conta
      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      // Executar query
      const { data, error } = await Promise.race([
        query,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Query timeout')),
            this.defaultTimeout
          )
        ),
      ]);

      if (error) {
        return {
          data: null,
          error: this.normalizeError(error),
        };
      }

      // Se não houver dados anteriores, saldo inicial é 0.00
      if (!data || data.length === 0) {
        return {
          data: 0.0,
          error: null,
        };
      }

      // Retorna o saldo_acumulado do último registro
      const saldoInicial = parseFloat(data[0].saldo_acumulado) || 0.0;

      return {
        data: saldoInicial,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Contar quantidade de dias com movimentação no período
   *
   * @param {string} unitId - ID da unidade
   * @param {string|null} accountId - ID da conta bancária
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: number|null, error: string|null}>}
   *
   * @example
   * const { data: totalDias, error } = await repository.countTotalDays(...);
   * // data = 31 (31 dias com movimentação)
   */
  async countTotalDays(unitId, accountId, startDate, endDate) {
    try {
      // Validação básica
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: 'Parâmetros obrigatórios ausentes',
        };
      }

      // Query: count DISTINCT transaction_date
      let query = supabase
        .from(this.viewName)
        .select('transaction_date', { count: 'exact', head: false })
        .eq('unit_id', unitId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          data: null,
          error: this.normalizeError(error),
        };
      }

      // Retorna a contagem (data.length se count não estiver disponível)
      const totalDias = count !== null ? count : data?.length || 0;

      return {
        data: totalDias,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Buscar totalizadores do período (soma de entradas e saídas)
   * Útil para calcular summary sem iterar todo o array
   *
   * @param {string} unitId - ID da unidade
   * @param {string|null} accountId - ID da conta bancária
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   *
   * @returns {Object} data
   * @returns {number} data.totalEntradas - Soma de todas as entradas
   * @returns {number} data.totalSaidas - Soma de todas as saídas
   *
   * @example
   * const { data, error } = await repository.fetchTotals(...);
   * // data = { totalEntradas: 50000.00, totalSaidas: 30000.00 }
   */
  async fetchTotals(unitId, accountId, startDate, endDate) {
    try {
      // Validação básica
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: 'Parâmetros obrigatórios ausentes',
        };
      }

      // Query: SELECT SUM(entradas), SUM(saidas)
      let query = supabase
        .from(this.viewName)
        .select('entradas, saidas')
        .eq('unit_id', unitId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        return {
          data: null,
          error: this.normalizeError(error),
        };
      }

      // Calcular soma manualmente (Supabase não suporta aggregate direto em views)
      const totalEntradas =
        data?.reduce(
          (sum, row) => sum + (parseFloat(row.entradas) || 0.0),
          0.0
        ) || 0.0;

      const totalSaidas =
        data?.reduce(
          (sum, row) => sum + (parseFloat(row.saidas) || 0.0),
          0.0
        ) || 0.0;

      return {
        data: {
          totalEntradas,
          totalSaidas,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }

  /**
   * Verificar se há dados para o período especificado
   * Útil para validação rápida antes de gerar relatório
   *
   * @param {string} unitId - ID da unidade
   * @param {string|null} accountId - ID da conta bancária
   * @param {string} startDate - Data inicial (YYYY-MM-DD)
   * @param {string} endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: boolean|null, error: string|null}>}
   *
   * @example
   * const { data: hasData, error } = await repository.hasDataForPeriod(...);
   * if (!hasData) {
   *   toast.info('Não há movimentações para o período selecionado');
   * }
   */
  async hasDataForPeriod(unitId, accountId, startDate, endDate) {
    try {
      // Validação básica
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: 'Parâmetros obrigatórios ausentes',
        };
      }

      // Query: SELECT COUNT(*) LIMIT 1 (otimizado)
      let query = supabase
        .from(this.viewName)
        .select('transaction_date', { count: 'exact', head: true })
        .eq('unit_id', unitId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .limit(1);

      if (accountId && accountId !== 'all') {
        query = query.eq('account_id', accountId);
      }

      const { count, error } = await query;

      if (error) {
        return {
          data: null,
          error: this.normalizeError(error),
        };
      }

      return {
        data: count > 0,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.normalizeError(error),
      };
    }
  }
}

// ==================================================================================
// EXPORTAÇÕES
// ==================================================================================

/**
 * Instância singleton do repository
 * Padrão Singleton para garantir única instância em toda aplicação
 */
export const demonstrativoFluxoRepository = new DemonstrativoFluxoRepository();

/**
 * Export default para compatibilidade
 */
export default demonstrativoFluxoRepository;
