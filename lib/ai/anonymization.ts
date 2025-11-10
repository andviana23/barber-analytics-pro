/**
 * @fileoverview Anonimização de Dados
 * @module lib/ai/anonymization
 * @description Remove PII (Personally Identifiable Information) antes de enviar à OpenAI
 *
 * @see CHECKLIST_IA_FINANCEIRA.md - Seção 5.3.2
 */

/**
 * Anonimiza métricas removendo PII antes de enviar à OpenAI
 *
 * Remove campos que podem conter informações pessoais identificáveis:
 * - Nomes de clientes/profissionais
 * - Telefones
 * - Emails
 * - CPF
 * - Endereços
 *
 * Mantém apenas dados agregados e numéricos.
 *
 * @param metrics - Métricas a anonimizar
 * @returns Métricas anonimizadas
 */
export function anonymizeMetrics(metrics: any): any {
  const anonymized = { ...metrics };

  // Lista de campos que podem conter PII
  const piiFields = [
    'customerNames',
    'customerPhones',
    'customerEmails',
    'customerCPF',
    'customerAddresses',
    'professionalNames',
    'professionalPhones',
    'professionalEmails',
    'professionalCPF',
    'clientNames',
    'clientPhones',
    'clientEmails',
    'clientCPF',
    'partyNames',
    'partyPhones',
    'partyEmails',
    'partyCPF',
    'observations', // Pode conter informações pessoais
    'description', // Pode conter informações pessoais
    'notes', // Pode conter informações pessoais
  ];

  // Remover campos PII
  piiFields.forEach(field => {
    delete anonymized[field];
  });

  // Se houver arrays, remover campos PII de cada item
  if (Array.isArray(anonymized.transactions)) {
    anonymized.transactions = anonymized.transactions.map((t: any) => {
      const clean = { ...t };
      piiFields.forEach(field => delete clean[field]);
      return clean;
    });
  }

  if (Array.isArray(anonymized.revenues)) {
    anonymized.revenues = anonymized.revenues.map((r: any) => {
      const clean = { ...r };
      piiFields.forEach(field => delete clean[field]);
      return clean;
    });
  }

  if (Array.isArray(anonymized.expenses)) {
    anonymized.expenses = anonymized.expenses.map((e: any) => {
      const clean = { ...e };
      piiFields.forEach(field => delete clean[field]);
      return clean;
    });
  }

  // Manter apenas dados agregados e numéricos
  return {
    grossRevenue: anonymized.grossRevenue,
    totalExpenses: anonymized.totalExpenses,
    marginPercentage: anonymized.marginPercentage,
    averageTicket: anonymized.averageTicket,
    transactionsCount: anonymized.transactionsCount,
    revenueCount: anonymized.revenueCount,
    expenseCount: anonymized.expenseCount,
    previousWeek: anonymized.previousWeek
      ? anonymizeMetrics(anonymized.previousWeek)
      : undefined,
    previousMonth: anonymized.previousMonth
      ? anonymizeMetrics(anonymized.previousMonth)
      : undefined,
    trends: anonymized.trends,
    alerts: anonymized.alerts?.map((a: any) => ({
      type: a.type,
      severity: a.severity,
      message: a.message,
      metadata: a.metadata ? anonymizeMetrics(a.metadata) : undefined,
    })),
    // Manter apenas IDs (não são PII)
    unitId: anonymized.unitId,
    period: anonymized.period,
  };
}

/**
 * Valida se métricas estão anonimizadas
 *
 * @param metrics - Métricas a validar
 * @returns true se não contém PII
 */
export function isAnonymized(metrics: any): boolean {
  const piiFields = [
    'customerNames',
    'customerPhones',
    'customerEmails',
    'customerCPF',
    'professionalNames',
    'professionalPhones',
  ];

  return !piiFields.some(field => metrics[field] !== undefined);
}

