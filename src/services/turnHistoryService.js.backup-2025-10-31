/**
 * @file turnHistoryService.js
 * @description Service para lógica de negócio do histórico da Lista da Vez
 * @module services/turnHistoryService
 */

import { turnHistoryRepository } from '../repositories/turnHistoryRepository';

/**
 * Classe TurnHistoryService
 * Responsável pela lógica de negócio do histórico
 */
class TurnHistoryService {
  /**
   * Busca histórico diário para tabela
   * @param {string} unitId - UUID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Object>} Dados formatados para tabela
   */
  async getDailyTableData(unitId, startDate, endDate) {
    try {
      const history =
        await turnHistoryRepository.getDailyHistoryByUnitAndPeriod(
          unitId,
          startDate,
          endDate
        );

      // Obter lista única de profissionais e ordenar conforme sequência específica
      const professionalsSet = [
        ...new Set(history.map(h => h.professional_name)),
      ];

      // Ordem específica solicitada: Vinicius, Renato, João, Oton, Lucas
      const orderSequence = [
        'VINICIUS EDUARDO',
        'RENATO',
        'JOÃO VICTOR',
        'OTON RODRIGUES',
        'LUCAS PROCOPIO',
      ];

      // Ordenar profissionais conforme a sequência, novos aparecem no final
      const professionals = professionalsSet.sort((a, b) => {
        const indexA = orderSequence.findIndex(
          name =>
            a.toUpperCase().includes(name.split(' ')[0]) &&
            a.toUpperCase().includes(name.split(' ')[1] || '')
        );
        const indexB = orderSequence.findIndex(
          name =>
            b.toUpperCase().includes(name.split(' ')[0]) &&
            b.toUpperCase().includes(name.split(' ')[1] || '')
        );

        // Se ambos estão na sequência, ordenar pela sequência
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Se apenas A está na sequência, A vem primeiro
        if (indexA !== -1) return -1;

        // Se apenas B está na sequência, B vem primeiro
        if (indexB !== -1) return 1;

        // Se nenhum está na sequência, ordenar alfabeticamente
        return a.localeCompare(b);
      });

      // Obter lista única de datas
      const dates = [...new Set(history.map(h => h.date))].sort(
        (a, b) => new Date(b) - new Date(a)
      );

      // Criar estrutura de dados para tabela
      const tableData = dates.map(date => {
        const row = { date };
        let total = 0;

        professionals.forEach(profName => {
          const record = history.find(
            h => h.date === date && h.professional_name === profName
          );
          row[profName] = record ? record.daily_points : 0;
          total += row[profName];
        });

        row.total = total;
        return row;
      });

      // Calcular totais por profissional
      const totals = { date: 'Total' };
      professionals.forEach(profName => {
        totals[profName] = history
          .filter(h => h.professional_name === profName)
          .reduce((sum, h) => sum + h.daily_points, 0);
      });
      totals.total = Object.keys(totals)
        .filter(k => k !== 'date' && k !== 'total')
        .reduce((sum, k) => sum + totals[k], 0);

      return {
        tableData,
        professionals,
        totals,
        dates,
      };
    } catch (error) {
      console.error('Erro ao buscar dados da tabela:', error);
      return {
        error: error.message,
        tableData: [],
        professionals: [],
        totals: {},
        dates: [],
      };
    }
  }

  /**
   * Busca histórico para um profissional específico
   * @param {string} professionalId - UUID do profissional
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<Object>} Histórico do profissional
   */
  async getProfessionalHistory(professionalId, startDate, endDate) {
    try {
      const data = await turnHistoryRepository.getDailyHistoryByProfessional(
        professionalId,
        startDate,
        endDate
      );

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico do profissional:', error);
      return { data: [], error: error.message };
    }
  }

  /**
   * Busca histórico mensal agregado
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise<Object>} Histórico agregado
   */
  async getMonthlyAggregated(unitId, month, year) {
    try {
      const data = await turnHistoryRepository.getMonthlyAggregatedHistory(
        unitId,
        month,
        year
      );

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao buscar histórico mensal:', error);
      return { data: [], error: error.message };
    }
  }
}

export const turnHistoryService = new TurnHistoryService();
