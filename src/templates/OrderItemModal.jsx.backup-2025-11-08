import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from '../atoms/Modal';
import { ServiceSelector, ProfessionalSelector } from '../molecules';
import { formatCurrency } from '../utils/formatters';

/**
 * OrderItemModal - Modal para adicionar serviço à comanda
 *
 * Template modal que permite selecionar serviço, profissional e quantidade
 * para adicionar à comanda.
 *
 * @component
 * @example
 * ```jsx
 * <OrderItemModal
 *   isOpen={showModal}
 *   onClose={handleClose}
 *   onConfirm={handleAddService}
 *   services={availableServices}
 *   professionals={activeProfessionals}
 * />
 * ```
 */
const OrderItemModal = ({
  isOpen,
  onClose,
  onConfirm,
  services = [],
  professionals = [],
  loading = false,
  servicesLoading = false,
  professionalsLoading = false,
}) => {
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});
  const handleReset = () => {
    setSelectedService(null);
    setSelectedProfessional(null);
    setQuantity(1);
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
    if (!selectedService) {
      newErrors.service = 'Selecione um serviço';
    }
    if (!selectedProfessional) {
      newErrors.professional = 'Selecione um profissional';
    }
    if (quantity < 1 || quantity > 99) {
      newErrors.quantity = 'Quantidade deve estar entre 1 e 99';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = e => {
    e.preventDefault();
    if (!validate()) return;
    const service = services.find(s => s.id === selectedService);
    const professional = professionals.find(p => p.id === selectedProfessional);
    if (onConfirm && service && professional) {
      onConfirm({
        service_id: service.id,
        service_name: service.name,
        professional_id: professional.id,
        professional_name: professional.name,
        price: service.price,
        quantity,
        commission_percentage: service.commission_percentage,
        duration_minutes: service.duration_minutes,
      });
      handleReset();
    }
  };
  const calculateItemTotal = () => {
    if (!selectedService) return 0;
    const service = services.find(s => s.id === selectedService);
    return service ? service.price * quantity : 0;
  };
  const calculateCommission = () => {
    if (!selectedService) return 0;
    const service = services.find(s => s.id === selectedService);
    return service
      ? (service.price * quantity * service.commission_percentage) / 100
      : 0;
  };
  const itemTotal = calculateItemTotal();
  const commission = calculateCommission();
  const selectedServiceData = services.find(s => s.id === selectedService);
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adicionar Serviço"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Serviço */}
        <div>
          <ServiceSelector
            services={services}
            onSelect={service => setSelectedService(service.id)}
            value={selectedService}
            loading={servicesLoading}
            error={errors.service}
            label="Serviço"
            required
            showInactive={false}
          />
        </div>

        {/* Seletor de Profissional */}
        <div>
          <ProfessionalSelector
            professionals={professionals}
            onSelect={professional => setSelectedProfessional(professional.id)}
            value={selectedProfessional}
            loading={professionalsLoading}
            error={errors.professional}
            label="Profissional"
            required
            filterByRole="barbeiro"
            showRole={false}
          />
        </div>

        {/* Quantidade */}
        <div>
          <label className="text-theme-primary mb-2 block text-sm font-medium">
            Quantidade
            <span className="ml-1 text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={loading || quantity <= 1}
              className="card-theme text-theme-primary flex h-10 w-10 items-center justify-center rounded-lg border border-light-border transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
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
                  d="M20 12H4"
                />
              </svg>
            </button>

            <input
              type="number"
              value={quantity}
              onChange={e =>
                setQuantity(
                  Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
                )
              }
              disabled={loading}
              min={1}
              max={99}
              className={`text-theme-primary flex-1 rounded-lg border bg-white px-4 py-2.5 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-dark-surface ${errors.quantity ? 'border-red-500 focus:border-red-500 dark:border-red-400' : 'border-light-border focus:border-primary dark:border-dark-border'}`}
            />

            <button
              type="button"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              disabled={loading || quantity >= 99}
              className="card-theme text-theme-primary flex h-10 w-10 items-center justify-center rounded-lg border border-light-border transition-colors hover:bg-light-surface disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:hover:bg-dark-hover"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Preview do Item */}
        {selectedServiceData && selectedProfessional && (
          <div className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-dark-border dark:bg-dark-hover">
            <h4 className="text-theme-primary mb-4 font-semibold">
              Resumo do Item
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm">Serviço:</span>
                <span className="text-theme-primary font-medium">
                  {selectedServiceData.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm">
                  Preço Unitário:
                </span>
                <span className="text-theme-primary font-medium">
                  {formatCurrency(selectedServiceData.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm">
                  Quantidade:
                </span>
                <span className="text-theme-primary font-medium">
                  {quantity}x
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-theme-secondary text-sm">
                  Comissão ({selectedServiceData.commission_percentage}%):
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(commission)}
                </span>
              </div>
              <div className="border-t border-light-border pt-3 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <span className="text-theme-primary font-semibold">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(itemTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerta quando nenhum serviço/profissional disponível */}
        {!servicesLoading && services.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
                  Nenhum serviço disponível
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Cadastre serviços antes de adicionar à comanda.
                </p>
              </div>
            </div>
          </div>
        )}

        {!professionalsLoading && professionals.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h4 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
                  Nenhum profissional disponível
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Cadastre profissionais antes de adicionar serviços.
                </p>
              </div>
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
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !selectedService || !selectedProfessional}
            className="hover:bg-primary-dark text-dark-text-primary inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                Adicionando...
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Adicionar à Comanda
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
OrderItemModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback ao fechar */
  onClose: PropTypes.func.isRequired,
  /** Callback ao confirmar adição */
  onConfirm: PropTypes.func.isRequired,
  /** Lista de serviços disponíveis */
  services: PropTypes.array,
  /** Lista de profissionais disponíveis */
  professionals: PropTypes.array,
  /** Estado de carregamento geral */
  loading: PropTypes.bool,
  /** Estado de carregamento de serviços */
  servicesLoading: PropTypes.bool,
  /** Estado de carregamento de profissionais */
  professionalsLoading: PropTypes.bool,
};
export default OrderItemModal;
