/**
 * @fileoverview Idempotency Utilities
 * @module lib/idempotency
 * @description Garante que cron jobs não sejam executados múltiplas vezes para a mesma data
 */

import { supabaseAdmin as supabase } from './supabaseAdmin';

export interface IdempotencyResult {
  canProceed: boolean;
  existingRunId?: string;
  reason?: string;
}

/**
 * Verifica se uma execução de cron job já foi realizada com sucesso
 * @param runType Tipo da execução (ex: 'ETL_DIARIO', 'RELATORIO_SEMANAL')
 * @param runDate Data da execução no formato YYYY-MM-DD
 * @returns Resultado da verificação de idempotência
 */
export async function ensureIdempotency(
  runType: string,
  runDate: string
): Promise<IdempotencyResult> {
  // Verificar se já existe execução bem-sucedida para esta data
  const { data: existingRun } = await supabase
    .from('etl_runs')
    .select('id, status, finished_at')
    .eq('run_type', runType)
    .eq('run_date', runDate)
    .eq('status', 'SUCCESS')
    .single();

  if (existingRun) {
    return {
      canProceed: false,
      existingRunId: existingRun.id,
      reason: `Execução bem-sucedida já existe para ${runDate}`,
    };
  }

  // Verificar se há execução em andamento
  const { data: runningRun } = await supabase
    .from('etl_runs')
    .select('id, started_at')
    .eq('run_type', runType)
    .eq('run_date', runDate)
    .eq('status', 'RUNNING')
    .single();

  if (runningRun) {
    // Verificar se está travado (mais de 10 minutos)
    const startedAt = new Date(runningRun.started_at);
    const now = new Date();
    const minutesElapsed = (now.getTime() - startedAt.getTime()) / 1000 / 60;

    if (minutesElapsed > 10) {
      // Marcar como falha e permitir nova execução
      await supabase
        .from('etl_runs')
        .update({
          status: 'FAILED',
          error_message: 'Timeout - execução travada por mais de 10 minutos',
          finished_at: new Date().toISOString(),
        })
        .eq('id', runningRun.id);

      return {
        canProceed: true,
        reason: 'Execução anterior travada, marcada como falha',
      };
    }

    return {
      canProceed: false,
      existingRunId: runningRun.id,
      reason: `Execução em andamento desde ${startedAt.toISOString()}`,
    };
  }

  return {
    canProceed: true,
    reason: 'Nenhuma execução encontrada, pode prosseguir',
  };
}

/**
 * Cria um registro de execução no banco
 * @param runType Tipo da execução
 * @param runDate Data da execução
 * @param triggerSource Fonte do trigger ('cron', 'manual', 'api')
 * @returns ID do registro criado
 */
export async function createRunRecord(
  runType: string,
  runDate: string,
  triggerSource: string = 'cron'
): Promise<string> {
  const { data, error } = await supabase
    .from('etl_runs')
    .insert({
      run_type: runType,
      run_date: runDate,
      status: 'RUNNING',
      trigger_source: triggerSource,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Falha ao criar registro de execução: ${error?.message}`);
  }

  return data.id;
}

/**
 * Atualiza o status de uma execução
 * @param runId ID do registro de execução
 * @param status Novo status ('SUCCESS', 'FAILED', 'PARTIAL')
 * @param errorMessage Mensagem de erro (se houver)
 */
export async function updateRunStatus(
  runId: string,
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL',
  errorMessage?: string
): Promise<void> {
  const updateData: any = {
    status,
    finished_at: new Date().toISOString(),
  };

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('etl_runs')
    .update(updateData)
    .eq('id', runId);

  if (error) {
    throw new Error(`Falha ao atualizar status: ${error.message}`);
  }
}
