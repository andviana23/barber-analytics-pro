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

      // Chamar a função SQL dinâmica via RPC
      const { data, error } = await supabase.rpc('fn_calculate_dre_dynamic', {
        p_unit_id: unitId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      // eslint-disable-next-line no-console
      console.log('🔍 DRE Service - Raw SQL Response:', { data, error });

      if (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Erro ao calcular DRE:', error);

        // Mensagens de erro mais amigáveis
        let errorMessage = 'Erro ao calcular DRE';

        if (error.message?.includes('Unit ID cannot be null')) {
          errorMessage = 'ID da unidade inválido';
        } else if (error.message?.includes('cannot be null')) {
          errorMessage = 'Datas são obrigatórias';
        } else if (error.message?.includes('cannot be greater')) {
          errorMessage = 'Data inicial não pode ser maior que data final';
        } else if (error.code === 'PGRST116') {
          errorMessage =
            'Função de cálculo do DRE não encontrada. Entre em contato com o suporte.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return {
          data: null,
          error: new Error(errorMessage),
        };
      }

      // Validar resposta
      if (!data) {
        return {
          data: null,
          error: new Error('Nenhum dado retornado pelo cálculo do DRE'),
        };
      }

      // Enriquecer dados com informações adicionais
      const enrichedData = this._enrichDREData(data);

      // eslint-disable-next-line no-console
      console.log('✅ DRE Service - Enriched Data:', enrichedData);

      return { data: enrichedData, error: null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro inesperado ao calcular DRE:', error);
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
      // eslint-disable-next-line no-console
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
   * Exporta o DRE em formato CSV
   *
   * @param {Object} dreData - Dados do DRE
   * @returns {string} - DRE formatado como CSV
   */
  exportAsCSV(dreData) {
    if (!dreData) return '';

    const formatNumber = value => {
      return (value || 0).toFixed(2).replace('.', ',');
    };

    let csv = '';

    // Header
    csv += 'Categoria;Subcategoria;Valor;Percentual\n';

    // Receitas
    csv += `RECEITA BRUTA;;${formatNumber(dreData.receita_bruta.total)};100,00%\n`;
    csv += `Receita de Serviço;Assinatura;${formatNumber(dreData.receita_bruta.receita_servico.assinatura)};\n`;
    csv += `Receita de Serviço;Avulso;${formatNumber(dreData.receita_bruta.receita_servico.avulso)};\n`;
    csv += `Receita de Serviço;Total;${formatNumber(dreData.receita_bruta.receita_servico.total)};\n`;
    csv += `Receita de Produtos;Cosméticos;${formatNumber(dreData.receita_bruta.receita_produtos.cosmeticos)};\n`;
    csv += `Receita de Produtos;Total;${formatNumber(dreData.receita_bruta.receita_produtos.total)};\n`;

    // Custos Operacionais
    csv += `\nCUSTOS OPERACIONAIS;;${formatNumber(dreData.custos_operacionais.total)};${formatNumber(dreData.indicadores.custo_operacional_percentual)}%\n`;
    csv += `Custos;Bebidas e cortesias;${formatNumber(dreData.custos_operacionais.bebidas_cortesias)};\n`;
    csv += `Custos;Bonificações e metas;${formatNumber(dreData.custos_operacionais.bonificacoes_metas)};\n`;
    csv += `Custos;Comissões;${formatNumber(dreData.custos_operacionais.comissoes)};\n`;
    csv += `Custos;Limpeza e lavanderia;${formatNumber(dreData.custos_operacionais.limpeza_lavanderia)};\n`;
    csv += `Custos;Produtos de uso interno;${formatNumber(dreData.custos_operacionais.produtos_uso_interno)};\n`;

    // Margem de Contribuição
    csv += `\nMARGEM DE CONTRIBUIÇÃO;;${formatNumber(dreData.margem_contribuicao)};${formatNumber(dreData.indicadores.margem_contribuicao_percentual)}%\n`;

    // Despesas Administrativas
    csv += `\nDESPESAS ADMINISTRATIVAS;;${formatNumber(dreData.despesas_administrativas.total)};${formatNumber(dreData.indicadores.despesa_administrativa_percentual)}%\n`;
    csv += `Despesas;Aluguel e condomínio;${formatNumber(dreData.despesas_administrativas.aluguel_condominio)};\n`;
    csv += `Despesas;Contabilidade;${formatNumber(dreData.despesas_administrativas.contabilidade)};\n`;
    csv += `Despesas;Contas fixas;${formatNumber(dreData.despesas_administrativas.contas_fixas)};\n`;
    csv += `Despesas;Encargos e benefícios;${formatNumber(dreData.despesas_administrativas.encargos_beneficios)};\n`;
    csv += `Despesas;Manutenção e Seguros;${formatNumber(dreData.despesas_administrativas.manutencao_seguros)};\n`;
    csv += `Despesas;Marketing e Comercial;${formatNumber(dreData.despesas_administrativas.marketing_comercial)};\n`;
    csv += `Despesas;Salários / Pró-labore;${formatNumber(dreData.despesas_administrativas.salarios_prolabore)};\n`;
    csv += `Despesas;Sistemas;${formatNumber(dreData.despesas_administrativas.sistemas)};\n`;

    // EBIT
    csv += `\nEBIT (Resultado antes dos Impostos);;${formatNumber(dreData.ebit)};${formatNumber(dreData.indicadores.margem_ebit_percentual)}%\n`;

    // Impostos
    csv += `\nIMPOSTOS;;${formatNumber(dreData.impostos.total)};\n`;
    csv += `Impostos;Simples Nacional;${formatNumber(dreData.impostos.simples_nacional)};\n`;

    // Lucro Líquido
    csv += `\nLUCRO LÍQUIDO;;${formatNumber(dreData.lucro_liquido)};${formatNumber(dreData.indicadores.margem_liquida_percentual)}%\n`;

    // Metadata
    csv += `\nPeríodo;${dreData.periodo.inicio} a ${dreData.periodo.fim};;\n`;
    if (dreData.metadata?.calculation_timestamp) {
      csv += `Gerado em;${new Date(dreData.metadata.calculation_timestamp).toLocaleString('pt-BR')};;\n`;
    }

    return csv;
  }

  /**
   * Exporta o DRE em formato HTML (para conversão em PDF)
   *
   * @param {Object} dreData - Dados do DRE
   * @returns {string} - DRE formatado como HTML
   */
  exportAsHTML(dreData) {
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

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DRE - Demonstração do Resultado do Exercício</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
        }
        .header .company {
            font-size: 18px;
            color: #666;
            margin: 5px 0;
        }
        .header .period {
            font-size: 14px;
            color: #999;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        .section-header {
            background-color: #eff6ff;
            font-weight: bold;
            color: #1e40af;
            padding: 12px;
        }
        .subsection {
            padding-left: 30px;
            color: #666;
        }
        .total-row {
            background-color: #fef3c7;
            font-weight: bold;
        }
        .highlight-row {
            background-color: #dbeafe;
            font-weight: bold;
            font-size: 16px;
        }
        .positive {
            color: #059669;
        }
        .negative {
            color: #dc2626;
        }
        .right-align {
            text-align: right;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>DRE - Demonstração do Resultado do Exercício</h1>
        <div class="company">Barber Analytics Pro</div>
        <div class="period">
            Período: ${new Date(dreData.periodo.inicio).toLocaleDateString('pt-BR')} a 
            ${new Date(dreData.periodo.fim).toLocaleDateString('pt-BR')}
            ${dreData.periodo.dias ? `(${dreData.periodo.dias} dias)` : ''}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Descrição</th>
                <th class="right-align">Valor</th>
                <th class="right-align">% Receita</th>
            </tr>
        </thead>
        <tbody>
            <!-- RECEITA BRUTA -->
            <tr class="section-header">
                <td colspan="3">RECEITA BRUTA</td>
            </tr>
            <tr>
                <td class="subsection">Receita de Serviço - Assinatura</td>
                <td class="right-align">${formatCurrency(dreData.receita_bruta.receita_servico.assinatura)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Receita de Serviço - Avulso</td>
                <td class="right-align">${formatCurrency(dreData.receita_bruta.receita_servico.avulso)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Receita de Produtos - Cosméticos</td>
                <td class="right-align">${formatCurrency(dreData.receita_bruta.receita_produtos.cosmeticos)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr class="total-row">
                <td><strong>= RECEITA BRUTA TOTAL</strong></td>
                <td class="right-align positive"><strong>${formatCurrency(dreData.receita_bruta.total)}</strong></td>
                <td class="right-align"><strong>100,00%</strong></td>
            </tr>

            <!-- CUSTOS OPERACIONAIS -->
            <tr class="section-header">
                <td colspan="3">(-) CUSTOS OPERACIONAIS</td>
            </tr>
            <tr>
                <td class="subsection">Bebidas e cortesias</td>
                <td class="right-align">${formatCurrency(dreData.custos_operacionais.bebidas_cortesias)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Bonificações e metas</td>
                <td class="right-align">${formatCurrency(dreData.custos_operacionais.bonificacoes_metas)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Comissões</td>
                <td class="right-align">${formatCurrency(dreData.custos_operacionais.comissoes)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Limpeza e lavanderia</td>
                <td class="right-align">${formatCurrency(dreData.custos_operacionais.limpeza_lavanderia)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Produtos de uso interno</td>
                <td class="right-align">${formatCurrency(dreData.custos_operacionais.produtos_uso_interno)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr class="total-row">
                <td><strong>= Total Custos Operacionais</strong></td>
                <td class="right-align negative"><strong>(${formatCurrency(dreData.custos_operacionais.total)})</strong></td>
                <td class="right-align"><strong>${formatPercent(dreData.indicadores.custo_operacional_percentual)}</strong></td>
            </tr>

            <!-- MARGEM DE CONTRIBUIÇÃO -->
            <tr class="highlight-row">
                <td><strong>= MARGEM DE CONTRIBUIÇÃO</strong></td>
                <td class="right-align positive"><strong>${formatCurrency(dreData.margem_contribuicao)}</strong></td>
                <td class="right-align"><strong>${formatPercent(dreData.indicadores.margem_contribuicao_percentual)}</strong></td>
            </tr>

            <!-- DESPESAS ADMINISTRATIVAS -->
            <tr class="section-header">
                <td colspan="3">(-) DESPESAS ADMINISTRATIVAS</td>
            </tr>
            <tr>
                <td class="subsection">Aluguel e condomínio</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.aluguel_condominio)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Contabilidade</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.contabilidade)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Contas fixas</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.contas_fixas)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Encargos e benefícios</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.encargos_beneficios)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Manutenção e Seguros</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.manutencao_seguros)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Marketing e Comercial</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.marketing_comercial)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Salários / Pró-labore</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.salarios_prolabore)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr>
                <td class="subsection">Sistemas</td>
                <td class="right-align">${formatCurrency(dreData.despesas_administrativas.sistemas)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr class="total-row">
                <td><strong>= Total Despesas Administrativas</strong></td>
                <td class="right-align negative"><strong>(${formatCurrency(dreData.despesas_administrativas.total)})</strong></td>
                <td class="right-align"><strong>${formatPercent(dreData.indicadores.despesa_administrativa_percentual)}</strong></td>
            </tr>

            <!-- EBIT -->
            <tr class="highlight-row">
                <td><strong>= EBIT (Resultado antes dos Impostos)</strong></td>
                <td class="right-align ${dreData.ebit >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(dreData.ebit)}</strong></td>
                <td class="right-align"><strong>${formatPercent(dreData.indicadores.margem_ebit_percentual)}</strong></td>
            </tr>

            <!-- IMPOSTOS -->
            <tr class="section-header">
                <td colspan="3">(-) IMPOSTOS</td>
            </tr>
            <tr>
                <td class="subsection">Simples Nacional</td>
                <td class="right-align">${formatCurrency(dreData.impostos.simples_nacional)}</td>
                <td class="right-align">-</td>
            </tr>
            <tr class="total-row">
                <td><strong>= Total Impostos</strong></td>
                <td class="right-align negative"><strong>(${formatCurrency(dreData.impostos.total)})</strong></td>
                <td class="right-align">-</td>
            </tr>

            <!-- LUCRO LÍQUIDO -->
            <tr class="highlight-row">
                <td><strong>= LUCRO LÍQUIDO DO PERÍODO</strong></td>
                <td class="right-align ${dreData.lucro_liquido >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(dreData.lucro_liquido)}</strong></td>
                <td class="right-align"><strong>${formatPercent(dreData.indicadores.margem_liquida_percentual)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Gerado em: ${dreData.metadata?.calculation_timestamp ? new Date(dreData.metadata.calculation_timestamp).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
        <br>
        Barber Analytics Pro - Sistema de Gestão v${dreData.metadata?.version || '1.0.0'}
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Enriquece os dados do DRE com informações calculadas adicionais
   * @private
   */
  _enrichDREData(data) {
    // eslint-disable-next-line no-console
    console.log('🔧 _enrichDREData - Input:', {
      hasMetadata: !!data.metadata,
      versao: data.metadata?.versao,
      keys: Object.keys(data || {}).slice(0, 10),
    });

    // Verificar se é a estrutura nova (v3.0.1+) com metadata.versao
    if (data.metadata?.versao?.includes('3.0')) {
      // eslint-disable-next-line no-console
      console.log('✅ Usando estrutura v3.0.1-HOTFIX');

      // Estrutura SQL v3.0.1-HOTFIX - Mapeamento para compatibilidade
      return {
        periodo: data.periodo,

        // Receita Bruta - extrair total do objeto
        receita_bruta: {
          total: data.receita_bruta?.total || 0,
          categorias: data.receita_bruta?.categorias || [],
        },

        // Receitas estruturadas para compatibilidade
        receitas: {
          total: data.receita_bruta?.total || 0,
          categorias: data.receita_bruta?.categorias || [],
        },

        // Deduções
        deducoes: {
          total: data.deducoes?.total || 0,
          categorias: data.deducoes?.categorias || [],
        },

        // Receita Líquida
        receita_liquida: data.receita_liquida || 0,

        // Custos Operacionais - extrair total e categorias do objeto
        custos_operacionais: {
          total: data.custos_operacionais?.total || 0,
          categorias: data.custos_operacionais?.categorias || [],
        },

        // Despesas Administrativas - extrair total e categorias do objeto
        despesas_administrativas: {
          total: data.despesas_administrativas?.total || 0,
          categorias: data.despesas_administrativas?.categorias || [],
        },

        // Despesas estruturadas para compatibilidade com componente
        despesas: {
          total:
            (data.custos_operacionais?.total || 0) +
            (data.despesas_administrativas?.total || 0),
          categorias: [
            ...(data.custos_operacionais?.categorias || []),
            ...(data.despesas_administrativas?.categorias || []),
          ],
        },

        // Impostos - extrair total e categorias do objeto
        impostos: {
          total: data.impostos?.total || 0,
          categorias: data.impostos?.categorias || [],
        },

        // Resultado Financeiro
        resultado_financeiro: {
          receitas: data.resultado_financeiro?.receitas || 0,
          despesas: data.resultado_financeiro?.despesas || 0,
          total: data.resultado_financeiro?.total || 0,
        },

        // Resultados Principais
        margem_contribuicao: data.margem_contribuicao || 0,
        ebitda: data.ebitda || 0,
        ebit: data.ebit || 0,
        lucro_liquido: data.lucro_liquido || 0,

        // Indicadores/Percentuais
        indicadores: data.indicadores || {
          margem_contribuicao_percentual: 0,
          margem_ebitda_percentual: 0,
          margem_ebit_percentual: 0,
          margem_liquida_percentual: 0,
        },

        // Metadata
        metadata: data.metadata || {
          regime: 'competencia',
          versao: '3.0.1-HOTFIX',
          calculation_timestamp: new Date().toISOString(),
        },

        // Campos computados
        _computed: {
          has_data: (data.receita_bruta?.total || 0) > 0,
          is_profitable: (data.lucro_liquido || 0) > 0,
          periodo_label: this._formatPeriodLabel(data.periodo),
        },
      };
    }

    // eslint-disable-next-line no-console
    console.log('⚠️ Usando estrutura antiga (fallback)');

    // Estrutura antiga - manter compatibilidade
    return {
      ...data,
      metadata: data.metadata || {
        generated_at: new Date().toISOString(),
        version: '1.0.0',
      },
      _computed: {
        has_data:
          (data.receita_bruta?.total || 0) > 0 ||
          (data.custos_operacionais?.total || 0) > 0 ||
          (data.despesas_administrativas?.total || 0) > 0,
        is_profitable: (data.lucro_liquido || 0) > 0,
        periodo_label: this._formatPeriodLabel(data.periodo),
      },
    };
  }

  /**
   * Formata o período para exibição amigável
   * @private
   */
  _formatPeriodLabel(periodo) {
    if (!periodo) return '';

    const inicio = new Date(periodo.inicio);
    const fim = new Date(periodo.fim);

    // Se é o mesmo mês
    if (
      inicio.getMonth() === fim.getMonth() &&
      inicio.getFullYear() === fim.getFullYear()
    ) {
      return inicio.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
    }

    // Se é o mesmo ano
    if (inicio.getFullYear() === fim.getFullYear()) {
      return `${inicio.toLocaleDateString('pt-BR', { month: 'short' })} a ${fim.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
    }

    // Intervalo completo
    return `${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`;
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
