/**
 * CATEGORIES PAGE - REFATORADA
 * Página para gerenciamento de categorias financeiras
 * Design inspirado em interface limpa e intuitiva
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader,
} from 'lucide-react';
import { Layout } from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useUnit } from '../../context/UnitContext';
import { useToast } from '../../context/ToastContext';
import { useCategories } from '../../hooks/useCategories';
import CategoryModal from '../../molecules/CategoryModal/CategoryModal';
const CategoriesPage = () => {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalType, setModalType] = useState('Revenue'); // Tipo ao criar nova categoria
  const [deletingId, setDeletingId] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Buscar categorias de receita e despesa
  const {
    data: revenueCategories,
    loading: loadingRevenue,
    createCategory: createRevenue,
    updateCategory: updateRevenue,
    deleteCategory: deleteRevenue,
    reactivateCategory: reactivateRevenue,
  } = useCategories(selectedUnit?.id, 'Revenue', false, false);
  const {
    data: expenseCategories,
    loading: loadingExpense,
    createCategory: createExpense,
    updateCategory: updateExpense,
    deleteCategory: deleteExpense,
    reactivateCategory: reactivateExpense,
  } = useCategories(selectedUnit?.id, 'Expense', false, false);

  // Verificar permissões
  const canManage = useMemo(() => {
    return ['admin', 'gerente'].includes(user?.user_metadata?.role);
  }, [user]);

  // Organizar categorias em hierarquia
  const organizeCategories = categories => {
    if (!categories) return [];
    const mainCategories = categories.filter(cat => !cat.parent_id);
    return mainCategories.map(main => ({
      ...main,
      subcategories: categories.filter(cat => cat.parent_id === main.id),
    }));
  };
  const revenueHierarchy = useMemo(
    () => organizeCategories(revenueCategories),
    [revenueCategories]
  );
  const expenseHierarchy = useMemo(
    () => organizeCategories(expenseCategories),
    [expenseCategories]
  );

  // Handlers
  const handleCreateCategory = type => {
    if (!canManage) {
      showToast('Você não tem permissão para criar categorias', 'error');
      return;
    }
    setModalType(type);
    setSelectedCategory(null);
    setIsModalOpen(true);
  };
  const handleEditCategory = category => {
    if (!canManage) {
      showToast('Você não tem permissão para editar categorias', 'error');
      return;
    }
    setSelectedCategory(category);
    setIsModalOpen(true);
  };
  const handleSaveCategory = async data => {
    try {
      let result;
      const isRevenue =
        (selectedCategory?.category_type || modalType) === 'Revenue';
      if (selectedCategory) {
        // Atualizar
        result = isRevenue
          ? await updateRevenue(selectedCategory.id, data)
          : await updateExpense(selectedCategory.id, data);
      } else {
        // Criar
        result = isRevenue
          ? await createRevenue(data)
          : await createExpense(data);
      }
      if (result.error) {
        showToast(result.error, 'error');
        throw new Error(result.error);
      } else {
        showToast(
          selectedCategory ? 'Categoria atualizada!' : 'Categoria criada!',
          'success'
        );
      }
    } catch (error) {
      throw error;
    }
  };
  const handleDeleteCategory = async category => {
    if (!canManage) {
      showToast('Você não tem permissão para excluir categorias', 'error');
      return;
    }
    if (!window.confirm(`Deseja desativar a categoria "${category.name}"?`)) {
      return;
    }
    setDeletingId(category.id);
    const isRevenue = category.category_type === 'Revenue';
    const result = isRevenue
      ? await deleteRevenue(category.id)
      : await deleteExpense(category.id);
    setDeletingId(null);
    if (result.error) {
      showToast(result.error, 'error');
    } else {
      showToast('Categoria desativada com sucesso!', 'success');
    }
  };
  const toggleExpanded = categoryId => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Renderizar linha de categoria
  const renderCategoryRow = (category, isSubcategory = false) => {
    const isDeleting = deletingId === category.id;
    const hasSubcategories =
      category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    return (
      <div key={category.id}>
        {/* Categoria Principal/Subcategoria */}
        <div
          className={`flex items-center justify-between px-4 py-3 hover:bg-light-hover dark:hover:bg-dark-hover transition-colors border-b border-light-border dark:border-dark-border ${isSubcategory ? 'pl-12 bg-light-bg dark:bg-dark-bg' : ''}`}
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Botão de expandir (apenas para categorias com filhas) */}
            {!isSubcategory && hasSubcategories ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-light-hover dark:hover:bg-dark-hover rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Nome da categoria */}
            <div className="flex-1">
              <div className="font-medium text-text-light-primary dark:text-text-dark-primary">
                {category.name}
              </div>
              {category.description && (
                <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-0.5">
                  {category.description}
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="p-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                title="Editar"
                disabled={isDeleting}
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDeleteCategory(category)}
                className="p-2 text-danger hover:bg-danger/10 dark:hover:bg-danger/20 rounded-lg transition-colors"
                title="Excluir"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Subcategorias (se expandido) */}
        {!isSubcategory && hasSubcategories && isExpanded && (
          <div>
            {category.subcategories.map(sub => renderCategoryRow(sub, true))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar seção de categorias
  const renderSection = (title, hierarchy, loading, type) => {
    return (
      <div className="card-theme rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        {/* Header da seção */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-hover dark:bg-dark-hover">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            {title}
          </h2>
          {canManage && (
            <button
              onClick={() => handleCreateCategory(type)}
              className="flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-dark-text-primary rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova categoria de {type === 'Revenue' ? 'receita' : 'despesa'}
            </button>
          )}
        </div>

        {/* Lista de categorias - SEM scroll individual */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="text-center py-12 text-text-light-secondary dark:text-text-dark-secondary">
              <p>Nenhuma categoria cadastrada</p>
              {canManage && (
                <button
                  onClick={() => handleCreateCategory(type)}
                  className="mt-4 text-primary hover:text-primary-600 dark:text-primary-400 font-medium"
                >
                  Criar primeira categoria
                </button>
              )}
            </div>
          ) : (
            <div>{hierarchy.map(category => renderCategoryRow(category))}</div>
          )}
        </div>
      </div>
    );
  };
  return (
    <Layout activeMenuItem="cadastros">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Categorias Financeiras
          </h1>
          <p className="text-text-light-secondary dark:text-text-dark-secondary mt-1">
            Gerencie as categorias de receitas e despesas da sua unidade
          </p>
        </div>

        {/* Seções de Categorias */}
        <div className="space-y-6">
          {/* Categorias de Receita */}
          {renderSection(
            'Categorias de receita',
            revenueHierarchy,
            loadingRevenue,
            'Revenue'
          )}

          {/* Categorias de Despesa */}
          {renderSection(
            'Categorias de despesa',
            expenseHierarchy,
            loadingExpense,
            'Expense'
          )}
        </div>
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
      />
    </Layout>
  );
};
export default CategoriesPage;
