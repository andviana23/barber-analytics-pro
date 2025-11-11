/**
 * @fileoverview Página de Forecast de Fluxo de Caixa
 * @module pages/CashflowForecastPage
 * @description Página completa para visualizar previsões de fluxo de caixa
 *
 * Features:
 * - Gráfico interativo de forecast
 * - Filtros por unidade e período
 * - Cards de resumo com saldos previstos
 * - Integração com hook useCashflowForecast
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 8.2
 */

import React, { useState } from 'react';
import { useUnit } from '../context/UnitContext';
import CashflowForecastChart from '../molecules/CashflowForecastChart';
import { useCashflowForecast } from '../hooks/useCashflowForecast';

/**
 * Página: CashflowForecastPage
 *
 * Exibe previsões de fluxo de caixa com gráficos interativos
 */
const CashflowForecastPage = () => {
  const { selectedUnit } = useUnit();
  const [days, setDays] = useState(30);
  const [accountId, setAccountId] = useState(null);

  const {
    data: forecastData,
    isLoading,
    error,
    refetch,
  } = useCashflowForecast({
    unitId: selectedUnit?.id,
    accountId,
    days,
    enabled: !!selectedUnit?.id,
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-theme-primary dark:text-dark-text-primary mb-2 text-3xl font-bold">
          Previsão de Fluxo de Caixa
        </h1>
        <p className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted">
          Visualize previsões de saldo para os próximos 30, 60 ou 90 dias
        </p>
      </div>

      {/* Filtros */}
      <div className="card-theme mb-6 rounded-lg border border-light-border p-4 dark:border-dark-border">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-1 block text-sm font-medium">
              Período de Previsão
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="input-theme rounded-lg px-3 py-2"
            >
              <option value={30}>30 dias</option>
              <option value={60}>60 dias</option>
              <option value={90}>90 dias</option>
            </select>
          </div>

          <div>
            <label className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted mb-1 block text-sm font-medium">
              Conta Bancária (opcional)
            </label>
            <select
              value={accountId || ''}
              onChange={(e) => setAccountId(e.target.value || null)}
              className="input-theme rounded-lg px-3 py-2"
            >
              <option value="">Todas as contas</option>
              {/* TODO: Buscar contas bancárias da unidade */}
            </select>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <CashflowForecastChart
        unitId={selectedUnit?.id}
        accountId={accountId}
        days={days}
        title={`Previsão de Fluxo de Caixa - ${selectedUnit?.name || 'Selecione uma unidade'}`}
        height={500}
        onRefresh={() => refetch()}
      />

      {/* Informações adicionais */}
      {forecastData && (
        <div className="card-theme mt-6 rounded-lg border border-light-border p-4 dark:border-dark-border">
          <h3 className="text-theme-primary dark:text-dark-text-primary mb-3 text-lg font-semibold">
            Informações da Previsão
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Dados Históricos:
              </span>
              <p className="text-theme-primary dark:text-dark-text-primary font-medium">
                {forecastData.historical?.count || 0} dias
              </p>
            </div>
            <div>
              <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                Período da Previsão:
              </span>
              <p className="text-theme-primary dark:text-dark-text-primary font-medium">
                {forecastData.period} dias
              </p>
            </div>
            {forecastData.cached && (
              <div className="col-span-2">
                <span className="text-theme-secondary dark:text-light-text-muted dark:text-dark-text-muted text-sm">
                  ℹ️ Dados em cache (atualizado há menos de 1 hora)
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashflowForecastPage;

