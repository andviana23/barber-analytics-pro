/**
 * @fileoverview Service Layer para lógica de negócio de movimentações de estoque
 * @module services/stockMovementService
 * @requires repositories/stockMovementRepository
 * @requires dtos/stockMovementDTO
 * @description
 * Camada de lógica de negócio (Business Logic Layer) para stock_movements.
 * Segue Clean Architecture - Service Pattern.
 * Contém validações, regras de negócio e orquestração de operações.
 *
 * @author Andrey Viana
 * @date 13/11/2025
 * @see docs/Guia_estoque.md - Sprint 1.2
 */

import stockMovementRepository from '@/repositories/stockMovementRepository';
import {
  CreateStockMovementDTO,
  UpdateStockMovementDTO,
  StockMovementFiltersDTO,
} from '@/dtos/stockMovementDTO';
import { supabase } from './supabase';

/**
 * Valida se o usuário tem permissão para gerenciar estoque
 * @param {Object} user - Usuário autenticado
 * @returns {boolean}
 * @private
 */
async function canManageStock(user) {
  if (!user?.id) return false;

  const { data } = await supabase
    .from('professionals')
    .select('role, is_active')
    .eq('user_id', user.id)
    .single();

  if (!data || !data.is_active) return false;

  // Roles permitidos: barbeiro, gerente, admin
  const allowedRoles = ['barbeiro', 'gerente', 'admin'];
  return allowedRoles.includes(data.role);
}

/**
 * Serviço de gerenciamento de movimentações de estoque
 */
const stockMovementService = {
  /**
   * Registrar entrada de estoque (COMPRA, AJUSTE, DEVOLUCAO)
   *
   * @param {string} productId - ID do produto
   * @param {number} quantity - Quantidade (positivo)
   * @param {string} reason - Motivo: COMPRA, AJUSTE, DEVOLUCAO
   * @param {number} unitCost - Custo unitário
   * @param {string} unitId - ID da unidade
   * @param {string} performedBy - ID do profissional
   * @param {string} [notes] - Observações
   * @param {string} [referenceId] - ID de referência (ex: purchase_id)
   * @param {string} [referenceType] - Tipo: PURCHASE, REVENUE, SERVICE
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async recordEntry(
    productId,
    quantity,
    reason,
    unitCost,
    unitId,
    performedBy,
    notes = null,
    referenceId = null,
    referenceType = null,
    user
  ) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para gerenciar estoque',
        };
      }

      // Criar DTO
      const dto = new CreateStockMovementDTO({
        unit_id: unitId,
        product_id: productId,
        movement_type: 'ENTRADA',
        reason,
        quantity,
        unit_cost: unitCost,
        performed_by: performedBy,
        reference_id: referenceId,
        reference_type: referenceType,
        notes,
      });

      // Validar DTO
      const validation = dto.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: `Dados inválidos: ${validation.errors.join(', ')}`,
        };
      }

      // Inserir no banco (trigger atualizará estoque automaticamente)
      return await stockMovementRepository.create(dto.toObject());
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao registrar entrada de estoque',
      };
    }
  },

  /**
   * Registrar saída de estoque (VENDA, CONSUMO_INTERNO, LIMPEZA)
   *
   * @param {string} productId - ID do produto
   * @param {number} quantity - Quantidade (positivo)
   * @param {string} reason - Motivo: VENDA, CONSUMO_INTERNO, LIMPEZA
   * @param {string} unitId - ID da unidade
   * @param {string} performedBy - ID do profissional
   * @param {string} [notes] - Observações
   * @param {string} [referenceId] - ID de referência
   * @param {string} [referenceType] - Tipo de referência
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async recordExit(
    productId,
    quantity,
    reason,
    unitId,
    performedBy,
    notes = null,
    referenceId = null,
    referenceType = null,
    user
  ) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para gerenciar estoque',
        };
      }

      // Buscar produto para validar estoque disponível
      const { data: product } = await supabase
        .from('products')
        .select('current_stock, name')
        .eq('id', productId)
        .single();

      if (!product) {
        return { data: null, error: 'Produto não encontrado' };
      }

      if (product.current_stock < quantity) {
        return {
          data: null,
          error: `Estoque insuficiente. Disponível: ${product.current_stock}, Solicitado: ${quantity}`,
        };
      }

      // Criar DTO
      const dto = new CreateStockMovementDTO({
        unit_id: unitId,
        product_id: productId,
        movement_type: 'SAIDA',
        reason,
        quantity,
        unit_cost: 0, // Saídas não têm custo
        performed_by: performedBy,
        reference_id: referenceId,
        reference_type: referenceType,
        notes,
      });

      // Validar DTO
      const validation = dto.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: `Dados inválidos: ${validation.errors.join(', ')}`,
        };
      }

      // Inserir no banco (trigger atualizará estoque automaticamente)
      return await stockMovementRepository.create(dto.toObject());
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao registrar saída de estoque',
      };
    }
  },

  /**
   * Ajustar estoque (AJUSTE para correção de inventário)
   *
   * @param {string} productId - ID do produto
   * @param {number} quantity - Quantidade (positivo para adicionar, negativo para remover)
   * @param {string} reason - Sempre 'AJUSTE'
   * @param {string} unitId - ID da unidade
   * @param {string} performedBy - ID do profissional
   * @param {string} notes - Observações obrigatórias para ajustes
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async adjustStock(productId, quantity, unitId, performedBy, notes, user) {
    try {
      // Validar permissão (apenas gerente e admin)
      if (!user?.id) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data: professional } = await supabase
        .from('professionals')
        .select('role, is_active')
        .eq('user_id', user.id)
        .single();

      if (!professional || !professional.is_active) {
        return { data: null, error: 'Profissional não encontrado ou inativo' };
      }

      const allowedRoles = ['gerente', 'admin'];
      if (!allowedRoles.includes(professional.role)) {
        return {
          data: null,
          error: 'Apenas gerentes e administradores podem ajustar estoque',
        };
      }

      // Validar notes obrigatórias
      if (!notes || notes.trim() === '') {
        return {
          data: null,
          error: 'Observações são obrigatórias para ajustes de estoque',
        };
      }

      // Determinar tipo de movimento
      const movementType = quantity > 0 ? 'ENTRADA' : 'SAIDA';
      const absoluteQuantity = Math.abs(quantity);

      // Se for saída, validar estoque disponível
      if (movementType === 'SAIDA') {
        const { data: product } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', productId)
          .single();

        if (!product) {
          return { data: null, error: 'Produto não encontrado' };
        }

        if (product.current_stock < absoluteQuantity) {
          return {
            data: null,
            error: `Estoque insuficiente para ajuste. Disponível: ${product.current_stock}`,
          };
        }
      }

      // Criar DTO
      const dto = new CreateStockMovementDTO({
        unit_id: unitId,
        product_id: productId,
        movement_type: movementType,
        reason: 'AJUSTE',
        quantity: absoluteQuantity,
        unit_cost: 0, // Ajustes não têm custo
        performed_by: performedBy,
        notes: `[AJUSTE] ${notes}`,
      });

      // Validar DTO
      const validation = dto.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: `Dados inválidos: ${validation.errors.join(', ')}`,
        };
      }

      // Inserir no banco
      return await stockMovementRepository.create(dto.toObject());
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao ajustar estoque',
      };
    }
  },

  /**
   * Buscar histórico de movimentações (com paginação e filtros)
   *
   * @param {Object} filters - Filtros
   * @param {string} filters.unit_id - ID da unidade (obrigatório)
   * @param {string} [filters.product_id] - ID do produto
   * @param {string} [filters.movement_type] - ENTRADA ou SAIDA
   * @param {string} [filters.reason] - Motivo específico
   * @param {string} [filters.performed_by] - ID do profissional
   * @param {Date} [filters.start_date] - Data inicial
   * @param {Date} [filters.end_date] - Data final
   * @param {number} [filters.page] - Página (default: 1)
   * @param {number} [filters.page_size] - Itens por página (default: 20)
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Array|null, error: string|null, totalCount: number, page: number, pageSize: number}>}
   */
  async getStockHistory(filters, user) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para visualizar estoque',
          totalCount: 0,
        };
      }

      // Criar DTO de filtros
      const filtersDTO = new StockMovementFiltersDTO(filters);

      // Validar filtros
      const validation = filtersDTO.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: `Filtros inválidos: ${validation.errors.join(', ')}`,
          totalCount: 0,
        };
      }

      if (!filtersDTO.unit_id) {
        return {
          data: null,
          error: 'unit_id é obrigatório',
          totalCount: 0,
        };
      }

      // Buscar no repository
      const result = await stockMovementRepository.findByUnit(
        filtersDTO.unit_id,
        filtersDTO.toSupabaseQuery(),
        filtersDTO.getOffset(),
        filtersDTO.getLimit()
      );

      if (result.error) {
        return {
          data: null,
          error: result.error,
          totalCount: 0,
        };
      }

      return {
        data: result.data,
        error: null,
        totalCount: result.totalCount,
        page: filtersDTO.page,
        pageSize: filtersDTO.page_size,
        totalPages: Math.ceil(result.totalCount / filtersDTO.page_size),
      };
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao buscar histórico de estoque',
        totalCount: 0,
      };
    }
  },

  /**
   * Buscar movimentações de um produto específico
   *
   * @param {string} productId - ID do produto
   * @param {Date} [startDate] - Data inicial
   * @param {Date} [endDate] - Data final
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async getProductHistory(productId, startDate, endDate, user) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para visualizar estoque',
        };
      }

      if (!productId) {
        return { data: null, error: 'product_id é obrigatório' };
      }

      return await stockMovementRepository.findByProductAndDate(
        productId,
        startDate,
        endDate
      );
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao buscar histórico do produto',
      };
    }
  },

  /**
   * Atualizar notas de uma movimentação (apenas notes podem ser editados)
   *
   * @param {string} id - ID da movimentação
   * @param {string} notes - Novas observações
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async updateNotes(id, notes, user) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para editar movimentações',
        };
      }

      if (!id) {
        return { data: null, error: 'ID da movimentação é obrigatório' };
      }

      // Criar DTO
      const dto = new UpdateStockMovementDTO({ notes });

      // Validar
      const validation = dto.validate();
      if (!validation.isValid) {
        return {
          data: null,
          error: `Dados inválidos: ${validation.errors.join(', ')}`,
        };
      }

      // Atualizar
      return await stockMovementRepository.update(id, dto.toObject());
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao atualizar movimentação',
      };
    }
  },

  /**
   * Reverter movimentação (hard delete - usar com cuidado!)
   *
   * ⚠️ ATENÇÃO: Esta ação é irreversível e atualiza o estoque automaticamente
   *
   * @param {string} id - ID da movimentação
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async revertMovement(id, user) {
    try {
      // Validar permissão (apenas gerente e admin)
      if (!user?.id) {
        return { data: false, error: 'Usuário não autenticado' };
      }

      const { data: professional } = await supabase
        .from('professionals')
        .select('role, is_active')
        .eq('user_id', user.id)
        .single();

      if (!professional || !professional.is_active) {
        return { data: false, error: 'Profissional não encontrado ou inativo' };
      }

      const allowedRoles = ['gerente', 'admin'];
      if (!allowedRoles.includes(professional.role)) {
        return {
          data: false,
          error:
            'Apenas gerentes e administradores podem reverter movimentações',
        };
      }

      if (!id) {
        return { data: false, error: 'ID da movimentação é obrigatório' };
      }

      // Reverter (hard delete dispara trigger que reverte estoque)
      return await stockMovementRepository.revert(id);
    } catch (error) {
      return {
        data: false,
        error: error.message || 'Erro ao reverter movimentação',
      };
    }
  },

  /**
   * Deletar movimentação (soft delete)
   *
   * @param {string} id - ID da movimentação
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async deleteMovement(id, user) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: false,
          error: 'Sem permissão para deletar movimentações',
        };
      }

      if (!id) {
        return { data: false, error: 'ID da movimentação é obrigatório' };
      }

      return await stockMovementRepository.delete(id);
    } catch (error) {
      return {
        data: false,
        error: error.message || 'Erro ao deletar movimentação',
      };
    }
  },

  /**
   * Buscar resumo de movimentações por período
   *
   * @param {string} unitId - ID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async getSummaryByPeriod(unitId, startDate, endDate, user) {
    try {
      // Validar permissão
      const hasPermission = await canManageStock(user);
      if (!hasPermission) {
        return {
          data: null,
          error: 'Sem permissão para visualizar resumo',
        };
      }

      if (!unitId || !startDate || !endDate) {
        return {
          data: null,
          error: 'unit_id, startDate e endDate são obrigatórios',
        };
      }

      return await stockMovementRepository.getSummaryByPeriod(
        unitId,
        startDate,
        endDate
      );
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Erro ao buscar resumo',
      };
    }
  },
};

export default stockMovementService;
