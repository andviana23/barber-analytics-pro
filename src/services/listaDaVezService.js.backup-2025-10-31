/**
 * @file listaDaVezService.js
 * @description Service para lógica de negócio do módulo Lista da Vez
 * @module services/listaDaVezService
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Service responsável pela lógica de negócio do módulo Lista da Vez,
 * incluindo validações, transformações de dados e orquestração
 * das operações do Repository.
 */

import { listaDaVezRepository } from '../repositories/listaDaVezRepository';

/**
 * Classe ListaDaVezService
 * Responsável pela lógica de negócio do módulo
 */
class ListaDaVezService {
  /**
   * Busca a lista da vez para uma unidade específica
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getTurnList(unitId) {
    try {
      // Validação de parâmetros
      if (!unitId) {
        return {
          data: null,
          error: new Error('ID da unidade é obrigatório'),
        };
      }

      // Verificar se a lista existe, se não existir, inicializar
      const exists = await listaDaVezRepository.checkTurnListExists(unitId);
      if (!exists) {
        console.log('Lista da vez não existe, inicializando...');
        await listaDaVezRepository.initializeTurnList(unitId);
      }

      // Buscar lista atual
      const data = await listaDaVezRepository.getTurnListByUnit(unitId);

      return { data, error: null };
    } catch (error) {
      console.error('Erro no service getTurnList:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Busca lista da vez para todas as unidades
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getAllTurnLists() {
    try {
      const data = await listaDaVezRepository.getAllTurnLists();

      // Agrupar por unidade
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.unit_id]) {
          acc[item.unit_id] = {
            unitId: item.unit_id,
            unitName: item.unit_name,
            barbers: [],
          };
        }
        acc[item.unit_id].barbers.push(item);
        return acc;
      }, {});

      return { data: Object.values(groupedData), error: null };
    } catch (error) {
      console.error('Erro no service getAllTurnLists:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Adiciona um ponto a um barbeiro
   * @param {string} unitId - UUID da unidade
   * @param {string} professionalId - UUID do profissional
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async addPoint(unitId, professionalId) {
    try {
      // Validação de parâmetros
      if (!unitId || !professionalId) {
        return {
          data: null,
          error: new Error(
            'ID da unidade e ID do profissional são obrigatórios'
          ),
        };
      }

      // Adicionar ponto via função SQL
      const result = await listaDaVezRepository.addPointToBarber(
        unitId,
        professionalId
      );

      if (!result.success) {
        return {
          data: null,
          error: new Error(result.error || 'Erro ao adicionar ponto'),
        };
      }

      // Buscar lista atualizada
      const updatedList = await listaDaVezRepository.getTurnListByUnit(unitId);

      return {
        data: {
          ...result,
          updatedList,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro no service addPoint:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Inicializa a lista da vez para uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async initializeTurnList(unitId) {
    try {
      // Validação de parâmetros
      if (!unitId) {
        return {
          data: null,
          error: new Error('ID da unidade é obrigatório'),
        };
      }

      // Verificar se existem barbeiros ativos
      const activeBarbers =
        await listaDaVezRepository.getActiveBarbersByUnit(unitId);
      if (activeBarbers.length === 0) {
        return {
          data: null,
          error: new Error('Nenhum barbeiro ativo encontrado nesta unidade'),
        };
      }

      // Inicializar lista
      const result = await listaDaVezRepository.initializeTurnList(unitId);

      if (!result.success) {
        return {
          data: null,
          error: new Error(result.message || 'Erro ao inicializar lista'),
        };
      }

      // Buscar lista inicializada
      const turnList = await listaDaVezRepository.getTurnListByUnit(unitId);

      return {
        data: {
          ...result,
          turnList,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro no service initializeTurnList:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Busca histórico mensal
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getMonthlyHistory(unitId, month, year) {
    try {
      // Validação de parâmetros
      if (!unitId || !month || !year) {
        return {
          data: null,
          error: new Error('ID da unidade, mês e ano são obrigatórios'),
        };
      }

      if (month < 1 || month > 12) {
        return {
          data: null,
          error: new Error('Mês deve estar entre 1 e 12'),
        };
      }

      if (year < 2020 || year > new Date().getFullYear() + 1) {
        return {
          data: null,
          error: new Error('Ano inválido'),
        };
      }

      const data = await listaDaVezRepository.getMonthlyHistory(
        unitId,
        month,
        year
      );

      return { data, error: null };
    } catch (error) {
      console.error('Erro no service getMonthlyHistory:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Busca histórico completo de uma unidade
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getUnitHistory(unitId) {
    try {
      if (!unitId) {
        return {
          data: null,
          error: new Error('ID da unidade é obrigatório'),
        };
      }

      const data = await listaDaVezRepository.getUnitHistory(unitId);

      // Agrupar por mês/ano
      const groupedData = data.reduce((acc, item) => {
        const key = `${item.year}-${item.month}`;
        if (!acc[key]) {
          acc[key] = {
            year: item.year,
            month: item.month,
            unitName: item.unit_name,
            barbers: [],
          };
        }
        acc[key].barbers.push(item);
        return acc;
      }, {});

      return { data: Object.values(groupedData), error: null };
    } catch (error) {
      console.error('Erro no service getUnitHistory:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Busca meses disponíveis para histórico
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getAvailableHistoryMonths() {
    try {
      const data = await listaDaVezRepository.getAvailableHistoryMonths();

      return { data, error: null };
    } catch (error) {
      console.error('Erro no service getAvailableHistoryMonths:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Executa reset mensal manual
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async executeMonthlyReset() {
    try {
      const result = await listaDaVezRepository.executeMonthlyReset();

      if (!result.success) {
        return {
          data: null,
          error: new Error(result.message || 'Erro ao executar reset mensal'),
        };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Erro no service executeMonthlyReset:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Busca estatísticas da lista da vez
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getTurnListStats(unitId) {
    try {
      if (!unitId) {
        return {
          data: null,
          error: new Error('ID da unidade é obrigatório'),
        };
      }

      const data = await listaDaVezRepository.getTurnListStats(unitId);

      return { data, error: null };
    } catch (error) {
      console.error('Erro no service getTurnListStats:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Gera relatório mensal
   * @param {string} unitId - UUID da unidade
   * @param {number} month - Mês
   * @param {number} year - Ano
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async generateMonthlyReport(unitId, month, year) {
    try {
      if (!unitId || !month || !year) {
        return {
          data: null,
          error: new Error('ID da unidade, mês e ano são obrigatórios'),
        };
      }

      const data = await listaDaVezRepository.getMonthlyReport(
        unitId,
        month,
        year
      );

      return { data, error: null };
    } catch (error) {
      console.error('Erro no service generateMonthlyReport:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Exporta dados para CSV
   * @param {Array} data - Dados para exportar
   * @param {string} filename - Nome do arquivo
   * @returns {Promise<{data: string|null, error: Error|null}>}
   */
  async exportToCSV(data, filename = 'lista_da_vez.csv') {
    try {
      if (!data || data.length === 0) {
        return {
          data: null,
          error: new Error('Nenhum dado para exportar'),
        };
      }

      // Cabeçalho do CSV
      const headers = [
        'Nome do Barbeiro',
        'Unidade',
        'Pontos',
        'Posição',
        'Última Atualização',
      ];

      // Converter dados para CSV
      const csvContent = [
        headers.join(','),
        ...data.map(item =>
          [
            `"${item.professional_name}"`,
            `"${item.unit_name}"`,
            item.points,
            item.position,
            `"${new Date(item.last_updated).toLocaleString('pt-BR')}"`,
          ].join(',')
        ),
      ].join('\n');

      // Criar blob e URL para download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Criar link para download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { data: 'CSV exportado com sucesso', error: null };
    } catch (error) {
      console.error('Erro no service exportToCSV:', error);
      return {
        data: null,
        error:
          error instanceof Error ? error : new Error('Erro ao exportar CSV'),
      };
    }
  }

  /**
   * Formata dados para exibição
   * @param {Array} turnList - Lista da vez
   * @returns {Array} Dados formatados
   */
  formatTurnListForDisplay(turnList) {
    if (!turnList || !Array.isArray(turnList)) {
      return [];
    }

    return turnList.map((item, index) => ({
      ...item,
      displayPosition: index + 1,
      formattedLastUpdated: new Date(item.last_updated).toLocaleString('pt-BR'),
      pointsDisplay: `${item.points} ponto${item.points !== 1 ? 's' : ''}`,
    }));
  }

  /**
   * Calcula estatísticas de performance
   * @param {Array} turnList - Lista da vez
   * @returns {Object} Estatísticas calculadas
   */
  calculatePerformanceStats(turnList) {
    if (!turnList || !Array.isArray(turnList)) {
      return {
        totalBarbers: 0,
        totalPoints: 0,
        averagePoints: 0,
        barbersWithPoints: 0,
        lastUpdated: null,
      };
    }

    const totalPoints = turnList.reduce((sum, item) => sum + item.points, 0);
    const barbersWithPoints = turnList.filter(item => item.points > 0).length;
    const lastUpdated =
      turnList.length > 0
        ? Math.max(
            ...turnList.map(item => new Date(item.last_updated).getTime())
          )
        : null;

    return {
      totalBarbers: turnList.length,
      totalPoints,
      averagePoints: turnList.length > 0 ? totalPoints / turnList.length : 0,
      barbersWithPoints,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : null,
    };
  }
}

// Exportar instância única (Singleton)
export const listaDaVezService = new ListaDaVezService();
export default listaDaVezService;
