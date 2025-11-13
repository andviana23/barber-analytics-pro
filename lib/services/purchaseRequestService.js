/**
 * @fileoverview Purchase Request Service - Business logic for purchase requests
 * @module lib/services/purchaseRequestService
 * @description Handles purchase request workflow and business rules
 *
 * Architecture: Clean Architecture + Service Pattern
 * - Business logic layer between controllers and repository
 * - Permission checks (role-based)
 * - Data validation via DTOs
 * - Telegram notifications for approvals
 *
 * @author Andrey Viana
 * @version 2.0.0
 * @created 2025-11-13
 */

import { purchaseRequestRepository } from '@/lib/repositories/purchaseRequestRepository';
import {
  CreatePurchaseRequestDTO,
  UpdatePurchaseRequestDTO,
  PurchaseRequestResponseDTO,
  PurchaseRequestFiltersDTO,
  CreatePurchaseQuoteDTO,
  PurchaseQuoteResponseDTO,
} from '@/lib/dtos/purchaseRequestDTO';
import {
  sendPurchaseRequestNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  sendQuoteSelectedNotification,
} from './telegramPurchaseBot';

/**
 * Check if user can manage purchase requests
 * @param {Object} professional - Professional data with role
 * @returns {boolean}
 */
function canManagePurchaseRequests(professional) {
  if (!professional || !professional.role) return false;
  const allowedRoles = ['gerente', 'admin'];
  return allowedRoles.includes(professional.role.toLowerCase());
}

/**
 * Purchase Request Service
 */
export const purchaseRequestService = {
  /**
   * Create a new purchase request
   * @param {Object} data - Request data with items
   * @param {Object} _user - Current user (unused)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  // eslint-disable-next-line no-unused-vars
  async createRequest(data, user) {
    // Validate DTO
    const dto = new CreatePurchaseRequestDTO(data);
    const validation = dto.validate();

    if (!validation.isValid) {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        },
      };
    }

    // Create request
    const result = await purchaseRequestRepository.create(
      dto.toObject(),
      dto.getItems()
    );

    if (result.error) return result;

    // Format response
    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Get purchase request by ID
   * @param {string} id - Request ID
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async getRequest(id) {
    const result = await purchaseRequestRepository.findById(id);

    if (result.error) return result;

    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * List purchase requests for a unit
   * @param {string} unitId - Unit ID
   * @param {Object} filters - Filters
   * @returns {Promise<{data: Array, error: Object|null, totalCount: number}>}
   */
  async listRequests(unitId, filters = {}) {
    // Validate filters
    const filtersDTO = new PurchaseRequestFiltersDTO({
      ...filters,
      unit_id: unitId,
    });

    const validation = filtersDTO.validate();
    if (!validation.isValid) {
      return {
        data: [],
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Filtros inválidos',
          details: validation.errors,
        },
        totalCount: 0,
      };
    }

    // Fetch data
    const result = await purchaseRequestRepository.findByUnit(unitId, {
      status: filtersDTO.status,
      priority: filtersDTO.priority,
      requested_by: filtersDTO.requested_by,
      start_date: filtersDTO.start_date,
      end_date: filtersDTO.end_date,
      search: filtersDTO.search,
      offset: filtersDTO.getOffset(),
      limit: filtersDTO.getLimit(),
    });

    if (result.error) return result;

    // Format responses
    const formatted = result.data.map(item => {
      const dto = new PurchaseRequestResponseDTO(item);
      return dto.toObject();
    });

    return {
      data: formatted,
      error: null,
      totalCount: result.totalCount,
    };
  },

  /**
   * Update a purchase request (only DRAFT can be edited)
   * @param {string} id - Request ID
   * @param {Object} updates - Fields to update
   * @param {Object} _user - Current user (unused)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  // eslint-disable-next-line no-unused-vars
  async updateRequest(id, updates, user) {
    // Check current status
    const current = await purchaseRequestRepository.findById(id);
    if (current.error) return current;

    if (current.data.status !== 'DRAFT') {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Apenas solicitações em rascunho podem ser editadas',
        },
      };
    }

    // Validate updates
    const dto = new UpdatePurchaseRequestDTO(updates);
    const validation = dto.validate();

    if (!validation.isValid) {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        },
      };
    }

    // Update
    const result = await purchaseRequestRepository.update(id, dto.toObject());

    if (result.error) return result;

    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Submit request for approval (DRAFT → SUBMITTED)
   * Sends Telegram notification to managers
   * @param {string} id - Request ID
   * @param {Object} _user - Current user (unused)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  // eslint-disable-next-line no-unused-vars
  async submitForApproval(id, user) {
    // Submit
    const result = await purchaseRequestRepository.submitForApproval(id);

    if (result.error) return result;

    // Send Telegram notification to managers
    try {
      await sendPurchaseRequestNotification(result.data);
    } catch {
      // Log error but don't fail the operation
      // Telegram notification failed silently
    }

    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Approve purchase request (SUBMITTED → APPROVED)
   * @param {string} id - Request ID
   * @param {Object} user - Current user with professional data
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async approve(id, user) {
    // Check permission
    if (!canManagePurchaseRequests(user.professional)) {
      return {
        data: null,
        error: {
          type: 'PERMISSION_DENIED',
          message:
            'Apenas gerentes e administradores podem aprovar solicitações',
        },
      };
    }

    // Approve
    const result = await purchaseRequestRepository.approve(
      id,
      user.professional.id
    );

    if (result.error) return result;

    // Send Telegram notification to requester
    try {
      await sendApprovalNotification(result.data);
    } catch {
      // Log error but don't fail the operation
      // Telegram notification failed silently
    }

    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Reject purchase request (SUBMITTED → REJECTED)
   * @param {string} id - Request ID
   * @param {string} reason - Rejection reason
   * @param {Object} user - Current user with professional data
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async reject(id, reason, user) {
    // Check permission
    if (!canManagePurchaseRequests(user.professional)) {
      return {
        data: null,
        error: {
          type: 'PERMISSION_DENIED',
          message:
            'Apenas gerentes e administradores podem rejeitar solicitações',
        },
      };
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Motivo da rejeição deve ter pelo menos 10 caracteres',
        },
      };
    }

    // Reject
    const result = await purchaseRequestRepository.reject(
      id,
      user.professional.id,
      reason
    );

    if (result.error) return result;

    // Send Telegram notification to requester
    try {
      await sendRejectionNotification(result.data);
    } catch {
      // Log error but don't fail the operation
      // Telegram notification failed silently
    }

    const response = new PurchaseRequestResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Get pending approvals for a unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async getPendingApprovals(unitId) {
    const result = await purchaseRequestRepository.getPendingApprovals(unitId);

    if (result.error) return result;

    const formatted = result.data.map(item => {
      const dto = new PurchaseRequestResponseDTO(item);
      return dto.toObject();
    });

    return {
      data: formatted,
      error: null,
    };
  },

  /**
   * Delete purchase request (soft delete, only DRAFT)
   * @param {string} id - Request ID
   * @param {Object} _user - Current user (unused)
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteRequest(id, user) {
    // Check current status
    const current = await purchaseRequestRepository.findById(id);
    if (current.error) return current;

    if (current.data.status !== 'DRAFT') {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Apenas solicitações em rascunho podem ser excluídas',
        },
      };
    }

    return await purchaseRequestRepository.delete(id);
  },

  // ========== QUOTES ==========

  /**
   * Record a quote for a purchase request
   * @param {Object} data - Quote data with items
   * @param {Object} user - Current user
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async recordQuote(data, user) {
    // Check permission
    if (!canManagePurchaseRequests(user.professional)) {
      return {
        data: null,
        error: {
          type: 'PERMISSION_DENIED',
          message: 'Apenas gerentes e administradores podem registrar cotações',
        },
      };
    }

    // Validate DTO
    const dto = new CreatePurchaseQuoteDTO(data);
    const validation = dto.validate();

    if (!validation.isValid) {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: validation.errors,
        },
      };
    }

    // Create quote
    const result = await purchaseRequestRepository.createQuote(
      dto.toObject(),
      dto.getItems()
    );

    if (result.error) return result;

    const response = new PurchaseQuoteResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Get quotes for a purchase request
   * @param {string} requestId - Request ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async getQuotesByRequest(requestId) {
    const result =
      await purchaseRequestRepository.getQuotesByRequest(requestId);

    if (result.error) return result;

    const formatted = result.data.map(item => {
      const dto = new PurchaseQuoteResponseDTO(item);
      return dto.toObject();
    });

    return {
      data: formatted,
      error: null,
    };
  },

  /**
   * Select a quote (marks as selected)
   * @param {string} quoteId - Quote ID
   * @param {string} reason - Selection reason
   * @param {Object} user - Current user
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async selectQuote(quoteId, reason, user) {
    // Check permission
    if (!canManagePurchaseRequests(user.professional)) {
      return {
        data: null,
        error: {
          type: 'PERMISSION_DENIED',
          message:
            'Apenas gerentes e administradores podem selecionar cotações',
        },
      };
    }

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return {
        data: null,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Justificativa da seleção deve ter pelo menos 10 caracteres',
        },
      };
    }

    // Select quote
    const result = await purchaseRequestRepository.selectQuote(
      quoteId,
      user.professional.id,
      reason
    );

    if (result.error) return result;

    // Send Telegram notification about quote selection
    try {
      await sendQuoteSelectedNotification(result.data);
    } catch {
      // Telegram notification failed silently
    }

    const response = new PurchaseQuoteResponseDTO(result.data);
    return {
      data: response.toObject(),
      error: null,
    };
  },

  /**
   * Compare quotes for a request
   * @param {string} requestId - Request ID
   * @returns {Promise<{data: Array, error: Object|null}>}
   */
  async compareQuotes(requestId) {
    const result = await purchaseRequestRepository.compareQuotes(requestId);

    if (result.error) return result;

    // Already formatted by view
    return {
      data: result.data,
      error: null,
    };
  },
};
