/**
 * Detecção de Anomalias - Identificação de padrões anormais em métricas
 *
 * Responsável por:
 * - Detectar valores atípicos (outliers) usando z-score
 * - Identificar mudanças bruscas em tendências
 * - Alertar sobre desvios significativos da média histórica
 *
 * @module lib/analytics/anomalies
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.3
 */

import { mean, std } from 'mathjs';

/**
 * Interface para resultado de detecção de anomalia
 */
export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  zScore: number;
  deviationPercentage: number;
  expectedRange: {
    min: number;
    max: number;
  };
}

/**
 * Interface para alerta de anomalia
 */
export interface AnomalyAlert {
  type: 'outlier' | 'trend_break' | 'sudden_drop' | 'sudden_spike';
  metric: string;
  currentValue: number;
  expectedValue: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: Date;
}

/**
 * Calcula z-score (escore padronizado)
 *
 * Indica quantos desvios padrão um valor está da média.
 * - Z-score > 2: Anomalia moderada
 * - Z-score > 3: Anomalia severa
 *
 * @param value - Valor a analisar
 * @param mean - Média histórica
 * @param stdDev - Desvio padrão histórico
 * @returns Z-score do valor
 *
 * @example
 * ```typescript
 * const z = calculateZScore(150, 100, 20);
 * // Retorna: 2.5 (valor está 2.5 desvios acima da média)
 * ```
 */
export function calculateZScore(
  value: number,
  mean: number,
  stdDev: number
): number {
  if (stdDev === 0) {
    return 0;
  }

  return (value - mean) / stdDev;
}

/**
 * Calcula desvio padrão de um conjunto de valores usando Math.js
 *
 * @param values - Array de valores numéricos
 * @returns Desvio padrão
 *
 * @example
 * ```typescript
 * const stdDev = calculateStandardDeviation([10, 20, 30, 40, 50]);
 * // Retorna: 14.14
 * ```
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  try {
    return std(values) as number;
  } catch (error) {
    // Fallback para cálculo manual se Math.js falhar
    const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }
}

/**
 * Detecta anomalias usando z-score
 *
 * Compara valor atual com distribuição histórica.
 *
 * @param currentValue - Valor a analisar
 * @param historicalValues - Valores históricos (mínimo 30 dias)
 * @returns Resultado da detecção
 *
 * @example
 * ```typescript
 * const result = detectAnomaly(5000, last30DaysRevenues);
 * if (result.isAnomaly && result.severity === 'high') {
 *   console.log('Anomalia crítica detectada!');
 * }
 * ```
 */
export function detectAnomaly(
  currentValue: number,
  historicalValues: number[]
): AnomalyDetectionResult {
  if (historicalValues.length < 7) {
    // Dados insuficientes - não detecta anomalia
    return {
      isAnomaly: false,
      severity: 'low',
      zScore: 0,
      deviationPercentage: 0,
      expectedRange: { min: 0, max: 0 },
    };
  }

  // Calcular estatísticas usando Math.js
  let meanValue: number;
  try {
    meanValue = mean(historicalValues) as number;
  } catch (error) {
    // Fallback para cálculo manual
    meanValue =
      historicalValues.reduce((sum, val) => sum + val, 0) /
      historicalValues.length;
  }
  const stdDev = calculateStandardDeviation(historicalValues);
  const zScore = calculateZScore(currentValue, meanValue, stdDev);

  // Determinar severidade baseado no z-score
  const absZScore = Math.abs(zScore);
  let severity: 'low' | 'medium' | 'high' = 'low';
  let isAnomaly = false;

  if (absZScore > 3) {
    severity = 'high';
    isAnomaly = true;
  } else if (absZScore > 2) {
    severity = 'medium';
    isAnomaly = true;
  } else if (absZScore > 1.5) {
    severity = 'low';
    isAnomaly = true;
  }

  // Calcular desvio percentual
  const deviationPercentage =
    meanValue !== 0 ? ((currentValue - meanValue) / Math.abs(meanValue)) * 100 : 0;

  // Definir faixa esperada (±2 desvios padrão = 95% dos casos normais)
  const expectedRange = {
    min: Math.round((meanValue - 2 * stdDev) * 100) / 100,
    max: Math.round((meanValue + 2 * stdDev) * 100) / 100,
  };

  return {
    isAnomaly,
    severity,
    zScore: Math.round(zScore * 100) / 100,
    deviationPercentage: Math.round(deviationPercentage * 100) / 100,
    expectedRange,
  };
}

/**
 * Detecta quebra de tendência (trend break)
 *
 * Identifica quando a tendência atual diverge significativamente da histórica.
 *
 * @param recentValues - Valores dos últimos 7 dias
 * @param historicalValues - Valores dos 30 dias anteriores
 * @returns True se houve quebra de tendência
 *
 * @example
 * ```typescript
 * const hasTrendBreak = detectTrendBreak(last7Days, previous30Days);
 * if (hasTrendBreak) {
 *   console.log('Mudança significativa na tendência detectada');
 * }
 * ```
 */
export function detectTrendBreak(
  recentValues: number[],
  historicalValues: number[]
): boolean {
  if (recentValues.length < 3 || historicalValues.length < 7) {
    return false;
  }

  // Calcular média das últimas leituras vs. média histórica
  const recentMean =
    recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  const historicalMean =
    historicalValues.reduce((sum, val) => sum + val, 0) /
    historicalValues.length;

  // Quebra de tendência = mudança > 30% em relação à média histórica
  const changePercentage =
    historicalMean !== 0
      ? Math.abs((recentMean - historicalMean) / historicalMean) * 100
      : 0;

  return changePercentage > 30;
}

/**
 * Detecta queda súbita (sudden drop)
 *
 * Identifica quando há queda abrupta de mais de 40% em relação ao dia anterior.
 *
 * @param currentValue - Valor atual
 * @param previousValue - Valor do dia anterior
 * @returns True se houve queda súbita
 *
 * @example
 * ```typescript
 * const hasDrop = detectSuddenDrop(600, 1000);
 * // Retorna: true (queda de 40%)
 * ```
 */
export function detectSuddenDrop(
  currentValue: number,
  previousValue: number
): boolean {
  if (previousValue === 0) {
    return false;
  }

  const dropPercentage = ((previousValue - currentValue) / previousValue) * 100;

  return dropPercentage > 40;
}

/**
 * Detecta pico súbito (sudden spike)
 *
 * Identifica quando há aumento abrupto de mais de 200% em relação ao dia anterior.
 *
 * @param currentValue - Valor atual
 * @param previousValue - Valor do dia anterior
 * @returns True se houve pico súbito
 *
 * @example
 * ```typescript
 * const hasSpike = detectSuddenSpike(3000, 1000);
 * // Retorna: true (aumento de 200%)
 * ```
 */
export function detectSuddenSpike(
  currentValue: number,
  previousValue: number
): boolean {
  if (previousValue === 0) {
    return currentValue > 0;
  }

  const spikePercentage =
    ((currentValue - previousValue) / previousValue) * 100;

  return spikePercentage > 200;
}

/**
 * Gera alertas baseado em detecção de anomalias
 *
 * Analisa todas as anomalias possíveis e retorna alertas estruturados.
 *
 * @param metricName - Nome da métrica (ex: 'receita_bruta', 'despesas')
 * @param currentValue - Valor atual
 * @param previousValue - Valor do dia anterior
 * @param historicalValues - Valores dos últimos 30 dias
 * @returns Array de alertas detectados
 *
 * @example
 * ```typescript
 * const alerts = generateAnomalyAlerts(
 *   'receita_bruta',
 *   15000,
 *   10000,
 *   last30DaysRevenues
 * );
 *
 * alerts.forEach(alert => {
 *   console.log(`[${alert.severity}] ${alert.message}`);
 * });
 * ```
 */
export function generateAnomalyAlerts(
  metricName: string,
  currentValue: number,
  previousValue: number,
  historicalValues: number[]
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  const now = new Date();

  // 1. Detectar outlier (z-score)
  const anomalyResult = detectAnomaly(currentValue, historicalValues);
  if (anomalyResult.isAnomaly) {
    let expectedValue: number;
    try {
      expectedValue = mean(historicalValues) as number;
    } catch (error) {
      expectedValue =
        historicalValues.reduce((sum, val) => sum + val, 0) /
        historicalValues.length;
    }

    alerts.push({
      type: 'outlier',
      metric: metricName,
      currentValue,
      expectedValue,
      severity: anomalyResult.severity,
      message: `${metricName} está ${anomalyResult.deviationPercentage > 0 ? 'acima' : 'abaixo'} do esperado (${Math.abs(anomalyResult.deviationPercentage).toFixed(1)}% de desvio)`,
      detectedAt: now,
    });
  }

  // 2. Detectar queda súbita
  if (detectSuddenDrop(currentValue, previousValue)) {
    const dropPercentage =
      ((previousValue - currentValue) / previousValue) * 100;
    alerts.push({
      type: 'sudden_drop',
      metric: metricName,
      currentValue,
      expectedValue: previousValue,
      severity: dropPercentage > 60 ? 'high' : 'medium',
      message: `Queda súbita de ${dropPercentage.toFixed(1)}% em ${metricName}`,
      detectedAt: now,
    });
  }

  // 3. Detectar pico súbito
  if (detectSuddenSpike(currentValue, previousValue)) {
    const spikePercentage =
      ((currentValue - previousValue) / previousValue) * 100;
    alerts.push({
      type: 'sudden_spike',
      metric: metricName,
      currentValue,
      expectedValue: previousValue,
      severity: spikePercentage > 300 ? 'high' : 'medium',
      message: `Pico súbito de ${spikePercentage.toFixed(1)}% em ${metricName}`,
      detectedAt: now,
    });
  }

  // 4. Detectar quebra de tendência
  const recentValues = historicalValues.slice(-7);
  const olderValues = historicalValues.slice(0, -7);
  if (detectTrendBreak(recentValues, olderValues)) {
    let expectedValue: number;
    try {
      expectedValue = mean(olderValues) as number;
    } catch (error) {
      expectedValue =
        olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
    }

    alerts.push({
      type: 'trend_break',
      metric: metricName,
      currentValue,
      expectedValue,
      severity: 'medium',
      message: `Mudança significativa na tendência de ${metricName} nos últimos 7 dias`,
      detectedAt: now,
    });
  }

  return alerts;
}

/**
 * Filtra alertas por severidade
 *
 * @param alerts - Array de alertas
 * @param minSeverity - Severidade mínima ('low', 'medium', 'high')
 * @returns Alertas filtrados
 */
export function filterAlertsBySeverity(
  alerts: AnomalyAlert[],
  minSeverity: 'low' | 'medium' | 'high'
): AnomalyAlert[] {
  const severityOrder = { low: 1, medium: 2, high: 3 };
  const threshold = severityOrder[minSeverity];

  return alerts.filter(alert => severityOrder[alert.severity] >= threshold);
}

/**
 * Agrupa alertas por métrica
 *
 * @param alerts - Array de alertas
 * @returns Map com alertas agrupados por métrica
 */
export function groupAlertsByMetric(
  alerts: AnomalyAlert[]
): Map<string, AnomalyAlert[]> {
  const grouped = new Map<string, AnomalyAlert[]>();

  alerts.forEach(alert => {
    const existing = grouped.get(alert.metric) || [];
    existing.push(alert);
    grouped.set(alert.metric, existing);
  });

  return grouped;
}

/**
 * Detecta queda significativa em receita bruta
 *
 * Compara o valor atual com a média dos últimos 7 dias.
 * Gera alerta quando há queda > 10%.
 *
 * @param currentRevenue - Receita bruta atual (gross_revenue)
 * @param last7DaysRevenues - Array com receitas dos últimos 7 dias
 * @returns Objeto com resultado da detecção
 *
 * @example
 * ```typescript
 * const result = detectRevenueDrop(5000, [6000, 6200, 5800, 6100, 5900, 6000, 6050]);
 * if (result.hasDrop) {
 *   console.log(`Queda de ${result.dropPercentage}% detectada`);
 * }
 * ```
 */
export function detectRevenueDrop(
  currentRevenue: number,
  last7DaysRevenues: number[]
): {
  hasDrop: boolean;
  dropPercentage: number;
  average7Days: number;
  severity: 'low' | 'medium' | 'high';
} {
  if (last7DaysRevenues.length < 7) {
    return {
      hasDrop: false,
      dropPercentage: 0,
      average7Days: 0,
      severity: 'low',
    };
  }

  // Calcular média dos últimos 7 dias usando Math.js
  let average7Days: number;
  try {
    average7Days = mean(last7DaysRevenues) as number;
  } catch (error) {
    // Fallback para cálculo manual
    average7Days =
      last7DaysRevenues.reduce((sum, val) => sum + val, 0) /
      last7DaysRevenues.length;
  }

  if (average7Days === 0) {
    return {
      hasDrop: false,
      dropPercentage: 0,
      average7Days: 0,
      severity: 'low',
    };
  }

  // Calcular percentual de queda
  const dropPercentage =
    ((average7Days - currentRevenue) / average7Days) * 100;

  // Determinar severidade baseado na queda
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (dropPercentage > 20) {
    severity = 'high';
  } else if (dropPercentage > 15) {
    severity = 'medium';
  } else if (dropPercentage > 10) {
    severity = 'low';
  }

  return {
    hasDrop: dropPercentage > 10,
    dropPercentage: Math.round(dropPercentage * 100) / 100,
    average7Days: Math.round(average7Days * 100) / 100,
    severity,
  };
}

/**
 * Detecta margem abaixo do target
 *
 * Compara margin_percentage atual com target_value definido em kpi_targets.
 *
 * @param currentMargin - Margem percentual atual
 * @param targetMargin - Valor target da margem (de kpi_targets)
 * @returns Objeto com resultado da detecção
 *
 * @example
 * ```typescript
 * const result = detectLowMargin(25, 30);
 * if (result.isBelowTarget) {
 *   console.log(`Margem ${result.deviation} pontos abaixo do target`);
 * }
 * ```
 */
export function detectLowMargin(
  currentMargin: number,
  targetMargin: number
): {
  isBelowTarget: boolean;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
} {
  if (!targetMargin || targetMargin <= 0) {
    return {
      isBelowTarget: false,
      deviation: 0,
      severity: 'low',
    };
  }

  const deviation = targetMargin - currentMargin;

  // Determinar severidade baseado no desvio
  let severity: 'low' | 'medium' | 'high' = 'low';
  const deviationPercentage = (deviation / targetMargin) * 100;

  if (deviationPercentage > 20) {
    severity = 'high';
  } else if (deviationPercentage > 10) {
    severity = 'medium';
  } else if (deviation > 0) {
    severity = 'low';
  }

  return {
    isBelowTarget: currentMargin < targetMargin,
    deviation: Math.round(deviation * 100) / 100,
    severity,
  };
}

/**
 * Detecta anomalias e gera alertas para métricas diárias
 *
 * Esta função integra todas as detecções:
 * 1. Anomalias via z-score (usando Math.js)
 * 2. Quedas significativas em receita (>10% comparado com média dos últimos 7 dias)
 * 3. Margem abaixo do target (comparado com kpi_targets)
 *
 * @param unitId - ID da unidade
 * @param currentMetric - Métrica atual do dia
 * @param historicalMetrics - Array com métricas dos últimos 30 dias (ordenadas por data)
 * @param marginTarget - Target de margem (de kpi_targets) - opcional
 * @returns Array de alertas detectados
 *
 * @example
 * ```typescript
 * const alerts = await detectAndGenerateAlerts(
 *   'unit-123',
 *   { gross_revenue: 5000, margin_percentage: 25, date: '2025-11-09' },
 *   last30DaysMetrics,
 *   30 // target de margem
 * );
 * ```
 */
export async function detectAndGenerateAlerts(
  unitId: string,
  currentMetric: {
    gross_revenue: number;
    margin_percentage: number;
    date: string | Date;
  },
  historicalMetrics: Array<{
    gross_revenue: number;
    margin_percentage: number;
    date: string | Date;
  }>,
  marginTarget?: number
): Promise<Array<{
  alert_type: 'REVENUE_DROP' | 'LOW_MARGIN' | 'ANOMALY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metadata: Record<string, any>;
}>> {
  const alerts: Array<{
    alert_type: 'REVENUE_DROP' | 'LOW_MARGIN' | 'ANOMALY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    metadata: Record<string, any>;
  }> = [];

  if (historicalMetrics.length < 7) {
    // Dados insuficientes para detecção
    return alerts;
  }

  // 1. Detectar anomalias via z-score (usando Math.js)
  const historicalRevenues = historicalMetrics.map(m => m.gross_revenue);
  const anomalyResult = detectAnomaly(
    currentMetric.gross_revenue,
    historicalRevenues
  );

  if (anomalyResult.isAnomaly && Math.abs(anomalyResult.zScore) > 2) {
    const severityMap: Record<'low' | 'medium' | 'high', 'LOW' | 'MEDIUM' | 'HIGH'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
    };

    alerts.push({
      alert_type: 'ANOMALY',
      severity: severityMap[anomalyResult.severity],
      message: `Anomalia detectada na receita bruta: ${Math.abs(anomalyResult.deviationPercentage).toFixed(1)}% ${anomalyResult.deviationPercentage > 0 ? 'acima' : 'abaixo'} do esperado (z-score: ${anomalyResult.zScore.toFixed(2)})`,
      metadata: {
        zScore: anomalyResult.zScore,
        deviationPercentage: anomalyResult.deviationPercentage,
        expectedRange: anomalyResult.expectedRange,
        currentValue: currentMetric.gross_revenue,
      },
    });
  }

  // 2. Detectar queda significativa em receita (>10% comparado com média dos últimos 7 dias)
  const last7DaysRevenues = historicalMetrics
    .slice(-7)
    .map(m => m.gross_revenue);
  const revenueDropResult = detectRevenueDrop(
    currentMetric.gross_revenue,
    last7DaysRevenues
  );

  if (revenueDropResult.hasDrop) {
    const severityMap: Record<'low' | 'medium' | 'high', 'LOW' | 'MEDIUM' | 'HIGH'> = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
    };

    alerts.push({
      alert_type: 'REVENUE_DROP',
      severity: severityMap[revenueDropResult.severity],
      message: `Queda significativa na receita bruta: ${revenueDropResult.dropPercentage.toFixed(1)}% abaixo da média dos últimos 7 dias`,
      metadata: {
        dropPercentage: revenueDropResult.dropPercentage,
        average7Days: revenueDropResult.average7Days,
        currentRevenue: currentMetric.gross_revenue,
      },
    });
  }

  // 3. Detectar margem abaixo do target
  if (marginTarget !== undefined && marginTarget > 0) {
    const marginResult = detectLowMargin(
      currentMetric.margin_percentage,
      marginTarget
    );

    if (marginResult.isBelowTarget) {
      const severityMap: Record<'low' | 'medium' | 'high', 'LOW' | 'MEDIUM' | 'HIGH'> = {
        low: 'LOW',
        medium: 'MEDIUM',
        high: 'HIGH',
      };

      alerts.push({
        alert_type: 'LOW_MARGIN',
        severity: severityMap[marginResult.severity],
        message: `Margem abaixo do target: ${currentMetric.margin_percentage.toFixed(1)}% (target: ${marginTarget.toFixed(1)}%, desvio: ${marginResult.deviation.toFixed(1)} pontos)`,
        metadata: {
          currentMargin: currentMetric.margin_percentage,
          targetMargin: marginTarget,
          deviation: marginResult.deviation,
        },
      });
    }
  }

  return alerts;
}
