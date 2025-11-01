import { supabase } from '../services/supabase';

/**
 * Repository pattern para operações de categorias
 */
export const categoryRepository = {
  /**
   * Buscar todas as categorias com filtros
   */
  async findAll(filters = {}) {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id);
      }

      if (filters.category_type) {
        query = query.eq('category_type', filters.category_type);
      }

      if (filters.parent_id !== undefined) {
        query =
          filters.parent_id === null
            ? query.is('parent_id', null)
            : query.eq('parent_id', filters.parent_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Buscar categoria por ID
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Criar nova categoria
   */
  async create(categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Atualizar categoria
   */
  async update(id, categoryData) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Excluir categoria (soft delete)
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  },

  /**
   * Construir árvore hierárquica
   */
  async findTree(unit_id, category_type) {
    const { data: categories, error } = await this.findAll({
      unit_id,
      category_type,
      is_active: true,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: this.buildTree(categories), error: null };
  },

  /**
   * Transformar lista plana em estrutura de árvore
   */
  buildTree(categories) {
    if (!categories || categories.length === 0) {
      return [];
    }

    const categoryMap = new Map();
    const roots = [];

    // Primeiro criar todos os nós
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Depois construir a hierarquia
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },
};
