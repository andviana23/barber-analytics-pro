import React, { useState, useMemo } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

// Services
import fluxoExportService from '../../services/fluxoExportService';

// Custom Hooks
import { useCashflowData } from '../../hooks/useCashflowData';
import { useToast } from '../../context/ToastContext';

// Components
import DateRangePicker from '../../atoms/DateRangePicker/DateRangePicker';
import CashflowChartCard from '../../molecules/CashflowChartCard/CashflowChartCard';
import FluxoSummaryPanel from '../../organisms/FluxoSummaryPanel/FluxoSummaryPanel';

/**
 * Tab do Fluxo de Caixa
 *
 * Features:
 * - Análise de fluxo de caixa acumulado com gráficos
 * - Filtros de período e conta bancária
 * - Resumo com KPIs e indicadores
 * - useCashflowData hook para gerenciamento de dados
 */
const FluxoTab = ({ globalFilters, units = [] }) => {
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);

  // eslint-disable-next-line no-console
  console.log('🔄 FluxoTab - Recebeu units:', units);
  // eslint-disable-next-line no-console
  console.log('🔄 FluxoTab - Recebeu globalFilters:', globalFilters);
  // Estado local da tab
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 2); // 3 meses por padrão
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  });

  // Filtros combinados
  const combinedFilters = useMemo(() => {
    return {
      unitId: globalFilters.unitId,
      accountId: globalFilters.accountId,
      ...dateRange,
    };
  }, [globalFilters, dateRange]);

  // Hook para buscar dados do fluxo de caixa
  const { entries, summary, loading, error, refetch, refreshSummary } =
    useCashflowData(
      combinedFilters.unitId,
      combinedFilters.startDate,
      combinedFilters.endDate,
      combinedFilters.accountId
    );

  // Handlers
  const handleDateRangeChange = newRange => {
    if (newRange.startDate && newRange.endDate) {
      setDateRange({
        startDate: format(new Date(newRange.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(newRange.endDate), 'yyyy-MM-dd'),
      });
    }
  };
  const handlePeriodNavigation = direction => {
    const currentStart = new Date(dateRange.startDate);
    const currentEnd = new Date(dateRange.endDate);
    if (direction === 'prev') {
      const newStart = subMonths(currentStart, 1);
      const newEnd = subMonths(currentEnd, 1);
      setDateRange({
        startDate: format(newStart, 'yyyy-MM-dd'),
        endDate: format(newEnd, 'yyyy-MM-dd'),
      });
    } else if (direction === 'next') {
      const newStart = addMonths(currentStart, 1);
      const newEnd = addMonths(currentEnd, 1);
      setDateRange({
        startDate: format(newStart, 'yyyy-MM-dd'),
        endDate: format(newEnd, 'yyyy-MM-dd'),
      });
    }
  };
  const handleExport = async format => {
    if (!entries || entries.length === 0) {
      showToast('Não há dados para exportar', 'warning');
      return;
    }
    setExporting(true);
    try {
      const filters = {
        periodo: {
          tipo: 'custom',
          dataInicio: dateRange.startDate,
          dataFim: dateRange.endDate,
        },
      };
      let result;
      switch (format) {
        case 'csv':
          result = fluxoExportService.exportAsCSV(entries, filters);
          break;
        case 'excel':
          result = fluxoExportService.exportAsExcel(entries, filters);
          break;
        case 'pdf':
          result = fluxoExportService.exportAsPDF(entries, filters);
          break;
        default:
          throw new Error('Formato não suportado');
      }
      if (result.success) {
        showToast(
          `Relatório exportado como ${format.toUpperCase()}`,
          'success'
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast(`Erro ao exportar: ${error.message}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    // eslint-disable-next-line no-console
    console.log('📊 FluxoTab - Processando chartData:', {
      entriesCount: entries?.length || 0,
      firstEntry: entries?.[0],
    });
    if (!entries || entries.length === 0) return [];
    const processed = entries.map(entry => ({
      date: entry.transaction_date,
      // ✅ Corrigido de entry.data
      inflows: entry.inflows || 0,
      // ✅ Campo esperado pelo CashflowChartCard
      outflows: entry.outflows || 0,
      // ✅ Campo esperado pelo CashflowChartCard
      accumulated_balance: entry.accumulated_balance || 0,
      // ✅ Campo esperado pelo CashflowChartCard
      entradas: entry.inflows || 0,
      // ✅ Manter compatibilidade
      saidas: Math.abs(entry.outflows || 0),
      // ✅ Manter compatibilidade
      saldoAcumulado: entry.accumulated_balance || 0,
      // ✅ Manter compatibilidade
      dateFormatted: format(new Date(entry.transaction_date), 'dd/MM', {
        locale: ptBR,
      }),
    }));

    // eslint-disable-next-line no-console
    console.log('📊 FluxoTab - chartData processado:', {
      count: processed.length,
      first: processed[0],
    });
    return processed;
  }, [entries]);
  return (
    <div className="space-y-6">
      {/* Controles - Dark Mode */}
      <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Filtros de período */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Período de Análise
              </label>
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateRangeChange}
                maxDate={new Date()}
              />
            </div>

            {/* Navegação rápida de período */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePeriodNavigation('prev')}
                className="card-theme rounded-md border border-light-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
              >
                ← Anterior
              </button>
              <button
                onClick={() => handlePeriodNavigation('next')}
                className="card-theme rounded-md border border-light-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
                disabled={new Date(dateRange.endDate) >= new Date()}
              >
                Próximo →
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshSummary}
              disabled={loading}
              className="card-theme rounded-md border border-light-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
            >
              Atualizar
            </button>

            {/* Botões de Exportação */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting || !entries || entries.length === 0}
                className="card-theme flex items-center gap-2 rounded-md border border-light-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
                data-testid="btn-export-csv"
                title="Exportar como CSV"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                CSV
              </button>

              <button
                onClick={() => handleExport('excel')}
                disabled={exporting || !entries || entries.length === 0}
                className="card-theme flex items-center gap-2 rounded-md border border-light-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-light-bg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-gray-700 dark:text-gray-300 dark:text-gray-600 dark:hover:bg-gray-600"
                data-testid="btn-export-excel"
                title="Exportar como Excel"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Excel
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting || !entries || entries.length === 0}
                className="text-dark-text-primary flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                data-testid="btn-export-pdf"
                title="Exportar como PDF"
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Info do período selecionado */}
        <div className="mt-4 border-t border-light-border pt-4 dark:border-dark-border">
          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
            Analisando período de{' '}
            <span className="text-theme-primary dark:text-dark-text-primary font-medium">
              {format(new Date(dateRange.startDate), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </span>{' '}
            até{' '}
            <span className="text-theme-primary dark:text-dark-text-primary font-medium">
              {format(new Date(dateRange.endDate), 'dd/MM/yyyy', {
                locale: ptBR,
              })}
            </span>
            {combinedFilters.unitId && (
              <span className="ml-2">
                • Unidade:{' '}
                {units?.find(u => u.id === combinedFilters.unitId)?.name ||
                  'Carregando...'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resumo KPIs */}
      <FluxoSummaryPanel
        cashflowData={entries || []}
        summary={summary}
        loading={loading}
        error={error}
        onRefreshData={refetch}
        showTrendAnalysis={true}
        showProjections={false}
      />

      {/* Gráfico do Fluxo - Dark Mode */}
      <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Fluxo de Caixa Acumulado
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 dark:bg-green-400"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Entradas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 dark:bg-red-400"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Saídas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500 dark:bg-blue-400"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                Saldo
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
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
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-semibold">
              Erro ao carregar fluxo
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4 text-sm">
              {error}
            </p>
            <button
              onClick={refetch}
              className="text-dark-text-primary rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <CashflowChartCard
            data={chartData}
            loading={loading}
            height={400}
            period="daily"
            showBalance={true}
            showBars={true}
            showLine={true}
            onRefresh={refetch}
            onExport={handleExport}
          />
        )}
      </div>

      {/* Loading Overlay - Dark Mode */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/70">
          <div className="card-theme rounded-lg border border-light-border p-6 shadow-xl dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-light-border border-t-blue-600 dark:border-dark-border dark:border-t-blue-400"></div>
              <span className="text-theme-primary dark:text-dark-text-primary font-medium">
                Carregando fluxo de caixa...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FluxoTab;
