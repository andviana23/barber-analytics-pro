/**
 * 📊 FluxoCaixaPage
 *
 * @page
 * @description Página principal do Fluxo de Caixa - Refatoração Completa
 *
 * Arquitetura Clean:
 * - Repository: fluxoCaixaRepository (acesso ao Supabase)
 * - Service: fluxoCaixaService (regras de negócio)
 * - DTOs: FluxoCaixaFilterDTO, FluxoCaixaDailyDTO, FluxoCaixaSummaryDTO
 * - Hooks: useFluxoCaixa (TanStack Query com cache)
 * - Components: FluxoCaixaKPIs, FluxoCaixaTimeline, CashflowTable
 *
 * Elimina:
 * - 4 layers conflitantes de processamento
 * - Bugs de 31/10 e fins de semana
 * - Código duplicado e confuso
 *
 * Total: ~100 linhas (vs 1567 linhas antigas)
 *
 * @author Andrey Viana
 * @date 2025-11-05
 */

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useUnit } from '../context/UnitContext';
import { useCashflowTable } from '../hooks/useCashflowTable';
import { useFluxoCaixa } from '../hooks/useFluxoCaixa';
import usePeriodFilter from '../hooks/usePeriodFilter';
import { CashflowTable } from '../molecules/CashflowTable';
import { createCashflowColumns } from '../molecules/CashflowTable/columns';
import { FluxoCaixaKPIs } from '../molecules/FluxoCaixaKPIs';
import { FluxoCaixaTimeline } from '../molecules/FluxoCaixaTimeline';
import { formatCurrency } from '../utils/formatters';

export default function FluxoCaixaPage() {
  // 1. Filtros globais (unidade)
  const { selectedUnit } = useUnit();

  // 2. Filtros de período
  const { dateRange } = usePeriodFilter();

  // 3. Buscar dados com cache (Service Layer + TanStack Query)
  const { data, loading, error, refetch } = useFluxoCaixa({
    unitId: selectedUnit?.id,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    includeWeekends: false, // 🔥 FIM DE SEMANA REMOVIDO
    enabled: !!selectedUnit?.id,
  });

  // 4. Criar colunas da tabela
  const columns = useMemo(() => createCashflowColumns(formatCurrency), []);

  // 5. Criar instância TanStack Table
  const { table } = useCashflowTable({
    data: data?.daily || [],
    columns,
  });

  // 6. Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-theme-secondary text-sm">
            Carregando fluxo de caixa...
          </p>
        </div>
      </div>
    );
  }

  // 7. Error state
  if (error) {
    return (
      <div className="card-theme rounded-xl border p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-feedback-light-error/10 p-3 dark:bg-feedback-dark-error/20">
            <svg
              className="h-8 w-8 text-feedback-light-error dark:text-feedback-dark-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-theme-primary mb-1 text-lg font-semibold">
              Erro ao carregar dados
            </h3>
            <p className="text-theme-secondary text-sm">
              {error.message || 'Ocorreu um erro inesperado'}
            </p>
          </div>
          <button onClick={() => refetch()} className="btn-theme-primary mt-2">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // 8. Empty state
  if (!data || !data.daily || data.daily.length === 0) {
    return (
      <div className="card-theme rounded-xl border p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-light-hover p-4 dark:bg-dark-hover">
            <svg
              className="text-theme-secondary h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-theme-primary mb-1 text-lg font-semibold">
              Nenhum dado disponível
            </h3>
            <p className="text-theme-secondary text-sm">
              Não há movimentações financeiras para o período selecionado
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 9. Renderização principal (LIMPA e MODULAR)
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-primary text-2xl font-bold">
            Fluxo de Caixa
          </h1>
          <p className="text-theme-secondary text-sm">
            Acompanhe entradas, saídas e saldo acumulado
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-theme-secondary flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Atualizar
        </button>
      </div>

      {/* KPIs - Cards de métricas */}
      <FluxoCaixaKPIs summary={data.summary} loading={loading} />

      {/* Timeline - Gráfico de evolução */}
      <FluxoCaixaTimeline
        data={data.daily}
        loading={loading}
        chartType="line"
      />

      {/* Tabela - Dados diários consolidados */}
      <div className="card-theme rounded-xl border">
        <div className="border-b border-light-border p-4 dark:border-dark-border">
          <h2 className="text-theme-primary text-lg font-semibold">
            Tabela Consolidada
          </h2>
          <p className="text-theme-secondary text-sm">
            Movimentações diárias com saldo acumulado
          </p>
        </div>
        <div className="p-4">
          <CashflowTable
            table={table}
            loading={loading}
            emptyMessage="Nenhuma movimentação no período selecionado"
          />
        </div>
      </div>
    </div>
  );
}
