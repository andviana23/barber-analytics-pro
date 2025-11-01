import { z } from 'zod';

/**
 * DTOs de Validação para Expenses
 *
 * Usa Zod para validação rigorosa de dados antes de inserir no banco.
 * Garante integridade e segurança dos dados.
 */

// ========================================
// 📋 SCHEMAS DE VALIDAÇÃO
// ========================================

/**
 * Schema para criar uma nova despesa
 */
export const CreateExpenseDTO = z.object({
  // Campos obrigatórios
  unit_id: z.string().uuid('ID da unidade deve ser um UUID válido'),
  value: z
    .number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999.99, 'Valor não pode exceder R$ 999.999,99'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  status: z.enum(['Pending', 'Paid', 'Cancelled', 'Overdue'], {
    errorMap: () => ({
      message: 'Status deve ser: Pending, Paid, Cancelled ou Overdue',
    }),
  }),
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(500, 'Descrição não pode exceder 500 caracteres'),

  // Campos opcionais
  type: z.enum(['rent', 'salary', 'supplies', 'utilities', 'other']).optional(),
  account_id: z
    .string()
    .uuid('ID da conta bancária deve ser um UUID válido')
    .optional(),
  category_id: z
    .string()
    .uuid('ID da categoria deve ser um UUID válido')
    .optional(),
  party_id: z
    .string()
    .uuid('ID do fornecedor deve ser um UUID válido')
    .optional(),
  expected_payment_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Data esperada deve estar no formato YYYY-MM-DD'
    )
    .optional(),
  actual_payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data real deve estar no formato YYYY-MM-DD')
    .optional(),
  observations: z
    .string()
    .max(1000, 'Observações não podem exceder 1000 caracteres')
    .optional(),
  user_id: z.string().uuid('ID do usuário deve ser um UUID válido').optional(),
});

/**
 * Schema para atualizar uma despesa existente
 */
export const UpdateExpenseDTO = CreateExpenseDTO.partial().extend({
  id: z.string().uuid('ID da despesa deve ser um UUID válido'),
});

/**
 * Schema para filtros de busca
 */
export const ExpenseFiltersDTO = z.object({
  unit_id: z.string().uuid().optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(['Pending', 'Paid', 'Cancelled', 'Overdue']).optional(),
  type: z.enum(['rent', 'salary', 'supplies', 'utilities', 'other']).optional(),
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  party_id: z.string().uuid().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ========================================
// 🛡️ WHITELIST/BLACKLIST DE CAMPOS
// ========================================

/**
 * Campos permitidos para inserção/atualização na tabela expenses
 * Baseado no schema do banco de dados
 */
export const ALLOWED_EXPENSE_COLUMNS = [
  'id',
  'value',
  'date',
  'status',
  'description',
  'unit_id',
  'account_id',
  'category_id',
  'party_id',
  'expected_payment_date',
  'actual_payment_date',
  'type',
  'observations',
  'user_id',
  'created_at',
  'updated_at',
  'is_active',
];

/**
 * Campos proibidos para inserção/atualização
 * Campos calculados, auto-gerados ou sensíveis
 */
export const FORBIDDEN_EXPENSE_FIELDS = [
  // Campos calculados
  'profit',
  'profit_margin',
  'lucro',
  'margem',

  // Campos auto-gerados
  'created_at',
  'updated_at',
  'is_active',

  // Campos sensíveis
  'internal_notes',
  'admin_notes',
  'system_notes',

  // Campos em português (inconsistência)
  'valor',
  'data',
  'status_pt',
  'descricao',
  'observacoes',
  'tipo',
  'data_pagamento_esperada',
  'data_pagamento_real',
];

// ========================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Validar dados de criação de despesa
 * @param {Object} data - Dados a serem validados
 * @returns {Object} - Resultado da validação
 */
export function validateCreateExpense(data) {
  try {
    const validatedData = CreateExpenseDTO.parse(data);
    return {
      success: true,
      data: validatedData,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        data: null,
        error: 'Dados inválidos',
        details: errorMessages,
      };
    }

    return {
      success: false,
      data: null,
      error: 'Erro de validação inesperado',
      details: [{ field: 'unknown', message: error.message }],
    };
  }
}

/**
 * Validar dados de atualização de despesa
 * @param {Object} data - Dados a serem validados
 * @returns {Object} - Resultado da validação
 */
export function validateUpdateExpense(data) {
  try {
    const validatedData = UpdateExpenseDTO.parse(data);
    return {
      success: true,
      data: validatedData,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        data: null,
        error: 'Dados inválidos',
        details: errorMessages,
      };
    }

    return {
      success: false,
      data: null,
      error: 'Erro de validação inesperado',
      details: [{ field: 'unknown', message: error.message }],
    };
  }
}

/**
 * Validar filtros de busca
 * @param {Object} filters - Filtros a serem validados
 * @returns {Object} - Resultado da validação
 */
export function validateExpenseFilters(filters) {
  try {
    const validatedFilters = ExpenseFiltersDTO.parse(filters);
    return {
      success: true,
      data: validatedFilters,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return {
        success: false,
        data: null,
        error: 'Filtros inválidos',
        details: errorMessages,
      };
    }

    return {
      success: false,
      data: null,
      error: 'Erro de validação inesperado',
      details: [{ field: 'unknown', message: error.message }],
    };
  }
}

/**
 * Sanitizar dados de despesa removendo campos proibidos
 * @param {Object} data - Dados a serem sanitizados
 * @returns {Object} - Dados sanitizados
 */
export function sanitizeExpenseData(data) {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Pular campos proibidos
    if (FORBIDDEN_EXPENSE_FIELDS.includes(key)) {
      continue;
    }

    // Incluir apenas campos permitidos
    if (ALLOWED_EXPENSE_COLUMNS.includes(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Converter dados de despesa para formato de exibição
 * @param {Object} expense - Dados da despesa
 * @returns {Object} - Dados formatados para exibição
 */
export function formatExpenseForDisplay(expense) {
  return {
    id: expense.id,
    value: expense.value,
    formattedValue: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(expense.value),
    date: expense.date,
    formattedDate: new Date(expense.date).toLocaleDateString('pt-BR'),
    status: expense.status,
    statusLabel: getExpenseStatusLabel(expense.status),
    description: expense.description,
    type: expense.type,
    typeLabel: getExpenseTypeLabel(expense.type),
    expectedPaymentDate: expense.expected_payment_date,
    actualPaymentDate: expense.actual_payment_date,
    observations: expense.observations,
    unit: expense.unit,
    bankAccount: expense.bank_account,
    category: expense.category,
    supplier: expense.supplier,
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
  };
}

/**
 * Obter label do status da despesa
 * @param {string} status - Status da despesa
 * @returns {string} - Label formatado
 */
export function getExpenseStatusLabel(status) {
  const statusLabels = {
    Pending: 'Pendente',
    Paid: 'Pago',
    Cancelled: 'Cancelado',
    Overdue: 'Vencido',
  };

  return statusLabels[status] || status;
}

/**
 * Obter label do tipo da despesa
 * @param {string} type - Tipo da despesa
 * @returns {string} - Label formatado
 */
export function getExpenseTypeLabel(type) {
  const typeLabels = {
    rent: 'Aluguel',
    salary: 'Salário',
    supplies: 'Produtos e Insumos',
    utilities: 'Utilidades',
    other: 'Outros',
  };

  return typeLabels[type] || type;
}

// ========================================
// 📊 TIPOS DE EXPENSE
// ========================================

export const EXPENSE_TYPES = [
  { value: 'rent', label: 'Aluguel' },
  { value: 'salary', label: 'Salário' },
  { value: 'supplies', label: 'Produtos e Insumos' },
  { value: 'utilities', label: 'Utilidades' },
  { value: 'other', label: 'Outros' },
];

export const EXPENSE_STATUSES = [
  { value: 'Pending', label: 'Pendente' },
  { value: 'Paid', label: 'Pago' },
  { value: 'Cancelled', label: 'Cancelado' },
  { value: 'Overdue', label: 'Vencido' },
];
