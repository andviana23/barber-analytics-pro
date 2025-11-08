/**
 * SUPPLIERS PAGE (Fornecedores)
 * Página para gerenciamento de fornecedores
 *
 * Features:
 * - Listagem de fornecedores com paginação
 * - Criar novo fornecedor
 * - Editar fornecedor existente
 * - Visualizar detalhes
 * - Desativar/ativar fornecedor
 * - Busca e filtros
 * - KPIs (Total, Ativos, Inativos)
 *
 * Baseado na referência visual fornecida
 */

import React, { useState, useMemo } from 'react';
import { Plus, Search, Package, Info, Edit2, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import useSuppliers from '../../hooks/useSuppliers';
import CreateSupplierModalRefactored from '../../molecules/SupplierModals/CreateSupplierModalRefactored';
import EditSupplierModal from '../../molecules/SupplierModals/EditSupplierModal';
import SupplierInfoModal from '../../molecules/SupplierModals/SupplierInfoModal';
const SuppliersPage = () => {
  const {
    user
  } = useAuth();
  const {
    selectedUnit
  } = useUnit();
  const {
    showToast
  } = useToast();

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
    activateSupplier
  } = useSuppliers(selectedUnit?.id, {
    includeInactive: showInactive,
    enableCache: true
  });

  // Verificar permissões - Admin e Gerente podem gerenciar
  const canManage = useMemo(() => {
    const role = user?.user_metadata?.role;
    return ['admin', 'gerente'].includes(role);
  }, [user]);

  // Filtrar fornecedores
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = searchTerm === '' || supplier.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.cpf_cnpj?.includes(searchTerm) || supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
    console.log('🔍 handleInfo - Fornecedor selecionado:', supplier);
    setSelectedSupplier(supplier);
    setIsInfoModalOpen(true);
  };
  const handleDelete = async supplier => {
    if (!window.confirm(`Deseja realmente excluir o fornecedor "${supplier.nome}"?`)) {
      return;
    }
    setDeletingId(supplier.id);
    try {
      const {
        error
      } = await deleteSupplier(supplier.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao excluir fornecedor',
          description: error
        });
      } else {
        showToast({
          type: 'success',
          message: 'Fornecedor excluído com sucesso'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado',
        description: err.message
      });
    } finally {
      setDeletingId(null);
    }
  };
  const handleActivate = async supplier => {
    try {
      const {
        error
      } = await activateSupplier(supplier.id);
      if (error) {
        showToast({
          type: 'error',
          message: 'Erro ao ativar fornecedor',
          description: error
        });
      } else {
        showToast({
          type: 'success',
          message: 'Fornecedor ativado com sucesso'
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        message: 'Erro inesperado',
        description: err.message
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
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // UI Loading/Error
  if (!selectedUnit) {
    return <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Package className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Selecione uma unidade para visualizar os fornecedores
            </p>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      {/* Header */}
      <div className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary flex items-center gap-3 text-3xl font-bold">
              <Package className="text-primary-600 h-8 w-8" />
              Fornecedores
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
              Gerencie os fornecedores da unidade {selectedUnit.name}
            </p>
          </div>

          {canManage && <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Fornecedor
            </button>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Total
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
                  {stats.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-4 dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Inativos
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card-theme mb-6 rounded-lg border border-light-border p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Busca */}
          <div className="relative w-full flex-1 md:w-auto">
            <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
            <input type="text" placeholder="Pesquisar por nome, CNPJ ou email..." value={searchTerm} onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }} className="card-theme text-theme-primary dark:text-dark-text-primary focus:ring-primary-500 w-full rounded-lg border border-light-border py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 dark:border-dark-border dark:bg-gray-700" />
          </div>

          {/* Controles */}
          <div className="flex items-center gap-4">
            {/* Items por página */}
            <select value={itemsPerPage} onChange={e => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }} className="card-theme text-theme-primary dark:text-dark-text-primary rounded-lg border border-light-border px-3 py-2 dark:border-dark-border dark:bg-gray-700">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
              resultados por página
            </span>

            {/* Mostrar inativos */}
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={showInactive} onChange={e => {
              setShowInactive(e.target.checked);
              setCurrentPage(1);
            }} className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-light-border dark:border-dark-border" />
              <span className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                Mostrar inativos
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card-theme overflow-hidden rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
        {loading ? <div className="flex items-center justify-center py-12">
            <Loader className="text-primary-600 h-8 w-8 animate-spin" />
          </div> : error ? <div className="flex items-center justify-center py-12">
            <p className="text-red-600">
              Erro ao carregar fornecedores: {error}
            </p>
          </div> : filteredSuppliers.length === 0 ? <div className="flex flex-col items-center justify-center py-12">
            <Package className="text-light-text-muted dark:text-dark-text-muted mb-4 h-16 w-16" />
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            </p>
          </div> : <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                  <tr>
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Observação
                    </th>
                    <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSuppliers.map(supplier => <tr key={supplier.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${!supplier.is_active ? 'opacity-60' : ''}`}>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                              {supplier.nome}
                            </div>
                            {supplier.razao_social && <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                                {supplier.razao_social}
                              </div>}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-theme-primary dark:text-dark-text-primary text-sm">
                          {formatCNPJ(supplier.cpf_cnpj)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted max-w-xs truncate text-sm">
                          {supplier.observacoes || '-'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Info */}
                          <button onClick={() => handleInfo(supplier)} className="rounded p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300" title="Informações">
                            <Info className="h-4 w-4" />
                          </button>

                          {/* Editar */}
                          {canManage && supplier.is_active && <button onClick={() => handleEdit(supplier)} className="rounded p-1 text-green-600 hover:bg-green-50 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300" title="Editar">
                              <Edit2 className="h-4 w-4" />
                            </button>}

                          {/* Excluir/Ativar */}
                          {canManage && (supplier.is_active ? <button onClick={() => handleDelete(supplier)} disabled={deletingId === supplier.id} className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300" title="Excluir">
                                {deletingId === supplier.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button> : <button onClick={() => handleActivate(supplier)} className="rounded p-1 text-green-600 hover:bg-green-50 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300" title="Ativar">
                                <CheckCircle className="h-4 w-4" />
                              </button>)}
                        </div>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && <div className="border-t border-light-border px-6 py-4 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}{' '}
                    de {filteredSuppliers.length} resultados
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded border border-light-border px-3 py-1 hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700">
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-theme-secondary">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded border border-light-border px-3 py-1 hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700">
                      Próxima
                    </button>
                  </div>
                </div>
              </div>}
          </>}
      </div>

      {/* Modals */}
      <CreateSupplierModalRefactored isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={async data => {
      const result = await createSupplier(data);
      if (result.error) {
        throw new Error(result.error);
      }
    }} unitId={selectedUnit?.id} />

      <EditSupplierModal isOpen={isEditModalOpen} onClose={() => {
      setIsEditModalOpen(false);
      setSelectedSupplier(null);
    }} onSave={async data => {
      const result = await updateSupplier(selectedSupplier.id, data);
      if (result.error) {
        throw new Error(result.error);
      }
    }} supplier={selectedSupplier} />

      <SupplierInfoModal isOpen={isInfoModalOpen} onClose={() => {
      setIsInfoModalOpen(false);
      setSelectedSupplier(null);
    }} supplier={selectedSupplier} />
    </Layout>;
};
export default SuppliersPage;