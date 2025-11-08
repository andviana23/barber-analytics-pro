import { z } from 'zod';

/**
 * DTOs de Validação para Bank Statements
 *
 * Usa Zod para validação rigorosa de dados antes de inserir no banco.
 * Garante integridade e segurança dos dados de extratos bancários.
 */

// ========================================
// 📋 SCHEMAS DE VALIDAÇÃO
// ========================================

/**
 * Schema para criar uma nova linha de extrato bancário
 */
export const CreateBankStatementDTO = z.object({
  // Campos obrigatórios
  bank_account_id: z
    .string()
    .uuid('ID da conta bancária deve ser um UUID válido'),
  transaction_date: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Data da transação deve estar no formato YYYY-MM-DD'
    ),
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(500, 'Descrição não pode exceder 500 caracteres'),
  amount: z
    .number()
    .refine(val => val !== 0, 'Valor não pode ser zero')
    .max(999999.99, 'Valor não pode exceder R$ 999.999,99'),
  type: z.enum(['Credit', 'Debit'], {
    errorMap: () => ({ message: 'Tipo deve ser: Credit ou Debit' }),
  }),
  source_hash: z
    .string()
    .min(32, 'Hash único deve ter pelo menos 32 caracteres')
    .max(64, 'Hash único não pode exceder 64 caracteres'),

  // Campos opcionais
  status: z.enum(['pending', 'reconciled']).default('pending'),
  reconciled: z.boolean().default(false),
  fitid: z
    .string()
    .max(100, 'FITID não pode exceder 100 caracteres')
    .optional(),
  observations: z
    .string()
    .max(1000, 'Observações não podem exceder 1000 caracteres')
    .optional(),
});

/**
 * Schema para atualizar uma linha de extrato existente
 */
export const UpdateBankStatementDTO = CreateBankStatementDTO.partial().extend({
  id: z.string().uuid('ID do extrato deve ser um UUID válido'),
});

/**
 * Schema para filtros de busca
 */
export const BankStatementFiltersDTO = z.object({
  bank_account_id: z.string().uuid().optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.enum(['Credit', 'Debit']).optional(),
  status: z.enum(['pending', 'reconciled']).optional(),
  reconciled: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ========================================
// 🛡️ WHITELIST/BLACKLIST DE CAMPOS
// ========================================

/**
 * Campos permitidos para inserção/atualização na tabela bank_statements
 * Baseado no schema do banco de dados
 */
export const ALLOWED_BANK_STATEMENT_COLUMNS = [
  'id',
  'bank_account_id',
  'transaction_date',
  'description',
  'amount',
  'type',
  'balance_after',
  'reconciled',
  'status',
  'hash_unique',
  'fitid',
  'observations',
  'is_active',
  'created_at',
  'updated_at',
];

/**
 * Campos proibidos para inserção/atualização
 * Campos calculados, auto-gerados ou sensíveis
 */
export const FORBIDDEN_BANK_STATEMENT_FIELDS = [
  // Campos auto-gerados
  'created_at',
  'updated_at',
  'is_active',

  // Campos sensíveis
  'internal_notes',
  'admin_notes',
  'system_notes',
  'raw_data',
  'parsed_data',

  // Campos em português (inconsistência)
  'conta_bancaria_id',
  'data_transacao',
  'descricao',
  'valor',
  'tipo',
  'status_pt',
  'conciliado',
  'hash_unico',
  'hash_unique', // deprecated: usar source_hash
  'observacoes',
];

// ========================================
// 🔧 FUNÇÕES UTILITÁRIAS
// ========================================

/**
 * Validar dados de criação de extrato bancário
 * @param {Object} data - Dados a serem validados
 * @returns {Object} - Resultado da validação
 */
export function validateCreateBankStatement(data) {
  try {
    const validatedData = CreateBankStatementDTO.parse(data);
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
 * Validar dados de atualização de extrato bancário
 * @param {Object} data - Dados a serem validados
 * @returns {Object} - Resultado da validação
 */
export function validateUpdateBankStatement(data) {
  try {
    const validatedData = UpdateBankStatementDTO.parse(data);
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
export function validateBankStatementFilters(filters) {
  try {
    const validatedFilters = BankStatementFiltersDTO.parse(filters);
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
 * Sanitizar dados de extrato bancário removendo campos proibidos
 * @param {Object} data - Dados a serem sanitizados
 * @returns {Object} - Dados sanitizados
 */
export function sanitizeBankStatementData(data) {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Pular campos proibidos
    if (FORBIDDEN_BANK_STATEMENT_FIELDS.includes(key)) {
      continue;
    }

    // Incluir apenas campos permitidos
    if (ALLOWED_BANK_STATEMENT_COLUMNS.includes(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Converter dados de extrato bancário para formato de exibição
 * @param {Object} statement - Dados do extrato
 * @returns {Object} - Dados formatados para exibição
 */
export function formatBankStatementForDisplay(statement) {
  return {
    id: statement.id,
    data: formatDate(statement.transaction_date),
    descricao: statement.description,
    valor: formatCurrency(Math.abs(statement.amount)),
    tipo: statement.type === 'Credit' ? 'Crédito' : 'Débito',
    saldo: statement.balance_after
      ? formatCurrency(statement.balance_after)
      : 'N/A',
    conciliado: statement.reconciled ? 'Sim' : 'Não',
    status: TRANSACTION_STATUS_MAP[statement.status] || statement.status,
    hash: statement.hash_unique?.substring(0, 8) || 'N/A',
    fitid: statement.fitid || 'N/A',
    observacoes: statement.observations || '',
    created_at: formatDate(statement.created_at),
  };
}

/**
 * Obter label do tipo da transação
 * @param {string} type - Tipo da transação
 * @returns {string} - Label formatado
 */
export function getBankStatementTypeLabel(type) {
  const typeLabels = {
    Credit: 'Crédito',
    Debit: 'Débito',
  };

  return typeLabels[type] || type;
}

/**
 * Obter label do status da transação
 * @param {string} status - Status da transação
 * @returns {string} - Label formatado
 */
export function getBankStatementStatusLabel(status) {
  const statusLabels = {
    pending: 'Pendente',
    reconciled: 'Conciliado',
  };

  return statusLabels[status] || status;
}

/**
 * Gerar hash único para transação bancária
 * @param {string} date - Data da transação (YYYY-MM-DD)
 * @param {number} amount - Valor da transação
 * @param {string} description - Descrição da transação
 * @param {string} bankAccountId - ID da conta bancária
 * @returns {string} - Hash único
 */
export function generateTransactionHash(
  date,
  amount,
  description,
  bankAccountId
) {
  const str = `${date}|${Number(amount).toFixed(2)}|${(description || '').trim()}|${bankAccountId}`;

  // djb2 determinístico
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char; // hash * 33 + char
  }

  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 32);
}

/**
 * Validar se uma transação é duplicata baseada no hash
 * @param {Array} existingStatements - Extratos existentes
 * @param {string} newHash - Hash da nova transação
 * @returns {boolean} - Se é duplicata
 */
export function isDuplicateTransaction(hash, existingHashes = []) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  return existingHashes.some(existing => existing?.hash_unique === hash);
}

/**
 * Filtrar transações por tipo
 * @param {Array} statements - Lista de extratos
 * @param {string} type - Tipo a filtrar (Credit/Debit)
 * @returns {Array} - Extratos filtrados
 */
export function filterStatementsByType(statements, type) {
  return statements.filter(statement => statement.type === type);
}

/**
 * Filtrar transações por status de conciliação
 * @param {Array} statements - Lista de extratos
 * @param {boolean} reconciled - Se está conciliado
 * @returns {Array} - Extratos filtrados
 */
export function filterStatementsByReconciliation(statements, reconciled) {
  return statements.filter(statement => statement.reconciled === reconciled);
}

/**
 * Calcular totais por tipo de transação
 * @param {Array} statements - Lista de extratos
 * @returns {Object} - Totais calculados
 */
export function calculateStatementTotals(statements) {
  const totals = {
    credits: 0,
    debits: 0,
    net: 0,
    count: statements.length,
  };

  statements.forEach(statement => {
    if (statement.type === 'Credit') {
      totals.credits += statement.amount || 0;
    } else if (statement.type === 'Debit') {
      totals.debits += statement.amount || 0;
    }
  });

  totals.net = totals.credits - totals.debits;

  return totals;
}

// ========================================
// 📊 TIPOS DE BANK STATEMENT
// ========================================

export const BANK_STATEMENT_TYPES = [
  { value: 'Credit', label: 'Crédito' },
  { value: 'Debit', label: 'Débito' },
];

export const BANK_STATEMENT_STATUSES = [
  { value: 'pending', label: 'Pendente' },
  { value: 'reconciled', label: 'Conciliado' },
];
