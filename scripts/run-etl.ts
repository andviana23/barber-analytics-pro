#!/usr/bin/env tsx

/**
 * Manual ETL Runner
 * ------------------
 * Executa o ETL diário utilizando a mesma lógica da rota /api/cron/etl-diario,
 * porém sem depender do ambiente serverless da Vercel.
 *
 * Uso:
 *   pnpm tsx scripts/run-etl.ts        # Executa com verificação de idempotência
 *   pnpm tsx scripts/run-etl.ts --force  # Ignora idempotência e força nova execução
 */

// ⚠️ IMPORTANTE: Carregar .env ANTES de qualquer import que use process.env
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do .env (arquivo principal do projeto)
config({ path: path.resolve(process.cwd(), '.env') });

// Garantir que NEXT_PUBLIC_SUPABASE_URL está disponível
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}

// Agora sim importar os módulos que dependem das variáveis
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  ensureIdempotency,
  createRunRecord,
  updateRunStatus,
} from '../lib/idempotency';
import { processInBatches } from '../lib/parallelProcessing';
import { etlDaily } from '../lib/analytics/etl';
import { logger } from '../lib/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log para debug
console.log('📋 Variáveis carregadas:');
console.log(
  '   VITE_SUPABASE_URL:',
  process.env.VITE_SUPABASE_URL ? '✅' : '❌'
);
console.log(
  '   SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'
);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurado.');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado.');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RUN_TYPE = 'ETL_DIARIO';
const BATCH_SIZE = parseInt(process.env.ANALYTICS_BATCH_SIZE ?? '5', 10);

interface Unit {
  id: string;
  name: string;
}

interface UnitResult {
  unitId: string;
  unitName: string;
  success: boolean;
  metricsProcessed: number;
  errors: string[];
}

function createCorrelationId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const force = args.has('--force');
  const runDate = new Date().toISOString().split('T')[0];
  const correlationId = createCorrelationId('cli-etl');

  console.log('🚀 Iniciando ETL Diário via CLI');
  console.log(`📅 Data de referência: ${runDate}`);
  console.log(`🔁 Batch size: ${BATCH_SIZE}`);
  console.log(
    force
      ? '⚠️  Forçando execução (ignorando idempotência)'
      : '🛡️  Idempotência habilitada'
  );
  console.log('');

  // Se --force, deletar execuções anteriores para o mesmo dia
  if (force) {
    const { error: deleteError } = await supabase
      .from('etl_runs')
      .delete()
      .eq('run_type', RUN_TYPE)
      .eq('run_date', runDate);

    if (deleteError) {
      console.warn(
        '⚠️  Não foi possível deletar execuções anteriores:',
        deleteError.message
      );
    } else {
      console.log('🗑️  Execuções anteriores removidas (force mode)');
    }
  }

  if (!force) {
    const idempotency = await ensureIdempotency(RUN_TYPE, runDate);

    if (!idempotency.canProceed) {
      console.warn(
        '⏭️  Execução interrompida por idempotência:',
        idempotency.reason
      );
      if (idempotency.existingRunId) {
        console.warn(`ℹ️  Run existente: ${idempotency.existingRunId}`);
      }
      process.exit(0);
    }
  }

  let runId: string | null = null;

  try {
    runId = await createRunRecord(
      RUN_TYPE,
      runDate,
      'cron' // Usar 'cron' conforme constraint do banco
    );
    console.log(`🆔 Registro de execução criado: ${runId}`);

    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (unitsError) {
      throw new Error(`Erro ao buscar unidades: ${unitsError.message}`);
    }

    if (!units || units.length === 0) {
      console.warn(
        '⚠️  Nenhuma unidade ativa encontrada. Marcando execução como SUCCESS sem processamento.'
      );
      await updateRunStatus(
        runId,
        'SUCCESS',
        'Nenhuma unidade ativa para processar'
      );
      await supabase
        .from('etl_runs')
        .update({
          units_processed: 0,
          records_inserted: 0,
          duration_seconds: 0,
        })
        .eq('id', runId);
      process.exit(0);
    }

    console.log(`🏢 Unidades ativas encontradas: ${units.length}`);

    const startTime = Date.now();
    const runDateObj = new Date(runDate);

    const results = await processInBatches<Unit, UnitResult>(
      units,
      async (unit, index) => {
        const unitCorrelationId = createCorrelationId(`cli-etl-${unit.id}`);
        logger.info('Processando unidade via CLI', {
          correlationId: unitCorrelationId,
          jobId: correlationId,
          unitId: unit.id,
          unitName: unit.name,
          index: index + 1,
          totalUnits: units.length,
        });

        try {
          const result = await etlDaily(unit.id, runDateObj, unitCorrelationId);
          return {
            unitId: unit.id,
            unitName: unit.name,
            success: result.success,
            metricsProcessed: result.metricsProcessed,
            errors: result.errors ?? [],
          };
        } catch (error: any) {
          return {
            unitId: unit.id,
            unitName: unit.name,
            success: false,
            metricsProcessed: 0,
            errors: [error?.message ?? 'Unknown error'],
          };
        }
      },
      BATCH_SIZE
    );

    const successfulUnits = results.filter(r => r.success).length;
    const failedUnits = results.filter(r => !r.success).length;
    const totalMetricsProcessed = results.reduce(
      (sum, r) => sum + (r.metricsProcessed || 0),
      0
    );
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    console.log('');
    console.log('📊 Resumo ETL CLI');
    console.log(`   • Run ID: ${runId}`);
    console.log(`   • Duração: ${durationSeconds}s`);
    console.log(
      `   • Unidades processadas: ${successfulUnits}/${units.length}`
    );
    console.log(`   • Unidades com erro: ${failedUnits}`);
    console.log(`   • Métricas geradas: ${totalMetricsProcessed}`);

    if (failedUnits > 0) {
      console.log('');
      console.log('❗ Unidades com falha:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(
            `   - ${r.unitName} (${r.unitId}): ${r.errors.join('; ')}`
          );
        });
    }

    let status: 'SUCCESS' | 'FAILED' | 'PARTIAL' = 'SUCCESS';
    let errorMessage: string | undefined;

    if (failedUnits === units.length) {
      status = 'FAILED';
      errorMessage = 'Todas as unidades falharam durante o ETL (CLI)';
    } else if (failedUnits > 0) {
      status = 'PARTIAL';
      errorMessage = `${failedUnits} de ${units.length} unidades falharam durante o ETL (CLI)`;
    }

    await updateRunStatus(runId, status, errorMessage);

    await supabase
      .from('etl_runs')
      .update({
        units_processed: units.length,
        records_inserted: totalMetricsProcessed,
        duration_seconds: durationSeconds,
      })
      .eq('id', runId);

    if (status === 'SUCCESS') {
      console.log('\n✅ ETL concluído com sucesso via CLI!');
      process.exit(0);
    }

    if (status === 'PARTIAL') {
      console.warn(
        '\n⚠️  ETL concluído parcialmente. Consulte o resumo acima para detalhes.'
      );
      process.exit(2);
    }

    console.error('\n❌ ETL falhou para todas as unidades.');
    process.exit(1);
  } catch (error: any) {
    console.error(
      '\n❌ Erro crítico ao executar ETL via CLI:',
      error?.message ?? error
    );

    if (runId) {
      try {
        await updateRunStatus(
          runId,
          'FAILED',
          error?.message ?? 'Erro desconhecido'
        );
      } catch (updateError: any) {
        console.error(
          'Erro adicional ao atualizar status de execução:',
          updateError?.message ?? updateError
        );
      }
    }

    process.exit(1);
  }
}

main();
