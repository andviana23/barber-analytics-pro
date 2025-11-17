/**
 * API Route - Product Statistics
 * Barber Analytics Pro - v2.0.0
 *
 * @description API endpoint para estatísticas de produtos
 * @author Andrey Viana
 * @created 2025-11-13
 */

import { productService } from '../../../lib/services/productService';
import { logger } from '../../../lib/logger';

/**
 * GET /api/products-stats?unit_id=xxx
 * Buscar estatísticas de produtos
 */
export async function GET(request) {
  try {
    const user = request.user;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unit_id');

    if (!unitId) {
      return Response.json({ error: 'unit_id is required' }, { status: 400 });
    }

    logger.info('API: Getting product statistics', { unitId, userId: user.id });

    const { data, error } = await productService.getProductStatistics(
      unitId,
      user
    );

    if (error) {
      logger.error('API: Error getting product statistics', { error });
      return Response.json({ error }, { status: 400 });
    }

    return Response.json({ data });
  } catch (err) {
    logger.error('API: Exception in GET /api/products-stats', {
      error: err.message,
    });
    return Response.json({ error: err.message }, { status: 500 });
  }
}
