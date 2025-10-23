/**
 * UNITS SERVICE
 * Serviço para gerenciamento de unidades
 *
 * Funcionalidades:
 * - CRUD completo de unidades
 * - Estatísticas por unidade
 * - Comparativos entre unidades
 * - Gestão de status (ativa/inativa)
 */

import { supabase } from './supabase';

class UnitsService {
  /**
   * Listar todas as unidades
   * @param {boolean} incluirInativas - Se deve incluir unidades inativas
   * @returns {Promise<Array>} Lista de unidades
   */
  async getUnits(incluirInativas = false) {
    try {
      let query = supabase
        .from('units')
        .select('*')
        .order('name', { ascending: true });

      if (!incluirInativas) {
        query = query.eq('status', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ unitsService.getUnits - Erro:', error);
        throw error;
      }

      console.log(
        '✅ unitsService.getUnits - Sucesso:',
        data?.length || 0,
        'unidades'
      );
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      throw new Error('Falha ao carregar unidades: ' + error.message);
    }
  }

  /**
   * Buscar unidade por ID
   * @param {string} id - ID da unidade
   * @returns {Promise<Object>} Dados da unidade
   */
  async getUnitById(id) {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar unidade:', error);
      throw new Error('Unidade não encontrada: ' + error.message);
    }
  }

  /**
   * Criar nova unidade
   * @param {Object} unitData - Dados da unidade
   * @returns {Promise<Object>} Unidade criada
   */
  async createUnit(unitData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const newUnit = {
        name: unitData.name,
        status: unitData.status !== false, // Default true se não especificado
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('units')
        .insert([newUnit])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      throw new Error('Falha ao criar unidade: ' + error.message);
    }
  }

  /**
   * Atualizar unidade existente
   * @param {string} id - ID da unidade
   * @param {Object} updateData - Dados para atualizar
   * @returns {Promise<Object>} Unidade atualizada
   */
  async updateUnit(id, updateData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const updatePayload = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('units')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      throw new Error('Falha ao atualizar unidade: ' + error.message);
    }
  }

  /**
   * Alternar status da unidade (ativa/inativa)
   * @param {string} id - ID da unidade
   * @returns {Promise<Object>} Unidade com status atualizado
   */
  async toggleUnitStatus(id) {
    try {
      // Buscar status atual
      const currentUnit = await this.getUnitById(id);
      const newStatus = !currentUnit.status;

      return await this.updateUnit(id, { status: newStatus });
    } catch (error) {
      console.error('Erro ao alterar status da unidade:', error);
      throw new Error('Falha ao alterar status: ' + error.message);
    }
  }

  /**
   * Deletar unidade (soft delete)
   * @param {string} id - ID da unidade
   * @returns {Promise<boolean>} Sucesso da operação
   */
  async deleteUnit(id) {
    try {
      // Verificar se há dados vinculados
      const dependentData = await this.checkUnitDependencies(id);

      if (dependentData.hasDependencies) {
        throw new Error(
          `Unidade possui dados vinculados: ${dependentData.dependencies.join(', ')}`
        );
      }

      // Soft delete - marcar como inativa
      await this.updateUnit(id, {
        status: false,
        name: `[EXCLUÍDA] ${dependentData.unitName}`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      throw new Error('Falha ao excluir unidade: ' + error.message);
    }
  }

  /**
   * Verificar dependências da unidade
   * @param {string} unitId - ID da unidade
   * @returns {Promise<Object>} Informações sobre dependências
   */
  async checkUnitDependencies(unitId) {
    try {
      const dependencies = [];

      // Verificar profissionais
      const { data: professionals } = await supabase
        .from('professionals')
        .select('id')
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (professionals && professionals.length > 0) {
        dependencies.push(`${professionals.length} profissionais ativos`);
      }

      // Verificar receitas
      const { data: revenues } = await supabase
        .from('revenues')
        .select('id')
        .eq('unit_id', unitId)
        .limit(1);

      if (revenues && revenues.length > 0) {
        dependencies.push('registros financeiros');
      }

      // Verificar despesas
      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('unit_id', unitId)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .limit(1);

      if (expenses && expenses.length > 0) {
        dependencies.push('registros de despesas');
      }

      // Buscar nome da unidade
      const unit = await this.getUnitById(unitId);

      return {
        hasDependencies: dependencies.length > 0,
        dependencies,
        unitName: unit.name,
      };
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      return { hasDependencies: false, dependencies: [], unitName: 'Unidade' };
    }
  }

  /**
   * Obter estatísticas da unidade
   * @param {string} unitId - ID da unidade
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Object>} Estatísticas da unidade
   */
  async getUnitStats(unitId, mes = null, ano = null) {
    try {
      const currentDate = new Date();
      const targetMonth = mes || currentDate.getMonth() + 1;
      const targetYear = ano || currentDate.getFullYear();

      // Profissionais ativos na unidade
      const { data: professionalsData } = await supabase
        .from('professionals')
        .select('id, name, role')
        .eq('unit_id', unitId)
        .eq('is_active', true);

      const professionalsCount = professionalsData
        ? professionalsData.length
        : 0;

      // Faturamento do mês
      const { data: revenuesData } = await supabase
        .from('revenues')
        .select('value')
        .eq('unit_id', unitId)
        .gte('date', `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`)
        .lt(
          'date',
          `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
        );

      const monthlyRevenue =
        revenuesData?.reduce(
          (sum, rev) => sum + (parseFloat(rev.value) || 0),
          0
        ) || 0;

      // Despesas do mês
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('value')
        .eq('unit_id', unitId)
        .eq('is_active', true) // ✅ FIX: Filtrar apenas despesas ativas
        .gte('date', `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`)
        .lt(
          'date',
          `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
        );

      const monthlyExpenses =
        expensesData?.reduce(
          (sum, exp) => sum + (parseFloat(exp.value) || 0),
          0
        ) || 0;

      // Atendimentos do mês (via histórico_atendimentos)
      const { data: attendancesData } = await supabase
        .from('historico_atendimentos')
        .select('valor_servico, duracao_minutos')
        .eq('unidade_id', unitId)
        .eq('status', 'concluido')
        .gte(
          'data_atendimento',
          `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`
        )
        .lt(
          'data_atendimento',
          `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-01`
        );

      const attendancesCount = attendancesData ? attendancesData.length : 0;
      const attendancesRevenue =
        attendancesData?.reduce(
          (sum, att) => sum + (parseFloat(att.valor_servico) || 0),
          0
        ) || 0;
      const averageDuration =
        attendancesData?.length > 0
          ? attendancesData.reduce(
              (sum, att) => sum + (parseFloat(att.duracao_minutos) || 0),
              0
            ) / attendancesData.length
          : 0;

      // Ticket médio
      const averageTicket =
        attendancesCount > 0 ? attendancesRevenue / attendancesCount : 0;

      // Lucro
      const profit = monthlyRevenue - monthlyExpenses;

      return {
        unitId,
        month: targetMonth,
        year: targetYear,
        professionals: {
          total: professionalsCount,
          list: professionalsData || [],
        },
        financial: {
          monthlyRevenue,
          monthlyExpenses,
          profit,
          profitMargin:
            monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0,
        },
        attendances: {
          count: attendancesCount,
          revenue: attendancesRevenue,
          averageTicket,
          averageDuration,
        },
        performance: {
          revenuePerProfessional:
            professionalsCount > 0 ? monthlyRevenue / professionalsCount : 0,
          attendancesPerProfessional:
            professionalsCount > 0 ? attendancesCount / professionalsCount : 0,
        },
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas da unidade:', error);
      throw new Error('Falha ao calcular estatísticas: ' + error.message);
    }
  }

  /**
   * Obter comparativo entre unidades
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Array>} Comparativo entre unidades
   */
  async getUnitsComparison(mes = null, ano = null) {
    try {
      const units = await this.getUnits();
      const comparisons = [];

      for (const unit of units) {
        const stats = await this.getUnitStats(unit.id, mes, ano);
        comparisons.push({
          ...unit,
          stats,
        });
      }

      // Ordenar por faturamento (maior para menor)
      comparisons.sort(
        (a, b) =>
          b.stats.financial.monthlyRevenue - a.stats.financial.monthlyRevenue
      );

      return comparisons;
    } catch (error) {
      console.error('Erro ao gerar comparativo:', error);
      throw new Error('Falha ao gerar comparativo: ' + error.message);
    }
  }

  /**
   * Obter ranking de unidades por performance
   * @param {string} metric - Métrica para ranking (revenue, profit, attendances)
   * @param {number} mes - Mês (1-12)
   * @param {number} ano - Ano
   * @returns {Promise<Array>} Ranking de unidades
   */
  async getUnitsRanking(metric = 'revenue', mes = null, ano = null) {
    try {
      const comparison = await this.getUnitsComparison(mes, ano);

      let sortedUnits = [...comparison];

      switch (metric) {
        case 'profit':
          sortedUnits.sort(
            (a, b) => b.stats.financial.profit - a.stats.financial.profit
          );
          break;
        case 'attendances':
          sortedUnits.sort(
            (a, b) => b.stats.attendances.count - a.stats.attendances.count
          );
          break;
        case 'efficiency':
          sortedUnits.sort(
            (a, b) =>
              b.stats.performance.revenuePerProfessional -
              a.stats.performance.revenuePerProfessional
          );
          break;
        case 'revenue':
        default:
          // Já ordenado por receita no getUnitsComparison
          break;
      }

      return sortedUnits.map((unit, index) => ({
        ...unit,
        ranking: {
          position: index + 1,
          metric,
          value: this.getRankingValue(unit.stats, metric),
        },
      }));
    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
      throw new Error('Falha ao gerar ranking: ' + error.message);
    }
  }

  /**
   * Obter valor da métrica para ranking
   * @param {Object} stats - Estatísticas da unidade
   * @param {string} metric - Métrica desejada
   * @returns {number} Valor da métrica
   */
  getRankingValue(stats, metric) {
    switch (metric) {
      case 'profit':
        return stats.financial.profit;
      case 'attendances':
        return stats.attendances.count;
      case 'efficiency':
        return stats.performance.revenuePerProfessional;
      case 'revenue':
      default:
        return stats.financial.monthlyRevenue;
    }
  }

  /**
   * Obter evolução mensal da unidade (últimos 6 meses)
   * @param {string} unitId - ID da unidade
   * @returns {Promise<Array>} Dados de evolução
   */
  async getUnitEvolution(unitId) {
    try {
      const evolution = [];
      const currentDate = new Date();

      // Buscar dados dos últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const stats = await this.getUnitStats(unitId, month, year);

        evolution.push({
          month: `${String(month).padStart(2, '0')}/${year}`,
          monthNumber: month,
          year: year,
          ...stats,
        });
      }

      return evolution;
    } catch (error) {
      console.error('Erro ao buscar evolução da unidade:', error);
      throw new Error('Falha ao buscar evolução: ' + error.message);
    }
  }
}

// Instância singleton do serviço
const unitsService = new UnitsService();

export default unitsService;
