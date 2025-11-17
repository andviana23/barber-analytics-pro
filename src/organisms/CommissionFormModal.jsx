import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';
import {
  useCreateCommission,
  useUpdateCommission,
} from '../hooks/useCommissions';
import { ProfissionaisService } from '../services/profissionaisService';
import orderRepository from '../repositories/orderRepository';

/**
 * Modal de Formulário de Comissão
 *
 * Design System Compliant:
 * - Tokens de cor do Design System
 * - Classes temáticas (.card-theme, .text-theme-*)
 * - Grid system responsivo
 * - Tipografia consistente
 * - Acessibilidade (ARIA, foco visível)
 */
const CommissionFormModal = ({
  isOpen,
  onClose,
  commission,
  unitId,
  onSuccess,
}) => {
  const isEditMode = !!commission;
  const { showToast } = useToast();
  const { mutate: createCommission, isLoading: isCreating } =
    useCreateCommission();
  const { mutate: updateCommission, isLoading: isUpdating } =
    useUpdateCommission();

  const [formData, setFormData] = useState({
    professional_id: '',
    amount: '',
    reference_date: format(new Date(), 'yyyy-MM-dd'),
    order_id: '',
    description: '',
    notes: '',
    status: 'PENDING',
  });

  const [professionals, setProfessionals] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);

  const isLoading = isCreating || isUpdating || loadingData;

  // Carregar dados relacionados
  useEffect(() => {
    if (isOpen && unitId) {
      loadRelatedData();
      if (commission) {
        populateForm();
      }
    }
  }, [isOpen, unitId, commission]);

  const loadRelatedData = async () => {
    setLoadingData(true);
    try {
      // Carregar profissionais
      const profs = await ProfissionaisService.getProfissionais({
        unitId,
        isActive: true,
      });
      setProfessionals(profs || []);

      // Carregar comandas recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const ordersResult = await orderRepository.listOrders(unitId, {
        startDate: thirtyDaysAgo.toISOString(),
        status: 'CLOSED',
        limit: 100,
      });
      setOrders(ordersResult.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast({
        type: 'error',
        message: 'Erro ao carregar dados',
        description: error.message,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const populateForm = () => {
    if (commission) {
      setFormData({
        professional_id: commission.professional_id || '',
        amount: commission.amount || '',
        reference_date:
          commission.reference_date || format(new Date(), 'yyyy-MM-dd'),
        order_id: commission.order_id || '',
        description: commission.description || '',
        notes: commission.notes || '',
        status: commission.status || 'PENDING',
      });
      setShowOrderSelector(!!commission.order_id);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Validação básica
    if (!formData.professional_id) {
      showToast({
        type: 'error',
        message: 'Profissional é obrigatório',
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast({
        type: 'error',
        message: 'Valor deve ser maior que zero',
      });
      return;
    }

    if (!formData.reference_date) {
      showToast({
        type: 'error',
        message: 'Data de referência é obrigatória',
      });
      return;
    }

    const commissionData = {
      unit_id: unitId,
      professional_id: formData.professional_id,
      amount: parseFloat(formData.amount),
      reference_date: formData.reference_date,
      order_id: formData.order_id || null,
      description: formData.description || null,
      notes: formData.notes || null,
      status: formData.status,
    };

    if (isEditMode) {
      updateCommission(
        { id: commission.id, ...commissionData },
        {
          onSuccess: () => {
            onSuccess?.();
            handleClose();
          },
        }
      );
    } else {
      createCommission(commissionData, {
        onSuccess: () => {
          onSuccess?.();
          handleClose();
        },
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        professional_id: '',
        amount: '',
        reference_date: format(new Date(), 'yyyy-MM-dd'),
        order_id: '',
        description: '',
        notes: '',
        status: 'PENDING',
      });
      setShowOrderSelector(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="commission-form-title"
    >
      <div
        className="card-theme flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-light-border bg-primary/10 px-6 py-5 dark:border-dark-border dark:bg-primary/20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="commission-form-title"
                className="text-theme-primary mb-1 text-xl font-semibold"
              >
                {isEditMode ? 'Editar Comissão' : 'Nova Comissão'}
              </h2>
              <p className="text-theme-secondary text-sm">
                {isEditMode
                  ? 'Atualize as informações da comissão'
                  : 'Cadastre uma nova comissão manualmente'}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-light-surface focus:outline-none focus:ring-2 focus:ring-primary/50 dark:hover:bg-dark-surface"
              aria-label="Fechar modal"
            >
              <X className="text-theme-secondary h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="space-y-6">
            {/* Profissional */}
            <div>
              <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                Profissional <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.professional_id}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    professional_id: e.target.value,
                  }))
                }
                required
                disabled={isLoading}
                className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                  Valor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, amount: e.target.value }))
                    }
                    required
                    disabled={isLoading}
                    placeholder="0,00"
                    className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface py-3 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
                  />
                </div>
              </div>

              <div>
                <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                  Data de Referência <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="text-theme-secondary absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.reference_date}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        reference_date: e.target.value,
                      }))
                    }
                    required
                    disabled={isLoading}
                    className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface py-3 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
                  />
                </div>
              </div>
            </div>

            {/* Vincular a Comanda (Opcional) */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="link-order"
                  checked={showOrderSelector}
                  onChange={e => {
                    setShowOrderSelector(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, order_id: '' }));
                    }
                  }}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-light-border text-primary focus:ring-2 focus:ring-primary/50 dark:border-dark-border"
                />
                <label
                  htmlFor="link-order"
                  className="text-theme-primary cursor-pointer text-sm font-medium"
                >
                  Vincular a uma comanda (opcional)
                </label>
              </div>

              {showOrderSelector && (
                <select
                  value={formData.order_id}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, order_id: e.target.value }))
                  }
                  disabled={isLoading}
                  className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
                >
                  <option value="">Selecione uma comanda</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      Comanda #{order.id.slice(0, 8)} -{' '}
                      {order.professional?.name || 'N/A'} -{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(order.total_amount || 0)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                Descrição
              </label>
              <div className="relative">
                <FileText className="text-theme-secondary absolute left-3 top-3 h-5 w-5" />
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                  rows={3}
                  maxLength={500}
                  placeholder="Descrição da comissão..."
                  className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface py-3 pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                disabled={isLoading}
                rows={3}
                maxLength={1000}
                placeholder="Observações adicionais..."
                className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
              />
            </div>

            {/* Status (apenas em edição) */}
            {isEditMode && (
              <div>
                <label className="text-theme-primary mb-1.5 block text-xs font-medium">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, status: e.target.value }))
                  }
                  disabled={isLoading}
                  className="text-theme-primary w-full rounded-lg border-2 border-light-border bg-light-surface px-4 py-3 text-sm font-medium transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Paga</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-light-border pt-6 dark:border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="text-theme-primary rounded-lg border-2 border-light-border bg-light-surface px-6 py-2.5 text-sm font-semibold transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="text-dark-text-primary flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-2.5 text-sm font-semibold shadow-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditMode ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditMode ? 'Salvar Alterações' : 'Criar Comissão'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommissionFormModal;

