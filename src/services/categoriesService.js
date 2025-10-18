import { categoryRepository } from '../repositories/categoryRepository';

/**
 * Service para gerenciar categorias com validações de negócio
 */
export const categoriesService = {
  /**
   * Buscar categorias com filtros
   */
  async getCategories(filters = {}) {
    return await categoryRepository.findAll(filters);
  },

  /**
   * Buscar categoria por ID
   */
  async getCategoryById(id) {
    return await categoryRepository.findById(id);
  },

  /**
   * Buscar árvore hierárquica de categorias
   */
  async getCategoryTree(unitId, categoryType) {
    return await categoryRepository.findTree(unitId, categoryType);
  },

  /**
   * Criar nova categoria com validações
   */
  async createCategory(categoryData) {
    try {
      // Validação 1: Campos obrigatórios
      if (!categoryData.unit_id) {
        return { data: null, error: 'ID da unidade é obrigatório' };
      }

      if (!categoryData.name || categoryData.name.trim().length < 2) {
        return { data: null, error: 'Nome deve ter pelo menos 2 caracteres' };
      }

      if (!categoryData.category_type) {
        return { data: null, error: 'Tipo de categoria é obrigatório' };
      }

      if (!['Revenue', 'Expense'].includes(categoryData.category_type)) {
        return { data: null, error: 'Tipo de categoria inválido' };
      }

      // Validação 2: Parent deve ser do mesmo tipo
      if (categoryData.parent_id) {
        const { data: parent, error: parentError } =
          await categoryRepository.findById(categoryData.parent_id);

        if (parentError || !parent) {
          return { data: null, error: 'Categoria pai não encontrada' };
        }

        if (parent.category_type !== categoryData.category_type) {
          return {
            data: null,
            error: 'Categoria pai deve ser do mesmo tipo (Receita/Despesa)',
          };
        }

        if (!parent.is_active) {
          return { data: null, error: 'Categoria pai deve estar ativa' };
        }

        if (parent.parent_id) {
          return {
            data: null,
            error: 'Apenas categorias principais podem ser pais',
          };
        }
      }

      // Preparar dados para criação
      const dataToCreate = {
        unit_id: categoryData.unit_id,
        name: categoryData.name.trim(),
        description: categoryData.description?.trim() || null,
        category_type: categoryData.category_type,
        parent_id: categoryData.parent_id || null,
        is_active: true,
      };

      // Criação
      return await categoryRepository.create(dataToCreate);
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Atualizar categoria com validações
   */
  async updateCategory(id, categoryData) {
    try {
      // Buscar categoria atual
      const { data: currentCategory, error: fetchError } =
        await categoryRepository.findById(id);

      if (fetchError || !currentCategory) {
        return { data: null, error: 'Categoria não encontrada' };
      }

      // Validação de nome
      if (categoryData.name !== undefined) {
        if (!categoryData.name || categoryData.name.trim().length < 2) {
          return { data: null, error: 'Nome deve ter pelo menos 2 caracteres' };
        }
      }

      // Validação de parent
      if (
        categoryData.parent_id !== undefined &&
        categoryData.parent_id !== null
      ) {
        const { data: parent, error: parentError } =
          await categoryRepository.findById(categoryData.parent_id);

        if (parentError || !parent) {
          return { data: null, error: 'Categoria pai não encontrada' };
        }

        if (parent.category_type !== currentCategory.category_type) {
          return {
            data: null,
            error: 'Categoria pai deve ser do mesmo tipo',
          };
        }

        if (!parent.is_active) {
          return { data: null, error: 'Categoria pai deve estar ativa' };
        }

        if (parent.parent_id) {
          return {
            data: null,
            error: 'Apenas categorias principais podem ser pais',
          };
        }
      }

      // Preparar dados para atualização
      const dataToUpdate = {};

      if (categoryData.name !== undefined) {
        dataToUpdate.name = categoryData.name.trim();
      }

      if (categoryData.description !== undefined) {
        dataToUpdate.description = categoryData.description?.trim() || null;
      }

      if (categoryData.parent_id !== undefined) {
        dataToUpdate.parent_id = categoryData.parent_id;
      }

      if (categoryData.is_active !== undefined) {
        dataToUpdate.is_active = categoryData.is_active;
      }

      dataToUpdate.updated_at = new Date().toISOString();

      // Atualização
      return await categoryRepository.update(id, dataToUpdate);
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Excluir categoria (soft delete) com validações
   */
  async deleteCategory(id) {
    try {
      // Validação: Não pode excluir se tem subcategorias ativas
      const { data: subcategories, error: subError } =
        await categoryRepository.findAll({
          parent_id: id,
          is_active: true,
        });

      if (subError) {
        return { data: null, error: 'Erro ao verificar subcategorias' };
      }

      if (subcategories && subcategories.length > 0) {
        return {
          data: null,
          error: 'Não é possível excluir categoria com subcategorias ativas',
        };
      }

      return await categoryRepository.delete(id);
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Reativar categoria
   */
  async reactivateCategory(id) {
    try {
      return await categoryRepository.update(id, {
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      return { data: null, error: err.message };
    }
  },
};
