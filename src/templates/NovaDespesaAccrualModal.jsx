import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Plus, Trash2, Calendar, Calculator, Building2, FileText, Tag, CreditCard, MapPin, AlertCircle, Repeat, Settings } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, addYears, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import DateRangePicker from '../atoms/DateRangePicker';
import { PartySelector } from '../atoms/PartySelector';
import StatusBadge from '../atoms/StatusBadge';

/**
 * Modal para criação/edição de despesas com regime de competência
 * Inclui funcionalidades de despesas recorrentes, categorização e controle de aprovações
 * Integra com accrualsService, partiesService e sistema de contas a pagar
 */
const NovaDespesaAccrualModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  initialData = null,
  isEditing = false,
  loading = false,
  unidadeId = null,
  availableCategories = [],
  availableAccounts = [],
  availableCostCenters = [],
  availableSuppliers = []
}) => {
  // Estados do formulário principal
  const [formData, setFormData] = useState({
    titulo: '',
    valor: '',
    descricao: '',
    categoria_id: '',
    subcategoria: '',
    fornecedor_id: '',
    data_vencimento: new Date(),
    data_competencia: new Date(),
    conta_id: '',
    centro_custo_id: '',
    status: 'pendente',
    metodo_pagamento: 'transferencia',
    numero_documento: '',
    observacoes: '',
    tags: [],
    anexos: []
  });

  // Estados para despesas recorrentes
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState({
    frequency: 'mensal',
    interval: 1,
    endType: 'nunca',
    endAfter: 12,
    endDate: null,
    dayOfMonth: null,
    dayOfWeek: null
  });

  // Estados para aprovação
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalData, setApprovalData] = useState({
    aprovador_id: '',
    valor_limite_aprovacao: 1000,
    justificativa: '',
    prioridade: 'normal'
  });

  // Estados de controle
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [showRecurringPreview, setShowRecurringPreview] = useState(false);
  const [showApprovalConfig, setShowApprovalConfig] = useState(false);

  // Opções de frequência para despesas recorrentes
  const frequencyOptions = [
    { value: 'diaria', label: 'Diária', icon: Calendar },
    { value: 'semanal', label: 'Semanal', icon: Calendar },
    { value: 'mensal', label: 'Mensal', icon: Calendar },
    { value: 'anual', label: 'Anual', icon: Calendar }
  ];

  // Opções de métodos de pagamento
  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: CreditCard },
    { value: 'transferencia', label: 'Transferência', icon: Building2 },
    { value: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
    { value: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
    { value: 'pix', label: 'PIX', icon: Building2 },
    { value: 'boleto', label: 'Boleto', icon: FileText },
    { value: 'cheque', label: 'Cheque', icon: FileText }
  ];

  // Opções de status de despesa
  const statusOptions = [
    { value: 'pendente', label: 'Pendente', color: 'amber' },
    { value: 'aprovada', label: 'Aprovada', color: 'blue' },
    { value: 'paga', label: 'Paga', color: 'green' },
    { value: 'vencida', label: 'Vencida', color: 'red' },
    { value: 'cancelada', label: 'Cancelada', color: 'gray' },
    { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação', color: 'yellow' }
  ];

  // Opções de prioridade
  const priorityOptions = [
    { value: 'baixa', label: 'Baixa', color: 'green' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'alta', label: 'Alta', color: 'orange' },
    { value: 'urgente', label: 'Urgente', color: 'red' }
  ];

  // Inicialização do formulário
  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        valor: initialData.valor?.toString() || '',
        descricao: initialData.descricao || '',
        categoria_id: initialData.categoria_id || '',
        subcategoria: initialData.subcategoria || '',
        fornecedor_id: initialData.fornecedor_id || '',
        data_vencimento: initialData.data_vencimento ? new Date(initialData.data_vencimento) : new Date(),
        data_competencia: initialData.data_competencia ? new Date(initialData.data_competencia) : new Date(),
        conta_id: initialData.conta_id || '',
        centro_custo_id: initialData.centro_custo_id || '',
        status: initialData.status || 'pendente',
        metodo_pagamento: initialData.metodo_pagamento || 'transferencia',
        numero_documento: initialData.numero_documento || '',
        observacoes: initialData.observacoes || '',
        tags: initialData.tags || [],
        anexos: initialData.anexos || []
      });

      if (initialData.recorrencia) {
        setIsRecurring(true);
        setRecurringConfig(initialData.recorrencia);
      }

      if (initialData.aprovacao) {
        setRequiresApproval(true);
        setApprovalData(initialData.aprovacao);
      }
    }
  }, [initialData]);

  // Função para atualizar dados do formulário
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Validação do formulário
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento é obrigatória';
    }

    if (!formData.data_competencia) {
      newErrors.data_competencia = 'Data de competência é obrigatória';
    }

    if (formData.data_competencia && formData.data_vencimento && 
        isAfter(formData.data_competencia, formData.data_vencimento)) {
      newErrors.data_competencia = 'Data de competência não pode ser posterior ao vencimento';
    }

    if (requiresApproval && parseFloat(formData.valor) > approvalData.valor_limite_aprovacao && !approvalData.justificativa.trim()) {
      newErrors.justificativa = 'Justificativa é obrigatória para valores acima do limite';
    }

    if (isRecurring) {
      if (recurringConfig.endType === 'apos' && (!recurringConfig.endAfter || recurringConfig.endAfter < 1)) {
        newErrors.endAfter = 'Número de parcelas deve ser maior que zero';
      }

      if (recurringConfig.endType === 'ate' && !recurringConfig.endDate) {
        newErrors.endDate = 'Data final é obrigatória';
      }

      if (recurringConfig.endType === 'ate' && recurringConfig.endDate && 
          isBefore(recurringConfig.endDate, formData.data_vencimento)) {
        newErrors.endDate = 'Data final deve ser posterior à data de vencimento';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, recurringConfig, approvalData, isRecurring, requiresApproval]);

  // Função para adicionar tag
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      handleInputChange('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  }, [currentTag, formData.tags, handleInputChange]);

  // Função para remover tag
  const handleRemoveTag = useCallback((tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);

  // Cálculo de preview das próximas despesas recorrentes
  const recurringPreview = useMemo(() => {
    if (!isRecurring || !formData.data_vencimento) return [];

    const previews = [];
    let currentDate = new Date(formData.data_vencimento);
    let count = 0;
    const maxPreviews = 5;

    while (count < maxPreviews) {
      if (recurringConfig.endType === 'apos' && count >= recurringConfig.endAfter) break;
      if (recurringConfig.endType === 'ate' && recurringConfig.endDate && 
          isAfter(currentDate, recurringConfig.endDate)) break;

      if (count > 0) { // Pular a primeira (que é a despesa atual)
        previews.push({
          date: new Date(currentDate),
          value: parseFloat(formData.valor || 0),
          title: `${formData.titulo} (${count + 1}ª parcela)`
        });
      }

      // Calcular próxima data baseada na frequência
      switch (recurringConfig.frequency) {
        case 'diaria':
          currentDate = addDays(currentDate, recurringConfig.interval || 1);
          break;
        case 'semanal':
          currentDate = addWeeks(currentDate, recurringConfig.interval || 1);
          break;
        case 'mensal':
          currentDate = addMonths(currentDate, recurringConfig.interval || 1);
          break;
        case 'anual':
          currentDate = addYears(currentDate, recurringConfig.interval || 1);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }

      count++;
    }

    return previews;
  }, [isRecurring, formData.data_vencimento, formData.valor, formData.titulo, recurringConfig]);

  // Função para salvar
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    const expenseData = {
      ...formData,
      valor: parseFloat(formData.valor),
      unidade_id: unidadeId,
      recorrencia: isRecurring ? recurringConfig : null,
      aprovacao: requiresApproval ? approvalData : null,
      tipo: 'despesa'
    };

    await onSave(expenseData);
  }, [formData, unidadeId, isRecurring, recurringConfig, requiresApproval, approvalData, validateForm, onSave]);

  // Função para fechar modal
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('Existem alterações não salvas. Deseja realmente sair?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
              <Calculator className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Despesa' : 'Nova Despesa'}
              </h2>
              <p className="text-sm text-gray-500">
                {isRecurring ? 'Despesa com recorrência' : 'Despesa única'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Informações Básicas */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Despesa *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    placeholder="Ex: Aluguel mensal, Material de limpeza..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.titulo ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.titulo}
                    </p>
                  )}
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => handleInputChange('valor', e.target.value)}
                      placeholder="0,00"
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                        errors.valor ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.valor && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.valor}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => handleInputChange('categoria_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.categoria_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecionar categoria...</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                  {errors.categoria_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.categoria_id}
                    </p>
                  )}
                </div>

                {/* Subcategoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategoria
                  </label>
                  <input
                    type="text"
                    value={formData.subcategoria}
                    onChange={(e) => handleInputChange('subcategoria', e.target.value)}
                    placeholder="Ex: Material de escritório"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Fornecedor e Datas */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Fornecedor e Datas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fornecedor */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor
                  </label>
                  <PartySelector
                    value={formData.fornecedor_id}
                    onChange={(value) => handleInputChange('fornecedor_id', value)}
                    parties={availableSuppliers}
                    placeholder="Buscar ou criar fornecedor..."
                    type="supplier"
                  />
                </div>

                {/* Data de Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.data_vencimento ? format(formData.data_vencimento, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value ? new Date(e.target.value) : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.data_vencimento ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.data_vencimento && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.data_vencimento}
                    </p>
                  )}
                </div>

                {/* Data de Competência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Competência *
                  </label>
                  <input
                    type="date"
                    value={formData.data_competencia ? format(formData.data_competencia, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleInputChange('data_competencia', e.target.value ? new Date(e.target.value) : null)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.data_competencia ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.data_competencia && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.data_competencia}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contas e Centro de Custo */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Contas e Centro de Custo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Conta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta
                  </label>
                  <select
                    value={formData.conta_id}
                    onChange={(e) => handleInputChange('conta_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecionar conta...</option>
                    {availableAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.nome} - {account.banco}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Centro de Custo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Centro de Custo
                  </label>
                  <select
                    value={formData.centro_custo_id}
                    onChange={(e) => handleInputChange('centro_custo_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecionar centro de custo...</option>
                    {availableCostCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento
                  </label>
                  <select
                    value={formData.metodo_pagamento}
                    onChange={(e) => handleInputChange('metodo_pagamento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Controle de Aprovação */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Controle de Aprovação
                </h3>
                <button
                  type="button"
                  onClick={() => setRequiresApproval(!requiresApproval)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    requiresApproval ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      requiresApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {requiresApproval && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Prioridade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={approvalData.prioridade}
                        onChange={(e) => setApprovalData(prev => ({ ...prev, prioridade: e.target.value }))}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Valor Limite */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Limite para Aprovação
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={approvalData.valor_limite_aprovacao}
                          onChange={(e) => setApprovalData(prev => ({ 
                            ...prev, 
                            valor_limite_aprovacao: parseFloat(e.target.value) || 0 
                          }))}
                          className="w-full pl-10 pr-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Justificativa */}
                  {parseFloat(formData.valor) > approvalData.valor_limite_aprovacao && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Justificativa *
                      </label>
                      <textarea
                        value={approvalData.justificativa}
                        onChange={(e) => setApprovalData(prev => ({ ...prev, justificativa: e.target.value }))}
                        placeholder="Justifique a necessidade desta despesa acima do limite..."
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                          errors.justificativa ? 'border-red-300' : 'border-yellow-300'
                        }`}
                      />
                      {errors.justificativa && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.justificativa}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Despesa Recorrente */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Repeat className="w-5 h-5" />
                  Despesa Recorrente
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isRecurring ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isRecurring ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isRecurring && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Frequência */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frequência
                      </label>
                      <select
                        value={recurringConfig.frequency}
                        onChange={(e) => setRecurringConfig(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {frequencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Intervalo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        A cada
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurringConfig.interval}
                        onChange={(e) => setRecurringConfig(prev => ({ 
                          ...prev, 
                          interval: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Término */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Termina
                      </label>
                      <select
                        value={recurringConfig.endType}
                        onChange={(e) => setRecurringConfig(prev => ({ ...prev, endType: e.target.value }))}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nunca">Nunca</option>
                        <option value="apos">Após X parcelas</option>
                        <option value="ate">Até uma data</option>
                      </select>
                    </div>
                  </div>

                  {/* Configurações específicas do término */}
                  {recurringConfig.endType === 'apos' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurringConfig.endAfter}
                        onChange={(e) => setRecurringConfig(prev => ({ 
                          ...prev, 
                          endAfter: parseInt(e.target.value) || 1 
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.endAfter ? 'border-red-300' : 'border-blue-300'
                        }`}
                      />
                      {errors.endAfter && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.endAfter}
                        </p>
                      )}
                    </div>
                  )}

                  {recurringConfig.endType === 'ate' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={recurringConfig.endDate ? format(recurringConfig.endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setRecurringConfig(prev => ({ 
                          ...prev, 
                          endDate: e.target.value ? new Date(e.target.value) : null 
                        }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.endDate ? 'border-red-300' : 'border-blue-300'
                        }`}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Preview das próximas despesas */}
                  {recurringPreview.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          Próximas Despesas
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowRecurringPreview(!showRecurringPreview)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showRecurringPreview ? 'Ocultar' : 'Ver preview'}
                        </button>
                      </div>
                      
                      {showRecurringPreview && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {recurringPreview.map((preview, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-blue-200">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {preview.title}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {format(preview.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                  </p>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-red-600">
                                R$ {preview.value.toLocaleString('pt-BR', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2 
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informações Adicionais
              </h3>
              
              <div className="space-y-4">
                {/* Número do Documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Documento
                  </label>
                  <input
                    type="text"
                    value={formData.numero_documento}
                    onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                    placeholder="Ex: NF 12345, Boleto 67890..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descrição detalhada da despesa..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    placeholder="Observações internas..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Digite uma tag..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {formData.status && (
              <>
                <span>Status:</span>
                <StatusBadge
                  status={formData.status}
                  variant="outline"
                  size="sm"
                />
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Despesa'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

NovaDespesaAccrualModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool,
  /** Função chamada ao fechar o modal */
  onClose: PropTypes.func,
  /** Função chamada ao salvar a despesa */
  onSave: PropTypes.func,
  /** Dados iniciais para edição */
  initialData: PropTypes.object,
  /** Se está em modo de edição */
  isEditing: PropTypes.bool,
  /** Se está carregando */
  loading: PropTypes.bool,
  /** ID da unidade */
  unidadeId: PropTypes.string,
  /** Categorias disponíveis */
  availableCategories: PropTypes.arrayOf(PropTypes.object),
  /** Contas disponíveis */
  availableAccounts: PropTypes.arrayOf(PropTypes.object),
  /** Centros de custo disponíveis */
  availableCostCenters: PropTypes.arrayOf(PropTypes.object),
  /** Fornecedores disponíveis */
  availableSuppliers: PropTypes.arrayOf(PropTypes.object)
};

export default NovaDespesaAccrualModal;

// Preview Component
export const NovaDespesaAccrualModalPreview = () => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const mockCategories = [
    { id: '1', nome: 'Operacionais' },
    { id: '2', nome: 'Administrativas' },
    { id: '3', nome: 'Marketing' },
    { id: '4', nome: 'Impostos' }
  ];

  const mockAccounts = [
    { id: '1', nome: 'Conta Corrente Principal', banco: 'Banco do Brasil' },
    { id: '2', nome: 'Conta Poupança', banco: 'Caixa Econômica' },
    { id: '3', nome: 'Conta Digital', banco: 'Nubank' }
  ];

  const mockCostCenters = [
    { id: '1', nome: 'Unidade Centro' },
    { id: '2', nome: 'Unidade Shopping' },
    { id: '3', nome: 'Administração' }
  ];

  const mockSuppliers = [
    { id: '1', nome: 'Fornecedor ABC Ltda', email: 'contato@abc.com' },
    { id: '2', nome: 'Materiais XYZ', email: 'vendas@xyz.com' },
    { id: '3', nome: 'Serviços DEF', email: 'suporte@def.com' }
  ];

  const mockInitialData = isEditing ? {
    titulo: 'Aluguel Mensal - Unidade Centro',
    valor: 2500.00,
    descricao: 'Aluguel referente ao mês de dezembro/2024',
    categoria_id: '1',
    subcategoria: 'Imóveis',
    fornecedor_id: '1',
    data_vencimento: new Date('2024-12-05'),
    data_competencia: new Date('2024-12-01'),
    conta_id: '1',
    centro_custo_id: '1',
    status: 'pendente',
    metodo_pagamento: 'transferencia',
    numero_documento: 'CONT-2024-12-001',
    observacoes: 'Pagar até o dia 5',
    tags: ['aluguel', 'fixo', 'mensal'],
    recorrencia: {
      frequency: 'mensal',
      interval: 1,
      endType: 'nunca'
    }
  } : null;

  const handleSave = async (data) => {
    setLoading(true);
    console.log('Saving expense:', data);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setIsOpen(false);
    alert('Despesa salva com sucesso!');
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Nova Despesa Accrual Modal - Preview
          </h2>
          <p className="text-gray-600 mb-6">
            Modal completo para criação de despesas com regime de competência.
            Inclui despesas recorrentes, controle de aprovação e integração com fornecedores.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setIsOpen(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Nova Despesa
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
                setIsOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Despesa
            </button>
          </div>
        </div>

        <NovaDespesaAccrualModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={handleSave}
          initialData={mockInitialData}
          isEditing={isEditing}
          loading={loading}
          unidadeId="unidade-1"
          availableCategories={mockCategories}
          availableAccounts={mockAccounts}
          availableCostCenters={mockCostCenters}
          availableSuppliers={mockSuppliers}
        />
      </div>
    </div>
  );
};