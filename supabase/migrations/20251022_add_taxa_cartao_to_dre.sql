-- =====================================================
-- Migration: Adicionar Taxa de Cartão ao DRE
-- Description: Calcula automaticamente a dedução de taxa de cartão
--              baseada nos métodos de pagamento das receitas
-- Author: Barber Analytics Pro Team
-- Date: 2025-10-22
-- Version: 3.1.0 - Taxa de Cartão Automática
-- =====================================================

-- Drop existing function to recreate with taxa de cartão
DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);

-- =====================================================
-- DRE Calculation Function - Com Taxa de Cartão
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_calculate_dre_dynamic(
  p_unit_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  
  -- RECEITAS
  v_receita_bruta NUMERIC := 0;
  v_receitas_por_categoria JSONB := '[]'::jsonb;
  
  -- ✅ NOVA: TAXA DE CARTÃO
  v_taxa_cartao NUMERIC := 0;
  v_taxa_cartao_detalhada JSONB := '[]'::jsonb;
  
  -- DEDUÇÕES (outras deduções além de taxa)
  v_deducoes NUMERIC := 0;
  v_deducoes_por_categoria JSONB := '[]'::jsonb;
  v_receita_liquida NUMERIC := 0;
  
  -- CUSTOS OPERACIONAIS (Custos Variáveis)
  v_custos_operacionais NUMERIC := 0;
  v_custos_por_categoria JSONB := '[]'::jsonb;
  v_margem_contribuicao NUMERIC := 0;
  
  -- DESPESAS FIXAS
  v_despesas_fixas NUMERIC := 0;
  v_despesas_por_categoria JSONB := '[]'::jsonb;
  v_ebitda NUMERIC := 0;
  
  -- IMPOSTOS
  v_impostos NUMERIC := 0;
  v_impostos_por_categoria JSONB := '[]'::jsonb;
  v_ebit NUMERIC := 0;
  
  -- RESULTADO FINANCEIRO
  v_receitas_financeiras NUMERIC := 0;
  v_despesas_financeiras NUMERIC := 0;
  v_resultado_financeiro NUMERIC := 0;
  
  -- LUCRO LÍQUIDO
  v_lucro_liquido NUMERIC := 0;
  
  -- PERCENTUAIS
  v_margem_liquida NUMERIC := 0;
  v_margem_contribuicao_pct NUMERIC := 0;
  v_ebitda_margin NUMERIC := 0;
BEGIN
  -- ==========================================
  -- VALIDAÇÕES
  -- ==========================================
  
  IF p_unit_id IS NULL THEN
    RAISE EXCEPTION 'Unit ID não pode ser nulo';
  END IF;
  
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Datas de início e fim não podem ser nulas';
  END IF;
  
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Data de início não pode ser maior que data final';
  END IF;
  
  -- ==========================================
  -- 1. RECEITAS BRUTAS (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0),
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
  INTO v_receita_bruta, v_receitas_por_categoria
  FROM (
    SELECT 
      r.category_id,
      SUM(COALESCE(r.net_amount, r.value)) as total
    FROM revenues r
    WHERE r.unit_id = p_unit_id
      AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
      AND r.is_active = true
      AND r.category_id IS NOT NULL
    GROUP BY r.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Revenue'
    AND c.name NOT ILIKE '%dedu%'
    AND c.name NOT ILIKE '%desconto%'
    AND c.name NOT ILIKE '%financeir%'
    AND c.name NOT ILIKE '%juros%'
    AND c.name NOT ILIKE '%rendiment%';
  
  -- ==========================================
  -- ✅ 2. TAXA DE CARTÃO (NOVO CÁLCULO AUTOMÁTICO)
  -- ==========================================
  
  -- Calcula a taxa de cartão baseada nos métodos de pagamento usados
  -- Fórmula: valor_receita * (taxa_desconto / 100)
  SELECT 
    COALESCE(SUM(
      COALESCE(r.net_amount, r.value) * (COALESCE(pm.taxa_desconto, 0) / 100.0)
    ), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'metodo_id', pm.id,
          'metodo_nome', pm.name,
          'taxa_percent', COALESCE(pm.taxa_desconto, 0),
          'valor_total_recebido', COALESCE(pm_total.total_recebido, 0),
          'taxa_cobrada', COALESCE(pm_total.taxa_total, 0)
        )
        ORDER BY COALESCE(pm_total.taxa_total, 0) DESC
      ) FILTER (WHERE pm.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_taxa_cartao, v_taxa_cartao_detalhada
  FROM (
    SELECT 
      r.payment_method_id,
      SUM(COALESCE(r.net_amount, r.value)) as total_recebido,
      SUM(COALESCE(r.net_amount, r.value) * (COALESCE(pm.taxa_desconto, 0) / 100.0)) as taxa_total
    FROM revenues r
    LEFT JOIN payment_methods pm ON r.payment_method_id = pm.id
    WHERE r.unit_id = p_unit_id
      AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
      AND r.is_active = true
      AND r.payment_method_id IS NOT NULL
      AND pm.taxa_desconto > 0  -- Apenas métodos com taxa
    GROUP BY r.payment_method_id
  ) pm_total
  LEFT JOIN payment_methods pm ON pm_total.payment_method_id = pm.id;
  
  -- ==========================================
  -- 3. OUTRAS DEDUÇÕES DA RECEITA
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(e.value), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_deducoes, v_deducoes_por_categoria
  FROM (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%dedu%' 
      OR c.name ILIKE '%desconto%'
      OR c.name ILIKE '%devolu%'
      OR parent_cat.name ILIKE '%dedu%'
    );
  
  -- ✅ Receita Líquida = Receita Bruta - Taxa de Cartão - Outras Deduções
  v_receita_liquida := v_receita_bruta - v_taxa_cartao - v_deducoes;
  
  -- ==========================================
  -- 4. CUSTOS OPERACIONAIS - Variáveis
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(e.value), 0),
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
  FROM (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND c.dre_classification = 'custos_operacionais';
  
  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;
  
  -- ==========================================
  -- 5. DESPESAS FIXAS
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(e.value), 0),
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
  FROM (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND c.dre_classification = 'despesas_fixas';
  
  v_ebitda := v_margem_contribuicao - v_despesas_fixas;
  
  -- ==========================================
  -- 6. IMPOSTOS
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(e.value), 0),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'categoria_id', c.id,
          'categoria_nome', c.name,
          'valor', COALESCE(cat_total.total, 0)
        )
        ORDER BY COALESCE(cat_total.total, 0) DESC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_impostos, v_impostos_por_categoria
  FROM (
    SELECT 
      e.category_id,
      SUM(e.value) as total
    FROM expenses e
    WHERE e.unit_id = p_unit_id
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  WHERE c.category_type = 'Expense'
    AND c.dre_classification = 'impostos';
  
  v_ebit := v_ebitda - v_impostos;
  
  -- ==========================================
  -- 7. RESULTADO FINANCEIRO
  -- ==========================================
  
  SELECT 
    COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
  INTO v_receitas_financeiras
  FROM revenues r
  INNER JOIN categories c ON r.category_id = c.id
  WHERE r.unit_id = p_unit_id
    AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
    AND r.is_active = true
    AND (
      c.name ILIKE '%financeir%' 
      OR c.name ILIKE '%juros%'
      OR c.name ILIKE '%rendiment%'
    );
  
  SELECT 
    COALESCE(SUM(e.value), 0)
  INTO v_despesas_financeiras
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND (
      c.name ILIKE '%financeir%' 
      OR c.name ILIKE '%juros%'
    );
  
  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;
  
  -- ==========================================
  -- 8. LUCRO LÍQUIDO
  -- ==========================================
  
  v_lucro_liquido := v_ebit + v_resultado_financeiro;
  
  -- ==========================================
  -- 9. CÁLCULO DE PERCENTUAIS
  -- ==========================================
  
  IF v_receita_bruta > 0 THEN
    v_margem_liquida := (v_lucro_liquido / v_receita_bruta) * 100;
    v_margem_contribuicao_pct := (v_margem_contribuicao / v_receita_bruta) * 100;
    v_ebitda_margin := (v_ebitda / v_receita_bruta) * 100;
  ELSE
    v_margem_liquida := 0;
    v_margem_contribuicao_pct := 0;
    v_ebitda_margin := 0;
  END IF;
  
  -- ==========================================
  -- 10. CONSTRUIR RESULTADO JSON
  -- ==========================================
  
  v_result := json_build_object(
    'sucesso', true,
    'periodo', json_build_object(
      'inicio', p_start_date,
      'fim', p_end_date,
      'descricao', TO_CHAR(p_start_date, 'TMMonth YYYY')
    ),
    'receita_bruta', v_receita_bruta,
    'receitas_detalhadas', v_receitas_por_categoria,
    'taxa_cartao', v_taxa_cartao,
    'taxa_cartao_detalhada', v_taxa_cartao_detalhada,
    'deducoes', v_deducoes,
    'deducoes_detalhadas', v_deducoes_por_categoria,
    'receita_liquida', v_receita_liquida,
    'custos_operacionais', v_custos_operacionais,
    'custos_detalhados', v_custos_por_categoria,
    'margem_contribuicao', v_margem_contribuicao,
    'despesas_fixas', v_despesas_fixas,
    'despesas_detalhadas', v_despesas_por_categoria,
    'ebitda', v_ebitda,
    'impostos', v_impostos,
    'impostos_detalhadas', v_impostos_por_categoria,
    'ebit', v_ebit,
    'receitas_financeiras', v_receitas_financeiras,
    'despesas_financeiras', v_despesas_financeiras,
    'resultado_financeiro', v_resultado_financeiro,
    'lucro_liquido', v_lucro_liquido,
    'percentuais', json_build_object(
      'margem_liquida', v_margem_liquida,
      'margem_contribuicao', v_margem_contribuicao_pct,
      'ebitda_margin', v_ebitda_margin,
      'receita_bruta', 100.00,
      'taxa_cartao', CASE WHEN v_receita_bruta > 0 THEN (v_taxa_cartao / v_receita_bruta) * 100 ELSE 0 END,
      'deducoes', CASE WHEN v_receita_bruta > 0 THEN (v_deducoes / v_receita_bruta) * 100 ELSE 0 END,
      'receita_liquida', CASE WHEN v_receita_bruta > 0 THEN (v_receita_liquida / v_receita_bruta) * 100 ELSE 0 END,
      'custos_operacionais', CASE WHEN v_receita_bruta > 0 THEN (v_custos_operacionais / v_receita_bruta) * 100 ELSE 0 END,
      'despesas_fixas', CASE WHEN v_receita_bruta > 0 THEN (v_despesas_fixas / v_receita_bruta) * 100 ELSE 0 END,
      'impostos', CASE WHEN v_receita_bruta > 0 THEN (v_impostos / v_receita_bruta) * 100 ELSE 0 END
    ),
    'metadata', json_build_object(
      'calculation_timestamp', NOW(),
      'versao', '3.1.0',
      'regime', 'Regime de Competência',
      'unit_id', p_unit_id
    )
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'sucesso', false,
      'erro', SQLERRM,
      'detalhes', SQLSTATE
    );
END;
$$;

-- Comentários na função
COMMENT ON FUNCTION public.fn_calculate_dre_dynamic IS 
'Calcula o DRE (Demonstração do Resultado do Exercício) com regime de competência e taxa de cartão automática.
Versão 3.1.0 - Adiciona cálculo automático de taxa de cartão baseado nos métodos de pagamento.
A taxa é calculada como: valor_receita * (taxa_desconto_metodo / 100)';
