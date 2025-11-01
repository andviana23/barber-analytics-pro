/**
 * ConciliacaoPanel.jsx
 *
 * Painel completo de reconciliação bancária
 * Combina múltiplas moléculas para workflow completo de conciliação
 *
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  Download,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  Settings,
  Zap,
  Target,
  Check,
  X,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ReconciliationMatchCard } from '../../molecules/ReconciliationMatchCard';
import { StatusBadge } from '../../atoms/StatusBadge';
import { DateRangePicker } from '../../atoms/DateRangePicker';
const ConciliacaoPanel = ({
  // Dados
  bankTransactions = [],
  internalTransactions = [],
  reconciliationMatches = [],
  selectedAccount,
  // Callbacks para ações
  onImportStatement,
  onExportResults,
  onRunAutoMatch,
  onApproveMatch,
  onRejectMatch,
  onCreateManualMatch,
  onDeleteMatch,
  onRefreshData,
  // Filtros
  dateRange,
  onDateRangeChange,
  matchStatusFilter = 'all',
  // 'all', 'matched', 'unmatched', 'approved', 'pending'
  onMatchStatusFilterChange,
  confidenceFilter = 0,
  // 0-100
  onConfidenceFilterChange,
  amountRangeFilter,
  onAmountRangeFilterChange,
  // Configurações
  autoMatchThreshold = 0.8,
  onAutoMatchThresholdChange,
  showOnlyUnreconciled = false,
  onShowOnlyUnreconciledChange,
  // Estados
  loading = false,
  autoMatchRunning = false,
  // Configuração da interface
  viewMode = 'matches',
  // 'matches', 'bank', 'internal'
  onViewModeChange,
  showFilters = true,
  compactMode = false,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [expandedMatches, setExpandedMatches] = useState(new Set());
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence', 'amount', 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Estatísticas de reconciliação
  const reconciliationStats = useMemo(() => {
    const totalBankTransactions = bankTransactions.length;
    const totalInternalTransactions = internalTransactions.length;
    const totalMatches = reconciliationMatches.length;
    const approvedMatches = reconciliationMatches.filter(
      m => m.status === 'approved'
    ).length;
    const pendingMatches = reconciliationMatches.filter(
      m => m.status === 'pending'
    ).length;
    const rejectedMatches = reconciliationMatches.filter(
      m => m.status === 'rejected'
    ).length;
    const autoMatches = reconciliationMatches.filter(
      m => m.matchType === 'automatic'
    ).length;
    const manualMatches = reconciliationMatches.filter(
      m => m.matchType === 'manual'
    ).length;
    const matchedBankAmount = reconciliationMatches
      .filter(m => m.status === 'approved')
      .reduce((sum, m) => sum + (m.bankTransaction?.valor || 0), 0);
    const unmatchedBankAmount = bankTransactions
      .filter(
        bt =>
          !reconciliationMatches.some(
            m => m.bankTransaction?.id === bt.id && m.status === 'approved'
          )
      )
      .reduce((sum, bt) => sum + (bt.valor || 0), 0);
    return {
      totalBankTransactions,
      totalInternalTransactions,
      totalMatches,
      approvedMatches,
      pendingMatches,
      rejectedMatches,
      autoMatches,
      manualMatches,
      matchedBankAmount,
      unmatchedBankAmount,
      reconciliationRate:
        totalBankTransactions > 0
          ? (approvedMatches / totalBankTransactions) * 100
          : 0,
    };
  }, [bankTransactions, internalTransactions, reconciliationMatches]);

  // Filtrar matches baseado nos critérios
  const filteredMatches = useMemo(() => {
    let filtered = [...reconciliationMatches];

    // Filtro por status
    if (matchStatusFilter !== 'all') {
      if (matchStatusFilter === 'matched') {
        filtered = filtered.filter(m => m.status === 'approved');
      } else if (matchStatusFilter === 'unmatched') {
        filtered = filtered.filter(m => m.status === 'rejected');
      } else {
        filtered = filtered.filter(m => m.status === matchStatusFilter);
      }
    }

    // Filtro por confiança
    if (confidenceFilter > 0) {
      filtered = filtered.filter(
        m => (m.confidence || 0) >= confidenceFilter / 100
      );
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m => {
        const bankDesc = (m.bankTransaction?.descricao || '').toLowerCase();
        const internalDesc = (
          m.internalTransaction?.descricao || ''
        ).toLowerCase();
        const bankRef = (m.bankTransaction?.referencia || '').toLowerCase();
        const internalRef = (
          m.internalTransaction?.referencia || ''
        ).toLowerCase();
        return (
          bankDesc.includes(term) ||
          internalDesc.includes(term) ||
          bankRef.includes(term) ||
          internalRef.includes(term)
        );
      });
    }

    // Filtro por range de valores
    if (amountRangeFilter) {
      filtered = filtered.filter(m => {
        const amount = Math.abs(m.bankTransaction?.valor || 0);
        return (
          amount >= (amountRangeFilter.min || 0) &&
          amount <= (amountRangeFilter.max || Infinity)
        );
      });
    }

    // Filtro por período
    if (dateRange?.startDate && dateRange?.endDate) {
      filtered = filtered.filter(m => {
        const bankDate = m.bankTransaction?.data
          ? new Date(m.bankTransaction.data)
          : null;
        if (!bankDate) return false;
        return bankDate >= dateRange.startDate && bankDate <= dateRange.endDate;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        case 'amount':
          aVal = Math.abs(a.bankTransaction?.valor || 0);
          bVal = Math.abs(b.bankTransaction?.valor || 0);
          break;
        case 'date':
          aVal = new Date(a.bankTransaction?.data || 0);
          bVal = new Date(b.bankTransaction?.data || 0);
          break;
        default:
          return 0;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [
    reconciliationMatches,
    matchStatusFilter,
    confidenceFilter,
    searchTerm,
    amountRangeFilter,
    dateRange,
    sortBy,
    sortOrder,
  ]);

  // Transações não reconciliadas
  const unReconciledBankTransactions = useMemo(() => {
    return bankTransactions.filter(
      bt =>
        !reconciliationMatches.some(
          m => m.bankTransaction?.id === bt.id && m.status === 'approved'
        )
    );
  }, [bankTransactions, reconciliationMatches]);
  const unReconciledInternalTransactions = useMemo(() => {
    return internalTransactions.filter(
      it =>
        !reconciliationMatches.some(
          m => m.internalTransaction?.id === it.id && m.status === 'approved'
        )
    );
  }, [internalTransactions, reconciliationMatches]);

  // Formatação de moeda
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  // Formatação de porcentagem
  const formatPercentage = value => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Toggle seleção de match
  const toggleMatchSelection = useCallback(matchId => {
    setSelectedMatches(prev => {
      if (prev.includes(matchId)) {
        return prev.filter(id => id !== matchId);
      } else {
        return [...prev, matchId];
      }
    });
  }, []);

  // Toggle expansão de match
  const toggleMatchExpansion = useCallback(matchId => {
    setExpandedMatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  }, []);

  // Ações em lote
  const handleBulkAction = useCallback(
    action => {
      const selectedMatchObjects = filteredMatches.filter(m =>
        selectedMatches.includes(m.id)
      );
      switch (action) {
        case 'approve':
          selectedMatchObjects.forEach(
            match => onApproveMatch && onApproveMatch(match)
          );
          break;
        case 'reject':
          selectedMatchObjects.forEach(
            match => onRejectMatch && onRejectMatch(match)
          );
          break;
        case 'delete':
          selectedMatchObjects.forEach(
            match => onDeleteMatch && onDeleteMatch(match)
          );
          break;
      }
      setSelectedMatches([]);
    },
    [
      selectedMatches,
      filteredMatches,
      onApproveMatch,
      onRejectMatch,
      onDeleteMatch,
    ]
  );

  // Renderizar cabeçalho do painel
  const renderPanelHeader = () => (
    <div className="card-theme border-b border-light-border dark:border-dark-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-theme-primary">
            Reconciliação Bancária
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            {selectedAccount
              ? `Conta: ${selectedAccount.nome}`
              : 'Selecione uma conta bancária'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onRefreshData && onRefreshData()}
            disabled={loading}
            className="p-2 text-theme-secondary hover:text-theme-primary hover:card-theme rounded-md transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onImportStatement && onImportStatement()}
            className="flex items-center px-4 py-2 bg-blue-600 text-dark-text-primary rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Extrato
          </button>

          <button
            type="button"
            onClick={() => onRunAutoMatch && onRunAutoMatch()}
            disabled={autoMatchRunning}
            className="flex items-center px-4 py-2 bg-green-600 text-dark-text-primary rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Zap
              className={`w-4 h-4 mr-2 ${autoMatchRunning ? 'animate-pulse' : ''}`}
            />
            {autoMatchRunning ? 'Processando...' : 'Auto Match'}
          </button>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
          <div className="text-xs text-theme-secondary mb-1">
            Transações Bancárias
          </div>
          <div className="text-lg font-semibold text-theme-primary">
            {reconciliationStats.totalBankTransactions}
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 mb-1">Reconciliadas</div>
          <div className="text-lg font-semibold text-green-700">
            {reconciliationStats.approvedMatches}
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-xs text-yellow-600 mb-1">Pendentes</div>
          <div className="text-lg font-semibold text-yellow-700">
            {reconciliationStats.pendingMatches}
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-xs text-red-600 mb-1">Não Reconciliadas</div>
          <div className="text-lg font-semibold text-red-700">
            {reconciliationStats.totalBankTransactions -
              reconciliationStats.approvedMatches}
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 mb-1">
            Taxa de Reconciliação
          </div>
          <div className="text-lg font-semibold text-blue-700">
            {formatPercentage(reconciliationStats.reconciliationRate)}
          </div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-xs text-purple-600 mb-1">Valor Reconciliado</div>
          <div className="text-sm font-semibold text-purple-700">
            {formatCurrency(reconciliationStats.matchedBankAmount)}
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar barra de filtros
  const renderFiltersBar = () => {
    if (!showFilters) return null;
    return (
      <div className="bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Filtro de período */}
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              className="w-64"
            />

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-muted dark:text-dark-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por descrição, referência..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>

            {/* Filtro de status */}
            <select
              value={matchStatusFilter}
              onChange={e =>
                onMatchStatusFilterChange &&
                onMatchStatusFilterChange(e.target.value)
              }
              className="px-3 py-2 border border-light-border dark:border-dark-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="rejected">Rejeitados</option>
              <option value="matched">Reconciliados</option>
              <option value="unmatched">Não Reconciliados</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filtro de confiança */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-theme-secondary">
                Confiança min:
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={confidenceFilter}
                onChange={e =>
                  onConfidenceFilterChange &&
                  onConfidenceFilterChange(Number(e.target.value))
                }
                className="w-24"
              />
              <span className="text-sm text-theme-secondary w-10">
                {confidenceFilter}%
              </span>
            </div>

            {/* Ordenação */}
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={e => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-light-border dark:border-dark-border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="confidence_desc">Maior Confiança</option>
              <option value="confidence_asc">Menor Confiança</option>
              <option value="amount_desc">Maior Valor</option>
              <option value="amount_asc">Menor Valor</option>
              <option value="date_desc">Mais Recente</option>
              <option value="date_asc">Mais Antigo</option>
            </select>
          </div>
        </div>

        {/* Ações em lote */}
        {selectedMatches.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
            <span className="text-sm text-blue-700">
              {selectedMatches.length} match
              {selectedMatches.length !== 1 ? 'es' : ''} selecionado
              {selectedMatches.length !== 1 ? 's' : ''}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 bg-green-600 text-dark-text-primary rounded text-sm hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1 inline" />
                Aprovar
              </button>

              <button
                type="button"
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-600 text-dark-text-primary rounded text-sm hover:bg-red-700"
              >
                <X className="w-4 h-4 mr-1 inline" />
                Rejeitar
              </button>

              <button
                type="button"
                onClick={() => setSelectedMatches([])}
                className="px-3 py-1 bg-gray-600 text-dark-text-primary rounded text-sm hover:bg-gray-700"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar lista de matches
  const renderMatchesList = () => (
    <div className="flex-1 overflow-auto">
      {filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-theme-secondary">
          <Target className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum match encontrado</h3>
          <p className="text-sm text-center">
            {reconciliationMatches.length === 0
              ? 'Execute o auto-match ou importe um extrato para começar'
              : 'Ajuste os filtros para ver outros matches'}
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {filteredMatches.map(match => (
            <div key={match.id} className="relative">
              <ReconciliationMatchCard
                match={match}
                isSelected={selectedMatches.includes(match.id)}
                onSelect={() => toggleMatchSelection(match.id)}
                isExpanded={expandedMatches.has(match.id)}
                onToggleExpand={() => toggleMatchExpansion(match.id)}
                onApprove={() => onApproveMatch && onApproveMatch(match)}
                onReject={() => onRejectMatch && onRejectMatch(match)}
                onEdit={() => onCreateManualMatch && onCreateManualMatch(match)}
                onDelete={() => onDeleteMatch && onDeleteMatch(match)}
                compact={compactMode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderizar tabs de visualização
  const renderViewTabs = () => (
    <div className="border-b border-light-border dark:border-dark-border card-theme">
      <div className="flex px-6">
        <button
          type="button"
          onClick={() => onViewModeChange && onViewModeChange('matches')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'matches' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Matches ({filteredMatches.length})
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange && onViewModeChange('bank')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'bank' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Extrato Bancário ({bankTransactions.length})
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange && onViewModeChange('internal')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'internal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          Transações Internas ({internalTransactions.length})
        </button>
      </div>
    </div>
  );
  const containerClasses = `bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full ${className}`;
  if (loading && reconciliationMatches.length === 0) {
    return (
      <div className={containerClasses}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-theme-secondary">
              Carregando dados de reconciliação...
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={containerClasses}>
      {/* Cabeçalho */}
      {renderPanelHeader()}

      {/* Tabs de visualização */}
      {renderViewTabs()}

      {/* Barra de filtros */}
      {renderFiltersBar()}

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'matches' && renderMatchesList()}

        {viewMode === 'bank' && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Transações Bancárias</h3>
            {/* Lista de transações bancárias seria implementada aqui */}
            <div className="text-theme-secondary">
              Lista de transações bancárias em desenvolvimento...
            </div>
          </div>
        )}

        {viewMode === 'internal' && (
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Transações Internas</h3>
            {/* Lista de transações internas seria implementada aqui */}
            <div className="text-theme-secondary">
              Lista de transações internas em desenvolvimento...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
ConciliacaoPanel.propTypes = {
  /**
   * Transações bancárias
   */
  bankTransactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      data: PropTypes.string.isRequired,
      descricao: PropTypes.string.isRequired,
      valor: PropTypes.number.isRequired,
      referencia: PropTypes.string,
    })
  ),
  /**
   * Transações internas (receitas/despesas)
   */
  internalTransactions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      data: PropTypes.string.isRequired,
      descricao: PropTypes.string.isRequired,
      valor: PropTypes.number.isRequired,
      tipo: PropTypes.oneOf(['receita', 'despesa']).isRequired,
    })
  ),
  /**
   * Matches de reconciliação
   */
  reconciliationMatches: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      bankTransaction: PropTypes.object,
      internalTransaction: PropTypes.object,
      confidence: PropTypes.number,
      status: PropTypes.oneOf(['pending', 'approved', 'rejected']).isRequired,
      matchType: PropTypes.oneOf(['automatic', 'manual']).isRequired,
    })
  ),
  /**
   * Conta bancária selecionada
   */
  selectedAccount: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
  }),
  /**
   * Callback para importar extrato
   */
  onImportStatement: PropTypes.func,
  /**
   * Callback para exportar resultados
   */
  onExportResults: PropTypes.func,
  /**
   * Callback para executar auto-match
   */
  onRunAutoMatch: PropTypes.func,
  /**
   * Callback para aprovar match
   */
  onApproveMatch: PropTypes.func,
  /**
   * Callback para rejeitar match
   */
  onRejectMatch: PropTypes.func,
  /**
   * Callback para criar match manual
   */
  onCreateManualMatch: PropTypes.func,
  /**
   * Callback para deletar match
   */
  onDeleteMatch: PropTypes.func,
  /**
   * Callback para atualizar dados
   */
  onRefreshData: PropTypes.func,
  /**
   * Range de datas para filtro
   */
  dateRange: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }),
  /**
   * Callback para mudança de período
   */
  onDateRangeChange: PropTypes.func,
  /**
   * Filtro por status de match
   */
  matchStatusFilter: PropTypes.string,
  /**
   * Callback para filtro de status
   */
  onMatchStatusFilterChange: PropTypes.func,
  /**
   * Filtro por confiança mínima (0-100)
   */
  confidenceFilter: PropTypes.number,
  /**
   * Callback para filtro de confiança
   */
  onConfidenceFilterChange: PropTypes.func,
  /**
   * Filtro por range de valores
   */
  amountRangeFilter: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
  }),
  /**
   * Callback para filtro de valores
   */
  onAmountRangeFilterChange: PropTypes.func,
  /**
   * Threshold para auto-match (0-1)
   */
  autoMatchThreshold: PropTypes.number,
  /**
   * Callback para threshold
   */
  onAutoMatchThresholdChange: PropTypes.func,
  /**
   * Mostrar apenas não reconciliadas
   */
  showOnlyUnreconciled: PropTypes.bool,
  /**
   * Callback para toggle não reconciliadas
   */
  onShowOnlyUnreconciledChange: PropTypes.func,
  /**
   * Estado de carregamento
   */
  loading: PropTypes.bool,
  /**
   * Auto-match em execução
   */
  autoMatchRunning: PropTypes.bool,
  /**
   * Modo de visualização
   */
  viewMode: PropTypes.oneOf(['matches', 'bank', 'internal']),
  /**
   * Callback para mudança de modo
   */
  onViewModeChange: PropTypes.func,
  /**
   * Mostrar barra de filtros
   */
  showFilters: PropTypes.bool,
  /**
   * Modo compacto
   */
  compactMode: PropTypes.bool,
  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string,
};

// Componente de preview para demonstração
export const ConciliacaoPanelPreview = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 2, 31),
  });
  const [matchStatusFilter, setMatchStatusFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [viewMode, setViewMode] = useState('matches');

  // Mock data
  const mockBankTransactions = [
    {
      id: 'bank1',
      data: '2024-01-15',
      descricao: 'PIX Recebido - João Silva',
      valor: 150.0,
      referencia: 'PIX123456',
    },
    {
      id: 'bank2',
      data: '2024-01-16',
      descricao: 'Débito Automático - Conta de Luz',
      valor: -89.5,
      referencia: 'DEB789',
    },
  ];
  const mockInternalTransactions = [
    {
      id: 'int1',
      data: '2024-01-15',
      descricao: 'Serviço de Corte - João Silva',
      valor: 150.0,
      tipo: 'receita',
    },
    {
      id: 'int2',
      data: '2024-01-16',
      descricao: 'Conta de Luz - Energia',
      valor: 89.5,
      tipo: 'despesa',
    },
  ];
  const mockMatches = [
    {
      id: 'match1',
      bankTransaction: mockBankTransactions[0],
      internalTransaction: mockInternalTransactions[0],
      confidence: 0.95,
      status: 'pending',
      matchType: 'automatic',
      matchReasons: ['Valor igual', 'Data próxima', 'Descrição similar'],
    },
    {
      id: 'match2',
      bankTransaction: mockBankTransactions[1],
      internalTransaction: mockInternalTransactions[1],
      confidence: 0.87,
      status: 'approved',
      matchType: 'automatic',
      matchReasons: ['Valor próximo', 'Data igual'],
    },
  ];
  const mockAccount = {
    id: 'acc1',
    nome: 'Conta Corrente - Banco do Brasil',
  };
  const handleAction = (action, data) => {
    // eslint-disable-next-line no-console
    console.log(`Ação: ${action}`, data);
  };
  return (
    <div className="space-y-6 p-4 max-w-7xl">
      <h3 className="text-lg font-semibold">ConciliacaoPanel Preview</h3>

      {/* Painel completo */}
      <div className="h-96">
        <ConciliacaoPanel
          bankTransactions={mockBankTransactions}
          internalTransactions={mockInternalTransactions}
          reconciliationMatches={mockMatches}
          selectedAccount={mockAccount}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          matchStatusFilter={matchStatusFilter}
          onMatchStatusFilterChange={setMatchStatusFilter}
          confidenceFilter={confidenceFilter}
          onConfidenceFilterChange={setConfidenceFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onImportStatement={() => handleAction('Import Statement')}
          onRunAutoMatch={() => handleAction('Run Auto Match')}
          onApproveMatch={match => handleAction('Approve Match', match)}
          onRejectMatch={match => handleAction('Reject Match', match)}
          onCreateManualMatch={match =>
            handleAction('Create Manual Match', match)
          }
          onDeleteMatch={match => handleAction('Delete Match', match)}
          onRefreshData={() => handleAction('Refresh Data')}
          showFilters={true}
        />
      </div>

      {/* Versão em loading */}
      <div className="h-64">
        <h4 className="text-md font-medium mb-2">Estado de carregamento</h4>
        <ConciliacaoPanel loading={true} selectedAccount={mockAccount} />
      </div>
    </div>
  );
};
export default ConciliacaoPanel;
