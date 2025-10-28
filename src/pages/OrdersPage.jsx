import React, { useState, useEffect } from 'react';
import { FileText, Plus, Filter, X, Search, Package } from 'lucide-react';
import { Button } from '../atoms/Button/Button';
import OrderListItem from '../components/molecules/OrderListItem';
import OrderModal from '../components/templates/modals/OrderModal';
import OrderItemModal from '../components/templates/modals/OrderItemModal';
import useOrders from '../hooks/useOrders';
import useServices from '../hooks/useServices';
import useUserPermissions from '../hooks/useUserPermissions';
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
  // Hooks
  const {
    orders,
    loading,
    createOrder,
    closeOrder,
    cancelOrder,
    addItemToOrder,
    removeItemFromOrder,
    fetchOrders,
  } = useOrders();

  const { activeServices, fetchActiveServices } = useServices();
  const { canCreateOrder, canCloseOrder, canCancelOrder } =
    useUserPermissions();

  // Estado dos modais
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [isOrderItemModalVisible, setIsOrderItemModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderItems, setCurrentOrderItems] = useState([]);

  // Estado dos filtros
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Carrega dados ao montar
  useEffect(() => {
    fetchOrders();
    fetchActiveServices();
  }, []);

  // Filtra comandas localmente
  const filteredOrders = orders.filter(order => {
    // Filtro de status
    if (filters.status !== 'all' && order.status !== filters.status) {
      return false;
    }

    // Filtro de busca (cliente ou profissional)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const clientMatch = order.clientName?.toLowerCase().includes(searchLower);
      const professionalMatch = order.professionalName
        ?.toLowerCase()
        .includes(searchLower);

      if (!clientMatch && !professionalMatch) {
        return false;
      }
    }

    // Filtro de data inicial
    if (
      filters.startDate &&
      new Date(order.createdAt) < new Date(filters.startDate)
    ) {
      return false;
    }

    // Filtro de data final
    if (
      filters.endDate &&
      new Date(order.createdAt) > new Date(filters.endDate)
    ) {
      return false;
    }

    return true;
  });

  // Handler de criação/edição de comanda
  const handleOrderSubmit = async ({ action, data }) => {
    try {
      if (selectedOrder) {
        // Modo edição - apenas fecha ou cancela
        if (action === 'close') {
          const result = await closeOrder(selectedOrder.id);

          // Service já exibe toast
          if (!result.error) {
            setIsOrderModalVisible(false);
            setSelectedOrder(null);
            setCurrentOrderItems([]);
            fetchOrders();
          }
        } else if (action === 'cancel') {
          const result = await cancelOrder(
            selectedOrder.id,
            'Cancelado pelo usuário'
          );

          // Service já exibe toast
          if (!result.error) {
            setIsOrderModalVisible(false);
            setSelectedOrder(null);
            setCurrentOrderItems([]);
            fetchOrders();
          }
        }
      } else {
        // Modo criação
        const result = await createOrder(data);

        if (result.error) {
          return;
        }

        if (action === 'close') {
          // Cria e já fecha
          const closeResult = await closeOrder(result.data.id);

          if (!closeResult.error) {
            setIsOrderModalVisible(false);
            setSelectedOrder(null);
            setCurrentOrderItems([]);
            fetchOrders();
          }
        } else {
          // Service já exibiu toast de sucesso
          setIsOrderModalVisible(false);
          setSelectedOrder(null);
          setCurrentOrderItems([]);
          fetchOrders();
        }
      }
    } catch (error) {
      console.error('Erro ao processar comanda:', error);
    }
  };

  // Handler de adicionar item
  const handleAddItemClick = orderId => {
    setCurrentOrderId(orderId || selectedOrder?.id);
    setIsOrderItemModalVisible(true);
  };

  // Handler de submit do item
  const handleItemSubmit = async itemData => {
    try {
      // Se está criando nova comanda, adiciona ao estado local
      if (!selectedOrder) {
        setCurrentOrderItems(prev => [
          ...prev,
          { ...itemData, id: Date.now() },
        ]);
        toast.success('✅ Serviço adicionado à comanda');
        return;
      }

      // Se está editando, adiciona no servidor
      const result = await addItemToOrder(itemData);

      // Service já exibe toast
      if (!result.error) {
        fetchOrders();

        // Atualiza items locais se modal estiver aberto
        if (isOrderModalVisible) {
          // TODO: Buscar items atualizados
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  // Handler de remover item
  const handleRemoveItem = async itemId => {
    try {
      // Se está criando nova comanda, remove do estado local
      if (!selectedOrder) {
        setCurrentOrderItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('Serviço removido');
        return;
      }

      // Se está editando, remove no servidor
      const result = await removeItemFromOrder(itemId);

      // Service já exibe toast
      if (!result.error) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  // Handler de click na comanda
  const handleOrderClick = order => {
    setSelectedOrder(order);
    setCurrentOrderItems(order.items || []);
    setIsOrderModalVisible(true);
  };

  // Handler de filtros
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  // Handler de nova comanda
  const handleNewOrder = () => {
    setSelectedOrder(null);
    setCurrentOrderItems([]);
    setIsOrderModalVisible(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-theme-primary mb-2">
              <FileText className="w-8 h-8 inline mr-2" />
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
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Comanda
            </Button>
          )}
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="card-theme p-4 space-y-4">
          {/* Busca */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Buscar por cliente ou profissional..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-theme-border">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="open">Abertas</option>
                  <option value="closed">Fechadas</option>
                  <option value="canceled">Canceladas</option>
                </select>
              </div>

              {/* Data Inicial */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Data Final */}
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botão Limpar */}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Comandas */}
      <div className="space-y-3">
        {loading ? (
          <div className="card-theme text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-theme-muted">Carregando comandas...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-theme text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-theme-muted" />
            <h3 className="text-lg font-semibold text-theme-primary mb-2">
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
                <Plus className="w-4 h-4 mr-2" />
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
                      setSelectedOrder(order);
                      handleOrderSubmit({ action: 'close', data: order });
                    }
                  : null
              }
              onCancel={
                canCancelOrder
                  ? () => {
                      setSelectedOrder(order);
                      handleOrderSubmit({ action: 'cancel', data: order });
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-theme-muted mb-1">Total</p>
              <p className="text-2xl font-bold text-theme-primary">
                {filteredOrders.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-theme-muted mb-1">Abertas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredOrders.filter(o => o.status === 'open').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-theme-muted mb-1">Fechadas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredOrders.filter(o => o.status === 'closed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-theme-muted mb-1">Canceladas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {filteredOrders.filter(o => o.status === 'canceled').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <OrderModal
        isOpen={isOrderModalVisible}
        onClose={() => {
          setIsOrderModalVisible(false);
          setSelectedOrder(null);
          setCurrentOrderItems([]);
        }}
        onSubmit={handleOrderSubmit}
        onAddItem={() => handleAddItemClick()}
        order={selectedOrder}
        clients={[]} // TODO: Buscar clientes do banco
        professionals={[]} // TODO: Buscar profissionais do banco
        items={currentOrderItems}
        onRemoveItem={handleRemoveItem}
      />

      <OrderItemModal
        isOpen={isOrderItemModalVisible}
        onClose={() => setIsOrderItemModalVisible(false)}
        onSubmit={handleItemSubmit}
        orderId={currentOrderId}
        defaultProfessionalId={selectedOrder?.professionalId}
        services={activeServices}
        professionals={[]} // TODO: Buscar profissionais do banco
      />
    </div>
  );
};

export default OrdersPage;
