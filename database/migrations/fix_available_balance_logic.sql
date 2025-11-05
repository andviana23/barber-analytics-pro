-- ================================================================
-- CORREÇÃO: SALDO DISPONÍVEL NÃO DEVE DEDUZIR DESPESAS PENDENTES
-- ================================================================

-- Problema identificado:
-- O saldo disponível estava descontando despesas pendentes (não pagas ainda)
-- Correção: despesas só devem ser descontadas quando confirmadas (status = 'Paid')

-- ----------------------------------------------------------------
-- 1. CORRIGIR FUNÇÃO calculate_account_available_balance
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_account_available_balance(p_account_id UUID)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_current_balance DECIMAL(15, 2);
    v_pending_revenues DECIMAL(15, 2);
    v_available_balance DECIMAL(15, 2);
BEGIN
    -- Calcular saldo atual (já confirmado)
    v_current_balance := calculate_account_current_balance(p_account_id);

    -- Receitas pendentes de compensação (status = 'Pending')
    -- Estas podem ser consideradas pois são valores a receber
    SELECT COALESCE(SUM(amount), 0)
    INTO v_pending_revenues
    FROM revenues
    WHERE account_id = p_account_id
        AND status = 'Pending'
        AND is_active = true;

    -- 🔥 MUDANÇA PRINCIPAL: NÃO deduzir despesas pendentes
    -- Despesas só devem impactar quando forem efetivamente pagas (status = 'Paid')
    -- O saldo disponível deve mostrar o que realmente está disponível para uso

    -- Saldo disponível = saldo atual + receitas pendentes
    -- (sem deduzir despesas pendentes, pois ainda não foram pagas)
    v_available_balance := v_current_balance + v_pending_revenues;

    RETURN v_available_balance;
END;
$$;

COMMENT ON FUNCTION calculate_account_available_balance(UUID) IS
    'Calcula o saldo disponível: saldo atual + receitas pendentes. Despesas só impactam quando pagas.';

-- ----------------------------------------------------------------
-- 2. ATUALIZAR VIEW vw_bank_accounts_with_balances
-- ----------------------------------------------------------------

DROP VIEW IF EXISTS vw_bank_accounts_with_balances;

CREATE VIEW vw_bank_accounts_with_balances AS
SELECT
    ba.id,
    ba.unit_id,
    ba.name,
    ba.bank_name,
    ba.account_number,
    ba.agency,
    ba.nickname,
    ba.initial_balance,
    ba.current_balance,
    ba.available_balance,
    ba.is_active,
    ba.created_at,
    ba.updated_at,

    -- Receitas confirmadas (já recebidas)
    COALESCE(
        (SELECT SUM(amount) FROM revenues
         WHERE account_id = ba.id AND status IN ('Received', 'Paid') AND is_active = true),
        0
    ) AS total_revenues,

    -- Despesas confirmadas (já pagas)
    COALESCE(
        (SELECT SUM(amount) FROM expenses
         WHERE account_id = ba.id AND status = 'Paid' AND is_active = true),
        0
    ) AS total_expenses,

    -- Receitas pendentes (a receber)
    COALESCE(
        (SELECT SUM(amount) FROM revenues
         WHERE account_id = ba.id AND status = 'Pending' AND is_active = true),
        0
    ) AS pending_revenues,

    -- Despesas pendentes (a pagar) - apenas para informação
    -- NÃO impacta no saldo disponível
    COALESCE(
        (SELECT SUM(amount) FROM expenses
         WHERE account_id = ba.id AND status = 'Pending' AND is_active = true),
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
    'View com saldos calculados. IMPORTANTE: saldo disponível NÃO deduz despesas pendentes.';

-- ----------------------------------------------------------------
-- 3. TRIGGER PARA RECALCULAR SALDOS AUTOMATICAMENTE
-- ----------------------------------------------------------------

-- Trigger para receitas (quando mudar status)
CREATE OR REPLACE FUNCTION trigger_recalculate_account_balance_on_revenue()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular saldos da conta afetada
    UPDATE bank_accounts
    SET
        current_balance = calculate_account_current_balance(COALESCE(NEW.account_id, OLD.account_id)),
        available_balance = calculate_account_available_balance(COALESCE(NEW.account_id, OLD.account_id)),
        updated_at = now()
    WHERE id = COALESCE(NEW.account_id, OLD.account_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para despesas (quando mudar status)
CREATE OR REPLACE FUNCTION trigger_recalculate_account_balance_on_expense()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular saldos da conta afetada
    UPDATE bank_accounts
    SET
        current_balance = calculate_account_current_balance(COALESCE(NEW.account_id, OLD.account_id)),
        available_balance = calculate_account_available_balance(COALESCE(NEW.account_id, OLD.account_id)),
        updated_at = now()
    WHERE id = COALESCE(NEW.account_id, OLD.account_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_revenue_balance_update ON revenues;
CREATE TRIGGER trigger_revenue_balance_update
    AFTER INSERT OR UPDATE OR DELETE ON revenues
    FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_account_balance_on_revenue();

DROP TRIGGER IF EXISTS trigger_expense_balance_update ON expenses;
CREATE TRIGGER trigger_expense_balance_update
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_account_balance_on_expense();

-- ----------------------------------------------------------------
-- 4. RECALCULAR TODOS OS SALDOS EXISTENTES
-- ----------------------------------------------------------------

-- Recalcular saldos de todas as contas ativas
UPDATE bank_accounts
SET
    current_balance = calculate_account_current_balance(id),
    available_balance = calculate_account_available_balance(id),
    updated_at = now()
WHERE is_active = true;

-- ----------------------------------------------------------------
-- 5. LOG DA ALTERAÇÃO
-- ----------------------------------------------------------------

INSERT INTO bank_account_balance_logs (account_id, old_balance, new_balance, operation, user_id, notes)
SELECT
    id,
    current_balance,
    calculate_account_available_balance(id),
    'SYSTEM_CORRECTION',
    NULL,
    'Correção: saldo disponível não deve deduzir despesas pendentes'
FROM bank_accounts
WHERE is_active = true;
