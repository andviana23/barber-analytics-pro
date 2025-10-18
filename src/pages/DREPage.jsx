/**
 * @file DREPage.jsx
 * @description Página de visualização do DRE (Demonstração do Resultado do Exercício)
 * @module pages/DREPage
 * @author AI Agent
 * @date 2024-10-18
 */

import React, { useState } from 'react';
import { useDRE } from '../hooks/useDRE';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { EmptyState } from '../atoms/EmptyState';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Loader2,
} from 'lucide-react';

/**
 * Componente DREPage
 * Exibe o DRE completo com filtros de período e opção de exportação
 */
export const DREPage = () => {
  const {
    dre,
    loading,
    error,
    period,
    customDates,
    loadDRE,
    updatePeriod,
    updateCustomDates,
    exportDRE,
    hasData,
    isEmpty,
  } = useDRE({ autoLoad: true });

  const [showFilters, setShowFilters] = useState(false);

  /**
   * Formata valor monetário
   */
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  /**
   * Formata porcentagem
   */
  const formatPercent = value => {
    return `${(value || 0).toFixed(2)}%`;
  };

  /**
   * Renderiza seção de filtros
   */
  const renderFilters = () => (
    <Card className="mb-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Período
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => {
              updatePeriod('month');
              loadDRE({ period: 'month' });
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              period === 'month'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">Mês Atual</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </button>

          <button
            onClick={() => {
              updatePeriod('year');
              loadDRE({ period: 'year' });
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              period === 'year'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">Ano Atual</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {new Date().getFullYear()}
            </div>
          </button>

          <button
            onClick={() => {
              updatePeriod('custom');
              setShowFilters(true);
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              period === 'custom'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <div className="font-medium">Período Customizado</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Escolha as datas
            </div>
          </button>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={customDates.startDate}
                onChange={e =>
                  updateCustomDates({
                    ...customDates,
                    startDate: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={customDates.endDate}
                onChange={e =>
                  updateCustomDates({ ...customDates, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => loadDRE({ period: 'custom', customDates })}
                className="w-full"
                disabled={!customDates.startDate || !customDates.endDate}
              >
                Calcular DRE
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  /**
   * Renderiza linha do DRE
   */
  const DRELine = ({
    label,
    value,
    level = 0,
    bold = false,
    highlight = false,
    negative = false,
  }) => {
    const paddingClass = level === 0 ? '' : level === 1 ? 'pl-8' : 'pl-12';
    const fontClass = bold ? 'font-bold text-lg' : 'font-medium';
    const bgClass = highlight ? 'bg-blue-50 dark:bg-blue-900/20' : '';
    const valueColor = negative
      ? 'text-red-600 dark:text-red-400'
      : value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-900 dark:text-gray-100';

    return (
      <div
        className={`flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800 ${paddingClass} ${bgClass}`}
      >
        <span className={fontClass}>{label}</span>
        <span className={`${fontClass} ${valueColor}`}>
          {negative && value > 0
            ? `(${formatCurrency(value)})`
            : formatCurrency(value)}
        </span>
      </div>
    );
  };

  /**
   * Renderiza indicadores
   */
  const renderIndicators = () => {
    if (!dre) return null;

    const indicators = [
      {
        label: 'Margem de Contribuição',
        value: dre.indicadores.margem_contribuicao_percentual,
        icon: BarChart3,
        color: 'blue',
      },
      {
        label: 'Margem EBIT',
        value: dre.indicadores.margem_ebit_percentual,
        icon: TrendingUp,
        color: 'green',
      },
      {
        label: 'Margem Líquida',
        value: dre.indicadores.margem_liquida_percentual,
        icon: DollarSign,
        color: dre.indicadores.margem_liquida_percentual >= 0 ? 'green' : 'red',
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            green:
              'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          };

          return (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {indicator.label}
                  </span>
                  <div
                    className={`p-2 rounded-lg ${colorClasses[indicator.color]}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold ${
                    indicator.color === 'red'
                      ? 'text-red-600'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {formatPercent(indicator.value)}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  /**
   * Renderiza DRE completo
   */
  const renderDRE = () => {
    if (!dre) return null;

    return (
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                DRE - Demonstração do Resultado do Exercício
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Período:{' '}
                {new Date(dre.periodo.inicio).toLocaleDateString('pt-BR')} até{' '}
                {new Date(dre.periodo.fim).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              onClick={exportDRE}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar TXT
            </Button>
          </div>

          <div className="space-y-1">
            {/* RECEITA BRUTA */}
            <div className="mt-4 mb-2">
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
                RECEITA BRUTA
              </h3>
            </div>
            <DRELine
              label="(+) Receita de Serviço"
              value={dre.receita_bruta.receita_servico.total}
              level={0}
              bold
            />
            <DRELine
              label="Assinatura"
              value={dre.receita_bruta.receita_servico.assinatura}
              level={1}
            />
            <DRELine
              label="Avulso"
              value={dre.receita_bruta.receita_servico.avulso}
              level={1}
            />

            <DRELine
              label="(+) Receita de Produto"
              value={dre.receita_bruta.receita_produtos.total}
              level={0}
              bold
            />
            <DRELine
              label="Cosméticos"
              value={dre.receita_bruta.receita_produtos.cosmeticos}
              level={1}
            />

            <DRELine
              label="= RECEITA BRUTA"
              value={dre.receita_bruta.total}
              level={0}
              bold
              highlight
            />

            {/* CUSTOS OPERACIONAIS */}
            <div className="mt-6 mb-2">
              <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400">
                (-) CUSTOS OPERACIONAIS
              </h3>
            </div>
            <DRELine
              label="Bebidas e cortesias"
              value={dre.custos_operacionais.bebidas_cortesias}
              level={1}
              negative
            />
            <DRELine
              label="Bonificações e metas"
              value={dre.custos_operacionais.bonificacoes_metas}
              level={1}
              negative
            />
            <DRELine
              label="Comissões"
              value={dre.custos_operacionais.comissoes}
              level={1}
              negative
            />
            <DRELine
              label="Limpeza e lavanderia"
              value={dre.custos_operacionais.limpeza_lavanderia}
              level={1}
              negative
            />
            <DRELine
              label="Produtos de uso interno"
              value={dre.custos_operacionais.produtos_uso_interno}
              level={1}
              negative
            />
            <DRELine
              label="Total Custos Operacionais"
              value={dre.custos_operacionais.total}
              level={0}
              bold
              negative
            />

            <DRELine
              label={`= MARGEM DE CONTRIBUIÇÃO (${formatPercent(dre.indicadores.margem_contribuicao_percentual)})`}
              value={dre.margem_contribuicao}
              level={0}
              bold
              highlight
            />

            {/* DESPESAS ADMINISTRATIVAS */}
            <div className="mt-6 mb-2">
              <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400">
                (-) DESPESAS ADMINISTRATIVAS
              </h3>
            </div>
            <DRELine
              label="Aluguel e condomínio"
              value={dre.despesas_administrativas.aluguel_condominio}
              level={1}
              negative
            />
            <DRELine
              label="Contabilidade"
              value={dre.despesas_administrativas.contabilidade}
              level={1}
              negative
            />
            <DRELine
              label="Contas fixas (energia, água, internet, telefone)"
              value={dre.despesas_administrativas.contas_fixas}
              level={1}
              negative
            />
            <DRELine
              label="Encargos e benefícios"
              value={dre.despesas_administrativas.encargos_beneficios}
              level={1}
              negative
            />
            <DRELine
              label="Manutenção e Seguros"
              value={dre.despesas_administrativas.manutencao_seguros}
              level={1}
              negative
            />
            <DRELine
              label="Marketing e Comercial"
              value={dre.despesas_administrativas.marketing_comercial}
              level={1}
              negative
            />
            <DRELine
              label="Salários / Pró-labore"
              value={dre.despesas_administrativas.salarios_prolabore}
              level={1}
              negative
            />
            <DRELine
              label="Sistemas"
              value={dre.despesas_administrativas.sistemas}
              level={1}
              negative
            />
            <DRELine
              label="Total Despesas Administrativas"
              value={dre.despesas_administrativas.total}
              level={0}
              bold
              negative
            />

            <DRELine
              label={`= RESULTADO ANTES DOS IMPOSTOS (EBIT) - ${formatPercent(dre.indicadores.margem_ebit_percentual)}`}
              value={dre.ebit}
              level={0}
              bold
              highlight
            />

            {/* IMPOSTOS */}
            <div className="mt-6 mb-2">
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                (-) IMPOSTO
              </h3>
            </div>
            <DRELine
              label="Simples Nacional"
              value={dre.impostos.simples_nacional}
              level={1}
              negative
            />
            <DRELine
              label="Total Impostos"
              value={dre.impostos.total}
              level={0}
              bold
              negative
            />

            <DRELine
              label={`= LUCRO LÍQUIDO DO PERÍODO - ${formatPercent(dre.indicadores.margem_liquida_percentual)}`}
              value={dre.lucro_liquido}
              level={0}
              bold
              highlight
            />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            DRE - Demonstração do Resultado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Análise completa do resultado financeiro
          </p>
        </div>
      </div>

      {renderFilters()}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Calculando DRE...</span>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Erro ao carregar DRE
            </h3>
            <p className="text-red-600">{error.message}</p>
          </div>
        </Card>
      )}

      {!loading && !error && isEmpty && (
        <EmptyState
          icon={FileText}
          title="Sem movimentações no período"
          description="Não há receitas ou despesas registradas para o período selecionado."
        />
      )}

      {!loading && !error && hasData && !isEmpty && (
        <>
          {renderIndicators()}
          {renderDRE()}
        </>
      )}

      {!loading && !error && !hasData && (
        <EmptyState
          icon={BarChart3}
          title="Selecione um período"
          description="Escolha um período acima para visualizar o DRE."
        />
      )}
    </div>
  );
};

export default DREPage;
