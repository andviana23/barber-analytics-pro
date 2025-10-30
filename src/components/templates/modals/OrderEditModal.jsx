/**
 * @file OrderEditModal.jsx
 * @description Modal para editar itens de uma comanda existente
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
import Input from '../../atoms/Input';
import OrderStatusBadge from '../../atoms/OrderStatusBadge';
import { ORDER_STATUS, canEditOrder } from '../../../constants/orderStatus';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../../../utils/formatters';

/**
 * OrderEditModal - Modal especializado para editar itens da comanda
 *
 * Responsabilidades:
 * - Adicionar novos serviços à comanda
 * - Remover serviços existentes
 * - Alterar quantidades
 * - Visualizar total atualizado
 *
 * SRP: Foca apenas na edição de itens (não cria nem fecha comandas)
 *
 * @component
 */
const OrderEditModal = ({
  isOpen,
  onClose,
  order,
  services = [],
  professionals = [],
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form ao abrir modal
  useEffect(() => {
    if (isOpen) {
      setSelectedService('');
      setSelectedProfessional(order?.professional_id || '');
      setQuantity(1);
    }
  }, [isOpen, order]);

  if (!order) return null;

  // Verifica se pode editar
  const canEdit = canEditOrder(order.status);

  /**
   * Adiciona serviço à comanda
   */
  const handleAddService = async () => {
    if (!selectedService) {
      toast.error('Selecione um serviço');
      return;
    }

    if (!selectedProfessional) {
      toast.error('Selecione um profissional');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    setIsSubmitting(true);

    try {
      await onAddItem(order.id, {
        serviceId: selectedService,
        professionalId: selectedProfessional,
        quantity: parseInt(quantity),
      });

      // Reset formulário após sucesso
      setSelectedService('');
      setQuantity(1);
    } catch (error) {
      // Erro já tratado no service
      console.error('[OrderEditModal] Erro ao adicionar item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Remove item da comanda
   */
  const handleRemoveItem = async itemId => {
    if (!confirm('Deseja realmente remover este item?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onRemoveItem(itemId);
    } catch (error) {
      console.error('[OrderEditModal] Erro ao remover item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Calcula total da comanda
   */
  const calculateTotal = () => {
    if (!order.items || order.items.length === 0) return 0;

    return order.items.reduce((sum, item) => {
      return sum + item.unit_price * item.quantity;
    }, 0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Comanda" size="lg">
      {/* Header: Info da comanda */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-medium">{order.client?.nome || 'N/A'}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Validação de edição */}
      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Esta comanda não pode ser editada no status atual.
          </p>
        </div>
      )}

      {/* Lista de itens atuais */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Itens da Comanda</h3>

        {!order.items || order.items.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Nenhum item adicionado</p>
        ) : (
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {item.service?.name || 'Serviço'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.professional?.name || 'Profissional'} · Qtd:{' '}
                    {item.quantity} ·{formatCurrency(item.unit_price)} cada
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>

                  {canEdit && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isSubmitting}
                    >
                      🗑️
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form: Adicionar novo serviço */}
      {canEdit && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold mb-3">Adicionar Serviço</h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Select
              label="Serviço"
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Selecione...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)}
                </option>
              ))}
            </Select>

            <Select
              label="Profissional"
              value={selectedProfessional}
              onChange={e => setSelectedProfessional(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Selecione...</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Input
              type="number"
              label="Quantidade"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              min="1"
              disabled={isSubmitting}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleAddService}
            disabled={isSubmitting || !selectedService || !selectedProfessional}
            className="w-full"
          >
            {isSubmitting ? 'Adicionando...' : '➕ Adicionar Serviço'}
          </Button>
        </div>
      )}

      {/* Footer: Total */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

OrderEditModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Comanda sendo editada */
  order: PropTypes.object,
  /** Lista de serviços disponíveis */
  services: PropTypes.array,
  /** Lista de profissionais */
  professionals: PropTypes.array,
  /** Callback ao adicionar item */
  onAddItem: PropTypes.func.isRequired,
  /** Callback ao remover item */
  onRemoveItem: PropTypes.func.isRequired,
  /** Callback ao atualizar item */
  onUpdateItem: PropTypes.func,
};

export default OrderEditModal;
