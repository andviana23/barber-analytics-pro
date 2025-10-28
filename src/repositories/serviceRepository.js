/**
 * @file serviceRepository.js
 * @description Repository para operações de Services (Serviços)
 * @module Repositories/Service
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { supabase } from '../services/supabase';

/**
 * Repository para gerenciar operações de serviços no banco de dados
 * Segue padrão Repository do Clean Architecture
 */
class ServiceRepository {
  /**
   * Cria um novo serviço
   *
   * @param {Object} data - Dados do serviço
   * @param {string} data.unitId - ID da unidade
   * @param {string} data.name - Nome do serviço
   * @param {number} data.durationMinutes - Duração em minutos
   * @param {number} data.price - Preço do serviço
   * @param {number} data.commissionPercentage - Percentual de comissão
   * @param {boolean} [data.active=true] - Se o serviço está ativo
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createService(data) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .insert({
          unit_id: data.unitId,
          name: data.name,
          duration_minutes: data.durationMinutes,
          price: data.price,
          commission_percentage: data.commissionPercentage,
          active: data.active !== undefined ? data.active : true,
        })
        .select()
        .single();

      if (error) {
        console.error('[ServiceRepository] Erro ao criar serviço:', error);
        return { data: null, error };
      }

      console.log(
        '[ServiceRepository] Serviço criado com sucesso:',
        service.id
      );
      return { data: service, error: null };
    } catch (error) {
      console.error('[ServiceRepository] Exceção ao criar serviço:', error);
      return { data: null, error };
    }
  }

  /**
   * Atualiza um serviço existente
   *
   * @param {string} id - ID do serviço
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateService(id, data) {
    try {
      const updateData = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.durationMinutes !== undefined) {
        updateData.duration_minutes = data.durationMinutes;
      }
      if (data.price !== undefined) updateData.price = data.price;
      if (data.commissionPercentage !== undefined) {
        updateData.commission_percentage = data.commissionPercentage;
      }
      if (data.active !== undefined) updateData.active = data.active;

      const { data: service, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[ServiceRepository] Erro ao atualizar serviço:', error);
        return { data: null, error };
      }

      console.log('[ServiceRepository] Serviço atualizado com sucesso:', id);
      return { data: service, error: null };
    } catch (error) {
      console.error('[ServiceRepository] Exceção ao atualizar serviço:', error);
      return { data: null, error };
    }
  }

  /**
   * Faz soft delete de um serviço (marca como inativo)
   *
   * @param {string} id - ID do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async deleteService(id) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[ServiceRepository] Erro ao desativar serviço:', error);
        return { data: null, error };
      }

      console.log('[ServiceRepository] Serviço desativado com sucesso:', id);
      return { data: service, error: null };
    } catch (error) {
      console.error('[ServiceRepository] Exceção ao desativar serviço:', error);
      return { data: null, error };
    }
  }

  /**
   * Busca um serviço por ID
   *
   * @param {string} id - ID do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getServiceById(id) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .select('*, unit:units(id, name)')
        .eq('id', id)
        .single();

      if (error) {
        console.error(
          '[ServiceRepository] Erro ao buscar serviço por ID:',
          error
        );
        return { data: null, error };
      }

      return { data: service, error: null };
    } catch (error) {
      console.error(
        '[ServiceRepository] Exceção ao buscar serviço por ID:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Lista serviços com filtros e paginação
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @param {boolean} [filters.activeOnly=true] - Se true, retorna apenas ativos
   * @param {string} [filters.searchTerm] - Termo para busca no nome
   * @param {number} [filters.minPrice] - Preço mínimo
   * @param {number} [filters.maxPrice] - Preço máximo
   * @param {number} [filters.page=1] - Página atual
   * @param {number} [filters.limit=20] - Limite de registros por página
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listServices(unitId, filters = {}) {
    try {
      const {
        activeOnly = true,
        searchTerm,
        minPrice,
        maxPrice,
        page = 1,
        limit = 20,
      } = filters;

      const offset = (page - 1) * limit;

      let query = supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('unit_id', unitId);

      if (activeOnly) {
        query = query.eq('active', true);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (minPrice !== undefined) {
        query = query.gte('price', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.lte('price', maxPrice);
      }

      query = query
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1);

      const { data: services, error, count } = await query;

      if (error) {
        console.error('[ServiceRepository] Erro ao listar serviços:', error);
        return { data: null, error, count: null };
      }

      return { data: services, error: null, count };
    } catch (error) {
      console.error('[ServiceRepository] Exceção ao listar serviços:', error);
      return { data: null, error, count: null };
    }
  }

  /**
   * Busca apenas serviços ativos de uma unidade (para dropdowns)
   *
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getActiveServices(unitId) {
    try {
      const { data: services, error } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price, commission_percentage')
        .eq('unit_id', unitId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error(
          '[ServiceRepository] Erro ao buscar serviços ativos:',
          error
        );
        return { data: null, error };
      }

      return { data: services, error: null };
    } catch (error) {
      console.error(
        '[ServiceRepository] Exceção ao buscar serviços ativos:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Busca serviços populares (mais utilizados)
   *
   * @param {string} unitId - ID da unidade
   * @param {number} [limit=10] - Quantidade de serviços
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getPopularServices(unitId, limit = 10) {
    try {
      const { data: services, error } = await supabase.rpc(
        'get_popular_services',
        {
          p_unit_id: unitId,
          p_limit: limit,
        }
      );

      if (error) {
        console.error(
          '[ServiceRepository] Erro ao buscar serviços populares:',
          error
        );
        return { data: null, error };
      }

      return { data: services, error: null };
    } catch (error) {
      console.error(
        '[ServiceRepository] Exceção ao buscar serviços populares:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Verifica se um serviço está sendo usado em comandas
   *
   * @param {string} serviceId - ID do serviço
   * @returns {Promise<{data: boolean, error: Error|null}>}
   */
  async isServiceInUse(serviceId) {
    try {
      const { count, error } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('service_id', serviceId);

      if (error) {
        console.error(
          '[ServiceRepository] Erro ao verificar uso do serviço:',
          error
        );
        return { data: false, error };
      }

      return { data: count > 0, error: null };
    } catch (error) {
      console.error(
        '[ServiceRepository] Exceção ao verificar uso do serviço:',
        error
      );
      return { data: false, error };
    }
  }

  /**
   * Busca estatísticas de um serviço
   *
   * @param {string} serviceId - ID do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getServiceStats(serviceId) {
    try {
      const { data: stats, error } = await supabase.rpc(
        'get_service_statistics',
        {
          p_service_id: serviceId,
        }
      );

      if (error) {
        console.error(
          '[ServiceRepository] Erro ao buscar estatísticas do serviço:',
          error
        );
        return { data: null, error };
      }

      return { data: stats, error: null };
    } catch (error) {
      console.error(
        '[ServiceRepository] Exceção ao buscar estatísticas do serviço:',
        error
      );
      return { data: null, error };
    }
  }

  /**
   * Reativa um serviço previamente desativado
   *
   * @param {string} id - ID do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async reactivateService(id) {
    try {
      const { data: service, error } = await supabase
        .from('services')
        .update({
          active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[ServiceRepository] Erro ao reativar serviço:', error);
        return { data: null, error };
      }

      console.log('[ServiceRepository] Serviço reativado com sucesso:', id);
      return { data: service, error: null };
    } catch (error) {
      console.error('[ServiceRepository] Exceção ao reativar serviço:', error);
      return { data: null, error };
    }
  }
}

export default new ServiceRepository();
