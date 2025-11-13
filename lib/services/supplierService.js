/**
 * @fileoverview Supplier Service - Business Logic Layer
 * @module lib/services/supplierService
 * @description Handles supplier CRUD operations, validation, and business rules
 *
 * Architecture: Clean Architecture + Service Layer Pattern
 * - Validates data using DTOs before repository calls
 * - Checks permissions (only gerente/admin can manage suppliers)
 * - Validates CNPJ/CPF check digits
 * - Checks for duplicates before create/update
 * - Manages status workflow (ATIVO ↔ INATIVO ↔ BLOQUEADO)
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

import { supplierRepository } from '../repositories/supplierRepository.js';
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponseDTO,
  SupplierFiltersDTO,
} from '../dtos/supplierDTO.js';

// ============================================================
// PERMISSION CHECKS
// ============================================================

/**
 * Check if user can manage suppliers
 * Only gerente and admin roles allowed
 * @param {Object} user - User object
 * @returns {boolean}
 */
function canManageSuppliers(user) {
  if (!user || !user.role) return false;
  const allowedRoles = ['gerente', 'admin', 'administrador'];
  return allowedRoles.includes(user.role.toLowerCase());
}

// ============================================================
// CNPJ VALIDATION
// ============================================================

/**
 * Validate CNPJ check digits
 * Algorithm: MOD 11 with specific weights
 * @param {string} cnpj - CNPJ (14 digits, numbers only)
 * @returns {boolean}
 */
function validateCNPJ(cnpj) {
  if (!cnpj || typeof cnpj !== 'string') return false;

  // Remove formatting
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;

  // All same digits = invalid
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Calculate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  // Calculate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  // Verify
  return (
    parseInt(cleaned[12]) === checkDigit1 &&
    parseInt(cleaned[13]) === checkDigit2
  );
}

// ============================================================
// CPF VALIDATION
// ============================================================

/**
 * Validate CPF check digits
 * Algorithm: MOD 11 with sequential weights
 * @param {string} cpf - CPF (11 digits, numbers only)
 * @returns {boolean}
 */
function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;

  // Remove formatting
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // All same digits = invalid
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let checkDigit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  let checkDigit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  // Verify
  return (
    parseInt(cleaned[9]) === checkDigit1 &&
    parseInt(cleaned[10]) === checkDigit2
  );
}

/**
 * Validate CNPJ or CPF
 * @param {string} document - CNPJ or CPF
 * @returns {{isValid: boolean, error: string|null}}
 */
function validateDocument(document) {
  if (!document) return { isValid: true, error: null }; // Optional field

  const cleaned = document.replace(/\D/g, '');

  if (cleaned.length === 14) {
    const isValid = validateCNPJ(cleaned);
    return {
      isValid,
      error: isValid
        ? null
        : 'CNPJ inválido (dígitos verificadores incorretos)',
    };
  }

  if (cleaned.length === 11) {
    const isValid = validateCPF(cleaned);
    return {
      isValid,
      error: isValid ? null : 'CPF inválido (dígitos verificadores incorretos)',
    };
  }

  return {
    isValid: false,
    error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos',
  };
}

// ============================================================
// SUPPLIER CRUD
// ============================================================

/**
 * Create new supplier
 * @param {Object} data - Supplier data
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createSupplier(data, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate with DTO
  const dto = new CreateSupplierDTO(data);
  const validation = dto.validate();
  if (!validation.isValid) {
    return { data: null, error: validation.errors.join(', ') };
  }

  // 3. Validate CNPJ/CPF check digits (if provided)
  if (dto.cnpj_cpf) {
    const docValidation = validateDocument(dto.cnpj_cpf);
    if (!docValidation.isValid) {
      return { data: null, error: docValidation.error };
    }

    // 4. Check for duplicates
    const { data: existing } = await supplierRepository.findByCNPJ(
      dto.cnpj_cpf,
      dto.unit_id
    );

    if (existing) {
      return {
        data: null,
        error: `Fornecedor já existe com este CNPJ/CPF: ${existing.name}`,
      };
    }
  }

  // 5. Create in repository
  const result = await supplierRepository.create(dto.toObject());

  // 6. Format response
  if (result.data) {
    return {
      data: new SupplierResponseDTO(result.data),
      error: null,
    };
  }

  return result;
}

/**
 * Update supplier
 * @param {string} id - Supplier ID
 * @param {Object} data - Update data
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateSupplier(id, data, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate with DTO
  const dto = new UpdateSupplierDTO(data);
  const validation = dto.validate();
  if (!validation.isValid) {
    return { data: null, error: validation.errors.join(', ') };
  }

  // 3. Validate CNPJ/CPF check digits (if being updated)
  if (dto.cnpj_cpf !== undefined && dto.cnpj_cpf) {
    const docValidation = validateDocument(dto.cnpj_cpf);
    if (!docValidation.isValid) {
      return { data: null, error: docValidation.error };
    }

    // 4. Check for duplicates (excluding current supplier)
    const { data: currentSupplier } = await supplierRepository.findById(id);
    if (!currentSupplier) {
      return { data: null, error: 'Fornecedor não encontrado' };
    }

    const { data: existing } = await supplierRepository.findByCNPJ(
      dto.cnpj_cpf,
      currentSupplier.unit_id,
      id // Exclude current supplier from check
    );

    if (existing) {
      return {
        data: null,
        error: `CNPJ/CPF já existe em outro fornecedor: ${existing.name}`,
      };
    }
  }

  // 5. Update in repository
  const result = await supplierRepository.update(id, dto.toObject());

  // 6. Format response
  if (result.data) {
    return {
      data: new SupplierResponseDTO(result.data),
      error: null,
    };
  }

  return result;
}

/**
 * Delete supplier (soft delete)
 * @param {string} id - Supplier ID
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function deleteSupplier(id, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Delete (soft delete)
  const result = await supplierRepository.delete(id);

  // 3. Format response
  if (result.data) {
    return {
      data: new SupplierResponseDTO(result.data),
      error: null,
    };
  }

  return result;
}

/**
 * Get supplier by ID
 * @param {string} id - Supplier ID
 * @param {string} unitId - Unit ID (for RLS filtering)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getSupplier(id, unitId) {
  const result = await supplierRepository.findById(id);

  // Verify unit_id matches (RLS should handle this, but double-check)
  if (result.data && result.data.unit_id !== unitId) {
    return { data: null, error: 'Fornecedor não encontrado' };
  }

  // Format response
  if (result.data) {
    return {
      data: new SupplierResponseDTO(result.data),
      error: null,
    };
  }

  return result;
}

/**
 * List suppliers with filters
 * @param {string} unitId - Unit ID
 * @param {Object} filters - Filters (status, search, pagination)
 * @returns {Promise<{data: Array|null, error: string|null, totalCount: number}>}
 */
export async function listSuppliers(unitId, filters = {}) {
  // 1. Validate filters with DTO
  const dto = new SupplierFiltersDTO(filters);
  const validation = dto.validate();
  if (!validation.isValid) {
    return { data: null, error: validation.errors.join(', '), totalCount: 0 };
  }

  // 2. Get from repository
  const result = await supplierRepository.findByUnit(unitId, dto.toObject());

  // 3. Format response
  if (result.data) {
    return {
      data: result.data.map(s => new SupplierResponseDTO(s)),
      error: null,
      totalCount: result.totalCount,
    };
  }

  return result;
}

/**
 * Get active suppliers for dropdowns
 * @param {string} unitId - Unit ID
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getActiveSuppliers(unitId) {
  const result = await supplierRepository.findActiveByUnit(unitId);

  if (result.data) {
    return {
      data: result.data.map(s => ({
        id: s.id,
        name: s.name,
        cnpj_cpf: s.cnpj_cpf,
      })),
      error: null,
    };
  }

  return result;
}

// ============================================================
// STATUS MANAGEMENT
// ============================================================

/**
 * Change supplier status
 * @param {string} id - Supplier ID
 * @param {string} newStatus - New status (ATIVO, INATIVO, BLOQUEADO)
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function changeStatus(id, newStatus, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate status
  const validStatuses = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
  if (!validStatuses.includes(newStatus)) {
    return { data: null, error: 'Status inválido' };
  }

  // 3. Get current supplier
  const { data: supplier } = await supplierRepository.findById(id);
  if (!supplier) {
    return { data: null, error: 'Fornecedor não encontrado' };
  }

  // 4. No change needed
  if (supplier.status === newStatus) {
    return { data: new SupplierResponseDTO(supplier), error: null };
  }

  // 5. Update status
  const result = await supplierRepository.update(id, { status: newStatus });

  // 6. Format response
  if (result.data) {
    return {
      data: new SupplierResponseDTO(result.data),
      error: null,
    };
  }

  return result;
}

// ============================================================
// CONTACT MANAGEMENT
// ============================================================

/**
 * Add contact to supplier
 * @param {string} supplierId - Supplier ID
 * @param {Object} contactData - Contact data
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addContact(supplierId, contactData, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate required fields
  if (!contactData.contact_name || contactData.contact_name.trim().length < 2) {
    return {
      data: null,
      error: 'Nome do contato deve ter no mínimo 2 caracteres',
    };
  }

  // 3. Verify supplier exists
  const { data: supplier } = await supplierRepository.findById(supplierId);
  if (!supplier) {
    return { data: null, error: 'Fornecedor não encontrado' };
  }

  // 4. Create contact
  const result = await supplierRepository.addContact({
    supplier_id: supplierId,
    contact_name: contactData.contact_name.trim(),
    phone: contactData.phone?.trim() || null,
    email: contactData.email?.trim().toLowerCase() || null,
    role: contactData.role?.trim() || null,
    is_primary: contactData.is_primary || false,
  });

  return result;
}

/**
 * Update contact
 * @param {string} contactId - Contact ID
 * @param {Object} updateData - Update data
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateContact(contactId, updateData, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate if name is being updated
  if (updateData.contact_name && updateData.contact_name.trim().length < 2) {
    return {
      data: null,
      error: 'Nome do contato deve ter no mínimo 2 caracteres',
    };
  }

  // 3. Update contact
  const result = await supplierRepository.updateContact(contactId, updateData);

  return result;
}

/**
 * Delete contact (soft delete)
 * @param {string} contactId - Contact ID
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function deleteContact(contactId, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Delete contact
  const result = await supplierRepository.deleteContact(contactId);

  return result;
}

// ============================================================
// FILE MANAGEMENT
// ============================================================

/**
 * Add file reference to supplier
 * NOTE: File should be uploaded to Supabase Storage BEFORE calling this
 * @param {string} supplierId - Supplier ID
 * @param {Object} fileData - File metadata
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function addFile(supplierId, fileData, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Validate required fields
  if (!fileData.file_name || !fileData.file_path) {
    return { data: null, error: 'Nome e caminho do arquivo são obrigatórios' };
  }

  // 3. Verify supplier exists
  const { data: supplier } = await supplierRepository.findById(supplierId);
  if (!supplier) {
    return { data: null, error: 'Fornecedor não encontrado' };
  }

  // 4. Add file reference
  const result = await supplierRepository.addFile({
    supplier_id: supplierId,
    file_name: fileData.file_name,
    file_path: fileData.file_path,
    file_type: fileData.file_type || null,
    file_size: fileData.file_size || null,
    uploaded_by: user.id,
  });

  return result;
}

/**
 * Delete file reference (soft delete)
 * NOTE: Does NOT delete from Supabase Storage
 * @param {string} fileId - File ID
 * @param {Object} user - User performing action
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function deleteFile(fileId, user) {
  // 1. Permission check
  if (!canManageSuppliers(user)) {
    return { data: null, error: 'Sem permissão para gerenciar fornecedores' };
  }

  // 2. Delete file reference
  const result = await supplierRepository.deleteFile(fileId);

  return result;
}

// ============================================================
// PURCHASE HISTORY
// ============================================================

/**
 * Get supplier purchase history
 * @param {string} supplierId - Supplier ID
 * @param {number} limit - Number of records to return
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getPurchaseHistory(supplierId, limit = 10) {
  const result = await supplierRepository.getPurchaseHistory(supplierId, limit);

  return result;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  getActiveSuppliers,
  changeStatus,
  addContact,
  updateContact,
  deleteContact,
  addFile,
  deleteFile,
  getPurchaseHistory,
  // Export utilities for testing
  validateCNPJ,
  validateCPF,
  validateDocument,
  canManageSuppliers,
};
