import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Plus,
  Filter,
  X,
  Search,
  Package,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../atoms/Button/Button';
import { Alert } from '../atoms/Alert/Alert';
import OrderListItem from '../components/molecules/OrderListItem';
import OrderModal from '../components/templates/modals/OrderModal';
import OrderItemModal from '../components/templates/modals/OrderItemModal';
import useOrders from '../hooks/useOrders';
import useServices from '../hooks/useServices';
import useUserPermissions from '../hooks/useUserPermissions';
import { useUnit } from '../context/UnitContext';
import { useAuth } from '../context/AuthContext';
import { useClients } from '../hooks/useClients';
import { useProfissionais } from '../hooks/useProfissionais';
import { getPaymentMethods } from '../services/paymentMethodsService';
import bankAccountsService from '../services/bankAccountsService';
import toast from 'react-hot-toast';

/**
 * OrdersPage - Página de gerenciamento de comandas
 *
 * Features:
 * - Listagem de comandas (abertas, fechadas, canceladas)
 * - Filtros: status, profissional, cliente, período
 * - Botão "Nova Comanda"
 * - Click na linha abre modal de detalhes/edição
 * - Ações contextuais (fechar, cancelar)
 * - Proteção por permissões (visualiza só suas comandas se for profissional)
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @page
 */
const OrdersPage = () => {
  const navigate = useNavigate();
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const unitId = selectedUnit?.id || null;
  const {
    orders,
    loading: ordersLoading,
    createOrder,
    closeOrder,
    cancelOrder,
    addServiceToOrder,
    removeServiceFromOrder,
    fetchOrders,
  } = useOrders(unitId);
  const { activeServices, fetchActiveServices } = useServices(unitId);
  const { canCreateOrder, canCloseOrder, canCancelOrder } =
    useUserPermissions();
  const {
    data: clientsData = [],
    loading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useClients(unitId, {
    includeInactive: true,
    enableCache: true,
  });
  const {
    profissionais,
    loading: professionalsLoading,
    error: professionalsError,
    updateFilters: updateProfessionalFilters,
    refresh: refreshProfessionals,
  } = useProfissionais();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);
  const [financialError, setFinancialError] = useState(null);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isOrderItemModalVisible, setIsOrderItemModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderItems, setCurrentOrderItems] = useState([]);
  const [itemModalProfessionalId, setItemModalProfessionalId] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [clientsSearch, setClientsSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [clientHistoryFilter, setClientHistoryFilter] = useState('all');
  const [clientsPage, setClientsPage] = useState(1);
  const clientsPerPage = 5;
  const [professionalSearch, setProfessionalSearch] = useState('');
  const [professionalStatusFilter, setProfessionalStatusFilter] =
    useState('active');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [availabilitySort, setAvailabilitySort] = useState('desc');

  // ✅ Atualiza filtros de profissionais quando unitId muda
  useEffect(() => {
    if (unitId) {
      updateProfessionalFilters({
        unitId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]); // ⚠️ Apenas unitId, updateProfessionalFilters não precisa estar aqui

  // ✅ Carrega comandas e serviços quando unitId muda
  useEffect(() => {
    if (!unitId) {
      setSelectedOrder(null);
      setCurrentOrderItems([]);
      return;
    }
    fetchOrders();
    fetchActiveServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]); // ⚠️ Apenas unitId, fetch functions não precisam estar aqui

  const loadFinancialDependencies = useCallback(async () => {
    if (!unitId) {
      setPaymentMethods([]);
      setBankAccounts([]);
      return;
    }
    setFinancialError(null);
    setPaymentMethodsLoading(true);
    setBankAccountsLoading(true);
    try {
      const [paymentResult, accountsResult] = await Promise.all([
        getPaymentMethods(unitId),
        bankAccountsService.getBankAccounts(unitId),
      ]);
      if (paymentResult.error) {
        throw paymentResult.error;
      }
      setPaymentMethods(paymentResult.data || []);
      setBankAccounts(accountsResult || []);
    } catch (error) {
      const message =
        error?.message ||
        'Não foi possível carregar dados financeiros para esta unidade.';
      setFinancialError(message);
      toast.error(message);
      setPaymentMethods([]);
      setBankAccounts([]);
    } finally {
      setPaymentMethodsLoading(false);
      setBankAccountsLoading(false);
    }
  }, [unitId]);
  useEffect(() => {
    loadFinancialDependencies();
  }, [loadFinancialDependencies]);
  useEffect(() => {
    setClientsPage(1);
  }, [clientsSearch, clientStatusFilter, clientHistoryFilter, unitId]);
  const formatPhone = useCallback(value => {
    if (!value) return '-';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  }, []);
  const formatDateShort = useCallback(dateValue => {
    if (!dateValue) return '—';
    try {
      return format(new Date(dateValue), "dd 'de' MMM", {
        locale: ptBR,
      });
    } catch {
      return '—';
    }
  }, []);
  const getProfessionalSpecialty = useCallback(professional => {
    return (
      professional?.speciality ||
      professional?.specialization ||
      (Array.isArray(professional?.specialties) &&
        professional.specialties[0]) ||
      professional?.role ||
      'Barbeiro'
    );
  }, []);
  const getAvailabilityScore = useCallback(
    professional => (professional?.is_active ? 1 : 0),
    []
  );
  const selectableClients = useMemo(
    () => (clientsData || []).filter(client => client.is_active),
    [clientsData]
  );
  const activeProfessionals = useMemo(
    () =>
      (profissionais || []).filter(
        professional =>
          professional.is_active && (!unitId || professional.unit_id === unitId)
      ),
    [profissionais, unitId]
  );
  const modalProfessionals = useMemo(() => {
    const currentProfessionalId =
      selectedOrder?.professional?.id || selectedOrder?.professionalId;
    if (!currentProfessionalId) {
      return activeProfessionals;
    }
    const alreadyIncluded = activeProfessionals.some(
      professional => professional.id === currentProfessionalId
    );
    if (alreadyIncluded) {
      return activeProfessionals;
    }
    const fallbackProfessional = {
      id: currentProfessionalId,
      name: selectedOrder?.professional?.name || 'Profissional inativo',
      is_active: false,
      unit_id: selectedOrder?.unit_id || unitId,
      ...selectedOrder?.professional,
    };
    return [...activeProfessionals, fallbackProfessional];
  }, [activeProfessionals, selectedOrder, unitId]);
  const clientMetrics = useMemo(() => {
    const map = new Map();
    (orders || []).forEach(order => {
      const clientId =
        order.client?.id || order.client_id || order.clientId || null;
      if (!clientId) return;
      const createdAt = order.created_at || order.createdAt;
      const metrics = map.get(clientId) || {
        totalOrders: 0,
        lastOrderDate: null,
      };
      metrics.totalOrders += 1;
      if (createdAt) {
        const createdDate = new Date(createdAt);
        if (!metrics.lastOrderDate || createdDate > metrics.lastOrderDate) {
          metrics.lastOrderDate = createdDate;
        }
      }
      map.set(clientId, metrics);
    });
    return map;
  }, [orders]);
  const professionalMetrics = useMemo(() => {
    const map = new Map();
    (orders || []).forEach(order => {
      const professionalId =
        order.professional?.id ||
        order.professional_id ||
        order.professionalId ||
        null;
      if (!professionalId) return;
      const metrics = map.get(professionalId) || {
        totalOrders: 0,
        openOrders: 0,
        closedOrders: 0,
      };
      metrics.totalOrders += 1;
      if (order.status === 'open') {
        metrics.openOrders += 1;
      }
      if (order.status === 'closed') {
        metrics.closedOrders += 1;
      }
      map.set(professionalId, metrics);
    });
    return map;
  }, [orders]);
  const filteredOrders = useMemo(() => {
    return (orders || []).filter(order => {
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const clientName = order.client?.name?.toLowerCase() || '';
        const professionalName = order.professional?.name?.toLowerCase() || '';
        if (
          !clientName.includes(searchLower) &&
          !professionalName.includes(searchLower)
        ) {
          return false;
        }
      }
      if (
        filters.startDate &&
        new Date(order.created_at || order.createdAt) <
          new Date(filters.startDate)
      ) {
        return false;
      }
      if (
        filters.endDate &&
        new Date(order.created_at || order.createdAt) >
          new Date(filters.endDate)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, filters]);
  const filteredClients = useMemo(() => {
    const normalizedSearch = clientsSearch.trim().toLowerCase();
    return (clientsData || []).filter(client => {
      if (clientStatusFilter === 'active' && !client.is_active) {
        return false;
      }
      if (clientStatusFilter === 'inactive' && client.is_active) {
        return false;
      }
      const metrics = clientMetrics.get(client.id);
      if (clientHistoryFilter === 'recent') {
        if (!metrics?.lastOrderDate) {
          return false;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (metrics.lastOrderDate < thirtyDaysAgo) {
          return false;
        }
      }
      if (clientHistoryFilter === 'no-history' && metrics?.totalOrders) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const normalizedPhone =
        client.telefone?.replace(/\D/g, '') ||
        client.phone?.replace(/\D/g, '') ||
        '';
      return (
        client.nome?.toLowerCase().includes(normalizedSearch) ||
        client.name?.toLowerCase().includes(normalizedSearch) ||
        client.cpf_cnpj?.includes(normalizedSearch) ||
        normalizedPhone.includes(normalizedSearch.replace(/\D/g, '')) ||
        client.email?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [
    clientsData,
    clientStatusFilter,
    clientsSearch,
    clientHistoryFilter,
    clientMetrics,
  ]);
  const paginatedClients = useMemo(() => {
    const startIndex = (clientsPage - 1) * clientsPerPage;
    return filteredClients.slice(startIndex, startIndex + clientsPerPage);
  }, [filteredClients, clientsPage, clientsPerPage]);
  const totalClientPages = Math.max(
    1,
    Math.ceil(filteredClients.length / clientsPerPage)
  );
  useEffect(() => {
    setClientsPage(prev => Math.min(prev, totalClientPages));
  }, [totalClientPages]);
  const specialties = useMemo(() => {
    const values = new Set();
    (profissionais || []).forEach(professional => {
      if (unitId && professional.unit_id !== unitId) {
        return;
      }
      const specialty = getProfessionalSpecialty(professional);
      if (specialty) {
        values.add(specialty);
      }
    });
    return Array.from(values).sort();
  }, [profissionais, unitId, getProfessionalSpecialty]);
  const filteredProfessionals = useMemo(() => {
    const normalizedSearch = professionalSearch.trim().toLowerCase();
    return (profissionais || [])
      .filter(professional => {
        if (unitId && professional.unit_id !== unitId) {
          return false;
        }
        if (professionalStatusFilter === 'active' && !professional.is_active) {
          return false;
        }
        if (professionalStatusFilter === 'inactive' && professional.is_active) {
          return false;
        }
        if (
          specialtyFilter !== 'all' &&
          getProfessionalSpecialty(professional) !== specialtyFilter
        ) {
          return false;
        }
        if (!normalizedSearch) {
          return true;
        }
        const speciality = getProfessionalSpecialty(professional).toLowerCase();
        return (
          professional.name?.toLowerCase().includes(normalizedSearch) ||
          professional.role?.toLowerCase().includes(normalizedSearch) ||
          speciality.includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const scoreA = getAvailabilityScore(a);
        const scoreB = getAvailabilityScore(b);
        if (scoreA === scoreB) {
          return (a.name || '').localeCompare(b.name || '');
        }
        return availabilitySort === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      });
  }, [
    profissionais,
    unitId,
    professionalStatusFilter,
    specialtyFilter,
    professionalSearch,
    availabilitySort,
    getProfessionalSpecialty,
    getAvailabilityScore,
  ]);
  const handleOrderSubmit = async ({ action, data }) => {
    try {
      console.log('🚀 handleOrderSubmit - action:', action);
      console.log('📦 handleOrderSubmit - data:', data);
      if (selectedOrder) {
        // EDITANDO COMANDA EXISTENTE
        if (action === 'close') {
          const closePayload = {
            paymentMethodId: data.paymentMethodId,
            accountId: data.accountId || null,
            closedBy: user?.id || undefined,
          };
          const result = await closeOrder(selectedOrder.id, closePayload);
          if (result.error) {
            return;
          }
        } else if (action === 'cancel') {
          const result = await cancelOrder(
            selectedOrder.id,
            'Cancelado pelo usuário'
          );
          if (result.error) {
            return;
          }
        }
      } else {
        // CRIANDO NOVA COMANDA
        console.log('📝 Criando nova comanda...');
        const result = await createOrder(data);
        if (result.error) {
          console.error('❌ Erro ao criar comanda:', result.error);
          return;
        }
        const createdOrderId = result.data?.id;
        console.log('✅ Comanda criada:', createdOrderId);

        // ADICIONA OS ITENS (SERVIÇOS) À COMANDA
        if (data.items && data.items.length > 0) {
          console.log(
            '📦 Adicionando',
            data.items.length,
            'itens à comanda...'
          );
          for (const item of data.items) {
            console.log('➕ Adicionando item:', item);
            const itemResult = await addServiceToOrder(createdOrderId, {
              serviceId: item.serviceId,
              professionalId: item.professionalId || data.professionalId,
              quantity: item.quantity || 1,
            });
            if (itemResult.error) {
              console.error('❌ Erro ao adicionar item:', itemResult.error);
              toast.error(`Erro ao adicionar serviço: ${item.serviceName}`);
              // Continua adicionando os outros itens mesmo se um falhar
            }
          }
          console.log('✅ Todos os itens foram adicionados');
        }

        // FECHA A COMANDA SE ACTION === 'CLOSE'
        if (action === 'close' && createdOrderId) {
          console.log('🔒 Fechando comanda...');
          const closePayload = {
            paymentMethodId: data.paymentMethodId,
            accountId: data.accountId || null,
            closedBy: user?.id || undefined,
          };
          const closeResult = await closeOrder(createdOrderId, closePayload);
          if (closeResult.error) {
            console.error('❌ Erro ao fechar comanda:', closeResult.error);
            return;
          }
          console.log('✅ Comanda fechada com sucesso');
        }
      }

      // LIMPA O ESTADO E FECHA O MODAL
      setIsOrderModalVisible(false);
      setSelectedOrder(null);
      setCurrentOrderItems([]);
      setItemModalProfessionalId('');

      // ATUALIZA A LISTA
      fetchOrders();
      refreshProfessionals();
      refetchClients();
    } catch (error) {
      console.error('❌ Erro ao processar comanda:', error);
      toast.error('Não foi possível processar a comanda. Tente novamente.');
    }
  };
  const handleAddItemClick = (orderId, defaultProfessionalId) => {
    setCurrentOrderId(orderId || selectedOrder?.id || null);
    setItemModalProfessionalId(
      defaultProfessionalId || selectedOrder?.professionalId || ''
    );
    setIsOrderItemModalVisible(true);
  };
  const handleItemSubmit = async itemData => {
    try {
      console.log('🎯 handleItemSubmit chamado');
      console.log('📦 itemData recebido:', itemData);
      console.log('📋 selectedOrder:', selectedOrder);
      console.log('📦 currentOrderItems ANTES:', currentOrderItems);
      if (!selectedOrder) {
        // Busca o nome do profissional para exibir na tabela
        const professional = profissionais.find(
          p => p.id === itemModalProfessionalId
        );
        console.log('👤 Profissional encontrado:', professional);
        const newItem = {
          ...itemData,
          id: Date.now(),
          professionalName: professional?.name || 'Sem profissional',
        };
        console.log('➕ Novo item a ser adicionado:', newItem);
        setCurrentOrderItems(prev => {
          const updated = [...prev, newItem];
          console.log('📦 currentOrderItems DEPOIS:', updated);
          return updated;
        });
        toast.success('Serviço adicionado à comanda');
        setIsOrderItemModalVisible(false);
        return;
      }
      const result = await addServiceToOrder(
        itemData.orderId || selectedOrder.id,
        itemData
      );
      if (!result.error) {
        toast.success('Serviço adicionado à comanda');
        fetchOrders();
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar item:', error);
      toast.error('Não foi possível adicionar o serviço.');
    }
  };
  const handleRemoveItem = async itemId => {
    try {
      if (!selectedOrder) {
        setCurrentOrderItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Serviço removido');
        return;
      }
      const result = await removeServiceFromOrder(itemId, selectedOrder.id);
      if (!result.error) {
        toast.success('Serviço removido');
        fetchOrders();
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Não foi possível remover o serviço.');
    }
  };
  const handleOrderClick = order => {
    setSelectedOrder(order);
    setCurrentOrderItems(order.items || []);
    setItemModalProfessionalId(order.professionalId || '');
    setIsOrderModalVisible(true);
  };
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
  };
  const handleNewOrder = () => {
    setSelectedOrder(null);
    setCurrentOrderItems([]);
    setItemModalProfessionalId('');
    setIsOrderModalVisible(true);
  };
  const handleViewClientHistory = clientId => {
    navigate(`/reports?client=${clientId}`);
  };
  const handleOpenClientProfile = clientId => {
    navigate(`/cadastros/clientes?cliente=${clientId}`);
  };
  const handleOpenProfessionalProfile = professionalId => {
    navigate(`/professionals/${professionalId}`);
  };
  const handleOpenProfessionalAgenda = professionalId => {
    navigate(`/queue?professional=${professionalId}`);
  };
  const toggleAvailabilitySort = () => {
    setAvailabilitySort(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };
  const showPaymentWarning =
    !paymentMethodsLoading && !financialError && paymentMethods.length === 0;
  const showBankWarning =
    !bankAccountsLoading && !financialError && bankAccounts.length === 0;
  if (!unitId) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex items-center gap-3">
          <FileText className="text-theme-primary h-8 w-8" />
          <h1 className="text-theme-primary text-3xl font-bold">Comandas</h1>
        </div>
        <Alert
          type="info"
          title="Selecione uma unidade"
          message="Escolha uma unidade no seletor superior para visualizar e gerenciar as comandas."
        />
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-theme-primary mb-2 text-3xl font-bold">
              <FileText className="mr-2 inline h-8 w-8" />
              Comandas
            </h1>
            <p className="text-theme-muted">
              Gerencie comandas, serviços e atendimentos
            </p>
          </div>

          {canCreateOrder && (
            <Button
              variant="primary"
              onClick={handleNewOrder}
              disabled={ordersLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Comanda
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {financialError && <Alert type="error" message={financialError} />}
          {showPaymentWarning && (
            <Alert
              type="warning"
              icon={Info}
              message="Nenhuma forma de pagamento ativa encontrada para esta unidade. Cadastre pelo menos uma forma de pagamento antes de fechar comandas."
            />
          )}
          {showBankWarning && (
            <Alert
              type="warning"
              icon={Info}
              message="Nenhuma conta bancária ativa vinculada à unidade. Cadastre uma conta para direcionar os recebimentos automáticos."
            />
          )}
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="card-theme space-y-4 p-4">
          {/* Busca */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="text-theme-muted absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Buscar por cliente ou profissional..."
                className="border-theme-border card-theme text-theme-primary w-full rounded-lg border py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="border-theme-border grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-4">
              {/* Status */}
              <div>
                <label className="text-theme-primary mb-2 block text-sm font-medium">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
                >
                  <option value="all">Todos</option>
                  <option value="open">Abertas</option>
                  <option value="closed">Fechadas</option>
                  <option value="canceled">Canceladas</option>
                </select>
              </div>

              {/* Data Inicial */}
              <div>
                <label className="text-theme-primary mb-2 block text-sm font-medium">
                  Data Inicial
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
                />
              </div>

              {/* Data Final */}
              <div>
                <label className="text-theme-primary mb-2 block text-sm font-medium">
                  Data Final
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="border-theme-border card-theme text-theme-primary w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-surface"
                />
              </div>

              {/* Botão Limpar */}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Comandas */}
      <div className="space-y-3">
        {ordersLoading ? (
          <div className="card-theme py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
            <p className="text-theme-muted">Carregando comandas...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-theme py-12 text-center">
            <Package className="text-theme-muted mx-auto mb-4 h-16 w-16" />
            <h3 className="text-theme-primary mb-2 text-lg font-semibold">
              Nenhuma comanda encontrada
            </h3>
            <p className="text-theme-muted mb-6">
              {filters.search ||
              filters.status !== 'all' ||
              filters.startDate ||
              filters.endDate
                ? 'Tente ajustar os filtros de busca'
                : 'Crie uma nova comanda para começar'}
            </p>

            {canCreateOrder && !filters.search && filters.status === 'all' && (
              <Button variant="primary" onClick={handleNewOrder}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Comanda
              </Button>
            )}
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderListItem
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order)}
              onClose={
                canCloseOrder
                  ? () => {
                      handleOrderClick(order);
                    }
                  : null
              }
              onCancel={
                canCancelOrder
                  ? () => {
                      setSelectedOrder(order);
                      handleOrderSubmit({
                        action: 'cancel',
                        data: order,
                      });
                    }
                  : null
              }
            />
          ))
        )}
      </div>

      {/* Resumo */}
      {filteredOrders.length > 0 && (
        <div className="card-theme mt-6 p-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <p className="text-theme-muted mb-1 text-sm">Total</p>
              <p className="text-theme-primary text-2xl font-bold">
                {filteredOrders.length}
              </p>
            </div>
            <div>
              <p className="text-theme-muted mb-1 text-sm">Abertas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredOrders.filter(o => o.status === 'open').length}
              </p>
            </div>
            <div>
              <p className="text-theme-muted mb-1 text-sm">Fechadas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredOrders.filter(o => o.status === 'closed').length}
              </p>
            </div>
            <div>
              <p className="text-theme-muted mb-1 text-sm">Canceladas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {filteredOrders.filter(o => o.status === 'canceled').length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Clientes */}
        <section className="card-theme space-y-6 p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Users className="text-theme-primary h-5 w-5" />
              <h2 className="text-theme-primary text-xl font-semibold">
                Clientes da unidade
              </h2>
            </div>
            <p className="text-theme-secondary text-sm">
              {filteredClients.length}{' '}
              {filteredClients.length === 1
                ? 'cliente encontrado'
                : 'clientes encontrados'}
              {selectedUnit?.name && ` em ${selectedUnit.name}`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="text-theme-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={clientsSearch}
                onChange={event => setClientsSearch(event.target.value)}
                placeholder="Buscar por nome, documento ou contato"
                className="input-theme w-full pl-10"
              />
            </div>
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Status
              </label>
              <select
                className="input-theme"
                value={clientStatusFilter}
                onChange={event => setClientStatusFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Histórico de compras
              </label>
              <select
                className="input-theme"
                value={clientHistoryFilter}
                onChange={event => setClientHistoryFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="recent">Últimos 30 dias</option>
                <option value="no-history">Sem histórico</option>
              </select>
            </div>
          </div>

          {clientsError && <Alert type="error" message={clientsError} />}

          {clientsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="space-y-3 py-12 text-center">
              <Users className="text-theme-muted mx-auto h-12 w-12" />
              <p className="text-theme-secondary">
                Nenhum cliente encontrado com os filtros selecionados.
              </p>
              <Button
                variant="secondary"
                icon={ArrowUpRight}
                onClick={() => navigate('/cadastros/clientes')}
              >
                Gerenciar clientes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedClients.map(client => {
                const metrics = clientMetrics.get(client.id) || {
                  totalOrders: 0,
                  lastOrderDate: null,
                };
                const clientName =
                  client.nome || client.name || 'Cliente sem nome';
                const clientPhone = client.telefone || client.phone || null;
                const clientEmail =
                  client.email || client.mail || client.contact_email || null;
                return (
                  <div
                    key={client.id}
                    className="card-theme space-y-4 rounded-xl border border-light-border p-4 dark:border-dark-border"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary dark:bg-primary/20">
                          {clientName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-theme-primary text-base font-semibold">
                            {clientName}
                          </h3>
                          {clientEmail && (
                            <div className="text-theme-secondary flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4" />
                              <span className="max-w-[220px] truncate">
                                {clientEmail}
                              </span>
                            </div>
                          )}
                          {clientPhone && (
                            <div className="text-theme-secondary flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4" />
                              <span>{formatPhone(clientPhone)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${client.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
                      >
                        {client.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            Inativo
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-light-hover p-3 dark:bg-dark-hover">
                        <p className="text-theme-secondary text-xs uppercase tracking-wide">
                          Total de comandas
                        </p>
                        <p className="text-theme-primary text-lg font-semibold">
                          {metrics.totalOrders || 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-light-hover p-3 dark:bg-dark-hover">
                        <p className="text-theme-secondary text-xs uppercase tracking-wide">
                          Última visita
                        </p>
                        <p className="text-theme-primary text-lg font-semibold">
                          {metrics.lastOrderDate
                            ? formatDateShort(metrics.lastOrderDate)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowUpRight}
                        onClick={() => handleViewClientHistory(client.id)}
                      >
                        Ver histórico
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowUpRight}
                        onClick={() => handleOpenClientProfile(client.id)}
                      >
                        Ver perfil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredClients.length > clientsPerPage && (
            <div className="flex items-center justify-between border-t border-light-border pt-4 text-sm dark:border-dark-border">
              <span className="text-theme-secondary">
                Página {clientsPage} de {totalClientPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => setClientsPage(prev => Math.max(1, prev - 1))}
                  disabled={clientsPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  onClick={() =>
                    setClientsPage(prev => Math.min(totalClientPages, prev + 1))
                  }
                  disabled={clientsPage === totalClientPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Profissionais */}
        <section className="card-theme space-y-6 p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Briefcase className="text-theme-primary h-5 w-5" />
              <h2 className="text-theme-primary text-xl font-semibold">
                Profissionais em destaque
              </h2>
            </div>
            <p className="text-theme-secondary text-sm">
              {filteredProfessionals.length}{' '}
              {filteredProfessionals.length === 1
                ? 'profissional disponível'
                : 'profissionais disponíveis'}
              {selectedUnit?.name && ` em ${selectedUnit.name}`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="text-theme-muted absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                value={professionalSearch}
                onChange={event => setProfessionalSearch(event.target.value)}
                placeholder="Buscar por nome ou especialidade"
                className="input-theme w-full pl-10"
              />
            </div>
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Status
              </label>
              <select
                className="input-theme"
                value={professionalStatusFilter}
                onChange={event =>
                  setProfessionalStatusFilter(event.target.value)
                }
              >
                <option value="active">Disponíveis</option>
                <option value="inactive">Inativos</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Especialidade
              </label>
              <select
                className="input-theme"
                value={specialtyFilter}
                onChange={event => setSpecialtyFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-theme-primary mb-1 block text-sm font-medium">
                Ordenação
              </label>
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowUpDown}
                onClick={toggleAvailabilitySort}
              >
                Disponibilidade {availabilitySort === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {professionalsError && (
            <Alert type="error" message={professionalsError} />
          )}

          {professionalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="space-y-3 py-12 text-center">
              <Briefcase className="text-theme-muted mx-auto h-12 w-12" />
              <p className="text-theme-secondary">
                Nenhum profissional encontrado com os filtros selecionados.
              </p>
              <Button
                variant="secondary"
                icon={ArrowUpRight}
                onClick={() => navigate('/professionals')}
              >
                Gerenciar profissionais
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProfessionals.map(professional => {
                const metrics = professionalMetrics.get(professional.id) || {
                  totalOrders: 0,
                  openOrders: 0,
                  closedOrders: 0,
                };
                const specialty = getProfessionalSpecialty(professional);
                return (
                  <div
                    key={professional.id}
                    className="card-theme space-y-4 rounded-xl border border-light-border p-4 dark:border-dark-border"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                          {professional.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-theme-primary text-base font-semibold">
                            {professional.name}
                          </h3>
                          <p className="text-theme-secondary flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4" />
                            {specialty}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${professional.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}
                      >
                        {professional.is_active ? 'Disponível' : 'Inativo'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                      <div className="rounded-lg bg-light-hover p-3 dark:bg-dark-hover">
                        <p className="text-theme-secondary text-xs uppercase tracking-wide">
                          Comandas em andamento
                        </p>
                        <p className="text-theme-primary text-lg font-semibold">
                          {metrics.openOrders || 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-light-hover p-3 dark:bg-dark-hover">
                        <p className="text-theme-secondary text-xs uppercase tracking-wide">
                          Comandas concluídas
                        </p>
                        <p className="text-theme-primary text-lg font-semibold">
                          {metrics.closedOrders || 0}
                        </p>
                      </div>
                      <div className="rounded-lg bg-light-hover p-3 dark:bg-dark-hover">
                        <p className="text-theme-secondary text-xs uppercase tracking-wide">
                          Comissão padrão
                        </p>
                        <p className="text-theme-primary text-lg font-semibold">
                          {professional.commission_rate || 0}%
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Clock}
                        onClick={() =>
                          handleOpenProfessionalAgenda(professional.id)
                        }
                      >
                        Ver agenda
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ArrowUpRight}
                        onClick={() =>
                          handleOpenProfessionalProfile(professional.id)
                        }
                      >
                        Ver perfil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalVisible}
        onClose={() => {
          setIsOrderModalVisible(false);
          setSelectedOrder(null);
          setCurrentOrderItems([]);
          setItemModalProfessionalId('');
        }}
        onSubmit={handleOrderSubmit}
        onAddItem={handleAddItemClick}
        order={selectedOrder}
        unitId={unitId}
        clients={(() => {
          console.log('📤 OrdersPage - Passando clientes para OrderModal:', {
            selectableClients: selectableClients,
            totalSelectableClients: selectableClients?.length || 0,
            clientsData: clientsData,
            totalClientsData: clientsData?.length || 0,
            unitId: unitId,
          });
          return selectableClients;
        })()}
        professionals={modalProfessionals}
        paymentMethods={paymentMethods}
        bankAccounts={bankAccounts}
        items={(() => {
          console.log('📦 OrdersPage - Passando items para OrderModal:', {
            currentOrderItems: currentOrderItems,
            totalItems: currentOrderItems?.length || 0,
          });
          return currentOrderItems;
        })()}
        onRemoveItem={handleRemoveItem}
      />

      <OrderItemModal
        isOpen={isOrderItemModalVisible}
        onClose={() => {
          setIsOrderItemModalVisible(false);
          setCurrentOrderId(null);
          setItemModalProfessionalId('');
        }}
        onSubmit={handleItemSubmit}
        orderId={currentOrderId}
        defaultProfessionalId={itemModalProfessionalId}
        services={activeServices || []}
        professionals={modalProfessionals}
      />
    </div>
  );
};
export default OrdersPage;
