/**
 * RELATÓRIOS SERVICE
 *
 * Serviço responsável por orquestrar regras de negócio dos relatórios usando DTOs e repositories.
 * Segue os padrões Clean Architecture - Service Layer.
 */

/* eslint-disable no-console */
import {
  ComparativoUnidadesRequestDTO,
  PeriodFiltersDTO,
  RankingUnidadesRequestDTO,
  UnitsComparisonResponseDTO,
} from '../dtos/relatoriosDTO';
import relatoriosRepository from '../repositories/relatoriosRepository';
import { supabase } from './supabase';

/**
 * Utilitários para tratamento de erros
 */
const buildError = (message, code = null) => ({
  message,
  code,
  timestamp: new Date().toISOString(),
});

/**
 * Utilitários para formatação de valores
 */
const formatCurrency = value => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

/**
 * Classe principal do serviço de relatórios
 */
class RelatoriosService {
  /**
   * Gerar comparativo entre unidades
   */
  async getComparativoUnidades(filters = {}) {
    console.log(
      '🔍 [relatoriosService] getComparativoUnidades - filters:',
      filters
    );

    // Validar entrada com DTO
    const requestDTO = new ComparativoUnidadesRequestDTO(filters);

    if (!requestDTO.isValid()) {
      console.error(
        '❌ [relatoriosService] DTO inválido:',
        requestDTO.getErrorMessage()
      );
      return {
        data: null,
        error: buildError(requestDTO.getErrorMessage(), 'VALIDATION_ERROR'),
      };
    }

    try {
      console.log(
        '🔍 [relatoriosService] Chamando repository.getUnitsComparisonData...'
      );

      const params = requestDTO.toRepositoryParams();
      const { data, error } = await relatoriosRepository.getUnitsComparisonData(
        params.month,
        params.year
      );

      if (error) {
        console.error('❌ [relatoriosService] Erro do repository:', error);
        return { data: null, error };
      }

      // Processar dados com DTO de resposta
      const responseDTO = new UnitsComparisonResponseDTO(data);
      const processedData = responseDTO.toObject();

      console.log(
        '✅ [relatoriosService] getComparativoUnidades - sucesso:',
        processedData.summary
      );

      return {
        data: processedData,
        error: null,
        metadata: {
          period: requestDTO.period.getPeriodDisplayName(),
          filters: params,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(
        '❌ [relatoriosService] getComparativoUnidades - catch error:',
        error
      );
      return {
        data: null,
        error: buildError(
          `Falha ao gerar comparativo: ${error.message}`,
          'PROCESSING_ERROR'
        ),
      };
    }
  }

  /**
   * Gerar ranking de unidades
   */
  async getRankingUnidades(filters = {}) {
    console.log(
      '🔍 [relatoriosService] getRankingUnidades - filters:',
      filters
    );

    // Validar entrada com DTO
    const requestDTO = new RankingUnidadesRequestDTO(filters);

    if (!requestDTO.isValid()) {
      console.error(
        '❌ [relatoriosService] DTO inválido:',
        requestDTO.getErrorMessage()
      );
      return {
        data: null,
        error: buildError(requestDTO.getErrorMessage(), 'VALIDATION_ERROR'),
      };
    }

    try {
      const params = requestDTO.toRepositoryParams();
      const { data, error } = await relatoriosRepository.getUnitsRanking(
        params.metric,
        params.month,
        params.year,
        params.limit
      );

      if (error) {
        console.error('❌ [relatoriosService] Erro do repository:', error);
        return { data: null, error };
      }

      console.log(
        '✅ [relatoriosService] getRankingUnidades - sucesso:',
        data?.length || 0,
        'unidades'
      );

      return {
        data: {
          ranking: data || [],
          metric: requestDTO.getMetricDisplayName(),
          period: requestDTO.period.getPeriodDisplayName(),
        },
        error: null,
        metadata: {
          filters: params,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(
        '❌ [relatoriosService] getRankingUnidades - catch error:',
        error
      );
      return {
        data: null,
        error: buildError(
          `Falha ao gerar ranking: ${error.message}`,
          'PROCESSING_ERROR'
        ),
      };
    }
  }

  /**
   * Gerar dados para dashboard de unidade específica
   */
  async getUnitDashboard(unitId, filters = {}) {
    console.log(
      '🔍 [relatoriosService] getUnitDashboard - unitId:',
      unitId,
      'filters:',
      filters
    );

    try {
      // Validar período
      const periodDTO = new PeriodFiltersDTO(filters);
      if (!periodDTO.isValid()) {
        return {
          data: null,
          error: buildError(periodDTO.getErrorMessage(), 'VALIDATION_ERROR'),
        };
      }

      const params = periodDTO.toRepositoryParams();

      // Buscar dados específicos da unidade
      const [
        financialResult,
        attendanceResult,
        professionalsResult,
        dreResult,
      ] = await Promise.all([
        relatoriosRepository.getUnitFinancialStats(
          unitId,
          params.month,
          params.year
        ),
        relatoriosRepository.getUnitAttendanceStats(
          unitId,
          params.month,
          params.year
        ),
        relatoriosRepository.getUnitProfessionalsStats(unitId),
        relatoriosRepository.getUnitDREData(unitId, params.month, params.year),
      ]);

      // Verificar erros
      const errors = [
        financialResult.error,
        attendanceResult.error,
        professionalsResult.error,
        dreResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error(
          '❌ [relatoriosService] Erros ao buscar dados da unidade:',
          errors
        );
        return { data: null, error: errors[0] };
      }

      // Processar dados
      const financial = financialResult.data;
      const attendance = attendanceResult.data;
      const professionals = professionalsResult.data;
      const dre = dreResult.data;

      const totalRevenue = (financial?.revenues || []).reduce(
        (sum, revenue) => sum + (revenue.value || 0),
        0
      );

      const totalExpenses = (financial?.expenses || []).reduce(
        (sum, expense) => sum + (expense.value || 0),
        0
      );

      const profit = totalRevenue - totalExpenses;
      const attendanceCount = (attendance || []).length;
      const professionalsCount = (professionals || []).length;

      console.log('✅ [relatoriosService] getUnitDashboard - sucesso');

      return {
        data: {
          financial: {
            totalRevenue,
            totalExpenses,
            profit,
            profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
            formatted: {
              totalRevenue: formatCurrency(totalRevenue),
              totalExpenses: formatCurrency(totalExpenses),
              profit: formatCurrency(profit),
            },
          },
          operations: {
            attendanceCount,
            professionalsCount,
            averageTicket:
              attendanceCount > 0 ? totalRevenue / attendanceCount : 0,
            formatted: {
              averageTicket: formatCurrency(
                attendanceCount > 0 ? totalRevenue / attendanceCount : 0
              ),
            },
          },
          dre: dre || [],
          period: periodDTO.getPeriodDisplayName(),
        },
        error: null,
        metadata: {
          unitId,
          period: params,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(
        '❌ [relatoriosService] getUnitDashboard - catch error:',
        error
      );
      return {
        data: null,
        error: buildError(
          `Falha ao gerar dashboard: ${error.message}`,
          'PROCESSING_ERROR'
        ),
      };
    }
  }

  /**
   * Exportar dados para Excel
   */
  async exportToExcel(type, filters = {}) {
    console.log(
      '🔍 [relatoriosService] exportToExcel - type:',
      type,
      'filters:',
      filters
    );

    try {
      let data = null;
      let filename = '';

      switch (type) {
        case 'comparativo-unidades': {
          const comparativoResult = await this.getComparativoUnidades(filters);
          if (comparativoResult.error) return comparativoResult;

          data = comparativoResult.data.tableData;
          filename = `Comparativo_Unidades_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        case 'ranking-unidades': {
          const rankingResult = await this.getRankingUnidades(filters);
          if (rankingResult.error) return rankingResult;

          data = rankingResult.data.ranking.map(unit => ({
            posicao: unit.ranking?.position,
            unidade: unit.name,
            valor: unit.metrics[filters.metric] || 0,
            metrica: rankingResult.data.metric,
          }));
          filename = `Ranking_Unidades_${new Date().toISOString().split('T')[0]}`;
          break;
        }

        default:
          return {
            data: null,
            error: buildError(
              'Tipo de relatório não suportado para exportação',
              'EXPORT_ERROR'
            ),
          };
      }

      console.log(
        '✅ [relatoriosService] exportToExcel - dados preparados:',
        data?.length || 0,
        'registros'
      );

      return {
        data: {
          filename,
          data,
          type,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        '❌ [relatoriosService] exportToExcel - catch error:',
        error
      );
      return {
        data: null,
        error: buildError(
          `Falha ao exportar: ${error.message}`,
          'EXPORT_ERROR'
        ),
      };
    }
  }
}

/**
 * Instância singleton do serviço
 */
const relatoriosService = new RelatoriosService();

/**
 * Funções legadas mantidas para compatibilidade (serão depreciadas)
 */
export const getDREMensal = async (mes, ano, unidadeId = null) => {
  try {
    const { data, error } = await supabase
      .from('dre_mensal_view')
      .select('*')
      .eq('mes', mes)
      .eq('ano', ano)
      .modify(query => {
        if (unidadeId) query.eq('unidade_id', unidadeId);
      });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar DRE mensal:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar dados comparativos entre unidades
export const getComparativoUnidades = async (periodo, ano) => {
  try {
    let query = supabase
      .from('comparativo_unidades_view')
      .select('*')
      .eq('ano', ano);

    // Aplicar filtro de período específico se necessário
    if (periodo.tipo === 'mes') {
      query = query.eq('mes', periodo.mes);
    } else if (periodo.tipo === 'trimestre') {
      const mesesTrimestre = {
        1: [1, 2, 3],
        2: [4, 5, 6],
        3: [7, 8, 9],
        4: [10, 11, 12],
      };
      query = query.in('mes', mesesTrimestre[periodo.trimestre]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar comparativo de unidades:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar análise de receitas e despesas
export const getAnaliseReceitaDespesa = async (
  dataInicio,
  dataFim,
  unidadeId = null
) => {
  try {
    let query = supabase
      .from('receita_despesa_view')
      .select('*')
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar análise de receita/despesa:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar performance dos profissionais
export const getPerformanceProfissionais = async (
  mes,
  ano,
  unidadeId = null
) => {
  try {
    let query = supabase
      .from('performance_profissionais_view')
      .select('*')
      .eq('mes', mes)
      .eq('ano', ano);

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar performance de profissionais:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar análise de atendimentos
export const getAnaliseAtendimentos = async (
  dataInicio,
  dataFim,
  unidadeId = null
) => {
  try {
    let query = supabase
      .from('analise_atendimentos_view')
      .select('*')
      .gte('data_atendimento', dataInicio)
      .lte('data_atendimento', dataFim);

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar análise de atendimentos:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar lista de unidades para filtros
export const getUnidadesParaFiltro = async () => {
  try {
    const { data, error } = await supabase
      .from('unidades')
      .select('id, nome_fantasia, ativo')
      .eq('ativo', true)
      .order('nome_fantasia');

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para buscar lista de profissionais para filtros
export const getProfissionaisParaFiltro = async (unidadeId = null) => {
  try {
    let query = supabase
      .from('profissionais')
      .select('id, nome, unidade_id')
      .eq('ativo', true)
      .order('nome');

    if (unidadeId) {
      query = query.eq('unidade_id', unidadeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Função para exportar relatório em PDF
export const exportarRelatorioPDF = async (tipoRelatorio, dados, filtros) => {
  try {
    // Aqui será implementada a lógica de exportação para PDF
    // usando uma biblioteca como jsPDF ou react-pdf

    console.log('Exportando para PDF:', { tipoRelatorio, dados, filtros });

    // Placeholder - implementação futura
    return {
      success: true,
      message: 'Exportação para PDF será implementada',
    };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Função para exportar relatório em Excel
export const exportarRelatorioExcel = async (tipoRelatorio, dados, filtros) => {
  try {
    // Aqui será implementada a lógica de exportação para Excel
    // usando uma biblioteca como xlsx ou exceljs

    console.log('Exportando para Excel:', { tipoRelatorio, dados, filtros });

    // Placeholder - implementação futura
    return {
      success: true,
      message: 'Exportação para Excel será implementada',
    };
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Função para formatar valores monetários
export const formatarValor = valor => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
};

// Função para formatar percentuais
export const formatarPercentual = valor => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((valor || 0) / 100);
};

// Função para calcular período anterior para comparação
export const calcularPeriodoAnterior = periodo => {
  if (periodo.tipo === 'mes') {
    const mes = periodo.mes === 1 ? 12 : periodo.mes - 1;
    const ano = periodo.mes === 1 ? periodo.ano - 1 : periodo.ano;
    return { mes, ano };
  }

  if (periodo.tipo === 'trimestre') {
    const trimestre = periodo.trimestre === 1 ? 4 : periodo.trimestre - 1;
    const ano = periodo.trimestre === 1 ? periodo.ano - 1 : periodo.ano;
    return { trimestre, ano };
  }

  return { ano: periodo.ano - 1 };
};

export default {
  // Novo serviço refatorado
  relatoriosService,

  // Funções legadas mantidas para compatibilidade
  getDREMensal,
  getComparativoUnidades,
  getAnaliseReceitaDespesa,
  getPerformanceProfissionais,
  getAnaliseAtendimentos,
  getUnidadesParaFiltro,
  getProfissionaisParaFiltro,
  exportarRelatorioPDF,
  exportarRelatorioExcel,
  formatarValor,
  formatarPercentual,
  calcularPeriodoAnterior,

  // Métodos para views SQL otimizadas
  getKPIs,
  getComparativos,
  getRankingProfissionais,
  getTopPerformers,
  getCurrentPeriodSummary,
  getRevenueTrend,
};

// Export individual do novo serviço
export { relatoriosService };

// =========================================================================
// NOVOS MÉTODOS - Views SQL Otimizadas (2025-10-22)
// =========================================================================

/**
 * Busca KPIs consolidados da view vw_relatorios_kpis
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.unitId - ID da unidade (opcional)
 * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
 * @param {string} filters.endDate - Data final (YYYY-MM-DD)
 * @param {number} filters.limit - Limite de registros
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getKPIs(filters = {}) {
  try {
    let query = supabase
      .from('vw_relatorios_kpis')
      .select('*')
      .order('period', { ascending: false });

    if (filters.unitId && filters.unitId !== 'todas') {
      query = query.eq('unit_id', filters.unitId);
    }

    if (filters.startDate) {
      query = query.gte('period', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('period', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca comparativos de períodos da view vw_comparativo_periodos
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.unitId - ID da unidade (opcional)
 * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
 * @param {string} filters.endDate - Data final (YYYY-MM-DD)
 * @param {number} filters.limit - Limite de registros
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getComparativos(filters = {}) {
  try {
    let query = supabase
      .from('vw_comparativo_periodos')
      .select('*')
      .order('current_period', { ascending: false });

    if (filters.unitId && filters.unitId !== 'todas') {
      query = query.eq('unit_id', filters.unitId);
    }

    if (filters.startDate) {
      query = query.gte('current_period', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('current_period', filters.endDate);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca ranking de profissionais da view vw_ranking_profissionais
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.unitId - ID da unidade (opcional)
 * @param {string} filters.professionalId - ID do profissional (opcional)
 * @param {string} filters.period - Período específico (YYYY-MM-01)
 * @param {string} filters.startDate - Data inicial (YYYY-MM-DD)
 * @param {string} filters.endDate - Data final (YYYY-MM-DD)
 * @param {number} filters.limit - Limite de registros (padrão: 10)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getRankingProfissionais(filters = {}) {
  try {
    let query = supabase
      .from('vw_ranking_profissionais')
      .select('*')
      .order('rank_by_revenue', { ascending: true });

    if (filters.unitId && filters.unitId !== 'todas') {
      query = query.eq('unit_id', filters.unitId);
    }

    if (filters.professionalId && filters.professionalId !== 'todos') {
      query = query.eq('professional_id', filters.professionalId);
    }

    if (filters.period) {
      query = query.eq('period', filters.period);
    } else {
      if (filters.startDate) {
        query = query.gte('period', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('period', filters.endDate);
      }
    }

    const limit = filters.limit || 10;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca top performers (profissionais top 10%)
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.unitId - ID da unidade (obrigatório)
 * @param {string} filters.period - Período específico (YYYY-MM-01)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getTopPerformers(filters = {}) {
  try {
    let query = supabase
      .from('vw_ranking_profissionais')
      .select('*')
      .in('performance_badge', ['top_10', 'top_20'])
      .order('rank_by_revenue', { ascending: true });

    if (filters.unitId && filters.unitId !== 'todas') {
      query = query.eq('unit_id', filters.unitId);
    }

    if (filters.period) {
      query = query.eq('period', filters.period);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca resumo de KPIs do período atual
 * @param {string} unitId - ID da unidade
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getCurrentPeriodSummary(unitId) {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7) + '-01';

    const { data, error } = await supabase
      .from('vw_relatorios_kpis')
      .select('*')
      .eq('unit_id', unitId)
      .eq('period', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignora "not found"

    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca tendência de receita dos últimos N meses
 * @param {string} unitId - ID da unidade
 * @param {number} months - Quantidade de meses (padrão: 6)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getRevenueTrend(unitId, months = 6) {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString().substring(0, 10);

    const { data, error } = await supabase
      .from('vw_relatorios_kpis')
      .select('period, period_formatted, total_revenue, revenue_growth_percent')
      .eq('unit_id', unitId)
      .gte('period', startDateStr)
      .order('period', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}
