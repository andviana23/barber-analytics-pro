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
import { useToast } from '../context/ToastContext';
import { useUnit } from '../context/UnitContext';
import {
  useCommissions,
  useDeleteCommission,
  useMarkCommissionPaid,
  useCommissionTotals,
} from '../hooks/useCommissions';
import {
  getCommissionStatusLabel,
  getCommissionStatusColor,
  formatCommissionForDisplay,
} from '../dtos/CommissionDTO';
import CommissionFormModal from '../organisms/CommissionFormModal';
import { exportManualCommissionsToPDF } from '../utils/exportCommissions';
import { ProfissionaisService } from '../services/profissionaisService';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

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
      c =>
        c.description?.toLowerCase().includes(search) ||
        c.professional?.name?.toLowerCase().includes(search) ||
        c.notes?.toLowerCase().includes(search)
    );
  }, [commissions, searchTerm]);

  // Formatação
  const formatCurrency = value => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = dateString => {
    if (!dateString) return '-';
    return format(parseISO(dateString), 'dd/MM/yyyy', {
      locale: require('date-fns/locale/pt-BR'),
    });
  };

  // Handlers
  const handleCreate = () => {
    setSelectedCommission(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = commission => {
    setSelectedCommission(commission);
    setIsFormModalOpen(true);
  };

  const handleDelete = commission => {
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

  const handleMarkAsPaid = commission => {
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
      const result = await exportManualCommissionsToPDF(
        filteredCommissions,
        filters
      );
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

  const getStatusBadge = commission => {
    const status = commission.status;
    const color = getCommissionStatusColor(status);
    const label = getCommissionStatusLabel(status);

    const colorClasses = {
      PENDING:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
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
        <p className="text-theme-secondary">
          Selecione uma unidade para visualizar comissões
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
              <DollarSign className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-500 opacity-60 dark:text-blue-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Total de Comissões
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(totals?.total || 0)}
          </p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {filteredCommissions.length} comissão
            {filteredCommissions.length !== 1 ? 'ões' : ''} no período
          </p>
        </div>

        {/* Pagas */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-green-300 dark:hover:border-green-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-success p-3 shadow-lg">
              <CheckCircle className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500 opacity-60 dark:text-green-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Comissões Pagas
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(totals?.paid || 0)}
          </p>
          <p className="text-xs font-medium text-green-600 dark:text-green-400">
            {filteredCommissions.filter(c => c.status === 'PAID').length} paga
            {filteredCommissions.filter(c => c.status === 'PAID').length !== 1
              ? 's'
              : ''}
          </p>
        </div>

        {/* Pendentes */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-yellow-300 dark:hover:border-yellow-700">
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 p-3 shadow-lg">
              <Clock className="text-dark-text-primary h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-yellow-500 opacity-60 dark:text-yellow-400" />
          </div>
          <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
            Comissões Pendentes
          </p>
          <p className="text-theme-primary mb-1 text-3xl font-bold">
            {formatCurrency(totals?.pending || 0)}
          </p>
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
            {filteredCommissions.filter(c => c.status === 'PENDING').length}{' '}
            pendente
            {filteredCommissions.filter(c => c.status === 'PENDING').length !==
            1
              ? 's'
              : ''}
          </p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-light-border dark:border-dark-border dark:hover:border-dark-border">
        <div className="flex flex-col gap-4">
          {/* Linha 1: Busca e Botões */}
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            {/* Busca */}
            <div className="relative max-w-md flex-1">
              <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Buscar por descrição, profissional..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 placeholder-gray-400 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCreate}
                className="text-dark-text-primary flex transform items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                Nova Comissão
              </button>
              <button
                onClick={handleExportPDF}
                disabled={filteredCommissions.length === 0}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-green-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Linha 2: Filtros */}
          <div className="flex flex-wrap gap-2">
            {/* Profissional */}
            <select
              value={filters.professional_id}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  professional_id: e.target.value,
                }))
              }
              className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
            >
              <option value="">👤 Todos os Profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({ ...prev, status: e.target.value }))
              }
              className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
            >
              <option value="">📋 Todos os Status</option>
              <option value="PENDING">⏳ Pendentes</option>
              <option value="PAID">✅ Pagas</option>
              <option value="CANCELLED">❌ Canceladas</option>
            </select>

            {/* Data Início */}
            <div className="card-theme flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <input
                type="date"
                value={filters.start_date}
                onChange={e =>
                  setFilters(prev => ({ ...prev, start_date: e.target.value }))
                }
                className="text-theme-primary cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>

            {/* Data Fim */}
            <div className="card-theme flex items-center gap-2 rounded-xl border-2 border-light-border px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <input
                type="date"
                value={filters.end_date}
                onChange={e =>
                  setFilters(prev => ({ ...prev, end_date: e.target.value }))
                }
                className="text-theme-primary cursor-pointer bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card-theme overflow-hidden rounded-xl border-2 border-light-border shadow-lg dark:border-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-primary">
              <tr>
                <th className="text-dark-text-primary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Profissional
                </th>
                <th className="text-dark-text-primary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Descrição
                </th>
                <th className="text-dark-text-primary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Data Referência
                </th>
                <th className="text-dark-text-primary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Valor
                </th>
                <th className="text-dark-text-primary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                  Status
                </th>
                <th className="text-dark-text-primary px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      <span className="text-theme-secondary font-medium">
                        Carregando comissões...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCommissions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="text-theme-secondary px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Nenhuma comissão encontrada</p>
                      <p className="text-xs">
                        Tente ajustar os filtros ou adicione uma nova comissão
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(commission => (
                  <tr
                    key={commission.id}
                    className="dark:hover:to-gray-750/50 group transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/50 dark:hover:from-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-primary/10 rounded-lg p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-theme-primary text-sm font-semibold">
                            {commission.professional?.name || 'N/A'}
                          </p>
                          {commission.order && (
                            <p className="text-theme-secondary text-xs">
                              Comanda #{commission.order.id.slice(0, 8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-theme-primary text-sm font-medium">
                        {commission.description || '-'}
                      </p>
                      {commission.notes && (
                        <p className="text-theme-secondary mt-1 text-xs">
                          {commission.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-theme-primary text-sm font-medium">
                        {formatDate(commission.reference_date)}
                      </p>
                      {commission.paid_at && (
                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
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
                            className="rounded-lg p-2 text-green-600 transition-all duration-200 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                            title="Marcar como paga"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(commission)}
                          className="rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {commission.status !== 'PAID' && (
                          <button
                            onClick={() => handleDelete(commission)}
                            className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
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
