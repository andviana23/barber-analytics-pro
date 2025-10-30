import React, { useState, useEffect } from 'react';
import {
  User,
  Briefcase,
  Plus,
  Save,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import Modal from '../../../atoms/Modal/Modal';
import { Button } from '../../../atoms/Button/Button';
import { Alert } from '../../../atoms/Alert/Alert';
import OrderItemsTable from '../../organisms/OrderItemsTable';
import { validateCreateOrder } from '../../../dtos/OrderDTO';
import { formatCurrency } from '../../../utils/formatters';

/**
 * OrderModal - Modal para criar/editar comandas
 *
 * 🎯 DESIGN SYSTEM COMPLIANCE 100%
 * - Utiliza Modal base component (atoms)
 * - Tokens de cores do Design System
 * - Utility classes (.input-theme, .btn-theme-*, .card-theme)
 * - Responsividade completa (mobile-first)
 * - Estados interativos (hover, focus, disabled)
 * - Acessibilidade (ARIA labels, focus management)
 * - Dark mode nativo
 *
 * ✨ Features:
 * - Seleção de cliente e profissional
 * - Filtragem de profissionais por unidade (navbar context)
 * - Lista dinâmica de serviços (OrderItemsTable)
 * - Cálculo automático de totais e comissões
 * - Validação com Zod DTO
 * - 3 ações: Cancelar / Salvar Rascunho / Fechar Comanda
 * - Feedback visual com Alert component
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla visibilidade do modal
 * @param {Function} props.onClose - Callback ao fechar modal
 * @param {Function} props.onSubmit - Callback ao salvar (recebe: { action, data })
 * @param {Function} props.onAddItem - Callback ao clicar "Adicionar Serviço"
 * @param {Object} props.order - Dados da comanda (modo edição)
 * @param {Array} props.clients - Lista de clientes disponíveis
 * @param {Array} props.professionals - Lista de profissionais (já filtrados por unidade)
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
  unitId = '',
  paymentMethods = [],
  bankAccounts = [],
}) => {
  const isEditMode = !!order;

  // Estado do formulário
  const [formData, setFormData] = useState({
    unitId: unitId || '',
    clientId: '',
    professionalId: '',
    cashRegisterId: '',
    paymentMethodId: '',
    accountId: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Preenche form se estiver editando
  useEffect(() => {
    if (isEditMode && order) {
      setFormData({
        unitId: order.unitId || order.unit_id || unitId || '',
        clientId: order.clientId || order.client_id || '',
        professionalId: order.professionalId || order.professional_id || '',
        cashRegisterId: order.cashRegisterId || order.cash_register_id || '',
        paymentMethodId: order.paymentMethodId || order.payment_method_id || '',
        accountId: order.accountId || order.account_id || '',
      });
    } else {
      setFormData({
        unitId: unitId || '',
        clientId: '',
        professionalId: '',
        cashRegisterId: '',
        paymentMethodId: '',
        accountId: '',
      });
    }
    setErrors({});
    setPendingAction(null);
  }, [isEditMode, order, isOpen, unitId]);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(prev => ({ ...prev, unitId: unitId || '' }));
    }
  }, [unitId, isEditMode]);

  // Calcula totais dos itens
  const calculateTotals = () => {
    console.log('💰 calculateTotals - Items recebidos:', items);

    const subtotal = items.reduce((sum, item) => {
      // Calcula o total do item: unit_price * quantity
      const itemTotal =
        (item.unit_price || item.unitPrice || 0) * (item.quantity || 1);
      console.log(
        `  Item: ${item.service?.name || 'sem nome'}, unitPrice: ${item.unit_price || item.unitPrice}, qty: ${item.quantity}, total: ${itemTotal}`
      );
      return sum + itemTotal;
    }, 0);

    const totalCommission = items.reduce(
      (sum, item) => sum + (item.commissionValue || item.commission_value || 0),
      0
    );

    const totalItems = items.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    console.log('💰 Totais calculados:', {
      subtotal,
      totalCommission,
      totalItems,
    });

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
    console.log('🔍 validateForm - Iniciando validação');
    console.log('📋 formData atual:', formData);

    if (!formData.unitId) {
      console.error('❌ unitId não encontrado');
      setErrors(prev => ({
        ...prev,
        unitId:
          'Unidade não encontrada. Atualize a página ou selecione novamente.',
      }));
      return false;
    }

    console.log('✅ unitId válido:', formData.unitId);

    const dataToValidate = {
      unitId: formData.unitId,
      clientId: formData.clientId,
      professionalId: formData.professionalId,
      cashRegisterId: formData.cashRegisterId || undefined,
    };

    console.log('📦 Dados para validar:', dataToValidate);

    const validation = validateCreateOrder(dataToValidate);

    console.log('📊 Resultado da validação:', validation);

    if (!validation.success) {
      console.error('❌ Validação falhou:', validation.error);
      setErrors({ general: validation.error });
      return false;
    }

    console.log('✅ Validação passou:', validation.data);
    setErrors({});
    return true;
  };

  // Handler de submit com diferentes ações
  const handleSubmit = async action => {
    console.log('🚀 handleSubmit chamado com action:', action);
    console.log('📋 formData:', formData);
    console.log('📦 items:', items);

    if (!validateForm()) {
      console.error('❌ Validação de formulário falhou');
      return;
    }

    if (items.length === 0 && action !== 'save_draft') {
      console.error('❌ Nenhum item na comanda');
      setErrors({ items: 'Adicione pelo menos um serviço à comanda' });
      return;
    }

    if (action === 'close' && !formData.paymentMethodId) {
      console.error('❌ Forma de pagamento não selecionada');
      setErrors(prev => ({
        ...prev,
        paymentMethodId:
          'Selecione a forma de pagamento para finalizar a comanda',
      }));
      return;
    }

    setPendingAction(action);
    setIsLoading(true);

    try {
      const sanitizedData = {
        unitId: formData.unitId,
        clientId: formData.clientId,
        professionalId: formData.professionalId,
        cashRegisterId: formData.cashRegisterId || undefined,
        paymentMethodId: formData.paymentMethodId || null,
        accountId: formData.accountId || null,
        items,
        totalAmount: totals.subtotal,
      };

      console.log('✅ Dados sanitizados:', sanitizedData);
      console.log('📤 Chamando onSubmit com:', { action, data: sanitizedData });

      await onSubmit({
        action, // 'save_draft', 'close', 'cancel'
        data: sanitizedData,
      });

      console.log('✅ onSubmit executado com sucesso');
      onClose();
    } catch (error) {
      console.error('❌ Erro ao processar comanda:', error);
      setErrors({ submit: error.message || 'Erro ao processar comanda' });
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Comanda' : 'Nova Comanda'}
      maxWidth="4xl"
    >
      {/* Form Content */}
      <div className="space-y-6">
        {/* Cliente e Profissional - Grid Responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cliente */}
          <div>
            <label
              htmlFor="clientId"
              className="block text-sm font-medium text-theme-primary mb-2"
            >
              <User className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Cliente *
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              disabled={isLoading}
              className="input-theme"
              aria-required="true"
              aria-invalid={!!errors.clientId}
              aria-describedby={errors.clientId ? 'clientId-error' : undefined}
            >
              <option value="">Selecione um cliente</option>
              {(() => {
                console.log('🔍 OrderModal - Renderizando clientes:', {
                  totalClients: clients?.length || 0,
                  clients: clients,
                  isLoading,
                  isArray: Array.isArray(clients),
                });

                if (!Array.isArray(clients)) {
                  console.error('❌ clients não é um array!', clients);
                  return null;
                }

                return clients.map((client, index) => {
                  console.log(`  Cliente ${index}:`, client);
                  return (
                    <option key={client.id} value={client.id}>
                      {client.name || client.nome || 'Sem nome'}{' '}
                      {client.document && `(${client.document})`}
                    </option>
                  );
                });
              })()}
            </select>
            {errors.clientId && (
              <p
                id="clientId-error"
                className="text-xs text-feedback-error-light dark:text-feedback-error-dark mt-1.5"
                role="alert"
              >
                {errors.clientId}
              </p>
            )}
          </div>

          {/* Profissional */}
          <div>
            <label
              htmlFor="professionalId"
              className="block text-sm font-medium text-theme-primary mb-2"
            >
              <Briefcase className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Profissional Responsável *
            </label>
            <select
              id="professionalId"
              name="professionalId"
              value={formData.professionalId}
              onChange={handleChange}
              disabled={isLoading}
              className="input-theme"
              aria-required="true"
              aria-invalid={!!errors.professionalId}
              aria-describedby={
                errors.professionalId ? 'professionalId-error' : undefined
              }
            >
              <option value="">Selecione um profissional</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
            {errors.professionalId && (
              <p
                id="professionalId-error"
                className="text-xs text-feedback-error-light dark:text-feedback-error-dark mt-1.5"
                role="alert"
              >
                {errors.professionalId}
              </p>
            )}
          </div>
        </div>

        {/* Seção Serviços */}
        <div className="pt-4 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-primary">
              Serviços da Comanda
            </h3>
            <Button
              type="button"
              variant="secondary"
              icon={Plus}
              onClick={() => {
                if (!onAddItem) return;
                onAddItem(order?.id, formData.professionalId);
              }}
              disabled={isLoading || !formData.professionalId}
              className="shrink-0"
              aria-label="Adicionar serviço à comanda"
            >
              Adicionar Serviço
            </Button>
          </div>

          {/* Alert: Selecione profissional */}
          {!formData.professionalId && (
            <Alert
              type="info"
              icon={Info}
              message="Selecione um profissional para adicionar serviços"
            />
          )}

          {/* Alert: Erro de validação de itens */}
          {errors.items && (
            <Alert type="error" icon={AlertTriangle} message={errors.items} />
          )}

          {/* Tabela de Itens */}
          {items.length > 0 && (
            <div className="mt-4">
              <OrderItemsTable
                items={items}
                onRemoveItem={onRemoveItem}
                readOnly={isLoading}
                showCommission={false}
              />
            </div>
          )}
        </div>

        {/* Card de Totais - Design System Compliant */}
        <div className="card-theme rounded-lg p-6 space-y-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          {/* Total de Itens */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-theme-secondary">Total de Itens:</span>
            <span className="font-semibold text-theme-primary tabular-nums">
              {totals.totalItems}
            </span>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-theme-secondary">Subtotal:</span>
            <span className="font-semibold text-theme-primary tabular-nums">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          {/* Divisor */}
          <div className="border-t border-light-border dark:border-dark-border my-3" />

          {/* Total da Comanda - Destaque */}
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-theme-primary">
              Total da Comanda:
            </span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
        </div>

        {/* Detalhes de Pagamento */}
        <div className="card-theme rounded-lg p-6 space-y-4 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold text-theme-primary">
              Detalhes de Pagamento
            </h3>
            <span className="text-xs text-theme-secondary">
              Obrigatório apenas ao fechar a comanda
            </span>
          </div>

          {paymentMethods.length === 0 ? (
            <Alert
              type="warning"
              icon={AlertTriangle}
              message="Nenhuma forma de pagamento ativa encontrada para esta unidade. Cadastre uma forma de pagamento no módulo Financeiro para habilitar o fechamento da comanda."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="paymentMethodId"
                  className="block text-sm font-medium text-theme-primary mb-2"
                >
                  Forma de Pagamento *
                </label>
                <select
                  id="paymentMethodId"
                  name="paymentMethodId"
                  value={formData.paymentMethodId}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="input-theme"
                  aria-required="true"
                  aria-invalid={!!errors.paymentMethodId}
                  aria-describedby={
                    errors.paymentMethodId ? 'paymentMethodId-error' : undefined
                  }
                >
                  <option value="">Selecione a forma de pagamento</option>
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                {errors.paymentMethodId && (
                  <p
                    id="paymentMethodId-error"
                    className="text-xs text-feedback-error-light dark:text-feedback-error-dark mt-1.5"
                    role="alert"
                  >
                    {errors.paymentMethodId}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="accountId"
                  className="block text-sm font-medium text-theme-primary mb-2"
                >
                  Conta de Destino (opcional)
                </label>
                <select
                  id="accountId"
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="input-theme"
                >
                  <option value="">Selecionar conta</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.nickname || account.name || account.bank}{' '}
                      {account.bank && account.name ? `- ${account.bank}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-theme-secondary mt-1.5">
                  Direcione a receita para uma conta específica, se necessário.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Alert: Erro de submit */}
        {errors.submit && (
          <Alert type="error" icon={AlertCircle} message={errors.submit} />
        )}

        {/* Alert: Erro de validação geral */}
        {errors.general && (
          <Alert type="error" icon={AlertCircle} message={errors.general} />
        )}

        {/* Info sobre fechar comanda */}
        {items.length > 0 && (
          <Alert
            type="success"
            icon={CheckCircle}
            title="Fechar Comanda"
            message="Gera receita automaticamente e calcula comissões dos profissionais."
          />
        )}

        {/* Ações - Footer Responsivo */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-light-border dark:border-dark-border">
          {/* Cancelar */}
          <Button
            type="button"
            variant="secondary"
            icon={XCircle}
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto order-1 sm:order-1"
            aria-label="Cancelar e fechar modal"
          >
            Cancelar
          </Button>

          {/* Spacer para desktop */}
          <div className="hidden sm:block sm:flex-1" />

          {/* Salvar Rascunho */}
          <Button
            type="button"
            variant="secondary"
            icon={Save}
            onClick={() => handleSubmit('save_draft')}
            disabled={isLoading}
            loading={isLoading && pendingAction === 'save_draft'}
            className="w-full sm:w-auto order-2 sm:order-2"
            aria-label="Salvar comanda como rascunho"
          >
            {isLoading && pendingAction === 'save_draft'
              ? 'Salvando...'
              : 'Salvar Rascunho'}
          </Button>

          {/* Fechar Comanda */}
          <Button
            type="button"
            variant="primary"
            icon={CheckCircle}
            onClick={() => handleSubmit('close')}
            disabled={
              isLoading || items.length === 0 || paymentMethods.length === 0
            }
            loading={isLoading && pendingAction === 'close'}
            className="w-full sm:w-auto order-3 sm:order-3"
            aria-label="Fechar comanda e gerar receita"
          >
            {isLoading && pendingAction === 'close'
              ? 'Processando...'
              : 'Fechar Comanda'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderModal;
