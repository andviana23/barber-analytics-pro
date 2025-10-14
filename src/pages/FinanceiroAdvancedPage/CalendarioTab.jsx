import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Custom Hooks
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

// Components
import CalendarioToolbar from '../../organisms/CalendarioToolbar/CalendarioToolbar';
import FinancialCalendarGrid from '../../molecules/FinancialCalendarGrid/FinancialCalendarGrid';
import EventDetailsModal from '../../templates/EventDetailsModal';

/**
 * Tab do Calendário Financeiro
 * 
 * Features:
 * - Integração com CalendarioToolbar para filtros e navegação
 * - FinancialCalendarGrid para visualização dos eventos
 * - EventDetailsModal para detalhes e ações dos eventos
 * - useCalendarEvents hook para gerenciamento de dados
 */
const CalendarioTab = ({ globalFilters, units }) => {
  // Estado local da tab
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    tipo: 'All', // 'All', 'Receber', 'Pagar', 'Compensacao'
    status: 'All', // 'All', 'Previsto', 'Efetivo', 'Atrasado'
    accountId: null
  });

  // Datas calculadas para o período do calendário
  const dateRange = useMemo(() => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      displayStart: startDate,
      displayEnd: endDate
    };
  }, [currentDate]);

  // Filtros combinados (globais + locais)
  const combinedFilters = useMemo(() => {
    return {
      ...localFilters,
      unitId: globalFilters.unitId,
      accountId: localFilters.accountId || globalFilters.accountId
    };
  }, [globalFilters, localFilters]);

  // Hook para buscar eventos do calendário
  const {
    events,
    loading,
    error,
    refetch,
    updateEventStatus
  } = useCalendarEvents(
    combinedFilters.unitId,
    dateRange.startDate,
    dateRange.endDate,
    {
      tipo: combinedFilters.tipo !== 'All' ? combinedFilters.tipo : undefined,
      status: combinedFilters.status !== 'All' ? combinedFilters.status : undefined,
      accountId: combinedFilters.accountId
    }
  );

  // Handlers
  const handleDateChange = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleFiltersChange = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleEventAction = async (eventId, action) => {
    try {
      switch (action) {
        case 'mark-paid':
          await updateEventStatus(eventId, 'Pago');
          break;
        case 'mark-received':
          await updateEventStatus(eventId, 'Recebido');
          break;
        case 'mark-cancelled':
          await updateEventStatus(eventId, 'Cancelado');
          break;
        default:
          // Ação não reconhecida - não fazer nada
          return;
      }
      
      // Fechar modal após ação
      setIsEventModalOpen(false);
      setSelectedEvent(null);
      
    } catch {
      // Erro já é tratado pelo hook via toast
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleNavigateDate = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(prev => addDays(startOfMonth(prev), -1));
    } else if (direction === 'next') {
      setCurrentDate(prev => addDays(endOfMonth(prev), 1));
    } else if (direction === 'today') {
      setCurrentDate(new Date());
    }
  };

  const handleExport = () => {
    // TODO: Implementar exportação do calendário
    // Funcionalidade será implementada em versão futura
  };

  return (
    <div className="space-y-6">
      {/* Toolbar com filtros e navegação */}
      <CalendarioToolbar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onNavigate={handleNavigateDate}
        filters={localFilters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        units={units}
        loading={loading}
      />

      {/* Calendário Principal - Padrão do Sistema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header do Calendário */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Título do Mês */}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            
            {/* Legenda de Cores - Padrão do Sistema */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">A Receber</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">A Pagar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Compensação</span>
              </div>
            </div>
          </div>

          {/* Contador de Eventos */}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{events.length}</span>
            <span>{events.length === 1 ? 'evento' : 'eventos'}</span>
          </div>
        </div>

        {/* Grid do Calendário com Tratamento de Estados */}
        <div className="p-6">
          {error ? (
            // Estado de Erro - Padrão do Sistema
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Erro ao carregar eventos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
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
            // Calendário Normal
            <FinancialCalendarGrid
              events={events}
              currentDate={currentDate}
              onDateChange={handleDateChange}
              onSelectEvent={handleEventSelect}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Evento */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setSelectedEvent(null);
          }}
          onAction={handleEventAction}
        />
      )}

      {/* Loading Overlay - Padrão do Sistema */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400"></div>
              <span className="text-gray-900 dark:text-white font-medium">Carregando eventos...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioTab;