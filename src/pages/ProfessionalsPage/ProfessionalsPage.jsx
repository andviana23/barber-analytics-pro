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
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-theme-primary text-2xl font-bold md:text-3xl">
            Profissionais
          </h1>
          <p className="text-theme-secondary mt-1 text-sm md:text-base">
            Gerencie a equipe da sua barbearia
          </p>
        </div>

        <button
          onClick={handleCreateProfissional}
          className="btn-theme-primary flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Novo Profissional</span>
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-feedback-light-error/30 bg-feedback-light-error/10 px-4 py-3 text-feedback-light-error dark:border-feedback-dark-error/30 dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error">
          <svg
            className="h-5 w-5 flex-shrink-0"
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total */}
        <div className="card-theme rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary-light p-3 dark:bg-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Total de Profissionais
              </p>
              <p className="text-theme-primary mt-1 text-2xl font-bold">
                {totalProfissionais}
              </p>
            </div>
          </div>
        </div>

        {/* Ativos */}
        <div className="card-theme rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-feedback-light-success/10 p-3 dark:bg-feedback-dark-success/10">
              <UserCheck className="h-6 w-6 text-feedback-light-success dark:text-feedback-dark-success" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Profissionais Ativos
              </p>
              <p className="mt-1 text-2xl font-bold text-feedback-light-success dark:text-feedback-dark-success">
                {profissionaisAtivos}
              </p>
            </div>
          </div>
        </div>

        {/* Administradores */}
        <div className="card-theme rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3 dark:bg-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-theme-secondary text-sm font-medium">
                Administradores
              </p>
              <p className="mt-1 text-2xl font-bold text-primary">
                {profissionais.filter(p => p.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Profissionais */}
      <div className="card-theme overflow-hidden rounded-xl shadow-sm">
        {/* Header da Lista com Busca */}
        <div className="border-b border-light-border p-5 dark:border-dark-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-theme-primary text-xl font-semibold">
                Lista de Profissionais
              </h2>
              <p className="text-theme-secondary mt-1 text-sm">
                {filteredProfissionais.length} profissional
                {filteredProfissionais.length !== 1 ? 'is' : ''} encontrado
                {filteredProfissionais.length !== 1 ? 's' : ''}
                {selectedUnit && ` em ${selectedUnit.name}`}
              </p>
            </div>

            {/* Campo de Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
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
            <div className="py-12 text-center">
              <Users className="text-theme-secondary mx-auto mb-4 h-16 w-16" />
              <h3 className="text-theme-primary mb-2 text-lg font-medium">
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
                  className="card-theme group rounded-lg p-4 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Avatar e Info Principal */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-light ring-2 ring-light-surface dark:bg-primary/20 dark:ring-dark-surface">
                        <span className="text-lg font-bold text-primary">
                          {profissional.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-theme-primary truncate text-base font-semibold">
                          {profissional.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              profissional.role === 'admin'
                                ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                : profissional.role === 'gerente'
                                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                  : profissional.role === 'recepcionista'
                                    ? 'bg-feedback-light-warning/10 text-feedback-light-warning dark:bg-feedback-dark-warning/10 dark:text-feedback-dark-warning'
                                    : 'text-theme-secondary bg-light-bg dark:bg-dark-hover'
                            }`}
                          >
                            <Briefcase className="h-3 w-3" />
                            {profissional.role === 'admin'
                              ? 'Admin'
                              : profissional.role === 'gerente'
                                ? 'Gerente'
                                : profissional.role === 'recepcionista'
                                  ? 'Recepcionista'
                                  : 'Barbeiro'}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              profissional.is_active
                                ? 'bg-feedback-light-success/10 text-feedback-light-success dark:bg-feedback-dark-success/10 dark:text-feedback-dark-success'
                                : 'bg-feedback-light-error/10 text-feedback-light-error dark:bg-feedback-dark-error/10 dark:text-feedback-dark-error'
                            }`}
                          >
                            {profissional.is_active ? '● Ativo' : '○ Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="flex items-center gap-4 text-sm sm:gap-6">
                      <div className="text-center">
                        <p className="text-theme-secondary text-xs font-medium">
                          Unidade
                        </p>
                        <p className="text-theme-primary mt-0.5 font-semibold">
                          {profissional.unit?.name || '-'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-theme-secondary text-xs font-medium">
                          Comissão
                        </p>
                        <p className="text-theme-primary mt-0.5 font-semibold">
                          {profissional.commission_rate}%
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        onClick={() => handleEditProfissional(profissional)}
                        className="rounded-lg p-2 text-primary transition-colors hover:bg-primary-light dark:hover:bg-primary/20"
                        title="Editar profissional"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(profissional)}
                        className={`rounded-lg p-2 transition-colors ${
                          profissional.is_active
                            ? 'text-feedback-light-warning hover:bg-feedback-light-warning/10 dark:text-feedback-dark-warning dark:hover:bg-feedback-dark-warning/10'
                            : 'text-feedback-light-success hover:bg-feedback-light-success/10 dark:text-feedback-dark-success dark:hover:bg-feedback-dark-success/10'
                        }`}
                        title={profissional.is_active ? 'Desativar' : 'Ativar'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProfissional(profissional)}
                        className="rounded-lg p-2 text-feedback-light-error transition-colors hover:bg-feedback-light-error/10 dark:text-feedback-dark-error dark:hover:bg-feedback-dark-error/10"
                        title="Excluir profissional"
                      >
                        <Trash2 className="h-4 w-4" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card-theme max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-theme-primary text-xl font-bold">
            {isCreating ? 'Novo Profissional' : 'Editar Profissional'}
          </h3>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary rounded-lg p-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
          >
            <svg
              className="h-5 w-5"
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
              <label className="text-theme-primary mb-2 block text-sm font-medium">
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
              <label className="text-theme-primary mb-2 block text-sm font-medium">
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
            <label className="text-theme-primary mb-2 block text-sm font-medium">
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
            <label className="text-theme-primary mb-2 block text-sm font-medium">
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
            <label className="text-theme-primary mb-2 block text-sm font-medium">
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
            <div className="flex items-center gap-3 rounded-lg border border-light-border bg-light-hover p-4 dark:border-dark-border dark:bg-dark-hover">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-light-border text-primary focus:ring-2 focus:ring-primary dark:border-dark-border"
              />
              <label
                htmlFor="is_active"
                className="text-theme-primary cursor-pointer text-sm font-medium"
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
              className="btn-theme-primary flex-1 rounded-lg px-4 py-2.5 font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Salvando...' : isCreating ? 'Criar' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-theme-secondary flex-1 rounded-lg px-4 py-2.5 font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50"
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
