/**
 * API Route - Product Detail
 * Barber Analytics Pro - v2.0.0
 *
 * @description API endpoints para produto específico
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { productService } from '../../../../lib/services/productService';
import { logger } from '../../../../lib/logger';

/**
 * GET /api/products/:id
 * Buscar produto por ID
 */
export async function GET(request, { params }) {
  try {
    const user = request.user;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    logger.info('API: Getting product', { id, userId: user.id });

    const { data, error } = await productService.getProductById(id, user);

    if (error) {
      logger.error('API: Error getting product', { error });
      return Response.json({ error }, { status: 400 });
    }

    if (!data) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    return Response.json({ data });
  } catch (err) {
    logger.error('API: Exception in GET /api/products/:id', {
      error: err.message,
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/products/:id
 * Atualizar produto
 */
export async function PATCH(request, { params }) {
  try {
    const user = request.user;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    logger.info('API: Updating product', { id, userId: user.id });

    const { data, error } = await productService.updateProduct(id, body, user);

    if (error) {
      logger.error('API: Error updating product', { error });
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (err) {
    logger.error('API: Exception in PATCH /api/products/:id', {
      error: err.message,
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/products/:id
 * Deletar produto (soft delete)
 */
export async function DELETE(request, { params }) {
  try {
    const user = request.user;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    logger.info('API: Deleting product', { id, userId: user.id });

    const { data, error } = await productService.deleteProduct(id, user);

    if (error) {
      logger.error('API: Error deleting product', { error });
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (err) {
    logger.error('API: Exception in DELETE /api/products/:id', {
      error: err.message,
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
