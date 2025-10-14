/**
 * FinancialCalendarGrid.jsx
 * 
 * Grid de calendário mensal para eventos financeiros
 * Exibe receitas/despesas por dia com indicadores visuais por status
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  List,
  Grid3x3,
  Eye,
  EyeOff
} from 'lucide-react';
import { CalendarEventCard } from '../CalendarEventCard';

const FinancialCalendarGrid = ({
  events = [],
  selectedDate = new Date(),
  onDateChange,
  onEventSelect,
  onEventEdit,
  onEventDelete,
  onEventMarkAsPaid,
  onEventReconcile,
  onDateClick,
  onAddEvent,
  viewMode = 'month', // 'month' | 'week' | 'list'
  onViewModeChange,
  showWeekends = true,
  showEventCards = true,
  compactMode = false,
  filterTypes = ['receita', 'despesa', 'compensacao'],
  filterStatuses = [],
  loading = false,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [expandedDates, setExpandedDates] = useState(new Set());

  // Navegação de mês/semana
  const navigatePrevious = () => {
    const newDate = viewMode === 'month' 
      ? subMonths(currentDate, 1) 
      : new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    setCurrentDate(newDate);
    onDateChange && onDateChange(newDate);
  };

  const navigateNext = () => {
    const newDate = viewMode === 'month' 
      ? addMonths(currentDate, 1) 
      : new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    setCurrentDate(newDate);
    onDateChange && onDateChange(newDate);
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange && onDateChange(today);
  };

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    let start, end;

    if (viewMode === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Domingo
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      return [];
    }

    const days = eachDayOfInterval({ start, end });
    
    if (!showWeekends) {
      return days.filter(day => !isWeekend(day));
    }
    
    return days;
  }, [currentDate, viewMode, showWeekends]);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por tipo
      if (filterTypes.length > 0 && !filterTypes.includes(event.tipo)) {
        return false;
      }
      
      // Filtro por status
      if (filterStatuses.length > 0 && !filterStatuses.includes(event.status)) {
        return false;
      }
      
      return true;
    });
  }, [events, filterTypes, filterStatuses]);

  // Agrupar eventos por data
  const eventsByDate = useMemo(() => {
    const grouped = {};
    
    filteredEvents.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }, [filteredEvents]);

  // Obter eventos de uma data
  const getEventsForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  // Calcular resumo financeiro do dia
  const getDaySummary = (date) => {
    const dayEvents = getEventsForDate(date);
    
    const receitas = dayEvents.filter(e => e.tipo === 'receita').reduce((sum, e) => sum + (e.valor || 0), 0);
    const despesas = dayEvents.filter(e => e.tipo === 'despesa').reduce((sum, e) => sum + (e.valor || 0), 0);
    const saldo = receitas - despesas;
    
    return {
      receitas,
      despesas,
      saldo,
      total: dayEvents.length,
      receitasCount: dayEvents.filter(e => e.tipo === 'receita').length,
      despesasCount: dayEvents.filter(e => e.tipo === 'despesa').length,
      compensacoesCount: dayEvents.filter(e => e.tipo === 'compensacao').length
    };
  };

  // Toggle expandir eventos do dia
  const toggleExpandDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newExpanded = new Set(expandedDates);
    
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    
    setExpandedDates(newExpanded);
  };

  // Verificar se data está expandida
  const isDateExpanded = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return expandedDates.has(dateKey);
  };

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Obter classe CSS do dia com Dark Mode
  const getDayClasses = (date, summary) => {
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isSelected = isSameDay(date, selectedDate);
    const isHovered = hoveredDate && isSameDay(date, hoveredDate);
    const hasEvents = summary.total > 0;
    
    let classes = `
      relative border border-gray-200 dark:border-gray-700 min-h-24 p-1 cursor-pointer transition-all duration-200
      ${isCurrentMonth ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'}
      ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}
      ${isHovered ? 'bg-gray-100 dark:bg-gray-700' : ''}
      ${hasEvents ? 'shadow-sm' : ''}
      ${isToday(date) ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : ''}
    `;

    // Cores baseadas no saldo do dia com Dark Mode
    if (hasEvents && isCurrentMonth) {
      if (summary.saldo > 0) {
        classes += ' border-l-4 border-l-green-500 dark:border-l-green-400';
      } else if (summary.saldo < 0) {
        classes += ' border-l-4 border-l-red-500 dark:border-l-red-400';
      } else {
        classes += ' border-l-4 border-l-gray-400 dark:border-l-gray-500';
      }
    }

    return classes;
  };

  // Renderizar cabeçalho do calendário com Dark Mode
  const renderCalendarHeader = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-48 text-center capitalize">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })
                : `Semana de ${format(startOfWeek(currentDate), 'dd/MM', { locale: ptBR })}`
              }
            </h2>
            
            <button
              type="button"
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <button
            type="button"
            onClick={navigateToday}
            className="px-3 py-2 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggles com Dark Mode */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('month')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('week')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('list')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Event com Dark Mode */}
          {onAddEvent && (
            <button
              type="button"
              onClick={() => onAddEvent(selectedDate)}
              className="px-3 py-2 text-sm bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar cabeçalho dos dias da semana com Dark Mode
  const renderWeekdaysHeader = () => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    if (!showWeekends) {
      weekdays.splice(0, 1); // Remove domingo
      weekdays.splice(-1, 1); // Remove sábado
    }

    return (
      <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800`}>
        {weekdays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar célula do dia
  const renderDayCell = (date) => {
    const dayEvents = getEventsForDate(date);
    const summary = getDaySummary(date);
    const isExpanded = isDateExpanded(date);
    const isCurrentMonth = isSameMonth(date, currentDate);

    return (
      <div
        key={format(date, 'yyyy-MM-dd')}
        className={getDayClasses(date, summary)}
        onMouseEnter={() => setHoveredDate(date)}
        onMouseLeave={() => setHoveredDate(null)}
        onClick={() => {
          onDateClick && onDateClick(date);
          if (dayEvents.length > 0) {
            toggleExpandDate(date);
          }
        }}
      >
        {/* Número do dia */}
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${
            isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
          } ${isToday(date) ? 'font-bold text-blue-600' : ''}`}>
            {format(date, 'd')}
          </span>
          
          {summary.total > 0 && (
            <button
              type="button"
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandDate(date);
              }}
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Indicadores financeiros */}
        {summary.total > 0 && isCurrentMonth && (
          <div className="space-y-1">
            {/* Resumo do saldo */}
            <div className="flex items-center justify-between text-xs">
              {summary.receitas > 0 && (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{formatCurrency(summary.receitas)}</span>
                </div>
              )}
              {summary.despesas > 0 && (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  <span>{formatCurrency(summary.despesas)}</span>
                </div>
              )}
            </div>

            {/* Saldo do dia */}
            {(summary.receitas > 0 || summary.despesas > 0) && (
              <div className={`text-xs font-medium text-center ${
                summary.saldo > 0 ? 'text-green-700' : 
                summary.saldo < 0 ? 'text-red-700' : 
                'text-gray-700'
              }`}>
                {summary.saldo > 0 ? '+' : ''}{formatCurrency(summary.saldo)}
              </div>
            )}

            {/* Indicadores de quantidade */}
            <div className="flex justify-center space-x-1">
              {summary.receitasCount > 0 && (
                <div className="w-2 h-2 bg-green-500 rounded-full" title={`${summary.receitasCount} receitas`} />
              )}
              {summary.despesasCount > 0 && (
                <div className="w-2 h-2 bg-red-500 rounded-full" title={`${summary.despesasCount} despesas`} />
              )}
              {summary.compensacoesCount > 0 && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${summary.compensacoesCount} compensações`} />
              )}
            </div>
          </div>
        )}

        {/* Eventos expandidos com Dark Mode */}
        {isExpanded && showEventCards && dayEvents.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg shadow-lg max-h-80 overflow-y-auto">
            <div className="p-2 space-y-2">
              {dayEvents.slice(0, compactMode ? 3 : 10).map((event) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  compact={true}
                  onEdit={onEventEdit}
                  onDelete={onEventDelete}
                  onMarkAsPaid={onEventMarkAsPaid}
                  onReconcile={onEventReconcile}
                  onViewDetails={onEventSelect}
                />
              ))}
              
              {dayEvents.length > (compactMode ? 3 : 10) && (
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
                  +{dayEvents.length - (compactMode ? 3 : 10)} eventos
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar visualização em lista
  const renderListView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const monthEvents = filteredEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    // Agrupar por data
    const eventsByDateList = {};
    monthEvents.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!eventsByDateList[dateKey]) {
        eventsByDateList[dateKey] = [];
      }
      eventsByDateList[dateKey].push(event);
    });

    const sortedDates = Object.keys(eventsByDateList).sort();

    return (
      <div className="space-y-4">
        {sortedDates.map(dateKey => {
          const date = new Date(dateKey);
          const dayEvents = eventsByDateList[dateKey];
          const summary = getDaySummary(date);
          
          return (
            <div key={dateKey} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                    {format(date, 'EEEE, dd \'de\' MMMM', { locale: ptBR })}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm">
                    {summary.receitas > 0 && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {formatCurrency(summary.receitas)}
                      </div>
                    )}
                    {summary.despesas > 0 && (
                      <div className="flex items-center text-red-600 dark:text-red-400">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {formatCurrency(summary.despesas)}
                      </div>
                    )}
                    <div className={`font-medium ${
                      summary.saldo > 0 ? 'text-green-700 dark:text-green-400' : 
                      summary.saldo < 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-400'
                    }`}>
                      Saldo: {formatCurrency(summary.saldo)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {dayEvents.map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    compact={false}
                    onEdit={onEventEdit}
                    onDelete={onEventDelete}
                    onMarkAsPaid={onEventMarkAsPaid}
                    onReconcile={onEventReconcile}
                    onViewDetails={onEventSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        {sortedDates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <p>Nenhum evento encontrado para este mês</p>
          </div>
        )}
      </div>
    );
  };

  const containerClasses = `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`;

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando calendário...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Header */}
      {renderCalendarHeader()}
      
      {/* Conteúdo */}
      {viewMode === 'list' ? (
        <div className="p-4">
          {renderListView()}
        </div>
      ) : (
        <>
          {/* Cabeçalho dos dias da semana */}
          {renderWeekdaysHeader()}
          
          {/* Grid do calendário */}
          <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'}`}>
            {calendarDays.map(renderDayCell)}
          </div>
        </>
      )}
    </div>
  );
};

FinancialCalendarGrid.propTypes = {
  /**
   * Lista de eventos financeiros
   */
  events: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    tipo: PropTypes.oneOf(['receita', 'despesa', 'compensacao']).isRequired,
    event_date: PropTypes.string.isRequired,
    valor: PropTypes.number.isRequired,
    titulo: PropTypes.string,
    status: PropTypes.string
  })),

  /**
   * Data selecionada
   */
  selectedDate: PropTypes.instanceOf(Date),

  /**
   * Callback quando data muda
   */
  onDateChange: PropTypes.func,

  /**
   * Callback quando evento é selecionado
   */
  onEventSelect: PropTypes.func,

  /**
   * Callback para editar evento
   */
  onEventEdit: PropTypes.func,

  /**
   * Callback para excluir evento
   */
  onEventDelete: PropTypes.func,

  /**
   * Callback para marcar como pago
   */
  onEventMarkAsPaid: PropTypes.func,

  /**
   * Callback para reconciliar
   */
  onEventReconcile: PropTypes.func,

  /**
   * Callback quando data é clicada
   */
  onDateClick: PropTypes.func,

  /**
   * Callback para adicionar evento
   */
  onAddEvent: PropTypes.func,

  /**
   * Modo de visualização
   */
  viewMode: PropTypes.oneOf(['month', 'week', 'list']),

  /**
   * Callback para mudança de modo de visualização
   */
  onViewModeChange: PropTypes.func,

  /**
   * Mostrar finais de semana
   */
  showWeekends: PropTypes.bool,

  /**
   * Mostrar cards de eventos
   */
  showEventCards: PropTypes.bool,

  /**
   * Modo compacto
   */
  compactMode: PropTypes.bool,

  /**
   * Tipos de eventos para filtrar
   */
  filterTypes: PropTypes.arrayOf(PropTypes.string),

  /**
   * Status para filtrar
   */
  filterStatuses: PropTypes.arrayOf(PropTypes.string),

  /**
   * Estado de loading
   */
  loading: PropTypes.bool,

  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string
};

// Componente de preview para demonstração
export const FinancialCalendarGridPreview = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

  // Mock data para o calendário - usar useMemo para evitar Math.random em render
  const mockEvents = useMemo(() => {
    const events = [];
    const today = new Date();
    
    // Gerar eventos para o mês atual
    for (let i = -15; i <= 15; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Usar número fixo baseado no índice para evitar Math.random
      const eventCount = (i + 15) % 4;
      for (let j = 0; j < eventCount; j++) {
        const isReceita = (i + j) % 3 !== 0;
        const valorBase = 50 + ((i + j * 10) % 450);
        const statusOptions = ['Recebido', 'Pendente'];
        const statusIndex = (i + j) % statusOptions.length;
        
        events.push({
          id: `event-${i}-${j}`,
          tipo: isReceita ? 'receita' : 'despesa',
          event_date: date.toISOString(),
          valor: valorBase,
          titulo: isReceita ? `Receita ${i}-${j}` : `Despesa ${i}-${j}`,
          status: statusOptions[statusIndex],
          descricao: `Descrição do evento ${i}-${j}`,
          party_nome: `Cliente/Fornecedor ${i}`,
          party_tipo: isReceita ? 'cliente' : 'fornecedor'
        });
      }
    }
    
    return events;
  }, []);

  const handleAction = (action, data) => {
    // eslint-disable-next-line no-console
    console.log(`Ação: ${action}`, data);
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl">
      <h3 className="text-lg font-semibold">FinancialCalendarGrid Preview</h3>
      
      <FinancialCalendarGrid
        events={mockEvents}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEventSelect={(event) => handleAction('Select Event', event)}
        onEventEdit={(event) => handleAction('Edit Event', event)}
        onEventDelete={(event) => handleAction('Delete Event', event)}
        onEventMarkAsPaid={(event) => handleAction('Mark as Paid', event)}
        onEventReconcile={(event) => handleAction('Reconcile', event)}
        onDateClick={(date) => handleAction('Date Click', date)}
        onAddEvent={(date) => handleAction('Add Event', date)}
        showWeekends={true}
        showEventCards={true}
        compactMode={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinancialCalendarGrid
          events={mockEvents}
          selectedDate={selectedDate}
          viewMode="week"
          showWeekends={false}
          compactMode={true}
          className="h-96"
        />
        
        <FinancialCalendarGrid
          events={mockEvents.slice(0, 10)}
          selectedDate={selectedDate}
          viewMode="list"
          className="h-96 overflow-hidden"
        />
      </div>
    </div>
  );
};

export default FinancialCalendarGrid;