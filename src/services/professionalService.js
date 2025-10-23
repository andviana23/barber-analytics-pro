/**
 * @file professionalService.js
 * @description Serviço para gerenciamento de profissionais
 * @module Services/Professional
 * @author Barber Analytics Pro Team
 * @date 2025-10-22
 *
 * Funcionalidades:
 * - Listar profissionais por unidade
 * - Buscar profissional específico
 * - Filtros e ordenação
 * - Estatísticas de profissionais
 */

import { supabase } from './supabase';

class ProfessionalService {
  /**
   * Lista todos os profissionais
   * @param {Object} filters - Filtros opcionais
   * @param {string} filters.unitId - ID da unidade
   * @param {boolean} filters.activeOnly - Apenas profissionais ativos
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async listProfessionals(filters = {}) {
    try {
      let query = supabase
        .from('professionals')
        .select(
          `
          id,
          name,
          role,
          commission_rate,
          is_active,
          created_at,
          unit_id,
          units:unit_id (
            id,
            name
          )
        `
        )
        .order('name', { ascending: true });

      // Aplicar filtros
      if (filters.unitId) {
        query = query.eq('unit_id', filters.unitId);
      }

      if (filters.activeOnly !== false) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          '❌ professionalService.listProfessionals - Erro:',
          error
        );
        return { data: null, error };
      }

      console.log(
        '✅ professionalService.listProfessionals - Sucesso:',
        data?.length || 0,
        'profissionais'
      );
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Erro ao listar profissionais:', error);
      return {
        data: null,
        error: { message: 'Falha ao carregar profissionais: ' + error.message },
      };
    }
  }

  /**
   * Busca profissional por ID
   * @param {string} professionalId - ID do profissional
   * @returns {Promise<{data: Object|null, error: null|Object}>}
   */
  async getProfessionalById(professionalId) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select(
          `
          *,
          units:unit_id (
            id,
            name
          )
        `
        )
        .eq('id', professionalId)
        .single();

      if (error) {
        console.error(
          '❌ professionalService.getProfessionalById - Erro:',
          error
        );
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      return {
        data: null,
        error: { message: 'Profissional não encontrado: ' + error.message },
      };
    }
  }

  /**
   * Lista profissionais de uma unidade específica
   * @param {string} unitId - ID da unidade
   * @param {boolean} activeOnly - Apenas ativos
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async getProfessionalsByUnit(unitId, activeOnly = true) {
    return this.listProfessionals({ unitId, activeOnly });
  }

  /**
   * Busca profissionais por nome ou role
   * @param {string} searchTerm - Termo de busca
   * @param {string} unitId - ID da unidade (opcional)
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async searchProfessionals(searchTerm, unitId = null) {
    try {
      let query = supabase
        .from('professionals')
        .select(
          `
          id,
          name,
          role,
          commission_rate,
          is_active,
          unit_id,
          units:unit_id (
            id,
            name
          )
        `
        )
        .eq('is_active', true)
        .or(`name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`);

      if (unitId) {
        query = query.eq('unit_id', unitId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          '❌ professionalService.searchProfessionals - Erro:',
          error
        );
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      return {
        data: null,
        error: { message: 'Falha na busca: ' + error.message },
      };
    }
  }

  /**
   * Obtém estatísticas de um profissional em um período
   * @param {string} professionalId - ID do profissional
   * @param {string} startDate - Data início (YYYY-MM-DD)
   * @param {string} endDate - Data fim (YYYY-MM-DD)
   * @returns {Promise<{data: Object|null, error: null|Object}>}
   */
  async getProfessionalStats(professionalId, startDate, endDate) {
    try {
      // Buscar receitas do profissional
      const { data: revenues, error: revenuesError } = await supabase
        .from('revenues')
        .select('value, type, status, date')
        .eq('professional_id', professionalId)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_active', true);

      if (revenuesError) throw revenuesError;

      // Calcular estatísticas
      const totalRevenue =
        revenues?.reduce((sum, r) => sum + parseFloat(r.value || 0), 0) || 0;
      const receivedRevenue =
        revenues
          ?.filter(r => r.status === 'Received')
          .reduce((sum, r) => sum + parseFloat(r.value || 0), 0) || 0;
      const pendingRevenue =
        revenues
          ?.filter(r => r.status === 'Pending')
          .reduce((sum, r) => sum + parseFloat(r.value || 0), 0) || 0;

      const serviceRevenue =
        revenues
          ?.filter(r => r.type === 'service')
          .reduce((sum, r) => sum + parseFloat(r.value || 0), 0) || 0;
      const productRevenue =
        revenues
          ?.filter(r => r.type === 'product')
          .reduce((sum, r) => sum + parseFloat(r.value || 0), 0) || 0;

      return {
        data: {
          professionalId,
          period: { startDate, endDate },
          totalRevenue,
          receivedRevenue,
          pendingRevenue,
          serviceRevenue,
          productRevenue,
          transactionCount: revenues?.length || 0,
          averageTicket:
            revenues?.length > 0 ? totalRevenue / revenues.length : 0,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do profissional:', error);
      return {
        data: null,
        error: { message: 'Falha ao calcular estatísticas: ' + error.message },
      };
    }
  }

  /**
   * Lista profissionais com suas estatísticas
   * @param {string} unitId - ID da unidade
   * @param {string} startDate - Data início
   * @param {string} endDate - Data fim
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async getProfessionalsWithStats(unitId, startDate, endDate) {
    try {
      // Buscar profissionais
      const { data: professionals, error: proError } =
        await this.getProfessionalsByUnit(unitId);

      if (proError) return { data: null, error: proError };

      // Buscar estatísticas de cada profissional
      const professionalsWithStats = await Promise.all(
        professionals.map(async prof => {
          const { data: stats } = await this.getProfessionalStats(
            prof.id,
            startDate,
            endDate
          );

          return {
            ...prof,
            stats: stats || {
              totalRevenue: 0,
              receivedRevenue: 0,
              pendingRevenue: 0,
              transactionCount: 0,
              averageTicket: 0,
            },
          };
        })
      );

      // Ordenar por receita total (maior para menor)
      professionalsWithStats.sort(
        (a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0)
      );

      return { data: professionalsWithStats, error: null };
    } catch (error) {
      console.error('Erro ao buscar profissionais com estatísticas:', error);
      return {
        data: null,
        error: { message: 'Falha ao carregar dados: ' + error.message },
      };
    }
  }

  /**
   * Obtém ranking de profissionais por receita
   * @param {string} unitId - ID da unidade (opcional)
   * @param {string} startDate - Data início
   * @param {string} endDate - Data fim
   * @param {number} limit - Limite de resultados
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async getProfessionalsRanking(unitId = null, startDate, endDate, limit = 10) {
    try {
      const { data: professionalsWithStats, error } = unitId
        ? await this.getProfessionalsWithStats(unitId, startDate, endDate)
        : await this.getProfessionalsWithStats(null, startDate, endDate);

      if (error) return { data: null, error };

      // Adicionar posição no ranking
      const ranking = professionalsWithStats
        .slice(0, limit)
        .map((prof, index) => ({
          ...prof,
          ranking: {
            position: index + 1,
            percentageOfTotal: 0, // Será calculado depois se necessário
          },
        }));

      return { data: ranking, error: null };
    } catch (error) {
      console.error('Erro ao gerar ranking de profissionais:', error);
      return {
        data: null,
        error: { message: 'Falha ao gerar ranking: ' + error.message },
      };
    }
  }

  /**
   * Obtém contagem de profissionais por unidade
   * @returns {Promise<{data: Array, error: null|Object}>}
   */
  async getProfessionalsCountByUnit() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('unit_id, units:unit_id(name)')
        .eq('is_active', true);

      if (error) {
        console.error(
          '❌ professionalService.getProfessionalsCountByUnit - Erro:',
          error
        );
        return { data: null, error };
      }

      // Agrupar por unidade
      const grouped = data.reduce((acc, prof) => {
        const unitId = prof.unit_id;
        const unitName = prof.units?.name || 'Sem unidade';

        if (!acc[unitId]) {
          acc[unitId] = {
            unitId,
            unitName,
            count: 0,
          };
        }

        acc[unitId].count++;
        return acc;
      }, {});

      const result = Object.values(grouped).sort((a, b) => b.count - a.count);

      return { data: result, error: null };
    } catch (error) {
      console.error('Erro ao contar profissionais por unidade:', error);
      return {
        data: null,
        error: { message: 'Falha ao contar profissionais: ' + error.message },
      };
    }
  }
}

// Instância singleton
const professionalService = new ProfessionalService();

export default professionalService;
