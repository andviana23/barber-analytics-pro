/**
 * @fileoverview Purchase Request Data Transfer Objects (DTOs)
 * @module lib/dtos/purchaseRequestDTO
 * @description Validation and transformation layer for purchase request data
 *
 * Architecture: Clean Architecture + DTO Pattern
 * - Input validation before reaching business logic
 * - Output transformation for consistent API responses
 * - Support for purchase request workflow (DRAFT → SUBMITTED → APPROVED/REJECTED)
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

/**
 * Validate UUID v4 format
 * @param {string} uuid - UUID to validate
 * @returns {boolean}
 */
function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate purchase request status
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
function isValidStatus(status) {
  const validStatuses = [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
  ];
  return validStatuses.includes(status);
}

/**
 * Validate priority level
 * @param {string} priority - Priority to validate
 * @returns {boolean}
 */
function isValidPriority(priority) {
  const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
  return validPriorities.includes(priority);
}

/**
 * DTO for creating a new purchase request
 * Validates all required fields and business rules
 */
export class CreatePurchaseRequestDTO {
  constructor(data) {
    this.unit_id = data.unit_id;
    this.requested_by = data.requested_by;
    this.justification = data.justification || null;
    this.notes = data.notes || null;
    this.priority = data.priority || 'NORMAL';
    this.items = data.items || [];
  }

  /**
   * Validate DTO data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // unit_id validation
    if (!this.unit_id) {
      errors.push('unit_id é obrigatório');
    } else if (!isValidUUID(this.unit_id)) {
      errors.push('unit_id deve ser um UUID válido');
    }

    // requested_by validation
    if (!this.requested_by) {
      errors.push('requested_by é obrigatório');
    } else if (!isValidUUID(this.requested_by)) {
      errors.push('requested_by deve ser um UUID válido');
    }

    // priority validation
    if (this.priority && !isValidPriority(this.priority)) {
      errors.push('priority deve ser LOW, NORMAL, HIGH ou URGENT');
    }

    // justification validation
    if (this.justification && typeof this.justification !== 'string') {
      errors.push('justification deve ser uma string');
    }

    // notes validation
    if (this.notes && typeof this.notes !== 'string') {
      errors.push('notes deve ser uma string');
    }

    // items validation
    if (!Array.isArray(this.items) || this.items.length === 0) {
      errors.push('items deve ser um array não vazio');
    } else {
      this.items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push(`items[${index}].product_id é obrigatório`);
        } else if (!isValidUUID(item.product_id)) {
          errors.push(`items[${index}].product_id deve ser um UUID válido`);
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push(`items[${index}].quantity deve ser maior que zero`);
        }

        if (
          !item.unit_measurement ||
          typeof item.unit_measurement !== 'string'
        ) {
          errors.push(`items[${index}].unit_measurement é obrigatório`);
        }

        if (
          item.estimated_unit_cost !== undefined &&
          item.estimated_unit_cost < 0
        ) {
          errors.push(
            `items[${index}].estimated_unit_cost não pode ser negativo`
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database object
   * @returns {Object}
   */
  toObject() {
    return {
      unit_id: this.unit_id,
      requested_by: this.requested_by,
      justification: this.justification,
      notes: this.notes,
      priority: this.priority,
      status: 'DRAFT',
      is_active: true,
    };
  }

  /**
   * Get items for insertion
   * @returns {Array}
   */
  getItems() {
    return this.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_measurement: item.unit_measurement,
      estimated_unit_cost: item.estimated_unit_cost || null,
      notes: item.notes || null,
      is_active: true,
    }));
  }
}

/**
 * DTO for updating an existing purchase request
 * Only allows updating specific fields in DRAFT status
 */
export class UpdatePurchaseRequestDTO {
  constructor(data) {
    this.justification = data.justification;
    this.notes = data.notes;
    this.priority = data.priority;
  }

  /**
   * Validate DTO data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // priority validation
    if (this.priority !== undefined && !isValidPriority(this.priority)) {
      errors.push('priority deve ser LOW, NORMAL, HIGH ou URGENT');
    }

    // justification validation
    if (
      this.justification !== undefined &&
      typeof this.justification !== 'string'
    ) {
      errors.push('justification deve ser uma string');
    }

    // notes validation
    if (this.notes !== undefined && typeof this.notes !== 'string') {
      errors.push('notes deve ser uma string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database object (only changed fields)
   * @returns {Object}
   */
  toObject() {
    const obj = {};

    if (this.justification !== undefined)
      obj.justification = this.justification;
    if (this.notes !== undefined) obj.notes = this.notes;
    if (this.priority !== undefined) obj.priority = this.priority;

    return obj;
  }
}

/**
 * DTO for purchase request response
 * Formats data for frontend consumption
 */
export class PurchaseRequestResponseDTO {
  constructor(data) {
    this.id = data.id;
    this.request_number = data.request_number;
    this.unit_id = data.unit_id;
    this.unit_name = data.unit?.name || data.unit_name || null;
    this.requested_by = data.requested_by;
    this.requester_name =
      data.professionals?.name || data.requester_name || null;
    this.approved_by = data.approved_by || null;
    this.approver_name = data.approver?.name || data.approver_name || null;
    this.rejected_by = data.rejected_by || null;
    this.status = data.status;
    this.priority = data.priority || 'NORMAL';
    this.total_estimated = data.total_estimated || 0;
    this.justification = data.justification || null;
    this.notes = data.notes || null;
    this.approved_at = data.approved_at || null;
    this.rejected_at = data.rejected_at || null;
    this.rejection_reason = data.rejection_reason || null;
    this.items = data.items || [];
    this.items_count = data.items?.length || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Format status for display
   * @returns {string}
   */
  getStatusLabel() {
    const labels = {
      DRAFT: 'Rascunho',
      SUBMITTED: 'Aguardando Aprovação',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      CANCELLED: 'Cancelado',
    };
    return labels[this.status] || this.status;
  }

  /**
   * Format priority for display
   * @returns {string}
   */
  getPriorityLabel() {
    const labels = {
      LOW: 'Baixa',
      NORMAL: 'Normal',
      HIGH: 'Alta',
      URGENT: 'Urgente',
    };
    return labels[this.priority] || this.priority;
  }

  /**
   * Get status color for UI
   * @returns {string}
   */
  getStatusColor() {
    const colors = {
      DRAFT: 'gray',
      SUBMITTED: 'blue',
      APPROVED: 'green',
      REJECTED: 'red',
      CANCELLED: 'gray',
    };
    return colors[this.status] || 'gray';
  }

  /**
   * Get priority color for UI
   * @returns {string}
   */
  getPriorityColor() {
    const colors = {
      LOW: 'green',
      NORMAL: 'blue',
      HIGH: 'orange',
      URGENT: 'red',
    };
    return colors[this.priority] || 'blue';
  }

  /**
   * Format currency values
   * @returns {string}
   */
  getFormattedTotal() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.total_estimated);
  }

  /**
   * Check if request can be edited
   * @returns {boolean}
   */
  canEdit() {
    return this.status === 'DRAFT';
  }

  /**
   * Check if request can be submitted
   * @returns {boolean}
   */
  canSubmit() {
    return this.status === 'DRAFT' && this.items_count > 0;
  }

  /**
   * Check if request can be approved/rejected
   * @returns {boolean}
   */
  canApprove() {
    return this.status === 'SUBMITTED';
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      request_number: this.request_number,
      unit_id: this.unit_id,
      unit_name: this.unit_name,
      requested_by: this.requested_by,
      requester_name: this.requester_name,
      approved_by: this.approved_by,
      approver_name: this.approver_name,
      rejected_by: this.rejected_by,
      status: this.status,
      status_label: this.getStatusLabel(),
      status_color: this.getStatusColor(),
      priority: this.priority,
      priority_label: this.getPriorityLabel(),
      priority_color: this.getPriorityColor(),
      total_estimated: this.total_estimated,
      total_formatted: this.getFormattedTotal(),
      justification: this.justification,
      notes: this.notes,
      approved_at: this.approved_at,
      rejected_at: this.rejected_at,
      rejection_reason: this.rejection_reason,
      items: this.items,
      items_count: this.items_count,
      can_edit: this.canEdit(),
      can_submit: this.canSubmit(),
      can_approve: this.canApprove(),
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

/**
 * DTO for creating a purchase quote
 */
export class CreatePurchaseQuoteDTO {
  constructor(data) {
    this.request_id = data.request_id;
    this.supplier_id = data.supplier_id;
    this.quoted_by = data.quoted_by;
    this.delivery_days = data.delivery_days || null;
    this.payment_terms = data.payment_terms || null;
    this.notes = data.notes || null;
    this.attachment_url = data.attachment_url || null;
    this.items = data.items || [];
  }

  /**
   * Validate DTO data
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    // request_id validation
    if (!this.request_id) {
      errors.push('request_id é obrigatório');
    } else if (!isValidUUID(this.request_id)) {
      errors.push('request_id deve ser um UUID válido');
    }

    // supplier_id validation
    if (!this.supplier_id) {
      errors.push('supplier_id é obrigatório');
    } else if (!isValidUUID(this.supplier_id)) {
      errors.push('supplier_id deve ser um UUID válido');
    }

    // quoted_by validation
    if (!this.quoted_by) {
      errors.push('quoted_by é obrigatório');
    } else if (!isValidUUID(this.quoted_by)) {
      errors.push('quoted_by deve ser um UUID válido');
    }

    // delivery_days validation
    if (
      this.delivery_days !== null &&
      (this.delivery_days < 0 || !Number.isInteger(this.delivery_days))
    ) {
      errors.push('delivery_days deve ser um número inteiro não negativo');
    }

    // items validation
    if (!Array.isArray(this.items) || this.items.length === 0) {
      errors.push('items deve ser um array não vazio');
    } else {
      this.items.forEach((item, index) => {
        if (!item.product_id) {
          errors.push(`items[${index}].product_id é obrigatório`);
        } else if (!isValidUUID(item.product_id)) {
          errors.push(`items[${index}].product_id deve ser um UUID válido`);
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push(`items[${index}].quantity deve ser maior que zero`);
        }

        if (item.unit_cost === undefined || item.unit_cost < 0) {
          errors.push(
            `items[${index}].unit_cost é obrigatório e não pode ser negativo`
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to database object
   * @returns {Object}
   */
  toObject() {
    return {
      request_id: this.request_id,
      supplier_id: this.supplier_id,
      quoted_by: this.quoted_by,
      delivery_days: this.delivery_days,
      payment_terms: this.payment_terms,
      notes: this.notes,
      attachment_url: this.attachment_url,
      is_selected: false,
      is_active: true,
    };
  }

  /**
   * Get items for insertion
   * @returns {Array}
   */
  getItems() {
    return this.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      is_active: true,
    }));
  }
}

/**
 * DTO for purchase quote response
 */
export class PurchaseQuoteResponseDTO {
  constructor(data) {
    this.id = data.id;
    this.quote_number = data.quote_number;
    this.request_id = data.request_id;
    this.supplier_id = data.supplier_id;
    this.supplier_name = data.supplier?.name || data.supplier_name || null;
    this.quoted_by = data.quoted_by;
    this.total_price = data.total_price || 0;
    this.delivery_days = data.delivery_days || null;
    this.payment_terms = data.payment_terms || null;
    this.notes = data.notes || null;
    this.attachment_url = data.attachment_url || null;
    this.is_selected = data.is_selected || false;
    this.selected_at = data.selected_at || null;
    this.selected_by = data.selected_by || null;
    this.selection_reason = data.selection_reason || null;
    this.items = data.items || [];
    this.items_count = data.items?.length || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Format currency values
   * @returns {string}
   */
  getFormattedTotal() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.total_price);
  }

  /**
   * Get delivery time label
   * @returns {string}
   */
  getDeliveryLabel() {
    if (!this.delivery_days) return 'Não informado';
    return `${this.delivery_days} ${this.delivery_days === 1 ? 'dia' : 'dias'}`;
  }

  /**
   * Check if quote can be selected
   * @returns {boolean}
   */
  canSelect() {
    return !this.is_selected;
  }

  /**
   * Convert to plain object
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      quote_number: this.quote_number,
      request_id: this.request_id,
      supplier_id: this.supplier_id,
      supplier_name: this.supplier_name,
      quoted_by: this.quoted_by,
      total_price: this.total_price,
      total_formatted: this.getFormattedTotal(),
      delivery_days: this.delivery_days,
      delivery_label: this.getDeliveryLabel(),
      payment_terms: this.payment_terms,
      notes: this.notes,
      attachment_url: this.attachment_url,
      is_selected: this.is_selected,
      selected_at: this.selected_at,
      selected_by: this.selected_by,
      selection_reason: this.selection_reason,
      items: this.items,
      items_count: this.items_count,
      can_select: this.canSelect(),
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

/**
 * DTO for filters
 */
export class PurchaseRequestFiltersDTO {
  constructor(data = {}) {
    this.unit_id = data.unit_id || null;
    this.status = data.status || null;
    this.priority = data.priority || null;
    this.requested_by = data.requested_by || null;
    this.start_date = data.start_date || null;
    this.end_date = data.end_date || null;
    this.search = data.search || null;
    this.page = data.page || 1;
    this.page_size = data.page_size || 20;
  }

  /**
   * Validate filters
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (this.unit_id && !isValidUUID(this.unit_id)) {
      errors.push('unit_id deve ser um UUID válido');
    }

    if (this.status && !isValidStatus(this.status)) {
      errors.push('status inválido');
    }

    if (this.priority && !isValidPriority(this.priority)) {
      errors.push('priority inválida');
    }

    if (this.requested_by && !isValidUUID(this.requested_by)) {
      errors.push('requested_by deve ser um UUID válido');
    }

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
   * Get offset for pagination
   * @returns {number}
   */
  getOffset() {
    return (this.page - 1) * this.page_size;
  }

  /**
   * Get limit for pagination
   * @returns {number}
   */
  getLimit() {
    return this.page_size;
  }
}
