/**
 * UNIT SELECTOR COMPONENT
 *
 * Seletor de unidades usando contexto global
 * Permite filtrar visualização por unidade específica ou "Todas"
 */

import React from 'react';
import { useUnit } from '../../context/UnitContext';
import { useAuth } from '../../context/AuthContext';

const UnitSelector = ({ className = '' }) => {
  const { user, receptionistStatus } = useAuth();
  const {
    selectedUnit,
    allUnits,
    loading,
    error,
    selectUnit,
    selectAllUnits,
    getSelectedUnitName,
    hasMultipleUnits,
  } = useUnit();

  // Debug para verificar estado
  console.log('🔍 UnitSelector Debug:', {
    receptionistStatus,
    hasMultipleUnits,
    allUnitsCount: allUnits.length,
    loading,
    error,
    selectedUnit: selectedUnit?.name,
  });

  // Recepcionista sempre vê o seletor (acesso a todas as unidades)
  // Outros usuários só veem se houver múltiplas unidades
  if (!user) {
    return null;
  }

  if (!receptionistStatus && !hasMultipleUnits) {
    return null;
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-600 dark:text-red-400 ${className}`}>
        Erro ao carregar unidades
      </div>
    );
  }

  const handleUnitChange = unitId => {
    if (unitId === 'all' || unitId === '') {
      selectAllUnits();
    } else {
      const unit = allUnits.find(u => u.id === unitId);
      if (unit) {
        selectUnit(unit);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <select
        id="unit-select"
        value={selectedUnit?.id || 'all'}
        onChange={e => handleUnitChange(e.target.value)}
        className="
          w-full px-3 py-2 text-sm
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg shadow-sm
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors duration-200
        "
      >
        <option value="all">Todas as Unidades</option>
        {allUnits.map(unit => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
          </option>
        ))}
      </select>

      {/* Indicador da seleção atual */}
      <div className="text-xs text-gray-500 dark:text-gray-400 ml-0">
        Visualizando:{' '}
        <span className="font-medium">{getSelectedUnitName()}</span>
      </div>
    </div>
  );
};

export default UnitSelector;
