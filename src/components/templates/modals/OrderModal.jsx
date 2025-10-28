import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Briefcase,
  Plus,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import OrderItemsTable from '../../organisms/OrderItemsTable';
import { validateCreateOrder } from '../../../dtos/OrderDTO';
import { formatCurrency } from '../../../utils/formatters';

/**
 * OrderModal - Modal para criar/editar comandas
 *
 * Features:
 * - Seleção de cliente e profissional
 * - Lista de itens (OrderItemsTable)
 * - Botão para adicionar serviços (abre OrderItemModal)
 * - Cálculo automático de totais
 * - Ações: Salvar Rascunho / Fechar Comanda / Cancelar
 * - Validação com Zod
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {Function} props.onSubmit - Callback ao salvar (recebe: { action, data })
 * @param {Function} props.onAddItem - Callback ao clicar "Adicionar Serviço"
 * @param {Object} props.order - Dados da comanda (modo edição)
 * @param {Array} props.clients - Lista de clientes disponíveis
 * @param {Array} props.professionals - Lista de profissionais disponíveis
 * @param {Array} props.items - Itens da comanda
 * @param {Function} props.onRemoveItem - Callback ao remover item
 */
const OrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  onAddItem,
  order = null,
  clients = [],
  professionals = [],
  items = [],
  onRemoveItem,
}) => {
  const isEditMode = !!order;

  // Estado do formulário
  const [formData, setFormData] = useState({
    clientId: '',
    professionalId: '',
    cashRegisterId: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Preenche form se estiver editando
  useEffect(() => {
    if (isEditMode && order) {
      setFormData({
        clientId: order.clientId || '',
        professionalId: order.professionalId || '',
        cashRegisterId: order.cashRegisterId || '',
      });
    } else {
      setFormData({
        clientId: '',
        professionalId: '',
        cashRegisterId: '',
      });
    }
    setErrors({});
  }, [isEditMode, order, isOpen]);

  // Calcula totais dos itens
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalCommission = items.reduce(
      (sum, item) => sum + (item.commissionValue || 0),
      0
    );
    const totalItems = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    return { subtotal, totalCommission, totalItems };
  };

  const totals = calculateTotals();

  // Handler de mudança nos inputs
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpa erro do campo ao editar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Valida formulário
  const validateForm = () => {
    try {
      validateCreateOrder(formData);
      return true;
    } catch (error) {
      const fieldErrors = {};
      error.errors?.forEach(err => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  // Handler de submit com diferentes ações
  const handleSubmit = async action => {
    if (!validateForm()) return;

    if (items.length === 0 && action !== 'save_draft') {
      setErrors({ items: 'Adicione pelo menos um serviço à comanda' });
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        action, // 'save_draft', 'close', 'cancel'
        data: {
          ...formData,
          items,
          totalAmount: totals.subtotal,
        },
      });
      onClose();
    } catch (error) {
      console.error('Erro ao processar comanda:', error);
      setErrors({ submit: error.message || 'Erro ao processar comanda' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-primary">
            {isEditMode ? 'Editar Comanda' : 'Nova Comanda'}
          </h2>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-theme-primary transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Cliente e Profissional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Cliente *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.document && `(${client.document})`}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
              )}
            </div>

            {/* Profissional */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Profissional Responsável *
              </label>
              <select
                name="professionalId"
                value={formData.professionalId}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
              {errors.professionalId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.professionalId}
                </p>
              )}
            </div>
          </div>

          {/* Botão Adicionar Serviço */}
          <div className="flex items-center justify-between py-4 border-t border-b border-theme-border">
            <h3 className="text-lg font-medium text-theme-primary">
              Serviços da Comanda
            </h3>
            <Button
              variant="secondary"
              onClick={onAddItem}
              disabled={isLoading || !formData.professionalId}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Serviço
            </Button>
          </div>

          {!formData.professionalId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ Selecione um profissional para adicionar serviços
              </p>
            </div>
          )}

          {errors.items && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ {errors.items}
              </p>
            </div>
          )}

          {/* Tabela de Itens */}
          {items.length > 0 && (
            <OrderItemsTable
              items={items}
              onRemoveItem={onRemoveItem}
              readOnly={isLoading}
            />
          )}

          {/* Totais */}
          <div className="card-theme bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-theme-muted">Total de Itens:</span>
              <span className="font-medium text-theme-primary">
                {totals.totalItems}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-theme-muted">Subtotal:</span>
              <span className="font-medium text-theme-primary">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-theme-muted">Comissão Total:</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {formatCurrency(totals.totalCommission)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-theme-border">
              <span className="text-theme-primary">Total da Comanda:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ {errors.submit}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar
            </Button>

            <div className="flex-1" />

            <Button
              variant="secondary"
              onClick={() => handleSubmit('save_draft')}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>

            <Button
              variant="primary"
              onClick={() => handleSubmit('close')}
              disabled={isLoading || items.length === 0}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isLoading ? 'Processando...' : 'Fechar Comanda'}
            </Button>
          </div>

          {/* Info sobre fechar comanda */}
          {items.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-xs text-green-800 dark:text-green-200">
                💡 <strong>Fechar Comanda:</strong> Gera receita automaticamente
                e calcula comissões dos profissionais.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
