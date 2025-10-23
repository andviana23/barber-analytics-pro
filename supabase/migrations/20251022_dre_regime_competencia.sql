-- =====================================================
-- Migration: DRE - Regime de Competência
-- Description: Modifica o cálculo do DRE para usar data de competência 
--              (com fallback para data de pagamento/recebimento)
-- Author: Barber Analytics Pro Team
-- Date: 2025-10-22
-- Version: 3.0.0 - Regime de Competência
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);

-- =====================================================
-- DRE Calculation Function - Regime de Competência
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
  
  -- Buscar todas as categorias de receita e seus totais
  -- REGRA: Usa data_competencia, se não existir usa date (data de recebimento)
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
      -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
      AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
      AND r.is_active = true
      AND r.category_id IS NOT NULL
    GROUP BY r.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Revenue'
    AND c.name NOT ILIKE '%dedu%'  -- Excluir categorias de dedução
    AND c.name NOT ILIKE '%desconto%'
    AND c.name NOT ILIKE '%financeir%'  -- Excluir receitas financeiras
    AND c.name NOT ILIKE '%juros%'
    AND c.name NOT ILIKE '%rendiment%';
  
  -- ==========================================
  -- 2. DEDUÇÕES DA RECEITA (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  -- Buscar deduções (descontos, devoluções, etc.)
  -- REGRA: Usa data_competencia, se não existir usa date
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
      -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
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
  
  -- Receita Líquida = Receita Bruta - Deduções
  v_receita_liquida := v_receita_bruta - v_deducoes;
  
  -- ==========================================
  -- 3. CUSTOS OPERACIONAIS - Variáveis (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  -- Custos relacionados diretamente à produção/serviço
  -- REGRA: Usa data_competencia, se não existir usa date
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
      -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND c.name ILIKE '%OPERACIONAIS%'
    AND c.name NOT ILIKE '%dedu%'
    AND c.name NOT ILIKE '%desconto%'
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%';
  
  -- Margem de Contribuição
  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;
  
  -- ==========================================
  -- 4. DESPESAS FIXAS ADMINISTRATIVAS (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  -- Despesas fixas administrativas
  -- REGRA: Usa data_competencia, se não existir usa date
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
      -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id
  WHERE c.category_type = 'Expense'
    AND c.name ILIKE '%ADMINISTRATIVAS%'
    AND c.name NOT ILIKE '%imposto%'
    AND c.name NOT ILIKE '%tributo%';
  
  -- EBITDA
  v_ebitda := v_margem_contribuicao - v_despesas_fixas;
  
  -- ==========================================
  -- 5. IMPOSTOS E TRIBUTOS (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  -- REGRA: Usa data_competencia, se não existir usa date
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
      -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
      AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
      AND e.is_active = true
      AND e.category_id IS NOT NULL
    GROUP BY e.category_id
  ) cat_total
  INNER JOIN categories c ON cat_total.category_id = c.id
  WHERE c.category_type = 'Expense'
    AND (
      c.name ILIKE '%IMPOSTO%'
      OR c.name ILIKE '%tributo%'
      OR c.name ILIKE '%simples%'
      OR c.name ILIKE '%fisco%'
    );
  
  -- EBIT (Earnings Before Interest and Taxes)
  v_ebit := v_ebitda - v_impostos;
  
  -- ==========================================
  -- 6. RESULTADO FINANCEIRO (REGIME DE COMPETÊNCIA)
  -- ==========================================
  
  -- Receitas Financeiras (juros recebidos, rendimentos, etc.)
  -- REGRA: Usa data_competencia, se não existir usa date
  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
  INTO v_receitas_financeiras
  FROM revenues r
  INNER JOIN categories c ON r.category_id = c.id
  WHERE r.unit_id = p_unit_id
    -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
    AND COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
    AND r.is_active = true
    AND (
      c.name ILIKE '%financeir%'
      OR c.name ILIKE '%juros%'
      OR c.name ILIKE '%rendiment%'
    );
  
  -- Despesas Financeiras (juros pagos, tarifas bancárias, etc.)
  -- REGRA: Usa data_competencia, se não existir usa date
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_despesas_financeiras
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    -- ✅ COMPETÊNCIA: usa data_competencia se existir, senão usa date
    AND COALESCE(e.data_competencia, e.date) BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND (
      c.name ILIKE '%financeir%'
      OR c.name ILIKE '%juros%'
      OR c.name ILIKE '%tarifa%'
      OR c.name ILIKE '%banco%'
    );
  
  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;
  
  -- ==========================================
  -- 7. LUCRO LÍQUIDO
  -- ==========================================
  
  v_lucro_liquido := v_ebit + v_resultado_financeiro;
  
  -- ==========================================
  -- 8. CALCULAR PERCENTUAIS
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
  -- 9. MONTAR RESULTADO FINAL (JSON)
  -- ==========================================
  
  v_result := json_build_object(
    'periodo', json_build_object(
      'inicio', p_start_date,
      'fim', p_end_date,
      'dias', (p_end_date - p_start_date) + 1
    ),
    'receita_bruta', json_build_object(
      'total', v_receita_bruta,
      'por_categoria', v_receitas_por_categoria,
      'receita_servico', json_build_object(
        'total', COALESCE((
          SELECT SUM(COALESCE(net_amount, value))
          FROM revenues
          WHERE unit_id = p_unit_id
            AND COALESCE(data_competencia, date) BETWEEN p_start_date AND p_end_date
            AND is_active = true
            AND category_id IN (
              SELECT id FROM categories 
              WHERE category_type = 'Revenue' 
                AND (name ILIKE '%servi%' OR name ILIKE '%assinatura%' OR name ILIKE '%avulso%')
            )
        ), 0)
      ),
      'receita_produtos', json_build_object(
        'total', COALESCE((
          SELECT SUM(COALESCE(net_amount, value))
          FROM revenues
          WHERE unit_id = p_unit_id
            AND COALESCE(data_competencia, date) BETWEEN p_start_date AND p_end_date
            AND is_active = true
            AND category_id IN (
              SELECT id FROM categories 
              WHERE category_type = 'Revenue' 
                AND (name ILIKE '%produto%' OR name ILIKE '%cosm%')
            )
        ), 0)
      )
    ),
    'deducoes', json_build_object(
      'total', v_deducoes,
      'por_categoria', v_deducoes_por_categoria
    ),
    'receita_liquida', v_receita_liquida,
    'custos_operacionais', json_build_object(
      'total', v_custos_operacionais,
      'por_categoria', v_custos_por_categoria
    ),
    'margem_contribuicao', v_margem_contribuicao,
    'despesas_fixas', json_build_object(
      'total', v_despesas_fixas,
      'por_categoria', v_despesas_por_categoria
    ),
    'ebitda', v_ebitda,
    'impostos', json_build_object(
      'total', v_impostos,
      'por_categoria', v_impostos_por_categoria
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
      'margem_ebitda_percentual', v_ebitda_margin
    ),
    'metadata', json_build_object(
      'calculation_timestamp', NOW(),
      'unit_id', p_unit_id,
      'regime', 'COMPETÊNCIA',
      'versao', '3.0.0'
    )
  );
  
  RETURN v_result;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.fn_calculate_dre_dynamic(uuid, date, date) IS 
'Calcula o DRE (Demonstração do Resultado do Exercício) usando REGIME DE COMPETÊNCIA.
Usa data_competencia quando disponível, com fallback para data de pagamento/recebimento.
Retorna JSON completo com todas as seções do DRE.';
