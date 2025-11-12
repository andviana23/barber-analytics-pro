/**
 * @fileoverview Financial Test Fixtures
 * @description Fixtures e helpers para testes do módulo financeiro
 */

/**
 * Date Helpers - Funções auxiliares para manipulação de datas em testes
 */
export const DateHelpers = {
  /**
   * Retorna a data de hoje no formato ISO (YYYY-MM-DD)
   */
  today(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna a data de ontem no formato ISO
   */
  yesterday(): string {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna a data de amanhã no formato ISO
   */
  tomorrow(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna a data de há 1 mês no formato ISO
   */
  monthAgo(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna a data de daqui a 1 mês no formato ISO
   */
  monthAhead(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna o primeiro dia do mês atual
   */
  firstDayOfMonth(): string {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  },

  /**
   * Retorna o último dia do mês atual
   */
  lastDayOfMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date.toISOString().split('T')[0];
  },

  /**
   * Converte string ISO para objeto Date
   */
  toDate(isoString: string): Date {
    return new Date(isoString);
  },

  /**
   * Formata data para exibição (DD/MM/YYYY)
   */
  format(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Adiciona dias a uma data
   */
  addDays(date: Date | string, days: number): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  /**
   * Retorna o período do mês atual (start/end)
   */
  currentMonth(): { startDate: string; endDate: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  },

  /**
   * Retorna uma data N dias no futuro
   */
  daysFromNow(days: number): string {
    return this.addDays(new Date(), days);
  },
};

/**
 * Financial Fixtures - Dados de exemplo para testes financeiros
 */
export const FinancialFixtures = {
  /**
   * Cria uma receita de serviço para testes
   */
  makeServiceRevenue(overrides: any = {}) {
    return {
      id: `revenue-${Date.now()}`,
      unit_id: 'unit-123',
      professional_id: 'prof-456',
      value: 150.0,
      date: DateHelpers.today(),
      competence_date: DateHelpers.today(),
      description: 'Corte + Barba',
      category_id: 'servicos',
      payment_method_id: 'pix',
      bank_account_id: 'conta-principal',
      type: 'service' as const,
      status: 'PENDING' as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  },

  /**
   * Receita padrão para testes
   */
  revenue: {
    id: 'revenue-001',
    unit_id: 'unit-123',
    professional_id: 'prof-456',
    value: 150.0,
    date: DateHelpers.today(),
    competence_date: DateHelpers.today(),
    description: 'Corte + Barba',
    category_id: 'servicos',
    payment_method_id: 'pix',
    bank_account_id: 'conta-principal',
    type: 'service' as const,
    status: 'PENDING' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Despesa padrão para testes
   */
  expense: {
    id: 'expense-001',
    unit_id: 'unit-123',
    value: 50.0,
    date: DateHelpers.today(),
    competence_date: DateHelpers.today(),
    description: 'Material de limpeza',
    category_id: 'operacional',
    payment_method_id: 'dinheiro',
    bank_account_id: 'conta-principal',
    status: 'PAID' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Profissional padrão para testes
   */
  professional: {
    id: 'prof-456',
    user_id: 'user-789',
    unit_id: 'unit-123',
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'barbeiro' as const,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Unidade padrão para testes
   */
  unit: {
    id: 'unit-123',
    name: 'Barbearia Mangabeiras',
    address: 'Rua das Flores, 123',
    city: 'Belo Horizonte',
    state: 'MG',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Conta bancária padrão para testes
   */
  bankAccount: {
    id: 'conta-principal',
    unit_id: 'unit-123',
    name: 'Conta Principal',
    type: 'checking' as const,
    bank: 'Banco do Brasil',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * Método de pagamento padrão para testes
   */
  paymentMethod: {
    id: 'pix',
    name: 'PIX',
    type: 'instant' as const,
    fee: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  /**
   * KPIs financeiros para testes
   */
  kpis: {
    totalRevenue: 10000.0,
    totalExpenses: 3500.0,
    netProfit: 6500.0,
    margin: 65.0,
    averageTicket: 125.0,
    transactionCount: 80,
  },

  /**
   * DRE (Demonstrativo de Resultado) para testes
   */
  dre: {
    receita_bruta: 10000.0,
    deducoes: 200.0,
    receita_liquida: 9800.0,
    custos_variaveis: 2000.0,
    lucro_bruto: 7800.0,
    despesas_fixas: 1500.0,
    lucro_operacional: 6300.0,
    margem_bruta: 78.0,
    margem_operacional: 63.0,
  },

  /**
   * Fluxo de caixa para testes
   */
  cashflow: {
    entradas: 10000.0,
    saidas: 3500.0,
    saldo_inicial: 5000.0,
    saldo_final: 11500.0,
    saldo_acumulado: 11500.0,
  },
};

/**
 * Factory functions - Funções para criar dados de teste personalizados
 */
export const createRevenue = (
  overrides: Partial<typeof FinancialFixtures.revenue> = {}
) => ({
  ...FinancialFixtures.revenue,
  ...overrides,
  id: `revenue-${Date.now()}`,
});

export const createExpense = (
  overrides: Partial<typeof FinancialFixtures.expense> = {}
) => ({
  ...FinancialFixtures.expense,
  ...overrides,
  id: `expense-${Date.now()}`,
});

export const createProfessional = (
  overrides: Partial<typeof FinancialFixtures.professional> = {}
) => ({
  ...FinancialFixtures.professional,
  ...overrides,
  id: `prof-${Date.now()}`,
});

export const createUnit = (
  overrides: Partial<typeof FinancialFixtures.unit> = {}
) => ({
  ...FinancialFixtures.unit,
  ...overrides,
  id: `unit-${Date.now()}`,
});

/**
 * Mock data generators - Geradores de dados mock
 */
export const generateRevenueList = (count: number = 10) => {
  return Array.from({ length: count }, (_, index) => ({
    ...FinancialFixtures.revenue,
    id: `revenue-${index + 1}`,
    value: 100 + index * 10,
    description: `Receita ${index + 1}`,
  }));
};

export const generateExpenseList = (count: number = 10) => {
  return Array.from({ length: count }, (_, index) => ({
    ...FinancialFixtures.expense,
    id: `expense-${index + 1}`,
    value: 50 + index * 5,
    description: `Despesa ${index + 1}`,
  }));
};
