import { supabase } from './supabase';

/**
 * Service para gerenciar produtos e estoque
 */
export class ProductsService {
  /**
   * Busca produtos com filtros
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.unitId - ID da unidade
   * @param {string} filters.search - Termo de busca
   * @param {string} filters.category - Categoria
   * @param {string} filters.brand - Marca
   * @param {boolean} filters.isActive - Status ativo
   * @param {boolean} filters.lowStock - Apenas produtos com estoque baixo
   * @returns {Object} { data: Product[], error: string|null }
   */
  static async getProducts(filters = {}) {
    try {
      const {
        unitId,
        search,
        category,
        brand,
        isActive = true,
        lowStock = false,
      } = filters;

      if (!unitId) {
        return { data: [], error: 'Unit ID é obrigatório' };
      }

      let query = supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          sku,
          category,
          brand,
          cost_price,
          selling_price,
          current_stock,
          min_stock,
          max_stock,
          unit_of_measure,
          supplier_id,
          barcode,
          location,
          notes,
          is_active,
          created_at,
          updated_at
        `
        )
        .eq('unit_id', unitId);

      // Aplicar filtros
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
        );
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (brand) {
        query = query.eq('brand', brand);
      }

      if (lowStock) {
        query = query.lte('current_stock', 'min_stock');
      }

      const { data, error } = await query.order('name');

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Busca um produto por ID
   * @param {string} productId - ID do produto
   * @returns {Object} { data: Product|null, error: string|null }
   */
  static async getProductById(productId) {
    try {
      if (!productId) {
        return { data: null, error: 'Product ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select(
          `
          id,
          name,
          description,
          sku,
          category,
          brand,
          cost_price,
          selling_price,
          current_stock,
          min_stock,
          max_stock,
          unit_of_measure,
          supplier_id,
          barcode,
          location,
          notes,
          is_active,
          created_at,
          updated_at
        `
        )
        .eq('id', productId)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Cria um novo produto
   * @param {Object} productData - Dados do produto
   * @returns {Object} { data: Product|null, error: string|null }
   */
  static async createProduct(productData) {
    try {
      const { data: user } = await supabase.auth.getUser();

      const insertData = {
        unit_id: productData.unitId,
        name: productData.name.trim(),
        description: productData.description?.trim() || null,
        sku: productData.sku?.trim() || null,
        category: productData.category?.trim() || null,
        brand: productData.brand?.trim() || null,
        cost_price: productData.costPrice || 0.0,
        selling_price: productData.sellingPrice || 0.0,
        current_stock: productData.currentStock || 0,
        min_stock: productData.minStock || 0,
        max_stock: productData.maxStock || 0,
        unit_of_measure: productData.unitOfMeasure || 'unidade',
        supplier_id: productData.supplierId || null,
        barcode: productData.barcode?.trim() || null,
        location: productData.location?.trim() || null,
        notes: productData.notes?.trim() || null,
        is_active: true,
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Atualiza um produto
   * @param {string} productId - ID do produto
   * @param {Object} updateData - Dados para atualização
   * @returns {Object} { data: Product|null, error: string|null }
   */
  static async updateProduct(productId, updateData) {
    try {
      if (!productId) {
        return { data: null, error: 'Product ID é obrigatório' };
      }

      const cleanData = {};

      if (updateData.name !== undefined)
        cleanData.name = updateData.name.trim();
      if (updateData.description !== undefined)
        cleanData.description = updateData.description?.trim() || null;
      if (updateData.sku !== undefined)
        cleanData.sku = updateData.sku?.trim() || null;
      if (updateData.category !== undefined)
        cleanData.category = updateData.category?.trim() || null;
      if (updateData.brand !== undefined)
        cleanData.brand = updateData.brand?.trim() || null;
      if (updateData.costPrice !== undefined)
        cleanData.cost_price = updateData.costPrice;
      if (updateData.sellingPrice !== undefined)
        cleanData.selling_price = updateData.sellingPrice;
      if (updateData.currentStock !== undefined)
        cleanData.current_stock = updateData.currentStock;
      if (updateData.minStock !== undefined)
        cleanData.min_stock = updateData.minStock;
      if (updateData.maxStock !== undefined)
        cleanData.max_stock = updateData.maxStock;
      if (updateData.unitOfMeasure !== undefined)
        cleanData.unit_of_measure = updateData.unitOfMeasure;
      if (updateData.supplierId !== undefined)
        cleanData.supplier_id = updateData.supplierId || null;
      if (updateData.barcode !== undefined)
        cleanData.barcode = updateData.barcode?.trim() || null;
      if (updateData.location !== undefined)
        cleanData.location = updateData.location?.trim() || null;
      if (updateData.notes !== undefined)
        cleanData.notes = updateData.notes?.trim() || null;
      if (updateData.isActive !== undefined)
        cleanData.is_active = updateData.isActive;

      const { data, error } = await supabase
        .from('products')
        .update(cleanData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Exclui um produto (soft delete)
   * @param {string} productId - ID do produto
   * @returns {Object} { success: boolean, error: string|null }
   */
  static async deleteProduct(productId) {
    try {
      if (!productId) {
        return { success: false, error: 'Product ID é obrigatório' };
      }

      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Busca movimentações de um produto
   * @param {string} productId - ID do produto
   * @param {Object} filters - Filtros de busca
   * @returns {Object} { data: ProductMovement[], error: string|null }
   */
  static async getProductMovements(productId, filters = {}) {
    try {
      if (!productId) {
        return { data: [], error: 'Product ID é obrigatório' };
      }

      const { startDate, endDate, movementType } = filters;

      let query = supabase
        .from('product_movements')
        .select(
          `
          id,
          movement_type,
          quantity,
          unit_cost,
          total_cost,
          reason,
          reference_document,
          movement_date,
          notes,
          created_at
        `
        )
        .eq('product_id', productId)
        .order('movement_date', { ascending: false });

      if (startDate) {
        query = query.gte('movement_date', startDate);
      }

      if (endDate) {
        query = query.lte('movement_date', endDate);
      }

      if (movementType) {
        query = query.eq('movement_type', movementType);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Registra uma movimentação de estoque
   * @param {Object} movementData - Dados da movimentação
   * @returns {Object} { data: ProductMovement|null, error: string|null }
   */
  static async createProductMovement(movementData) {
    try {
      const { data: user } = await supabase.auth.getUser();

      const insertData = {
        product_id: movementData.productId,
        unit_id: movementData.unitId,
        movement_type: movementData.movementType,
        quantity: movementData.quantity,
        unit_cost: movementData.unitCost || 0.0,
        total_cost: movementData.totalCost || 0.0,
        reason: movementData.reason?.trim() || null,
        reference_document: movementData.referenceDocument?.trim() || null,
        supplier_id: movementData.supplierId || null,
        party_id: movementData.partyId || null,
        movement_date:
          movementData.movementDate || new Date().toISOString().split('T')[0],
        notes: movementData.notes?.trim() || null,
        created_by: user?.id || null,
      };

      const { data, error } = await supabase
        .from('product_movements')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca estatísticas de estoque
   * @param {string} unitId - ID da unidade
   * @returns {Object} { data: StockStats, error: string|null }
   */
  static async getStockStats(unitId) {
    try {
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select(
          'current_stock, min_stock, cost_price, selling_price, is_active'
        )
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (error) {
        return { data: null, error: error.message };
      }

      const stats = {
        totalProducts: data.length,
        totalValue: data.reduce(
          (sum, product) => sum + product.current_stock * product.cost_price,
          0
        ),
        lowStockProducts: data.filter(
          product => product.current_stock <= product.min_stock
        ).length,
        outOfStockProducts: data.filter(product => product.current_stock === 0)
          .length,
        totalStockValue: data.reduce(
          (sum, product) => sum + product.current_stock * product.selling_price,
          0
        ),
      };

      return { data: stats, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Busca categorias únicas de produtos
   * @param {string} unitId - ID da unidade
   * @returns {Object} { data: string[], error: string|null }
   */
  static async getProductCategories(unitId) {
    try {
      if (!unitId) {
        return { data: [], error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .not('category', 'is', null);

      if (error) {
        return { data: [], error: error.message };
      }

      const categories = [
        ...new Set(data.map(item => item.category).filter(Boolean)),
      ];
      return { data: categories, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  /**
   * Busca marcas únicas de produtos
   * @param {string} unitId - ID da unidade
   * @returns {Object} { data: string[], error: string|null }
   */
  static async getProductBrands(unitId) {
    try {
      if (!unitId) {
        return { data: [], error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select('brand')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .not('brand', 'is', null);

      if (error) {
        return { data: [], error: error.message };
      }

      const brands = [...new Set(data.map(item => item.brand).filter(Boolean))];
      return { data: brands, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }
}

export const productsService = ProductsService;
