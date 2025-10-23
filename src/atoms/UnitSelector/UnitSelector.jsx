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

  // Debug desabilitado - descomentar se necessário
  // console.log('🔍 UnitSelector Debug:', {
  //   receptionistStatus,
  //   hasMultipleUnits,
  //   allUnitsCount: allUnits.length,
  //   loading,
  //   error,
  //   selectedUnit: selectedUnit?.name,
  // });

  // ✅ SEMPRE MOSTRAR O SELETOR - É o componente principal do sistema
  if (!user) {
    return null;
  }

  // ❌ REMOVIDO: Verificação de múltiplas unidades
  // O seletor deve sempre aparecer para dar contexto ao usuário

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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <select
        id="unit-select"
        value={selectedUnit?.id || 'all'}
        onChange={e => handleUnitChange(e.target.value)}
        className="
          w-full px-3 py-2.5 text-sm font-medium
          bg-white dark:bg-gray-800
          border-2 border-primary/20 dark:border-primary/30
          rounded-lg shadow-sm
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-primary focus:border-primary
          hover:border-primary/40 dark:hover:border-primary/50
          transition-all duration-200
          cursor-pointer
        "
      >
        <option value="all">📍 Todas as Unidades</option>
        {allUnits.map(unit => (
          <option key={unit.id} value={unit.id}>
            🏢 {unit.name}
          </option>
        ))}
      </select>

      {/* Indicador da seleção atual */}
      <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
        {selectedUnit ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium text-primary">
              {selectedUnit.name}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">Visualizando todas</span>
        )}
      </div>
    </div>
  );
};

export default UnitSelector;
