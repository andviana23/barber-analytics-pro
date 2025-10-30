-- =====================================================
-- Migration: Fix DRE Category Mapping
-- Description: Ajusta o DRE para aceitar tanto categorias novas quanto antigas
-- Author: Barber Analytics Pro Team
-- Date: 2025-10-30
-- Version: 3.0.1 - Fix Category Mapping
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);

-- =====================================================
-- DRE Calculation Function - Regime de Competência
-- AJUSTADO PARA ACEITAR MÚLTIPLAS NOMENCLATURAS
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
  
  -- DEDUÇÕES
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
  -- 2. DEDUÇÕES DA RECEITA
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
  
  v_receita_liquida := v_receita_bruta - v_deducoes;
  
  -- ==========================================
  -- 3. CUSTOS OPERACIONAIS (REGIME DE COMPETÊNCIA)
  -- ✅ AJUSTADO: Aceita OPERACIONAIS ou Despesas Operacionais
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
    AND (
      -- ✅ Aceita tanto "OPERACIONAIS" quanto "Despesas Operacionais"
      parent_cat.name ILIKE '%OPERACIONAIS%'
      OR parent_cat.name ILIKE 'Despesas Operacionais'
      OR c.name ILIKE '%OPERACIONAIS%'
    )
    AND c.name NOT ILIKE '%dedu%'
    AND c.name NOT ILIKE '%desconto%'
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%';
  
  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;
  
  -- ==========================================
  -- 4. DESPESAS ADMINISTRATIVAS (FIXAS)
  -- ✅ AJUSTADO: Aceita ADMINISTRATIVAS ou Despesas Fixas
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
    AND (
      -- ✅ Aceita tanto "ADMINISTRATIVAS" quanto "Despesas Fixas"
      parent_cat.name ILIKE '%ADMINISTRATIVAS%'
      OR parent_cat.name ILIKE 'Despesas Fixas'
      OR c.name ILIKE '%ADMINISTRATIVAS%'
    )
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%'
    AND parent_cat.name NOT ILIKE '%imposto%'
    AND parent_cat.name NOT ILIKE '%tributo%';
  
  v_ebitda := v_margem_contribuicao - v_despesas_fixas;
  
  -- ==========================================
  -- 5. IMPOSTOS E TRIBUTOS
  -- ✅ AJUSTADO: Aceita ambas nomenclaturas
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
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%IMPOSTO%'
      OR c.name ILIKE '%tributo%'
      OR c.name ILIKE '%simples%'
      OR c.name ILIKE '%fisco%'
      OR parent_cat.name ILIKE '%IMPOSTO%'
      OR parent_cat.name ILIKE '%tributo%'
      OR parent_cat.name ILIKE 'Impostos (Tributos)'
    );
  
  v_ebit := v_ebitda - v_impostos;
  
  -- ==========================================
  -- 6. RESULTADO FINANCEIRO
  -- ==========================================
  
  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
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
  
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_despesas_financeiras
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE e.unit_id = p_unit_id
    AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND (
      c.name ILIKE '%financeir%'
      OR c.name ILIKE '%juros%'
      OR parent_cat.name ILIKE '%financeir%'
      OR parent_cat.name ILIKE 'Despesas Financeiras'
    );
  
  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;
  v_lucro_liquido := v_ebit + v_resultado_financeiro;
  
  -- ==========================================
  -- CÁLCULO DE PERCENTUAIS
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
  -- CONSTRUÇÃO DO RESULTADO JSON
  -- ==========================================
  
  v_result := json_build_object(
    'periodo', json_build_object(
      'inicio', p_start_date,
      'fim', p_end_date,
      'dias', (p_end_date - p_start_date) + 1
    ),
    'receita_bruta', json_build_object(
      'receita_servico', json_build_object(
        'total', v_receita_bruta,
        'assinatura', 0,
        'avulso', v_receita_bruta
      ),
      'receita_produtos', json_build_object(
        'total', 0,
        'cosmeticos', 0
      ),
      'total', v_receita_bruta,
      'categorias', v_receitas_por_categoria
    ),
    'deducoes', json_build_object(
      'total', v_deducoes,
      'categorias', v_deducoes_por_categoria
    ),
    'receita_liquida', v_receita_liquida,
    'custos_operacionais', json_build_object(
      'bebidas_cortesias', 0,
      'bonificacoes_metas', 0,
      'comissoes', 0,
      'limpeza_lavanderia', 0,
      'produtos_uso_interno', 0,
      'total', v_custos_operacionais,
      'categorias', v_custos_por_categoria
    ),
    'margem_contribuicao', v_margem_contribuicao,
    'despesas_administrativas', json_build_object(
      'aluguel_condominio', 0,
      'contabilidade', 0,
      'contas_fixas', 0,
      'encargos_beneficios', 0,
      'manutencao_seguros', 0,
      'marketing_comercial', 0,
      'salarios_prolabore', 0,
      'sistemas', 0,
      'total', v_despesas_fixas,
      'categorias', v_despesas_por_categoria
    ),
    'ebitda', v_ebitda,
    'impostos', json_build_object(
      'simples_nacional', v_impostos,
      'total', v_impostos,
      'categorias', v_impostos_por_categoria
    ),
    'ebit', v_ebit,
    'resultado_financeiro', json_build_object(
      'receitas', v_receitas_financeiras,
      'despesas', v_despesas_financeiras,
      'total', v_resultado_financeiro
    ),
    'lucro_liquido', v_lucro_liquido,
    'indicadores', json_build_object(
      'margem_liquida_percentual', v_margem_liquida,
      'margem_contribuicao_percentual', v_margem_contribuicao_pct,
      'margem_ebitda_percentual', v_ebitda_margin,
      'margem_ebit_percentual', (CASE WHEN v_receita_bruta > 0 THEN (v_ebit / v_receita_bruta) * 100 ELSE 0 END)
    ),
    'metadata', json_build_object(
      'calculation_timestamp', NOW(),
      'regime', 'competencia',
      'versao', '3.0.1'
    )
  );
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.fn_calculate_dre_dynamic TO authenticated;

COMMENT ON FUNCTION public.fn_calculate_dre_dynamic IS 'Calcula DRE em regime de competência - v3.0.1 - Aceita múltiplas nomenclaturas de categorias';
