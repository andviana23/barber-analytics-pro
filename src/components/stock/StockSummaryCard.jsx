/**
 * @file StockSummaryCard.jsx
 * @description Card KPI com resumo de movimentações de estoque
 * @module Components/Stock
 * @author Andrey Viana
 * @date 13/11/2025
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { formatCurrency } from '../../utils/formatters';

/**
 * Card KPI para resumo de movimentações
 * Design System compliant
 */
const StockSummaryCard = ({
  summary = null,
  isLoading = false,
  onViewHistory,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`card-theme p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`card-theme p-6 ${className}`}>
        <p className="text-theme-muted text-center">Sem dados disponíveis</p>
      </div>
    );
  }

  const {
    total_entries = 0,
    total_exits = 0,
    total_entries_value = 0,
    total_exits_value = 0,
    net_balance = 0,
    critical_products_count = 0,
  } = summary;

  const stockValue = total_entries_value - total_exits_value;

  return (
    <div className={`card-theme overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-theme-border border-b bg-light-bg p-4 dark:bg-dark-surface/50 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 sm:p-3">
              <Package className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-theme-primary text-base font-bold sm:text-lg">
                Resumo de Movimentações
              </h3>
              <p className="text-theme-muted text-xs sm:text-sm">
                Período atual
              </p>
            </div>
          </div>
          {onViewHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewHistory}
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Ver Histórico
            </Button>
          )}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="divide-theme-border grid grid-cols-1 divide-y sm:grid-cols-2 md:divide-x md:divide-y-0">
        {/* Entradas */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                <p className="text-theme-muted text-xs font-medium sm:text-sm">
                  Entradas
                </p>
              </div>
              <p className="text-theme-primary text-2xl font-bold sm:text-3xl">
                {total_entries}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 sm:text-sm">
                {formatCurrency(total_entries_value)}
              </p>
            </div>
          </div>
        </div>

        {/* Saídas */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" />
                <p className="text-theme-muted text-xs font-medium sm:text-sm">
                  Saídas
                </p>
              </div>
              <p className="text-theme-primary text-2xl font-bold sm:text-3xl">
                {total_exits}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 sm:text-sm">
                {formatCurrency(total_exits_value)}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                <p className="text-theme-muted text-xs font-medium sm:text-sm">
                  Saldo Líquido
                </p>
              </div>
              <p className="text-theme-primary text-2xl font-bold sm:text-3xl">
                {net_balance}
              </p>
              <p
                className={`mt-1 text-xs font-medium sm:text-sm ${
                  stockValue >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(stockValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Produtos Críticos */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-5 sm:w-5" />
                <p className="text-theme-muted text-xs font-medium sm:text-sm">
                  Produtos Críticos
                </p>
              </div>
              <p className="text-theme-primary text-2xl font-bold sm:text-3xl">
                {critical_products_count}
              </p>
              {critical_products_count > 0 && (
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 sm:text-sm">
                  Abaixo do mínimo
                </p>
              )}
              {critical_products_count === 0 && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400 sm:text-sm">
                  Estoque OK
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer com indicadores adicionais */}
      <div className="border-theme-border border-t bg-light-bg p-3 dark:bg-dark-surface/50 sm:p-4">
        <div className="flex flex-col items-start gap-2 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:text-sm">
          <div>
            <span className="text-theme-muted">Valor em Estoque:</span>
            <span className="text-theme-primary ml-2 font-semibold">
              {formatCurrency(total_entries_value)}
            </span>
          </div>
          <div>
            <span className="text-theme-muted">Movimentações Totais:</span>
            <span className="text-theme-primary ml-2 font-semibold">
              {total_entries + total_exits}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

StockSummaryCard.propTypes = {
  summary: PropTypes.shape({
    total_entries: PropTypes.number,
    total_exits: PropTypes.number,
    total_entries_value: PropTypes.number,
    total_exits_value: PropTypes.number,
    net_balance: PropTypes.number,
    critical_products_count: PropTypes.number,
  }),
  isLoading: PropTypes.bool,
  onViewHistory: PropTypes.func,
  className: PropTypes.string,
};

export default StockSummaryCard;
