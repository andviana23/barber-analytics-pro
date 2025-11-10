/**
 * ETL (Extract, Transform, Load) - Pipeline de processamento de dados financeiros
 *
 * Responsável por:
 * - Extrair dados de receitas e despesas do Supabase
 * - Transformar e agregar métricas usando Danfo.js
 * - Carregar métricas consolidadas em ai_metrics_daily
 *
 * @module lib/analytics/etl
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 3.1
 */

import type { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { calculateAverageTicket } from '@/lib/analytics/calculations';
import { detectAndGenerateAlerts } from '@/lib/analytics/anomalies';
import { alertsRepository } from '@/lib/repositories/alertsRepository';
import { kpiTargetsRepository } from '@/lib/repositories/kpiTargetsRepository';
import { aiMetricsRepository } from '@/lib/repositories/aiMetricsRepository';

/**
 * Interface para dados de entrada do ETL
 */
interface ETLInputData {
  revenues: any[];
  expenses: any[];
}

/**
 * Interface para métricas calculadas
 */
interface CalculatedMetrics {
  gross_revenue: number;
  total_expenses: number;
  margin_percentage: number;
  average_ticket: number;
  revenue_count: number;
  expense_count: number;
}

/**
 * Interface para resultado do ETL
 */
interface ETLResult {
  success: boolean;
  metricsProcessed: number;
  errors?: string[];
}

/**
 * Executa o pipeline ETL para uma unidade específica em uma data
 *
 * Fluxo:
 * 1. Buscar receitas do período (via revenueRepository)
 * 2. Buscar despesas do período (via expenseRepository)
 * 3. Criar DataFrame com Danfo.js
 * 4. Agrupar por data e unidade
 * 5. Calcular métricas consolidadas
 * 6. Salvar em ai_metrics_daily
 *
 * @param unitId - ID da unidade a processar
 * @param runDate - Data de referência para o processamento
 * @returns Promise com resultado do processamento
 *
 * @example
 * ```typescript
 * const result = await etlDaily('unit-123', new Date('2025-11-09'));
 * if (result.success) {
 *   console.log(`Processadas ${result.metricsProcessed} métricas`);
 * }
 * ```
 */
export async function etlDaily(
  unitId: string,
  runDate: Date,
  correlationId?: string
): Promise<ETLResult> {
  const etlCorrelationId = correlationId || `etl-${unitId}-${Date.now()}`;
  const startTime = Date.now();

  logger.info('ETL iniciado para unidade', {
    correlationId: etlCorrelationId,
    unitId,
    runDate: runDate.toISOString(),
  });

  try {
    // 1. Extract - Buscar dados do banco
    logger.info('Extraindo dados do banco', {
      correlationId: etlCorrelationId,
      unitId,
      runDate: runDate.toISOString(),
    });

    const inputData = await extractData(unitId, runDate, etlCorrelationId);

    if (!inputData) {
      logger.error('Falha ao extrair dados', {
        correlationId: etlCorrelationId,
        unitId,
      });

      return {
        success: false,
        metricsProcessed: 0,
        errors: ['Failed to extract data from database'],
      };
    }

    logger.info('Dados extraídos com sucesso', {
      correlationId: etlCorrelationId,
      unitId,
      revenuesCount: inputData.revenues.length,
      expensesCount: inputData.expenses.length,
    });

    // 2. Transform - Calcular métricas
    logger.info('Transformando dados e calculando métricas', {
      correlationId: etlCorrelationId,
      unitId,
    });

    const metrics = await transformData(inputData, unitId, runDate, etlCorrelationId);

    if (!metrics) {
      logger.error('Falha ao transformar dados', {
        correlationId: etlCorrelationId,
        unitId,
      });

      return {
        success: false,
        metricsProcessed: 0,
        errors: ['Failed to transform data'],
      };
    }

    logger.info('Métricas calculadas', {
      correlationId: etlCorrelationId,
      unitId,
      metricsCount: metrics.length,
      grossRevenue: metrics[0]?.gross_revenue,
      totalExpenses: metrics[0]?.total_expenses,
      marginPercentage: metrics[0]?.margin_percentage,
    });

    // 3. Load - Salvar no banco
    logger.info('Carregando métricas no banco', {
      correlationId: etlCorrelationId,
      unitId,
      metricsCount: metrics.length,
    });

    const loadResult = await loadMetrics(metrics, unitId, runDate, etlCorrelationId);

    if (!loadResult.success) {
      logger.error('Falha ao carregar métricas', {
        correlationId: etlCorrelationId,
        unitId,
        errors: loadResult.errors,
      });

      return {
        success: false,
        metricsProcessed: 0,
        errors: loadResult.errors,
      };
    }

    // 4. Detectar anomalias e gerar alertas
    logger.info('Detectando anomalias e gerando alertas', {
      correlationId: etlCorrelationId,
      unitId,
    });

    await detectAnomaliesAndCreateAlerts(
      unitId,
      metrics[0],
      runDate,
      etlCorrelationId
    );

    const durationMs = Date.now() - startTime;

    logger.info('ETL concluído com sucesso', {
      correlationId: etlCorrelationId,
      unitId,
      metricsProcessed: metrics.length,
      durationMs,
    });

    return {
      success: true,
      metricsProcessed: metrics.length,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logger.error('Erro no ETL', {
      correlationId: etlCorrelationId,
      unitId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      durationMs,
    });

    return {
      success: false,
      metricsProcessed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Extract - Busca receitas e despesas do período
 */
async function extractData(
  unitId: string,
  runDate: Date,
  correlationId?: string
): Promise<ETLInputData | null> {
  try {
    // TODO: Implementar busca real via repositories
    // const revenues = await revenueRepository.findByUnitAndDate(unitId, runDate);
    // const expenses = await expenseRepository.findByUnitAndDate(unitId, runDate);

    // Mock data temporário para desenvolvimento
    return {
      revenues: [],
      expenses: [],
    };
  } catch (error) {
    logger.error('Erro ao extrair dados', {
      correlationId,
      unitId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Transform - Processa e agrega dados usando Danfo.js
 */
async function transformData(
  inputData: ETLInputData,
  unitId: string,
  runDate: Date,
  correlationId?: string
): Promise<CalculatedMetrics[] | null> {
  try {
    // TODO: Implementar transformação com Danfo.js
    // import * as dfd from 'danfojs-node';
    // const df = new dfd.DataFrame(inputData.revenues);

    // Por enquanto, retorna métricas calculadas manualmente
    const grossRevenue = inputData.revenues.reduce(
      (sum, r) => sum + (r.value || 0),
      0
    );
    const totalExpenses = inputData.expenses.reduce(
      (sum, e) => sum + (e.value || 0),
      0
    );
    const revenuesCount = inputData.revenues.length;
    const expensesCount = inputData.expenses.length;

    const metrics: CalculatedMetrics = {
      gross_revenue: grossRevenue,
      total_expenses: totalExpenses,
      margin_percentage:
        grossRevenue > 0
          ? ((grossRevenue - totalExpenses) / grossRevenue) * 100
          : 0,
      average_ticket: calculateAverageTicket(grossRevenue, revenuesCount),
      revenue_count: revenuesCount,
      expense_count: expensesCount,
    };

    return [metrics];
  } catch (error) {
    logger.error('Erro ao transformar dados', {
      correlationId,
      unitId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Load - Salva métricas em ai_metrics_daily
 */
async function loadMetrics(
  metrics: CalculatedMetrics[],
  unitId: string,
  runDate: Date,
  correlationId?: string
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    // TODO: Implementar salvamento via aiMetricsRepository
    // await aiMetricsRepository.upsert({
    //   unit_id: unitId,
    //   date: runDate,
    //   ...metrics[0]
    // });

    return { success: true };
  } catch (error) {
    logger.error('Erro ao carregar métricas', {
      correlationId,
      unitId,
      metricsCount: metrics.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Valida se os dados de entrada são válidos
 */
function validateInputData(data: ETLInputData): boolean {
  if (!data.revenues || !Array.isArray(data.revenues)) {
    console.error('[ETL] Invalid revenues data');
    return false;
  }

  if (!data.expenses || !Array.isArray(data.expenses)) {
    console.error('[ETL] Invalid expenses data');
    return false;
  }

  return true;
}

/**
 * Detecta e remove duplicatas nos dados de entrada
 */
function deduplicateData(data: ETLInputData, correlationId?: string): ETLInputData {
  const uniqueRevenues = Array.from(
    new Map(data.revenues.map(r => [r.id, r])).values()
  );

  const uniqueExpenses = Array.from(
    new Map(data.expenses.map(e => [e.id, e])).values()
  );

  const duplicatesRemoved = {
    revenues: data.revenues.length - uniqueRevenues.length,
    expenses: data.expenses.length - uniqueExpenses.length,
  };

  if (duplicatesRemoved.revenues > 0 || duplicatesRemoved.expenses > 0) {
    logger.info('Duplicatas removidas', {
      correlationId,
      duplicatesRemoved,
    });
  }

  return {
    revenues: uniqueRevenues,
    expenses: uniqueExpenses,
  };
}

/**
 * Detecta anomalias e cria alertas após processar métricas
 *
 * Esta função:
 * 1. Busca métricas históricas dos últimos 30 dias
 * 2. Busca target de margem (kpi_targets)
 * 3. Detecta anomalias usando z-score, quedas de receita e margem baixa
 * 4. Cria alertas na tabela alerts_events
 *
 * @param unitId - ID da unidade
 * @param currentMetric - Métrica atual calculada
 * @param runDate - Data de referência
 * @param correlationId - ID de correlação para logs
 */
async function detectAnomaliesAndCreateAlerts(
  unitId: string,
  currentMetric: CalculatedMetrics,
  runDate: Date,
  correlationId?: string
): Promise<void> {
  try {
    // Buscar métricas históricas dos últimos 30 dias
    const thirtyDaysAgo = new Date(runDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: historicalMetrics, error: metricsError } =
      await aiMetricsRepository.findByPeriod(unitId, thirtyDaysAgo, runDate);

    if (metricsError || !historicalMetrics || historicalMetrics.length < 7) {
      logger.warn('Dados históricos insuficientes para detecção de anomalias', {
        correlationId,
        unitId,
        historicalCount: historicalMetrics?.length || 0,
      });
      return;
    }

    // Buscar target de margem
    const { data: marginTarget } = await kpiTargetsRepository.findByKPI(
      unitId,
      'MARGIN'
    );

    // Preparar dados para detecção
    const currentMetricData = {
      gross_revenue: currentMetric.gross_revenue,
      margin_percentage: currentMetric.margin_percentage,
      date: runDate,
    };

    const historicalMetricsData = historicalMetrics.map(m => ({
      gross_revenue: m.gross_revenue,
      margin_percentage: m.margin_percentage,
      date: m.date,
    }));

    // Detectar anomalias e gerar alertas
    const detectedAlerts = await detectAndGenerateAlerts(
      unitId,
      currentMetricData,
      historicalMetricsData,
      marginTarget?.target_value
    );

    // Criar alertas no banco
    for (const alert of detectedAlerts) {
      const { error: alertError } = await alertsRepository.create({
        unit_id: unitId,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata,
      });

      if (alertError) {
        logger.error('Erro ao criar alerta', {
          correlationId,
          unitId,
          alertType: alert.alert_type,
          error: alertError,
        });
      } else {
        logger.info('Alerta criado com sucesso', {
          correlationId,
          unitId,
          alertType: alert.alert_type,
          severity: alert.severity,
        });
      }
    }

    if (detectedAlerts.length > 0) {
      logger.info('Anomalias detectadas e alertas criados', {
        correlationId,
        unitId,
        alertsCount: detectedAlerts.length,
      });
    }
  } catch (error) {
    logger.error('Erro ao detectar anomalias e criar alertas', {
      correlationId,
      unitId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
