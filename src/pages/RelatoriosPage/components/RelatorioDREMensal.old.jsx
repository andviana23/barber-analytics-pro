import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileText,
  Loader,
} from 'lucide-react';
import { Card, Button } from '../../../atoms';
import relatoriosService from '../../../services/relatoriosService';
import { exportToPDF, exportToExcel } from '../../../utils/exportUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RelatorioDREMensal = ({ filters }) => {
  const [dadosDRE, setDadosDRE] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDadosDRE();
  }, []);

  const carregarDadosDRE = async () => {
    setLoading(true);
    try {
      const { success, data } = await relatoriosService.getDREMensal(
        filters.periodo.mes,
        filters.periodo.ano,
        filters.unidade
      );

      if (success && data.length > 0) {
        // Processar dados reais do Supabase
        const dreData = data[0];
        setDadosDRE({
          receitas: {
            receitaBruta: dreData.receita_bruta || 0,
            deducoes: dreData.deducoes || 0,
            receitaLiquida: dreData.receita_liquida || 0,
          },
          custos: {
            custosVariaveis: dreData.custos_variaveis || 0,
            margemContribuicao: dreData.margem_contribuicao || 0,
          },
          despesas: {
            despesasFixas: dreData.despesas_fixas || 0,
            resultadoOperacional: dreData.resultado_operacional || 0,
            depreciacaoAmortizacao: dreData.depreciacao || 0,
            lucroLiquido: dreData.lucro_liquido || 0,
          },
          comparativo: {
            mesAnterior: {
              receitaBruta: dreData.receita_bruta_anterior || 0,
              lucroLiquido: dreData.lucro_liquido_anterior || 0,
            },
            variacao: {
              receita: dreData.variacao_receita || 0,
              lucro: dreData.variacao_lucro || 0,
            },
          },
        });
      } else {
        // Fallback para dados mockados se não houver dados reais
        setDadosDRE({
          receitas: {
            receitaBruta: 45000,
            deducoes: 2500,
            receitaLiquida: 42500,
          },
          custos: {
            custosVariaveis: 12000,
            margemContribuicao: 30500,
          },
          despesas: {
            despesasFixas: 18000,
            resultadoOperacional: 12500,
            depreciacaoAmortizacao: 1500,
            lucroLiquido: 11000,
          },
          comparativo: {
            mesAnterior: {
              receitaBruta: 41000,
              lucroLiquido: 9500,
            },
            variacao: {
              receita: 9.76,
              lucro: 15.79,
            },
          },
          composicaoReceitas: [
            { name: 'Serviços', value: 35000, color: '#3B82F6' },
            { name: 'Produtos', value: 7000, color: '#10B981' },
            { name: 'Assinaturas', value: 3000, color: '#F59E0B' },
          ],
          composicaoDespesas: [
            { name: 'Salários', value: 12000, color: '#EF4444' },
            { name: 'Aluguel', value: 4000, color: '#F97316' },
            { name: 'Produtos', value: 8000, color: '#8B5CF6' },
            { name: 'Marketing', value: 2000, color: '#06B6D4' },
            { name: 'Outros', value: 4500, color: '#84CC16' },
          ],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
      // Fallback para dados mockados em caso de erro
      setDadosDRE({
        receitas: {
          receitaBruta: 45000,
          deducoes: 2500,
          receitaLiquida: 42500,
        },
        custos: {
          custosVariaveis: 12000,
          margemContribuicao: 30500,
        },
        despesas: {
          despesasFixas: 18000,
          resultadoOperacional: 12500,
          depreciacaoAmortizacao: 1500,
          lucroLiquido: 11000,
        },
        comparativo: {
          mesAnterior: {
            receitaBruta: 41000,
            lucroLiquido: 9500,
          },
          variacao: {
            receita: 9.76,
            lucro: 15.79,
          },
        },
        composicaoReceitas: [
          { name: 'Serviços', value: 35000, color: '#3B82F6' },
          { name: 'Produtos', value: 7000, color: '#10B981' },
          { name: 'Assinaturas', value: 3000, color: '#F59E0B' },
        ],
        composicaoDespesas: [
          { name: 'Salários', value: 12000, color: '#EF4444' },
          { name: 'Aluguel', value: 4000, color: '#F97316' },
          { name: 'Produtos', value: 8000, color: '#8B5CF6' },
          { name: 'Marketing', value: 2000, color: '#06B6D4' },
          { name: 'Outros', value: 4500, color: '#84CC16' },
        ],
      });
    }
    setLoading(false);
  };

  const handleExportPDF = async () => {
    const result = await exportToPDF(
      'relatorio-dre',
      `DRE_${filters.periodo.mes}_${filters.periodo.ano}`,
      `DRE Mensal - ${filters.periodo.mes}/${filters.periodo.ano}`
    );

    if (result.success) {
      alert('PDF exportado com sucesso!');
    } else {
      alert('Erro ao exportar PDF: ' + result.error);
    }
  };

  const handleExportExcel = () => {
    if (!dadosDRE) return;

    const dadosExcel = [
      { Item: '(+) Receita Bruta', Valor: dadosDRE.receitas.receitaBruta },
      { Item: '(-) Deduções', Valor: dadosDRE.receitas.deducoes },
      { Item: '(=) Receita Líquida', Valor: dadosDRE.receitas.receitaLiquida },
      { Item: '', Valor: '' },
      { Item: '(-) Custos Variáveis', Valor: dadosDRE.custos.custosVariaveis },
      {
        Item: '(=) Margem de Contribuição',
        Valor: dadosDRE.custos.margemContribuicao,
      },
      { Item: '', Valor: '' },
      { Item: '(-) Despesas Fixas', Valor: dadosDRE.despesas.despesasFixas },
      {
        Item: '(=) Resultado Operacional',
        Valor: dadosDRE.despesas.resultadoOperacional,
      },
      {
        Item: '(-) Depreciação/Amortização',
        Valor: dadosDRE.despesas.depreciacaoAmortizacao,
      },
      { Item: '(=) LUCRO LÍQUIDO', Valor: dadosDRE.despesas.lucroLiquido },
    ];

    const result = exportToExcel(
      dadosExcel,
      `DRE_${filters.periodo.mes}_${filters.periodo.ano}`
    );

    if (result.success) {
      alert('Excel exportado com sucesso!');
    } else {
      alert('Erro ao exportar Excel: ' + result.error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = value => {
    const signal = value > 0 ? '+' : '';
    return `${signal}${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            DRE - Demonstração do Resultado do Exercício
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.periodo.tipo === 'mes'
              ? `${filters.periodo.mes}/${filters.periodo.ano}`
              : 'Período selecionado'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FileText size={16} />
            <span>PDF</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={16} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receita Bruta
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dadosDRE.receitas.receitaBruta)}
              </p>
            </div>
            <div
              className={`flex items-center space-x-1 text-sm ${
                dadosDRE.comparativo.variacao.receita > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {dadosDRE.comparativo.variacao.receita > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>
                {formatPercentage(dadosDRE.comparativo.variacao.receita)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receita Líquida
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dadosDRE.receitas.receitaLiquida)}
              </p>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Margem Contribuição
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dadosDRE.custos.margemContribuicao)}
              </p>
            </div>
            <div className="text-orange-500">
              {(
                (dadosDRE.custos.margemContribuicao /
                  dadosDRE.receitas.receitaLiquida) *
                100
              ).toFixed(1)}
              %
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lucro Líquido
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dadosDRE.despesas.lucroLiquido)}
              </p>
            </div>
            <div
              className={`flex items-center space-x-1 text-sm ${
                dadosDRE.comparativo.variacao.lucro > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {dadosDRE.comparativo.variacao.lucro > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>
                {formatPercentage(dadosDRE.comparativo.variacao.lucro)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* DRE Estrutural */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Demonstração do Resultado
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-medium text-gray-900 dark:text-white">
              (+) Receita Bruta
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(dadosDRE.receitas.receitaBruta)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 ml-4">
            <span className="text-gray-600 dark:text-gray-400">
              (-) Deduções
            </span>
            <span className="text-red-600">
              {formatCurrency(dadosDRE.receitas.deducoes)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 px-4 rounded">
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              (=) Receita Líquida
            </span>
            <span className="font-semibold text-blue-900 dark:text-blue-100">
              {formatCurrency(dadosDRE.receitas.receitaLiquida)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 ml-4">
            <span className="text-gray-600 dark:text-gray-400">
              (-) Custos Variáveis
            </span>
            <span className="text-red-600">
              {formatCurrency(dadosDRE.custos.custosVariaveis)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 px-4 rounded">
            <span className="font-semibold text-green-900 dark:text-green-100">
              (=) Margem de Contribuição
            </span>
            <span className="font-semibold text-green-900 dark:text-green-100">
              {formatCurrency(dadosDRE.custos.margemContribuicao)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 ml-4">
            <span className="text-gray-600 dark:text-gray-400">
              (-) Despesas Fixas
            </span>
            <span className="text-red-600">
              {formatCurrency(dadosDRE.despesas.despesasFixas)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-900/20 px-4 rounded">
            <span className="font-semibold text-purple-900 dark:text-purple-100">
              (=) Resultado Operacional
            </span>
            <span className="font-semibold text-purple-900 dark:text-purple-100">
              {formatCurrency(dadosDRE.despesas.resultadoOperacional)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 ml-4">
            <span className="text-gray-600 dark:text-gray-400">
              (-) Depreciação/Amortização
            </span>
            <span className="text-red-600">
              {formatCurrency(dadosDRE.despesas.depreciacaoAmortizacao)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 rounded font-bold text-lg">
            <span>(=) LUCRO LÍQUIDO</span>
            <span>{formatCurrency(dadosDRE.despesas.lucroLiquido)}</span>
          </div>
        </div>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composição de Receitas */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Composição das Receitas
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosDRE.composicaoReceitas}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {dadosDRE.composicaoReceitas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={value => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Composição de Despesas */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Composição das Despesas
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosDRE.composicaoDespesas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Bar dataKey="value" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default RelatorioDREMensal;
