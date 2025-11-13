/**
 * SuppliersPage Component
 * @module pages/SuppliersPage
 * @description Página principal de gerenciamento de fornecedores
 * @author Andrey Viana
 * @version 1.0.0
 * @date 2025-11-13
 */

import React, { useState } from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  usePurchaseHistory,
} from '@/lib/hooks/useSuppliers';
import { useAuth } from '@/lib/auth/authContext';
import SuppliersTable from '@/components/suppliers/SuppliersTable';
import SupplierModal from '@/components/suppliers/SupplierModal';
import SupplierDetailsView from '@/components/suppliers/SupplierDetailsView';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const { user, professional } = useAuth();
  const unitId = professional?.unit_id;

  // State
  const [filters, setFilters] = useState({ offset: 0, limit: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Hooks
  const { suppliers, totalCount, isLoading, pagination, refetch } =
    useSuppliers({ unitId, filters });
  const { mutate: createSupplier, isPending: isCreating } = useCreateSupplier({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedSupplier(null);
    },
  });
  const { mutate: updateSupplier, isPending: isUpdating } = useUpdateSupplier({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedSupplier(null);
      setIsEditing(false);
    },
  });
  const { mutate: deleteSupplier } = useDeleteSupplier();
  const { purchases } = usePurchaseHistory(
    selectedSupplier?.id,
    10,
    Boolean(selectedSupplier?.id)
  );

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = supplier => {
    setSelectedSupplier(supplier);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleView = supplier => {
    setSelectedSupplier(supplier);
    setIsDetailsOpen(true);
  };

  const handleArchive = supplier => {
    if (confirm(`Deseja realmente arquivar o fornecedor "${supplier.name}"?`)) {
      deleteSupplier({ id: supplier.id, user });
    }
  };

  const handleSave = data => {
    if (isEditing && selectedSupplier) {
      updateSupplier({ id: selectedSupplier.id, data, user });
    } else {
      createSupplier({ data: { ...data, unit_id: unitId }, user });
    }
  };

  const handleExport = () => {
    toast.info('Função de exportação em desenvolvimento');
  };

  if (!unitId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-theme-secondary">
          Carregando informações da unidade...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-theme-primary text-2xl font-bold">
            Fornecedores
          </h1>
          <p className="text-theme-secondary text-sm">
            Gerencie seus fornecedores e histórico de compras
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            className="btn-theme-secondary"
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={handleExport} className="btn-theme-secondary">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </button>
          <button onClick={handleCreate} className="btn-theme-primary">
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card-theme rounded-lg p-4">
          <p className="text-theme-secondary text-sm">Total de Fornecedores</p>
          <p className="text-theme-primary text-2xl font-bold">
            {totalCount || 0}
          </p>
        </div>
        <div className="card-theme rounded-lg p-4">
          <p className="text-theme-secondary text-sm">Fornecedores Ativos</p>
          <p className="text-theme-primary text-2xl font-bold">
            {suppliers.filter(s => s.status === 'ATIVO').length}
          </p>
        </div>
        <div className="card-theme rounded-lg p-4">
          <p className="text-theme-secondary text-sm">Fornecedores Inativos</p>
          <p className="text-theme-primary text-2xl font-bold">
            {suppliers.filter(s => s.status === 'INATIVO').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <SuppliersTable
        suppliers={suppliers}
        isLoading={isLoading}
        pagination={pagination}
        filters={filters}
        onFiltersChange={setFilters}
        onEdit={handleEdit}
        onView={handleView}
        onArchive={handleArchive}
      />

      {/* Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
          setIsEditing(false);
        }}
        onSave={handleSave}
        supplier={isEditing ? selectedSupplier : null}
        isSaving={isCreating || isUpdating}
      />

      {/* Details View */}
      <SupplierDetailsView
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        purchases={purchases}
        onEdit={supplier => {
          setIsDetailsOpen(false);
          handleEdit(supplier);
        }}
        onArchive={handleArchive}
        onAddContact={() =>
          toast.info('Adicionar contato - em desenvolvimento')
        }
        onAddFile={() => toast.info('Upload de arquivo - em desenvolvimento')}
      />
    </div>
  );
}
