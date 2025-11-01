/**
 * @file ServiceFormModal.jsx
 * @description Modal para criar/editar serviços
 * @module Components/Templates/Modals
 * @author Andrey Viana
 * @date 2025-10-24
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, DollarSign, Clock, Percent, Calculator } from 'lucide-react';
import { Button } from '../../../atoms/Button/Button';
import { Input } from '../../../atoms/Input/Input';
import categoriesService from '../../../services/categoriesService';
import {
  validateCreateService,
  validateUpdateService,
} from '../../../dtos/ServiceDTO';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Modal para criar ou editar serviço
 * Segue padrões do Design System
 */
const ServiceFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  service = null,
  unitId,
  loading = false,
}) => {
  const isEditing = !!service;
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: '',
    price: '',
    commissionPercentage: '',
    active: true,
    categoryId: '',
  });
  const [errors, setErrors] = useState({});

  // Estados para categorias
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);

  // Calcula valor da comissão em tempo real
  const commissionValue =
    (parseFloat(formData.price) || 0) *
    ((parseFloat(formData.commissionPercentage) || 0) / 100);

  // 🔄 Carrega categorias quando o modal abre
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // 📥 Função para carregar categorias de "Receita de Serviço"
  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    try {
      const result = await categoriesService.getRevenueCategories();
      if (result && Array.isArray(result)) {
        // Filtra apenas categorias de serviço (não de produto)
        const serviceCategories = result.filter(
          cat => cat.revenue_type === 'service'
        );
        setCategories(serviceCategories);

        // Se não há categoria selecionada e há categorias disponíveis, seleciona a primeira
        if (!formData.categoryId && serviceCategories.length > 0) {
          setFormData(prev => ({
            ...prev,
            categoryId: serviceCategories[0].id,
          }));
        }
      } else {
        setCategories([]);
        setCategoriesError('Nenhuma categoria de serviço encontrada');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      setCategoriesError(
        'Erro ao carregar categorias. Por favor, tente novamente.'
      );
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Preenche form ao editar
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        durationMinutes: service.duration_minutes?.toString() || '',
        price: service.price?.toString() || '',
        commissionPercentage: service.commission_percentage?.toString() || '',
        categoryId: service.category_id || '',
        active: service.active !== false,
      });
    } else {
      setFormData({
        name: '',
        durationMinutes: '',
        price: '',
        commissionPercentage: '',
        categoryId: '',
        active: true,
      });
    }
    setErrors({});
  }, [service, isOpen]);
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    console.log('🚀 ServiceFormModal - handleSubmit iniciado');
    console.log('📦 formData:', formData);
    console.log('🏢 unitId recebido:', unitId);

    // Validação de unitId
    if (!unitId) {
      console.error('❌ unitId não fornecido!');
      setErrors({
        form: 'Erro: Unidade não identificada. Selecione uma unidade no seletor de unidades.',
      });
      return;
    }
    const data = {
      name: formData.name.trim(),
      durationMinutes: parseInt(formData.durationMinutes) || 0,
      price: parseFloat(formData.price) || 0,
      commissionPercentage: parseFloat(formData.commissionPercentage) || 0,
      categoryId: formData.categoryId,
      unitId: unitId,
      active: formData.active,
    };
    console.log('📋 Dados preparados para validação:', data);

    // Valida com Zod
    const validation = isEditing
      ? validateUpdateService(data)
      : validateCreateService(data);
    console.log('✅ Validação resultado:', validation);
    if (!validation.success) {
      console.error('❌ Erro na validação:', validation.error);
      setErrors({
        form: validation.error,
      });
      return;
    }
    console.log('🎯 Chamando onSubmit com:', validation.data);

    // Chama callback de submit
    await onSubmit(validation.data);
    console.log('✅ onSubmit concluído');

    // Reseta form se não estiver editando
    if (!isEditing) {
      setFormData({
        name: '',
        durationMinutes: '',
        price: '',
        commissionPercentage: '',
        categoryId: '',
        active: true,
      });
    }
    setErrors({});
  };
  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        durationMinutes: '',
        price: '',
        commissionPercentage: '',
        categoryId: '',
        active: true,
      });
      setErrors({});
      onClose();
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-theme w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <div>
            <h2 className="text-xl font-bold text-theme-primary">
              {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              {isEditing
                ? 'Atualize as informações do serviço'
                : 'Cadastre um novo serviço com preço e comissão'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:card-theme dark:hover:bg-dark-surface transition-colors disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X size={20} className="text-theme-muted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome do Serviço */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Nome do Serviço *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ex: Corte Masculino, Barba, Degradê..."
              disabled={loading}
              required
              maxLength={100}
            />
            <p className="text-xs text-theme-muted mt-1">
              {formData.name.length}/100 caracteres
            </p>
          </div>

          {/* 📂 Categoria do Serviço */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Categoria *
            </label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-hover">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-theme-secondary">
                  Carregando categorias...
                </span>
              </div>
            ) : categories.length > 0 ? (
              <>
                <select
                  value={formData.categoryId}
                  onChange={e => handleChange('categoryId', e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 rounded-lg border card-theme dark:bg-dark-surface text-theme-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed border-light-border dark:border-dark-border focus:border-primary"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                      {cat.parent?.name ? ` (${cat.parent.name})` : ''}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.categoryId}
                  </p>
                )}
                <p className="text-xs text-theme-muted mt-1">
                  Apenas categorias de "Receita de Serviço" são exibidas
                </p>
              </>
            ) : (
              <div className="px-4 py-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Nenhuma categoria de serviço cadastrada. Cadastre
                  categorias na página de Categorias primeiro.
                </p>
              </div>
            )}
          </div>

          {/* Grid: Duração e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duração */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Duração (minutos) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={18} className="text-theme-muted" />
                </div>
                <Input
                  type="number"
                  min="1"
                  max="480"
                  value={formData.durationMinutes}
                  onChange={e =>
                    handleChange('durationMinutes', e.target.value)
                  }
                  placeholder="30"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-theme-muted mt-1">
                Tempo médio de execução
              </p>
            </div>

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
                Preço (R$) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-theme-muted" />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={e => handleChange('price', e.target.value)}
                  placeholder="50,00"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
              {formData.price && (
                <p className="text-xs text-theme-muted mt-1">
                  {formatCurrency(parseFloat(formData.price) || 0)}
                </p>
              )}
            </div>
          </div>

          {/* Comissão */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">
              Percentual de Comissão (%) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent size={18} className="text-theme-muted" />
              </div>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commissionPercentage}
                onChange={e =>
                  handleChange('commissionPercentage', e.target.value)
                }
                placeholder="30"
                className="pl-10"
                disabled={loading}
                required
              />
            </div>
            <p className="text-xs text-theme-muted mt-1">
              Percentual que o profissional recebe por serviço
            </p>
          </div>

          {/* Cálculo da Comissão */}
          {formData.price && formData.commissionPercentage && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Cálculo de Comissão
                </span>
              </div>
              <div className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                <div className="flex justify-between">
                  <span>Preço do serviço:</span>
                  <span className="font-semibold">
                    {formatCurrency(parseFloat(formData.price) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Percentual:</span>
                  <span className="font-semibold">
                    {parseFloat(formData.commissionPercentage) || 0}%
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-200 dark:border-purple-800">
                  <span className="font-bold">Comissão por serviço:</span>
                  <span className="font-bold text-base">
                    {formatCurrency(commissionValue)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status (apenas ao editar) */}
          {isEditing && (
            <div className="flex items-center justify-between p-4 bg-light-bg dark:bg-dark-bg dark:bg-dark-surface/50 rounded-lg border border-theme-border">
              <div>
                <label className="text-sm font-medium text-theme-primary">
                  Status do Serviço
                </label>
                <p className="text-xs text-theme-muted mt-1">
                  Serviços inativos não aparecem para seleção
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={e => handleChange('active', e.target.checked)}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-light-surface dark:border-dark-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:card-theme after:border-light-border dark:border-dark-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                <span className="ml-3 text-sm font-medium text-theme-primary">
                  {formData.active ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            </div>
          )}

          {/* Erro de validação */}
          {errors.form && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.form}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dica:</strong> A comissão será calculada automaticamente
              ao adicionar este serviço em uma comanda.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading
                ? isEditing
                  ? 'Salvando...'
                  : 'Criando...'
                : isEditing
                  ? 'Salvar Alterações'
                  : 'Criar Serviço'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
ServiceFormModal.propTypes = {
  /** Se o modal está aberto */
  isOpen: PropTypes.bool.isRequired,
  /** Callback para fechar modal */
  onClose: PropTypes.func.isRequired,
  /** Callback ao submeter formulário */
  onSubmit: PropTypes.func.isRequired,
  /** Dados do serviço (para edição) */
  service: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    duration_minutes: PropTypes.number,
    price: PropTypes.number,
    commission_percentage: PropTypes.number,
    category_id: PropTypes.string,
    active: PropTypes.bool,
  }),
  /** ID da unidade (obrigatório) */
  unitId: PropTypes.string.isRequired,
  /** Estado de loading */
  loading: PropTypes.bool,
};
export default ServiceFormModal;
