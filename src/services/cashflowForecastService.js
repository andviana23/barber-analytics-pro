/**
 * @fileoverview Service para Forecast de Fluxo de Caixa
 * @module services/cashflowForecastService
 * @description Service layer para integração com API de forecast
 *
 * Segue Clean Architecture - Service Layer Pattern
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 4.2
 */

/**
 * Busca forecast de fluxo de caixa da API
 *
 * @param {Object} params
 * @param {string} params.unitId - ID da unidade
 * @param {string|null} [params.accountId] - ID da conta bancária (opcional)
 * @param {number} [params.days=30] - Período de previsão: 30, 60 ou 90 dias
 * @param {string} params.token - JWT token de autenticação
 *
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getCashflowForecast({ unitId, accountId = null, days = 30, token }) {
  try {
    if (!unitId) {
      return {
        data: null,
        error: 'unitId é obrigatório',
      };
    }

    if (![30, 60, 90].includes(days)) {
      return {
        data: null,
        error: 'days deve ser 30, 60 ou 90',
      };
    }

    if (!token) {
      return {
        data: null,
        error: 'Token de autenticação é obrigatório',
      };
    }

    // Usar URL base do Next.js (ajustar conforme necessário)
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const apiUrl = `${baseUrl}/api/forecasts/cashflow`;

    const params = new URLSearchParams({
      unitId,
      days: days.toString(),
    });

    if (accountId) {
      params.append('accountId', accountId);
    }

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        data: null,
        error: data.message || 'Erro ao gerar forecast',
      };
    }

    return {
      data: {
        unitId: data.unitId,
        accountId: data.accountId,
        period: data.period,
        historical: data.historical,
        forecast: data.forecast,
        summary: data.summary,
        cached: data.cached || false,
        correlationId: data.correlationId,
      },
      error: null,
    };
  } catch (error) {
    console.error('[cashflowForecastService] Erro ao buscar forecast:', error);
    return {
      data: null,
      error: error.message || 'Erro desconhecido ao buscar forecast',
    };
  }
}

/**
 * Valida se há dados históricos suficientes para gerar forecast
 *
 * @param {Object} params
 * @param {string} params.unitId - ID da unidade
 * @param {string|null} [params.accountId] - ID da conta bancária
 * @param {string} params.token - JWT token
 *
 * @returns {Promise<{hasData: boolean, error: string|null}>}
 */
export async function validateHistoricalData({ unitId, accountId = null, token }) {
  try {
    // Buscar forecast de 30 dias (requer menos dados históricos)
    const result = await getCashflowForecast({
      unitId,
      accountId,
      days: 30,
      token,
    });

    if (result.error) {
      return {
        hasData: false,
        error: result.error,
      };
    }

    const hasHistoricalData = result.data?.historical?.count > 0;

    return {
      hasData: hasHistoricalData,
      error: hasHistoricalData ? null : 'Dados históricos insuficientes',
    };
  } catch (error) {
    return {
      hasData: false,
      error: error.message || 'Erro ao validar dados históricos',
    };
  }
}

export const cashflowForecastService = {
  getCashflowForecast,
  validateHistoricalData,
};

export default cashflowForecastService;

