/**
 * RELATÓRIO RECEITA X DESPESA
 * Compara evolução de receitas e despesas ao longo do tempo usando categorias
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useUnit } from '../../../context/UnitContext';
import dreService from '../../../services/dreService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
const RelatorioReceitaDespesa = ({ filters }) => {
  const { selectedUnit } = useUnit();
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('line'); // 'line' or 'bar'

  const carregarUltimosMeses = useCallback(
    async quantidade => {
      if (!selectedUnit?.id) return [];
      const dados = [];
      const hoje = new Date();
      let mes = hoje.getMonth() + 1;
      let ano = hoje.getFullYear();
      for (let i = 0; i < quantidade; i++) {
        const { data } = await dreService.getDREMensal(
          mes,
          ano,
          selectedUnit.id
        );
        if (data) {
          dados.unshift({
            mes: `${String(mes).padStart(2, '0')}/${ano}`,
            mesNum: mes,
            ano: ano,
            receitas: data.receitas.total,
            despesas: data.despesas.total,
            lucro: data.resultado.lucroLiquido,
            margem: data.resultado.margemLiquida,
          });
        }

        // Retroceder 1 mês
        mes--;
        if (mes === 0) {
          mes = 12;
          ano--;
        }
      }
      return dados;
    },
    [selectedUnit?.id]
  );
  const carregarMesesDoAno = useCallback(
    async ano => {
      if (!selectedUnit?.id) return [];
      const dados = [];
      for (let mes = 1; mes <= 12; mes++) {
        const { data } = await dreService.getDREMensal(
          mes,
          ano,
          selectedUnit.id
        );
        dados.push({
          mes: `${String(mes).padStart(2, '0')}/${ano}`,
          mesNum: mes,
          ano: ano,
          receitas: data?.receitas.total || 0,
          despesas: data?.despesas.total || 0,
          lucro: data?.resultado.lucroLiquido || 0,
          margem: data?.resultado.margemLiquida || 0,
        });
      }
      return dados;
    },
    [selectedUnit?.id]
  );
  const carregarDados = useCallback(async () => {
    if (!selectedUnit?.id || !filters?.periodo) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (filters.periodo.tipo === 'mes') {
        // Carregar últimos 6 meses
        const dados = await carregarUltimosMeses(6);
        setDadosGrafico(dados);
      } else if (filters.periodo.tipo === 'ano') {
        // Carregar todos os meses do ano
        const dados = await carregarMesesDoAno(filters.periodo.ano);
        setDadosGrafico(dados);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    selectedUnit?.id,
    filters?.periodo?.tipo,
    filters?.periodo?.ano,
    carregarUltimosMeses,
    carregarMesesDoAno,
  ]);
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);
  const formatarMoeda = valor => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor || 0);
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-theme rounded-lg border border-light-border p-4 shadow-lg dark:border-dark-border">
          <p className="mb-2 font-semibold text-text-light-primary dark:text-text-dark-primary">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm"
              style={{
                color: entry.color,
              }}
            >
              {entry.name}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-text-light-secondary dark:text-text-dark-secondary">
          Carregando dados...
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="text-danger mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Erro ao carregar dados
        </h3>
        <p className="mb-4 text-text-light-secondary dark:text-text-dark-secondary">
          {error}
        </p>
        <button
          onClick={carregarDados}
          className="text-dark-text-primary hover:bg-primary-600 rounded-lg bg-primary px-4 py-2 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  const totalReceitas = dadosGrafico.reduce(
    (sum, item) => sum + item.receitas,
    0
  );
  const totalDespesas = dadosGrafico.reduce(
    (sum, item) => sum + item.despesas,
    0
  );
  const totalLucro = totalReceitas - totalDespesas;
  const margemMedia =
    totalReceitas > 0 ? (totalLucro / totalReceitas) * 100 : 0;
  return (
    <div className="space-y-6">
      {/* KPIs do Período */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Total Receitas
              </p>
              <h3 className="text-success mt-1 text-xl font-bold">
                {formatarMoeda(totalReceitas)}
              </h3>
            </div>
            <TrendingUp className="text-success h-8 w-8 opacity-50" />
          </div>
        </div>

        <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Total Despesas
              </p>
              <h3 className="text-danger mt-1 text-xl font-bold">
                {formatarMoeda(totalDespesas)}
              </h3>
            </div>
            <TrendingDown className="text-danger h-8 w-8 opacity-50" />
          </div>
        </div>

        <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Lucro Total
              </p>
              <h3
                className={`mt-1 text-xl font-bold ${totalLucro >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {formatarMoeda(totalLucro)}
              </h3>
            </div>
            <BarChart3
              className={`h-8 w-8 opacity-50 ${totalLucro >= 0 ? 'text-success' : 'text-danger'}`}
            />
          </div>
        </div>

        <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Margem Média
              </p>
              <h3
                className={`mt-1 text-xl font-bold ${margemMedia >= 0 ? 'text-success' : 'text-danger'}`}
              >
                {margemMedia.toFixed(1)}%
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Controles do Gráfico */}
      <div className="card-theme rounded-xl border border-light-border p-4 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Evolução Temporal
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('line')}
              className={`rounded-lg px-4 py-2 transition-colors ${viewMode === 'line' ? 'bg-primary text-white' : 'bg-light-hover text-text-light-primary dark:bg-dark-hover dark:text-text-dark-primary'}`}
            >
              Linha
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`rounded-lg px-4 py-2 transition-colors ${viewMode === 'bar' ? 'bg-primary text-white' : 'bg-light-hover text-text-light-primary dark:bg-dark-hover dark:text-text-dark-primary'}`}
            >
              Barra
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border">
        <ResponsiveContainer width="100%" height={400}>
          {viewMode === 'line' ? (
            <LineChart data={dadosGrafico}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="mes"
                stroke="#9CA3AF"
                className="chart-axis-text"
              />
              <YAxis
                stroke="#9CA3AF"
                className="chart-axis-text"
                tickFormatter={value => formatarMoeda(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="receitas"
                stroke="#10B981"
                strokeWidth={3}
                name="Receitas"
                dot={{
                  fill: '#10B981',
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                }}
              />
              <Line
                type="monotone"
                dataKey="despesas"
                stroke="#EF4444"
                strokeWidth={3}
                name="Despesas"
                dot={{
                  fill: '#EF4444',
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                }}
              />
              <Line
                type="monotone"
                dataKey="lucro"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Lucro"
                dot={{
                  fill: '#3B82F6',
                  r: 5,
                }}
                activeDot={{
                  r: 7,
                }}
              />
            </LineChart>
          ) : (
            <BarChart data={dadosGrafico}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="mes"
                stroke="#9CA3AF"
                className="chart-axis-text"
              />
              <YAxis
                stroke="#9CA3AF"
                className="chart-axis-text"
                tickFormatter={value => formatarMoeda(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
              <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
              <Bar dataKey="lucro" fill="#3B82F6" name="Lucro" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Tabela de Dados */}
      <div className="card-theme overflow-hidden rounded-xl border border-light-border dark:border-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-light-hover dark:bg-dark-hover">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                  Período
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                  Receitas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                  Despesas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                  Lucro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-light-secondary dark:text-text-dark-secondary">
                  Margem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border dark:divide-dark-border">
              {dadosGrafico.map((item, index) => (
                <tr
                  key={index}
                  className="transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                    {item.mes}
                  </td>
                  <td className="text-success whitespace-nowrap px-6 py-4 text-right text-sm font-semibold">
                    {formatarMoeda(item.receitas)}
                  </td>
                  <td className="text-danger whitespace-nowrap px-6 py-4 text-right text-sm font-semibold">
                    {formatarMoeda(item.despesas)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${item.lucro >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {formatarMoeda(item.lucro)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${item.margem >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {item.margem.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default RelatorioReceitaDespesa;
