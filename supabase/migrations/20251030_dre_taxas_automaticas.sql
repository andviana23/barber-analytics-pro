-- ==========================================
-- DRE v3.0.2 - CÁLCULO AUTOMÁTICO DE TAXAS DE CARTÃO
-- ==========================================
-- Data: 30/10/2025
-- Autor: Andrey Viana
-- 
-- Atualiza função DRE para calcular automaticamente as taxas de cartão
-- baseado nas formas de pagamento usadas em cada receita.
--
-- Mudanças:
-- 1. ✅ Calcula taxas automaticamente (receita × taxa_percentual)
-- 2. ✅ Deduz taxas da receita bruta para chegar na receita líquida
-- 3. ✅ Retorna detalhamento por forma de pagamento
-- 4. ✅ Versão: 3.0.2-TAXAS-AUTOMATICAS
-- ==========================================

DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);

CREATE OR REPLACE FUNCTION public.fn_calculate_dre_dynamic(
  p_unit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_receita_bruta numeric := 0;
  v_deducoes numeric := 0;
  v_taxas_cartao numeric := 0;
  v_receita_liquida numeric := 0;
  v_custos_operacionais numeric := 0;
  v_margem_contribuicao numeric := 0;
  v_despesas_fixas numeric := 0;
  v_ebitda numeric := 0;
  v_impostos numeric := 0;
  v_ebit numeric := 0;
  v_receitas_financeiras numeric := 0;
  v_despesas_financeiras numeric := 0;
  v_resultado_financeiro numeric := 0;
  v_lucro_liquido numeric := 0;
  
  v_margem_liquida_perc numeric := 0;
  v_margem_contribuicao_perc numeric := 0;
  v_margem_ebitda_perc numeric := 0;
  v_margem_ebit_perc numeric := 0;
  
  v_receita_por_categoria jsonb := '[]'::jsonb;
  v_deducoes_por_categoria jsonb := '[]'::jsonb;
  v_taxas_por_forma_pagamento jsonb := '[]'::jsonb;
  v_custos_por_categoria jsonb := '[]'::jsonb;
  v_despesas_por_categoria jsonb := '[]'::jsonb;
  v_impostos_por_categoria jsonb := '[]'::jsonb;
BEGIN

  -- 1. RECEITA BRUTA
  WITH revenue_categories AS (
    SELECT 
      r.category_id,
      SUM(r.value) as total
    FROM revenues r
    WHERE r.unit_id = p_unit_id
      AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
      AND r.is_active = true
      AND r.category_id IS NOT NULL
    GROUP BY r.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_receita_bruta, v_receita_por_categoria
  FROM revenue_categories cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Revenue';

  -- 2. TAXAS DE CARTÃO (CÁLCULO AUTOMÁTICO)
  WITH revenue_fees AS (
    SELECT 
      pm.name as forma_pagamento,
      pm.fee_percentage as taxa_percentual,
      SUM(r.value) as total_receita,
      SUM(r.value * (pm.fee_percentage / 100)) as total_taxa
    FROM revenues r
    INNER JOIN payment_methods pm ON r.payment_method_id = pm.id
    WHERE r.unit_id = p_unit_id
      AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
      AND r.is_active = true
      AND pm.fee_percentage > 0
    GROUP BY pm.name, pm.fee_percentage
  )
  SELECT 
    COALESCE(SUM(total_taxa), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'forma_pagamento', forma_pagamento,
          'taxa_percentual', taxa_percentual,
          'total_receita', total_receita,
          'valor_taxa', total_taxa
        )
        ORDER BY total_taxa DESC
      ),
      '[]'::jsonb
    )
  INTO v_taxas_cartao, v_taxas_por_forma_pagamento
  FROM revenue_fees;

  -- 3. DEDUÇÕES MANUAIS
  WITH expense_deductions AS (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_deducoes, v_deducoes_por_categoria
  FROM expense_deductions cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%dedu%' 
      OR c.name ILIKE '%desconto%'
      OR c.name ILIKE '%devolu%'
      OR parent_cat.name ILIKE '%dedu%'
    );
  
  v_receita_liquida := v_receita_bruta - v_taxas_cartao - v_deducoes;
  
  -- 4. CUSTOS OPERACIONAIS
  WITH operational_costs AS (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_custos_operacionais, v_custos_por_categoria
  FROM operational_costs cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      parent_cat.name ILIKE '%OPERACIONAIS%'
      OR parent_cat.name ILIKE 'Despesas Operacionais'
      OR c.name ILIKE '%OPERACIONAIS%'
    )
    AND c.name NOT ILIKE '%dedu%'
    AND c.name NOT ILIKE '%desconto%'
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%';
  
  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;
  
  -- 5. DESPESAS ADMINISTRATIVAS
  WITH administrative_expenses AS (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_despesas_fixas, v_despesas_por_categoria
  FROM administrative_expenses cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      parent_cat.name ILIKE '%ADMINISTRATIVAS%'
      OR parent_cat.name ILIKE 'Despesas Fixas'
      OR c.name ILIKE '%ADMINISTRATIVAS%'
    )
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%';
  
  v_ebitda := v_margem_contribuicao - v_despesas_fixas;
  
  -- 6. IMPOSTOS
  WITH tax_expenses AS (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_impostos, v_impostos_por_categoria
  FROM tax_expenses cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%imposto%'
      OR c.name ILIKE '%tributo%'
      OR parent_cat.name ILIKE '%imposto%'
      OR parent_cat.name ILIKE '%tributo%'
    );
  
  v_ebit := v_ebitda - v_impostos;
  
  -- 7. RESULTADO FINANCEIRO
  WITH financial_expenses AS (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  )
  SELECT 
    COALESCE(SUM(cat_total.total), 0)
  INTO v_despesas_financeiras
  FROM financial_expenses cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%financeir%'
      OR c.name ILIKE '%jur%'
      OR parent_cat.name ILIKE '%financeir%'
    );
  
  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;
  v_lucro_liquido := v_ebit + v_resultado_financeiro;
  
  -- 8. PERCENTUAIS
  IF v_receita_bruta > 0 THEN
    v_margem_liquida_perc := (v_lucro_liquido / v_receita_bruta) * 100;
    v_margem_contribuicao_perc := (v_margem_contribuicao / v_receita_bruta) * 100;
    v_margem_ebitda_perc := (v_ebitda / v_receita_bruta) * 100;
    v_margem_ebit_perc := (v_ebit / v_receita_bruta) * 100;
  END IF;
  
  -- 9. RETORNO JSON
  RETURN jsonb_build_object(
    'periodo', jsonb_build_object(
      'inicio', p_start_date,
      'fim', p_end_date,
      'dias', p_end_date - p_start_date + 1
    ),
    'receita_bruta', jsonb_build_object(
      'total', v_receita_bruta,
      'categorias', v_receita_por_categoria
    ),
    'deducoes', jsonb_build_object(
      'taxas_cartao', v_taxas_cartao,
      'deducoes_manuais', v_deducoes,
      'total', v_taxas_cartao + v_deducoes,
      'detalhamento_taxas', v_taxas_por_forma_pagamento,
      'categorias_deducoes', v_deducoes_por_categoria
    ),
    'receita_liquida', v_receita_liquida,
    'custos_operacionais', jsonb_build_object(
      'total', v_custos_operacionais,
      'categorias', v_custos_por_categoria
    ),
    'margem_contribuicao', v_margem_contribuicao,
    'despesas_administrativas', jsonb_build_object(
      'total', v_despesas_fixas,
      'categorias', v_despesas_por_categoria
    ),
    'ebitda', v_ebitda,
    'impostos', jsonb_build_object(
      'total', v_impostos,
      'categorias', v_impostos_por_categoria
    ),
    'ebit', v_ebit,
    'resultado_financeiro', jsonb_build_object(
      'receitas', v_receitas_financeiras,
      'despesas', v_despesas_financeiras,
      'total', v_resultado_financeiro
    ),
    'lucro_liquido', v_lucro_liquido,
    'indicadores', jsonb_build_object(
      'margem_liquida_percentual', v_margem_liquida_perc,
      'margem_contribuicao_percentual', v_margem_contribuicao_perc,
      'margem_ebitda_percentual', v_margem_ebitda_perc,
      'margem_ebit_percentual', v_margem_ebit_perc
    ),
    'metadata', jsonb_build_object(
      'calculation_timestamp', NOW(),
      'regime', 'competencia',
      'versao', '3.0.2-TAXAS-AUTOMATICAS'
    )
  );

END;
$$;

COMMENT ON FUNCTION public.fn_calculate_dre_dynamic IS 
'Calcula DRE com regime de competência e TAXAS DE CARTÃO AUTOMÁTICAS. 
Versão 3.0.2 - Deduz automaticamente as taxas das formas de pagamento da receita bruta.';

GRANT EXECUTE ON FUNCTION public.fn_calculate_dre_dynamic TO authenticated;
