import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { parseISO, startOfDay } from 'date-fns';
import { useMemo } from 'react';

/**
 * 🎣 Hook customizado para gerenciar tabela de Fluxo de Caixa
 *
 * @description
 * Processa dados brutos do fluxo de caixa aplicando:
 * - FILTRO 1: Remove datas fora do período selecionado
 * - FILTRO 2: Remove fins de semana (opcional)
 * - CÁLCULO: Acumulado on-the-fly (sempre correto)
 *
 * @param {Object} params
 * @param {Array} params.data - Array de dados brutos do fluxo
 * @param {Array} params.columns - Definições de colunas TanStack
 * @param {Object} params.dateRange - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 * @param {boolean} params.includeWeekends - Se false, remove sábados e domingos
 *
 * @returns {Object} { table, stats, data }
 * - table: Instância TanStack Table
 * - stats: Estatísticas úteis (totalRows, weekendRowsRemoved, etc.)
 * - data: Array processado final
 *
 * @example
 * const { table, stats } = useCashflowTable({
 *   data: cashflowData.daily,
 *   columns,
 *   dateRange: { startDate: '2025-11-01', endDate: '2025-11-30' },
 *   includeWeekends: false
 * });
 */
export function useCashflowTable({
  data,
  columns,
  dateRange,
  includeWeekends = false,
}) {
  // 🔍 FILTRO 1: Remover datas fora do período
  const filteredData = useMemo(() => {
    if (!data || !dateRange) return [];

    const [expectedYear, expectedMonth] = dateRange.startDate
      .split('-')
      .map(Number);

    return data.filter(row => {
      // ✅ Permitir linha de SALDO INICIAL
      if (row.isSaldoInicial || row.date === 'SALDO_INICIAL') {
        return true;
      }

      // ❌ Remover datas inválidas
      if (!row.date || typeof row.date !== 'string') {
        console.warn('⚠️ [useCashflowTable] Data inválida removida:', row);
        return false;
      }

      // 🔍 Validação rigorosa: apenas datas do mês vigente
      const [dayYear, dayMonth] = row.date.split('-').map(Number);
      const isInRange = dayYear === expectedYear && dayMonth === expectedMonth;

      if (!isInRange) {
        console.log(
          `🚫 [useCashflowTable] Data fora do range removida: ${row.date}`
        );
      }

      return isInRange;
    });
  }, [data, dateRange]);

  // 🔍 FILTRO 2: Remover fins de semana (se configurado)
  const processedData = useMemo(() => {
    if (!filteredData.length) return [];

    let result = filteredData;

    // 🚫 Remover fins de semana se includeWeekends = false
    if (!includeWeekends) {
      result = result.filter(row => {
        if (row.isSaldoInicial) return true;

        try {
          const date = startOfDay(parseISO(row.date));
          const dayOfWeek = date.getDay(); // 0=domingo, 6=sábado

          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          if (isWeekend) {
            console.log(
              `🚫 [useCashflowTable] Fim de semana removido: ${row.date} (DOW=${dayOfWeek})`
            );
          }

          return !isWeekend;
        } catch (error) {
          console.error(
            `❌ [useCashflowTable] Erro ao processar data: ${row.date}`,
            error
          );
          return false;
        }
      });
    }

    // 📊 CALCULAR ACUMULADO (on-the-fly, sempre correto)
    let accumulated = 0;

    return result.map((row, index) => {
      if (row.isSaldoInicial) {
        accumulated = row.accumulatedBalance || 0;
        return {
          ...row,
          accumulatedBalance: accumulated,
          isWeekend: false,
        };
      }

      // Calcular saldo do dia
      const inflows = row.received_inflows || 0;
      const outflows = (row.paid_outflows || 0) + (row.pending_outflows || 0);
      const dailyBalance = inflows - outflows;

      // Atualizar acumulado
      accumulated += dailyBalance;

      // Verificar se é fim de semana
      const date = startOfDay(parseISO(row.date));
      const isWeekend = [0, 6].includes(date.getDay());

      return {
        ...row,
        dailyBalance,
        accumulatedBalance: accumulated,
        isWeekend,
      };
    });
  }, [filteredData, includeWeekends]);

  // 🎯 Criar instância da tabela TanStack
  const table = useReactTable({
    data: processedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      sorting: [{ id: 'date', desc: false }],
    },
  });

  // 📊 Estatísticas úteis
  const stats = useMemo(() => {
    return {
      totalRows: processedData.length,
      weekendRowsRemoved: filteredData.length - processedData.length,
      dateRange: dateRange?.startDate
        ? `${dateRange.startDate} até ${dateRange.endDate}`
        : 'N/A',
      hasSaldoInicial: processedData.some(row => row.isSaldoInicial),
    };
  }, [processedData, filteredData, dateRange]);

  console.log('📊 [useCashflowTable] Estatísticas:', stats);

  return {
    table,
    stats,
    data: processedData,
  };
}
