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
  mode = 'create',
  // 'create' | 'edit' | 'view'
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Nome do Cliente */}
          <div className="md:col-span-2">
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              Nome do Cliente
              {isEditMode && <span className="ml-1 text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              disabled={!isEditMode || loading}
              placeholder="Digite o nome do cliente"
              maxLength={100}
              className={`text-theme-primary placeholder-theme-secondary w-full rounded-lg border bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-surface ${errors.clientName ? 'border-red-500 focus:border-red-500 dark:border-red-400' : 'border-light-border focus:border-primary dark:border-dark-border'}`}
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
              <div className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-hover">
                <p className="text-theme-secondary mb-1 text-xs">Número</p>
                <p className="text-lg font-bold text-primary">
                  #{order.order_number}
                </p>
              </div>
              <div className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-hover">
                <p className="text-theme-secondary mb-1 text-xs">Status</p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${order.status === 'open' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : order.status === 'closed' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}`}
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
          <label className="text-theme-primary mb-2 block text-sm font-medium">
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
            className="card-theme text-theme-primary placeholder-theme-secondary w-full resize-none rounded-lg border border-light-border px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:bg-dark-surface"
          />
          <p className="text-theme-secondary mt-1 text-right text-xs">
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
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-theme-secondary mb-1 text-sm">
                  Total da Comanda
                </p>
                <p className="text-theme-secondary text-xs">
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
        <div className="flex gap-3 border-t border-light-border pt-4 dark:border-dark-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-theme-primary flex-1 rounded-lg border border-light-border px-4 py-2.5 font-medium transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-border dark:hover:bg-dark-hover"
          >
            {mode === 'view' ? 'Fechar' : 'Cancelar'}
          </button>
          {isEditMode && (
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="hover:bg-primary-dark text-dark-text-primary inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                  Salvando...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
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
