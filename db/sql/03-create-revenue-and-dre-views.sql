-- Revenue Views, DRE e KPIs (resilientes a diferenças de nomes)
SET search_path TO public;

-- Drop if exists (idempotente)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_revenues_base') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_revenues_base CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_revenues_detailed') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_revenues_detailed CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_monthly_revenues_summary') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_monthly_revenues_summary CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_revenues_by_unit') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_revenues_by_unit CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_dashboard_revenues') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_dashboard_revenues CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_monthly_dre') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_monthly_dre CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='vw_dre_by_unit') THEN
    EXECUTE 'DROP VIEW IF EXISTS vw_dre_by_unit CASCADE';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_financial_kpis'
  ) THEN
    EXECUTE 'DROP FUNCTION IF EXISTS get_financial_kpis(date, date)';
  END IF;
END $$;

-- 1) Base de receitas com mapeamento JSON
CREATE OR REPLACE VIEW vw_revenues_base AS
SELECT
  j->>'id' AS revenue_id,
  COALESCE(
    CASE WHEN (j->>'value') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'value')::numeric END,
    CASE WHEN (j->>'amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'amount')::numeric END,
    CASE WHEN (j->>'total') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'total')::numeric END,
    CASE WHEN (j->>'price') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'price')::numeric END,
    CASE WHEN (j->>'gross_amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'gross_amount')::numeric END,
    CASE WHEN (j->>'net_amount') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'net_amount')::numeric END,
    CASE WHEN (j->>'value_total') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'value_total')::numeric END,
    CASE WHEN (j->>'received_value') ~ '^-?\\d+(\\.\\d+)?$' THEN (j->>'received_value')::numeric END
  ) AS amount,
  COALESCE(
    CASE WHEN (j->>'date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'date')::date END,
    CASE WHEN (j->>'revenue_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'revenue_date')::date END,
    CASE WHEN (j->>'created_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'created_at')::date END,
    CASE WHEN (j->>'received_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'received_at')::date END,
    CASE WHEN (j->>'payment_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'payment_date')::date END,
    CASE WHEN (j->>'datetime') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'datetime')::date END,
    CASE WHEN (j->>'timestamp') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'timestamp')::date END,
    CASE WHEN (j->>'issued_at') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'issued_at')::date END,
    CASE WHEN (j->>'sale_date') ~ '^\\d{4}-\\d{2}-\\d{2}' THEN (j->>'sale_date')::date END
  ) AS revenue_dt,
  COALESCE(
    NULLIF(j->>'category',''),
    NULLIF(j->>'type',''),
    NULLIF(j->>'revenue_type',''),
    NULLIF(j->>'service_type',''),
    NULLIF(j->>'subcategory',''),
    NULLIF(j->>'group','')
  ) AS category,
  COALESCE(
    NULLIF(j->>'unit_id',''),
    NULLIF(j->>'store_id',''),
    NULLIF(j->>'branch_id','')
  ) AS unit_id,
  COALESCE(
    NULLIF(j->>'description',''),
    NULLIF(j->>'memo',''),
    NULLIF(j->>'note','')
  ) AS description
FROM revenues r
CROSS JOIN LATERAL to_jsonb(r) AS j;

-- 2) Receitas detalhadas (filtra nulos)
CREATE OR REPLACE VIEW vw_revenues_detailed AS
SELECT 
  revenue_id,
  revenue_dt,
  amount,
  COALESCE(category, 'Uncategorized') AS category,
  unit_id,
  description
FROM vw_revenues_base
WHERE amount IS NOT NULL AND revenue_dt IS NOT NULL;

-- 3) Resumo mensal de receitas
CREATE OR REPLACE VIEW vw_monthly_revenues_summary AS
SELECT 
  date_trunc('month', revenue_dt) AS month,
  SUM(amount) AS total_revenues,
  COUNT(*) AS revenue_count
FROM vw_revenues_detailed
GROUP BY 1
ORDER BY 1;

-- 4) Receitas por unidade
CREATE OR REPLACE VIEW vw_revenues_by_unit AS
SELECT 
  date_trunc('month', revenue_dt) AS month,
  unit_id,
  SUM(amount) AS total_revenues
FROM vw_revenues_detailed
GROUP BY 1, 2
ORDER BY 1, 2;

-- 5) Dashboard de receitas (últimos 12 meses)
CREATE OR REPLACE VIEW vw_dashboard_revenues AS
WITH last12 AS (
  SELECT now()::date - INTERVAL '11 months' AS start_month
)
SELECT 
  m.month::date,
  COALESCE(s.total_revenues, 0) AS total_revenues,
  COALESCE(s.revenue_count, 0) AS revenue_count
FROM (
  SELECT generate_series(
    date_trunc('month', (SELECT start_month FROM last12)),
    date_trunc('month', now()),
    interval '1 month'
  ) AS month
) AS m
LEFT JOIN vw_monthly_revenues_summary s
  ON s.month = m.month
ORDER BY m.month;

-- 6) DRE mensal consolidado (todas as competências)
CREATE OR REPLACE VIEW vw_monthly_dre AS
WITH rev AS (
  SELECT date_trunc('month', revenue_dt) AS month, SUM(amount) AS total_revenues
  FROM vw_revenues_detailed
  GROUP BY 1
),
exp AS (
  SELECT date_trunc('month', expense_dt) AS month, SUM(amount) AS total_expenses
  FROM vw_expenses_detailed
  GROUP BY 1
)
SELECT 
  COALESCE(rev.month, exp.month) AS month,
  COALESCE(rev.total_revenues, 0) AS total_revenues,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(rev.total_revenues, 0) - COALESCE(exp.total_expenses, 0) AS net_profit,
  CASE WHEN COALESCE(rev.total_revenues, 0) > 0
       THEN (COALESCE(rev.total_revenues, 0) - COALESCE(exp.total_expenses, 0)) / COALESCE(rev.total_revenues, 0)
       ELSE NULL END AS profit_margin
FROM rev
FULL OUTER JOIN exp ON exp.month = rev.month
ORDER BY month;

-- 7) DRE por unidade (mês x unidade)
CREATE OR REPLACE VIEW vw_dre_by_unit AS
WITH rev AS (
  SELECT date_trunc('month', revenue_dt) AS month, unit_id, SUM(amount) AS total_revenues
  FROM vw_revenues_detailed
  GROUP BY 1, 2
),
exp AS (
  SELECT date_trunc('month', expense_dt) AS month, unit_id, SUM(amount) AS total_expenses
  FROM vw_expenses_detailed
  GROUP BY 1, 2
)
SELECT 
  COALESCE(rev.month, exp.month) AS month,
  COALESCE(rev.unit_id, exp.unit_id) AS unit_id,
  COALESCE(rev.total_revenues, 0) AS total_revenues,
  COALESCE(exp.total_expenses, 0) AS total_expenses,
  COALESCE(rev.total_revenues, 0) - COALESCE(exp.total_expenses, 0) AS net_profit,
  CASE WHEN COALESCE(rev.total_revenues, 0) > 0
       THEN (COALESCE(rev.total_revenues, 0) - COALESCE(exp.total_expenses, 0)) / COALESCE(rev.total_revenues, 0)
       ELSE NULL END AS profit_margin
FROM rev
FULL OUTER JOIN exp
  ON exp.month = rev.month AND COALESCE(exp.unit_id,'') = COALESCE(rev.unit_id,'')
ORDER BY month, unit_id;

-- 8) Dashboard financeiro (últimos 12 meses)
CREATE OR REPLACE VIEW vw_dashboard_financials AS
WITH last12 AS (
  SELECT now()::date - INTERVAL '11 months' AS start_month
),
series AS (
  SELECT generate_series(
    date_trunc('month', (SELECT start_month FROM last12)),
    date_trunc('month', now()),
    interval '1 month'
  ) AS month
)
SELECT 
  s.month::date,
  COALESCE(d.total_revenues, 0) AS total_revenues,
  COALESCE(d.total_expenses, 0) AS total_expenses,
  COALESCE(d.net_profit, 0) AS net_profit,
  CASE WHEN COALESCE(d.total_revenues, 0) > 0
       THEN COALESCE(d.net_profit, 0) / COALESCE(d.total_revenues, 0)
       ELSE NULL END AS profit_margin
FROM series s
LEFT JOIN vw_monthly_dre d ON d.month = s.month
ORDER BY s.month;

-- 9) Função de KPIs agregados por período
CREATE OR REPLACE FUNCTION get_financial_kpis(p_start date, p_end date)
RETURNS TABLE (
  total_revenues numeric,
  total_expenses numeric,
  net_profit numeric,
  profit_margin numeric
) LANGUAGE sql STABLE AS $$
WITH r AS (
  SELECT COALESCE(SUM(amount), 0) AS total_revenues
  FROM vw_revenues_detailed
  WHERE revenue_dt BETWEEN p_start AND p_end
),
e AS (
  SELECT COALESCE(SUM(amount), 0) AS total_expenses
  FROM vw_expenses_detailed
  WHERE expense_dt BETWEEN p_start AND p_end
)
SELECT 
  r.total_revenues,
  e.total_expenses,
  r.total_revenues - e.total_expenses AS net_profit,
  CASE WHEN r.total_revenues > 0
       THEN (r.total_revenues - e.total_expenses) / r.total_revenues
       ELSE NULL END AS profit_margin
FROM r CROSS JOIN e;
$$;

-- Quick checks
-- SELECT * FROM vw_revenues_base LIMIT 20;
-- SELECT * FROM vw_monthly_revenues_summary ORDER BY month DESC;
-- SELECT * FROM vw_monthly_dre ORDER BY month DESC;
-- SELECT * FROM vw_dre_by_unit ORDER BY month DESC, unit_id;
-- SELECT * FROM vw_dashboard_financials;
-- SELECT * FROM get_financial_kpis(current_date - interval '30 days', current_date);

-- Overloads para aceitar timestamp e timestamptz (convertem para date)
CREATE OR REPLACE FUNCTION get_financial_kpis(p_start timestamp without time zone, p_end timestamp without time zone)
RETURNS TABLE (
  total_revenues numeric,
  total_expenses numeric,
  net_profit numeric,
  profit_margin numeric
) LANGUAGE sql STABLE AS $$
SELECT * FROM get_financial_kpis(p_start::date, p_end::date);
$$;

CREATE OR REPLACE FUNCTION get_financial_kpis(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (
  total_revenues numeric,
  total_expenses numeric,
  net_profit numeric,
  profit_margin numeric
) LANGUAGE sql STABLE AS $$
SELECT * FROM get_financial_kpis(p_start::date, p_end::date);
$$;
