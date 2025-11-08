import React from 'react';
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  CreditCard,
  ArrowRight,
  Zap,
  Award,
  AlertTriangle,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente MetasCard - Design Profissional Enterprise
 * Exibe resumo das metas financeiras com UI/UX de alto nível
 * Integrado 100% com o sistema financeiro
 */
export const MetasCard = ({ goals, loading, unitName }) => {
  const navigate = useNavigate();
  const getGoalTypeInfo = type => {
    const types = {
      revenue_general: {
        label: 'Faturamento',
        icon: DollarSign,
        gradient: 'from-green-500 to-emerald-600',
        lightBg: 'from-green-50 to-emerald-50',
        darkBg: 'from-green-900/20 to-emerald-900/20',
        iconColor: 'text-green-600 dark:text-green-400',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
      },
      subscription: {
        label: 'Assinaturas',
        icon: Users,
        gradient: 'from-blue-500 to-cyan-600',
        lightBg: 'from-blue-50 to-cyan-50',
        darkBg: 'from-blue-900/20 to-cyan-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      },
      product_sales: {
        label: 'Produtos',
        icon: Package,
        gradient: 'from-purple-500 to-pink-600',
        lightBg: 'from-purple-50 to-pink-50',
        darkBg: 'from-purple-900/20 to-pink-900/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      },
      expenses: {
        label: 'Despesas',
        icon: CreditCard,
        gradient: 'from-red-500 to-rose-600',
        lightBg: 'from-red-50 to-rose-50',
        darkBg: 'from-red-900/20 to-rose-900/20',
        iconColor: 'text-red-600 dark:text-red-400',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
      },
      profit: {
        label: 'Lucro',
        icon: TrendingUp,
        gradient: 'from-orange-500 to-amber-600',
        lightBg: 'from-orange-50 to-amber-50',
        darkBg: 'from-orange-900/20 to-amber-900/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
        iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      },
    };
    return (
      types[type] || {
        label: type,
        icon: Target,
        gradient: 'from-gray-500 to-gray-600',
        lightBg: 'from-gray-50 to-gray-50',
        darkBg: 'from-gray-900/20 to-gray-900/20',
        iconColor: 'text-gray-600',
        iconBg: 'bg-gray-100',
      }
    );
  };
  const getStatusInfo = status => {
    const statuses = {
      achieved: {
        label: 'Meta Batida',
        icon: Award,
        textColor: 'text-green-700 dark:text-green-300',
        badgeBg: 'bg-green-500',
        progressGradient: 'from-green-500 to-emerald-600',
        glowColor: 'shadow-green-500/30',
        pulseColor: 'bg-green-400',
      },
      on_track: {
        label: 'No Caminho',
        icon: TrendingUp,
        textColor: 'text-blue-700 dark:text-blue-300',
        badgeBg: 'bg-blue-500',
        progressGradient: 'from-blue-500 to-cyan-600',
        glowColor: 'shadow-blue-500/30',
        pulseColor: 'bg-blue-400',
      },
      behind: {
        label: 'Atrasado',
        icon: Clock,
        textColor: 'text-yellow-700 dark:text-yellow-300',
        badgeBg: 'bg-yellow-500',
        progressGradient: 'from-yellow-500 to-orange-600',
        glowColor: 'shadow-yellow-500/30',
        pulseColor: 'bg-yellow-400',
      },
      critical: {
        label: 'Crítico',
        icon: AlertTriangle,
        textColor: 'text-red-700 dark:text-red-300',
        badgeBg: 'bg-red-500',
        progressGradient: 'from-red-500 to-rose-600',
        glowColor: 'shadow-red-500/30',
        pulseColor: 'bg-red-400',
      },
    };
    return statuses[status] || statuses.critical;
  };
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };
  const formatPercent = value => {
    if (!value && value !== 0) return '0%';
    return `${value.toFixed(1).replace('.', ',')}%`;
  };
  if (loading) {
    return (
      <div className="card-theme rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <div className="mb-2 h-7 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl bg-gradient-light dark:from-gray-700/50 dark:to-gray-600/50"
            ></div>
          ))}
        </div>
      </div>
    );
  }
  if (!goals || goals.length === 0) {
    return (
      <div className="card-theme rounded-3xl p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg shadow-blue-500/30">
                <Target className="text-dark-text-primary h-7 w-7" />
              </div>
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-blue-400"></div>
            </div>
            <div>
              <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-2 text-2xl font-bold">
                Metas do Mês
                <Sparkles className="h-5 w-5 text-blue-500" />
              </h3>
              {unitName && (
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm font-medium">
                  {unitName}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="py-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 shadow-lg dark:bg-gray-700">
            <Target className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary h-10 w-10" />
          </div>
          <h4 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
            Nenhuma meta cadastrada
          </h4>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mx-auto mb-6 max-w-sm">
            Defina suas metas mensais para acompanhar o desempenho da unidade
          </p>
          <button
            onClick={() => navigate('/cadastros/metas')}
            className="text-dark-text-primary inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/40"
          >
            <Target className="h-5 w-5" />
            Cadastrar Metas
          </button>
        </div>
      </div>
    );
  }

  // Priorizar metas principais
  const sortedGoals = [...goals].sort((a, b) => {
    const priority = {
      profit: 1,
      revenue_general: 2,
      subscription: 3,
      product_sales: 4,
      expenses: 5,
    };
    return (priority[a.goal_type] || 99) - (priority[b.goal_type] || 99);
  });
  const displayGoals = sortedGoals.slice(0, 5);
  return (
    <div className="card-theme hover:shadow-3xl rounded-3xl p-8 shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-lg shadow-blue-500/30">
              <Target className="text-dark-text-primary h-7 w-7" />
            </div>
            <div className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-blue-400"></div>
          </div>
          <div>
            <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-2 text-2xl font-bold">
              Metas do Mês
              <Sparkles className="h-5 w-5 text-blue-500" />
            </h3>
            {unitName && (
              <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm font-medium">
                {unitName}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/cadastros/metas')}
          className="text-dark-text-primary group flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/40"
        >
          Ver todas
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Goals Grid */}
      <div className="space-y-5">
        {displayGoals.map(goal => {
          const typeInfo = getGoalTypeInfo(goal.goal_type);
          const statusInfo = getStatusInfo(goal.status);
          const TypeIcon = typeInfo.icon;
          const StatusIcon = statusInfo.icon;
          const percentage = goal.progress_percentage || 0;
          const isAchieved = goal.status === 'achieved';
          return (
            <div
              key={goal.id}
              onClick={() => navigate('/cadastros/metas')}
              className={`group relative overflow-hidden rounded-2xl border-2 ${isAchieved ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-700 dark:from-green-900/30 dark:to-emerald-900/20' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-800/50 dark:to-gray-900/50'} cursor-pointer p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${statusInfo.glowColor}`}
            >
              {/* Background Pattern */}
              <div className="absolute right-0 top-0 h-40 w-40 opacity-5 dark:opacity-10">
                <TypeIcon className="h-full w-full" />
              </div>

              {/* Content */}
              <div className="relative">
                {/* Header Row */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-3 ${typeInfo.iconBg} shadow-md transition-transform duration-300 group-hover:scale-110`}
                    >
                      <TypeIcon className={`h-6 w-6 ${typeInfo.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="text-theme-primary dark:text-dark-text-primary mb-1 text-lg font-bold">
                        {typeInfo.label}
                      </h4>
                      <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm font-medium">
                        Meta: {formatCurrency(goal.target_value)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusInfo.badgeBg} text-white shadow-lg ${statusInfo.glowColor}`}
                  >
                    <StatusIcon className="h-4 w-4" />
                    <span className="text-sm font-bold">
                      {formatPercent(percentage)}
                    </span>
                    {isAchieved && (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 shadow-inner dark:bg-gray-700">
                    <div
                      className={`absolute left-0 top-0 h-full bg-gradient-to-r ${statusInfo.progressGradient} rounded-full shadow-lg transition-all duration-1000 ease-out`}
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                      }}
                    >
                      <div className="card-theme/30 absolute right-0 top-0 h-full w-2 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Values Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="dark:text-theme-secondary text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">
                      Atingido:
                    </span>
                    <span className="text-theme-primary dark:text-dark-text-primary text-base font-bold">
                      {formatCurrency(goal.achieved_value)}
                    </span>
                  </div>

                  {goal.remaining_value > 0 && !isAchieved && (
                    <div className="card-theme flex items-center gap-2 rounded-lg px-3 py-1.5 dark:bg-gray-700/50">
                      <Target className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
                      <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs font-semibold">
                        Faltam: {formatCurrency(goal.remaining_value)}
                      </span>
                    </div>
                  )}

                  {isAchieved && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1.5 dark:bg-green-900/40">
                      <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-bold text-green-700 dark:text-green-300">
                        META BATIDA! 🎉
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
                <ArrowRight className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {goals.length > 5 && (
        <button
          onClick={() => navigate('/cadastros/metas')}
          className="mt-6 w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 py-3 text-sm font-bold text-blue-600 transition-all duration-300 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
        >
          + {goals.length - 5} metas adicionais
        </button>
      )}
    </div>
  );
};
