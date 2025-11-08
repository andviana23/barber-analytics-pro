import React from 'react';
import PropTypes from 'prop-types';
import { KPICard } from '../molecules';
import { StatusBadge } from '../atoms/StatusBadge';
import ProtectedButton from '../atoms/ProtectedButton';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * CashRegisterHeader - Header do módulo de Caixa
 *
 * Organism que exibe status do caixa atual, KPIs principais e ações.
 * Combina múltiplos KPICards com informações contextuais.
 *
 * @component
 * @example
 * ```jsx
 * <CashRegisterHeader
 *   cashRegister={activeCash}
 *   summary={dailySummary}
 *   onOpenCash={handleOpen}
 *   onCloseCash={handleClose}
 *   loading={isLoading}
 * />
 * ```
 */
const CashRegisterHeader = ({
  cashRegister,
  summary = {},
  onOpenCash,
  onCloseCash,
  onViewReport,
  loading = false,
  className = '',
}) => {
  const isCashOpen = cashRegister && cashRegister.status === 'open';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status e Ações */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Info do Caixa */}
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-theme-primary text-2xl font-bold">
              Controle de Caixa
            </h1>
            <StatusBadge
              status={isCashOpen ? 'success' : 'error'}
              text={isCashOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
            />
          </div>
          {isCashOpen && cashRegister && (
            <div className="text-theme-secondary flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Aberto em {formatDateTime(cashRegister.opened_at, 'short')}
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {cashRegister.opened_by_name || 'Usuário'}
              </span>
              <span className="flex items-center gap-1.5">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Saldo inicial:{' '}
                {formatCurrency(cashRegister.opening_balance || 0)}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-3">
          {!isCashOpen ? (
            <ProtectedButton
              variant="primary"
              size="lg"
              onClick={onOpenCash}
              disabled={loading}
              requiredRoles={['recepcionista', 'gerente', 'admin']}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              }
              iconPosition="left"
            >
              Abrir Caixa
            </ProtectedButton>
          ) : (
            <>
              <ProtectedButton
                variant="danger"
                size="lg"
                onClick={onCloseCash}
                disabled={loading}
                requiredRoles={['recepcionista', 'gerente', 'admin']}
                icon={
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
                iconPosition="left"
              >
                Fechar Caixa
              </ProtectedButton>
              {onViewReport && (
                <ProtectedButton
                  variant="outline"
                  size="lg"
                  onClick={onViewReport}
                  disabled={loading}
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                  iconPosition="left"
                >
                  Ver Relatório
                </ProtectedButton>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Entradas"
          value={formatCurrency(summary.total_inflow || 0)}
          icon="arrow-up"
          trend={summary.inflow_trend}
          trendValue={summary.inflow_trend_percentage}
          loading={loading}
          variant="success"
        />
        <KPICard
          title="Saídas"
          value={formatCurrency(summary.total_outflow || 0)}
          icon="arrow-down"
          trend={summary.outflow_trend}
          trendValue={summary.outflow_trend_percentage}
          loading={loading}
          variant="danger"
        />
        <KPICard
          title="Saldo Atual"
          value={formatCurrency(summary.current_balance || 0)}
          icon="wallet"
          trend={summary.balance_trend}
          trendValue={summary.balance_trend_percentage}
          loading={loading}
          variant="primary"
        />
        <KPICard
          title="Comandas Fechadas"
          value={summary.orders_closed || 0}
          icon="check-circle"
          trend={summary.orders_trend}
          trendValue={summary.orders_trend_percentage}
          loading={loading}
          variant="info"
        />
      </div>

      {/* Alerta se caixa fechado */}
      {!isCashOpen && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
                Caixa Fechado
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                É necessário abrir o caixa para registrar movimentações
                financeiras e fechar comandas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CashRegisterHeader.propTypes = {
  /** Dados do caixa atual */
  cashRegister: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed']),
    opened_at: PropTypes.string,
    opened_by_name: PropTypes.string,
    opening_balance: PropTypes.number,
  }),
  /** Resumo de movimentações */
  summary: PropTypes.shape({
    total_inflow: PropTypes.number,
    total_outflow: PropTypes.number,
    current_balance: PropTypes.number,
    orders_closed: PropTypes.number,
    inflow_trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    outflow_trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    balance_trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    orders_trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    inflow_trend_percentage: PropTypes.number,
    outflow_trend_percentage: PropTypes.number,
    balance_trend_percentage: PropTypes.number,
    orders_trend_percentage: PropTypes.number,
  }),
  /** Callback para abrir caixa */
  onOpenCash: PropTypes.func,
  /** Callback para fechar caixa */
  onCloseCash: PropTypes.func,
  /** Callback para ver relatório */
  onViewReport: PropTypes.func,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default CashRegisterHeader;
