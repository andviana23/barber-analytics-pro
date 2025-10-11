-- Expense Views — resilient to naming differences by mapping likely columns
SET search_path TO public;

-- Drop if exists (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_expenses_base') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_expenses_base CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_expenses_detailed') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_expenses_detailed CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_monthly_expenses_summary') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_monthly_expenses_summary CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_expenses_by_unit') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_expenses_by_unit CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_dashboard_expenses') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_dashboard_expenses CASCADE';
  END IF;
END $$;

-- 1) Base view: unify canonical columns (using JSON to avoid compile-time errors on missing columns)
CREATE OR REPLACE VIEW vw_expenses_base AS
SELECT
  -- id as text
  j->>'id' AS expense_id,
  -- amount: prefer value -> amount -> total, numeric-safe
  COALESCE(
    CASE WHEN (j->>'value') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'value')::numeric END,
    CASE WHEN (j->>'amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'amount')::numeric END,
    CASE WHEN (j->>'total') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'total')::numeric END,
    CASE WHEN (j->>'price') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'price')::numeric END,
    CASE WHEN (j->>'gross_amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'gross_amount')::numeric END,
    CASE WHEN (j->>'net_amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'net_amount')::numeric END,
    CASE WHEN (j->>'value_total') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'value_total')::numeric END,
    CASE WHEN (j->>'paid_value') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'paid_value')::numeric END
  ) AS amount,
  -- date: prefer date -> expense_date -> created_at, ISO-only cast
  COALESCE(
    CASE WHEN (j->>'date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'date')::date END,
    CASE WHEN (j->>'expense_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'expense_date')::date END,
    CASE WHEN (j->>'created_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'created_at')::date END,
    CASE WHEN (j->>'paid_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'paid_at')::date END,
    CASE WHEN (j->>'payment_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'payment_date')::date END,
    CASE WHEN (j->>'datetime') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'datetime')::date END,
    CASE WHEN (j->>'timestamp') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'timestamp')::date END,
    CASE WHEN (j->>'issued_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'issued_at')::date END,
    CASE WHEN (j->>'purchase_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'purchase_date')::date END
  ) AS expense_dt,
  -- category/type
  COALESCE(
    NULLIF(j->>'category',''),
    NULLIF(j->>'type',''),
    NULLIF(j->>'expense_type',''),
    NULLIF(j->>'cost_center',''),
    NULLIF(j->>'subcategory',''),
    NULLIF(j->>'group','')
  ) AS category,
  -- unit/store/branch id as text
  COALESCE(
    NULLIF(j->>'unit_id',''),
    NULLIF(j->>'store_id',''),
    NULLIF(j->>'branch_id','')
  ) AS unit_id,
  -- description/memo/note
  COALESCE(
    NULLIF(j->>'description',''),
    NULLIF(j->>'memo',''),
    NULLIF(j->>'note','')
  ) AS description
FROM expenses e
CROSS JOIN LATERAL to_jsonb(e) AS j
-- No filtering here; downstream views will ignore NULLs for amount/date
;

-- 2) Detailed expenses
CREATE OR REPLACE VIEW vw_expenses_detailed AS
SELECT 
  expense_id,
  expense_dt,
  amount,
  COALESCE(category, 'Uncategorized') AS category,
  unit_id,
  description
FROM vw_expenses_base
WHERE amount IS NOT NULL AND expense_dt IS NOT NULL;

-- 3) Monthly summary
CREATE OR REPLACE VIEW vw_monthly_expenses_summary AS
SELECT 
  date_trunc('month', expense_dt) AS month,
  SUM(amount) AS total_expenses,
  COUNT(*) AS expense_count
FROM vw_expenses_base
WHERE amount IS NOT NULL AND expense_dt IS NOT NULL
GROUP BY 1
ORDER BY 1;

-- 4) Expenses by unit
CREATE OR REPLACE VIEW vw_expenses_by_unit AS
SELECT 
  date_trunc('month', expense_dt) AS month,
  unit_id,
  SUM(amount) AS total_expenses
FROM vw_expenses_base
WHERE amount IS NOT NULL AND expense_dt IS NOT NULL
GROUP BY 1, 2
ORDER BY 1, 2;

-- 5) Dashboard rollup (last 12 months)
CREATE OR REPLACE VIEW vw_dashboard_expenses AS
WITH last12 AS (
  SELECT now()::date - INTERVAL '11 months' AS start_month
)
SELECT 
  m.month::date,
  COALESCE(s.total_expenses, 0) AS total_expenses,
  COALESCE(s.expense_count, 0) AS expense_count
FROM (
  SELECT generate_series(
    date_trunc('month', (SELECT start_month FROM last12)),
    date_trunc('month', now()),
    interval '1 month'
  ) AS month
)
AS m
LEFT JOIN vw_monthly_expenses_summary s
  ON s.month = m.month
ORDER BY m.month;

-- Quick checks
-- SELECT * FROM vw_expenses_base LIMIT 20;
-- SELECT * FROM vw_expenses_detailed ORDER BY expense_dt DESC LIMIT 20;
-- SELECT * FROM vw_monthly_expenses_summary;
-- SELECT * FROM vw_expenses_by_unit;
-- SELECT * FROM vw_dashboard_expenses;
