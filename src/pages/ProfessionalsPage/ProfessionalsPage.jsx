import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  TrendingUp
} from 'lucide-react';

import { useProfissionais } from '../../hooks/useProfissionais';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../atoms/Button/Button';
import { Card } from '../../atoms/Card/Card';
import { Input } from '../../atoms/Input/Input';
import { EmptyState } from '../../atoms/EmptyState/EmptyState';
import { ProfessionalCard } from './components/ProfessionalCard';
import { CreateProfessionalModal } from './components/CreateProfessionalModal';
import { EditProfessionalModal } from './components/EditProfessionalModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

/**
 * Página de gerenciamento de profissionais
 */
export function ProfessionalsPage() {
  const { isAdmin } = useAuth();
  const {
    profissionais,
    loading,
    error,
    updateFilters,
    toggleStatus,
    deleteProfissional,
    refresh,
    totalProfissionais,
    profissionaisAtivos,
    profissionaisInativos
  } = useProfissionais();

  // Estados locais
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [deletingProfessional, setDeletingProfessional] = useState(null);

  /**
   * Filtrar profissionais baseado nos filtros ativos
   */
  const filteredProfissionais = profissionais.filter(profissional => {
    const matchesSearch = searchQuery === '' || 
      profissional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profissional.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesUnit = selectedUnit === '' || profissional.unit_id === selectedUnit;
    
    const matchesStatus = selectedStatus === '' || 
      (selectedStatus === 'active' ? profissional.is_active : !profissional.is_active);
    
    const matchesRole = selectedRole === '' || profissional.role === selectedRole;

    return matchesSearch && matchesUnit && matchesStatus && matchesRole;
  });

  /**
   * Aplica filtros via service
   */
  const handleApplyFilters = () => {
    const newFilters = {};
    
    if (selectedUnit) newFilters.unitId = selectedUnit;
    if (selectedStatus) newFilters.isActive = selectedStatus === 'active';
    if (selectedRole) newFilters.role = selectedRole;
    
    updateFilters(newFilters);
  };

  /**
   * Limpa todos os filtros
   */
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUnit('');
    setSelectedStatus('');
    setSelectedRole('');
    updateFilters({});
  };

  /**
   * Manipuladores de ações
   */
  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    refresh(); // Recarregar dados
  };

  const handleEditSuccess = async () => {
    setEditingProfessional(null);
    refresh(); // Recarregar dados
  };

  const handleDeleteConfirm = async () => {
    if (deletingProfessional) {
      await deleteProfissional(deletingProfessional.id);
      setDeletingProfessional(null);
    }
  };

  const handleToggleStatus = async (professional) => {
    await toggleStatus(professional.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Profissionais
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
            Gerencie a equipe de profissionais da sua barbearia
          </p>
        </div>
        
        <Button 
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
          className="w-full lg:w-auto"
        >
          Novo Profissional
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                Total de Profissionais
              </p>
              <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {totalProfissionais}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                Profissionais Ativos
              </p>
              <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {profissionaisAtivos}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <UserX className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                Profissionais Inativos
              </p>
              <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {profissionaisInativos}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                Taxa de Atividade
              </p>
              <p className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
                {totalProfissionais > 0 
                  ? Math.round((profissionaisAtivos / totalProfissionais) * 100)
                  : 0
                }%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <Input
              icon={Search}
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Unidade */}
          <select 
            className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="">Todas as Unidades</option>
            <option value="0db46613-5273-4625-a41d-b4a0dec7dfe7">Mangabeiras</option>
            <option value="f18050b4-0954-41c1-a1ee-d17617b95bad">Nova Lima</option>
          </select>

          {/* Filtro por Status */}
          <select 
            className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          {/* Filtro por Cargo */}
          <select 
            className="px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-text-light-primary dark:text-text-dark-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-300"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">Todos os Cargos</option>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="barbeiro">Barbeiro</option>
          </select>
        </div>

        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline"
            icon={Filter}
            onClick={handleApplyFilters}
            size="sm"
          >
            Aplicar Filtros
          </Button>
          <Button 
            variant="ghost"
            onClick={handleClearFilters}
            size="sm"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de Profissionais */}
      {error && (
        <Card className="p-6">
          <div className="text-center text-feedback-light-error dark:text-feedback-dark-error">
            <p className="font-medium">Erro ao carregar profissionais</p>
            <p className="text-sm mt-2">{error}</p>
            <Button 
              variant="outline" 
              onClick={refresh} 
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-text-light-secondary dark:text-text-dark-secondary mt-4">
              Carregando profissionais...
            </p>
          </div>
        </Card>
      )}

      {!loading && !error && filteredProfissionais.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum profissional encontrado"
          description="Não há profissionais que correspondem aos filtros aplicados."
          action={{
            label: "Novo Profissional",
            onClick: () => setShowCreateModal(true),
            show: isAdmin()
          }}
        />
      )}

      {!loading && !error && filteredProfissionais.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfissionais.map((profissional) => (
            <ProfessionalCard
              key={profissional.id}
              professional={profissional}
              onEdit={setEditingProfessional}
              onDelete={setDeletingProfessional}
              onToggleStatus={handleToggleStatus}
              canEdit={isAdmin()}
              canDelete={isAdmin()}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateProfessionalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingProfessional && (
        <EditProfessionalModal
          professional={editingProfessional}
          onClose={() => setEditingProfessional(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingProfessional && (
        <DeleteConfirmModal
          professional={deletingProfessional}
          onClose={() => setDeletingProfessional(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}