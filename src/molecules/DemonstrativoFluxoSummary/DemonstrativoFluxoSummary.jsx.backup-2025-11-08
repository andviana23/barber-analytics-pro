/**
 * DEMONSTRATIVO FLUXO SUMMARY
 *
 * @component
 * @description Grid de KPI cards com resumo do demonstrativo de fluxo de caixa acumulado
 *
 * Features:
 * - 6 KPI cards principais
 * - Layout responsivo (3 colunas desktop, 1 coluna mobile)
 * - Color-coding semântico (verde/vermelho)
 * - Ícones temáticos
 * - Loading skeleton
 * - Design System compliant
 *
 * @author Andrey Viana
 * @date 6 de novembro de 2025
 */

import React from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * @param {Object} props
 * @param {Object} props.summary - Objeto com resumo do demonstrativo
 * @param {number} props.summary.saldo_inicial - Saldo inicial do período
 * @param {number} props.summary.total_entradas - Total de entradas
 * @param {number} props.summary.total_saidas - Total de saídas
 * @param {number} props.summary.saldo_final - Saldo final acumulado
 * @param {number} props.summary.variacao - Variação percentual (saldo final vs inicial)
 * @param {string} props.summary.tendencia - Tendência: 'positiva', 'negativa', 'neutra'
 * @param {boolean} props.loading - Estado de carregamento
 */
const DemonstrativoFluxoSummary = ({ summary = {}, loading = false }) => {
  // ==================================================================================
  // LOADING STATE
  // ==================================================================================

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(index => (
          <KPICardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // ==================================================================================
  // DATA PROCESSING
  // ==================================================================================

  const {
    saldo_inicial = 0,
    total_entradas = 0,
    total_saidas = 0,
    saldo_final = 0,
    variacao = 0,
    tendencia = 'neutra',
  } = summary;

  // Determinar se valores são positivos/negativos
  const isEntradaPositive = total_entradas > 0;
  const isSaldoFinalPositive = saldo_final >= 0;
  const isVariacaoPositive = variacao >= 0;

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* KPI 1: Saldo Inicial */}
      <KPICardCustom
        title="Saldo Inicial"
        value={formatCurrency(saldo_inicial)}
        icon={Wallet}
        iconColor="text-blue-600"
        iconBg="bg-blue-50 dark:bg-blue-900/20"
        isPositive={saldo_inicial >= 0}
      />

      {/* KPI 2: Total Entradas */}
      <KPICardCustom
        title="Total Entradas"
        value={formatCurrency(total_entradas)}
        icon={ArrowUpCircle}
        iconColor="text-green-600"
        iconBg="bg-green-50 dark:bg-green-900/20"
        isPositive={isEntradaPositive}
        showTrend
      />

      {/* KPI 3: Total Saídas */}
      <KPICardCustom
        title="Total Saídas"
        value={formatCurrency(Math.abs(total_saidas))}
        icon={ArrowDownCircle}
        iconColor="text-red-600"
        iconBg="bg-red-50 dark:bg-red-900/20"
        isPositive={false}
        showTrend
      />

      {/* KPI 4: Saldo Final */}
      <KPICardCustom
        title="Saldo Final"
        value={formatCurrency(saldo_final)}
        icon={DollarSign}
        iconColor={isSaldoFinalPositive ? 'text-green-600' : 'text-red-600'}
        iconBg={
          isSaldoFinalPositive
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }
        isPositive={isSaldoFinalPositive}
        showTrend
      />

      {/* KPI 5: Variação % */}
      <KPICardCustom
        title="Variação %"
        value={`${variacao >= 0 ? '+' : ''}${variacao.toFixed(2)}%`}
        icon={isVariacaoPositive ? TrendingUp : TrendingDown}
        iconColor={isVariacaoPositive ? 'text-green-600' : 'text-red-600'}
        iconBg={
          isVariacaoPositive
            ? 'bg-green-50 dark:bg-green-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }
        isPositive={isVariacaoPositive}
        showTrend
      />

      {/* KPI 6: Tendência */}
      <KPICardCustom
        title="Tendência"
        value={
          tendencia === 'positiva'
            ? 'Crescimento'
            : tendencia === 'negativa'
              ? 'Queda'
              : 'Estável'
        }
        icon={
          tendencia === 'positiva'
            ? TrendingUp
            : tendencia === 'negativa'
              ? TrendingDown
              : DollarSign
        }
        iconColor={
          tendencia === 'positiva'
            ? 'text-green-600'
            : tendencia === 'negativa'
              ? 'text-red-600'
              : 'text-gray-600'
        }
        iconBg={
          tendencia === 'positiva'
            ? 'bg-green-50 dark:bg-green-900/20'
            : tendencia === 'negativa'
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'bg-gray-50 dark:bg-gray-900/20'
        }
        isPositive={tendencia === 'positiva'}
        isBadge
      />
    </div>
  );
};

// ==================================================================================
// HELPER COMPONENTS
// ==================================================================================

/**
 * Card customizado de KPI
 */
const KPICardCustom = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  isPositive,
  showTrend = false,
  isBadge = false,
}) => {
  return (
    <div className="card-theme rounded-xl border border-light-border p-6 transition-shadow hover:shadow-lg dark:border-dark-border">
      {/* Header: Ícone + Tendência */}
      <div className="mb-4 flex items-center justify-between">
        {/* Ícone */}
        <div className={`rounded-lg p-2 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>

        {/* Indicador de tendência (se aplicável) */}
        {showTrend && (
          <div className="flex items-center space-x-1">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-feedback-light-success dark:text-feedback-dark-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-feedback-light-error dark:text-feedback-dark-error" />
            )}
          </div>
        )}

        {/* Badge (para Tendência) */}
        {isBadge && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              isPositive
                ? 'bg-feedback-light-success/10 text-feedback-light-success dark:bg-feedback-dark-success/10 dark:text-feedback-dark-success'
                : 'bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error'
            }`}
          >
            {isPositive ? 'Positiva' : 'Negativa'}
          </span>
        )}
      </div>

      {/* Título */}
      <p className="text-theme-secondary mb-1 text-sm font-medium">{title}</p>

      {/* Valor */}
      <p
        className={`text-2xl font-bold ${
          isBadge
            ? 'text-theme-primary'
            : isPositive
              ? 'text-feedback-light-success dark:text-feedback-dark-success'
              : 'text-feedback-light-error dark:text-feedback-dark-error'
        }`}
      >
        {value}
      </p>
    </div>
  );
};

/**
 * Loading skeleton
 */
const KPICardSkeleton = () => {
  return (
    <div className="card-theme animate-pulse rounded-xl border border-light-border p-6 dark:border-dark-border">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-light-bg dark:bg-dark-bg"></div>
        <div className="h-4 w-4 rounded bg-light-bg dark:bg-dark-bg"></div>
      </div>

      {/* Título */}
      <div className="mb-2 h-4 w-24 rounded bg-light-bg dark:bg-dark-bg"></div>

      {/* Valor */}
      <div className="h-8 w-32 rounded bg-light-bg dark:bg-dark-bg"></div>
    </div>
  );
};

export default DemonstrativoFluxoSummary;
