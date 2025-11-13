/**
 * @fileoverview Supplier Data Transfer Objects (DTOs)
 * @module lib/dtos/supplierDTO
 * @description Validation and transformation layer for supplier data
 *
 * Architecture: Clean Architecture + DTO Pattern
 * - Input validation before reaching business logic
 * - Output transformation for consistent API responses
 * - CNPJ/CPF format validation (Brazilian documents)
 * - Email format validation
 * - Phone number normalization
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
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate CNPJ format (14 digits)
 * NOTE: Does NOT validate check digits (to be done in service layer)
 * @param {string} cnpj - CNPJ (numbers only)
 * @returns {boolean}
 */
function isValidCNPJFormat(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false;
  // Remove formatting
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14;
}

/**
 * Validate CPF format (11 digits)
 * NOTE: Does NOT validate check digits (to be done in service layer)
 * @param {string} cpf - CPF (numbers only)
 * @returns {boolean}
 */
function isValidCPFFormat(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;
  // Remove formatting
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
}

/**
 * Validate Brazilian state code (UF)
 * @param {string} state - State code (e.g., 'MG', 'SP')
 * @returns {boolean}
 */
function isValidStateCode(state) {
  if (!state || typeof state !== 'string') return false;
  const states = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];
  return states.includes(state.toUpperCase());
}

/**
 * Normalize phone number (remove formatting)
 * @param {string} phone - Phone number
 * @returns {string} Numbers only
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalize CNPJ/CPF (remove formatting)
 * @param {string} document - CNPJ or CPF
 * @returns {string} Numbers only
 */
function normalizeDocument(document) {
  if (!document) return '';
  return document.replace(/\D/g, '');
}

// ============================================================
// CREATE SUPPLIER DTO
// ============================================================

/**
 * CreateSupplierDTO - Validate supplier creation data
 * @class
 */
export class CreateSupplierDTO {
  constructor(data) {
    this.unit_id = data.unit_id;
    this.name = data.name?.trim();
    this.cnpj_cpf = normalizeDocument(data.cnpj_cpf);
    this.email = data.email?.trim().toLowerCase();
    this.phone = normalizePhone(data.phone);
    this.city = data.city?.trim();
    this.state = data.state?.trim().toUpperCase();
    this.zip_code = data.zip_code?.trim();
    this.address = data.address?.trim();
    this.status = data.status || 'ATIVO';
    this.payment_terms = data.payment_terms?.trim();
    this.notes = data.notes?.trim();

    this.errors = [];
  }

  /**
   * Validate all fields
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  validate() {
    this.errors = [];

    // Required: unit_id
    if (!this.unit_id || !isValidUUID(this.unit_id)) {
      this.errors.push('unit_id é obrigatório e deve ser um UUID válido');
    }

    // Required: name (min 2 chars)
    if (!this.name || this.name.length < 2) {
      this.errors.push('Nome deve ter no mínimo 2 caracteres');
    }

    // Optional but validated: cnpj_cpf
    if (this.cnpj_cpf && this.cnpj_cpf.length > 0) {
      const isValidCNPJ = isValidCNPJFormat(this.cnpj_cpf);
      const isValidCPF = isValidCPFFormat(this.cnpj_cpf);

      if (!isValidCNPJ && !isValidCPF) {
        this.errors.push('CNPJ/CPF inválido (deve ter 11 ou 14 dígitos)');
      }
    }

    // Optional but validated: email
    if (this.email && this.email.length > 0 && !isValidEmail(this.email)) {
      this.errors.push('E-mail inválido');
    }

    // Optional but validated: phone (10-11 digits)
    if (
      this.phone &&
      this.phone.length > 0 &&
      (this.phone.length < 10 || this.phone.length > 11)
    ) {
      this.errors.push('Telefone inválido (deve ter 10 ou 11 dígitos)');
    }

    // Optional but validated: state (2 chars UF)
    if (this.state && !isValidStateCode(this.state)) {
      this.errors.push('Estado inválido (use sigla UF: MG, SP, etc.)');
    }

    // Validate status
    const validStatuses = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
    if (!validStatuses.includes(this.status)) {
      this.errors.push('Status inválido (ATIVO, INATIVO ou BLOQUEADO)');
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * Convert to database-ready object
   * @returns {Object}
   */
  toObject() {
    return {
      unit_id: this.unit_id,
      name: this.name,
      cnpj_cpf: this.cnpj_cpf || null,
      email: this.email || null,
      phone: this.phone || null,
      city: this.city || null,
      state: this.state || null,
      zip_code: this.zip_code || null,
      address: this.address || null,
      status: this.status,
      payment_terms: this.payment_terms || null,
      notes: this.notes || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

// ============================================================
// UPDATE SUPPLIER DTO
// ============================================================

/**
 * UpdateSupplierDTO - Validate supplier update data
 * @class
 */
export class UpdateSupplierDTO {
  constructor(data) {
    // Allow partial updates (undefined = don't update)
    this.name = data.name !== undefined ? data.name?.trim() : undefined;
    this.cnpj_cpf =
      data.cnpj_cpf !== undefined
        ? normalizeDocument(data.cnpj_cpf)
        : undefined;
    this.email =
      data.email !== undefined ? data.email?.trim().toLowerCase() : undefined;
    this.phone =
      data.phone !== undefined ? normalizePhone(data.phone) : undefined;
    this.city = data.city !== undefined ? data.city?.trim() : undefined;
    this.state =
      data.state !== undefined ? data.state?.trim().toUpperCase() : undefined;
    this.zip_code =
      data.zip_code !== undefined ? data.zip_code?.trim() : undefined;
    this.address =
      data.address !== undefined ? data.address?.trim() : undefined;
    this.status = data.status !== undefined ? data.status : undefined;
    this.payment_terms =
      data.payment_terms !== undefined ? data.payment_terms?.trim() : undefined;
    this.notes = data.notes !== undefined ? data.notes?.trim() : undefined;

    this.errors = [];
  }

  /**
   * Validate provided fields
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  validate() {
    this.errors = [];

    // Validate name (if provided)
    if (this.name !== undefined && this.name.length < 2) {
      this.errors.push('Nome deve ter no mínimo 2 caracteres');
    }

    // Validate cnpj_cpf (if provided)
    if (
      this.cnpj_cpf !== undefined &&
      this.cnpj_cpf &&
      this.cnpj_cpf.length > 0
    ) {
      const isValidCNPJ = isValidCNPJFormat(this.cnpj_cpf);
      const isValidCPF = isValidCPFFormat(this.cnpj_cpf);

      if (!isValidCNPJ && !isValidCPF) {
        this.errors.push('CNPJ/CPF inválido (deve ter 11 ou 14 dígitos)');
      }
    }

    // Validate email (if provided)
    if (
      this.email !== undefined &&
      this.email &&
      this.email.length > 0 &&
      !isValidEmail(this.email)
    ) {
      this.errors.push('E-mail inválido');
    }

    // Validate phone (if provided)
    if (
      this.phone !== undefined &&
      this.phone &&
      this.phone.length > 0 &&
      (this.phone.length < 10 || this.phone.length > 11)
    ) {
      this.errors.push('Telefone inválido (deve ter 10 ou 11 dígitos)');
    }

    // Validate state (if provided)
    if (
      this.state !== undefined &&
      this.state &&
      !isValidStateCode(this.state)
    ) {
      this.errors.push('Estado inválido (use sigla UF: MG, SP, etc.)');
    }

    // Validate status (if provided)
    if (this.status !== undefined) {
      const validStatuses = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
      if (!validStatuses.includes(this.status)) {
        this.errors.push('Status inválido (ATIVO, INATIVO ou BLOQUEADO)');
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * Convert to update-ready object (only defined fields)
   * @returns {Object}
   */
  toObject() {
    const obj = {
      updated_at: new Date().toISOString(),
    };

    // Only include defined fields
    if (this.name !== undefined) obj.name = this.name;
    if (this.cnpj_cpf !== undefined) obj.cnpj_cpf = this.cnpj_cpf || null;
    if (this.email !== undefined) obj.email = this.email || null;
    if (this.phone !== undefined) obj.phone = this.phone || null;
    if (this.city !== undefined) obj.city = this.city || null;
    if (this.state !== undefined) obj.state = this.state || null;
    if (this.zip_code !== undefined) obj.zip_code = this.zip_code || null;
    if (this.address !== undefined) obj.address = this.address || null;
    if (this.status !== undefined) obj.status = this.status;
    if (this.payment_terms !== undefined)
      obj.payment_terms = this.payment_terms || null;
    if (this.notes !== undefined) obj.notes = this.notes || null;

    return obj;
  }
}

// ============================================================
// SUPPLIER RESPONSE DTO
// ============================================================

/**
 * SupplierResponseDTO - Format supplier data for frontend
 * @class
 */
export class SupplierResponseDTO {
  constructor(data) {
    this.id = data.id;
    this.unit_id = data.unit_id;
    this.unit_name = data.unit?.name || null;
    this.name = data.name;
    this.cnpj_cpf = data.cnpj_cpf;
    this.cnpj_cpf_formatted = this.formatDocument(data.cnpj_cpf);
    this.email = data.email;
    this.phone = data.phone;
    this.phone_formatted = this.formatPhone(data.phone);
    this.city = data.city;
    this.state = data.state;
    this.zip_code = data.zip_code;
    this.address = data.address;
    this.full_address = this.buildFullAddress(data);
    this.status = data.status;
    this.status_label = this.getStatusLabel(data.status);
    this.payment_terms = data.payment_terms;
    this.notes = data.notes;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    // Include contacts if present
    this.contacts = data.contacts
      ? data.contacts
          .filter(c => c.is_active)
          .map(c => ({
            id: c.id,
            contact_name: c.contact_name,
            phone: c.phone,
            email: c.email,
            role: c.role,
            is_primary: c.is_primary,
          }))
      : [];

    // Include files if present
    this.files = data.files
      ? data.files
          .filter(f => f.is_active)
          .map(f => ({
            id: f.id,
            file_name: f.file_name,
            file_type: f.file_type,
            file_size: f.file_size,
            file_size_formatted: this.formatFileSize(f.file_size),
            uploaded_at: f.uploaded_at,
          }))
      : [];
  }

  /**
   * Format CNPJ/CPF for display
   * @param {string} document - CNPJ or CPF (numbers only)
   * @returns {string} Formatted document
   */
  formatDocument(document) {
    if (!document) return '';

    const cleaned = document.replace(/\D/g, '');

    // CNPJ: XX.XXX.XXX/XXXX-XX
    if (cleaned.length === 14) {
      return cleaned.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      );
    }

    // CPF: XXX.XXX.XXX-XX
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }

    return document;
  }

  /**
   * Format phone for display
   * @param {string} phone - Phone (numbers only)
   * @returns {string} Formatted phone
   */
  formatPhone(phone) {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    // Celular: (XX) 9XXXX-XXXX
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }

    // Fixo: (XX) XXXX-XXXX
    if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    }

    return phone;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size (KB, MB)
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 KB';

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  /**
   * Build full address string
   * @param {Object} data - Supplier data
   * @returns {string} Full address
   */
  buildFullAddress(data) {
    const parts = [];
    if (data.address) parts.push(data.address);
    if (data.city) parts.push(data.city);
    if (data.state) parts.push(data.state);
    if (data.zip_code) parts.push(`CEP: ${data.zip_code}`);
    return parts.join(', ');
  }

  /**
   * Get status label in Portuguese
   * @param {string} status - Status enum
   * @returns {string} Portuguese label
   */
  getStatusLabel(status) {
    const labels = {
      ATIVO: 'Ativo',
      INATIVO: 'Inativo',
      BLOQUEADO: 'Bloqueado',
    };
    return labels[status] || status;
  }
}

// ============================================================
// SUPPLIER FILTERS DTO
// ============================================================

/**
 * SupplierFiltersDTO - Validate and normalize filters
 * @class
 */
export class SupplierFiltersDTO {
  constructor(data = {}) {
    this.status = data.status;
    this.search = data.search?.trim();
    this.offset = data.offset !== undefined ? parseInt(data.offset) : 0;
    this.limit = data.limit !== undefined ? parseInt(data.limit) : 50;

    this.errors = [];
  }

  /**
   * Validate filters
   * @returns {{isValid: boolean, errors: Array<string>}}
   */
  validate() {
    this.errors = [];

    // Validate status (if provided)
    if (this.status) {
      const validStatuses = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
      if (!validStatuses.includes(this.status)) {
        this.errors.push('Status inválido (ATIVO, INATIVO ou BLOQUEADO)');
      }
    }

    // Validate offset
    if (this.offset < 0) {
      this.errors.push('offset não pode ser negativo');
    }

    // Validate limit (1-100)
    if (this.limit < 1 || this.limit > 100) {
      this.errors.push('limit deve estar entre 1 e 100');
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * Convert to query-ready object
   * @returns {Object}
   */
  toObject() {
    const obj = {
      offset: this.offset,
      limit: this.limit,
    };

    if (this.status) obj.status = this.status;
    if (this.search) obj.search = this.search;

    return obj;
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
  SupplierFiltersDTO,
};
