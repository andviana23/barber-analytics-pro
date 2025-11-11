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
import AttachmentUploader from '../../components/molecules/AttachmentUploader';
import AttachmentCard from '../../components/molecules/AttachmentCard';
import { useFileUpload } from '../../hooks/useFileUpload';
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

  // Estado para receita criada (para anexos)
  const [createdRevenueId, setCreatedRevenueId] = useState(null);

  // Hook para upload de arquivos (só funciona após criar receita)
  const {
    uploading,
    attachments,
    loading: loadingAttachments,
    uploadProgress,
    uploadAttachment,
    removeAttachment,
    loadAttachments,
  } = useFileUpload(formData.unit_id, createdRevenueId, 'revenue');

  // Carregar anexos quando receita for criada
  useEffect(() => {
    if (createdRevenueId) {
      loadAttachments();
    }
  }, [createdRevenueId, loadAttachments]);

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
      const { data: unitsData, error: unitsError } =
        await unitsService.getUnits();
      if (!unitsError && Array.isArray(unitsData)) {
        setUnits(unitsData.filter(u => u.is_active));
      } else if (unitsError) {
        throw unitsError;
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
      setFormData(prev => ({
        ...prev,
        prev_recebimento: '',
      }));
    }
  }, [formData.payment_method_id, formData.data_pagamento, paymentMethods]);

  // ✏️ Manipular mudanças nos campos
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

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
        const newErrors = {
          ...prev,
        };
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
      const createdRevenue = await onSubmit(receita);

      // Se a receita foi criada com sucesso e tem ID, permitir anexar comprovantes
      if (createdRevenue?.id) {
        setCreatedRevenueId(createdRevenue.id);
        showSuccess(
          `Receita criada com sucesso! ${formData.titulo} - R$ ${valorNumerico.toFixed(2)}`
        );
        // Modal permanece aberto para permitir anexar comprovantes
      } else {
        showSuccess(
          `Receita criada com sucesso! ${formData.titulo} - R$ ${valorNumerico.toFixed(2)}`
        );
        resetForm();
        onClose();
      }
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
    setCreatedRevenueId(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 dark:bg-black/70">
      <div className="card-theme mx-auto my-8 flex max-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col rounded-2xl border-2 border-light-border shadow-2xl dark:border-dark-border dark:bg-dark-surface">
        {/* 🎨 Header com gradiente azul→índigo */}
        <div className="relative flex flex-shrink-0 items-center justify-between rounded-t-2xl border-b-2 border-light-border bg-gradient-primary px-6 py-5 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="card-theme/20 rounded-xl p-2.5 backdrop-blur-sm">
              <DollarSign className="text-dark-text-primary h-6 w-6" />
            </div>
            <div>
              <h2 className="text-dark-text-primary text-xl font-bold tracking-wide">
                Nova Receita
              </h2>
              <p className="mt-0.5 text-xs text-blue-100">
                Regime de Competência
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-dark-text-primary/80 hover:text-dark-text-primary hover:card-theme/20 rounded-lg p-2 transition-all"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 📋 Form */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* ⚠️ Loading overlay */}
          {loadingData && (
            <div className="card-theme/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm dark:bg-dark-surface/80">
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  Carregando dados...
                </p>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* 📝 Campo: Título */}
            <div>
              <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
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
                    ? 'border-red-400 focus:ring-red-500 dark:border-red-500'
                    : ''
                }
              />
              {errors.titulo && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.titulo}
                  </p>
                </div>
              )}
            </div>

            {/* 💰 Campo: Valor */}
            <div>
              <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                Valor *
              </label>
              <div className="relative">
                <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={handleValorChange}
                  className={`pl-12 text-lg font-semibold ${errors.valor ? 'border-red-400 focus:ring-red-500 dark:border-red-500' : ''}`}
                />
              </div>
              {errors.valor && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.valor}
                  </p>
                </div>
              )}
            </div>

            {/* 📅 Data de Pagamento + Unidade (2 colunas) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Data de Pagamento */}
              <div>
                <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
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
                      ? 'border-red-400 focus:ring-red-500 dark:border-red-500'
                      : ''
                  }
                />
                <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mt-1.5 flex items-center gap-1 text-xs">
                  <Info className="h-3 w-3" />
                  Data de competência no sistema
                </p>
                {errors.data_pagamento && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.data_pagamento}
                    </p>
                  </div>
                )}
              </div>

              {/* Unidade */}
              <div>
                <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Unidade *
                </label>
                <select
                  value={formData.unit_id}
                  onChange={e => handleInputChange('unit_id', e.target.value)}
                  className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.unit_id ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                >
                  <option value="">Selecione uma unidade</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.unit_id && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.unit_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 🏷️ Categoria */}
            <div>
              <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                Categoria *
              </label>
              <select
                value={formData.category_id}
                onChange={e => handleInputChange('category_id', e.target.value)}
                className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:bg-gray-700 dark:text-white ${errors.category_id ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
              >
                <option value="">Selecione uma categoria</option>
                {renderCategoryOptions()}
              </select>
              {errors.category_id && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {errors.category_id}
                  </p>
                </div>
              )}
            </div>

            {/* 💳 Forma de Pagamento + Conta Bancária (2 colunas) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Forma de Pagamento */}
              <div>
                <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.payment_method_id}
                  onChange={e =>
                    handleInputChange('payment_method_id', e.target.value)
                  }
                  disabled={!formData.unit_id}
                  className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white ${errors.payment_method_id ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
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
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {errors.payment_method_id}
                    </p>
                  </div>
                )}
                {paymentMethods.length === 0 && formData.unit_id && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    Nenhuma forma cadastrada
                  </p>
                )}
              </div>

              {/* Conta Bancária */}
              <div>
                <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Landmark className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  Conta Bancária (Opcional)
                </label>
                <select
                  value={formData.account_id}
                  onChange={e =>
                    handleInputChange('account_id', e.target.value)
                  }
                  disabled={!formData.unit_id}
                  className={`w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white`}
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
              <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                <FileText className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted h-4 w-4" />
                Observações (Opcional)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={e => handleInputChange('observacoes', e.target.value)}
                placeholder="Informações adicionais sobre esta receita..."
                rows={3}
                className="card-theme text-theme-primary dark:text-dark-text-primary w-full resize-none rounded-xl border-2 border-light-border px-4 py-3 placeholder-gray-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:border-dark-border dark:bg-gray-700 dark:placeholder-gray-500"
              />
            </div>

            {/* 📎 Anexar Comprovantes */}
            {createdRevenueId ? (
              <div>
                <label className="text-theme-secondary mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Anexar Comprovantes
                </label>
                <AttachmentUploader
                  onUpload={uploadAttachment}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
                  disabled={loading || uploading}
                  className="mb-3"
                />
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((attachment) => (
                      <AttachmentCard
                        key={attachment.id}
                        attachment={attachment}
                        onDelete={removeAttachment}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  Os comprovantes poderão ser anexados após criar a receita
                </p>
              </div>
            )}

            {/* ✅ Info: Data de Recebimento Calculada */}
            {selectedPaymentMethod && formData.prev_recebimento && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900 dark:text-green-100">
                      Data de Recebimento Calculada
                    </p>
                    <p className="mt-1 text-base font-semibold text-green-700 dark:text-green-300">
                      {new Date(
                        formData.prev_recebimento + 'T00:00:00'
                      ).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long',
                      })}
                    </p>
                    <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                      {selectedPaymentMethod.receipt_days === 0
                        ? '✓ Recebimento imediato no mesmo dia'
                        : `✓ ${selectedPaymentMethod.receipt_days} ${selectedPaymentMethod.receipt_days === 1 ? 'dia corrido' : 'dias corridos'} após pagamento`}
                      {selectedPaymentMethod.receipt_days > 0 && (
                        <span className="mt-1 block">
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
          <div className="flex flex-shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t-2 border-light-border bg-light-bg px-6 py-4 dark:border-dark-border dark:bg-dark-bg dark:bg-dark-surface/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-theme-secondary hover:card-theme rounded-xl border-2 border-light-border px-5 py-2.5 font-medium transition-all disabled:opacity-50 dark:border-dark-border dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            {createdRevenueId ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
                className="text-dark-text-primary flex items-center rounded-xl bg-gradient-success px-6 py-2.5 font-semibold shadow-lg shadow-green-500/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || loadingData}
                className="text-dark-text-primary flex items-center rounded-xl bg-gradient-success px-6 py-2.5 font-semibold shadow-lg shadow-green-500/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Receita
                  </>
                )}
              </button>
            )}
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
