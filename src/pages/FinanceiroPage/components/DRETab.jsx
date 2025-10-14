import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Printer
} from 'lucide-react';
import { Button } from '../../../atoms';
import { ChartComponent } from '../../../molecules';
import financeiroService from '../../../services/financeiroService';
import { exportDREToCSV, generateHTMLReport } from '../../../utils';

export default function DRETab({ filters }) {
  const [dreData, setDreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparativoMensal, setComparativoMensal] = useState([]);

  const fetchDREData = useCallback(async () => {
    try {
      setLoading(true);
      const dre = await financeiroService.getDRE(filters);
      setDreData(dre);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar DRE:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDREData();
    fetchComparativoMensal();
  }, [fetchDREData, fetchComparativoMensal]);

  const fetchComparativoMensal = useCallback(async () => {
    try {
      const dados = await financeiroService.getComparativoMensal();
      setComparativoMensal(dados);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar comparativo mensal:', error);
    }
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const handleExportCSV = () => {
    if (!dreData) return;
    
    const periodo = `${filters.startDate.toLocaleDateString('pt-BR')} a ${filters.endDate.toLocaleDateString('pt-BR')}`;
    exportDREToCSV(dreData, periodo);
  };

  const handleExportHTML = () => {
    if (!dreData) return;
    
    const periodo = `${filters.startDate.toLocaleDateString('pt-BR')} a ${filters.endDate.toLocaleDateString('pt-BR')}`;
    generateHTMLReport(dreData, [], [], periodo);
  };

  const getVariationColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-600" />
            Demonstrativo de Resultado (DRE)
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Período: {dreData?.periodo || 'Sem dados'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchDREData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          {/* Botões de Exportação */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleExportHTML}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DRE Estruturado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Estrutura do DRE
          </h3>

          <div className="space-y-4">
            {/* Receita Bruta */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-900 dark:text-white">
                  (+) Receita Bruta
                </span>
              </div>
              <span className="font-bold text-green-600">
                {formatCurrency(dreData?.receitaBruta)}
              </span>
            </div>

            {/* Deduções */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">
                (-) Deduções (taxas, cancelamentos)
              </span>
              <span className="text-red-600">
                {formatCurrency(dreData?.deducoes)}
              </span>
            </div>

            {/* Receita Líquida */}
            <div className="flex items-center justify-between py-3 border-y border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                (=) Receita Líquida
              </span>
              <span className="font-bold text-blue-600">
                {formatCurrency(dreData?.receitaLiquida)}
              </span>
            </div>

            {/* Custos Variáveis */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">
                (-) Custos Variáveis
              </span>
              <span className="text-red-600">
                {formatCurrency(dreData?.custosVariaveis)}
              </span>
            </div>

            {/* Margem de Contribuição */}
            <div className="flex items-center justify-between py-3 border-y border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
              <span className="font-semibold text-green-900 dark:text-green-100">
                (=) Margem de Contribuição
              </span>
              <span className="font-bold text-green-600">
                {formatCurrency(dreData?.margemContribuicao)}
              </span>
            </div>

            {/* Despesas Fixas */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">
                (-) Despesas Fixas
              </span>
              <span className="text-red-600">
                {formatCurrency(dreData?.despesasFixas)}
              </span>
            </div>

            {/* Resultado Operacional */}
            <div className="flex items-center justify-between py-3 border-y border-gray-200 dark:border-gray-600 bg-purple-50 dark:bg-purple-900/20">
              <span className="font-semibold text-purple-900 dark:text-purple-100">
                (=) Resultado Operacional (EBITDA)
              </span>
              <span className={`font-bold ${getVariationColor(dreData?.resultadoOperacional)}`}>
                {formatCurrency(dreData?.resultadoOperacional)}
              </span>
            </div>

            {/* Depreciação */}
            <div className="flex items-center justify-between py-2 pl-4">
              <span className="text-gray-600 dark:text-gray-400">
                (-) Depreciação/Amortização
              </span>
              <span className="text-red-600">
                {formatCurrency(dreData?.depreciacao)}
              </span>
            </div>

            {/* Lucro Líquido */}
            <div className="flex items-center justify-between py-4 border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  (=) LUCRO LÍQUIDO
                </span>
              </div>
              <span className={`font-bold text-xl ${getVariationColor(dreData?.lucroLiquido)}`}>
                {formatCurrency(dreData?.lucroLiquido)}
              </span>
            </div>

            {/* Margem Líquida */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Margem Líquida:
              </span>
              <span className={`font-semibold ${getVariationColor(dreData?.margemLiquida)}`}>
                {(dreData?.margemLiquida || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Análise e Gráficos */}
        <div className="space-y-6">
          {/* KPIs Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Receita Líquida
                </span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(dreData?.receitaLiquida)}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Despesas
                </span>
              </div>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency((dreData?.custosVariaveis || 0) + (dreData?.despesasFixas || 0))}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  EBITDA
                </span>
              </div>
              <span className={`text-lg font-bold ${getVariationColor(dreData?.resultadoOperacional)}`}>
                {formatCurrency(dreData?.resultadoOperacional)}
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Margem %
                </span>
              </div>
              <span className={`text-lg font-bold ${getVariationColor(dreData?.margemLiquida)}`}>
                {(dreData?.margemLiquida || 0).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Gráfico de evolução */}
          {comparativoMensal.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evolução Financeira (12 meses)
              </h4>
              <ChartComponent
                type="line"
                data={comparativoMensal}
                height={250}
                config={{
                  xDataKey: 'mes',
                  lines: [
                    { dataKey: 'receitas', name: 'Receitas', stroke: '#10b981' },
                    { dataKey: 'despesas', name: 'Despesas', stroke: '#ef4444' },
                    { dataKey: 'lucro', name: 'Lucro Líquido', stroke: '#3b82f6' }
                  ]
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Análises Detalhadas */}
      {dreData?.detalhes && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Composição de Receitas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Composição de Receitas
            </h4>
            <div className="space-y-3">
              {Object.entries(dreData.detalhes.receitas || {}).map(([tipo, valor]) => (
                <div key={tipo} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{tipo}</span>
                  <span className="font-medium text-green-600">{formatCurrency(valor)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Composição de Despesas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Composição de Despesas
            </h4>
            <div className="space-y-3">
              {Object.entries({ 
                ...dreData.detalhes.despesas?.fixas || {}, 
                ...dreData.detalhes.despesas?.variaveis || {} 
              }).map(([categoria, valor]) => (
                <div key={categoria} className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">{categoria}</span>
                  <span className="font-medium text-red-600">{formatCurrency(valor)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alertas e Recomendações */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          📊 Análise Automática
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-900 dark:text-blue-100">
                <strong>Margem Líquida:</strong> {(dreData?.margemLiquida || 0).toFixed(1)}%
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {(dreData?.margemLiquida || 0) >= 15 
                  ? "Excelente! Margem saudável." 
                  : (dreData?.margemLiquida || 0) >= 10 
                    ? "Boa margem, pode melhorar." 
                    : "Atenção: margem baixa."}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-900 dark:text-blue-100">
                <strong>Resultado:</strong> {dreData?.lucroLiquido >= 0 ? "Lucro" : "Prejuízo"}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {dreData?.lucroLiquido >= 0 
                  ? "Parabéns! Negócio rentável." 
                  : "Revisar custos e estratégias."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}