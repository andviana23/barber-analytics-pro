import React, { useMemo, useState } from 'react';
import { PieChart as PieChartIcon, TrendingUp, DollarSign } from 'lucide-react';

/**
 * 🥧 Componente de Gráfico de Pizza Premium
 *
 * UI/UX inspirado em Stripe Dashboard, QuickBooks e Conta Azul
 *
 * Features:
 * - Gráfico de pizza SVG interativo com animações
 * - Hover states com highlight de segmento
 * - Lista de categorias com barra de progresso
 * - Gradientes sutis e sombras modernas
 * - Dark mode completo com classes utilitárias
 * - Responsivo mobile-first
 *
 * @param {string} title - Título do card
 * @param {string} subtitle - Subtítulo do card
 * @param {Array} data - Array de objetos {name, value, percentage}
 * @param {string} type - Tipo do gráfico ('revenue' ou 'expense')
 * @param {function} formatValue - Função para formatar valores
 */
const PieChartCard = ({
  title = 'Distribuição',
  subtitle = 'Por categoria',
  data = [],
  type = 'revenue',
  formatValue = value =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }),
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Paleta de cores premium (harmonizada para dark mode)
  const colors = [
    {
      light: '#3B82F6',
      dark: '#60A5FA',
    },
    // Azul
    {
      light: '#8B5CF6',
      dark: '#A78BFA',
    },
    // Roxo
    {
      light: '#10B981',
      dark: '#34D399',
    },
    // Verde
    {
      light: '#F59E0B',
      dark: '#FBBF24',
    },
    // Amarelo
    {
      light: '#EF4444',
      dark: '#F87171',
    },
    // Vermelho
    {
      light: '#06B6D4',
      dark: '#22D3EE',
    },
    // Ciano
    {
      light: '#EC4899',
      dark: '#F472B6',
    },
    // Rosa
    {
      light: '#F97316',
      dark: '#FB923C',
    },
    // Laranja
    {
      light: '#84CC16',
      dark: '#A3E635',
    },
    // Lima
    {
      light: '#6366F1',
      dark: '#818CF8',
    }, // Indigo
  ];

  // Configurações de estilo por tipo
  const typeConfig = {
    revenue: {
      iconBg: 'bg-emerald-500',
      iconRing: 'ring-emerald-500/20',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      glowColor: 'shadow-emerald-500/10',
      Icon: TrendingUp,
    },
    expense: {
      iconBg: 'bg-rose-500',
      iconRing: 'ring-rose-500/20',
      accentColor: 'text-rose-600 dark:text-rose-400',
      glowColor: 'shadow-rose-500/10',
      Icon: DollarSign,
    },
  };
  const config = typeConfig[type] || typeConfig.revenue;

  // Calcular total
  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [data]);

  // Gerar segmentos do gráfico de pizza
  const pieSegments = useMemo(() => {
    if (!data || data.length === 0) return [];
    let currentAngle = -90; // Começar no topo (12h)
    const segments = [];
    data.forEach((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;

      // Calcular coordenadas do arco
      const radius = 85;
      const cx = 100;
      const cy = 100;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Converter ângulos para radianos
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calcular pontos do arco
      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      // Flag para arco grande (>180°)
      const largeArcFlag = angle > 180 ? 1 : 0;

      // Criar path do segmento
      const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');
      segments.push({
        path: pathData,
        color: colors[index % colors.length],
        percentage,
        name: item.name,
        value: item.value,
      });
      currentAngle = endAngle;
    });
    return segments;
  }, [data, total, colors]);

  // Estado vazio
  if (!data || data.length === 0) {
    return (
      <div className="card-theme rounded-2xl border border-light-border p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-dark-border">
        <div className="text-theme-secondary flex h-80 items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="mx-auto mb-3 h-16 w-16 opacity-20" />
            <p className="text-sm font-medium">Sem dados para exibir</p>
            <p className="mt-1 text-xs opacity-60">
              Aguardando informações do período selecionado
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card-theme rounded-2xl border border-light-border p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-dark-border">
      {/* Header Premium */}
      <div className="mb-6 flex items-center justify-between border-b border-light-border pb-4 dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div
            className={`relative p-3 ${config.iconBg} rounded-xl shadow-lg ring-4 ${config.iconRing} ${config.glowColor}`}
          >
            <config.Icon
              className="text-dark-text-primary h-5 w-5"
              strokeWidth={2.5}
            />
            {/* Glow effect */}
            <div className="card-theme/20 absolute inset-0 rounded-xl blur-sm" />
          </div>
          <div>
            <h3 className="text-theme-primary text-base font-bold tracking-tight">
              {title}
            </h3>
            <p className="text-theme-secondary mt-0.5 text-xs">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-theme-secondary text-xs font-medium">Total</p>
          <p className={`text-lg font-bold ${config.accentColor} tabular-nums`}>
            {formatValue(total)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Gráfico de Pizza SVG - Lado Esquerdo */}
        <div className="flex items-center justify-center lg:col-span-2">
          <div className="relative">
            <svg
              viewBox="0 0 200 200"
              className="h-52 w-52 drop-shadow-xl transition-transform duration-500 hover:scale-105"
            >
              {/* Fundo do círculo */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-light-border opacity-10 dark:text-dark-border"
              />

              {/* Segmentos do gráfico */}
              {pieSegments.map((segment, index) => (
                <g key={index}>
                  <path
                    d={segment.path}
                    fill={segment.color.light}
                    className={`cursor-pointer transition-all duration-300 ${hoveredIndex === index ? 'scale-105 opacity-100 drop-shadow-2xl' : hoveredIndex === null ? 'opacity-90' : 'opacity-40'}`}
                    strokeWidth="2"
                    stroke="white"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <title>{`${segment.name}: ${segment.percentage.toFixed(1)}%`}</title>
                  </path>
                </g>
              ))}

              {/* Centro do donut (opcional) */}
              <circle
                cx="100"
                cy="100"
                r="45"
                fill="white"
                className="dark:fill-dark-surface"
              />

              {/* Texto central */}
              <text
                x="100"
                y="95"
                textAnchor="middle"
                className="fill-theme-secondary text-xs font-medium"
              >
                {data.length}
              </text>
              <text
                x="100"
                y="110"
                textAnchor="middle"
                className="fill-theme-secondary text-[10px] opacity-60"
              >
                categorias
              </text>
            </svg>
          </div>
        </div>

        {/* Lista de Categorias - Lado Direito */}
        <div className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1 lg:col-span-3">
          {data.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const colorObj = colors[index % colors.length];
            return (
              <div
                key={item.name || index}
                className={`group relative rounded-xl border p-3 transition-all duration-300 ${isHovered ? 'scale-[1.02] border-light-border bg-light-bg shadow-md dark:border-dark-border dark:bg-dark-hover' : 'border-transparent bg-light-surface hover:border-light-border dark:bg-dark-surface dark:hover:border-dark-border'}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="mb-2 flex items-center justify-between">
                  {/* Nome da categoria com indicador de cor */}
                  <div className="flex flex-1 items-center gap-2.5">
                    <div
                      className={`h-2.5 w-2.5 rounded-full shadow-sm transition-transform duration-300 ${isHovered ? 'scale-150 shadow-lg' : ''}`}
                      style={{
                        backgroundColor: colorObj.light,
                        boxShadow: isHovered
                          ? `0 0 12px ${colorObj.light}80`
                          : undefined,
                      }}
                    />
                    <span className="text-theme-primary truncate text-sm font-semibold">
                      {item.name}
                    </span>
                  </div>

                  {/* Valor e Percentual */}
                  <div className="ml-2 flex items-center gap-3">
                    <span className="text-theme-secondary text-xs font-medium tabular-nums">
                      {formatValue(item.value)}
                    </span>
                    <span
                      className={`text-sm font-bold ${config.accentColor} min-w-[3rem] text-right tabular-nums`}
                    >
                      {item.percentage?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${isHovered ? 'shadow-lg' : ''}`}
                    style={{
                      width: `${item.percentage || 0}%`,
                      backgroundColor: colorObj.light,
                      boxShadow: isHovered
                        ? `0 0 8px ${colorObj.light}60`
                        : undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default PieChartCard;
