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
 * Calcula desvio padrão de um conjunto de valores
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

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;

  return Math.sqrt(variance);
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

  // Calcular estatísticas
  const mean =
    historicalValues.reduce((sum, val) => sum + val, 0) /
    historicalValues.length;
  const stdDev = calculateStandardDeviation(historicalValues);
  const zScore = calculateZScore(currentValue, mean, stdDev);

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
    mean !== 0 ? ((currentValue - mean) / Math.abs(mean)) * 100 : 0;

  // Definir faixa esperada (±2 desvios padrão = 95% dos casos normais)
  const expectedRange = {
    min: Math.round((mean - 2 * stdDev) * 100) / 100,
    max: Math.round((mean + 2 * stdDev) * 100) / 100,
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
    alerts.push({
      type: 'outlier',
      metric: metricName,
      currentValue,
      expectedValue:
        historicalValues.reduce((sum, val) => sum + val, 0) /
        historicalValues.length,
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
    alerts.push({
      type: 'trend_break',
      metric: metricName,
      currentValue,
      expectedValue:
        olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length,
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
