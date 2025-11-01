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
        className={`bg-white dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-6 ${className}`}
      >
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-theme-secondary">Carregando relatório...</p>
        </div>
      </div>
    );
  }
  if (!cashRegister) {
    return (
      <div
        className={`bg-white dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-12 text-center ${className}`}
      >
        <svg
          className="w-16 h-16 mx-auto text-theme-secondary/50 mb-4"
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
        <h3 className="text-lg font-semibold text-theme-primary mb-2">
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
      className={`card-theme rounded-lg border border-light-border dark:border-dark-border overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-light-border dark:border-dark-border bg-primary/5 dark:bg-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-theme-primary mb-1">
              💰 Relatório de Caixa
            </h2>
            <p className="text-sm text-theme-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
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
                className="btn-theme-primary px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md bg-red-600 hover:bg-red-700 text-dark-text-primary"
              >
                <DollarSign className="w-4 h-4" />
                Fechar Caixa
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="btn-theme-secondary px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium transition-all hover:shadow-md"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 👤 Informações de Quem Abriu/Fechou o Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quem Abriu */}
          <div className="card-theme p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
                  Aberto por
                </p>
                <p className="text-lg font-bold text-theme-primary mb-1">
                  {cashRegister.opened_by_name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-theme-secondary">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateTime(cashRegister.opened_at)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quem Fechou (se fechado) */}
          {cashRegister.closed_at && (
            <div className="card-theme p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-theme-secondary uppercase tracking-wide mb-1">
                    Fechado por
                  </p>
                  <p className="text-lg font-bold text-theme-primary mb-1">
                    {cashRegister.closed_by_name || 'Não informado'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-theme-secondary">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDateTime(cashRegister.closed_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo Financeiro */}
        <div className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-light-surface/50 dark:bg-dark-hover/50 border-b border-light-border dark:border-dark-border">
            <h3 className="font-semibold text-theme-primary">
              Resumo Financeiro
            </h3>
          </div>
          <div className="divide-y divide-light-border dark:divide-dark-border">
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-theme-secondary">Saldo Inicial</span>
              <span className="font-semibold text-theme-primary">
                {formatCurrency(cashRegister.opening_balance || 0)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-theme-secondary">
                (+) Entradas
                <span className="ml-2 text-xs">({inflows.length})</span>
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                +{formatCurrency(totalInflow)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="text-theme-secondary">
                (-) Saídas
                <span className="ml-2 text-xs">({outflows.length})</span>
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(totalOutflow)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center bg-primary/5">
              <span className="font-semibold text-theme-primary">
                Saldo Esperado
              </span>
              <span className="font-bold text-primary text-lg">
                {formatCurrency(expectedBalance)}
              </span>
            </div>
            {cashRegister.closed_at && (
              <>
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="font-semibold text-theme-primary">
                    Saldo Informado
                  </span>
                  <span className="font-bold text-theme-primary text-lg">
                    {formatCurrency(actualBalance)}
                  </span>
                </div>
                <div
                  className={`px-4 py-3 flex justify-between items-center ${difference === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}
                >
                  <span className="font-semibold text-theme-primary">
                    Diferença
                  </span>
                  <span
                    className={`font-bold text-lg ${difference === 0 ? 'text-green-600 dark:text-green-400' : difference > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
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
          <div className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-light-surface/50 dark:bg-dark-hover/50 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-theme-primary">Observações</h3>
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
          <div className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-light-surface/50 dark:bg-dark-hover/50 border-b border-light-border dark:border-dark-border">
              <h3 className="font-semibold text-theme-primary">
                Movimentações ({transactions.length})
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-light-surface/30 dark:bg-dark-hover/30 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-theme-secondary uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-theme-secondary uppercase">
                      Descrição
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-theme-secondary uppercase">
                      Valor
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-theme-secondary uppercase">
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
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'inflow' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
                        >
                          {transaction.type === 'inflow' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-primary">
                        {transaction.description || '-'}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold text-right ${transaction.type === 'inflow' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {transaction.type === 'inflow' ? '+' : '-'}
                        {formatCurrency(transaction.amount || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-secondary text-right">
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
