/**
 * CHART CONTAINER COMPONENT
 *
 * Componente molecule para wrapper de gráficos com configurações padrão.
 * Segue os padrões Atomic Design e Design System.
 */

import { BarChart3, Download, MoreVertical, TrendingUp } from 'lucide-react';
import React from 'react';
import { Card } from '../atoms';

/**
 * Componente ChartContainer
 */
const ChartContainer = ({
  title,
  subtitle = null,
  children,
  loading = false,
  error = null,
  emptyMessage = 'Nenhum dado disponível',
  height = 300,
  actions = null,
  onExport = null,
  variant = 'default', // default, minimal
  className = '',
  ...props
}) => {
  /**
   * Renderiza ações do header
   */
  const renderHeaderActions = () => {
    if (actions) {
      return <div className="flex items-center space-x-2">{actions}</div>;
    }

    return (
      <div className="flex items-center space-x-2">
        {onExport && (
          <button
            onClick={onExport}
            className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-colors hover:bg-light-bg dark:hover:bg-dark-hover"
            title="Exportar dados"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        <button className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-colors hover:bg-light-bg dark:hover:bg-dark-hover">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    );
  };

  /**
   * Classes CSS baseadas na variante
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'border-0 shadow-none bg-transparent';
      case 'default':
      default:
        return 'card-theme p-6';
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <Card className={`${variantClasses} ${className}`} {...props}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-theme-primary mb-1 text-lg font-semibold">
            {title}
          </h3>
          {subtitle && (
            <p className="text-theme-secondary text-sm">{subtitle}</p>
          )}
        </div>
        {renderHeaderActions()}
      </div>

      {/* Conteúdo do gráfico */}
      <div style={{ height }} className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-light-surface/80 dark:bg-dark-surface/80">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-theme-secondary text-sm">
                Carregando dados...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-feedback-light-error/10 dark:bg-feedback-dark-error/10">
                <BarChart3 className="h-6 w-6 text-feedback-light-error dark:text-feedback-dark-error" />
              </div>
              <p className="mb-1 font-medium text-feedback-light-error dark:text-feedback-dark-error">
                Erro ao carregar gráfico
              </p>
              <p className="text-theme-secondary text-sm">
                {error.message || 'Tente novamente em alguns instantes'}
              </p>
            </div>
          </div>
        )}

        {!loading && !error && React.Children.count(children) === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-light-bg dark:bg-dark-bg">
                <TrendingUp className="text-theme-secondary h-6 w-6" />
              </div>
              <p className="text-theme-secondary mb-1 font-medium">
                {emptyMessage}
              </p>
              <p className="text-theme-secondary text-sm">
                Aguarde novos dados ou ajuste os filtros
              </p>
            </div>
          </div>
        )}

        {!loading && !error && children}
      </div>
    </Card>
  );
};

export default ChartContainer;
