import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  RefreshCw,
  Calendar,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react';
import { UnitSelector } from '../../atoms';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

/**
 * Dashboard Financeiro - Design System Compliant
 * Exibe análise de 3 meses + 3 metas principais
 */
export function DashboardPage() {
  const { selectedUnit } = useUnit();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState({
    revenueGeneral: {
      current: 0,
      target: 0,
      trend: 0,
    },
    revenueSubscription: {
      current: 0,
      target: 0,
      trend: 0,
    },
    revenueProduct: {
      current: 0,
      target: 0,
      trend: 0,
    },
  });

  // Buscar dados dos últimos 3 meses
  const fetchDashboardData = async () => {
    if (!selectedUnit?.id) return;
    setLoading(true);
    try {
      const currentDate = new Date();
      const threeMonthsAgo = subMonths(currentDate, 2);

      // Buscar receitas dos últimos 3 meses
      const { data: revenues, error } = await supabase
        .from('revenues')
        .select('value, date, data_competencia, category_id, categories(name)')
        .eq('unit_id', selectedUnit.id)
        .gte(
          'data_competencia',
          format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd')
        )
        .lte('data_competencia', format(endOfMonth(currentDate), 'yyyy-MM-dd'))
        .eq('is_active', true)
        .order('data_competencia', {
          ascending: true,
        });

      if (error) {
        console.error('❌ Erro ao buscar receitas:', error); // eslint-disable-line no-console
        throw error;
      }

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-line no-undef
        console.log(
          '📊 Receitas carregadas:',
          revenues?.length || 0,
          revenues?.slice(0, 3)
        ); // eslint-disable-line no-console
      }

      // Processar dados por mês
      const monthlyData = {};
      for (let i = 0; i < 3; i++) {
        const monthDate = subMonths(currentDate, 2 - i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM/yy', {
          locale: ptBR,
        });
        monthlyData[monthKey] = {
          month: monthLabel,
          faturamentoGeral: 0,
          assinaturas: 0,
          produtos: 0,
        };
      }

      // Agregar valores
      revenues?.forEach(rev => {
        const competenciaDate = rev.data_competencia || rev.date;
        if (!competenciaDate) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-line no-undef
            console.warn('⚠️ Receita sem data:', rev); // eslint-disable-line no-console
          }
          return;
        }

        const monthKey = format(new Date(competenciaDate), 'yyyy-MM');

        if (monthlyData[monthKey]) {
          const categoryName = rev.categories?.name?.toLowerCase() || '';
          const amount = parseFloat(rev.value) || 0;

          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-line no-undef
            console.log(`📅 ${monthKey}: ${categoryName} = R$ ${amount}`); // eslint-disable-line no-console
          }

          monthlyData[monthKey].faturamentoGeral += amount;

          if (
            categoryName.includes('assinatura') ||
            categoryName.includes('clube')
          ) {
            monthlyData[monthKey].assinaturas += amount;
          }

          if (
            categoryName.includes('produto') ||
            categoryName.includes('venda')
          ) {
            monthlyData[monthKey].produtos += amount;
          }
        }
      });

      // Converter para array para o gráfico
      const chartArray = Object.values(monthlyData);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-line no-undef
        console.log('📈 Dados do gráfico:', chartArray); // eslint-disable-line no-console
      }
      setChartData(chartArray);

      // Calcular KPIs do mês atual
      const currentMonth = format(currentDate, 'yyyy-MM');
      const currentData = monthlyData[currentMonth] || {
        faturamentoGeral: 0,
        assinaturas: 0,
        produtos: 0,
      };
      const previousMonth = format(subMonths(currentDate, 1), 'yyyy-MM');
      const previousData = monthlyData[previousMonth] || {
        faturamentoGeral: 0,
        assinaturas: 0,
        produtos: 0,
      };

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-line no-undef
        console.log('📊 Dados do mês atual:', currentData); // eslint-disable-line no-console
        console.log('📊 Dados do mês anterior:', previousData); // eslint-disable-line no-console
      }

      // Buscar metas
      const currentMonthNumber = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const { data: goalsData } = await supabase
        .from('vw_goals_detailed')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .eq('goal_year', currentYear)
        .eq('goal_month', currentMonthNumber)
        .eq('is_active', true);
      const revenueGoal = goalsData?.find(
        g => g.goal_type === 'revenue_general'
      );
      const subscriptionGoal = goalsData?.find(
        g => g.goal_type === 'subscription'
      );
      const productGoal = goalsData?.find(g => g.goal_type === 'product_sales');

      // Calcular tendência (crescimento mês anterior)
      const calcTrend = (current, previous) => {
        if (!previous || previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-line no-undef
        console.log('🎯 Metas carregadas:', goalsData); // eslint-disable-line no-console
      }

      setKpis({
        revenueGeneral: {
          current: currentData.faturamentoGeral || 0,
          target: revenueGoal?.target_value || 0,
          trend: calcTrend(
            currentData.faturamentoGeral || 0,
            previousData.faturamentoGeral || 0
          ),
          achieved:
            revenueGoal?.achieved_value || currentData.faturamentoGeral || 0,
          percentage: revenueGoal?.progress_percentage || 0,
        },
        revenueSubscription: {
          current: currentData.assinaturas || 0,
          target: subscriptionGoal?.target_value || 0,
          trend: calcTrend(
            currentData.assinaturas || 0,
            previousData.assinaturas || 0
          ),
          achieved:
            subscriptionGoal?.achieved_value || currentData.assinaturas || 0,
          percentage: subscriptionGoal?.progress_percentage || 0,
        },
        revenueProduct: {
          current: currentData.produtos || 0,
          target: productGoal?.target_value || 0,
          trend: calcTrend(
            currentData.produtos || 0,
            previousData.produtos || 0
          ),
          achieved: productGoal?.achieved_value || currentData.produtos || 0,
          percentage: productGoal?.progress_percentage || 0,
        },
      });

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-line no-undef
        console.log('✅ KPIs calculados com sucesso'); // eslint-disable-line no-console
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error); // eslint-disable-line no-console
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUnit?.id) {
      fetchDashboardData();
    }
  }, [selectedUnit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="p-4 border-2 shadow-xl card-theme dark:bg-dark-surface border-light-border dark:border-dark-border rounded-xl">
        <p className="mb-2 font-bold text-theme-primary dark:text-dark-text-primary">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: entry.color,
                }}
              ></div>
              <span className="text-theme-secondary">{entry.name}:</span>
            </div>
            <span className="font-bold text-theme-primary">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="min-h-screen p-6 bg-light-bg dark:bg-dark-bg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="flex items-center gap-3 mb-2 text-4xl font-bold text-text-light-primary dark:text-text-dark-primary">
              <Activity className="w-9 h-9 text-primary" />
              Dashboard Financeiro
            </h1>
            <p className="text-lg text-text-light-secondary dark:text-text-dark-secondary">
              Análise completa de desempenho e metas
            </p>
          </div>

          <div className="flex items-center gap-4">
            <UnitSelector userId="current-user" />
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 transition-all shadow-lg btn-theme-primary rounded-xl hover:shadow-xl disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
          </div>
        </div>

        {selectedUnit && (
          <div className="inline-flex items-center gap-2 px-4 py-2 border-2 rounded-lg bg-primary-light dark:bg-primary/20 border-primary/30">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              Unidade:
            </span>
            <span className="font-bold text-primary">{selectedUnit.name}</span>
          </div>
        )}
      </div>

      {/* 3 Cards de Metas Principais */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <MetaCard
          title="Faturamento Geral"
          icon={DollarSign}
          color="from-green-500 to-emerald-600"
          iconBg="bg-green-100 dark:bg-green-900/40"
          iconColor="text-green-600 dark:text-green-400"
          current={kpis.revenueGeneral.achieved}
          target={kpis.revenueGeneral.target}
          percentage={kpis.revenueGeneral.percentage}
          trend={kpis.revenueGeneral.trend}
          loading={loading}
        />

        <MetaCard
          title="Assinaturas"
          subtitle="Clube Trato"
          icon={Users}
          color="from-blue-500 to-cyan-600"
          iconBg="bg-blue-100 dark:bg-blue-900/40"
          iconColor="text-blue-600 dark:text-blue-400"
          current={kpis.revenueSubscription.achieved}
          target={kpis.revenueSubscription.target}
          percentage={kpis.revenueSubscription.percentage}
          trend={kpis.revenueSubscription.trend}
          loading={loading}
        />

        <MetaCard
          title="Produtos"
          subtitle="Vendas"
          icon={Package}
          color="from-purple-500 to-pink-600"
          iconBg="bg-purple-100 dark:bg-purple-900/40"
          iconColor="text-purple-600 dark:text-purple-400"
          current={kpis.revenueProduct.achieved}
          target={kpis.revenueProduct.target}
          percentage={kpis.revenueProduct.percentage}
          trend={kpis.revenueProduct.trend}
          loading={loading}
        />
      </div>

      {/* Gráfico de Linha - 3 Meses */}
      <div className="p-8 mb-8 shadow-2xl card-theme rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
              <TrendingUp className="w-7 h-7 text-primary" />
              Evolução Trimestral
            </h2>
            <p className="mt-1 text-text-light-secondary dark:text-text-dark-secondary">
              Análise comparativa dos últimos 3 meses
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-primary-light dark:bg-primary/20">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
              3 Meses
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-text-light-secondary dark:text-text-dark-secondary">
                Carregando dados...
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="month"
                stroke="#6B7280"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
              <YAxis
                stroke="#6B7280"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: '14px',
                  fontWeight: 600,
                }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="faturamentoGeral"
                name="Faturamento Geral"
                stroke="#10B981"
                strokeWidth={3}
                dot={{
                  fill: '#10B981',
                  r: 6,
                }}
                activeDot={{
                  r: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="assinaturas"
                name="Assinaturas"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{
                  fill: '#3B82F6',
                  r: 6,
                }}
                activeDot={{
                  r: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="produtos"
                name="Produtos"
                stroke="#A855F7"
                strokeWidth={3}
                dot={{
                  fill: '#A855F7',
                  r: 6,
                }}
                activeDot={{
                  r: 8,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Insights Rápidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <InsightCard
          title="Tendência Geral"
          value={kpis.revenueGeneral?.trend || 0}
          description="Crescimento em relação ao mês anterior"
          type="trend"
        />
        <InsightCard
          title="Melhor Performance"
          value={Math.max(
            kpis.revenueGeneral?.percentage || 0,
            kpis.revenueSubscription?.percentage || 0,
            kpis.revenueProduct?.percentage || 0
          )}
          description="Meta com maior atingimento"
          type="performance"
        />
        <InsightCard
          title="Total do Mês"
          value={kpis.revenueGeneral?.achieved || 0}
          description="Faturamento acumulado"
          type="total"
        />
      </div>
    </div>
  );
}

// Componente de Card de Meta
const MetaCard = ({
  title,
  subtitle,
  icon: Icon,
  color,
  iconBg,
  iconColor,
  current,
  target,
  percentage,
  trend,
  loading,
}) => {
  const isAchieved = percentage >= 100;
  const isOnTrack = percentage >= 80;
  if (loading) {
    return (
      <div className="p-6 shadow-lg card-theme rounded-2xl animate-pulse">
        <div className="h-16 mb-4 bg-light-surface dark:bg-dark-hover rounded-xl"></div>
        <div className="h-10 mb-3 rounded bg-light-surface dark:bg-dark-hover"></div>
        <div className="h-3 rounded bg-light-surface dark:bg-dark-hover"></div>
      </div>
    );
  }
  return (
    <div
      className={`card-theme p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 ${isAchieved ? 'border-green-300 dark:border-green-700' : 'border-light-border dark:border-dark-border'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${iconBg} shadow-md`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {isAchieved && (
          <Award className="w-6 h-6 text-green-500 animate-pulse" />
        )}
      </div>

      {/* Valor Atual */}
      <div className="mb-3">
        <div className="mb-1 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(current)}
        </div>
        <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
          Meta:{' '}
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(target)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1 text-xs">
          <span className="font-medium text-text-light-secondary dark:text-text-dark-secondary">
            Progresso
          </span>
          <span
            className={`font-bold ${isAchieved ? 'text-green-600 dark:text-green-400' : isOnTrack ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {(percentage || 0).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-light-surface dark:bg-dark-hover rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-1000`}
            style={{
              width: `${Math.min(100, percentage || 0)}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-2">
        {(trend || 0) >= 0 ? (
          <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
        )}
        <span
          className={`text-sm font-semibold ${(trend || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {Math.abs(trend || 0).toFixed(1)}%
        </span>
        <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          vs mês anterior
        </span>
      </div>
    </div>
  );
};

// Componente de Insight Card
const InsightCard = ({ title, value, description, type }) => {
  // Validar valor para evitar NaN ou undefined
  const safeValue =
    isNaN(value) || value === null || value === undefined ? 0 : value;

  const getConfig = () => {
    switch (type) {
      case 'trend':
        return {
          icon: TrendingUp,
          color:
            safeValue >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400',
          bgColor:
            safeValue >= 0
              ? 'bg-green-100 dark:bg-green-900/40'
              : 'bg-red-100 dark:bg-red-900/40',
          format: v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`,
        };
      case 'performance':
        return {
          icon: Award,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/40',
          format: v => `${v.toFixed(1)}%`,
        };
      case 'total':
        return {
          icon: DollarSign,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/40',
          format: v =>
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(v),
        };
      default:
        return {
          icon: Sparkles,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          format: v => v,
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className="p-6 transition-shadow shadow-lg card-theme rounded-2xl hover:shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-3 rounded-xl ${config.bgColor}`}>
          <IconComponent className={`w-6 h-6 ${config.color}`} />
        </div>
        <h3 className="font-bold text-text-light-primary dark:text-text-dark-primary">
          {title}
        </h3>
      </div>

      <div className={`text-3xl font-bold ${config.color} mb-2`}>
        {config.format(safeValue)}
      </div>

      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
        {description}
      </p>
    </div>
  );
};
