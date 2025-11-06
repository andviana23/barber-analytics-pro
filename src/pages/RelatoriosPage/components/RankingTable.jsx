/**
 * @file RankingTable.jsx
 * @description Tabela de ranking de profissionais com badges e métricas
 * @module RelatoriosPage/Components
 */

import React from 'react';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Componente de badge de performance
 */
const PerformanceBadge = ({ badge }) => {
  const badges = {
    top_10: {
      label: 'Top 10%',
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      icon: Trophy,
    },
    top_25: {
      label: 'Top 25%',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      icon: Medal,
    },
    above_avg: {
      label: 'Acima da Média',
      color:
        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      icon: Award,
    },
    below_avg: {
      label: 'Abaixo da Média',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      icon: Minus,
    },
  };
  const badgeInfo = badges[badge] || badges.below_avg;
  const Icon = badgeInfo.icon;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeInfo.color}`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {badgeInfo.label}
    </span>
  );
};

/**
 * Componente de ícone de tendência
 */
const TrendIcon = ({ trend }) => {
  if (!trend || trend === 'stable') {
    return <Minus className="text-theme-secondary h-4 w-4" />;
  }
  if (trend === 'up') {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  return <TrendingDown className="h-4 w-4 text-red-500" />;
};

/**
 * Componente de linha da tabela
 */
const RankingRow = ({ professional, index }) => {
  const getRankColor = rank => {
    if (rank === 1) return 'text-yellow-600 font-bold';
    if (rank === 2) return 'text-gray-500 font-semibold';
    if (rank === 3) return 'text-orange-600 font-semibold';
    return 'text-gray-700 dark:text-gray-300';
  };
  return (
    <tr
      className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700/50"
      data-testid={`ranking-row-${index + 1}`}
    >
      {/* Posição */}
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center space-x-2">
          <span
            className={`text-lg font-bold ${getRankColor(professional.rank_by_revenue)}`}
          >
            #{professional.rank_by_revenue}
          </span>
          <TrendIcon trend={professional.trend} />
        </div>
      </td>

      {/* Profissional */}
      <td className="whitespace-nowrap px-6 py-4">
        <div className="flex items-center">
          <div className="text-dark-text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold">
            {professional.professional_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="ml-4">
            <div className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
              {professional.professional_name || 'N/A'}
            </div>
            <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              {professional.unit_name || 'N/A'}
            </div>
          </div>
        </div>
      </td>

      {/* Badge */}
      <td className="whitespace-nowrap px-6 py-4">
        <PerformanceBadge badge={professional.performance_badge} />
      </td>

      {/* Total de Serviços */}
      <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-6 py-4 text-sm">
        <div className="flex items-center space-x-1">
          <Users className="text-theme-secondary h-4 w-4" />
          <span>{professional.total_services || 0}</span>
        </div>
      </td>

      {/* Receita Total */}
      <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-6 py-4 text-sm font-semibold">
        <div className="flex items-center space-x-1">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span>{formatCurrency(professional.total_revenue || 0)}</span>
        </div>
      </td>

      {/* Ticket Médio */}
      <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-6 py-4 text-sm">
        {formatCurrency(professional.avg_ticket || 0)}
      </td>

      {/* Taxa de Conversão */}
      <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-6 py-4 text-sm">
        <div className="flex items-center space-x-1">
          <Activity className="h-4 w-4 text-blue-500" />
          <span>{(professional.conversion_rate || 0).toFixed(1)}%</span>
        </div>
      </td>

      {/* Comissão */}
      <td className="text-theme-primary dark:text-dark-text-primary whitespace-nowrap px-6 py-4 text-sm">
        {formatCurrency(professional.commission_amount || 0)}
      </td>
    </tr>
  );
};

/**
 * Componente principal de tabela de ranking
 */
const RankingTable = ({ ranking = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card-theme overflow-hidden rounded-lg border border-light-border dark:border-dark-border dark:bg-dark-surface">
        <div className="animate-pulse p-6">
          <div className="mb-4 h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="mb-2 h-16 rounded bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      </div>
    );
  }
  if (!ranking || ranking.length === 0) {
    return (
      <div className="card-theme rounded-lg border border-light-border p-8 text-center dark:border-dark-border dark:bg-dark-surface">
        <Users className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-3 h-12 w-12" />
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
          Nenhum dado de ranking disponível
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Ajuste os filtros para visualizar o ranking de profissionais
        </p>
      </div>
    );
  }
  return (
    <div className="card-theme overflow-hidden rounded-lg border border-light-border dark:border-dark-border dark:bg-dark-surface">
      {/* Header */}
      <div className="border-b border-light-border px-6 py-4 dark:border-dark-border">
        <h3 className="text-theme-primary dark:text-dark-text-primary flex items-center text-lg font-semibold">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Ranking de Profissionais
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1 text-sm">
          {ranking.length} profissionais encontrados
        </p>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto" data-testid="ranking-table">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50">
            <tr>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Posição
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Profissional
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Desempenho
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Serviços
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Receita
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Conversão
              </th>
              <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Comissão
              </th>
            </tr>
          </thead>
          <tbody className="card-theme divide-y divide-gray-200 dark:divide-gray-700 dark:bg-dark-surface">
            {ranking.map((professional, index) => (
              <RankingRow
                key={professional.professional_id || index}
                professional={professional}
                index={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default RankingTable;
