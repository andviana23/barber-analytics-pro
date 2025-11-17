/**
 * API Route - Products
 * Barber Analytics Pro - v2.0.0
 *
 * @description API endpoints para gerenciamento de produtos
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { productService } from '../../../lib/services/productService';
import { logger } from '../../../lib/logger';

/**
 * GET /api/products
 * Buscar lista de produtos com filtros
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = request.user; // Middleware de auth injeta user

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse filters
    const filters = {
      unit_id: searchParams.get('unit_id'),
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      is_active: searchParams.get('is_active') !== 'false',
      page: parseInt(searchParams.get('page') || '1'),
      page_size: parseInt(searchParams.get('page_size') || '20'),
    };

    logger.info('API: Getting products', { filters, userId: user.id });

    const { data, error } = await productService.getProducts(filters, user);

    if (error) {
      logger.error('API: Error getting products', { error });
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (err) {
    logger.error('API: Exception in GET /api/products', { error: err.message });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Criar novo produto
 */
export async function POST(request) {
  try {
    const user = request.user;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    logger.info('API: Creating product', { name: body.name, userId: user.id });

    const { data, error } = await productService.createProduct(body, user);

    if (error) {
      logger.error('API: Error creating product', { error });
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (err) {
    logger.error('API: Exception in POST /api/products', {
      error: err.message,
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
