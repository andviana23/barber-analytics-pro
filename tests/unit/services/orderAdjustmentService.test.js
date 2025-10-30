import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  applyDiscount,
  applyFee,
  calculateOrderFinalTotal,
  getOrderAdjustments,
  removeDiscount,
  removeFee,
} from '../../../src/services/orderAdjustmentService';
import { supabase } from '../../../src/services/supabase';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('../../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('orderAdjustmentService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockOrderId = 'order-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('applyDiscount', () => {
    it('deve aplicar desconto percentual com sucesso', async () => {
      const discountData = {
        type: 'percentage',
        value: 10,
        reason: 'Desconto de aniversário',
      };

      const mockResponse = {
        success: true,
        totals: {
          subtotal: 100,
          discount_amount: 10,
          fee_amount: 0,
          total: 90,
        },
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.rpc.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResponse);
      expect(supabase.rpc).toHaveBeenCalledWith('fn_apply_discount', {
        p_order_id: mockOrderId,
        p_discount_type: 'percentage',
        p_discount_value: 10,
        p_reason: 'Desconto de aniversário',
        p_user_id: mockUser.id,
      });
    });

    it('deve aplicar desconto fixo com sucesso', async () => {
      const discountData = {
        type: 'fixed',
        value: 15.5,
        reason: 'Desconto especial',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('fn_apply_discount', {
        p_order_id: mockOrderId,
        p_discount_type: 'fixed',
        p_discount_value: 15.5,
        p_reason: 'Desconto especial',
        p_user_id: mockUser.id,
      });
    });

    it('deve retornar erro quando orderId não é fornecido', async () => {
      const discountData = {
        type: 'percentage',
        value: 10,
        reason: 'Teste',
      };

      const result = await applyDiscount('', discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('ID da comanda é obrigatório');
    });

    it('deve retornar erro quando tipo de desconto é inválido', async () => {
      const discountData = {
        type: 'invalid',
        value: 10,
        reason: 'Teste',
      };

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Tipo de desconto inválido');
    });

    it('deve retornar erro quando valor é negativo', async () => {
      const discountData = {
        type: 'percentage',
        value: -10,
        reason: 'Teste',
      };

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe(
        'Valor do desconto deve ser maior que zero'
      );
    });

    it('deve retornar erro quando motivo é muito curto', async () => {
      const discountData = {
        type: 'percentage',
        value: 10,
        reason: 'AB',
      };

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe(
        'Motivo do desconto é obrigatório (mínimo 3 caracteres)'
      );
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      const discountData = {
        type: 'percentage',
        value: 10,
        reason: 'Teste válido',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Usuário não autenticado');
    });

    it('deve retornar erro quando RPC falha', async () => {
      const discountData = {
        type: 'percentage',
        value: 10,
        reason: 'Teste válido',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await applyDiscount(mockOrderId, discountData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('applyFee', () => {
    it('deve aplicar taxa percentual com sucesso', async () => {
      const feeData = {
        type: 'percentage',
        value: 5,
        reason: 'Taxa de entrega',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await applyFee(mockOrderId, feeData);

      expect(result.error).toBeNull();
      expect(supabase.rpc).toHaveBeenCalledWith('fn_apply_fee', {
        p_order_id: mockOrderId,
        p_fee_type: 'percentage',
        p_fee_value: 5,
        p_reason: 'Taxa de entrega',
        p_user_id: mockUser.id,
      });
    });

    it('deve aplicar taxa fixa com sucesso', async () => {
      const feeData = {
        type: 'fixed',
        value: 7.5,
        reason: 'Taxa de serviço',
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      supabase.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await applyFee(mockOrderId, feeData);

      expect(result.error).toBeNull();
    });

    it('deve retornar erro quando tipo de taxa é inválido', async () => {
      const feeData = {
        type: 'invalid',
        value: 5,
        reason: 'Teste',
      };

      const result = await applyFee(mockOrderId, feeData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Tipo de taxa inválido');
    });
  });

  describe('calculateOrderFinalTotal', () => {
    it('deve calcular total final com sucesso', async () => {
      const mockTotals = {
        subtotal: 100,
        discount_amount: 10,
        fee_amount: 5,
        total: 95,
      };

      supabase.rpc.mockResolvedValue({
        data: mockTotals,
        error: null,
      });

      const result = await calculateOrderFinalTotal(mockOrderId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockTotals);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'fn_calculate_order_final_total',
        {
          p_order_id: mockOrderId,
        }
      );
    });

    it('deve retornar erro quando orderId não é fornecido', async () => {
      const result = await calculateOrderFinalTotal('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('ID da comanda é obrigatório');
    });
  });

  describe('getOrderAdjustments', () => {
    it('deve buscar histórico de ajustes com sucesso', async () => {
      const mockAdjustments = [
        {
          id: 'adj-1',
          order_id: mockOrderId,
          adjustment_type: 'discount',
          value_type: 'percentage',
          value: 10,
          reason: 'Desconto teste',
          applied_at: new Date().toISOString(),
        },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockAdjustments,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await getOrderAdjustments(mockOrderId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockAdjustments);
      expect(supabase.from).toHaveBeenCalledWith('order_adjustments');
    });

    it('deve retornar erro quando orderId não é fornecido', async () => {
      const result = await getOrderAdjustments('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('ID da comanda é obrigatório');
    });
  });

  describe('removeDiscount', () => {
    it('deve remover desconto com sucesso', async () => {
      const mockOrder = {
        id: mockOrderId,
        discount_type: null,
        discount_value: 0,
      };

      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrder,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await removeDiscount(mockOrderId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockOrder);
      expect(toast.success).toHaveBeenCalledWith(
        'Desconto removido com sucesso!'
      );
    });

    it('deve exibir erro quando remoção falha', async () => {
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await removeDiscount(mockOrderId);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('removeFee', () => {
    it('deve remover taxa com sucesso', async () => {
      const mockOrder = {
        id: mockOrderId,
        fee_type: null,
        fee_value: 0,
      };

      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockOrder,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockFrom);

      const result = await removeFee(mockOrderId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockOrder);
      expect(toast.success).toHaveBeenCalledWith('Taxa removida com sucesso!');
    });
  });
});
