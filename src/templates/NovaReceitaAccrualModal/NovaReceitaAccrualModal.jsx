/**
 * 💰 NovaReceitaAccrualModal.jsx
 *
 * Modal profissional para criar receitas com regime de competência
 * ✅ 100% Design System (gradientes, validação, feedback)
 * ✅ Cálculo automático de data de recebimento
 * ✅ Seletor de categorias hierárquico
 * ✅ Validação em tempo real
 *
 * @author Barber Analytics Pro - Andrey Viana
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
  Loader2,
  Tag,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import { useToast } from '../../context/ToastContext';
import unitsService from '../../services/unitsService';
import bankAccountsService from '../../services/bankAccountsService';
import { getPaymentMethods } from '../../services/paymentMethodsService';
import { addCalendarDaysAndAdjustToBusinessDay } from '../../utils/businessDays';
import { supabase } from '../../services/supabase';

const NovaReceitaAccrualModal = ({ isOpen = false, onClose, onSubmit }) => {
  // 🎨 Toast para feedback
  const { showSuccess, showError } = useToast();

  // 📋 Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    data_pagamento: new Date().toISOString().split('T')[0],
    prev_recebimento: '',
    unit_id: '',
    payment_method_id: '',
    account_id: '',
    category_id: '',
    observacoes: '',
  });

  // 📊 Dados auxiliares
  const [units, setUnits] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // 🎯 Estados de UI
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 🔄 Carregar dados iniciais ao abrir modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      // Reset form ao fechar
      resetForm();
    }
  }, [isOpen]);

  // 📥 Função para carregar todos os dados iniciais
  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      // Carregar unidades
      const unitsData = await unitsService.getUnits();
      if (unitsData && Array.isArray(unitsData)) {
        setUnits(unitsData.filter(u => u.is_active));
      }

      // Carregar categorias de receita
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, parent_id, category_type')
        .eq('category_type', 'Revenue')
        .eq('is_active', true)
        .order('name');

      if (!categoriesError && categoriesData) {
        setCategories(categoriesData);
      }
    } catch (error) {
      showError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoadingData(false);
    }
  };

  // 🔄 Carregar formas de pagamento e contas quando unidade mudar
  useEffect(() => {
    const loadUnitData = async () => {
      if (!formData.unit_id) {
        setPaymentMethods([]);
        setBankAccounts([]);
        setSelectedPaymentMethod(null);
        return;
      }

      try {
        // Buscar formas de pagamento
        const { data: methodsData, error: methodsError } =
          await getPaymentMethods(formData.unit_id);
        if (!methodsError && methodsData) {
          const activeMethods = methodsData.filter(m => m.is_active);
          setPaymentMethods(activeMethods);
        }

        // Buscar contas bancárias
        const accountsData = await bankAccountsService.getBankAccounts(
          formData.unit_id
        );
        setBankAccounts(accountsData || []);
      } catch (error) {
        console.error('Erro ao carregar dados da unidade:', error);
      }
    };

    loadUnitData();
  }, [formData.unit_id]);

  // 📅 Calcular data de recebimento automaticamente
  useEffect(() => {
    if (formData.payment_method_id && formData.data_pagamento) {
      const method = paymentMethods.find(
        m => m.id === formData.payment_method_id
      );

      if (method) {
        setSelectedPaymentMethod(method);

        // Calcula dias CORRIDOS com ajuste para próximo dia útil
        const receiptDate = addCalendarDaysAndAdjustToBusinessDay(
          new Date(formData.data_pagamento + 'T00:00:00'),
          method.receipt_days
        );

        setFormData(prev => ({
          ...prev,
          prev_recebimento: receiptDate.toISOString().split('T')[0],
        }));
      }
    } else {
      setSelectedPaymentMethod(null);
      setFormData(prev => ({ ...prev, prev_recebimento: '' }));
    }
  }, [formData.payment_method_id, formData.data_pagamento, paymentMethods]);

  // ✏️ Manipular mudanças nos campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpar campos dependentes ao mudar unidade
    if (field === 'unit_id') {
      setFormData(prev => ({
        ...prev,
        payment_method_id: '',
        account_id: '',
      }));
    }

    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 💰 Formatar valor como moeda
  const handleValorChange = e => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const amount = parseFloat(rawValue) / 100;
    const formatted = amount.toFixed(2);
    handleInputChange('valor', formatted);
  };

  // ✅ Validar formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo?.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    const valorNum = parseFloat(formData.valor);
    if (!formData.valor || isNaN(valorNum) || valorNum <= 0) {
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

    if (!formData.category_id) {
      newErrors.category_id = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 💾 Submeter formulário
  const handleSubmit = async e => {
    e.preventDefault();

    console.log('📝 Modal: FormData atual:', formData);

    if (!validateForm()) {
      console.error('❌ Modal: Validação falhou');
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valor);

      const receita = {
        // ✅ Campos obrigatórios
        type: 'service',
        value: valorNumerico,
        date: formData.data_pagamento,
        data_competencia: formData.data_pagamento,

        // 💰 Valores financeiros
        gross_amount: valorNumerico,
        net_amount: valorNumerico,
        fees: 0,

        // 📅 Datas de competência
        accrual_start_date: formData.data_pagamento,
        accrual_end_date: formData.data_pagamento,
        expected_receipt_date: formData.prev_recebimento,

        // 📝 Informações
        source: formData.titulo,
        observations: formData.observacoes || null,

        // 🔗 Relacionamentos
        unit_id: formData.unit_id,
        payment_method_id: formData.payment_method_id,
        category_id: formData.category_id,
        account_id: formData.account_id || null,

        // ⚡ Status inicial
        status: 'Pending',
        is_active: true,
      };

      console.log('📤 Modal: Enviando receita:', receita);

      await onSubmit(receita);

      showSuccess(
        `Receita criada com sucesso! ${formData.titulo} - R$ ${valorNumerico.toFixed(2)}`
      );

      resetForm();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      showError(error.message || 'Erro ao salvar receita. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Resetar formulário
  const resetForm = () => {
    setFormData({
      titulo: '',
      valor: '',
      data_pagamento: new Date().toISOString().split('T')[0],
      prev_recebimento: '',
      unit_id: '',
      payment_method_id: '',
      account_id: '',
      category_id: '',
      observacoes: '',
    });
    setErrors({});
    setSelectedPaymentMethod(null);
  };

  // 🎨 Renderizar categorias hierárquicas
  const renderCategoryOptions = () => {
    // Separar categorias pai e filhas
    const parentCategories = categories.filter(c => !c.parent_id);
    const childCategories = categories.filter(c => c.parent_id);

    return parentCategories.map(parent => (
      <optgroup key={parent.id} label={parent.name}>
        {childCategories
          .filter(child => child.parent_id === parent.id)
          .map(child => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
      </optgroup>
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 mx-auto flex flex-col max-h-[calc(100vh-4rem)] border-2 border-gray-100 dark:border-gray-700">
        {/* 🎨 Header com gradiente azul→índigo */}
        <div className="relative px-6 py-5 border-b-2 border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Nova Receita
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Regime de Competência
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 📋 Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* ⚠️ Loading overlay */}
          {loadingData && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Carregando dados...
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
            {/* 📝 Campo: Título */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Título *
              </label>
              <Input
                type="text"
                placeholder="Ex: Serviço de corte de cabelo"
                value={formData.titulo}
                onChange={e => handleInputChange('titulo', e.target.value)}
                className={
                  errors.titulo
                    ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                    : ''
                }
              />
              {errors.titulo && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {errors.titulo}
                  </p>
                </div>
              )}
            </div>

            {/* 💰 Campo: Valor */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-sm">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={handleValorChange}
                  className={`pl-12 text-lg font-semibold ${errors.valor ? 'border-red-400 dark:border-red-500 focus:ring-red-500' : ''}`}
                />
              </div>
              {errors.valor && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {errors.valor}
                  </p>
                </div>
              )}
            </div>

            {/* 📅 Data de Pagamento + Unidade (2 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Pagamento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  Data de Pagamento *
                </label>
                <Input
                  type="date"
                  value={formData.data_pagamento}
                  onChange={e =>
                    handleInputChange('data_pagamento', e.target.value)
                  }
                  className={
                    errors.data_pagamento
                      ? 'border-red-400 dark:border-red-500 focus:ring-red-500'
                      : ''
                  }
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Data de competência no sistema
                </p>
                {errors.data_pagamento && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.data_pagamento}
                    </p>
                  </div>
                )}
              </div>

              {/* Unidade */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Unidade *
                </label>
                <select
                  value={formData.unit_id}
                  onChange={e => handleInputChange('unit_id', e.target.value)}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    errors.unit_id
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <option value="">Selecione uma unidade</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.unit_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 🏷️ Categoria */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                Categoria *
              </label>
              <select
                value={formData.category_id}
                onChange={e => handleInputChange('category_id', e.target.value)}
                className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                  errors.category_id
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <option value="">Selecione uma categoria</option>
                {renderCategoryOptions()}
              </select>
              {errors.category_id && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {errors.category_id}
                  </p>
                </div>
              )}
            </div>

            {/* 💳 Forma de Pagamento + Conta Bancária (2 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Forma de Pagamento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <CreditCard className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={e =>
                    handleInputChange('payment_method_id', e.target.value)
                  }
                  disabled={!formData.unit_id}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.payment_method_id
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <option value="">
                    {formData.unit_id
                      ? 'Selecione a forma'
                      : 'Selecione unidade primeiro'}
                  </option>
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name} -{' '}
                      {method.receipt_days === 0
                        ? 'Imediato'
                        : `D+${method.receipt_days}`}
                    </option>
                  ))}
                </select>
                {errors.payment_method_id && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {errors.payment_method_id}
                    </p>
                  </div>
                )}
                {paymentMethods.length === 0 && formData.unit_id && (
                  <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Nenhuma forma cadastrada
                  </p>
                )}
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  <Landmark className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Conta Bancária (Opcional)
                </label>
                <select
                  value={formData.account_id}
                  onChange={e =>
                    handleInputChange('account_id', e.target.value)
                  }
                  disabled={!formData.unit_id}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-200 dark:border-gray-600`}
                >
                  <option value="">
                    {formData.unit_id
                      ? 'Nenhuma'
                      : 'Selecione unidade primeiro'}
                  </option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 📝 Observações */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                Observações (Opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={e => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre esta receita..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* ✅ Info: Data de Recebimento Calculada */}
            {selectedPaymentMethod && formData.prev_recebimento && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900 dark:text-green-100">
                      Data de Recebimento Calculada
                    </p>
                    <p className="text-base font-semibold text-green-700 dark:text-green-300 mt-1">
                      {new Date(
                        formData.prev_recebimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long',
                      })}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      {selectedPaymentMethod.receipt_days === 0
                        ? '✓ Recebimento imediato no mesmo dia'
                        : `✓ ${selectedPaymentMethod.receipt_days} ${selectedPaymentMethod.receipt_days === 1 ? 'dia corrido' : 'dias corridos'} após pagamento`}
                      {selectedPaymentMethod.receipt_days > 0 && (
                        <span className="block mt-1">
                          ✓ Ajustado automaticamente para dia útil
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🎯 Footer */}
          <div className="px-6 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Receita
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NovaReceitaAccrualModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export { NovaReceitaAccrualModal };
export default NovaReceitaAccrualModal;
