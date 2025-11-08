/**
 * @file OrderItemDTO.js
 * @description Data Transfer Objects para Order Items (Itens de Comanda)
 * @module DTOs/OrderItem
 * @author Andrey Viana
 * @date 2025-10-24
 */

import { z } from 'zod';

/**
 * Schema de validação para adicionar item à comanda
 *
 * Valida os dados necessários para adicionar um serviço a uma comanda
 */
export const addOrderItemSchema = z.object({
  orderId: z
    .string()
    .uuid('ID da comanda deve ser um UUID válido')
    .min(1, 'ID da comanda é obrigatório')
    .describe('Comanda à qual o item será adicionado'),

  serviceId: z
    .string()
    .uuid('ID do serviço deve ser um UUID válido')
    .min(1, 'ID do serviço é obrigatório')
    .describe('Serviço que está sendo adicionado'),

  professionalId: z
    .string()
    .uuid('ID do profissional deve ser um UUID válido')
    .min(1, 'ID do profissional é obrigatório')
    .describe('Profissional que executará o serviço'),

  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero')
    .max(100, 'Quantidade não pode exceder 100 unidades')
    .default(1)
    .describe('Quantidade de vezes que o serviço será executado'),

  unitPrice: z
    .number()
    .positive('Preço unitário deve ser maior que zero')
    .max(9999.99, 'Preço unitário não pode exceder R$ 9.999,99')
    .optional()
    .describe(
      'Preço unitário do serviço (se não informado, usa o preço cadastrado)'
    ),

  commissionPercentage: z
    .number()
    .min(0, 'Comissão não pode ser negativa')
    .max(100, 'Comissão não pode exceder 100%')
    .optional()
    .describe(
      'Percentual de comissão (se não informado, usa o percentual do serviço)'
    ),
});

/**
 * Schema de validação para atualização de item de comanda
 *
 * Permite atualizar quantidade de um item já adicionado
 */
export const updateOrderItemSchema = z
  .object({
    quantity: z
      .number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser maior que zero')
      .max(100, 'Quantidade não pode exceder 100 unidades')
      .optional(),

    professionalId: z
      .string()
      .uuid('ID do profissional deve ser um UUID válido')
      .optional()
      .describe('Alterar o profissional responsável pelo serviço'),

    unitPrice: z
      .number()
      .positive('Preço unitário deve ser maior que zero')
      .max(9999.99, 'Preço unitário não pode exceder R$ 9.999,99')
      .optional()
      .describe('Alterar o preço unitário do serviço'),

    commissionPercentage: z
      .number()
      .min(0, 'Comissão não pode ser negativa')
      .max(100, 'Comissão não pode exceder 100%')
      .optional()
      .describe('Alterar o percentual de comissão'),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado para atualização',
  });

/**
 * Schema de resposta de item de comanda
 *
 * Define a estrutura esperada do objeto retornado
 */
export const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  commissionPercentage: z.number().min(0).max(100),
  commissionValue: z.number().nonnegative(),
  totalAmount: z.number().positive(),
  createdAt: z.string().datetime().or(z.date()),
});

/**
 * Schema de cálculo de totais da comanda
 *
 * Usado para validar e calcular valores agregados
 */
export const orderTotalsSchema = z.object({
  subtotal: z.number().nonnegative().describe('Soma dos valores dos itens'),
  totalCommission: z.number().nonnegative().describe('Soma das comissões'),
  totalAmount: z.number().nonnegative().describe('Valor total da comanda'),
  itemsCount: z.number().int().nonnegative().describe('Quantidade de itens'),
});

/**
 * Função helper para validar dados de adição de item
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: AddOrderItemInput, error?: string }}
 */
export const validateAddOrderItem = data => {
  try {
    const validated = addOrderItemSchema.parse(data);
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
 * Função helper para validar dados de atualização de item
 *
 * @param {unknown} data - Dados a serem validados
 * @returns {{ success: boolean, data?: UpdateOrderItemInput, error?: string }}
 */
export const validateUpdateOrderItem = data => {
  try {
    const validated = updateOrderItemSchema.parse(data);
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
 * Função helper para calcular valor total de um item
 *
 * @param {number} unitPrice - Preço unitário
 * @param {number} quantity - Quantidade
 * @returns {number} Valor total do item
 */
export const calculateItemTotal = (unitPrice, quantity) => {
  if (unitPrice <= 0 || quantity <= 0) {
    return 0;
  }
  return unitPrice * quantity;
};

/**
 * Função helper para calcular comissão de um item
 *
 * @param {number} unitPrice - Preço unitário
 * @param {number} quantity - Quantidade
 * @param {number} commissionPercentage - Percentual de comissão
 * @returns {number} Valor da comissão
 */
export const calculateItemCommission = (
  unitPrice,
  quantity,
  commissionPercentage
) => {
  if (unitPrice <= 0 || quantity <= 0 || commissionPercentage < 0) {
    return 0;
  }
  const total = unitPrice * quantity;
  return (total * commissionPercentage) / 100;
};

/**
 * Função helper para calcular totais de uma comanda
 *
 * @param {Array<{unitPrice: number, quantity: number, commissionPercentage: number}>} items - Array de itens
 * @returns {OrderTotals} Totais calculados
 */
export const calculateOrderTotals = items => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      totalCommission: 0,
      totalAmount: 0,
      itemsCount: 0,
    };
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.unitPrice, item.quantity);
  }, 0);

  const totalCommission = items.reduce((sum, item) => {
    return (
      sum +
      calculateItemCommission(
        item.unitPrice,
        item.quantity,
        item.commissionPercentage || 0
      )
    );
  }, 0);

  return {
    subtotal,
    totalCommission,
    totalAmount: subtotal,
    itemsCount: items.length,
  };
};
