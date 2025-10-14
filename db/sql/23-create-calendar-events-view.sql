-- =====================================================
-- Migration: 23-create-calendar-events-view.sql
-- Descrição: Criar VIEW vw_calendar_events (agregação de eventos financeiros)
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- DROP VIEW IF EXISTS para recriar
DROP VIEW IF EXISTS vw_calendar_events CASCADE;

-- Criar VIEW para eventos do calendário financeiro
CREATE OR REPLACE VIEW vw_calendar_events AS

-- Receitas Previstas (ainda não recebidas)
SELECT 
    r.id,
    'Receber' AS tipo,
    CASE 
        WHEN r.status = 'Atrasado' THEN 'Atrasado'
        ELSE 'Previsto'
    END AS status,
    r.data_prevista_recebimento AS data,
    COALESCE(p.nome, r.source, 'Receita') AS titulo,
    r.valor_liquido AS valor,
    r.unit_id,
    r.account_id,
    r.party_id,
    'Revenue' AS ref_tipo,
    r.id AS ref_id,
    r.status AS transaction_status,
    r.type AS category
FROM revenues r
LEFT JOIN parties p ON p.id = r.party_id
WHERE r.data_recebimento_efetivo IS NULL
AND r.status NOT IN ('Cancelado', 'Recebido')

UNION ALL

-- Receitas Efetivas (já recebidas)
SELECT 
    r.id,
    'Receber' AS tipo,
    'Efetivo' AS status,
    r.data_recebimento_efetivo AS data,
    COALESCE(p.nome, r.source, 'Receita') AS titulo,
    r.valor_liquido AS valor,
    r.unit_id,
    r.account_id,
    r.party_id,
    'Revenue' AS ref_tipo,
    r.id AS ref_id,
    r.status AS transaction_status,
    r.type AS category
FROM revenues r
LEFT JOIN parties p ON p.id = r.party_id
WHERE r.data_recebimento_efetivo IS NOT NULL
AND r.status = 'Recebido'

UNION ALL

-- Despesas Previstas (ainda não pagas)
SELECT 
    e.id,
    'Pagar' AS tipo,
    CASE 
        WHEN e.status = 'Atrasado' THEN 'Atrasado'
        ELSE 'Previsto'
    END AS status,
    e.data_prevista_pagamento AS data,
    COALESCE(p.nome, e.description, 'Despesa') AS titulo,
    e.value AS valor,
    e.unit_id,
    NULL AS account_id,
    e.party_id,
    'Expense' AS ref_tipo,
    e.id AS ref_id,
    e.status AS transaction_status,
    e.type AS category
FROM expenses e
LEFT JOIN parties p ON p.id = e.party_id
WHERE e.data_pagamento_efetivo IS NULL
AND e.status NOT IN ('Cancelado', 'Pago')

UNION ALL

-- Despesas Efetivas (já pagas)
SELECT 
    e.id,
    'Pagar' AS tipo,
    'Efetivo' AS status,
    e.data_pagamento_efetivo AS data,
    COALESCE(p.nome, e.description, 'Despesa') AS titulo,
    e.value AS valor,
    e.unit_id,
    NULL AS account_id,
    e.party_id,
    'Expense' AS ref_tipo,
    e.id AS ref_id,
    e.status AS transaction_status,
    e.type AS category
FROM expenses e
LEFT JOIN parties p ON p.id = e.party_id
WHERE e.data_pagamento_efetivo IS NOT NULL
AND e.status = 'Pago'

UNION ALL

-- Compensações (conciliações)
SELECT 
    rec.id,
    'Compensacao' AS tipo,
    rec.status::TEXT AS status,
    rec.data_compensacao AS data,
    CONCAT('Conciliação - ', bs.descricao) AS titulo,
    bs.valor AS valor,
    ba.unit_id,
    ba.id AS account_id,
    NULL AS party_id,
    rec.referencia_tipo::TEXT AS ref_tipo,
    rec.referencia_id AS ref_id,
    rec.status::TEXT AS transaction_status,
    NULL AS category
FROM reconciliations rec
JOIN bank_statements bs ON bs.id = rec.bank_statement_id
JOIN bank_accounts ba ON ba.id = bs.bank_account_id

ORDER BY data DESC;

-- Comentários na VIEW
COMMENT ON VIEW vw_calendar_events IS 'VIEW agregada de eventos financeiros para o calendário (receitas, despesas e compensações)';

-- Grant permissions
GRANT SELECT ON vw_calendar_events TO authenticated;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
