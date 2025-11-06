import React, { useState, useEffect } from 'react';
import { Scissors, Plus, Search, Lock, Edit2, Power } from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import ServiceFormModal from '../components/templates/modals/ServiceFormModal';
import useServices from '../hooks/useServices';
import useUserPermissions from '../hooks/useUserPermissions';
import { useUnit } from '../context/UnitContext';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

/**
 * ServicesPage - Página de catálogo de serviços
 *
 * Features:
 * - Grid/Lista de serviços cadastrados
 * - Informações: nome, duração, preço, comissão, status
 * - Botão "Novo Serviço" (apenas Gerente e Admin)
 * - Ações: editar, ativar/desativar (apenas Gerente e Admin)
 * - Busca e filtros
 * - Profissionais podem apenas visualizar (modo leitura)
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 * - Toggle view (Grid / Lista)
 *
 * @page
 */
const ServicesPage = () => {
  // Hooks
  const { selectedUnit } = useUnit();
  const {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    reactivateService,
    fetchServices,
  } = useServices(selectedUnit?.id);
  const { canManageServices, canCreateService } = useUserPermissions();

  // Estado dos modais
  const [isServiceModalVisible, setIsServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // 🔍 Debug: Log dos serviços
  useEffect(() => {
    console.log('📊 ServicesPage - Estado atual:', {
      selectedUnit: selectedUnit?.id,
      servicesCount: services?.length,
      services,
      loading,
    });
  }, [services, selectedUnit, loading]);

  // Estado dos filtros e visualização
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // all, active, inactive
  });

  // Carrega serviços ao montar
  useEffect(() => {
    fetchServices();
  }, []);

  // Filtra serviços localmente
  const filteredServices = services.filter(service => {
    // Filtro de busca (nome)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = service.name?.toLowerCase().includes(searchLower);
      if (!nameMatch) {
        return false;
      }
    }

    // Filtro de status
    if (filters.status === 'active' && !service.active) {
      return false;
    }
    if (filters.status === 'inactive' && service.active) {
      return false;
    }
    return true;
  });

  // Estatísticas
  const stats = {
    total: services.length,
    active: services.filter(s => s.active).length,
    inactive: services.filter(s => !s.active).length,
  };

  // Handler de criação/edição
  const handleServiceSubmit = async data => {
    console.log('🔧 ServicesPage - handleServiceSubmit recebeu:', data);
    try {
      let result;
      if (selectedService) {
        // Modo edição
        console.log('✏️ Modo edição - ID:', selectedService.id);
        result = await updateService(selectedService.id, data);
      } else {
        // Modo criação
        console.log('➕ Modo criação - Chamando createService...');
        result = await createService(data);
        console.log('📦 createService retornou:', result);
      }

      // Service já exibe toast de sucesso/erro
      if (!result.error) {
        console.log('✅ Serviço salvo com sucesso, fechando modal...');
        setIsServiceModalVisible(false);
        setSelectedService(null);
        console.log('🔄 Recarregando lista de serviços...');
        fetchServices();
      } else {
        console.error('❌ Erro retornado:', result.error);
      }
    } catch (error) {
      console.error('💥 Exceção ao salvar serviço:', error);
    }
  };

  // Handler de editar
  const handleEdit = service => {
    if (!canManageServices) {
      toast.error('Você não tem permissão para editar serviços');
      return;
    }
    setSelectedService(service);
    setIsServiceModalVisible(true);
  };

  // Handler de toggle ativo/inativo
  const handleToggleActive = async service => {
    if (!canManageServices) {
      toast.error('Você não tem permissão para alterar serviços');
      return;
    }
    try {
      let result;
      if (service.active) {
        // Desativar
        result = await deleteService(service.id);
      } else {
        // Reativar
        result = await reactivateService(service.id);
      }

      // Service já exibe toast de sucesso/erro
      if (!result.error) {
        fetchServices();
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  // Handler de filtros
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleClearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: '',
    }));
  };

  // Handler de nova serviço
  const handleNewService = () => {
    if (!canCreateService) {
      toast.error('Você não tem permissão para criar serviços');
      return;
    }
    setSelectedService(null);
    setIsServiceModalVisible(true);
  };
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-theme-primary mb-2 text-3xl font-bold">
              <Scissors className="mr-2 inline h-8 w-8" />
              Serviços
            </h1>
            <p className="text-theme-muted">
              {canManageServices
                ? 'Gerencie o catálogo de serviços e comissões'
                : 'Visualize os serviços disponíveis'}
            </p>
          </div>

          {canCreateService && (
            <Button
              variant="primary"
              onClick={handleNewService}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          )}
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="card-theme p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Busca */}
            <div className="relative md:col-span-2">
              <Search className="text-theme-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Buscar serviço por nome..."
                className="border-theme-border card-theme text-theme-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
              />
            </div>

            {/* Status */}
            <div>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card-theme p-4 text-center">
          <p className="text-theme-muted mb-1 text-sm">Total</p>
          <p className="text-theme-primary text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card-theme p-4 text-center">
          <p className="text-theme-muted mb-1 text-sm">Ativos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.active}
          </p>
        </div>
        <div className="card-theme p-4 text-center">
          <p className="text-theme-muted mb-1 text-sm">Inativos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.inactive}
          </p>
        </div>
      </div>

      {/* Lista/Grid de Serviços */}
      {loading ? (
        <div className="card-theme py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-theme-muted">Carregando serviços...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="card-theme py-12 text-center">
          <Scissors className="text-theme-muted mx-auto mb-4 h-16 w-16" />
          <h3 className="text-theme-primary mb-2 text-lg font-semibold">
            Nenhum serviço encontrado
          </h3>
          <p className="text-theme-muted mb-6">
            {filters.search || filters.status !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Cadastre um novo serviço para começar'}
          </p>

          {canCreateService && !filters.search && filters.status === 'all' && (
            <Button variant="primary" onClick={handleNewService}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          )}
        </div> /* Tabela de Serviços */
      ) : (
        <div className="card-theme overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-theme-border border-b bg-light-bg dark:bg-dark-bg dark:bg-dark-surface">
                <tr>
                  <th className="text-theme-muted px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Duração
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Comissão
                  </th>
                  <th className="text-theme-muted px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  {canManageServices && (
                    <th className="text-theme-muted px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-theme-border divide-y">
                {filteredServices.map(service => {
                  const commissionValue =
                    (service.price * service.commission_percentage) / 100;
                  return (
                    <tr
                      key={service.id}
                      className="transition-colors hover:bg-light-bg dark:bg-dark-bg dark:hover:bg-dark-surface/50"
                    >
                      {/* Nome do Serviço */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <Scissors className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-theme-primary font-medium">
                            {service.name}
                          </div>
                        </div>
                      </td>

                      {/* Duração */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-theme-primary text-sm font-medium">
                          {service.duration_minutes} min
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(service.price)}
                        </span>
                      </td>

                      {/* Comissão */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {service.commission_percentage}%
                          </span>
                          <span className="text-theme-muted text-xs">
                            {formatCurrency(commissionValue)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${service.active || service.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${service.active || service.is_active ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-600 dark:bg-gray-400'}`}
                          />
                          {service.active || service.is_active
                            ? 'Ativo'
                            : 'Inativo'}
                        </span>
                      </td>

                      {/* Ações */}
                      {canManageServices && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(service)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
                              title="Editar serviço"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleActive(service)}
                              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${service.active || service.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/40'}`}
                              title={
                                service.active || service.is_active
                                  ? 'Desativar serviço'
                                  : 'Ativar serviço'
                              }
                            >
                              <Power className="h-3.5 w-3.5" />
                              {service.active || service.is_active
                                ? 'Desativar'
                                : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aviso para profissionais */}
      {!canManageServices && services.length > 0 && (
        <div className="card-theme mt-6 border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Modo somente leitura
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Apenas Gerentes e Administradores podem criar ou editar
                serviços.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <ServiceFormModal
        isOpen={isServiceModalVisible}
        onClose={() => {
          setIsServiceModalVisible(false);
          setSelectedService(null);
        }}
        onSubmit={handleServiceSubmit}
        service={selectedService}
        unitId={selectedUnit?.id}
      />
    </div>
  );
};
export default ServicesPage;
