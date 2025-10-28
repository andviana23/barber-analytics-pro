/**
 * @file OrderDTO.js
 * @description Data Transfer Objects para Orders (Comandas)
 * @module DTOs/Order
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { z } from 'zod';

/**
 * Schema de validação para criação de comanda
 *
 * Valida os dados necessários para criar uma nova comanda
 */
export const createOrderSchema = z.object({
  unitId: z
    .string()
    .uuid('ID da unidade deve ser um UUID válido')
    .min(1, 'ID da unidade é obrigatório'),

  clientId: z
    .string()
    .uuid('ID do cliente deve ser um UUID válido')
    .min(1, 'ID do cliente é obrigatório')
    .describe('Cliente que está sendo atendido'),

  professionalId: z
    .string()
    .uuid('ID do profissional deve ser um UUID válido')
    .min(1, 'ID do profissional é obrigatório')
    .describe('Profissional responsável principal pela comanda'),

  cashRegisterId: z
    .string()
    .uuid('ID do caixa deve ser um UUID válido')
    .optional()
    .describe(
      'Caixa ao qual a comanda está vinculada (preenchido automaticamente pelo service)'
    ),
});

/**
 * Schema de validação para fechamento de comanda
 *
 * Valida os dados necessários para fechar uma comanda
 */
export const closeOrderSchema = z.object({
  closedBy: z
    .string()
    .uuid('ID do usuário deve ser um UUID válido')
    .optional()
    .describe('Usuário que está fechando a comanda'),

  paymentMethodId: z
    .string()
    .uuid('ID da forma de pagamento deve ser um UUID válido')
    .min(1, 'Forma de pagamento é obrigatória')
    .describe('Forma de pagamento utilizada'),

  accountId: z
    .string()
    .uuid('ID da conta deve ser um UUID válido')
    .optional()
    .nullable()
    .describe('Conta bancária de destino (se aplicável)'),
});

/**
 * Schema de validação para cancelamento de comanda
 *
 * Valida os dados necessários para cancelar uma comanda
 */
export const cancelOrderSchema = z.object({
  canceledBy: z
    .string()
    .uuid('ID do usuário deve ser um UUID válido')
    .optional()
    .describe('ID do usuário que está cancelando (opcional)'),

  reason: z
    .string()
    .min(10, 'Motivo do cancelamento deve ter no mínimo 10 caracteres')
    .max(500, 'Motivo do cancelamento não pode exceder 500 caracteres')
    .describe('Motivo do cancelamento da comanda'),
});

/**
 * Schema de validação para filtros de comandas
 *
 * Valida parâmetros de busca e listagem de comandas
 */
export const orderFiltersSchema = z.object({
  unitId: z.string().uuid('ID da unidade deve ser um UUID válido').optional(),

  cashRegisterId: z
    .string()
    .uuid('ID do caixa deve ser um UUID válido')
    .optional(),

  professionalId: z
    .string()
    .uuid('ID do profissional deve ser um UUID válido')
    .optional(),

  clientId: z.string().uuid('ID do cliente deve ser um UUID válido').optional(),

  status: z
    .enum(['open', 'closed', 'canceled'], {
      errorMap: () => ({
        message: 'Status deve ser "open", "closed" ou "canceled"',
      }),
    })
    .optional(),

  startDate: z
    .string()
    .datetime('Data de início deve ser uma data válida no formato ISO')
    .or(z.date())
    .optional(),

  endDate: z
    .string()
    .datetime('Data de fim deve ser uma data válida no formato ISO')
    .or(z.date())
    .optional(),

  page: z
    .number()
    .int()
    .positive('Página deve ser um número positivo')
    .default(1),

  limit: z
    .number()
    .int()
    .positive('Limite deve ser um número positivo')
    .max(100, 'Limite máximo é 100 registros por página')
    .default(20),
});

/**
 * Schema de resposta de comanda
 *
 * Define a estrutura esperada do objeto retornado
 */
export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  clientId: z.string().uuid(),
  professionalId: z.string().uuid(),
  cashRegisterId: z.string().uuid(),
  status: z.enum(['open', 'closed', 'canceled']),
  totalAmount: z.number().nonnegative(),
  createdAt: z.string().datetime().or(z.date()),
  closedAt: z.string().datetime().or(z.date()).nullable(),
});

/**
 * Função helper para validar dados de criação de comanda
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: CreateOrderInput, error?: string }}
 */
export const validateCreateOrder = data => {
  try {
    const validated = createOrderSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
};

/**
 * Função helper para validar dados de fechamento de comanda
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: CloseOrderInput, error?: string }}
 */
export const validateCloseOrder = data => {
  try {
    const validated = closeOrderSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
};

/**
 * Função helper para validar dados de cancelamento de comanda
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: CancelOrderInput, error?: string }}
 */
export const validateCancelOrder = data => {
  try {
    const validated = cancelOrderSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
};
