/**
 * @fileoverview Testes unitários para DTOs de movimentações de estoque
 * @module tests/unit/stockMovementDTO.test
 * @requires vitest
 * @description
 * Testa validação, transformação e formatação dos DTOs:
 * - CreateStockMovementDTO
 * - UpdateStockMovementDTO
 * - StockMovementResponseDTO
 * - StockMovementFiltersDTO
 *
 * @author Andrey Viana
 * @date 13/11/2025
 */

import { describe, it, expect } from 'vitest';
import {
  CreateStockMovementDTO,
  UpdateStockMovementDTO,
  StockMovementResponseDTO,
  StockMovementFiltersDTO,
  MOVEMENT_TYPES,
  MOVEMENT_REASONS,
  REFERENCE_TYPES,
} from '@/dtos/stockMovementDTO';

describe('StockMovementDTO - Constants', () => {
  it('deve exportar MOVEMENT_TYPES corretamente', () => {
    expect(MOVEMENT_TYPES).toEqual(['ENTRADA', 'SAIDA']);
  });

  it('deve exportar MOVEMENT_REASONS corretamente', () => {
    expect(MOVEMENT_REASONS).toEqual([
      'COMPRA',
      'VENDA',
      'AJUSTE',
      'CONSUMO_INTERNO',
      'LIMPEZA',
      'DEVOLUCAO',
    ]);
  });

  it('deve exportar REFERENCE_TYPES corretamente', () => {
    expect(REFERENCE_TYPES).toEqual(['PURCHASE', 'REVENUE', 'SERVICE']);
  });
});

describe('CreateStockMovementDTO', () => {
  const validData = {
    unit_id: '3d486a5a-1895-4a7a-b55d-3f8f285a6a07',
    product_id: '44153235-8125-4b12-a0a2-66cfc1b576dd',
    movement_type: 'ENTRADA',
    reason: 'COMPRA',
    quantity: 10,
    unit_cost: 50.0,
    performed_by: '67bccf6d-e0b8-4112-91ef-aed7ff4dd0a9',
  };

  describe('Validações de sucesso', () => {
    it('deve validar dados corretos', () => {
      const dto = new CreateStockMovementDTO(validData);
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve aceitar unit_cost = 0 para saídas', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        movement_type: 'SAIDA',
        reason: 'VENDA',
        unit_cost: 0,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve aceitar reference_id + reference_type juntos', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        reference_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        reference_type: 'PURCHASE',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve aceitar notes opcionais', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        notes: 'Compra urgente',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Validações de falha', () => {
    it('deve rejeitar quantity <= 0', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        quantity: 0,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('quantity deve ser maior que 0');
    });

    it('deve rejeitar quantity negativa', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        quantity: -5,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('quantity deve ser maior que 0');
    });

    it('deve rejeitar unit_cost negativo', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        unit_cost: -10,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'unit_cost deve ser maior ou igual a 0'
      );
    });

    it('deve rejeitar movement_type inválido', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        movement_type: 'INVALIDO',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('movement_type'))).toBe(
        true
      );
    });

    it('deve rejeitar reason inválido', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        reason: 'MOTIVO_INVALIDO',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('reason'))).toBe(true);
    });

    it('deve rejeitar UUID inválido em unit_id', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        unit_id: 'not-a-uuid',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('unit_id'))).toBe(true);
    });

    it('deve rejeitar reference_id sem reference_type', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        reference_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        reference_type: null,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('reference_type'))).toBe(
        true
      );
    });

    it('deve rejeitar reference_type sem reference_id', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        reference_id: null,
        reference_type: 'PURCHASE',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('reference_id'))).toBe(
        true
      );
    });
  });

  describe('Métodos auxiliares', () => {
    it('getTotalCost deve calcular corretamente', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        quantity: 10,
        unit_cost: 25.5,
      });

      expect(dto.getTotalCost()).toBe(255.0);
    });

    it('toObject deve retornar apenas campos permitidos', () => {
      const dto = new CreateStockMovementDTO({
        ...validData,
        extraField: 'should be filtered',
      });
      const obj = dto.toObject();

      expect(obj).not.toHaveProperty('extraField');
      expect(obj).toHaveProperty('unit_id');
      expect(obj).toHaveProperty('product_id');
    });

    it('_isValidUUID deve validar UUID v4 corretamente', () => {
      const dto = new CreateStockMovementDTO(validData);

      expect(dto._isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(
        true
      );
      expect(dto._isValidUUID('not-a-uuid')).toBe(false);
      expect(dto._isValidUUID('')).toBe(false);
      expect(dto._isValidUUID(null)).toBe(false);
    });
  });
});

describe('UpdateStockMovementDTO', () => {
  it('deve validar notes como string', () => {
    const dto = new UpdateStockMovementDTO({ notes: 'Atualização válida' });
    const validation = dto.validate();

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('deve rejeitar notes não-string', () => {
    const dto = new UpdateStockMovementDTO({ notes: 123 });
    const validation = dto.validate();

    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('notes deve ser uma string');
  });

  it('deve aceitar notes vazio', () => {
    const dto = new UpdateStockMovementDTO({ notes: '' });
    const validation = dto.validate();

    expect(validation.isValid).toBe(true);
  });

  it('toObject deve incluir updated_at', () => {
    const dto = new UpdateStockMovementDTO({ notes: 'Teste' });
    const obj = dto.toObject();

    expect(obj).toHaveProperty('notes', 'Teste');
    expect(obj).toHaveProperty('updated_at');
    expect(new Date(obj.updated_at)).toBeInstanceOf(Date);
  });
});

describe('StockMovementResponseDTO', () => {
  const mockDbRow = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    unit_id: '6ba7b8109dad11d180b400c04fd430c8',
    product_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    movement_type: 'ENTRADA',
    reason: 'COMPRA',
    quantity: 50,
    unit_cost: 10.5,
    total_cost: 525.0,
    performed_by: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    notes: 'Compra mensal',
    created_at: '2025-11-13T10:00:00Z',
    is_active: true,
    // JOINs (com nomes singulares)
    product: { name: 'Shampoo' },
    professional: { name: 'João Silva' },
    unit: { name: 'Mangabeiras' },
  };

  it('deve criar DTO a partir de row do banco', () => {
    const dto = new StockMovementResponseDTO(mockDbRow);

    expect(dto.id).toBe(mockDbRow.id);
    expect(dto.quantity).toBe(50);
    // JOINs são mantidos no objeto principal
    expect(dto.product.name).toBe('Shampoo');
    expect(dto.professional.name).toBe('João Silva');
    expect(dto.unit.name).toBe('Mangabeiras');
  });

  it('toObject deve retornar objeto simples', () => {
    const dto = new StockMovementResponseDTO(mockDbRow);
    const obj = dto.toObject();

    expect(obj).toHaveProperty('id');
    expect(obj).toHaveProperty('quantity', 50);
    expect(obj).toHaveProperty('product_id');
    // Relacionamentos aparecem em toObject()
    expect(obj).toHaveProperty('product');
    expect(obj.product).toEqual(mockDbRow.product);
  });

  it('toDisplay deve formatar valores para exibição', () => {
    const dto = new StockMovementResponseDTO(mockDbRow);
    const display = dto.toDisplay();

    expect(display).toHaveProperty('unit_cost_formatted');
    expect(display.unit_cost_formatted).toMatch(/R\$/);
    expect(display).toHaveProperty('total_cost_formatted');
    expect(display).toHaveProperty('created_at_formatted');
    expect(display).toHaveProperty('reason_display', 'Compra');
  });

  it('_formatReason deve traduzir reasons para português', () => {
    const dto = new StockMovementResponseDTO(mockDbRow);

    expect(dto._formatReason('COMPRA')).toBe('Compra');
    expect(dto._formatReason('VENDA')).toBe('Venda');
    expect(dto._formatReason('AJUSTE')).toBe('Ajuste');
    expect(dto._formatReason('CONSUMO_INTERNO')).toBe('Consumo Interno');
    expect(dto._formatReason('LIMPEZA')).toBe('Limpeza');
    expect(dto._formatReason('DEVOLUCAO')).toBe('Devolução');
    expect(dto._formatReason('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('StockMovementFiltersDTO', () => {
  const validFilters = {
    unit_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    page: 1,
    page_size: 20,
  };

  it('deve validar filtros básicos', () => {
    const dto = new StockMovementFiltersDTO(validFilters);
    const validation = dto.validate();

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('deve validar filtros com product_id', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      product_id: '6ba7b8109dad11d180b400c04fd430c8',
    });
    const validation = dto.validate();

    expect(validation.isValid).toBe(true);
  });

  it('deve validar filtros com datas', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      start_date: new Date('2025-11-01'),
      end_date: new Date('2025-11-30'),
    });
    const validation = dto.validate();

    expect(validation.isValid).toBe(true);
  });

  it('deve rejeitar page negativa', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      page: -1,
    });
    const validation = dto.validate();

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('page'))).toBe(true);
  });

  it('deve rejeitar page_size > 100', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      page_size: 150,
    });
    const validation = dto.validate();

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('page_size'))).toBe(true);
  });

  it('deve rejeitar movement_type inválido', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      movement_type: 'INVALIDO',
    });
    const validation = dto.validate();

    expect(validation.isValid).toBe(false);
  });

  it('getOffset deve calcular corretamente', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      page: 3,
      page_size: 20,
    });

    expect(dto.getOffset()).toBe(40); // (3 - 1) * 20
  });

  it('getLimit deve retornar page_size', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      page_size: 50,
    });

    expect(dto.getLimit()).toBe(50);
  });

  it('toSupabaseQuery deve converter filtros para objeto Supabase', () => {
    const dto = new StockMovementFiltersDTO({
      ...validFilters,
      product_id: '6ba7b8109dad11d180b400c04fd430c8',
      movement_type: 'ENTRADA',
      reason: 'COMPRA',
    });
    const query = dto.toSupabaseQuery();

    expect(query).toHaveProperty('product_id');
    expect(query).toHaveProperty('movement_type', 'ENTRADA');
    expect(query).toHaveProperty('reason', 'COMPRA');
  });
});
