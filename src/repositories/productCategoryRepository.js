/**
 * @file productCategoryRepository.js
 * @description Repository para acesso aos dados de categorias de produtos
 * @module Repositories/ProductCategories
 * @author Andrey Viana
 * @date 14/11/2025
 */

import { supabase } from '../services/supabase';
import { logger } from '../../lib/logger';

/**
 * Repository de categorias de produtos
 * Acesso direto ao Supabase com RLS ativo
 */
export const productCategoryRepository = {
  /**
   * Buscar todas as categorias ativas
   * @returns {Promise<{data, error}>}
   */
  async findAll() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select(
          `
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        `
        )
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      logger.error(
        '[productCategoryRepository] Erro ao buscar categorias:',
        err
      );
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
      const { data, error } = await supabase
        .from('product_categories')
        .select(
          `
          id,
          name,
          description,
          is_active,
          created_at,
          updated_at
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      logger.error(
        `[productCategoryRepository] Erro ao buscar categoria ${id}:`,
        err
      );
      return { data: null, error: err.message };
    }
  },

  /**
   * Criar nova categoria
   * @param {Object} data - Dados da categoria
   * @returns {Promise<{data, error}>}
   */
  async create(data) {
    try {
      const { data: category, error } = await supabase
        .from('product_categories')
        .insert({
          name: data.name,
          description: data.description,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: category, error: null };
    } catch (err) {
      logger.error('[productCategoryRepository] Erro ao criar categoria:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Atualizar categoria
   * @param {string} id - ID da categoria
   * @param {Object} data - Dados para atualização
   * @returns {Promise<{data, error}>}
   */
  async update(id, data) {
    try {
      const { data: category, error } = await supabase
        .from('product_categories')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data: category, error: null };
    } catch (err) {
      logger.error(
        `[productCategoryRepository] Erro ao atualizar categoria ${id}:`,
        err
      );
      return { data: null, error: err.message };
    }
  },

  /**
   * Buscar categorias de receita (Revenue) da tabela categories
   * Para usar como categoria pai ao criar categoria de produto
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data, error}>}
   */
  async getRevenueCategories(unitId) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(
          `
          id,
          name,
          description,
          category_type,
          parent_id
        `
        )
        .eq('unit_id', unitId)
        .eq('category_type', 'Revenue')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (err) {
      logger.error(
        '[productCategoryRepository] Erro ao buscar categorias de receita:',
        err
      );
      return { data: null, error: err.message };
    }
  },
};
