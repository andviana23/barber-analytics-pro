import { useState, useEffect, useCallback, useMemo } from 'react';
import { productsService } from '../services/productsService';
import { useUnit } from '../context/UnitContext';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for managing product data.
 * Fetches, creates, updates, deletes products and manages stock movements for the selected unit.
 */
export const useProducts = (options = {}) => {
  const { selectedUnit } = useUnit();
  const { showToast } = useToast();
  const unitId = selectedUnit?.id;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalStockValue: 0,
  });

  const { includeInactive = false, enableCache = true, filters = {} } = options;

  // Memoize filters to prevent infinite loops
  const memoizedFilters = useMemo(
    () => filters,
    [filters.search, filters.category, filters.brand, filters.lowStock]
  );

  // Cache mechanism
  const cache = useMemo(() => new Map(), []);
  const CACHE_KEY = `products_${unitId}_${includeInactive}_${JSON.stringify(memoizedFilters)}`;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchProducts = useCallback(async () => {
    if (!unitId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    // Check cache
    if (enableCache) {
      const cachedData = cache.get(CACHE_KEY);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        setProducts(cachedData.data.products);
        setStats(cachedData.data.stats);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await productsService.getProducts({
        unitId,
        isActive: includeInactive ? undefined : true,
        search: memoizedFilters.search,
        category: memoizedFilters.category,
        brand: memoizedFilters.brand,
        lowStock: memoizedFilters.lowStock,
      });

      if (fetchError) throw fetchError;

      // Fetch stats
      const { data: statsData, error: statsError } =
        await productsService.getStockStats(unitId);
      if (statsError) {
        console.warn('Erro ao buscar estatísticas:', statsError);
      }

      const currentStats = statsData || {
        totalProducts: data.length,
        totalValue: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalStockValue: 0,
      };

      setProducts(data);
      setStats(currentStats);

      // Update cache
      if (enableCache) {
        cache.set(CACHE_KEY, {
          data: { products: data, stats: currentStats },
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      setError(err.message);
      showToast({
        type: 'error',
        title: 'Erro ao carregar produtos',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    unitId,
    includeInactive,
    enableCache,
    cache,
    showToast,
    CACHE_KEY,
    CACHE_TTL,
    memoizedFilters,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const invalidateCache = useCallback(() => {
    cache.delete(CACHE_KEY);
  }, [cache, CACHE_KEY]);

  const createProduct = useCallback(
    async productData => {
      setLoading(true);
      try {
        const { data, error: createError } =
          await productsService.createProduct({
            ...productData,
            unitId,
          });

        if (createError) throw createError;

        showToast({
          type: 'success',
          title: 'Produto cadastrado',
          message: `${data.name} foi adicionado com sucesso!`,
        });
        invalidateCache();
        await fetchProducts(); // Refetch to update list and stats
        return { success: true, data };
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Erro ao cadastrar produto',
          message: err.message,
        });
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [unitId, showToast, fetchProducts, invalidateCache]
  );

  const updateProduct = useCallback(
    async (id, updateData) => {
      setLoading(true);
      try {
        const { data, error: updateError } =
          await productsService.updateProduct(id, updateData);

        if (updateError) throw updateError;

        showToast({
          type: 'success',
          title: 'Produto atualizado',
          message: `${data.name} foi atualizado com sucesso!`,
        });
        invalidateCache();
        await fetchProducts(); // Refetch to update list and stats
        return { success: true, data };
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Erro ao atualizar produto',
          message: err.message,
        });
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProducts, invalidateCache]
  );

  const toggleProductStatus = useCallback(
    async (id, currentStatus) => {
      setLoading(true);
      try {
        const { data, error: toggleError } =
          await productsService.updateProduct(id, { isActive: !currentStatus });

        if (toggleError) throw toggleError;

        showToast({
          type: 'success',
          title: `Produto ${!currentStatus ? 'ativado' : 'desativado'}`,
          message: `${data.name} foi ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
        });
        invalidateCache();
        await fetchProducts();
        return { success: true, data };
      } catch (err) {
        showToast({
          type: 'error',
          title: `Erro ao ${!currentStatus ? 'ativar' : 'desativar'} produto`,
          message: err.message,
        });
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProducts, invalidateCache]
  );

  const deleteProduct = useCallback(
    async id => {
      setLoading(true);
      try {
        const { error: deleteError } = await productsService.deleteProduct(id);

        if (deleteError) throw deleteError;

        showToast({
          type: 'success',
          title: 'Produto excluído',
          message: 'Produto excluído com sucesso!',
        });
        invalidateCache();
        await fetchProducts();
        return { success: true };
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Erro ao excluir produto',
          message: err.message,
        });
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProducts, invalidateCache]
  );

  const createStockMovement = useCallback(
    async movementData => {
      setLoading(true);
      try {
        const { data, error: movementError } =
          await productsService.createProductMovement({
            ...movementData,
            unitId,
          });

        if (movementError) throw movementError;

        showToast({
          type: 'success',
          title: 'Movimentação registrada',
          message: 'Movimentação de estoque registrada com sucesso!',
        });
        invalidateCache();
        await fetchProducts(); // Refetch to update stock
        return { success: true, data };
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Erro ao registrar movimentação',
          message: err.message,
        });
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [unitId, showToast, fetchProducts, invalidateCache]
  );

  const getProductMovements = useCallback(async (productId, filters = {}) => {
    try {
      const { data, error } = await productsService.getProductMovements(
        productId,
        filters
      );
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }, []);

  const getProductCategories = useCallback(async () => {
    try {
      const { data, error } =
        await productsService.getProductCategories(unitId);
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }, [unitId]);

  const getProductBrands = useCallback(async () => {
    try {
      const { data, error } = await productsService.getProductBrands(unitId);
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }, [unitId]);

  return {
    products,
    loading,
    error,
    stats,
    fetchProducts,
    createProduct,
    updateProduct,
    toggleProductStatus,
    deleteProduct,
    createStockMovement,
    getProductMovements,
    getProductCategories,
    getProductBrands,
  };
};
