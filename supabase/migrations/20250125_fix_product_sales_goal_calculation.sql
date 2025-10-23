-- ================================================================
-- FIX: Meta de Venda de Produtos - Filtro Exato por Categoria
-- ================================================================
-- Objetivo: Ajustar a função calculate_goal_achieved_value() para 
-- somar apenas receitas da categoria EXATA "Receita Produtos"
-- (não usar ILIKE que pode pegar categorias não desejadas)
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_goal_achieved_value(p_goal_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal_type text;
    v_unit_id uuid;
    v_category_id uuid;
    v_period text;
    v_goal_year integer;
    v_goal_month integer;
    v_goal_quarter integer;
    v_start_date date;
    v_end_date date;
    v_achieved numeric := 0;
BEGIN
    -- Buscar meta
    SELECT 
        goal_type, 
        unit_id, 
        category_id, 
        period, 
        goal_year, 
        goal_month, 
        goal_quarter
    INTO 
        v_goal_type, 
        v_unit_id, 
        v_category_id, 
        v_period, 
        v_goal_year, 
        v_goal_month, 
        v_goal_quarter
    FROM goals
    WHERE id = p_goal_id;

    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Determinar período de datas
    IF v_period = 'monthly' AND v_goal_month IS NOT NULL THEN
        v_start_date := make_date(v_goal_year, v_goal_month, 1);
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::date;
    ELSIF v_period = 'quarterly' AND v_goal_quarter IS NOT NULL THEN
        v_start_date := make_date(v_goal_year, (v_goal_quarter - 1) * 3 + 1, 1);
        v_end_date := (v_start_date + INTERVAL '3 months' - INTERVAL '1 day')::date;
    ELSIF v_period = 'yearly' THEN
        v_start_date := make_date(v_goal_year, 1, 1);
        v_end_date := make_date(v_goal_year, 12, 31);
    ELSE
        RETURN 0; -- Período inválido
    END IF;

    -- ============================================================
    -- RECEITAS (revenue_general, subscription, product_sales)
    -- ============================================================
    IF v_goal_type IN ('revenue_general', 'subscription', 'product_sales') THEN

        IF v_category_id IS NOT NULL THEN
            -- Meta específica por categoria (ID exato)
            SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
            INTO v_achieved
            FROM revenues
            WHERE unit_id = v_unit_id
              AND category_id = v_category_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        ELSE
            -- Meta geral por tipo
            IF v_goal_type = 'subscription' THEN
                -- ✅ Assinaturas: filtro ILIKE (aceita variações)
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues r
                JOIN categories c ON r.category_id = c.id
                WHERE r.unit_id = v_unit_id
                  AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
                  AND r.is_active = true
                  AND (c.name ILIKE '%assinatura%' OR c.name ILIKE '%subscription%');

            ELSIF v_goal_type = 'product_sales' THEN
                -- ✅ CORREÇÃO: Produtos - filtro EXATO pela categoria "Receita Produtos"
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues r
                JOIN categories c ON r.category_id = c.id
                WHERE r.unit_id = v_unit_id
                  AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
                  AND r.is_active = true
                  AND c.name = 'Receita Produtos'; -- ⚠️ FILTRO EXATO (não mais ILIKE)

            ELSE -- revenue_general
                -- Todas as receitas (sem filtro de categoria)
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues
                WHERE unit_id = v_unit_id
                  AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
                  AND is_active = true;
            END IF;
        END IF;

    -- ============================================================
    -- DESPESAS
    -- ============================================================
    ELSIF v_goal_type = 'expenses' THEN

        IF v_category_id IS NOT NULL THEN
            SELECT COALESCE(SUM(value), 0)
            INTO v_achieved
            FROM expenses
            WHERE unit_id = v_unit_id
              AND category_id = v_category_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        ELSE
            SELECT COALESCE(SUM(value), 0)
            INTO v_achieved
            FROM expenses
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        END IF;

    -- ============================================================
    -- LUCRO (Receitas - Despesas)
    -- ============================================================
    ELSIF v_goal_type = 'profit' THEN

        DECLARE
            v_receita_bruta numeric := 0;
            v_taxa_cartao numeric := 0;
            v_deducoes numeric := 0;
            v_despesas numeric := 0;
        BEGIN
            -- Receita Bruta
            SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
            INTO v_receita_bruta
            FROM revenues
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;

            -- Taxa de Cartão
            SELECT COALESCE(SUM(
                COALESCE(r.net_amount, r.value) * (COALESCE(pm.fee_percentage, 0) / 100.0)
            ), 0)
            INTO v_taxa_cartao
            FROM revenues r
            JOIN payment_methods pm ON r.payment_method_id = pm.id
            WHERE r.unit_id = v_unit_id
              AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
              AND r.is_active = true;

            -- Deduções (impostos, etc)
            SELECT COALESCE(SUM(
                COALESCE(r.net_amount, r.value) * (COALESCE(r.discount_percentage, 0) / 100.0)
            ), 0)
            INTO v_deducoes
            FROM revenues r
            WHERE r.unit_id = v_unit_id
              AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
              AND r.is_active = true;

            -- Despesas
            SELECT COALESCE(SUM(value), 0)
            INTO v_despesas
            FROM expenses
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;

            -- Lucro = Receita Bruta - Taxa Cartão - Deduções - Despesas
            v_achieved := v_receita_bruta - v_taxa_cartao - v_deducoes - v_despesas;
        END;

    END IF;

    -- Retornar valor calculado
    RETURN COALESCE(v_achieved, 0);
END;
$$;

-- ================================================================
-- Comentário da Função
-- ================================================================
COMMENT ON FUNCTION calculate_goal_achieved_value(uuid) IS 
'Calcula o valor atingido (achieved_value) de uma meta específica.
- product_sales: Soma EXATA da categoria "Receita Produtos" (não mais ILIKE)
- subscription: Soma categorias com ILIKE %assinatura%
- revenue_general: Soma TODAS as receitas
- expenses: Soma TODAS as despesas (ou categoria específica)
- profit: Receita Líquida - Despesas (lógica DRE)';

-- ================================================================
-- Atualizar View vw_goals_detailed (se existir)
-- ================================================================
-- A view usa a função acima para calcular achieved_value em tempo real
-- Verificar se a view existe e recriá-la com a nova função

-- DROP VIEW IF EXISTS vw_goals_detailed CASCADE;

-- CREATE OR REPLACE VIEW vw_goals_detailed AS
-- SELECT 
--     g.*,
--     u.name as unit_name,
--     c.name as category_name,
--     calculate_goal_achieved_value(g.id) as achieved_value,
--     CASE 
--         WHEN g.target_value > 0 THEN 
--             ROUND((calculate_goal_achieved_value(g.id) / g.target_value * 100)::numeric, 2)
--         ELSE 0 
--     END as progress_percentage,
--     g.target_value - calculate_goal_achieved_value(g.id) as remaining_value,
--     CASE
--         WHEN calculate_goal_achieved_value(g.id) >= g.target_value THEN 'achieved'
--         WHEN calculate_goal_achieved_value(g.id) >= g.target_value * 0.7 THEN 'on_track'
--         WHEN calculate_goal_achieved_value(g.id) >= g.target_value * 0.4 THEN 'at_risk'
--         ELSE 'behind'
--     END as status
-- FROM goals g
-- JOIN units u ON g.unit_id = u.id
-- LEFT JOIN categories c ON g.category_id = c.id
-- WHERE g.is_active = true;

-- COMMENT ON VIEW vw_goals_detailed IS 
-- 'View otimizada com cálculo automático do progresso de metas.
-- - achieved_value: calculado em tempo real via função
-- - progress_percentage: % de conclusão da meta
-- - status: achieved/on_track/at_risk/behind';

-- ================================================================
-- FIM DO SCRIPT
-- ================================================================
