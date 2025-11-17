/**
 * @file productCategoryService.js
 * @description Service para gerenciar categorias de produtos
 * @module Services/ProductCategories
 * @author Andrey Viana
 * @date 14/11/2025
 */

import { productCategoryRepository } from '../repositories/productCategoryRepository';
import { logger } from '../../lib/logger';

/**
 * Service de categorias de produtos
 * Segue Clean Architecture com validações e regras de negócio
 */
export const productCategoryService = {
  /**
   * Buscar todas as categorias ativas
   * @returns {Promise<{data, error}>}
   */
  async findAll() {
    try {
      logger.info('[productCategoryService] Buscando todas as categorias');
      const result = await productCategoryRepository.findAll();

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao buscar categorias:',
          result.error
        );
        return { data: null, error: result.error };
      }

      logger.info(
        `[productCategoryService] ${result.data?.length || 0} categorias encontradas`
      );
      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Buscar categoria por ID
   * @param {string} id - ID da categoria
   * @returns {Promise<{data, error}>}
   */
  async findById(id) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      logger.info(`[productCategoryService] Buscando categoria ${id}`);
      const result = await productCategoryRepository.findById(id);

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao buscar categoria:',
          result.error
        );
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Criar nova categoria de produto
   * @param {Object} data - Dados da categoria
   * @param {string} data.name - Nome da categoria
   * @param {string} data.description - Descrição (opcional)
   * @param {string} data.parent_category_id - ID da categoria de receita pai (opcional)
   * @returns {Promise<{data, error}>}
   */
  async create(data) {
    try {
      // Validações
      if (!data.name || data.name.trim().length < 2) {
        return { data: null, error: 'Nome deve ter no mínimo 2 caracteres' };
      }

      // Normalizar dados
      const categoryData = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        parent_category_id: data.parent_category_id || null,
        is_active: true,
      };

      logger.info(
        '[productCategoryService] Criando categoria:',
        categoryData.name
      );
      const result = await productCategoryRepository.create(categoryData);

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao criar categoria:',
          result.error
        );
        return { data: null, error: result.error };
      }

      logger.info(
        `[productCategoryService] Categoria criada: ${result.data.id}`
      );
      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Atualizar categoria existente
   * @param {string} id - ID da categoria
   * @param {Object} data - Dados para atualização
   * @returns {Promise<{data, error}>}
   */
  async update(id, data) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      // Validações
      if (data.name && data.name.trim().length < 2) {
        return { data: null, error: 'Nome deve ter no mínimo 2 caracteres' };
      }

      // Normalizar dados
      const updateData = {};
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }
      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }
      if (data.parent_category_id !== undefined) {
        updateData.parent_category_id = data.parent_category_id || null;
      }
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }

      logger.info(`[productCategoryService] Atualizando categoria ${id}`);
      const result = await productCategoryRepository.update(id, updateData);

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao atualizar categoria:',
          result.error
        );
        return { data: null, error: result.error };
      }

      logger.info(`[productCategoryService] Categoria ${id} atualizada`);
      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Deletar categoria (soft delete)
   * @param {string} id - ID da categoria
   * @returns {Promise<{data, error}>}
   */
  async delete(id) {
    try {
      if (!id) {
        return { data: null, error: 'ID é obrigatório' };
      }

      logger.info(`[productCategoryService] Deletando categoria ${id}`);

      // Soft delete - marca como inativa
      const result = await productCategoryRepository.update(id, {
        is_active: false,
      });

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao deletar categoria:',
          result.error
        );
        return { data: null, error: result.error };
      }

      logger.info(`[productCategoryService] Categoria ${id} deletada`);
      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Buscar categorias de receita (Revenue) para vincular como pai
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data, error}>}
   */
  async getRevenueCategories(unitId) {
    try {
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      logger.info(
        `[productCategoryService] Buscando categorias de receita para unidade ${unitId}`
      );
      const result =
        await productCategoryRepository.getRevenueCategories(unitId);

      if (result.error) {
        logger.error(
          '[productCategoryService] Erro ao buscar categorias de receita:',
          result.error
        );
        return { data: null, error: result.error };
      }

      logger.info(
        `[productCategoryService] ${result.data?.length || 0} categorias de receita encontradas`
      );
      return { data: result.data, error: null };
    } catch (err) {
      logger.error('[productCategoryService] Erro inesperado:', err);
      return { data: null, error: err.message };
    }
  },
};
