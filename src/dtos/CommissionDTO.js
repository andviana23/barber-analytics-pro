import { z } from 'zod';

/**
 * DTOs de Validação para Commissions
 *
 * Usa Zod para validação rigorosa de dados antes de inserir no banco.
 * Garante integridade e segurança dos dados.
 */

// ========================================
// 📋 SCHEMAS DE VALIDAÇÃO
// ========================================

/**
 * Schema para criar uma nova comissão
 */
export const CreateCommissionDTO = z.object({
  // Campos obrigatórios
  unit_id: z.string().uuid('ID da unidade deve ser um UUID válido'),
  professional_id: z.string().uuid('ID do profissional deve ser um UUID válido'),
  amount: z
    .number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999.99, 'Valor não pode exceder R$ 999.999,99'),
  reference_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de referência deve estar no formato YYYY-MM-DD'),

  // Campos opcionais
  order_id: z.string().uuid('ID da comanda deve ser um UUID válido').optional().nullable(),
  description: z
    .string()
    .max(500, 'Descrição não pode exceder 500 caracteres')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Observações não podem exceder 1000 caracteres')
    .optional()
    .nullable(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).default('PENDING').optional(),
});

/**
 * Schema para atualizar uma comissão existente
 */
export const UpdateCommissionDTO = CreateCommissionDTO.partial().extend({
  id: z.string().uuid('ID da comissão deve ser um UUID válido'),
});

/**
 * Schema para marcar comissão como paga
 */
export const MarkCommissionPaidDTO = z.object({
  id: z.string().uuid('ID da comissão deve ser um UUID válido'),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(), // ISO string
  notes: z.string().max(1000).optional().nullable(),
});

/**
 * Schema para filtros de busca
 */
export const CommissionFiltersDTO = z.object({
  unit_id: z.string().uuid().optional(),
  professional_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ========================================
// 🛡️ WHITELIST/BLACKLIST DE CAMPOS
// ========================================

/**
 * Lista de colunas permitidas na tabela commissions
 */
export const ALLOWED_COMMISSION_COLUMNS = [
  'id',
  'unit_id',
  'professional_id',
  'order_id',
  'amount',
  'description',
  'reference_date',
  'status',
  'paid_at',
  'paid_by',
  'notes',
  'created_at',
  'updated_at',
  'created_by',
  'is_active',
];

/**
 * Campos proibidos (não podem ser definidos manualmente)
 */
export const FORBIDDEN_COMMISSION_FIELDS = [
  'id', // Gerado automaticamente
  'created_at', // Gerado automaticamente
  'updated_at', // Gerado automaticamente via trigger
];

// ========================================
// 🔧 FUNÇÕES DE VALIDAÇÃO
// ========================================

/**
 * Valida dados para criar uma comissão
 * @param {Object} data - Dados da comissão
 * @returns {{isValid: boolean, data?: Object, errors?: string[]}}
 */
export function validateCreateCommission(data) {
  try {
    const validated = CreateCommissionDTO.parse(data);
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Erro de validação desconhecido'] };
  }
}

/**
 * Valida dados para atualizar uma comissão
 * @param {Object} data - Dados da comissão
 * @returns {{isValid: boolean, data?: Object, errors?: string[]}}
 */
export function validateUpdateCommission(data) {
  try {
    const validated = UpdateCommissionDTO.parse(data);
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Erro de validação desconhecido'] };
  }
}

/**
 * Valida filtros de busca
 * @param {Object} filters - Filtros de busca
 * @returns {{isValid: boolean, data?: Object, errors?: string[]}}
 */
export function validateCommissionFilters(filters) {
  try {
    const validated = CommissionFiltersDTO.parse(filters);
    return { isValid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Erro de validação desconhecido'] };
  }
}

/**
 * Formata dados de comissão para exibição
 * @param {Object} commission - Dados da comissão
 * @returns {Object} - Dados formatados
 */
export function formatCommissionForDisplay(commission) {
  return {
    ...commission,
    formattedAmount: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(commission.amount || 0),
    statusLabel: getCommissionStatusLabel(commission.status),
    formattedReferenceDate: commission.reference_date
      ? new Date(commission.reference_date).toLocaleDateString('pt-BR')
      : '-',
    formattedPaidAt: commission.paid_at
      ? new Date(commission.paid_at).toLocaleDateString('pt-BR')
      : '-',
  };
}

/**
 * Obter label do status da comissão
 * @param {string} status - Status da comissão
 * @returns {string} - Label formatado
 */
export function getCommissionStatusLabel(status) {
  const labels = {
    PENDING: 'Pendente',
    PAID: 'Paga',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
}

/**
 * Obter cor do status da comissão
 * @param {string} status - Status da comissão
 * @returns {string} - Classe CSS de cor
 */
export function getCommissionStatusColor(status) {
  const colors = {
    PENDING: 'yellow',
    PAID: 'green',
    CANCELLED: 'red',
  };
  return colors[status] || 'gray';
}


