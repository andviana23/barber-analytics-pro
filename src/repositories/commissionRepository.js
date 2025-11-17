import { supabase } from '../services/supabase';
import {
  ALLOWED_COMMISSION_COLUMNS,
  FORBIDDEN_COMMISSION_FIELDS,
} from '../dtos/CommissionDTO';

/**
 * CommissionRepository - Repository Pattern
 *
 * Encapsula toda a lógica de acesso ao banco de dados para a entidade Commission.
 * Abstraindo os detalhes de implementação do Supabase.
 */
class CommissionRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'commissions';

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

    // Erros de validação/constraint
    if (error.code === '23505') {
      return 'Já existe um registro com essas informações.';
    }

    if (error.code === '23503') {
      return 'Referência inválida. Verifique os dados informados.';
    }

    if (error.code === '23514') {
      return 'Dados inválidos. Verifique os valores informados.';
    }

    // Erros de autenticação
    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return 'Sessão expirada. Faça login novamente.';
    }

    // Fallback para erro genérico
    return error.message || 'Erro interno do sistema. Tente novamente.';
  }

  /**
   * Criar uma nova comissão no banco de dados
   *
   * @param {Object} data - Dados sanitizados da comissão (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      // Sanitização redundante
      const sanitizedData = {};
      const blocked = [];
      const ignored = [];

      for (const [key, value] of Object.entries(data)) {
        // Blacklist: Bloquear campos proibidos
        if (FORBIDDEN_COMMISSION_FIELDS.includes(key)) {
          blocked.push(key);
          continue;
        }

        // Whitelist: Aceitar apenas colunas existentes na tabela
        if (!ALLOWED_COMMISSION_COLUMNS.includes(key)) {
          ignored.push(key);
          continue;
        }

        sanitizedData[key] = value;
      }

      if (blocked.length > 0) {
        console.warn('⚠️ Campos bloqueados:', blocked);
      }
      if (ignored.length > 0) {
        console.warn('⚠️ Campos ignorados:', ignored);
      }

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(sanitizedData)
        .select()
        .single();

      if (error) throw error;

      return { data: created, error: null };
    } catch (err) {
      console.error('❌ Erro ao criar comissão:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Buscar comissão por ID
   *
   * @param {string} id - ID da comissão
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          professional:professionals(id, name, role),
          unit:units(id, name),
          order:orders(id, total_amount, status)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      console.error('❌ Erro ao buscar comissão:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Listar comissões com filtros
   *
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Array|null, error: string|null, count: number|null}>}
   */
  async findByFilters(filters = {}) {
    try {
      const {
        unit_id,
        professional_id,
        order_id,
        status,
        start_date,
        end_date,
        page = 1,
        limit = 50,
      } = filters;

      let query = supabase
        .from(this.tableName)
        .select(
          `
          *,
          professional:professionals(id, name, role),
          unit:units(id, name),
          order:orders(id, total_amount, status),
          paid_by_user:paid_by(id, email)
        `,
          { count: 'exact' }
        )
        .eq('is_active', true);

      // Aplicar filtros
      if (unit_id) {
        query = query.eq('unit_id', unit_id);
      }

      if (professional_id) {
        query = query.eq('professional_id', professional_id);
      }

      if (order_id) {
        query = query.eq('order_id', order_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (start_date) {
        query = query.gte('reference_date', start_date);
      }

      if (end_date) {
        query = query.lte('reference_date', end_date);
      }

      // Paginação
      const offset = (page - 1) * limit;
      query = query
        .order('reference_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], error: null, count: count || 0 };
    } catch (err) {
      console.error('❌ Erro ao buscar comissões:', err);
      return { data: null, error: this.normalizeError(err), count: null };
    }
  }

  /**
   * Atualizar comissão
   *
   * @param {string} id - ID da comissão
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      // Sanitização redundante
      const sanitizedData = {};

      for (const [key, value] of Object.entries(data)) {
        if (FORBIDDEN_COMMISSION_FIELDS.includes(key)) {
          continue;
        }

        if (!ALLOWED_COMMISSION_COLUMNS.includes(key)) {
          continue;
        }

        sanitizedData[key] = value;
      }

      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: updated, error: null };
    } catch (err) {
      console.error('❌ Erro ao atualizar comissão:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Marcar comissão como paga
   *
   * @param {string} id - ID da comissão
   * @param {string} paidByUserId - ID do usuário que está pagando
   * @param {string} notes - Observações opcionais
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async markAsPaid(id, paidByUserId, notes = null) {
    try {
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update({
          status: 'PAID',
          paid_at: new Date().toISOString(),
          paid_by: paidByUserId,
          notes: notes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: updated, error: null };
    } catch (err) {
      console.error('❌ Erro ao marcar comissão como paga:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Soft delete (marcar como inativa)
   *
   * @param {string} id - ID da comissão
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async softDelete(id) {
    try {
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: updated, error: null };
    } catch (err) {
      console.error('❌ Erro ao excluir comissão:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }

  /**
   * Buscar totalizadores de comissões
   *
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getTotals(filters = {}) {
    try {
      const {
        unit_id,
        professional_id,
        status,
        start_date,
        end_date,
      } = filters;

      let query = supabase
        .from(this.tableName)
        .select('amount, status, professional_id')
        .eq('is_active', true);

      // Aplicar filtros
      if (unit_id) {
        query = query.eq('unit_id', unit_id);
      }

      if (professional_id) {
        query = query.eq('professional_id', professional_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (start_date) {
        query = query.gte('reference_date', start_date);
      }

      if (end_date) {
        query = query.lte('reference_date', end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular totalizadores
      const totals = {
        total: 0,
        paid: 0,
        pending: 0,
        cancelled: 0,
        byProfessional: {},
      };

      (data || []).forEach((commission) => {
        const amount = parseFloat(commission.amount || 0);
        totals.total += amount;

        if (commission.status === 'PAID') {
          totals.paid += amount;
        } else if (commission.status === 'PENDING') {
          totals.pending += amount;
        } else if (commission.status === 'CANCELLED') {
          totals.cancelled += amount;
        }

        // Por profissional
        const profId = commission.professional_id;
        if (!totals.byProfessional[profId]) {
          totals.byProfessional[profId] = {
            total: 0,
            paid: 0,
            pending: 0,
          };
        }
        totals.byProfessional[profId].total += amount;
        if (commission.status === 'PAID') {
          totals.byProfessional[profId].paid += amount;
        } else if (commission.status === 'PENDING') {
          totals.byProfessional[profId].pending += amount;
        }
      });

      return { data: totals, error: null };
    } catch (err) {
      console.error('❌ Erro ao calcular totalizadores:', err);
      return { data: null, error: this.normalizeError(err) };
    }
  }
}

export const commissionRepository = new CommissionRepository();
export default commissionRepository;



