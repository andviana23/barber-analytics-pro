import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import auditService from '../../services/auditService';
import { Card } from '../../atoms';
import { User, DollarSign, X } from 'lucide-react';
import CommissionsTable from '../../molecules/CommissionsTable';
import { useProfessionalCommissions } from '../../hooks/useProfessionalCommissions';
const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Buscar usuários do auth.users
        const { data: authUsers, error: authError } =
          await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Buscar profissionais
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('*, units(name)')
          .order('name');
        if (profError) throw profError;

        // Buscar unidades
        const { data: unitsData, error: unitsError } = await supabase
          .from('units')
          .select('*')
          .order('name');
        if (unitsError) throw unitsError;
        setUsers(authUsers?.users || []);
        setProfessionals(profData || []);
        setUnits(unitsData || []);

        // Log da visualização da página
        auditService.logPageView('user-management', {
          total_users: authUsers?.users?.length || 0,
        });
      } catch (err) {
        setError(err.message);
        auditService.logError('user-management-fetch', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Função para criar/atualizar profissional
  const handleSaveProfessional = async formData => {
    try {
      setLoading(true);
      if (selectedUser) {
        // Atualizar
        const { error } = await supabase
          .from('professionals')
          .update({
            name: formData.name,
            role: formData.role,
            unit_id: formData.unit_id,
            commission_rate: formData.commission_rate,
            is_active: formData.is_active,
          })
          .eq('id', selectedUser.id);
        if (error) throw error;
        auditService.logUpdate(
          'professionals',
          selectedUser.id,
          selectedUser,
          formData
        );
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('professionals')
          .insert({
            user_id: formData.user_id,
            name: formData.name,
            role: formData.role,
            unit_id: formData.unit_id,
            commission_rate: formData.commission_rate || 0,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        auditService.logCreate('professionals', data.id, formData);
      }

      // Recarregar dados
      window.location.reload();
    } catch (err) {
      setError(err.message);
      auditService.logError('save-professional', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para desativar profissional (SOFT DELETE)
  const handleDeleteProfessional = async professionalId => {
    if (
      !window.confirm(
        'Tem certeza que deseja remover este profissional? Ele será desativado do sistema.'
      )
    ) {
      return;
    }
    try {
      setLoading(true);
      const professional = professionals.find(p => p.id === professionalId);

      // ✅ SOFT DELETE: Apenas desativa o profissional (is_active = false)
      // O trigger fn_remove_inactive_from_turn_list remove automaticamente da lista da vez
      const { error } = await supabase
        .from('professionals')
        .update({ is_active: false })
        .eq('id', professionalId);

      if (error) throw error;
      auditService.logDelete('professionals', professionalId, professional);

      // Remover da lista local
      setProfessionals(professionals.filter(p => p.id !== professionalId));
    } catch (err) {
      setError(`Erro ao remover profissional: ${err.message}`);
      auditService.logError('delete-professional', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para ativar/desativar usuário
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);

      // Atualizar no professionals
      const { error } = await supabase
        .from('professionals')
        .update({
          is_active: !currentStatus,
        })
        .eq('user_id', userId);
      if (error) throw error;
      auditService.logUpdate(
        'professionals',
        userId,
        {
          is_active: currentStatus,
        },
        {
          is_active: !currentStatus,
        }
      );

      // Atualizar lista local
      setProfessionals(
        professionals.map(p =>
          p.user_id === userId
            ? {
                ...p,
                is_active: !currentStatus,
              }
            : p
        )
      );
    } catch (err) {
      setError(err.message);
      auditService.logError('toggle-user-status', err);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
            Gerenciamento de Usuários
          </h1>
          <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
            Gerencie usuários, profissionais e permissões do sistema
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedUser(null);
            setIsModalOpen(true);
          }}
          className="text-dark-text-primary rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Novo Profissional
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded border border-red-400 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Total de Usuários
          </h3>
          <p className="text-2xl font-bold text-blue-600">{users.length}</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Profissionais
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {professionals.length}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Ativos
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {professionals.filter(p => p.is_active).length}
          </p>
        </Card>

        <Card className="p-4">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            Administradores
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {professionals.filter(p => p.role === 'admin').length}
          </p>
        </Card>
      </div>

      {/* Lista de Profissionais */}
      <Card className="p-6">
        <h2 className="text-theme-primary dark:text-dark-text-primary mb-4 text-xl font-semibold">
          Lista de Profissionais
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="border-b border-light-border dark:border-dark-border">
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Nome
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Perfil
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Unidade
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Comissão
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Status
                </th>
                <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-2 text-left text-sm font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {professionals.map(professional => (
                <tr
                  key={professional.id}
                  className="border-b border-light-border dark:border-dark-border"
                >
                  <td className="text-theme-primary dark:text-dark-text-primary px-4 py-3 text-sm">
                    {professional.name}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${professional.role === 'admin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' : professional.role === 'gerente' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-theme-secondary bg-light-surface/50 dark:bg-dark-surface/50'}`}
                    >
                      {professional.role}
                    </span>
                  </td>
                  <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-3 text-sm">
                    {professional.units?.name || '-'}
                  </td>
                  <td className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-4 py-3 text-sm">
                    {professional.commission_rate}%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${professional.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {professional.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="space-x-2 px-4 py-3 text-sm">
                    <button
                      onClick={() => {
                        setSelectedUser(professional);
                        setIsModalOpen(true);
                      }}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        handleToggleUserStatus(
                          professional.user_id,
                          professional.is_active
                        )
                      }
                      className={`font-medium ${professional.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {professional.is_active ? 'Desativar' : 'Ativar'}
                    </button>

                    <button
                      onClick={() => handleDeleteProfessional(professional.id)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {professionals.length === 0 && (
            <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted py-8 text-center">
              Nenhum profissional encontrado
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Edição/Criação */}
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          units={units}
          users={users}
          professionals={professionals}
          onSave={handleSaveProfessional}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Componente Modal para criar/editar usuários
const UserModal = ({ user, units, users, professionals, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' ou 'commissions'
  const [formData, setFormData] = useState({
    user_id: user?.user_id || '',
    name: user?.name || '',
    role: user?.role || 'barbeiro',
    unit_id: user?.unit_id || '',
    commission_rate: user?.commission_rate || 0,
    is_active: user?.is_active !== undefined ? user.is_active : true,
  });

  // Hook para comissões do profissional (apenas para edição)
  const {
    commissions,
    loading: commissionsLoading,
    error: commissionsError,
    fetchCommissions,
    saveCommission,
  } = useProfessionalCommissions(user?.id, user?.unit_id);

  // Carregar comissões quando a aba for ativada
  React.useEffect(() => {
    if (activeTab === 'commissions' && user?.id && user?.unit_id) {
      fetchCommissions();
    }
  }, [activeTab, user?.id, user?.unit_id, fetchCommissions]);
  const handleSubmit = e => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Filtrar usuários que já não são profissionais
  const availableUsers = users.filter(
    u => !professionals.some(p => p.user_id === u.id) || u.id === user?.user_id
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="card-theme max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6 dark:bg-dark-surface">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-theme-primary dark:text-dark-text-primary text-lg font-semibold">
            {user ? 'Editar Profissional' : 'Novo Profissional'}
          </h3>
          <button
            onClick={onClose}
            className="text-light-text-muted dark:text-dark-text-muted hover:text-theme-secondary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navegação por abas - apenas para edição */}
        {user && (
          <div className="mb-6 flex border-b border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'text-theme-secondary hover:text-theme-primary border-transparent'}`}
            >
              <User size={16} className="mr-2" />
              Informações Básicas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('commissions')}
              className={`flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'commissions' ? 'border-blue-500 text-blue-600' : 'text-theme-secondary hover:text-theme-primary border-transparent'}`}
            >
              <DollarSign size={16} className="mr-2" />
              Comissões por Serviço
            </button>
          </div>
        )}

        {/* Conteúdo das abas */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção de usuário (apenas para novo) */}
            {!user && (
              <div>
                <label className="text-theme-primary mb-1 block text-sm font-medium">
                  Usuário
                </label>
                <select
                  value={formData.user_id}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      user_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-light-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                  required
                >
                  <option value="">Selecione um usuário</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-md border border-light-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
                required
              />
            </div>

            {/* Perfil/Role */}
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Perfil
              </label>
              <select
                value={formData.role}
                onChange={e =>
                  setFormData({
                    ...formData,
                    role: e.target.value,
                  })
                }
                className="w-full rounded-md border border-light-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
              >
                <option value="barbeiro">Barbeiro</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Unidade */}
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Unidade
              </label>
              <select
                value={formData.unit_id}
                onChange={e =>
                  setFormData({
                    ...formData,
                    unit_id: e.target.value,
                  })
                }
                className="w-full rounded-md border border-light-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
              >
                <option value="">Selecione uma unidade</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Comissão */}
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Taxa de Comissão (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_rate}
                onChange={e =>
                  setFormData({
                    ...formData,
                    commission_rate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full rounded-md border border-light-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
              />
            </div>

            {/* Status (apenas para edição) */}
            {user && (
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded border-light-border text-blue-600 focus:ring-blue-500 dark:border-dark-border"
                  />
                  <span className="text-theme-primary text-sm font-medium">
                    Usuário Ativo
                  </span>
                </label>
              </div>
            )}

            {/* Botões */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="text-dark-text-primary flex-1 rounded-md bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {user ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-theme-secondary flex-1 rounded-md px-4 py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Aba de Comissões */}
        {activeTab === 'commissions' && user && (
          <div className="space-y-4">
            {commissionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : commissionsError ? (
              <div className="rounded border border-red-400 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {commissionsError}
              </div>
            ) : (
              <CommissionsTable
                commissions={commissions}
                onSaveCommission={saveCommission}
                professionalId={user.id}
                unitId={user.unit_id}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default UserManagementPage;
