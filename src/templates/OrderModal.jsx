import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../atoms/Modal';
import { OrderItemsTable } from '../organisms';

/**
 * OrderModal - Modal para criar/editar comanda
 *
 * Template modal completo para gerenciar comandas.
 * Permite adicionar cliente, observações e gerenciar itens.
 *
 * @component
 * @example
 * ```jsx
 * <OrderModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onSave={handleSave}
 *   order={orderData}
 *   mode="create"
 * />
 * ```
 */
const OrderModal = ({
  isOpen,
  onClose,
  onSave,
  onAddItem,
  onRemoveItem,
  order = null,
  mode = 'create', // 'create' | 'edit' | 'view'
  loading = false,
}) => {
  const [clientName, setClientName] = useState('');
  const [observations, setObservations] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  const isEditMode = mode === 'create' || mode === 'edit';
  const isCreateMode = mode === 'create';

  useEffect(() => {
    if (order) {
      setClientName(order.client_name || '');
      setObservations(order.observations || '');
      setItems(order.items || []);
    } else {
      handleReset();
    }
  }, [order, isOpen]);

  const handleReset = () => {
    setClientName('');
    setObservations('');
    setItems([]);
    setErrors({});
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const validate = () => {
    const newErrors = {};

    if (isEditMode && !clientName.trim()) {
      newErrors.clientName = 'Nome do cliente é obrigatório';
    }

    if (isEditMode && items.length === 0) {
      newErrors.items = 'Adicione pelo menos um serviço';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!validate()) return;

    if (onSave) {
      onSave({
        client_name: clientName.trim() || null,
        observations: observations.trim() || null,
        items,
      });
    }
  };

  const handleAddItemClick = () => {
    if (onAddItem) {
      onAddItem(newItem => {
        setItems([...items, newItem]);
      });
    }
  };

  const handleRemoveItemClick = item => {
    const newItems = items.filter(i => i.id !== item.id);
    setItems(newItems);

    if (onRemoveItem) {
      onRemoveItem(item);
    }
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
  };

  const total = calculateTotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isCreateMode
          ? 'Nova Comanda'
          : mode === 'edit'
            ? `Editar Comanda #${order?.order_number || ''}`
            : `Comanda #${order?.order_number || ''}`
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome do Cliente */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Nome do Cliente
              {isEditMode && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              disabled={!isEditMode || loading}
              placeholder="Digite o nome do cliente"
              maxLength={100}
              className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-surface text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed ${
                errors.clientName
                  ? 'border-red-500 dark:border-red-400 focus:border-red-500'
                  : 'border-light-border dark:border-dark-border focus:border-primary'
              }`}
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.clientName}
              </p>
            )}
          </div>

          {/* Info Cards (apenas visualização/edição) */}
          {!isCreateMode && order && (
            <>
              <div className="p-4 bg-light-surface dark:bg-dark-hover rounded-lg border border-light-border dark:border-dark-border">
                <p className="text-xs text-theme-secondary mb-1">Número</p>
                <p className="text-lg font-bold text-primary">
                  #{order.order_number}
                </p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-hover rounded-lg border border-light-border dark:border-dark-border">
                <p className="text-xs text-theme-secondary mb-1">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                    order.status === 'open'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                      : order.status === 'closed'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {order.status === 'open'
                    ? 'Aberta'
                    : order.status === 'closed'
                      ? 'Fechada'
                      : 'Cancelada'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-theme-primary mb-2">
            Observações
            <span className="text-theme-secondary ml-1">(opcional)</span>
          </label>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            disabled={!isEditMode || loading}
            rows={3}
            maxLength={500}
            placeholder="Informações adicionais sobre a comanda"
            className="w-full px-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-white dark:bg-dark-surface text-theme-primary placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed resize-none"
          />
          <p className="mt-1 text-xs text-theme-secondary text-right">
            {observations.length}/500
          </p>
        </div>

        {/* Tabela de Itens */}
        <div>
          <OrderItemsTable
            items={items}
            onRemoveItem={handleRemoveItemClick}
            onAddItem={isEditMode ? handleAddItemClick : null}
            editable={isEditMode}
            showCommission={true}
            loading={false}
            emptyMessage="Nenhum serviço adicionado ainda"
          />
          {errors.items && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.items}
            </p>
          )}
        </div>

        {/* Resumo do Total */}
        {items.length > 0 && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-theme-secondary mb-1">
                  Total da Comanda
                </p>
                <p className="text-xs text-theme-secondary">
                  {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
                </p>
              </div>
              <p className="text-3xl font-bold text-primary">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-light-border dark:border-dark-border rounded-lg font-medium text-theme-primary hover:bg-light-surface dark:hover:bg-dark-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mode === 'view' ? 'Fechar' : 'Cancelar'}
          </button>
          {isEditMode && (
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {isCreateMode ? 'Criar Comanda' : 'Salvar Alterações'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

OrderModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Callback ao salvar */
  onSave: PropTypes.func.isRequired,
  /** Callback ao adicionar item */
  onAddItem: PropTypes.func,
  /** Callback ao remover item */
  onRemoveItem: PropTypes.func,
  /** Dados da comanda (edit/view) */
  order: PropTypes.shape({
    order_number: PropTypes.number,
    client_name: PropTypes.string,
    observations: PropTypes.string,
    status: PropTypes.oneOf(['open', 'closed', 'cancelled']),
    items: PropTypes.array,
  }),
  /** Modo de operação */
  mode: PropTypes.oneOf(['create', 'edit', 'view']),
  /** Estado de carregamento */
  loading: PropTypes.bool,
};

export default OrderModal;
