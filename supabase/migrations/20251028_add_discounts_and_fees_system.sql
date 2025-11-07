-- ============================================================================
-- Migration: Sistema de Descontos e Taxas
-- Autor: Barber Analytics Pro Team
-- Data: 28/10/2025
-- Descrição: Adiciona suporte para descontos e taxas em comandas com auditoria
-- ============================================================================

-- 1. Adicionar colunas na tabela orders para descontos e taxas
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0 CHECK (discount_value >= 0),
ADD COLUMN IF NOT EXISTS discount_reason TEXT,
ADD COLUMN IF NOT EXISTS discount_applied_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS discount_applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fee_type VARCHAR(20) CHECK (fee_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS fee_value DECIMAL(10,2) DEFAULT 0 CHECK (fee_value >= 0),
ADD COLUMN IF NOT EXISTS fee_reason TEXT,
ADD COLUMN IF NOT EXISTS fee_applied_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS fee_applied_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.discount_type IS 'Tipo de desconto: percentage (%) ou fixed (valor fixo)';
COMMENT ON COLUMN orders.discount_value IS 'Valor do desconto (porcentagem ou valor fixo)';
COMMENT ON COLUMN orders.discount_reason IS 'Motivo do desconto para auditoria';
COMMENT ON COLUMN orders.discount_applied_by IS 'Usuário que aplicou o desconto';
COMMENT ON COLUMN orders.discount_applied_at IS 'Data/hora de aplicação do desconto';
COMMENT ON COLUMN orders.fee_type IS 'Tipo de taxa: percentage (%) ou fixed (valor fixo)';
COMMENT ON COLUMN orders.fee_value IS 'Valor da taxa (porcentagem ou valor fixo)';
COMMENT ON COLUMN orders.fee_reason IS 'Motivo da taxa para auditoria';
COMMENT ON COLUMN orders.fee_applied_by IS 'Usuário que aplicou a taxa';
COMMENT ON COLUMN orders.fee_applied_at IS 'Data/hora de aplicação da taxa';

-- 2. Criar tabela de histórico de ajustes (descontos e taxas)
CREATE TABLE IF NOT EXISTS order_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('discount', 'fee')),
  value_type VARCHAR(20) NOT NULL CHECK (value_type IN ('percentage', 'fixed')),
  value DECIMAL(10,2) NOT NULL CHECK (value >= 0),
  reason TEXT,
  applied_by UUID NOT NULL REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reverted BOOLEAN DEFAULT FALSE,
  reverted_by UUID REFERENCES auth.users(id),
  reverted_at TIMESTAMPTZ,
  reverted_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_adjustments IS 'Histórico completo de ajustes (descontos e taxas) aplicados em comandas';
COMMENT ON COLUMN order_adjustments.adjustment_type IS 'Tipo de ajuste: discount ou fee';
COMMENT ON COLUMN order_adjustments.value_type IS 'Tipo de valor: percentage (%) ou fixed (valor fixo)';
COMMENT ON COLUMN order_adjustments.value IS 'Valor do ajuste (porcentagem ou valor fixo)';
COMMENT ON COLUMN order_adjustments.reason IS 'Motivo do ajuste para auditoria';
COMMENT ON COLUMN order_adjustments.applied_by IS 'Usuário que aplicou o ajuste';
COMMENT ON COLUMN order_adjustments.reverted IS 'Indica se o ajuste foi revertido';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_discount_applied_by ON orders(discount_applied_by);
CREATE INDEX IF NOT EXISTS idx_orders_fee_applied_by ON orders(fee_applied_by);
CREATE INDEX IF NOT EXISTS idx_order_adjustments_order_id ON order_adjustments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_adjustments_applied_by ON order_adjustments(applied_by);
CREATE INDEX IF NOT EXISTS idx_order_adjustments_applied_at ON order_adjustments(applied_at);

-- 4. Criar função para calcular total com descontos e taxas
CREATE OR REPLACE FUNCTION fn_calculate_order_final_total(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_subtotal DECIMAL(10,2);
  v_discount_amount DECIMAL(10,2) := 0;
  v_fee_amount DECIMAL(10,2) := 0;
  v_total DECIMAL(10,2);
BEGIN
  -- Buscar dados da comanda
  SELECT 
    discount_type, 
    discount_value,
    fee_type,
    fee_value
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada: %', p_order_id;
  END IF;

  -- Calcular subtotal dos itens
  SELECT COALESCE(SUM(
    CASE 
      WHEN oi.service_id IS NOT NULL THEN s.price * oi.quantity
      WHEN oi.product_id IS NOT NULL THEN p.price * oi.quantity
      ELSE 0
    END
  ), 0)
  INTO v_subtotal
  FROM order_items oi
  LEFT JOIN services s ON s.id = oi.service_id
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = p_order_id;

  -- Calcular desconto
  IF v_order.discount_type = 'percentage' THEN
    v_discount_amount := (v_subtotal * v_order.discount_value / 100);
  ELSIF v_order.discount_type = 'fixed' THEN
    v_discount_amount := v_order.discount_value;
  END IF;

  -- Aplicar desconto ao subtotal
  v_total := v_subtotal - v_discount_amount;

  -- Calcular taxa sobre o valor com desconto
  IF v_order.fee_type = 'percentage' THEN
    v_fee_amount := (v_total * v_order.fee_value / 100);
  ELSIF v_order.fee_type = 'fixed' THEN
    v_fee_amount := v_order.fee_value;
  END IF;

  -- Total final
  v_total := v_total + v_fee_amount;

  -- Garantir que o total não seja negativo
  IF v_total < 0 THEN
    v_total := 0;
  END IF;

  RETURN jsonb_build_object(
    'subtotal', v_subtotal,
    'discount_amount', v_discount_amount,
    'fee_amount', v_fee_amount,
    'total', v_total
  );
END;
$$;

COMMENT ON FUNCTION fn_calculate_order_final_total IS 'Calcula o total final da comanda considerando descontos e taxas';

-- 5. Criar função para aplicar desconto
CREATE OR REPLACE FUNCTION fn_apply_discount(
  p_order_id UUID,
  p_discount_type VARCHAR(20),
  p_discount_value DECIMAL(10,2),
  p_reason TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_status order_status_enum;
  v_result JSONB;
BEGIN
  -- Validar se a comanda existe e pode receber desconto
  SELECT status INTO v_order_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada';
  END IF;

  -- Verificar se o status permite aplicar desconto
  IF v_order_status = 'CLOSED' OR v_order_status = 'CANCELED' THEN
    RAISE EXCEPTION 'Não é possível aplicar desconto em comanda % ou %', 'CLOSED', 'CANCELED';
  END IF;

  -- Validar tipo de desconto
  IF p_discount_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Tipo de desconto inválido: %', p_discount_type;
  END IF;

  -- Validar valor do desconto
  IF p_discount_value < 0 THEN
    RAISE EXCEPTION 'Valor do desconto não pode ser negativo';
  END IF;

  IF p_discount_type = 'percentage' AND p_discount_value > 100 THEN
    RAISE EXCEPTION 'Desconto percentual não pode ser maior que 100%%';
  END IF;

  -- Atualizar a comanda
  UPDATE orders
  SET 
    discount_type = p_discount_type,
    discount_value = p_discount_value,
    discount_reason = p_reason,
    discount_applied_by = p_user_id,
    discount_applied_at = NOW()
  WHERE id = p_order_id;

  -- Registrar no histórico
  INSERT INTO order_adjustments (
    order_id,
    adjustment_type,
    value_type,
    value,
    reason,
    applied_by
  ) VALUES (
    p_order_id,
    'discount',
    p_discount_type,
    p_discount_value,
    p_reason,
    p_user_id
  );

  -- Retornar novo total
  v_result := fn_calculate_order_final_total(p_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'totals', v_result
  );
END;
$$;

COMMENT ON FUNCTION fn_apply_discount IS 'Aplica desconto em uma comanda e registra no histórico';

-- 6. Criar função para aplicar taxa
CREATE OR REPLACE FUNCTION fn_apply_fee(
  p_order_id UUID,
  p_fee_type VARCHAR(20),
  p_fee_value DECIMAL(10,2),
  p_reason TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_status order_status_enum;
  v_result JSONB;
BEGIN
  -- Validar se a comanda existe e pode receber taxa
  SELECT status INTO v_order_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada';
  END IF;

  -- Verificar se o status permite aplicar taxa
  IF v_order_status = 'CLOSED' OR v_order_status = 'CANCELED' THEN
    RAISE EXCEPTION 'Não é possível aplicar taxa em comanda % ou %', 'CLOSED', 'CANCELED';
  END IF;

  -- Validar tipo de taxa
  IF p_fee_type NOT IN ('percentage', 'fixed') THEN
    RAISE EXCEPTION 'Tipo de taxa inválido: %', p_fee_type;
  END IF;

  -- Validar valor da taxa
  IF p_fee_value < 0 THEN
    RAISE EXCEPTION 'Valor da taxa não pode ser negativo';
  END IF;

  -- Atualizar a comanda
  UPDATE orders
  SET 
    fee_type = p_fee_type,
    fee_value = p_fee_value,
    fee_reason = p_reason,
    fee_applied_by = p_user_id,
    fee_applied_at = NOW()
  WHERE id = p_order_id;

  -- Registrar no histórico
  INSERT INTO order_adjustments (
    order_id,
    adjustment_type,
    value_type,
    value,
    reason,
    applied_by
  ) VALUES (
    p_order_id,
    'fee',
    p_fee_type,
    p_fee_value,
    p_reason,
    p_user_id
  );

  -- Retornar novo total
  v_result := fn_calculate_order_final_total(p_order_id);

  RETURN jsonb_build_object(
    'success', true,
    'totals', v_result
  );
END;
$$;

COMMENT ON FUNCTION fn_apply_fee IS 'Aplica taxa em uma comanda e registra no histórico';

-- 7. Criar RLS policies para order_adjustments
ALTER TABLE order_adjustments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver ajustes da sua unidade
CREATE POLICY order_adjustments_select_policy ON order_adjustments
FOR SELECT USING (
  order_id IN (
    SELECT o.id 
    FROM orders o
    JOIN professionals pr ON pr.unit_id = o.unit_id
    WHERE pr.user_id = auth.uid()
  )
  OR
  (auth.jwt()->>'role')::text IN ('admin', 'gerente')
);

-- Policy: Apenas gerentes e admins podem criar ajustes
CREATE POLICY order_adjustments_insert_policy ON order_adjustments
FOR INSERT WITH CHECK (
  (auth.jwt()->>'role')::text IN ('admin', 'gerente')
);

-- Policy: Não permite edição (imutável após criação)
CREATE POLICY order_adjustments_update_policy ON order_adjustments
FOR UPDATE USING (false);

-- Policy: Apenas admins podem deletar
CREATE POLICY order_adjustments_delete_policy ON order_adjustments
FOR DELETE USING (
  (auth.jwt()->>'role')::text = 'admin'
);

-- 8. Conceder permissões
GRANT EXECUTE ON FUNCTION fn_calculate_order_final_total TO authenticated;
GRANT EXECUTE ON FUNCTION fn_apply_discount TO authenticated;
GRANT EXECUTE ON FUNCTION fn_apply_fee TO authenticated;

GRANT SELECT ON order_adjustments TO authenticated;
GRANT INSERT ON order_adjustments TO authenticated;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
