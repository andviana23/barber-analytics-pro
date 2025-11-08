/**
 * @file OrderPaymentModal.jsx
 * @description Modal especializado para pagamento e fechamento de comanda
 * @module Components/Templates/Modals
 * @author Andrey Viana
 * @date 2025-10-28
 * @category Atomic Design - Template
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../Modal';
import Button from '../../atoms/Button';
import Select from '../../atoms/Select';
import OrderStatusBadge from '../../atoms/OrderStatusBadge';
import OrderTimeline from '../../molecules/OrderTimeline';
import { ORDER_STATUS } from '../../../constants/orderStatus';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../../utils/formatters';

/**
 * OrderPaymentModal - Modal para processar pagamento e fechar comanda
 *
 * Responsabilidades:
 * - Selecionar forma de pagamento
 * - Selecionar conta de destino
 * - Visualizar resumo do pagamento
 * - Confirmar fechamento
 * - Exibir histórico de status
 *
 * SRP: Foca apenas no fluxo de pagamento e fechamento
 *
 * @component
 */
const OrderPaymentModal = ({
  isOpen,
  onClose,
  order,
  paymentMethods = [],
  accounts = [],
  onConfirmPayment,
  userId,
}) => {
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // Reset form ao abrir modal
  useEffect(() => {
    if (isOpen && order) {
      setPaymentMethodId('');
      setAccountId('');
      setIsSubmitting(false);
    }
  }, [isOpen, order]);
  if (!order) return null;

  /**
   * Calcula totais da comanda
   */
  const calculateTotals = () => {
    if (!order.items || order.items.length === 0) {
      return {
        subtotal: 0,
        totalCommission: 0,
        total: 0,
        itemsCount: 0,
      };
    }
    const subtotal = order.items.reduce((sum, item) => {
      return sum + item.unit_price * item.quantity;
    }, 0);
    const totalCommission = order.items.reduce((sum, item) => {
      return sum + (item.commission_value || 0);
    }, 0);
    return {
      subtotal,
      totalCommission,
      total: subtotal,
      itemsCount: order.items.length,
    };
  };
  const totals = calculateTotals();

  /**
   * Confirma pagamento e fecha comanda
   */
  const handleConfirmPayment = async () => {
    // Validações
    if (!paymentMethodId) {
      toast.error('Selecione a forma de pagamento');
      return;
    }
    if (!accountId) {
      toast.error('Selecione a conta de destino');
      return;
    }
    if (totals.itemsCount === 0) {
      toast.error('Não é possível fechar uma comanda sem itens');
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirmPayment(order.id, {
        paymentMethodId,
        accountId,
        userId,
      });

      // Modal será fechado pelo componente pai após sucesso
    } catch (error) {
      console.error('[OrderPaymentModal] Erro ao confirmar pagamento:', error);
      setIsSubmitting(false);
    }
  };

  /**
   * Gera histórico mock para timeline (exemplo)
   * TODO: Buscar histórico real do backend
   */
  const getOrderHistory = () => {
    const history = [];
    if (order.created_at) {
      history.push({
        status: ORDER_STATUS.OPEN,
        timestamp: order.created_at,
        user: order.user?.name || 'Sistema',
        notes: 'Comanda criada',
      });
    }

    // Se tiver itens, inferir que passou para IN_PROGRESS
    if (order.items && order.items.length > 0) {
      history.push({
        status: ORDER_STATUS.IN_PROGRESS,
        timestamp: order.updated_at || order.created_at,
        user: order.professional?.name,
        notes: `${order.items.length} item(ns) adicionado(s)`,
      });
    }
    return history;
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Venda" size="lg">
      {/* Header: Info da comanda */}
      <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-theme-secondary text-sm">Cliente</p>
            <p className="text-lg font-bold">{order.client?.nome || 'N/A'}</p>
          </div>
          <OrderStatusBadge status={order.status} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-theme-secondary">Profissional</p>
            <p className="font-medium">{order.professional?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-theme-secondary">Data</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Resumo dos Itens */}
      <div className="mb-6">
        <h3 className="mb-3 font-semibold">Itens da Comanda</h3>

        {totals.itemsCount === 0 ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Esta comanda não possui itens. Adicione serviços antes de
              fechar.
            </p>
          </div>
        ) : (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {order.items.map(item => (
              <div
                key={item.id}
                className="card-theme flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.service?.name}</p>
                  <p className="text-theme-secondary text-xs">
                    {item.professional?.name} · Qtd: {item.quantity}
                  </p>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totalizadores */}
      <div className="mb-6 space-y-2 rounded-lg bg-light-bg p-4 dark:bg-dark-bg">
        <div className="flex justify-between text-sm">
          <span className="text-theme-secondary">
            Subtotal ({totals.itemsCount} itens):
          </span>
          <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-theme-secondary">Comissão total:</span>
          <span className="font-medium text-orange-600">
            {formatCurrency(totals.totalCommission)}
          </span>
        </div>

        <div className="mt-2 border-t border-light-border pt-2 dark:border-dark-border">
          <div className="flex justify-between">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Forma de Pagamento */}
      <div className="mb-6">
        <h3 className="mb-3 font-semibold">Dados do Pagamento</h3>

        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Forma de Pagamento *"
            value={paymentMethodId}
            onChange={e => setPaymentMethodId(e.target.value)}
            disabled={isSubmitting}
            required
          >
            <option value="">Selecione...</option>
            {paymentMethods.map(method => (
              <option key={method.id} value={method.id}>
                {method.nome}
              </option>
            ))}
          </Select>

          <Select
            label="Conta de Destino *"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            disabled={isSubmitting}
            required
          >
            <option value="">Selecione...</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.nome} - {account.tipo_conta}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Timeline (expansível) */}
      <div className="mb-6">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          {showTimeline ? '▼' : '▶'} Histórico da Comanda
        </button>

        {showTimeline && (
          <div className="mt-4">
            <OrderTimeline history={getOrderHistory()} compact />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>

        <Button
          variant="success"
          onClick={handleConfirmPayment}
          disabled={
            isSubmitting ||
            !paymentMethodId ||
            !accountId ||
            totals.itemsCount === 0
          }
          className="flex-1"
        >
          {isSubmitting ? 'Processando...' : '✅ Finalizar Venda'}
        </Button>
      </div>

      {/* Informação sobre transação atômica */}
      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-800">
          ℹ️ O fechamento será processado de forma atômica. Se houver qualquer
          erro, a transação será revertida automaticamente.
        </p>
      </div>
    </Modal>
  );
};
OrderPaymentModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Comanda a ser finalizada */
  order: PropTypes.object,
  /** Lista de formas de pagamento */
  paymentMethods: PropTypes.array,
  /** Lista de contas bancárias */
  accounts: PropTypes.array,
  /** Callback ao confirmar pagamento */
  onConfirmPayment: PropTypes.func.isRequired,
  /** ID do usuário que está fechando */
  userId: PropTypes.string,
};
export default OrderPaymentModal;
