/**
 * @fileoverview Cron Job para Gerar Despesas Recorrentes
 * @module app/api/cron/gerar-despesas-recorrentes
 * @description Gera automaticamente as próximas parcelas de despesas recorrentes ativas
 *
 * Fluxo:
 * 1. Verificar idempotência (não executar se já foi executado hoje)
 * 2. Buscar todas as configurações de recorrência ativas
 * 3. Para cada configuração, verificar se precisa gerar próxima parcela
 * 4. Chamar função SQL fn_generate_next_recurring_expense para gerar parcela
 * 5. Registrar resultados e enviar notificações se necessário
 *
 * Schedule: 0 2 * * * (02:00 BRT diariamente - antes do ETL)
 *
 * @author Andrey Viana
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureIdempotency, createRunRecord, updateRunStatus } from '@/lib/idempotency';
import { logger } from '@/lib/logger';
import { cronAuthMiddleware } from '@/lib/middleware/cronAuth';
import { sendTelegramMessage } from '@/lib/telegram';

// Cliente Supabase com service role (bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RUN_TYPE = 'GERAR_DESPESAS_RECORRENTES';

/**
 * GET /api/cron/gerar-despesas-recorrentes
 *
 * Gera automaticamente as próximas parcelas de despesas recorrentes
 *
 * Autenticação: Bearer token via CRON_SECRET header
 *
 * @param request - Next.js request object
 * @returns JSON com resultado da execução
 */
export async function GET(request: NextRequest) {
  const correlationId = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('Geração de despesas recorrentes iniciada', {
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
      logger.info('Geração já executada ou em andamento, pulando execução', {
        correlationId,
        jobId: correlationId,
        runDate,
        reason: idempotencyCheck.reason,
        existingRunId: idempotencyCheck.existingRunId,
      });

      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Geração já executada para ${runDate}`,
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

    const runId = await createRunRecord(RUN_TYPE, runDate, {
      correlationId,
      status: 'RUNNING',
    });

    // 4. Buscar configurações de recorrência ativas que precisam gerar parcelas
    logger.info('Buscando configurações de recorrência ativas', {
      correlationId,
      runId,
    });

    const { data: recurringConfigs, error: fetchError } = await supabase
      .from('recurring_expenses')
      .select('id, expense_id, unit_id, parcelas_geradas, total_parcelas, status, data_inicio')
      .eq('status', 'ativo')
      .eq('is_active', true)
      .lt('parcelas_geradas', supabase.raw('total_parcelas'));

    if (fetchError) {
      throw new Error(`Erro ao buscar configurações: ${fetchError.message}`);
    }

    if (!recurringConfigs || recurringConfigs.length === 0) {
      logger.info('Nenhuma configuração de recorrência encontrada', {
        correlationId,
        runId,
      });

      await updateRunStatus(runId, 'SUCCESS', {
        correlationId,
        processed: 0,
        generated: 0,
        errors: 0,
        duration: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        message: 'Nenhuma configuração de recorrência encontrada',
        processed: 0,
        generated: 0,
        correlationId,
        runId,
      });
    }

    logger.info(`Encontradas ${recurringConfigs.length} configurações ativas`, {
      correlationId,
      runId,
      count: recurringConfigs.length,
    });

    // 5. Processar cada configuração
    let processed = 0;
    let generated = 0;
    let errors = 0;
    const errorsList: Array<{ id: string; error: string }> = [];

    for (const config of recurringConfigs) {
      try {
        processed++;

        // Verificar se já passou a data de vencimento da última parcela gerada
        // Se ainda não gerou nenhuma, verificar se passou a data de início
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(config.data_inicio);
        startDate.setHours(0, 0, 0, 0);

        // Calcular data da próxima parcela esperada
        const nextInstallmentNumber = config.parcelas_geradas + 1;
        const nextDueDate = new Date(startDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + nextInstallmentNumber - 1);

        // Só gerar se já passou a data de vencimento ou se é a primeira parcela e já passou a data de início
        if (today < nextDueDate && config.parcelas_geradas > 0) {
          logger.debug('Parcela ainda não venceu, pulando', {
            correlationId,
            configId: config.id,
            nextDueDate: nextDueDate.toISOString().split('T')[0],
            today: today.toISOString().split('T')[0],
          });
          continue;
        }

        logger.info('Gerando próxima parcela', {
          correlationId,
          configId: config.id,
          expenseId: config.expense_id,
          unitId: config.unit_id,
          installmentNumber: nextInstallmentNumber,
        });

        // Chamar função SQL para gerar próxima parcela
        const { data: result, error: generateError } = await supabase.rpc(
          'fn_generate_next_recurring_expense',
          {
            p_recurring_expense_id: config.id,
          }
        );

        if (generateError) {
          throw new Error(generateError.message);
        }

        if (result && result.length > 0) {
          generated++;
          logger.info('Parcela gerada com sucesso', {
            correlationId,
            configId: config.id,
            expenseId: result[0].expense_id,
            installmentNumber: result[0].installment_number,
            dueDate: result[0].due_date,
          });
        } else {
          logger.info('Nenhuma parcela gerada (série finalizada ou erro)', {
            correlationId,
            configId: config.id,
          });
        }
      } catch (error: any) {
        errors++;
        const errorMsg = error.message || 'Erro desconhecido';
        errorsList.push({
          id: config.id,
          error: errorMsg,
        });

        logger.error('Erro ao processar configuração', {
          correlationId,
          configId: config.id,
          error: errorMsg,
        });
      }
    }

    // 6. Atualizar status da execução
    const duration = Date.now() - startTime;
    const finalStatus = errors === 0 ? 'SUCCESS' : errors < processed ? 'PARTIAL' : 'FAILED';

    await updateRunStatus(runId, finalStatus, {
      correlationId,
      processed,
      generated,
      errors,
      errorsList: errorsList.slice(0, 10), // Limitar a 10 erros no log
      duration,
    });

    // 7. Enviar notificação se houver erros ou se gerou muitas parcelas
    if (errors > 0 || generated > 0) {
      try {
        const message = `📅 *Geração de Despesas Recorrentes*\n\n` +
          `✅ Processadas: ${processed}\n` +
          `📝 Geradas: ${generated}\n` +
          `❌ Erros: ${errors}\n` +
          `⏱️ Duração: ${(duration / 1000).toFixed(2)}s`;

        await sendTelegramMessage(message);
      } catch (telegramError) {
        logger.error('Erro ao enviar notificação Telegram', {
          correlationId,
          error: telegramError,
        });
      }
    }

    logger.info('Geração de despesas recorrentes concluída', {
      correlationId,
      runId,
      processed,
      generated,
      errors,
      duration,
      status: finalStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Processadas ${processed} configurações, ${generated} parcelas geradas`,
      processed,
      generated,
      errors,
      errorsList: errorsList.slice(0, 5), // Retornar apenas 5 erros na resposta
      correlationId,
      runId,
      duration,
    });
  } catch (error: any) {
    logger.error('Erro fatal na geração de despesas recorrentes', {
      correlationId,
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro desconhecido',
        correlationId,
      },
      { status: 500 }
    );
  }
}

