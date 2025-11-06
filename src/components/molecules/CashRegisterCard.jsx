/**
 * @file CashRegisterCard.jsx
 * @description Componente Molecule - Card resumo do caixa
 * @module Components/Molecules
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../../atoms/Card/Card';
import { Button } from '../../atoms/Button/Button';
import { StatusBadge } from '../../atoms/StatusBadge';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../utils/formatters';

/**
 * Card para exibir resumo do caixa
 * Segue padrões do Design System
 */
const CashRegisterCard = ({
  cashRegister,
  onClose,
  onViewReport,
  canClose = false,
  className = '',
}) => {
  if (!cashRegister) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-theme-muted text-center">
          <p className="text-lg font-medium">Nenhum caixa aberto</p>
          <p className="mt-2 text-sm">
            Abra um caixa para começar a registrar comandas
          </p>
        </div>
      </Card>
    );
  }
  const isOpen = cashRegister.status === 'open';
  const openingDate = new Date(cashRegister.opening_time);
  const closingDate = cashRegister.closing_time
    ? new Date(cashRegister.closing_time)
    : null;

  // Calcula tempo de abertura
  const calculateOpenTime = () => {
    if (!isOpen) return null;
    const now = new Date();
    const diff = now - openingDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };
  const openTime = calculateOpenTime();
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-theme-primary text-lg font-semibold">
            Caixa Atual
          </h3>
          <p className="text-theme-muted mt-1 text-sm">
            {cashRegister.unit?.name || 'Unidade'}
          </p>
        </div>
        <StatusBadge status={cashRegister.status} size="md" />
      </div>

      {/* Informações principais */}
      <div className="mb-6 space-y-3">
        {/* Saldo de Abertura */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <DollarSign
              size={20}
              className="text-blue-600 dark:text-blue-400"
            />
          </div>
          <div className="flex-1">
            <p className="text-theme-muted text-sm">Saldo de Abertura</p>
            <p className="text-theme-primary text-lg font-semibold">
              {formatCurrency(cashRegister.opening_balance || 0)}
            </p>
          </div>
        </div>

        {/* Data/Hora de Abertura */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Calendar
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <div className="flex-1">
            <p className="text-theme-muted text-sm">Aberto em</p>
            <p className="text-theme-primary text-base font-medium">
              {formatDateTime(openingDate)}
            </p>
          </div>
        </div>

        {/* Tempo de Abertura (se aberto) */}
        {isOpen && openTime && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Clock size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-theme-muted text-sm">Tempo Aberto</p>
              <p className="text-theme-primary text-base font-medium">
                {openTime}
              </p>
            </div>
          </div>
        )}

        {/* Saldo de Fechamento (se fechado) */}
        {!isOpen && cashRegister.closing_balance !== null && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle
                size={20}
                className="text-green-600 dark:text-green-400"
              />
            </div>
            <div className="flex-1">
              <p className="text-theme-muted text-sm">Saldo de Fechamento</p>
              <p className="text-theme-primary text-lg font-semibold">
                {formatCurrency(cashRegister.closing_balance)}
              </p>
            </div>
          </div>
        )}

        {/* Data de Fechamento (se fechado) */}
        {!isOpen && closingDate && (
          <div className="flex items-center gap-3">
            <div className="card-theme flex h-10 w-10 items-center justify-center rounded-lg dark:bg-dark-surface/30">
              <Calendar
                size={20}
                className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted"
              />
            </div>
            <div className="flex-1">
              <p className="text-theme-muted text-sm">Fechado em</p>
              <p className="text-theme-primary text-base font-medium">
                {formatDateTime(closingDate)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Observações */}
      {cashRegister.observations && (
        <div className="mb-6 rounded-lg border border-light-border bg-light-bg p-3 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
          <p className="text-theme-muted mb-1 text-xs font-medium">
            Observações:
          </p>
          <p className="text-theme-primary text-sm">
            {cashRegister.observations}
          </p>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3">
        {isOpen && canClose && onClose && (
          <Button onClick={onClose} variant="danger" className="flex-1">
            Fechar Caixa
          </Button>
        )}

        {onViewReport && (
          <Button
            onClick={onViewReport}
            variant={isOpen ? 'secondary' : 'primary'}
            className={isOpen ? 'flex-1' : 'w-full'}
          >
            Ver Relatório
          </Button>
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
    opening_balance: PropTypes.number,
    closing_balance: PropTypes.number,
    opening_time: PropTypes.string,
    closing_time: PropTypes.string,
    observations: PropTypes.string,
    unit: PropTypes.shape({
      name: PropTypes.string,
    }),
  }),
  /** Callback para fechar caixa */
  onClose: PropTypes.func,
  /** Callback para visualizar relatório */
  onViewReport: PropTypes.func,
  /** Se usuário pode fechar o caixa */
  canClose: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default CashRegisterCard;
