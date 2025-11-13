/**
 * @fileoverview Purchase Request Repository - Data access layer for purchase requests module
 * @module lib/repositories/purchaseRequestRepository
 * @description Handles all database operations for purchase requests and quotes
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

  // Foreign key violation
  if (error.code === '23503' || error.message?.includes('foreign key')) {
    return {
      type: ERROR_TYPES.CONSTRAINT,
      message:
        'Referência inválida (unidade, produto ou fornecedor não existe)',
      details: error.message,
    };
  }

  // Check constraint violation
  if (error.code === '23514' || error.message?.includes('check constraint')) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message: 'Dados inválidos (verifique quantidade, status, etc.)',
      details: error.message,
    };
  }

  // Not found (PGRST116)
  if (error.code === 'PGRST116') {
    return {
      type: ERROR_TYPES.NOT_FOUND,
      message: 'Registro não encontrado',
      details: error.message,
    };
  }

  // Default unknown error
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: error.message || 'Erro desconhecido',
    details: error,
  };
}

/**
 * Purchase Request Repository
 */
export const purchaseRequestRepository = {
  /**
   * Create a new purchase request with items
   * @param {Object} requestData - Purchase request data
   * @param {Array} items - Array of request items
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async create(requestData, items) {
    try {
      // Insert purchase request
      const { data: request, error: requestError } = await supabase
        .from('purchase_requests')
        .insert(requestData)
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name)
        `
        )
        .single();

      if (requestError) throw requestError;

      // Insert items
      const itemsWithRequestId = items.map(item => ({
        ...item,
        request_id: request.id,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('purchase_request_items')
        .insert(itemsWithRequestId).select(`
          *,
          products:product_id(id, name, unit_measurement)
        `);

      if (itemsError) throw itemsError;

      return {
        data: {
          ...request,
          items: insertedItems || [],
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Find purchase request by ID with items
   * @param {string} id - Request ID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name, email),
          approver:approved_by(id, name),
          rejector:rejected_by(id, name),
          items:purchase_request_items(
            *,
            products:product_id(id, name, unit_measurement, current_stock)
          )
        `
        )
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Find purchase requests by unit with filters
   * @param {string} unitId - Unit ID
   * @param {Object} filters - Filters (status, priority, search, pagination)
   * @returns {Promise<{data: Array, error: Object|null, totalCount: number}>}
   */
  async findByUnit(unitId, filters = {}) {
    try {
      let query = supabase
        .from('purchase_requests')
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name),
          items:purchase_request_items(id)
        `,
          { count: 'exact' }
        )
        .eq('unit_id', unitId)
        .eq('is_active', true);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters.search) {
        query = query.or(
          `request_number.ilike.%${filters.search}%,justification.ilike.%${filters.search}%`
        );
      }

      // Pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 20;
      query = query.range(offset, offset + limit - 1);

      // Order by
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        error: null,
        totalCount: count || 0,
      };
    } catch (error) {
      return {
        data: [],
        error: normalizeError(error),
        totalCount: 0,
      };
    }
  },

  /**
   * Update purchase request
   * @param {string} id - Request ID
   * @param {Object} updates - Data to update
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Delete purchase request (soft delete)
   * @param {string} id - Request ID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Submit request for approval (change status to SUBMITTED)
   * @param {string} id - Request ID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async submitForApproval(id) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({ status: 'SUBMITTED' })
        .eq('id', id)
        .eq('status', 'DRAFT') // Only allow from DRAFT
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name),
          items:purchase_request_items(
            *,
            products:product_id(id, name)
          )
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Approve purchase request
   * @param {string} id - Request ID
   * @param {string} approvedBy - Professional ID who approved
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async approve(id, approvedBy) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({
          status: 'APPROVED',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'SUBMITTED') // Only allow from SUBMITTED
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name),
          approver:approved_by(id, name),
          items:purchase_request_items(
            *,
            products:product_id(id, name)
          )
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Reject purchase request
   * @param {string} id - Request ID
   * @param {string} rejectedBy - Professional ID who rejected
   * @param {string} reason - Rejection reason
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async reject(id, rejectedBy, reason) {
    try {
      const { data, error } = await supabase
        .from('purchase_requests')
        .update({
          status: 'REJECTED',
          rejected_by: rejectedBy,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id)
        .eq('status', 'SUBMITTED') // Only allow from SUBMITTED
        .select(
          `
          *,
          units:unit_id(id, name),
          professionals:requested_by(id, name),
          rejector:rejected_by(id, name),
          items:purchase_request_items(
            *,
            products:product_id(id, name)
          )
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Get pending approvals for a unit
   * Uses vw_pending_approvals view
   * @param {string} unitId - Unit ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async getPendingApprovals(unitId) {
    try {
      const { data, error } = await supabase
        .from('vw_pending_approvals')
        .select('*')
        .eq('unit_id', unitId);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: [],
        error: normalizeError(error),
      };
    }
  },

  /**
   * Add item to purchase request
   * @param {string} requestId - Request ID
   * @param {Object} itemData - Item data
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async addItem(requestId, itemData) {
    try {
      const { data, error } = await supabase
        .from('purchase_request_items')
        .insert({
          ...itemData,
          request_id: requestId,
        })
        .select(
          `
          *,
          products:product_id(id, name, unit_measurement)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Update purchase request item
   * @param {string} itemId - Item ID
   * @param {Object} updates - Data to update
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async updateItem(itemId, updates) {
    try {
      const { data, error } = await supabase
        .from('purchase_request_items')
        .update(updates)
        .eq('id', itemId)
        .select(
          `
          *,
          products:product_id(id, name, unit_measurement)
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Remove item from purchase request (soft delete)
   * @param {string} itemId - Item ID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async removeItem(itemId) {
    try {
      const { data, error } = await supabase
        .from('purchase_request_items')
        .update({ is_active: false })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  // ========== PURCHASE QUOTES ==========

  /**
   * Create a purchase quote with items
   * @param {Object} quoteData - Quote data
   * @param {Array} items - Array of quote items
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async createQuote(quoteData, items) {
    try {
      // Insert purchase quote
      const { data: quote, error: quoteError } = await supabase
        .from('purchase_quotes')
        .insert(quoteData)
        .select(
          `
          *,
          purchase_requests:request_id(id, request_number),
          suppliers:supplier_id(id, name)
        `
        )
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      const itemsWithQuoteId = items.map(item => ({
        ...item,
        quote_id: quote.id,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('purchase_quote_items')
        .insert(itemsWithQuoteId).select(`
          *,
          products:product_id(id, name, unit_measurement)
        `);

      if (itemsError) throw itemsError;

      return {
        data: {
          ...quote,
          items: insertedItems || [],
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Get quotes for a purchase request
   * @param {string} requestId - Request ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async getQuotesByRequest(requestId) {
    try {
      const { data, error } = await supabase
        .from('purchase_quotes')
        .select(
          `
          *,
          suppliers:supplier_id(id, name, email, phone),
          items:purchase_quote_items(
            *,
            products:product_id(id, name, unit_measurement)
          )
        `
        )
        .eq('request_id', requestId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: [],
        error: normalizeError(error),
      };
    }
  },

  /**
   * Select a quote (marks as selected, deselects others)
   * @param {string} quoteId - Quote ID
   * @param {string} selectedBy - Professional ID who selected
   * @param {string} reason - Selection reason
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async selectQuote(quoteId, selectedBy, reason) {
    try {
      const { data, error } = await supabase
        .from('purchase_quotes')
        .update({
          is_selected: true,
          selected_by: selectedBy,
          selected_at: new Date().toISOString(),
          selection_reason: reason,
        })
        .eq('id', quoteId)
        .select(
          `
          *,
          suppliers:supplier_id(id, name),
          items:purchase_quote_items(
            *,
            products:product_id(id, name)
          )
        `
        )
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: normalizeError(error),
      };
    }
  },

  /**
   * Compare quotes for a request
   * Uses vw_quote_comparison view
   * @param {string} requestId - Request ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async compareQuotes(requestId) {
    try {
      const { data, error } = await supabase
        .from('vw_quote_comparison')
        .select('*')
        .eq('request_id', requestId);

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error) {
      return {
        data: [],
        error: normalizeError(error),
      };
    }
  },
};
