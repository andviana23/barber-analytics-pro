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
const FluxoTab = ({
  globalFilters,
  units = []
}) => {
  const {
    showToast
  } = useToast();
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
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  });

  // Filtros combinados
  const combinedFilters = useMemo(() => {
    return {
      unitId: globalFilters.unitId,
      accountId: globalFilters.accountId,
      ...dateRange
    };
  }, [globalFilters, dateRange]);

  // Hook para buscar dados do fluxo de caixa
  const {
    entries,
    summary,
    loading,
    error,
    refetch,
    refreshSummary
  } = useCashflowData(combinedFilters.unitId, combinedFilters.startDate, combinedFilters.endDate, combinedFilters.accountId);

  // Handlers
  const handleDateRangeChange = newRange => {
    if (newRange.startDate && newRange.endDate) {
      setDateRange({
        startDate: format(new Date(newRange.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(newRange.endDate), 'yyyy-MM-dd')
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
        endDate: format(newEnd, 'yyyy-MM-dd')
      });
    } else if (direction === 'next') {
      const newStart = addMonths(currentStart, 1);
      const newEnd = addMonths(currentEnd, 1);
      setDateRange({
        startDate: format(newStart, 'yyyy-MM-dd'),
        endDate: format(newEnd, 'yyyy-MM-dd')
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
          dataFim: dateRange.endDate
        }
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
        showToast(`Relatório exportado como ${format.toUpperCase()}`, 'success');
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
      firstEntry: entries?.[0]
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
        locale: ptBR
      })
    }));

    // eslint-disable-next-line no-console
    console.log('📊 FluxoTab - chartData processado:', {
      count: processed.length,
      first: processed[0]
    });
    return processed;
  }, [entries]);
  return <div className="space-y-6">
      {/* Controles - Dark Mode */}
      <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filtros de período */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Período de Análise
              </label>
              <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={handleDateRangeChange} maxDate={new Date()} />
            </div>

            {/* Navegação rápida de período */}
            <div className="flex items-center space-x-2">
              <button onClick={() => handlePeriodNavigation('prev')} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-gray-700 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                ← Anterior
              </button>
              <button onClick={() => handlePeriodNavigation('next')} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-gray-700 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" disabled={new Date(dateRange.endDate) >= new Date()}>
                Próximo →
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-3">
            <button onClick={refreshSummary} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-gray-700 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
              Atualizar
            </button>

            {/* Botões de Exportação */}
            <div className="flex items-center space-x-2">
              <button onClick={() => handleExport('csv')} disabled={exporting || !entries || entries.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-gray-700 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" data-testid="btn-export-csv" title="Exportar como CSV">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                CSV
              </button>

              <button onClick={() => handleExport('excel')} disabled={exporting || !entries || entries.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 card-theme dark:bg-gray-700 border border-light-border dark:border-dark-border rounded-md hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" data-testid="btn-export-excel" title="Exportar como Excel">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Excel
              </button>

              <button onClick={() => handleExport('pdf')} disabled={exporting || !entries || entries.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-dark-text-primary bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" data-testid="btn-export-pdf" title="Exportar como PDF">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Info do período selecionado */}
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
          <div className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Analisando período de{' '}
            <span className="font-medium text-theme-primary dark:text-dark-text-primary">
              {format(new Date(dateRange.startDate), 'dd/MM/yyyy', {
              locale: ptBR
            })}
            </span>{' '}
            até{' '}
            <span className="font-medium text-theme-primary dark:text-dark-text-primary">
              {format(new Date(dateRange.endDate), 'dd/MM/yyyy', {
              locale: ptBR
            })}
            </span>
            {combinedFilters.unitId && <span className="ml-2">
                • Unidade:{' '}
                {units?.find(u => u.id === combinedFilters.unitId)?.name || 'Carregando...'}
              </span>}
          </div>
        </div>
      </div>

      {/* Resumo KPIs */}
      <FluxoSummaryPanel cashflowData={entries || []} summary={summary} loading={loading} error={error} onRefreshData={refetch} showTrendAnalysis={true} showProjections={false} />

      {/* Gráfico do Fluxo - Dark Mode */}
      <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary">
            Fluxo de Caixa Acumulado
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">Saídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">Saldo</span>
            </div>
          </div>
        </div>

        {error ? <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-theme-primary dark:text-dark-text-primary mb-2">
              Erro ao carregar fluxo
            </h3>
            <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-4">
              {error}
            </p>
            <button onClick={refetch} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-dark-text-primary rounded-lg text-sm font-medium transition-colors">
              Tentar novamente
            </button>
          </div> : <CashflowChartCard data={chartData} loading={loading} height={400} period="daily" showBalance={true} showBars={true} showLine={true} onRefresh={refetch} onExport={handleExport} />}
      </div>

      {/* Loading Overlay - Dark Mode */}
      {loading && <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="card-theme dark:bg-dark-surface rounded-lg p-6 shadow-xl border border-light-border dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-light-border dark:border-dark-border border-t-blue-600 dark:border-t-blue-400"></div>
              <span className="text-theme-primary dark:text-dark-text-primary font-medium">
                Carregando fluxo de caixa...
              </span>
            </div>
          </div>
        </div>}
    </div>;
};
export default FluxoTab;