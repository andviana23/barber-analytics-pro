/**
 * NovaReceitaAccrualModal.jsx
 * 
 * Modal para criar receitas com regime de competência
 * Integra DateRangePicker, PartySelector e validação completa
 * 
 * Autor: Sistema Barber Analytics Pro
 * Data: 2024
 */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  X,
  Save,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  Repeat,
  Plus,
  Minus,
  Info,
  CreditCard,
  Tag,
  MapPin
} from 'lucide-react';
import { format, addMonths, addDays, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateRangePicker from '../../atoms/DateRangePicker';
import { PartySelector } from '../../atoms/PartySelector';
import StatusBadge from '../../atoms/StatusBadge';

const NovaReceitaAccrualModal = ({
  // Estado do modal
  isOpen = false,
  onClose,
  
  // Dados iniciais (para edição)
  initialData = null,
  
  // Callbacks
  onSubmit,
  onDelete, // Para modo de edição
  
  // Configurações
  mode = 'create', // 'create' ou 'edit'
  enableRecurring = true,
  enableCategories = true,
  enableAccounts = true,
  
  // Dados para seletores
  availableCategories = [],
  availableAccounts = [],
  availablePaymentMethods = [],
  
  // Estados
  loading = false,
  error = null,
  
  className = ''
}) => {
  // Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    valor: '',
    data_vencimento: new Date(),
    data_competencia: new Date(),
    party_id: '',
    categoria_id: '',
    conta_id: '',
    metodo_pagamento: 'pix',
    observacoes: '',
    tags: [],
    endereco: '',
    status: 'pendente'
  });

  const [recurringConfig, setRecurringConfig] = useState({
    enabled: false,
    frequency: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
    interval: 1,
    endType: 'never', // 'never', 'after', 'until'
    occurrences: 12,
    endDate: addMonths(new Date(), 12)
  });

  const [validation, setValidation] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [currentTag, setCurrentTag] = useState('');

  // Inicializar dados se for edição
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        titulo: initialData.titulo || '',
        descricao: initialData.descricao || '',
        valor: initialData.valor ? initialData.valor.toString() : '',
        data_vencimento: initialData.data_vencimento ? new Date(initialData.data_vencimento) : new Date(),
        data_competencia: initialData.data_competencia ? new Date(initialData.data_competencia) : new Date(),
        party_id: initialData.party_id || '',
        categoria_id: initialData.categoria_id || '',
        conta_id: initialData.conta_id || '',
        metodo_pagamento: initialData.metodo_pagamento || 'pix',
        observacoes: initialData.observacoes || '',
        tags: initialData.tags || [],
        endereco: initialData.endereco || '',
        status: initialData.status || 'pendente'
      });

      if (initialData.recurring_config) {
        setRecurringConfig(initialData.recurring_config);
        setShowRecurring(true);
      }
    }
  }, [initialData, mode]);

  // Resetar formulário quando modal fecha
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({
          titulo: '',
          descricao: '',
          valor: '',
          data_vencimento: new Date(),
          data_competencia: new Date(),
          party_id: '',
          categoria_id: '',
          conta_id: '',
          metodo_pagamento: 'pix',
          observacoes: '',
          tags: [],
          endereco: '',
          status: 'pendente'
        });
        setRecurringConfig({
          enabled: false,
          frequency: 'monthly',
          interval: 1,
          endType: 'never',
          occurrences: 12,
          endDate: addMonths(new Date(), 12)
        });
        setValidation({});
        setIsDirty(false);
        setShowRecurring(false);
        setCurrentTag('');
      }, 300);
    }
  }, [isOpen]);

  // Validação do formulário
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.titulo.trim()) {
      errors.titulo = 'Título é obrigatório';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      errors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.party_id) {
      errors.party_id = 'Cliente é obrigatório';
    }

    if (enableCategories && availableCategories.length > 0 && !formData.categoria_id) {
      errors.categoria_id = 'Categoria é obrigatória';
    }

    if (enableAccounts && availableAccounts.length > 0 && !formData.conta_id) {
      errors.conta_id = 'Conta bancária é obrigatória';
    }

    if (showRecurring && recurringConfig.enabled) {
      if (recurringConfig.endType === 'after' && recurringConfig.occurrences < 1) {
        errors.recurring = 'Número de ocorrências deve ser maior que zero';
      }
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  }, [formData, recurringConfig, showRecurring, enableCategories, enableAccounts, availableCategories, availableAccounts]);

  // Atualizar campo do formulário
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);

    // Limpar erro do campo se existir
    if (validation[field]) {
      setValidation(prev => {
        const newValidation = { ...prev };
        delete newValidation[field];
        return newValidation;
      });
    }
  }, [validation]);

  // Adicionar tag
  const addTag = useCallback(() => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      updateFormData('tags', [...formData.tags, currentTag.trim()]);
      setCurrentTag('');
    }
  }, [currentTag, formData.tags, updateFormData]);

  // Remover tag
  const removeTag = useCallback((tagToRemove) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, updateFormData]);

  // Calcular preview das recorrências
  const getRecurringPreview = useCallback(() => {
    if (!recurringConfig.enabled) return [];

    const previews = [];
    let currentDate = new Date(formData.data_vencimento);
    const maxPreviews = 5;
    
    for (let i = 0; i < maxPreviews; i++) {
      if (recurringConfig.endType === 'after' && i >= recurringConfig.occurrences) break;
      if (recurringConfig.endType === 'until' && currentDate > recurringConfig.endDate) break;

      previews.push({
        date: new Date(currentDate),
        valor: parseFloat(formData.valor || 0)
      });

      // Calcular próxima data
      switch (recurringConfig.frequency) {
        case 'daily':
          currentDate = addDays(currentDate, recurringConfig.interval);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, recurringConfig.interval);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, recurringConfig.interval);
          break;
        case 'yearly':
          currentDate = addMonths(currentDate, recurringConfig.interval * 12);
          break;
        default:
          break;
      }
    }

    return previews;
  }, [recurringConfig, formData.data_vencimento, formData.valor]);

  // Submeter formulário
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      valor: parseFloat(formData.valor),
      tipo: 'receita',
      regime: 'competencia'
    };

    if (showRecurring && recurringConfig.enabled) {
      submitData.recurring_config = recurringConfig;
    }

    try {
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
    }
  }, [formData, recurringConfig, showRecurring, validateForm, onSubmit]);

  // Formatação de moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Renderizar campo de valor
  const renderValueField = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <DollarSign className="w-4 h-4 inline mr-1" />
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
          onChange={(e) => updateFormData('valor', e.target.value)}
          className={`pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            validation.valor ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0,00"
        />
      </div>
      {validation.valor && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {validation.valor}
        </p>
      )}
    </div>
  );

  // Renderizar configuração de recorrência
  const renderRecurringConfig = () => {
    if (!showRecurring) return null;

    return (
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Repeat className="w-5 h-5 mr-2" />
            Configuração de Recorrência
          </h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={recurringConfig.enabled}
              onChange={(e) => setRecurringConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Ativar recorrência</span>
          </label>
        </div>

        {recurringConfig.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
              <select
                value={recurringConfig.frequency}
                onChange={(e) => setRecurringConfig(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Intervalo</label>
              <input
                type="number"
                min="1"
                value={recurringConfig.interval}
                onChange={(e) => setRecurringConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Encerramento</label>
              <select
                value={recurringConfig.endType}
                onChange={(e) => setRecurringConfig(prev => ({ ...prev, endType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="never">Nunca</option>
                <option value="after">Após X ocorrências</option>
                <option value="until">Até data específica</option>
              </select>
            </div>

            {recurringConfig.endType === 'after' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de ocorrências</label>
                <input
                  type="number"
                  min="1"
                  value={recurringConfig.occurrences}
                  onChange={(e) => setRecurringConfig(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {recurringConfig.endType === 'until' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data final</label>
                <input
                  type="date"
                  value={format(recurringConfig.endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setRecurringConfig(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {recurringConfig.enabled && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Preview das próximas receitas:</h4>
            <div className="space-y-1">
              {getRecurringPreview().map((preview, index) => (
                <div key={index} className="text-sm text-blue-700">
                  {format(preview.date, 'dd/MM/yyyy', { locale: ptBR })} - {formatCurrency(preview.valor)}
                </div>
              ))}
              {getRecurringPreview().length === 5 && (
                <div className="text-sm text-blue-600 italic">...e mais</div>
              )}
            </div>
          </div>
        )}

        {validation.recurring && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {validation.recurring}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'edit' ? 'Editar Receita' : 'Nova Receita'} - Regime de Competência
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Erro geral */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => updateFormData('titulo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validation.titulo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Serviço de corte de cabelo"
                />
                {validation.titulo && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validation.titulo}
                  </p>
                )}
              </div>

              {/* Valor */}
              <div>
                {renderValueField()}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pendente">Pendente</option>
                  <option value="recebido">Recebido</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                <div className="mt-2">
                  <StatusBadge status={formData.status} size="sm" />
                </div>
              </div>

              {/* Datas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={format(formData.data_vencimento, 'yyyy-MM-dd')}
                  onChange={(e) => updateFormData('data_vencimento', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Data de Competência *
                </label>
                <input
                  type="date"
                  value={format(formData.data_competencia, 'yyyy-MM-dd')}
                  onChange={(e) => updateFormData('data_competencia', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Cliente *
              </label>
              <PartySelector
                value={formData.party_id}
                onChange={(value) => updateFormData('party_id', value)}
                placeholder="Selecione ou cadastre um cliente"
                filterType="cliente"
                className={validation.party_id ? 'border-red-500' : ''}
              />
              {validation.party_id && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {validation.party_id}
                </p>
              )}
            </div>

            {/* Categoria e Conta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enableCategories && availableCategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoria {enableCategories ? '*' : ''}
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => updateFormData('categoria_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validation.categoria_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {availableCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                  {validation.categoria_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validation.categoria_id}
                    </p>
                  )}
                </div>
              )}

              {enableAccounts && availableAccounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Conta Bancária {enableAccounts ? '*' : ''}
                  </label>
                  <select
                    value={formData.conta_id}
                    onChange={(e) => updateFormData('conta_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validation.conta_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione uma conta</option>
                    {availableAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.nome}
                      </option>
                    ))}
                  </select>
                  {validation.conta_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {validation.conta_id}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Método de pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Método de Pagamento
              </label>
              <select
                value={formData.metodo_pagamento}
                onChange={(e) => updateFormData('metodo_pagamento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => updateFormData('descricao', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva detalhes sobre a receita..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adicionar tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Endereço (se aplicável)
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => updateFormData('endereco', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Rua das Flores, 123, Centro"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => updateFormData('observacoes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações internas, notas especiais..."
              />
            </div>

            {/* Recorrência */}
            {enableRecurring && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    Esta receita pode ser configurada como recorrente
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecurring(!showRecurring)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showRecurring ? 'Ocultar' : 'Configurar'} Recorrência
                </button>
              </div>
            )}

            {/* Configuração de recorrência */}
            {enableRecurring && renderRecurringConfig()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                >
                  Excluir
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isDirty}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'edit' ? 'Atualizar' : 'Salvar'} Receita
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

NovaReceitaAccrualModal.propTypes = {
  /**
   * Estado do modal
   */
  isOpen: PropTypes.bool.isRequired,

  /**
   * Callback para fechar modal
   */
  onClose: PropTypes.func.isRequired,

  /**
   * Dados iniciais para edição
   */
  initialData: PropTypes.object,

  /**
   * Callback para submeter dados
   */
  onSubmit: PropTypes.func.isRequired,

  /**
   * Callback para excluir (modo edição)
   */
  onDelete: PropTypes.func,

  /**
   * Modo do modal
   */
  mode: PropTypes.oneOf(['create', 'edit']),

  /**
   * Habilitar recorrência
   */
  enableRecurring: PropTypes.bool,

  /**
   * Habilitar categorias
   */
  enableCategories: PropTypes.bool,

  /**
   * Habilitar contas
   */
  enableAccounts: PropTypes.bool,

  /**
   * Categorias disponíveis
   */
  availableCategories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired
  })),

  /**
   * Contas disponíveis
   */
  availableAccounts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired
  })),

  /**
   * Métodos de pagamento disponíveis
   */
  availablePaymentMethods: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired
  })),

  /**
   * Estado de carregamento
   */
  loading: PropTypes.bool,

  /**
   * Erro
   */
  error: PropTypes.string,

  /**
   * Classes CSS adicionais
   */
  className: PropTypes.string
};

// Componente de preview para demonstração
export const NovaReceitaAccrualModalPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('create');

  const mockCategories = [
    { id: 'cat1', nome: 'Serviços' },
    { id: 'cat2', nome: 'Produtos' },
    { id: 'cat3', nome: 'Consultoria' }
  ];

  const mockAccounts = [
    { id: 'acc1', nome: 'Conta Corrente - Banco do Brasil' },
    { id: 'acc2', nome: 'Conta Poupança - Caixa' }
  ];

  const mockInitialData = {
    id: '1',
    titulo: 'Corte de cabelo - João Silva',
    descricao: 'Serviço de corte masculino',
    valor: 45.00,
    data_vencimento: new Date(),
    data_competencia: new Date(),
    party_id: 'party1',
    categoria_id: 'cat1',
    conta_id: 'acc1',
    metodo_pagamento: 'pix',
    status: 'pendente',
    tags: ['cabelo', 'masculino'],
    observacoes: 'Cliente preferencial'
  };

  const handleSubmit = async (data) => {
    // eslint-disable-next-line no-console
    console.log('Submit receita:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsOpen(false);
  };

  const handleDelete = async (data) => {
    // eslint-disable-next-line no-console
    console.log('Delete receita:', data);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">NovaReceitaAccrualModal Preview</h3>
      
      <div className="flex space-x-4">
        <button
          onClick={() => {
            setMode('create');
            setIsOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Criar Nova Receita
        </button>
        
        <button
          onClick={() => {
            setMode('edit');
            setIsOpen(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Editar Receita
        </button>
      </div>

      <NovaReceitaAccrualModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={mode}
        initialData={mode === 'edit' ? mockInitialData : null}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        availableCategories={mockCategories}
        availableAccounts={mockAccounts}
        enableRecurring={true}
        enableCategories={true}
        enableAccounts={true}
      />
    </div>
  );
};

export default NovaReceitaAccrualModal;