import { supabase } from '../services/supabase';
import {
  ALLOWED_EXPENSE_COLUMNS,
  FORBIDDEN_EXPENSE_FIELDS,
} from '../dtos/expenseDTO';

/**
 * ExpenseRepository - Repository Pattern
 *
 * Encapsula toda a lógica de acesso ao banco de dados para a entidade Expense.
 * Abstraindo os detalhes de implementação do Supabase, facilitando:
 * - Testes unitários (mock do repository)
 * - Troca de banco de dados no futuro
 * - Manutenibilidade e organização do código
 *
 * Princípios:
 * - Single Responsibility: Apenas acesso a dados
 * - Dependency Inversion: Service depende de abstração, não de implementação
 * - Clean Architecture: Camada de infraestrutura isolada
 *
 * 🛡️ SEGURANÇA: Aplica whitelist/blacklist redundante antes de inserir no banco
 */
class ExpenseRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'expenses';

  /**
   * Timeout padrão para operações de rede (10 segundos)
   * @private
   */
  defaultTimeout = 10000;

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
   * Criar uma nova despesa no banco de dados
   *
   * @param {Object} data - Dados sanitizados da despesa (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Criando despesa no banco...');
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Dados recebidos:', Object.keys(data));

      // ========================================
      // 🛡️ SANITIZAÇÃO REDUNDANTE (ÚLTIMA LINHA DE DEFESA)
      // ========================================

      const sanitizedData = {};
      const blocked = [];
      const ignored = [];

      for (const [key, value] of Object.entries(data)) {
        // 🚫 BLACKLIST: Bloquear campos proibidos
        if (FORBIDDEN_EXPENSE_FIELDS.includes(key)) {
          blocked.push(key);
          continue;
        }

        // 🛡️ WHITELIST: Aceitar apenas colunas existentes na tabela
        if (!ALLOWED_EXPENSE_COLUMNS.includes(key)) {
          ignored.push(key);
          continue;
        }

        // ✅ Campo válido: incluir
        if (value !== null && value !== undefined) {
          sanitizedData[key] = value;
        }
      }

      // Log de avisos
      if (blocked.length > 0) {
        // eslint-disable-next-line no-console
        console.error('🚨 Repository: Campos PROIBIDOS bloqueados:', blocked);
      }

      if (ignored.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          '⚠️ Repository: Campos não reconhecidos ignorados:',
          ignored
        );
      }

      // 🔥 LOG CRÍTICO: Ver o JSON EXATO que será enviado ao Supabase
      // eslint-disable-next-line no-console
      console.log('🔥 Repository: Payload final para Supabase:');
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(sanitizedData, null, 2));

      // ========================================
      // 💾 INSERÇÃO NO BANCO DE DADOS
      // ========================================

      try {
        // Lista explícita de campos permitidos para INSERT
        const allowedInsertFields = [
          'value',
          'date',
          'status',
          'description',
          'unit_id',
          'account_id',
          'category_id',
          'party_id',
          'expected_payment_date',
          'actual_payment_date',
          'type',
          'observations',
          'user_id',
        ];

        // Criar payload apenas com campos permitidos para INSERT
        const insertPayload = {};
        allowedInsertFields.forEach(field => {
          if (field in sanitizedData && sanitizedData[field] !== undefined) {
            insertPayload[field] = sanitizedData[field];
          }
        });

        // eslint-disable-next-line no-console
        console.log(
          '🛡️ Repository: INSERT payload final:',
          Object.keys(insertPayload)
        );

        // Promise.race para implementar timeout manual
        const insertPromise = supabase
          .from(this.tableName)
          .insert(insertPayload)
          .select()
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('NETWORK_TIMEOUT')),
            this.defaultTimeout
          )
        );

        const { data: record, error } = await Promise.race([
          insertPromise,
          timeoutPromise,
        ]);

        if (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Repository: Erro do Supabase:', error);
          return {
            data: null,
            error: this.normalizeError(error),
          };
        }

        // eslint-disable-next-line no-console
        console.log('✅ Repository: Despesa criada com ID:', record.id);

        return { data: record, error: null };
      } catch (networkError) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro de rede/timeout:', networkError);

        if (networkError.message === 'NETWORK_TIMEOUT') {
          return {
            data: null,
            error:
              'Operação demorou muito para ser concluída. Tente novamente.',
          };
        }

        return {
          data: null,
          error: 'Erro de conexão. Verifique sua internet e tente novamente.',
        };
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Exceção inesperada:', err);
      return {
        data: null,
        error: 'Erro inesperado ao salvar despesa. Tente novamente.',
      };
    }
  }

  /**
   * Buscar todas as despesas com filtros opcionais
   *
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.unit_id] - ID da unidade
   * @param {string} [filters.start_date] - Data de início (YYYY-MM-DD)
   * @param {string} [filters.end_date] - Data de fim (YYYY-MM-DD)
   * @param {string} [filters.status] - Status da despesa
   * @param {string} [filters.type] - Tipo de despesa
   * @param {number} [page=1] - Número da página (paginação)
   * @param {number} [limit=50] - Limite de registros por página
   * @returns {Promise<{data: Array<Object>, error: string|null, count: number}>}
   */
  async findAll(filters = {}, page = 1, limit = 50) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando despesas com filtros:', filters);

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true); // ✅ Filtrar apenas despesas ativas

      // Aplicar filtros
      const unitId = filters.unit_id || filters.unitId;
      if (unitId) {
        console.log('🔍 Repository: Aplicando filtro unit_id:', unitId);
        query = query.eq('unit_id', unitId);
      }

      if (filters.start_date) {
        query = query.gte('date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('date', filters.end_date);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.party_id) {
        query = query.eq('party_id', filters.party_id);
      }

      // Ordenação (mais recentes primeiro)
      query = query.order('date', { ascending: false });
      query = query.order('created_at', { ascending: false });

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao buscar despesas:', error);
        return {
          data: [],
          error: error.message || 'Erro ao buscar despesas',
          count: 0,
        };
      }

      // ✅ Buscar unidades, contas bancárias, categorias e fornecedores separadamente
      if (data && data.length > 0) {
        // Coletar IDs únicos
        const unitIds = [...new Set(data.map(e => e.unit_id).filter(Boolean))];
        const accountIds = [
          ...new Set(data.map(e => e.account_id).filter(Boolean)),
        ];
        const categoryIds = [
          ...new Set(data.map(e => e.category_id).filter(Boolean)),
        ];
        const partyIds = [
          ...new Set(data.map(e => e.party_id).filter(Boolean)),
        ];

        // Buscar unidades
        let unitsMap = {};
        if (unitIds.length > 0) {
          const { data: units } = await supabase
            .from('units')
            .select('id, name')
            .in('id', unitIds);

          if (units) {
            units.forEach(unit => {
              unitsMap[unit.id] = unit;
            });
          }
        }

        // Buscar contas bancárias
        let accountsMap = {};
        if (accountIds.length > 0) {
          const { data: accounts } = await supabase
            .from('bank_accounts')
            .select('id, name, bank_name, account_number')
            .in('id', accountIds);

          if (accounts) {
            accounts.forEach(account => {
              accountsMap[account.id] = account;
            });
          }
        }

        // Buscar categorias
        let categoriesMap = {};
        if (categoryIds.length > 0) {
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name, type')
            .in('id', categoryIds);

          if (categories) {
            categories.forEach(category => {
              categoriesMap[category.id] = category;
            });
          }
        }

        // Buscar fornecedores
        let partiesMap = {};
        if (partyIds.length > 0) {
          const { data: parties } = await supabase
            .from('parties')
            .select('id, nome, tipo')
            .in('id', partyIds);

          if (parties) {
            parties.forEach(party => {
              partiesMap[party.id] = party;
            });
          }
        }

        // Mapear dados nas despesas
        data.forEach(despesa => {
          if (despesa.unit_id && unitsMap[despesa.unit_id]) {
            despesa.unit = unitsMap[despesa.unit_id];
          }
          if (despesa.account_id && accountsMap[despesa.account_id]) {
            despesa.bank_account = accountsMap[despesa.account_id];
          }
          if (despesa.category_id && categoriesMap[despesa.category_id]) {
            despesa.category = categoriesMap[despesa.category_id];
          }
          if (despesa.party_id && partiesMap[despesa.party_id]) {
            despesa.supplier = partiesMap[despesa.party_id];
          }
        });
      }

      // eslint-disable-next-line no-console
      console.log(
        `✅ Repository: ${data.length} despesas encontradas (total: ${count})`
      );

      return { data: data || [], error: null, count: count || 0 };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao buscar despesas:', err);
      return {
        data: [],
        error: 'Erro inesperado ao buscar despesas. Tente novamente.',
        count: 0,
      };
    }
  }

  /**
   * Buscar uma despesa específica por ID
   *
   * @param {string} id - UUID da despesa
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando despesa por ID:', id);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao buscar despesa:', error);
        return {
          data: null,
          error: error.message || 'Despesa não encontrada',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Despesa encontrada:', id);

      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao buscar despesa:', err);
      return {
        data: null,
        error: 'Erro inesperado ao buscar despesa. Tente novamente.',
      };
    }
  }

  /**
   * Atualizar uma despesa existente
   *
   * @param {string} id - UUID da despesa
   * @param {Object} data - Dados atualizados (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Atualizando despesa:', id);

      const { data: record, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao atualizar despesa:', error);
        return {
          data: null,
          error: error.message || 'Erro ao atualizar despesa',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Despesa atualizada com sucesso:', id);

      return { data: record, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao atualizar despesa:',
        err
      );
      return {
        data: null,
        error: 'Erro inesperado ao atualizar despesa. Tente novamente.',
      };
    }
  }

  /**
   * Deletar uma despesa (soft delete - marca como inativo)
   *
   * @param {string} id - UUID da despesa
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async softDelete(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Desativando despesa (soft delete):', id);

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao desativar despesa:', error);
        return {
          success: false,
          error: error.message || 'Erro ao desativar despesa',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Despesa desativada com sucesso:', id);

      return { success: true, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao desativar despesa:',
        err
      );
      return {
        success: false,
        error: 'Erro inesperado ao desativar despesa. Tente novamente.',
      };
    }
  }

  /**
   * Deletar permanentemente uma despesa (hard delete)
   * ⚠️ Use com cautela! Dados não podem ser recuperados.
   *
   * @param {string} id - UUID da despesa
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async hardDelete(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Deletando despesa permanentemente:', id);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao deletar despesa:', error);
        return {
          success: false,
          error: error.message || 'Erro ao deletar despesa',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Despesa deletada permanentemente:', id);

      return { success: true, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao deletar despesa:', err);
      return {
        success: false,
        error: 'Erro inesperado ao deletar despesa. Tente novamente.',
      };
    }
  }

  /**
   * Contar total de despesas com filtros
   *
   * @param {Object} filters - Filtros de contagem
   * @returns {Promise<{count: number, error: string|null}>}
   */
  async count(filters = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Contando despesas com filtros:', filters);

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id);
      }

      if (filters.start_date) {
        query = query.gte('date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('date', filters.end_date);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao contar despesas:', error);
        return {
          count: 0,
          error: error.message || 'Erro ao contar despesas',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Total de despesas:', count);

      return { count: count || 0, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao contar despesas:', err);
      return {
        count: 0,
        error: 'Erro inesperado ao contar despesas. Tente novamente.',
      };
    }
  }

  /**
   * Buscar despesas por período (agregado)
   * Útil para dashboards e relatórios
   *
   * @param {Object} params
   * @param {string} params.unit_id - ID da unidade
   * @param {string} params.start_date - Data de início
   * @param {string} params.end_date - Data de fim
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getByPeriod({ unit_id, start_date, end_date }) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando despesas por período:', {
        unit_id,
        start_date,
        end_date,
      });

      let query = supabase.from(this.tableName).select('*');

      if (unit_id) {
        query = query.eq('unit_id', unit_id);
      }

      if (start_date) {
        query = query.gte('date', start_date);
      }

      if (end_date) {
        query = query.lte('date', end_date);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ Repository: Erro ao buscar despesas por período:',
          error
        );
        return {
          data: null,
          error: error.message || 'Erro ao buscar despesas por período',
        };
      }

      // Calcular totais
      const total = data.reduce((sum, e) => sum + (e.value || 0), 0);

      // Agrupar por status
      const byStatus = data.reduce((acc, e) => {
        const status = e.status || 'Unknown';
        if (!acc[status]) {
          acc[status] = { count: 0, total: 0 };
        }
        acc[status].count++;
        acc[status].total += e.value || 0;
        return acc;
      }, {});

      // eslint-disable-next-line no-console
      console.log(
        `✅ Repository: ${data.length} despesas no período (Total: R$ ${total.toFixed(2)})`
      );

      return {
        data: {
          expenses: data,
          summary: {
            count: data.length,
            total,
            byStatus,
          },
        },
        error: null,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao buscar despesas por período:',
        err
      );
      return {
        data: null,
        error:
          'Erro inesperado ao buscar despesas por período. Tente novamente.',
      };
    }
  }
}

// Exportar instância única (Singleton)
export default new ExpenseRepository();

