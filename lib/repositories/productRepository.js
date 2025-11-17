/**
 * Product Repository
 * Barber Analytics Pro - v2.0.0
 *
 * @module productRepository
 * @description Repository para acesso a dados de produtos (Supabase)
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { supabaseAdmin } from '../supabaseAdmin.js';
import { logger } from '../logger.js';

/**
 * Seletor padrão de campos de produto
 */
const DEFAULT_SELECT = `
  *,
  supplier:suppliers(id, name, cnpj_cpf, phone, email, is_active),
  category_info:product_categories(id, name, description),
  unit:units(id, name, code, city, is_active)
`;

// ========================================
// CREATE
// ========================================

/**
 * Cria um novo produto
 * @param {Object} productData - Dados do produto (validados via DTO)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function create(productData) {
  try {
    logger.info('Creating product', {
      name: productData.name,
      unit_id: productData.unit_id,
      sku: productData.sku,
    });

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      // Tratar erros específicos
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.message.includes('sku')) {
          return {
            data: null,
            error: 'SKU já existe para esta unidade',
          };
        }
        if (error.message.includes('barcode')) {
          return {
            data: null,
            error: 'Código de barras já existe',
          };
        }
      }

      logger.error('Error creating product', { error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Product created successfully', { id: data.id });
    return { data, error: null };
  } catch (error) {
    logger.error('Exception creating product', { error: error.message });
    return { data: null, error: error.message };
  }
}

// ========================================
// READ
// ========================================

/**
 * Busca produto por ID
 * @param {string} id - UUID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function findById(id) {
  try {
    logger.info('Finding product by ID', { id });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error finding product', { error: error.message });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Produto não encontrado' };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Exception finding product', { error: error.message });
    return { data: null, error: error.message };
  }
}

/**
 * Busca produto por SKU em uma unidade específica
 * @param {string} sku - SKU do produto
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function findBySKU(sku, unitId) {
  try {
    logger.info('Finding product by SKU', { sku, unitId });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT)
      .eq('sku', sku.toUpperCase())
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { data: null, error: null };
      }
      logger.error('Error finding product by SKU', { error: error.message });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Exception finding product by SKU', { error: error.message });
    return { data: null, error: error.message };
  }
}

/**
 * Busca produto por código de barras
 * @param {string} barcode - Código de barras
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function findByBarcode(barcode) {
  try {
    logger.info('Finding product by barcode', { barcode });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT)
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      logger.error('Error finding product by barcode', {
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Exception finding product by barcode', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Busca todos os produtos com filtros e paginação
 * @param {Object} filters - Filtros (via ProductFiltersDTO)
 * @returns {Promise<{data: Array|null, error: string|null, count: number}>}
 */
export async function findAll(filters = {}) {
  try {
    logger.info('Finding all products', { filters });

    let query = supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT, { count: 'exact' });

    // Aplicar filtros
    if (filters.unit_id) {
      query = query.eq('unit_id', filters.unit_id);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Filtros de preço
    if (filters.min_price !== null) {
      query = query.gte('selling_price', filters.min_price);
    }

    if (filters.max_price !== null) {
      query = query.lte('selling_price', filters.max_price);
    }

    // Filtro de status de estoque (requer lógica complexa)
    if (filters.stock_status) {
      switch (filters.stock_status) {
        case 'CRITICAL':
          query = query.eq('current_stock', 0);
          break;
        case 'LOW':
          // current_stock > 0 AND current_stock < min_stock
          query = query.gt('current_stock', 0).lt('current_stock', 'min_stock');
          break;
        case 'EXCESS':
          // current_stock > max_stock
          query = query.gt('current_stock', 'max_stock');
          break;
        case 'OK':
          // min_stock <= current_stock <= max_stock
          query = query
            .gte('current_stock', 'min_stock')
            .lte('current_stock', 'max_stock');
          break;
      }
    }

    // Ordenação
    const orderBy = filters.order_by || 'name';
    const orderDirection = filters.order_direction === 'DESC';
    query = query.order(orderBy, { ascending: !orderDirection });

    // Paginação
    if (filters.offset !== undefined && filters.limit !== undefined) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error finding products', { error: error.message });
      return { data: null, error: error.message, count: 0 };
    }

    return { data, error: null, count };
  } catch (error) {
    logger.error('Exception finding products', { error: error.message });
    return { data: null, error: error.message, count: 0 };
  }
}

/**
 * Busca produtos com estoque baixo
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function findLowStock(unitId) {
  try {
    logger.info('Finding low stock products', { unitId });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .gt('min_stock', 0)
      .lt('current_stock', supabaseAdmin.raw('min_stock'))
      .order('current_stock', { ascending: true });

    if (error) {
      logger.error('Error finding low stock products', {
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Exception finding low stock products', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Busca produtos em falta (estoque zero)
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function findOutOfStock(unitId) {
  try {
    logger.info('Finding out of stock products', { unitId });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(DEFAULT_SELECT)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .eq('current_stock', 0)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error finding out of stock products', {
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    logger.error('Exception finding out of stock products', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

// ========================================
// UPDATE
// ========================================

/**
 * Atualiza um produto
 * @param {string} id - UUID do produto
 * @param {Object} updates - Dados para atualizar (via UpdateProductDTO)
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function update(id, updates) {
  try {
    logger.info('Updating product', { id, updates });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      // Tratar erros específicos
      if (error.code === '23505') {
        if (error.message.includes('sku')) {
          return {
            data: null,
            error: 'SKU já existe para esta unidade',
          };
        }
        if (error.message.includes('barcode')) {
          return {
            data: null,
            error: 'Código de barras já existe',
          };
        }
      }

      logger.error('Error updating product', { error: error.message });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Produto não encontrado' };
    }

    logger.info('Product updated successfully', { id });
    return { data, error: null };
  } catch (error) {
    logger.error('Exception updating product', { error: error.message });
    return { data: null, error: error.message };
  }
}

/**
 * Atualiza o estoque atual de um produto
 * @param {string} id - UUID do produto
 * @param {number} quantity - Nova quantidade (pode ser negativa para subtração)
 * @param {string} operation - 'SET', 'ADD', 'SUBTRACT'
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateStock(id, quantity, operation = 'SET') {
  try {
    logger.info('Updating product stock', { id, quantity, operation });

    let updates = {};

    if (operation === 'SET') {
      updates.current_stock = quantity;
    } else if (operation === 'ADD') {
      // Usar função do Postgres para incrementar atomicamente
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('current_stock')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      updates.current_stock = current.current_stock + quantity;
    } else if (operation === 'SUBTRACT') {
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('products')
        .select('current_stock')
        .eq('id', id)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      const newStock = current.current_stock - quantity;
      if (newStock < 0) {
        return {
          data: null,
          error: 'Estoque insuficiente para esta operação',
        };
      }

      updates.current_stock = newStock;
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      logger.error('Error updating product stock', { error: error.message });
      return { data: null, error: error.message };
    }

    logger.info('Product stock updated successfully', {
      id,
      new_stock: data.current_stock,
    });
    return { data, error: null };
  } catch (error) {
    logger.error('Exception updating product stock', { error: error.message });
    return { data: null, error: error.message };
  }
}

// ========================================
// DELETE
// ========================================

/**
 * Soft delete de um produto (is_active = false)
 * @param {string} id - UUID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function softDelete(id) {
  try {
    logger.info('Soft deleting product', { id });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      logger.error('Error soft deleting product', { error: error.message });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Produto não encontrado' };
    }

    logger.info('Product soft deleted successfully', { id });
    return { data, error: null };
  } catch (error) {
    logger.error('Exception soft deleting product', { error: error.message });
    return { data: null, error: error.message };
  }
}

/**
 * Restaura um produto (is_active = true)
 * @param {string} id - UUID do produto
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function restore(id) {
  try {
    logger.info('Restoring product', { id });

    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(DEFAULT_SELECT)
      .single();

    if (error) {
      logger.error('Error restoring product', { error: error.message });
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Produto não encontrado' };
    }

    logger.info('Product restored successfully', { id });
    return { data, error: null };
  } catch (error) {
    logger.error('Exception restoring product', { error: error.message });
    return { data: null, error: error.message };
  }
}

// ========================================
// STATISTICS
// ========================================

/**
 * Retorna estatísticas de produtos de uma unidade
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getStatistics(unitId) {
  try {
    logger.info('Getting product statistics', { unitId });

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('current_stock, min_stock, max_stock, cost_price, selling_price')
      .eq('unit_id', unitId)
      .eq('is_active', true);

    if (error) {
      logger.error('Error getting product statistics', {
        error: error.message,
      });
      return { data: null, error: error.message };
    }

    // Calcular estatísticas
    const stats = {
      total_products: data.length,
      out_of_stock: data.filter(p => p.current_stock === 0).length,
      low_stock: data.filter(
        p =>
          p.min_stock > 0 &&
          p.current_stock > 0 &&
          p.current_stock < p.min_stock
      ).length,
      excess_stock: data.filter(
        p => p.max_stock > 0 && p.current_stock > p.max_stock
      ).length,
      total_stock_value: data.reduce(
        (sum, p) => sum + p.current_stock * p.cost_price,
        0
      ),
      total_stock_value_selling: data.reduce(
        (sum, p) => sum + p.current_stock * p.selling_price,
        0
      ),
    };

    return { data: stats, error: null };
  } catch (error) {
    logger.error('Exception getting product statistics', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

// ========================================
// EXPORTS
// ========================================

export const productRepository = {
  create,
  findById,
  findBySKU,
  findByBarcode,
  findAll,
  findLowStock,
  findOutOfStock,
  update,
  updateStock,
  softDelete,
  restore,
  getStatistics,
};

export default productRepository;
