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
      <div className="border-theme-border mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-theme-primary text-lg font-semibold">
            Resumo de Comissões
          </h3>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          disabled={commissionData.loading || !commissionData.itemsCount}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Profissional */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Profissional
          </label>
          <select
            name="professionalId"
            value={filters.professionalId}
            onChange={handleFilterChange}
            className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-surface"
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
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            <Calendar className="mr-1 inline h-4 w-4" />
            Data Inicial
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-surface"
          />
        </div>

        {/* Data Final */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            <Calendar className="mr-1 inline h-4 w-4" />
            Data Final
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-surface"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            <Filter className="mr-1 inline h-4 w-4" />
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-dark-surface"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagas</option>
          </select>
        </div>
      </div>

      {/* Estatísticas */}
      {commissionData.loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
          <p className="text-theme-muted">Carregando comissões...</p>
        </div>
      ) : commissionData.itemsCount > 0 ? (
        <div className="space-y-4">
          {/* Cards de Totais */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total */}
            <div className="card-theme border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Total de Comissões
                </span>
                <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(commissionData.totalCommissions)}
              </p>
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                {commissionData.itemsCount} serviço
                {commissionData.itemsCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Pagas */}
            <div className="card-theme border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Comissões Pagas
                </span>
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(commissionData.paidCommissions)}
              </p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                {commissionData.totalCommissions > 0
                  ? `${((commissionData.paidCommissions / commissionData.totalCommissions) * 100).toFixed(1)}% do total`
                  : '0% do total'}
              </p>
            </div>

            {/* Pendentes */}
            <div className="card-theme border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Comissões Pendentes
                </span>
                <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(commissionData.pendingCommissions)}
              </p>
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                {commissionData.totalCommissions > 0
                  ? `${((commissionData.pendingCommissions / commissionData.totalCommissions) * 100).toFixed(1)}% do total`
                  : '0% do total'}
              </p>
            </div>
          </div>

          {/* Botão Ver Detalhes */}
          <div className="border-theme-border border-t pt-4">
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
        <div className="py-12 text-center">
          <Filter className="text-theme-muted mx-auto mb-4 h-16 w-16" />
          <h4 className="text-theme-primary mb-2 text-lg font-semibold">
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
