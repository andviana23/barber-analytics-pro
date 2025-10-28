# Database scripts

This folder contains SQL scripts to inspect the current schema and create robust analytics views for expenses.

How to run

- With VS Code SQLTools (PostgreSQL):
  1. Open the SQL file (for example: `db/sql/01-schema-snapshot.sql`).
  2. Ensure your SQLTools connection to Supabase is selected.
  3. Execute the file. Review the results in the Results panel.

- With Supabase SQL Editor:
  1. Open the SQL Editor in your project.
  2. Paste the content of the file and run it.

Files

- `sql/01-schema-snapshot.sql`: Lists tables, columns, constraints, indexes, enums, quick row counts and samples for key tables. Use this first to confirm table/column names.
- `sql/02-create-expense-views.sql`: Creates resilient expense views: `vw_expenses_base`, `vw_expenses_detailed`, `vw_monthly_expenses_summary`, `vw_expenses_by_unit`, and `vw_dashboard_expenses`.
- `sql/03-create-revenue-and-dre-views.sql`: Creates revenue views (`vw_revenues_*`), DRE consolidated (`vw_monthly_dre`, `vw_dre_by_unit`, `vw_dashboard_financials`) and a KPI function `get_financial_kpis(start_date, end_date)`.
- `sql/05-grant-select-on-views.sql`: Grants SELECT on all `vw_*` views to Supabase roles `anon` and `authenticated` for API access.
- `sql/06-grant-execute-on-functions.sql`: Grants `USAGE` on `public` schema and `EXECUTE` on functions `get_*` to `anon` and `authenticated`.

Notes

- All scripts assume the `public` schema with `SET search_path TO public;`.
- The expense views try common column names (value/amount/total, date/expense_date/created_at, unit_id/store_id/branch_id, category/type/cost_center) to reduce errors across environments.
- If your table uses different names, share the output of `01-schema-snapshot.sql` and we will adapt the views.

Troubleshooting

- Erro de função de KPI com tipos (timestamp x date): o arquivo `03-create-revenue-and-dre-views.sql` cria overloads que convertem para `date`. Use:

```sql
SELECT * FROM get_financial_kpis(current_date - interval '30 days', current_date);
```

- Sem dados retornados: pode ser que não haja dados no período consultado. Teste com um intervalo maior ou sem filtros nas views base (`vw_revenues_detailed`, `vw_expenses_detailed`).

Examples

Run after creating the views:

```sql
-- Últimos 12 meses: receitas x despesas x lucro
SELECT * FROM vw_dashboard_financials;

-- DRE mensal consolidado
SELECT * FROM vw_monthly_dre ORDER BY month DESC;

-- KPIs do período (últimos 30 dias)
SELECT * FROM get_financial_kpis(current_date - interval '30 days', current_date);
```

API (Supabase)

- Após executar `05-...` e `06-...`, você consegue:
  - Ler views: via REST (`/rest/v1/vw_dashboard_financials`) ou Supabase JS.
  - Chamar função: expor como RPC (se necessário) ou usar Supabase JS com `rpc('get_financial_kpis', { p_start: '2025-09-01', p_end: '2025-09-30' })`.
