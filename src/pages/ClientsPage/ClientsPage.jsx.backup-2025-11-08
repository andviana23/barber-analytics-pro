/**
 * CLIENTS PAGE
 * Página para gerenciamento de clientes
 *
 * Features:
 * - Listagem de clientes com paginação
 * - Criar novo cliente
 * - Editar cliente existente
 * - Desativar/ativar cliente
 * - Busca e filtros
 * - KPIs (Total, Ativos, Inativos)
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Loader,
  Phone,
  Mail,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import useClients from '../../hooks/useClients';
import {
  CreateClientModal,
  EditClientModal,
} from '../../molecules/ClientModals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const ClientsPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Hook para buscar clientes
  const {
    data: clients,
    loading,
    error,
    stats,
    createClient,
    updateClient,
    deleteClient,
    activateClient,
  } = useClients(selectedUnit?.id, {
    includeInactive: showInactive,
    enableCache: true,
  });

  // Verificar permissões
  const canManage = useMemo(() => {
    return ['admin', 'gerente'].includes(user?.user_metadata?.role);
  }, [user]);

  // Filtrar clientes pela busca
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerSearch = searchTerm.toLowerCase();
    return clients.filter(
      client =>
        client.nome?.toLowerCase().includes(lowerSearch) ||
        client.cpf_cnpj?.includes(searchTerm) ||
        client.telefone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(lowerSearch)
    );
  }, [clients, searchTerm]);

  // Paginação
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredClients.slice(startIndex, endIndex);
  }, [filteredClients, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Handlers
  const handleCreateClient = async clientData => {
    const result = await createClient(clientData);
    if (result.success) {
      setIsCreateModalOpen(false);
    }
  };
  const handleUpdateClient = async (id, updateData) => {
    const result = await updateClient(id, updateData);
    if (result.success) {
      setIsEditModalOpen(false);
      setSelectedClient(null);
    }
  };
  const handleDeleteClient = async id => {
    setDeletingId(id);
    await deleteClient(id);
    setDeletingId(null);
  };
  const handleActivateClient = async id => {
    await activateClient(id);
  };

  // Formatar telefone
  const formatPhone = phone => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  // Formatar CPF
  const formatCPF = cpf => {
    if (!cpf) return '-';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  // Formatar data
  const formatDate = dateString => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      });
    } catch {
      return '-';
    }
  };
  if (!selectedUnit) {
    return (
      <Layout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Users className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
            <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
              Nenhuma unidade selecionada
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Selecione uma unidade para gerenciar clientes
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-theme-primary dark:text-dark-text-primary text-2xl font-bold">
              Clientes
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
              Gerenciar clientes da unidade {selectedUnit.name}
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 transition-colors hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Novo Cliente
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Total
                </p>
                <p className="text-theme-primary dark:text-dark-text-primary mt-1 text-3xl font-bold">
                  {stats.total}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Ativos
                </p>
                <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.active}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card-theme rounded-lg border border-light-border p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Inativos
                </p>
                <p className="mt-1 text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.inactive}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card-theme rounded-lg border border-light-border p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="text-light-text-muted dark:text-dark-text-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, telefone ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full rounded-lg border border-light-border py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-dark-border dark:bg-gray-700"
              />
            </div>

            {/* Filtro de inativos */}
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={e => setShowInactive(e.target.checked)}
                  className="h-4 w-4 rounded border-light-border text-blue-600 focus:ring-blue-500 dark:border-dark-border"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Mostrar inativos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="card-theme overflow-hidden rounded-lg border border-light-border shadow-sm dark:border-dark-border dark:bg-dark-surface">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
                  Erro ao carregar clientes
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  {error}
                </p>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <Users className="text-light-text-muted dark:text-dark-text-muted mx-auto mb-4 h-16 w-16" />
                <h3 className="text-theme-primary dark:text-dark-text-primary mb-2 text-lg font-medium">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  {searchTerm
                    ? 'Tente ajustar sua busca'
                    : 'Comece cadastrando um novo cliente'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                    <tr>
                      <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Nascimento
                      </th>
                      <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      {canManage && (
                        <th className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="card-theme divide-y divide-gray-200 dark:divide-gray-700 dark:bg-dark-surface">
                    {paginatedClients.map(client => (
                      <tr
                        key={client.id}
                        className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-theme-primary dark:text-dark-text-primary text-sm font-medium">
                            {client.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {client.telefone && (
                              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center text-sm">
                                <Phone className="mr-2 h-4 w-4" />
                                {formatPhone(client.telefone)}
                              </div>
                            )}
                            {client.email && (
                              <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center text-sm">
                                <Mail className="mr-2 h-4 w-4" />
                                {client.email}
                              </div>
                            )}
                            {!client.telefone && !client.email && (
                              <span className="text-light-text-muted dark:text-dark-text-muted text-sm">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center text-sm">
                            {client.cpf_cnpj ? (
                              <>
                                <CreditCard className="mr-2 h-4 w-4" />
                                {formatCPF(client.cpf_cnpj)}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted flex items-center text-sm">
                            {client.date_of_birth ? (
                              <>
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(
                                  new Date(client.date_of_birth),
                                  'dd/MM/yyyy'
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {client.is_active ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inativo
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsEditModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Editar"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>

                              {client.is_active ? (
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  disabled={deletingId === client.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                                  title="Desativar"
                                >
                                  {deletingId === client.id ? (
                                    <Loader className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-5 w-5" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleActivateClient(client.id)
                                  }
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Reativar"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-light-border px-6 py-4 dark:border-dark-border">
                  <div className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredClients.length
                    )}{' '}
                    de {filteredClients.length} clientes
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(prev => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="rounded-lg border border-light-border px-3 py-1 hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700"
                    >
                      Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        {
                          length: totalPages,
                        },
                        (_, i) => i + 1
                      ).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-1 ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'}`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage(prev => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-light-border px-3 py-1 hover:bg-light-bg disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-bg dark:hover:bg-gray-700"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modais */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateClient}
        loading={loading}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClient(null);
        }}
        onUpdate={handleUpdateClient}
        client={selectedClient}
        loading={loading}
      />
    </Layout>
  );
};
export default ClientsPage;
