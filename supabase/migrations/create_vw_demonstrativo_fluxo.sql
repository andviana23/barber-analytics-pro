-- =====================================================================
-- VIEW: vw_demonstrativo_fluxo
-- Descrição: Demonstrativo de fluxo de caixa acumulado por conta bancária
-- Autor: Andrey Viana
-- Data: 2025-11-05
-- Status: ✅ EXECUTADO COM SUCESSO
-- =====================================================================

-- Drop view if exists
DROP VIEW IF EXISTS vw_demonstrativo_fluxo;

-- Create view
CREATE OR REPLACE VIEW vw_demonstrativo_fluxo AS
WITH daily_movements AS (
  -- Receitas (entradas)
  SELECT
    r.unit_id,
    r.account_id,
    r.date::DATE AS transaction_date,
    SUM(COALESCE(r.net_amount, r.value)) AS entradas,
    0::NUMERIC(15,2) AS saidas
  FROM revenues r
  WHERE
    r.is_active = true
    AND r.status IN ('Received', 'Paid')
    AND r.account_id IS NOT NULL
  GROUP BY r.unit_id, r.account_id, r.date::DATE

  UNION ALL

  -- Despesas (saídas)
  SELECT
    e.unit_id,
    e.account_id,
    e.date::DATE AS transaction_date,
    0::NUMERIC(15,2) AS entradas,
    SUM(e.value) AS saidas
  FROM expenses e
  WHERE
    e.is_active = true
    AND e.status = 'Paid'
    AND e.account_id IS NOT NULL
  GROUP BY e.unit_id, e.account_id, e.date::DATE
),
aggregated AS (
  -- Agrupa por data (entradas e saídas do mesmo dia)
  SELECT
    unit_id,
    account_id,
    transaction_date,
    SUM(entradas) AS entradas,
    SUM(saidas) AS saidas,
    SUM(entradas) - SUM(saidas) AS saldo_dia
  FROM daily_movements
  GROUP BY unit_id, account_id, transaction_date
)
-- Calcula saldo acumulado usando window function
SELECT
  unit_id,
  account_id,
  transaction_date,
  entradas,
  saidas,
  saldo_dia,
  SUM(saldo_dia) OVER (
    PARTITION BY unit_id, account_id
    ORDER BY transaction_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS saldo_acumulado
FROM aggregated
ORDER BY unit_id, account_id, transaction_date;

-- Comentários
COMMENT ON VIEW vw_demonstrativo_fluxo IS
'Demonstrativo de fluxo de caixa acumulado por conta bancária.
Agrega receitas (Received/Paid) e despesas (Paid) por dia.
Calcula saldo diário e saldo acumulado usando window functions.
Usado pelo módulo de Demonstrativo de Fluxo de Caixa.';

-- Grant permissions
GRANT SELECT ON vw_demonstrativo_fluxo TO authenticated;

-- =====================================================================
-- TESTE
-- =====================================================================
-- SELECT * FROM vw_demonstrativo_fluxo
-- WHERE unit_id = 'SEU_UNIT_ID_AQUI'
--   AND account_id = 'ACCOUNT_ID_AQUI'
--   AND transaction_date >= '2025-01-01'
--   AND transaction_date <= '2025-01-31'
-- ORDER BY transaction_date;
