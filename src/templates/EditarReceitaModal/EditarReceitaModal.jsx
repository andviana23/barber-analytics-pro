/**
 * ✏️ Editar Receita Modal - 100% DESIGN SYSTEM
 *
 * Modal profissional para editar receitas existentes no regime de competência.
 * Segue todos os padrões do Design System com gradientes, hover effects e validação completa.
 *
 * Features:
 * - ✅ Design System completo aplicado
 * - ✅ Pré-preenchimento automático dos dados
 * - ✅ Validação em tempo real
 * - ✅ Cálculo automático de data de recebimento
 * - ✅ UI ultra moderna com gradientes
 * - ✅ Dark mode completo
 * - ✅ Feedback visual em todos os estados
 *
 * @author Barber Analytics Pro
 * @date 2025-10-22
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  AlertCircle,
  CreditCard,
  Landmark,
  Edit2,
  Loader2,
} from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import unitsService from '../../services/unitsService';
import bankAccountsService from '../../services/bankAccountsService';
import { getPaymentMethods } from '../../services/paymentMethodsService';
import { addCalendarDaysAndAdjustToBusinessDay } from '../../utils/businessDays';
import financeiroService from '../../services/financeiroService';
import { useToast } from '../../context/ToastContext';
export const EditarReceitaModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  receita,
}) => {
  const { showSuccess, showError } = useToast();

  // Estados do formulário pré-preenchidos
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    data_pagamento: '',
    prev_recebimento: '',
    unit_id: '',
    payment_method_id: '',
    account_id: '',
    observacoes: '',
  });
  const [units, setUnits] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Pré-preencher formulário quando receita mudar
  useEffect(() => {
    if (receita && isOpen) {
      setFormData({
        titulo: receita.description || '',
        valor: receita.value?.toString() || '',
        data_pagamento: receita.date || '',
        prev_recebimento: receita.expected_receipt_date || '',
        unit_id: receita.unit_id || '',
        payment_method_id: receita.payment_method_id || '',
        account_id: receita.account_id || '',
        observacoes: receita.notes || '',
      });
    }
  }, [receita, isOpen]);

  // Carregar unidades
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const { data, error } = await unitsService.getUnits();
        if (error) {
          throw error;
        }
        if (data && Array.isArray(data)) {
          setUnits(data);
        }
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnits([]);
      }
    };
    if (isOpen) {
      fetchUnits();
    }
  }, [isOpen]);

  // Carregar formas de pagamento e contas bancárias
  useEffect(() => {
    const fetchData = async () => {
      if (!formData.unit_id) {
        setPaymentMethods([]);
        setBankAccounts([]);
        return;
      }
      try {
        // Buscar formas de pagamento
        const { data: methodsData, error: methodsError } =
          await getPaymentMethods(formData.unit_id);
        if (!methodsError && methodsData) {
          const activeMethods = methodsData.filter(method => method.is_active);
          setPaymentMethods(activeMethods);

          // Definir forma de pagamento selecionada
          const selectedMethod = activeMethods.find(
            m => m.id === formData.payment_method_id
          );
          setSelectedPaymentMethod(selectedMethod || null);
        }

        // Buscar contas bancárias
        const accounts = await bankAccountsService.getBankAccounts(
          formData.unit_id
        );
        setBankAccounts(accounts || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setPaymentMethods([]);
        setBankAccounts([]);
      }
    };
    fetchData();
  }, [formData.unit_id]);

  // Recalcular data de recebimento quando necessário
  useEffect(() => {
    if (
      formData.payment_method_id &&
      formData.data_pagamento &&
      paymentMethods.length > 0
    ) {
      const method = paymentMethods.find(
        m => m.id === formData.payment_method_id
      );
      if (method) {
        setSelectedPaymentMethod(method);
        const receiptDate = addCalendarDaysAndAdjustToBusinessDay(
          new Date(formData.data_pagamento + 'T00:00:00'),
          method.receipt_days
        );
        setFormData(prev => ({
          ...prev,
          prev_recebimento: receiptDate.toISOString().split('T')[0],
        }));
      }
    }
  }, [formData.payment_method_id, formData.data_pagamento, paymentMethods]);

  // Manipular mudança de campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {
          ...prev,
        };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validação
  const validateForm = () => {
    const newErrors = {};
    if (!formData.titulo?.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data de pagamento é obrigatória';
    }
    if (!formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória';
    }
    if (!formData.payment_method_id) {
      newErrors.payment_method_id = 'Forma de pagamento é obrigatória';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) {
      showError({
        message: 'Formulário inválido',
        description: 'Verifique os campos obrigatórios',
      });
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        description: formData.titulo,
        value: parseFloat(formData.valor),
        date: formData.data_pagamento,
        expected_receipt_date: formData.prev_recebimento,
        unit_id: formData.unit_id,
        payment_method_id: formData.payment_method_id,
        account_id: formData.account_id || null,
        notes: formData.observacoes || null,
      };
      await financeiroService.updateRevenue(receita.id, updateData);
      showSuccess({
        message: 'Receita atualizada',
        description: 'A receita foi atualizada com sucesso!',
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar receita:', error);
      showError({
        message: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar a receita',
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatar valor para exibição
  const formatCurrency = value => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-theme rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 📝 Header com Gradiente */}
        <div className="sticky top-0 bg-gradient-success p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 card-theme/20 rounded-xl">
                <Edit2 className="w-6 h-6 text-dark-text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-text-primary">
                  Editar Receita
                </h2>
                <p className="text-green-50 text-sm mt-1">
                  Atualize as informações da receita
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:card-theme/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6 text-dark-text-primary" />
            </button>
          </div>
        </div>

        {/* 📋 Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" />
              Título *
            </label>
            <Input
              type="text"
              value={formData.titulo}
              onChange={e => handleInputChange('titulo', e.target.value)}
              placeholder="Ex: Serviço de corte de cabelo"
              className={`w-full ${errors.titulo ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.titulo && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.titulo}
              </p>
            )}
          </div>

          {/* Valor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4" />
              Valor *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary font-semibold">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={e => handleInputChange('valor', e.target.value)}
                placeholder="0,00"
                className={`w-full pl-12 ${errors.valor ? 'border-red-500' : ''}`}
                disabled={loading}
              />
            </div>
            {errors.valor && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.valor}
              </p>
            )}
          </div>

          {/* Data de Pagamento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              Data de Pagamento *
            </label>
            <Input
              type="date"
              value={formData.data_pagamento}
              onChange={e =>
                handleInputChange('data_pagamento', e.target.value)
              }
              className={`w-full ${errors.data_pagamento ? 'border-red-500' : ''}`}
              disabled={loading}
            />
            {errors.data_pagamento && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.data_pagamento}
              </p>
            )}
            <p className="text-xs text-theme-secondary mt-1">
              Esta data será usada como data de competência no sistema
            </p>
          </div>

          {/* Unidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4" />
              Unidade *
            </label>
            <select
              value={formData.unit_id}
              onChange={e => handleInputChange('unit_id', e.target.value)}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 ${errors.unit_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl text-theme-primary font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer`}
              disabled={loading}
            >
              <option value="">Selecione uma unidade</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            {errors.unit_id && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.unit_id}
              </p>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <CreditCard className="w-4 h-4" />
              Forma de Pagamento *
            </label>
            <select
              value={formData.payment_method_id}
              onChange={e =>
                handleInputChange('payment_method_id', e.target.value)
              }
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 ${errors.payment_method_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl text-theme-primary font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer`}
              disabled={!formData.unit_id || loading}
            >
              <option value="">
                {formData.unit_id
                  ? 'Selecione uma forma de pagamento'
                  : 'Selecione uma unidade primeiro'}
              </option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name} ({method.receipt_days} dias)
                </option>
              ))}
            </select>
            {errors.payment_method_id && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.payment_method_id}
              </p>
            )}
            {selectedPaymentMethod && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                ⏱️ Prazo de recebimento: {selectedPaymentMethod.receipt_days}{' '}
                dias corridos
              </p>
            )}
          </div>

          {/* Previsão de Recebimento (calculado automaticamente) */}
          {formData.prev_recebimento && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  Previsão de Recebimento
                </span>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {new Date(
                  formData.prev_recebimento + 'T00:00:00'
                ).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Calculado automaticamente com base na forma de pagamento
              </p>
            </div>
          )}

          {/* Conta Bancária (Opcional) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <Landmark className="w-4 h-4" />
              Conta Bancária (Opcional)
            </label>
            <select
              value={formData.account_id || ''}
              onChange={e => handleInputChange('account_id', e.target.value)}
              className="w-full px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-theme-primary font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
              disabled={!formData.unit_id || loading}
            >
              <option value="">Sem conta bancária</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.bank_name} - {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-theme-secondary uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" />
              Observações (Opcional)
            </label>
            <textarea
              value={formData.observacoes}
              onChange={e => handleInputChange('observacoes', e.target.value)}
              placeholder="Adicione observações sobre esta receita..."
              rows={3}
              className="w-full px-4 py-3 card-theme dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-xl text-theme-primary font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              disabled={loading}
            />
          </div>

          {/* 🎯 Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t-2 border-light-border dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 card-theme dark:bg-gray-700 text-theme-primary font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border-2 border-transparent hover:border-light-border dark:border-dark-border dark:hover:border-gray-500 dark:border-gray-400"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r bg-gradient-success text-dark-text-primary font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
EditarReceitaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  receita: PropTypes.object.isRequired,
};
