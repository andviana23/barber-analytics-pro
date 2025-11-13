/**
 * @file idempotency.test.ts
 * @description Testes unitários para sistema de idempotência do ETL
 * @author Andrey Viana
 * @date 2025-11-10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ensureIdempotency,
  createRunRecord,
  updateRunStatus,
} from '../../lib/idempotency';

// Mock do Supabase
vi.mock('../../src/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

describe('Idempotência do ETL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureIdempotency', () => {
    it('deve permitir execução se não houver registro anterior', async () => {
      // Simular: nenhuma execução anterior
      const { supabase } = await import('../../src/services/supabase');
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.canProceed).toBe(true);
      expect(result.reason).toContain('Não há execução anterior');
    });

    it('deve bloquear execução se já existe com status SUCCESS', async () => {
      // Simular: execução anterior bem-sucedida
      const { supabase } = await import('../../src/services/supabase');
      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValue({
          data: {
            id: '123',
            status: 'SUCCESS',
            run_date: '2025-11-10',
          },
          error: null,
        });

      const result = await ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.canProceed).toBe(false);
      expect(result.reason).toContain('já foi executado com sucesso');
    });

    it('deve permitir retry se execução anterior falhou', async () => {
      // Simular: execução anterior falhou
      const { supabase } = await import('../../src/services/supabase');
      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValue({
          data: {
            id: '456',
            status: 'FAILED',
            run_date: '2025-11-10',
          },
          error: null,
        });

      const result = await ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.canProceed).toBe(true);
      expect(result.reason).toContain('Retry permitido');
    });

    it('deve detectar execução travada (RUNNING > 10 min)', async () => {
      // Simular: execução travada há mais de 10 minutos
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 15);

      const { supabase } = await import('../../src/services/supabase');
      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValue({
          data: {
            id: '789',
            status: 'RUNNING',
            run_date: '2025-11-10',
            started_at: tenMinutesAgo.toISOString(),
          },
          error: null,
        });

      const result = await ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.canProceed).toBe(true);
      expect(result.reason).toContain('travada');
    });

    it('deve bloquear se há execução RUNNING recente (<10 min)', async () => {
      // Simular: execução rodando há 5 minutos
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { supabase } = await import('../../src/services/supabase');
      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValue({
          data: {
            id: '101',
            status: 'RUNNING',
            run_date: '2025-11-10',
            started_at: fiveMinutesAgo.toISOString(),
          },
          error: null,
        });

      const result = await ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.canProceed).toBe(false);
      expect(result.reason).toContain('em execução');
    });
  });

  describe('createRunRecord', () => {
    it('deve criar registro com status RUNNING', async () => {
      const { supabase } = await import('../../src/services/supabase');
      supabase
        .from()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 'new-run-123',
            status: 'RUNNING',
            run_type: 'ETL_DIARIO',
            run_date: '2025-11-10',
          },
          error: null,
        });

      const result = await createRunRecord(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );

      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('RUNNING');
    });

    it('deve incluir trigger_source no registro', async () => {
      const { supabase } = await import('../../src/services/supabase');
      const insertSpy = vi.spyOn(supabase.from(), 'insert');

      await createRunRecord('ETL_DIARIO', new Date('2025-11-10'), 'CRON');

      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger_source: 'CRON',
        })
      );
    });
  });

  describe('updateRunStatus', () => {
    it('deve atualizar status para SUCCESS com duração', async () => {
      const { supabase } = await import('../../src/services/supabase');
      const updateSpy = vi.spyOn(supabase.from(), 'update');

      await updateRunStatus('run-123', 'SUCCESS', {
        units_processed: 2,
        records_inserted: 100,
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'SUCCESS',
          units_processed: 2,
          records_inserted: 100,
        })
      );
    });

    it('deve incluir error_message quando status é FAILED', async () => {
      const { supabase } = await import('../../src/services/supabase');
      const updateSpy = vi.spyOn(supabase.from(), 'update');

      await updateRunStatus('run-456', 'FAILED', {
        error_message: 'Timeout na execução',
      });

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          error_message: 'Timeout na execução',
        })
      );
    });
  });

  describe('Cenários de negócio', () => {
    it('deve permitir reprocessar apenas dias com falha', async () => {
      const { supabase } = await import('../../src/services/supabase');

      // Simular: 10/11 = SUCCESS, 11/11 = FAILED
      const checkDay10 = ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-10')
      );
      const checkDay11 = ensureIdempotency(
        'ETL_DIARIO',
        new Date('2025-11-11')
      );

      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValueOnce({
          data: { status: 'SUCCESS' },
          error: null,
        }) // Dia 10
        .mockResolvedValueOnce({ data: { status: 'FAILED' }, error: null }); // Dia 11

      const [result10, result11] = await Promise.all([checkDay10, checkDay11]);

      expect(result10.canProceed).toBe(false); // Dia 10 não reprocessa
      expect(result11.canProceed).toBe(true); // Dia 11 permite retry
    });

    it('deve evitar race condition de múltiplas execuções simultâneas', async () => {
      const { supabase } = await import('../../src/services/supabase');

      // Simular: primeira chamada cria RUNNING, segunda detecta RUNNING
      supabase
        .from()
        .select()
        .eq()
        .maybeSingle.mockResolvedValueOnce({ data: null, error: null }) // Primeira: sem registro
        .mockResolvedValueOnce({
          // Segunda: detecta RUNNING
          data: {
            status: 'RUNNING',
            started_at: new Date().toISOString(),
          },
          error: null,
        });

      const [check1, check2] = await Promise.all([
        ensureIdempotency('ETL_DIARIO', new Date('2025-11-10')),
        ensureIdempotency('ETL_DIARIO', new Date('2025-11-10')),
      ]);

      // Primeira pode prosseguir, segunda é bloqueada
      expect(check1.canProceed).toBe(true);
      expect(check2.canProceed).toBe(false);
    });
  });
});
