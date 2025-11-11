/**
 * 📈 Serviço de Comparação de Receitas
 *
 * Compara receitas entre períodos diferentes:
 * - Dia vs mesmo dia da semana anterior
 * - Semana vs semana anterior
 * - Mês vs mês anterior
 *
 * @module revenueComparison
 * @author Andrey Viana
 * @since 2025-11-11
 */

import {
  categorizeRevenues,
  CategorizedRevenue,
} from './revenueCategorizationService';
import { logger } from '../logger';

export interface ComparisonResult {
  current: CategorizedRevenue;
  previous: CategorizedRevenue;
  percentChange: number;
  absoluteChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DetailedComparison extends ComparisonResult {
  subscriptionsChange: number;
  productsChange: number;
  walkInsChange: number;
  analysis: string;
}

/**
 * Compara receita com o mesmo dia da semana anterior
 *
 * @param unitId - ID da unidade
 * @param currentDate - Data atual
 * @returns Comparação com semana anterior
 */
export async function compareWithLastWeek(
  unitId: string,
  currentDate: Date
): Promise<ComparisonResult> {
  try {
    // Data da semana anterior (mesmo dia da semana)
    const lastWeek = new Date(currentDate);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Buscar receitas
    const current = await categorizeRevenues(unitId, currentDate, currentDate);
    const previous = await categorizeRevenues(unitId, lastWeek, lastWeek);

    // Calcular variação
    const percentChange =
      previous.total === 0
        ? current.total > 0
          ? 100
          : 0
        : ((current.total - previous.total) / previous.total) * 100;

    const absoluteChange = current.total - previous.total;

    // Determinar tendência
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) >= 5) {
      trend = percentChange > 0 ? 'up' : 'down';
    }

    logger.info('Comparação semanal calculada', {
      unitId,
      currentDate,
      current: current.total,
      previous: previous.total,
      percentChange,
      trend,
    });

    return {
      current,
      previous,
      percentChange,
      absoluteChange,
      trend,
    };
  } catch (error: any) {
    logger.error('Erro ao comparar com semana anterior', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Compara receita com o dia anterior
 *
 * @param unitId - ID da unidade
 * @param currentDate - Data atual
 * @returns Comparação com dia anterior
 */
export async function compareWithYesterday(
  unitId: string,
  currentDate: Date
): Promise<ComparisonResult> {
  try {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const current = await categorizeRevenues(unitId, currentDate, currentDate);
    const previous = await categorizeRevenues(unitId, yesterday, yesterday);

    const percentChange =
      previous.total === 0
        ? current.total > 0
          ? 100
          : 0
        : ((current.total - previous.total) / previous.total) * 100;

    const absoluteChange = current.total - previous.total;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) >= 5) {
      trend = percentChange > 0 ? 'up' : 'down';
    }

    return {
      current,
      previous,
      percentChange,
      absoluteChange,
      trend,
    };
  } catch (error: any) {
    logger.error('Erro ao comparar com dia anterior', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Compara receita do mês atual com o mês anterior
 *
 * @param unitId - ID da unidade
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Comparação mensal
 */
export async function compareWithLastMonth(
  unitId: string,
  year: number,
  month: number
): Promise<ComparisonResult> {
  try {
    // Mês atual
    const currentStart = new Date(year, month - 1, 1);
    const currentEnd = new Date(year, month, 0);

    // Mês anterior
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;
    const previousStart = new Date(previousYear, previousMonth - 1, 1);
    const previousEnd = new Date(previousYear, previousMonth, 0);

    // Buscar receitas
    const current = await categorizeRevenues(unitId, currentStart, currentEnd);
    const previous = await categorizeRevenues(
      unitId,
      previousStart,
      previousEnd
    );

    const percentChange =
      previous.total === 0
        ? current.total > 0
          ? 100
          : 0
        : ((current.total - previous.total) / previous.total) * 100;

    const absoluteChange = current.total - previous.total;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) >= 5) {
      trend = percentChange > 0 ? 'up' : 'down';
    }

    logger.info('Comparação mensal calculada', {
      unitId,
      currentMonth: `${year}-${month}`,
      current: current.total,
      previous: previous.total,
      percentChange,
    });

    return {
      current,
      previous,
      percentChange,
      absoluteChange,
      trend,
    };
  } catch (error: any) {
    logger.error('Erro ao comparar com mês anterior', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Comparação detalhada com análise por categoria
 *
 * @param unitId - ID da unidade
 * @param currentDate - Data atual
 * @returns Comparação detalhada
 */
export async function compareDetailed(
  unitId: string,
  currentDate: Date
): Promise<DetailedComparison> {
  try {
    const lastWeek = new Date(currentDate);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const current = await categorizeRevenues(unitId, currentDate, currentDate);
    const previous = await categorizeRevenues(unitId, lastWeek, lastWeek);

    const percentChange =
      previous.total === 0
        ? current.total > 0
          ? 100
          : 0
        : ((current.total - previous.total) / previous.total) * 100;

    const absoluteChange = current.total - previous.total;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentChange) >= 5) {
      trend = percentChange > 0 ? 'up' : 'down';
    }

    // Variações por categoria
    const subscriptionsChange =
      previous.subscriptions === 0
        ? current.subscriptions > 0
          ? 100
          : 0
        : ((current.subscriptions - previous.subscriptions) /
            previous.subscriptions) *
          100;

    const productsChange =
      previous.products === 0
        ? current.products > 0
          ? 100
          : 0
        : ((current.products - previous.products) / previous.products) * 100;

    const walkInsChange =
      previous.walkIns === 0
        ? current.walkIns > 0
          ? 100
          : 0
        : ((current.walkIns - previous.walkIns) / previous.walkIns) * 100;

    // Análise textual
    const analysis = generateAnalysis({
      current,
      previous,
      percentChange,
      subscriptionsChange,
      productsChange,
      walkInsChange,
      trend,
    });

    return {
      current,
      previous,
      percentChange,
      absoluteChange,
      trend,
      subscriptionsChange,
      productsChange,
      walkInsChange,
      analysis,
    };
  } catch (error: any) {
    logger.error('Erro na comparação detalhada', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Gera análise textual da comparação
 */
function generateAnalysis(data: {
  current: CategorizedRevenue;
  previous: CategorizedRevenue;
  percentChange: number;
  subscriptionsChange: number;
  productsChange: number;
  walkInsChange: number;
  trend: 'up' | 'down' | 'stable';
}): string {
  const {
    percentChange,
    subscriptionsChange,
    productsChange,
    walkInsChange,
    trend,
  } = data;

  const parts: string[] = [];

  // Análise geral
  if (trend === 'up') {
    parts.push(
      `📈 Crescimento de ${percentChange.toFixed(1)}% em relação à semana passada.`
    );
  } else if (trend === 'down') {
    parts.push(
      `📉 Queda de ${Math.abs(percentChange).toFixed(1)}% em relação à semana passada.`
    );
  } else {
    parts.push(`➡️ Faturamento estável em relação à semana passada.`);
  }

  // Análise por categoria
  const changes = [
    { name: 'Assinaturas', change: subscriptionsChange },
    { name: 'Produtos', change: productsChange },
    { name: 'Avulso', change: walkInsChange },
  ];

  const bestCategory = changes.reduce((best, cat) =>
    cat.change > best.change ? cat : best
  );
  const worstCategory = changes.reduce((worst, cat) =>
    cat.change < worst.change ? cat : worst
  );

  if (Math.abs(bestCategory.change) > 10) {
    parts.push(
      `\n✨ Destaque: ${bestCategory.name} ${bestCategory.change > 0 ? 'cresceu' : 'caiu'} ${Math.abs(bestCategory.change).toFixed(1)}%.`
    );
  }

  if (
    Math.abs(worstCategory.change) > 10 &&
    worstCategory.name !== bestCategory.name
  ) {
    parts.push(
      `⚠️ Atenção: ${worstCategory.name} ${worstCategory.change > 0 ? 'cresceu' : 'caiu'} ${Math.abs(worstCategory.change).toFixed(1)}%.`
    );
  }

  return parts.join(' ');
}
