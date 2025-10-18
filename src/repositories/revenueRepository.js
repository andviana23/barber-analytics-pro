import { supabase } from '../services/supabase';
import { ALLOWED_REVENUE_COLUMNS, FORBIDDEN_REVENUE_FIELDS } from '../dtos/revenueDTO';

/**
 * RevenueRepository - Repository Pattern
 * 
 * // [FIX] Removido campo 'profit' do payload inserido em revenues (campo calculado no banco)
 * // Adicionada proteção extra contra campos calculados que não existem na tabela base
 * 
 * Encapsula toda a lógica de acesso ao banco de dados para a entidade Revenue.
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
class RevenueRepository {
  /**
   * Nome da tabela no banco de dados
   * @private
   */
  tableName = 'revenues';

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
   * Criar uma nova receita no banco de dados
   * 
   * @param {Object} data - Dados sanitizados da receita (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Criando receita no banco...');
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Dados recebidos:', Object.keys(data));

      // ========================================
      // 🛡️ SANITIZAÇÃO REDUNDANTE (ÚLTIMA LINHA DE DEFESA)
      // ========================================
      
      const sanitizedData = {};
      const blocked = [];
      const ignored = [];
      
      // [FIX] Removido campo 'profit' do payload (campo gerado automaticamente no BD)
      // Proteção extra contra campos calculados (profit, profit_margin, etc.)
      const calculatedFields = ['profit', 'net_profit', 'profit_margin', 'lucro', 'lucro_liquido', 'margem'];
      
      for (const [key, value] of Object.entries(data)) {
        // 🚫 BLACKLIST: Bloquear campos proibidos (português, calculados, auto-gerados)
        if (FORBIDDEN_REVENUE_FIELDS.includes(key)) {
          blocked.push(key);
          continue;
        }
        
        // 🚫 BLACKLIST EXTRA: Bloquear campos calculados explicitamente
        // [FIX] Removido campo 'profit' do payload (campo gerado automaticamente no BD)
        if (calculatedFields.includes(key)) {
          blocked.push(key + ' (calculated field)');
          continue;
        }
        
        // 🛡️ WHITELIST: Aceitar apenas colunas existentes na tabela
        if (!ALLOWED_REVENUE_COLUMNS.includes(key)) {
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
        console.warn('⚠️ Repository: Campos não reconhecidos ignorados:', ignored);
      }

      // 🔥 LOG CRÍTICO: Ver o JSON EXATO que será enviado ao Supabase
      // eslint-disable-next-line no-console
      console.log('🔥 Repository: Payload final para Supabase:');
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(sanitizedData, null, 2));
      
      // 🔥 DEBUGGING EXTRA: Verificar campos específicos
      // eslint-disable-next-line no-console
      console.log('🔍 Repository: Campo "profit" presente?', 'profit' in sanitizedData ? '❌ SIM - PROBLEMA!' : '✅ NÃO - OK');
      // eslint-disable-next-line no-console
      console.log('🔍 Repository: Campos calculados encontrados:', Object.keys(sanitizedData).filter(k => ['profit', 'net_profit', 'profit_margin'].includes(k)));
      // eslint-disable-next-line no-console
      console.log('🔍 Repository: Total de campos no payload:', Object.keys(sanitizedData).length);

      // ========================================
      // 💾 INSERÇÃO NO BANCO DE DADOS
      // ========================================

      try {
        // [EMERGENCY FIX] Proteção final contra coluna GENERATED 'profit'
        // Remove campos calculados que podem ser adicionados por outros códigos
        const finalPayload = { ...sanitizedData };
        delete finalPayload.profit;
        delete finalPayload.net_profit; 
        delete finalPayload.profit_margin;
        
        // eslint-disable-next-line no-console
        console.log('🛡️ Repository: Proteção GENERATED aplicada, campos finais:', Object.keys(finalPayload));

        // [EMERGENCY FIX] Insert com campos específicos (evita coluna profit GENERATED)
        // Lista explícita de campos permitidos para INSERT
        const allowedInsertFields = [
          'type', 'value', 'date', 'source', 'observations', 'unit_id', 
          'account_id', 'professional_id', 'user_id', 'party_id',
          'gross_amount', 'net_amount', 'fees', 'status',
          'accrual_start_date', 'accrual_end_date', 
          'expected_receipt_date', 'actual_receipt_date'
        ];
        
        // Criar payload apenas com campos permitidos para INSERT
        const insertPayload = {};
        allowedInsertFields.forEach(field => {
          if (field in finalPayload && finalPayload[field] !== undefined) {
            insertPayload[field] = finalPayload[field];
          }
        });
        
        // eslint-disable-next-line no-console
        console.log('🛡️ Repository: INSERT payload final (sem profit):', Object.keys(insertPayload));

        // Promise.race para implementar timeout manual
        const insertPromise = supabase
          .from(this.tableName)
          .insert(insertPayload)
          .select()
          .single();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), this.defaultTimeout)
        );

        const { data: record, error } = await Promise.race([
          insertPromise,
          timeoutPromise
        ]);

        if (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Repository: Erro do Supabase:', error);
          return { 
            data: null, 
            error: this.normalizeError(error)
          };
        }

        // eslint-disable-next-line no-console
        console.log('✅ Repository: Receita criada com ID:', record.id);

        return { data: record, error: null };

      } catch (networkError) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro de rede/timeout:', networkError);
        
        if (networkError.message === 'NETWORK_TIMEOUT') {
          return { 
            data: null, 
            error: 'Operação demorou muito para ser concluída. Tente novamente.' 
          };
        }
        
        return { 
          data: null, 
          error: 'Erro de conexão. Verifique sua internet e tente novamente.' 
        };
      }

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Exceção inesperada:', err);
      return { 
        data: null, 
        error: 'Erro inesperado ao salvar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Buscar todas as receitas com filtros opcionais
   * 
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.unit_id] - ID da unidade
   * @param {string} [filters.start_date] - Data de início (YYYY-MM-DD)
   * @param {string} [filters.end_date] - Data de fim (YYYY-MM-DD)
   * @param {string} [filters.status] - Status da receita
   * @param {string} [filters.type] - Tipo de receita (income_type)
   * @param {number} [page=1] - Número da página (paginação)
   * @param {number} [limit=50] - Limite de registros por página
   * @returns {Promise<{data: Array<Object>, error: string|null, count: number}>}
   */
  async findAll(filters = {}, page = 1, limit = 50) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando receitas com filtros:', filters);

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('is_active', true); // ✅ FIX: Filtrar apenas receitas ativas (não deletadas)

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

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.payment_method_id) {
        query = query.eq('payment_method_id', filters.payment_method_id);
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
        console.error('❌ Repository: Erro ao buscar receitas:', error);
        return { 
          data: [], 
          error: error.message || 'Erro ao buscar receitas',
          count: 0
        };
      }

      // ✅ Buscar unidades e contas bancárias separadamente
      if (data && data.length > 0) {
        // Coletar IDs únicos de unidades e contas bancárias
        const unitIds = [...new Set(data.map(r => r.unit_id).filter(Boolean))];
        const accountIds = [...new Set(data.map(r => r.account_id).filter(Boolean))];

        // eslint-disable-next-line no-console
        console.log('🔍 Repository: IDs de unidades encontrados:', unitIds);
        // eslint-disable-next-line no-console
        console.log('🔍 Repository: IDs de contas bancárias encontrados:', accountIds);

        // Buscar unidades
        let unitsMap = {};
        if (unitIds.length > 0) {
          const { data: units } = await supabase
            .from('units')
            .select('id, name')
            .in('id', unitIds);
          
          // eslint-disable-next-line no-console
          console.log('🔍 Repository: Unidades buscadas:', units);
          
          if (units) {
            units.forEach(unit => {
              unitsMap[unit.id] = unit;
            });
          }
        }

        // Buscar contas bancárias
        let accountsMap = {};
        if (accountIds.length > 0) {
          // eslint-disable-next-line no-console
          console.log('🔍 Repository: Buscando contas bancárias para IDs:', accountIds);
          
          const { data: accounts, error: accountsError } = await supabase
            .from('bank_accounts')
            .select('id, name, bank_name, account_number')
            .in('id', accountIds);
          
          // eslint-disable-next-line no-console
          console.log('🔍 Repository: Contas bancárias buscadas:', accounts);
          // eslint-disable-next-line no-console
          console.log('🔍 Repository: Erro ao buscar contas:', accountsError);
          
          if (accounts && !accountsError) {
            accounts.forEach(account => {
              accountsMap[account.id] = account;
            });
          }
        }

        // eslint-disable-next-line no-console
        console.log('🔍 Repository: Map de contas:', accountsMap);

        // Mapear dados nas receitas
        data.forEach(receita => {
          if (receita.unit_id && unitsMap[receita.unit_id]) {
            receita.unit = unitsMap[receita.unit_id];
          }
          if (receita.account_id && accountsMap[receita.account_id]) {
            receita.bank_account = accountsMap[receita.account_id];
            // eslint-disable-next-line no-console
            console.log('✅ Repository: Conta mapeada para receita:', receita.id, receita.bank_account);
          } else {
            // eslint-disable-next-line no-console
            console.log('⚠️ Repository: Receita sem account_id ou conta não encontrada:', receita.id, receita.account_id);
          }
        });
      }

      // eslint-disable-next-line no-console
      console.log(`✅ Repository: ${data.length} receitas encontradas (total: ${count})`);
      // eslint-disable-next-line no-console
      console.log('📊 Repository: Primeira receita com dados:', data[0]);

      return { data: data || [], error: null, count: count || 0 };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao buscar receitas:', err);
      return { 
        data: [], 
        error: 'Erro inesperado ao buscar receitas. Tente novamente.',
        count: 0
      };
    }
  }

  /**
   * Buscar uma receita específica por ID
   * 
   * @param {string} id - UUID da receita
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Buscando receita por ID:', id);

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao buscar receita:', error);
        return { 
          data: null, 
          error: error.message || 'Receita não encontrada' 
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Receita encontrada:', id);

      return { data, error: null };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao buscar receita:', err);
      return { 
        data: null, 
        error: 'Erro inesperado ao buscar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Atualizar uma receita existente
   * 
   * @param {string} id - UUID da receita
   * @param {Object} data - Dados atualizados (já validados pelo DTO)
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, data) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Atualizando receita:', id);

      const { data: record, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao atualizar receita:', error);
        return { 
          data: null, 
          error: error.message || 'Erro ao atualizar receita' 
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Receita atualizada com sucesso:', id);

      return { data: record, error: null };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao atualizar receita:', err);
      return { 
        data: null, 
        error: 'Erro inesperado ao atualizar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Deletar uma receita (soft delete - marca como inativo)
   * 
   * @param {string} id - UUID da receita
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async softDelete(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Desativando receita (soft delete):', id);

      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao desativar receita:', error);
        return { 
          success: false, 
          error: error.message || 'Erro ao desativar receita' 
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Receita desativada com sucesso:', id);

      return { success: true, error: null };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao desativar receita:', err);
      return { 
        success: false, 
        error: 'Erro inesperado ao desativar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Deletar permanentemente uma receita (hard delete)
   * ⚠️ Use com cautela! Dados não podem ser recuperados.
   * 
   * @param {string} id - UUID da receita
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async hardDelete(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Deletando receita permanentemente:', id);

      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Repository: Erro ao deletar receita:', error);
        return { 
          success: false, 
          error: error.message || 'Erro ao deletar receita' 
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Receita deletada permanentemente:', id);

      return { success: true, error: null };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao deletar receita:', err);
      return { 
        success: false, 
        error: 'Erro inesperado ao deletar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Contar total de receitas com filtros
   * 
   * @param {Object} filters - Filtros de contagem
   * @returns {Promise<{count: number, error: string|null}>}
   */
  async count(filters = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🏦 Repository: Contando receitas com filtros:', filters);

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
        console.error('❌ Repository: Erro ao contar receitas:', error);
        return { 
          count: 0, 
          error: error.message || 'Erro ao contar receitas' 
        };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Repository: Total de receitas:', count);

      return { count: count || 0, error: null };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao contar receitas:', err);
      return { 
        count: 0, 
        error: 'Erro inesperado ao contar receitas. Tente novamente.' 
      };
    }
  }

  /**
   * Buscar receitas por período (agregado)
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
      console.log('🏦 Repository: Buscando receitas por período:', { unit_id, start_date, end_date });

      let query = supabase
        .from(this.tableName)
        .select('*');

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
        console.error('❌ Repository: Erro ao buscar receitas por período:', error);
        return { 
          data: null, 
          error: error.message || 'Erro ao buscar receitas por período' 
        };
      }

      // Calcular totais
      const total = data.reduce((sum, r) => sum + (r.value || 0), 0);
      const totalGross = data.reduce((sum, r) => sum + (r.gross_amount || 0), 0);
      const totalNet = data.reduce((sum, r) => sum + (r.net_amount || 0), 0);
      const totalFees = data.reduce((sum, r) => sum + (r.fees || 0), 0);

      // eslint-disable-next-line no-console
      console.log(`✅ Repository: ${data.length} receitas no período (Total: R$ ${total.toFixed(2)})`);

      return { 
        data: {
          revenues: data,
          summary: {
            count: data.length,
            total,
            totalGross,
            totalNet,
            totalFees
          }
        }, 
        error: null 
      };

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Repository: Erro inesperado ao buscar receitas por período:', err);
      return { 
        data: null, 
        error: 'Erro inesperado ao buscar receitas por período. Tente novamente.' 
      };
    }
  }
}

// Exportar instância única (Singleton)
export default new RevenueRepository();
