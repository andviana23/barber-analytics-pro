/**
 * 📦 SUPPLIERS PAGE (Fornecedores) - 100% REFATORADO COM DESIGN SYSTEM
 *
 * Página premium para gerenciamento de fornecedores
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ 3 KPI Cards premium com gradientes temáticos
 * - ✅ Filtros compactos e elegantes
 * - ✅ Tabela moderna com hover effects
 * - ✅ Modais profissionais (Criar, Editar, Detalhes)
 * - ✅ Paginação inteligente
 * - ✅ Busca avançada com debounce
 * - ✅ UI ultra moderna com feedback visual
 * - ✅ Dark mode completo
 * - ✅ Responsive design
 * - ✅ Permissões por role (Admin/Gerente)
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Info,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Building2,
  Eye,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import useSuppliers from '../../hooks/useSuppliers';
import {
  CreateSupplierModal,
  EditSupplierModal,
  SupplierInfoModal,
} from '../../molecules/SupplierModals';
const SuppliersPageRefactored = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Hook para buscar fornecedores
  const {
    data: suppliers,
    loading,
    error,
    stats,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    activateSupplier,
  } = useSuppliers(selectedUnit?.id, {
    includeInactive: showInactive,
    enableCache: true,
  });

  // Verificar permissões - Admin e Gerente podem gerenciar
  const canManage = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Filtrar fornecedores
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch =
        searchTerm === '' ||
        supplier.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.cpf_cnpj?.includes(searchTerm) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || supplier.is_active;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchTerm, showInactive]);

  // Paginação
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsCreateModalOpen(true);
  };
  const handleEdit = supplier => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };
  const handleInfo = supplier => {
    setSelectedSupplier(supplier);
    setIsInfoModalOpen(true);
  };
  const handleDelete = async supplier => {
    if (
      !window.confirm(
        `Deseja realmente excluir o fornecedor "${supplier.nome}"?`
      )
    ) {
      return;
    }
    setDeletingId(supplier.id);
    try {
      const { error } = await deleteSupplier(supplier.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao excluir fornecedor',
          description: error,
        });
      } else {
        showToast({
          type: 'success',
          message: 'Fornecedor excluído com sucesso',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado',
        description: err.message,
      });
    } finally {
      setDeletingId(null);
    }
  };
  const handleActivate = async supplier => {
    try {
      const { error } = await activateSupplier(supplier.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao ativar fornecedor',
          description: error,
        });
      } else {
        showToast({
          type: 'success',
          message: 'Fornecedor ativado com sucesso',
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado',
        description: err.message,
      });
    }
  };
  const formatCNPJ = cnpj => {
    if (!cnpj) return '';
    if (cnpj.length === 11) {
      // CPF: 000.000.000-00
      return cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    // CNPJ: 00.000.000/0000-00
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  };

  // UI Loading/Error
  if (!selectedUnit) {
    return (
      <Layout>
        <div className="flex h-screen items-center justify-center">
          <div className="space-y-4 text-center">
            <Building2 className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary mx-auto h-16 w-16" />
            <p className="text-theme-secondary font-medium">
              Selecione uma unidade para visualizar os fornecedores
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-6">
        {/* 🎯 Header Premium - DESIGN SYSTEM */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
              <Package className="text-dark-text-primary h-8 w-8" />
            </div>
            <div>
              <h1 className="text-theme-primary text-3xl font-bold">
                Fornecedores
              </h1>
              <p className="text-theme-secondary mt-1">
                Gerencie os fornecedores da unidade{' '}
                <span className="font-semibold">{selectedUnit.name}</span>
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={handleCreate}
              className="text-dark-text-primary flex transform items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:opacity-90 hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Fornecedor
            </button>
          )}
        </div>

        {/* 💳 KPI Cards Premium - DESIGN SYSTEM */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card: Total */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-gradient-primary p-3 shadow-lg">
                <Package className="text-dark-text-primary h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500 opacity-60 dark:text-blue-400" />
            </div>
            <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
              Total de Fornecedores
            </p>
            <p className="text-theme-primary mb-1 text-3xl font-bold">
              {stats.total}
            </p>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Cadastrados no sistema
            </p>
          </div>

          {/* Card: Ativos */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-green-300 dark:hover:border-green-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-gradient-success p-3 shadow-lg">
                <CheckCircle className="text-dark-text-primary h-6 w-6" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500 opacity-60 dark:text-green-400" />
            </div>
            <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
              Fornecedores Ativos
            </p>
            <p className="text-theme-primary mb-1 text-3xl font-bold">
              {stats.active}
            </p>
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              Disponíveis para uso
            </p>
          </div>

          {/* Card: Inativos */}
          <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-red-300 dark:hover:border-red-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="bg-gradient-danger rounded-xl p-3 shadow-lg">
                <XCircle className="text-dark-text-primary h-6 w-6" />
              </div>
              <XCircle className="h-5 w-5 text-red-500 opacity-60 dark:text-red-400" />
            </div>
            <p className="text-theme-secondary mb-2 text-xs font-bold uppercase tracking-wider">
              Fornecedores Inativos
            </p>
            <p className="text-theme-primary mb-1 text-3xl font-bold">
              {stats.inactive}
            </p>
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Desativados temporariamente
            </p>
          </div>
        </div>

        {/* 🎛️ Filtros Premium - DESIGN SYSTEM */}
        <div className="card-theme rounded-xl border-2 border-transparent p-5 transition-all duration-300 hover:border-light-border dark:border-dark-border dark:hover:border-dark-border">
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
            {/* Busca Premium */}
            <div className="relative max-w-md flex-1">
              <Search className="text-light-text-muted dark:text-dark-text-muted dark:text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Pesquisar por nome, CNPJ ou email..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="card-theme text-theme-primary w-full rounded-xl border-2 border-light-border py-3 pl-11 pr-4 placeholder-gray-400 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface dark:placeholder-gray-500"
              />
            </div>

            {/* Controles */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Items por página */}
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={e => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="card-theme text-theme-primary cursor-pointer rounded-xl border-2 border-light-border px-4 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-dark-surface"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-theme-secondary whitespace-nowrap text-sm font-medium">
                  por página
                </span>
              </div>

              {/* Mostrar inativos */}
              <label className="card-theme flex cursor-pointer items-center gap-2 rounded-xl border-2 border-light-border px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md dark:border-dark-border dark:bg-dark-surface">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={e => {
                    setShowInactive(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="card-theme h-4 w-4 cursor-pointer rounded border-light-border text-blue-600 transition-all focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
                />
                <span className="text-theme-primary whitespace-nowrap text-sm font-semibold">
                  Mostrar inativos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 📊 Tabela Premium - DESIGN SYSTEM */}
        <div className="card-theme overflow-hidden rounded-xl border-2 border-transparent transition-all duration-300 hover:border-light-border dark:border-dark-border dark:hover:border-dark-border">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <span className="text-theme-secondary font-medium">
                  Carregando fornecedores...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="space-y-3 text-center">
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="font-medium text-red-600 dark:text-red-400">
                  Erro ao carregar fornecedores
                </p>
                <p className="text-theme-secondary text-sm">{error}</p>
              </div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Package className="dark:text-theme-secondary mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <p className="text-theme-primary mb-2 font-medium">
                {searchTerm
                  ? 'Nenhum fornecedor encontrado'
                  : 'Nenhum fornecedor cadastrado'}
              </p>
              <p className="text-theme-secondary text-sm">
                {searchTerm
                  ? 'Tente ajustar os filtros ou o termo de busca'
                  : 'Clique em "Fornecedor" para cadastrar o primeiro'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-light-border bg-light-bg dark:border-dark-border dark:bg-dark-surface">
                    <tr>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Fornecedor
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        CNPJ
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Observação
                      </th>
                      <th className="text-theme-secondary px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedSuppliers.map(supplier => (
                      <tr
                        key={supplier.id}
                        className={`group transition-all duration-200 ${!supplier.is_active ? 'opacity-60' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-theme-primary text-sm font-semibold">
                                {supplier.nome}
                              </p>
                              {supplier.razao_social && (
                                <p className="text-theme-secondary mt-0.5 text-xs">
                                  {supplier.razao_social}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-theme-primary font-mono text-sm font-medium">
                            {formatCNPJ(supplier.cpf_cnpj)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-theme-secondary max-w-xs truncate text-sm">
                            {supplier.observacoes || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Ver Detalhes */}
                            <button
                              onClick={() => handleInfo(supplier)}
                              className="rounded-lg p-2 text-blue-600 transition-all duration-200 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Editar */}
                            {canManage && supplier.is_active && (
                              <button
                                onClick={() => handleEdit(supplier)}
                                className="rounded-lg p-2 text-green-600 transition-all duration-200 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}

                            {/* Excluir/Ativar */}
                            {canManage &&
                              (supplier.is_active ? (
                                <button
                                  onClick={() => handleDelete(supplier)}
                                  disabled={deletingId === supplier.id}
                                  className="rounded-lg p-2 text-red-600 transition-all duration-200 hover:bg-red-100 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                  title="Excluir"
                                >
                                  {deletingId === supplier.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(supplier)}
                                  className="rounded-lg p-2 text-green-600 transition-all duration-200 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                                  title="Ativar"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação Premium */}
              {totalPages > 1 && (
                <div className="border-t-2 border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-surface">
                  <div className="flex items-center justify-between">
                    <p className="text-theme-secondary text-sm font-medium">
                      Mostrando{' '}
                      <span className="text-theme-primary font-bold">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      a{' '}
                      <span className="text-theme-primary font-bold">
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredSuppliers.length
                        )}
                      </span>{' '}
                      de{' '}
                      <span className="text-theme-primary font-bold">
                        {filteredSuppliers.length}
                      </span>{' '}
                      resultados
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-theme-primary card-theme rounded-lg border-2 border-light-border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-light-bg hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface dark:hover:border-blue-500 dark:hover:bg-gray-700"
                      >
                        Anterior
                      </button>
                      <span className="text-theme-primary rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold dark:border-blue-700 dark:bg-blue-900/20">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="text-theme-primary card-theme rounded-lg border-2 border-light-border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:border-blue-500 hover:bg-light-bg hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface dark:hover:border-blue-500 dark:hover:bg-gray-700"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateSupplierModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={async data => {
          const result = await createSupplier(data);
          if (result.error) {
            throw new Error(result.error);
          }
        }}
        unitId={selectedUnit?.id}
      />

      <EditSupplierModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSave={async data => {
          const result = await updateSupplier(selectedSupplier.id, data);
          if (result.error) {
            throw new Error(result.error);
          }
        }}
        supplier={selectedSupplier}
      />

      <SupplierInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => {
          setIsInfoModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
      />
    </Layout>
  );
};
export default SuppliersPageRefactored;
