-- ============================================================================
-- MIGRAÇÃO: Completar Migração de ENUMs
-- ============================================================================
-- Descrição: Atualiza views e policies para usar as novas colunas tipadas
--            com ENUMs e remove as colunas antigas varchar
-- Autor: Andrey Viana
-- Data: 31/10/2025
-- Tarefas: SQL-05 (professionals.role) e SQL-07 (expenses.forma_pagamento)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: ATUALIZAR VIEW vw_ranking_profissionais
-- ============================================================================
-- Substituir uso de `p.role` por `p.role_new::text`

DROP VIEW IF EXISTS vw_ranking_profissionais CASCADE;

CREATE OR REPLACE VIEW vw_ranking_profissionais AS
WITH professional_revenues AS (
  SELECT 
    r.professional_id,
    r.unit_id,
    date_trunc('month'::text, (r.date)::timestamp with time zone) AS period,
    count(*) AS total_services,
    sum(COALESCE(r.net_amount, r.value)) AS total_revenue,
    avg(COALESCE(r.net_amount, r.value)) AS avg_ticket,
    min(COALESCE(r.net_amount, r.value)) AS min_ticket,
    max(COALESCE(r.net_amount, r.value)) AS max_ticket,
    count(CASE WHEN (r.status = 'Received'::transaction_status) THEN 1 ELSE NULL::integer END) AS received_services,
    sum(CASE WHEN (r.status = 'Received'::transaction_status) THEN COALESCE(r.net_amount, r.value) ELSE (0)::numeric END) AS received_revenue,
    count(CASE WHEN (r.status = 'Pending'::transaction_status) THEN 1 ELSE NULL::integer END) AS pending_services,
    sum(CASE WHEN (r.status = 'Pending'::transaction_status) THEN COALESCE(r.net_amount, r.value) ELSE (0)::numeric END) AS pending_revenue,
    count(CASE WHEN (r.type = 'service'::income_type) THEN 1 ELSE NULL::integer END) AS service_count,
    count(CASE WHEN (r.type = 'product'::income_type) THEN 1 ELSE NULL::integer END) AS product_count,
    count(CASE WHEN (r.type = 'commission'::income_type) THEN 1 ELSE NULL::integer END) AS commission_count,
    count(DISTINCT r.date) AS working_days
  FROM revenues r
  WHERE ((r.is_active = true) AND (r.professional_id IS NOT NULL))
  GROUP BY r.professional_id, r.unit_id, (date_trunc('month'::text, (r.date)::timestamp with time zone))
), 
professional_stats AS (
  SELECT 
    pr.professional_id,
    pr.unit_id,
    pr.period,
    pr.total_services,
    pr.total_revenue,
    pr.avg_ticket,
    pr.min_ticket,
    pr.max_ticket,
    pr.received_services,
    pr.received_revenue,
    pr.pending_services,
    pr.pending_revenue,
    pr.service_count,
    pr.product_count,
    pr.commission_count,
    pr.working_days,
    p.name AS professional_name,
    p.role_new::text AS professional_role,  -- ✅ ATUALIZADO: role → role_new::text
    p.commission_rate,
    u.name AS unit_name,
    round(((pr.received_revenue * p.commission_rate) / (100)::numeric), 2) AS commission_amount,
    CASE WHEN (pr.working_days > 0) THEN round((pr.total_revenue / (pr.working_days)::numeric), 2) ELSE (0)::numeric END AS daily_avg_revenue,
    CASE WHEN (pr.total_services > 0) THEN round((((pr.received_services)::numeric / (pr.total_services)::numeric) * (100)::numeric), 2) ELSE (0)::numeric END AS conversion_rate
  FROM professional_revenues pr
  JOIN professionals p ON p.id = pr.professional_id
  JOIN units u ON u.id = pr.unit_id
  WHERE p.is_active = true
), 
with_rankings AS (
  SELECT 
    ps.*,
    row_number() OVER (PARTITION BY ps.unit_id, ps.period ORDER BY ps.total_revenue DESC) AS rank_by_revenue,
    row_number() OVER (PARTITION BY ps.unit_id, ps.period ORDER BY ps.total_services DESC) AS rank_by_services,
    row_number() OVER (PARTITION BY ps.unit_id, ps.period ORDER BY ps.avg_ticket DESC) AS rank_by_ticket,
    row_number() OVER (PARTITION BY ps.unit_id, ps.period ORDER BY ps.daily_avg_revenue DESC) AS rank_by_daily_avg,
    ntile(10) OVER (PARTITION BY ps.unit_id, ps.period ORDER BY ps.total_revenue DESC) AS revenue_decile,
    count(*) OVER (PARTITION BY ps.unit_id, ps.period) AS total_professionals,
    avg(ps.total_revenue) OVER (PARTITION BY ps.unit_id, ps.period) AS unit_avg_revenue,
    avg(ps.avg_ticket) OVER (PARTITION BY ps.unit_id, ps.period) AS unit_avg_ticket,
    lag(ps.total_revenue) OVER (PARTITION BY ps.professional_id, ps.unit_id ORDER BY ps.period) AS previous_revenue
  FROM professional_stats ps
)
SELECT 
  professional_id,
  professional_name,
  professional_role,
  unit_id,
  unit_name,
  period,
  to_char(period, 'MM/YYYY') AS period_formatted,
  EXTRACT(year FROM period)::integer AS year,
  EXTRACT(month FROM period)::integer AS month,
  total_services,
  received_services,
  pending_services,
  total_revenue,
  received_revenue,
  pending_revenue,
  avg_ticket,
  min_ticket,
  max_ticket,
  working_days,
  daily_avg_revenue,
  commission_rate,
  commission_amount,
  conversion_rate,
  service_count,
  product_count,
  commission_count,
  rank_by_revenue,
  rank_by_services,
  rank_by_ticket,
  rank_by_daily_avg,
  total_professionals,
  unit_avg_revenue,
  unit_avg_ticket,
  round((((total_revenue - unit_avg_revenue) / NULLIF(unit_avg_revenue, 0::numeric)) * 100::numeric), 2) AS performance_vs_unit_percent,
  revenue_decile,
  CASE
    WHEN revenue_decile = 1 THEN 'top_10'
    WHEN revenue_decile <= 2 THEN 'top_20'
    WHEN revenue_decile <= 3 THEN 'top_30'
    WHEN revenue_decile <= 5 THEN 'above_average'
    WHEN revenue_decile <= 7 THEN 'average'
    ELSE 'below_average'
  END AS performance_badge,
  previous_revenue,
  (total_revenue - COALESCE(previous_revenue, 0::numeric)) AS revenue_growth,
  CASE WHEN previous_revenue > 0 THEN round((((total_revenue - previous_revenue) / previous_revenue) * 100::numeric), 2) ELSE NULL END AS revenue_growth_percent,
  CASE
    WHEN total_revenue > COALESCE(previous_revenue, 0::numeric) THEN 'growing'
    WHEN total_revenue < COALESCE(previous_revenue, 0::numeric) THEN 'declining'
    ELSE 'stable'
  END AS trend,
  now() AS generated_at
FROM with_rankings
ORDER BY unit_id, period DESC, rank_by_revenue;

COMMENT ON VIEW vw_ranking_profissionais IS 
'View de ranking de profissionais por receita, vendas e ticket médio. Atualizada para usar role_new (ENUM).';

-- ============================================================================
-- PARTE 2: ATUALIZAR POLICY barbers_turn_history
-- ============================================================================
-- Substituir uso de `professionals.role` por `professionals.role_new`

-- Remover policy antiga
DROP POLICY IF EXISTS "Admins can manage all history" ON barbers_turn_history;

-- Criar policy atualizada
CREATE POLICY "Admins can manage all history"
ON barbers_turn_history
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM professionals
    WHERE professionals.user_id = auth.uid()
      AND professionals.role_new = 'admin'::professional_role_enum  -- ✅ ATUALIZADO
      AND professionals.is_active = true
  )
);

COMMENT ON POLICY "Admins can manage all history" ON barbers_turn_history IS
'Administradores podem gerenciar todo o histórico de lista da vez. Atualizado para usar role_new (ENUM).';

-- ============================================================================
-- PARTE 3: REMOVER COLUNA professionals.role
-- ============================================================================
-- Remove a coluna antiga varchar e renomeia role_new → role

ALTER TABLE professionals 
  DROP COLUMN IF EXISTS role;

ALTER TABLE professionals 
  RENAME COLUMN role_new TO role;

-- Adicionar comentário na coluna
COMMENT ON COLUMN professionals.role IS 
'Papel do profissional no sistema. Valores: barbeiro, gerente, admin, recepcionista. Tipado com ENUM.';

-- ============================================================================
-- PARTE 4: REMOVER COLUNA expenses.forma_pagamento
-- ============================================================================
-- Remove a coluna antiga varchar e renomeia payment_method → forma_pagamento

ALTER TABLE expenses 
  DROP COLUMN IF EXISTS forma_pagamento;

ALTER TABLE expenses 
  RENAME COLUMN payment_method TO forma_pagamento;

-- Adicionar comentário na coluna
COMMENT ON COLUMN expenses.forma_pagamento IS 
'Forma de pagamento da despesa. Valores: pix, dinheiro, cartao_credito, cartao_debito, transferencia, boleto. Tipado com ENUM.';

-- ============================================================================
-- VALIDAÇÕES FINAIS
-- ============================================================================

-- Verificar que as colunas antigas foram removidas
DO $$
BEGIN
  -- Verificar professionals.role existe e é do tipo ENUM
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'professionals' 
      AND column_name = 'role'
      AND udt_name = 'professional_role_enum'
  ) THEN
    RAISE EXCEPTION 'Coluna professionals.role não existe ou não é do tipo professional_role_enum';
  END IF;

  -- Verificar que professionals.role_new NÃO existe mais
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'professionals' 
      AND column_name = 'role_new'
  ) THEN
    RAISE EXCEPTION 'Coluna professionals.role_new ainda existe (deveria ter sido renomeada)';
  END IF;

  -- Verificar expenses.forma_pagamento existe e é do tipo ENUM
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'expenses' 
      AND column_name = 'forma_pagamento'
      AND udt_name = 'payment_method_enum'
  ) THEN
    RAISE EXCEPTION 'Coluna expenses.forma_pagamento não existe ou não é do tipo payment_method_enum';
  END IF;

  -- Verificar que expenses.payment_method NÃO existe mais
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'expenses' 
      AND column_name = 'payment_method'
  ) THEN
    RAISE EXCEPTION 'Coluna expenses.payment_method ainda existe (deveria ter sido renomeada)';
  END IF;

  RAISE NOTICE '✅ Validações concluídas: todas as colunas estão corretas!';
END $$;

COMMIT;

-- ============================================================================
-- RESUMO DA MIGRAÇÃO
-- ============================================================================
-- ✅ View vw_ranking_profissionais: Atualizada para usar role_new::text
-- ✅ Policy barbers_turn_history: Atualizada para usar role_new (ENUM)
-- ✅ Coluna professionals.role: Removida e substituída por role_new → role
-- ✅ Coluna expenses.forma_pagamento: Removida e substituída por payment_method → forma_pagamento
-- ✅ Validações: Garantem que a estrutura está correta
-- 
-- PRÓXIMO PASSO: Atualizar código da aplicação para usar os novos tipos
-- ============================================================================
