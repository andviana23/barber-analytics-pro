/**
 * @file serviceService.test.js
 * @description Testes unitários para serviceService
 * @module Tests/Services/Service
 * @author Andrey Viana
 * @date 2025-01-24
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock do toast - ANTES dos imports
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do repository - ANTES dos imports
vi.mock('../../src/repositories/serviceRepository', () => ({
  default: {
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn(),
    getServiceById: vi.fn(),
    getActiveServices: vi.fn(),
    listServices: vi.fn(),
    isServiceInUse: vi.fn(),
    reactivateService: vi.fn(),
    getPopularServices: vi.fn(),
  },
}));

// Imports DEPOIS dos mocks
import serviceService from '../../src/services/serviceService';
import serviceRepository from '../../src/repositories/serviceRepository';
import { toast } from 'react-hot-toast';

// Mock do console.info para evitar poluir os logs de teste
vi.spyOn(console, 'info').mockImplementation(() => {});

describe('ServiceService', () => {
  // Mock user válido (Gerente)
  const mockUserGerente = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'gerente',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  // Mock user válido (Admin)
  const mockUserAdmin = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    role: 'administrador',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  // Mock user sem permissão (Profissional)
  const mockUserNoPerm = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    role: 'profissional',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  // Mock user sem permissão (Recepcionista)
  const mockUserRecepcionista = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    role: 'recepcionista',
    unitId: '123e4567-e89b-12d3-a456-426614174001',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createService', () => {
    const validData = {
      unitId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Corte de Cabelo',
      durationMinutes: 30,
      price: 50.0,
      commissionPercentage: 30,
      active: true,
    };

    it('deve criar serviço com sucesso para Gerente', async () => {
      // Arrange
      serviceRepository.createService.mockResolvedValue({
        data: {
          id: 'service-123',
          ...validData,
        },
        error: null,
      });

      // Act
      const result = await serviceService.createService(
        validData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data.id).toBe('service-123');
      expect(toast.success).toHaveBeenCalledWith(
        'Serviço "Corte de Cabelo" criado com sucesso!'
      );
      expect(serviceRepository.createService).toHaveBeenCalledTimes(1);
    });

    it('deve criar serviço com sucesso para Administrador', async () => {
      // Arrange
      serviceRepository.createService.mockResolvedValue({
        data: { id: 'service-123', ...validData },
        error: null,
      });

      // Act
      const result = await serviceService.createService(
        validData,
        mockUserAdmin
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(toast.success).toHaveBeenCalled();
    });

    it('deve rejeitar criação se usuário não tiver permissão (Profissional)', async () => {
      // Act
      const result = await serviceService.createService(
        validData,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain(
        'Apenas Gerente e Administrador podem criar serviços'
      );
      expect(toast.error).toHaveBeenCalled();
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve rejeitar criação se usuário não tiver permissão (Recepcionista)', async () => {
      // Act
      const result = await serviceService.createService(
        validData,
        mockUserRecepcionista
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve rejeitar dados inválidos (preço zero)', async () => {
      // Arrange
      const invalidData = { ...validData, price: 0 };

      // Act
      const result = await serviceService.createService(
        invalidData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(toast.error).toHaveBeenCalled();
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve rejeitar dados inválidos (preço negativo)', async () => {
      // Arrange
      const invalidData = { ...validData, price: -10 };

      // Act
      const result = await serviceService.createService(
        invalidData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve rejeitar comissão inválida (maior que 100)', async () => {
      // Arrange
      const invalidData = { ...validData, commissionPercentage: 150 };

      // Act
      const result = await serviceService.createService(
        invalidData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Comissão não pode exceder 100%');
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve rejeitar comissão inválida (negativa)', async () => {
      // Arrange
      const invalidData = { ...validData, commissionPercentage: -5 };

      // Act
      const result = await serviceService.createService(
        invalidData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(serviceRepository.createService).not.toHaveBeenCalled();
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Database error');
      serviceRepository.createService.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.createService(
        validData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao criar serviço');
    });

    it('deve aceitar comissão 0% (válida)', async () => {
      // Arrange
      const dataWithZeroCommission = { ...validData, commissionPercentage: 0 };
      serviceRepository.createService.mockResolvedValue({
        data: { id: 'service-123', ...dataWithZeroCommission },
        error: null,
      });

      // Act
      const result = await serviceService.createService(
        dataWithZeroCommission,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve aceitar comissão 100% (válida)', async () => {
      // Arrange
      const dataWith100Commission = { ...validData, commissionPercentage: 100 };
      serviceRepository.createService.mockResolvedValue({
        data: { id: 'service-123', ...dataWith100Commission },
        error: null,
      });

      // Act
      const result = await serviceService.createService(
        dataWith100Commission,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });

  describe('updateService', () => {
    const serviceId = 'service-123';
    const updateData = {
      name: 'Corte Premium',
      price: 60.0,
    };

    it('deve atualizar serviço com sucesso para Gerente', async () => {
      // Arrange
      serviceRepository.updateService.mockResolvedValue({
        data: { id: serviceId, ...updateData },
        error: null,
      });

      // Act
      const result = await serviceService.updateService(
        serviceId,
        updateData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(
        'Serviço atualizado com sucesso!'
      );
      expect(serviceRepository.updateService).toHaveBeenCalledWith(
        serviceId,
        updateData
      );
    });

    it('deve atualizar serviço com sucesso para Administrador', async () => {
      // Arrange
      serviceRepository.updateService.mockResolvedValue({
        data: { id: serviceId },
        error: null,
      });

      // Act
      const result = await serviceService.updateService(
        serviceId,
        updateData,
        mockUserAdmin
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve rejeitar atualização se usuário não tiver permissão', async () => {
      // Act
      const result = await serviceService.updateService(
        serviceId,
        updateData,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain(
        'Apenas Gerente e Administrador podem editar serviços'
      );
      expect(serviceRepository.updateService).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização com preço zero', async () => {
      // Arrange
      const invalidUpdate = { price: 0 };

      // Act
      const result = await serviceService.updateService(
        serviceId,
        invalidUpdate,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Preço deve ser maior que zero');
      expect(serviceRepository.updateService).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização com comissão inválida', async () => {
      // Arrange
      const invalidUpdate = { commissionPercentage: 120 };

      // Act
      const result = await serviceService.updateService(
        serviceId,
        invalidUpdate,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(serviceRepository.updateService).not.toHaveBeenCalled();
    });

    it('deve permitir atualização parcial (apenas nome)', async () => {
      // Arrange
      const partialUpdate = { name: 'Novo Nome' };
      serviceRepository.updateService.mockResolvedValue({
        data: { id: serviceId, ...partialUpdate },
        error: null,
      });

      // Act
      const result = await serviceService.updateService(
        serviceId,
        partialUpdate,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Update failed');
      serviceRepository.updateService.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.updateService(
        serviceId,
        updateData,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar serviço');
    });
  });

  describe('deleteService', () => {
    const serviceId = 'service-123';

    it('deve desativar serviço com sucesso quando não está em uso', async () => {
      // Arrange
      serviceRepository.isServiceInUse.mockResolvedValue({
        data: false,
        error: null,
      });

      serviceRepository.deleteService.mockResolvedValue({
        data: { id: serviceId, active: false },
        error: null,
      });

      // Act
      const result = await serviceService.deleteService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(
        'Serviço desativado com sucesso!'
      );
    });

    it('deve desativar serviço em uso com mensagem apropriada', async () => {
      // Arrange
      serviceRepository.isServiceInUse.mockResolvedValue({
        data: true,
        error: null,
      });

      serviceRepository.deleteService.mockResolvedValue({
        data: { id: serviceId, active: false },
        error: null,
      });

      // Act
      const result = await serviceService.deleteService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(
        'Serviço desativado! Ele continuará aparecendo em comandas antigas.'
      );
    });

    it('deve rejeitar desativação se usuário não tiver permissão', async () => {
      // Act
      const result = await serviceService.deleteService(
        serviceId,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain(
        'Apenas Gerente e Administrador podem desativar serviços'
      );
      expect(serviceRepository.deleteService).not.toHaveBeenCalled();
    });

    it('deve lidar com erro ao verificar uso do serviço', async () => {
      // Arrange
      const checkError = new Error('Check failed');
      serviceRepository.isServiceInUse.mockResolvedValue({
        data: null,
        error: checkError,
      });

      // Act
      const result = await serviceService.deleteService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(checkError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao verificar uso do serviço'
      );
      expect(serviceRepository.deleteService).not.toHaveBeenCalled();
    });

    it('deve lidar com erro ao desativar serviço', async () => {
      // Arrange
      serviceRepository.isServiceInUse.mockResolvedValue({
        data: false,
        error: null,
      });

      const dbError = new Error('Delete failed');
      serviceRepository.deleteService.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.deleteService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao desativar serviço');
    });
  });

  describe('getServiceById', () => {
    const serviceId = 'service-123';

    it('deve buscar serviço por ID com sucesso', async () => {
      // Arrange
      const mockService = {
        id: serviceId,
        name: 'Corte de Cabelo',
        price: 50.0,
      };

      serviceRepository.getServiceById.mockResolvedValue({
        data: mockService,
        error: null,
      });

      // Act
      const result = await serviceService.getServiceById(serviceId);

      // Assert
      expect(result.data).toEqual(mockService);
      expect(result.error).toBeNull();
      expect(serviceRepository.getServiceById).toHaveBeenCalledWith(serviceId);
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Not found');
      serviceRepository.getServiceById.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.getServiceById(serviceId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao buscar serviço');
    });
  });

  describe('listActiveServices', () => {
    const unitId = 'unit-123';

    it('deve listar serviços ativos com sucesso', async () => {
      // Arrange
      const mockServices = [
        { id: 'service-1', name: 'Corte', active: true },
        { id: 'service-2', name: 'Barba', active: true },
      ];

      serviceRepository.getActiveServices.mockResolvedValue({
        data: mockServices,
        error: null,
      });

      // Act
      const result = await serviceService.listActiveServices(unitId);

      // Assert
      expect(result.data).toEqual(mockServices);
      expect(result.error).toBeNull();
      expect(serviceRepository.getActiveServices).toHaveBeenCalledWith(unitId);
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Query failed');
      serviceRepository.getActiveServices.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.listActiveServices(unitId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao buscar serviços ativos'
      );
    });
  });

  describe('listServices', () => {
    const unitId = 'unit-123';

    it('deve listar serviços com filtros', async () => {
      // Arrange
      const filters = { active: true, page: 1, limit: 10 };
      const mockServices = [
        { id: 'service-1', name: 'Corte' },
        { id: 'service-2', name: 'Barba' },
      ];

      serviceRepository.listServices.mockResolvedValue({
        data: mockServices,
        error: null,
        count: 2,
      });

      // Act
      const result = await serviceService.listServices(unitId, filters);

      // Assert
      expect(result.data).toEqual(mockServices);
      expect(result.count).toBe(2);
      expect(result.error).toBeNull();
      expect(serviceRepository.listServices).toHaveBeenCalledWith(
        unitId,
        filters
      );
    });

    it('deve listar serviços sem filtros', async () => {
      // Arrange
      serviceRepository.listServices.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      const result = await serviceService.listServices(unitId);

      // Assert
      expect(result.data).toEqual([]);
      expect(serviceRepository.listServices).toHaveBeenCalledWith(unitId, {});
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('List failed');
      serviceRepository.listServices.mockResolvedValue({
        data: null,
        error: dbError,
        count: null,
      });

      // Act
      const result = await serviceService.listServices(unitId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao listar serviços');
    });
  });

  describe('calculateServiceCommission', () => {
    const serviceId = 'service-123';

    it('deve calcular comissão corretamente', async () => {
      // Arrange
      const mockService = {
        id: serviceId,
        name: 'Corte de Cabelo',
        price: 50.0,
        commission_percentage: 30,
      };

      serviceRepository.getServiceById.mockResolvedValue({
        data: mockService,
        error: null,
      });

      // Act
      const result = await serviceService.calculateServiceCommission(
        serviceId,
        2
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(result.data.serviceId).toBe(serviceId);
      expect(result.data.quantity).toBe(2);
      expect(result.data.totalValue).toBe(100.0);
      expect(result.data.commissionValue).toBe(30.0); // 50 * 2 * 30% = 30
    });

    it('deve calcular comissão com quantidade padrão (1)', async () => {
      // Arrange
      const mockService = {
        id: serviceId,
        name: 'Barba',
        price: 30.0,
        commission_percentage: 20,
      };

      serviceRepository.getServiceById.mockResolvedValue({
        data: mockService,
        error: null,
      });

      // Act
      const result = await serviceService.calculateServiceCommission(serviceId);

      // Assert
      expect(result.data.quantity).toBe(1);
      expect(result.data.totalValue).toBe(30.0);
      expect(result.data.commissionValue).toBe(6.0); // 30 * 20% = 6
    });

    it('deve lidar com erro ao buscar serviço', async () => {
      // Arrange
      const dbError = new Error('Service not found');
      serviceRepository.getServiceById.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.calculateServiceCommission(serviceId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao buscar dados do serviço'
      );
    });
  });

  describe('reactivateService', () => {
    const serviceId = 'service-123';

    it('deve reativar serviço com sucesso para Gerente', async () => {
      // Arrange
      serviceRepository.reactivateService.mockResolvedValue({
        data: { id: serviceId, active: true },
        error: null,
      });

      // Act
      const result = await serviceService.reactivateService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(
        'Serviço reativado com sucesso!'
      );
      expect(serviceRepository.reactivateService).toHaveBeenCalledWith(
        serviceId
      );
    });

    it('deve reativar serviço com sucesso para Administrador', async () => {
      // Arrange
      serviceRepository.reactivateService.mockResolvedValue({
        data: { id: serviceId, active: true },
        error: null,
      });

      // Act
      const result = await serviceService.reactivateService(
        serviceId,
        mockUserAdmin
      );

      // Assert
      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });

    it('deve rejeitar reativação se usuário não tiver permissão', async () => {
      // Act
      const result = await serviceService.reactivateService(
        serviceId,
        mockUserNoPerm
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain(
        'Apenas Gerente e Administrador podem reativar serviços'
      );
      expect(serviceRepository.reactivateService).not.toHaveBeenCalled();
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Reactivate failed');
      serviceRepository.reactivateService.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.reactivateService(
        serviceId,
        mockUserGerente
      );

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith('Erro ao reativar serviço');
    });
  });

  describe('getPopularServices', () => {
    const unitId = 'unit-123';

    it('deve buscar serviços populares com limite padrão', async () => {
      // Arrange
      const mockServices = [
        { id: 'service-1', name: 'Corte', usage_count: 100 },
        { id: 'service-2', name: 'Barba', usage_count: 80 },
      ];

      serviceRepository.getPopularServices.mockResolvedValue({
        data: mockServices,
        error: null,
      });

      // Act
      const result = await serviceService.getPopularServices(unitId);

      // Assert
      expect(result.data).toEqual(mockServices);
      expect(result.error).toBeNull();
      expect(serviceRepository.getPopularServices).toHaveBeenCalledWith(
        unitId,
        10
      );
    });

    it('deve buscar serviços populares com limite customizado', async () => {
      // Arrange
      serviceRepository.getPopularServices.mockResolvedValue({
        data: [],
        error: null,
      });

      // Act
      await serviceService.getPopularServices(unitId, 5);

      // Assert
      expect(serviceRepository.getPopularServices).toHaveBeenCalledWith(
        unitId,
        5
      );
    });

    it('deve lidar com erro do repository', async () => {
      // Arrange
      const dbError = new Error('Query failed');
      serviceRepository.getPopularServices.mockResolvedValue({
        data: null,
        error: dbError,
      });

      // Act
      const result = await serviceService.getPopularServices(unitId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBe(dbError);
      expect(toast.error).toHaveBeenCalledWith(
        'Erro ao buscar serviços populares'
      );
    });
  });
});
