/**
 * @file serviceService.js
 * @description Service Layer para Services (Serviços) - Business Logic
 * @module Services/Service
 * @author Andrey Viana
 * @date 2025-10-24
 */

import serviceRepository from '../repositories/serviceRepository';
import {
  validateCreateService,
  validateUpdateService,
  calculateCommission,
} from '../dtos/ServiceDTO';
import { toast } from 'react-hot-toast';

/**
 * Roles permitidos para gerenciar serviços
 */
const ALLOWED_ROLES = ['gerente', 'administrador'];

/**
 * Service para gerenciar regras de negócio de Services
 * Camada intermediária entre Controller/UI e Repository
 */
class ServiceService {
  /**
   * Valida se o usuário tem permissão para gerenciar serviços
   *
   * @param {Object} user - Usuário autenticado
   * @param {string} user.role - Perfil do usuário
   * @returns {boolean} - True se tem permissão
   * @private
   */
  _hasPermission(user) {
    if (!user || !user.role) {
      return false;
    }
    return ALLOWED_ROLES.includes(user.role.toLowerCase());
  }

  /**
   * Cria um novo serviço
   *
   * Regras de negócio:
   * - Apenas Gerente e Administrador podem criar
   * - Nome deve ser único na unidade
   * - Preço e comissão devem ser válidos
   *
   * @param {Object} data - Dados do serviço
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async createService(data, user) {
    try {
      console.log('🔐 serviceService.createService - user recebido:', user);
      console.log('🔐 user.role:', user?.role);
      console.log('🔐 ALLOWED_ROLES:', ALLOWED_ROLES);

      // Validação de permissão
      if (!this._hasPermission(user)) {
        const error = new Error(
          'Apenas Gerente e Administrador podem criar serviços'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Validação do DTO
      const validation = validateCreateService(data);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Validação de negócio adicional
      if (validation.data.price <= 0) {
        const error = new Error('O preço do serviço deve ser maior que zero');
        toast.error(error.message);
        return { data: null, error };
      }

      if (
        validation.data.commissionPercentage < 0 ||
        validation.data.commissionPercentage > 100
      ) {
        const error = new Error('A comissão deve estar entre 0% e 100%');
        toast.error(error.message);
        return { data: null, error };
      }

      // Cria o serviço
      const result = await serviceRepository.createService(validation.data);

      if (result.error) {
        toast.error('Erro ao criar serviço');
        return result;
      }

      toast.success(`Serviço "${validation.data.name}" criado com sucesso!`);

      // Log de auditoria
      console.info('[ServiceService] Serviço criado:', {
        serviceId: result.data.id,
        userId: user.id,
        name: validation.data.name,
        price: validation.data.price,
        commission: validation.data.commissionPercentage,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao criar serviço');
      return { data: null, error };
    }
  }

  /**
   * Atualiza um serviço existente
   *
   * @param {string} id - ID do serviço
   * @param {Object} data - Dados a serem atualizados
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async updateService(id, data, user) {
    try {
      // Validação de permissão
      if (!this._hasPermission(user)) {
        const error = new Error(
          'Apenas Gerente e Administrador podem editar serviços'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Validação do DTO
      const validation = validateUpdateService(data);

      if (!validation.success) {
        const error = new Error(validation.error);
        toast.error(`Dados inválidos: ${validation.error}`);
        return { data: null, error };
      }

      // Validações de negócio adicionais
      if (validation.data.price !== undefined && validation.data.price <= 0) {
        const error = new Error('O preço do serviço deve ser maior que zero');
        toast.error(error.message);
        return { data: null, error };
      }

      if (
        validation.data.commissionPercentage !== undefined &&
        (validation.data.commissionPercentage < 0 ||
          validation.data.commissionPercentage > 100)
      ) {
        const error = new Error('A comissão deve estar entre 0% e 100%');
        toast.error(error.message);
        return { data: null, error };
      }

      // Atualiza o serviço
      const result = await serviceRepository.updateService(id, validation.data);

      if (result.error) {
        toast.error('Erro ao atualizar serviço');
        return result;
      }

      toast.success('Serviço atualizado com sucesso!');

      // Log de auditoria
      console.info('[ServiceService] Serviço atualizado:', {
        serviceId: id,
        userId: user.id,
        changes: validation.data,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao atualizar serviço');
      return { data: null, error };
    }
  }

  /**
   * Desativa um serviço (soft delete)
   *
   * @param {string} id - ID do serviço
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async deleteService(id, user) {
    try {
      // Validação de permissão
      if (!this._hasPermission(user)) {
        const error = new Error(
          'Apenas Gerente e Administrador podem desativar serviços'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      // Verifica se o serviço está sendo usado
      const { data: inUse, error: checkError } =
        await serviceRepository.isServiceInUse(id);

      if (checkError) {
        toast.error('Erro ao verificar uso do serviço');
        return { data: null, error: checkError };
      }

      // Desativa o serviço
      const result = await serviceRepository.deleteService(id);

      if (result.error) {
        toast.error('Erro ao desativar serviço');
        return result;
      }

      if (inUse) {
        toast.success(
          'Serviço desativado! Ele continuará aparecendo em comandas antigas.'
        );
      } else {
        toast.success('Serviço desativado com sucesso!');
      }

      // Log de auditoria
      console.info('[ServiceService] Serviço desativado:', {
        serviceId: id,
        userId: user.id,
        wasInUse: inUse,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao desativar serviço');
      return { data: null, error };
    }
  }

  /**
   * Busca um serviço por ID
   *
   * @param {string} id - ID do serviço
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async getServiceById(id) {
    try {
      const result = await serviceRepository.getServiceById(id);

      if (result.error) {
        toast.error('Erro ao buscar serviço');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao buscar serviço');
      return { data: null, error };
    }
  }

  /**
   * Lista serviços ativos para seleção em comandas
   *
   * @param {string} unitId - ID da unidade
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async listActiveServices(unitId) {
    try {
      const result = await serviceRepository.getActiveServices(unitId);

      if (result.error) {
        toast.error('Erro ao buscar serviços ativos');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao buscar serviços');
      return { data: null, error };
    }
  }

  /**
   * Lista serviços com filtros
   *
   * @param {string} unitId - ID da unidade
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<{data: Array|null, error: Error|null, count: number|null}>}
   */
  async listServices(unitId, filters = {}) {
    try {
      const result = await serviceRepository.listServices(unitId, filters);

      if (result.error) {
        toast.error('Erro ao listar serviços');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao listar serviços');
      return { data: null, error, count: null };
    }
  }

  /**
   * Calcula a comissão de um serviço
   *
   * @param {string} serviceId - ID do serviço
   * @param {number} quantity - Quantidade
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async calculateServiceCommission(serviceId, quantity = 1) {
    try {
      // Busca dados do serviço
      const { data: service, error } =
        await serviceRepository.getServiceById(serviceId);

      if (error) {
        toast.error('Erro ao buscar dados do serviço');
        return { data: null, error };
      }

      // Calcula comissão
      const commissionValue = calculateCommission(
        service.price,
        service.commission_percentage,
        quantity
      );

      const totalValue = service.price * quantity;

      return {
        data: {
          serviceId,
          serviceName: service.name,
          unitPrice: service.price,
          quantity,
          commissionPercentage: service.commission_percentage,
          commissionValue,
          totalValue,
        },
        error: null,
      };
    } catch (error) {
      toast.error('Erro ao calcular comissão');
      return { data: null, error };
    }
  }

  /**
   * Reativa um serviço desativado
   *
   * @param {string} id - ID do serviço
   * @param {Object} user - Usuário autenticado
   * @returns {Promise<{data: Object|null, error: Error|null}>}
   */
  async reactivateService(id, user) {
    try {
      // Validação de permissão
      if (!this._hasPermission(user)) {
        const error = new Error(
          'Apenas Gerente e Administrador podem reativar serviços'
        );
        toast.error(error.message);
        return { data: null, error };
      }

      const result = await serviceRepository.reactivateService(id);

      if (result.error) {
        toast.error('Erro ao reativar serviço');
        return result;
      }

      toast.success('Serviço reativado com sucesso!');

      // Log de auditoria
      console.info('[ServiceService] Serviço reativado:', {
        serviceId: id,
        userId: user.id,
      });

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao reativar serviço');
      return { data: null, error };
    }
  }

  /**
   * Busca serviços populares
   *
   * @param {string} unitId - ID da unidade
   * @param {number} limit - Quantidade de serviços
   * @returns {Promise<{data: Array|null, error: Error|null}>}
   */
  async getPopularServices(unitId, limit = 10) {
    try {
      const result = await serviceRepository.getPopularServices(unitId, limit);

      if (result.error) {
        toast.error('Erro ao buscar serviços populares');
      }

      return result;
    } catch (error) {
      toast.error('Erro inesperado ao buscar serviços populares');
      return { data: null, error };
    }
  }
}

export default new ServiceService();
