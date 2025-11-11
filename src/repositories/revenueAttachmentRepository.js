import { supabase } from '../services/supabase';

/**
 * RevenueAttachmentRepository - Repository Pattern
 *
 * Encapsula toda a lógica de acesso ao banco de dados para anexos de receitas.
 * Segue os padrões Clean Architecture - Repository Pattern.
 *
 * @module repositories/revenueAttachmentRepository
 * @author Andrey Viana
 */
class RevenueAttachmentRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'revenue_attachments';

  /**
   * Normaliza erros do Supabase para mensagens amigáveis
   * @param {Object} error - Erro do Supabase
   * @returns {string} - Mensagem de erro normalizada
   * @private
   */
  normalizeError(error) {
    if (!error) return 'Erro desconhecido';

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    if (error.code === '23505') {
      return 'Já existe um anexo com essas informações.';
    }

    if (error.code === '23503') {
      return 'Referência inválida. Verifique os dados informados.';
    }

    if (error.message?.includes('JWT') || error.message?.includes('auth')) {
      return 'Sessão expirada. Faça login novamente.';
    }

    return error.message || 'Erro interno do sistema. Tente novamente.';
  }

  /**
   * Busca todos os anexos de uma receita
   *
   * @param {string} revenueId - ID da receita
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async findByRevenueId(revenueId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('revenue_id', revenueId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: this.normalizeError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('💥 Erro ao buscar anexos:', error);
      return { data: null, error: this.normalizeError(error) };
    }
  }

  /**
   * Busca um anexo por ID
   *
   * @param {string} id - ID do anexo
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: this.normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      console.error('💥 Erro ao buscar anexo:', error);
      return { data: null, error: this.normalizeError(error) };
    }
  }

  /**
   * Cria um novo registro de anexo
   *
   * @param {Object} attachmentData - Dados do anexo
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(attachmentData) {
    try {
      const dataToInsert = {
        ...attachmentData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      console.error('💥 Erro ao criar anexo:', error);
      return { data: null, error: this.normalizeError(error) };
    }
  }

  /**
   * Atualiza um anexo existente
   *
   * @param {string} id - ID do anexo
   * @param {Object} updates - Dados a atualizar
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, updates) {
    try {
      const dataToUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: this.normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      console.error('💥 Erro ao atualizar anexo:', error);
      return { data: null, error: this.normalizeError(error) };
    }
  }

  /**
   * Exclui um anexo (soft delete)
   *
   * @param {string} id - ID do anexo
   * @returns {Promise<{data: boolean|null, error: string|null}>}
   */
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return { data: null, error: this.normalizeError(error) };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('💥 Erro ao excluir anexo:', error);
      return { data: null, error: this.normalizeError(error) };
    }
  }
}

export const revenueAttachmentRepository = new RevenueAttachmentRepository();

