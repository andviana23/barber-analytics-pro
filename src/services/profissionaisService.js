import { supabase } from './supabase';

/**
 * Service para gerenciar operações CRUD de profissionais
 */
export class ProfissionaisService {
  
  /**
   * Debug da autenticação Supabase
   */
  static async debugSupabaseAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        email: session?.user?.email,
        role: session?.user?.user_metadata?.role,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000) : null,
        error: error?.message
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Testar funções RLS no contexto frontend
   */
  static async testRLSFunctions() {
    try {
      const { data, error } = await supabase.rpc('debug_rls_context');
      return { 
        success: !error,
        data, 
        error: error?.message 
      };
    } catch (err) {
      return { 
        success: false,
        error: err.message 
      };
    }
  }
  
  /**
   * Lista todos os profissionais com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade
   * @param {boolean} filters.isActive - Status ativo/inativo
   * @param {string} filters.role - Papel do profissional
   * @returns {Promise<Array>} Lista de profissionais
   */
  static async getProfissionais(filters = {}) {
    console.log('🔍 ProfissionaisService.getProfissionais chamado com filtros:', filters);
    
    // 🔐 DEBUG: Verificar estado de autenticação
    const debugAuth = await this.debugSupabaseAuth();
    console.log('🔐 Auth Debug Result:', debugAuth);
    
    // ✅ Verificar se usuário está autenticado
    if (!debugAuth.hasSession || !debugAuth.hasAccessToken) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // ⏰ Verificar se token não expirou
    if (debugAuth.expiresAt && debugAuth.expiresAt < new Date()) {
      throw new Error('Sessão expirou. Faça login novamente.');
    }
    
    try {
      console.log('📡 Construindo query para tabela professionals...');
      
      let query = supabase
        .from('professionals')
        .select(`
          *,
          unit:units(id, name)
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.unitId) {
        console.log('🔗 Aplicando filtro unitId:', filters.unitId);
        query = query.eq('unit_id', filters.unitId);
      }
      
      if (filters.isActive !== undefined) {
        console.log('🔗 Aplicando filtro isActive:', filters.isActive);
        query = query.eq('is_active', filters.isActive);
      }
      
      if (filters.role) {
        console.log('🔗 Aplicando filtro role:', filters.role);
        query = query.eq('role', filters.role);
      }

      console.log('⏳ Executando query no Supabase...');
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro na query Supabase:', error);
        throw error;
      }

      console.log('✅ Query executada com sucesso. Registros encontrados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no ProfissionaisService:', error);
      
      // Tratar erros específicos de permissão RLS
      if (error.message?.includes('permission denied') || 
          error.message?.includes('policy') || 
          error.message?.includes('RLS')) {
        throw new Error('Sem permissão para acessar profissionais. Verifique seu login ou contate o administrador.');
      }
      
      throw new Error(`Erro ao buscar profissionais: ${error.message}`);
    }
  }

  /**
   * Busca um profissional por ID
   * @param {string} id - ID do profissional
   * @returns {Promise<Object>} Dados do profissional
   */
  static async getProfissionalById(id) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select(`
          *,
          unit:units(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao buscar profissional: ${error.message}`);
    }
  }

  /**
   * Cria um novo profissional
   * @param {Object} profissionalData - Dados do profissional
   * @returns {Promise<Object>} Profissional criado
   */
  static async createProfissional(profissionalData) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .insert([profissionalData])
        .select(`
          *,
          unit:units(id, name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao criar profissional: ${error.message}`);
    }
  }

  /**
   * Atualiza um profissional existente
   * @param {string} id - ID do profissional
   * @param {Object} updates - Dados para atualização
   * @returns {Promise<Object>} Profissional atualizado
   */
  static async updateProfissional(id, updates) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          unit:units(id, name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar profissional: ${error.message}`);
    }
  }

  /**
   * Alterna o status ativo/inativo de um profissional
   * @param {string} id - ID do profissional
   * @returns {Promise<Object>} Profissional atualizado
   */
  static async toggleProfissionalStatus(id) {
    try {
      // Primeiro buscar o status atual
      const { data: currentData, error: fetchError } = await supabase
        .from('professionals')
        .select('is_active')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Inverter o status
      const newStatus = !currentData.is_active;

      const { data, error } = await supabase
        .from('professionals')
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          unit:units(id, name)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao alterar status do profissional: ${error.message}`);
    }
  }

  /**
   * Remove um profissional (soft delete)
   * @param {string} id - ID do profissional
   * @returns {Promise<boolean>} Sucesso da operação
   */
  static async deleteProfissional(id) {
    try {
      // Soft delete: marcar como inativo ao invés de deletar
      const { error } = await supabase
        .from('professionals')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Erro ao remover profissional: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas de performance de um profissional
   * @param {string} profissionalId - ID do profissional
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Object>} Estatísticas do profissional
   */
  static async getProfissionalStats(profissionalId, mes = new Date().getMonth() + 1, ano = new Date().getFullYear()) {
    try {
      // Buscar total de atendimentos no período
      const { data: atendimentos, error: atendimentosError } = await supabase
        .from('historico_atendimentos')
        .select('*')
        .eq('barbeiro_id', profissionalId)
        .gte('data_atendimento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data_atendimento', `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`)
        .eq('status', 'concluido');

      if (atendimentosError) throw atendimentosError;

      // Calcular estatísticas
      const totalAtendimentos = atendimentos?.length || 0;
      const faturamento = atendimentos?.reduce((sum, item) => sum + (item.valor_servico || 0), 0) || 0;
      const ticketMedio = totalAtendimentos > 0 ? faturamento / totalAtendimentos : 0;
      const tempoMedio = atendimentos?.length > 0 
        ? atendimentos.reduce((sum, item) => sum + (item.duracao_minutos || 0), 0) / atendimentos.length 
        : 0;

      // Buscar posição na fila atual (pode não existir)
      const { data: filaData, error: filaError } = await supabase
        .from('fila_atendimento')
        .select('total_atendimentos, status')
        .eq('barbeiro_id', profissionalId)
        .eq('data_atual', new Date().toISOString().split('T')[0])
        .maybeSingle(); // Usar maybeSingle() em vez de single()

      // Ignorar erros de "não encontrado" - é normal não ter dados na fila
      if (filaError && filaError.code !== 'PGRST116' && filaError.code !== 'PGRST506') {
        console.error('Erro ao buscar dados da fila:', filaError);
        // Não lançar erro, apenas logar
      }

      return {
        totalAtendimentos,
        faturamentoGerado: faturamento,
        ticketMedio,
        tempoMedioAtendimento: Math.round(tempoMedio),
        atendimentosHoje: filaData?.total_atendimentos || 0,
        statusFila: filaData?.status || 'inactive'
      };
    } catch (error) {
      throw new Error(`Erro ao buscar estatísticas do profissional: ${error.message}`);
    }
  }

  /**
   * Busca ranking de profissionais por performance
   * @param {string} unitId - ID da unidade (opcional)
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Array>} Ranking de profissionais
   */
  static async getRankingProfissionais(unitId = null, mes = new Date().getMonth() + 1, ano = new Date().getFullYear()) {
    try {
      let query = supabase
        .from('professionals')
        .select(`
          *,
          unit:units(id, name)
        `)
        .eq('is_active', true);

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data: profissionais, error: profissionaisError } = await query;
      
      if (profissionaisError) throw profissionaisError;

      // Buscar estatísticas para cada profissional
      const ranking = await Promise.all(
        profissionais.map(async (profissional) => {
          const stats = await this.getProfissionalStats(profissional.id, mes, ano);
          return {
            ...profissional,
            ...stats
          };
        })
      );

      // Ordenar por total de atendimentos (decrescente)
      return ranking.sort((a, b) => b.totalAtendimentos - a.totalAtendimentos);
    } catch (error) {
      throw new Error(`Erro ao buscar ranking de profissionais: ${error.message}`);
    }
  }

  /**
   * Cria usuário e profissional em uma única operação
   * MÉTODO 1: Via RPC (se a função estiver corrigida no banco)
   * MÉTODO 2: Via signUp do Supabase (fallback)
   *
   * @param {Object} data - Dados completos
   * @param {string} data.email - Email do usuário
   * @param {string} data.password - Senha do usuário
   * @param {string} data.name - Nome do profissional
   * @param {string} data.role - Role do profissional
   * @param {string} data.unit_id - ID da unidade
   * @param {number} data.commission_rate - Taxa de comissão
   * @returns {Promise<Object>} Resultado da criação
   */
  static async createProfessionalComplete(data) {
    try {
      console.log('🔄 Tentando criar profissional via método alternativo...');

      // MÉTODO ALTERNATIVO: Usar signUp do Supabase Auth
      // Isso cria o usuário corretamente sem precisar acessar auth.users diretamente

      // 1. Criar usuário via signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role
          },
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      console.log('✅ Usuário criado:', authData.user.id);

      // 2. Criar profissional na tabela professionals
      const { data: professional, error: professionalError } = await supabase
        .from('professionals')
        .insert([{
          user_id: authData.user.id,
          name: data.name,
          role: data.role,
          unit_id: data.unit_id,
          commission_rate: data.commission_rate || 0,
          is_active: true
        }])
        .select(`
          *,
          unit:units(id, name)
        `)
        .single();

      if (professionalError) {
        throw new Error(`Erro ao criar profissional: ${professionalError.message}`);
      }

      console.log('✅ Profissional criado:', professional.id);

      return {
        success: true,
        user_id: authData.user.id,
        professional_id: professional.id,
        professional: professional,
        message: 'Profissional criado com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao criar profissional:', error);
      throw new Error(`Erro ao criar profissional: ${error.message}`);
    }
  }

  /**
   * @deprecated Use createProfessionalComplete instead
   */
  static async createUserForProfissional(userData) {
    throw new Error('Função descontinuada. Use createProfessionalComplete.');
  }
}

// Export default para compatibilidade
export default ProfissionaisService;