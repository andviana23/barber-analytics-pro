import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';

/**
 * CommissionSummaryCard - Organism para exibir resumo de comissões
 *
 * Features:
 * - Filtros por profissional e período
 * - Exibe total de comissões no período
 * - Breakdown por status (pagas/pendentes)
 * - Link para relatório detalhado
 * - Exportação de dados
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @component
 * @param {Object} props
 * @param {Array} props.professionals - Lista de profissionais para filtro
 * @param {Function} props.onFetchCommissions - Callback para buscar comissões
 * @param {Function} props.onExport - Callback para exportar relatório
 * @param {Function} props.onViewDetails - Callback para ver detalhes
 */
const CommissionSummaryCard = ({
  professionals = [],
  onFetchCommissions,
  onExport,
  onViewDetails,
}) => {
  // Estado dos filtros
  const [filters, setFilters] = useState({
    professionalId: '',
    startDate: '',
    endDate: '',
    status: 'all', // all, paid, pending
  });

  // Estado dos dados
  const [commissionData, setCommissionData] = useState({
    totalCommissions: 0,
    paidCommissions: 0,
    pendingCommissions: 0,
    itemsCount: 0,
    loading: false,
  });

  // Carregar dados ao mudar filtros
  useEffect(() => {
    if (filters.professionalId || filters.startDate || filters.endDate) {
      fetchData();
    }
  }, [filters]);

  // Buscar dados de comissões
  const fetchData = async () => {
    if (!onFetchCommissions) return;
    setCommissionData(prev => ({
      ...prev,
      loading: true,
    }));
    try {
      const result = await onFetchCommissions(filters);
      if (result.error) {
        console.error('Erro ao buscar comissões:', result.error);
        setCommissionData(prev => ({
          ...prev,
          loading: false,
        }));
        return;
      }
      setCommissionData({
        totalCommissions: result.data?.totalCommissions || 0,
        paidCommissions: result.data?.paidCommissions || 0,
        pendingCommissions: result.data?.pendingCommissions || 0,
        itemsCount: result.data?.itemsCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Erro inesperado:', error);
      setCommissionData(prev => ({
        ...prev,
        loading: false,
      }));
    }
  };

  // Handler de mudança nos filtros
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler de exportação
  const handleExport = () => {
    if (onExport) {
      onExport(filters);
    }
  };

  // Handler de ver detalhes
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(filters);
    }
  };
  return (
    <div className="card-theme">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-border">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-theme-primary">
            Resumo de Comissões
          </h3>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={commissionData.loading || !commissionData.itemsCount}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Profissional */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Profissional
          </label>
          <select
            name="professionalId"
            value={filters.professionalId}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 rounded-lg border border-theme-border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todos os profissionais</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.name}
              </option>
            ))}
          </select>
        </div>

        {/* Data Inicial */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Inicial
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 rounded-lg border border-theme-border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Data Final */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data Final
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 rounded-lg border border-theme-border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            <Filter className="w-4 h-4 inline mr-1" />
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 rounded-lg border border-theme-border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
          </select>
        </div>
      </div>

      {/* Estatísticas */}
      {commissionData.loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-theme-muted">Carregando comissões...</p>
        </div>
      ) : commissionData.itemsCount > 0 ? (
        <div className="space-y-4">
          {/* Cards de Totais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total */}
            <div className="card-theme bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Total de Comissões
                </span>
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(commissionData.totalCommissions)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {commissionData.itemsCount} serviço
                {commissionData.itemsCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Pagas */}
            <div className="card-theme bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Comissões Pagas
                </span>
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(commissionData.paidCommissions)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {commissionData.totalCommissions > 0
                  ? `${((commissionData.paidCommissions / commissionData.totalCommissions) * 100).toFixed(1)}% do total`
                  : '0% do total'}
              </p>
            </div>

            {/* Pendentes */}
            <div className="card-theme bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Comissões Pendentes
                </span>
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(commissionData.pendingCommissions)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {commissionData.totalCommissions > 0
                  ? `${((commissionData.pendingCommissions / commissionData.totalCommissions) * 100).toFixed(1)}% do total`
                  : '0% do total'}
              </p>
            </div>
          </div>

          {/* Botão Ver Detalhes */}
          <div className="pt-4 border-t border-theme-border">
            <Button
              variant="primary"
              onClick={handleViewDetails}
              className="w-full"
            >
              Ver Relatório Detalhado
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Filter className="w-16 h-16 mx-auto mb-4 text-theme-muted" />
          <h4 className="text-lg font-semibold text-theme-primary mb-2">
            Nenhuma comissão encontrada
          </h4>
          <p className="text-theme-muted">
            Selecione um profissional e período para visualizar as comissões
          </p>
        </div>
      )}
    </div>
  );
};
export default CommissionSummaryCard;
