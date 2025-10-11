import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../atoms';
import { useTheme } from '../../context/ThemeContext';

// Tooltip customizado - movido para fora do componente
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-3 shadow-lg">
        <p className="text-text-light-primary dark:text-text-dark-primary font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-text-light-secondary dark:text-text-dark-secondary"
          >
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Dados de exemplo
const barData = [
  { name: 'Jan', faturamento: 4000, lucro: 2400 },
  { name: 'Fev', faturamento: 3000, lucro: 1398 },
  { name: 'Mar', faturamento: 2000, lucro: 9800 },
  { name: 'Abr', faturamento: 2780, lucro: 3908 },
  { name: 'Mai', faturamento: 1890, lucro: 4800 },
  { name: 'Jun', faturamento: 2390, lucro: 3800 },
];

const lineData = [
  { name: 'Seg', atendimentos: 12 },
  { name: 'Ter', atendimentos: 19 },
  { name: 'Qua', atendimentos: 15 },
  { name: 'Qui', atendimentos: 22 },
  { name: 'Sex', atendimentos: 28 },
  { name: 'Sab', atendimentos: 35 },
  { name: 'Dom', atendimentos: 18 },
];

const pieData = [
  { name: 'Mangabeiras', value: 400, color: '#4DA3FF' },
  { name: 'Nova Lima', value: 300, color: '#1E8CFF' },
  { name: 'Centro', value: 200, color: '#E8F3FF' },
];

export function DashboardDemo() {
  const { actualTheme } = useTheme();

  // Cores para os gráficos baseadas no tema
  const chartColors = {
    primary: '#4DA3FF',
    primaryHover: '#1E8CFF',
    success: actualTheme === 'light' ? '#16A34A' : '#22C55E',
    warning: actualTheme === 'light' ? '#F59E0B' : '#FBBF24',
    text: actualTheme === 'light' ? '#1E293B' : '#F8FAFC',
    textSecondary: actualTheme === 'light' ? '#64748B' : '#94A3B8',
    grid: actualTheme === 'light' ? '#E2E8F0' : '#334155',
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold mb-2">
          📊 Dashboard Analytics Demo
        </h1>
        <p className="text-text-light-secondary dark:text-text-dark-secondary">
          Demonstração dos gráficos com o sistema de temas - Tema atual:{' '}
          <span className="font-medium">
            {actualTheme === 'light' ? '☀️ Light' : '🌙 Dark'}
          </span>
        </p>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">R$ 24.5K</div>
            <div className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
              Faturamento Mensal
            </div>
            <div className="text-feedback-light-success dark:text-feedback-dark-success text-sm mt-1">
              +12.5%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">156</div>
            <div className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
              Atendimentos
            </div>
            <div className="text-feedback-light-success dark:text-feedback-dark-success text-sm mt-1">
              +8.2%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">R$ 157</div>
            <div className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
              Ticket Médio
            </div>
            <div className="text-feedback-light-error dark:text-feedback-dark-error text-sm mt-1">
              -2.1%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">73%</div>
            <div className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
              Margem de Lucro
            </div>
            <div className="text-feedback-light-success dark:text-feedback-dark-success text-sm mt-1">
              +5.3%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Faturamento vs Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartColors.textSecondary, fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: chartColors.textSecondary, fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="faturamento"
                  fill={chartColors.primary}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="lucro"
                  fill={chartColors.success}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Linha */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Atendimentos por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartColors.textSecondary, fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: chartColors.textSecondary, fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="atendimentos"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{
                    r: 6,
                    stroke: chartColors.primary,
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Faturamento por Unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela de Ranking */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Ranking de Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'João Silva', atendimentos: 45, receita: 'R$ 4.500' },
                {
                  name: 'Carlos Santos',
                  atendimentos: 38,
                  receita: 'R$ 3.800',
                },
                { name: 'Pedro Lima', atendimentos: 32, receita: 'R$ 3.200' },
                {
                  name: 'Lucas Oliveira',
                  atendimentos: 28,
                  receita: 'R$ 2.800',
                },
              ].map((profissional, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-text-light-primary dark:text-text-dark-primary font-medium">
                        {profissional.name}
                      </div>
                      <div className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                        {profissional.atendimentos} atendimentos
                      </div>
                    </div>
                  </div>
                  <div className="text-primary font-semibold">
                    {profissional.receita}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
        <p className="text-text-light-secondary dark:text-text-dark-secondary text-center text-sm">
          📊 Dashboard Demo - Barber Analytics Pro © 2025
          <br />
          Gráficos criados com Recharts e sistema de temas personalizado
        </p>
      </div>
    </div>
  );
}
