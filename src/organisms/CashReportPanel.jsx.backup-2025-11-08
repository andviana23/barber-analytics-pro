import React from 'react';
import PropTypes from 'prop-types';
import { User, Calendar, Printer, DollarSign } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

/**
 * CashReportPanel - Painel de relatório de caixa
 *
 * Organism que exibe relatório detalhado de fechamento de caixa
 * com movimentações, totalizações e divergências.
 *
 * @component
 * @example
 * ```jsx
 * <CashReportPanel
 *   cashRegister={cashData}
 *   transactions={transactions}
 *   onPrint={handlePrint}
 *   onCloseCash={handleCloseCash}
 * />
 * ```
 */
const CashReportPanel = ({
  cashRegister,
  transactions = [],
  onPrint,
  onClose,
  onCloseCash,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white p-6 dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
        <div className="py-8 text-center">
          <div className="border-3 mb-3 inline-block h-8 w-8 animate-spin rounded-full border-primary border-t-transparent" />
          <p className="text-theme-secondary">Carregando relatório...</p>
        </div>
      </div>
    );
  }
  if (!cashRegister) {
    return (
      <div
        className={`rounded-lg border border-light-border bg-white p-12 text-center dark:border-dark-border dark:bg-dark-surface ${className}`}
      >
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-theme-primary mb-2 text-lg font-semibold">
          Nenhum caixa selecionado
        </h3>
        <p className="text-theme-secondary">
          Selecione um caixa para visualizar o relatório.
        </p>
      </div>
    );
  }
  const inflows = transactions.filter(t => t.type === 'inflow');
  const outflows = transactions.filter(t => t.type === 'outflow');
  const totalInflow = inflows.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalOutflow = outflows.reduce((sum, t) => sum + (t.amount || 0), 0);
  const expectedBalance =
    (cashRegister.opening_balance || 0) + totalInflow - totalOutflow;
  const actualBalance = cashRegister.closing_balance || 0;
  const difference = actualBalance - expectedBalance;
  return (
    <div
      className={`card-theme overflow-hidden rounded-lg border border-light-border dark:border-dark-border ${className}`}
    >
      {/* Header */}
      <div className="border-b border-light-border bg-primary/5 px-6 py-5 dark:border-dark-border dark:bg-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-theme-primary mb-1 text-2xl font-bold">
              💰 Relatório de Caixa
            </h2>
            <p className="text-theme-secondary flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>
                <strong>Período:</strong>{' '}
                {formatDateTime(cashRegister.opened_at, 'short')} até{' '}
                {cashRegister.closed_at
                  ? formatDateTime(cashRegister.closed_at, 'short')
                  : 'Agora'}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            {/* Botão Fechar Caixa (se aberto) */}
            {cashRegister.status === 'open' && onCloseCash && (
              <button
                onClick={onCloseCash}
                className="btn-theme-primary text-dark-text-primary inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition-all hover:bg-red-700 hover:shadow-md"
              >
                <DollarSign className="h-4 w-4" />
                Fechar Caixa
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="btn-theme-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-md"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* 👤 Informações de Quem Abriu/Fechou o Caixa */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Quem Abriu */}
          <div className="card-theme rounded-xl border-2 border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-900/10">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
                  Aberto por
                </p>
                <p className="text-theme-primary mb-1 text-lg font-bold">
                  {cashRegister.opened_by_name}
                </p>
                <div className="text-theme-secondary flex items-center gap-1.5 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDateTime(cashRegister.opened_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quem Fechou (se fechado) */}
          {cashRegister.closed_at && (
            <div className="card-theme rounded-xl border-2 border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-red-100 p-2.5 dark:bg-red-900/30">
                  <User className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-theme-secondary mb-1 text-xs font-semibold uppercase tracking-wide">
                    Fechado por
                  </p>
                  <p className="text-theme-primary mb-1 text-lg font-bold">
                    {cashRegister.closed_by_name || 'Não informado'}
                  </p>
                  <div className="text-theme-secondary flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(cashRegister.closed_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
          <div className="border-b border-light-border bg-light-surface/50 px-4 py-3 dark:border-dark-border dark:bg-dark-hover/50">
            <h3 className="text-theme-primary font-semibold">
              Resumo Financeiro
            </h3>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-theme-secondary">Saldo Inicial</span>
              <span className="text-theme-primary font-semibold">
                {formatCurrency(cashRegister.opening_balance || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-theme-secondary">
                (+) Entradas
                <span className="ml-2 text-xs">({inflows.length})</span>
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(totalInflow)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-theme-secondary">
                (-) Saídas
                <span className="ml-2 text-xs">({outflows.length})</span>
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(totalOutflow)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-primary/5 px-4 py-3">
              <span className="text-theme-primary font-semibold">
                Saldo Esperado
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(expectedBalance)}
              </span>
            </div>
            {cashRegister.closed_at && (
              <>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-theme-primary font-semibold">
                    Saldo Informado
                  </span>
                  <span className="text-theme-primary text-lg font-bold">
                    {formatCurrency(actualBalance)}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between px-4 py-3 ${difference === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}
                >
                  <span className="text-theme-primary font-semibold">
                    Diferença
                  </span>
                  <span
                    className={`text-lg font-bold ${difference === 0 ? 'text-green-600 dark:text-green-400' : difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {difference > 0 ? '+' : ''}
                    {formatCurrency(difference)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Observações */}
        {cashRegister.observations && (
          <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
            <div className="border-b border-light-border bg-light-surface/50 px-4 py-3 dark:border-dark-border dark:bg-dark-hover/50">
              <h3 className="text-theme-primary font-semibold">Observações</h3>
            </div>
            <div className="px-4 py-3">
              <p className="text-theme-secondary whitespace-pre-wrap">
                {cashRegister.observations}
              </p>
            </div>
          </div>
        )}

        {/* Movimentações */}
        {transactions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
            <div className="border-b border-light-border bg-light-surface/50 px-4 py-3 dark:border-dark-border dark:bg-dark-hover/50">
              <h3 className="text-theme-primary font-semibold">
                Movimentações ({transactions.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-light-surface/30 dark:bg-dark-hover/30">
                  <tr>
                    <th className="text-theme-secondary px-4 py-2 text-left text-xs font-semibold uppercase">
                      Tipo
                    </th>
                    <th className="text-theme-secondary px-4 py-2 text-left text-xs font-semibold uppercase">
                      Descrição
                    </th>
                    <th className="text-theme-secondary px-4 py-2 text-right text-xs font-semibold uppercase">
                      Valor
                    </th>
                    <th className="text-theme-secondary px-4 py-2 text-right text-xs font-semibold uppercase">
                      Horário
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                  {transactions.map(transaction => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-light-surface/30 dark:hover:bg-dark-hover/30"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${transaction.type === 'inflow' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}
                        >
                          {transaction.type === 'inflow' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="text-theme-primary px-4 py-3 text-sm">
                        {transaction.description || '-'}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${transaction.type === 'inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {transaction.type === 'inflow' ? '+' : '-'}
                        {formatCurrency(transaction.amount || 0)}
                      </td>
                      <td className="text-theme-secondary px-4 py-3 text-right text-sm">
                        {formatDateTime(transaction.created_at, 'short')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
CashReportPanel.propTypes = {
  /** Dados do caixa */
  cashRegister: PropTypes.shape({
    id: PropTypes.string,
    opened_at: PropTypes.string,
    opened_by_name: PropTypes.string,
    closed_at: PropTypes.string,
    closed_by_name: PropTypes.string,
    opening_balance: PropTypes.number,
    closing_balance: PropTypes.number,
    observations: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed']),
  }),
  /** Lista de transações */
  transactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.oneOf(['inflow', 'outflow']),
      amount: PropTypes.number,
      description: PropTypes.string,
      created_at: PropTypes.string,
    })
  ),
  /** Callback para imprimir */
  onPrint: PropTypes.func,
  /** Callback para fechar o modal */
  onClose: PropTypes.func,
  /** Callback para fechar o caixa */
  onCloseCash: PropTypes.func,
  /** Estado de carregamento */
  loading: PropTypes.bool,
  /** Classes CSS adicionais */
  className: PropTypes.string,
};
export default CashReportPanel;
