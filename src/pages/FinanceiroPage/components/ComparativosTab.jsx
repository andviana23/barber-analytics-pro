import React, { useState, useEffect } from 'react';
import { BarChart3, Building2, TrendingUp, Calendar } from 'lucide-react';
import { ChartComponent } from '../../../molecules';
import financeiroService from '../../../services/financeiroService';

export default function ComparativosTab({ filters }) {
  const [comparativoUnidades, setComparativoUnidades] = useState([]);
  const [analiseCategorias, setAnaliseCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComparativos = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const [unidades, categorias] = await Promise.all([
        financeiroService.getComparativoUnidades(filters),
        financeiroService.getAnaliseCategorias(filters)
      ]);
      
      setComparativoUnidades(unidades);
      setAnaliseCategorias(categorias);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao buscar comparativos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComparativos();
  }, [fetchComparativos]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-purple-600" />
          Análises e Comparativos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Comparativo entre unidades e análise de categorias de despesas
        </p>
      </div>

      {/* Comparativo entre Unidades */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Comparativo entre Unidades
        </h3>

        {comparativoUnidades.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela de dados */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Unidade
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Receitas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Despesas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Lucro
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Margem %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {comparativoUnidades.map((unidade) => (
                    <tr key={unidade.unitId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {unidade.unitName}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {formatCurrency(unidade.receitas)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatCurrency(unidade.despesas)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        unidade.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(unidade.lucro)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        unidade.margem >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {unidade.margem.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gráfico */}
            <div>
              <ChartComponent
                type="bar"
                data={comparativoUnidades.map(u => ({
                  name: u.unitName,
                  receitas: u.receitas,
                  despesas: u.despesas,
                  lucro: u.lucro
                }))}
                height={300}
                config={{
                  xDataKey: 'name',
                  bars: [
                    { dataKey: 'receitas', name: 'Receitas', fill: '#10b981' },
                    { dataKey: 'despesas', name: 'Despesas', fill: '#ef4444' },
                    { dataKey: 'lucro', name: 'Lucro', fill: '#3b82f6' }
                  ]
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum dado disponível para comparativo entre unidades</p>
          </div>
        )}
      </div>

      {/* Análise de Categorias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Análise por Categoria de Despesas
        </h3>

        {analiseCategorias.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de categorias */}
            <div className="space-y-3">
              {analiseCategorias.slice(0, 8).map((categoria, index) => (
                <div key={categoria.categoria} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-orange-500' :
                      index === 2 ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {categoria.categoria}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      categoria.tipo === 'fixa' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {categoria.tipo}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(categoria.valor)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {categoria.percentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico de pizza */}
            <div>
              <ChartComponent
                type="pie"
                data={analiseCategorias.slice(0, 6).map(c => ({
                  name: c.categoria,
                  value: c.valor,
                  percentage: c.percentual
                }))}
                height={300}
                config={{
                  dataKey: 'value',
                  nameKey: 'name'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma categoria de despesa encontrada</p>
          </div>
        )}
      </div>

      {/* Resumo e Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
          💡 Insights Automáticos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {comparativoUnidades.length > 0 && (
            <div>
              <p className="text-purple-900 dark:text-purple-100 font-medium">
                Melhor Unidade: {comparativoUnidades.reduce((prev, current) => 
                  (prev.margem > current.margem) ? prev : current
                ).unitName}
              </p>
              <p className="text-purple-700 dark:text-purple-300">
                Com margem de {comparativoUnidades.reduce((prev, current) => 
                  (prev.margem > current.margem) ? prev : current
                ).margem.toFixed(1)}%
              </p>
            </div>
          )}
          
          {analiseCategorias.length > 0 && (
            <div>
              <p className="text-purple-900 dark:text-purple-100 font-medium">
                Maior Despesa: {analiseCategorias[0]?.categoria}
              </p>
              <p className="text-purple-700 dark:text-purple-300">
                Representa {analiseCategorias[0]?.percentual.toFixed(1)}% do total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}