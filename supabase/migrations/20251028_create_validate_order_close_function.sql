-- =====================================================
-- Migration: Criar função de validação de fechamento de comanda
-- Descrição: Função RPC para validar se uma comanda pode ser fechada
-- Autor: Andrey Viana
-- Data: 28/10/2025
-- =====================================================

-- Função para validar se uma comanda pode ser fechada
CREATE OR REPLACE FUNCTION fn_validate_order_close(
  p_order_id UUID,
  p_payment_method_id UUID,
  p_account_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_items_count INTEGER;
  v_active_cash_register UUID;
  v_unit_id UUID;
  v_result jsonb;
  v_errors TEXT[] := '{}';
BEGIN
  -- Buscar dados da comanda
  SELECT 
    o.id,
    o.status,
    o.unit_id,
    o.client_id,
    o.created_at
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id AND o.is_active = true;

  -- Validação 1: Comanda existe?
  IF NOT FOUND THEN
    v_errors := array_append(v_errors, 'Comanda não encontrada ou foi excluída');
  ELSE
    v_unit_id := v_order.unit_id;

    -- Validação 2: Status permite fechamento?
    IF v_order.status NOT IN ('open', 'in_progress', 'awaiting_payment') THEN
      v_errors := array_append(v_errors, 'Comanda não pode ser fechada. Status atual: ' || v_order.status);
    END IF;

    -- Validação 3: Possui itens?
    SELECT COUNT(*)
    INTO v_items_count
    FROM order_items
    WHERE order_id = p_order_id AND is_active = true;

    IF v_items_count = 0 THEN
      v_errors := array_append(v_errors, 'Comanda não possui itens');
    END IF;

    -- Validação 4: Existe caixa aberto na unidade?
    SELECT id
    INTO v_active_cash_register
    FROM cash_registers
    WHERE unit_id = v_unit_id
      AND status = 'open'
      AND is_active = true
    ORDER BY opened_at DESC
    LIMIT 1;

    IF v_active_cash_register IS NULL THEN
      v_errors := array_append(v_errors, 'Não há caixa aberto na unidade');
    END IF;

    -- Validação 5: Forma de pagamento é válida?
    IF p_payment_method_id IS NULL THEN
      v_errors := array_append(v_errors, 'Forma de pagamento é obrigatória');
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM payment_methods 
        WHERE id = p_payment_method_id AND is_active = true
      ) THEN
        v_errors := array_append(v_errors, 'Forma de pagamento inválida');
      END IF;
    END IF;

    -- Validação 6: Conta de destino é válida?
    IF p_account_id IS NULL THEN
      v_errors := array_append(v_errors, 'Conta de destino é obrigatória');
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM bank_accounts 
        WHERE id = p_account_id AND unit_id = v_unit_id AND is_active = true
      ) THEN
        v_errors := array_append(v_errors, 'Conta de destino inválida ou não pertence à unidade');
      END IF;
    END IF;
  END IF;

  -- Montar resultado
  IF array_length(v_errors, 1) > 0 THEN
    v_result := jsonb_build_object(
      'valid', false,
      'errors', to_jsonb(v_errors)
    );
  ELSE
    v_result := jsonb_build_object(
      'valid', true,
      'order', jsonb_build_object(
        'id', v_order.id,
        'status', v_order.status,
        'unit_id', v_order.unit_id,
        'items_count', v_items_count,
        'cash_register_id', v_active_cash_register
      )
    );
  END IF;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', jsonb_build_array('Erro ao validar comanda: ' || SQLERRM)
    );
END;
$$;

-- Adicionar comentário
COMMENT ON FUNCTION fn_validate_order_close(UUID, UUID, UUID) IS 
'Valida se uma comanda pode ser fechada verificando: status, itens, caixa aberto, forma de pagamento e conta de destino';

-- Conceder permissões
GRANT EXECUTE ON FUNCTION fn_validate_order_close(UUID, UUID, UUID) TO authenticated;
