/**
 * UNITS COMPARISON COMPONENT
 *
 * Componente para comparação visual entre unidades
 */

import React from 'react';
import { Card } from '../../atoms';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Icons
import { ChartBarIcon, Building2 } from 'lucide-react';
const UnitsComparison = ({ units = [], loading = false }) => {
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  // Preparar dados para gráficos
  const barChartData = units
    .filter(unit => unit.stats)
    .map(unit => ({
      name: unit.name,
      faturamento: unit.stats.financial?.monthlyRevenue || 0,
      lucro: unit.stats.financial?.profit || 0,
      atendimentos: unit.stats.attendances?.count || 0,
      profissionais: unit.stats.professionals?.total || 0,
    }));

  // Dados para gráfico de pizza (distribuição de faturamento)
  const pieChartData = units
    .filter(unit => unit.stats && unit.stats.financial?.monthlyRevenue > 0)
    .map(unit => ({
      name: unit.name,
      value: unit.stats.financial.monthlyRevenue,
      percentage: 0, // Será calculado depois
    }));

  // Calcular percentuais para o gráfico de pizza
  const totalRevenue = pieChartData.reduce((sum, unit) => sum + unit.value, 0);
  pieChartData.forEach(unit => {
    unit.percentage =
      totalRevenue > 0 ? ((unit.value / totalRevenue) * 100).toFixed(1) : 0;
  });

  // Cores para os gráficos
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
  ];

  // Custom tooltip para valores monetários
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="card-theme dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-theme-primary dark:text-dark-text-primary">
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
              {entry.name === 'faturamento' || entry.name === 'lucro'
                ? `${entry.name}: ${formatCurrency(entry.value)}`
                : `${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label para gráfico de pizza
  const PieCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Carregando comparativo...
        </span>
      </div>
    );
  }
  if (barChartData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <ChartBarIcon className="h-16 w-16 text-light-text-muted dark:text-dark-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary mb-2">
          Sem dados para comparar
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Não há dados suficientes para gerar comparativos entre as unidades
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Comparativo de Faturamento e Lucro */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
            Faturamento vs Lucro por Unidade
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Comparativo financeiro entre as unidades no mês atual
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="faturamento"
                name="Faturamento"
                fill="#10B981"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="lucro"
                name="Lucro"
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid com dois gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Faturamento */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
              Distribuição de Faturamento
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              Participação de cada unidade no faturamento total
            </p>
          </div>

          {pieChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={PieCustomLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => [formatCurrency(value), 'Faturamento']}
                    labelFormatter={label => `Unidade: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Sem dados de faturamento para exibir
            </div>
          )}
        </Card>

        {/* Comparativo de Atendimentos e Profissionais */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
              Atendimentos vs Profissionais
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              Relação entre equipe e volume de atendimentos
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="atendimentos"
                  name="Atendimentos"
                  fill="#F59E0B"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="profissionais"
                  name="Profissionais"
                  fill="#8B5CF6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabela Comparativa */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
            Resumo Comparativo
          </h3>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Tabela detalhada com todas as métricas por unidade
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-light-bg dark:bg-dark-bg dark:bg-dark-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Unidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Faturamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Lucro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Atendimentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Profissionais
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                  Eficiência
                </th>
              </tr>
            </thead>
            <tbody className="card-theme dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
              {barChartData.map((unit, index) => (
                <tr
                  key={unit.name}
                  className={
                    index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-light-text-muted dark:text-dark-text-muted mr-2" />
                      <div className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
                        {unit.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCurrency(unit.faturamento)}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${unit.lucro >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(unit.lucro)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {unit.atendimentos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                    {unit.profissionais}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                    {unit.profissionais > 0
                      ? `${(unit.faturamento / unit.profissionais / 1000).toFixed(1)}k/prof`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
export default UnitsComparison;
