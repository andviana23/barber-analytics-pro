-- ============================================================================
-- 🎯 VIEW: vw_goals_detailed
-- ============================================================================
-- View otimizada para buscar metas com valores atingidos calculados
-- 
-- Uso: Substituir consultas complexas no frontend
-- Integração: GoalsPage, DashboardPage, Relatórios
-- 
-- Autor: Barber Analytics Pro
-- Data: 2025-10-23
-- ============================================================================

-- Drop da view se já existir
DROP VIEW IF EXISTS vw_goals_detailed CASCADE;

-- Criar view com LEFT JOIN e cálculos
CREATE OR REPLACE VIEW vw_goals_detailed AS
SELECT
    g.id,
    g.unit_id,
    g.goal_type,
    g.period,
    g.target_value,
    g.goal_year,
    g.goal_month,
    g.goal_quarter,
    g.is_active,
    g.created_at,
    g.updated_at,
    g.created_by,
    
    -- Informações da unidade
    u.name AS unit_name,
    
    -- Cálculo do valor atingido baseado no tipo de meta
    COALESCE(
        CASE g.goal_type
            
            -- 💰 FATURAMENTO GERAL
            WHEN 'revenue_general' THEN (
                SELECT COALESCE(SUM(r.amount), 0)
                FROM revenues r
                WHERE r.unit_id = g.unit_id
                  AND r.is_active = true
                  AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year
                  AND (
                      -- Mensal: filtrar por mês
                      (g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month)
                      OR
                      -- Trimestral: filtrar por trimestre
                      (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter)
                      OR
                      -- Anual: não filtrar mês/trimestre
                      (g.period = 'yearly')
                  )
            )
            
            -- 👥 ASSINATURAS
            WHEN 'subscription' THEN (
                SELECT COALESCE(SUM(r.amount), 0)
                FROM revenues r
                WHERE r.unit_id = g.unit_id
                  AND r.is_active = true
                  AND r.revenue_type = 'subscription'
                  AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year
                  AND (
                      (g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month)
                      OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter)
                      OR (g.period = 'yearly')
                  )
            )
            
            -- 📦 VENDA DE PRODUTOS
            WHEN 'product_sales' THEN (
                SELECT COALESCE(SUM(r.amount), 0)
                FROM revenues r
                WHERE r.unit_id = g.unit_id
                  AND r.is_active = true
                  AND r.revenue_type = 'product_sale'
                  AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year
                  AND (
                      (g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month)
                      OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter)
                      OR (g.period = 'yearly')
                  )
            )
            
            -- 💳 DESPESAS
            WHEN 'expenses' THEN (
                SELECT COALESCE(SUM(e.amount), 0)
                FROM expenses e
                WHERE e.unit_id = g.unit_id
                  AND e.is_active = true
                  AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year
                  AND (
                      (g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month)
                      OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter)
                      OR (g.period = 'yearly')
                  )
            )
            
            -- 📊 RESULTADO/LUCRO (Receitas - Despesas)
            WHEN 'profit' THEN (
                (
                    -- Total de receitas
                    SELECT COALESCE(SUM(r.amount), 0)
                    FROM revenues r
                    WHERE r.unit_id = g.unit_id
                      AND r.is_active = true
                      AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year
                      AND (
                          (g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month)
                          OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter)
                          OR (g.period = 'yearly')
                      )
                )
                -
                (
                    -- Total de despesas
                    SELECT COALESCE(SUM(e.amount), 0)
                    FROM expenses e
                    WHERE e.unit_id = g.unit_id
                      AND e.is_active = true
                      AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year
                      AND (
                          (g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month)
                          OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter)
                          OR (g.period = 'yearly')
                      )
                )
            )
            
            ELSE 0
        END,
        0
    ) AS achieved_value,
    
    -- Percentual de progresso
    CASE 
        WHEN g.target_value > 0 THEN
            ROUND(
                (COALESCE(
                    CASE g.goal_type
                        WHEN 'revenue_general' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
                        WHEN 'subscription' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND r.revenue_type = 'subscription' AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
                        WHEN 'product_sales' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND r.revenue_type = 'product_sale' AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
                        WHEN 'expenses' THEN (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.unit_id = g.unit_id AND e.is_active = true AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter) OR (g.period = 'yearly')))
                        WHEN 'profit' THEN ((SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly'))) - (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.unit_id = g.unit_id AND e.is_active = true AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter) OR (g.period = 'yearly'))))
                        ELSE 0
                    END,
                    0
                ) / g.target_value * 100),
                2
            )
        ELSE 0
    END AS progress_percentage,
    
    -- Valor restante para atingir meta
    g.target_value - COALESCE(
        CASE g.goal_type
            WHEN 'revenue_general' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
            WHEN 'subscription' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND r.revenue_type = 'subscription' AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
            WHEN 'product_sales' THEN (SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND r.revenue_type = 'product_sale' AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly')))
            WHEN 'expenses' THEN (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.unit_id = g.unit_id AND e.is_active = true AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter) OR (g.period = 'yearly')))
            WHEN 'profit' THEN ((SELECT COALESCE(SUM(r.amount), 0) FROM revenues r WHERE r.unit_id = g.unit_id AND r.is_active = true AND EXTRACT(YEAR FROM r.revenue_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM r.revenue_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM r.revenue_date) = g.goal_quarter) OR (g.period = 'yearly'))) - (SELECT COALESCE(SUM(e.amount), 0) FROM expenses e WHERE e.unit_id = g.unit_id AND e.is_active = true AND EXTRACT(YEAR FROM e.expense_date) = g.goal_year AND ((g.period = 'monthly' AND EXTRACT(MONTH FROM e.expense_date) = g.goal_month) OR (g.period = 'quarterly' AND EXTRACT(QUARTER FROM e.expense_date) = g.goal_quarter) OR (g.period = 'yearly'))))
            ELSE 0
        END,
        0
    ) AS remaining_value

FROM goals g
LEFT JOIN units u ON g.unit_id = u.id
WHERE g.is_active = true;

-- Adicionar comentário na view
COMMENT ON VIEW vw_goals_detailed IS 
'View otimizada com cálculos de metas. Campos: achieved_value, progress_percentage, remaining_value.';

-- ============================================================================
-- 🧪 TESTE DA VIEW
-- ============================================================================
-- Descomentar para testar:

-- SELECT 
--     goal_type,
--     period,
--     goal_year,
--     goal_month,
--     target_value,
--     achieved_value,
--     progress_percentage,
--     remaining_value
-- FROM vw_goals_detailed
-- ORDER BY goal_year DESC, goal_month DESC, goal_type;

-- ============================================================================
-- ✅ FIM DO SCRIPT
-- ============================================================================
