/**
 * RELATÓRIO DRE MENSAL - UI Premium
 * Demonstração do Resultado do Exercício com categorias expandíveis
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  FileText,
  Loader,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useUnit } from '../../../context/UnitContext';
import dreService from '../../../services/dreService';
const RelatorioDREMensal = ({ filters }) => {
  const { selectedUnit } = useUnit();
  const [dadosDRE, setDadosDRE] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    receitas: true,
    custosVariaveis: false,
    despesasOperacionais: false,
  });
  const toggleSection = section => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const carregarDadosDRE = useCallback(async () => {
    if (!selectedUnit?.id || !filters?.periodo?.mes || !filters?.periodo?.ano) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: dreError } = await dreService.calculateMonthDRE(
        selectedUnit.id,
        filters.periodo.ano,
        filters.periodo.mes
      );
      if (dreError) {
        throw new Error(dreError.message || dreError);
      }
      console.log('📊 DRE Data recebida:', data);
      console.log('📊 Estrutura:', {
        temReceitas: !!data?.receitas,
        temReceitaBruta: !!data?.receita_bruta,
        temDespesas: !!data?.despesas,
        keys: Object.keys(data || {}),
      });
      setDadosDRE(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar DRE');
      console.error('Erro ao carregar DRE:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedUnit?.id, filters?.periodo?.mes, filters?.periodo?.ano]);
  useEffect(() => {
    carregarDadosDRE();
  }, [carregarDadosDRE]);
  const formatarMoeda = valor => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor || 0);
  };
  const formatarMes = mes => {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return meses[mes - 1] || '';
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-danger mb-4" />
        <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Erro ao carregar DRE
        </h3>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 text-center max-w-md">
          {error}
        </p>
        <button
          onClick={carregarDadosDRE}
          className="px-6 py-3 bg-primary text-dark-text-primary rounded-lg hover:bg-primary-600 transition-all duration-200 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  if (!dadosDRE) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-text-light-secondary dark:text-text-dark-secondary mx-auto mb-4 opacity-50" />
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg">
          Nenhum dado encontrado para o período selecionado
        </p>
      </div>
    );
  }

  // Verificar se tem a estrutura esperada
  if (!dadosDRE.receitas && !dadosDRE.receita_bruta) {
    console.error('❌ Estrutura de DRE inválida:', dadosDRE);
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-warning mb-4" />
        <h3 className="text-xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-2">
          Estrutura de dados inválida
        </h3>
        <p className="text-text-light-secondary dark:text-text-dark-secondary mb-6 text-center max-w-md">
          Os dados do DRE estão em um formato não reconhecido. Verifique o
          console para mais detalhes.
        </p>
        <button
          onClick={carregarDadosDRE}
          className="px-6 py-3 bg-primary text-dark-text-primary rounded-lg hover:bg-primary-600 transition-all duration-200 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Calcular estrutura do DRE - com fallback para múltiplas estruturas
  const receitaBruta =
    dadosDRE.receitas?.total || dadosDRE.receita_bruta?.total || 0;
  const categoriasReceitas =
    dadosDRE.receitas?.categorias || dadosDRE.receita_bruta?.categorias || [];
  const deducoes = dadosDRE.deducoes?.total || 0;
  const receitaLiquida = dadosDRE.receita_liquida || receitaBruta - deducoes;

  // Buscar categorias de despesas - aceitar múltiplas estruturas
  const todasCategoriasDespesas = dadosDRE.despesas?.categorias || [
    ...(dadosDRE.custos_operacionais?.categorias || []),
    ...(dadosDRE.despesas_administrativas?.categorias || []),
  ];
  const categoriasCustosVariaveis = todasCategoriasDespesas.filter(cat => {
    const nome = cat.categoria_nome || cat.name || '';
    const pai = cat.categoria_pai || cat.parent || '';
    return (
      nome.toLowerCase().includes('custo') ||
      nome.toLowerCase().includes('variável') ||
      nome.toLowerCase().includes('variavel') ||
      nome.toLowerCase().includes('operacion') ||
      pai.toLowerCase().includes('operacion')
    );
  });
  const custosVariaveis = categoriasCustosVariaveis.reduce(
    (sum, cat) => sum + (cat.valor || cat.value || 0),
    0
  );
  const margemContribuicao =
    dadosDRE.margem_contribuicao || receitaLiquida - custosVariaveis;
  const categoriasDespesasOperacionais = todasCategoriasDespesas.filter(cat => {
    const nome = cat.categoria_nome || cat.name || '';
    const pai = cat.categoria_pai || cat.parent || '';
    return (
      nome.toLowerCase().includes('administrativa') ||
      nome.toLowerCase().includes('fixa') ||
      pai.toLowerCase().includes('administrativa') ||
      pai.toLowerCase().includes('fixa')
    );
  });
  const despesasOperacionais = categoriasDespesasOperacionais.reduce(
    (sum, cat) => sum + (cat.valor || cat.value || 0),
    0
  );
  const resultadoOperacional =
    dadosDRE.ebit || margemContribuicao - despesasOperacionais;
  const impostos = dadosDRE.impostos?.total || 0;
  const lucroLiquido =
    dadosDRE.lucro_liquido || resultadoOperacional - impostos;

  // Calcular margens
  const margemContribuicaoPct =
    receitaLiquida > 0 ? (margemContribuicao / receitaLiquida) * 100 : 0;
  const margemOperacionalPct =
    receitaLiquida > 0 ? (resultadoOperacional / receitaLiquida) * 100 : 0;
  const margemLiquidaPct =
    receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
  return (
    <div className="space-y-6">
      {/* Header Card - Melhorado */}
      <div className="bg-indigo-500/20 dark:bg-indigo-500/30 rounded-3xl p-8 border-2 border-indigo-200/50 dark:border-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
            <FileText
              className="w-9 h-9 text-dark-text-primary"
              strokeWidth={2.5}
            />
          </div>
          <div>
                      <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-primary">
              DRE Mensal
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg mt-1 font-medium">
              Demonstração de Resultado do Exercício Completa
            </p>
          </div>
        </div>
      </div>

      {/* DRE Principal - UI Premium */}
      <div className="card-theme rounded-3xl overflow-hidden shadow-2xl">
        {/* Período - Header Melhorado */}
        <div className="bg-gradient-primary px-8 py-6">
          <h2 className="text-2xl font-bold text-dark-text-primary drop-shadow-lg">
            Demonstração do Resultado do Exercício
          </h2>
          <p className="text-dark-text-primary/90 text-sm mt-2 font-medium flex items-center gap-2">
            <span className="px-3 py-1 card-theme/20 rounded-full backdrop-blur-sm">
              Período: {formatarMes(filters.periodo.mes)}/{filters.periodo.ano}
            </span>
          </p>
        </div>

        {/* Linhas do DRE com Categorias */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
          {/* (+) RECEITA BRUTA - Expandível */}
          <div>
            <button
              onClick={() => toggleSection('receitas')}
              className="w-full px-8 py-5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {expandedSections.receitas ? (
                    <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                  )}
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    (+) Receita Bruta
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                  {formatarMoeda(receitaBruta)}
                </span>
              </div>
            </button>

            {/* Categorias de Receita */}
            {expandedSections.receitas && categoriasReceitas.length > 0 && (
              <div className="bg-emerald-50/30 dark:bg-emerald-900/5 border-t border-emerald-100 dark:border-emerald-900/20">
                {categoriasReceitas.map((categoria, idx) => (
                  <div
                    key={categoria.categoria_id || categoria.id || idx}
                    className="border-b border-emerald-100/50 dark:border-emerald-900/10 last:border-b-0"
                  >
                    <div className="px-8 py-3 pl-20 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {categoria.categoria_nome ||
                            categoria.name ||
                            'Sem nome'}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatarMoeda(
                            categoria.valor || categoria.value || 0
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Subcategorias */}
                    {categoria.subcategorias &&
                      categoria.subcategorias.length > 0 && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/5">
                          {categoria.subcategorias.map((sub, subIdx) => (
                            <div
                              key={sub.id || subIdx}
                              className="px-8 py-2 pl-28 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/10 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-2">
                                  <span className="text-emerald-400">└─</span>
                                  {sub.name || 'Sem nome'}
                                </span>
                                <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                                  {formatarMoeda(sub.value || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* (=) RECEITA LÍQUIDA */}
          <div className="px-8 py-5 bg-blue-100/50 dark:bg-blue-900/20 border-y-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-sm">
                  =
                </span>
                Receita Líquida
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {formatarMoeda(receitaLiquida)}
              </span>
            </div>
          </div>

          {/* (-) CUSTOS VARIÁVEIS - Expandível */}
          {categoriasCustosVariaveis.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('custosVariaveis')}
                className="w-full px-8 py-5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.custosVariaveis ? (
                      <ChevronDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                    )}
                    <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-lg font-bold text-red-700 dark:text-red-400">
                      (-) Custos Variáveis
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">
                    {formatarMoeda(custosVariaveis)}
                  </span>
                </div>
              </button>

              {/* Categorias de Custos */}
              {expandedSections.custosVariaveis && (
                <div className="bg-red-50/30 dark:bg-red-900/5 border-t border-red-100 dark:border-red-900/20">
                  {categoriasCustosVariaveis.map((categoria, idx) => (
                    <div
                      key={categoria.categoria_id || categoria.id || idx}
                      className="border-b border-red-100/50 dark:border-red-900/10 last:border-b-0"
                    >
                      <div className="px-8 py-3 pl-20 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            {categoria.categoria_nome ||
                              categoria.name ||
                              'Sem nome'}
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatarMoeda(
                              categoria.valor || categoria.value || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Subcategorias */}
                      {categoria.subcategorias &&
                        categoria.subcategorias.length > 0 && (
                          <div className="bg-red-50/50 dark:bg-red-900/5">
                            {categoria.subcategorias.map((sub, subIdx) => (
                              <div
                                key={sub.id || subIdx}
                                className="px-8 py-2 pl-28 hover:bg-red-100/50 dark:hover:bg-red-900/10 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-2">
                                    <span className="text-red-400">└─</span>
                                    {sub.name || 'Sem nome'}
                                  </span>
                                  <span className="text-xs font-semibold text-red-500 dark:text-red-400">
                                    {formatarMoeda(sub.value || 0)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* (=) MARGEM DE CONTRIBUIÇÃO */}
          <div className="px-8 py-5 bg-green-100/50 dark:bg-green-900/20 border-y-2 border-green-300 dark:border-green-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded text-sm">
                  =
                </span>
                Margem de Contribuição
              </span>
              <span className="text-lg font-bold text-green-700 dark:text-green-300">
                {formatarMoeda(margemContribuicao)}
              </span>
            </div>
          </div>

          {/* (-) DESPESAS OPERACIONAIS - Expandível */}
          {categoriasDespesasOperacionais.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('despesasOperacionais')}
                className="w-full px-8 py-5 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSections.despesasOperacionais ? (
                      <ChevronDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
                    )}
                    <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                      (-) Despesas Operacionais
                    </span>
                  </div>
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                    {formatarMoeda(despesasOperacionais)}
                  </span>
                </div>
              </button>

              {/* Categorias de Despesas */}
              {expandedSections.despesasOperacionais && (
                <div className="bg-orange-50/30 dark:bg-orange-900/5 border-t border-orange-100 dark:border-orange-900/20">
                  {categoriasDespesasOperacionais.map((categoria, idx) => (
                    <div
                      key={categoria.categoria_id || categoria.id || idx}
                      className="border-b border-orange-100/50 dark:border-orange-900/10 last:border-b-0"
                    >
                      <div className="px-8 py-3 pl-20 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            {categoria.categoria_nome ||
                              categoria.name ||
                              'Sem nome'}
                          </span>
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {formatarMoeda(
                              categoria.valor || categoria.value || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Subcategorias */}
                      {categoria.subcategorias &&
                        categoria.subcategorias.length > 0 && (
                          <div className="bg-orange-50/50 dark:bg-orange-900/5">
                            {categoria.subcategorias.map((sub, subIdx) => (
                              <div
                                key={sub.id || subIdx}
                                className="px-8 py-2 pl-28 hover:bg-orange-100/50 dark:hover:bg-orange-900/10 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center gap-2">
                                    <span className="text-orange-400">└─</span>
                                    {sub.name || 'Sem nome'}
                                  </span>
                                  <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">
                                    {formatarMoeda(sub.value || 0)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* (=) RESULTADO OPERACIONAL */}
          <div className="px-8 py-5 bg-purple-100/50 dark:bg-purple-900/20 border-y-2 border-purple-300 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-800 rounded text-sm">
                  =
                </span>
                Resultado Operacional
              </span>
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {formatarMoeda(resultadoOperacional)}
              </span>
            </div>
          </div>

          {/* (=) LUCRO LÍQUIDO - Destaque Especial */}
                    {/* (=) LUCRO LÍQUIDO - Final Destacado */}
          <div className="px-8 py-7 bg-gradient-primary shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-dark-text-primary uppercase tracking-wider flex items-center gap-3 drop-shadow-lg">
                <span className="px-3 py-1 card-theme/30 rounded-lg text-lg backdrop-blur-sm">
                  =
                </span>
                LUCRO LÍQUIDO
              </span>
              <span className="text-2xl font-black text-dark-text-primary drop-shadow-lg">
                {formatarMoeda(lucroLiquido)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Margens - UI Premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Margem de Contribuição */}
        <div className="relative overflow-hidden bg-green-100 dark:bg-green-900/30 rounded-3xl p-8 border-2 border-green-300/50 dark:border-green-600/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
          <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-3 uppercase tracking-wide">
            Margem de Contribuição
          </p>
          <p className="text-5xl font-black text-green-700 dark:text-green-400 drop-shadow-sm">
            {margemContribuicaoPct.toFixed(1)}%
          </p>
        </div>

        {/* Margem Operacional */}
        <div className="relative overflow-hidden bg-orange-100 dark:bg-orange-900/30 rounded-3xl p-8 border-2 border-orange-300/50 dark:border-orange-600/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
          <p className="text-sm font-bold text-orange-800 dark:text-orange-300 mb-3 uppercase tracking-wide">
            Margem Operacional
          </p>
          <p className="text-5xl font-black text-orange-700 dark:text-orange-400 drop-shadow-sm">
            {margemOperacionalPct.toFixed(1)}%
          </p>
        </div>

        {/* Margem Líquida */}
        <div className="relative overflow-hidden bg-blue-100 dark:bg-blue-900/30 rounded-3xl p-8 border-2 border-blue-300/50 dark:border-blue-600/30 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 uppercase tracking-wide">
            Margem Líquida
          </p>
          <p
            className={`text-5xl font-black drop-shadow-sm ${lucroLiquido >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400'}`}
          >
            {margemLiquidaPct.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};
export default RelatorioDREMensal;
