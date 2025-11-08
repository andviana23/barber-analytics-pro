import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  LineChart,
} from 'lucide-react';
import { UnitSelector } from '../../atoms';
import { useUnit } from '../../context/UnitContext';
import { supabase } from '../../services/supabase';
import { MetasCard } from '../../components/finance/MetasCard';
import { useGoalsSummary } from '../../hooks';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente para KPIs principais
const MainKPI = ({
  title,
  value,
  target,
  percentage,
  icon: Icon,
  color,
  trend,
  subtitle,
  loading = false,
}) => {
  const isPositive = percentage >= 0;
  const isAboveTarget = percentage >= 100;
  return (
    <div className="card-theme rounded-2xl border border-light-border p-6 shadow-sm transition-shadow hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-3 ${color}`}>
            <Icon className="text-dark-text-primary h-6 w-6" />
          </div>
          <div>
            <h3 className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm font-semibold uppercase tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-theme-secondary dark:text-theme-secondary mt-1 text-xs">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-sm font-bold ${isAboveTarget ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
        >
          {percentage}%
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-theme-primary dark:text-dark-text-primary text-3xl font-bold">
          {loading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          ) : (
            new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value)
          )}
        </div>

        {target > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Meta:
              </span>
              <span className="text-theme-primary dark:text-dark-text-primary font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(target)}
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isAboveTarget ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                  width: `${Math.min(100, Math.max(0, percentage))}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Tendência */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {trend > 0 ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{Math.abs(trend)}% vs. mês anterior</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para gráfico de linha
const LineChartCard = ({
  title,
  data,
  targetLine,
  height = 300,
  loading = false,
  color = '#3b82f6',
  targetColor = '#6b7280',
}) => {
  if (loading) {
    return (
      <div className="card-theme rounded-2xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }
  const maxValue = Math.max(...data.map(d => d.value), targetLine || 0);
  const minValue = Math.min(...data.map(d => d.value), targetLine || 0);
  const range = maxValue - minValue;
  return (
    <div className="card-theme rounded-2xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
      <h3 className="text-theme-primary dark:text-dark-text-primary mb-6 text-lg font-semibold">
        {title}
      </h3>

      <div
        className="relative"
        style={{
          height: `${height}px`,
        }}
      >
        {/* Linha de meta */}
        {targetLine && (
          <div
            className="absolute w-full border-t-2 border-dashed opacity-60"
            style={{
              bottom: `${((targetLine - minValue) / range) * 100}%`,
              borderColor: targetColor,
            }}
          >
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute -top-6 left-0 text-xs">
              Meta:{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(targetLine)}
            </span>
          </div>
        )}

        {/* Gráfico de linha */}
        <svg className="h-full w-full" viewBox="0 0 400 200">
          {data.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = data[index - 1];
            const x1 = (index - 1) * (400 / (data.length - 1));
            const y1 = 200 - ((prevPoint.value - minValue) / range) * 200;
            const x2 = index * (400 / (data.length - 1));
            const y2 = 200 - ((point.value - minValue) / range) * 200;
            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth="3"
                fill="none"
              />
            );
          })}

          {/* Pontos */}
          {data.map((point, index) => {
            const x = index * (400 / (data.length - 1));
            const y = 200 - ((point.value - minValue) / range) * 200;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={color}
                className="hover:r-6 transition-all"
              />
            );
          })}
        </svg>

        {/* Labels do eixo X */}
        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-4 flex justify-between text-xs">
          {data.map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente para alertas e insights
const AlertCard = ({ type, title, message, action }) => {
  const isPositive = type === 'success';
  return (
    <div
      className={`rounded-xl border-l-4 p-4 ${isPositive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-1 ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
        >
          {isPositive ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <h4
            className={`font-semibold ${isPositive ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}
          >
            {title}
          </h4>
          <p
            className={`mt-1 text-sm ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
          >
            {message}
          </p>
          {action && (
            <button
              className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} hover:underline`}
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export function DashboardPage() {
  const { selectedUnit, selectUnit } = useUnit();

  // Hook para buscar metas do mês atual
  const {
    goals: monthlyGoals,
    loading: goalsLoading,
    refetch: refetchGoals,
  } = useGoalsSummary(selectedUnit?.id);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      revenue: {
        value: 0,
        target: 0,
        percentage: 0,
        trend: 0,
      },
      subscriptions: {
        value: 0,
        target: 0,
        percentage: 0,
        trend: 0,
      },
      averageTicket: {
        value: 0,
        trend: 0,
      },
      margin: {
        value: 0,
        target: 20,
        trend: 0,
      },
    },
    monthlyData: [],
    alerts: [],
    loading: true,
  });

  // Unidades já vêm do UnitContext; não precisamos buscar aqui

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    if (!selectedUnit?.id) return;
    setDashboardData(prev => ({
      ...prev,
      loading: true,
    }));
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Buscar metas
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .eq('goal_year', currentYear)
        .eq('goal_month', currentMonth)
        .eq('is_active', true);

      // Buscar receitas do mês atual
      const { data: revenues } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .gte('date', startOfMonth(currentDate).toISOString().split('T')[0])
        .lte('date', endOfMonth(currentDate).toISOString().split('T')[0]);

      // Buscar despesas do mês atual
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .gte('date', startOfMonth(currentDate).toISOString().split('T')[0])
        .lte('date', endOfMonth(currentDate).toISOString().split('T')[0]);

      // Buscar assinaturas ativas
      const { data: subscriptions } = await supabase
        .from('revenues')
        .select('*')
        .eq('unit_id', selectedUnit.id)
        .eq('type', 'subscription')
        .eq('status', 'Received');

      // Calcular KPIs
      const totalRevenue =
        revenues?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
      const totalExpenses =
        expenses?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
      const totalSubscriptions = subscriptions?.length || 0;
      const averageTicket =
        revenues?.length > 0 ? totalRevenue / revenues.length : 0;
      const margin =
        totalRevenue > 0
          ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
          : 0;

      // Buscar metas específicas
      const revenueGoal =
        goals?.find(g => g.goal_type === 'revenue_general')?.target_value ||
        120000;
      const subscriptionGoal =
        goals?.find(g => g.goal_type === 'subscription')?.target_value || 50;

      // Calcular percentuais de atingimento
      const revenuePercentage =
        revenueGoal > 0 ? Math.round((totalRevenue / revenueGoal) * 100) : 0;
      const subscriptionPercentage =
        subscriptionGoal > 0
          ? Math.round((totalSubscriptions / subscriptionGoal) * 100)
          : 0;

      // Dados mensais (últimos 3 meses)
      const monthlyData = [];
      const months = eachMonthOfInterval({
        start: subMonths(currentDate, 2),
        end: currentDate,
      });
      for (const month of months) {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthRevenues =
          revenues?.filter(r => {
            const revenueDate = new Date(r.date);
            return revenueDate >= monthStart && revenueDate <= monthEnd;
          }) || [];
        const monthExpenses =
          expenses?.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          }) || [];
        const monthRevenue = monthRevenues.reduce(
          (sum, r) => sum + (r.value || 0),
          0
        );
        const monthExpense = monthExpenses.reduce(
          (sum, e) => sum + (e.value || 0),
          0
        );
        const monthMargin =
          monthRevenue > 0
            ? ((monthRevenue - monthExpense) / monthRevenue) * 100
            : 0;
        monthlyData.push({
          label: format(month, 'MMM', {
            locale: ptBR,
          }),
          value: monthRevenue,
          margin: monthMargin,
        });
      }

      // Gerar alertas
      const alerts = [];
      if (margin < 20) {
        alerts.push({
          type: 'warning',
          title: 'Margem Operacional Baixa',
          message: `Margem atual de ${margin.toFixed(1)}% está abaixo do alvo de 20%. Revisar custos de equipe.`,
          action: 'Ver Relatório de Custos',
        });
      }
      if (averageTicket < 50) {
        alerts.push({
          type: 'warning',
          title: 'Ticket Médio Baixo',
          message: `Ticket médio de R$ ${averageTicket.toFixed(2)} está baixo. Reforçar upsell e plano fidelidade.`,
          action: 'Ver Estratégias de Upsell',
        });
      }
      if (revenuePercentage > 100) {
        alerts.push({
          type: 'success',
          title: 'Meta de Receita Atingida!',
          message: `Receita mensal ultrapassou meta em +${revenuePercentage - 100}%.`,
          action: 'Ver Relatório Detalhado',
        });
      }
      setDashboardData({
        kpis: {
          revenue: {
            value: totalRevenue,
            target: revenueGoal,
            percentage: revenuePercentage,
            trend: 15, // Simulado
          },
          subscriptions: {
            value: totalSubscriptions,
            target: subscriptionGoal,
            percentage: subscriptionPercentage,
            trend: 8, // Simulado
          },
          averageTicket: {
            value: averageTicket,
            trend: -5, // Simulado
          },
          margin: {
            value: margin,
            target: 20,
            trend: -2, // Simulado
          },
        },
        monthlyData,
        alerts,
        loading: false,
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
      }));
    }
  };
  useEffect(() => {
    if (selectedUnit?.id) {
      fetchDashboardData();
    }
  }, [selectedUnit]);
  return (
    <div className="min-h-screen bg-light-bg p-6 dark:bg-dark-bg dark:bg-dark-surface">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary mb-2 text-3xl font-bold">
              Dashboard Financeiro Geral
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Visão completa dos indicadores financeiros e metas
            </p>
          </div>

          <div className="flex items-center gap-4">
            <UnitSelector userId="current-user" />
            <button
              onClick={fetchDashboardData}
              className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>

        {selectedUnit && (
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Visualizando:{' '}
            <span className="font-semibold">{selectedUnit.name}</span>
          </div>
        )}
      </div>

      {/* 1. Indicadores Principais - Linha Superior */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MainKPI
          title="Meta de Receita Geral"
          value={dashboardData.kpis.revenue.value}
          target={dashboardData.kpis.revenue.target}
          percentage={dashboardData.kpis.revenue.percentage}
          trend={dashboardData.kpis.revenue.trend}
          icon={DollarSign}
          color="bg-blue-500"
          subtitle="Valor definido para o mês"
          loading={dashboardData.loading}
        />

        <MainKPI
          title="Meta de Assinaturas"
          value={dashboardData.kpis.subscriptions.value}
          target={dashboardData.kpis.subscriptions.target}
          percentage={dashboardData.kpis.subscriptions.percentage}
          trend={dashboardData.kpis.subscriptions.trend}
          icon={Users}
          color="bg-green-500"
          subtitle="Clube Trato - Total planejado"
          loading={dashboardData.loading}
        />

        <MainKPI
          title="Ticket Médio Diário"
          value={dashboardData.kpis.averageTicket.value}
          trend={dashboardData.kpis.averageTicket.trend}
          icon={BarChart3}
          color="bg-purple-500"
          subtitle="Receita média por atendimento"
          loading={dashboardData.loading}
        />

        <MainKPI
          title="Margem Operacional"
          value={dashboardData.kpis.margin.value}
          target={dashboardData.kpis.margin.target}
          percentage={Math.round(
            (dashboardData.kpis.margin.value /
              dashboardData.kpis.margin.target) *
              100
          )}
          trend={dashboardData.kpis.margin.trend}
          icon={TrendingUp}
          color="bg-orange-500"
          subtitle="Lucro líquido ÷ Receita total"
          loading={dashboardData.loading}
        />
      </div>

      {/* 2. Metas do Mês - Card de Resumo */}
      <div className="mb-8">
        <MetasCard
          goals={monthlyGoals}
          loading={goalsLoading}
          unitName={selectedUnit?.name}
        />
      </div>

      {/* 3. Visualização Gráfica - Bloco do Meio */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Receita Realizada vs. Meta Mensal"
          data={dashboardData.monthlyData?.map(item => ({
            label: item.label,
            value: item.value,
          }))}
          targetLine={dashboardData.kpis.revenue.target}
          loading={dashboardData.loading}
          color="#3b82f6"
          targetColor="#6b7280"
        />

        <LineChartCard
          title="Margem Operacional (3 meses)"
          data={dashboardData.monthlyData?.map(item => ({
            label: item.label,
            value: item.margin,
          }))}
          targetLine={20}
          loading={dashboardData.loading}
          color="#f59e0b"
          targetColor="#ef4444"
        />
      </div>

      {/* 3. Insights e Ações Rápidas - Base do Dashboard */}
      <div className="space-y-4">
        <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
          Insights e Alertas Automáticos
        </h3>

        {dashboardData.loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, index) => (
              <div
                key={index}
                className="card-theme animate-pulse rounded-xl p-6 dark:bg-dark-surface"
              >
                <div className="mb-2 h-4 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-96 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        ) : dashboardData.alerts.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.alerts.map((alert, index) => (
              <AlertCard
                key={index}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                action={alert.action}
              />
            ))}
          </div>
        ) : (
          <div className="card-theme rounded-xl border border-light-border p-6 text-center dark:border-dark-border dark:bg-dark-surface">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h4 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
              Tudo nos Trilhos! 🎉
            </h4>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Todos os indicadores estão dentro dos parâmetros esperados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
