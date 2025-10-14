/**
 * CalendarioToolbar.jsx
 * 
 * Barra de ferramentas complexa para calendário financeiro
 * Combina múltiplos átomos e moléculas para controle completo
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  RefreshCw,
  Settings,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  X,
  Check,
  Grid3x3,
  List
} from 'lucide-react';
import DateRangePicker from '../../atoms/DateRangePicker';
import { PartySelector } from '../../atoms/PartySelector';
import StatusBadge from '../../atoms/StatusBadge';

const CalendarioToolbar = ({
  // Filtros
  dateRange,
  onDateRangeChange,
  searchTerm = '',
  onSearchChange,
  selectedParties = [],
  onPartiesChange,
  selectedStatuses = [],
  onStatusesChange,
  selectedTypes = [],
  onTypesChange,
  selectedAccounts = [],
  onAccountsChange,
  
  // Configurações de visualização
  viewMode = 'month',
  onViewModeChange,
  showWeekends = true,
  onShowWeekendsChange,
  compactMode = false,
  onCompactModeChange,
  showEventCards = true,
  onShowEventCardsChange,
  
  // Ações
  onAddEvent,
  onImportStatement,
  onExportData,
  onRefresh,
  onOpenSettings,
  onBulkAction,
  
  // Dados para filtros
  availableStatuses = [],
  availableTypes = [],
  availableAccounts = [],
  
  // Estados
  loading = false,
  eventsCount = 0,
  totalValue = 0,
  
  // Configuração
  enableBulkActions = false,
  selectedEvents = [],
  
  className = ''
}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('status');
  const [searchFocused, setSearchFocused] = useState(false);

  // Configuração de tipos padrão
  const defaultTypes = useMemo(() => [
    { id: 'receita', label: 'Receitas', color: 'green', icon: TrendingUp },
    { id: 'despesa', label: 'Despesas', color: 'red', icon: TrendingDown },
    { id: 'compensacao', label: 'Compensações', color: 'blue', icon: DollarSign }
  ], []);

  // Configuração de status padrão
  const defaultStatuses = useMemo(() => [
    { id: 'pendente', label: 'Pendente', color: 'yellow' },
    { id: 'recebido', label: 'Recebido', color: 'green' },
    { id: 'pago', label: 'Pago', color: 'green' },
    { id: 'cancelado', label: 'Cancelado', color: 'red' },
    { id: 'vencido', label: 'Vencido', color: 'red' },
    { id: 'conciliado', label: 'Conciliado', color: 'blue' }
  ], []);

  // Combinar dados disponíveis com configuração padrão
  const typesConfig = useMemo(() => {
    return defaultTypes.map(type => ({
      ...type,
      available: availableTypes.length === 0 || availableTypes.includes(type.id)
    }));
  }, [defaultTypes, availableTypes]);

  const statusesConfig = useMemo(() => {
    return defaultStatuses.map(status => ({
      ...status,
      available: availableStatuses.length === 0 || availableStatuses.includes(status.id)
    }));
  }, [defaultStatuses, availableStatuses]);

  // Contadores de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedParties.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedTypes.length > 0) count++;
    if (selectedAccounts.length > 0) count++;
    return count;
  }, [searchTerm, selectedParties, selectedStatuses, selectedTypes, selectedAccounts]);

  // Limpar todos os filtros
  const clearAllFilters = useCallback(() => {
    onSearchChange && onSearchChange('');
    onPartiesChange && onPartiesChange([]);
    onStatusesChange && onStatusesChange([]);
    onTypesChange && onTypesChange([]);
    onAccountsChange && onAccountsChange([]);
  }, [onSearchChange, onPartiesChange, onStatusesChange, onTypesChange, onAccountsChange]);

  // Toggle tipo selecionado
  const toggleType = useCallback((typeId) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(id => id !== typeId)
      : [...selectedTypes, typeId];
    onTypesChange && onTypesChange(newTypes);
  }, [selectedTypes, onTypesChange]);

  // Toggle status selecionado
  const toggleStatus = useCallback((statusId) => {
    const newStatuses = selectedStatuses.includes(statusId)
      ? selectedStatuses.filter(id => id !== statusId)
      : [...selectedStatuses, statusId];
    onStatusesChange && onStatusesChange(newStatuses);
  }, [selectedStatuses, onStatusesChange]);

  // Formatação de valores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Renderizar barra principal com Dark Mode
  const renderMainToolbar = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Lado esquerdo - Controles principais */}
        <div className="flex items-center space-x-4">
          {/* Seletor de período */}
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-64"
          />

          {/* Busca com Dark Mode */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all ${
                searchFocused ? 'w-64' : 'w-48'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros com Dark Mode */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center px-3 py-2 text-sm border rounded-md transition-colors ${
                activeFiltersCount > 0 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Lado direito - Ações e visualização com Dark Mode */}
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle com Dark Mode */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => onViewModeChange && onViewModeChange('month')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="Visualização mensal"
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
              title="Visualização semanal"
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
              title="Visualização em lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Botão de refresh com Dark Mode */}
          <button
            type="button"
            onClick={() => onRefresh && onRefresh()}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Ações principais com Dark Mode */}
          <div className="flex items-center space-x-2">
            {onImportStatement && (
              <button
                type="button"
                onClick={() => onImportStatement()}
                className="flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </button>
            )}

            {onExportData && (
              <button
                type="button"
                onClick={() => onExportData()}
                className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            )}

            {onAddEvent && (
              <button
                type="button"
                onClick={() => onAddEvent()}
                className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar menu de filtros
  const renderFilterMenu = () => {
    if (!isFilterMenuOpen) return null;

    return (
      <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filtros Avançados</h3>
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                >
                  Limpar tudo
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterMenuOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Abas de filtros com Dark Mode */}
          <div className="flex space-x-4 mb-4 border-b border-gray-200 dark:border-gray-700">
            {['status', 'types', 'parties', 'accounts'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilterTab(tab)}
                className={`pb-2 px-1 text-sm font-medium transition-colors ${
                  activeFilterTab === tab
                    ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'status' && 'Status'}
                {tab === 'types' && 'Tipos'}
                {tab === 'parties' && 'Clientes/Fornecedores'}
                {tab === 'accounts' && 'Contas'}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas com Dark Mode */}
          <div className="min-h-32">
            {activeFilterTab === 'status' && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status dos Eventos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {statusesConfig.filter(s => s.available).map((status) => (
                    <label key={status.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.id)}
                        onChange={() => toggleStatus(status.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                      />
                      <StatusBadge status={status.id} size="sm" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeFilterTab === 'types' && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipos de Eventos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {typesConfig.filter(t => t.available).map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <label key={type.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type.id)}
                          onChange={() => toggleType(type.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                        />
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`w-4 h-4 text-${type.color}-600 dark:text-${type.color}-400`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {activeFilterTab === 'parties' && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clientes e Fornecedores</h4>
                <PartySelector
                  value={selectedParties}
                  onChange={onPartiesChange}
                  multiple={true}
                  placeholder="Selecionar clientes/fornecedores..."
                  className="w-full"
                />
              </div>
            )}

            {activeFilterTab === 'accounts' && availableAccounts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contas Bancárias</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableAccounts.map((account) => (
                    <label key={account.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={() => {
                          const newAccounts = selectedAccounts.includes(account.id)
                            ? selectedAccounts.filter(id => id !== account.id)
                            : [...selectedAccounts, account.id];
                          onAccountsChange && onAccountsChange(newAccounts);
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
                      />
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{account.nome}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderizar barra de status/resumo com Dark Mode
  const renderStatusBar = () => (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Resumo dos dados com Dark Mode */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{eventsCount} evento{eventsCount !== 1 ? 's' : ''}</span>
          </div>
          
          {totalValue !== 0 && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span className={totalValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {formatCurrency(totalValue)}
              </span>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Filter className="w-4 h-4" />
              <span>{activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Opções de visualização com Dark Mode */}
        <div className="flex items-center space-x-4">
          {/* Toggle finais de semana */}
          <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={showWeekends}
              onChange={(e) => onShowWeekendsChange && onShowWeekendsChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Finais de semana</span>
          </label>

          {/* Toggle cards de eventos */}
          <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={showEventCards}
              onChange={(e) => onShowEventCardsChange && onShowEventCardsChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Cards detalhados</span>
          </label>

          {/* Toggle modo compacto */}
          <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(e) => onCompactModeChange && onCompactModeChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Modo compacto</span>
          </label>

          {/* Configurações */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => onOpenSettings()}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar ações em lote (se ativado)
  const renderBulkActions = () => {
    if (!enableBulkActions || selectedEvents.length === 0) return null;

    return (
      <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-blue-700">
              {selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''} selecionado{selectedEvents.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onBulkAction && onBulkAction('markAsPaid', selectedEvents)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-1 inline" />
              Marcar como Pago
            </button>
            
            <button
              type="button"
              onClick={() => onBulkAction && onBulkAction('export', selectedEvents)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-1 inline" />
              Exportar
            </button>
            
            <button
              type="button"
              onClick={() => onBulkAction && onBulkAction('delete', selectedEvents)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              <X className="w-4 h-4 mr-1 inline" />
              Excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  const containerClasses = `relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`;

  return (
    <div className={containerClasses}>
      {/* Barra principal */}
      {renderMainToolbar()}
      
      {/* Menu de filtros */}
      {renderFilterMenu()}
      
      {/* Barra de status */}
      {renderStatusBar()}
      
      {/* Ações em lote */}
      {renderBulkActions()}
    </div>
  );
};

CalendarioToolbar.propTypes = {
  /**
   * Período selecionado (range de datas)
   */
  dateRange: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date)
  }),

  /**
   * Callback para mudança de período
   */
  onDateRangeChange: PropTypes.func,

  /**
   * Termo de busca
   */
  searchTerm: PropTypes.string,

  /**
   * Callback para mudança de busca
   */
  onSearchChange: PropTypes.func,

  /**
   * Clientes/fornecedores selecionados
   */
  selectedParties: PropTypes.arrayOf(PropTypes.string),

  /**
   * Callback para mudança de clientes/fornecedores
   */
  onPartiesChange: PropTypes.func,

  /**
   * Status selecionados
   */
  selectedStatuses: PropTypes.arrayOf(PropTypes.string),

  /**
   * Callback para mudança de status
   */
  onStatusesChange: PropTypes.func,

  /**
   * Tipos selecionados
   */
  selectedTypes: PropTypes.arrayOf(PropTypes.string),

  /**
   * Callback para mudança de tipos
   */
  onTypesChange: PropTypes.func,

  /**
   * Contas selecionadas
   */
  selectedAccounts: PropTypes.arrayOf(PropTypes.string),

  /**
   * Callback para mudança de contas
   */
  onAccountsChange: PropTypes.func,

  /**
   * Modo de visualização
   */
  viewMode: PropTypes.oneOf(['month', 'week', 'list']),

  /**
   * Callback para mudança de modo
   */
  onViewModeChange: PropTypes.func,

  /**
   * Mostrar finais de semana
   */
  showWeekends: PropTypes.bool,

  /**
   * Callback para toggle finais de semana
   */
  onShowWeekendsChange: PropTypes.func,

  /**
   * Modo compacto
   */
  compactMode: PropTypes.bool,

  /**
   * Callback para toggle modo compacto
   */
  onCompactModeChange: PropTypes.func,

  /**
   * Mostrar cards de eventos
   */
  showEventCards: PropTypes.bool,

  /**
   * Callback para toggle cards
   */
  onShowEventCardsChange: PropTypes.func,

  /**
   * Callback para adicionar evento
   */
  onAddEvent: PropTypes.func,

  /**
   * Callback para importar extrato
   */
  onImportStatement: PropTypes.func,

  /**
   * Callback para exportar dados
   */
  onExportData: PropTypes.func,

  /**
   * Callback para refresh
   */
  onRefresh: PropTypes.func,

  /**
   * Callback para abrir configurações
   */
  onOpenSettings: PropTypes.func,

  /**
   * Callback para ações em lote
   */
  onBulkAction: PropTypes.func,

  /**
   * Status disponíveis
   */
  availableStatuses: PropTypes.arrayOf(PropTypes.string),

  /**
   * Tipos disponíveis
   */
  availableTypes: PropTypes.arrayOf(PropTypes.string),

  /**
   * Contas disponíveis
   */
  availableAccounts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired
  })),

  /**
   * Estado de loading
   */
  loading: PropTypes.bool,

  /**
   * Contador de eventos
   */
  eventsCount: PropTypes.number,

  /**
   * Valor total
   */
  totalValue: PropTypes.number,



  /**
   * Habilitar ações em lote
   */
  enableBulkActions: PropTypes.bool,

  /**
   * Eventos selecionados para ações em lote
   */
  selectedEvents: PropTypes.arrayOf(PropTypes.string),

  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string
};

// Componente de preview para demonstração
export const CalendarioToolbarPreview = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 11, 31)
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParties, setSelectedParties] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState(['pendente']);
  const [selectedTypes, setSelectedTypes] = useState(['receita', 'despesa']);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [viewMode, setViewMode] = useState('month');
  const [showWeekends, setShowWeekends] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showEventCards, setShowEventCards] = useState(true);
  const [selectedEvents] = useState([]);

  const mockAccounts = [
    { id: 'conta1', nome: 'Conta Corrente Banco do Brasil' },
    { id: 'conta2', nome: 'Conta Poupança Caixa' },
    { id: 'conta3', nome: 'Conta Itaú Empresarial' }
  ];

  const handleAction = (action, data) => {
    // eslint-disable-next-line no-console
    console.log(`Ação: ${action}`, data);
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl">
      <h3 className="text-lg font-semibold">CalendarioToolbar Preview</h3>
      
      {/* Toolbar completa */}
      <CalendarioToolbar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedParties={selectedParties}
        onPartiesChange={setSelectedParties}
        selectedStatuses={selectedStatuses}
        onStatusesChange={setSelectedStatuses}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selectedAccounts={selectedAccounts}
        onAccountsChange={setSelectedAccounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showWeekends={showWeekends}
        onShowWeekendsChange={setShowWeekends}
        compactMode={compactMode}
        onCompactModeChange={setCompactMode}
        showEventCards={showEventCards}
        onShowEventCardsChange={setShowEventCards}
        availableAccounts={mockAccounts}
        eventsCount={42}
        totalValue={15750.50}
        onAddEvent={() => handleAction('Add Event')}
        onImportStatement={() => handleAction('Import Statement')}
        onExportData={() => handleAction('Export Data')}
        onRefresh={() => handleAction('Refresh')}
        onOpenSettings={() => handleAction('Open Settings')}
        onBulkAction={(action, events) => handleAction(`Bulk ${action}`, events)}
        enableBulkActions={selectedEvents.length > 0}
        selectedEvents={selectedEvents}
      />

      {/* Versão com ações em lote ativas */}
      <div>
        <h4 className="text-md font-medium mb-2">Com ações em lote ativas</h4>
        <CalendarioToolbar
          dateRange={dateRange}
          selectedStatuses={['pendente', 'vencido']}
          selectedTypes={['receita']}
          viewMode="list"
          eventsCount={8}
          totalValue={-2340.00}
          availableAccounts={mockAccounts}
          enableBulkActions={true}
          selectedEvents={['event1', 'event2', 'event3']}
          loading={true}
          onBulkAction={(action, events) => handleAction(`Bulk ${action}`, events)}
        />
      </div>
    </div>
  );
};

export default CalendarioToolbar;