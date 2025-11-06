import React from 'react';
import FluxoTabRefactored from '../../FinanceiroAdvancedPage/FluxoTabRefactored';

/**
 * 📊 Componente de Relatório - Fluxo de Caixa
 * 
 * @module RelatoriosPage/Components
 * @description Wrapper do FluxoTabRefactored para exibição na página de relatórios
 * 
 * Arquitetura:
 * - Atomic Design: Template (reutiliza organism FluxoTabRefactored)
 * - Clean Code: Componente simples, responsabilidade única
 * - Design System: Herda estilos do FluxoTabRefactored
 * 
 * Features:
 * - ✅ Reutiliza FluxoTabRefactored existente
 * - ✅ Passa filtros globais da página de relatórios
 * - ✅ Suporta dark mode automaticamente
 * - ✅ Responsivo e acessível
 * 
 * @param {Object} props
 * @param {Object} props.filters - Filtros da página de relatórios
 * @param {string} props.filters.unidade - ID da unidade selecionada
 * @param {string} props.filters.dataInicio - Data início (YYYY-MM-DD)
 * @param {string} props.filters.dataFim - Data fim (YYYY-MM-DD)
 * @param {Array} props.units - Lista de unidades disponíveis
 * 
 * @example
 * <RelatorioFluxoCaixa
 *   filters={{ unidade: 'unit-123', dataInicio: '2025-11-01', dataFim: '2025-11-30' }}
 *   units={[{ id: 'unit-123', name: 'Mangabeiras' }]}
 * />
 */
const RelatorioFluxoCaixa = ({ filters, units }) => {
  // Converter filtros da página de relatórios para formato esperado pelo FluxoTabRefactored
  const globalFilters = {
    unitId: filters.unidade === 'todas' ? null : filters.unidade,
    accountId: null, // Fluxo de caixa não filtra por conta específica
  };

  return (
    <div className="space-y-6">
      {/* Header do Relatório */}
      <div className="card-theme rounded-xl border-2 border-light-border p-6 dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-theme-primary text-2xl font-bold">
              Fluxo de Caixa
            </h2>
            <p className="text-theme-secondary mt-1 text-sm">
              Análise completa de entradas e saídas de caixa por período
            </p>
          </div>
          
          {/* Badge de Período */}
          {filters.dataInicio && filters.dataFim && (
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                PERÍODO SELECIONADO
              </p>
              <p className="mt-0.5 text-sm font-bold text-blue-700 dark:text-blue-300">
                {filters.dataInicio} até {filters.dataFim}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Componente FluxoTabRefactored */}
      <FluxoTabRefactored 
        globalFilters={globalFilters} 
        units={units || []} 
      />
    </div>
  );
};

export default RelatorioFluxoCaixa;
