/**
 * @fileoverview Service Layer para lógica de negócio de comissões
 * @module services/commissionService
 * @requires repositories/commissionRepository
 * @requires dtos/CommissionDTO
 * @description
 * Camada de lógica de negócio (Business Logic Layer) para commissions.
 * Segue Clean Architecture - Service Pattern.
 * Contém validações, regras de negócio e orquestração de operações.
 *
 * @author Andrey Viana
 * @date 08/11/2025
 */

import commissionRepository from '../repositories/commissionRepository';
import {
  validateCreateCommission,
  validateUpdateCommission,
  validateCommissionFilters,
} from '../dtos/CommissionDTO';

/**
 * Serviço de gerenciamento de comissões
 */
const commissionService = {
  /**
   * Busca comissões com filtros
   * @param {Object} filters - Filtros de busca
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Array|null, error: string|null, count: number|null}>}
   */
  async findByFilters(filters, user) {
    try {
      // Validar filtros
      const validation = validateCommissionFilters(filters);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
          count: null,
        };
      }

      return await commissionRepository.findByFilters(validation.data);
    } catch (error) {
      console.error('❌ Erro no service ao buscar comissões:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar comissões',
        count: null,
      };
    }
  },

  /**
   * Busca uma comissão por ID
   * @param {string} id - ID da comissão
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    if (!id) {
      return { data: null, error: 'ID da comissão é obrigatório' };
    }

    return await commissionRepository.findById(id);
  },

  /**
   * Cria uma nova comissão
   * @param {Object} commissionData - Dados da comissão
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(commissionData, user) {
    try {
      // Validar com DTO
      const validation = validateCreateCommission(commissionData);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
        };
      }

      // Verificar permissão (apenas admin e gerente)
      if (!user || !['administrador', 'gerente'].includes(user.role)) {
        return {
          data: null,
          error: 'Sem permissão para criar comissões',
        };
      }

      // Adicionar audit fields
      const dataToInsert = {
        ...validation.data,
        created_by: user.id,
        is_active: true,
      };

      // Inserir no banco
      const result = await commissionRepository.create(dataToInsert);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      console.error('❌ Erro no service ao criar comissão:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar comissão',
      };
    }
  },

  /**
   * Atualiza uma comissão existente
   * @param {string} id - ID da comissão
   * @param {Object} commissionData - Dados para atualizar
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, commissionData, user) {
    try {
      // Validar com DTO
      const validation = validateUpdateCommission({
        ...commissionData,
        id,
      });
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
        };
      }

      // Verificar permissão
      if (!user || !['administrador', 'gerente'].includes(user.role)) {
        return {
          data: null,
          error: 'Sem permissão para atualizar comissões',
        };
      }

      // Remover id dos dados de atualização
      const { id: _, ...dataToUpdate } = validation.data;

      // Atualizar no banco
      const result = await commissionRepository.update(id, dataToUpdate);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      console.error('❌ Erro no service ao atualizar comissão:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar comissão',
      };
    }
  },

  /**
   * Marca comissão como paga
   * @param {string} id - ID da comissão
   * @param {Object} user - Usuário autenticado
   * @param {string} notes - Observações opcionais
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async markAsPaid(id, user, notes = null) {
    try {
      if (!id) {
        return { data: null, error: 'ID da comissão é obrigatório' };
      }

      // Verificar permissão
      if (!user || !['administrador', 'gerente'].includes(user.role)) {
        return {
          data: null,
          error: 'Sem permissão para marcar comissão como paga',
        };
      }

      // Marcar como paga no banco
      const result = await commissionRepository.markAsPaid(id, user.id, notes);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      console.error('❌ Erro no service ao marcar comissão como paga:', error);
      return {
        data: null,
        error: error.message || 'Erro ao marcar comissão como paga',
      };
    }
  },

  /**
   * Exclui uma comissão (soft delete)
   * @param {string} id - ID da comissão
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async delete(id, user) {
    try {
      if (!id) {
        return { data: null, error: 'ID da comissão é obrigatório' };
      }

      // Verificar permissão
      if (!user || !['administrador', 'gerente'].includes(user.role)) {
        return {
          data: null,
          error: 'Sem permissão para excluir comissões',
        };
      }

      // Não permitir excluir comissão já paga
      const existing = await commissionRepository.findById(id);
      if (existing.data && existing.data.status === 'PAID') {
        return {
          data: null,
          error: 'Não é possível excluir uma comissão já paga',
        };
      }

      return await commissionRepository.softDelete(id);
    } catch (error) {
      console.error('❌ Erro no service ao excluir comissão:', error);
      return {
        data: null,
        error: error.message || 'Erro ao excluir comissão',
      };
    }
  },

  /**
   * Busca totalizadores de comissões
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getTotals(filters) {
    try {
      const validation = validateCommissionFilters(filters);
      if (!validation.isValid) {
        return {
          data: null,
          error: validation.errors.join(', '),
        };
      }

      return await commissionRepository.getTotals(validation.data);
    } catch (error) {
      console.error('❌ Erro no service ao calcular totalizadores:', error);
      return {
        data: null,
        error: error.message || 'Erro ao calcular totalizadores',
      };
    }
  },
};

export default commissionService;



