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
      <div className="card-theme rounded-lg border border-light-border p-3 shadow-lg dark:border-dark-border">
        <p className="font-medium text-text-light-primary dark:text-text-dark-primary">{`${label}`}</p>
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
  {
    name: 'Jan',
    faturamento: 4000,
    lucro: 2400,
  },
  {
    name: 'Fev',
    faturamento: 3000,
    lucro: 1398,
  },
  {
    name: 'Mar',
    faturamento: 2000,
    lucro: 9800,
  },
  {
    name: 'Abr',
    faturamento: 2780,
    lucro: 3908,
  },
  {
    name: 'Mai',
    faturamento: 1890,
    lucro: 4800,
  },
  {
    name: 'Jun',
    faturamento: 2390,
    lucro: 3800,
  },
];
const lineData = [
  {
    name: 'Seg',
    atendimentos: 12,
  },
  {
    name: 'Ter',
    atendimentos: 19,
  },
  {
    name: 'Qua',
    atendimentos: 15,
  },
  {
    name: 'Qui',
    atendimentos: 22,
  },
  {
    name: 'Sex',
    atendimentos: 28,
  },
  {
    name: 'Sab',
    atendimentos: 35,
  },
  {
    name: 'Dom',
    atendimentos: 18,
  },
];
const pieData = [
  {
    name: 'Mangabeiras',
    value: 400,
    color: '#4DA3FF',
  },
  {
    name: 'Nova Lima',
    value: 300,
    color: '#1E8CFF',
  },
  {
    name: 'Centro',
    value: 200,
    color: '#E8F3FF',
  },
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
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
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">R$ 24.5K</div>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Faturamento Mensal
            </div>
            <div className="mt-1 text-sm text-feedback-light-success dark:text-feedback-dark-success">
              +12.5%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">156</div>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Atendimentos
            </div>
            <div className="mt-1 text-sm text-feedback-light-success dark:text-feedback-dark-success">
              +8.2%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">R$ 157</div>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Ticket Médio
            </div>
            <div className="mt-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
              -2.1%
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="text-center">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">73%</div>
            <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Margem de Lucro
            </div>
            <div className="mt-1 text-sm text-feedback-light-success dark:text-feedback-dark-success">
              +5.3%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  tick={{
                    fill: chartColors.textSecondary,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  tick={{
                    fill: chartColors.textSecondary,
                    fontSize: 12,
                  }}
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
                  tick={{
                    fill: chartColors.textSecondary,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  tick={{
                    fill: chartColors.textSecondary,
                    fontSize: 12,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="atendimentos"
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{
                    fill: chartColors.primary,
                    strokeWidth: 2,
                    r: 4,
                  }}
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
                {
                  name: 'João Silva',
                  atendimentos: 45,
                  receita: 'R$ 4.500',
                },
                {
                  name: 'Carlos Santos',
                  atendimentos: 38,
                  receita: 'R$ 3.800',
                },
                {
                  name: 'Pedro Lima',
                  atendimentos: 32,
                  receita: 'R$ 3.200',
                },
                {
                  name: 'Lucas Oliveira',
                  atendimentos: 28,
                  receita: 'R$ 2.800',
                },
              ].map((profissional, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-light-bg p-3 dark:bg-dark-bg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-dark-text-primary flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                        {profissional.name}
                      </div>
                      <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                        {profissional.atendimentos} atendimentos
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-primary">
                    {profissional.receita}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-light-border pt-8 dark:border-dark-border">
        <p className="text-center text-sm text-text-light-secondary dark:text-text-dark-secondary">
          📊 Dashboard Demo - Barber Analytics Pro © 2025
          <br />
          Gráficos criados com Recharts e sistema de temas personalizado
        </p>
      </div>
    </div>
  );
}
