/**
 * 🎯 Serviço de Tracking de Metas
 *
 * Calcula progresso em relação às metas cadastradas no sistema.
 * Utiliza a tabela `goals` existente com tipos:
 * - revenue_general: Meta de receita total
 * - subscription: Meta de assinaturas
 * - product_sales: Meta de vendas de produtos
 *
 * @module goalTracking
 * @author Andrey Viana
 * @since 2025-11-11
 */

import { supabase } from '../cache';
import { categorizeRevenues } from './revenueCategorizationService';
import { logger } from '../logger';

export interface GoalProgress {
  goalType: 'revenue_general' | 'subscription' | 'product_sales';
  targetValue: number;
  currentProgress: number;
  percentComplete: number;
  daysInPeriod: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyRequired: number;
  dailyAverage: number;
  gap: number;
  status: 'ahead' | 'on_track' | 'behind' | 'at_risk';
  projectedFinal: number;
}

export interface AllGoalsProgress {
  monthlyRevenue: GoalProgress | null;
  subscriptions: GoalProgress | null;
  products: GoalProgress | null;
  overallStatus: 'ahead' | 'on_track' | 'behind' | 'at_risk';
  summary: string;
}

/**
 * Calcula progresso de uma meta específica
 *
 * @param unitId - ID da unidade
 * @param year - Ano
 * @param month - Mês (1-12)
 * @param goalType - Tipo de meta
 * @returns Progresso da meta
 */
export async function calculateGoalProgress(
  unitId: string,
  year: number,
  month: number,
  goalType: 'revenue_general' | 'subscription' | 'product_sales'
): Promise<GoalProgress | null> {
  try {
    // Buscar meta cadastrada
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('unit_id', unitId)
      .eq('goal_year', year)
      .eq('goal_month', month)
      .eq('goal_type', goalType)
      .eq('period', 'monthly')
      .eq('is_active', true)
      .single();

    if (goalError || !goal) {
      logger.warn('Meta não encontrada', { unitId, year, month, goalType });
      return null;
    }

    // Calcular progresso
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Último dia do mês
    const today = new Date();

    const daysInMonth = endDate.getDate();
    const daysElapsed =
      today.getMonth() === month - 1 && today.getFullYear() === year
        ? today.getDate()
        : today > endDate
          ? daysInMonth
          : 0;
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

    // Buscar receitas acumuladas
    const revenues = await categorizeRevenues(
      unitId,
      startDate,
      today < endDate ? today : endDate
    );

    // Determinar valor atual baseado no tipo de meta
    let currentProgress = 0;
    switch (goalType) {
      case 'revenue_general':
        currentProgress = revenues.total;
        break;
      case 'subscription':
        currentProgress = revenues.subscriptions;
        break;
      case 'product_sales':
        currentProgress = revenues.products;
        break;
    }

    const targetValue = Number(goal.target_value) || 0;
    const percentComplete =
      targetValue > 0 ? (currentProgress / targetValue) * 100 : 0;
    const gap = targetValue - currentProgress;
    const dailyRequired = daysRemaining > 0 ? gap / daysRemaining : 0;
    const dailyAverage = daysElapsed > 0 ? currentProgress / daysElapsed : 0;
    const projectedFinal =
      daysInMonth > 0 ? (currentProgress / daysElapsed) * daysInMonth : 0;

    // Determinar status
    let status: 'ahead' | 'on_track' | 'behind' | 'at_risk' = 'on_track';

    if (percentComplete >= 100) {
      status = 'ahead';
    } else if (daysElapsed > 0) {
      const expectedProgress = (daysElapsed / daysInMonth) * 100;
      const difference = percentComplete - expectedProgress;

      if (difference >= 10) {
        status = 'ahead';
      } else if (difference <= -20) {
        status = 'at_risk';
      } else if (difference <= -10) {
        status = 'behind';
      }
    }

    logger.info('Progresso da meta calculado', {
      unitId,
      goalType,
      targetValue,
      currentProgress,
      percentComplete,
      status,
    });

    return {
      goalType,
      targetValue,
      currentProgress,
      percentComplete,
      daysInPeriod: daysInMonth,
      daysElapsed,
      daysRemaining,
      dailyRequired,
      dailyAverage,
      gap,
      status,
      projectedFinal,
    };
  } catch (error: any) {
    logger.error('Erro ao calcular progresso da meta', {
      error: error.message,
      unitId,
      goalType,
    });
    throw error;
  }
}

/**
 * Calcula progresso de todas as metas do mês
 *
 * @param unitId - ID da unidade
 * @param year - Ano
 * @param month - Mês (1-12)
 * @returns Progresso de todas as metas
 */
export async function calculateAllGoalsProgress(
  unitId: string,
  year: number,
  month: number
): Promise<AllGoalsProgress> {
  try {
    // Buscar todas as metas
    const [monthlyRevenue, subscriptions, products] = await Promise.all([
      calculateGoalProgress(unitId, year, month, 'revenue_general'),
      calculateGoalProgress(unitId, year, month, 'subscription'),
      calculateGoalProgress(unitId, year, month, 'product_sales'),
    ]);

    // Determinar status geral
    const statuses = [
      monthlyRevenue?.status,
      subscriptions?.status,
      products?.status,
    ].filter(Boolean) as Array<'ahead' | 'on_track' | 'behind' | 'at_risk'>;

    let overallStatus: 'ahead' | 'on_track' | 'behind' | 'at_risk' = 'on_track';

    if (statuses.length > 0) {
      if (statuses.every(s => s === 'ahead')) {
        overallStatus = 'ahead';
      } else if (statuses.some(s => s === 'at_risk')) {
        overallStatus = 'at_risk';
      } else if (statuses.some(s => s === 'behind')) {
        overallStatus = 'behind';
      }
    }

    // Gerar resumo
    const summary = generateSummary({
      monthlyRevenue,
      subscriptions,
      products,
      overallStatus,
    });

    return {
      monthlyRevenue,
      subscriptions,
      products,
      overallStatus,
      summary,
    };
  } catch (error: any) {
    logger.error('Erro ao calcular todas as metas', {
      error: error.message,
      unitId,
    });
    throw error;
  }
}

/**
 * Gera resumo textual do progresso das metas
 */
function generateSummary(data: {
  monthlyRevenue: GoalProgress | null;
  subscriptions: GoalProgress | null;
  products: GoalProgress | null;
  overallStatus: 'ahead' | 'on_track' | 'behind' | 'at_risk';
}): string {
  const { monthlyRevenue, subscriptions, products, overallStatus } = data;

  const parts: string[] = [];

  // Status geral
  switch (overallStatus) {
    case 'ahead':
      parts.push('🎉 Excelente! Você está acima das metas.');
      break;
    case 'on_track':
      parts.push('✅ Bom trabalho! Você está no caminho certo.');
      break;
    case 'behind':
      parts.push('⚠️ Atenção! Você está abaixo do esperado.');
      break;
    case 'at_risk':
      parts.push('🚨 Alerta! Há risco de não atingir as metas.');
      break;
  }

  // Detalhes por meta
  if (monthlyRevenue) {
    parts.push(
      `\nReceita Total: ${monthlyRevenue.percentComplete.toFixed(1)}% (${formatCurrency(monthlyRevenue.currentProgress)}/${formatCurrency(monthlyRevenue.targetValue)})`
    );

    if (monthlyRevenue.status === 'ahead') {
      parts.push(
        `  ✨ ${(monthlyRevenue.percentComplete - 100).toFixed(1)}% acima da meta!`
      );
    } else if (monthlyRevenue.gap > 0) {
      parts.push(
        `  Falta: ${formatCurrency(monthlyRevenue.gap)} | Necessário por dia: ${formatCurrency(monthlyRevenue.dailyRequired)}`
      );
    }
  }

  if (subscriptions) {
    parts.push(
      `\nAssinaturas: ${subscriptions.percentComplete.toFixed(1)}% (${formatCurrency(subscriptions.currentProgress)}/${formatCurrency(subscriptions.targetValue)})`
    );
  }

  if (products) {
    parts.push(
      `\nProdutos: ${products.percentComplete.toFixed(1)}% (${formatCurrency(products.currentProgress)}/${formatCurrency(products.targetValue)})`
    );
  }

  return parts.join('\n');
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Obtém projeção de atingimento da meta
 */
export function getProjectionStatus(progress: GoalProgress): {
  willAchieve: boolean;
  confidence: number;
  message: string;
} {
  if (progress.percentComplete >= 100) {
    return {
      willAchieve: true,
      confidence: 1.0,
      message: 'Meta já atingida! 🎉',
    };
  }

  const projectedPercent =
    (progress.projectedFinal / progress.targetValue) * 100;

  if (projectedPercent >= 95) {
    return {
      willAchieve: true,
      confidence: 0.9,
      message: `Projeção de ${projectedPercent.toFixed(0)}% - alta chance de atingir! 📈`,
    };
  } else if (projectedPercent >= 85) {
    return {
      willAchieve: true,
      confidence: 0.7,
      message: `Projeção de ${projectedPercent.toFixed(0)}% - é possível atingir com esforço. 💪`,
    };
  } else {
    return {
      willAchieve: false,
      confidence: 0.3,
      message: `Projeção de ${projectedPercent.toFixed(0)}% - dificilmente será atingida. ⚠️`,
    };
  }
}
