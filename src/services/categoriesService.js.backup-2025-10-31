import { categoryRepository } from '../repositories/categoryRepository';

/**
 * CategoriesService - Service para gerenciar categorias financeiras
 *
 * Responsabilidades:
 * - Buscar categorias com filtros
 * - Fornecer operações de CRUD delegando ao Repository
 * - Construir árvore hierárquica via Repository
 * - Utilitários específicos (ex.: receitas por tipo)
 */
class CategoriesService {
  /**
   * Buscar categorias com filtros
   * @param {Object} filters
   * @param {string} [filters.unit_id]
   * @param {string} [filters.category_type] - 'Revenue' | 'Expense'
   * @param {string|null} [filters.parent_id]
   * @param {boolean} [filters.is_active]
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async getCategories(filters = {}) {
    try {
      const { data, error } = await categoryRepository.findAll(filters);
      if (error) return { data: null, error };
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Buscar subcategorias de receitas derivadas de categorias-pai específicas
   * Pais considerados: 'Receita de Serviço' | 'Receita de Servico' | 'Receita Produtos'
   * @returns {Promise<Array>} Lista de subcategorias de receitas enriquecidas com revenue_type
   */
  async getRevenueCategories() {
    try {
      const { data: allRevenue, error } = await categoryRepository.findAll({
        category_type: 'Revenue',
        is_active: true,
      });
      if (error) throw new Error(error);

      if (!allRevenue || allRevenue.length === 0) return [];

      const parentNames = new Set([
        'Receita de Serviço',
        'Receita de Servico',
        'Receita Produtos',
      ]);

      const parents = allRevenue.filter(
        c => !c.parent_id && c.name && parentNames.has(String(c.name).trim())
      );
      if (parents.length === 0) return [];

      const parentIds = new Set(parents.map(p => p.id));
      const parentById = new Map(parents.map(p => [p.id, p]));

      return allRevenue
        .filter(c => c.parent_id && parentIds.has(c.parent_id))
        .map(cat => ({
          ...cat,
          parent: parentById.get(cat.parent_id) || null,
          revenue_type:
            (parentById.get(cat.parent_id)?.name || '') === 'Receita Produtos'
              ? 'product'
              : 'service',
        }));
    } catch (err) {
      throw new Error(err.message || 'Erro ao buscar categorias de receitas');
    }
  }

  /**
   * Buscar categorias de despesas ativas
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async getExpenseCategories() {
    return this.getCategories({ category_type: 'Expense', is_active: true });
  }

  /**
   * Buscar categoria por ID (retorna objeto ou null)
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getCategoryById(id) {
    try {
      const { data, error } = await categoryRepository.findById(id);
      if (error) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  /**
   * Criar nova categoria
   * @param {Object} data
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async createCategory(data) {
    try {
      const { data: created, error } = await categoryRepository.create(data);
      return { data: created || null, error };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Atualizar categoria
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateCategory(id, updates) {
    try {
      const { data, error } = await categoryRepository.update(id, updates);
      return { data: data || null, error };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Soft delete (desativar) categoria
   * @param {string} id
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async deleteCategory(id) {
    try {
      const { data, error } = await categoryRepository.delete(id);
      return { data: data || null, error };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Reativar categoria
   * @param {string} id
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async reactivateCategory(id) {
    try {
      const { data, error } = await categoryRepository.update(id, {
        is_active: true,
      });
      return { data: data || null, error };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Obter árvore hierárquica de categorias
   * @param {string} unitId
   * @param {string} categoryType - 'Revenue' | 'Expense'
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async getCategoryTree(unitId, categoryType) {
    try {
      const { data, error } = await categoryRepository.findTree(
        unitId,
        categoryType
      );
      return { data: data || [], error };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }
}

export default new CategoriesService();
