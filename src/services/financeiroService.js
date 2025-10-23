import {
  CreateRevenueDTO,
  RevenueResponseDTO,
  FORBIDDEN_REVENUE_FIELDS,
} from '../dtos/revenueDTO';
import revenueRepository from '../repositories/revenueRepository';
import { supabase } from './supabase';

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
  /**
   * 🔄 AUTO-ATUALIZAÇÃO DE STATUS
   * Verifica receitas "Pending" cuja data prevista já passou e atualiza para "Received"
   * @private
   */
  async autoUpdateOverdueReceitas() {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeFmt = hoje.toISOString().split('T')[0];

      // eslint-disable-next-line no-console
      console.log('⏰ Auto-Update: Verificando receitas vencidas...', {
        data: hojeFmt,
      });

      // Buscar receitas Pending com data prevista <= hoje
      const { data: receitas, error } = await supabase
        .from('revenues')
        .select('id, expected_receipt_date, status')
        .eq('status', 'Pending')
        .lte('expected_receipt_date', hojeFmt)
        .eq('is_active', true);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Auto-Update: Erro ao buscar receitas:', error);
        return { updated: 0, error };
      }

      if (!receitas || receitas.length === 0) {
        // eslint-disable-next-line no-console
        console.log('✅ Auto-Update: Nenhuma receita vencida encontrada');
        return { updated: 0, error: null };
      }

      // eslint-disable-next-line no-console
      console.log(
        `⚠️ Auto-Update: ${receitas.length} receitas vencidas encontradas. Atualizando...`
      );

      // Atualizar cada receita individualmente (mais confiável)
      let updatedCount = 0;
      for (const receita of receitas) {
        const { error: updateError } = await supabase
          .from('revenues')
          .update({
            status: 'Received',
            actual_receipt_date: receita.expected_receipt_date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', receita.id);

        if (!updateError) {
          updatedCount++;
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `❌ Auto-Update: Erro ao atualizar receita ${receita.id}:`,
            updateError
          );
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `✅ Auto-Update: ${updatedCount}/${receitas.length} receitas atualizadas para "Received"`
      );
      return { updated: updatedCount, error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Auto-Update: Erro inesperado:', err);
      return { updated: 0, error: err.message };
    }
  }

  async getReceitas(filters = {}, pagination = null) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Buscando receitas...', filters);

      // ==========================================
      // PASSO 0: AUTO-ATUALIZAÇÃO DE STATUS
      // ==========================================
      // 🔄 Executar auto-update antes de buscar e aguardar conclusão
      const updateResult = await this.autoUpdateOverdueReceitas();
      if (updateResult.updated > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `🔄 Auto-Update: ${updateResult.updated} receitas atualizadas. Recarregando dados...`
        );
      }

      // ==========================================
      // PASSO 1: DELEGAR BUSCA AO REPOSITORY
      // ==========================================
      let result;
      if (pagination) {
        result = await revenueRepository.findAll(
          filters,
          pagination.page,
          pagination.limit
        );
      } else {
        // ✅ FIX: Sem paginação = buscar TODAS as receitas (limite muito alto)
        result = await revenueRepository.findAll(filters, 1, 10000);
      }

      const { data, error, count } = result;

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Service: Erro ao buscar receitas:', error);
        return { data: [], error, count: 0 };
      }

      // ==========================================
      // PASSO 2: TRANSFORMAR EM DTOs
      // ==========================================
      const revenues = (data || []).map(record =>
        new RevenueResponseDTO(record).toPlainObject()
      );

      // eslint-disable-next-line no-console
      console.log(
        `✅ Service: ${revenues.length} receitas transformadas em DTOs (total: ${count})`
      );

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
      console.log(
        '🔍 Service.createReceita - Dados recebidos do front-end:',
        receitaData
      );
      // eslint-disable-next-line no-console
      console.log(
        '🔍 Service.createReceita - Campos recebidos:',
        Object.keys(receitaData)
      );

      // ⚠️ VERIFICAÇÃO DE SEGURANÇA: Detectar campos em português
      const forbiddenFields = [
        'valor',
        'data',
        'tipo',
        'observacoes',
        'origem',
      ];
      const foundForbiddenFields = forbiddenFields.filter(
        field => field in receitaData
      );

      if (foundForbiddenFields.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
          '❌ ERRO: Campos em português detectados:',
          foundForbiddenFields
        );
        // eslint-disable-next-line no-console
        console.error('❌ Dados completos:', receitaData);
        return {
          data: null,
          error: `Erro interno: campos em português detectados (${foundForbiddenFields.join(', ')}). Por favor, reporte este erro ao suporte.`,
        };
      }

      // ✅ VALIDAÇÃO DE STATUS: Garantir que o status está correto baseado na data
      if (receitaData.expected_receipt_date) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const prevReceb = new Date(
          receitaData.expected_receipt_date + 'T00:00:00'
        );

        const statusCorreto = prevReceb <= hoje ? 'Received' : 'Pending';

        if (receitaData.status && receitaData.status !== statusCorreto) {
          // eslint-disable-next-line no-console
          console.warn(
            `⚠️ Status informado (${receitaData.status}) não corresponde à data prevista. Corrigindo para: ${statusCorreto}`
          );
          receitaData.status = statusCorreto;
        }

        // Se status não foi informado, definir automaticamente
        if (!receitaData.status) {
          receitaData.status = statusCorreto;
        }

        // Se status é Received, garantir que actual_receipt_date está setado
        if (
          receitaData.status === 'Received' &&
          !receitaData.actual_receipt_date
        ) {
          receitaData.actual_receipt_date = receitaData.expected_receipt_date;
        }
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
          error: validation.errors.join(' | '),
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
      console.log(
        '💾 Service: Campos que serão inseridos:',
        Object.keys(dbData)
      );
      // eslint-disable-next-line no-console
      console.log(
        '💾 Service: Verificando campo "valor":',
        'valor' in dbData ? '❌ ENCONTRADO!' : '✅ OK'
      );
      // eslint-disable-next-line no-console
      console.log(
        '💾 Service: Verificando campo "value":',
        'value' in dbData ? '✅ ENCONTRADO!' : '❌ FALTANDO!'
      );

      // ⚠️ SANITIZAÇÃO EXTRA: Remover "valor" se existir
      if ('valor' in dbData) {
        // eslint-disable-next-line no-console
        console.error('🚨 Service: CAMPO "valor" DETECTADO! Removendo...');
        dbData = { ...dbData };
        delete dbData.valor;
        // eslint-disable-next-line no-console
        console.log(
          '💾 Service: Campos após sanitização:',
          Object.keys(dbData)
        );
      }

      // ==========================================
      // PASSO 4: REMOVER CAMPOS PROIBIDOS (SERVIÇO) E DELEGAR AO REPOSITORY
      // Defesa em profundidade: remover campos gerados/forbidden no serviço
      // ==========================================
      // eslint-disable-next-line no-console
      console.log('💾 Service: Preparando dados finais para o banco...');

      const dbDataFinal = { ...dbData };
      const removedAtService = [];
      FORBIDDEN_REVENUE_FIELDS.forEach(f => {
        if (f in dbDataFinal) {
          removedAtService.push(f);
          delete dbDataFinal[f];
        }
      });

      if (removedAtService.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          '🚨 Service: Campos proibidos removidos antes do insert:',
          removedAtService
        );
        // eslint-disable-next-line no-console
        console.log(
          '💾 Service: Campos após remoção no serviço:',
          Object.keys(dbDataFinal)
        );
      }

      // eslint-disable-next-line no-console
      console.log('💾 Service: Delegando criação ao Repository...');

      const { data, error } = await revenueRepository.create(dbDataFinal);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Service: Erro do Repository:', error);

        // Traduzir erros comuns do PostgreSQL para português
        let errorMessage = error;
        if (error.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'Receita já existe';
        }

        return { data: null, error: errorMessage };
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

      return { data: responseDTO.toPlainObject(), error: null };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro inesperado em createReceita:', err);
      // eslint-disable-next-line no-console
      console.error('❌ Stack:', err.stack);

      return {
        data: null,
        error: 'Erro inesperado ao criar receita. Tente novamente.',
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

      return { data: revenueDTO.toPlainObject(), error: null };
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

      // ✅ VALIDAÇÃO DE STATUS: Garantir que o status está correto baseado na data
      if (updateData.expected_receipt_date || updateData.status) {
        // Se está atualizando expected_receipt_date, buscar a receita atual
        let expected_receipt_date = updateData.expected_receipt_date;

        if (!expected_receipt_date) {
          // Buscar a receita atual para pegar o expected_receipt_date
          const { data: currentRevenue } = await revenueRepository.findById(id);
          expected_receipt_date = currentRevenue?.expected_receipt_date;
        }

        if (expected_receipt_date) {
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const prevReceb = new Date(expected_receipt_date + 'T00:00:00');

          const statusCorreto = prevReceb <= hoje ? 'Received' : 'Pending';

          // Se está atualizando status, validar se está correto
          if (updateData.status && updateData.status !== statusCorreto) {
            // eslint-disable-next-line no-console
            console.warn(
              `⚠️ Tentativa de atualizar status para ${updateData.status}, mas a data prevista indica: ${statusCorreto}. Corrigindo...`
            );
            updateData.status = statusCorreto;
          }

          // Se está atualizando expected_receipt_date, recalcular status
          if (updateData.expected_receipt_date) {
            updateData.status = statusCorreto;
          }

          // Se status é Received, garantir que actual_receipt_date está setado
          if (
            updateData.status === 'Received' &&
            !updateData.actual_receipt_date
          ) {
            updateData.actual_receipt_date = expected_receipt_date;
          }
        }
      }

      // Para updates, não validamos campos obrigatórios
      // Só validamos tipos de dados fornecidos
      const allowedUpdateFields = [
        'status',
        'value',
        'date',
        'type',
        'actual_receipt_date',
        'expected_receipt_date',
      ];
      const cleanUpdateData = {};

      // Filtrar apenas campos permitidos para update
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedUpdateFields.includes(key) && value !== undefined) {
          cleanUpdateData[key] = value;
        }
      }

      // Delegar ao Repository
      const { data, error } = await revenueRepository.update(
        id,
        cleanUpdateData
      );

      if (error) {
        return {
          success: false,
          data: null,
          error,
        };
      }

      const responseDTO = new RevenueResponseDTO(data);

      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita atualizada com sucesso');

      return {
        success: true,
        data: responseDTO.toPlainObject(),
        error: null,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Service: Erro ao atualizar receita:', err);
      return { data: null, error: err.message };
    }
  }

  /**
   * Deletar uma receita (hard delete - exclusão permanente)
   * ⚠️ ATENÇÃO: Os dados serão apagados permanentemente do banco!
   *
   * @param {string} id - UUID da receita
   * @returns {Promise<{success: boolean, error: string|null}>}
   */
  async deleteReceita(id) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Deletando receita permanentemente:', id);

      const { success, error } = await revenueRepository.hardDelete(id);

      if (!success) {
        return { success: false, error };
      }

      // eslint-disable-next-line no-console
      console.log('✅ Service: Receita deletada permanentemente do banco');

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
      const revenues = data.revenues.map(record =>
        new RevenueResponseDTO(record).toPlainObject()
      );

      // eslint-disable-next-line no-console
      console.log('✅ Service: Receitas do período transformadas em DTOs');

      return {
        data: {
          revenues,
          summary: data.summary,
        },
        error: null,
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
      error: result.error,
    };
  }

  async findById(id) {
    return this.getReceitaById(id);
  }

  async getRevenues(filters = {}, pagination = null) {
    let result;
    if (pagination && typeof pagination === 'object') {
      result = await this.getReceitas(filters, pagination);
    } else {
      result = await this.getReceitas(filters);
    }

    return {
      success: !result.error,
      data: result.data,
      error: result.error,
      count: result.count,
    };
  }

  async getKPIs(unitId, period) {
    try {
      // Buscar receitas do período atual
      const currentFilters = { unitId, period };
      const currentRevenues = await this.getReceitas(currentFilters);

      // Calcular período anterior
      const [year, month] = period.split('-');
      const prevYear = month === '01' ? (parseInt(year) - 1).toString() : year;
      const prevMonth =
        month === '01'
          ? '12'
          : (parseInt(month) - 1).toString().padStart(2, '0');
      const previousPeriod = `${prevYear}-${prevMonth}`;

      const prevFilters = { unitId, period: previousPeriod };
      const previousRevenues = await this.getReceitas(prevFilters);

      // Calcular métricas do período atual
      const currentTotal =
        currentRevenues.data?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
      const currentPending =
        currentRevenues.data
          ?.filter(r => r.status === 'pending')
          .reduce((sum, r) => sum + (r.value || 0), 0) || 0;
      const currentReceived =
        currentRevenues.data
          ?.filter(r => r.status === 'received')
          .reduce((sum, r) => sum + (r.value || 0), 0) || 0;

      // Calcular métricas do período anterior
      const previousTotal =
        previousRevenues.data?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;

      // Calcular crescimento
      let growthPercentage = 0;
      let growthDirection = 'stable';

      if (previousTotal === 0 && currentTotal > 0) {
        growthPercentage = 100; // 100% quando base era zero
        growthDirection = 'up';
      } else if (previousTotal > 0) {
        growthPercentage =
          ((currentTotal - previousTotal) / previousTotal) * 100;
        if (growthPercentage > 0) {
          growthDirection = 'up';
        } else if (growthPercentage < 0) {
          growthDirection = 'down';
        }
      }

      return {
        success: true,
        data: {
          current_period: {
            total_revenue: currentTotal,
            pending_revenue: currentPending,
            received_revenue: currentReceived,
          },
          trends: {
            growth_direction: growthDirection,
            revenue_growth: Math.round(growthPercentage * 100) / 100, // Arredonda para 2 casas decimais
          },
        },
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }

  /**
   * Helper para normalizar status (primeira letra maiúscula)
   * @private
   * @param {string} status
   * @returns {string|null}
   */
  _normalizeStatus(status) {
    if (!status) return null;
    // Converte para formato com primeira letra maiúscula (ex: "Pending")
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  async updateRevenueStatus(revenueId, status, metadata = {}) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Service: Atualizando receita:', revenueId);

      // Buscar receita atual
      const currentRevenue = await this.getReceitaById(revenueId);
      if (!currentRevenue || currentRevenue.error) {
        return {
          success: false,
          data: null,
          error: 'Receita não encontrada',
        };
      }

      // Validar transição de status usando normalização
      const currentStatus = this._normalizeStatus(currentRevenue.data?.status);
      const newStatus = this._normalizeStatus(status);

      const validTransitions = {
        Pending: ['Received', 'Cancelled'],
        Received: ['Refunded'],
        Cancelled: ['Pending'], // Pode reativar
        Refunded: [], // Estado final
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return {
          success: false,
          data: null,
          error: 'Transição de status inválida',
        };
      }

      // Atualizar receita com status normalizado
      const normalizedStatus = this._normalizeStatus(status);
      const updateData = { status: normalizedStatus, ...metadata };
      const result = await this.updateReceita(revenueId, updateData);
      return result;
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  }
}

export default new FinanceiroService();
