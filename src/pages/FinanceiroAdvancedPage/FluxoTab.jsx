import React, { useState, useMemo } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom Hooks
import { useCashflowData } from '../../hooks/useCashflowData';

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
const FluxoTab = ({ globalFilters, units }) => {
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
  } = useCashflowData(
    combinedFilters.unitId,
    combinedFilters.startDate,
    combinedFilters.endDate,
    combinedFilters.accountId
  );

  // Handlers
  const handleDateRangeChange = (newRange) => {
    if (newRange.startDate && newRange.endDate) {
      setDateRange({
        startDate: format(new Date(newRange.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(newRange.endDate), 'yyyy-MM-dd')
      });
    }
  };



  const handlePeriodNavigation = (direction) => {
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

  const handleExport = () => {
    // TODO: Implementar exportação dos dados
    // Funcionalidade será implementada em versão futura
  };

  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    return entries.map(entry => ({
      date: entry.data,
      entradas: entry.entradas || 0,
      saidas: entry.saidas || 0,
      saldoAcumulado: entry.saldoAcumulado || 0,
      dateFormatted: format(new Date(entry.data), 'dd/MM', { locale: ptBR })
    }));
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Controles - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Filtros de período */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                ← Anterior
              </button>
              <button
                onClick={() => handlePeriodNavigation('next')}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Atualizar
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Info do período selecionado */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Analisando período de{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {format(new Date(dateRange.startDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            {' '}até{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            {combinedFilters.unitId && (
              <span className="ml-2">
                • Unidade: {units?.find(u => u.id === combinedFilters.unitId)?.nome || 'Carregando...'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Resumo KPIs */}
      <FluxoSummaryPanel
        summary={summary}
        loading={loading}
        error={error}
        onRefresh={refetch}
      />

      {/* Gráfico do Fluxo - Dark Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fluxo de Caixa Acumulado
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Saídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Saldo</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Erro ao carregar fluxo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <CashflowChartCard
            data={chartData}
            loading={loading}
            height={400}
          />
        )}
      </div>

      {/* Loading Overlay - Dark Mode */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400"></div>
              <span className="text-gray-900 dark:text-white font-medium">Carregando fluxo de caixa...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxoTab;