/**
 * HOOK: useUnits
 * 
 * Hook customizado para gerenciamento de estado das unidades
 * Fornece todas as operações CRUD e cache local
 */

import { useState, useCallback, useEffect } from 'react';
import { unitsService } from '../services';
import { useToast } from '../context';

export const useUnits = (initialLoad = true) => {
  // Estado principal
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados específicos para operações
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cache local
  const [lastFetch, setLastFetch] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { showToast } = useToast();

  /**
   * Carregar lista de unidades
   */
  const loadUnits = useCallback(async (forceRefresh = false, includeInactiveUnits = false) => {
    // Verificar cache (5 minutos)
    const cacheTime = 5 * 60 * 1000;
    const now = new Date().getTime();
    
    if (!forceRefresh && lastFetch && (now - lastFetch) < cacheTime && includeInactiveUnits === includeInactive) {
      return units;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await unitsService.getUnits(includeInactiveUnits);
      
      setUnits(data);
      setLastFetch(now);
      setIncludeInactive(includeInactiveUnits);

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao carregar unidades';
      setError(errorMessage);
      showToast({ type: 'error', message: 'Erro ao carregar unidades', description: errorMessage });
      return [];
    } finally {
      setLoading(false);
    }
  }, [units, lastFetch, includeInactive, showToast]);

  /**
   * Buscar unidade por ID
   */
  const getUnit = useCallback(async (id) => {
    try {
      // Verificar cache local primeiro
      const cachedUnit = units.find(unit => unit.id === id);
      if (cachedUnit) {
        return cachedUnit;
      }

      // Buscar no servidor
      const unit = await unitsService.getUnitById(id);
      return unit;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar unidade';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [units]);

  /**
   * Criar nova unidade
   */
  const createUnit = useCallback(async (unitData) => {
    try {
      setCreating(true);
      setError(null);

      const newUnit = await unitsService.createUnit(unitData);

      // Atualizar cache local
      setUnits(prevUnits => [newUnit, ...prevUnits]);

      showToast({ type: 'success', message: 'Unidade criada com sucesso!' });
      return newUnit;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao criar unidade';
      setError(errorMessage);
      showToast({ type: 'error', message: 'Erro ao criar unidade', description: errorMessage });
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [showToast]);

  /**
   * Atualizar unidade
   */
  const updateUnit = useCallback(async (id, updateData) => {
    try {
      setUpdating(true);
      setError(null);

      const updatedUnit = await unitsService.updateUnit(id, updateData);

      // Atualizar cache local
      setUnits(prevUnits =>
        prevUnits.map(unit =>
          unit.id === id ? updatedUnit : unit
        )
      );

      showToast({ type: 'success', message: 'Unidade atualizada com sucesso!' });
      return updatedUnit;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao atualizar unidade';
      setError(errorMessage);
      showToast({ type: 'error', message: 'Erro ao atualizar unidade', description: errorMessage });
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [showToast]);

  /**
   * Alternar status da unidade
   */
  const toggleUnitStatus = useCallback(async (id) => {
    try {
      setUpdating(true);
      setError(null);

      const updatedUnit = await unitsService.toggleUnitStatus(id);

      // Atualizar cache local
      setUnits(prevUnits =>
        prevUnits.map(unit =>
          unit.id === id ? updatedUnit : unit
        )
      );

      const statusText = updatedUnit.status ? 'ativada' : 'desativada';
      showToast({ type: 'success', message: `Unidade ${statusText} com sucesso!` });

      return updatedUnit;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao alterar status';
      setError(errorMessage);
      showToast({ type: 'error', message: 'Erro ao alterar status', description: errorMessage });
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [showToast]);

  /**
   * Excluir unidade
   */
  const deleteUnit = useCallback(async (id) => {
    try {
      setDeleting(true);
      setError(null);

      await unitsService.deleteUnit(id);

      // Remover do cache local ou atualizar se soft delete
      await loadUnits(true, includeInactive);

      showToast({ type: 'success', message: 'Unidade excluída com sucesso!' });
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao excluir unidade';
      setError(errorMessage);
      showToast({ type: 'error', message: 'Erro ao excluir unidade', description: errorMessage });
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [showToast, loadUnits, includeInactive]);

  /**
   * Verificar dependências da unidade
   */
  const checkDependencies = useCallback(async (id) => {
    try {
      const dependencies = await unitsService.checkUnitDependencies(id);
      return dependencies;
    } catch (err) {
      return { hasDependencies: false, dependencies: [], unitName: 'Unidade' };
    }
  }, []);

  /**
   * Obter estatísticas da unidade
   */
  const getUnitStats = useCallback(async (unitId, month = null, year = null) => {
    try {
      const stats = await unitsService.getUnitStats(unitId, month, year);
      return stats;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar estatísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Obter comparativo entre unidades
   */
  const getUnitsComparison = useCallback(async (month = null, year = null) => {
    try {
      setLoading(true);
      const comparison = await unitsService.getUnitsComparison(month, year);
      return comparison;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao gerar comparativo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obter ranking de unidades
   */
  const getUnitsRanking = useCallback(async (metric = 'revenue', month = null, year = null) => {
    try {
      setLoading(true);
      const ranking = await unitsService.getUnitsRanking(metric, month, year);
      return ranking;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao gerar ranking';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obter evolução da unidade
   */
  const getUnitEvolution = useCallback(async (unitId) => {
    try {
      setLoading(true);
      const evolution = await unitsService.getUnitEvolution(unitId);
      return evolution;
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar evolução';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh - forçar recarregamento
   */
  const refresh = useCallback(async () => {
    await loadUnits(true, includeInactive);
  }, [loadUnits, includeInactive]);

  // Carregar unidades na inicialização
  useEffect(() => {
    if (initialLoad) {
      loadUnits();
    }
  }, [initialLoad, loadUnits]);

  // Dados computados
  const activeUnits = units.filter(unit => unit.status);
  const inactiveUnits = units.filter(unit => !unit.status);

  const stats = {
    total: units.length,
    active: activeUnits.length,
    inactive: inactiveUnits.length,
    activePercentage: units.length > 0 ? (activeUnits.length / units.length) * 100 : 0
  };

  return {
    // Dados
    units,
    activeUnits,
    inactiveUnits,
    stats,
    
    // Estados
    loading,
    creating,
    updating,
    deleting,
    error,

    // Ações
    loadUnits,
    getUnit,
    createUnit,
    updateUnit,
    toggleUnitStatus,
    deleteUnit,
    checkDependencies,
    refresh,

    // Estatísticas e relatórios
    getUnitStats,
    getUnitsComparison,
    getUnitsRanking,
    getUnitEvolution
  };
};