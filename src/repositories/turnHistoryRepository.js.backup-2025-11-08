/**
 * @file turnHistoryRepository.js
 * @description Repository para histórico diário da Lista da Vez
 * @module repositories/turnHistoryRepository
 */

import { supabase } from '../services/supabase';

/**
 * Classe TurnHistoryRepository
 * Responsável pelas operações de histórico diário
 */
class TurnHistoryRepository {
  /**
   * Busca histórico diário por unidade e período
   * @param {string} unitId - UUID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Array>} Histórico filtrado
   */
  async getDailyHistoryByUnitAndPeriod(unitId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_daily_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('professional_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico diário:', error);
      throw new Error(`Erro ao buscar histórico diário: ${error.message}`);
    }
  }

  /**
   * Busca histórico diário de um profissional específico
   * @param {string} professionalId - UUID do profissional
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Array>} Histórico do profissional
   */
  async getDailyHistoryByProfessional(professionalId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_daily_history_complete')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico do profissional:', error);
      throw new Error(
        `Erro ao buscar histórico do profissional: ${error.message}`
      );
    }
  }

  /**
   * Busca histórico mensal agregado
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise<Array>} Histórico agregado por profissional
   */
  async getMonthlyAggregatedHistory(unitId, month, year) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('vw_turn_daily_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Agregar por profissional
      const aggregated = {};
      data.forEach(record => {
        const key = record.professional_id;
        if (!aggregated[key]) {
          aggregated[key] = {
            professional_id: record.professional_id,
            professional_name: record.professional_name,
            unit_name: record.unit_name,
            total_points: 0,
            days_worked: 0,
          };
        }
        aggregated[key].total_points += record.daily_points;
        if (record.daily_points > 0) {
          aggregated[key].days_worked += 1;
        }
      });

      return Object.values(aggregated).sort(
        (a, b) => b.total_points - a.total_points
      );
    } catch (error) {
      console.error('Erro ao buscar histórico mensal agregado:', error);
      throw new Error(
        `Erro ao buscar histórico mensal agregado: ${error.message}`
      );
    }
  }

  /**
   * Busca totais por profissional para um período
   * @param {string} unitId - UUID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Object>} Totais por profissional
   */
  async getTotalsByProfessional(unitId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('vw_turn_daily_history_complete')
        .select('*')
        .eq('unit_id', unitId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const totals = {};
      data.forEach(record => {
        const key = record.professional_id;
        if (!totals[key]) {
          totals[key] = {
            professional_id: record.professional_id,
            professional_name: record.professional_name,
            total: 0,
          };
        }
        totals[key].total += record.daily_points;
      });

      return totals;
    } catch (error) {
      console.error('Erro ao buscar totais por profissional:', error);
      throw new Error(
        `Erro ao buscar totais por profissional: ${error.message}`
      );
    }
  }
}

export const turnHistoryRepository = new TurnHistoryRepository();
