/**
 * DTOs para o módulo de Produtos
 * Barber Analytics Pro - v2.0.0
 *
 * @module ProductDTO
 * @description Data Transfer Objects para validação e transformação de dados de produtos
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { isValidUUID } from '../utils/validators.js';
import { formatCurrency } from '../utils/formatters.js';

// ========================================
// ENUMS & CONSTANTS
// ========================================

/**
 * Unidades de medida disponíveis
 */
export const UNIT_OF_MEASURE = {
  UN: 'UN', // Unidade
  CX: 'CX', // Caixa
  PCT: 'PCT', // Pacote
  FR: 'FR', // Frasco
  LT: 'LT', // Litro
  ML: 'ML', // Mililitro
  KG: 'KG', // Kilograma
  GR: 'GR', // Grama
  MT: 'MT', // Metro
  CM: 'CM', // Centímetro
};

/**
 * Labels de unidades de medida
 */
export const UNIT_LABELS = {
  UN: 'Unidade',
  CX: 'Caixa',
  PCT: 'Pacote',
  FR: 'Frasco',
  LT: 'Litro',
  ML: 'Mililitro',
  KG: 'Kilograma',
  GR: 'Grama',
  MT: 'Metro',
  CM: 'Centímetro',
};

/**
 * Status de estoque baseado em min/max
 */
export const STOCK_STATUS = {
  CRITICAL: 'CRITICAL', // current_stock = 0
  LOW: 'LOW', // current_stock < min_stock
  OK: 'OK', // min_stock <= current_stock <= max_stock
  EXCESS: 'EXCESS', // current_stock > max_stock
};

/**
 * Labels e cores de status de estoque
 */
export const STOCK_STATUS_CONFIG = {
  CRITICAL: { label: 'Crítico', color: 'red', emoji: '🚨' },
  LOW: { label: 'Baixo', color: 'orange', emoji: '⚠️' },
  OK: { label: 'Normal', color: 'green', emoji: '✅' },
  EXCESS: { label: 'Excesso', color: 'blue', emoji: '📦' },
};

// ========================================
// CREATE PRODUCT DTO
// ========================================

/**
 * DTO para criação de produto
 */
export class CreateProductDTO {
  constructor(data) {
    this.unit_id = data.unit_id;
    this.name = data.name?.trim();
    this.description = data.description?.trim() || null;
    this.sku = data.sku?.trim().toUpperCase() || null;
    this.category = data.category?.trim() || null;
    this.brand = data.brand?.trim() || null;
    this.cost_price = data.cost_price ? parseFloat(data.cost_price) : 0.0;
    this.selling_price = data.selling_price
      ? parseFloat(data.selling_price)
      : 0.0;
    this.current_stock = data.current_stock
      ? parseInt(data.current_stock, 10)
      : 0;
    this.min_stock = data.min_stock ? parseInt(data.min_stock, 10) : 0;
    this.max_stock = data.max_stock ? parseInt(data.max_stock, 10) : 0;
    this.unit_of_measure = data.unit_of_measure || UNIT_OF_MEASURE.UN;
    this.supplier_id = data.supplier_id || null;
    this.barcode = data.barcode?.trim() || null;
    this.location = data.location?.trim() || null;
    this.notes = data.notes?.trim() || null;
    this.created_by = data.created_by || null;
    this.category_id = data.category_id || null;
    this.unit_measurement = data.unit_measurement || UNIT_OF_MEASURE.UN;
    this.is_active = true; // Sempre ativo na criação
  }

  /**
   * Valida os dados do produto
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Validações obrigatórias
    if (!this.unit_id) {
      errors.push('Unidade é obrigatória');
    } else if (!isValidUUID(this.unit_id)) {
      errors.push('ID da unidade inválido');
    }

    if (!this.name || this.name.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (this.name && this.name.length > 255) {
      errors.push('Nome deve ter no máximo 255 caracteres');
    }

    // Validação de SKU
    if (this.sku && this.sku.length > 50) {
      errors.push('SKU deve ter no máximo 50 caracteres');
    }

    // Validação de preços
    if (this.cost_price < 0) {
      errors.push('Preço de custo não pode ser negativo');
    }

    if (this.selling_price < 0) {
      errors.push('Preço de venda não pode ser negativo');
    }

    if (
      this.cost_price > 0 &&
      this.selling_price > 0 &&
      this.selling_price < this.cost_price
    ) {
      errors.push('Preço de venda não pode ser menor que o preço de custo');
    }

    // Validação de estoque
    if (this.current_stock < 0) {
      errors.push('Estoque atual não pode ser negativo');
    }

    if (this.min_stock < 0) {
      errors.push('Estoque mínimo não pode ser negativo');
    }

    if (this.max_stock < 0) {
      errors.push('Estoque máximo não pode ser negativo');
    }

    if (this.max_stock > 0 && this.min_stock > this.max_stock) {
      errors.push('Estoque mínimo não pode ser maior que o máximo');
    }

    // Validação de unidade de medida
    if (
      this.unit_of_measure &&
      !Object.values(UNIT_OF_MEASURE).includes(this.unit_of_measure)
    ) {
      errors.push('Unidade de medida inválida');
    }

    // Validação de UUID opcional
    if (this.supplier_id && !isValidUUID(this.supplier_id)) {
      errors.push('ID do fornecedor inválido');
    }

    if (this.category_id && !isValidUUID(this.category_id)) {
      errors.push('ID da categoria inválido');
    }

    if (this.created_by && !isValidUUID(this.created_by)) {
      errors.push('ID do criador inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converte para objeto plano para inserção no banco
   * @returns {Object}
   */
  toObject() {
    return {
      unit_id: this.unit_id,
      name: this.name,
      description: this.description,
      sku: this.sku,
      category: this.category,
      brand: this.brand,
      cost_price: this.cost_price,
      selling_price: this.selling_price,
      current_stock: this.current_stock,
      min_stock: this.min_stock,
      max_stock: this.max_stock,
      unit_of_measure: this.unit_of_measure,
      supplier_id: this.supplier_id,
      barcode: this.barcode,
      location: this.location,
      notes: this.notes,
      created_by: this.created_by,
      category_id: this.category_id,
      unit_measurement: this.unit_measurement,
      is_active: this.is_active,
    };
  }
}

// ========================================
// UPDATE PRODUCT DTO
// ========================================

/**
 * DTO para atualização de produto
 * Permite atualizações parciais
 */
export class UpdateProductDTO {
  constructor(data) {
    // Apenas campos fornecidos são incluídos
    if (data.name !== undefined) {
      this.name = data.name?.trim();
    }

    if (data.description !== undefined) {
      this.description = data.description?.trim() || null;
    }

    if (data.sku !== undefined) {
      this.sku = data.sku?.trim().toUpperCase() || null;
    }

    if (data.category !== undefined) {
      this.category = data.category?.trim() || null;
    }

    if (data.brand !== undefined) {
      this.brand = data.brand?.trim() || null;
    }

    if (data.cost_price !== undefined) {
      this.cost_price = data.cost_price ? parseFloat(data.cost_price) : 0.0;
    }

    if (data.selling_price !== undefined) {
      this.selling_price = data.selling_price
        ? parseFloat(data.selling_price)
        : 0.0;
    }

    if (data.current_stock !== undefined) {
      this.current_stock = parseInt(data.current_stock, 10);
    }

    if (data.min_stock !== undefined) {
      this.min_stock = parseInt(data.min_stock, 10);
    }

    if (data.max_stock !== undefined) {
      this.max_stock = parseInt(data.max_stock, 10);
    }

    if (data.unit_of_measure !== undefined) {
      this.unit_of_measure = data.unit_of_measure;
    }

    if (data.supplier_id !== undefined) {
      this.supplier_id = data.supplier_id || null;
    }

    if (data.barcode !== undefined) {
      this.barcode = data.barcode?.trim() || null;
    }

    if (data.location !== undefined) {
      this.location = data.location?.trim() || null;
    }

    if (data.notes !== undefined) {
      this.notes = data.notes?.trim() || null;
    }

    if (data.category_id !== undefined) {
      this.category_id = data.category_id || null;
    }

    if (data.unit_measurement !== undefined) {
      this.unit_measurement = data.unit_measurement;
    }

    if (data.is_active !== undefined) {
      this.is_active = Boolean(data.is_active);
    }

    // Sempre atualiza o timestamp
    this.updated_at = new Date().toISOString();
  }

  /**
   * Valida os dados para atualização
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Validação apenas dos campos fornecidos
    if (this.name !== undefined) {
      if (!this.name || this.name.length < 3) {
        errors.push('Nome deve ter pelo menos 3 caracteres');
      }
      if (this.name && this.name.length > 255) {
        errors.push('Nome deve ter no máximo 255 caracteres');
      }
    }

    if (this.sku !== undefined && this.sku && this.sku.length > 50) {
      errors.push('SKU deve ter no máximo 50 caracteres');
    }

    if (this.cost_price !== undefined && this.cost_price < 0) {
      errors.push('Preço de custo não pode ser negativo');
    }

    if (this.selling_price !== undefined && this.selling_price < 0) {
      errors.push('Preço de venda não pode ser negativo');
    }

    // Validação de estoque (apenas se fornecidos)
    if (this.current_stock !== undefined && this.current_stock < 0) {
      errors.push('Estoque atual não pode ser negativo');
    }

    if (this.min_stock !== undefined && this.min_stock < 0) {
      errors.push('Estoque mínimo não pode ser negativo');
    }

    if (this.max_stock !== undefined && this.max_stock < 0) {
      errors.push('Estoque máximo não pode ser negativo');
    }

    // Validação de unidade de medida
    if (
      this.unit_of_measure !== undefined &&
      this.unit_of_measure &&
      !Object.values(UNIT_OF_MEASURE).includes(this.unit_of_measure)
    ) {
      errors.push('Unidade de medida inválida');
    }

    // Validação de UUID opcional
    if (
      this.supplier_id !== undefined &&
      this.supplier_id &&
      !isValidUUID(this.supplier_id)
    ) {
      errors.push('ID do fornecedor inválido');
    }

    if (
      this.category_id !== undefined &&
      this.category_id &&
      !isValidUUID(this.category_id)
    ) {
      errors.push('ID da categoria inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converte para objeto plano apenas com campos definidos
   * @returns {Object}
   */
  toObject() {
    const obj = {};

    Object.keys(this).forEach(key => {
      if (this[key] !== undefined) {
        obj[key] = this[key];
      }
    });

    return obj;
  }
}

// ========================================
// PRODUCT RESPONSE DTO
// ========================================

/**
 * DTO para formatação de resposta de produto
 */
export class ProductResponseDTO {
  constructor(product) {
    this.id = product.id;
    this.unit_id = product.unit_id;
    this.name = product.name;
    this.description = product.description;
    this.sku = product.sku;
    this.category = product.category;
    this.brand = product.brand;
    this.cost_price = product.cost_price || 0;
    this.selling_price = product.selling_price || 0;
    this.current_stock = product.current_stock || 0;
    this.min_stock = product.min_stock || 0;
    this.max_stock = product.max_stock || 0;
    this.unit_of_measure = product.unit_of_measure || UNIT_OF_MEASURE.UN;
    this.supplier_id = product.supplier_id;
    this.barcode = product.barcode;
    this.location = product.location;
    this.notes = product.notes;
    this.is_active = product.is_active ?? true;
    this.created_at = product.created_at;
    this.updated_at = product.updated_at;
    this.created_by = product.created_by;
    this.category_id = product.category_id;
    this.unit_measurement = product.unit_measurement || UNIT_OF_MEASURE.UN;

    // Relacionamentos (se fornecidos)
    this.supplier = product.supplier || null;
    this.category_info = product.category_info || null;
    this.unit = product.unit || null;
  }

  /**
   * Retorna o status do estoque
   * @returns {string} CRITICAL, LOW, OK, EXCESS
   */
  getStockStatus() {
    if (this.current_stock === 0) {
      return STOCK_STATUS.CRITICAL;
    }

    if (this.min_stock > 0 && this.current_stock < this.min_stock) {
      return STOCK_STATUS.LOW;
    }

    if (this.max_stock > 0 && this.current_stock > this.max_stock) {
      return STOCK_STATUS.EXCESS;
    }

    return STOCK_STATUS.OK;
  }

  /**
   * Retorna configuração de status do estoque
   * @returns {Object} { label, color, emoji }
   */
  getStockStatusConfig() {
    const status = this.getStockStatus();
    return STOCK_STATUS_CONFIG[status];
  }

  /**
   * Calcula a margem de lucro
   * @returns {number} Porcentagem de margem (0-100)
   */
  getProfitMargin() {
    if (this.cost_price === 0 || this.selling_price === 0) {
      return 0;
    }

    return ((this.selling_price - this.cost_price) / this.selling_price) * 100;
  }

  /**
   * Retorna o valor total em estoque (custo)
   * @returns {number}
   */
  getTotalStockValue() {
    return this.current_stock * this.cost_price;
  }

  /**
   * Retorna o valor total em estoque (venda)
   * @returns {number}
   */
  getTotalStockValueSelling() {
    return this.current_stock * this.selling_price;
  }

  /**
   * Verifica se o produto está em falta
   * @returns {boolean}
   */
  isOutOfStock() {
    return this.current_stock === 0;
  }

  /**
   * Verifica se o produto está em estoque baixo
   * @returns {boolean}
   */
  isLowStock() {
    return (
      this.min_stock > 0 &&
      this.current_stock > 0 &&
      this.current_stock < this.min_stock
    );
  }

  /**
   * Verifica se o produto tem estoque em excesso
   * @returns {boolean}
   */
  isExcessStock() {
    return this.max_stock > 0 && this.current_stock > this.max_stock;
  }

  /**
   * Converte para objeto com campos formatados
   * @returns {Object}
   */
  toObject() {
    const stockStatus = this.getStockStatusConfig();

    return {
      ...this,
      // Formatações
      cost_price_formatted: formatCurrency(this.cost_price),
      selling_price_formatted: formatCurrency(this.selling_price),
      total_stock_value_formatted: formatCurrency(this.getTotalStockValue()),
      total_stock_value_selling_formatted: formatCurrency(
        this.getTotalStockValueSelling()
      ),
      profit_margin: this.getProfitMargin().toFixed(2),
      profit_margin_formatted: `${this.getProfitMargin().toFixed(1)}%`,

      // Status de estoque
      stock_status: this.getStockStatus(),
      stock_status_label: stockStatus.label,
      stock_status_color: stockStatus.color,
      stock_status_emoji: stockStatus.emoji,

      // Flags booleanas
      is_out_of_stock: this.isOutOfStock(),
      is_low_stock: this.isLowStock(),
      is_excess_stock: this.isExcessStock(),

      // Labels
      unit_of_measure_label:
        UNIT_LABELS[this.unit_of_measure] || this.unit_of_measure,
      unit_measurement_label:
        UNIT_LABELS[this.unit_measurement] || this.unit_measurement,
    };
  }
}

// ========================================
// PRODUCT FILTERS DTO
// ========================================

/**
 * DTO para filtros de busca de produtos
 */
export class ProductFiltersDTO {
  constructor(filters = {}) {
    this.unit_id = filters.unit_id || null;
    this.search = filters.search?.trim() || null;
    this.category = filters.category?.trim() || null;
    this.category_id = filters.category_id || null;
    this.brand = filters.brand?.trim() || null;
    this.supplier_id = filters.supplier_id || null;
    this.stock_status = filters.stock_status || null; // CRITICAL, LOW, OK, EXCESS
    this.is_active = filters.is_active !== undefined ? filters.is_active : true;
    this.min_price = filters.min_price ? parseFloat(filters.min_price) : null;
    this.max_price = filters.max_price ? parseFloat(filters.max_price) : null;
    this.location = filters.location?.trim() || null;

    // Paginação
    this.page = filters.page ? parseInt(filters.page, 10) : 1;
    this.page_size = filters.page_size ? parseInt(filters.page_size, 10) : 20;

    // Ordenação
    this.order_by = filters.order_by || 'name';
    this.order_direction = filters.order_direction?.toUpperCase() || 'ASC';
  }

  /**
   * Valida os filtros
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Validação de UUID
    if (this.unit_id && !isValidUUID(this.unit_id)) {
      errors.push('ID da unidade inválido');
    }

    if (this.category_id && !isValidUUID(this.category_id)) {
      errors.push('ID da categoria inválido');
    }

    if (this.supplier_id && !isValidUUID(this.supplier_id)) {
      errors.push('ID do fornecedor inválido');
    }

    // Validação de stock_status
    if (
      this.stock_status &&
      !Object.values(STOCK_STATUS).includes(this.stock_status)
    ) {
      errors.push('Status de estoque inválido');
    }

    // Validação de preços
    if (this.min_price !== null && this.min_price < 0) {
      errors.push('Preço mínimo não pode ser negativo');
    }

    if (this.max_price !== null && this.max_price < 0) {
      errors.push('Preço máximo não pode ser negativo');
    }

    if (
      this.min_price !== null &&
      this.max_price !== null &&
      this.min_price > this.max_price
    ) {
      errors.push('Preço mínimo não pode ser maior que o máximo');
    }

    // Validação de paginação
    if (this.page < 1) {
      errors.push('Página deve ser maior que zero');
    }

    if (this.page_size < 1 || this.page_size > 100) {
      errors.push('Tamanho da página deve estar entre 1 e 100');
    }

    // Validação de ordenação
    const validOrderBy = [
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

    if (!validOrderBy.includes(this.order_by)) {
      errors.push('Campo de ordenação inválido');
    }

    if (!['ASC', 'DESC'].includes(this.order_direction)) {
      errors.push('Direção de ordenação deve ser ASC ou DESC');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Retorna o offset para paginação
   * @returns {number}
   */
  getOffset() {
    return (this.page - 1) * this.page_size;
  }

  /**
   * Retorna o limit para paginação
   * @returns {number}
   */
  getLimit() {
    return this.page_size;
  }

  /**
   * Converte para objeto com filtros aplicáveis
   * @returns {Object}
   */
  toObject() {
    return {
      unit_id: this.unit_id,
      search: this.search,
      category: this.category,
      category_id: this.category_id,
      brand: this.brand,
      supplier_id: this.supplier_id,
      stock_status: this.stock_status,
      is_active: this.is_active,
      min_price: this.min_price,
      max_price: this.max_price,
      location: this.location,
      page: this.page,
      page_size: this.page_size,
      order_by: this.order_by,
      order_direction: this.order_direction,
      offset: this.getOffset(),
      limit: this.getLimit(),
    };
  }
}

// ========================================
// EXPORTS
// ========================================

export default {
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponseDTO,
  ProductFiltersDTO,
  UNIT_OF_MEASURE,
  UNIT_LABELS,
  STOCK_STATUS,
  STOCK_STATUS_CONFIG,
};
