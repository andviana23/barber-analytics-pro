/**
 * Fixtures para testes financeiros
 * Builders e helpers para criação de dados de teste
 */

import { addDays, subDays, format } from 'date-fns';

// Types baseados no schema do sistema
export interface Revenue {
  id: string;
  type: 'service' | 'product' | 'commission' | 'other';
  value: number;
  date: string;
  unit_id: string;
  professional_id: string;
  user_id: string;
  account_id: string;
  accrual_start_date?: string;
  accrual_end_date?: string;
  expected_receipt_date?: string;
  actual_receipt_date?: string;
  status: 'Pending' | 'Scheduled' | 'Received' | 'Paid' | 'Overdue' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  type: 'rent' | 'salary' | 'supplies' | 'utilities' | 'other';
  value: number;
  date: string;
  unit_id: string;
  account_id: string;
  expected_payment_date?: string;
  actual_payment_date?: string;
  status: 'pending' | 'scheduled' | 'received' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BankStatement {
  id: string;
  account_id: string;
  transaction_date: string;
  amount: number;
  description: string;
  bank_reference: string;
  status: 'pending' | 'reconciled';
}

export interface Reconciliation {
  id: string;
  statement_id: string;
  revenue_id?: string;
  expense_id?: string;
  amount_difference: number;
  date_difference: number;
  confidence_score: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

// Date helpers
export const DateHelpers = {
  today: () => format(new Date(), 'yyyy-MM-dd'),
  tomorrow: () => format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  yesterday: () => format(subDays(new Date(), 1), 'yyyy-MM-dd'),
  daysFromNow: (days: number) => format(addDays(new Date(), days), 'yyyy-MM-dd'),
  daysAgo: (days: number) => format(subDays(new Date(), days), 'yyyy-MM-dd'),
  currentMonth: () => format(new Date(), 'yyyy-MM'),
  lastMonth: () => format(subDays(new Date(), 30), 'yyyy-MM'),
  iso: (date?: Date) => (date || new Date()).toISOString(),
  addDays: (date: Date, days: number) => addDays(date, days),
};

// Revenue Builder
export class RevenueBuilder {
  private revenue: Partial<Revenue> = {
    id: 'rev-' + Math.random().toString(36).substr(2, 9),
    type: 'service',
    value: 100.00,
    date: DateHelpers.today(),
    unit_id: 'unit-1',
    professional_id: 'prof-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    status: 'Pending', // Status normalizado para compatibilidade com DTO
    created_at: DateHelpers.iso(),
    updated_at: DateHelpers.iso(),
  };

  static create(): RevenueBuilder {
    return new RevenueBuilder();
  }

  withId(id: string): RevenueBuilder {
    this.revenue.id = id;
    return this;
  }

  withType(type: Revenue['type']): RevenueBuilder {
    this.revenue.type = type;
    return this;
  }

  withValue(value: number): RevenueBuilder {
    this.revenue.value = value;
    return this;
  }

  withDate(date: string): RevenueBuilder {
    this.revenue.date = date;
    return this;
  }

  withUnit(unitId: string): RevenueBuilder {
    this.revenue.unit_id = unitId;
    return this;
  }

  withStatus(status: Revenue['status']): RevenueBuilder {
    this.revenue.status = status;
    return this;
  }

  withAccrualPeriod(start: string, end: string): RevenueBuilder {
    this.revenue.accrual_start_date = start;
    this.revenue.accrual_end_date = end;
    return this;
  }

  withReceiptDates(expected?: string, actual?: string): RevenueBuilder {
    this.revenue.expected_receipt_date = expected;
    this.revenue.actual_receipt_date = actual;
    return this;
  }

  overdue(): RevenueBuilder {
    this.revenue.status = 'Overdue';
    this.revenue.expected_receipt_date = DateHelpers.daysAgo(5);
    return this;
  }

  received(): RevenueBuilder {
    this.revenue.status = 'Received';
    this.revenue.actual_receipt_date = DateHelpers.today();
    return this;
  }

  build(): Revenue {
    return this.revenue as Revenue;
  }
}

// Expense Builder
export class ExpenseBuilder {
  private expense: Partial<Expense> = {
    id: 'exp-' + Math.random().toString(36).substr(2, 9),
    type: 'supplies',
    value: 50.00,
    date: DateHelpers.today(),
    unit_id: 'unit-1',
    account_id: 'acc-1',
    status: 'pending',
    created_at: DateHelpers.iso(),
    updated_at: DateHelpers.iso(),
  };

  static create(): ExpenseBuilder {
    return new ExpenseBuilder();
  }

  withType(type: Expense['type']): ExpenseBuilder {
    this.expense.type = type;
    return this;
  }

  withValue(value: number): ExpenseBuilder {
    this.expense.value = value;
    return this;
  }

  withStatus(status: Expense['status']): ExpenseBuilder {
    this.expense.status = status;
    return this;
  }

  paid(): ExpenseBuilder {
    this.expense.status = 'paid';
    this.expense.actual_payment_date = DateHelpers.today();
    return this;
  }

  build(): Expense {
    return this.expense as Expense;
  }
}

// Bank Statement Builder
export class BankStatementBuilder {
  private statement: Partial<BankStatement> = {
    id: 'stmt-' + Math.random().toString(36).substr(2, 9),
    account_id: 'acc-1',
    transaction_date: DateHelpers.today(),
    amount: 100.00,
    description: 'TED RECEBIDA',
    bank_reference: 'REF' + Math.random().toString().substr(2, 8),
    status: 'pending',
  };

  static create(): BankStatementBuilder {
    return new BankStatementBuilder();
  }

  withAmount(amount: number): BankStatementBuilder {
    this.statement.amount = amount;
    return this;
  }

  withDate(date: string): BankStatementBuilder {
    this.statement.transaction_date = date;
    return this;
  }

  withDescription(description: string): BankStatementBuilder {
    this.statement.description = description;
    return this;
  }

  withId(id: string): BankStatementBuilder {
    this.statement.id = id;
    return this;
  }

  reconciled(): BankStatementBuilder {
    this.statement.status = 'reconciled';
    return this;
  }

  build(): BankStatement {
    return this.statement as BankStatement;
  }
}

// Reconciliation Builder
export class ReconciliationBuilder {
  private reconciliation: Partial<Reconciliation> = {
    id: 'rec-' + Math.random().toString(36).substr(2, 9),
    statement_id: 'stmt-1',
    revenue_id: 'rev-1',
    amount_difference: 0,
    date_difference: 0,
    confidence_score: 100,
    status: 'pending',
    created_at: DateHelpers.iso(),
  };

  static create(): ReconciliationBuilder {
    return new ReconciliationBuilder();
  }

  withAmountDifference(diff: number): ReconciliationBuilder {
    this.reconciliation.amount_difference = diff;
    return this;
  }

  withDateDifference(diff: number): ReconciliationBuilder {
    this.reconciliation.date_difference = diff;
    return this;
  }

  withConfidenceScore(score: number): ReconciliationBuilder {
    this.reconciliation.confidence_score = score;
    return this;
  }

  withId(id: string): ReconciliationBuilder {
    this.reconciliation.id = id;
    return this;
  }

  confirmed(): ReconciliationBuilder {
    this.reconciliation.status = 'confirmed';
    return this;
  }

  build(): Reconciliation {
    return this.reconciliation as Reconciliation;
  }
}

// Factory helpers for common scenarios
export const FinancialFixtures = {
  // Cenários de receitas
  makeServiceRevenue: (value = 150, overrides = {}) => {
    const revenue = RevenueBuilder.create().withType('service').withValue(value).build();
    return { ...revenue, ...overrides };
  },
  
  makeProductRevenue: (value = 80, overrides = {}) => {
    const revenue = RevenueBuilder.create().withType('product').withValue(value).build();
    return { ...revenue, ...overrides };
  },
  
  makeOverdueRevenue: (daysOverdue = 5) => 
    RevenueBuilder.create()
      .withStatus('Overdue')
      .withReceiptDates(DateHelpers.daysAgo(daysOverdue))
      .build(),

  makeReceivedRevenue: () => 
    RevenueBuilder.create().received().build(),

  // Cenários de despesas
  makeExpense: (value = 200) => 
    ExpenseBuilder.create().withValue(value).build(),
    
  makeRentExpense: (value = 2000) => 
    ExpenseBuilder.create().withType('rent').withValue(value).build(),

  makePaidExpense: () =>
    ExpenseBuilder.create().paid().build(),  // Cenários de conciliação
  makeExactMatch: () => ({
    statement: BankStatementBuilder.create().withAmount(100).build(),
    revenue: RevenueBuilder.create().withValue(100).build(),
  }),

  makeAmountMismatch: (tolerance = 0.50) => ({
    statement: BankStatementBuilder.create().withAmount(100).build(),
    revenue: RevenueBuilder.create().withValue(100 + tolerance).build(),
  }),

  makeDateMismatch: (daysDiff = 2) => ({
    statement: BankStatementBuilder.create().withDate(DateHelpers.today()).build(),
    revenue: RevenueBuilder.create().withReceiptDates(DateHelpers.daysFromNow(daysDiff)).build(),
  }),

  // Cenários de KPIs
  makeMonthlyData: (month: string) => ({
    revenues: [
      RevenueBuilder.create().withDate(`${month}-15`).withValue(1000).received().build(),
      RevenueBuilder.create().withDate(`${month}-20`).withValue(500).received().build(),
    ],
    expenses: [
      ExpenseBuilder.create().withValue(800).paid().build(),
      ExpenseBuilder.create().withValue(300).paid().build(),
    ],
  }),
};

// Mock do Supabase client
export const createSupabaseMock = () => {
  const mockQuery = {
    data: null as any,
    error: null as any,
    count: 0,
  };

  const mockFrom = (table: string) => ({
    select: (columns = '*') => ({
      ...mockQuery,
      eq: (column: string, value: any) => mockQuery,
      gte: (column: string, value: any) => mockQuery,
      lte: (column: string, value: any) => mockQuery,
      in: (column: string, values: any[]) => mockQuery,
      order: (column: string, options?: any) => mockQuery,
      limit: (count: number) => mockQuery,
      single: () => mockQuery,
      range: (from: number, to: number) => mockQuery,
    }),
    insert: (data: any) => ({
      ...mockQuery,
      select: (columns = '*') => mockQuery,
      single: () => mockQuery,
    }),
    update: (data: any) => ({
      ...mockQuery,
      eq: (column: string, value: any) => mockQuery,
      select: (columns = '*') => mockQuery,
    }),
    delete: () => ({
      ...mockQuery,
      eq: (column: string, value: any) => mockQuery,
    }),
  });

  return {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-1' } } }
      }),
      getUser: vi.fn(),
    },
  };
};