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
        <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
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
        className="card-theme text-theme-primary w-full cursor-pointer rounded-lg border-2 border-primary/20 px-3 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary dark:border-primary/30 dark:bg-dark-surface dark:text-gray-100 dark:hover:border-primary/50"
      >
        <option value="all">📍 Todas as Unidades</option>
        {allUnits.map(unit => (
          <option key={unit.id} value={unit.id}>
            🏢 {unit.name}
          </option>
        ))}
      </select>

      {/* Indicador da seleção atual */}
      <div className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted px-1 text-[10px]">
        {selectedUnit ? (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500"></span>
            <span className="font-medium text-primary">
              {selectedUnit.name}
            </span>
          </span>
        ) : (
          <span className="text-light-text-muted dark:text-dark-text-muted">
            Visualizando todas
          </span>
        )}
      </div>
    </div>
  );
};
export default UnitSelector;
