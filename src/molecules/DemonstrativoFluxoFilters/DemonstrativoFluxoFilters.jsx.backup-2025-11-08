/**
 * @fileoverview Componente Molecule - Filtros do Demonstrativo de Fluxo
 * @module molecules/DemonstrativoFluxoFilters
 * @description Painel de filtros para o Demonstrativo de Fluxo de Caixa Acumulado.
 *              Inclui seleção de unidade, conta bancária e período (dateRange).
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @architecture Atomic Design - Molecule
 * @dependencies
 * - UnitSelector (atom)
 * - useBankAccounts (hook)
 * - react@19.x
 *
 * @usage
 * ```jsx
 * <DemonstrativoFluxoFilters
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   onSearch={handleSearch}
 *   loading={loading}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { Search, Calendar, Building2, CreditCard, X } from 'lucide-react';
import UnitSelector from '../../atoms/UnitSelector/UnitSelector';
import { useBankAccounts } from '../../hooks/useBankAccounts';

/**
 * DemonstrativoFluxoFilters
 * Componente de filtros com validação client-side
 *
 * @param {Object} props
 * @param {Object} props.filters - Filtros atuais
 * @param {Function} props.onFilterChange - Callback para mudança de filtros
 * @param {Function} props.onSearch - Callback para buscar dados
 * @param {Function} props.onReset - Callback para resetar filtros
 * @param {boolean} props.loading - Estado de carregamento
 * @param {boolean} props.disabled - Desabilita todos os inputs
 */
export function DemonstrativoFluxoFilters({
  filters = {},
  onFilterChange,
  onSearch,
  onReset,
  loading = false,
  disabled = false,
}) {
  // ==================================================================================
  // HOOKS
  // ==================================================================================

  const { bankAccounts, loading: loadingAccounts } = useBankAccounts({
    unitId: filters.unitId,
  });

  // ==================================================================================
  // COMPUTED VALUES
  // ==================================================================================

  const bankAccountOptions = useMemo(() => {
    if (!bankAccounts || bankAccounts.length === 0) {
      return [];
    }

    return [
      { id: 'all', name: 'Todas as Contas' },
      ...bankAccounts.map(acc => ({
        id: acc.id,
        name: `${acc.bank_name} - ${acc.account_number}`,
      })),
    ];
  }, [bankAccounts]);

  const canSearch = useMemo(() => {
    return !!(
      filters.unitId &&
      filters.startDate &&
      filters.endDate &&
      !loading &&
      !disabled
    );
  }, [filters, loading, disabled]);

  // ==================================================================================
  // HANDLERS
  // ==================================================================================

  const handleUnitChange = unitId => {
    onFilterChange?.({ unitId, accountId: null }); // Reset account when unit changes
  };

  const handleAccountChange = e => {
    const value = e.target.value;
    const newAccountId = value === 'all' ? null : value;

    console.log('🏦 handleAccountChange:', {
      selectedValue: value,
      willSetAccountId: newAccountId,
      currentAccountId: filters.accountId,
      hasOnFilterChange: !!onFilterChange,
    });

    if (onFilterChange) {
      console.log('📞 Chamando onFilterChange com:', {
        accountId: newAccountId,
      });
      onFilterChange({ accountId: newAccountId });
      console.log('✅ onFilterChange chamado');
    } else {
      console.error('❌ onFilterChange não está definido!');
    }
  };

  const handleStartDateChange = e => {
    onFilterChange?.({ startDate: e.target.value });
  };

  const handleEndDateChange = e => {
    onFilterChange?.({ endDate: e.target.value });
  };

  const handleSearchClick = () => {
    if (canSearch) {
      onSearch?.();
    }
  };

  const handleResetClick = () => {
    onReset?.();
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && canSearch) {
      handleSearchClick();
    }
  };

  // ==================================================================================
  // RENDER
  // ==================================================================================

  return (
    <div className="card-theme rounded-xl border p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-theme-primary text-lg font-semibold">Filtros</h2>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={handleResetClick}
            disabled={disabled || loading}
            className="btn-theme-secondary flex items-center gap-2 px-3 py-2 text-sm"
            title="Limpar filtros"
          >
            <X className="h-4 w-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Unit Selector */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="unit-selector"
            className="text-theme-secondary flex items-center gap-2 text-sm font-medium"
          >
            <Building2 className="h-4 w-4" />
            Unidade *
          </label>
          <UnitSelector
            selectedUnitId={filters.unitId}
            onUnitChange={handleUnitChange}
            disabled={disabled || loading}
            className="w-full"
          />
        </div>

        {/* Bank Account Selector */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="account-selector"
            className="text-theme-secondary flex items-center gap-2 text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            Conta Bancária
          </label>
          <select
            id="account-selector"
            value={filters.accountId || 'all'}
            onChange={handleAccountChange}
            disabled={disabled || loading || !filters.unitId || loadingAccounts}
            onKeyPress={handleKeyPress}
            className="input-theme w-full"
          >
            {loadingAccounts ? (
              <option value="">Carregando contas...</option>
            ) : bankAccountOptions.length === 0 ? (
              <option value="">Nenhuma conta cadastrada</option>
            ) : (
              bankAccountOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="start-date"
            className="text-theme-secondary flex items-center gap-2 text-sm font-medium"
          >
            <Calendar className="h-4 w-4" />
            Data Inicial *
          </label>
          <input
            type="date"
            id="start-date"
            value={filters.startDate || ''}
            onChange={handleStartDateChange}
            disabled={disabled || loading}
            onKeyPress={handleKeyPress}
            className="input-theme w-full"
            max={filters.endDate || undefined}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="end-date"
            className="text-theme-secondary flex items-center gap-2 text-sm font-medium"
          >
            <Calendar className="h-4 w-4" />
            Data Final *
          </label>
          <input
            type="date"
            id="end-date"
            value={filters.endDate || ''}
            onChange={handleEndDateChange}
            disabled={disabled || loading}
            onKeyPress={handleKeyPress}
            className="input-theme w-full"
            min={filters.startDate || undefined}
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={!canSearch}
          className="btn-theme-primary flex items-center gap-2 px-6 py-2.5"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {/* Helper Text */}
      <div className="text-theme-secondary mt-4 text-xs">
        * Campos obrigatórios | Período máximo: 2 anos
      </div>
    </div>
  );
}

export default DemonstrativoFluxoFilters;
