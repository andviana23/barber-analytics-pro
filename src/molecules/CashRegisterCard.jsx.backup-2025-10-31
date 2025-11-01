import React from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../atoms/Card/Card';
import { StatusBadge } from '../atoms/StatusBadge';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * CashRegisterCard - Card de visualização de caixa
 *
 * Molecule que exibe informações do caixa (aberto/fechado) com ações rápidas.
 * Combina Card, StatusBadge e botões para criar interface de gestão de caixa.
 *
 * @component
 * @example
 * ```jsx
 * <CashRegisterCard
 *   cashRegister={activeCashRegister}
 *   onOpen={handleOpenCash}
 *   onClose={handleCloseCash}
 *   onViewReport={handleViewReport}
 * />
 * ```
 */
const CashRegisterCard = ({
  cashRegister,
  onOpen,
  onClose,
  onViewReport,
  loading = false,
  className = '',
}) => {
  const isOpen = cashRegister?.status === 'open';
  const isClosed = cashRegister?.status === 'closed';

  // Se não há caixa, mostra estado vazio
  if (!cashRegister && !loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center">
            <svg
              className="w-8 h-8 text-theme-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-theme-primary mb-2">
            Nenhum caixa aberto
          </h3>
          <p className="text-sm text-theme-secondary mb-6">
            Abra o caixa para começar a registrar movimentações
          </p>
          {onOpen && (
            <button
              onClick={onOpen}
              className="btn-theme-primary px-6 py-2.5 rounded-md inline-flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              Abrir Caixa
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-light-bg dark:bg-dark-bg rounded w-1/3" />
          <div className="h-4 bg-light-bg dark:bg-dark-bg rounded w-1/2" />
          <div className="h-4 bg-light-bg dark:bg-dark-bg rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-theme-primary">
              Caixa #{cashRegister.id?.slice(0, 8)}
            </h3>
            <StatusBadge
              status={isOpen ? 'active' : 'inactive'}
              text={isOpen ? 'Aberto' : 'Fechado'}
            />
          </div>
          <p className="text-sm text-theme-secondary">
            {isOpen ? 'Caixa em operação' : 'Caixa finalizado'}
          </p>
        </div>

        {/* Ícone de status */}
        <div
          className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${isOpen ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}
        `}
        >
          <svg
            className={`w-6 h-6 ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-theme-secondary'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
            />
          </svg>
        </div>
      </div>

      {/* Informações do caixa */}
      <div className="space-y-3 mb-6">
        {/* Abertura */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-theme-secondary">Aberto em:</span>
          <span className="text-sm font-medium text-theme-primary">
            {formatDateTime(cashRegister.opening_time)}
          </span>
        </div>

        {/* Aberto por */}
        {cashRegister.opened_by_name && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-theme-secondary">Por:</span>
            <span className="text-sm font-medium text-theme-primary">
              {cashRegister.opened_by_name}
            </span>
          </div>
        )}

        {/* Saldo inicial */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-theme-secondary">Saldo Inicial:</span>
          <span className="text-sm font-semibold text-theme-primary">
            {formatCurrency(cashRegister.opening_balance)}
          </span>
        </div>

        {/* Se fechado, mostra info de fechamento */}
        {isClosed && (
          <>
            <div className="border-t border-light-border dark:border-dark-border pt-3 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-theme-secondary">
                  Fechado em:
                </span>
                <span className="text-sm font-medium text-theme-primary">
                  {formatDateTime(cashRegister.closing_time)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-theme-secondary">
                  Saldo Final:
                </span>
                <span className="text-sm font-semibold text-theme-primary">
                  {formatCurrency(cashRegister.closing_balance)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Observações */}
        {cashRegister.observations && (
          <div className="pt-3 border-t border-light-border dark:border-dark-border">
            <p className="text-xs text-theme-secondary mb-1">Observações:</p>
            <p className="text-sm text-theme-primary italic">
              {cashRegister.observations}
            </p>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        {isOpen && onClose && (
          <button
            onClick={onClose}
            className="flex-1 btn-theme-primary px-4 py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
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
            Fechar Caixa
          </button>
        )}

        {isClosed && onViewReport && (
          <button
            onClick={onViewReport}
            className="flex-1 btn-theme-secondary px-4 py-2.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
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
            Ver Relatório
          </button>
        )}
      </div>
    </Card>
  );
};

CashRegisterCard.propTypes = {
  /** Dados do caixa */
  cashRegister: PropTypes.shape({
    id: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed']),
    opening_time: PropTypes.string,
    closing_time: PropTypes.string,
    opening_balance: PropTypes.number,
    closing_balance: PropTypes.number,
    opened_by_name: PropTypes.string,
    closed_by_name: PropTypes.string,
    observations: PropTypes.string,
  }),
  /** Callback para abrir caixa */
  onOpen: PropTypes.func,
  /** Callback para fechar caixa */
  onClose: PropTypes.func,
  /** Callback para ver relatório */
  onViewReport: PropTypes.func,
  /** Estado de loading */
  loading: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};

export default CashRegisterCard;
