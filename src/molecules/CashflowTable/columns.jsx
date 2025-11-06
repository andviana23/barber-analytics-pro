import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, TrendingDown, TrendingUp } from 'lucide-react';

const columnHelper = createColumnHelper();

/**
 * 🎯 Cria definições de colunas para a tabela de Fluxo de Caixa
 *
 * @param {Function} formatCurrency - Função para formatar valores em R$
 * @param {Function} onEditBalance - Callback ao clicar em "Editar Saldo Inicial"
 * @returns {Array} Array de definições de colunas TanStack Table
 */
export const createCashflowColumns = (formatCurrency, onEditBalance) => [
  // 📅 Coluna de Data
  columnHelper.accessor('date', {
    id: 'date',
    header: 'Data',
    cell: info => {
      const row = info.row.original;
      const isSaldoInicial = row.isSaldoInicial;
      const isWeekend = row.isWeekend;

      if (isSaldoInicial) {
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 dark:bg-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">
                SALDO INICIAL
              </span>
            </div>
            <button
              onClick={onEditBalance}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary/80 transition-all hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
              title="Editar Saldo Inicial"
            >
              <Edit className="h-3 w-3" />
              Editar
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-3">
          <span className="text-theme-primary text-sm font-semibold">
            {format(new Date(row.date), 'dd/MM', { locale: ptBR })}
          </span>
          {isWeekend && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
              {format(new Date(row.date), 'EEE', {
                locale: ptBR,
              }).toUpperCase()}
            </span>
          )}
        </div>
      );
    },
    sortingFn: 'datetime',
  }),

  // 💰 Coluna de Entradas
  columnHelper.accessor('received_inflows', {
    id: 'inflows',
    header: 'Entradas',
    cell: info => {
      const value = info.getValue();
      const isSaldoInicial = info.row.original.isSaldoInicial;

      if (isSaldoInicial || value === 0) {
        return <span className="text-theme-secondary text-sm">-</span>;
      }

      return (
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(value)}
        </span>
      );
    },
    sortingFn: 'basic',
  }),

  // 💸 Coluna de Saídas
  columnHelper.accessor(row => row.paid_outflows + row.pending_outflows, {
    id: 'outflows',
    header: 'Saídas',
    cell: info => {
      const value = info.getValue();
      const isSaldoInicial = info.row.original.isSaldoInicial;

      if (isSaldoInicial || value === 0) {
        return <span className="text-theme-secondary text-sm">-</span>;
      }

      return (
        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
          {formatCurrency(value)}
        </span>
      );
    },
    sortingFn: 'basic',
  }),

  // 📊 Coluna de Saldo do Dia (Computed)
  columnHelper.display({
    id: 'dailyBalance',
    header: 'Saldo do Dia',
    cell: info => {
      const row = info.row.original;
      if (row.isSaldoInicial) {
        return <span className="text-theme-secondary text-sm">-</span>;
      }

      const inflows = row.received_inflows || 0;
      const outflows = (row.paid_outflows || 0) + (row.pending_outflows || 0);
      const balance = inflows - outflows;

      return (
        <span
          className={`text-sm font-bold ${
            balance >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {formatCurrency(balance)}
        </span>
      );
    },
  }),

  // 💼 Coluna de Acumulado (Computed)
  columnHelper.display({
    id: 'accumulated',
    header: 'Acumulado',
    cell: info => {
      const accumulated = info.row.original.accumulatedBalance;

      return (
        <div className="flex items-center justify-end gap-2">
          <span
            className={`text-base font-bold ${
              accumulated >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-orange-600 dark:text-orange-400'
            }`}
          >
            {formatCurrency(accumulated)}
          </span>
          {accumulated >= 0 ? (
            <TrendingUp className="h-4 w-4 text-blue-500 opacity-60 dark:text-blue-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-orange-500 opacity-60 dark:text-orange-400" />
          )}
        </div>
      );
    },
  }),
];
