/**
 * UNITS STATS COMPONENT
 *
 * Componente para exibir estatísticas detalhadas das unidades
 */

import React from 'react';
import { Card } from '../../atoms';
import { KPICard } from '../../molecules';

// Icons
import {
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Trophy,
  TrendingUp,
} from 'lucide-react';
const UnitsStats = ({ units = [], loading = false }) => {
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  // Calcular estatísticas globais
  const globalStats = units.reduce(
    (acc, unit) => {
      if (!unit.stats) return acc;
      return {
        totalRevenue:
          acc.totalRevenue + (unit.stats.financial?.monthlyRevenue || 0),
        totalExpenses:
          acc.totalExpenses + (unit.stats.financial?.monthlyExpenses || 0),
        totalProfessionals:
          acc.totalProfessionals + (unit.stats.professionals?.total || 0),
        totalAttendances:
          acc.totalAttendances + (unit.stats.attendances?.count || 0),
      };
    },
    {
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfessionals: 0,
      totalAttendances: 0,
    }
  );
  const globalProfit = globalStats.totalRevenue - globalStats.totalExpenses;
  const averageTicket =
    globalStats.totalAttendances > 0
      ? globalStats.totalRevenue / globalStats.totalAttendances
      : 0;

  // Encontrar melhor unidade por diferentes métricas
  const topUnitByRevenue = units.reduce((best, unit) => {
    if (!unit.stats || !best.stats) return unit.stats ? unit : best;
    return (unit.stats.financial?.monthlyRevenue || 0) >
      (best.stats.financial?.monthlyRevenue || 0)
      ? unit
      : best;
  }, units[0]);
  const topUnitByAttendances = units.reduce((best, unit) => {
    if (!unit.stats || !best.stats) return unit.stats ? unit : best;
    return (unit.stats.attendances?.count || 0) >
      (best.stats.attendances?.count || 0)
      ? unit
      : best;
  }, units[0]);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted ml-2">
          Carregando estatísticas...
        </span>
      </div>
    );
  }
  if (units.length === 0) {
    return (
      <Card className="p-8 text-center">
        <BarChart3 className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
          Sem dados para exibir
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Não há estatísticas disponíveis para as unidades
        </p>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Estatísticas Globais */}
      <div>
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
          Visão Geral da Rede
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Faturamento Total"
            value={formatCurrency(globalStats.totalRevenue)}
            icon={<DollarSign className="h-6 w-6" />}
            trend={{
              value: 0,
              isPositive: true,
            }}
            className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
          />

          <KPICard
            title="Lucro Líquido"
            value={formatCurrency(globalProfit)}
            icon={<TrendingUp className="h-6 w-6" />}
            trend={{
              value: 0,
              isPositive: globalProfit >= 0,
            }}
            className={`${globalProfit >= 0 ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}
          />

          <KPICard
            title="Total de Profissionais"
            value={globalStats.totalProfessionals}
            icon={<Users className="h-6 w-6" />}
            trend={{
              value: 0,
              isPositive: true,
            }}
            className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20"
          />

          <KPICard
            title="Ticket Médio"
            value={formatCurrency(averageTicket)}
            icon={<BarChart3 className="h-6 w-6" />}
            trend={{
              value: 0,
              isPositive: true,
            }}
            className="border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20"
          />
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
          Destaques do Mês
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {topUnitByRevenue?.stats && (
            <Card className="border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Trophy className="mr-3 h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Maior Faturamento
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {topUnitByRevenue.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      topUnitByRevenue.stats.financial.monthlyRevenue
                    )}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Lucro:{' '}
                    {formatCurrency(topUnitByRevenue.stats.financial.profit)}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {topUnitByAttendances?.stats && (
            <Card className="border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
                  <div>
                    <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Mais Atendimentos
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {topUnitByAttendances.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {topUnitByAttendances.stats.attendances.count}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Ticket:{' '}
                    {formatCurrency(
                      topUnitByAttendances.stats.attendances.averageTicket
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Detalhes por Unidade */}
      <div>
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
          Desempenho por Unidade
        </h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {units.map(unit => (
            <Card key={unit.id} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="mr-3 h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
                      {unit.name}
                    </h4>
                    <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                      {unit.stats?.professionals.total || 0} profissionais
                    </p>
                  </div>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-medium ${unit.status ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  {unit.status ? 'Ativa' : 'Inativa'}
                </div>
              </div>

              {unit.stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                      Faturamento
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(unit.stats.financial.monthlyRevenue)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                      Atendimentos
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {unit.stats.attendances.count}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                      Lucro
                    </div>
                    <div
                      className={`text-lg font-semibold ${unit.stats.financial.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(unit.stats.financial.profit)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                      Ticket Médio
                    </div>
                    <div className="text-lg font-semibold text-purple-600">
                      {formatCurrency(unit.stats.attendances.averageTicket)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted py-4 text-center">
                  Estatísticas não disponíveis
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
export default UnitsStats;
