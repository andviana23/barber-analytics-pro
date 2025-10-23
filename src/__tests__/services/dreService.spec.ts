/**
 * @file dreService.spec.ts
 * @description Testes unitários para o dreService
 * @author Barber Analytics Pro Team
 * @date 2025-10-21
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dreService } from '../../services/dreService';

// Mock do Supabase
vi.mock('../../services/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../services/supabase';

describe('DREService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDRE', () => {
    it('deve calcular DRE com sucesso', async () => {
      const mockDREData = {
        periodo: {
          inicio: '2025-10-01',
          fim: '2025-10-31',
          dias: 31,
          gerado_em: '2025-10-22T00:00:00Z',
        },
        receita_bruta: {
          receita_servico: {
            assinatura: 4500.0,
            avulso: 1500.0,
            total: 6000.0,
          },
          receita_produtos: {
            cosmeticos: 500.0,
            total: 500.0,
          },
          total: 6500.0,
        },
        custos_operacionais: {
          bebidas_cortesias: 100.0,
          bonificacoes_metas: 200.0,
          comissoes: 900.0,
          limpeza_lavanderia: 150.0,
          produtos_uso_interno: 250.0,
          total: 1600.0,
        },
        margem_contribuicao: 4900.0,
        despesas_administrativas: {
          aluguel_condominio: 2000.0,
          contabilidade: 500.0,
          contas_fixas: 600.0,
          encargos_beneficios: 800.0,
          manutencao_seguros: 300.0,
          marketing_comercial: 400.0,
          salarios_prolabore: 3000.0,
          sistemas: 200.0,
          total: 7800.0,
        },
        ebit: -2900.0,
        impostos: {
          simples_nacional: 0,
          total: 0,
        },
        lucro_liquido: -2900.0,
        indicadores: {
          margem_contribuicao_percentual: 75.38,
          margem_ebit_percentual: -44.62,
          margem_liquida_percentual: -44.62,
          custo_operacional_percentual: 24.62,
          despesa_administrativa_percentual: 120.0,
        },
        metadata: {
          version: '1.0.0',
          unit_id: 'test-unit-id',
          calculation_timestamp: '2025-10-22T00:00:00Z',
        },
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockDREData,
        error: null,
      });

      const result = await dreService.calculateDRE({
        unitId: 'test-unit-id',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.receita_bruta.total).toBe(6500);
      expect(result.data?.lucro_liquido).toBe(-2900);
      expect(result.data?._computed?.has_data).toBe(true);
      expect(result.data?._computed?.is_profitable).toBe(false);
    });

    it('deve retornar erro se unitId não for fornecido', async () => {
      const result = await dreService.calculateDRE({
        unitId: '',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('obrigatórios');
      expect(result.data).toBeNull();
    });

    it('deve retornar erro se datas não forem fornecidas', async () => {
      const result = await dreService.calculateDRE({
        unitId: 'test-unit-id',
        startDate: '',
        endDate: '',
      });

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('deve retornar erro se data inicial for maior que data final', async () => {
      const result = await dreService.calculateDRE({
        unitId: 'test-unit-id',
        startDate: '2025-10-31',
        endDate: '2025-10-01',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('maior');
      expect(result.data).toBeNull();
    });

    it('deve retornar erro amigável quando função SQL falhar', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Unit ID cannot be null', code: 'P0001' },
      });

      const result = await dreService.calculateDRE({
        unitId: 'test-unit-id',
        startDate: '2025-10-01',
        endDate: '2025-10-31',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('ID da unidade inválido');
      expect(result.data).toBeNull();
    });
  });

  describe('calculateCurrentMonthDRE', () => {
    it('deve calcular DRE do mês atual', async () => {
      const mockDREData = {
        periodo: { inicio: '2025-10-01', fim: '2025-10-31' },
        receita_bruta: { total: 5000 },
        lucro_liquido: 1000,
        indicadores: {},
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockDREData,
        error: null,
      });

      const result = await dreService.calculateCurrentMonthDRE('test-unit-id');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(supabase.rpc).toHaveBeenCalledWith(
        'fn_calculate_dre',
        expect.objectContaining({
          p_unit_id: 'test-unit-id',
        })
      );
    });
  });

  describe('exportAsText', () => {
    it('deve exportar DRE como texto formatado', () => {
      const mockDREData = {
        periodo: { inicio: '2025-10-01', fim: '2025-10-31' },
        receita_bruta: {
          receita_servico: { assinatura: 1000, avulso: 500, total: 1500 },
          receita_produtos: { cosmeticos: 200, total: 200 },
          total: 1700,
        },
        custos_operacionais: {
          bebidas_cortesias: 50,
          bonificacoes_metas: 100,
          comissoes: 200,
          limpeza_lavanderia: 50,
          produtos_uso_interno: 100,
          total: 500,
        },
        margem_contribuicao: 1200,
        despesas_administrativas: {
          aluguel_condominio: 300,
          contabilidade: 100,
          contas_fixas: 150,
          encargos_beneficios: 200,
          manutencao_seguros: 50,
          marketing_comercial: 100,
          salarios_prolabore: 500,
          sistemas: 50,
          total: 1450,
        },
        ebit: -250,
        impostos: { simples_nacional: 0, total: 0 },
        lucro_liquido: -250,
        indicadores: {
          margem_contribuicao_percentual: 70.59,
          margem_ebit_percentual: -14.71,
          margem_liquida_percentual: -14.71,
        },
      };

      const text = dreService.exportAsText(mockDREData);

      expect(text).toContain('DRE - DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO');
      expect(text).toContain('RECEITA BRUTA');
      expect(text).toContain('CUSTOS OPERACIONAIS');
      expect(text).toContain('MARGEM DE CONTRIBUIÇÃO');
      expect(text).toContain('LUCRO LÍQUIDO DO PERÍODO');
      expect(text).toContain('2025-10-01 a 2025-10-31');
    });

    it('deve retornar string vazia se DRE não existir', () => {
      const text = dreService.exportAsText(null);
      expect(text).toBe('');
    });
  });

  describe('exportAsCSV', () => {
    it('deve exportar DRE como CSV', () => {
      const mockDREData = {
        periodo: { inicio: '2025-10-01', fim: '2025-10-31' },
        receita_bruta: {
          receita_servico: { assinatura: 1000, avulso: 500, total: 1500 },
          receita_produtos: { cosmeticos: 200, total: 200 },
          total: 1700,
        },
        custos_operacionais: {
          bebidas_cortesias: 50,
          bonificacoes_metas: 100,
          comissoes: 200,
          limpeza_lavanderia: 50,
          produtos_uso_interno: 100,
          total: 500,
        },
        margem_contribuicao: 1200,
        despesas_administrativas: {
          aluguel_condominio: 300,
          contabilidade: 100,
          contas_fixas: 150,
          encargos_beneficios: 200,
          manutencao_seguros: 50,
          marketing_comercial: 100,
          salarios_prolabore: 500,
          sistemas: 50,
          total: 1450,
        },
        ebit: -250,
        impostos: { simples_nacional: 0, total: 0 },
        lucro_liquido: -250,
        indicadores: {
          margem_contribuicao_percentual: 70.59,
          margem_ebit_percentual: -14.71,
          margem_liquida_percentual: -14.71,
          custo_operacional_percentual: 29.41,
          despesa_administrativa_percentual: 85.29,
        },
        metadata: {
          calculation_timestamp: '2025-10-22T00:00:00Z',
        },
      };

      const csv = dreService.exportAsCSV(mockDREData);

      expect(csv).toContain('Categoria;Subcategoria;Valor;Percentual');
      expect(csv).toContain('RECEITA BRUTA');
      expect(csv).toContain('CUSTOS OPERACIONAIS');
      expect(csv).toContain('LUCRO LÍQUIDO');
      expect(csv).toContain('1700,00'); // Receita bruta
      expect(csv).toContain('-250,00'); // Lucro líquido
    });
  });

  describe('exportAsHTML', () => {
    it('deve exportar DRE como HTML', () => {
      const mockDREData = {
        periodo: { inicio: '2025-10-01', fim: '2025-10-31', dias: 31 },
        receita_bruta: {
          receita_servico: { assinatura: 1000, avulso: 500, total: 1500 },
          receita_produtos: { cosmeticos: 200, total: 200 },
          total: 1700,
        },
        custos_operacionais: {
          bebidas_cortesias: 50,
          bonificacoes_metas: 100,
          comissoes: 200,
          limpeza_lavanderia: 50,
          produtos_uso_interno: 100,
          total: 500,
        },
        margem_contribuicao: 1200,
        despesas_administrativas: {
          aluguel_condominio: 300,
          contabilidade: 100,
          contas_fixas: 150,
          encargos_beneficios: 200,
          manutencao_seguros: 50,
          marketing_comercial: 100,
          salarios_prolabore: 500,
          sistemas: 50,
          total: 1450,
        },
        ebit: -250,
        impostos: { simples_nacional: 0, total: 0 },
        lucro_liquido: -250,
        indicadores: {
          margem_contribuicao_percentual: 70.59,
          margem_ebit_percentual: -14.71,
          margem_liquida_percentual: -14.71,
          custo_operacional_percentual: 29.41,
          despesa_administrativa_percentual: 85.29,
        },
        metadata: {
          version: '1.0.0',
          calculation_timestamp: '2025-10-22T00:00:00Z',
        },
      };

      const html = dreService.exportAsHTML(mockDREData);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('DRE - Demonstração do Resultado do Exercício');
      expect(html).toContain('<table>');
      expect(html).toContain('RECEITA BRUTA');
      expect(html).toContain('MARGEM DE CONTRIBUIÇÃO');
      expect(html).toContain('LUCRO LÍQUIDO');
      expect(html).toContain('(31 dias)');
    });
  });

  describe('compareDRE', () => {
    it('deve comparar dois períodos', async () => {
      const mockDRE1 = {
        receita_bruta: { total: 5000 },
        margem_contribuicao: 3500,
        ebit: 1500,
        lucro_liquido: 1200,
      };

      const mockDRE2 = {
        receita_bruta: { total: 4000 },
        margem_contribuicao: 2800,
        ebit: 1000,
        lucro_liquido: 800,
      };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ data: mockDRE1, error: null })
        .mockResolvedValueOnce({ data: mockDRE2, error: null });

      const result = await dreService.compareDRE({
        unitId: 'test-unit-id',
        period1Start: '2025-10-01',
        period1End: '2025-10-31',
        period2Start: '2025-09-01',
        period2End: '2025-09-30',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.comparison).toBeDefined();
      expect(result.data?.comparison.lucro_liquido.absolute).toBe(400);
      expect(result.data?.comparison.lucro_liquido.percentage).toBe(50);
    });
  });
});
