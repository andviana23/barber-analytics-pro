/**
 * @fileoverview ETL Diário Cron Job
 * @module app/api/cron/etl-diario
 * @description Executa pipeline ETL diário para todas as unidades ativas
 *
 * Fluxo:
 * 1. Verificar idempotência (não executar se já foi executado hoje)
 * 2. Criar registro em etl_runs com status RUNNING
 * 3. Buscar unidades ativas
 * 4. Processar unidades em batches paralelos (5 por vez)
 * 5. Atualizar status do etl_runs (SUCCESS/FAILED/PARTIAL)
 * 6. Structured logging em todas as etapas
 *
 * Schedule: 0 3 * * * (03:00 BRT diariamente)
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seções 3.1.2, 3.1.3, 3.1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureIdempotency, createRunRecord, updateRunStatus } from '@/lib/idempotency';
import { processInBatches } from '@/lib/parallelProcessing';
import { logger } from '@/lib/logger';
import { etlDaily } from '@/lib/analytics/etl';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';

// Cliente Supabase com service role (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RUN_TYPE = 'ETL_DIARIO';
const BATCH_SIZE = parseInt(process.env.ANALYTICS_BATCH_SIZE || '5', 10);

/**
 * GET /api/cron/etl-diario
 *
 * Executa o pipeline ETL diário para todas as unidades ativas
 *
 * Autenticação: Bearer token via CRON_SECRET header
 *
 * @param request - Next.js request object
 * @returns JSON com resultado da execução
 */
export async function GET(request: NextRequest) {
  const correlationId = `etl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('ETL Diário iniciado', {
    correlationId,
    jobId: correlationId,
    timestamp: new Date().toISOString(),
  });

  // 1. Verificar autenticação usando middleware
  const authError = cronAuthMiddleware(request);
  if (authError) {
    return authError;
  }

  const runDate = new Date().toISOString().split('T')[0];

  try {
    // 2. Verificar idempotência
    logger.info('Verificando idempotência', {
      correlationId,
      jobId: correlationId,
      runType: RUN_TYPE,
      runDate,
    });

    const idempotencyCheck = await ensureIdempotency(RUN_TYPE, runDate);

    if (!idempotencyCheck.canProceed) {
      logger.info('ETL já executado ou em andamento, pulando execução', {
        correlationId,
        jobId: correlationId,
        runDate,
        reason: idempotencyCheck.reason,
        existingRunId: idempotencyCheck.existingRunId,
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        message: `ETL já executado para ${runDate}`,
        existingRunId: idempotencyCheck.existingRunId,
        correlationId,
      });
    }

    // 3. Criar registro de execução
    logger.info('Criando registro de execução', {
      correlationId,
      jobId: correlationId,
      runType: RUN_TYPE,
      runDate,
    });

    const runId = await createRunRecord(RUN_TYPE, runDate, 'cron');

    logger.info('Registro de execução criado', {
      correlationId,
      jobId: correlationId,
      runId,
    });

    // 4. Buscar unidades ativas
    logger.info('Buscando unidades ativas', {
      correlationId,
      jobId: correlationId,
    });

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (unitsError) {
      logger.error('Erro ao buscar unidades', {
        correlationId,
        jobId: correlationId,
        error: unitsError.message,
        stack: unitsError.stack,
      });

      await updateRunStatus(runId, 'FAILED', `Erro ao buscar unidades: ${unitsError.message}`);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch units',
          correlationId,
          runId,
        },
        { status: 500 }
      );
    }

    if (!units || units.length === 0) {
      logger.warn('Nenhuma unidade ativa encontrada', {
        correlationId,
        jobId: correlationId,
      });

      await updateRunStatus(runId, 'SUCCESS', 'Nenhuma unidade ativa para processar');

      return NextResponse.json({
        success: true,
        message: 'Nenhuma unidade ativa para processar',
        unitsProcessed: 0,
        correlationId,
        runId,
      });
    }

    logger.info('Unidades ativas encontradas', {
      correlationId,
      jobId: correlationId,
      unitsCount: units.length,
      unitIds: units.map(u => u.id),
    });

    // 5. Processar unidades em batches paralelos
    logger.info('Iniciando processamento paralelo em batches', {
      correlationId,
      jobId: correlationId,
      totalUnits: units.length,
      batchSize: BATCH_SIZE,
    });

    const runDateObj = new Date(runDate);

    const results = await processInBatches(
      units,
      async (unit, index) => {
        const unitCorrelationId = `${correlationId}-unit-${unit.id}`;

        logger.info('Processando unidade', {
          correlationId: unitCorrelationId,
          jobId: correlationId,
          unitId: unit.id,
          unitName: unit.name,
          index: index + 1,
          totalUnits: units.length,
        });

        try {
          const result = await etlDaily(unit.id, runDateObj, unitCorrelationId);

          if (result.success) {
            logger.info('Unidade processada com sucesso', {
              correlationId: unitCorrelationId,
              jobId: correlationId,
              unitId: unit.id,
              metricsProcessed: result.metricsProcessed,
            });
          } else {
            logger.error('Erro ao processar unidade', {
              correlationId: unitCorrelationId,
              jobId: correlationId,
              unitId: unit.id,
              errors: result.errors,
            });
          }

          return {
            unitId: unit.id,
            unitName: unit.name,
            success: result.success,
            metricsProcessed: result.metricsProcessed,
            errors: result.errors || [],
          };
        } catch (error: any) {
          logger.error('Exceção ao processar unidade', {
            correlationId: unitCorrelationId,
            jobId: correlationId,
            unitId: unit.id,
            error: error.message,
            stack: error.stack,
          });

          return {
            unitId: unit.id,
            unitName: unit.name,
            success: false,
            metricsProcessed: 0,
            errors: [error.message || 'Unknown error'],
          };
        }
      },
      BATCH_SIZE
    );

    // 6. Calcular estatísticas finais
    const successfulUnits = results.filter(r => r.success).length;
    const failedUnits = results.filter(r => !r.success).length;
    const totalMetricsProcessed = results.reduce(
      (sum, r) => sum + (r.metricsProcessed || 0),
      0
    );

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    logger.info('ETL Diário concluído', {
      correlationId,
      jobId: correlationId,
      runId,
      durationSeconds,
      totalUnits: units.length,
      successfulUnits,
      failedUnits,
      totalMetricsProcessed,
    });

    // 7. Atualizar status do registro de execução
    let finalStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' = 'SUCCESS';
    let errorMessage: string | undefined;

    if (failedUnits === units.length) {
      finalStatus = 'FAILED';
      errorMessage = `Todas as ${failedUnits} unidades falharam`;
    } else if (failedUnits > 0) {
      finalStatus = 'PARTIAL';
      errorMessage = `${failedUnits} de ${units.length} unidades falharam`;
    }

    await updateRunStatus(runId, finalStatus, errorMessage);

    // Atualizar campos adicionais
    await supabase
      .from('etl_runs')
      .update({
        units_processed: units.length,
        records_inserted: totalMetricsProcessed,
        duration_seconds: durationSeconds,
      })
      .eq('id', runId);

    return NextResponse.json({
      success: true,
      runId,
      correlationId,
      runDate,
      durationSeconds,
      summary: {
        totalUnits: units.length,
        successfulUnits,
        failedUnits,
        totalMetricsProcessed,
      },
      results: results.map(r => ({
        unitId: r.unitId,
        unitName: r.unitName,
        success: r.success,
        metricsProcessed: r.metricsProcessed,
        errors: r.errors,
      })),
    });
  } catch (error: any) {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    logger.error('Erro crítico no ETL Diário', {
      correlationId,
      jobId: correlationId,
      error: error.message,
      stack: error.stack,
      durationSeconds,
    });

    // Tentar atualizar status como FAILED se tiver runId
    try {
      const runId = await createRunRecord(RUN_TYPE, runDate, 'cron');
      await updateRunStatus(runId, 'FAILED', error.message);
    } catch (updateError) {
      logger.error('Erro ao atualizar status após falha crítica', {
        correlationId,
        error: updateError instanceof Error ? updateError.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        correlationId,
        durationSeconds,
      },
      { status: 500 }
    );
  }
}

