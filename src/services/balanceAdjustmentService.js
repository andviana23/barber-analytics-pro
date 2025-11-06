import { supabase } from './supabase';

/**
 * Serviço para gerenciar ajustes de saldo inicial do mês
 *
 * Funcionalidades:
 * - Criar/atualizar ajuste de saldo inicial do mês
 * - Buscar ajuste de saldo para um período específico
 * - Histórico de ajustes
 */
export class BalanceAdjustmentService {
  /**
   * Buscar ajuste de saldo inicial para um período específico
   * @param {string} unitId - ID da unidade
   * @param {string} period - Período no formato YYYY-MM
   * @returns {Promise<{data, error}>}
   */
  async getBalanceAdjustment(unitId, period) {
    try {
      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('balance_adjustments')
        .select('*')
        .eq('unit_id', unitId)
        .eq('period', period)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 é "não encontrado", que é esperado
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: 'Falha ao buscar ajuste de saldo: ' + error.message,
      };
    }
  }

  /**
   * Criar ou atualizar ajuste de saldo inicial
   * @param {string} unitId - ID da unidade
   * @param {string} period - Período no formato YYYY-MM
   * @param {number} amount - Valor do ajuste
   * @param {string} reason - Motivo do ajuste
   * @param {string} userId - ID do usuário que fez o ajuste
   * @returns {Promise<{data, error}>}
   */
  async createOrUpdateBalanceAdjustment(
    unitId,
    period,
    amount,
    reason,
    userId
  ) {
    try {
      // Verificar se já existe um ajuste para este período
      const existingAdjustment = await this.getBalanceAdjustment(
        unitId,
        period
      );

      let data, error;

      if (existingAdjustment.data) {
        // Atualizar ajuste existente
        const updateResult = await supabase
          .from('balance_adjustments')
          .update({
            amount,
            reason,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAdjustment.data.id)
          .select()
          .single();

        data = updateResult.data;
        error = updateResult.error;
      } else {
        // Criar novo ajuste
        const insertResult = await supabase
          .from('balance_adjustments')
          .insert({
            unit_id: unitId,
            period,
            amount,
            reason,
            created_by: userId,
            updated_by: userId,
          })
          .select()
          .single();

        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: 'Falha ao salvar ajuste de saldo: ' + error.message,
      };
    }
  }

  /**
   * Buscar histórico de ajustes de uma unidade
   * @param {string} unitId - ID da unidade
   * @param {number} limit - Limite de registros (padrão: 50)
   * @returns {Promise<{data, error}>}
   */
  async getBalanceAdjustmentHistory(unitId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('balance_adjustments')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: [],
        error: 'Falha ao buscar histórico de ajustes: ' + error.message,
      };
    }
  }

  /**
   * Remover ajuste de saldo (soft delete)
   * @param {string} adjustmentId - ID do ajuste
   * @param {string} userId - ID do usuário
   * @returns {Promise<{data, error}>}
   */
  async deleteBalanceAdjustment(adjustmentId, userId) {
    try {
      const { data, error } = await supabase
        .from('balance_adjustments')
        .update({
          is_active: false,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adjustmentId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: 'Falha ao remover ajuste: ' + error.message,
      };
    }
  }

  /**
   * Calcular saldo inicial ajustado para um período
   * @param {string} unitId - ID da unidade
   * @param {string} period - Período no formato YYYY-MM
   * @returns {Promise<{data: {originalBalance: number, adjustment: number, adjustedBalance: number}, error}>}
   */
  async getAdjustedInitialBalance(unitId, period) {
    try {
      // Buscar saldo original (calculado do mês anterior)
      const originalBalance = await this.calculateOriginalBalance(
        unitId,
        period
      );

      // Buscar ajuste para o período
      const adjustmentResult = await this.getBalanceAdjustment(unitId, period);
      const adjustment = adjustmentResult.data?.amount || 0;

      // Calcular saldo ajustado
      const adjustedBalance = originalBalance + adjustment;

      return {
        data: {
          originalBalance,
          adjustment,
          adjustedBalance,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: 'Falha ao calcular saldo ajustado: ' + error.message,
      };
    }
  }

  /**
   * Calcular saldo original do mês anterior (método privado)
   * @param {string} unitId - ID da unidade
   * @param {string} period - Período no formato YYYY-MM
   * @returns {Promise<number>}
   * @private
   */
  async calculateOriginalBalance(unitId, period) {
    try {
      const [year, month] = period.split('-').map(Number);
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;

      const startDate = `${previousYear}-${String(previousMonth).padStart(2, '0')}-01`;
      const endDate = `${previousYear}-${String(previousMonth).padStart(2, '0')}-31`;

      // Buscar receitas do mês anterior
      const { data: revenues } = await supabase
        .from('revenues')
        .select('value')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .gte('date', startDate)
        .lte('date', endDate);

      // Buscar despesas do mês anterior
      const { data: expenses } = await supabase
        .from('expenses')
        .select('value')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .gte('date', startDate)
        .lte('date', endDate);

      const totalRevenues = (revenues || []).reduce(
        (sum, r) => sum + (r.value || 0),
        0
      );
      const totalExpenses = (expenses || []).reduce(
        (sum, e) => sum + (e.value || 0),
        0
      );

      return totalRevenues - totalExpenses;
    } catch {
      return 0;
    }
  }
}

export const balanceAdjustmentService = new BalanceAdjustmentService();
export default balanceAdjustmentService;
