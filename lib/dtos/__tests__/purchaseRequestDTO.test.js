/**
 * @fileoverview Unit tests for Purchase Request DTOs
 * @module lib/dtos/__tests__/purchaseRequestDTO.test
 * @description Tests validation, formatting, and transformation in Purchase Request DTOs
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

import { describe, it, expect } from 'vitest';
import {
  CreatePurchaseRequestDTO,
  UpdatePurchaseRequestDTO,
  PurchaseRequestResponseDTO,
  PurchaseRequestFiltersDTO,
  CreatePurchaseQuoteDTO,
  PurchaseQuoteResponseDTO,
} from '../purchaseRequestDTO.js';

// ============================================================
// CREATE PURCHASE REQUEST DTO TESTS
// ============================================================

describe('CreatePurchaseRequestDTO', () => {
  const validInput = {
    unit_id: '123e4567-e89b-42d3-a456-426614174000',
    requested_by: '987e6543-e21b-42d3-a456-426614174000',
    justification: 'Necessário para reposição de estoque',
    notes: 'Urgente - estoque zerado',
    priority: 'HIGH',
    items: [
      {
        product_id: '111e2222-e33b-44d4-a556-666777888999',
        quantity: 10,
        unit_measurement: 'UN',
        notes: 'Produto A',
      },
      {
        product_id: '222e3333-e44b-55d5-a667-777888999000',
        quantity: 5,
        unit_measurement: 'CX',
        notes: 'Produto B',
      },
    ],
  };

  describe('validate()', () => {
    it('should validate correct data', () => {
      const dto = new CreatePurchaseRequestDTO(validInput);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing unit_id', () => {
      const input = { ...validInput };
      delete input.unit_id;

      const dto = new CreatePurchaseRequestDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'unit_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject invalid unit_id format', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        unit_id: 'invalid-uuid',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'unit_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject missing requested_by', () => {
      const input = { ...validInput };
      delete input.requested_by;

      const dto = new CreatePurchaseRequestDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'requested_by é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject justification with less than 10 chars', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        justification: 'Curto',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Justificativa deve ter no mínimo 10 caracteres'
      );
    });

    it('should reject invalid priority', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        priority: 'INVALID',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Prioridade deve ser LOW, NORMAL, HIGH ou URGENT'
      );
    });

    it('should reject empty items array', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        items: [],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Deve haver pelo menos um item na solicitação'
      );
    });

    it('should reject item with missing product_id', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        items: [
          {
            quantity: 10,
            unit_measurement: 'UN',
          },
        ],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Item 1: product_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject item with invalid quantity', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        items: [
          {
            product_id: '111e2222-e33b-44d4-a556-666777888999',
            quantity: -5,
            unit_measurement: 'UN',
          },
        ],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Item 1: Quantidade deve ser maior que zero'
      );
    });

    it('should reject item with missing unit_measurement', () => {
      const dto = new CreatePurchaseRequestDTO({
        ...validInput,
        items: [
          {
            product_id: '111e2222-e33b-44d4-a556-666777888999',
            quantity: 10,
          },
        ],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Item 1: Unidade de medida é obrigatória (UN, KG, L, CX, etc)'
      );
    });

    it('should default priority to NORMAL', () => {
      const input = { ...validInput };
      delete input.priority;

      const dto = new CreatePurchaseRequestDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(dto.priority).toBe('NORMAL');
    });
  });

  describe('toObject()', () => {
    it('should transform to object correctly', () => {
      const dto = new CreatePurchaseRequestDTO(validInput);
      const obj = dto.toObject();

      expect(obj).toHaveProperty('unit_id', validInput.unit_id);
      expect(obj).toHaveProperty('requested_by', validInput.requested_by);
      expect(obj).toHaveProperty('justification', validInput.justification);
      expect(obj).toHaveProperty('priority', 'HIGH');
      expect(obj).toHaveProperty('status', 'DRAFT');
      expect(obj).toHaveProperty('is_active', true);
      expect(obj).not.toHaveProperty('items'); // Items não no objeto principal
    });
  });

  describe('getItems()', () => {
    it('should return items array', () => {
      const dto = new CreatePurchaseRequestDTO(validInput);
      const items = dto.getItems();

      expect(items).toHaveLength(2);
      expect(items[0]).toHaveProperty('product_id');
      expect(items[0]).toHaveProperty('quantity', 10);
      expect(items[1]).toHaveProperty('quantity', 5);
    });
  });
});

// ============================================================
// UPDATE PURCHASE REQUEST DTO TESTS
// ============================================================

describe('UpdatePurchaseRequestDTO', () => {
  const validInput = {
    justification: 'Justificativa atualizada com mais detalhes',
    notes: 'Notas adicionadas',
    priority: 'URGENT',
  };

  describe('validate()', () => {
    it('should validate correct partial update', () => {
      const dto = new UpdatePurchaseRequestDTO(validInput);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate empty update (nothing to change)', () => {
      const dto = new UpdatePurchaseRequestDTO({});
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject justification with less than 10 chars', () => {
      const dto = new UpdatePurchaseRequestDTO({
        justification: 'Curto',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Justificativa deve ter no mínimo 10 caracteres'
      );
    });

    it('should reject invalid priority', () => {
      const dto = new UpdatePurchaseRequestDTO({
        priority: 'SUPER_URGENT',
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Prioridade deve ser LOW, NORMAL, HIGH ou URGENT'
      );
    });

    it('should accept null notes', () => {
      const dto = new UpdatePurchaseRequestDTO({
        notes: null,
      });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });
  });

  describe('toObject()', () => {
    it('should transform to object with only provided fields', () => {
      const dto = new UpdatePurchaseRequestDTO({
        justification: 'Nova justificativa completa',
      });
      const obj = dto.toObject();

      expect(obj).toHaveProperty('justification');
      expect(obj).not.toHaveProperty('notes');
      expect(obj).not.toHaveProperty('priority');
    });

    it('should include updated_at timestamp', () => {
      const dto = new UpdatePurchaseRequestDTO(validInput);
      const obj = dto.toObject();

      expect(obj).toHaveProperty('updated_at');
      expect(obj.updated_at).toBeInstanceOf(Date);
    });
  });
});

// ============================================================
// PURCHASE REQUEST RESPONSE DTO TESTS
// ============================================================

describe('PurchaseRequestResponseDTO', () => {
  const mockRequest = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    request_number: 'REQ-2025-001',
    unit_id: '987e6543-e21b-42d3-a456-426614174000',
    requested_by: '111e2222-e33b-44d4-a556-666777888999',
    justification: 'Reposição de estoque',
    notes: 'Urgente',
    priority: 'HIGH',
    status: 'SUBMITTED',
    total_amount: 1500.0,
    created_at: '2025-11-13T10:00:00Z',
    updated_at: '2025-11-13T11:00:00Z',
    is_active: true,
    unit: { id: '987e6543-e21b-42d3-a456-426614174000', name: 'Unidade BH' },
    professional: {
      id: '111e2222-e33b-44d4-a556-666777888999',
      name: 'João Silva',
    },
    items: [
      {
        id: 'item-001',
        product_id: 'prod-001',
        product_name: 'Produto A',
        quantity: 10,
        unit_measurement: 'UN',
      },
    ],
  };

  describe('getStatusLabel()', () => {
    it('should return correct label for DRAFT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
      });
      expect(dto.getStatusLabel()).toBe('Rascunho');
    });

    it('should return correct label for SUBMITTED', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.getStatusLabel()).toBe('Aguardando Aprovação');
    });

    it('should return correct label for APPROVED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'APPROVED',
      });
      expect(dto.getStatusLabel()).toBe('Aprovada');
    });

    it('should return correct label for REJECTED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'REJECTED',
      });
      expect(dto.getStatusLabel()).toBe('Rejeitada');
    });
  });

  describe('getPriorityLabel()', () => {
    it('should return correct label for URGENT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'URGENT',
      });
      expect(dto.getPriorityLabel()).toBe('Urgente');
    });

    it('should return correct label for HIGH', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.getPriorityLabel()).toBe('Alta');
    });

    it('should return correct label for NORMAL', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'NORMAL',
      });
      expect(dto.getPriorityLabel()).toBe('Normal');
    });

    it('should return correct label for LOW', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'LOW',
      });
      expect(dto.getPriorityLabel()).toBe('Baixa');
    });
  });

  describe('getStatusColor()', () => {
    it('should return gray for DRAFT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
      });
      expect(dto.getStatusColor()).toBe('gray');
    });

    it('should return blue for SUBMITTED', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.getStatusColor()).toBe('blue');
    });

    it('should return green for APPROVED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'APPROVED',
      });
      expect(dto.getStatusColor()).toBe('green');
    });

    it('should return red for REJECTED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'REJECTED',
      });
      expect(dto.getStatusColor()).toBe('red');
    });
  });

  describe('getPriorityColor()', () => {
    it('should return red for URGENT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'URGENT',
      });
      expect(dto.getPriorityColor()).toBe('red');
    });

    it('should return orange for HIGH', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.getPriorityColor()).toBe('orange');
    });

    it('should return blue for NORMAL', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'NORMAL',
      });
      expect(dto.getPriorityColor()).toBe('blue');
    });

    it('should return green for LOW', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        priority: 'LOW',
      });
      expect(dto.getPriorityColor()).toBe('green');
    });
  });

  describe('getFormattedTotal()', () => {
    it('should format currency correctly', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.getFormattedTotal()).toBe('R$ 1.500,00');
    });

    it('should handle zero', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        total_amount: 0,
      });
      expect(dto.getFormattedTotal()).toBe('R$ 0,00');
    });

    it('should handle null', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        total_amount: null,
      });
      expect(dto.getFormattedTotal()).toBe('R$ 0,00');
    });
  });

  describe('canEdit()', () => {
    it('should allow edit for DRAFT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
      });
      expect(dto.canEdit()).toBe(true);
    });

    it('should not allow edit for SUBMITTED', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.canEdit()).toBe(false);
    });

    it('should not allow edit for APPROVED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'APPROVED',
      });
      expect(dto.canEdit()).toBe(false);
    });
  });

  describe('canSubmit()', () => {
    it('should allow submit for DRAFT with items', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
      });
      expect(dto.canSubmit()).toBe(true);
    });

    it('should not allow submit without items', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
        items: [],
      });
      expect(dto.canSubmit()).toBe(false);
    });

    it('should not allow submit for SUBMITTED', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.canSubmit()).toBe(false);
    });
  });

  describe('canApprove()', () => {
    it('should allow approve for SUBMITTED', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      expect(dto.canApprove()).toBe(true);
    });

    it('should not allow approve for DRAFT', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'DRAFT',
      });
      expect(dto.canApprove()).toBe(false);
    });

    it('should not allow approve for APPROVED', () => {
      const dto = new PurchaseRequestResponseDTO({
        ...mockRequest,
        status: 'APPROVED',
      });
      expect(dto.canApprove()).toBe(false);
    });
  });

  describe('toObject()', () => {
    it('should include all properties', () => {
      const dto = new PurchaseRequestResponseDTO(mockRequest);
      const obj = dto.toObject();

      expect(obj).toHaveProperty('id');
      expect(obj).toHaveProperty('request_number', 'REQ-2025-001');
      expect(obj).toHaveProperty('status_label', 'Aguardando Aprovação');
      expect(obj).toHaveProperty('priority_label', 'Alta');
      expect(obj).toHaveProperty('formatted_total', 'R$ 1.500,00');
      expect(obj).toHaveProperty('can_edit', false);
      expect(obj).toHaveProperty('can_submit', false);
      expect(obj).toHaveProperty('can_approve', true);
    });
  });
});

// ============================================================
// CREATE PURCHASE QUOTE DTO TESTS
// ============================================================

describe('CreatePurchaseQuoteDTO', () => {
  const validInput = {
    request_id: '123e4567-e89b-42d3-a456-426614174000',
    supplier_id: '987e6543-e21b-42d3-a456-426614174000',
    quoted_by: '111e2222-e33b-44d4-a556-666777888999',
    delivery_days: 7,
    notes: 'Melhor preço disponível',
    items: [
      {
        product_id: '222e3333-e44b-55d5-a667-777888999000',
        quantity: 10,
        unit_cost: 15.5,
      },
    ],
  };

  describe('validate()', () => {
    it('should validate correct data', () => {
      const dto = new CreatePurchaseQuoteDTO(validInput);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing request_id', () => {
      const input = { ...validInput };
      delete input.request_id;

      const dto = new CreatePurchaseQuoteDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'request_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject missing supplier_id', () => {
      const input = { ...validInput };
      delete input.supplier_id;

      const dto = new CreatePurchaseQuoteDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'supplier_id é obrigatório e deve ser um UUID válido'
      );
    });

    it('should reject negative delivery_days', () => {
      const dto = new CreatePurchaseQuoteDTO({
        ...validInput,
        delivery_days: -5,
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Prazo de entrega deve ser ≥ 0');
    });

    it('should reject empty items array', () => {
      const dto = new CreatePurchaseQuoteDTO({
        ...validInput,
        items: [],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Deve haver pelo menos um item na cotação'
      );
    });

    it('should reject item with negative unit_cost', () => {
      const dto = new CreatePurchaseQuoteDTO({
        ...validInput,
        items: [
          {
            product_id: '222e3333-e44b-55d5-a667-777888999000',
            quantity: 10,
            unit_cost: -10,
          },
        ],
      });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Item 1: Custo unitário deve ser maior que zero'
      );
    });

    it('should default delivery_days to 0', () => {
      const input = { ...validInput };
      delete input.delivery_days;

      const dto = new CreatePurchaseQuoteDTO(input);
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(dto.delivery_days).toBe(0);
    });
  });

  describe('getItems()', () => {
    it('should return items with line_total calculated', () => {
      const dto = new CreatePurchaseQuoteDTO(validInput);
      const items = dto.getItems();

      expect(items).toHaveLength(1);
      expect(items[0]).toHaveProperty('line_total', 155); // 10 * 15.5
    });
  });
});

// ============================================================
// PURCHASE QUOTE RESPONSE DTO TESTS
// ============================================================

describe('PurchaseQuoteResponseDTO', () => {
  const mockQuote = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    quote_number: 'COT-2025-001',
    request_id: '987e6543-e21b-42d3-a456-426614174000',
    supplier_id: '111e2222-e33b-44d4-a556-666777888999',
    total_price: 500.0, // Usar total_price ao invés de total_amount
    delivery_days: 7,
    is_selected: false,
    created_at: '2025-11-13T10:00:00Z',
    supplier: {
      id: '111e2222-e33b-44d4-a556-666777888999',
      name: 'Fornecedor XYZ',
    },
  };

  describe('getFormattedTotal()', () => {
    it('should format currency correctly', () => {
      const dto = new PurchaseQuoteResponseDTO(mockQuote);
      expect(dto.getFormattedTotal()).toBe('R$ 500,00');
    });
  });

  describe('getDeliveryLabel()', () => {
    it('should format delivery days', () => {
      const dto = new PurchaseQuoteResponseDTO(mockQuote);
      expect(dto.getDeliveryLabel()).toBe('7 dias');
    });

    it('should handle null delivery', () => {
      const dto = new PurchaseQuoteResponseDTO({
        ...mockQuote,
        delivery_days: null,
      });
      expect(dto.getDeliveryLabel()).toBe('Não informado');
    });

    it('should handle 1 day singular', () => {
      const dto = new PurchaseQuoteResponseDTO({
        ...mockQuote,
        delivery_days: 1,
      });
      expect(dto.getDeliveryLabel()).toBe('1 dia');
    });
  });

  describe('canSelect()', () => {
    it('should allow selection if not selected', () => {
      const dto = new PurchaseQuoteResponseDTO(mockQuote);
      expect(dto.canSelect()).toBe(true);
    });

    it('should not allow selection if already selected', () => {
      const dto = new PurchaseQuoteResponseDTO({
        ...mockQuote,
        is_selected: true,
      });
      expect(dto.canSelect()).toBe(false);
    });
  });

  describe('toObject()', () => {
    it('should include formatted fields', () => {
      const dto = new PurchaseQuoteResponseDTO(mockQuote);
      const obj = dto.toObject();

      expect(obj.total_formatted).toBeDefined();
      expect(obj.total_formatted).toContain('R$'); // Verifica que contém R$
      expect(obj).toHaveProperty('delivery_label', '7 dias');
      expect(obj).toHaveProperty('can_select', true);
    });
  });
});

// ============================================================
// PURCHASE REQUEST FILTERS DTO TESTS
// ============================================================

describe('PurchaseRequestFiltersDTO', () => {
  describe('validate()', () => {
    it('should validate default values', () => {
      const dto = new PurchaseRequestFiltersDTO({});
      const result = dto.validate();

      expect(result.isValid).toBe(true);
      expect(dto.page).toBe(1);
      expect(dto.page_size).toBe(20);
    });

    it('should default page to 1 when given 0 or less', () => {
      const dto = new PurchaseRequestFiltersDTO({ page: 0 });
      expect(dto.page).toBe(1); // Defaults to 1
    });

    it('should default page_size to 20 when given 0 or less', () => {
      const dto = new PurchaseRequestFiltersDTO({ page_size: 0 });
      expect(dto.page_size).toBe(20); // Defaults to 20
    });

    it('should reject page_size greater than 100', () => {
      const dto = new PurchaseRequestFiltersDTO({ page_size: 101 });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('page_size deve estar entre 1 e 100'); // Mensagem exata do DTO
    });

    it('should accept valid status', () => {
      const dto = new PurchaseRequestFiltersDTO({ status: 'APPROVED' });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid status', () => {
      const dto = new PurchaseRequestFiltersDTO({ status: 'INVALID' });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('status inválido'); // Mensagem exata do DTO
    });

    it('should accept valid priority', () => {
      const dto = new PurchaseRequestFiltersDTO({ priority: 'HIGH' });
      const result = dto.validate();

      expect(result.isValid).toBe(true);
    });

    it('should reject invalid priority', () => {
      const dto = new PurchaseRequestFiltersDTO({ priority: 'SUPER_HIGH' });
      const result = dto.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('priority inválida'); // Mensagem exata do DTO
    });
  });

  describe('getOffset()', () => {
    it('should calculate offset correctly for page 1', () => {
      const dto = new PurchaseRequestFiltersDTO({ page: 1, page_size: 20 });
      expect(dto.getOffset()).toBe(0);
    });

    it('should calculate offset correctly for page 2', () => {
      const dto = new PurchaseRequestFiltersDTO({ page: 2, page_size: 20 });
      expect(dto.getOffset()).toBe(20);
    });

    it('should calculate offset correctly for page 3 with custom page_size', () => {
      const dto = new PurchaseRequestFiltersDTO({ page: 3, page_size: 50 });
      expect(dto.getOffset()).toBe(100);
    });
  });

  describe('getLimit()', () => {
    it('should return page_size', () => {
      const dto = new PurchaseRequestFiltersDTO({ page_size: 25 });
      expect(dto.getLimit()).toBe(25);
    });

    it('should return default page_size', () => {
      const dto = new PurchaseRequestFiltersDTO({});
      expect(dto.getLimit()).toBe(20);
    });
  });
});
