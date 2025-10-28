import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Hash,
  DollarSign,
  Percent,
  Calculator,
  Plus,
} from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import { validateAddOrderItem } from '../../../dtos/OrderItemDTO';
import { formatCurrency } from '../../../utils/formatters';

/**
 * OrderItemModal - Modal para adicionar serviço à comanda
 *
 * Features:
 * - Seleção de serviço (dropdown com serviços ativos)
 * - Input de quantidade
 * - Override de profissional (opcional)
 * - Exibição de preço unitário do serviço
 * - Cálculo em tempo real: total = preço × quantidade
 * - Cálculo em tempo real: comissão = total × percentual
 * - Validação com Zod
 * - Preview detalhado dos cálculos
 * - Design System compliance
 * - Dark mode support
 * - Responsive layout
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {Function} props.onSubmit - Callback ao adicionar item
 * @param {string} props.orderId - ID da comanda (obrigatório)
 * @param {string} props.defaultProfessionalId - ID do profissional padrão da comanda
 * @param {Array} props.services - Lista de serviços disponíveis
 * @param {Array} props.professionals - Lista de profissionais (para override)
 */
const OrderItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  defaultProfessionalId,
  services = [],
  professionals = [],
}) => {
  // Estado do formulário
  const [formData, setFormData] = useState({
    serviceId: '',
    quantity: 1,
    professionalId: defaultProfessionalId || '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Serviço selecionado
  const selectedService = services.find(s => s.id === formData.serviceId);

  // Reset form ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setFormData({
        serviceId: '',
        quantity: 1,
        professionalId: defaultProfessionalId || '',
      });
      setErrors({});
    }
  }, [isOpen, defaultProfessionalId]);

  // Cálculos em tempo real
  const calculateValues = () => {
    if (!selectedService) {
      return {
        unitPrice: 0,
        total: 0,
        commissionPercentage: 0,
        commissionValue: 0,
      };
    }

    const unitPrice = parseFloat(selectedService.price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const commissionPercentage =
      parseFloat(selectedService.commissionPercentage) || 0;

    const total = unitPrice * quantity;
    const commissionValue = total * (commissionPercentage / 100);

    return {
      unitPrice,
      total,
      commissionPercentage,
      commissionValue,
    };
  };

  const calculations = calculateValues();

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
      const itemData = {
        orderId,
        serviceId: formData.serviceId,
        professionalId: formData.professionalId,
        quantity: parseInt(formData.quantity),
        unitPrice: calculations.unitPrice,
        commissionPercentage: calculations.commissionPercentage,
        commissionValue: calculations.commissionValue,
      };

      validateAddOrderItem(itemData);
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

  // Handler de submit
  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const itemData = {
        orderId,
        serviceId: formData.serviceId,
        professionalId: formData.professionalId,
        quantity: parseInt(formData.quantity),
        unitPrice: calculations.unitPrice,
        commissionPercentage: calculations.commissionPercentage,
        commissionValue: calculations.commissionValue,
        // Dados adicionais para exibição
        serviceName: selectedService.name,
        total: calculations.total,
      };

      await onSubmit(itemData);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      setErrors({ submit: error.message || 'Erro ao adicionar serviço' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-primary">
            <Plus className="w-5 h-5 inline mr-2" />
            Adicionar Serviço à Comanda
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Serviço */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              <Package className="w-4 h-4 inline mr-2" />
              Serviço *
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecione um serviço</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)} (
                  {service.durationMinutes}min)
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p className="text-red-500 text-xs mt-1">{errors.serviceId}</p>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              <Hash className="w-4 h-4 inline mr-2" />
              Quantidade *
            </label>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              disabled={isLoading}
              placeholder="Digite a quantidade"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Override de Profissional (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Profissional (Opcional)
            </label>
            <select
              name="professionalId"
              value={formData.professionalId}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-theme-border bg-white dark:bg-gray-800 text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Usar profissional padrão da comanda</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-theme-muted mt-1">
              💡 Deixe vazio para usar o profissional responsável pela comanda
            </p>
          </div>

          {/* Preview de Cálculos */}
          {selectedService && (
            <div className="card-theme bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-medium mb-2">
                <Calculator className="w-5 h-5" />
                <span>Cálculo do Item</span>
              </div>

              <div className="space-y-2 text-sm">
                {/* Preço Unitário */}
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    <DollarSign className="w-3 h-3 inline" /> Preço unitário:
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {formatCurrency(calculations.unitPrice)}
                  </span>
                </div>

                {/* Quantidade */}
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    <Hash className="w-3 h-3 inline" /> Quantidade:
                  </span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {formData.quantity}x
                  </span>
                </div>

                {/* Divisor */}
                <div className="border-t border-blue-300 dark:border-blue-700 my-2" />

                {/* Total */}
                <div className="flex justify-between text-base">
                  <span className="text-blue-800 dark:text-blue-200 font-semibold">
                    Total do item:
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(calculations.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Preview de Comissão */}
          {selectedService && (
            <div className="card-theme bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200 font-medium mb-2">
                <Percent className="w-5 h-5" />
                <span>Cálculo de Comissão</span>
              </div>

              <div className="space-y-2 text-sm">
                {/* Base de Cálculo */}
                <div className="flex justify-between">
                  <span className="text-purple-700 dark:text-purple-300">
                    Base de cálculo:
                  </span>
                  <span className="font-medium text-purple-900 dark:text-purple-100">
                    {formatCurrency(calculations.total)}
                  </span>
                </div>

                {/* Percentual */}
                <div className="flex justify-between">
                  <span className="text-purple-700 dark:text-purple-300">
                    Percentual:
                  </span>
                  <span className="font-medium text-purple-900 dark:text-purple-100">
                    {calculations.commissionPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* Divisor */}
                <div className="border-t border-purple-300 dark:border-purple-700 my-2" />

                {/* Comissão */}
                <div className="flex justify-between text-base">
                  <span className="text-purple-800 dark:text-purple-200 font-semibold">
                    Comissão do profissional:
                  </span>
                  <span className="font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency(calculations.commissionValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>

            <div className="flex-1" />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !formData.serviceId}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isLoading ? 'Adicionando...' : 'Adicionar Serviço'}
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-theme-muted">
              💡 <strong>Dica:</strong> A comissão é calculada automaticamente
              com base no percentual definido no cadastro do serviço. O
              profissional pode ser sobrescrito para casos onde outro barbeiro
              executa o serviço.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderItemModal;
