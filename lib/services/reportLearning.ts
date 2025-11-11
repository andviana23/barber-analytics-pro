/**
 * 🧠 Sistema de Aprendizado para Relatórios (ApoIA)
 *
 * Detecta padrões no comportamento financeiro ao longo do tempo
 * e gera insights cada vez melhores baseado no histórico.
 *
 * Padrões detectados:
 * - day_of_week_trend: Tendências por dia da semana
 * - monthly_cycle: Ciclos mensais (início, meio, fim)
 * - category_preference: Preferências por categoria
 * - seasonal_pattern: Padrões sazonais
 * - growth_trajectory: Trajetória de crescimento
 *
 * @module reportLearning
 * @author Andrey Viana
 * @since 2025-11-11
 */

import { supabase } from '../cache';
import { CategorizedRevenue } from './revenueCategorizationService';
import { ComparisonResult } from './revenueComparison';
import { AllGoalsProgress } from './goalTracking';
import { logger } from '../logger';
import { callOpenAI } from '../ai/openai';

export interface DetectedPattern {
  pattern_type: string;
  description: string;
  confidence: number;
  first_detected: Date;
  last_seen: Date;
  occurrences: number;
  metadata: Record<string, any>;
}

export interface DailyReportData {
  date: string;
  unit_id: string;
  revenue: CategorizedRevenue;
  comparison: ComparisonResult;
  goals: AllGoalsProgress;
  insights: string[];
  patterns: string[];
}

/**
 * Salva relatório no histórico
 *
 * @param reportData - Dados do relatório
 */
export async function saveDailyReport(
  reportData: DailyReportData
): Promise<void> {
  try {
    const { error } = await supabase.from('daily_reports_history').insert({
      unit_id: reportData.unit_id,
      report_date: reportData.date,
      revenue_total: reportData.revenue.total,
      revenue_subscriptions: reportData.revenue.subscriptions,
      revenue_products: reportData.revenue.products,
      revenue_walkins: reportData.revenue.walkIns,
      comparison_percent: reportData.comparison.percentChange,
      goal_progress_percent:
        reportData.goals.monthlyRevenue?.percentComplete || 0,
      insights_generated: reportData.insights,
      patterns_detected: reportData.patterns,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('Erro ao salvar histórico do relatório', { error });
    } else {
      logger.info('Relatório salvo no histórico', {
        unitId: reportData.unit_id,
        date: reportData.date,
      });
    }
  } catch (error: any) {
    logger.error('Erro ao salvar relatório', { error: error.message });
  }
}

/**
 * Busca histórico de relatórios
 *
 * @param unitId - ID da unidade
 * @param days - Número de dias para buscar (padrão: 90)
 * @returns Histórico de relatórios
 */
export async function getReportHistory(
  unitId: string,
  days: number = 90
): Promise<DailyReportData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('daily_reports_history')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .gte('report_date', startDate.toISOString().split('T')[0])
      .order('report_date', { ascending: false });

    if (error) {
      logger.error('Erro ao buscar histórico', { error, unitId });
      return [];
    }

    return (data || []).map((row: any) => ({
      date: row.report_date,
      unit_id: row.unit_id,
      revenue: {
        total: Number(row.revenue_total),
        subscriptions: Number(row.revenue_subscriptions),
        products: Number(row.revenue_products),
        walkIns: Number(row.revenue_walkins),
      },
      comparison: {
        percentChange: Number(row.comparison_percent) || 0,
      },
      goals: {
        monthlyRevenue: {
          percentComplete: Number(row.goal_progress_percent) || 0,
        },
      },
      insights: row.insights_generated || [],
      patterns: row.patterns_detected || [],
    })) as any;
  } catch (error: any) {
    logger.error('Erro ao buscar histórico', { error: error.message, unitId });
    return [];
  }
}

/**
 * Detecta padrões no histórico de receitas
 *
 * @param unitId - ID da unidade
 * @returns Padrões detectados
 */
export async function detectPatterns(
  unitId: string
): Promise<DetectedPattern[]> {
  try {
    const history = await getReportHistory(unitId, 90);

    if (history.length < 14) {
      logger.info('Histórico insuficiente para detectar padrões', {
        unitId,
        days: history.length,
      });
      return [];
    }

    const patterns: DetectedPattern[] = [];

    // =========================================
    // Padrão 1: Tendências por dia da semana
    // =========================================
    const dayOfWeekRevenue = new Map<number, number[]>();

    history.forEach(report => {
      const day = new Date(report.date).getDay();
      if (!dayOfWeekRevenue.has(day)) {
        dayOfWeekRevenue.set(day, []);
      }
      dayOfWeekRevenue.get(day)!.push(report.revenue.total);
    });

    if (dayOfWeekRevenue.size >= 4) {
      const avgByDay = Array.from(dayOfWeekRevenue.entries()).map(
        ([day, values]) => ({
          day,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
        })
      );

      const bestDay = avgByDay.reduce((a, b) => (a.avg > b.avg ? a : b));
      const worstDay = avgByDay.reduce((a, b) => (a.avg < b.avg ? a : b));

      if (bestDay.count >= 4) {
        patterns.push({
          pattern_type: 'day_of_week_trend',
          description: `${getDayName(bestDay.day)} é o melhor dia (média: R$ ${bestDay.avg.toFixed(2)})`,
          confidence: Math.min(0.95, bestDay.count / 10),
          first_detected: new Date(),
          last_seen: new Date(),
          occurrences: bestDay.count,
          metadata: {
            best_day: getDayName(bestDay.day),
            worst_day: getDayName(worstDay.day),
            best_avg: bestDay.avg,
            worst_avg: worstDay.avg,
          },
        });
      }
    }

    // =========================================
    // Padrão 2: Ciclos mensais (início/meio/fim)
    // =========================================
    const cycleData = {
      start: [] as number[], // Dias 1-10
      middle: [] as number[], // Dias 11-20
      end: [] as number[], // Dias 21-31
    };

    history.forEach(report => {
      const day = new Date(report.date).getDate();
      if (day <= 10) {
        cycleData.start.push(report.revenue.total);
      } else if (day <= 20) {
        cycleData.middle.push(report.revenue.total);
      } else {
        cycleData.end.push(report.revenue.total);
      }
    });

    if (cycleData.start.length >= 5 && cycleData.end.length >= 5) {
      const startAvg =
        cycleData.start.reduce((a, b) => a + b, 0) / cycleData.start.length;
      const endAvg =
        cycleData.end.reduce((a, b) => a + b, 0) / cycleData.end.length;

      if (Math.abs(startAvg - endAvg) / Math.max(startAvg, endAvg) > 0.15) {
        patterns.push({
          pattern_type: 'monthly_cycle',
          description:
            startAvg > endAvg
              ? `Início do mês ${((startAvg / endAvg - 1) * 100).toFixed(0)}% mais forte`
              : `Fim do mês ${((endAvg / startAvg - 1) * 100).toFixed(0)}% mais forte`,
          confidence: 0.75,
          first_detected: new Date(),
          last_seen: new Date(),
          occurrences: history.length,
          metadata: {
            start_avg: startAvg,
            end_avg: endAvg,
            difference_percent:
              (Math.abs(startAvg - endAvg) / Math.max(startAvg, endAvg)) * 100,
          },
        });
      }
    }

    // =========================================
    // Padrão 3: Tendência de crescimento
    // =========================================
    if (history.length >= 30) {
      const firstHalf = history.slice(history.length / 2);
      const secondHalf = history.slice(0, history.length / 2);

      const avgFirst =
        firstHalf.reduce((sum, r) => sum + r.revenue.total, 0) /
        firstHalf.length;
      const avgSecond =
        secondHalf.reduce((sum, r) => sum + r.revenue.total, 0) /
        secondHalf.length;

      const growthPercent = ((avgSecond - avgFirst) / avgFirst) * 100;

      if (Math.abs(growthPercent) > 10) {
        patterns.push({
          pattern_type: 'growth_trajectory',
          description:
            growthPercent > 0
              ? `Crescimento de ${growthPercent.toFixed(1)}% nos últimos ${Math.floor(history.length / 2)} dias`
              : `Queda de ${Math.abs(growthPercent).toFixed(1)}% nos últimos ${Math.floor(history.length / 2)} dias`,
          confidence: 0.85,
          first_detected: new Date(),
          last_seen: new Date(),
          occurrences: history.length,
          metadata: {
            growth_percent: growthPercent,
            avg_first_period: avgFirst,
            avg_second_period: avgSecond,
          },
        });
      }
    }

    // =========================================
    // Padrão 4: Preferência por categoria
    // =========================================
    const categoryTotals = {
      subscriptions: history.reduce(
        (sum, r) => sum + r.revenue.subscriptions,
        0
      ),
      products: history.reduce((sum, r) => sum + r.revenue.products, 0),
      walkIns: history.reduce((sum, r) => sum + r.revenue.walkIns, 0),
    };

    const total =
      categoryTotals.subscriptions +
      categoryTotals.products +
      categoryTotals.walkIns;

    if (total > 0) {
      const percentages = {
        subscriptions: (categoryTotals.subscriptions / total) * 100,
        products: (categoryTotals.products / total) * 100,
        walkIns: (categoryTotals.walkIns / total) * 100,
      };

      const dominant = Object.entries(percentages).reduce((a, b) =>
        a[1] > b[1] ? a : b
      );

      if (dominant[1] > 50) {
        patterns.push({
          pattern_type: 'category_preference',
          description: `${getCategoryName(dominant[0])} representa ${dominant[1].toFixed(0)}% da receita`,
          confidence: 0.9,
          first_detected: new Date(),
          last_seen: new Date(),
          occurrences: history.length,
          metadata: {
            dominant_category: dominant[0],
            dominant_percent: dominant[1],
            percentages,
          },
        });
      }
    }

    // Salvar padrões no banco
    await savePatterns(unitId, patterns);

    logger.info('Padrões detectados', { unitId, patterns: patterns.length });

    return patterns;
  } catch (error: any) {
    logger.error('Erro ao detectar padrões', { error: error.message, unitId });
    return [];
  }
}

/**
 * Salva padrões detectados no banco
 */
async function savePatterns(
  unitId: string,
  patterns: DetectedPattern[]
): Promise<void> {
  try {
    for (const pattern of patterns) {
      // Verificar se padrão já existe
      const { data: existing } = await supabase
        .from('report_patterns')
        .select('id, occurrences')
        .eq('unit_id', unitId)
        .eq('pattern_type', pattern.pattern_type)
        .eq('is_active', true)
        .single();

      if (existing) {
        // Atualizar padrão existente
        await supabase
          .from('report_patterns')
          .update({
            description: pattern.description,
            confidence: pattern.confidence,
            last_seen: new Date().toISOString(),
            occurrences: existing.occurrences + 1,
            metadata: pattern.metadata,
          })
          .eq('id', existing.id);
      } else {
        // Criar novo padrão
        await supabase.from('report_patterns').insert({
          unit_id: unitId,
          pattern_type: pattern.pattern_type,
          description: pattern.description,
          confidence: pattern.confidence,
          occurrences: 1,
          metadata: pattern.metadata,
        });
      }
    }
  } catch (error: any) {
    logger.error('Erro ao salvar padrões', { error: error.message, unitId });
  }
}

/**
 * Gera insights usando IA com base em padrões detectados
 *
 * @param unitId - ID da unidade
 * @param currentReport - Dados do relatório atual
 * @param patterns - Padrões detectados
 * @returns Lista de insights gerados
 */
export async function generateLearnedInsights(
  unitId: string,
  currentReport: DailyReportData,
  patterns: DetectedPattern[]
): Promise<string[]> {
  try {
    const insights: string[] = [];

    // Insights baseados em padrões
    patterns.forEach(pattern => {
      if (pattern.confidence >= 0.75) {
        insights.push(pattern.description);
      }
    });

    // Gerar insights adicionais com OpenAI
    const prompt = `
Você é ApoIA, assistente financeiro inteligente da barbearia.

**Padrões detectados historicamente:**
${patterns.map(p => `- ${p.description} (confiança: ${(p.confidence * 100).toFixed(0)}%)`).join('\n')}

**Dados de hoje (${currentReport.date}):**
- Receita total: R$ ${currentReport.revenue.total.toFixed(2)}
- Assinaturas: R$ ${currentReport.revenue.subscriptions.toFixed(2)}
- Produtos: R$ ${currentReport.revenue.products.toFixed(2)}
- Avulso: R$ ${currentReport.revenue.walkIns.toFixed(2)}
- Variação vs semana passada: ${currentReport.comparison.percentChange > 0 ? '+' : ''}${currentReport.comparison.percentChange.toFixed(1)}%
- Progresso da meta: ${currentReport.goals.monthlyRevenue?.percentComplete.toFixed(1) || 0}%

**Tarefa:**
Com base nos padrões aprendidos, gere 2-3 insights acionáveis e específicos.
Seja objetivo, direto e focado em ações práticas.
Formato: uma frase por linha, sem numeração.
`.trim();

    const analysis = await callOpenAI(
      [
        {
          role: 'system',
          content:
            'Você é ApoIA, assistente financeiro inteligente especializado em análise de dados de barbearias.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        model: 'gpt-4o-mini',
        maxTokens: 300,
        temperature: 0.7,
        unitId,
      }
    );

    const content = analysis.choices[0]?.message?.content;
    if (content) {
      const aiInsights = content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3);

      insights.push(...aiInsights);
    }

    logger.info('Insights gerados', { unitId, total: insights.length });

    return insights.slice(0, 5); // Máximo 5 insights
  } catch (error: any) {
    logger.error('Erro ao gerar insights', { error: error.message, unitId });
    return [];
  }
}

// ============================================================================
// Funções auxiliares
// ============================================================================

function getDayName(day: number): string {
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];
  return days[day];
}

function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    subscriptions: 'Assinaturas',
    products: 'Produtos',
    walkIns: 'Avulso',
  };
  return names[category] || category;
}
