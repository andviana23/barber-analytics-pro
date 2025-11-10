/**
 * @fileoverview Prompts para Análises Financeiras
 * @module lib/ai/prompts
 * @description Prompts estruturados para diferentes tipos de análises financeiras
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.2
 */

import type OpenAI from 'openai';

/**
 * Interface para métricas semanais
 */
export interface WeeklyMetrics {
  grossRevenue: number;
  totalExpenses: number;
  marginPercentage: number;
  averageTicket: number;
  transactionsCount: number;
  previousWeek?: {
    grossRevenue: number;
    totalExpenses: number;
    marginPercentage: number;
    averageTicket: number;
  };
  alerts?: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

/**
 * Interface para métricas mensais
 */
export interface MonthlyMetrics {
  grossRevenue: number;
  totalExpenses: number;
  marginPercentage: number;
  averageTicket: number;
  transactionsCount: number;
  previousMonth?: {
    grossRevenue: number;
    totalExpenses: number;
    marginPercentage: number;
  };
  trends?: {
    revenueChange: number;
    marginChange: number;
  };
}

/**
 * Tipo de alerta financeiro
 */
export type AlertType = 'LOW_MARGIN' | 'REVENUE_DROP' | 'ANOMALY' | 'HIGH_EXPENSE';

/**
 * Gera prompt de análise semanal
 *
 * @param metrics - Métricas da semana
 * @returns Array de mensagens para OpenAI
 */
export function getWeeklyAnalysisPrompt(
  metrics: WeeklyMetrics
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const comparisonText = metrics.previousWeek
    ? `
Comparação com semana anterior:
- Receita: ${metrics.previousWeek.grossRevenue.toFixed(2)} → ${metrics.grossRevenue.toFixed(2)} (${metrics.grossRevenue > metrics.previousWeek.grossRevenue ? '+' : ''}${((metrics.grossRevenue - metrics.previousWeek.grossRevenue) / metrics.previousWeek.grossRevenue * 100).toFixed(1)}%)
- Margem: ${metrics.previousWeek.marginPercentage.toFixed(1)}% → ${metrics.marginPercentage.toFixed(1)}%
- Ticket médio: ${metrics.previousWeek.averageTicket.toFixed(2)} → ${metrics.averageTicket.toFixed(2)}
`
    : '';

  const alertsText = metrics.alerts && metrics.alerts.length > 0
    ? `
Alertas ativos: ${metrics.alerts.length}
${metrics.alerts.map(a => `- [${a.severity}] ${a.type}: ${a.message}`).join('\n')}
`
    : '';

  return [
    {
      role: 'system',
      content: `Você é um analista financeiro especializado em análise de negócios de barbearia.
Analise as métricas fornecidas e forneça insights acionáveis em português brasileiro.
Seja objetivo, prático e focado em ações que podem melhorar os resultados financeiros.`,
    },
    {
      role: 'user',
      content: `Analise as métricas financeiras da semana:

Métricas da semana atual:
- Receita bruta: R$ ${metrics.grossRevenue.toFixed(2)}
- Despesas totais: R$ ${metrics.totalExpenses.toFixed(2)}
- Margem de lucro: ${metrics.marginPercentage.toFixed(1)}%
- Ticket médio: R$ ${metrics.averageTicket.toFixed(2)}
- Número de transações: ${metrics.transactionsCount}
${comparisonText}${alertsText}

Forneça uma análise estruturada em JSON com os seguintes campos:
{
  "summary": "Resumo executivo da semana (2-3 frases)",
  "highlights": ["ponto forte 1", "ponto forte 2"],
  "concerns": ["preocupação 1", "preocupação 2"],
  "recommendations": ["recomendação acionável 1", "recomendação acionável 2"],
  "trend": "INCREASING|DECREASING|STABLE",
  "nextWeekFocus": "Foco principal para próxima semana"
}`,
    },
  ];
}

/**
 * Gera prompt de alerta financeiro
 *
 * @param alertType - Tipo do alerta
 * @param metrics - Métricas atuais
 * @param alertData - Dados específicos do alerta
 * @returns Array de mensagens para OpenAI
 */
export function getAlertPrompt(
  alertType: AlertType,
  metrics: WeeklyMetrics | MonthlyMetrics,
  alertData?: Record<string, any>
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const alertDescriptions: Record<AlertType, string> = {
    LOW_MARGIN: 'Margem de lucro abaixo do target',
    REVENUE_DROP: 'Queda significativa na receita',
    ANOMALY: 'Anomalia detectada nos dados financeiros',
    HIGH_EXPENSE: 'Despesas acima do esperado',
  };

  return [
    {
      role: 'system',
      content: `Você é um consultor financeiro especializado em barbearias.
Explique a causa do alerta financeiro e forneça recomendações práticas e acionáveis em português brasileiro.
Seja específico e ofereça soluções concretas.`,
    },
    {
      role: 'user',
      content: `Alerta financeiro detectado:

Tipo: ${alertDescriptions[alertType]} (${alertType})
Métricas atuais:
- Receita bruta: R$ ${metrics.grossRevenue.toFixed(2)}
- Despesas totais: R$ ${metrics.totalExpenses.toFixed(2)}
- Margem de lucro: ${metrics.marginPercentage.toFixed(1)}%
- Ticket médio: R$ ${metrics.averageTicket.toFixed(2)}
${alertData ? `\nDados do alerta: ${JSON.stringify(alertData, null, 2)}` : ''}

Forneça uma explicação estruturada em JSON:
{
  "cause": "Explicação clara da causa do alerta",
  "impact": "Impacto esperado se não for resolvido",
  "immediateActions": ["ação imediata 1", "ação imediata 2"],
  "longTermSolutions": ["solução de longo prazo 1", "solução de longo prazo 2"],
  "priority": "HIGH|MEDIUM|LOW"
}`,
    },
  ];
}

/**
 * Gera prompt de simulação (what-if)
 *
 * @param scenario - Cenário a simular (ex: "aumentar preço em 10%")
 * @param currentMetrics - Métricas atuais
 * @returns Array de mensagens para OpenAI
 */
export function getWhatIfPrompt(
  scenario: string,
  currentMetrics: WeeklyMetrics | MonthlyMetrics
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `Você é um analista financeiro especializado em simulações de negócios de barbearia.
Simule o cenário fornecido e calcule o impacto nas métricas financeiras.
Seja realista e considere efeitos secundários (ex: aumento de preço pode reduzir volume).
Responda em português brasileiro com números específicos.`,
    },
    {
      role: 'user',
      content: `Simule o seguinte cenário: "${scenario}"

Métricas atuais:
- Receita bruta: R$ ${currentMetrics.grossRevenue.toFixed(2)}
- Despesas totais: R$ ${currentMetrics.totalExpenses.toFixed(2)}
- Margem de lucro: ${currentMetrics.marginPercentage.toFixed(1)}%
- Ticket médio: R$ ${currentMetrics.averageTicket.toFixed(2)}
- Número de transações: ${currentMetrics.transactionsCount || 0}

Forneça uma simulação estruturada em JSON:
{
  "scenario": "Descrição do cenário simulado",
  "projectedMetrics": {
    "grossRevenue": 0,
    "totalExpenses": 0,
    "marginPercentage": 0,
    "averageTicket": 0,
    "transactionsCount": 0
  },
  "changes": {
    "revenueChange": 0,
    "marginChange": 0,
    "profitChange": 0
  },
  "assumptions": ["suposição 1", "suposição 2"],
  "risks": ["risco 1", "risco 2"],
  "recommendation": "Recomendação baseada na simulação"
}`,
    },
  ];
}

/**
 * Gera prompt de sumário executivo mensal
 *
 * @param metrics - Métricas do mês
 * @returns Array de mensagens para OpenAI
 */
export function getMonthlyExecutiveSummary(
  metrics: MonthlyMetrics
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const comparisonText = metrics.previousMonth
    ? `
Comparação com mês anterior:
- Receita: ${metrics.previousMonth.grossRevenue.toFixed(2)} → ${metrics.grossRevenue.toFixed(2)} (${metrics.grossRevenue > metrics.previousMonth.grossRevenue ? '+' : ''}${((metrics.grossRevenue - metrics.previousMonth.grossRevenue) / metrics.previousMonth.grossRevenue * 100).toFixed(1)}%)
- Margem: ${metrics.previousMonth.marginPercentage.toFixed(1)}% → ${metrics.marginPercentage.toFixed(1)}%
`
    : '';

  const trendsText = metrics.trends
    ? `
Tendências:
- Variação de receita: ${metrics.trends.revenueChange > 0 ? '+' : ''}${metrics.trends.revenueChange.toFixed(1)}%
- Variação de margem: ${metrics.trends.marginChange > 0 ? '+' : ''}${metrics.trends.marginChange.toFixed(1)} pontos percentuais
`
    : '';

  return [
    {
      role: 'system',
      content: `Você é um consultor executivo especializado em análise financeira de barbearias.
Crie um sumário executivo mensal focado em ações estratégicas.
Seja conciso (máximo 500 palavras), objetivo e orientado a resultados.
Use português brasileiro claro e profissional.`,
    },
    {
      role: 'user',
      content: `Crie um sumário executivo mensal com base nas seguintes métricas:

Métricas do mês:
- Receita bruta: R$ ${metrics.grossRevenue.toFixed(2)}
- Despesas totais: R$ ${metrics.totalExpenses.toFixed(2)}
- Margem de lucro: ${metrics.marginPercentage.toFixed(1)}%
- Ticket médio: R$ ${metrics.averageTicket.toFixed(2)}
- Número de transações: ${metrics.transactionsCount}
${comparisonText}${trendsText}

Forneça um sumário estruturado em JSON:
{
  "executiveSummary": "Sumário executivo completo (máximo 500 palavras)",
  "keyAchievements": ["conquista 1", "conquista 2"],
  "mainChallenges": ["desafio 1", "desafio 2"],
  "strategicActions": [
    {
      "action": "Ação estratégica 1",
      "priority": "HIGH|MEDIUM|LOW",
      "expectedImpact": "Impacto esperado"
    }
  ],
  "nextMonthFocus": "Foco principal para o próximo mês"
}`,
    },
  ];
}

