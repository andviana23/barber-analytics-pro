import { supabase } from '../services/supabase';
import {
  ALLOWED_BANK_STATEMENT_COLUMNS,
  FORBIDDEN_BANK_STATEMENT_FIELDS,
} from '../dtos/bankStatementDTO';

/**
 * BankStatementRepository - Repository Pattern
 *
 * Encapsula toda a lógica de acesso ao banco de dados para a entidade BankStatement.
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
class BankStatementRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'bank_statements';

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
      return 'Já existe um registro com essas informações (duplicata).';
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
   * Criar uma nova linha de extrato bancário no banco de dados
   *
   * @param {Object} data - Dados sanitizados do extrato (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Criando bank_statement no banco...');
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
        if (FORBIDDEN_BANK_STATEMENT_FIELDS.includes(key)) {
          blocked.push(key);
          continue;
        }

        // 🛡️ WHITELIST: Aceitar apenas colunas existentes na tabela
        if (!ALLOWED_BANK_STATEMENT_COLUMNS.includes(key)) {
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
          'bank_account_id',
          'transaction_date',
          'description',
          'amount',
          'type',
          'status',
          'reconciled',
          'hash_unique',
          'fitid',
          'observations',
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
        console.log('✅ Repository: Bank Statement criado com ID:', record.id);

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
        error: 'Erro inesperado ao salvar extrato bancário. Tente novamente.',
      };
    }
  }

  /**
   * Inserir múltiplas linhas de extrato em lote
   *
   * @param {Array} dataArray - Array de dados sanitizados
   * @returns {Promise<{success: number, duplicates: number, errors: Array}>}
   */
  async bulkCreate(dataArray) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '🏦 Repository: Criando',
        dataArray.length,
        'bank_statements em lote...'
      );

      let successCount = 0;
      let duplicateCount = 0;
      const errors = [];

      for (const data of dataArray) {
        try {
          const result = await this.create(data);

          if (result.error) {
            // Verificar se é erro de duplicata
            if (
              result.error.includes('duplicata') ||
              result.error.includes('23505')
            ) {
              duplicateCount++;
              // eslint-disable-next-line no-console
              console.log('⚠️ Registro duplicado ignorado:', data.source_hash);
            } else {
              errors.push({
                source_hash: data.source_hash,
                error: result.error,
              });
            }
          } else {
            successCount++;
          }
        } catch (err) {
          errors.push({
            source_hash: data.source_hash,
            error: err.message,
          });
        }
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Bulk create concluído:', {
        success: successCount,
        duplicates: duplicateCount,
        errors: errors.length,
      });

      return {
        success: successCount,
        duplicates: duplicateCount,
        errors,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado no bulk create:', err);
      return {
        success: 0,
        duplicates: 0,
        errors: [{ error: err.message }],
      };
    }
  }

  /**
   * Verificar se source_hash já existe (dedupe)
   *
   * @param {string} hashUnique - Hash único da transação
   * @returns {Promise<boolean>}
   */
  async checkDuplicate(hashUnique) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔍 Repository: Verificando duplicata:', hashUnique);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('id')
        .eq('hash_unique', hashUnique)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = não encontrado
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao verificar duplicata:', error);
        return false;
      }

      const isDuplicate = !!data;
      // eslint-disable-next-line no-console
      console.log('🔍 Repository: É duplicata?', isDuplicate);

      return isDuplicate;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao verificar duplicata:',
        err
      );
      return false;
    }
  }

  /**
   * Buscar extratos bancários com filtros opcionais
   *
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.bank_account_id] - ID da conta bancária
   * @param {string} [filters.start_date] - Data de início (YYYY-MM-DD)
   * @param {string} [filters.end_date] - Data de fim (YYYY-MM-DD)
   * @param {string} [filters.type] - Tipo da transação (Credit/Debit)
   * @param {string} [filters.status] - Status da transação
   * @param {boolean} [filters.reconciled] - Se está conciliado
   * @param {number} [page=1] - Número da página (paginação)
   * @param {number} [limit=50] - Limite de registros por página
   * @returns {Promise<{data: Array<Object>, error: string|null, count: number}>}
   */
  async findAll(filters = {}, page = 1, limit = 50) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '🏦 Repository: Buscando bank_statements com filtros:',
        filters
      );

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true); // ✅ Filtrar apenas extratos ativos

      // Aplicar filtros
      if (filters.bank_account_id) {
        query = query.eq('bank_account_id', filters.bank_account_id);
      }

      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.reconciled !== undefined) {
        query = query.eq('reconciled', filters.reconciled);
      }

      // Ordenação (mais recentes primeiro)
      query = query.order('transaction_date', { ascending: false });
      query = query.order('created_at', { ascending: false });

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao buscar bank_statements:', error);
        return {
          data: [],
          error: error.message || 'Erro ao buscar extratos bancários',
          count: 0,
        };
      }

      // ✅ Buscar contas bancárias separadamente
      if (data && data.length > 0) {
        const accountIds = [
          ...new Set(data.map(bs => bs.bank_account_id).filter(Boolean)),
        ];

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

        // Mapear dados nos extratos
        data.forEach(statement => {
          if (
            statement.bank_account_id &&
            accountsMap[statement.bank_account_id]
          ) {
            statement.bank_account = accountsMap[statement.bank_account_id];
          }
        });
      }

      // eslint-disable-next-line no-console
      console.log(
        `✅ Repository: ${data.length} bank_statements encontrados (total: ${count})`
      );

      return { data: data || [], error: null, count: count || 0 };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao buscar bank_statements:',
        err
      );
      return {
        data: [],
        error: 'Erro inesperado ao buscar extratos bancários. Tente novamente.',
        count: 0,
      };
    }
  }

  /**
   * Buscar um extrato específico por ID
   *
   * @param {string} id - UUID do extrato
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando bank_statement por ID:', id);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao buscar bank_statement:', error);
        return {
          data: null,
          error: error.message || 'Extrato bancário não encontrado',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Bank Statement encontrado:', id);

      return { data, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao buscar bank_statement:',
        err
      );
      return {
        data: null,
        error: 'Erro inesperado ao buscar extrato bancário. Tente novamente.',
      };
    }
  }

  /**
   * Atualizar um extrato existente
   *
   * @param {string} id - UUID do extrato
   * @param {Object} data - Dados atualizados (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Atualizando bank_statement:', id);

      const { data: record, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ Repository: Erro ao atualizar bank_statement:',
          error
        );
        return {
          data: null,
          error: error.message || 'Erro ao atualizar extrato bancário',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Bank Statement atualizado com sucesso:', id);

      return { data: record, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao atualizar bank_statement:',
        err
      );
      return {
        data: null,
        error:
          'Erro inesperado ao atualizar extrato bancário. Tente novamente.',
      };
    }
  }

  /**
   * Marcar extrato como conciliado
   *
   * @param {string} id - UUID do extrato
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async markAsReconciled(id) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '🏦 Repository: Marcando bank_statement como conciliado:',
        id
      );

      const { error } = await supabase
        .from(this.tableName)
        .update({
          reconciled: true,
          status: 'reconciled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao marcar como conciliado:', error);
        return {
          success: false,
          error: error.message || 'Erro ao marcar como conciliado',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Bank Statement marcado como conciliado:', id);

      return { success: true, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao marcar como conciliado:',
        err
      );
      return {
        success: false,
        error: 'Erro inesperado ao marcar como conciliado. Tente novamente.',
      };
    }
  }

  /**
   * Deletar um extrato (soft delete - marca como inativo)
   *
   * @param {string} id - UUID do extrato
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async softDelete(id) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '🏦 Repository: Desativando bank_statement (soft delete):',
        id
      );

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ Repository: Erro ao desativar bank_statement:',
          error
        );
        return {
          success: false,
          error: error.message || 'Erro ao desativar extrato bancário',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Bank Statement desativado com sucesso:', id);

      return { success: true, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao desativar bank_statement:',
        err
      );
      return {
        success: false,
        error:
          'Erro inesperado ao desativar extrato bancário. Tente novamente.',
      };
    }
  }

  /**
   * Contar total de extratos com filtros
   *
   * @param {Object} filters - Filtros de contagem
   * @returns {Promise<{count: number, error: string|null}>}
   */
  async count(filters = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log(
        '🏦 Repository: Contando bank_statements com filtros:',
        filters
      );

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters.bank_account_id) {
        query = query.eq('bank_account_id', filters.bank_account_id);
      }

      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.reconciled !== undefined) {
        query = query.eq('reconciled', filters.reconciled);
      }

      const { count, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao contar bank_statements:', error);
        return {
          count: 0,
          error: error.message || 'Erro ao contar extratos bancários',
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Total de bank_statements:', count);

      return { count: count || 0, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao contar bank_statements:',
        err
      );
      return {
        count: 0,
        error: 'Erro inesperado ao contar extratos bancários. Tente novamente.',
      };
    }
  }

  /**
   * Buscar extratos por período (agregado)
   * Útil para dashboards e relatórios
   *
   * @param {Object} params
   * @param {string} params.bank_account_id - ID da conta bancária
   * @param {string} params.start_date - Data de início
   * @param {string} params.end_date - Data de fim
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getByPeriod({ bank_account_id, start_date, end_date }) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando bank_statements por período:', {
        bank_account_id,
        start_date,
        end_date,
      });

      let query = supabase.from(this.tableName).select('*');

      if (bank_account_id) {
        query = query.eq('bank_account_id', bank_account_id);
      }

      if (start_date) {
        query = query.gte('transaction_date', start_date);
      }

      if (end_date) {
        query = query.lte('transaction_date', end_date);
      }

      query = query.order('transaction_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ Repository: Erro ao buscar bank_statements por período:',
          error
        );
        return {
          data: null,
          error: error.message || 'Erro ao buscar extratos por período',
        };
      }

      // Calcular totais
      const totalDebits = data
        .filter(bs => bs.type === 'Debit')
        .reduce((sum, bs) => sum + (bs.amount || 0), 0);

      const totalCredits = data
        .filter(bs => bs.type === 'Credit')
        .reduce((sum, bs) => sum + (bs.amount || 0), 0);

      // Agrupar por tipo
      const byType = data.reduce((acc, bs) => {
        const type = bs.type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count++;
        acc[type].total += bs.amount || 0;
        return acc;
      }, {});

      // Agrupar por status de conciliação
      const byReconciliation = data.reduce((acc, bs) => {
        const reconciled = bs.reconciled ? 'reconciled' : 'pending';
        if (!acc[reconciled]) {
          acc[reconciled] = { count: 0, total: 0 };
        }
        acc[reconciled].count++;
        acc[reconciled].total += bs.amount || 0;
        return acc;
      }, {});

      // eslint-disable-next-line no-console
      console.log(
        `✅ Repository: ${data.length} bank_statements no período (Débitos: R$ ${totalDebits.toFixed(2)}, Créditos: R$ ${totalCredits.toFixed(2)})`
      );

      return {
        data: {
          statements: data,
          summary: {
            count: data.length,
            totalDebits,
            totalCredits,
            byType,
            byReconciliation,
          },
        },
        error: null,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '❌ Repository: Erro inesperado ao buscar bank_statements por período:',
        err
      );
      return {
        data: null,
        error:
          'Erro inesperado ao buscar extratos por período. Tente novamente.',
      };
    }
  }
}

// Exportar instância única (Singleton)
export default new BankStatementRepository();
