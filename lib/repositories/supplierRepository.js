/**
 * @fileoverview Supplier Repository - Data access layer for suppliers module
 * @module lib/repositories/supplierRepository
 * @description Handles all database operations for suppliers, contacts, and files
 *
 * Architecture: Clean Architecture + Repository Pattern
 * - Isolates Supabase queries from business logic
 * - Returns normalized { data, error } format
 * - Implements error normalization (network, constraints, auth)
 * - RLS-aware: All queries filtered by unit_id automatically
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

import { supabase } from '@/lib/supabase';

/**
 * Error types for normalization
 */
const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONSTRAINT: 'CONSTRAINT_VIOLATION',
  PERMISSION: 'PERMISSION_DENIED',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Normalize Supabase errors to consistent format
 * @param {Error} error - Original error from Supabase
 * @returns {Object} Normalized error object
 */
function normalizeError(error) {
  if (!error) return null;

  // Network/connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'Erro de conexão com o servidor',
      details: error.message,
    };
  }

  // RLS/Permission errors
  if (
    error.code === 'PGRST301' ||
    error.message?.includes('permission denied')
  ) {
    return {
      type: ERROR_TYPES.PERMISSION,
      message: 'Sem permissão para acessar este recurso',
      details: error.message,
    };
  }

  // Unique constraint violation (duplicate CNPJ)
  if (error.code === '23505' || error.message?.includes('duplicate key')) {
    return {
      type: ERROR_TYPES.CONSTRAINT,
      message: 'CNPJ/CPF já cadastrado para esta unidade',
      details: error.message,
    };
  }

  // Foreign key violation
  if (error.code === '23503' || error.message?.includes('foreign key')) {
    return {
      type: ERROR_TYPES.CONSTRAINT,
      message: 'Referência inválida (unidade ou fornecedor não existe)',
      details: error.message,
    };
  }

  // Check constraint violation
  if (error.code === '23514' || error.message?.includes('check constraint')) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message: 'Dados inválidos (verifique os campos)',
      details: error.message,
    };
  }

  // Not found (no rows returned)
  if (error.code === 'PGRST116' || error.message?.includes('not found')) {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      message: 'Fornecedor não encontrado',
      details: error.message,
    };
  }

  // Default unknown error
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: error.message || 'Erro desconhecido ao acessar o banco',
    details: error,
  };
}

/**
 * Supplier Repository
 * @namespace supplierRepository
 */
export const supplierRepository = {
  /**
   * Create new supplier
   * @param {Object} supplierData - Supplier data (validated by DTO)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async create(supplierData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select(
          `
          *,
          unit:units!inner(id, name)
        `
        )
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Find supplier by ID
   * @param {string} id - Supplier UUID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select(
          `
          *,
          unit:units!inner(id, name),
          contacts:supplier_contacts(
            id,
            contact_name,
            phone,
            email,
            role,
            is_primary,
            is_active
          ),
          files:supplier_files(
            id,
            file_name,
            file_type,
            file_size,
            uploaded_at,
            uploaded_by
          )
        `
        )
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Find suppliers by unit with filters
   * @param {string} unitId - Unit UUID
   * @param {Object} filters - Filter options
   * @param {string} [filters.status] - Filter by status (ATIVO, INATIVO, BLOQUEADO)
   * @param {string} [filters.search] - Search by name or CNPJ/CPF
   * @param {number} [filters.offset=0] - Pagination offset
   * @param {number} [filters.limit=50] - Pagination limit
   * @returns {Promise<{data: Array|null, error: Object|null, totalCount: number}>}
   */
  async findByUnit(unitId, filters = {}) {
    try {
      const { status, search, offset = 0, limit = 50 } = filters;

      let query = supabase
        .from('suppliers')
        .select(
          `
          *,
          unit:units!inner(id, name),
          contacts:supplier_contacts!inner(
            id,
            contact_name,
            phone,
            email,
            is_primary
          )
        `,
          { count: 'exact' }
        )
        .eq('unit_id', unitId)
        .eq('is_active', true);

      // Filter by status
      if (status) {
        query = query.eq('status', status);
      }

      // Search by name or CNPJ/CPF
      if (search) {
        query = query.or(`name.ilike.%${search}%,cnpj_cpf.ilike.%${search}%`);
      }

      // Pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: normalizeError(error), totalCount: 0 };
      }

      return { data, error: null, totalCount: count || 0 };
    } catch (error) {
      return { data: null, error: normalizeError(error), totalCount: 0 };
    }
  },

  /**
   * Find supplier by CNPJ/CPF in a unit (for duplicate detection)
   * @param {string} cnpjCpf - CNPJ or CPF (numbers only)
   * @param {string} unitId - Unit UUID
   * @param {string} [excludeId] - Exclude this supplier ID (for updates)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async findByCNPJ(cnpjCpf, unitId, excludeId = null) {
    try {
      let query = supabase
        .from('suppliers')
        .select('id, name, cnpj_cpf, status, is_active')
        .eq('unit_id', unitId)
        .eq('cnpj_cpf', cnpjCpf)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Update supplier
   * @param {string} id - Supplier UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          unit:units!inner(id, name)
        `
        )
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Soft delete supplier (set is_active = false)
   * @param {string} id - Supplier UUID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, name, is_active')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Get purchase history for a supplier (last 10 purchases)
   * NOTE: Requires product_movements table to track purchases
   * @param {string} supplierId - Supplier UUID
   * @param {number} [limit=10] - Number of records to return
   * @returns {Promise<{data: Array|null, error: Object|null}>}
   */
  async getPurchaseHistory(supplierId, limit = 10) {
    try {
      // Query product_movements where reference_type = 'purchase' and supplier_id matches
      // NOTE: This assumes product_movements has supplier tracking (party_id field)
      const { data, error } = await supabase
        .from('product_movements')
        .select(
          `
          id,
          movement_date,
          quantity,
          unit_cost,
          total_cost,
          reference_document,
          notes,
          product:products!inner(
            id,
            name,
            unit_measurement
          )
        `
        )
        .eq('party_id', supplierId)
        .eq('movement_type', 'in')
        .eq('is_active', true)
        .order('movement_date', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Get all active suppliers for a unit (simple list for dropdowns)
   * @param {string} unitId - Unit UUID
   * @returns {Promise<{data: Array|null, error: Object|null}>}
   */
  async findActiveByUnit(unitId) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, cnpj_cpf, status')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .eq('status', 'ATIVO')
        .order('name');

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  // ==================== CONTACTS ====================

  /**
   * Add contact to supplier
   * @param {Object} contactData - Contact data
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async addContact(contactData) {
    try {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .insert(contactData)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Update contact
   * @param {string} contactId - Contact UUID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async updateContact(contactId, updateData) {
    try {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Delete contact (soft delete)
   * @param {string} contactId - Contact UUID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async deleteContact(contactId) {
    try {
      const { data, error } = await supabase
        .from('supplier_contacts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)
        .select('id, contact_name, is_active')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  // ==================== FILES ====================

  /**
   * Add file reference (after upload to Supabase Storage)
   * @param {Object} fileData - File metadata
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async addFile(fileData) {
    try {
      const { data, error } = await supabase
        .from('supplier_files')
        .insert(fileData)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },

  /**
   * Delete file reference (soft delete)
   * NOTE: Does NOT delete from Supabase Storage (handle separately)
   * @param {string} fileId - File UUID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async deleteFile(fileId) {
    try {
      const { data, error } = await supabase
        .from('supplier_files')
        .update({ is_active: false })
        .eq('id', fileId)
        .select('id, file_name, file_path, is_active')
        .single();

      if (error) {
        return { data: null, error: normalizeError(error) };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: normalizeError(error) };
    }
  },
};

export default supplierRepository;
