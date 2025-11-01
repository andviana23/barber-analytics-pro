import React, { useState } from 'react';
import { Card } from '../../atoms';
import { useProfissionais } from '../../hooks/useProfissionais';
import { EditProfessionalModal } from './components/EditProfessionalModal';
import { useUnits } from '../../hooks/useUnits';
import { useToast } from '../../context/ToastContext';
import { useUnit } from '../../context/UnitContext';
import {
  Users,
  UserCheck,
  Shield,
  Plus,
  Edit,
  Power,
  Trash2,
  Briefcase,
  Search,
} from 'lucide-react';

/**
 * @file ProfessionalsPage.jsx
 * @description Página para cadastro e gerenciamento de profissionais
 * @module pages/ProfessionalsPage
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Página refatorada seguindo Design System com tokens Zinc,
 * UI/UX melhorada e layout em lista responsivo.
 */

const ProfessionalsPage = () => {
  const { showToast } = useToast();
  const { selectedUnit } = useUnit();
  const {
    profissionais,
    loading,
    error,
    createProfissional,
    updateProfissional,
    toggleStatus,
    deleteProfissional,
    totalProfissionais,
    profissionaisAtivos,
    refresh,
  } = useProfissionais();

  const { units, loading: unitsLoading } = useUnits();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ Filtro por unidade selecionada + busca
  const filteredProfissionais = profissionais.filter(p => {
    // Filtrar pela unidade selecionada (se houver)
    const matchesUnit = selectedUnit ? p.unit_id === selectedUnit.id : true;

    // Filtrar pelo termo de busca
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesUnit && matchesSearch;
  });

  // Função para abrir modal de criação
  const handleCreateProfissional = () => {
    setSelectedProfissional(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  // Função para abrir modal de edição
  const handleEditProfissional = profissional => {
    setSelectedProfissional(profissional);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  // Função para salvar profissional
  const handleSaveProfissional = async formData => {
    try {
      if (isCreating) {
        // Remover email e password que não existem na tabela professionals
        const { email, password, ...professionalData } = formData;
        await createProfissional(professionalData);
        showToast('Profissional criado com sucesso!', 'success');
      } else {
        await updateProfissional(selectedProfissional.id, formData);
        showToast('Profissional atualizado com sucesso!', 'success');
      }

      setIsModalOpen(false);
      setSelectedProfissional(null);
      setIsCreating(false);
    } catch (err) {
      showToast(`Erro ao salvar profissional: ${err.message}`, 'error');
    }
  };

  // Função para alternar status
  const handleToggleStatus = async profissional => {
    try {
      await toggleStatus(profissional.id);
      showToast(
        `Profissional ${profissional.is_active ? 'desativado' : 'ativado'} com sucesso!`,
        'success'
      );
    } catch (err) {
      showToast(`Erro ao alterar status: ${err.message}`, 'error');
    }
  };

  // Função para excluir profissional
  const handleDeleteProfissional = async profissional => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o profissional "${profissional.name}"?`
      )
    ) {
      return;
    }

    try {
      await deleteProfissional(profissional.id);
      showToast('Profissional excluído com sucesso!', 'success');
    } catch (err) {
      showToast(`Erro ao excluir profissional: ${err.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme-primary">
            Profissionais
          </h1>
          <p className="text-theme-secondary text-sm md:text-base mt-1">
            Gerencie a equipe da sua barbearia
          </p>
        </div>

        <button
          onClick={handleCreateProfissional}
          className="btn-theme-primary px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Novo Profissional</span>
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-feedback-light-error/10 dark:bg-feedback-dark-error/10 border border-feedback-light-error/30 dark:border-feedback-dark-error/30 text-feedback-light-error dark:text-feedback-dark-error px-4 py-3 rounded-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total */}
        <div className="card-theme p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-light dark:bg-primary/20 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Total de Profissionais
              </p>
              <p className="text-theme-primary text-2xl font-bold mt-1">
                {totalProfissionais}
              </p>
            </div>
          </div>
        </div>

        {/* Ativos */}
        <div className="card-theme p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-feedback-light-success/10 dark:bg-feedback-dark-success/10 rounded-lg">
              <UserCheck className="w-6 h-6 text-feedback-light-success dark:text-feedback-dark-success" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Profissionais Ativos
              </p>
              <p className="text-2xl font-bold text-feedback-light-success dark:text-feedback-dark-success mt-1">
                {profissionaisAtivos}
              </p>
            </div>
          </div>
        </div>

        {/* Administradores */}
        <div className="card-theme p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Administradores
              </p>
              <p className="text-2xl font-bold text-primary mt-1">
                {profissionais.filter(p => p.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Profissionais */}
      <div className="card-theme rounded-xl shadow-sm overflow-hidden">
        {/* Header da Lista com Busca */}
        <div className="p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-theme-primary">
                Lista de Profissionais
              </h2>
              <p className="text-theme-secondary text-sm mt-1">
                {filteredProfissionais.length} profissional
                {filteredProfissionais.length !== 1 ? 'is' : ''} encontrado
                {filteredProfissionais.length !== 1 ? 's' : ''}
                {selectedUnit && ` em ${selectedUnit.name}`}
              </p>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
              <input
                type="text"
                placeholder="Buscar profissional..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-theme w-full pl-10"
              />
            </div>
          </div>
        </div>

        {/* Conteúdo da Lista */}
        <div className="p-5">
          {filteredProfissionais.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-theme-secondary mb-4" />
              <h3 className="text-lg font-medium text-theme-primary mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-theme-secondary">
                {searchTerm
                  ? 'Tente ajustar sua busca'
                  : selectedUnit
                    ? `Nenhum profissional cadastrado em ${selectedUnit.name}`
                    : 'Adicione um novo profissional para começar'}
              </p>
            </div>
          ) : (
            /* Lista em formato de cards responsivos */
            <div className="space-y-3">
              {filteredProfissionais.map(profissional => (
                <div
                  key={profissional.id}
                  className="group card-theme rounded-lg p-4 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar e Info Principal */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center ring-2 ring-light-surface dark:ring-dark-surface">
                        <span className="text-lg font-bold text-primary">
                          {profissional.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-theme-primary truncate">
                          {profissional.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                              profissional.role === 'admin'
                                ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                                : profissional.role === 'gerente'
                                  ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                                  : profissional.role === 'recepcionista'
                                    ? 'bg-feedback-light-warning/10 dark:bg-feedback-dark-warning/10 text-feedback-light-warning dark:text-feedback-dark-warning'
                                    : 'bg-light-bg dark:bg-dark-hover text-theme-secondary'
                            }`}
                          >
                            <Briefcase className="w-3 h-3" />
                            {profissional.role === 'admin'
                              ? 'Admin'
                              : profissional.role === 'gerente'
                                ? 'Gerente'
                                : profissional.role === 'recepcionista'
                                  ? 'Recepcionista'
                                  : 'Barbeiro'}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              profissional.is_active
                                ? 'bg-feedback-light-success/10 dark:bg-feedback-dark-success/10 text-feedback-light-success dark:text-feedback-dark-success'
                                : 'bg-feedback-light-error/10 dark:bg-feedback-dark-error/10 text-feedback-light-error dark:text-feedback-dark-error'
                            }`}
                          >
                            {profissional.is_active ? '● Ativo' : '○ Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="flex items-center gap-4 sm:gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-theme-secondary text-xs font-medium">
                          Unidade
                        </p>
                        <p className="text-theme-primary font-semibold mt-0.5">
                          {profissional.unit?.name || '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-theme-secondary text-xs font-medium">
                          Comissão
                        </p>
                        <p className="text-theme-primary font-semibold mt-0.5">
                          {profissional.commission_rate}%
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditProfissional(profissional)}
                        className="p-2 text-primary hover:bg-primary-light dark:hover:bg-primary/20 rounded-lg transition-colors"
                        title="Editar profissional"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(profissional)}
                        className={`p-2 rounded-lg transition-colors ${
                          profissional.is_active
                            ? 'text-feedback-light-warning hover:bg-feedback-light-warning/10 dark:text-feedback-dark-warning dark:hover:bg-feedback-dark-warning/10'
                            : 'text-feedback-light-success hover:bg-feedback-light-success/10 dark:text-feedback-dark-success dark:hover:bg-feedback-dark-success/10'
                        }`}
                        title={profissional.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProfissional(profissional)}
                        className="p-2 text-feedback-light-error hover:bg-feedback-light-error/10 dark:text-feedback-dark-error dark:hover:bg-feedback-dark-error/10 rounded-lg transition-colors"
                        title="Excluir profissional"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen &&
        (isCreating ? (
          <ProfessionalModal
            profissional={selectedProfissional}
            units={units}
            isCreating={isCreating}
            onSave={handleSaveProfissional}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProfissional(null);
              setIsCreating(false);
            }}
          />
        ) : (
          <EditProfessionalModal
            professional={selectedProfissional}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProfissional(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setSelectedProfissional(null);
              // Recarrega a lista após edição
              try {
                refresh();
              } catch (e) {
                console.warn(
                  'Falha ao recarregar profissionais após edição',
                  e
                );
              }
            }}
          />
        ))}
    </div>
  );
};

// Componente Modal para criar/editar profissionais
const ProfessionalModal = ({
  profissional,
  units,
  isCreating,
  onSave,
  onClose,
}) => {
  // Usar selectedUnit do contexto se não houver profissional sendo editado
  const { selectedUnit } = useUnit();

  const [formData, setFormData] = useState({
    name: profissional?.name || '',
    role: profissional?.role || 'barbeiro',
    unit_id: profissional?.unit_id || selectedUnit?.id || '',
    commission_rate: 0,
    email: '',
    password: '',
    is_active:
      profissional?.is_active !== undefined ? profissional.is_active : true,
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validação básica
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      if (isCreating) {
        if (!formData.email.trim()) {
          throw new Error('Email é obrigatório');
        }
        if (!formData.password.trim()) {
          throw new Error('Senha é obrigatória');
        }
        if (!formData.unit_id) {
          throw new Error('Unidade é obrigatória');
        }
      }

      await onSave(formData);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-theme rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-theme-primary">
            {isCreating ? 'Novo Profissional' : 'Editar Profissional'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-theme-secondary hover:text-theme-primary hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (apenas para criação) */}
          {isCreating && (
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Email{' '}
                <span className="text-feedback-light-error dark:text-feedback-dark-error">
                  *
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-theme w-full"
                placeholder="email@exemplo.com"
                required
              />
            </div>
          )}

          {/* Senha (apenas para criação) */}
          {isCreating && (
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Senha{' '}
                <span className="text-feedback-light-error dark:text-feedback-dark-error">
                  *
                </span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input-theme w-full"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Nome Completo{' '}
              <span className="text-feedback-light-error dark:text-feedback-dark-error">
                *
              </span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-theme w-full"
              placeholder="Nome do profissional"
              required
            />
          </div>

          {/* Perfil/Role */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Perfil
            </label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="input-theme w-full"
            >
              <option value="barbeiro">Barbeiro</option>
              <option value="gerente">Gerente</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Unidade{' '}
              {isCreating && (
                <span className="text-feedback-light-error dark:text-feedback-dark-error">
                  *
                </span>
              )}
            </label>
            <select
              value={formData.unit_id}
              onChange={e =>
                setFormData({ ...formData, unit_id: e.target.value })
              }
              className="input-theme w-full"
              required={isCreating}
            >
              <option value="">Selecione uma unidade</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status (apenas para edição) */}
          {!isCreating && (
            <div className="flex items-center gap-3 p-4 bg-light-hover dark:bg-dark-hover rounded-lg border border-light-border dark:border-dark-border">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="w-4 h-4 rounded border-light-border dark:border-dark-border text-primary focus:ring-primary focus:ring-2"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-medium text-theme-primary cursor-pointer"
              >
                Profissional Ativo
              </label>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-theme-primary px-4 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : isCreating ? 'Criar' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn-theme-secondary px-4 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalsPage;
