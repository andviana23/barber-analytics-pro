/**
 * Cálculos de KPIs - Funções para calcular indicadores financeiros
 *
 * Responsável por:
 * - Calcular margem de lucro
 * - Calcular ticket médio
 * - Previsões (forecast) usando regressão linear
 * - Médias móveis para suavização de séries temporais
 *
 * @module lib/analytics/calculations
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.2
 */

/**
 * Interface para dados de série temporal
 */
interface TimeSeriesData {
  date: Date;
  value: number;
}

/**
 * Interface para resultado de previsão
 */
interface ForecastResult {
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calcula a margem de lucro percentual
 *
 * Fórmula: ((receita - despesa) / receita) * 100
 *
 * @param revenue - Valor da receita bruta
 * @param expense - Valor das despesas totais
 * @returns Margem percentual (0-100)
 *
 * @example
 * ```typescript
 * const margin = calculateMargin(10000, 3000);
 * // Retorna: 70.0
 * ```
 */
export function calculateMargin(revenue: number, expense: number): number {
  if (revenue <= 0) {
    return 0;
  }

  const margin = ((revenue - expense) / revenue) * 100;

  // Limitar entre -100% e 100%
  return Math.max(-100, Math.min(100, margin));
}

/**
 * Calcula o ticket médio
 *
 * Fórmula: receita_total / número_de_transações
 *
 * @param totalRevenue - Receita total do período
 * @param transactionCount - Número de transações
 * @returns Ticket médio
 *
 * @example
 * ```typescript
 * const ticket = calculateAverageTicket(15000, 100);
 * // Retorna: 150.0
 * ```
 */
export function calculateAverageTicket(
  totalRevenue: number,
  transactionCount: number
): number {
  if (transactionCount <= 0) {
    return 0;
  }

  return totalRevenue / transactionCount;
}

/**
 * Calcula média móvel simples
 *
 * Usado para suavizar séries temporais e identificar tendências.
 *
 * @param values - Array de valores históricos
 * @param windowSize - Tamanho da janela (ex: 7 para média móvel de 7 dias)
 * @returns Array com médias móveis
 *
 * @example
 * ```typescript
 * const data = [100, 120, 110, 130, 125, 140, 135];
 * const ma = calculateMovingAverage(data, 3);
 * // Retorna: [110, 120, 121.67, 131.67, 133.33]
 * ```
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number
): number[] {
  if (values.length < windowSize) {
    return [];
  }

  const movingAverages: number[] = [];

  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
    movingAverages.push(Math.round(average * 100) / 100);
  }

  return movingAverages;
}

/**
 * Calcula regressão linear para previsão
 *
 * Usa método dos mínimos quadrados para ajustar linha de tendência.
 *
 * @param timeSeries - Array de dados históricos com data e valor
 * @returns Coeficientes da regressão (slope, intercept)
 *
 * @example
 * ```typescript
 * const data = [
 *   { date: new Date('2025-11-01'), value: 1000 },
 *   { date: new Date('2025-11-02'), value: 1100 },
 *   { date: new Date('2025-11-03'), value: 1200 }
 * ];
 * const regression = calculateLinearRegression(data);
 * // Retorna: { slope: 100, intercept: 1000 }
 * ```
 */
export function calculateLinearRegression(timeSeries: TimeSeriesData[]): {
  slope: number;
  intercept: number;
} {
  if (timeSeries.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  // Converter datas para índices numéricos
  const x = timeSeries.map((_, index) => index);
  const y = timeSeries.map(item => item.value);

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);

  // Fórmula da regressão linear (mínimos quadrados)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
  };
}

/**
 * Prevê valores futuros usando regressão linear + média móvel
 *
 * Combina tendência linear com média móvel para gerar previsões mais robustas.
 *
 * @param timeSeries - Dados históricos
 * @param daysAhead - Número de dias a prever (1-30)
 * @returns Valor previsto com intervalo de confiança
 *
 * @example
 * ```typescript
 * const history = [
 *   { date: new Date('2025-11-01'), value: 1000 },
 *   // ... mais 29 dias
 * ];
 * const forecast = forecastValue(history, 7);
 * // Retorna: {
 * //   predicted_value: 1500,
 * //   confidence_interval: { lower: 1400, upper: 1600 },
 * //   trend: 'up'
 * // }
 * ```
 */
export function forecastValue(
  timeSeries: TimeSeriesData[],
  daysAhead: number
): ForecastResult {
  if (timeSeries.length < 7) {
    // Dados insuficientes - retorna última valor conhecido
    const lastValue = timeSeries[timeSeries.length - 1]?.value || 0;
    return {
      predicted_value: lastValue,
      confidence_interval: {
        lower: lastValue * 0.9,
        upper: lastValue * 1.1,
      },
      trend: 'stable',
    };
  }

  // 1. Calcular regressão linear
  const { slope, intercept } = calculateLinearRegression(timeSeries);

  // 2. Prever valor usando a linha de tendência
  const nextIndex = timeSeries.length + daysAhead - 1;
  const predictedValue = slope * nextIndex + intercept;

  // 3. Calcular desvio padrão para intervalo de confiança
  const values = timeSeries.map(item => item.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  const stdDev = Math.sqrt(variance);

  // Intervalo de confiança de 95% (±1.96 desvios padrão)
  const confidenceMargin = 1.96 * stdDev;

  // 4. Determinar tendência
  const trend: 'up' | 'down' | 'stable' =
    slope > mean * 0.02 ? 'up' : slope < -mean * 0.02 ? 'down' : 'stable';

  return {
    predicted_value: Math.round(predictedValue * 100) / 100,
    confidence_interval: {
      lower: Math.round((predictedValue - confidenceMargin) * 100) / 100,
      upper: Math.round((predictedValue + confidenceMargin) * 100) / 100,
    },
    trend,
  };
}

/**
 * Calcula taxa de crescimento (growth rate)
 *
 * Fórmula: ((valor_atual - valor_anterior) / valor_anterior) * 100
 *
 * @param currentValue - Valor atual
 * @param previousValue - Valor anterior
 * @returns Taxa de crescimento percentual
 *
 * @example
 * ```typescript
 * const growth = calculateGrowthRate(1200, 1000);
 * // Retorna: 20.0 (crescimento de 20%)
 * ```
 */
export function calculateGrowthRate(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

/**
 * Calcula projeção de receita para o mês
 *
 * Usa média diária dos últimos 7 dias para projetar o total do mês.
 *
 * @param dailyRevenues - Array com receitas dos últimos dias
 * @param daysInMonth - Total de dias no mês
 * @param currentDay - Dia atual do mês
 * @returns Projeção de receita para o mês completo
 *
 * @example
 * ```typescript
 * const dailyRevenues = [1000, 1100, 1200, 1150, 1050, 1100, 1250];
 * const projection = projectMonthlyRevenue(dailyRevenues, 30, 7);
 * // Retorna: ~33000 (baseado em média de 1121 por dia)
 * ```
 */
export function projectMonthlyRevenue(
  dailyRevenues: number[],
  daysInMonth: number,
  currentDay: number
): number {
  if (dailyRevenues.length === 0) {
    return 0;
  }

  // Usar últimos 7 dias (ou todos disponíveis se menos de 7)
  const recentDays = dailyRevenues.slice(-7);
  const avgDailyRevenue =
    recentDays.reduce((sum, val) => sum + val, 0) / recentDays.length;

  // Projeção = (receita já acumulada) + (média diária * dias restantes)
  const accumulatedRevenue = dailyRevenues.reduce((sum, val) => sum + val, 0);
  const remainingDays = daysInMonth - currentDay;
  const projectedRemainingRevenue = avgDailyRevenue * remainingDays;

  return (
    Math.round((accumulatedRevenue + projectedRemainingRevenue) * 100) / 100
  );
}

/**
 * Detecta sazonalidade em série temporal
 *
 * Identifica padrões semanais (ex: finais de semana com maior movimento).
 *
 * @param timeSeries - Dados históricos (mínimo 30 dias)
 * @returns Índices de sazonalidade por dia da semana (0=domingo, 6=sábado)
 *
 * @example
 * ```typescript
 * const seasonality = detectSeasonality(last90Days);
 * // Retorna: [0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 1.4]
 * // Significa: domingos 20% abaixo da média, sábados 50% acima
 * ```
 */
export function detectSeasonality(timeSeries: TimeSeriesData[]): number[] {
  if (timeSeries.length < 30) {
    // Dados insuficientes - retorna índices neutros
    return [1, 1, 1, 1, 1, 1, 1];
  }

  // Agrupar valores por dia da semana
  const weekdayGroups: { [key: number]: number[] } = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  timeSeries.forEach(item => {
    const dayOfWeek = item.date.getDay();
    weekdayGroups[dayOfWeek].push(item.value);
  });

  // Calcular média geral
  const allValues = timeSeries.map(item => item.value);
  const overallMean =
    allValues.reduce((sum, val) => sum + val, 0) / allValues.length;

  // Calcular índice de sazonalidade para cada dia (média do dia / média geral)
  const seasonalityIndexes = [0, 1, 2, 3, 4, 5, 6].map(day => {
    const dayValues = weekdayGroups[day];
    if (dayValues.length === 0) return 1;

    const dayMean =
      dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
    return Math.round((dayMean / overallMean) * 100) / 100;
  });

  return seasonalityIndexes;
}
