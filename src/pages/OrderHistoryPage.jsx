import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../constants/orderConstants';
import OrderStatusBadge from '../atoms/OrderStatusBadge';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card from '../atoms/Card';
import { supabase } from '../config/supabaseClient';
import { toast } from 'react-hot-toast';
import { Download, Filter, X } from 'lucide-react';

/**
 * OrderHistoryPage - Página de histórico de comandas com filtros avançados
 *
 * @page
 * @example
 * <OrderHistoryPage />
 */
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    clientSearch: '',
    professionalId: '',
    status: '',
    minValue: '',
    maxValue: '',
  });

  // Dados para seletores
  const [professionals, setProfessionals] = useState([]);
  const [clients, setClients] = useState([]);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Carregar comandas
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          *,
          client:clients(id, name, phone),
          items:order_items(
            id,
            quantity,
            service:services(name, price),
            product:products(name, price),
            professional:professionals(id, name)
          )
        `
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(500); // Limitar para performance

      if (ordersError) throw ordersError;

      // Carregar profissionais
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('id, name')
        .order('name');
      if (profError) throw profError;

      // Carregar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      if (clientsError) throw clientsError;
      setOrders(ordersData || []);
      setProfessionals(profData || []);
      setClients(clientsData || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar histórico de comandas');
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...orders];

    // Filtro por data
    if (filters.startDate) {
      filtered = filtered.filter(
        order => new Date(order.created_at) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        order => new Date(order.created_at) <= endDate
      );
    }

    // Filtro por cliente
    if (filters.clientSearch) {
      const search = filters.clientSearch.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.client?.name?.toLowerCase().includes(search) ||
          order.client?.phone?.includes(search)
      );
    }

    // Filtro por profissional
    if (filters.professionalId) {
      filtered = filtered.filter(order =>
        order.items?.some(
          item => item.professional?.id === filters.professionalId
        )
      );
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro por valor
    if (filters.minValue) {
      const minValue = parseFloat(filters.minValue);
      filtered = filtered.filter(
        order => calculateOrderTotal(order) >= minValue
      );
    }
    if (filters.maxValue) {
      const maxValue = parseFloat(filters.maxValue);
      filtered = filtered.filter(
        order => calculateOrderTotal(order) <= maxValue
      );
    }
    setFilteredOrders(filtered);
    setCurrentPage(1); // Resetar para primeira página
  };
  const calculateOrderTotal = order => {
    const subtotal =
      order.items?.reduce((sum, item) => {
        const price = item.service?.price || item.product?.price || 0;
        return sum + price * item.quantity;
      }, 0) || 0;
    let total = subtotal;

    // Aplicar desconto
    if (order.discount_type === 'percentage') {
      total -= (subtotal * order.discount_value) / 100;
    } else if (order.discount_type === 'fixed') {
      total -= order.discount_value;
    }

    // Aplicar taxa
    if (order.fee_type === 'percentage') {
      total += (total * order.fee_value) / 100;
    } else if (order.fee_type === 'fixed') {
      total += order.fee_value;
    }
    return Math.max(0, total);
  };
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      clientSearch: '',
      professionalId: '',
      status: '',
      minValue: '',
      maxValue: '',
    });
  };
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const csvData = filteredOrders.map(order => ({
        Data: formatDate(order.created_at),
        Cliente: order.client?.name || 'Sem cliente',
        Status: ORDER_STATUS_LABELS[order.status] || order.status,
        Total: calculateOrderTotal(order).toFixed(2),
        Itens: order.items?.length || 0,
        Profissionais: [
          ...new Set(
            order.items?.map(i => i.professional?.name).filter(Boolean)
          ),
        ].join(', '),
      }));
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row =>
          headers.map(header => `"${row[header]}"`).join(',')
        ),
      ].join('\n');
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `historico-comandas-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Histórico exportado com sucesso!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar histórico');
    } finally {
      setExporting(false);
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-theme-primary text-2xl font-bold">
            Histórico de Comandas
          </h1>
          <p className="text-theme-secondary">
            {filteredOrders.length}{' '}
            {filteredOrders.length === 1
              ? 'comanda encontrada'
              : 'comandas encontradas'}
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          loading={exporting}
          disabled={filteredOrders.length === 0}
          icon={<Download className="h-4 w-4" />}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-theme-primary flex items-center gap-2 font-medium">
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            icon={<X className="h-4 w-4" />}
          >
            Limpar Filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Data Inicial */}
          <Input
            label="Data Inicial"
            type="date"
            value={filters.startDate}
            onChange={e =>
              setFilters({
                ...filters,
                startDate: e.target.value,
              })
            }
          />

          {/* Data Final */}
          <Input
            label="Data Final"
            type="date"
            value={filters.endDate}
            onChange={e =>
              setFilters({
                ...filters,
                endDate: e.target.value,
              })
            }
          />

          {/* Cliente */}
          <Input
            label="Cliente"
            type="text"
            placeholder="Nome ou telefone..."
            value={filters.clientSearch}
            onChange={e =>
              setFilters({
                ...filters,
                clientSearch: e.target.value,
              })
            }
          />

          {/* Profissional */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Profissional
            </label>
            <select
              value={filters.professionalId}
              onChange={e =>
                setFilters({
                  ...filters,
                  professionalId: e.target.value,
                })
              }
              className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
            >
              <option value="">Todos</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters({
                  ...filters,
                  status: e.target.value,
                })
              }
              className="w-full rounded-lg border border-light-border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-dark-border"
            >
              <option value="">Todos</option>
              {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Mínimo */}
          <Input
            label="Valor Mínimo"
            type="number"
            step="0.01"
            min="0"
            placeholder="R$ 0,00"
            value={filters.minValue}
            onChange={e =>
              setFilters({
                ...filters,
                minValue: e.target.value,
              })
            }
          />

          {/* Valor Máximo */}
          <Input
            label="Valor Máximo"
            type="number"
            step="0.01"
            min="0"
            placeholder="R$ 0,00"
            value={filters.maxValue}
            onChange={e =>
              setFilters({
                ...filters,
                maxValue: e.target.value,
              })
            }
          />
        </div>
      </Card>

      {/* Lista de Comandas */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-theme-secondary mt-2">Carregando histórico...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-theme-secondary">
            Nenhuma comanda encontrada com os filtros aplicados.
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedOrders.map(order => (
              <Card
                key={order.id}
                className="p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-theme-secondary font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                      {order.discount_value > 0 && (
                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                          Desconto
                        </span>
                      )}
                      {order.fee_value > 0 && (
                        <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">
                          Taxa
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-theme-secondary">Cliente:</span>
                        <p className="font-medium">
                          {order.client?.name || 'Sem cliente'}
                        </p>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Data:</span>
                        <p className="font-medium">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Itens:</span>
                        <p className="font-medium">
                          {order.items?.length || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-theme-secondary">Total:</span>
                        <p className="font-bold text-blue-600">
                          {formatCurrency(calculateOrderTotal(order))}
                        </p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 border-t border-light-border pt-3 dark:border-dark-border">
                        <p className="text-theme-secondary mb-2 text-xs">
                          Itens:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map(item => (
                            <span
                              key={item.id}
                              className="card-theme rounded px-2 py-1 text-xs"
                            >
                              {item.service?.name || item.product?.name}
                              {item.quantity > 1 && ` (${item.quantity}x)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-theme-secondary text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default OrderHistoryPage;
