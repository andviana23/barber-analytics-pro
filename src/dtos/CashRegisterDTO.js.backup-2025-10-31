/**
 * @file CashRegisterDTO.js
 * @description Data Transfer Objects para Cash Register (Caixa)
 * @module DTOs/CashRegister
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { z } from 'zod';

/**
 * Schema de validação para abertura de caixa
 *
 * Valida os dados necessários para abrir um novo caixa
 */
export const openCashRegisterSchema = z.object({
  unitId: z
    .string()
    .uuid('ID da unidade deve ser um UUID válido')
    .min(1, 'ID da unidade é obrigatório'),

  openedBy: z
    .string()
    .uuid('ID do usuário deve ser um UUID válido')
    .min(1, 'ID do usuário que está abrindo o caixa é obrigatório'),

  openingBalance: z
    .number()
    .nonnegative('Saldo de abertura deve ser maior ou igual a zero')
    .default(0)
    .describe('Saldo inicial do caixa em reais'),

  observations: z
    .string()
    .max(500, 'Observações não podem exceder 500 caracteres')
    .optional()
    .nullable()
    .describe('Observações sobre a abertura do caixa'),
});

/**
 * Schema de validação para fechamento de caixa
 *
 * Valida os dados necessários para fechar um caixa existente
 */
export const closeCashRegisterSchema = z.object({
  closedBy: z
    .string()
    .uuid('ID do usuário deve ser um UUID válido')
    .min(1, 'ID do usuário que está fechando o caixa é obrigatório'),

  closingBalance: z
    .number()
    .nonnegative('Saldo de fechamento deve ser maior ou igual a zero')
    .describe('Saldo informado no fechamento do caixa'),

  observations: z
    .string()
    .max(500, 'Observações não podem exceder 500 caracteres')
    .optional()
    .nullable()
    .describe(
      'Observações sobre o fechamento do caixa (ex: diferenças, motivos)'
    ),
});

/**
 * Schema de validação para consulta/filtros de caixa
 *
 * Valida parâmetros de busca e listagem de caixas
 */
export const cashRegisterFiltersSchema = z.object({
  unitId: z.string().uuid('ID da unidade deve ser um UUID válido').optional(),

  status: z
    .enum(['open', 'closed'], {
      errorMap: () => ({ message: 'Status deve ser "open" ou "closed"' }),
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
 * Schema de resposta de abertura de caixa
 *
 * Define a estrutura esperada do objeto retornado após abertura
 */
export const cashRegisterResponseSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  openedBy: z.string().uuid(),
  closedBy: z.string().uuid().nullable(),
  openingTime: z.string().datetime().or(z.date()),
  closingTime: z.string().datetime().or(z.date()).nullable(),
  openingBalance: z.number().nonnegative(),
  closingBalance: z.number().nonnegative().nullable(),
  status: z.enum(['open', 'closed']),
  observations: z.string().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

/**
 * Função helper para validar dados de abertura de caixa
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: OpenCashRegisterInput, error?: string }}
 */
export const validateOpenCashRegister = data => {
  try {
    const validated = openCashRegisterSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
};

/**
 * Função helper para validar dados de fechamento de caixa
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: CloseCashRegisterInput, error?: string }}
 */
export const validateCloseCashRegister = data => {
  try {
    const validated = closeCashRegisterSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', '),
      };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
};
