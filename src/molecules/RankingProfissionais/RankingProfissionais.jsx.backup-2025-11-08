import React from 'react';
import { Crown, Medal, Award, User } from 'lucide-react';

/**
 * Componente de ranking de profissionais
 * @param {object} props
 * @param {Array} props.data - Array de profissionais com dados de performance
 * @param {string} props.title - Título do ranking
 * @param {boolean} props.loading - Estado de carregamento
 */
const RankingProfissionais = ({
  data = [],
  title = 'Ranking de Profissionais',
  loading = false,
}) => {
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  const getRankIcon = position => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return (
          <Medal className="text-light-text-muted dark:text-dark-text-muted h-5 w-5" />
        );
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <User className="text-light-text-muted dark:text-dark-text-muted h-5 w-5" />
        );
    }
  };
  const getRankBadge = position => {
    const badges = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      2: 'bg-gray-100 text-gray-800 border-gray-200',
      3: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return badges[position] || 'bg-blue-100 text-blue-800 border-blue-200';
  };
  if (loading) {
    return (
      <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-6 h-6 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="mb-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
        <h3 className="text-theme-primary dark:text-dark-text-primary mb-4 text-lg font-semibold">
          {title}
        </h3>
        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted py-8 text-center">
          <User className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>Nenhum dado de profissional encontrado</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card-theme rounded-xl border border-light-border p-6 dark:border-dark-border dark:bg-dark-surface">
      <h3 className="text-theme-primary dark:text-dark-text-primary mb-6 text-lg font-semibold">
        {title}
      </h3>

      <div className="space-y-4">
        {data.map((professional, index) => {
          const position = index + 1;
          return (
            <div
              key={professional.id || index}
              className={`flex items-center gap-4 rounded-lg p-3 transition-colors ${position <= 3 ? 'bg-light-surface/50 dark:bg-dark-surface/50' : 'bg-light-surface dark:bg-dark-surface'}`}
            >
              {/* Posição e ícone */}
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${getRankBadge(position)}`}
                >
                  {position}
                </span>
                {getRankIcon(position)}
              </div>

              {/* Informações do profissional */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-theme-primary dark:text-dark-text-primary truncate font-semibold">
                    {professional.name}
                  </h4>
                  {position <= 3 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      Top {position}
                    </span>
                  )}
                </div>

                <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Atendimentos:</span>{' '}
                    {professional.attendances || 0}
                  </div>
                  <div>
                    <span className="font-medium">Ticket Médio:</span>{' '}
                    {formatCurrency(professional.averageTicket || 0)}
                  </div>
                </div>
              </div>

              {/* Faturamento total */}
              <div className="text-right">
                <div className="text-theme-primary dark:text-dark-text-primary text-lg font-bold">
                  {formatCurrency(professional.totalRevenue || 0)}
                </div>
                <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-xs">
                  Faturamento
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mostrar apenas top 10 */}
      {data.length > 10 && (
        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-4 text-center text-sm">
          Mostrando top 10 profissionais
        </div>
      )}
    </div>
  );
};
export default RankingProfissionais;
