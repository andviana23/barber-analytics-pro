import { useState, useEffect, useCallback } from 'react';
import { categoriesService } from '../services/categoriesService';

// Cache simples para evitar requests desnecessários
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // Cache de 5 minutos

/**
 * Hook para gerenciar categorias com cache
 * @param {string} unitId - ID da unidade
 * @param {string} categoryType - Tipo da categoria ('Revenue' ou 'Expense')
 * @param {boolean} includeInactive - Se deve incluir categorias inativas
 * @param {boolean} enableCache - Se deve usar cache
 */
export const useCategories = (
  unitId,
  categoryType,
  includeInactive = false,
  enableCache = true
) => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null,
    stats: {
      total: 0,
      active: 0,
      inactive: 0,
      revenue: 0,
      expense: 0,
    },
  });

  const cacheKey = `${unitId}-${categoryType}-${includeInactive}`;

  /**
   * Calcular estatísticas das categorias
   */
  const calculateStats = useCallback(categories => {
    if (!categories || categories.length === 0) {
      return { total: 0, active: 0, inactive: 0, revenue: 0, expense: 0 };
    }

    return {
      total: categories.length,
      active: categories.filter(c => c.is_active).length,
      inactive: categories.filter(c => !c.is_active).length,
      revenue: categories.filter(c => c.category_type === 'Revenue').length,
      expense: categories.filter(c => c.category_type === 'Expense').length,
    };
  }, []);

  /**
   * Buscar categorias do servidor
   */
  const fetchCategories = useCallback(async () => {
    // Validação básica
    if (!unitId) {
      setState({
        data: [],
        loading: false,
        error: null,
        stats: { total: 0, active: 0, inactive: 0, revenue: 0, expense: 0 },
      });
      return;
    }

    // Verificar cache
    if (enableCache) {
      const cached = cache[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setState({ ...cached.data, loading: false });
        return;
      }
    }

    // Buscar do servidor
    setState(prev => ({ ...prev, loading: true, error: null }));

    const filters = {
      unit_id: unitId,
      is_active: includeInactive ? undefined : true,
    };

    if (categoryType) {
      filters.category_type = categoryType;
    }

    const { data, error } = await categoriesService.getCategories(filters);

    if (error) {
      setState({
        loading: false,
        error,
        data: [],
        stats: { total: 0, active: 0, inactive: 0, revenue: 0, expense: 0 },
      });
      return;
    }

    const stats = calculateStats(data);
    const newState = { data: data || [], stats, loading: false, error: null };

    setState(newState);

    if (enableCache) {
      cache[cacheKey] = {
        data: { data: data || [], stats },
        timestamp: Date.now(),
      };
    }
  }, [
    unitId,
    categoryType,
    includeInactive,
    enableCache,
    cacheKey,
    calculateStats,
  ]);

  // Efeito para buscar categorias quando os parâmetros mudarem
  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      if (mounted) {
        await fetchCategories();
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, [fetchCategories]);

  /**
   * Criar nova categoria
   */
  const createCategory = useCallback(
    async data => {
      const result = await categoriesService.createCategory(data);
      if (!result.error) {
        // Invalidar cache
        delete cache[cacheKey];
        await fetchCategories();
      }
      return result;
    },
    [cacheKey, fetchCategories]
  );

  /**
   * Atualizar categoria
   */
  const updateCategory = useCallback(
    async (id, data) => {
      const result = await categoriesService.updateCategory(id, data);
      if (!result.error) {
        // Invalidar cache
        delete cache[cacheKey];
        await fetchCategories();
      }
      return result;
    },
    [cacheKey, fetchCategories]
  );

  /**
   * Excluir categoria
   */
  const deleteCategory = useCallback(
    async id => {
      const result = await categoriesService.deleteCategory(id);
      if (!result.error) {
        // Invalidar cache
        delete cache[cacheKey];
        await fetchCategories();
      }
      return result;
    },
    [cacheKey, fetchCategories]
  );

  /**
   * Reativar categoria
   */
  const reactivateCategory = useCallback(
    async id => {
      const result = await categoriesService.reactivateCategory(id);
      if (!result.error) {
        // Invalidar cache
        delete cache[cacheKey];
        await fetchCategories();
      }
      return result;
    },
    [cacheKey, fetchCategories]
  );

  return {
    ...state,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reactivateCategory,
  };
};

/**
 * Hook para buscar árvore hierárquica de categorias
 */
export const useCategoryTree = (unitId, categoryType) => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchTree = async () => {
      if (!unitId || !categoryType) {
        setState({ data: [], loading: false, error: null });
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await categoriesService.getCategoryTree(
        unitId,
        categoryType
      );

      setState({
        data: data || [],
        loading: false,
        error,
      });
    };

    fetchTree();
  }, [unitId, categoryType]);

  return state;
};
