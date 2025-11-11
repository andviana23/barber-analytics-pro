/**
 * 📊 Serviço de Categorização de Receitas
 *
 * Categoriza receitas do sistema em:
 * - Assinaturas: receitas da categoria "Assinatura"
 * - Produtos: receitas de produtos (Cosmeticos + Comodidades)
 * - Avulso: serviços sem assinatura (categoria "Avulso")
 *
 * @module revenueCategorizationService
 * @author Andrey Viana
 * @since 2025-11-11
 */

import { supabase } from '../cache';
import { logger } from '../logger';

export interface CategorizedRevenue {
  subscriptions: number; // Assinaturas
  products: number; // Produtos (Cosmeticos + Comodidades)
  walkIns: number; // Avulso (serviços sem assinatura)
  total: number; // Total geral
}

export interface CategoryBreakdown {
  subscriptions: {
    count: number;
    value: number;
    avgTicket: number;
  };
  products: {
    count: number;
    value: number;
    avgTicket: number;
    cosmetics: number;
    amenities: number;
  };
  walkIns: {
    count: number;
    value: number;
    avgTicket: number;
  };
  total: {
    count: number;
    value: number;
    avgTicket: number;
  };
}

/**
 * Categoriza receitas por tipo (simples)
 *
 * @param unitId - ID da unidade
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Receitas categorizadas
 */
export async function categorizeRevenues(
  unitId: string,
  startDate: Date,
  endDate: Date
): Promise<CategorizedRevenue> {
  try {
    // Buscar receitas do período
    const { data: revenues, error } = await supabase
      .from('revenues')
      .select(
        `
        id,
        value,
        type,
        category:categories(name)
      `
      )
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
      logger.error('Erro ao buscar receitas', {
        error,
        unitId,
        startDate,
        endDate,
      });
      throw new Error(`Erro ao buscar receitas: ${error.message}`);
    }

    if (!revenues || revenues.length === 0) {
      return {
        subscriptions: 0,
        products: 0,
        walkIns: 0,
        total: 0,
      };
    }

    // Categorizar
    const categorized: CategorizedRevenue = {
      subscriptions: 0,
      products: 0,
      walkIns: 0,
      total: 0,
    };

    revenues.forEach((rev: any) => {
      const value = Number(rev.value) || 0;
      categorized.total += value;

      const categoryName = rev.category?.name?.toLowerCase() || '';

      // Assinaturas
      if (
        categoryName.includes('assinatura') ||
        categoryName.includes('subscription')
      ) {
        categorized.subscriptions += value;
      }
      // Produtos
      else if (
        categoryName.includes('cosmetico') ||
        categoryName.includes('comodidade') ||
        rev.type === 'product'
      ) {
        categorized.products += value;
      }
      // Avulso (serviços sem assinatura)
      else if (categoryName.includes('avulso') || rev.type === 'service') {
        categorized.walkIns += value;
      }
    });

    logger.info('Receitas categorizadas', {
      unitId,
      startDate,
      endDate,
      total: revenues.length,
      categorized,
    });

    return categorized;
  } catch (error: any) {
    logger.error('Erro ao categorizar receitas', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Categoriza receitas com detalhamento completo
 *
 * @param unitId - ID da unidade
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Detalhamento completo por categoria
 */
export async function categorizeRevenuesDetailed(
  unitId: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryBreakdown> {
  try {
    // Buscar receitas do período
    const { data: revenues, error } = await supabase
      .from('revenues')
      .select(
        `
        id,
        value,
        type,
        category:categories(name)
      `
      )
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (error) {
      logger.error('Erro ao buscar receitas detalhadas', { error, unitId });
      throw new Error(`Erro ao buscar receitas: ${error.message}`);
    }

    if (!revenues || revenues.length === 0) {
      return {
        subscriptions: { count: 0, value: 0, avgTicket: 0 },
        products: {
          count: 0,
          value: 0,
          avgTicket: 0,
          cosmetics: 0,
          amenities: 0,
        },
        walkIns: { count: 0, value: 0, avgTicket: 0 },
        total: { count: 0, value: 0, avgTicket: 0 },
      };
    }

    // Inicializar contadores
    const breakdown: CategoryBreakdown = {
      subscriptions: { count: 0, value: 0, avgTicket: 0 },
      products: {
        count: 0,
        value: 0,
        avgTicket: 0,
        cosmetics: 0,
        amenities: 0,
      },
      walkIns: { count: 0, value: 0, avgTicket: 0 },
      total: { count: revenues.length, value: 0, avgTicket: 0 },
    };

    // Categorizar
    revenues.forEach((rev: any) => {
      const value = Number(rev.value) || 0;
      breakdown.total.value += value;

      const categoryName = rev.category?.name?.toLowerCase() || '';

      // Assinaturas
      if (
        categoryName.includes('assinatura') ||
        categoryName.includes('subscription')
      ) {
        breakdown.subscriptions.count++;
        breakdown.subscriptions.value += value;
      }
      // Produtos
      else if (
        categoryName.includes('cosmetico') ||
        categoryName.includes('comodidade') ||
        rev.type === 'product'
      ) {
        breakdown.products.count++;
        breakdown.products.value += value;

        if (categoryName.includes('cosmetico')) {
          breakdown.products.cosmetics += value;
        } else if (categoryName.includes('comodidade')) {
          breakdown.products.amenities += value;
        }
      }
      // Avulso
      else if (categoryName.includes('avulso') || rev.type === 'service') {
        breakdown.walkIns.count++;
        breakdown.walkIns.value += value;
      }
    });

    // Calcular tickets médios
    breakdown.subscriptions.avgTicket =
      breakdown.subscriptions.count > 0
        ? breakdown.subscriptions.value / breakdown.subscriptions.count
        : 0;

    breakdown.products.avgTicket =
      breakdown.products.count > 0
        ? breakdown.products.value / breakdown.products.count
        : 0;

    breakdown.walkIns.avgTicket =
      breakdown.walkIns.count > 0
        ? breakdown.walkIns.value / breakdown.walkIns.count
        : 0;

    breakdown.total.avgTicket =
      breakdown.total.count > 0
        ? breakdown.total.value / breakdown.total.count
        : 0;

    logger.info('Receitas detalhadas', { unitId, breakdown });

    return breakdown;
  } catch (error: any) {
    logger.error('Erro ao categorizar receitas detalhadas', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Obtém receitas de um dia específico
 *
 * @param unitId - ID da unidade
 * @param date - Data específica
 * @returns Receitas categorizadas do dia
 */
export async function getDailyRevenues(
  unitId: string,
  date: Date
): Promise<CategorizedRevenue> {
  return categorizeRevenues(unitId, date, date);
}

/**
 * Obtém receitas de uma semana
 *
 * @param unitId - ID da unidade
 * @param weekStartDate - Data de início da semana (segunda-feira)
 * @returns Receitas categorizadas da semana
 */
export async function getWeeklyRevenues(
  unitId: string,
  weekStartDate: Date
): Promise<CategorizedRevenue> {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6); // Domingo

  return categorizeRevenues(unitId, weekStartDate, weekEndDate);
}

/**
 * Obtém receitas do mês
 *
 * @param unitId - ID da unidade
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Receitas categorizadas do mês
 */
export async function getMonthlyRevenues(
  unitId: string,
  year: number,
  month: number
): Promise<CategorizedRevenue> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Último dia do mês

  return categorizeRevenues(unitId, startDate, endDate);
}
