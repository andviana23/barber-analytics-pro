/**
 * @file cashRegisterRepository.js
 * @description Repository para operações de Cash Register (Caixa)
 * @module Repositories/CashRegister
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { supabase } from '../services/supabase';

/**
 * Repository para gerenciar operações de caixa no banco de dados
 * Segue padrão Repository do Clean Architecture
 */
class CashRegisterRepository {
  /**
   * Abre um novo caixa
   *
   * @param {Object} data - Dados para abertura do caixa
   * @param {string} data.unitId - ID da unidade
   * @param {string} data.openedBy - ID do usuário que está abrindo
   * @param {number} data.openingBalance - Saldo inicial
   * @param {string} [data.observations] - Observações da abertura
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async openCashRegister(data) {
    try {
      // 🔍 DEBUG: Verificar sessão antes de inserir
      const { data: sessionData } = await supabase.auth.getSession();

      // Log SEMPRE exibido
      console.log('='.repeat(60));
      console.log('🔐 [Repository] VERIFICAÇÃO DE SESSÃO');
      console.log('='.repeat(60));
      console.log('Sessão ativa:', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
        userEmail: sessionData.session?.user?.email,
        userRole: sessionData.session?.user?.user_metadata?.role,
        accessToken: sessionData.session?.access_token
          ? '✅ Presente'
          : '❌ AUSENTE',
        expiresAt: sessionData.session?.expires_at
          ? new Date(sessionData.session.expires_at * 1000).toLocaleString()
          : 'N/A',
      });
      console.log('Dados do caixa a inserir:', data);
      console.log('='.repeat(60));

      if (!sessionData.session) {
        console.error(
          '❌ [Repository] SESSÃO NÃO ENCONTRADA! Usuário não autenticado.'
        );
        return {
          data: null,
          error: new Error('Sessão expirada. Faça login novamente.'),
        };
      }

      if (!sessionData.session.access_token) {
        console.error('❌ [Repository] ACCESS TOKEN NÃO ENCONTRADO!');
        return {
          data: null,
          error: new Error(
            'Token de autenticação não encontrado. Faça login novamente.'
          ),
        };
      }

      console.log('✅ [Repository] Sessão válida, tentando INSERT...');

      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .insert({
          unit_id: data.unitId,
          opened_by: data.openedBy,
          opening_balance: data.openingBalance,
          opening_time: new Date().toISOString(),
          status: 'open',
          observations: data.observations || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [Repository] Erro ao abrir caixa:', error);
        console.error('Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return { data: null, error };
      }

      console.log('✅ [Repository] Caixa aberto com sucesso:', cashRegister.id);
      return { data: cashRegister, error: null };
    } catch (error) {
      console.error('💥 [Repository] Exceção ao abrir caixa:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca o caixa ativo (aberto) de uma unidade
   *
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getActiveCashRegister(unitId) {
    try {
      console.log(
        '🔍 [Repository] getActiveCashRegister chamado para unitId:',
        unitId
      );

      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .select(
          `
          *,
          unit:units (
            id,
            name
          )
        `
        )
        .eq('unit_id', unitId)
        .eq('status', 'open')
        .order('opening_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('🔍 [Repository] Resultado getActiveCashRegister:', {
        cashRegister,
        error,
      });

      if (error) {
        console.error(
          '[CashRegisterRepository] Erro ao buscar caixa ativo:',
          error
        );
        return { data: null, error };
      }

      return { data: cashRegister, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao buscar caixa ativo:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Fecha um caixa existente
   *
   * @param {string} id - ID do caixa a ser fechado
   * @param {Object} data - Dados para fechamento
   * @param {string} data.closedBy - ID do usuário que está fechando
   * @param {number} data.closingBalance - Saldo de fechamento
   * @param {string} [data.observations] - Observações do fechamento
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async closeCashRegister(id, data) {
    try {
      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .update({
          closed_by: data.closedBy,
          closing_balance: data.closingBalance,
          closing_time: new Date().toISOString(),
          status: 'closed',
          observations: data.observations ? `${data.observations}` : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'open')
        .select()
        .single();

      if (error) {
        console.error('[CashRegisterRepository] Erro ao fechar caixa:', error);
        return { data: null, error };
      }

      if (!cashRegister) {
        return {
          data: null,
          error: new Error('Caixa não encontrado ou já está fechado'),
        };
      }

      console.log('[CashRegisterRepository] Caixa fechado com sucesso:', id);
      return { data: cashRegister, error: null };
    } catch (error) {
      console.error('[CashRegisterRepository] Exceção ao fechar caixa:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca um caixa por ID
   *
   * @param {string} id - ID do caixa
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getCashRegisterById(id) {
    try {
      // Busca dados do caixa
      const { data: cashRegister, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(
          '[CashRegisterRepository] Erro ao buscar caixa por ID:',
          error
        );
        return { data: null, error };
      }

      if (!cashRegister) {
        return { data: null, error: null };
      }

      // Busca nome de quem abriu
      let openerName = 'Não informado';
      if (cashRegister.opened_by) {
        const { data: openerData } = await supabase
          .from('professionals')
          .select('name')
          .eq('user_id', cashRegister.opened_by)
          .single();

        if (openerData) {
          openerName = openerData.name;
        }
      }

      // Busca nome de quem fechou (se fechado)
      let closerName = null;
      if (cashRegister.closed_by) {
        const { data: closerData } = await supabase
          .from('professionals')
          .select('name')
          .eq('user_id', cashRegister.closed_by)
          .single();

        if (closerData) {
          closerName = closerData.name;
        }
      }

      // Monta objeto com nomes
      const result = {
        ...cashRegister,
        opener: { name: openerName },
        closer: closerName ? { name: closerName } : null,
      };

      return { data: result, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao buscar caixa por ID:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Lista caixas com filtros e paginação
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.status] - Status do caixa (open/closed)
   * @param {string} [filters.startDate] - Data inicial
   * @param {string} [filters.endDate] - Data final
   * @param {number} [filters.page=1] - Página atual
   * @param {number} [filters.limit=20] - Limite de registros por página
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listCashRegisters(unitId, filters = {}) {
    try {
      const { status, startDate, endDate, page = 1, limit = 20 } = filters;

      const offset = (page - 1) * limit;

      let query = supabase
        .from('cash_registers')
        .select('*, unit:units(id, name)', { count: 'exact' })
        .eq('unit_id', unitId);

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('opening_time', startDate);
      }

      if (endDate) {
        query = query.lte('opening_time', endDate);
      }

      query = query
        .order('opening_time', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: cashRegisters, error, count } = await query;

      if (error) {
        console.error('[CashRegisterRepository] Erro ao listar caixas:', error);
        return { data: null, error, count: null };
      }

      return { data: cashRegisters, error: null, count };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao listar caixas:',
        error
      );
      return { data: null, error, count: null };
    }
  }

  /**
   * Busca o resumo de um caixa usando a view vw_cash_register_summary
   *
   * @param {string} id - ID do caixa
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getCashRegisterSummary(id) {
    try {
      const { data: summary, error } = await supabase
        .from('vw_cash_register_summary')
        .select('*')
        .eq('cash_register_id', id) // ✅ Corrigido: view usa cash_register_id, não id
        .single();

      if (error) {
        console.error(
          '[CashRegisterRepository] Erro ao buscar resumo do caixa:',
          error
        );
        return { data: null, error };
      }

      return { data: summary, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao buscar resumo do caixa:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Verifica se existe caixa aberto em uma unidade
   *
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: boolean, error: Error|null}>}
   */
  async hasActiveCashRegister(unitId) {
    try {
      const { data, error } = await this.getActiveCashRegister(unitId);

      if (error) {
        return { data: false, error };
      }

      return { data: data !== null, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao verificar caixa ativo:',
        error
      );
      return { data: false, error };
    }
  }

  /**
   * Conta quantas comandas estão abertas para um caixa
   *
   * @param {string} cashRegisterId - ID do caixa
   * @returns {Promise<{data: number|null, error: Error|null}>}
   */
  async countOpenOrders(cashRegisterId) {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('cash_register_id', cashRegisterId)
        .eq('status', 'open');

      if (error) {
        console.error(
          '[CashRegisterRepository] Erro ao contar comandas abertas:',
          error
        );
        return { data: null, error };
      }

      return { data: count, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao contar comandas abertas:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Busca histórico de caixas de uma unidade (últimos N registros)
   *
   * @param {string} unitId - ID da unidade
   * @param {number} [limit=10] - Quantidade de registros
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getCashRegisterHistory(unitId, limit = 10) {
    try {
      const { data: history, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('unit_id', unitId)
        .eq('status', 'closed')
        .order('closing_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error(
          '[CashRegisterRepository] Erro ao buscar histórico:',
          error
        );
        return { data: null, error };
      }

      return { data: history, error: null };
    } catch (error) {
      console.error(
        '[CashRegisterRepository] Exceção ao buscar histórico:',
        error
      );
      return { data: null, error };
    }
  }
}

export default new CashRegisterRepository();
