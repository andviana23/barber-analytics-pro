-- =====================================================
-- Migration: 24-create-cashflow-entries-view.sql
-- Descrição: Criar VIEW vw_cashflow_entries (fluxo de caixa acumulado)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- DROP VIEW IF EXISTS para recriar
DROP VIEW IF EXISTS vw_cashflow_entries CASCADE;

-- Criar VIEW para entradas do fluxo de caixa
CREATE OR REPLACE VIEW vw_cashflow_entries AS

WITH daily_transactions AS (
    -- Receitas (entradas)
    SELECT 
        r.data_recebimento_efetivo AS data,
        r.unit_id,
        r.account_id,
        r.valor_liquido AS valor,
        'entrada' AS tipo
    FROM revenues r
    WHERE r.data_recebimento_efetivo IS NOT NULL
    AND r.status = 'Recebido'
    
    UNION ALL
    
    -- Despesas (saídas)
    SELECT 
        e.data_pagamento_efetivo AS data,
        e.unit_id,
        NULL AS account_id,
        e.value AS valor,
        'saida' AS tipo
    FROM expenses e
    WHERE e.data_pagamento_efetivo IS NOT NULL
    AND e.status = 'Pago'
),
daily_aggregated AS (
    SELECT 
        data,
        unit_id,
        account_id,
        SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS entradas,
        SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) AS saidas,
        SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END) AS saldo_dia
    FROM daily_transactions
    GROUP BY data, unit_id, account_id
)
SELECT 
    data,
    unit_id,
    account_id,
    entradas,
    saidas,
    saldo_dia,
    SUM(saldo_dia) OVER (
        PARTITION BY unit_id, account_id 
        ORDER BY data 
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS saldo_acumulado
FROM daily_aggregated
ORDER BY data, unit_id, account_id;

-- Comentários na VIEW
COMMENT ON VIEW vw_cashflow_entries IS 'VIEW de fluxo de caixa com entradas, saídas e saldo acumulado por dia, unidade e conta';

-- Grant permissions
GRANT SELECT ON vw_cashflow_entries TO authenticated;

-- =====================================================
-- FUNCTION HELPER PARA GERAR SÉRIE DE DATAS COM FLUXO
-- =====================================================

CREATE OR REPLACE FUNCTION get_cashflow_range(
    p_start_date DATE,
    p_end_date DATE,
    p_unit_id UUID DEFAULT NULL,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    data DATE,
    unit_id UUID,
    account_id UUID,
    entradas NUMERIC,
    saidas NUMERIC,
    saldo_dia NUMERIC,
    saldo_acumulado NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::INTERVAL)::DATE AS data
    ),
    units_accounts AS (
        SELECT DISTINCT 
            COALESCE(p_unit_id, vw.unit_id) AS unit_id,
            COALESCE(p_account_id, vw.account_id) AS account_id
        FROM vw_cashflow_entries vw
        WHERE (p_unit_id IS NULL OR vw.unit_id = p_unit_id)
        AND (p_account_id IS NULL OR vw.account_id = p_account_id)
    ),
    date_unit_combinations AS (
        SELECT ds.data, ua.unit_id, ua.account_id
        FROM date_series ds
        CROSS JOIN units_accounts ua
    )
    SELECT 
        duc.data,
        duc.unit_id,
        duc.account_id,
        COALESCE(vw.entradas, 0) AS entradas,
        COALESCE(vw.saidas, 0) AS saidas,
        COALESCE(vw.saldo_dia, 0) AS saldo_dia,
        SUM(COALESCE(vw.saldo_dia, 0)) OVER (
            PARTITION BY duc.unit_id, duc.account_id 
            ORDER BY duc.data 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS saldo_acumulado
    FROM date_unit_combinations duc
    LEFT JOIN vw_cashflow_entries vw 
        ON vw.data = duc.data 
        AND vw.unit_id = duc.unit_id 
        AND (vw.account_id = duc.account_id OR (vw.account_id IS NULL AND duc.account_id IS NULL))
    ORDER BY duc.data, duc.unit_id, duc.account_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_cashflow_range IS 'Retorna fluxo de caixa completo para um período, incluindo dias sem movimentação';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
