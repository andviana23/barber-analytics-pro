-- =====================================================
-- Migration: 25-create-reconciliation-summary-view.sql
-- Descrição: Criar VIEW vw_reconciliation_summary (resumo de conciliações)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- DROP VIEW IF EXISTS para recriar
DROP VIEW IF EXISTS vw_reconciliation_summary CASCADE;

-- Criar VIEW para resumo de conciliações
CREATE OR REPLACE VIEW vw_reconciliation_summary AS

WITH statement_summary AS (
    SELECT 
        ba.unit_id,
        bs.bank_account_id AS account_id,
        DATE_TRUNC('month', bs.data_lancamento)::DATE AS periodo,
        COUNT(*) AS total_lancamentos,
        COUNT(*) FILTER (WHERE bs.conciliado = TRUE) AS total_compensados,
        SUM(bs.valor) AS valor_total,
        SUM(bs.valor) FILTER (WHERE bs.conciliado = TRUE) AS valor_compensado
    FROM bank_statements bs
    JOIN bank_accounts ba ON ba.id = bs.bank_account_id
    GROUP BY ba.unit_id, bs.bank_account_id, DATE_TRUNC('month', bs.data_lancamento)::DATE
),
reconciliation_summary AS (
    SELECT 
        ba.unit_id,
        bs.bank_account_id AS account_id,
        DATE_TRUNC('month', rec.data_compensacao)::DATE AS periodo,
        SUM(rec.diferenca) FILTER (WHERE rec.status = 'Divergente') AS valor_divergente,
        COUNT(*) FILTER (WHERE rec.status = 'Compensado') AS total_reconciliations,
        COUNT(*) FILTER (WHERE rec.status = 'Divergente') AS total_divergent
    FROM reconciliations rec
    JOIN bank_statements bs ON bs.id = rec.bank_statement_id
    JOIN bank_accounts ba ON ba.id = bs.bank_account_id
    GROUP BY ba.unit_id, bs.bank_account_id, DATE_TRUNC('month', rec.data_compensacao)::DATE
)
SELECT 
    ss.unit_id,
    ss.account_id,
    ss.periodo,
    ss.total_lancamentos,
    ss.total_compensados,
    CASE 
        WHEN ss.total_lancamentos > 0 
        THEN ROUND((ss.total_compensados::NUMERIC / ss.total_lancamentos::NUMERIC * 100), 2)
        ELSE 0
    END AS percentual_compensado,
    ss.valor_total,
    ss.valor_compensado,
    COALESCE(rs.valor_divergente, 0) AS valor_divergente,
    COALESCE(rs.total_reconciliations, 0) AS total_conciliacoes,
    COALESCE(rs.total_divergent, 0) AS total_divergencias,
    (ss.total_lancamentos - ss.total_compensados) AS pendentes
FROM statement_summary ss
LEFT JOIN reconciliation_summary rs 
    ON rs.unit_id = ss.unit_id 
    AND rs.account_id = ss.account_id 
    AND rs.periodo = ss.periodo
ORDER BY ss.periodo DESC, ss.unit_id, ss.account_id;

-- Comentários na VIEW
COMMENT ON VIEW vw_reconciliation_summary IS 'VIEW de resumo de conciliações bancárias por unidade, conta e período mensal';

-- Grant permissions
GRANT SELECT ON vw_reconciliation_summary TO authenticated;

-- =====================================================
-- FUNCTION HELPER PARA OBTER RESUMO POR PERÍODO
-- =====================================================

CREATE OR REPLACE FUNCTION get_reconciliation_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_unit_id UUID DEFAULT NULL,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    unit_id UUID,
    account_id UUID,
    periodo DATE,
    total_lancamentos BIGINT,
    total_compensados BIGINT,
    percentual_compensado NUMERIC,
    valor_total NUMERIC,
    valor_compensado NUMERIC,
    valor_divergente NUMERIC,
    total_conciliacoes BIGINT,
    total_divergencias BIGINT,
    pendentes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vw.unit_id,
        vw.account_id,
        vw.periodo,
        vw.total_lancamentos,
        vw.total_compensados,
        vw.percentual_compensado,
        vw.valor_total,
        vw.valor_compensado,
        vw.valor_divergente,
        vw.total_conciliacoes,
        vw.total_divergencias,
        vw.pendentes
    FROM vw_reconciliation_summary vw
    WHERE vw.periodo BETWEEN p_start_date AND p_end_date
    AND (p_unit_id IS NULL OR vw.unit_id = p_unit_id)
    AND (p_account_id IS NULL OR vw.account_id = p_account_id)
    ORDER BY vw.periodo DESC, vw.unit_id, vw.account_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_reconciliation_summary IS 'Retorna resumo de conciliações filtrado por período, unidade e conta';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
