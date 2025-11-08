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
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-light-bg dark:bg-dark-bg">
            <svg
              className="text-theme-secondary h-8 w-8"
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
          <h3 className="text-theme-primary mb-2 text-lg font-medium">
            Nenhum caixa aberto
          </h3>
          <p className="text-theme-secondary mb-6 text-sm">
            Abra o caixa para começar a registrar movimentações
          </p>
          {onOpen && (
            <button
              onClick={onOpen}
              className="btn-theme-primary inline-flex items-center gap-2 rounded-md px-6 py-2.5"
            >
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
          <div className="h-6 w-1/3 rounded bg-light-bg dark:bg-dark-bg" />
          <div className="h-4 w-1/2 rounded bg-light-bg dark:bg-dark-bg" />
          <div className="h-4 w-2/3 rounded bg-light-bg dark:bg-dark-bg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-theme-primary text-xl font-semibold">
              Caixa #{cashRegister.id?.slice(0, 8)}
            </h3>
            <StatusBadge
              status={isOpen ? 'active' : 'inactive'}
              text={isOpen ? 'Aberto' : 'Fechado'}
            />
          </div>
          <p className="text-theme-secondary text-sm">
            {isOpen ? 'Caixa em operação' : 'Caixa finalizado'}
          </p>
        </div>

        {/* Ícone de status */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${isOpen ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'} `}
        >
          <svg
            className={`h-6 w-6 ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-theme-secondary'}`}
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
      <div className="mb-6 space-y-3">
        {/* Abertura */}
        <div className="flex items-center justify-between">
          <span className="text-theme-secondary text-sm">Aberto em:</span>
          <span className="text-theme-primary text-sm font-medium">
            {formatDateTime(cashRegister.opening_time)}
          </span>
        </div>

        {/* Aberto por */}
        {cashRegister.opened_by_name && (
          <div className="flex items-center justify-between">
            <span className="text-theme-secondary text-sm">Por:</span>
            <span className="text-theme-primary text-sm font-medium">
              {cashRegister.opened_by_name}
            </span>
          </div>
        )}

        {/* Saldo inicial */}
        <div className="flex items-center justify-between">
          <span className="text-theme-secondary text-sm">Saldo Inicial:</span>
          <span className="text-theme-primary text-sm font-semibold">
            {formatCurrency(cashRegister.opening_balance)}
          </span>
        </div>

        {/* Se fechado, mostra info de fechamento */}
        {isClosed && (
          <>
            <div className="mt-3 border-t border-light-border pt-3 dark:border-dark-border">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-theme-secondary text-sm">
                  Fechado em:
                </span>
                <span className="text-theme-primary text-sm font-medium">
                  {formatDateTime(cashRegister.closing_time)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm">
                  Saldo Final:
                </span>
                <span className="text-theme-primary text-sm font-semibold">
                  {formatCurrency(cashRegister.closing_balance)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Observações */}
        {cashRegister.observations && (
          <div className="border-t border-light-border pt-3 dark:border-dark-border">
            <p className="text-theme-secondary mb-1 text-xs">Observações:</p>
            <p className="text-theme-primary text-sm italic">
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
            className="btn-theme-primary inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
          >
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Fechar Caixa
          </button>
        )}

        {isClosed && onViewReport && (
          <button
            onClick={onViewReport}
            className="btn-theme-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
          >
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
