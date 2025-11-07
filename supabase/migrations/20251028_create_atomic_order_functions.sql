-- =====================================================
-- Migration: Funções para Transações Atômicas de Comandas
-- Autor: Andrey Viana
-- Data: 28/10/2025
-- Descrição: Implementa funções PostgreSQL para garantir atomicidade
--            nas operações de fechamento de comanda
-- =====================================================

-- SPRINT 2: Transações Atômicas (P0 - Crítico)

-- =====================================================
-- 1️⃣ FUNÇÃO AUXILIAR: fn_calculate_order_totals
-- =====================================================
-- Calcula subtotal, comissões e total de uma comanda
-- Retorna: JSON com os totais calculados

CREATE OR REPLACE FUNCTION fn_calculate_order_totals(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_totals JSON;
BEGIN
  -- Calcula os totais diretamente da tabela order_items
  SELECT json_build_object(
    'subtotal', COALESCE(SUM(quantity * unit_price), 0),
    'total_commission', COALESCE(SUM(commission_value), 0),
    'total_amount', COALESCE(SUM(quantity * unit_price), 0),
    'items_count', COUNT(*)
  )
  INTO v_totals
  FROM order_items
  WHERE order_id = p_order_id;

  RETURN v_totals;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 2️⃣ FUNÇÃO PRINCIPAL: fn_close_order
-- =====================================================
-- Fecha comanda e cria receita em uma TRANSAÇÃO ATÔMICA
-- 
-- Parâmetros:
--   p_order_id: UUID da comanda
--   p_payment_method_id: UUID da forma de pagamento
--   p_account_id: UUID da conta bancária de destino
--   p_user_id: UUID do usuário que está fechando a comanda
--
-- Retorna: JSON com dados da comanda fechada e receita criada
--
-- Benefícios:
--   ✅ Garante atomicidade total (ambas operações ou nenhuma)
--   ✅ Previne inconsistências entre comandas e receitas
--   ✅ Centraliza cálculos no backend (segurança)
--   ✅ Rollback automático em caso de erro

CREATE OR REPLACE FUNCTION fn_close_order(
  p_order_id UUID,
  p_payment_method_id UUID,
  p_account_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_totals JSON;
  v_revenue_id UUID;
  v_result JSON;
  v_observations TEXT;
BEGIN
  -- ==========================================
  -- PASSO 1: Validações iniciais
  -- ==========================================
  
  -- Busca a comanda
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;

  -- Verifica se comanda existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comanda não encontrada: %', p_order_id;
  END IF;

  -- Valida status (deve estar OPEN, IN_PROGRESS ou AWAITING_PAYMENT)
  IF v_order.status NOT IN ('OPEN', 'IN_PROGRESS', 'AWAITING_PAYMENT') THEN
    RAISE EXCEPTION 'Não é possível fechar comanda com status %', v_order.status;
  END IF;

  -- Verifica se tem itens
  IF NOT EXISTS (SELECT 1 FROM order_items WHERE order_id = p_order_id) THEN
    RAISE EXCEPTION 'Não é possível fechar uma comanda sem itens';
  END IF;

  -- ==========================================
  -- PASSO 2: Calcula totais
  -- ==========================================
  
  v_totals := fn_calculate_order_totals(p_order_id);

  -- ==========================================
  -- PASSO 3: Atualiza a comanda (fecha)
  -- ==========================================
  
  UPDATE orders
  SET 
    status = 'CLOSED',
    total_amount = (v_totals->>'total_amount')::DECIMAL,
    payment_method_id = p_payment_method_id,
    account_id = p_account_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- ==========================================
  -- PASSO 4: Cria a receita
  -- ==========================================
  
  -- Monta observações
  v_observations := format(
    'Receita gerada automaticamente da comanda. Itens: %s, Comissão total: R$ %s',
    v_totals->>'items_count',
    ROUND((v_totals->>'total_commission')::DECIMAL, 2)
  );

  -- Insere receita
  INSERT INTO revenues (
    unit_id,
    client_id,
    professional_id,
    user_id,
    payment_method_id,
    account_id,
    amount,
    date,
    status,
    source_type,
    source_id,
    observations
  )
  VALUES (
    v_order.unit_id,
    v_order.client_id,
    v_order.professional_id,
    p_user_id,
    p_payment_method_id,
    p_account_id,
    (v_totals->>'total_amount')::DECIMAL,
    CURRENT_DATE,
    'Received',
    'order',
    p_order_id,
    v_observations
  )
  RETURNING id INTO v_revenue_id;

  -- ==========================================
  -- PASSO 5: Retorna resultado
  -- ==========================================
  
  v_result := json_build_object(
    'success', TRUE,
    'order_id', p_order_id,
    'revenue_id', v_revenue_id,
    'totals', v_totals,
    'message', 'Comanda fechada e receita gerada com sucesso'
  );

  RETURN v_result;

  -- ==========================================
  -- TRATAMENTO DE ERROS
  -- ==========================================
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de qualquer erro, a transação é revertida automaticamente
    RAISE EXCEPTION 'Erro ao fechar comanda: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3️⃣ COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION fn_calculate_order_totals IS 
'Calcula subtotal, comissões e total de uma comanda. Retorna JSON com os valores.';

COMMENT ON FUNCTION fn_close_order IS 
'Fecha comanda e cria receita de forma atômica. Se qualquer operação falhar, faz rollback completo.';

-- =====================================================
-- 4️⃣ GRANTS (Permissões)
-- =====================================================

-- Permite que usuários autenticados executem as funções via RPC
GRANT EXECUTE ON FUNCTION fn_calculate_order_totals TO authenticated;
GRANT EXECUTE ON FUNCTION fn_close_order TO authenticated;

-- =====================================================
-- 5️⃣ TESTES
-- =====================================================

-- Exemplo de uso (descomente para testar manualmente):
/*
-- 1. Calcular totais de uma comanda
SELECT fn_calculate_order_totals('seu-order-id-aqui');

-- 2. Fechar comanda (transação atômica)
SELECT fn_close_order(
  'order-id-aqui'::UUID,
  'payment-method-id-aqui'::UUID,
  'account-id-aqui'::UUID,
  'user-id-aqui'::UUID
);
*/

-- =====================================================
-- ROLLBACK (em caso de necessidade)
-- =====================================================
/*
DROP FUNCTION IF EXISTS fn_close_order(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS fn_calculate_order_totals(UUID);
*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
