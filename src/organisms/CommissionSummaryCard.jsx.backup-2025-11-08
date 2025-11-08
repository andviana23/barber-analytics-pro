import React from 'react';
import PropTypes from 'prop-types';
import { CommissionBadge } from '../molecules';
import { KPICard } from '../molecules';
import { formatCurrency } from '../utils/formatters';

/**
 * CommissionSummaryCard - Resumo de comissões
 *
 * Organism que exibe resumo de comissões por profissional com KPIs e ranking.
 * Usado em dashboards e relatórios financeiros.
 *
 * @component
 * @example
 * ```jsx
 * <CommissionSummaryCard
 *   commissions={commissionsData}
 *   period="month"
 *   loading={isLoading}
 * />
 * ```
 */
const CommissionSummaryCard = ({
  commissions = [],
  totalCommissions = 0,
  period = 'month',
  loading = false,
  onViewDetails,
  className = '',
}) => {
  const periodLabels = {
    day: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
    year: 'Este Ano',
  };
  const sortedCommissions = [...commissions].sort(
    (a, b) => b.total_commission - a.total_commission
  );
  const topProfessionals = sortedCommissions.slice(0, 5);
  const averageCommission =
    commissions.length > 0 ? totalCommissions / commissions.length : 0;
  const maxCommission =
    commissions.length > 0
      ? Math.max(...commissions.map(c => c.total_commission))
      : 0;
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white p-6 dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
        <div className="py-8 text-center">
          <div className="border-3 mb-3 inline-block h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-theme-secondary">Carregando comissões...</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`overflow-hidden rounded-lg border border-light-border bg-white dark:border-dark-border dark:bg-dark-surface ${className}`}
    >
      {/* Header */}
      <div className="border-b border-light-border bg-light-surface/50 px-6 py-4 dark:border-dark-border dark:bg-dark-hover/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-theme-primary text-lg font-semibold">
              Resumo de Comissões
            </h3>
            <p className="text-theme-secondary mt-1 text-sm">
              {periodLabels[period]}
            </p>
          </div>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="hover:text-primary-dark inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              Ver detalhes
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 border-b border-light-border p-6 dark:border-dark-border md:grid-cols-3">
        <div className="text-center">
          <p className="text-theme-secondary mb-2 text-sm">
            Total de Comissões
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalCommissions)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-theme-secondary mb-2 text-sm">
            Média por Profissional
          </p>
          <p className="text-theme-primary text-2xl font-bold">
            {formatCurrency(averageCommission)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-theme-secondary mb-2 text-sm">Maior Comissão</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(maxCommission)}
          </p>
        </div>
      </div>

      {/* Ranking */}
      {topProfessionals.length === 0 ? (
        <div className="p-12 text-center">
          <svg
            className="text-theme-secondary/50 mx-auto mb-4 h-16 w-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            Nenhuma comissão registrada
          </h3>
          <p className="text-theme-secondary">
            Não há comissões para o período selecionado.
          </p>
        </div>
      ) : (
        <div className="p-6">
          <h4 className="text-theme-secondary mb-4 text-sm font-semibold uppercase tracking-wider">
            Top 5 Profissionais
          </h4>
          <div className="space-y-3">
            {topProfessionals.map((professional, index) => {
              const percentage =
                maxCommission > 0
                  ? (professional.total_commission / maxCommission) * 100
                  : 0;
              const medals = ['🥇', '🥈', '🥉'];
              const medal = index < 3 ? medals[index] : null;
              return (
                <div key={professional.professional_id} className="space-y-2">
                  {/* Professional Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {/* Position */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {medal || `${index + 1}º`}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {professional.professional_name
                            ?.charAt(0)
                            ?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-theme-primary truncate font-medium">
                            {professional.professional_name}
                          </p>
                          <p className="text-theme-secondary text-xs">
                            {professional.services_count || 0}{' '}
                            {professional.services_count === 1
                              ? 'serviço'
                              : 'serviços'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Commission Badge */}
                    <CommissionBadge
                      percentage={
                        professional.average_commission_percentage || 0
                      }
                      baseValue={professional.total_sales || 0}
                      showPercentage={false}
                      showValue={true}
                      size="md"
                      variant="success"
                    />
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 overflow-hidden rounded-full bg-light-surface dark:bg-dark-hover">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-success transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Button */}
          {commissions.length > 5 && onViewDetails && (
            <button
              onClick={onViewDetails}
              className="text-theme-primary mt-4 w-full rounded-lg border border-light-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-light-surface dark:border-dark-border dark:hover:bg-dark-hover"
            >
              Ver todos os profissionais ({commissions.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
CommissionSummaryCard.propTypes = {
  /** Lista de comissões por profissional */
  commissions: PropTypes.arrayOf(
    PropTypes.shape({
      professional_id: PropTypes.string.isRequired,
      professional_name: PropTypes.string.isRequired,
      total_commission: PropTypes.number.isRequired,
      total_sales: PropTypes.number,
      services_count: PropTypes.number,
      average_commission_percentage: PropTypes.number,
    })
  ),
  /** Total de comissões do período */
  totalCommissions: PropTypes.number,
  /** Período do resumo */
  period: PropTypes.oneOf(['day', 'week', 'month', 'year']),
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Callback para ver detalhes */
  onViewDetails: PropTypes.func,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default CommissionSummaryCard;
