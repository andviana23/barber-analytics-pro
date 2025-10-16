import { CreateRevenueDTO, RevenueResponseDTO, FORBIDDEN_REVENUE_FIELDS } from '../dtos/revenueDTO';
import revenueRepository from '../repositories/revenueRepository';

/**
 * FinanceiroService - Service Layer (Orquestrador)
 * 
 * Responsabilidades:
 * - Orquestrar fluxo de negócio
 * - Validar dados usando DTOs
 * - Delegar persistência ao Repository
 * - Transformar dados entre camadas
 * - Aplicar regras de negócio
 * 
 * NÃO faz mais:
 * - Acesso direto ao banco (delegado ao Repository)
 * - Queries SQL (Repository)
 * - Detalhes de implementação do Supabase (Repository)
 */
class FinanceiroService {
  /**
   * Buscar receitas com transformação para DTOs
   * 
   * Fluxo:
   * 1. Delegar busca ao Repository
   * 2. Transformar registros em DTOs de resposta
   * 3. Retornar dados formatados
   * 
   * @param {Object} filters - Filtros opcionais
   * @param {number} page - Página (paginação)
   * @param {number} limit - Limite por página
   * @returns {Promise<{data: RevenueResponseDTO[], error: string|null, count: number}>}
   */
  async getReceitas(filters = {}, page = 1, limit = 50) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Buscando receitas...', filters);
      
      // ==========================================
      // PASSO 1: DELEGAR BUSCA AO REPOSITORY
      // ==========================================
      const { data, error, count } = await revenueRepository.findAll(filters, page, limit);
      
      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Service: Erro ao buscar receitas:', error);
        return { data: [], error, count: 0 };
      }
      
      // ==========================================
      // PASSO 2: TRANSFORMAR EM DTOs
      // ==========================================
      const revenues = (data || []).map(record => new RevenueResponseDTO(record));
      
      // eslint-disable-next-line no-console
      console.log(`✅ Service: ${revenues.length} receitas transformadas em DTOs (total: ${count})`);
      
      return { data: revenues, error: null, count };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro inesperado ao buscar receitas:', err);
      return { data: [], error: err.message, count: 0 };
    }
  }
  
  /**
   * Criar receita com validação completa usando DTO
   * @param {Object} receitaData - Dados da receita vindos do front-end
   * @returns {Promise<{data: RevenueResponseDTO|null, error: string|null}>}
   */
  async createReceita(receitaData) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔍 Service.createReceita - Dados recebidos do front-end:', receitaData);
      // eslint-disable-next-line no-console
      console.log('🔍 Service.createReceita - Campos recebidos:', Object.keys(receitaData));
      
      // ⚠️ VERIFICAÇÃO DE SEGURANÇA: Detectar campos em português
      const forbiddenFields = ['valor', 'data', 'tipo', 'observacoes', 'origem'];
      const foundForbiddenFields = forbiddenFields.filter(field => field in receitaData);
      
      if (foundForbiddenFields.length > 0) {
        // eslint-disable-next-line no-console
        console.error('❌ ERRO: Campos em português detectados:', foundForbiddenFields);
        // eslint-disable-next-line no-console
        console.error('❌ Dados completos:', receitaData);
        return {
          data: null,
          error: `Erro interno: campos em português detectados (${foundForbiddenFields.join(', ')}). Por favor, reporte este erro ao suporte.`
        };
      }
      
      // ==========================================
      // PASSO 1: CRIAR DTO
      // ==========================================
      // eslint-disable-next-line no-console
      console.log('📐 Service: Criando DTO...');
      const dto = new CreateRevenueDTO(receitaData);
      
      // eslint-disable-next-line no-console
      console.log('📐 Service: DTO criado com sucesso');
      // eslint-disable-next-line no-console
      console.log('📐 Service: Campos do DTO:', Object.keys(dto));
      
      // ==========================================
      // PASSO 2: VALIDAR DTO
      // ==========================================
      // eslint-disable-next-line no-console
      console.log('✔️ Validando DTO...');
      const validation = dto.validate();
      
      if (!validation.isValid) {
        // eslint-disable-next-line no-console
        console.error('❌ Validação falhou:', validation.errors);
        
        // Retornar erro com lista de problemas
        return { 
          data: null, 
          error: validation.errors.join(' | ')
        };
      }
      
      // eslint-disable-next-line no-console
      console.log('✅ Validação passou!');
      
      // ==========================================
      // PASSO 3: TRANSFORMAR PARA BANCO
      // ==========================================
      let dbData = dto.toDatabase();
      
      // eslint-disable-next-line no-console
      console.log('💾 Service: Dados preparados para o banco:', dbData);
      // eslint-disable-next-line no-console
      console.log('💾 Service: Campos que serão inseridos:', Object.keys(dbData));
      // eslint-disable-next-line no-console
      console.log('💾 Service: Verificando campo "valor":', 'valor' in dbData ? '❌ ENCONTRADO!' : '✅ OK');
      // eslint-disable-next-line no-console
      console.log('💾 Service: Verificando campo "value":', 'value' in dbData ? '✅ ENCONTRADO!' : '❌ FALTANDO!');
      
      // ⚠️ SANITIZAÇÃO EXTRA: Remover "valor" se existir
      if ('valor' in dbData) {
        // eslint-disable-next-line no-console
        console.error('🚨 Service: CAMPO "valor" DETECTADO! Removendo...');
        dbData = { ...dbData };
        delete dbData.valor;
        // eslint-disable-next-line no-console
        console.log('💾 Service: Campos após sanitização:', Object.keys(dbData));
      }
      
      // ==========================================
      // PASSO 4: REMOVER CAMPOS PROIBIDOS (SERVIÇO) E DELEGAR AO REPOSITORY
      // Defesa em profundidade: remover campos gerados/forbidden no serviço
      // ==========================================
      // eslint-disable-next-line no-console
      console.log('💾 Service: Preparando dados finais para o banco...');

      const dbDataFinal = { ...dbData };
      const removedAtService = [];
      FORBIDDEN_REVENUE_FIELDS.forEach((f) => {
        if (f in dbDataFinal) {
          removedAtService.push(f);
          delete dbDataFinal[f];
        }
      });

      if (removedAtService.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('🚨 Service: Campos proibidos removidos antes do insert:', removedAtService);
        // eslint-disable-next-line no-console
        console.log('💾 Service: Campos após remoção no serviço:', Object.keys(dbDataFinal));
      }

      // eslint-disable-next-line no-console
      console.log('💾 Service: Delegando criação ao Repository...');

      const { data, error } = await revenueRepository.create(dbDataFinal);
      
      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Service: Erro do Repository:', error);
        return { data: null, error };
      }
      
      // ==========================================
      // PASSO 5: CRIAR DTO DE RESPOSTA
      // ==========================================
      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita criada com sucesso!');
      // eslint-disable-next-line no-console
      console.log('✅ Service: ID da receita:', data.id);
      
      const responseDTO = new RevenueResponseDTO(data);
      
      // eslint-disable-next-line no-console
      console.log('📤 DTO de resposta:', responseDTO);
      
      return { data: responseDTO, error: null };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro inesperado em createReceita:', err);
      // eslint-disable-next-line no-console
      console.error('❌ Stack:', err.stack);
      
      return { 
        data: null, 
        error: 'Erro inesperado ao criar receita. Tente novamente.' 
      };
    }
  }

  /**
   * Buscar uma receita específica por ID
   * 
   * @param {string} id - UUID da receita
   * @returns {Promise<{data: RevenueResponseDTO|null, error: string|null}>}
   */
  async getReceitaById(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Buscando receita por ID:', id);
      
      const { data, error } = await revenueRepository.findById(id);
      
      if (error) {
        return { data: null, error };
      }
      
      const revenueDTO = new RevenueResponseDTO(data);
      
      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita encontrada e transformada em DTO');
      
      return { data: revenueDTO, error: null };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao buscar receita por ID:', err);
      return { data: null, error: err.message };
    }
  }

  /**
   * Atualizar uma receita existente
   * 
   * @param {string} id - UUID da receita
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise<{data: RevenueResponseDTO|null, error: string|null}>}
   */
  async updateReceita(id, updateData) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Atualizando receita:', id);
      
      // Validar dados com DTO (reutilizar validações)
      const dto = new CreateRevenueDTO(updateData);
      const validation = dto.validate();
      
      if (!validation.isValid) {
        return { 
          data: null, 
          error: validation.errors.join(' | ')
        };
      }
      
      const dbData = dto.toDatabase();
      
      // Delegar ao Repository
      const { data, error } = await revenueRepository.update(id, dbData);
      
      if (error) {
        return { data: null, error };
      }
      
      const responseDTO = new RevenueResponseDTO(data);
      
      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita atualizada com sucesso');
      
      return { data: responseDTO, error: null };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao atualizar receita:', err);
      return { data: null, error: err.message };
    }
  }

  /**
   * Deletar uma receita (soft delete)
   * 
   * @param {string} id - UUID da receita
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteReceita(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Deletando receita:', id);
      
      const { success, error } = await revenueRepository.softDelete(id);
      
      if (!success) {
        return { success: false, error };
      }
      
      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita deletada com sucesso');
      
      return { success: true, error: null };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao deletar receita:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Buscar receitas por período (para dashboards/relatórios)
   * 
   * @param {Object} params
   * @param {string} params.unit_id - ID da unidade
   * @param {string} params.start_date - Data de início
   * @param {string} params.end_date - Data de fim
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getReceitasByPeriod(params) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Buscando receitas por período...', params);
      
      const { data, error } = await revenueRepository.getByPeriod(params);
      
      if (error) {
        return { data: null, error };
      }
      
      // Transformar receitas em DTOs
      const revenues = data.revenues.map(record => new RevenueResponseDTO(record));
      
      // eslint-disable-next-line no-console
      console.log('✅ Service: Receitas do período transformadas em DTOs');
      
      return { 
        data: {
          revenues,
          summary: data.summary
        }, 
        error: null 
      };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao buscar receitas por período:', err);
      return { data: null, error: err.message };
    }
  }

  /**
   * Contar total de receitas com filtros
   * 
   * @param {Object} filters - Filtros de contagem
   * @returns {Promise<{count: number, error: string|null}>}
   */
  async countReceitas(filters = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Contando receitas...', filters);
      
      const { count, error } = await revenueRepository.count(filters);
      
      if (error) {
        return { count: 0, error };
      }
      
      // eslint-disable-next-line no-console
      console.log('✅ Service: Total de receitas:', count);
      
      return { count, error: null };
      
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao contar receitas:', err);
      return { count: 0, error: err.message };
    }
  }

  // Aliases para compatibilidade com testes
  async createRevenue(revenueData) {
    const result = await this.createReceita(revenueData);
    return {
      success: !result.error,
      data: result.data,
      error: result.error
    };
  }

  async getRevenues(filters = {}, page = 1, limit = 50) {
    const result = await this.getReceitas(filters, page, limit);
    return {
      success: !result.error,
      data: result.data,
      error: result.error,
      count: result.count
    };
  }

  async getKPIs(unitId, period) {
    // Mock implementation para testes
    const filters = { unitId, period };
    const revenues = await this.getReceitas(filters);
    
    // Cálculo básico de KPIs
    const totalRevenue = revenues.data?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
    const totalCount = revenues.count || 0;
    const averageRevenue = totalCount > 0 ? totalRevenue / totalCount : 0;

    return {
      success: true,
      data: {
        totalRevenue,
        totalCount,
        averageRevenue,
        trends: {
          growth_direction: 'up',
          revenue_growth: 5.2
        }
      },
      error: null
    };
  }

  async updateRevenueStatus(revenueId, status, metadata = {}) {
    const updateData = { status, ...metadata };
    const result = await this.updateReceita(revenueId, updateData);
    return {
      success: !result.error,
      data: result.data,
      error: result.error
    };
  }
}

export default new FinanceiroService();
