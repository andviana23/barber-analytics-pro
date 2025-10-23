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
import {
  Plus,
  Search,
  Package,
  Info,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import useSuppliers from '../../hooks/useSuppliers';
import CreateSupplierModalRefactored from '../../molecules/SupplierModals/CreateSupplierModalRefactored';
import EditSupplierModal from '../../molecules/SupplierModals/EditSupplierModal';
import SupplierInfoModal from '../../molecules/SupplierModals/SupplierInfoModal';

const SuppliersPage = () => {
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
    console.log('🔍 handleInfo - Fornecedor selecionado:', supplier);
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Selecione uma unidade para visualizar os fornecedores
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              Fornecedores
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie os fornecedores da unidade {selectedUnit.name}
            </p>
          </div>

          {canManage && (
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Fornecedor
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ativos
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.active}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inativos
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.inactive}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Busca */}
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Pesquisar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Controles */}
          <div className="flex items-center gap-4">
            {/* Items por página */}
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              resultados por página
            </span>

            {/* Mostrar inativos */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => {
                  setShowInactive(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Mostrar inativos
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-red-600">
              Erro ao carregar fornecedores: {error}
            </p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? 'Nenhum fornecedor encontrado'
                : 'Nenhum fornecedor cadastrado'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Observação
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSuppliers.map(supplier => (
                    <tr
                      key={supplier.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !supplier.is_active ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {supplier.nome}
                            </div>
                            {supplier.razao_social && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {supplier.razao_social}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCNPJ(supplier.cpf_cnpj)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {supplier.observacoes || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Info */}
                          <button
                            onClick={() => handleInfo(supplier)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Informações"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          {canManage && supplier.is_active && (
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Excluir/Ativar */}
                          {canManage &&
                            (supplier.is_active ? (
                              <button
                                onClick={() => handleDelete(supplier)}
                                disabled={deletingId === supplier.id}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                                title="Excluir"
                              >
                                {deletingId === supplier.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(supplier)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Ativar"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredSuppliers.length
                    )}{' '}
                    de {filteredSuppliers.length} resultados
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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

      {/* Modals */}
      <CreateSupplierModalRefactored
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

export default SuppliersPage;
