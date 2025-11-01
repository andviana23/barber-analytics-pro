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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeInfo.color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {badgeInfo.label}
    </span>
  );
};

/**
 * Componente de ícone de tendência
 */
const TrendIcon = ({ trend }) => {
  if (!trend || trend === 'stable') {
    return <Minus className="w-4 h-4 text-theme-secondary" />;
  }
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  }
  return <TrendingDown className="w-4 h-4 text-red-500" />;
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
      className="hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700/50 transition-colors"
      data-testid={`ranking-row-${index + 1}`}
    >
      {/* Posição */}
      <td className="px-6 py-4 whitespace-nowrap">
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
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary rounded-full flex items-center justify-center text-dark-text-primary font-semibold">
            {professional.professional_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
              {professional.professional_name || 'N/A'}
            </div>
            <div className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              {professional.unit_name || 'N/A'}
            </div>
          </div>
        </div>
      </td>

      {/* Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        <PerformanceBadge badge={professional.performance_badge} />
      </td>

      {/* Total de Serviços */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary dark:text-dark-text-primary">
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-theme-secondary" />
          <span>{professional.total_services || 0}</span>
        </div>
      </td>

      {/* Receita Total */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-theme-primary dark:text-dark-text-primary">
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span>{formatCurrency(professional.total_revenue || 0)}</span>
        </div>
      </td>

      {/* Ticket Médio */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary dark:text-dark-text-primary">
        {formatCurrency(professional.avg_ticket || 0)}
      </td>

      {/* Taxa de Conversão */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary dark:text-dark-text-primary">
        <div className="flex items-center space-x-1">
          <Activity className="w-4 h-4 text-blue-500" />
          <span>{(professional.conversion_rate || 0).toFixed(1)}%</span>
        </div>
      </td>

      {/* Comissão */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-primary dark:text-dark-text-primary">
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
      <div className="card-theme dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        <div className="animate-pulse p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"
            ></div>
          ))}
        </div>
      </div>
    );
  }
  if (!ranking || ranking.length === 0) {
    return (
      <div className="card-theme dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-8 text-center">
        <Users className="w-12 h-12 text-light-text-muted dark:text-dark-text-muted mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
          Nenhum dado de ranking disponível
        </h3>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Ajuste os filtros para visualizar o ranking de profissionais
        </p>
      </div>
    );
  }
  return (
    <div className="card-theme dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-light-border dark:border-dark-border">
        <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
          Ranking de Profissionais
        </h3>
        <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
          {ranking.length} profissionais encontrados
        </p>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto" data-testid="ranking-table">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Posição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Profissional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Desempenho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Serviços
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Receita
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Ticket Médio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Conversão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                Comissão
              </th>
            </tr>
          </thead>
          <tbody className="card-theme dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
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
