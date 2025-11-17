/**
 * Product DTO Tests
 * Barber Analytics Pro - v2.0.0
 *
 * @description Testes unitários para DTOs de produtos
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { describe, it, expect } from 'vitest';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponseDTO,
  ProductFiltersDTO,
  UNIT_OF_MEASURE,
  STOCK_STATUS,
} from '../productDTO.js';

// ========================================
// CREATE PRODUCT DTO TESTS
// ========================================

describe('CreateProductDTO', () => {
  const validInput = {
    unit_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Shampoo Anticaspa',
    description: 'Shampoo profissional para tratamento de caspa',
    sku: 'SHMP001',
    category: 'Shampoos',
    brand: 'TRESemmé',
    cost_price: 25.5,
    selling_price: 45.9,
    current_stock: 10,
    min_stock: 5,
    max_stock: 50,
    unit_of_measure: UNIT_OF_MEASURE.UN,
    supplier_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    barcode: '7891234567890',
    location: 'Prateleira A1',
    notes: 'Produto importado',
    created_by: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
    category_id: 'c47ac10b-58cc-4372-a567-0e02b2c3d482',
  };

  describe('Validation - Required Fields', () => {
    it('deve validar dados corretos', () => {
      const dto = new CreateProductDTO(validInput);
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve rejeitar quando unit_id está ausente', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        unit_id: null,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unidade é obrigatória');
    });

    it('deve rejeitar quando unit_id é inválido', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        unit_id: 'invalid-uuid',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID da unidade inválido');
    });

    it('deve rejeitar quando name está ausente', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        name: '',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Nome deve ter pelo menos 3 caracteres'
      );
    });

    it('deve rejeitar quando name tem menos de 3 caracteres', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        name: 'AB',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Nome deve ter pelo menos 3 caracteres'
      );
    });

    it('deve rejeitar quando name tem mais de 255 caracteres', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        name: 'A'.repeat(256),
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Nome deve ter no máximo 255 caracteres'
      );
    });
  });

  describe('Validation - SKU', () => {
    it('deve aceitar SKU válido', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        sku: 'PROD-123-ABC',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve converter SKU para maiúsculas', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        sku: 'prod-123',
      });

      expect(dto.sku).toBe('PROD-123');
    });

    it('deve aceitar SKU nulo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        sku: null,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve rejeitar SKU com mais de 50 caracteres', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        sku: 'A'.repeat(51),
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'SKU deve ter no máximo 50 caracteres'
      );
    });
  });

  describe('Validation - Prices', () => {
    it('deve rejeitar preço de custo negativo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        cost_price: -10,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço de custo não pode ser negativo'
      );
    });

    it('deve rejeitar preço de venda negativo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        selling_price: -5,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço de venda não pode ser negativo'
      );
    });

    it('deve rejeitar quando preço de venda é menor que custo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        cost_price: 50,
        selling_price: 30,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço de venda não pode ser menor que o preço de custo'
      );
    });

    it('deve aceitar preços zero', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        cost_price: 0,
        selling_price: 0,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Validation - Stock', () => {
    it('deve rejeitar estoque atual negativo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        current_stock: -5,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Estoque atual não pode ser negativo'
      );
    });

    it('deve rejeitar estoque mínimo negativo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        min_stock: -2,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Estoque mínimo não pode ser negativo'
      );
    });

    it('deve rejeitar estoque máximo negativo', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        max_stock: -10,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Estoque máximo não pode ser negativo'
      );
    });

    it('deve rejeitar quando min_stock > max_stock', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        min_stock: 20,
        max_stock: 10,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Estoque mínimo não pode ser maior que o máximo'
      );
    });

    it('deve aceitar estoques zero', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        current_stock: 0,
        min_stock: 0,
        max_stock: 0,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('Validation - Unit of Measure', () => {
    it('deve aceitar unidade de medida válida', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        unit_of_measure: UNIT_OF_MEASURE.LT,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve rejeitar unidade de medida inválida', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        unit_of_measure: 'INVALID',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unidade de medida inválida');
    });

    it('deve usar UN como padrão', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        unit_of_measure: undefined,
      });

      expect(dto.unit_of_measure).toBe(UNIT_OF_MEASURE.UN);
    });
  });

  describe('Validation - UUIDs', () => {
    it('deve rejeitar supplier_id inválido', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        supplier_id: 'invalid-uuid',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID do fornecedor inválido');
    });

    it('deve rejeitar category_id inválido', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        category_id: 'invalid-uuid',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID da categoria inválido');
    });

    it('deve rejeitar created_by inválido', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        created_by: 'invalid-uuid',
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID do criador inválido');
    });

    it('deve aceitar UUIDs opcionais nulos', () => {
      const dto = new CreateProductDTO({
        ...validInput,
        supplier_id: null,
        category_id: null,
        created_by: null,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });
  });

  describe('toObject()', () => {
    it('deve converter para objeto plano', () => {
      const dto = new CreateProductDTO(validInput);
      const obj = dto.toObject();

      expect(obj).toHaveProperty('unit_id', validInput.unit_id);
      expect(obj).toHaveProperty('name', validInput.name);
      expect(obj).toHaveProperty('sku', 'SHMP001');
      expect(obj).toHaveProperty('cost_price', 25.5);
      expect(obj).toHaveProperty('is_active', true);
    });

    it('deve incluir is_active como true', () => {
      const dto = new CreateProductDTO(validInput);
      const obj = dto.toObject();

      expect(obj.is_active).toBe(true);
    });
  });
});

// ========================================
// UPDATE PRODUCT DTO TESTS
// ========================================

describe('UpdateProductDTO', () => {
  describe('Partial Updates', () => {
    it('deve aceitar atualização parcial', () => {
      const dto = new UpdateProductDTO({
        name: 'Novo Nome',
        selling_price: 50.0,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
      expect(dto.name).toBe('Novo Nome');
      expect(dto.selling_price).toBe(50.0);
      expect(dto.description).toBeUndefined();
    });

    it('deve aceitar objeto vazio', () => {
      const dto = new UpdateProductDTO({});
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve incluir updated_at automaticamente', () => {
      const dto = new UpdateProductDTO({ name: 'Test' });

      expect(dto.updated_at).toBeDefined();
      expect(typeof dto.updated_at).toBe('string');
    });
  });

  describe('Validation - Name', () => {
    it('deve rejeitar nome com menos de 3 caracteres', () => {
      const dto = new UpdateProductDTO({ name: 'AB' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Nome deve ter pelo menos 3 caracteres'
      );
    });

    it('deve rejeitar nome com mais de 255 caracteres', () => {
      const dto = new UpdateProductDTO({ name: 'A'.repeat(256) });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Nome deve ter no máximo 255 caracteres'
      );
    });
  });

  describe('Validation - Prices', () => {
    it('deve rejeitar preço de custo negativo', () => {
      const dto = new UpdateProductDTO({ cost_price: -10 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço de custo não pode ser negativo'
      );
    });

    it('deve rejeitar preço de venda negativo', () => {
      const dto = new UpdateProductDTO({ selling_price: -5 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço de venda não pode ser negativo'
      );
    });
  });

  describe('toObject()', () => {
    it('deve incluir apenas campos definidos', () => {
      const dto = new UpdateProductDTO({
        name: 'Test',
        selling_price: 100,
      });
      const obj = dto.toObject();

      expect(obj).toHaveProperty('name');
      expect(obj).toHaveProperty('selling_price');
      expect(obj).toHaveProperty('updated_at');
      expect(obj).not.toHaveProperty('description');
      expect(obj).not.toHaveProperty('cost_price');
    });
  });
});

// ========================================
// PRODUCT RESPONSE DTO TESTS
// ========================================

describe('ProductResponseDTO', () => {
  const mockProduct = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    unit_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    name: 'Shampoo Test',
    cost_price: 20.0,
    selling_price: 40.0,
    current_stock: 8,
    min_stock: 5,
    max_stock: 50,
    unit_of_measure: UNIT_OF_MEASURE.UN,
    is_active: true,
  };

  describe('Stock Status', () => {
    it('deve retornar CRITICAL quando estoque é zero', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 0,
      });

      expect(dto.getStockStatus()).toBe(STOCK_STATUS.CRITICAL);
    });

    it('deve retornar LOW quando estoque < min_stock', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 3,
        min_stock: 5,
      });

      expect(dto.getStockStatus()).toBe(STOCK_STATUS.LOW);
    });

    it('deve retornar OK quando min <= estoque <= max', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 10,
        min_stock: 5,
        max_stock: 50,
      });

      expect(dto.getStockStatus()).toBe(STOCK_STATUS.OK);
    });

    it('deve retornar EXCESS quando estoque > max_stock', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 60,
        max_stock: 50,
      });

      expect(dto.getStockStatus()).toBe(STOCK_STATUS.EXCESS);
    });
  });

  describe('Stock Status Config', () => {
    it('deve retornar config correta para CRITICAL', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 0,
      });
      const config = dto.getStockStatusConfig();

      expect(config.label).toBe('Crítico');
      expect(config.color).toBe('red');
      expect(config.emoji).toBe('🚨');
    });

    it('deve retornar config correta para LOW', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 3,
        min_stock: 5,
      });
      const config = dto.getStockStatusConfig();

      expect(config.label).toBe('Baixo');
      expect(config.color).toBe('orange');
      expect(config.emoji).toBe('⚠️');
    });
  });

  describe('Profit Margin', () => {
    it('deve calcular margem de lucro corretamente', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        cost_price: 20.0,
        selling_price: 40.0,
      });

      expect(dto.getProfitMargin()).toBe(50); // (40-20)/40 * 100 = 50%
    });

    it('deve retornar 0 quando preço de custo é zero', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        cost_price: 0,
        selling_price: 40.0,
      });

      expect(dto.getProfitMargin()).toBe(0);
    });

    it('deve retornar 0 quando preço de venda é zero', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        cost_price: 20.0,
        selling_price: 0,
      });

      expect(dto.getProfitMargin()).toBe(0);
    });
  });

  describe('Stock Values', () => {
    it('deve calcular valor total de estoque (custo)', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 10,
        cost_price: 25.5,
      });

      expect(dto.getTotalStockValue()).toBe(255);
    });

    it('deve calcular valor total de estoque (venda)', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 10,
        selling_price: 50.0,
      });

      expect(dto.getTotalStockValueSelling()).toBe(500);
    });
  });

  describe('Stock Flags', () => {
    it('isOutOfStock() deve retornar true quando estoque é zero', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 0,
      });

      expect(dto.isOutOfStock()).toBe(true);
    });

    it('isLowStock() deve retornar true quando estoque < min_stock', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 3,
        min_stock: 5,
      });

      expect(dto.isLowStock()).toBe(true);
    });

    it('isExcessStock() deve retornar true quando estoque > max_stock', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        current_stock: 60,
        max_stock: 50,
      });

      expect(dto.isExcessStock()).toBe(true);
    });
  });

  describe('toObject()', () => {
    it('deve incluir campos formatados', () => {
      const dto = new ProductResponseDTO({
        ...mockProduct,
        cost_price: 25.5,
        selling_price: 45.9,
        current_stock: 10,
      });
      const obj = dto.toObject();

      expect(obj).toHaveProperty('cost_price_formatted');
      expect(obj).toHaveProperty('selling_price_formatted');
      expect(obj).toHaveProperty('profit_margin');
      expect(obj).toHaveProperty('profit_margin_formatted');
      expect(obj).toHaveProperty('stock_status');
      expect(obj).toHaveProperty('stock_status_label');
      expect(obj).toHaveProperty('is_out_of_stock');
      expect(obj).toHaveProperty('is_low_stock');
    });
  });
});

// ========================================
// PRODUCT FILTERS DTO TESTS
// ========================================

describe('ProductFiltersDTO', () => {
  describe('Default Values', () => {
    it('deve usar valores padrão quando não fornecidos', () => {
      const dto = new ProductFiltersDTO();

      expect(dto.page).toBe(1);
      expect(dto.page_size).toBe(20);
      expect(dto.order_by).toBe('name');
      expect(dto.order_direction).toBe('ASC');
      expect(dto.is_active).toBe(true);
    });

    it('deve aceitar valores customizados', () => {
      const dto = new ProductFiltersDTO({
        page: 2,
        page_size: 50,
        order_by: 'selling_price',
        order_direction: 'desc',
        is_active: false,
      });

      expect(dto.page).toBe(2);
      expect(dto.page_size).toBe(50);
      expect(dto.order_by).toBe('selling_price');
      expect(dto.order_direction).toBe('DESC');
      expect(dto.is_active).toBe(false);
    });
  });

  describe('Validation - UUIDs', () => {
    it('deve rejeitar unit_id inválido', () => {
      const dto = new ProductFiltersDTO({ unit_id: 'invalid' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID da unidade inválido');
    });

    it('deve rejeitar category_id inválido', () => {
      const dto = new ProductFiltersDTO({ category_id: 'invalid' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID da categoria inválido');
    });

    it('deve rejeitar supplier_id inválido', () => {
      const dto = new ProductFiltersDTO({ supplier_id: 'invalid' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID do fornecedor inválido');
    });
  });

  describe('Validation - Stock Status', () => {
    it('deve aceitar stock_status válido', () => {
      const dto = new ProductFiltersDTO({
        stock_status: STOCK_STATUS.LOW,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(true);
    });

    it('deve rejeitar stock_status inválido', () => {
      const dto = new ProductFiltersDTO({ stock_status: 'INVALID' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Status de estoque inválido');
    });
  });

  describe('Validation - Prices', () => {
    it('deve rejeitar preço mínimo negativo', () => {
      const dto = new ProductFiltersDTO({ min_price: -10 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Preço mínimo não pode ser negativo');
    });

    it('deve rejeitar preço máximo negativo', () => {
      const dto = new ProductFiltersDTO({ max_price: -5 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Preço máximo não pode ser negativo');
    });

    it('deve rejeitar quando min_price > max_price', () => {
      const dto = new ProductFiltersDTO({
        min_price: 100,
        max_price: 50,
      });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Preço mínimo não pode ser maior que o máximo'
      );
    });
  });

  describe('Validation - Pagination', () => {
    it('deve rejeitar página menor que 1', () => {
      const dto = new ProductFiltersDTO({ page: -1 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Página deve ser maior que zero');
    });

    it('deve rejeitar page_size menor que 1', () => {
      const dto = new ProductFiltersDTO({ page_size: -1 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Tamanho da página deve estar entre 1 e 100'
      );
    });

    it('deve rejeitar page_size maior que 100', () => {
      const dto = new ProductFiltersDTO({ page_size: 101 });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Tamanho da página deve estar entre 1 e 100'
      );
    });
  });

  describe('Validation - Ordering', () => {
    it('deve aceitar order_by válido', () => {
      const validFields = [
        'name',
        'sku',
        'category',
        'brand',
        'cost_price',
        'selling_price',
        'current_stock',
        'created_at',
        'updated_at',
      ];

      validFields.forEach(field => {
        const dto = new ProductFiltersDTO({ order_by: field });
        const validation = dto.validate();
        expect(validation.isValid).toBe(true);
      });
    });

    it('deve rejeitar order_by inválido', () => {
      const dto = new ProductFiltersDTO({ order_by: 'invalid_field' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Campo de ordenação inválido');
    });

    it('deve rejeitar order_direction inválido', () => {
      const dto = new ProductFiltersDTO({ order_direction: 'INVALID' });
      const validation = dto.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Direção de ordenação deve ser ASC ou DESC'
      );
    });
  });

  describe('Pagination Methods', () => {
    it('getOffset() deve calcular offset corretamente', () => {
      const dto1 = new ProductFiltersDTO({ page: 1, page_size: 20 });
      expect(dto1.getOffset()).toBe(0);

      const dto2 = new ProductFiltersDTO({ page: 2, page_size: 20 });
      expect(dto2.getOffset()).toBe(20);

      const dto3 = new ProductFiltersDTO({ page: 3, page_size: 50 });
      expect(dto3.getOffset()).toBe(100);
    });

    it('getLimit() deve retornar page_size', () => {
      const dto = new ProductFiltersDTO({ page_size: 30 });
      expect(dto.getLimit()).toBe(30);
    });
  });

  describe('toObject()', () => {
    it('deve incluir offset e limit calculados', () => {
      const dto = new ProductFiltersDTO({
        page: 2,
        page_size: 25,
      });
      const obj = dto.toObject();

      expect(obj.offset).toBe(25);
      expect(obj.limit).toBe(25);
    });

    it('deve incluir todos os filtros fornecidos', () => {
      const dto = new ProductFiltersDTO({
        search: 'shampoo',
        category: 'Cosméticos',
        brand: 'TRESemmé',
        is_active: false,
      });
      const obj = dto.toObject();

      expect(obj.search).toBe('shampoo');
      expect(obj.category).toBe('Cosméticos');
      expect(obj.brand).toBe('TRESemmé');
      expect(obj.is_active).toBe(false);
    });
  });
});
