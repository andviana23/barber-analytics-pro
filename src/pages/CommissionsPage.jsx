import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Calendar,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  X,
  Download,
  Filter,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { useUnit } from '../../context/UnitContext';
import { useCommissions, useDeleteCommission, useMarkCommissionPaid, useCommissionTotals } from '../../hooks/useCommissions';
import { getCommissionStatusLabel, getCommissionStatusColor, formatCommissionForDisplay } from '../../dtos/CommissionDTO';
import CommissionFormModal from '../organisms/CommissionFormModal';
import { exportManualCommissionsToPDF } from '../../utils/exportCommissions';
import { ProfissionaisService } from '../../services/profissionaisService';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

/**
 * Página de Comissões (Gestão Manual)
 *
 * Design System Compliant:
 * - Tokens de cor do Design System
 * - Classes temáticas (.card-theme, .text-theme-*)
 * - Grid system responsivo
 * - Tipografia consistente
 * - Acessibilidade (ARIA, foco visível)
 * - UX melhorada com feedback visual
 */
const CommissionsPage = () => {
  const { showToast } = useToast();
  const { selectedUnit } = useUnit();
  const unitId = selectedUnit?.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [professionals, setProfessionals] = useState([]);

  // Filtros
  const [filters, setFilters] = useState({
    professional_id: '',
    status: '',
    start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Paginação
  const [page, setPage] = useState(1);
  const limit = 20;

  // Buscar comissões
  const {
    data: commissions = [],
    isLoading,
    error,
    refetch,
  } = useCommissions(
    {
      unit_id: unitId,
      ...filters,
      page,
      limit,
    },
    {
      enabled: !!unitId,
    }
  );

  // Buscar totalizadores
  const { data: totals } = useCommissionTotals({
    unit_id: unitId,
    ...filters,
  });

  const { mutate: deleteCommission } = useDeleteCommission();
  const { mutate: markAsPaid } = useMarkCommissionPaid();

  // Carregar profissionais para filtro
  useEffect(() => {
    if (unitId) {
      loadProfessionals();
    }
  }, [unitId]);

  const loadProfessionals = async () => {
    try {
      const profs = await ProfissionaisService.getProfissionais({
        unitId: unitId,
        isActive: true,
      });
      setProfessionals(profs || []);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  // Filtrar comissões por busca
  const filteredCommissions = useMemo(() => {
    if (!searchTerm) return commissions;

    const search = searchTerm.toLowerCase();
    return commissions.filter(
      (c) =>
        c.description?.toLowerCase().includes(search) ||
        c.professional?.name?.toLowerCase().includes(search) ||
        c.notes?.toLowerCase().includes(search)
    );
  }, [commissions, searchTerm]);

  // Formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: require('date-fns/locale/pt-BR') });
  };

  // Handlers
  const handleCreate = () => {
    setSelectedCommission(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (commission) => {
    setSelectedCommission(commission);
    setIsFormModalOpen(true);
  };

  const handleDelete = (commission) => {
    setSelectedCommission(commission);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCommission) {
      deleteCommission(selectedCommission.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSelectedCommission(null);
          refetch();
        },
      });
    }
  };

  const handleMarkAsPaid = (commission) => {
    markAsPaid(
      { id: commission.id },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const handleExportPDF = async () => {
    try {
      const result = await exportManualCommissionsToPDF(filteredCommissions, filters);
      if (result.success) {
        showToast({
          type: 'success',
          message: 'PDF exportado com sucesso!',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Erro ao exportar PDF',
        description: error.message,
      });
    }
  };

  const getStatusBadge = (commission) => {
    const status = commission.status;
    const color = getCommissionStatusColor(status);
    const label = getCommissionStatusLabel(status);

    const colorClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          colorClasses[status] || colorClasses.PENDING
        }`}
      >
        {status === 'PENDING' && <Clock className="h-3 w-3" />}
        {status === 'PAID' && <CheckCircle className="h-3 w-3" />}
        {status === 'CANCELLED' && <X className="h-3 w-3" />}
        {label}
      </span>
    );
  };

  if (!unitId) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-theme-secondary">Selecione uma unidade para visualizar comissões</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-primary rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-dark-text-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400 opacity-60" />
          </div>
          <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2">
            Total de Comissões
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-1">
            {formatCurrency(totals?.total || 0)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {filteredCommissions.length} comissão{filteredCommissions.length !== 1 ? 'ões' : ''} no período
          </p>
        </div>

        {/* Pagas */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-success rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-dark-text-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400 opacity-60" />
          </div>
          <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2">
            Comissões Pagas
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-1">
            {formatCurrency(totals?.paid || 0)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            {filteredCommissions.filter((c) => c.status === 'PAID').length} paga
            {filteredCommissions.filter((c) => c.status === 'PAID').length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Pendentes */}
        <div className="card-theme p-5 rounded-xl border-2 border-transparent hover:border-yellow-300 dark:hover:border-yellow-700 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-dark-text-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-yellow-500 dark:text-yellow-400 opacity-60" />
          </div>
          <p className="text-xs font-bold text-theme-secondary uppercase tracking-wider mb-2">
            Comissões Pendentes
          </p>
          <p className="text-3xl font-bold text-theme-primary mb-1">
            {formatCurrency(totals?.pending || 0)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            {filteredCommissions.filter((c) => c.status === 'PENDING').length} pendente
            {filteredCommissions.filter((c) => c.status === 'PENDING').length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="card-theme rounded-xl p-5 border-2 border-transparent hover:border-light-border dark:border-dark-border dark:hover:border-dark-border transition-all duration-300">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca e Botões */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-muted dark:text-dark-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por descrição, profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-theme-primary placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-primary hover:from-blue-700 hover:to-indigo-700 text-dark-text-primary font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Nova Comissão
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredCommissions.length === 0}
                className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Linha 2: Filtros */}
          <div className="flex flex-wrap gap-2">
            {/* Profissional */}
            <select
              value={filters.professional_id}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, professional_id: e.target.value }))
              }
              className="px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-theme-primary focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <option value="">👤 Todos os Profissionais</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-sm font-semibold text-theme-primary focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <option value="">📋 Todos os Status</option>
              <option value="PENDING">⏳ Pendentes</option>
              <option value="PAID">✅ Pagas</option>
              <option value="CANCELLED">❌ Canceladas</option>
            </select>

            {/* Data Início */}
            <div className="flex items-center gap-2 px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, start_date: e.target.value }))
                }
                className="bg-transparent text-sm font-medium text-theme-primary focus:outline-none cursor-pointer"
              />
            </div>

            {/* Data Fim */}
            <div className="flex items-center gap-2 px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
              <Calendar className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, end_date: e.target.value }))
                }
                className="bg-transparent text-sm font-medium text-theme-primary focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card-theme rounded-xl overflow-hidden border-2 border-light-border dark:border-dark-border shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-primary">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Profissional
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Data Referência
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-dark-text-primary uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-theme-secondary font-medium">
                        Carregando comissões...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-theme-secondary">
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Nenhuma comissão encontrada</p>
                      <p className="text-xs">
                        Tente ajustar os filtros ou adicione uma nova comissão
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((commission) => (
                  <tr
                    key={commission.id}
                    className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-750/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-primary/10 rounded-lg">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-theme-primary">
                            {commission.professional?.name || 'N/A'}
                          </p>
                          {commission.order && (
                            <p className="text-xs text-theme-secondary">
                              Comanda #{commission.order.id.slice(0, 8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-theme-primary">
                        {commission.description || '-'}
                      </p>
                      {commission.notes && (
                        <p className="text-xs text-theme-secondary mt-1">{commission.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-theme-primary">
                        {formatDate(commission.reference_date)}
                      </p>
                      {commission.paid_at && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Paga em {formatDate(commission.paid_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(commission.amount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(commission)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {commission.status === 'PENDING' && (
                          <button
                            onClick={() => handleMarkAsPaid(commission)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                            title="Marcar como paga"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(commission)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {commission.status !== 'PAID' && (
                          <button
                            onClick={() => handleDelete(commission)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      <CommissionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedCommission(null);
        }}
        commission={selectedCommission}
        unitId={unitId}
        onSuccess={() => {
          refetch();
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCommission(null);
        }}
        onDelete={handleConfirmDelete}
        title="Excluir Comissão"
        message={`Tem certeza que deseja excluir esta comissão? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default CommissionsPage;

