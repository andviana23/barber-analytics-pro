/**
 * DEMONSTRATIVO FLUXO DE CAIXA ACUMULADO - PAGE
 *
 * @page
 * @description Página completa do Demonstrativo de Fluxo de Caixa Acumulado
 *
 * Arquitetura Clean:
 * - Repository: demonstrativoFluxoRepository (acesso Supabase)
 * - Service: demonstrativoFluxoService (regras de negócio)
 * - DTOs: DemonstrativoFluxoFilterDTO, DemonstrativoFluxoDailyDTO, DemonstrativoFluxoSummaryDTO
 * - Hook: useDemonstrativoFluxo (TanStack Query)
 * - Components: DemonstrativoFluxoFilters, DemonstrativoFluxoSummary, DemonstrativoFluxoTable
 *
 * Features:
 * - Filtros: Unidade, Conta Bancária, Período (max 2 anos)
 * - KPIs: Saldo Inicial, Total Entradas, Total Saídas, Saldo Final, Variação %, Tendência
 * - Tabela: Data, Entradas, Saídas, Saldo do Dia, Saldo Acumulado (sorting + pagination)
 * - Export: Excel, PDF, CSV (stubs para implementação futura)
 *
 * @author Andrey Viana
 * @date 6 de novembro de 2025
 */

import React, { useCallback } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '../atoms';
import { useUnit } from '../context/UnitContext';
import { useDemonstrativoFluxo } from '../hooks/useDemonstrativoFluxo';
import DemonstrativoFluxoFilters from '../molecules/DemonstrativoFluxoFilters';
import DemonstrativoFluxoSummary from '../molecules/DemonstrativoFluxoSummary';
import DemonstrativoFluxoTable from '../organisms/DemonstrativoFluxoTable';

export const DemonstrativoFluxoPage = () => {
  // ==================================================================================
  // CONTEXTS
  // ==================================================================================

  const { selectedUnit } = useUnit();

  // ==================================================================================
  // HOOK - STATE MANAGEMENT
  // ==================================================================================

  const {
    data,
    summary,
    hasData,
    loading,
    isLoading,
    isFetching,
    error,
    isError,
    filters,
    handleFilterChange,
    resetFilters,
    validateFilters,
    refetch,
    exportToExcel,
    exportToPDF,
    exportToCSV,
    isEmpty,
    isFirstLoad,
  } = useDemonstrativoFluxo({
    unitId: selectedUnit?.id || null,
  });

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  /**
   * Handler para buscar dados (valida filtros antes)
   */
  const handleSearch = useCallback(() => {
    const isValid = validateFilters();

    if (!isValid) {
      // Validação falhou - não executar busca
      return;
    }

    refetch();
  }, [validateFilters, refetch]);

  /**
   * Handler para resetar filtros
   */
  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  /**
   * Handler para export Excel
   */
  const handleExportExcel = useCallback(() => {
    if (!hasData) return;
    exportToExcel();
  }, [hasData, exportToExcel]);

  /**
   * Handler para export PDF
   */
  const handleExportPDF = useCallback(() => {
    if (!hasData) return;
    exportToPDF();
  }, [hasData, exportToPDF]);

  /**
   * Handler para export CSV
   */
  const handleExportCSV = useCallback(() => {
    if (!hasData) return;
    exportToCSV();
  }, [hasData, exportToCSV]);

  // ==================================================================================
  // RENDER - LOADING STATE
  // ==================================================================================

  if (isFirstLoad && isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-theme-secondary text-sm">
            Carregando demonstrativo...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // RENDER - ERROR STATE
  // ==================================================================================

  if (isError && error) {
    return (
      <div className="card-theme rounded-xl border p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-feedback-light-error/10 p-3 dark:bg-feedback-dark-error/10">
            <FileText className="h-8 w-8 text-feedback-light-error dark:text-feedback-dark-error" />
          </div>
          <div>
            <h3 className="text-theme-primary mb-2 text-lg font-semibold">
              Erro ao carregar demonstrativo
            </h3>
            <p className="text-theme-secondary text-sm">
              {error?.message || 'Ocorreu um erro ao buscar os dados.'}
            </p>
          </div>
          <Button onClick={refetch} variant="primary">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // ==================================================================================
  // RENDER - MAIN PAGE
  // ==================================================================================

  return (
    <div className="space-y-6">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="card-theme rounded-xl border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Título e descrição */}
          <div>
            <h1 className="text-theme-primary mb-1 text-2xl font-bold">
              Demonstrativo de Fluxo de Caixa Acumulado
            </h1>
            <p className="text-theme-secondary text-sm">
              Visualize o fluxo de caixa com saldo acumulado por período e conta
              bancária
            </p>
          </div>

          {/* Botões de exportação */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              size="sm"
              disabled={!hasData || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="secondary"
              size="sm"
              disabled={!hasData || loading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              size="sm"
              disabled={!hasData || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== FILTROS ==================== */}
      <div className="card-theme rounded-xl border p-6">
        <DemonstrativoFluxoFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
          loading={isFetching}
          disabled={isLoading}
        />
      </div>

      {/* ==================== KPIs (SUMMARY) ==================== */}
      {hasData && (
        <div className="card-theme rounded-xl border p-6">
          <h2 className="text-theme-primary mb-4 text-lg font-semibold">
            Resumo do Período
          </h2>
          <DemonstrativoFluxoSummary summary={summary} loading={isFetching} />
        </div>
      )}

      {/* ==================== TABELA ==================== */}
      <div className="card-theme rounded-xl border">
        <div className="border-b border-light-border p-6 dark:border-dark-border">
          <h2 className="text-theme-primary text-lg font-semibold">
            Movimentações Diárias
          </h2>
        </div>
        <DemonstrativoFluxoTable
          data={data}
          loading={isFetching}
          error={error}
          isEmpty={isEmpty}
        />
      </div>
    </div>
  );
};

export default DemonstrativoFluxoPage;
