// Serviços para Relatórios e Análises
/* eslint-disable no-console */
import { supabase } from './supabase';

// Função para buscar dados do DRE mensal
export const getDREMensal = async (mes, ano, unidadeId = null) => {
  try {
    const { data, error } = await supabase
      .from('dre_mensal_view')
      .select('*')
      .eq('mes', mes)
      .eq('ano', ano)
      .modify((query) => {
        if (unidadeId) query.eq('unidade_id', unidadeId);
      });

    if (error) throw error;
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar DRE mensal:', error);
    return {
      success: false,
      error: error.message,
      data: []
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
        4: [10, 11, 12]
      };
      query = query.in('mes', mesesTrimestre[periodo.trimestre]);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar comparativo de unidades:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Função para buscar análise de receitas e despesas
export const getAnaliseReceitaDespesa = async (dataInicio, dataFim, unidadeId = null) => {
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
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar análise de receita/despesa:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Função para buscar performance dos profissionais
export const getPerformanceProfissionais = async (mes, ano, unidadeId = null) => {
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
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar performance de profissionais:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Função para buscar análise de atendimentos
export const getAnaliseAtendimentos = async (dataInicio, dataFim, unidadeId = null) => {
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
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar análise de atendimentos:', error);
    return {
      success: false,
      error: error.message,
      data: []
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
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return {
      success: false,
      error: error.message,
      data: []
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
      data: data || []
    };
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return {
      success: false,
      error: error.message,
      data: []
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
      message: 'Exportação para PDF será implementada'
    };
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return {
      success: false,
      error: error.message
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
      message: 'Exportação para Excel será implementada'
    };
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Função para formatar valores monetários
export const formatarValor = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

// Função para formatar percentuais
export const formatarPercentual = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((valor || 0) / 100);
};

// Função para calcular período anterior para comparação
export const calcularPeriodoAnterior = (periodo) => {
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
  calcularPeriodoAnterior
};