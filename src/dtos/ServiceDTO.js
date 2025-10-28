/**
 * @file ServiceDTO.js
 * @description Data Transfer Objects para Services (Serviços)
 * @module DTOs/Service
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { z } from 'zod';

/**
 * Schema de validação para criação de serviço
 *
 * Valida os dados necessários para criar um novo serviço
 */
export const createServiceSchema = z.object({
  unitId: z
    .string()
    .uuid('ID da unidade deve ser um UUID válido')
    .min(1, 'ID da unidade é obrigatório'),

  name: z
    .string()
    .min(3, 'Nome do serviço deve ter no mínimo 3 caracteres')
    .max(100, 'Nome do serviço não pode exceder 100 caracteres')
    .trim()
    .describe('Nome do serviço oferecido'),

  durationMinutes: z
    .number()
    .int('Duração deve ser um número inteiro')
    .positive('Duração deve ser maior que zero')
    .max(480, 'Duração não pode exceder 8 horas (480 minutos)')
    .describe('Duração estimada do serviço em minutos'),

  price: z
    .number()
    .positive('Preço deve ser maior que zero')
    .max(9999.99, 'Preço não pode exceder R$ 9.999,99')
    .describe('Preço do serviço em reais'),

  commissionPercentage: z
    .number()
    .min(0, 'Comissão não pode ser negativa')
    .max(100, 'Comissão não pode exceder 100%')
    .default(0)
    .describe('Percentual de comissão do profissional (0-100)'),

  active: z.boolean().default(true).describe('Indica se o serviço está ativo'),
});

/**
 * Schema de validação para atualização de serviço
 *
 * Todos os campos são opcionais para permitir atualização parcial
 */
export const updateServiceSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Nome do serviço deve ter no mínimo 3 caracteres')
      .max(100, 'Nome do serviço não pode exceder 100 caracteres')
      .trim()
      .optional(),

    durationMinutes: z
      .number()
      .int('Duração deve ser um número inteiro')
      .positive('Duração deve ser maior que zero')
      .max(480, 'Duração não pode exceder 8 horas (480 minutos)')
      .optional(),

    price: z
      .number()
      .positive('Preço deve ser maior que zero')
      .max(9999.99, 'Preço não pode exceder R$ 9.999,99')
      .optional(),

    commissionPercentage: z
      .number()
      .min(0, 'Comissão não pode ser negativa')
      .max(100, 'Comissão não pode exceder 100%')
      .optional(),

    active: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado para atualização',
  });

/**
 * Schema de validação para filtros de serviços
 *
 * Valida parâmetros de busca e listagem de serviços
 */
export const serviceFiltersSchema = z
  .object({
    unitId: z.string().uuid('ID da unidade deve ser um UUID válido').optional(),

    activeOnly: z
      .boolean()
      .default(true)
      .describe('Se true, retorna apenas serviços ativos'),

    searchTerm: z
      .string()
      .min(1, 'Termo de busca deve ter no mínimo 1 caractere')
      .max(100)
      .optional()
      .describe('Termo para busca no nome do serviço'),

    minPrice: z
      .number()
      .nonnegative('Preço mínimo deve ser maior ou igual a zero')
      .optional(),

    maxPrice: z
      .number()
      .positive('Preço máximo deve ser maior que zero')
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
  })
  .refine(
    data => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    { message: 'Preço mínimo não pode ser maior que preço máximo' }
  );

/**
 * Schema de resposta de serviço
 *
 * Define a estrutura esperada do objeto retornado
 */
export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  name: z.string(),
  durationMinutes: z.number().int().positive(),
  price: z.number().positive(),
  commissionPercentage: z.number().min(0).max(100),
  active: z.boolean(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

/**
 * Função helper para validar dados de criação de serviço
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: CreateServiceInput, error?: string }}
 */
export const validateCreateService = data => {
  try {
    const validated = createServiceSchema.parse(data);
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
 * Função helper para validar dados de atualização de serviço
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: UpdateServiceInput, error?: string }}
 */
export const validateUpdateService = data => {
  try {
    const validated = updateServiceSchema.parse(data);
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
 * Função helper para calcular valor da comissão
 *
 * @param {number} price - Preço do serviço
 * @param {number} commissionPercentage - Percentual de comissão
 * @param {number} quantity - Quantidade (default: 1)
 * @returns {number} Valor da comissão calculada
 */
export const calculateCommission = (
  price,
  commissionPercentage,
  quantity = 1
) => {
  if (price <= 0 || commissionPercentage < 0 || quantity <= 0) {
    return 0;
  }
  return (price * quantity * commissionPercentage) / 100;
};
