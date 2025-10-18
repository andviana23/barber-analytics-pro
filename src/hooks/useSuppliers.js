/**
 * Custom Hook: useSuppliers
 *
 * Hook para gerenciar fornecedores (parties tipo 'Fornecedor')
 * Segue padrão DDD + Clean Architecture
 *
 * Features:
 * - Listagem com filtros e busca
 * - CRUD completo (create, update, delete)
 * - Cache com TTL
 * - Estados de loading e erro
 * - Validações
 */

import { useState, useEffect, useCallback } from 'react';
import { PartiesService } from '../services/partiesService';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let cachedSuppliers = null;
let cacheTimestamp = 0;

const useSuppliers = (unitId, options = {}) => {
  const {
    enableCache = true,
    enableRealtime = false,
    includeInactive = false,
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  /**
   * Buscar fornecedores
   */
  const fetchSuppliers = useCallback(
    async (forceRefresh = false) => {
      // Verificar cache
      const now = Date.now();
      const isCacheValid =
        enableCache &&
        cachedSuppliers &&
        now - cacheTimestamp < CACHE_TTL &&
        !forceRefresh;

      if (isCacheValid) {
        setData(cachedSuppliers);
        setLoading(false);
        calculateStats(cachedSuppliers);
        return;
      }

      if (!unitId) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: suppliers, error: fetchError } =
          await PartiesService.getParties({
            unitId,
            tipo: 'Fornecedor',
            isActive: !includeInactive, // Se includeInactive=false, busca apenas ativos
          });

        if (fetchError) {
          setError(fetchError);
          setData([]);
        } else {
          const sortedData = suppliers || [];
          setData(sortedData);

          // Atualizar cache
          if (enableCache) {
            cachedSuppliers = sortedData;
            cacheTimestamp = Date.now();
          }

          calculateStats(sortedData);
        }
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [unitId, includeInactive, enableCache]
  );

  /**
   * Calcular estatísticas
   */
  const calculateStats = useCallback(suppliers => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.is_active).length;
    const inactive = total - active;

    setStats({ total, active, inactive });
  }, []);

  /**
   * Criar fornecedor
   */
  const createSupplier = useCallback(
    async supplierData => {
      try {
        const result = await PartiesService.createParty({
          ...supplierData,
          unit_id: unitId,
          tipo: 'Fornecedor',
        });

        if (!result.error) {
          // Invalidar cache e refetch
          cachedSuppliers = null;
          await fetchSuppliers(true);
        }

        return result;
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    [unitId, fetchSuppliers]
  );

  /**
   * Atualizar fornecedor
   */
  const updateSupplier = useCallback(
    async (id, supplierData) => {
      try {
        const result = await PartiesService.updateParty(id, supplierData);

        if (!result.error) {
          // Invalidar cache e refetch
          cachedSuppliers = null;
          await fetchSuppliers(true);
        }

        return result;
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    [fetchSuppliers]
  );

  /**
   * Deletar fornecedor (soft delete)
   */
  const deleteSupplier = useCallback(
    async id => {
      try {
        const result = await PartiesService.deleteParty(id);

        if (!result.error) {
          // Invalidar cache e refetch
          cachedSuppliers = null;
          await fetchSuppliers(true);
        }

        return result;
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    [fetchSuppliers]
  );

  /**
   * Ativar fornecedor
   */
  const activateSupplier = useCallback(
    async id => {
      try {
        const result = await PartiesService.activateParty(id);

        if (!result.error) {
          // Invalidar cache e refetch
          cachedSuppliers = null;
          await fetchSuppliers(true);
        }

        return result;
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    [fetchSuppliers]
  );

  /**
   * Buscar fornecedor específico por ID
   */
  const getSupplierById = useCallback(async id => {
    try {
      return await PartiesService.getPartyById(id);
    } catch (err) {
      return { data: null, error: err.message };
    }
  }, []);

  // Effect inicial
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    data,
    loading,
    error,
    stats,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    activateSupplier,
    getSupplierById,
  };
};

export default useSuppliers;
