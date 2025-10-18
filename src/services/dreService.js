/**
 * @file dreService.js
 * @description Serviço para cálculo e gestão do DRE (Demonstração do Resultado do Exercício)
 * @module services/dreService
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Este serviço implementa a camada de aplicação para o DRE, consumindo a função
 * SQL fn_calculate_dre() e aplicando regras de negócio adicionais.
 *
 * Segue os princípios de Clean Architecture e separa claramente a lógica de negócio
 * da infraestrutura (Supabase).
 */

import { supabase } from './supabase';

/**
 * Classe DREService
 * Responsável pela geração e manipulação do DRE
 */
class DREService {
  /**
   * Calcula o DRE para uma unidade em um período específico
   *
   * @param {Object} params - Parâmetros para cálculo do DRE
   * @param {string} params.unitId - UUID da unidade
   * @param {string} params.startDate - Data inicial (YYYY-MM-DD)
   * @param {string} params.endDate - Data final (YYYY-MM-DD)
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   *
   * @example
   * const { data, error } = await dreService.calculateDRE({
   *   unitId: 'uuid-da-unidade',
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   */
  async calculateDRE({ unitId, startDate, endDate }) {
    try {
      // Validação de parâmetros
      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: new Error(
            'Parâmetros obrigatórios: unitId, startDate, endDate'
          ),
        };
      }

      // Validação de datas
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          data: null,
          error: new Error('Datas inválidas. Use o formato YYYY-MM-DD'),
        };
      }

      if (start > end) {
        return {
          data: null,
          error: new Error('Data inicial não pode ser maior que data final'),
        };
      }

      // Chamar a função SQL via RPC
      const { data, error } = await supabase.rpc('fn_calculate_dre', {
        p_unit_id: unitId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('Erro ao calcular DRE:', error);
        return { data: null, error };
      }

      // Enriquecer dados com informações adicionais
      const enrichedData = this._enrichDREData(data);

      return { data: enrichedData, error: null };
    } catch (error) {
      console.error('Erro inesperado ao calcular DRE:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Calcula o DRE para o mês atual
   *
   * @param {string} unitId - UUID da unidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async calculateCurrentMonthDRE(unitId) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    return this.calculateDRE({ unitId, startDate, endDate });
  }

  /**
   * Calcula o DRE para um mês específico
   *
   * @param {string} unitId - UUID da unidade
   * @param {number} year - Ano (ex: 2024)
   * @param {number} month - Mês (1-12)
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async calculateMonthDRE(unitId, year, month) {
    // Validação
    if (month < 1 || month > 12) {
      return {
        data: null,
        error: new Error('Mês deve estar entre 1 e 12'),
      };
    }

    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    return this.calculateDRE({ unitId, startDate, endDate });
  }

  /**
   * Calcula o DRE acumulado do ano
   *
   * @param {string} unitId - UUID da unidade
   * @param {number} year - Ano (ex: 2024)
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async calculateYearDRE(unitId, year) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    return this.calculateDRE({ unitId, startDate, endDate });
  }

  /**
   * Compara DREs de dois períodos
   *
   * @param {Object} params
   * @param {string} params.unitId - UUID da unidade
   * @param {string} params.period1Start - Início período 1
   * @param {string} params.period1End - Fim período 1
   * @param {string} params.period2Start - Início período 2
   * @param {string} params.period2End - Fim período 2
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async compareDRE({
    unitId,
    period1Start,
    period1End,
    period2Start,
    period2End,
  }) {
    try {
      // Calcular DRE dos dois períodos em paralelo
      const [result1, result2] = await Promise.all([
        this.calculateDRE({
          unitId,
          startDate: period1Start,
          endDate: period1End,
        }),
        this.calculateDRE({
          unitId,
          startDate: period2Start,
          endDate: period2End,
        }),
      ]);

      if (result1.error || result2.error) {
        return {
          data: null,
          error: result1.error || result2.error,
        };
      }

      // Calcular variações
      const comparison = this._calculateComparison(result1.data, result2.data);

      return {
        data: {
          period1: result1.data,
          period2: result2.data,
          comparison,
        },
        error: null,
      };
    } catch (error) {
      console.error('Erro ao comparar DREs:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erro desconhecido'),
      };
    }
  }

  /**
   * Exporta o DRE em formato de texto legível
   *
   * @param {Object} dreData - Dados do DRE
   * @returns {string} - DRE formatado como texto
   */
  exportAsText(dreData) {
    if (!dreData) return '';

    const formatCurrency = value => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value || 0);
    };

    const formatPercent = value => {
      return `${(value || 0).toFixed(2)}%`;
    };

    let text = '';
    text += '═══════════════════════════════════════════════════════════\n';
    text += '         DRE - DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO      \n';
    text += '                    TRATO DE BARBADOS                      \n';
    text += '═══════════════════════════════════════════════════════════\n';
    text += `Período: ${dreData.periodo.inicio} a ${dreData.periodo.fim}\n`;
    text += '═══════════════════════════════════════════════════════════\n\n';

    text += 'RECEITA BRUTA\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `(+) Receita de Serviço\n`;
    text += `    Assinatura ...................... ${formatCurrency(dreData.receita_bruta.receita_servico.assinatura)}\n`;
    text += `    Avulso .......................... ${formatCurrency(dreData.receita_bruta.receita_servico.avulso)}\n`;
    text += `    Total Serviço ................... ${formatCurrency(dreData.receita_bruta.receita_servico.total)}\n\n`;

    text += `(+) Receita de Produto\n`;
    text += `    Cosméticos ...................... ${formatCurrency(dreData.receita_bruta.receita_produtos.cosmeticos)}\n`;
    text += `    Total Produtos .................. ${formatCurrency(dreData.receita_bruta.receita_produtos.total)}\n\n`;

    text += `= RECEITA BRUTA ..................... ${formatCurrency(dreData.receita_bruta.total)}\n`;
    text += '═══════════════════════════════════════════════════════════\n\n';

    text += '(-) CUSTOS OPERACIONAIS\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `    Bebidas e cortesias ............. ${formatCurrency(dreData.custos_operacionais.bebidas_cortesias)}\n`;
    text += `    Bonificações e metas ............ ${formatCurrency(dreData.custos_operacionais.bonificacoes_metas)}\n`;
    text += `    Comissões ....................... ${formatCurrency(dreData.custos_operacionais.comissoes)}\n`;
    text += `    Limpeza e lavanderia ............ ${formatCurrency(dreData.custos_operacionais.limpeza_lavanderia)}\n`;
    text += `    Produtos de uso interno ......... ${formatCurrency(dreData.custos_operacionais.produtos_uso_interno)}\n`;
    text += `    Total Custos Operacionais ....... (${formatCurrency(dreData.custos_operacionais.total)})\n\n`;

    text += `= MARGEM DE CONTRIBUIÇÃO ............ ${formatCurrency(dreData.margem_contribuicao)}\n`;
    text += `  (${formatPercent(dreData.indicadores.margem_contribuicao_percentual)} da Receita Bruta)\n`;
    text += '═══════════════════════════════════════════════════════════\n\n';

    text += '(-) DESPESAS ADMINISTRATIVAS\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `    Aluguel e condomínio ............ ${formatCurrency(dreData.despesas_administrativas.aluguel_condominio)}\n`;
    text += `    Contabilidade ................... ${formatCurrency(dreData.despesas_administrativas.contabilidade)}\n`;
    text += `    Contas fixas .................... ${formatCurrency(dreData.despesas_administrativas.contas_fixas)}\n`;
    text += `    Encargos e benefícios ........... ${formatCurrency(dreData.despesas_administrativas.encargos_beneficios)}\n`;
    text += `    Manutenção e Seguros ............ ${formatCurrency(dreData.despesas_administrativas.manutencao_seguros)}\n`;
    text += `    Marketing e Comercial ........... ${formatCurrency(dreData.despesas_administrativas.marketing_comercial)}\n`;
    text += `    Salários / Pró-labore ........... ${formatCurrency(dreData.despesas_administrativas.salarios_prolabore)}\n`;
    text += `    Sistemas ........................ ${formatCurrency(dreData.despesas_administrativas.sistemas)}\n`;
    text += `    Total Despesas Administrativas .. (${formatCurrency(dreData.despesas_administrativas.total)})\n\n`;

    text += `= RESULTADO ANTES DOS IMPOSTOS (EBIT) ${formatCurrency(dreData.ebit)}\n`;
    text += `  (${formatPercent(dreData.indicadores.margem_ebit_percentual)} da Receita Bruta)\n`;
    text += '═══════════════════════════════════════════════════════════\n\n';

    text += '(-) IMPOSTO\n';
    text += '───────────────────────────────────────────────────────────\n';
    text += `    Simples Nacional ................ (${formatCurrency(dreData.impostos.simples_nacional)})\n`;
    text += `    Total Impostos .................. (${formatCurrency(dreData.impostos.total)})\n\n`;

    text += `= LUCRO LÍQUIDO DO PERÍODO .......... ${formatCurrency(dreData.lucro_liquido)}\n`;
    text += `  (${formatPercent(dreData.indicadores.margem_liquida_percentual)} da Receita Bruta)\n`;
    text += '═══════════════════════════════════════════════════════════\n';

    return text;
  }

  /**
   * Enriquece os dados do DRE com informações calculadas adicionais
   * @private
   */
  _enrichDREData(data) {
    return {
      ...data,
      metadata: {
        generated_at: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }

  /**
   * Calcula variações entre dois DREs
   * @private
   */
  _calculateComparison(dre1, dre2) {
    const calculateVariation = (value1, value2) => {
      if (value2 === 0) return value1 === 0 ? 0 : 100;
      return ((value1 - value2) / value2) * 100;
    };

    return {
      receita_bruta: {
        absolute: dre1.receita_bruta.total - dre2.receita_bruta.total,
        percentage: calculateVariation(
          dre1.receita_bruta.total,
          dre2.receita_bruta.total
        ),
      },
      margem_contribuicao: {
        absolute: dre1.margem_contribuicao - dre2.margem_contribuicao,
        percentage: calculateVariation(
          dre1.margem_contribuicao,
          dre2.margem_contribuicao
        ),
      },
      ebit: {
        absolute: dre1.ebit - dre2.ebit,
        percentage: calculateVariation(dre1.ebit, dre2.ebit),
      },
      lucro_liquido: {
        absolute: dre1.lucro_liquido - dre2.lucro_liquido,
        percentage: calculateVariation(dre1.lucro_liquido, dre2.lucro_liquido),
      },
    };
  }
}

// Exportar instância única (Singleton)
export const dreService = new DREService();
export default dreService;
