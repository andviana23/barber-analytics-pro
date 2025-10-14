/**
 * UNIT CONTEXT
 * 
 * Contexto global para gerenciamento da unidade selecionada
 * Permite filtrar dados globalmente baseado na unidade ativa
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { unitsService } from '../services';

const UnitContext = createContext({});

export const UnitProvider = ({ children }) => {
  // Estado da unidade selecionada
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chaves para localStorage
  const SELECTED_UNIT_KEY = 'barber_analytics_selected_unit';

  /**
   * Carregar lista de unidades ativas
   */
  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const units = await unitsService.getUnits(false); // Apenas ativas
      setAllUnits(units);

      // Se não há unidade selecionada, verificar localStorage
      if (!selectedUnit) {
        const savedUnitId = localStorage.getItem(SELECTED_UNIT_KEY);
        
        if (savedUnitId && savedUnitId !== 'all') {
          const savedUnit = units.find(unit => unit.id === savedUnitId);
          if (savedUnit) {
            setSelectedUnit(savedUnit);
          }
        }
      }

      return units;
    } catch (err) {
      setError(err.message || 'Erro ao carregar unidades');
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedUnit]);

  /**
   * Selecionar uma unidade específica
   */
  const selectUnit = useCallback((unit) => {
    setSelectedUnit(unit);
    
    // Salvar no localStorage
    if (unit) {
      localStorage.setItem(SELECTED_UNIT_KEY, unit.id);
    } else {
      localStorage.setItem(SELECTED_UNIT_KEY, 'all');
    }
  }, []);

  /**
   * Selecionar "Todas as Unidades"
   */
  const selectAllUnits = useCallback(() => {
    setSelectedUnit(null);
    localStorage.setItem(SELECTED_UNIT_KEY, 'all');
  }, []);

  /**
   * Obter ID da unidade selecionada para filtros
   */
  const getSelectedUnitId = useCallback(() => {
    return selectedUnit?.id || null;
  }, [selectedUnit]);

  /**
   * Verificar se está visualizando todas as unidades
   */
  const isViewingAllUnits = useCallback(() => {
    return selectedUnit === null;
  }, [selectedUnit]);

  /**
   * Obter nome da unidade selecionada para display
   */
  const getSelectedUnitName = useCallback(() => {
    return selectedUnit ? selectedUnit.name : 'Todas as Unidades';
  }, [selectedUnit]);

  /**
   * Filtrar dados baseado na unidade selecionada
   */
  const filterBySelectedUnit = useCallback((data, unitIdField = 'unit_id') => {
    if (!selectedUnit || !Array.isArray(data)) {
      return data;
    }

    return data.filter(item => item[unitIdField] === selectedUnit.id);
  }, [selectedUnit]);

  /**
   * Refresh - recarregar unidades
   */
  const refresh = useCallback(async () => {
    await loadUnits();
  }, [loadUnits]);

  // Carregar unidades na inicialização
  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Validar se unidade selecionada ainda existe
  useEffect(() => {
    if (selectedUnit && allUnits.length > 0) {
      const unitExists = allUnits.find(unit => unit.id === selectedUnit.id);
      if (!unitExists) {
        // Unidade foi removida ou desativada
        selectAllUnits();
      }
    }
  }, [selectedUnit, allUnits, selectAllUnits]);

  const value = {
    // Estado
    selectedUnit,
    allUnits,
    loading,
    error,

    // Ações
    selectUnit,
    selectAllUnits,
    refresh,

    // Utilidades
    getSelectedUnitId,
    isViewingAllUnits,
    getSelectedUnitName,
    filterBySelectedUnit,

    // Dados computados
    hasMultipleUnits: allUnits.length > 1,
    activeUnitsCount: allUnits.length
  };

  return (
    <UnitContext.Provider value={value}>
      {children}
    </UnitContext.Provider>
  );
};

/**
 * Hook para usar o contexto de unidades
 */
export const useUnit = () => {
  const context = useContext(UnitContext);
  
  if (!context) {
    throw new Error('useUnit deve ser usado dentro de um UnitProvider');
  }

  return context;
};

export default UnitContext;