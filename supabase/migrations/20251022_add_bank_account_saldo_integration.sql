-- =====================================================
-- BANK ACCOUNTS SALDO INTEGRATION
-- =====================================================
-- Adiciona campos de saldo disponível e logs de edição
-- Criado em: 2025-10-22
-- Autor: Andrey Viana

-- 1. Adicionar campo saldo_disponivel (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bank_accounts' 
        AND column_name = 'saldo_disponivel'
    ) THEN
        ALTER TABLE bank_accounts 
        ADD COLUMN saldo_disponivel DECIMAL(15, 2) DEFAULT 0;
    END IF;
END $$;

-- 2. Criar tabela de logs de alteração de saldo inicial
CREATE TABLE IF NOT EXISTS bank_account_balance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_value DECIMAL(15, 2) NOT NULL,
    new_value DECIMAL(15, 2) NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT bank_account_balance_logs_account_idx 
        FOREIGN KEY (account_id) REFERENCES bank_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_balance_logs_account_id 
    ON bank_account_balance_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_logs_created_at 
    ON bank_account_balance_logs(created_at DESC);

COMMENT ON TABLE bank_account_balance_logs IS 
    'Histórico de alterações de saldo inicial das contas bancárias';

-- 3. Função para calcular saldo atual de uma conta
-- Considera: saldo_inicial + receitas confirmadas - despesas confirmadas
CREATE OR REPLACE FUNCTION calculate_account_current_balance(p_account_id UUID)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_initial_balance DECIMAL(15, 2);
    v_revenues DECIMAL(15, 2);
    v_expenses DECIMAL(15, 2);
    v_transfers_in DECIMAL(15, 2);
    v_transfers_out DECIMAL(15, 2);
    v_current_balance DECIMAL(15, 2);
BEGIN
    -- Buscar saldo inicial
    SELECT initial_balance 
    INTO v_initial_balance
    FROM bank_accounts
    WHERE id = p_account_id;
    
    IF v_initial_balance IS NULL THEN
        v_initial_balance := 0;
    END IF;
    
    -- Somar receitas confirmadas (status = 'Received' ou 'Paid')
    SELECT COALESCE(SUM(amount), 0)
    INTO v_revenues
    FROM revenues
    WHERE account_id = p_account_id
        AND status IN ('Received', 'Paid')
        AND is_active = true;
    
    -- Somar despesas confirmadas (status = 'Paid')
    SELECT COALESCE(SUM(amount), 0)
    INTO v_expenses
    FROM expenses
    WHERE account_id = p_account_id
        AND status = 'Paid'
        AND is_active = true;
    
    -- Transferências recebidas (se houver tabela de transferências)
    -- Por enquanto, vamos deixar zerado
    v_transfers_in := 0;
    v_transfers_out := 0;
    
    -- Calcular saldo atual
    v_current_balance := v_initial_balance + v_revenues - v_expenses + v_transfers_in - v_transfers_out;
    
    RETURN v_current_balance;
END;
$$;

COMMENT ON FUNCTION calculate_account_current_balance(UUID) IS 
    'Calcula o saldo atual de uma conta bancária baseado em saldo inicial e movimentações';

-- 4. Função para calcular saldo disponível (excluindo valores a compensar)
CREATE OR REPLACE FUNCTION calculate_account_available_balance(p_account_id UUID)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_current_balance DECIMAL(15, 2);
    v_pending_revenues DECIMAL(15, 2);
    v_pending_expenses DECIMAL(15, 2);
    v_available_balance DECIMAL(15, 2);
BEGIN
    -- Calcular saldo atual
    v_current_balance := calculate_account_current_balance(p_account_id);
    
    -- Receitas pendentes de compensação (status = 'Pending')
    SELECT COALESCE(SUM(amount), 0)
    INTO v_pending_revenues
    FROM revenues
    WHERE account_id = p_account_id
        AND status = 'Pending'
        AND is_active = true;
    
    -- Despesas pendentes de compensação (status = 'Pending')
    SELECT COALESCE(SUM(amount), 0)
    INTO v_pending_expenses
    FROM expenses
    WHERE account_id = p_account_id
        AND status = 'Pending'
        AND is_active = true;
    
    -- Saldo disponível = saldo atual - valores pendentes
    v_available_balance := v_current_balance - v_pending_revenues - v_pending_expenses;
    
    RETURN v_available_balance;
END;
$$;

COMMENT ON FUNCTION calculate_account_available_balance(UUID) IS 
    'Calcula o saldo disponível (excluindo valores a compensar)';

-- 5. Função para atualizar saldo inicial (com log)
CREATE OR REPLACE FUNCTION update_account_initial_balance(
    p_account_id UUID,
    p_new_value DECIMAL(15, 2),
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_value DECIMAL(15, 2);
    v_new_current_balance DECIMAL(15, 2);
    v_result JSON;
BEGIN
    -- Buscar valor antigo
    SELECT initial_balance 
    INTO v_old_value
    FROM bank_accounts
    WHERE id = p_account_id;
    
    IF v_old_value IS NULL THEN
        RAISE EXCEPTION 'Conta bancária não encontrada';
    END IF;
    
    -- Atualizar saldo inicial
    UPDATE bank_accounts
    SET initial_balance = p_new_value,
        updated_at = NOW()
    WHERE id = p_account_id;
    
    -- Registrar log
    INSERT INTO bank_account_balance_logs (
        account_id,
        user_id,
        old_value,
        new_value,
        change_reason
    ) VALUES (
        p_account_id,
        p_user_id,
        v_old_value,
        p_new_value,
        COALESCE(p_reason, 'Edição manual do saldo inicial')
    );
    
    -- Calcular novo saldo atual
    v_new_current_balance := calculate_account_current_balance(p_account_id);
    
    -- Atualizar saldo atual na tabela
    UPDATE bank_accounts
    SET current_balance = v_new_current_balance,
        saldo_disponivel = calculate_account_available_balance(p_account_id),
        updated_at = NOW()
    WHERE id = p_account_id;
    
    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'old_value', v_old_value,
        'new_value', p_new_value,
        'new_current_balance', v_new_current_balance,
        'message', 'Saldo inicial atualizado com sucesso'
    );
    
    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION update_account_initial_balance(UUID, DECIMAL, UUID, TEXT) IS 
    'Atualiza o saldo inicial de uma conta bancária com log de auditoria';

-- 6. Trigger para recalcular saldos automaticamente ao confirmar receita
CREATE OR REPLACE FUNCTION trigger_recalculate_account_balance_on_revenue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Apenas recalcular se houver mudança de status ou valor
    IF (TG_OP = 'INSERT' OR 
        OLD.status IS DISTINCT FROM NEW.status OR 
        OLD.value IS DISTINCT FROM NEW.value OR
        OLD.account_id IS DISTINCT FROM NEW.account_id) THEN
        
        -- Atualizar conta antiga (se houve mudança de conta)
        IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id THEN
            UPDATE bank_accounts
            SET current_balance = calculate_account_current_balance(OLD.account_id),
                saldo_disponivel = calculate_account_available_balance(OLD.account_id),
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        
        -- Atualizar conta nova
        IF NEW.account_id IS NOT NULL THEN
            UPDATE bank_accounts
            SET current_balance = calculate_account_current_balance(NEW.account_id),
                saldo_disponivel = calculate_account_available_balance(NEW.account_id),
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para receitas
DROP TRIGGER IF EXISTS trg_update_balance_on_revenue ON revenues;
CREATE TRIGGER trg_update_balance_on_revenue
    AFTER INSERT OR UPDATE ON revenues
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_account_balance_on_revenue();

-- 7. Trigger para recalcular saldos ao confirmar despesa
CREATE OR REPLACE FUNCTION trigger_recalculate_account_balance_on_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR 
        OLD.status IS DISTINCT FROM NEW.status OR 
        OLD.value IS DISTINCT FROM NEW.value OR
        OLD.account_id IS DISTINCT FROM NEW.account_id) THEN
        
        -- Atualizar conta antiga (se houve mudança)
        IF TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id THEN
            UPDATE bank_accounts
            SET current_balance = calculate_account_current_balance(OLD.account_id),
                saldo_disponivel = calculate_account_available_balance(OLD.account_id),
                updated_at = NOW()
            WHERE id = OLD.account_id;
        END IF;
        
        -- Atualizar conta nova
        IF NEW.account_id IS NOT NULL THEN
            UPDATE bank_accounts
            SET current_balance = calculate_account_current_balance(NEW.account_id),
                saldo_disponivel = calculate_account_available_balance(NEW.account_id),
                updated_at = NOW()
            WHERE id = NEW.account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para despesas
DROP TRIGGER IF EXISTS trg_update_balance_on_expense ON expenses;
CREATE TRIGGER trg_update_balance_on_expense
    AFTER INSERT OR UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_account_balance_on_expense();

-- 8. View para saldo consolidado por unidade
CREATE OR REPLACE VIEW vw_unit_consolidated_balance AS
SELECT 
    ba.unit_id,
    u.name AS unit_name,
    COUNT(ba.id) AS total_accounts,
    SUM(ba.initial_balance) AS total_initial_balance,
    SUM(ba.current_balance) AS total_current_balance,
    SUM(ba.saldo_disponivel) AS total_available_balance,
    SUM(CASE WHEN ba.is_active THEN ba.current_balance ELSE 0 END) AS active_accounts_balance
FROM bank_accounts ba
INNER JOIN units u ON u.id = ba.unit_id
GROUP BY ba.unit_id, u.name;

COMMENT ON VIEW vw_unit_consolidated_balance IS 
    'Saldo consolidado de todas as contas bancárias por unidade';

-- 9. View detalhada de contas com saldos calculados
CREATE OR REPLACE VIEW vw_bank_accounts_with_balances AS
SELECT 
    ba.id,
    ba.unit_id,
    ba.name,
    ba.bank_name,
    ba.account_number,
    ba.agency,
    ba.account_type,
    ba.initial_balance,
    ba.current_balance,
    ba.saldo_disponivel,
    ba.is_active,
    ba.notes,
    ba.created_at,
    ba.updated_at,
    -- Receitas confirmadas
    COALESCE(
        (SELECT SUM(amount) 
         FROM revenues 
         WHERE account_id = ba.id 
           AND status IN ('Received', 'Paid') 
           AND is_active = true), 
        0
    ) AS total_revenues,
    -- Despesas confirmadas
    COALESCE(
        (SELECT SUM(amount) 
         FROM expenses 
         WHERE account_id = ba.id 
           AND status = 'Paid' 
           AND is_active = true), 
        0
    ) AS total_expenses,
    -- Receitas pendentes
    COALESCE(
        (SELECT SUM(amount) 
         FROM revenues 
         WHERE account_id = ba.id 
           AND status = 'Pending' 
           AND is_active = true), 
        0
    ) AS pending_revenues,
    -- Despesas pendentes
    COALESCE(
        (SELECT SUM(amount) 
         FROM expenses 
         WHERE account_id = ba.id 
           AND status = 'Pending' 
           AND is_active = true), 
        0
    ) AS pending_expenses,
    -- Último log de alteração
    (SELECT created_at 
     FROM bank_account_balance_logs 
     WHERE account_id = ba.id 
     ORDER BY created_at DESC 
     LIMIT 1) AS last_balance_change
FROM bank_accounts ba;

COMMENT ON VIEW vw_bank_accounts_with_balances IS 
    'View detalhada das contas bancárias com todos os saldos e movimentações';

-- 10. Recalcular todos os saldos existentes
DO $$
DECLARE
    v_account RECORD;
BEGIN
    FOR v_account IN 
        SELECT id FROM bank_accounts WHERE is_active = true
    LOOP
        UPDATE bank_accounts
        SET current_balance = calculate_account_current_balance(v_account.id),
            saldo_disponivel = calculate_account_available_balance(v_account.id),
            updated_at = NOW()
        WHERE id = v_account.id;
    END LOOP;
END $$;

-- 11. Políticas RLS para logs
ALTER TABLE bank_account_balance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view balance logs from their unit"
    ON bank_account_balance_logs
    FOR SELECT
    USING (
        account_id IN (
            SELECT ba.id 
            FROM bank_accounts ba
            INNER JOIN units u ON u.id = ba.unit_id
            INNER JOIN professionals p ON p.unit_id = u.id
            WHERE p.user_id = auth.uid()
        )
    );

-- 12. Permissões
GRANT SELECT ON vw_unit_consolidated_balance TO authenticated;
GRANT SELECT ON vw_bank_accounts_with_balances TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_account_current_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_account_available_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_account_initial_balance(UUID, DECIMAL, UUID, TEXT) TO authenticated;
