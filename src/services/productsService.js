import { supabase } from './supabase';

const PRODUCT_SELECT_FIELDS = `
  id,
  unit_id,
  name,
  description,
  sku,
  category,
  category_id,
  brand,
  cost_price,
  selling_price,
  current_stock,
  min_stock,
  max_stock,
  unit_measurement,
  supplier_id,
  barcode,
  location,
  notes,
  is_active,
  created_by,
  created_at,
  updated_at
`;

const PRODUCT_MOVEMENT_SELECT_FIELDS = `
  id,
  product_id,
  unit_id,
  movement_type,
  quantity,
  unit_cost,
  total_cost,
  reason,
  reference_document,
  supplier_id,
  party_id,
  movement_date,
  notes,
  created_by,
  created_at
`;

const VALID_STOCK_OPERATIONS = ['SET', 'ADD', 'SUBTRACT'];

const sanitizeText = value => {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveUnitId = input => input?.unit_id || input?.unitId || null;

const nowIso = () => new Date().toISOString();

/**
 * Service para gerenciar produtos e estoque diretamente via Supabase
 */
export class ProductsService {
  /**
   * Busca produtos com filtros e paginação simples
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: {data: Product[], pagination: Object}|null, error: string|null}>}
   */
  static async getProducts(filters = {}) {
    try {
      const unitId = resolveUnitId(filters);

      if (!unitId) {
        return {
          data: null,
          error: 'Unit ID é obrigatório',
          pagination: null,
        };
      }

      const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
      const pageSize =
        Number(filters.page_size) > 0 ? Number(filters.page_size) : 25;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('products')
        .select(PRODUCT_SELECT_FIELDS, { count: 'exact' })
        .eq('unit_id', unitId);

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.search?.trim()) {
        const term = filters.search.trim();
        query = query.or(
          `name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%,category.ilike.%${term}%,brand.ilike.%${term}%`
        );
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }

      const { data, error, count } = await query
        .order('name', { ascending: true })
        .range(from, to);

      if (error) {
        return { data: null, error: error.message, pagination: null };
      }

      return {
        data: {
          data: data || [],
          pagination: {
            page,
            page_size: pageSize,
            total: count ?? data?.length ?? 0,
            total_pages:
              count && pageSize ? Math.max(1, Math.ceil(count / pageSize)) : 1,
          },
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err.message, pagination: null };
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
        .select(PRODUCT_SELECT_FIELDS)
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
      const unitId = resolveUnitId(productData);
      const name = sanitizeText(productData.name);

      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      if (!name) {
        return { data: null, error: 'Nome do produto é obrigatório' };
      }

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const timestamp = nowIso();
      const payload = {
        unit_id: unitId,
        name,
        description: sanitizeText(productData.description),
        sku: sanitizeText(productData.sku),
        category: sanitizeText(productData.category),
        brand: sanitizeText(productData.brand),
        cost_price: normalizeNumber(productData.costPrice),
        selling_price: normalizeNumber(productData.sellingPrice),
        current_stock: normalizeNumber(productData.currentStock),
        min_stock: normalizeNumber(productData.minStock),
        max_stock: normalizeNumber(productData.maxStock),
        unit_measurement: sanitizeText(productData.unitOfMeasure) || 'UN',
        category_id: sanitizeText(productData.category_id),
        supplier_id: sanitizeText(productData.supplierId),
        barcode: sanitizeText(productData.barcode),
        location: sanitizeText(productData.location),
        notes: sanitizeText(productData.notes),
        is_active: productData.is_active ?? true,
        created_by: authData.user.id,
        created_at: timestamp,
        updated_at: timestamp,
      };

      const { data, error } = await supabase
        .from('products')
        .insert(payload)
        .select(PRODUCT_SELECT_FIELDS)
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
  static async updateProduct(productId, updateData = {}) {
    try {
      if (!productId) {
        return { data: null, error: 'Product ID é obrigatório' };
      }

      const payload = {};

      if (updateData.name !== undefined)
        payload.name = sanitizeText(updateData.name);
      if (updateData.description !== undefined)
        payload.description = sanitizeText(updateData.description);
      if (updateData.sku !== undefined)
        payload.sku = sanitizeText(updateData.sku);
      if (updateData.category !== undefined)
        payload.category = sanitizeText(updateData.category);
      if (updateData.brand !== undefined)
        payload.brand = sanitizeText(updateData.brand);
      if (updateData.costPrice !== undefined)
        payload.cost_price = normalizeNumber(updateData.costPrice, null);
      if (updateData.sellingPrice !== undefined)
        payload.selling_price = normalizeNumber(updateData.sellingPrice, null);
      if (updateData.currentStock !== undefined)
        payload.current_stock = normalizeNumber(updateData.currentStock, null);
      if (updateData.minStock !== undefined)
        payload.min_stock = normalizeNumber(updateData.minStock, null);
      if (updateData.maxStock !== undefined)
        payload.max_stock = normalizeNumber(updateData.maxStock, null);
      if (updateData.unitOfMeasure !== undefined)
        payload.unit_measurement =
          sanitizeText(updateData.unitOfMeasure) || 'UN';
      if (updateData.category_id !== undefined)
        payload.category_id = sanitizeText(updateData.category_id);
      if (updateData.supplierId !== undefined)
        payload.supplier_id = sanitizeText(updateData.supplierId);
      if (updateData.barcode !== undefined)
        payload.barcode = sanitizeText(updateData.barcode);
      if (updateData.location !== undefined)
        payload.location = sanitizeText(updateData.location);
      if (updateData.notes !== undefined)
        payload.notes = sanitizeText(updateData.notes);
      if (updateData.isActive !== undefined)
        payload.is_active = updateData.isActive;

      if (Object.keys(payload).length === 0) {
        return { data: null, error: 'Nenhuma alteração fornecida' };
      }

      payload.updated_at = nowIso();

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select(PRODUCT_SELECT_FIELDS)
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
        return { data: null, error: 'Product ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: nowIso() })
        .eq('id', productId)
        .select(PRODUCT_SELECT_FIELDS)
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
   * Restaura um produto inativo
   */
  static async restoreProduct(productId) {
    try {
      if (!productId) {
        return { data: null, error: 'Product ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .update({ is_active: true, updated_at: nowIso() })
        .eq('id', productId)
        .select(PRODUCT_SELECT_FIELDS)
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
   * Ajusta o estoque manualmente
   */
  static async adjustStock(productId, quantity, operation = 'SET') {
    try {
      if (!productId) {
        return { data: null, error: 'Product ID é obrigatório' };
      }

      if (!VALID_STOCK_OPERATIONS.includes(operation)) {
        return { data: null, error: 'Operação de estoque inválida' };
      }

      const normalizedQuantity = Number(quantity);
      if (!Number.isFinite(normalizedQuantity)) {
        return { data: null, error: 'Quantidade inválida' };
      }

      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      let newStock = product?.current_stock ?? 0;

      if (operation === 'SET') newStock = normalizedQuantity;
      if (operation === 'ADD') newStock += normalizedQuantity;
      if (operation === 'SUBTRACT') newStock -= normalizedQuantity;

      if (newStock < 0) {
        return { data: null, error: 'Estoque não pode ficar negativo' };
      }

      const { data, error } = await supabase
        .from('products')
        .update({ current_stock: newStock, updated_at: nowIso() })
        .eq('id', productId)
        .select(PRODUCT_SELECT_FIELDS)
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

      let query = supabase
        .from('product_movements')
        .select(PRODUCT_MOVEMENT_SELECT_FIELDS)
        .eq('product_id', productId)
        .order('movement_date', { ascending: false });

      if (filters.startDate) {
        query = query.gte('movement_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('movement_date', filters.endDate);
      }

      if (filters.movementType) {
        query = query.eq('movement_type', filters.movementType);
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
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const insertData = {
        product_id: movementData.productId,
        unit_id: resolveUnitId(movementData),
        movement_type: movementData.movementType,
        quantity: normalizeNumber(movementData.quantity),
        unit_cost: normalizeNumber(movementData.unitCost),
        total_cost: normalizeNumber(movementData.totalCost),
        reason: sanitizeText(movementData.reason),
        reference_document: sanitizeText(movementData.referenceDocument),
        supplier_id: sanitizeText(movementData.supplierId),
        party_id: sanitizeText(movementData.partyId),
        movement_date: movementData.movementDate || nowIso().split('T')[0],
        notes: sanitizeText(movementData.notes),
        created_by: authData.user.id,
        created_at: nowIso(),
      };

      const { data, error } = await supabase
        .from('product_movements')
        .insert(insertData)
        .select(PRODUCT_MOVEMENT_SELECT_FIELDS)
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
  static async getProductStatistics(unitId) {
    try {
      if (!unitId) {
        return { data: null, error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select('current_stock, min_stock, cost_price, selling_price')
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (error) {
        return { data: null, error: error.message };
      }

      const stats = {
        totalProducts: data?.length || 0,
        totalValue:
          data?.reduce(
            (sum, product) =>
              sum + (product.current_stock || 0) * (product.cost_price || 0),
            0
          ) || 0,
        lowStockProducts:
          data?.filter(
            product => (product.current_stock || 0) <= (product.min_stock || 0)
          ).length || 0,
        outOfStockProducts:
          data?.filter(product => (product.current_stock || 0) === 0).length ||
          0,
        totalStockValue:
          data?.reduce(
            (sum, product) =>
              sum + (product.current_stock || 0) * (product.selling_price || 0),
            0
          ) || 0,
      };

      return { data: stats, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }

  static async getStockStats(unitId) {
    return this.getProductStatistics(unitId);
  }

  static async getLowStockProducts(unitId) {
    try {
      if (!unitId) {
        return { data: [], error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_FIELDS)
        .eq('unit_id', unitId)
        .eq('is_active', true);

      if (error) {
        return { data: [], error: error.message };
      }

      const filtered = (data || []).filter(
        product => (product.current_stock || 0) <= (product.min_stock || 0)
      );

      return { data: filtered, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }

  static async getOutOfStockProducts(unitId) {
    try {
      if (!unitId) {
        return { data: [], error: 'Unit ID é obrigatório' };
      }

      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT_FIELDS)
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .eq('current_stock', 0);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
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
        ...new Set(data?.map(item => item.category).filter(Boolean) || []),
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

      const brands = [
        ...new Set(data?.map(item => item.brand).filter(Boolean) || []),
      ];
      return { data: brands, error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }
}

export const productsService = ProductsService;
