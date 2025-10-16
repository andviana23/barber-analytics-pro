/**
 * @fileoverview Testes do DTO de receitas
 * Testa validação, transformação, campos obrigatórios, valores negativos, datas inconsistentes e sanitização
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateRevenueDTO } from '../revenueDTO';
import { DateHelpers } from '../../../tests/__fixtures__/financial';

describe('CreateRevenueDTO', () => {
  describe('Validação de campos obrigatórios', () => {
    it('deve aceitar dados válidos completos', () => {
      const validData = createValidData();

      const dto = new CreateRevenueDTO(validData);
      const errors = dto.validate();

      expect(errors).toHaveLength(0);
      expect(dto.type).toBe('service');
      expect(dto.value).toBe(150.00);
    });

    it('deve rejeitar quando type está ausente', () => {
      const invalidData = {
        value: 150.00,
        date: DateHelpers.today(),
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        user_id: 'user-789',
        account_id: 'acc-abc',
      };

      const dto = new CreateRevenueDTO(invalidData);
      const errors = dto.validate();

      expect(errors).toContain('Campo "type" é obrigatório');
    });

    it('deve rejeitar quando value está ausente', () => {
      const invalidData = {
        type: 'service' as const,
        date: DateHelpers.today(),
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        user_id: 'user-789',
        account_id: 'acc-abc',
      };

      const dto = new CreateRevenueDTO(invalidData);
      const errors = dto.validate();

      expect(errors).toContain('Campo "value" é obrigatório');
    });

    it('deve usar data atual quando date não fornecida', () => {
      const dataWithoutDate = {
        type: 'service' as const,
        value: 150.00,
        unit_id: 'unit-123',
        professional_id: 'prof-456',
        user_id: 'user-789',
        account_id: 'acc-abc',
      };

      const dto = new CreateRevenueDTO(dataWithoutDate);
      
      expect(dto.date).toBe(DateHelpers.today());
    });
  });

  describe('Validação de tipos e valores', () => {
    it('deve aceitar type válido: service', () => {
      const data = createValidData({ type: 'service' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/type.*deve ser um dos valores/));
    });

    it('deve aceitar type válido: product', () => {
      const data = createValidData({ type: 'product' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/type.*deve ser um dos valores/));
    });

    it('deve rejeitar type inválido', () => {
      const data = createValidData({ type: 'invalid_type' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "type" deve ser um dos valores válidos: service, product, commission, other');
    });

    it('deve aceitar valor positivo', () => {
      const data = createValidData({ value: 99.99 });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/value.*deve ser maior que zero/));
    });

    it('deve rejeitar valor zero', () => {
      const data = createValidData({ value: 0 });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "value" deve ser maior que zero');
    });

    it('deve rejeitar valor negativo', () => {
      const data = createValidData({ value: -50.00 });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "value" deve ser maior que zero');
    });

    it('deve rejeitar valores muito grandes (>999999)', () => {
      const data = createValidData({ value: 1000000.01 });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "value" não pode ser maior que 999999.99');
    });
  });

  describe('Validação de datas', () => {
    it('deve aceitar data no formato YYYY-MM-DD válido', () => {
      const data = createValidData({ date: '2025-01-15' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/date.*formato/));
    });

    it('deve rejeitar formato de data inválido', () => {
      const data = createValidData({ date: '15/01/2025' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "date" deve estar no formato YYYY-MM-DD');
    });

    it('deve rejeitar data inexistente', () => {
      const data = createValidData({ date: '2025-02-30' }); // 30 de fevereiro
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "date" deve estar no formato YYYY-MM-DD');
    });

    it('deve aceitar datas de competência válidas', () => {
      const data = createValidData({
        accrual_start_date: '2025-01-01',
        accrual_end_date: '2025-01-31',
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/competência/));
    });

    it('deve rejeitar quando accrual_end_date < accrual_start_date', () => {
      const data = createValidData({
        accrual_start_date: '2025-01-31',
        accrual_end_date: '2025-01-01',
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Data de fim da competência (accrual_end_date) deve ser maior ou igual à data de início (accrual_start_date)');
    });

    it('deve rejeitar datas de competência inválidas antes da comparação', () => {
      const data = createValidData({
        accrual_start_date: 'invalid-date',
        accrual_end_date: '2025-01-31',
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Datas de competência devem ser válidas para comparação');
    });

    it('deve aceitar expected_receipt_date válida', () => {
      const data = createValidData({
        expected_receipt_date: DateHelpers.daysFromNow(7),
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/expected_receipt_date/));
    });
  });

  describe('Validação de UUIDs', () => {
    it('deve aceitar UUID válido para unit_id', () => {
      const data = createValidData({ 
        unit_id: '123e4567-e89b-12d3-a456-426614174000' 
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/unit_id.*formato UUID/));
    });

    it('deve rejeitar UUID inválido para unit_id', () => {
      const data = createValidData({ unit_id: 'invalid-uuid' });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).toContain('Campo "unit_id" deve estar no formato UUID válido');
    });

    it('deve aceitar UUIDs válidos para todos os campos', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const data = createValidData({
        unit_id: validUuid,
        professional_id: validUuid,
        user_id: validUuid,
        account_id: validUuid,
      });
      const dto = new CreateRevenueDTO(data);
      const errors = dto.validate();

      expect(errors).not.toContain(expect.stringMatching(/formato UUID/));
    });
  });

  describe('Sanitização de dados', () => {
    it('deve remover campos proibidos (FORBIDDEN_REVENUE_FIELDS)', () => {
      const dataWithForbiddenFields = {
        ...createValidData(),
        id: 'should-be-removed',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: '2025-01-01T00:00:00Z',
      };

      const dto = new CreateRevenueDTO(dataWithForbiddenFields);

      expect(dto).not.toHaveProperty('id');
      expect(dto).not.toHaveProperty('created_at');
      expect(dto).not.toHaveProperty('updated_at');
      expect(dto).not.toHaveProperty('deleted_at');
    });

    it('deve ignorar campos não reconhecidos', () => {
      const dataWithExtraFields = {
        ...createValidData(),
        unknown_field: 'should-be-ignored',
        another_extra: 123,
      };

      const dto = new CreateRevenueDTO(dataWithExtraFields);

      expect(dto).not.toHaveProperty('unknown_field');
      expect(dto).not.toHaveProperty('another_extra');
    });

    it('deve converter valores numéricos strings para number', () => {
      const dataWithStringNumbers = createValidData({
        value: '150.50' as any,
      });

      const dto = new CreateRevenueDTO(dataWithStringNumbers);

      expect(typeof dto.value).toBe('number');
      expect(dto.value).toBe(150.50);
    });
  });

  describe('Propriedades do DTO', () => {
    it('deve manter propriedades básicas acessíveis', () => {
      const data = createValidData({
        type: 'service',
        value: 150.00,
      });

      const dto = new CreateRevenueDTO(data);

      expect(dto.type).toBe('service');
      expect(dto.value).toBe(150.00);
      expect(dto.unit_id).toBe(data.unit_id);
      expect(dto.professional_id).toBe(data.professional_id);
    });

    it('deve expor apenas campos permitidos', () => {
      const data = createValidData();
      const dto = new CreateRevenueDTO(data);

      // Campos obrigatórios devem estar acessíveis
      expect(dto).toHaveProperty('type');
      expect(dto).toHaveProperty('value');
      expect(dto).toHaveProperty('unit_id');
      expect(dto).toHaveProperty('professional_id');
      expect(dto).toHaveProperty('user_id');
      expect(dto).toHaveProperty('account_id');
    });
  });

  describe('Edge cases e cenários extremos', () => {
    it('deve lidar com dados undefined/null graciosamente', () => {
      expect(() => new CreateRevenueDTO(undefined as any)).not.toThrow();
      expect(() => new CreateRevenueDTO(null as any)).not.toThrow();
    });

    it('deve validar corretamente com dados vazios', () => {
      const dto = new CreateRevenueDTO({});
      const errors = dto.validate();

      expect(Array.isArray(errors)).toBe(true);
      expect((errors as string[]).length).toBeGreaterThan(0);
      expect(errors).toContain('Campo "type" é obrigatório');
      expect(errors).toContain('Campo "value" é obrigatório');
    });

    it('deve lidar com números de ponto flutuante com precisão', () => {
      const data = createValidData({ value: 99.999 });
      const dto = new CreateRevenueDTO(data);
      
      // Deve truncar para 2 casas decimais
      expect(dto.value).toBe(99.99);
    });

    it('deve validar limites extremos de valor', () => {
      // Valor mínimo válido
      const minData = createValidData({ value: 0.01 });
      const minDto = new CreateRevenueDTO(minData);
      expect(minDto.validate()).not.toContain(expect.stringMatching(/value.*maior que zero/));

      // Valor máximo válido
      const maxData = createValidData({ value: 999999.99 });
      const maxDto = new CreateRevenueDTO(maxData);
      expect(maxDto.validate()).not.toContain(expect.stringMatching(/value.*maior que/));
    });

    // ⚠️ TODO(test): Adicionar validação de RLS - verificar se unit_id pertence ao usuário
    // Baseado em DATABASE_SCHEMA.md linhas 45-67 (RLS policies)
    it.todo('deve validar RLS - unit_id deve pertencer ao usuário autenticado');

    // ⚠️ TODO(test): Adicionar validação de business rules para payment_method vs settlement_date
    // Baseado em FINANCIAL_MODULE.md linhas 120-145 (matriz de prazos)
    it.todo('deve calcular settlement_date baseado no payment_method (D+0, D+1, D+30)');
  });
});

// Helper para criar dados válidos com overrides
function createValidData(overrides: any = {}) {
  return {
    type: 'service' as const,
    value: 150.00,
    date: DateHelpers.today(),
    unit_id: '123e4567-e89b-12d3-a456-426614174000',
    professional_id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174002',
    account_id: '123e4567-e89b-12d3-a456-426614174003',
    ...overrides,
  };
}