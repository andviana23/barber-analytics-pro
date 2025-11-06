/**
 * CATEGORY MODAL
 * Modal para criar/editar categorias financeiras
 *
 * Campos:
 * - Nome (ex: Corte de Cabelo, Aluguel)
 * - Tipo (Receita/Despesa)
 * - Categoria Pai (opcional - para hierarquia)
 * - Descrição (opcional)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FolderTree,
  TrendingUp,
  TrendingDown,
  Save,
  AlertCircle,
  Building2,
  FileText,
} from 'lucide-react';
import { useUnit } from '../../context/UnitContext';
import { useCategories } from '../../hooks/useCategories';
const CategoryModal = ({ isOpen, onClose, onSave, category = null }) => {
  const { selectedUnit } = useUnit();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_type: 'Revenue',
    parent_id: '',
    unit_id: '',
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Buscar categorias disponíveis para serem pais
  const { data: availableCategories, refetch: refetchCategories } =
    useCategories(
      formData.unit_id || selectedUnit?.id,
      formData.category_type,
      false,
      // apenas ativas
      false // desabilitar cache para sempre buscar dados atualizados
    );

  // Filtrar apenas categorias principais (sem pai) para serem opções de pai
  const parentOptions = useMemo(() => {
    if (!availableCategories) return [];
    return availableCategories.filter(cat => {
      // Não pode ser pai de si mesmo
      if (category && cat.id === category.id) return false;

      // Apenas categorias principais (sem pai) podem ser pais
      return !cat.parent_id;
    });
  }, [availableCategories, category]);

  // Preencher formulário ao editar
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        category_type: category.category_type || 'Revenue',
        parent_id: category.parent_id || '',
        unit_id: category.unit_id || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_type: 'Revenue',
        parent_id: '',
        unit_id: selectedUnit?.id || '',
      });
    }
    setErrors({});
  }, [category, isOpen, selectedUnit]);

  // Buscar categorias quando o modal abrir ou tipo mudar
  useEffect(() => {
    if (isOpen && refetchCategories) {
      refetchCategories();
    }
  }, [isOpen, formData.category_type, refetchCategories]);

  // Validação
  const validate = () => {
    const newErrors = {};
    if (!formData.unit_id) {
      newErrors.unit_id = 'Unidade é obrigatória';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }
    if (!formData.category_type) {
      newErrors.category_type = 'Tipo é obrigatório';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Se mudar o tipo, limpar categoria pai
    if (field === 'category_type') {
      setFormData(prev => ({
        ...prev,
        parent_id: '',
      }));
    }

    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        unit_id: formData.unit_id,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_type: formData.category_type,
        parent_id: formData.parent_id || null,
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Erro ao salvar categoria',
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card-theme w-full max-w-md rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-light-border p-6 dark:border-dark-border">
          <h2 className="text-theme-primary text-xl font-bold">
            {category ? 'Editar' : 'Nova'} Categoria
          </h2>
          <button
            onClick={onClose}
            className="hover:text-theme-primary text-text-light-secondary transition-colors dark:text-text-dark-secondary"
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* Nome */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Nome da Categoria *
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Ex: Corte de Cabelo, Aluguel..."
              className={`input-theme ${errors.name ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="mt-1 flex items-center gap-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tipo *
              </div>
            </label>
            <select
              value={formData.category_type}
              onChange={e => handleChange('category_type', e.target.value)}
              className={`input-theme ${errors.category_type ? 'border-feedback-light-error dark:border-feedback-dark-error' : ''}`}
              disabled={isSaving || !!category} // Não pode alterar tipo ao editar
            >
              <option value="Revenue">Receita</option>
              <option value="Expense">Despesa</option>
            </select>
            {category && (
              <p className="text-theme-secondary mt-1 text-xs">
                Não é possível alterar o tipo de uma categoria existente
              </p>
            )}
            {errors.category_type && (
              <p className="mt-1 flex items-center gap-1 text-sm text-feedback-light-error dark:text-feedback-dark-error">
                <AlertCircle className="h-3 w-3" />
                {errors.category_type}
              </p>
            )}
          </div>

          {/* Categoria Pai (opcional) */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Categoria Pai (opcional)
              </div>
            </label>
            <select
              value={formData.parent_id}
              onChange={e => handleChange('parent_id', e.target.value)}
              className="input-theme"
              disabled={isSaving}
            >
              <option value="">Categoria Principal (sem pai)</option>
              {parentOptions.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <p className="text-theme-secondary mt-1 text-xs">
              Categorias pai servem para agrupar subcategorias relacionadas
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-theme-primary mb-2 block text-sm font-medium">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descrição (opcional)
              </div>
            </label>
            <textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descreva o propósito desta categoria..."
              rows={3}
              className="input-theme resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Erro de submit */}
          {errors.submit && (
            <div className="rounded-lg border border-feedback-light-error/20 bg-feedback-light-error/10 p-3 dark:border-feedback-dark-error/50 dark:bg-feedback-dark-error/20">
              <p className="flex items-center gap-2 text-sm text-feedback-light-error dark:text-feedback-dark-error">
                <AlertCircle className="h-4 w-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="text-theme-primary flex-1 rounded-lg border border-light-border px-4 py-2 transition-colors hover:bg-light-bg dark:border-dark-border dark:hover:bg-dark-hover"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-dark-text-primary flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-surface border-t-transparent dark:border-dark-surface" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {category ? 'Atualizar' : 'Criar'} Categoria
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CategoryModal;
