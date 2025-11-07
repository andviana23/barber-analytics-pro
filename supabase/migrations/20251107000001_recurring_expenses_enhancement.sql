-- =====================================================
-- RECURRING EXPENSES ENHANCEMENT
-- Data: 07/11/2025
-- Autor: Andrey Viana
-- Descrição: Melhoria do módulo de despesas recorrentes
-- =====================================================

-- 1. Adicionar colunas faltantes em expenses (caso não existam)
DO $$
BEGIN
  -- Verificar e adicionar is_recurring
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;

  -- Verificar e adicionar recurring_series_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'recurring_series_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN recurring_series_id UUID REFERENCES expenses(id) ON DELETE CASCADE;
  END IF;

  -- Verificar e adicionar installment_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'installment_number'
  ) THEN
    ALTER TABLE expenses ADD COLUMN installment_number INTEGER DEFAULT NULL;
  END IF;

  -- Verificar e adicionar recurrence_metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'recurrence_metadata'
  ) THEN
    ALTER TABLE expenses ADD COLUMN recurrence_metadata JSONB DEFAULT NULL;
  END IF;
END $$;

-- 2. Adicionar comentários nas colunas
COMMENT ON COLUMN expenses.is_recurring IS 'Indica se esta despesa faz parte de uma série recorrente';
COMMENT ON COLUMN expenses.recurring_series_id IS 'ID da despesa original que gerou esta série recorrente (NULL para despesa original)';
COMMENT ON COLUMN expenses.installment_number IS 'Número da parcela na série (1, 2, 3...). NULL para despesa única';
COMMENT ON COLUMN expenses.recurrence_metadata IS 'Metadados da recorrência (configuração original, dias do mês, etc.)';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_series
ON expenses(recurring_series_id)
WHERE recurring_series_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring
ON expenses(is_recurring)
WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_status
ON recurring_expenses(status)
WHERE status = 'ativo';

-- 4. Adicionar constraints de validação
ALTER TABLE expenses
DROP CONSTRAINT IF EXISTS chk_installment_number_positive;

ALTER TABLE expenses
ADD CONSTRAINT chk_installment_number_positive
CHECK (installment_number IS NULL OR installment_number > 0);

-- 5. Melhorar a tabela recurring_expenses (adicionar colunas faltantes)
DO $$
BEGIN
  -- Adicionar created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN created_by UUID REFERENCES auth.users(id);
    COMMENT ON COLUMN recurring_expenses.created_by IS 'Usuário que criou a configuração recorrente';
  END IF;

  -- Adicionar paused_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN paused_at TIMESTAMPTZ DEFAULT NULL;
    COMMENT ON COLUMN recurring_expenses.paused_at IS 'Data em que a recorrência foi pausada';
  END IF;

  -- Adicionar finished_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recurring_expenses' AND column_name = 'finished_at'
  ) THEN
    ALTER TABLE recurring_expenses ADD COLUMN finished_at TIMESTAMPTZ DEFAULT NULL;
    COMMENT ON COLUMN recurring_expenses.finished_at IS 'Data em que todas as parcelas foram geradas';
  END IF;
END $$;

-- 6. Função para gerar próximas parcelas de despesa recorrente
CREATE OR REPLACE FUNCTION fn_generate_next_recurring_expense(
  p_recurring_expense_id UUID
) RETURNS TABLE (
  expense_id UUID,
  installment_number INT,
  due_date DATE
) AS $$
DECLARE
  v_config RECORD;
  v_original_expense RECORD;
  v_next_number INT;
  v_next_date DATE;
  v_new_expense_id UUID;
BEGIN
  -- Buscar configuração de recorrência
  SELECT * INTO v_config
  FROM recurring_expenses
  WHERE id = p_recurring_expense_id
    AND status = 'ativo'
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de recorrência não encontrada ou inativa';
  END IF;

  -- Verificar se já gerou todas as parcelas
  IF v_config.parcelas_geradas >= v_config.total_parcelas THEN
    -- Marcar como finalizado
    UPDATE recurring_expenses
    SET status = 'finalizado',
        finished_at = NOW()
    WHERE id = p_recurring_expense_id;

    RETURN;
  END IF;

  -- Buscar despesa original
  SELECT * INTO v_original_expense
  FROM expenses
  WHERE id = v_config.expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Despesa original não encontrada';
  END IF;

  -- Calcular próximo número de parcela
  v_next_number := v_config.parcelas_geradas + 1;

  -- Calcular próxima data (baseado no cobrar_sempre_no)
  v_next_date := v_config.data_inicio + (v_next_number * INTERVAL '1 month');

  -- Ajustar para o dia do mês especificado
  v_next_date := make_date(
    EXTRACT(YEAR FROM v_next_date)::INT,
    EXTRACT(MONTH FROM v_next_date)::INT,
    LEAST(v_config.cobrar_sempre_no,
          EXTRACT(DAY FROM (v_next_date + INTERVAL '1 month - 1 day'))::INT)
  );

  -- Inserir nova despesa
  INSERT INTO expenses (
    type,
    value,
    date,
    unit_id,
    account_id,
    party_id,
    category_id,
    description,
    observations,
    expected_payment_date,
    data_competencia,
    forma_pagamento,
    status,
    is_recurring,
    recurring_series_id,
    installment_number,
    recurrence_metadata,
    is_active
  ) VALUES (
    v_original_expense.type,
    v_original_expense.value,
    v_next_date,
    v_original_expense.unit_id,
    v_original_expense.account_id,
    v_original_expense.party_id,
    v_original_expense.category_id,
    v_original_expense.description || ' (' || v_next_number || '/' || v_config.total_parcelas || ')',
    'Gerado automaticamente pela recorrência ID: ' || p_recurring_expense_id,
    v_next_date,
    v_next_date,
    v_original_expense.forma_pagamento,
    'Pending',
    true,
    v_config.expense_id,
    v_next_number,
    jsonb_build_object(
      'recurring_expense_id', p_recurring_expense_id,
      'configuracao', v_config.configuracao,
      'cobrar_sempre_no', v_config.cobrar_sempre_no,
      'generated_at', NOW()
    ),
    true
  ) RETURNING id INTO v_new_expense_id;

  -- Atualizar contador de parcelas geradas
  UPDATE recurring_expenses
  SET parcelas_geradas = v_next_number,
      updated_at = NOW()
  WHERE id = p_recurring_expense_id;

  -- Retornar resultado
  RETURN QUERY SELECT
    v_new_expense_id,
    v_next_number,
    v_next_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_generate_next_recurring_expense IS
'Gera a próxima parcela de uma despesa recorrente.
Deve ser chamada por Edge Function ou Cron Job mensalmente.';

-- 7. Função para pausar/retomar recorrência
CREATE OR REPLACE FUNCTION fn_toggle_recurring_expense(
  p_recurring_expense_id UUID,
  p_action TEXT -- 'pause' ou 'resume'
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_status TEXT;
BEGIN
  -- Buscar status atual
  SELECT status INTO v_current_status
  FROM recurring_expenses
  WHERE id = p_recurring_expense_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de recorrência não encontrada';
  END IF;

  -- Executar ação
  IF p_action = 'pause' AND v_current_status = 'ativo' THEN
    UPDATE recurring_expenses
    SET status = 'pausado',
        paused_at = NOW(),
        updated_at = NOW()
    WHERE id = p_recurring_expense_id;

    RETURN true;

  ELSIF p_action = 'resume' AND v_current_status = 'pausado' THEN
    UPDATE recurring_expenses
    SET status = 'ativo',
        paused_at = NULL,
        updated_at = NOW()
    WHERE id = p_recurring_expense_id;

    RETURN true;
  ELSE
    RAISE EXCEPTION 'Ação inválida ou estado incompatível. Status atual: %, Ação: %',
                    v_current_status, p_action;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_toggle_recurring_expense IS
'Pausa ou retoma uma recorrência de despesa.
Parâmetros:
- p_recurring_expense_id: ID da configuração
- p_action: "pause" ou "resume"';

-- 8. Função para excluir série completa de despesas recorrentes
CREATE OR REPLACE FUNCTION fn_delete_recurring_series(
  p_recurring_expense_id UUID,
  p_delete_future_only BOOLEAN DEFAULT true
) RETURNS TABLE (
  deleted_count INT,
  message TEXT
) AS $$
DECLARE
  v_expense_id UUID;
  v_deleted INT := 0;
BEGIN
  -- Buscar ID da despesa original
  SELECT expense_id INTO v_expense_id
  FROM recurring_expenses
  WHERE id = p_recurring_expense_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de recorrência não encontrada';
  END IF;

  IF p_delete_future_only THEN
    -- Soft delete apenas das parcelas futuras pendentes
    UPDATE expenses
    SET is_active = false,
        updated_at = NOW()
    WHERE recurring_series_id = v_expense_id
      AND status = 'Pending'
      AND expected_payment_date >= CURRENT_DATE;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    -- Marcar recorrência como finalizada
    UPDATE recurring_expenses
    SET status = 'finalizado',
        finished_at = NOW(),
        is_active = false,
        updated_at = NOW()
    WHERE id = p_recurring_expense_id;

    RETURN QUERY SELECT
      v_deleted,
      format('Canceladas %s parcelas futuras', v_deleted);
  ELSE
    -- Soft delete de TODAS as parcelas
    UPDATE expenses
    SET is_active = false,
        updated_at = NOW()
    WHERE recurring_series_id = v_expense_id
       OR id = v_expense_id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    -- Desativar recorrência
    UPDATE recurring_expenses
    SET status = 'finalizado',
        is_active = false,
        updated_at = NOW()
    WHERE id = p_recurring_expense_id;

    RETURN QUERY SELECT
      v_deleted,
      format('Canceladas todas as %s despesas da série', v_deleted);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_delete_recurring_series IS
'Cancela série completa de despesas recorrentes (soft delete).
Parâmetros:
- p_recurring_expense_id: ID da configuração
- p_delete_future_only: true = cancela só futuras, false = cancela todas';

-- 9. View para visualização de despesas recorrentes
CREATE OR REPLACE VIEW vw_recurring_expenses_summary AS
SELECT
  re.id AS recurring_id,
  re.expense_id AS original_expense_id,
  re.unit_id,
  u.name AS unit_name,
  e.description AS expense_description,
  e.value AS monthly_value,
  re.configuracao,
  re.cobrar_sempre_no,
  re.total_parcelas,
  re.parcelas_geradas,
  re.status,
  re.data_inicio,
  re.data_fim,
  re.created_at,
  re.created_by,
  auth_users.raw_user_meta_data->>'name' AS created_by_name,
  re.paused_at,
  re.finished_at,
  -- Parcelas restantes
  re.total_parcelas - re.parcelas_geradas AS parcelas_restantes,
  -- Valor total da série
  e.value * re.total_parcelas AS total_value,
  -- Valor já gerado
  e.value * re.parcelas_geradas AS generated_value,
  -- Próxima data prevista
  CASE
    WHEN re.status = 'ativo' AND re.parcelas_geradas < re.total_parcelas
    THEN re.data_inicio + ((re.parcelas_geradas + 1) * INTERVAL '1 month')
    ELSE NULL
  END AS next_due_date,
  -- Percentual de conclusão
  ROUND(
    (re.parcelas_geradas::NUMERIC / NULLIF(re.total_parcelas, 0)) * 100,
    2
  ) AS completion_percent,
  -- Categoria
  c.name AS category_name,
  -- Fornecedor
  p.nome AS party_name
FROM recurring_expenses re
JOIN expenses e ON e.id = re.expense_id
JOIN units u ON u.id = re.unit_id
LEFT JOIN auth.users auth_users ON auth_users.id = re.created_by
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN parties p ON p.id = e.party_id
WHERE re.is_active = true
ORDER BY re.created_at DESC;

COMMENT ON VIEW vw_recurring_expenses_summary IS
'View consolidada de despesas recorrentes com métricas calculadas:
- Parcelas geradas/restantes
- Valores totais e gerados
- Próxima data de vencimento
- Percentual de conclusão';

-- 10. RLS Policies para recurring_expenses
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário vê apenas recorrências de suas unidades
DROP POLICY IF EXISTS "view_own_unit_recurring_expenses" ON recurring_expenses;
CREATE POLICY "view_own_unit_recurring_expenses"
ON recurring_expenses
FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id
    FROM professionals
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- Policy: Admin e gerente podem criar recorrências
DROP POLICY IF EXISTS "create_recurring_expenses" ON recurring_expenses;
CREATE POLICY "create_recurring_expenses"
ON recurring_expenses
FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT p.unit_id
    FROM professionals p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('admin', 'gerente', 'administrador')
  )
);

-- Policy: Admin e gerente podem atualizar recorrências
DROP POLICY IF EXISTS "update_recurring_expenses" ON recurring_expenses;
CREATE POLICY "update_recurring_expenses"
ON recurring_expenses
FOR UPDATE
USING (
  unit_id IN (
    SELECT p.unit_id
    FROM professionals p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('admin', 'gerente', 'administrador')
  )
);

-- Policy: Admin e gerente podem deletar recorrências
DROP POLICY IF EXISTS "delete_recurring_expenses" ON recurring_expenses;
CREATE POLICY "delete_recurring_expenses"
ON recurring_expenses
FOR DELETE
USING (
  unit_id IN (
    SELECT p.unit_id
    FROM professionals p
    WHERE p.user_id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('admin', 'gerente', 'administrador')
  )
);

-- 11. Inserir dados de exemplo (comentado por padrão)
/*
INSERT INTO recurring_expenses (
  expense_id,
  unit_id,
  configuracao,
  cobrar_sempre_no,
  total_parcelas,
  data_inicio,
  status
) VALUES (
  'uuid-da-despesa-original',
  'uuid-da-unidade',
  'mensal-12x',
  5, -- Dia 5 de cada mês
  12,
  CURRENT_DATE,
  'ativo'
);
*/

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
