import { flexRender } from '@tanstack/react-table';
import { DollarSign } from 'lucide-react';

/**
 * 🎨 CashflowTable - Componente TanStack Table com Design System
 *
 * @component
 * @description Tabela de fluxo de caixa diário com suporte a:
 * - Dark mode automático
 * - Estados de loading/vazio
 * - Colunas computed (acumulado on-the-fly)
 * - Design System consistente
 *
 * @param {Object} props
 * @param {Object} props.table - Instância TanStack Table (do useCashflowTable)
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.emptyMessage - Mensagem quando não há dados
 *
 * @example
 * <CashflowTable
 *   table={table}
 *   loading={false}
 *   emptyMessage="Nenhum dado disponível"
 * />
 */
export function CashflowTable({
  table,
  loading = false,
  emptyMessage = 'Nenhum dado disponível',
}) {
  // 🔄 Estado de Loading
  if (loading) {
    return (
      <div className="card-theme rounded-xl p-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-theme-secondary font-medium">Carregando dados...</p>
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  // 📭 Estado Vazio
  if (!rows.length) {
    return (
      <div className="card-theme rounded-xl p-12 text-center">
        <DollarSign className="text-theme-secondary mx-auto mb-4 h-16 w-16 opacity-40" />
        <p className="text-theme-primary text-lg font-semibold">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // 📊 Renderizar Tabela
  return (
    <div className="card-theme overflow-hidden rounded-xl">
      {/* Header */}
      <div className="border-b-2 border-light-border bg-light-surface px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
            <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-theme-primary text-lg font-bold">
            Fluxo Diário Consolidado
          </h3>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* THEAD */}
          <thead className="border-b-2 border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider"
                    style={{
                      width: header.getSize(),
                      textAlign: header.column.id === 'date' ? 'left' : 'right',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* TBODY */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map(row => {
              const isSaldoInicial = row.original.isSaldoInicial;
              const isWeekend = row.original.isWeekend;

              return (
                <tr
                  key={row.id}
                  className={`group transition-all duration-200 ${
                    isSaldoInicial
                      ? 'bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15'
                      : isWeekend
                        ? 'bg-light-surface/50 hover:bg-light-hover dark:bg-dark-surface/50 dark:hover:bg-dark-hover'
                        : 'hover:bg-light-hover dark:hover:bg-dark-hover'
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4"
                      style={{
                        textAlign: cell.column.id === 'date' ? 'left' : 'right',
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
