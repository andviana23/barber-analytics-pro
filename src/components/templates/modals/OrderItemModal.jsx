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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-md p-6 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-light-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Serviço à Comanda
          </h2>
          <button
            onClick={onClose}
            className="text-theme-secondary hover:text-theme-primary transition-colors"
            disabled={isLoading}
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Serviço */}
          <div>
            <label
              htmlFor="serviceId"
              className="block text-sm font-medium text-theme-primary mb-2 flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-primary" />
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
              className="btn-theme-secondary flex-1 py-2.5 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedServiceId}
              className="btn-theme-primary flex-1 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? 'Adicionando...' : 'Adicionar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderItemModal;
