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
  DollarSign,
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"
          ></div>
        ))}
      </div>
    );
  }

  if (!dreData?.sucesso) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-sm">
          {dreData?.erro || 'Erro ao carregar DRE'}
        </p>
      </div>
    );
  }

  const toggle = key => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

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
          className={`flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${expandable && hasItems ? 'cursor-pointer' : ''}`}
          onClick={() => expandable && hasItems && toggle(itemKey)}
        >
          <div className="flex items-center gap-2 flex-1">
            {expandable &&
              hasItems &&
              (isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ))}
            <span
              className={`text-gray-700 dark:text-gray-300 ${bold ? 'font-bold text-base' : 'text-sm'}`}
            >
              {label}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {percent !== null && percent !== undefined && (
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                {formatPercent(percent)}
              </span>
            )}
            <span
              className={`w-32 text-right ${bold ? 'font-bold text-base' : 'text-sm'} ${value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}
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
                className="flex justify-between py-1.5 px-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {item.categoria_nome}
                </span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 px-6 py-4 border-b border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                DRE - Demonstração de Resultado
              </h2>
              <p className="text-xs text-slate-300">
                {new Date(dreData.periodo.inicio).toLocaleDateString('pt-BR')} -{' '}
                {new Date(dreData.periodo.fim).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          {dreData.metadata?.regime && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs font-medium">
              {dreData.metadata.regime}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-3">
        <Line
          label="(+) RECEITA BRUTA"
          value={dreData.receita_bruta}
          percent={dreData.percentuais?.receita_bruta}
          bold
          highlight
          expandable
          items={dreData.receitas_detalhadas}
          itemKey="receitas"
        />

        {dreData.taxa_cartao > 0 && (
          <Line
            label="(-) Taxa de Cartão"
            value={-dreData.taxa_cartao}
            percent={dreData.percentuais?.taxa_cartao}
            expandable
            items={dreData.taxa_cartao_detalhada}
            itemKey="taxa_cartao"
          />
        )}

        {dreData.deducoes > 0 && (
          <Line
            label="(-) Outras Deduções"
            value={-dreData.deducoes}
            percent={dreData.percentuais?.deducoes}
            expandable
            items={dreData.deducoes_detalhadas}
            itemKey="deducoes"
          />
        )}

        <Line
          label="= RECEITA LÍQUIDA"
          value={dreData.receita_liquida}
          percent={dreData.percentuais?.receita_liquida}
          bold
          highlight
        />

        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

        <Line
          label="(-) Custos Operacionais"
          value={-dreData.custos_operacionais}
          percent={dreData.percentuais?.custos_operacionais}
          expandable
          items={dreData.custos_detalhados}
          itemKey="custos"
        />

        <Line
          label="= MARGEM DE CONTRIBUIÇÃO"
          value={dreData.margem_contribuicao}
          percent={dreData.percentuais?.margem_contribuicao}
          bold
          highlight
        />

        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

        <Line
          label="(-) Despesas Fixas"
          value={-dreData.despesas_fixas}
          percent={dreData.percentuais?.despesas_fixas}
          expandable
          items={dreData.despesas_detalhadas}
          itemKey="despesas"
        />

        <Line
          label="= EBITDA"
          value={dreData.ebitda}
          percent={dreData.percentuais?.ebitda_margin}
          bold
          highlight
        />

        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

        {dreData.impostos > 0 && (
          <Line
            label="(-) Impostos"
            value={-dreData.impostos}
            percent={dreData.percentuais?.impostos}
            expandable
            items={dreData.impostos_detalhadas}
            itemKey="impostos"
          />
        )}

        <Line label="= EBIT" value={dreData.ebit} percent={null} bold />

        {dreData.resultado_financeiro !== 0 && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <Line
              label="(+/-) Resultado Financeiro"
              value={dreData.resultado_financeiro}
              percent={null}
            />
          </>
        )}

        <div className="border-t-2 border-gray-300 dark:border-gray-600 my-3"></div>

        <div
          className={`rounded-lg p-4 border-2 ${dreData.lucro_liquido >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dreData.lucro_liquido >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <span className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Resultado
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  LUCRO LÍQUIDO
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${dreData.lucro_liquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {formatCurrency(dreData.lucro_liquido)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Margem:{' '}
                <span className="font-semibold">
                  {formatPercent(dreData.percentuais?.margem_liquida || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/30 px-6 py-5 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Margem Contribuição
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercent(dreData.percentuais?.margem_contribuicao || 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(dreData.margem_contribuicao)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Margem EBITDA
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatPercent(dreData.percentuais?.ebitda_margin || 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(dreData.ebitda)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                Margem Líquida
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${(dreData.percentuais?.margem_liquida || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatPercent(dreData.percentuais?.margem_liquida || 0)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatCurrency(dreData.lucro_liquido)}
            </p>
          </div>
        </div>

        {dreData.metadata?.calculation_timestamp && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
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
