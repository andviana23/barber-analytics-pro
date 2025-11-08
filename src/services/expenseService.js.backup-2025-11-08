/**
 * @fileoverview Service Layer para lógica de negócio de despesas
 * @module services/expenseService
 * @requires repositories/expenseRepository
 * @requires dtos/expenseDTO
 * @description
 * Camada de lógica de negócio (Business Logic Layer) para expenses.
 * Segue Clean Architecture - Service Pattern.
 * Contém validações, regras de negócio e orquestração de operações.
 *
 * @author Andrey Viana
 * @date 07/11/2025
 */

import expenseRepository from '@/repositories/expenseRepository';
import {
  CreateExpenseDTO,
  UpdateExpenseDTO,
  validateRecurringExpense,
  calculateTotalInstallments,
} from '@/dtos/expenseDTO';
import { format, addMonths } from 'date-fns';

/**
 * Serviço de gerenciamento de despesas
 */
const expenseService = {
  /**
   * Busca despesas por período
   * @param {string} unitId - ID da unidade
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async findByPeriod(unitId, startDate, endDate) {
    // Validações básicas
    if (!unitId) {
      return { data: null, error: 'ID da unidade é obrigatório' };
    }

    if (!startDate || !endDate) {
      return {
        data: null,
        error: 'Período (data inicial e final) é obrigatório',
      };
    }

    if (startDate > endDate) {
      return {
        data: null,
        error: 'Data inicial não pode ser maior que data final',
      };
    }

    return await expenseRepository.findByPeriod(unitId, startDate, endDate);
  },

  /**
   * Busca uma despesa por ID
   * @param {string} id - ID da despesa
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async findById(id) {
    if (!id) {
      return { data: null, error: 'ID da despesa é obrigatório' };
    }

    return await expenseRepository.findById(id);
  },

  /**
   * Cria uma nova despesa (única ou origem de série recorrente)
   * @param {Object} expenseData - Dados da despesa
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async create(expenseData, user) {
    try {
      // Validar com DTO
      const validated = CreateExpenseDTO.parse(expenseData);

      // Adicionar audit fields
      const dataToInsert = {
        ...validated,
        user_id: user?.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Inserir no banco
      const result = await expenseRepository.create(dataToInsert);

      if (result.error) {
        return { data: null, error: result.error };
      }

      return {
        data: result.data,
        error: null,
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        );
        return { data: null, error: errors.join(', ') };
      }

      return { data: null, error: 'Erro ao criar despesa' };
    }
  },

  /**
   * Atualiza uma despesa existente
   * @param {string} id - ID da despesa
   * @param {Object} updates - Dados a atualizar
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async update(id, updates, user) {
    try {
      // Validar com DTO
      const validated = UpdateExpenseDTO.parse({ id, ...updates });

      // Buscar despesa atual
      const currentExpense = await expenseRepository.findById(id);
      if (currentExpense.error || !currentExpense.data) {
        return { data: null, error: 'Despesa não encontrada' };
      }

      // Verificar se usuário tem permissão
      if (
        currentExpense.data.unit_id !== user?.unit_id &&
        user?.role !== 'admin'
      ) {
        return { data: null, error: 'Sem permissão para editar esta despesa' };
      }

      // Preparar dados
      // eslint-disable-next-line no-unused-vars
      const { id: _, ...dataToUpdate } = validated;
      dataToUpdate.updated_at = new Date().toISOString();

      // Atualizar no banco
      const result = await expenseRepository.update(id, dataToUpdate);

      return result;
    } catch (error) {
      if (error.name === 'ZodError') {
        const errors = error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        );
        return { data: null, error: errors.join(', ') };
      }

      return { data: null, error: 'Erro ao atualizar despesa' };
    }
  },

  /**
   * Remove uma despesa (soft delete)
   * @param {string} id - ID da despesa
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async delete(id, user) {
    if (!id) {
      return { data: false, error: 'ID da despesa é obrigatório' };
    }

    // Buscar despesa atual
    const currentExpense = await expenseRepository.findById(id);
    if (currentExpense.error || !currentExpense.data) {
      return { data: false, error: 'Despesa não encontrada' };
    }

    // Verificar permissão
    if (
      currentExpense.data.unit_id !== user?.unit_id &&
      user?.role !== 'admin'
    ) {
      return { data: false, error: 'Sem permissão para excluir esta despesa' };
    }

    return await expenseRepository.softDelete(id);
  },

  // =====================================================
  // 🔁 MÉTODOS DE DESPESAS RECORRENTES
  // =====================================================

  /**
   * Cria despesa recorrente com todas as parcelas futuras
   * @param {Object} recurringData - Dados da recorrência
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async createRecurring(recurringData, user) {
    try {
      // Validar dados
      const validation = validateRecurringExpense(recurringData);
      if (!validation.isValid) {
        return { data: null, error: validation.errors.join(', ') };
      }

      const {
        expense,
        configuracao,
        cobrar_sempre_no,
        duracao_personalizada,
        unit_id,
        data_inicio,
      } = validation.data;

      // 1. Criar despesa original (primeira parcela)
      const originalExpense = {
        ...expense,
        unit_id,
        date: data_inicio,
        data_competencia: data_inicio,
        expected_payment_date: data_inicio,
        is_recurring: true,
        installment_number: 1,
        user_id: user?.id,
      };

      const expenseResult = await this.create(originalExpense, user);
      if (expenseResult.error) {
        return { data: null, error: expenseResult.error };
      }

      const createdExpense = expenseResult.data;

      // 2. Calcular total de parcelas
      const totalParcelas = calculateTotalInstallments(
        configuracao,
        duracao_personalizada
      );

      // 3. Criar configuração de recorrência
      const recurringConfig = {
        expense_id: createdExpense.id,
        unit_id,
        configuracao,
        cobrar_sempre_no,
        duracao_personalizada: duracao_personalizada || null,
        data_inicio,
        total_parcelas: totalParcelas,
        parcelas_geradas: 1, // Já criamos a primeira
        status: 'ativo',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const recurringResult =
        await expenseRepository.createRecurring(recurringConfig);
      if (recurringResult.error) {
        // Rollback: deletar despesa criada
        await expenseRepository.softDelete(createdExpense.id);
        return { data: null, error: recurringResult.error };
      }

      // 4. Gerar parcelas futuras (2 a N)
      const futureExpenses = [];
      for (let i = 2; i <= totalParcelas; i++) {
        const nextDate = addMonths(new Date(data_inicio), i - 1);
        const dueDate = new Date(nextDate);
        dueDate.setDate(
          Math.min(
            cobrar_sempre_no,
            new Date(
              nextDate.getFullYear(),
              nextDate.getMonth() + 1,
              0
            ).getDate()
          )
        );

        const futureExpense = {
          ...originalExpense,
          id: undefined, // Remover ID para criar novo registro
          date: format(nextDate, 'yyyy-MM-dd'),
          data_competencia: format(nextDate, 'yyyy-MM-dd'),
          expected_payment_date: format(dueDate, 'yyyy-MM-dd'),
          description: `${expense.description} (${i}/${totalParcelas})`,
          observations: `Gerado automaticamente pela recorrência. Origem: ${createdExpense.id}`,
          recurring_series_id: createdExpense.id,
          installment_number: i,
          recurrence_metadata: {
            recurring_expense_id: recurringResult.data.id,
            configuracao,
            cobrar_sempre_no,
            generated_at: new Date().toISOString(),
          },
        };

        futureExpenses.push(futureExpense);
      }

      // Inserir parcelas futuras em lote (se houver)
      if (futureExpenses.length > 0) {
        for (const futureExpense of futureExpenses) {
          await expenseRepository.create(futureExpense);
        }
      }

      return {
        data: {
          expense: createdExpense,
          recurring: recurringResult.data,
          totalInstallments: totalParcelas,
          message: `Despesa recorrente criada com sucesso! ${totalParcelas} parcelas geradas.`,
        },
        error: null,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Erro ao criar despesa recorrente:', error);
      return { data: null, error: 'Erro ao criar despesa recorrente' };
    }
  },

  /**
   * Busca todas as recorrências de uma unidade
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async findRecurringByUnit(unitId) {
    if (!unitId) {
      return { data: null, error: 'ID da unidade é obrigatório' };
    }

    return await expenseRepository.findRecurringByUnit(unitId);
  },

  /**
   * Busca todas as parcelas de uma série recorrente
   * @param {string} recurringSeriesId - ID da despesa origem
   * @returns {Promise<{data: Array|null, error: string|null}>}
   */
  async findSeries(recurringSeriesId) {
    if (!recurringSeriesId) {
      return { data: null, error: 'ID da série é obrigatório' };
    }

    return await expenseRepository.findBySeries(recurringSeriesId);
  },

  /**
   * Pausa uma recorrência
   * @param {string} recurringExpenseId - ID da configuração
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async pauseRecurring(recurringExpenseId, user) {
    if (!recurringExpenseId) {
      return { data: false, error: 'ID da recorrência é obrigatório' };
    }

    // Verificar permissão (admin ou gerente)
    if (!['admin', 'gerente'].includes(user?.role)) {
      return { data: false, error: 'Sem permissão para pausar recorrência' };
    }

    return await expenseRepository.toggleRecurring(recurringExpenseId, 'pause');
  },

  /**
   * Retoma uma recorrência pausada
   * @param {string} recurringExpenseId - ID da configuração
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: boolean, error: string|null}>}
   */
  async resumeRecurring(recurringExpenseId, user) {
    if (!recurringExpenseId) {
      return { data: false, error: 'ID da recorrência é obrigatório' };
    }

    // Verificar permissão
    if (!['admin', 'gerente'].includes(user?.role)) {
      return { data: false, error: 'Sem permissão para retomar recorrência' };
    }

    return await expenseRepository.toggleRecurring(
      recurringExpenseId,
      'resume'
    );
  },

  /**
   * Cancela série completa de despesas recorrentes
   * @param {string} recurringExpenseId - ID da configuração
   * @param {boolean} deleteFutureOnly - true = só futuras, false = todas
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async cancelRecurringSeries(
    recurringExpenseId,
    deleteFutureOnly = true,
    user
  ) {
    if (!recurringExpenseId) {
      return { data: null, error: 'ID da recorrência é obrigatório' };
    }

    // Verificar permissão
    if (!['admin', 'gerente'].includes(user?.role)) {
      return { data: null, error: 'Sem permissão para cancelar recorrência' };
    }

    return await expenseRepository.deleteRecurringSeries(
      recurringExpenseId,
      deleteFutureOnly
    );
  },

  /**
   * Gera manualmente a próxima parcela de uma recorrência
   * (Normalmente chamada por Cron Job, mas pode ser manual)
   * @param {string} recurringExpenseId - ID da configuração
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: string|null}>}
   */
  async generateNextInstallment(recurringExpenseId, user) {
    if (!recurringExpenseId) {
      return { data: null, error: 'ID da recorrência é obrigatório' };
    }

    // Verificar permissão
    if (!['admin', 'gerente'].includes(user?.role)) {
      return { data: null, error: 'Sem permissão para gerar parcelas' };
    }

    return await expenseRepository.generateNextInstallment(recurringExpenseId);
  },
};

export default expenseService;
