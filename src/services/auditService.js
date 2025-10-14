import { supabase } from './supabase';

/**
 * Serviço de Auditoria - Gerencia logs de acesso e ações dos usuários
 */
class AuditService {
  
  /**
   * Registra uma ação do usuário no sistema de auditoria
   * @param {string} action - Tipo de ação (login, logout, create, update, delete, view)
   * @param {string} resource - Recurso acessado (opcional)
   * @param {object} details - Detalhes adicionais (opcional)
   * @param {string} ipAddress - IP de origem (opcional)
   * @param {string} userAgent - User agent (opcional)
   * @param {string} sessionId - ID da sessão (opcional)
   */
  async logAction(action, resource = null, details = null, ipAddress = null, userAgent = null, sessionId = null) {
    try {
      // Obtém informações do navegador se não fornecidas
      const finalUserAgent = userAgent || navigator.userAgent;
      const finalIpAddress = ipAddress || await this.getClientIP();
      
      // Chama a função do banco
      const { data, error } = await supabase.rpc('log_user_action', {
        p_action: action,
        p_resource: resource,
        p_details: details,
        p_ip_address: finalIpAddress,
        p_user_agent: finalUserAgent,
        p_session_id: sessionId
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao registrar log de auditoria:', error);
        return null;
      }

      return data;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro no serviço de auditoria:', error);
      return null;
    }
  }

  /**
   * Registra login do usuário
   * @param {object} userInfo - Informações do usuário
   */
  async logLogin(userInfo = {}) {
    return await this.logAction('login', 'auth', {
      user_role: userInfo.role,
      login_method: userInfo.method || 'email'
    });
  }

  /**
   * Registra logout do usuário
   */
  async logLogout() {
    return await this.logAction('logout', 'auth');
  }

  /**
   * Registra visualização de página/recurso
   * @param {string} page - Página acessada
   * @param {object} metadata - Metadados adicionais
   */
  async logPageView(page, metadata = {}) {
    return await this.logAction('view', `page:${page}`, metadata);
  }

  /**
   * Registra criação de registro
   * @param {string} table - Tabela afetada
   * @param {string} recordId - ID do registro criado
   * @param {object} data - Dados do registro (opcional)
   */
  async logCreate(table, recordId, data = {}) {
    return await this.logAction('create', `table:${table}`, {
      record_id: recordId,
      ...data
    });
  }

  /**
   * Registra atualização de registro
   * @param {string} table - Tabela afetada
   * @param {string} recordId - ID do registro atualizado
   * @param {object} oldData - Dados anteriores
   * @param {object} newData - Dados novos
   */
  async logUpdate(table, recordId, oldData = {}, newData = {}) {
    return await this.logAction('update', `table:${table}`, {
      record_id: recordId,
      old_data: oldData,
      new_data: newData
    });
  }

  /**
   * Registra exclusão de registro
   * @param {string} table - Tabela afetada
   * @param {string} recordId - ID do registro excluído
   * @param {object} data - Dados do registro excluído
   */
  async logDelete(table, recordId, data = {}) {
    return await this.logAction('delete', `table:${table}`, {
      record_id: recordId,
      deleted_data: data
    });
  }

  /**
   * Registra erro de acesso ou operação
   * @param {string} operation - Operação que falhou
   * @param {object} error - Detalhes do erro
   */
  async logError(operation, error) {
    return await this.logAction('error', operation, {
      error_message: error.message,
      error_code: error.code,
      stack_trace: error.stack
    });
  }

  /**
   * Busca logs de acesso (com filtros)
   * @param {object} filters - Filtros para a busca
   * @param {number} page - Página (para paginação)
   * @param {number} limit - Limite de resultados por página
   */
  async getLogs(filters = {}, page = 1, limit = 50) {
    try {
      let query = supabase
        .from('access_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.resource) {
        query = query.ilike('resource', `%${filters.resource}%`);
      }
      
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      // Paginação
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar logs:', error);
        return { logs: [], total: 0, error };
      }

      return {
        logs: data || [],
        total: count || 0,
        page,
        limit,
        error: null
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro no serviço de logs:', error);
      return { logs: [], total: 0, error };
    }
  }

  /**
   * Obtém estatísticas de logs
   * @param {object} filters - Filtros para estatísticas
   */
  async getLogStats(filters = {}) {
    try {
      // Busca contagem por ação
      let query = supabase
        .from('access_logs')
        .select('action, created_at');

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao buscar estatísticas:', error);
        return null;
      }

      // Processa estatísticas
      const stats = data.reduce((acc, log) => {
        acc.total = (acc.total || 0) + 1;
        acc.by_action = acc.by_action || {};
        acc.by_action[log.action] = (acc.by_action[log.action] || 0) + 1;
        return acc;
      }, {});

      return stats;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao calcular estatísticas:', error);
      return null;
    }
  }

  /**
   * Obtém IP do cliente (aproximado)
   */
  getClientIP() {
    // Em produção, você pode usar um serviço externo para obter o IP real
    // Por ora, retorna um placeholder
    return 'client_ip';
  }
}

// Instância única do serviço
const auditService = new AuditService();

export default auditService;