import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Componente de gráfico usando Recharts
 * @param {object} props
 * @param {string} props.type - Tipo do gráfico: 'line', 'area', 'bar', 'pie'
 * @param {Array} props.data - Dados para o gráfico
 * @param {string} props.title - Título do gráfico
 * @param {number} props.height - Altura do gráfico (padrão: 300)
 * @param {object} props.config - Configurações específicas do gráfico
 * @param {boolean} props.loading - Estado de carregamento
 */
const ChartComponent = ({
  type = 'line',
  data = [],
  title,
  height = 300,
  config = {},
  loading = false,
}) => {
  // Cores padrão para os gráficos
  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#84cc16',
    '#f97316',
  ];

  // Configurações padrão por tipo de gráfico
  const defaultConfigs = {
    line: {
      xDataKey: 'month',
      lines: [
        {
          dataKey: 'revenues',
          name: 'Receitas',
          stroke: colors[0],
        },
        {
          dataKey: 'expenses',
          name: 'Despesas',
          stroke: colors[3],
        },
        {
          dataKey: 'profit',
          name: 'Lucro',
          stroke: colors[1],
        },
      ],
    },
    area: {
      xDataKey: 'month',
      areas: [
        {
          dataKey: 'revenues',
          name: 'Receitas',
          fill: colors[0],
        },
        {
          dataKey: 'expenses',
          name: 'Despesas',
          fill: colors[3],
        },
      ],
    },
    bar: {
      xDataKey: 'name',
      bars: [
        {
          dataKey: 'value',
          name: 'Valor',
          fill: colors[0],
        },
      ],
    },
    pie: {
      dataKey: 'value',
      nameKey: 'name',
    },
  };
  const chartConfig = {
    ...defaultConfigs[type],
    ...config,
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };
  const formatTooltip = (value, name) => {
    if (typeof value === 'number') {
      if (
        name?.toLowerCase().includes('receita') ||
        name?.toLowerCase().includes('despesa') ||
        name?.toLowerCase().includes('lucro')
      ) {
        return formatCurrency(value);
      }
    }
    return value;
  };
  if (loading) {
    return (
      <div
        className="card-theme animate-pulse rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface"
        style={{
          height: height + 100,
        }}
      >
        {title && (
          <div className="mb-4 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
        )}
        <div className="card-theme h-full rounded dark:bg-gray-700"></div>
      </div>
    );
  }
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey={chartConfig.xDataKey}
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
            />
            <YAxis
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {chartConfig.lines?.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                name={line.name}
                strokeWidth={2}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey={chartConfig.xDataKey}
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
            />
            <YAxis
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {chartConfig.areas?.map((area, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={area.dataKey}
                stackId="1"
                stroke={area.fill}
                fill={area.fill}
                name={area.name}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey={chartConfig.xDataKey}
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
            />
            <YAxis
              className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {chartConfig.bars?.map((bar, index) => (
              <Bar
                key={index}
                dataKey={bar.dataKey}
                fill={bar.fill}
                name={bar.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={chartConfig.dataKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
          </PieChart>
        );
      default:
        return <div>Tipo de gráfico não suportado: {type}</div>;
    }
  };
  return (
    <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
      {title && (
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};
export default ChartComponent;
