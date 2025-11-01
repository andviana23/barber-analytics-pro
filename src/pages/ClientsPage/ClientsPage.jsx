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
import { Plus, Search, Users, Edit2, Trash2, CheckCircle, XCircle, Loader, Phone, Mail, Calendar, CreditCard } from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import useClients from '../../hooks/useClients';
import { CreateClientModal, EditClientModal } from '../../molecules/ClientModals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const ClientsPage = () => {
  const {
    user
  } = useAuth();
  const {
    selectedUnit
  } = useUnit();

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
    activateClient
  } = useClients(selectedUnit?.id, {
    includeInactive: showInactive,
    enableCache: true
  });

  // Verificar permissões
  const canManage = useMemo(() => {
    return ['admin', 'gerente'].includes(user?.user_metadata?.role);
  }, [user]);

  // Filtrar clientes pela busca
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lowerSearch = searchTerm.toLowerCase();
    return clients.filter(client => client.nome?.toLowerCase().includes(lowerSearch) || client.cpf_cnpj?.includes(searchTerm) || client.telefone?.includes(searchTerm) || client.email?.toLowerCase().includes(lowerSearch));
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
        locale: ptBR
      });
    } catch {
      return '-';
    }
  };
  if (!selectedUnit) {
    return <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Users className="w-16 h-16 text-light-text-muted dark:text-dark-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary mb-2">
              Nenhuma unidade selecionada
            </h3>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
              Selecione uma unidade para gerenciar clientes
            </p>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-theme-primary dark:text-dark-text-primary">
              Clientes
            </h1>
            <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1">
              Gerenciar clientes da unidade {selectedUnit.name}
            </p>
          </div>

          {canManage && <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-dark-text-primary rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Novo Cliente
            </button>}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  Total
                </p>
                <p className="text-3xl font-bold text-theme-primary dark:text-dark-text-primary mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  Ativos
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  Inativos
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {stats.inactive}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-light-text-muted dark:text-dark-text-muted" />
              <input type="text" placeholder="Buscar por nome, CPF, telefone ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 card-theme dark:bg-gray-700 text-theme-primary dark:text-dark-text-primary" />
            </div>

            {/* Filtro de inativos */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="w-4 h-4 text-blue-600 border-light-border dark:border-dark-border rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                  Mostrar inativos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="card-theme dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border overflow-hidden">
          {loading ? <div className="flex items-center justify-center h-96">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div> : error ? <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary mb-2">
                  Erro ao carregar clientes
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">{error}</p>
              </div>
            </div> : filteredClients.length === 0 ? <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Users className="w-16 h-16 text-light-text-muted dark:text-dark-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-theme-primary dark:text-dark-text-primary mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                  {searchTerm ? 'Tente ajustar sua busca' : 'Comece cadastrando um novo cliente'}
                </p>
              </div>
            </div> : <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-bg dark:bg-dark-bg dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                        CPF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                        Nascimento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                        Status
                      </th>
                      {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted uppercase tracking-wider">
                          Ações
                        </th>}
                    </tr>
                  </thead>
                  <tbody className="card-theme dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedClients.map(client => <tr key={client.id} className="hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-theme-primary dark:text-dark-text-primary">
                            {client.nome}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {client.telefone && <div className="flex items-center text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                                <Phone className="w-4 h-4 mr-2" />
                                {formatPhone(client.telefone)}
                              </div>}
                            {client.email && <div className="flex items-center text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                                <Mail className="w-4 h-4 mr-2" />
                                {client.email}
                              </div>}
                            {!client.telefone && !client.email && <span className="text-sm text-light-text-muted dark:text-dark-text-muted">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                            {client.cpf_cnpj ? <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                {formatCPF(client.cpf_cnpj)}
                              </> : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
                            {client.date_of_birth ? <>
                                <Calendar className="w-4 h-4 mr-2" />
                                {format(new Date(client.date_of_birth), 'dd/MM/yyyy')}
                              </> : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.is_active ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ativo
                            </span> : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </span>}
                        </td>
                        {canManage && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => {
                        setSelectedClient(client);
                        setIsEditModalOpen(true);
                      }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Editar">
                                <Edit2 className="w-5 h-5" />
                              </button>

                              {client.is_active ? <button onClick={() => handleDeleteClient(client.id)} disabled={deletingId === client.id} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50" title="Desativar">
                                  {deletingId === client.id ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                </button> : <button onClick={() => handleActivateClient(client.id)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" title="Reativar">
                                  <CheckCircle className="w-5 h-5" />
                                </button>}
                            </div>
                          </td>}
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && <div className="px-6 py-4 border-t border-light-border dark:border-dark-border flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} até{' '}
                    {Math.min(currentPage * itemsPerPage, filteredClients.length)}{' '}
                    de {filteredClients.length} clientes
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Anterior
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({
                  length: totalPages
                }, (_, i) => i + 1).map(page => <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            {page}
                          </button>)}
                    </div>

                    <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Próxima
                    </button>
                  </div>
                </div>}
            </>}
        </div>
      </div>

      {/* Modais */}
      <CreateClientModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateClient} loading={loading} />

      <EditClientModal isOpen={isEditModalOpen} onClose={() => {
      setIsEditModalOpen(false);
      setSelectedClient(null);
    }} onUpdate={handleUpdateClient} client={selectedClient} loading={loading} />
    </Layout>;
};
export default ClientsPage;