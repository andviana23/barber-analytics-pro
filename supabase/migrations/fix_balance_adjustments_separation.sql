-- =====================================================
-- CORREÇÃO: Separar Ajustes de Saldo das Receitas Operacionais
-- =====================================================
--
-- PROBLEMA: Ajustes de saldo inicial podem aparecer como receitas
-- SOLUÇÃO: Criar separação clara entre ajustes e receitas operacionais
--
-- Data: 4 de novembro de 2025
-- Autor: Sistema Barber Analytics Pro

-- 1. Criar enum para tipos de operação financeira
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_operation_type') THEN
        CREATE TYPE financial_operation_type AS ENUM (
            'OPERATIONAL_REVENUE',    -- Receita operacional (serviços, produtos)
            'BALANCE_ADJUSTMENT',     -- Ajuste de saldo inicial
            'BANK_TRANSFER',          -- Transferência bancária
            'CORRECTION',             -- Correção contábil
            'OTHER'                   -- Outros tipos
        );
    END IF;
END $$;

-- 2. Adicionar coluna operation_type na tabela revenues (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'revenues'
        AND column_name = 'operation_type'
    ) THEN
        ALTER TABLE revenues
        ADD COLUMN operation_type financial_operation_type DEFAULT 'OPERATIONAL_REVENUE';

        -- Atualizar registros existentes como receitas operacionais
        UPDATE revenues
        SET operation_type = 'OPERATIONAL_REVENUE'
        WHERE operation_type IS NULL;
    END IF;
END $$;

-- 3. Criar função para diferenciar receitas operacionais de ajustes
CREATE OR REPLACE FUNCTION get_operational_revenues_total(p_account_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(15,2);
BEGIN
    -- Somar apenas receitas operacionais (excluindo ajustes de saldo)
    SELECT COALESCE(SUM(value), 0)
    INTO v_total
    FROM revenues
    WHERE account_id = p_account_id
        AND status IN ('Received', 'Paid')
        AND is_active = true
        AND operation_type = 'OPERATIONAL_REVENUE';  -- ✅ Apenas receitas operacionais

    RETURN v_total;
END;
$$;

-- 4. Criar função para obter ajustes de saldo separadamente
CREATE OR REPLACE FUNCTION get_balance_adjustments_total(p_account_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total DECIMAL(15,2);
BEGIN
    -- Calcular total de ajustes de saldo baseado nos logs
    SELECT COALESCE(SUM(new_value - old_value), 0)
    INTO v_total
    FROM bank_account_balance_logs
    WHERE account_id = p_account_id;

    RETURN v_total;
END;
$$;

-- 5. Atualizar função de cálculo de saldo atual para usar apenas receitas operacionais
CREATE OR REPLACE FUNCTION calculate_account_current_balance_v2(p_account_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_initial_balance DECIMAL(15,2);
    v_operational_revenues DECIMAL(15,2);
    v_expenses DECIMAL(15,2);
    v_current_balance DECIMAL(15,2);
BEGIN
    -- Buscar saldo inicial da tabela
    SELECT initial_balance
    INTO v_initial_balance
    FROM bank_accounts
    WHERE id = p_account_id;

    IF v_initial_balance IS NULL THEN
        v_initial_balance := 0;
    END IF;

    -- Somar APENAS receitas operacionais (não ajustes)
    v_operational_revenues := get_operational_revenues_total(p_account_id);

    -- Somar despesas confirmadas
    SELECT COALESCE(SUM(value), 0)
    INTO v_expenses
    FROM expenses
    WHERE account_id = p_account_id
        AND status = 'Paid'
        AND is_active = true;

    -- Calcular saldo atual: Saldo Inicial + Receitas Operacionais - Despesas
    -- (Os ajustes de saldo já estão refletidos no initial_balance)
    v_current_balance := v_initial_balance + v_operational_revenues - v_expenses;

    RETURN v_current_balance;
END;
$$;

-- 6. Criar view para relatórios que separa receitas operacionais de ajustes
CREATE OR REPLACE VIEW vw_financial_summary_separated AS
SELECT
    ba.id as account_id,
    ba.name as account_name,
    ba.unit_id,
    ba.initial_balance,
    ba.current_balance,
    ba.available_balance,

    -- ✅ RECEITAS OPERACIONAIS (excluindo ajustes)
    get_operational_revenues_total(ba.id) as operational_revenues,

    -- ✅ AJUSTES DE SALDO (separado das receitas)
    get_balance_adjustments_total(ba.id) as balance_adjustments,

    -- DESPESAS
    COALESCE((
        SELECT SUM(value)
        FROM expenses
        WHERE account_id = ba.id
            AND status = 'Paid'
            AND is_active = true
    ), 0) as total_expenses,

    -- SALDO CALCULADO (deve bater com current_balance)
    calculate_account_current_balance_v2(ba.id) as calculated_balance

FROM bank_accounts ba
WHERE ba.is_active = true;

-- 7. Adicionar comentários explicativos
COMMENT ON FUNCTION get_operational_revenues_total(UUID) IS
'Calcula total de receitas operacionais (serviços/produtos) excluindo ajustes de saldo';

COMMENT ON FUNCTION get_balance_adjustments_total(UUID) IS
'Calcula total de ajustes de saldo baseado nos logs de alteração';

COMMENT ON FUNCTION calculate_account_current_balance_v2(UUID) IS
'Calcula saldo atual usando apenas receitas operacionais, não contabilizando ajustes em duplicidade';

COMMENT ON VIEW vw_financial_summary_separated IS
'View que separa claramente receitas operacionais de ajustes de saldo para relatórios';

-- 8. Criar função para migrar receitas existentes que podem ser ajustes
CREATE OR REPLACE FUNCTION identify_and_mark_balance_adjustments()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Marcar receitas suspeitas de serem ajustes de saldo
    -- (valores muito altos ou com descrições específicas)
    UPDATE revenues
    SET operation_type = 'BALANCE_ADJUSTMENT'
    WHERE operation_type = 'OPERATIONAL_REVENUE'
        AND (
            source ILIKE '%saldo%' OR
            source ILIKE '%ajuste%' OR
            source ILIKE '%inicial%' OR
            source ILIKE '%correção%' OR
            source ILIKE '%correction%' OR
            value > 50000 -- Valores muito altos podem ser ajustes
        );

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN format('Identificados e marcados %s registros como ajustes de saldo', v_count);
END;
$$;

-- =====================================================
-- VERIFICAÇÕES E VALIDAÇÕES
-- =====================================================

-- Testar as funções
SELECT
    'Teste das funções criadas' as status,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_operational_revenues_total')
        THEN 'CRIADA'
        ELSE 'ERRO'
    END as funcao_receitas_operacionais,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_balance_adjustments_total')
        THEN 'CRIADA'
        ELSE 'ERRO'
    END as funcao_ajustes_saldo,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_account_current_balance_v2')
        THEN 'CRIADA'
        ELSE 'ERRO'
    END as funcao_calculo_saldo;
