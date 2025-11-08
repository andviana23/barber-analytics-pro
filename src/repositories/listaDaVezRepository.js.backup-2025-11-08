/**
 * @file listaDaVezRepository.js
 * @description Repository para operações de banco de dados do módulo Lista da Vez
 * @module repositories/listaDaVezRepository
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Repository responsável por todas as operações de banco de dados
 * relacionadas ao módulo Lista da Vez, seguindo o padrão Repository
 * da arquitetura Clean Architecture do Barber Analytics Pro.
 */

import { supabase } from '../services/supabase';

/**
 * Classe ListaDaVezRepository
 * Responsável pelas operações de persistência de dados
 */
class ListaDaVezRepository {
  /**
   * Busca a lista da vez atual para uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<Array>} Lista ordenada dos barbeiros
   */
  async getTurnListByUnit(unitId) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_list_complete')
        .select('*')
        .eq('unit_id', unitId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar lista da vez:', error);
      throw new Error(`Erro ao buscar lista da vez: ${error.message}`);
    }
  }

  /**
   * Busca lista da vez para todas as unidades
   * @returns {Promise<Array>} Lista completa de todas as unidades
   */
  async getAllTurnLists() {
    try {
      const { data, error } = await supabase
        .from('vw_turn_list_complete')
        .select('*')
        .order('unit_id', { ascending: true })
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar todas as listas da vez:', error);
      throw new Error(`Erro ao buscar listas da vez: ${error.message}`);
    }
  }

  /**
   * Inicializa a lista da vez para uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<Object>} Resultado da inicialização
   */
  async initializeTurnList(unitId) {
    try {
      const { data, error } = await supabase.rpc('fn_initialize_turn_list', {
        p_unit_id: unitId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao inicializar lista da vez:', error);
      throw new Error(`Erro ao inicializar lista da vez: ${error.message}`);
    }
  }

  /**
   * Adiciona um ponto a um barbeiro
   * @param {string} unitId - UUID da unidade
   * @param {string} professionalId - UUID do profissional
   * @returns {Promise<Object>} Resultado da operação
   */
  async addPointToBarber(unitId, professionalId) {
    try {
      const { data, error } = await supabase.rpc('fn_add_point_to_barber', {
        p_unit_id: unitId,
        p_professional_id: professionalId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao adicionar ponto:', error);
      throw new Error(`Erro ao adicionar ponto: ${error.message}`);
    }
  }

  /**
   * Busca histórico mensal para uma unidade
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise<Array>} Histórico do mês
   */
  async getMonthlyHistory(unitId, month, year) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .eq('month', month)
        .eq('year', year)
        .order('final_position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico mensal:', error);
      throw new Error(`Erro ao buscar histórico mensal: ${error.message}`);
    }
  }

  /**
   * Busca histórico completo de uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<Array>} Histórico completo
   */
  async getUnitHistory(unitId) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('final_position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico da unidade:', error);
      throw new Error(`Erro ao buscar histórico da unidade: ${error.message}`);
    }
  }

  /**
   * Busca histórico de todos os meses disponíveis
   * @returns {Promise<Array>} Lista de meses/anos disponíveis
   */
  async getAvailableHistoryMonths() {
    try {
      const { data, error } = await supabase
        .from('vw_turn_history_complete')
        .select('month, year, unit_id, unit_name')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;

      // Agrupar por mês/ano e unidade
      const grouped = {};
      data.forEach(item => {
        const key = `${item.year}-${item.month}`;
        if (!grouped[key]) {
          grouped[key] = {
            year: item.year,
            month: item.month,
            units: [],
          };
        }
        if (!grouped[key].units.find(u => u.id === item.unit_id)) {
          grouped[key].units.push({
            id: item.unit_id,
            name: item.unit_name,
          });
        }
      });

      return Object.values(grouped);
    } catch (error) {
      console.error('Erro ao buscar meses disponíveis:', error);
      throw new Error(`Erro ao buscar meses disponíveis: ${error.message}`);
    }
  }

  /**
   * Executa reset mensal manual (apenas para admins)
   * @returns {Promise<Object>} Resultado do reset
   */
  async executeMonthlyReset() {
    try {
      const { data, error } = await supabase.rpc('fn_monthly_reset_turn_list');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao executar reset mensal:', error);
      throw new Error(`Erro ao executar reset mensal: ${error.message}`);
    }
  }

  /**
   * Busca estatísticas da lista da vez
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<Object>} Estatísticas
   */
  async getTurnListStats(unitId) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_list_complete')
        .select('*')
        .eq('unit_id', unitId);

      if (error) throw error;

      const stats = {
        totalBarbers: data.length,
        totalPoints: data.reduce((sum, item) => sum + item.points, 0),
        averagePoints:
          data.length > 0
            ? data.reduce((sum, item) => sum + item.points, 0) / data.length
            : 0,
        lastUpdated:
          data.length > 0
            ? Math.max(
                ...data.map(item => new Date(item.last_updated).getTime())
              )
            : null,
        barbersWithPoints: data.filter(item => item.points > 0).length,
      };

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }
  }

  /**
   * Busca dados para relatório mensal
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês
   * @param {number} year - Ano
   * @returns {Promise<Object>} Dados do relatório
   */
  async getMonthlyReport(unitId, month, year) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .eq('month', month)
        .eq('year', year)
        .order('final_position', { ascending: true });

      if (error) throw error;

      const report = {
        unitId,
        month,
        year,
        totalBarbers: data.length,
        totalPoints: data.reduce((sum, item) => sum + item.total_points, 0),
        averagePoints:
          data.length > 0
            ? data.reduce((sum, item) => sum + item.total_points, 0) /
              data.length
            : 0,
        barbers: data.map(item => ({
          name: item.professional_name,
          totalPoints: item.total_points,
          finalPosition: item.final_position,
        })),
        generatedAt: new Date().toISOString(),
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório mensal:', error);
      throw new Error(`Erro ao gerar relatório mensal: ${error.message}`);
    }
  }

  /**
   * Verifica se a lista da vez existe para uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<boolean>} True se existe
   */
  async checkTurnListExists(unitId) {
    try {
      const { data, error } = await supabase
        .from('barbers_turn_list')
        .select('id')
        .eq('unit_id', unitId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar existência da lista:', error);
      throw new Error(
        `Erro ao verificar existência da lista: ${error.message}`
      );
    }
  }

  /**
   * Busca barbeiros ativos de uma unidade (para inicialização)
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<Array>} Lista de barbeiros ativos
   */
  async getActiveBarbersByUnit(unitId) {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, name, role, created_at')
        .eq('unit_id', unitId)
        .eq('role', 'barbeiro')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar barbeiros ativos:', error);
      throw new Error(`Erro ao buscar barbeiros ativos: ${error.message}`);
    }
  }
}

// Exportar instância única (Singleton)
export const listaDaVezRepository = new ListaDaVezRepository();
export default listaDaVezRepository;
