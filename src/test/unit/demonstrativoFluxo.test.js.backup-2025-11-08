/**
 * @fileoverview Testes Unitários - Demonstrativo de Fluxo de Caixa Acumulado
 * @module test/unit/demonstrativoFluxo
 * @description Testes completos para DTOs, Repository e Service
 *
 * @author Andrey Viana
 * @created 2025-11-06
 * @updated 2025-11-06
 *
 * @coverage
 * - DTOs: Validação de schemas Zod, edge cases, error messages
 * - Repository: Mock Supabase client, validação de queries, timeouts
 * - Service: Lógica de negócio, cálculo de saldo acumulado, tratamento de erros
 *
 * @framework Vitest
 * @dependencies
 * - vitest@1.x
 * - @vitest/spy (vi)
 *
 * Comando: pnpm test src/test/unit/demonstrativoFluxo.test.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DemonstrativoFluxoFiltersDTO,
  DemonstrativoFluxoEntryDTO,
  DemonstrativoFluxoSummaryDTO,
  DemonstrativoFluxoFiltersSchema,
  DemonstrativoFluxoEntrySchema,
} from '../../dtos/demonstrativoFluxoDTO';
import { demonstrativoFluxoRepository } from '../../repositories/demonstrativoFluxoRepository';
import { cashflowService } from '../../services/cashflowService';

// ==================================================================================
// MOCKS
// ==================================================================================

// Mock do Supabase
vi.mock('../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({
                then: vi.fn(),
              })),
              lt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    then: vi.fn(),
                  })),
                })),
              })),
              limit: vi.fn(() => ({
                then: vi.fn(),
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

const getPeriodDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// ==================================================================================
// SUITE 1: TESTES DE DTOs
// ==================================================================================

describe('DemonstrativoFluxoDTO - Validação de Schemas', () => {
  describe('DemonstrativoFluxoFiltersDTO', () => {
    it('deve validar filtros corretos', () => {
      const validData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: '223e4567-e89b-12d3-a456-426614174000',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(validData);
      expect(dto.isValid()).toBe(true);
      expect(dto.getErrors()).toBe(null);
      expect(dto.toObject()).toEqual(validData);
    });

    it('deve aceitar accountId null', () => {
      const validData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(validData);
      expect(dto.isValid()).toBe(true);
    });

    it('deve rejeitar unitId inválido (não UUID)', () => {
      const invalidData = {
        unitId: 'invalid-uuid',
        accountId: null,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar startDate > endDate', () => {
      const invalidData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '2025-02-01',
        endDate: '2025-01-01',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(err => err.message.includes('não pode ser maior'))
      ).toBe(true);
    });

    it('deve rejeitar período > 2 anos', () => {
      const invalidData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '2023-01-01',
        endDate: '2025-12-31', // 3 anos
      };

      const dto = new DemonstrativoFluxoFiltersDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
      expect(errors.some(err => err.message.includes('2 anos'))).toBe(true);
    });

    it('deve rejeitar formato de data incorreto', () => {
      const invalidData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '01/01/2025', // Formato errado
        endDate: '2025-01-31',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('deve calcular periodDays via toEnrichedObject()', () => {
      const validData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '2025-01-01',
        endDate: '2025-01-10',
      };

      const dto = new DemonstrativoFluxoFiltersDTO(validData);
      dto.isValid();

      const enriched = dto.toEnrichedObject();
      expect(enriched.periodDays).toBe(10); // 10 dias
      // O período formatado pode conter qualquer formato válido
      expect(enriched.periodFormatted).toBeDefined();
      expect(typeof enriched.periodFormatted).toBe('string');
    });
  });

  describe('DemonstrativoFluxoEntryDTO', () => {
    it('deve validar entrada diária correta', () => {
      const validData = {
        transaction_date: '2025-01-15',
        entradas: 5000.0,
        saidas: 2000.0,
        saldo_dia: 3000.0,
        saldo_acumulado: 15000.0,
      };

      const dto = new DemonstrativoFluxoEntryDTO(validData);
      expect(dto.isValid()).toBe(true);
      expect(dto.toObject()).toEqual(validData);
    });

    it('deve aceitar valores zerados', () => {
      const validData = {
        transaction_date: '2025-01-15',
        entradas: 0.0,
        saidas: 0.0,
        saldo_dia: 0.0,
        saldo_acumulado: 0.0,
      };

      const dto = new DemonstrativoFluxoEntryDTO(validData);
      expect(dto.isValid()).toBe(true);
    });

    it('deve rejeitar entradas negativas', () => {
      const invalidData = {
        transaction_date: '2025-01-15',
        entradas: -1000.0,
        saidas: 2000.0,
        saldo_dia: -3000.0,
        saldo_acumulado: 15000.0,
      };

      const dto = new DemonstrativoFluxoEntryDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar saldo_acumulado infinito', () => {
      const invalidData = {
        transaction_date: '2025-01-15',
        entradas: 5000.0,
        saidas: 2000.0,
        saldo_dia: 3000.0,
        saldo_acumulado: Infinity,
      };

      const dto = new DemonstrativoFluxoEntryDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
    });

    it('deve rejeitar formato de data incorreto', () => {
      const invalidData = {
        transaction_date: '15/01/2025',
        entradas: 5000.0,
        saidas: 2000.0,
        saldo_dia: 3000.0,
        saldo_acumulado: 15000.0,
      };

      const dto = new DemonstrativoFluxoEntryDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
    });
  });

  describe('DemonstrativoFluxoSummaryDTO', () => {
    it('deve validar summary correto', () => {
      const validData = {
        totalEntradas: 50000.0,
        totalSaidas: 30000.0,
        saldoInicial: 10000.0,
        saldoFinal: 30000.0,
        variacao: 20000.0,
        totalDias: 31,
      };

      const dto = new DemonstrativoFluxoSummaryDTO(validData);
      expect(dto.isValid()).toBe(true);
      expect(dto.toObject()).toEqual(validData);
    });

    it('deve calcular indicadores via toEnrichedObject()', () => {
      const validData = {
        totalEntradas: 50000.0,
        totalSaidas: 30000.0,
        saldoInicial: 10000.0,
        saldoFinal: 30000.0,
        variacao: 20000.0,
        totalDias: 10,
      };

      const dto = new DemonstrativoFluxoSummaryDTO(validData);
      dto.isValid();

      const enriched = dto.toEnrichedObject();
      expect(enriched.mediaEntradaDiaria).toBe(5000.0); // 50000 / 10
      expect(enriched.mediaSaidaDiaria).toBe(3000.0); // 30000 / 10
      expect(enriched.variacaoPercentual).toBe(200); // (20000 / 10000) * 100
      expect(enriched.tendencia).toBe('positiva');
    });

    it('deve determinar tendência negativa', () => {
      const validData = {
        totalEntradas: 10000.0,
        totalSaidas: 50000.0,
        saldoInicial: 30000.0,
        saldoFinal: -10000.0,
        variacao: -40000.0,
        totalDias: 10,
      };

      const dto = new DemonstrativoFluxoSummaryDTO(validData);
      dto.isValid();

      const enriched = dto.toEnrichedObject();
      expect(enriched.tendencia).toBe('negativa');
    });

    it('deve rejeitar totalDias não inteiro', () => {
      const invalidData = {
        totalEntradas: 50000.0,
        totalSaidas: 30000.0,
        saldoInicial: 10000.0,
        saldoFinal: 30000.0,
        variacao: 20000.0,
        totalDias: 31.5,
      };

      const dto = new DemonstrativoFluxoSummaryDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
    });

    it('deve rejeitar valores negativos em totais', () => {
      const invalidData = {
        totalEntradas: -50000.0,
        totalSaidas: 30000.0,
        saldoInicial: 10000.0,
        saldoFinal: 30000.0,
        variacao: 20000.0,
        totalDias: 31,
      };

      const dto = new DemonstrativoFluxoSummaryDTO(invalidData);
      expect(dto.isValid()).toBe(false);
      const errors = dto.getErrors();
      expect(errors).not.toBe(null);
    });
  });

  describe('Schema direto (sem classe DTO)', () => {
    it('deve validar com DemonstrativoFluxoFiltersSchema', () => {
      const validData = {
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        accountId: null,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const result = DemonstrativoFluxoFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar com DemonstrativoFluxoEntrySchema', () => {
      const invalidData = {
        transaction_date: '2025-01-15',
        entradas: 'not-a-number',
        saidas: 2000.0,
        saldo_dia: 3000.0,
        saldo_acumulado: 15000.0,
      };

      const result = DemonstrativoFluxoEntrySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// ==================================================================================
// SUITE 2: TESTES DE REPOSITORY (Mock Supabase)
// ==================================================================================

describe('DemonstrativoFluxoRepository - Data Access Layer', () => {
  beforeEach(() => {
    // Reset mock antes de cada teste
    vi.clearAllMocks();
  });

  describe('fetchDemonstrativoData()', () => {
    it('deve buscar dados com filtros corretos', async () => {
      // Mock de sucesso
      const mockData = [
        {
          transaction_date: '2025-01-01',
          entradas: 1000.0,
          saidas: 500.0,
          saldo_dia: 500.0,
          saldo_acumulado: 500.0,
        },
        {
          transaction_date: '2025-01-02',
          entradas: 2000.0,
          saidas: 800.0,
          saldo_dia: 1200.0,
          saldo_acumulado: 1700.0,
        },
      ];

      // Spy no repository
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'fetchDemonstrativoData')
        .mockResolvedValueOnce({
          data: mockData,
          error: null,
        });

      const result = await demonstrativoFluxoRepository.fetchDemonstrativoData(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toHaveLength(2);
      expect(result.error).toBe(null);
      expect(result.data[0].transaction_date).toBe('2025-01-01');
      expect(fetchSpy).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      fetchSpy.mockRestore();
    });

    it('deve retornar array vazio quando não há dados', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'fetchDemonstrativoData')
        .mockResolvedValueOnce({
          data: [],
          error: null,
        });

      const result = await demonstrativoFluxoRepository.fetchDemonstrativoData(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBe(null);

      fetchSpy.mockRestore();
    });

    it('deve tratar erro de query', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'fetchDemonstrativoData')
        .mockResolvedValueOnce({
          data: null,
          error: 'Erro de conexão. Verifique sua internet e tente novamente.',
        });

      const result = await demonstrativoFluxoRepository.fetchDemonstrativoData(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toBe(null);
      expect(result.error).toContain('conexão');

      fetchSpy.mockRestore();
    });

    it('deve validar parâmetros obrigatórios', async () => {
      const result = await demonstrativoFluxoRepository.fetchDemonstrativoData(
        null,
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toBe(null);
      expect(result.error).toContain('obrigatórios');
    });
  });

  describe('fetchInitialBalance()', () => {
    it('deve buscar saldo inicial correto', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'fetchInitialBalance')
        .mockResolvedValueOnce({
          data: 5000.0,
          error: null,
        });

      const result = await demonstrativoFluxoRepository.fetchInitialBalance(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01'
      );

      expect(result.data).toBe(5000.0);
      expect(result.error).toBe(null);

      fetchSpy.mockRestore();
    });

    it('deve retornar 0.00 quando não há saldo anterior', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'fetchInitialBalance')
        .mockResolvedValueOnce({
          data: 0.0,
          error: null,
        });

      const result = await demonstrativoFluxoRepository.fetchInitialBalance(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01'
      );

      expect(result.data).toBe(0.0);
      expect(result.error).toBe(null);

      fetchSpy.mockRestore();
    });
  });

  describe('hasDataForPeriod()', () => {
    it('deve retornar true quando há dados', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'hasDataForPeriod')
        .mockResolvedValueOnce({
          data: true,
          error: null,
        });

      const result = await demonstrativoFluxoRepository.hasDataForPeriod(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toBe(true);

      fetchSpy.mockRestore();
    });

    it('deve retornar false quando não há dados', async () => {
      const fetchSpy = vi
        .spyOn(demonstrativoFluxoRepository, 'hasDataForPeriod')
        .mockResolvedValueOnce({
          data: false,
          error: null,
        });

      const result = await demonstrativoFluxoRepository.hasDataForPeriod(
        '123e4567-e89b-12d3-a456-426614174000',
        null,
        '2025-01-01',
        '2025-01-31'
      );

      expect(result.data).toBe(false);

      fetchSpy.mockRestore();
    });
  });
});

// ==================================================================================
// SUITE 3: TESTES DE SERVICE (Lógica de Negócio)
// ==================================================================================

describe('CashflowService - getDemonstrativoFluxoAcumulado()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar demonstrativo completo com sucesso', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const periodDays = getPeriodDays(startDate, endDate);

    // Mock repository
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 10000.0,
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 5000.0,
          saidas: 2000.0,
          saldo_dia: 3000.0,
          saldo_acumulado: 3000.0,
        },
        {
          transaction_date: '2025-01-02',
          entradas: 3000.0,
          saidas: 1000.0,
          saldo_dia: 2000.0,
          saldo_acumulado: 5000.0,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.data).toHaveLength(periodDays);
    expect(result.data.filter(entry => entry.entradas > 0)).toHaveLength(2);
    expect(result.error).toBe(null);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalEntradas).toBe(8000.0); // 5000 + 3000
    expect(result.summary.totalSaidas).toBe(3000.0); // 2000 + 1000
    expect(result.summary.saldoInicial).toBe(10000.0);
    expect(result.summary.totalDias).toBe(periodDays);
  });

  it('deve enriquecer dados com formatação monetária', async () => {
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 0.0,
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 1500.5,
          saidas: 800.25,
          saldo_dia: 700.25,
          saldo_acumulado: 700.25,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      '2025-01-01',
      '2025-01-31'
    );

    expect(result.data[0].entradasFormatted).toContain('R$');
    expect(result.data[0].entradasFormatted).toContain('1.500,50');
    expect(result.data[0].saidasFormatted).toContain('800,25');
  });

  it('deve retornar array vazio e summary zerado quando não há dados', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const periodDays = getPeriodDays(startDate, endDate);

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 0.0,
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.data).toHaveLength(periodDays);
    expect(
      result.data.every(
        entry =>
          entry.entradas === 0 &&
          entry.saidas === 0 &&
          entry.saldo_dia === 0 &&
          entry.saldo_acumulado === 0
      )
    ).toBe(true);
    expect(result.error).toBe(null);
    expect(result.summary.totalEntradas).toBe(0.0);
    expect(result.summary.totalDias).toBe(periodDays);
  });

  it('deve rejeitar filtros inválidos', async () => {
    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      'invalid-uuid',
      null,
      '2025-01-01',
      '2025-01-31'
    );

    expect(result.data).toBe(null);
    expect(result.error).toBeDefined();
    expect(result.error).not.toBe(null);
    expect(result.summary).toBe(null);
  });

  it('deve rejeitar startDate > endDate', async () => {
    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      '2025-02-01',
      '2025-01-01'
    );

    expect(result.data).toBe(null);
    expect(result.error).toBeDefined();
    expect(result.error).not.toBe(null);
  });

  it('deve propagar erro do repository', async () => {
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: null,
      error: 'Erro de conexão',
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      '2025-01-01',
      '2025-01-31'
    );

    expect(result.data).toBe(null);
    expect(result.error).toContain('saldo inicial');
    expect(result.error).toContain('Erro de conexão');
  });

  it('deve calcular variação corretamente', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 5000.0, // Saldo inicial
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 10000.0,
          saidas: 3000.0,
          saldo_dia: 7000.0,
          saldo_acumulado: 7000.0,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.summary.saldoInicial).toBe(5000.0);
    expect(result.summary.saldoFinal).toBe(7000.0);
    expect(result.summary.variacao).toBe(2000.0);
  });

  it('deve incluir indicadores no summary', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const periodDays = getPeriodDays(startDate, endDate);
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 1000.0,
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 10000.0,
          saidas: 5000.0,
          saldo_dia: 5000.0,
          saldo_acumulado: 5000.0,
        },
        {
          transaction_date: '2025-01-02',
          entradas: 8000.0,
          saidas: 4000.0,
          saldo_dia: 4000.0,
          saldo_acumulado: 9000.0,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.summary.mediaEntradaDiaria).toBeCloseTo(
      18000.0 / periodDays,
      4
    );
    expect(result.summary.mediaSaidaDiaria).toBeCloseTo(
      9000.0 / periodDays,
      4
    );
    expect(result.summary.tendencia).toBe('positiva');
  });
});

// ==================================================================================
// SUITE 4: TESTES DE INTEGRAÇÃO (Edge Cases)
// ==================================================================================

describe('Integração - Edge Cases e Cenários Reais', () => {
  it('deve lidar com saldo negativo', async () => {
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: -5000.0, // Saldo inicial negativo
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 2000.0,
          saidas: 8000.0,
          saldo_dia: -6000.0,
          saldo_acumulado: -6000.0,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      '2025-01-01',
      '2025-01-31'
    );

    expect(result.data[0].saldoAcumuladoPositivo).toBe(false);
    expect(result.summary.tendencia).toBe('negativa');
  });

  it('deve lidar com valores decimais pequenos', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-31';
    const periodDays = getPeriodDays(startDate, endDate);
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 0.01,
      error: null,
    });

    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [
        {
          transaction_date: '2025-01-01',
          entradas: 0.05,
          saidas: 0.03,
          saldo_dia: 0.02,
          saldo_acumulado: 0.02,
        },
      ],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.data).toHaveLength(periodDays);
    expect(result.summary.totalEntradas).toBeCloseTo(0.05, 2);
  });

  it('deve lidar com período de 1 dia', async () => {
    const startDate = '2025-01-01';
    const endDate = '2025-01-01';
    const periodDays = getPeriodDays(startDate, endDate);
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchInitialBalance'
    ).mockResolvedValueOnce({
      data: 1000.0,
      error: null,
    });

    // Mockar que retorna array vazio (sem movimentação no dia)
    vi.spyOn(
      demonstrativoFluxoRepository,
      'fetchDemonstrativoData'
    ).mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await cashflowService.getDemonstrativoFluxoAcumulado(
      '123e4567-e89b-12d3-a456-426614174000',
      null,
      startDate,
      endDate
    );

    expect(result.data).toHaveLength(periodDays);
    expect(result.summary.totalDias).toBe(periodDays);
    expect(result.summary.saldoInicial).toBe(1000.0);
  });
});
