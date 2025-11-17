/**
 * @file ProductCategoryModal.jsx
 * @description Modal para cadastro e edição de categorias de produtos
 * @module Molecules/ProductCategoryModal
 * @author Andrey Viana
 * @date 14/11/2025
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Tag, FileText, Link } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import {
  useCreateProductCategory,
  useUpdateProductCategory,
  useRevenueCategories,
} from '../../hooks/useProductCategories';
import { useUnit } from '../../context/UnitContext';

/**
 * Modal para cadastro/edição de categoria de produto
 * Permite vincular com categoria de receita (Revenue) como pai
 */
export const ProductCategoryModal = ({ isOpen, onClose, category = null }) => {
  const { selectedUnit } = useUnit();
  const { mutate: createCategory, isLoading: isCreating } =
    useCreateProductCategory();
  const { mutate: updateCategory, isLoading: isUpdating } =
    useUpdateProductCategory();
  const { data: revenueCategories, isLoading: loadingRevenues } =
    useRevenueCategories(selectedUnit?.id);

  // Estado inicial baseado na categoria prop
  const initialFormData = {
    name: category?.name || '',
    description: category?.description || '',
    parent_category_id: category?.parent_category_id || '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Resetar form quando modal abre/fecha
  const resetForm = useCallback(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        parent_category_id: category.parent_category_id || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parent_category_id: '',
      });
    }
    setErrors({});
  }, [category]);

  // Validação do formulário
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter no mínimo 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      parent_category_id: formData.parent_category_id || null,
    };

    if (category?.id) {
      // Editar
      updateCategory(
        { id: category.id, data },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
        }
      );
    } else {
      // Criar
      createCategory(data, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      });
    }
  };

  // Handler de mudança de campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handler de cancelamento
  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="card-theme w-full max-w-2xl animate-fadeIn">
        {/* Header */}
        <div className="border-theme-border flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-theme-primary text-xl font-bold">
                {category ? 'Editar Categoria' : 'Nova Categoria de Produto'}
              </h2>
              <p className="text-theme-muted text-sm">
                {category
                  ? 'Atualizar informações da categoria'
                  : 'Cadastrar nova categoria para produtos'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-theme-muted hover:text-theme-primary rounded-lg p-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Nome da Categoria */}
          <div>
            <label className="text-theme-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Nome da Categoria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ex: Produtos de Limpeza, Revenda, Uso Interno..."
              className={`input-theme w-full ${
                errors.name ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              disabled={isLoading}
              maxLength={100}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-theme-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descreva o uso desta categoria..."
              rows={3}
              className="input-theme w-full resize-none"
              disabled={isLoading}
              maxLength={500}
            />
          </div>

          {/* Categoria de Receita Pai */}
          <div>
            <label className="text-theme-primary mb-2 flex items-center gap-2 text-sm font-medium">
              <Link className="h-4 w-4" />
              Vincular com Categoria de Receita (Opcional)
            </label>
            <select
              value={formData.parent_category_id}
              onChange={e => handleChange('parent_category_id', e.target.value)}
              className="input-theme w-full"
              disabled={isLoading || loadingRevenues}
            >
              <option value="">-- Nenhuma --</option>
              {revenueCategories?.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                  {cat.description ? ` - ${cat.description}` : ''}
                </option>
              ))}
            </select>
            <p className="text-theme-muted mt-1 text-xs">
              Vincule produtos desta categoria a uma categoria de receita para
              melhor controle financeiro
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Dica:</strong> Organize suas categorias de forma
              hierárquica. Por exemplo: &ldquo;Produtos de Revenda&rdquo; pode
              ser vinculada à categoria de receita &ldquo;Produtos&rdquo; para
              facilitar relatórios financeiros.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading
                ? 'Salvando...'
                : category
                  ? 'Atualizar Categoria'
                  : 'Criar Categoria'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

ProductCategoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  category: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    parent_category_id: PropTypes.string,
  }),
};

ProductCategoryModal.defaultProps = {
  category: null,
};
