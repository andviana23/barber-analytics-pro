import React, { useState } from 'react';
import { Card } from '../../atoms';
import { useProfissionais } from '../../hooks/useProfissionais';
import { useUnits } from '../../hooks/useUnits';
import { useToast } from '../../context/ToastContext';
import { useUnit } from '../../context/UnitContext';

/**
 * @file ProfessionalsPage.jsx
 * @description Página para cadastro e gerenciamento de profissionais
 * @module pages/ProfessionalsPage
 * @author AI Agent
 * @date 2024-10-18
 *
 * @description
 * Página simplificada focada exclusivamente no cadastro de profissionais.
 * Remove a complexidade de gerenciamento de usuários e foca na experiência
 * de cadastro e edição de profissionais.
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
  } = useProfissionais();

  const { units, loading: unitsLoading } = useUnits();

  const [selectedProfissional, setSelectedProfissional] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cadastro de Profissionais
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os profissionais da sua barbearia
          </p>
        </div>

        <button
          onClick={handleCreateProfissional}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Novo Profissional</span>
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalProfissionais}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ativos
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {profissionaisAtivos}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Administradores
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {profissionais.filter(p => p.role === 'admin').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Profissionais */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lista de Profissionais
          </h2>

          {profissionais.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {profissionais.length} profissional
              {profissionais.length !== 1 ? 'is' : ''} cadastrado
              {profissionais.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {profissionais.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum profissional cadastrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando seu primeiro profissional.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCreateProfissional}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Novo Profissional
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profissional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Comissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {profissionais.map(profissional => (
                  <tr
                    key={profissional.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                              {profissional.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {profissional.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {profissional.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profissional.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : profissional.role === 'gerente'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : profissional.role === 'recepcionista'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {profissional.role === 'admin'
                          ? 'Administrador'
                          : profissional.role === 'gerente'
                            ? 'Gerente'
                            : profissional.role === 'recepcionista'
                              ? 'Recepcionista'
                              : 'Barbeiro'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {profissional.unit?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {profissional.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          profissional.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {profissional.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditProfissional(profissional)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleToggleStatus(profissional)}
                        className={`${
                          profissional.is_active
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                      >
                        {profissional.is_active ? 'Desativar' : 'Ativar'}
                      </button>

                      <button
                        onClick={() => handleDeleteProfissional(profissional)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
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
      )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isCreating ? 'Novo Profissional' : 'Editar Profissional'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="email@exemplo.com"
                required
              />
            </div>
          )}

          {/* Senha (apenas para criação) */}
          {isCreating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nome do profissional"
              required
            />
          </div>

          {/* Perfil/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Perfil
            </label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="barbeiro">Barbeiro</option>
              <option value="gerente">Gerente</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unidade {isCreating && '*'}
            </label>
            <select
              value={formData.unit_id}
              onChange={e =>
                setFormData({ ...formData, unit_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profissional Ativo
                </span>
              </label>
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : isCreating ? 'Criar' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
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
