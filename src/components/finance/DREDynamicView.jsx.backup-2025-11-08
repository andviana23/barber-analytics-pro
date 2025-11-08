/**
 * DREDynamicView.jsx
 * Componente empresarial compacto para visualização do DRE
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  AlertTriangle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
const formatCurrency = value => {
  if (!value && value !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
const formatPercent = value => {
  if (!value && value !== 0) return '0,00%';
  return `${value.toFixed(2).replace('.', ',')}%`;
};
const DREDynamicView = ({ dreData, isLoading = false }) => {
  const [expanded, setExpanded] = useState({});
  if (isLoading) {
    return (
      <div className="card-theme animate-pulse rounded-lg p-6 dark:bg-dark-surface">
        <div className="mb-6 h-8 w-1/3 rounded bg-light-surface/50 dark:bg-dark-surface/50"></div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="mb-3 h-16 rounded bg-light-surface/50 dark:bg-dark-surface/50"
          ></div>
        ))}
      </div>
    );
  }
  if (!dreData || (!dreData.sucesso && !dreData.metadata)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-200">
          {dreData?.erro || 'Erro ao carregar DRE'}
        </p>
      </div>
    );
  }
  const toggle = key =>
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  const Line = ({
    label,
    value,
    percent,
    bold = false,
    highlight = false,
    expandable = false,
    items = [],
    itemKey = '',
  }) => {
    const isExpanded = expanded[itemKey];
    const hasItems = items?.length > 0;
    return (
      <div
        className={`mb-1 ${highlight ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
      >
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-2.5 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover ${expandable && hasItems ? 'cursor-pointer' : ''}`}
          onClick={() => expandable && hasItems && toggle(itemKey)}
        >
          <div className="flex flex-1 items-center gap-2">
            {expandable &&
              hasItems &&
              (isExpanded ? (
                <ChevronUp className="text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
              ) : (
                <ChevronDown className="text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
              ))}
            <span
              className={`text-theme-primary dark:text-dark-text-primary ${bold ? 'text-base font-bold' : 'text-sm'}`}
            >
              {label}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {percent !== null && percent !== undefined && (
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted w-16 text-right text-xs">
                {formatPercent(percent)}
              </span>
            )}
            <span
              className={`w-32 text-right ${bold ? 'text-base font-bold' : 'text-sm'} ${value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
            >
              {formatCurrency(value)}
            </span>
          </div>
        </div>

        {expandable && hasItems && isExpanded && (
          <div className="ml-8 mt-1 space-y-0.5">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between rounded px-3 py-1.5 text-xs hover:bg-light-hover dark:hover:bg-dark-hover"
              >
                <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  {item.categoria_nome}
                </span>
                <span className="text-theme-primary dark:text-dark-text-primary font-medium">
                  {formatCurrency(item.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="card-theme overflow-hidden rounded-xl border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="border-b border-light-border bg-light-surface/80 px-6 py-4 dark:border-dark-border dark:bg-dark-surface/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="card-theme/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-theme-primary text-lg font-bold">
                DRE - Demonstração de Resultado
              </h2>
              <p className="text-theme-secondary text-xs">
                Análise completa de receitas e despesas
              </p>
            </div>
          </div>
          {dreData.metadata?.regime && (
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-200">
              {dreData.metadata.regime}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 p-6">
        <Line
          label="(+) RECEITA BRUTA"
          value={dreData.receita_bruta?.total || dreData.receita_bruta || 0}
          percent={
            dreData.indicadores?.margem_contribuicao_percentual ||
            dreData.percentuais?.receita_bruta
          }
          bold
          highlight
          expandable
          items={
            dreData.receita_bruta?.categorias ||
            dreData.receitas_detalhadas ||
            []
          }
          itemKey="receitas"
        />

        {(dreData.taxa_cartao ||
          dreData.deducoes?.total ||
          dreData.deducoes ||
          0) > 0 && (
          <Line
            label="(-) Taxas e Deduções"
            value={
              -(
                dreData.taxa_cartao ||
                dreData.deducoes?.total ||
                dreData.deducoes ||
                0
              )
            }
            percent={
              dreData.percentuais?.deducoes || dreData.percentuais?.taxa_cartao
            }
            expandable
            items={
              dreData.deducoes?.categorias || dreData.deducoes_detalhadas || []
            }
            itemKey="deducoes"
          />
        )}

        <Line
          label="= RECEITA LÍQUIDA"
          value={dreData.receita_liquida || 0}
          percent={dreData.percentuais?.receita_liquida}
          bold
          highlight
        />

        <div className="my-2 border-t border-light-border dark:border-dark-border"></div>

        <Line
          label="(-) CUSTOS OPERACIONAIS"
          value={
            -(
              dreData.custos_operacionais?.total ||
              dreData.custos_operacionais ||
              0
            )
          }
          percent={dreData.percentuais?.custos_operacionais}
          expandable
          items={
            dreData.custos_operacionais?.categorias ||
            dreData.custos_detalhados ||
            []
          }
          itemKey="custos"
        />

        <Line
          label="= MARGEM DE CONTRIBUIÇÃO"
          value={dreData.margem_contribuicao || 0}
          percent={
            dreData.indicadores?.margem_contribuicao_percentual ||
            dreData.percentuais?.margem_contribuicao
          }
          bold
          highlight
        />

        <div className="my-2 border-t border-light-border dark:border-dark-border"></div>

        <Line
          label="(-) Despesas Administrativas"
          value={
            -(
              dreData.despesas_administrativas?.total ||
              dreData.despesas_fixas ||
              0
            )
          }
          percent={dreData.percentuais?.despesas_fixas}
          expandable
          items={
            dreData.despesas_administrativas?.categorias ||
            dreData.despesas_detalhadas ||
            []
          }
          itemKey="despesas"
        />

        <Line
          label="= EBITDA"
          value={dreData.ebitda || 0}
          percent={
            dreData.indicadores?.margem_ebitda_percentual ||
            dreData.percentuais?.ebitda_margin
          }
          bold
          highlight
        />

        <div className="my-2 border-t border-light-border dark:border-dark-border"></div>

        {(dreData.impostos?.total || dreData.impostos || 0) > 0 && (
          <Line
            label="(-) Impostos"
            value={-(dreData.impostos?.total || dreData.impostos || 0)}
            percent={dreData.percentuais?.impostos}
            expandable
            items={
              dreData.impostos?.categorias || dreData.impostos_detalhadas || []
            }
            itemKey="impostos"
          />
        )}

        <Line
          label="= EBIT"
          value={dreData.ebit || 0}
          percent={dreData.indicadores?.margem_ebit_percentual}
          bold
        />

        {(dreData.resultado_financeiro?.total ||
          dreData.resultado_financeiro ||
          0) !== 0 && (
          <>
            <div className="my-2 border-t border-light-border dark:border-dark-border"></div>
            <Line
              label="(+/-) Resultado Financeiro"
              value={
                dreData.resultado_financeiro?.total ||
                dreData.resultado_financeiro ||
                0
              }
              percent={null}
            />
          </>
        )}

        <div className="my-3 border-t-2 border-light-border dark:border-dark-border"></div>

        <div
          className={`rounded-lg border-2 p-4 ${(dreData.lucro_liquido || 0) >= 0 ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(dreData.lucro_liquido || 0) >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted block text-xs uppercase tracking-wide">
                  Resultado
                </span>
                <span className="text-theme-primary dark:text-dark-text-primary text-lg font-bold">
                  LUCRO LÍQUIDO
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${(dreData.lucro_liquido || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(dreData.lucro_liquido || 0)}
              </div>
              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                Margem:{' '}
                <span className="font-semibold">
                  {formatPercent(
                    dreData.indicadores?.margem_liquida_percentual ||
                      dreData.percentuais?.margem_liquida ||
                      0
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CARDS DE INDICADORES - DESIGN SYSTEM COMPLIANT */}
      {/* ============================================ */}
      <div className="border-t border-light-border bg-light-bg px-6 py-5 dark:border-dark-border dark:bg-dark-bg">
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1: Margem de Lucro Líquido (%) */}
          <div className="card-theme rounded-lg border-2 border-green-500/20 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-green-500/30">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold uppercase text-green-700 dark:text-green-300">
                Margem de Lucro Líquido
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${(dreData.indicadores?.margem_liquida_percentual || 0) >= 15 ? 'text-green-600 dark:text-green-400' : (dreData.indicadores?.margem_liquida_percentual || 0) >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatPercent(
                dreData.indicadores?.margem_liquida_percentual ||
                  dreData.percentuais?.margem_liquida ||
                  0
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-green-700 dark:text-green-400">
              {formatCurrency(dreData.lucro_liquido)} de lucro
            </p>
            <p className="text-theme-secondary mt-2 text-xs">
              📈 Lucro real sobre a receita total
            </p>
          </div>

          {/* Card 2: Custo Operacional (% da Receita) */}
          <div className="card-theme rounded-lg border-2 border-orange-500/20 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-orange-500/30">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-semibold uppercase text-orange-700 dark:text-orange-300">
                Custo Operacional
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${((dreData.custos_operacionais?.total || 0) / (dreData.receita_bruta?.total || 1)) * 100 <= 20 ? 'text-green-600 dark:text-green-400' : ((dreData.custos_operacionais?.total || 0) / (dreData.receita_bruta?.total || 1)) * 100 <= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatPercent(
                ((dreData.custos_operacionais?.total || 0) /
                  (dreData.receita_bruta?.total || 1)) *
                  100
              )}
            </div>
            <p className="text-theme-secondary mt-1 text-xs">
              {formatCurrency(dreData.custos_operacionais?.total || 0)}
            </p>
            <p className="text-theme-secondary mt-2 text-xs">
              ⚙️ Materiais, produtos, manutenção
            </p>
          </div>

          {/* Card 3: Despesas Fixas (% da Receita) */}
          <div className="card-theme rounded-lg border-2 border-blue-500/20 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-blue-500/30">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                Despesas Fixas
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${((dreData.despesas_administrativas?.total || 0) / (dreData.receita_bruta?.total || 1)) * 100 <= 25 ? 'text-green-600 dark:text-green-400' : ((dreData.despesas_administrativas?.total || 0) / (dreData.receita_bruta?.total || 1)) * 100 <= 35 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatPercent(
                ((dreData.despesas_administrativas?.total || 0) /
                  (dreData.receita_bruta?.total || 1)) *
                  100
              )}
            </div>
            <p className="text-theme-secondary mt-1 text-xs">
              {formatCurrency(dreData.despesas_administrativas?.total || 0)}
            </p>
            <p className="text-theme-secondary mt-2 text-xs">
              🏢 Aluguel, energia, salários fixos
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* ALERTAS INTELIGENTES DE GESTÃO */}
        {/* ============================================ */}
        {(() => {
          const alerts = [];
          const receitaBruta = dreData.receita_bruta?.total || 1;
          const margemLucro =
            dreData.indicadores?.margem_liquida_percentual ||
            dreData.percentuais?.margem_liquida ||
            0;
          const custoOperacional =
            ((dreData.custos_operacionais?.total || 0) / receitaBruta) * 100;
          const despesasFixas =
            ((dreData.despesas_administrativas?.total || 0) / receitaBruta) *
            100;

          // 🔴 ALERTA 1: Despesas Fixas muito altas (> 35%)
          if (despesasFixas > 35) {
            alerts.push({
              type: 'error',
              icon: XCircle,
              title: 'Despesas Fixas Muito Altas!',
              message:
                'As despesas fixas estão em ' +
                formatPercent(despesasFixas) +
                ' da receita (acima de 35%). O problema não é a operação, mas sim a estrutura de custos fixos.',
              action:
                '💡 Ação: Renegocie aluguel, energia, contratos fixos. Considere reduzir custos administrativos.',
            });
          } else if (despesasFixas > 25) {
            alerts.push({
              type: 'warning',
              icon: AlertTriangle,
              title: 'Atenção: Despesas Fixas Elevadas',
              message:
                'Despesas fixas em ' +
                formatPercent(despesasFixas) +
                ' (entre 25-35%). Fique atento, pois está próximo do limite ideal.',
              action:
                '💡 Monitore de perto e busque otimizações sempre que possível.',
            });
          }

          // 🟡 ALERTA 2: Lucro Líquido abaixo do esperado (< 18%)
          if (margemLucro < 18 && margemLucro > 0) {
            alerts.push({
              type: 'warning',
              icon: AlertCircle,
              title: 'Lucratividade Abaixo do Esperado',
              message:
                'Margem de lucro em ' +
                formatPercent(margemLucro) +
                ' (abaixo de 18%). A barbearia não está lucrando o que deveria.',
              action:
                '💡 Ação: Revise despesas, analise captação de novos clientes e aumente o ticket médio (venda produtos, combos, assinaturas).',
            });
          } else if (margemLucro <= 0) {
            alerts.push({
              type: 'error',
              icon: XCircle,
              title: 'PREJUÍZO! Lucro Negativo',
              message:
                'A barbearia está operando no vermelho! Margem de lucro: ' +
                formatPercent(margemLucro) +
                '.',
              action:
                '🚨 Ação URGENTE: Corte custos imediatamente, revise preços e aumente o volume de atendimentos.',
            });
          }

          // 🔴 ALERTA 3: Custo Operacional muito alto (> 52%)
          if (custoOperacional > 52) {
            alerts.push({
              type: 'error',
              icon: XCircle,
              title: 'RISCO! Custo Operacional Crítico',
              message:
                'Custo operacional em ' +
                formatPercent(custoOperacional) +
                ' da receita (acima de 52%). A barbearia está em RISCO financeiro!',
              action:
                '🚨 Ação URGENTE: Revise comissões, verifique desperdício de produtos, avalie se bonificações geram resultado ou prejuízo.',
            });
          } else if (custoOperacional > 30) {
            alerts.push({
              type: 'warning',
              icon: AlertTriangle,
              title: 'Custo Operacional Elevado',
              message:
                'Custo operacional em ' +
                formatPercent(custoOperacional) +
                ' (acima de 30%). Fique atento ao consumo de materiais e comissões.',
              action:
                '💡 Ação: Monitore desperdícios, negocie com fornecedores e otimize o uso de produtos.',
            });
          }
          return alerts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-4 ${alert.type === 'error' ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-900/20' : 'border-yellow-500 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'}`}
                >
                  <div className="flex items-start gap-3">
                    <alert.icon
                      className={`mt-0.5 h-5 w-5 flex-shrink-0 ${alert.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`mb-1 text-sm font-semibold ${alert.type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}
                      >
                        {alert.title}
                      </h4>
                      <p
                        className={`mb-2 text-sm ${alert.type === 'error' ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}
                      >
                        {alert.message}
                      </p>
                      <p
                        className={`text-xs font-medium ${alert.type === 'error' ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'}`}
                      >
                        {alert.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null;
        })()}

        {dreData.metadata?.calculation_timestamp && (
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-4 flex items-center justify-between border-t border-light-border pt-3 text-xs dark:border-dark-border">
            <span>
              Gerado em:{' '}
              {new Date(dreData.metadata.calculation_timestamp).toLocaleString(
                'pt-BR'
              )}
            </span>
            {dreData.metadata?.versao && (
              <span className="font-mono">v{dreData.metadata.versao}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
DREDynamicView.propTypes = {
  dreData: PropTypes.object,
  isLoading: PropTypes.bool,
};
export default DREDynamicView;
