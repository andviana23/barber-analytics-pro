/**
 * Product Service
 * Barber Analytics Pro - v2.0.0
 *
 * @module ProductService
 * @description Regras de negócio para gerenciamento de produtos
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { productRepository } from '../repositories/productRepository.js';
import {
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponseDTO,
  ProductFiltersDTO,
} from '../dtos/productDTO.js';
import { logger } from '../logger.js';
import { supabaseAdmin } from '../supabaseAdmin.js';

// ========================================
// CREATE
// ========================================

/**
 * Cria um novo produto
 * @param {Object} input - Dados do produto
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function createProduct(input, user) {
  try {
    logger.info('Service: Creating product', { input, userId: user.id });

    // Validar DTO
    const dto = new CreateProductDTO({
      ...input,
      created_by: user.id,
    });

    const validation = dto.validate();
    if (!validation.isValid) {
      return {
        data: null,
        error: validation.errors.join(', '),
      };
    }

    // Verificar permissão
    const canManage = await canManageProducts(user, input.unit_id);
    if (!canManage) {
      return {
        data: null,
        error: 'Sem permissão para gerenciar produtos desta unidade',
      };
    }

    // Verificar SKU único (se fornecido)
    if (dto.sku) {
      const { data: existing } = await productRepository.findBySKU(
        dto.sku,
        dto.unit_id
      );

      if (existing) {
        return {
          data: null,
          error: `SKU "${dto.sku}" já está em uso nesta unidade`,
        };
      }
    }

    // Verificar código de barras único (se fornecido)
    if (dto.barcode) {
      const { data: existing } = await productRepository.findByBarcode(
        dto.barcode
      );

      if (existing && existing.unit_id === dto.unit_id) {
        return {
          data: null,
          error: `Código de barras "${dto.barcode}" já está em uso`,
        };
      }
    }

    // Criar produto
    const result = await productRepository.create(dto.toObject());

    if (result.error) {
      return result;
    }

    // Formatar resposta
    const response = new ProductResponseDTO(result.data);

    logger.info('Service: Product created successfully', {
      id: response.id,
      name: response.name,
    });

    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception creating product', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

// ========================================
// READ
// ========================================

/**
 * Busca produto por ID
 * @param {string} id - UUID do produto
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProductById(id, user) {
  try {
    logger.info('Service: Getting product by ID', { id, userId: user.id });

    const result = await productRepository.findById(id);

    if (result.error) {
      return result;
    }

    if (!result.data) {
      return { data: null, error: 'Produto não encontrado' };
    }

    // Verificar permissão
    const canView = await canManageProducts(user, result.data.unit_id);
    if (!canView) {
      return {
        data: null,
        error: 'Sem permissão para visualizar este produto',
      };
    }

    const response = new ProductResponseDTO(result.data);
    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception getting product', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Lista produtos com filtros e paginação
 * @param {Object} filters - Filtros de busca
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Array|null, error: string|null, pagination: Object}>}
 */
export async function getProducts(filters, user) {
  try {
    logger.info('Service: Getting products', { filters, userId: user.id });

    // Validar e aplicar filtros
    const filtersDTO = new ProductFiltersDTO(filters);
    const validation = filtersDTO.validate();

    if (!validation.isValid) {
      return {
        data: null,
        error: validation.errors.join(', '),
        pagination: null,
      };
    }

    // Filtrar apenas unidades do usuário se não for admin
    if (!filtersDTO.unit_id) {
      const userUnits = await getUserUnits(user);
      if (userUnits.length === 0) {
        return {
          data: [],
          error: null,
          pagination: {
            page: 1,
            page_size: filtersDTO.page_size,
            total: 0,
            total_pages: 0,
          },
        };
      }

      // Se usuário tem acesso a múltiplas unidades, buscar de todas
      // (Implementação futura: buscar de múltiplas unidades)
    }

    const result = await productRepository.findAll(filtersDTO.toObject());

    if (result.error) {
      return { data: null, error: result.error, pagination: null };
    }

    // Formatar resposta
    const products = result.data.map(product =>
      new ProductResponseDTO(product).toObject()
    );

    const pagination = {
      page: filtersDTO.page,
      page_size: filtersDTO.page_size,
      total: result.count,
      total_pages: Math.ceil(result.count / filtersDTO.page_size),
    };

    return { data: products, error: null, pagination };
  } catch (error) {
    logger.error('Service: Exception getting products', {
      error: error.message,
    });
    return { data: null, error: error.message, pagination: null };
  }
}

/**
 * Busca produtos com estoque baixo
 * @param {string} unitId - UUID da unidade
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getLowStockProducts(unitId, user) {
  try {
    logger.info('Service: Getting low stock products', {
      unitId,
      userId: user.id,
    });

    // Verificar permissão
    const canView = await canManageProducts(user, unitId);
    if (!canView) {
      return {
        data: null,
        error: 'Sem permissão para visualizar produtos desta unidade',
      };
    }

    const result = await productRepository.findLowStock(unitId);

    if (result.error) {
      return result;
    }

    const products = result.data.map(product =>
      new ProductResponseDTO(product).toObject()
    );

    return { data: products, error: null };
  } catch (error) {
    logger.error('Service: Exception getting low stock products', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Busca produtos em falta (estoque zero)
 * @param {string} unitId - UUID da unidade
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export async function getOutOfStockProducts(unitId, user) {
  try {
    logger.info('Service: Getting out of stock products', {
      unitId,
      userId: user.id,
    });

    const canView = await canManageProducts(user, unitId);
    if (!canView) {
      return {
        data: null,
        error: 'Sem permissão para visualizar produtos desta unidade',
      };
    }

    const result = await productRepository.findOutOfStock(unitId);

    if (result.error) {
      return result;
    }

    const products = result.data.map(product =>
      new ProductResponseDTO(product).toObject()
    );

    return { data: products, error: null };
  } catch (error) {
    logger.error('Service: Exception getting out of stock products', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Retorna estatísticas de produtos
 * @param {string} unitId - UUID da unidade
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getProductStatistics(unitId, user) {
  try {
    logger.info('Service: Getting product statistics', {
      unitId,
      userId: user.id,
    });

    const canView = await canManageProducts(user, unitId);
    if (!canView) {
      return {
        data: null,
        error: 'Sem permissão para visualizar estatísticas desta unidade',
      };
    }

    return await productRepository.getStatistics(unitId);
  } catch (error) {
    logger.error('Service: Exception getting product statistics', {
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
 * @param {Object} updates - Dados para atualizar
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function updateProduct(id, updates, user) {
  try {
    logger.info('Service: Updating product', { id, updates, userId: user.id });

    // Buscar produto atual
    const { data: current, error: fetchError } =
      await productRepository.findById(id);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!current) {
      return { data: null, error: 'Produto não encontrado' };
    }

    // Verificar permissão
    const canManage = await canManageProducts(user, current.unit_id);
    if (!canManage) {
      return {
        data: null,
        error: 'Sem permissão para atualizar este produto',
      };
    }

    // Validar DTO
    const dto = new UpdateProductDTO(updates);
    const validation = dto.validate();

    if (!validation.isValid) {
      return {
        data: null,
        error: validation.errors.join(', '),
      };
    }

    // Verificar SKU único (se alterado)
    if (dto.sku && dto.sku !== current.sku) {
      const { data: existing } = await productRepository.findBySKU(
        dto.sku,
        current.unit_id
      );

      if (existing && existing.id !== id) {
        return {
          data: null,
          error: `SKU "${dto.sku}" já está em uso nesta unidade`,
        };
      }
    }

    // Verificar código de barras único (se alterado)
    if (dto.barcode && dto.barcode !== current.barcode) {
      const { data: existing } = await productRepository.findByBarcode(
        dto.barcode
      );

      if (
        existing &&
        existing.id !== id &&
        existing.unit_id === current.unit_id
      ) {
        return {
          data: null,
          error: `Código de barras "${dto.barcode}" já está em uso`,
        };
      }
    }

    // Atualizar produto
    const result = await productRepository.update(id, dto.toObject());

    if (result.error) {
      return result;
    }

    const response = new ProductResponseDTO(result.data);

    logger.info('Service: Product updated successfully', { id });
    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception updating product', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Atualiza o estoque de um produto
 * ⚠️ Usar apenas para ajustes manuais. Movimentações devem usar stock_movements
 * @param {string} id - UUID do produto
 * @param {number} quantity - Nova quantidade
 * @param {string} operation - 'SET', 'ADD', 'SUBTRACT'
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function adjustStock(id, quantity, operation, user) {
  try {
    logger.info('Service: Adjusting stock', {
      id,
      quantity,
      operation,
      userId: user.id,
    });

    // Buscar produto
    const { data: product, error: fetchError } =
      await productRepository.findById(id);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!product) {
      return { data: null, error: 'Produto não encontrado' };
    }

    // Verificar permissão
    const canManage = await canManageProducts(user, product.unit_id);
    if (!canManage) {
      return {
        data: null,
        error: 'Sem permissão para ajustar estoque deste produto',
      };
    }

    // Validar operação
    const validOperations = ['SET', 'ADD', 'SUBTRACT'];
    if (!validOperations.includes(operation)) {
      return { data: null, error: 'Operação inválida' };
    }

    if (quantity < 0 && operation === 'SET') {
      return { data: null, error: 'Quantidade não pode ser negativa' };
    }

    // Atualizar estoque
    const result = await productRepository.updateStock(id, quantity, operation);

    if (result.error) {
      return result;
    }

    const response = new ProductResponseDTO(result.data);

    logger.info('Service: Stock adjusted successfully', {
      id,
      old_stock: product.current_stock,
      new_stock: result.data.current_stock,
    });

    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception adjusting stock', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

// ========================================
// DELETE
// ========================================

/**
 * Inativa um produto (soft delete)
 * @param {string} id - UUID do produto
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function deleteProduct(id, user) {
  try {
    logger.info('Service: Deleting product', { id, userId: user.id });

    // Buscar produto
    const { data: product, error: fetchError } =
      await productRepository.findById(id);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!product) {
      return { data: null, error: 'Produto não encontrado' };
    }

    // Verificar permissão
    const canManage = await canManageProducts(user, product.unit_id);
    if (!canManage) {
      return {
        data: null,
        error: 'Sem permissão para excluir este produto',
      };
    }

    // Soft delete
    const result = await productRepository.softDelete(id);

    if (result.error) {
      return result;
    }

    const response = new ProductResponseDTO(result.data);

    logger.info('Service: Product deleted successfully', { id });
    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception deleting product', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

/**
 * Restaura um produto inativo
 * @param {string} id - UUID do produto
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function restoreProduct(id, user) {
  try {
    logger.info('Service: Restoring product', { id, userId: user.id });

    // Buscar produto
    const { data: product, error: fetchError } =
      await productRepository.findById(id);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!product) {
      return { data: null, error: 'Produto não encontrado' };
    }

    // Verificar permissão
    const canManage = await canManageProducts(user, product.unit_id);
    if (!canManage) {
      return {
        data: null,
        error: 'Sem permissão para restaurar este produto',
      };
    }

    // Restaurar
    const result = await productRepository.restore(id);

    if (result.error) {
      return result;
    }

    const response = new ProductResponseDTO(result.data);

    logger.info('Service: Product restored successfully', { id });
    return { data: response.toObject(), error: null };
  } catch (error) {
    logger.error('Service: Exception restoring product', {
      error: error.message,
    });
    return { data: null, error: error.message };
  }
}

// ========================================
// PERMISSIONS
// ========================================

/**
 * Verifica se o usuário pode gerenciar produtos de uma unidade
 * @param {Object} user - Usuário autenticado
 * @param {string} unitId - UUID da unidade
 * @returns {Promise<boolean>}
 */
async function canManageProducts(user, unitId) {
  try {
    // Admins podem gerenciar tudo
    if (user.role === 'admin' || user.role === 'administrador') {
      return true;
    }

    // Gerentes podem gerenciar produtos da sua unidade
    if (user.role === 'gerente' || user.role === 'manager') {
      const { data } = await supabaseAdmin
        .from('professionals')
        .select('unit_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      return data && data.unit_id === unitId;
    }

    // Barbeiros podem apenas visualizar (não criar/editar/excluir)
    // Recepcionistas não têm acesso
    return false;
  } catch {
    return false;
  }
}

/**
 * Retorna as unidades que o usuário tem acesso
 * @param {Object} user - Usuário autenticado
 * @returns {Promise<Array<string>>}
 */
async function getUserUnits(user) {
  try {
    if (user.role === 'admin' || user.role === 'administrador') {
      // Admin tem acesso a todas as unidades
      const { data } = await supabaseAdmin
        .from('units')
        .select('id')
        .eq('is_active', true);

      return data ? data.map(u => u.id) : [];
    }

    // Outros roles: buscar unidades vinculadas
    const { data } = await supabaseAdmin
      .from('professionals')
      .select('unit_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return data ? data.map(p => p.unit_id) : [];
  } catch {
    return [];
  }
}

// ========================================
// EXPORTS
// ========================================

export const productService = {
  createProduct,
  getProductById,
  getProducts,
  getLowStockProducts,
  getOutOfStockProducts,
  getProductStatistics,
  updateProduct,
  adjustStock,
  deleteProduct,
  restoreProduct,
};

export default productService;
