import React, { useState, useEffect } from 'react';
import { X, Package, Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

/**
 * OrderItemModal - Modal para adicionar serviço à comanda
 *
 * Refatorado seguindo Design System (DESIGN_SYSTEM.md)
 * Simplificado: APENAS seleção de serviço
 *
 * Features:
 * - ✅ Seleção de serviço (dropdown com serviços ativos)
 * - ✅ Design System compliance (classes utilitárias)
 * - ✅ Dark mode support
 * - ✅ Responsive layout
 * - ✅ Minimal e focado
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {Function} props.onSubmit - Callback ao adicionar item
 * @param {string} props.orderId - ID da comanda (obrigatório)
 * @param {Array} props.services - Lista de serviços disponíveis
 */
const OrderItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  services = [],
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setSelectedServiceId('');
    }
  }, [isOpen]);

  // Handler de submit
  const handleSubmit = async e => {
    e.preventDefault();

    if (!selectedServiceId) return;

    setIsLoading(true);

    try {
      const selectedService = services.find(s => s.id === selectedServiceId);

      const itemData = {
        orderId,
        serviceId: selectedServiceId,
        serviceName: selectedService.name,
        unitPrice: parseFloat(selectedService.price) || 0,
        quantity: 1,
      };

      await onSubmit(itemData);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="card-theme w-full max-w-md rounded-xl p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-light-border pb-4 dark:border-dark-border">
          <h2 className="text-theme-primary flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Serviço à Comanda
          </h2>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary transition-colors"
            disabled={isLoading}
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Serviço */}
          <div>
            <label
              htmlFor="serviceId"
              className="text-theme-primary mb-2 block flex items-center gap-2 text-sm font-medium"
            >
              <Package className="h-4 w-4 text-primary" />
              Serviço
            </label>
            <select
              id="serviceId"
              value={selectedServiceId}
              onChange={e => setSelectedServiceId(e.target.value)}
              disabled={isLoading}
              className="input-theme"
              required
            >
              <option value="">Selecione um serviço</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-theme-secondary flex-1 rounded-lg py-2.5 font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedServiceId}
              className="btn-theme-primary flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isLoading ? 'Adicionando...' : 'Adicionar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderItemModal;
