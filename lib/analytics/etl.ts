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
  revenues_count: number;
  expenses_count: number;
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
  runDate: Date
): Promise<ETLResult> {
  try {
    console.log(
      `[ETL] Starting ETL for unit ${unitId} on ${runDate.toISOString()}`
    );

    // 1. Extract - Buscar dados do banco
    const inputData = await extractData(unitId, runDate);

    if (!inputData) {
      return {
        success: false,
        metricsProcessed: 0,
        errors: ['Failed to extract data from database'],
      };
    }

    // 2. Transform - Calcular métricas
    const metrics = await transformData(inputData, unitId, runDate);

    if (!metrics) {
      return {
        success: false,
        metricsProcessed: 0,
        errors: ['Failed to transform data'],
      };
    }

    // 3. Load - Salvar no banco
    const loadResult = await loadMetrics(metrics, unitId, runDate);

    if (!loadResult.success) {
      return {
        success: false,
        metricsProcessed: 0,
        errors: loadResult.errors,
      };
    }

    console.log(
      `[ETL] Successfully processed ${metrics.length} metrics for unit ${unitId}`
    );

    return {
      success: true,
      metricsProcessed: metrics.length,
    };
  } catch (error) {
    console.error('[ETL] Error in etlDaily:', error);
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
  runDate: Date
): Promise<ETLInputData | null> {
  try {
    // TODO: Implementar busca real via repositories
    // const revenues = await revenueRepository.findByUnitAndDate(unitId, runDate);
    // const expenses = await expenseRepository.findByUnitAndDate(unitId, runDate);

    console.log(
      `[ETL] Extracting data for unit ${unitId} on ${runDate.toISOString()}`
    );

    // Mock data temporário para desenvolvimento
    return {
      revenues: [],
      expenses: [],
    };
  } catch (error) {
    console.error('[ETL] Error extracting data:', error);
    return null;
  }
}

/**
 * Transform - Processa e agrega dados usando Danfo.js
 */
async function transformData(
  inputData: ETLInputData,
  unitId: string,
  runDate: Date
): Promise<CalculatedMetrics[] | null> {
  try {
    console.log(
      `[ETL] Transforming ${inputData.revenues.length} revenues and ${inputData.expenses.length} expenses`
    );

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
      average_ticket: revenuesCount > 0 ? grossRevenue / revenuesCount : 0,
      revenues_count: revenuesCount,
      expenses_count: expensesCount,
    };

    return [metrics];
  } catch (error) {
    console.error('[ETL] Error transforming data:', error);
    return null;
  }
}

/**
 * Load - Salva métricas em ai_metrics_daily
 */
async function loadMetrics(
  metrics: CalculatedMetrics[],
  unitId: string,
  runDate: Date
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    console.log(`[ETL] Loading ${metrics.length} metrics to database`);

    // TODO: Implementar salvamento via aiMetricsRepository
    // await aiMetricsRepository.upsert({
    //   unit_id: unitId,
    //   date: runDate,
    //   ...metrics[0]
    // });

    return { success: true };
  } catch (error) {
    console.error('[ETL] Error loading metrics:', error);
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
function deduplicateData(data: ETLInputData): ETLInputData {
  const uniqueRevenues = Array.from(
    new Map(data.revenues.map(r => [r.id, r])).values()
  );

  const uniqueExpenses = Array.from(
    new Map(data.expenses.map(e => [e.id, e])).values()
  );

  console.log(
    `[ETL] Deduplicated: ${data.revenues.length - uniqueRevenues.length} revenues, ${data.expenses.length - uniqueExpenses.length} expenses`
  );

  return {
    revenues: uniqueRevenues,
    expenses: uniqueExpenses,
  };
}
