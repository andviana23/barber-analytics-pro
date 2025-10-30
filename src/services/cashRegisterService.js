/**
 * @file cashRegisterService.js
 * @description Service Layer para Cash Register (Caixa) - Business Logic
 * @module Services/CashRegister
 * @author Andrey Viana
 * @date 2025-10-24
 */

import cashRegisterRepository from '../repositories/cashRegisterRepository';
import {
  validateOpenCashRegister,
  validateCloseCashRegister,
} from '../dtos/CashRegisterDTO';
import { toast } from 'react-hot-toast';
import { supabase } from './supabase';

/**
 * Roles permitidos para gerenciar caixa
 */
const ALLOWED_ROLES = ['recepcionista', 'gerente', 'administrador'];

/**
 * Service para gerenciar regras de negócio de Cash Register
 * Camada intermediária entre Controller/UI e Repository
 */
class CashRegisterService {
  /**
   * Valida se o usuário tem permissão para gerenciar caixa
   *
   * @param {Object} user - Usuário autenticado
   * @param {string} user.role - Perfil do usuário
   * @returns {boolean} - True se tem permissão
   * @private
   */
  _hasPermission(user) {
    if (!user) {
      return false;
    }

    // ✅ Normalizar role: pode estar em user.role ou user.user_metadata.role
    const userRole = user.user_metadata?.role || user.role;

    if (!userRole) {
      return false;
    }

    // ✅ Normalizar 'admin' para 'administrador'
    const normalizedRole = userRole === 'admin' ? 'administrador' : userRole;

    console.log('🔐 [Service] Verificando permissão:', {
      userRole,
      normalizedRole,
      allowedRoles: ALLOWED_ROLES,
      hasPermission: ALLOWED_ROLES.includes(normalizedRole.toLowerCase()),
    });

    return ALLOWED_ROLES.includes(normalizedRole.toLowerCase());
  }

  /**
   * Abre um novo caixa
   *
   * Regras de negócio:
   * - Usuário deve ser Recepcionista, Gerente ou Administrador
   * - Não pode haver outro caixa aberto na mesma unidade
   * - Saldo inicial deve ser >= 0
   *
   * @param {Object} data - Dados para abertura
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async openCashRegister(data, user) {
    try {
      console.log('🔧 [Service] openCashRegister CHAMADO', { data, user });

      // Validação de permissão
      if (!this._hasPermission(user)) {
        console.log('❌ [Service] Sem permissão:', user);
        const error = new Error('Usuário não tem permissão para abrir caixa');
        toast.error(error.message);
        return { data: null, error };
      }

      console.log('✅ [Service] Permissão OK');

      // Validação do DTO
      const validation = validateOpenCashRegister({
        ...data,
        openedBy: user.id,
      });

      console.log('🧪 [Service] Validação DTO:', validation);

      if (!validation.success) {
        console.log('❌ [Service] Validação falhou:', validation.error);
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      console.log('✅ [Service] Validação DTO OK');

      // Verifica se já existe caixa aberto
      console.log('🔍 [Service] Verificando caixa ativo...');
      const { data: hasActive, error: checkError } =
        await cashRegisterRepository.hasActiveCashRegister(data.unitId);

      console.log('🔍 [Service] Resultado hasActive:', {
        hasActive,
        checkError,
      });

      if (checkError) {
        console.log('❌ [Service] Erro ao verificar caixa:', checkError);
        toast.error('Erro ao verificar caixa ativo');
        return { data: null, error: checkError };
      }

      if (hasActive) {
        console.log('⚠️ [Service] Já existe caixa aberto');
        const error = new Error(
          'Já existe um caixa aberto nesta unidade. Feche-o antes de abrir um novo.'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      console.log('✅ [Service] Nenhum caixa ativo, prosseguindo...');

      // Abre o caixa
      console.log(
        '💾 [Service] Chamando repository.openCashRegister...',
        validation.data
      );
      const result = await cashRegisterRepository.openCashRegister(
        validation.data
      );

      console.log('💾 [Service] Resultado do repository:', result);

      if (result.error) {
        console.log('❌ [Service] Erro ao abrir caixa:', result.error);
        toast.error('Erro ao abrir caixa');
        return result;
      }

      console.log('✅ [Service] Caixa aberto com sucesso!');
      toast.success('Caixa aberto com sucesso!');

      // Log de auditoria
      console.info('[CashRegisterService] Caixa aberto:', {
        cashRegisterId: result.data.id,
        userId: user.id,
        unitId: data.unitId,
        openingBalance: data.openingBalance,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao abrir caixa');
      return { data: null, error };
    }
  }

  /**
   * Fecha um caixa existente
   *
   * Regras de negócio:
   * - Usuário deve ter permissão
   * - Não pode haver comandas abertas
   * - Deve calcular diferença entre saldo esperado e informado
   *
   * @param {string} id - ID do caixa
   * @param {Object} data - Dados de fechamento
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async closeCashRegister(id, data, user) {
    try {
      console.log('🔐 [Service] closeCashRegister INICIADO', {
        id,
        data,
        user,
      });

      // Validação de permissão
      if (!this._hasPermission(user)) {
        const error = new Error('Usuário não tem permissão para fechar caixa');
        toast.error(error.message);
        console.error('❌ [Service] Permissão negada', user);
        return { data: null, error };
      }

      console.log('✅ [Service] Permissão validada');

      // Validação do DTO
      const validation = validateCloseCashRegister({
        ...data,
        closedBy: user.id,
      });

      console.log('🧪 [Service] Validação DTO:', validation);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        console.error('❌ [Service] DTO inválido:', validation.error);
        return { data: null, error };
      }

      console.log('✅ [Service] Validação DTO OK');

      // Verifica se existem comandas abertas
      console.log('🔍 [Service] Verificando comandas abertas...');
      const { data: openOrders, error: countError } =
        await cashRegisterRepository.countOpenOrders(id);

      console.log('📊 [Service] Comandas abertas:', { openOrders, countError });

      if (countError) {
        toast.error('Erro ao verificar comandas abertas');
        console.error('❌ [Service] Erro ao contar comandas:', countError);
        return { data: null, error: countError };
      }

      if (openOrders > 0) {
        const error = new Error(
          `Não é possível fechar o caixa. Existem ${openOrders} comanda(s) aberta(s). Feche todas as comandas antes de fechar o caixa.`
        );
        toast.error(error.message);
        console.warn('⚠️ [Service] Comandas abertas detectadas:', openOrders);
        return { data: null, error };
      }

      console.log('✅ [Service] Nenhuma comanda aberta');

      // Busca resumo do caixa para calcular diferença
      console.log('📈 [Service] Buscando resumo do caixa...');
      const { data: summary, error: summaryError } =
        await cashRegisterRepository.getCashRegisterSummary(id);

      console.log('📈 [Service] Resumo:', { summary, summaryError });

      if (summaryError) {
        toast.error('Erro ao buscar resumo do caixa');
        console.error('❌ [Service] Erro ao buscar resumo:', summaryError);
        return { data: null, error: summaryError };
      }

      // Fecha o caixa
      console.log('💾 [Service] Fechando caixa no repository...', {
        id,
        validationData: validation.data,
      });
      const result = await cashRegisterRepository.closeCashRegister(
        id,
        validation.data
      );

      console.log('💾 [Service] Resultado do fechamento:', result);

      if (result.error) {
        toast.error('Erro ao fechar caixa');
        console.error('❌ [Service] Erro ao fechar:', result.error);
        return result;
      }

      console.log('✅ [Service] Caixa fechado com sucesso!');

      // Calcula diferença
      const expectedBalance = summary.expected_balance || 0;
      const difference = data.closingBalance - expectedBalance;

      // Exibe feedback com diferença
      if (Math.abs(difference) < 0.01) {
        toast.success('Caixa fechado com sucesso! Saldo confere. ✅');
      } else if (difference > 0) {
        toast.success(`Caixa fechado! Sobra de R$ ${difference.toFixed(2)} 💰`);
      } else {
        toast.error(
          `Caixa fechado! Falta de R$ ${Math.abs(difference).toFixed(2)} ⚠️`
        );
      }

      // Log de auditoria
      console.info('[CashRegisterService] Caixa fechado:', {
        cashRegisterId: id,
        userId: user.id,
        closingBalance: data.closingBalance,
        expectedBalance,
        difference,
      });

      return {
        data: {
          ...result.data,
          summary: {
            expectedBalance,
            closingBalance: data.closingBalance,
            difference,
          },
        },
        error: null,
      };
    } catch (error) {
      toast.error('Erro inesperado ao fechar caixa');
      return { data: null, error };
    }
  }

  /**
   * Busca o caixa ativo de uma unidade
   *
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getActiveCashRegister(unitId) {
    try {
      const result = await cashRegisterRepository.getActiveCashRegister(unitId);
      return result;
    } catch (error) {
      toast.error('Erro ao buscar caixa ativo');
      return { data: null, error };
    }
  }

  /**
   * Gera relatório detalhado de um caixa
   *
   * @param {string} id - ID do caixa
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getCashRegisterReport(id) {
    try {
      // Busca dados do caixa
      const { data: cashRegister, error: cashError } =
        await cashRegisterRepository.getCashRegisterById(id);

      if (cashError) {
        toast.error('Erro ao buscar dados do caixa');
        return { data: null, error: cashError };
      }

      if (!cashRegister) {
        toast.error('Caixa não encontrado');
        return { data: null, error: new Error('Caixa não encontrado') };
      }

      // Busca comandas (orders) do caixa
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('cash_register_id', id)
        .order('created_at', { ascending: true });

      if (ordersError) {
        console.error('Erro ao buscar comandas do caixa:', ordersError);
      }

      // Transforma comandas em transações para o relatório
      const transactions = (orders || []).map(order => ({
        id: order.id,
        type: 'inflow', // Comandas são sempre entradas
        amount: order.total_amount || 0,
        description: `Comanda #${order.id.substring(0, 8)} - ${order.status === 'closed' ? 'Fechada' : 'Aberta'}`,
        created_at: order.created_at,
      }));

      // Monta relatório completo
      const report = {
        cashRegister: {
          id: cashRegister.id,
          opened_at: cashRegister.opening_time,
          opened_by_name: cashRegister.opener?.name || 'Não informado',
          closed_at: cashRegister.closing_time,
          closed_by_name: cashRegister.closer?.name || null,
          opening_balance: cashRegister.opening_balance,
          closing_balance: cashRegister.closing_balance,
          observations: cashRegister.observations,
          status: cashRegister.status,
        },
        transactions,
      };

      return { data: report, error: null };
    } catch (error) {
      console.error('Erro ao gerar relatório do caixa:', error);
      toast.error('Erro ao gerar relatório do caixa');
      return { data: null, error };
    }
  }

  /**
   * Lista caixas com filtros e paginação
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listCashRegisters(unitId, filters = {}) {
    try {
      const result = await cashRegisterRepository.listCashRegisters(
        unitId,
        filters
      );

      if (result.error) {
        toast.error('Erro ao listar caixas');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao listar caixas');
      return { data: null, error, count: null };
    }
  }

  /**
   * Busca histórico de caixas fechados
   *
   * @param {string} unitId - ID da unidade
   * @param {number} limit - Quantidade de registros
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getCashRegisterHistory(unitId, limit = 10) {
    try {
      const result = await cashRegisterRepository.getCashRegisterHistory(
        unitId,
        limit
      );

      if (result.error) {
        toast.error('Erro ao buscar histórico de caixas');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao buscar histórico');
      return { data: null, error };
    }
  }
}

export default new CashRegisterService();
