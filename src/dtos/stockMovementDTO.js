/**
 * DTOs (Data Transfer Objects) para Movimentações de Estoque
 *
 * Define contratos explícitos entre camadas:
 * - Front-end → Service (CreateStockMovementDTO)
 * - Service → Repository (dados validados)
 * - Repository → Front-end (StockMovementResponseDTO)
 *
 * @module dtos/stockMovementDTO
 * @see docs/Guia_estoque.md - Sprint 1.2
 */

/**
 * 🗺️ CONSTANTES DE ENUMS
 * ✅ Sincronizadas com PostgreSQL ENUMs criados no banco
 */

// Tipos de movimentação válidos
export const MOVEMENT_TYPES = ['ENTRADA', 'SAIDA'];

// Motivos de movimentação válidos
export const MOVEMENT_REASONS = [
  'COMPRA',
  'VENDA',
  'AJUSTE',
  'CONSUMO_INTERNO',
  'LIMPEZA',
  'DEVOLUCAO',
];

// Tipos de referência válidos
export const REFERENCE_TYPES = ['PURCHASE', 'REVENUE', 'SERVICE'];

/**
 * 🛡️ WHITELIST: COLUNAS PERMITIDAS NA TABELA STOCK_MOVEMENTS
 * ✅ BASEADO NO SCHEMA CRIADO (13/11/2025)
 *
 * Colunas AUTO_GENERATED (não enviar):
 * - id (UUID gerado automaticamente)
 * - created_at (timestamp NOW())
 * - updated_at (timestamp NOW())
 * - total_cost (GENERATED ALWAYS AS quantity * unit_cost)
 *
 * Colunas USER_INPUT (aceitas do front-end):
 */
export const ALLOWED_STOCK_MOVEMENT_COLUMNS = [
  // Obrigatórios
  'unit_id', // UUID
  'product_id', // UUID
  'movement_type', // movement_type_enum
  'reason', // movement_reason_enum
  'quantity', // INT (> 0)
  'unit_cost', // DECIMAL(10,2) (>= 0)
  'performed_by', // UUID

  // Opcionais
  'reference_id', // UUID (nullable)
  'reference_type', // reference_type_enum (nullable)
  'notes', // TEXT (nullable)
  'is_active', // BOOLEAN (default true)
];

/**
 * CreateStockMovementDTO
 * DTO para criar nova movimentação de estoque
 *
 * @class
 */
export class CreateStockMovementDTO {
  /**
   * @param {Object} data - Dados brutos do front-end
   * @param {string} data.unit_id - ID da unidade
   * @param {string} data.product_id - ID do produto
   * @param {string} data.movement_type - Tipo: ENTRADA ou SAIDA
   * @param {string} data.reason - Motivo da movimentação
   * @param {number} data.quantity - Quantidade (inteiro positivo)
   * @param {number} data.unit_cost - Custo unitário (>= 0)
   * @param {string} data.performed_by - ID do profissional responsável
   * @param {string} [data.reference_id] - ID de referência (opcional)
   * @param {string} [data.reference_type] - Tipo de referência (opcional)
   * @param {string} [data.notes] - Observações (opcional)
   */
  constructor(data) {
    this.unit_id = data.unit_id;
    this.product_id = data.product_id;
    this.movement_type = data.movement_type?.toUpperCase();
    this.reason = data.reason?.toUpperCase();
    this.quantity = parseInt(data.quantity, 10);
    this.unit_cost = parseFloat(data.unit_cost);
    this.performed_by = data.performed_by;
    this.reference_id = data.reference_id || null;
    this.reference_type = data.reference_type?.toUpperCase() || null;
    this.notes = data.notes || null;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
  }

  /**
   * Valida os dados do DTO
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // Validar UUIDs obrigatórios
    if (!this.unit_id || !this._isValidUUID(this.unit_id)) {
      errors.push('unit_id inválido ou ausente');
    }
    if (!this.product_id || !this._isValidUUID(this.product_id)) {
      errors.push('product_id inválido ou ausente');
    }
    if (!this.performed_by || !this._isValidUUID(this.performed_by)) {
      errors.push('performed_by inválido ou ausente');
    }

    // Validar movement_type
    if (!MOVEMENT_TYPES.includes(this.movement_type)) {
      errors.push(
        `movement_type deve ser ENTRADA ou SAIDA (recebido: ${this.movement_type})`
      );
    }

    // Validar reason
    if (!MOVEMENT_REASONS.includes(this.reason)) {
      errors.push(
        `reason inválido. Valores permitidos: ${MOVEMENT_REASONS.join(', ')}`
      );
    }

    // Validar quantity
    if (isNaN(this.quantity) || this.quantity <= 0) {
      errors.push('quantity deve ser maior que 0');
    }

    // Validar unit_cost
    if (isNaN(this.unit_cost) || this.unit_cost < 0) {
      errors.push('unit_cost deve ser maior ou igual a 0');
    }

    // Validar reference_type se reference_id estiver presente
    if (this.reference_id && !this._isValidUUID(this.reference_id)) {
      errors.push('reference_id inválido');
    }

    if (this.reference_id && !REFERENCE_TYPES.includes(this.reference_type)) {
      errors.push(
        `reference_type inválido. Valores permitidos: ${REFERENCE_TYPES.join(', ')}`
      );
    }

    // Se reference_type está presente, reference_id deve estar presente também
    if (this.reference_type && !this.reference_id) {
      errors.push('reference_id obrigatório quando reference_type é fornecido');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida UUID v4
   * @private
   */
  _isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Converte para objeto filtrado (apenas colunas permitidas)
   * @returns {Object}
   */
  toObject() {
    const obj = {};

    ALLOWED_STOCK_MOVEMENT_COLUMNS.forEach(column => {
      if (this[column] !== undefined && this[column] !== null) {
        obj[column] = this[column];
      }
    });

    return obj;
  }

  /**
   * Calcula custo total (quantity * unit_cost)
   * Nota: No banco isso é feito automaticamente via GENERATED ALWAYS AS
   * @returns {number}
   */
  getTotalCost() {
    return this.quantity * this.unit_cost;
  }
}

/**
 * UpdateStockMovementDTO
 * DTO para atualizar movimentação (apenas notes permitido)
 *
 * @class
 */
export class UpdateStockMovementDTO {
  /**
   * @param {Object} data - Dados brutos
   * @param {string} [data.notes] - Novas observações
   */
  constructor(data) {
    this.notes = data.notes || null;
  }

  /**
   * Valida os dados do DTO
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // Notes é opcional, mas se fornecido deve ser string
    if (this.notes !== null && typeof this.notes !== 'string') {
      errors.push('notes deve ser uma string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converte para objeto
   * @returns {Object}
   */
  toObject() {
    return {
      notes: this.notes,
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * StockMovementResponseDTO
 * DTO para resposta do banco → front-end
 *
 * @class
 */
export class StockMovementResponseDTO {
  /**
   * @param {Object} dbRow - Linha do banco de dados
   */
  constructor(dbRow) {
    this.id = dbRow.id;
    this.unit_id = dbRow.unit_id;
    this.product_id = dbRow.product_id;
    this.movement_type = dbRow.movement_type;
    this.reason = dbRow.reason;
    this.quantity = dbRow.quantity;
    this.unit_cost = parseFloat(dbRow.unit_cost);
    this.total_cost = parseFloat(dbRow.total_cost);
    this.reference_id = dbRow.reference_id;
    this.reference_type = dbRow.reference_type;
    this.performed_by = dbRow.performed_by;
    this.notes = dbRow.notes;
    this.is_active = dbRow.is_active;
    this.created_at = dbRow.created_at;
    this.updated_at = dbRow.updated_at;

    // Relações (se JOIN foi feito)
    this.product = dbRow.product || null;
    this.professional = dbRow.professional || null;
    this.unit = dbRow.unit || null;
  }

  /**
   * Converte para objeto simples
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      unit_id: this.unit_id,
      product_id: this.product_id,
      movement_type: this.movement_type,
      reason: this.reason,
      quantity: this.quantity,
      unit_cost: this.unit_cost,
      total_cost: this.total_cost,
      reference_id: this.reference_id,
      reference_type: this.reference_type,
      performed_by: this.performed_by,
      notes: this.notes,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,

      // Relações
      product: this.product,
      professional: this.professional,
      unit: this.unit,
    };
  }

  /**
   * Formata para exibição humana
   * @returns {Object}
   */
  toDisplay() {
    return {
      ...this.toObject(),
      // Mapear enums para português
      movement_type_display:
        this.movement_type === 'ENTRADA' ? 'Entrada' : 'Saída',
      reason_display: this._formatReason(this.reason),
      unit_cost_formatted: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(this.unit_cost),
      total_cost_formatted: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(this.total_cost),
      created_at_formatted: new Date(this.created_at).toLocaleString('pt-BR'),
    };
  }

  /**
   * Formata motivo para português
   * @private
   */
  _formatReason(reason) {
    const map = {
      COMPRA: 'Compra',
      VENDA: 'Venda',
      AJUSTE: 'Ajuste',
      CONSUMO_INTERNO: 'Consumo Interno',
      LIMPEZA: 'Limpeza',
      DEVOLUCAO: 'Devolução',
    };
    return map[reason] || reason;
  }
}

/**
 * StockMovementFiltersDTO
 * DTO para filtros de consulta
 *
 * @class
 */
export class StockMovementFiltersDTO {
  /**
   * @param {Object} filters - Filtros brutos
   * @param {string} [filters.unit_id] - Filtrar por unidade
   * @param {string} [filters.product_id] - Filtrar por produto
   * @param {string} [filters.movement_type] - Filtrar por tipo
   * @param {string} [filters.reason] - Filtrar por motivo
   * @param {string} [filters.performed_by] - Filtrar por profissional
   * @param {Date} [filters.start_date] - Data inicial
   * @param {Date} [filters.end_date] - Data final
   * @param {number} [filters.page] - Página (paginação)
   * @param {number} [filters.page_size] - Itens por página
   */
  constructor(filters = {}) {
    this.unit_id = filters.unit_id || null;
    this.product_id = filters.product_id || null;
    this.movement_type = filters.movement_type?.toUpperCase() || null;
    this.reason = filters.reason?.toUpperCase() || null;
    this.performed_by = filters.performed_by || null;
    this.start_date = filters.start_date || null;
    this.end_date = filters.end_date || null;
    this.page = parseInt(filters.page, 10) || 1;
    this.page_size = parseInt(filters.page_size, 10) || 20;
    this.is_active = filters.is_active !== undefined ? filters.is_active : true;
  }

  /**
   * Valida os filtros
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // Validar tipos de movimento
    if (this.movement_type && !MOVEMENT_TYPES.includes(this.movement_type)) {
      errors.push(`movement_type inválido: ${this.movement_type}`);
    }

    // Validar motivos
    if (this.reason && !MOVEMENT_REASONS.includes(this.reason)) {
      errors.push(`reason inválido: ${this.reason}`);
    }

    // Validar paginação
    if (this.page < 1) {
      errors.push('page deve ser >= 1');
    }

    if (this.page_size < 1 || this.page_size > 100) {
      errors.push('page_size deve estar entre 1 e 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converte para query do Supabase
   * @returns {Object}
   */
  toSupabaseQuery() {
    const query = {};

    if (this.unit_id) query.unit_id = this.unit_id;
    if (this.product_id) query.product_id = this.product_id;
    if (this.movement_type) query.movement_type = this.movement_type;
    if (this.reason) query.reason = this.reason;
    if (this.performed_by) query.performed_by = this.performed_by;
    if (this.is_active !== null) query.is_active = this.is_active;

    return query;
  }

  /**
   * Retorna offset para paginação
   * @returns {number}
   */
  getOffset() {
    return (this.page - 1) * this.page_size;
  }

  /**
   * Retorna limit para paginação
   * @returns {number}
   */
  getLimit() {
    return this.page_size;
  }
}
