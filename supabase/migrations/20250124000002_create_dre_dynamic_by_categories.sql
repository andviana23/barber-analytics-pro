-- =====================================================-- =====================================================

-- Migration: DRE Dinâmico Baseado em Categorias-- Migration: DRE Dinâmico Baseado em Categorias

-- Description: Calcula DRE utilizando as categorias financeiras cadastradas no sistema-- Description: Calcula DRE utilizando as categorias financeiras cadastradas no sistema

-- Author: Barber Analytics Pro Team-- Author: Barber Analytics Pro Team

-- Date: 2025-01-24-- Date: 2025-01-24

-- Version: 2.1.0 (Corrigida com CTEs)-- Version: 2.0.0

-- =====================================================-- =====================================================



-- Drop existing function-- Drop existing function

DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);DROP FUNCTION IF EXISTS public.fn_calculate_dre_dynamic(uuid, date, date);



-- =====================================================-- =====================================================

-- DRE Calculation Function - Dynamic by Categories (WITH CTEs)-- DRE Calculation Function - Dynamic by Categories

-- =====================================================-- =====================================================



CREATE OR REPLACE FUNCTION public.fn_calculate_dre_dynamic(CREATE OR REPLACE FUNCTION public.fn_calculate_dre_dynamic(

  p_unit_id uuid,  p_unit_id uuid,

  p_start_date date,  p_start_date date,

  p_end_date date  p_end_date date

))

RETURNS jsonRETURNS json

LANGUAGE plpgsqlLANGUAGE plpgsql

SECURITY DEFINERSECURITY DEFINER

AS $$AS $$

DECLAREDECLARE

  v_result JSON;  v_result JSON;

    

  -- RECEITAS  -- RECEITAS

  v_receita_bruta NUMERIC := 0;  v_receita_bruta NUMERIC := 0;

  v_receitas_por_categoria JSONB := '[]'::jsonb;  v_receitas_por_categoria JSONB := '[]'::jsonb;

    

  -- DEDUÇÕES  -- DEDUÇÕES

  v_deducoes NUMERIC := 0;  v_deducoes NUMERIC := 0;

  v_deducoes_por_categoria JSONB := '[]'::jsonb;  v_deducoes_por_categoria JSONB := '[]'::jsonb;

  v_receita_liquida NUMERIC := 0;  v_receita_liquida NUMERIC := 0;

    

  -- CUSTOS OPERACIONAIS (Custos Variáveis)  -- CUSTOS OPERACIONAIS (Custos Variáveis)

  v_custos_operacionais NUMERIC := 0;  v_custos_operacionais NUMERIC := 0;

  v_custos_por_categoria JSONB := '[]'::jsonb;  v_custos_por_categoria JSONB := '[]'::jsonb;

  v_margem_contribuicao NUMERIC := 0;  v_margem_contribuicao NUMERIC := 0;

    

  -- DESPESAS FIXAS  -- DESPESAS FIXAS

  v_despesas_fixas NUMERIC := 0;  v_despesas_fixas NUMERIC := 0;

  v_despesas_por_categoria JSONB := '[]'::jsonb;  v_despesas_por_categoria JSONB := '[]'::jsonb;

  v_ebitda NUMERIC := 0;  v_ebitda NUMERIC := 0;

    

  -- IMPOSTOS  -- IMPOSTOS

  v_impostos NUMERIC := 0;  v_impostos NUMERIC := 0;

  v_impostos_por_categoria JSONB := '[]'::jsonb;  v_impostos_por_categoria JSONB := '[]'::jsonb;

  v_ebit NUMERIC := 0;  v_ebit NUMERIC := 0;

    

  -- RESULTADO FINANCEIRO  -- RESULTADO FINANCEIRO

  v_receitas_financeiras NUMERIC := 0;  v_receitas_financeiras NUMERIC := 0;

  v_despesas_financeiras NUMERIC := 0;  v_despesas_financeiras NUMERIC := 0;

  v_resultado_financeiro NUMERIC := 0;  v_resultado_financeiro NUMERIC := 0;

    

  -- LUCRO LÍQUIDO  -- LUCRO LÍQUIDO

  v_lucro_liquido NUMERIC := 0;  v_lucro_liquido NUMERIC := 0;

    

  -- PERCENTUAIS  -- PERCENTUAIS

  v_margem_liquida NUMERIC := 0;  v_margem_liquida NUMERIC := 0;

  v_margem_contribuicao_pct NUMERIC := 0;  v_margem_contribuicao_pct NUMERIC := 0;

  v_ebitda_margin NUMERIC := 0;  v_ebitda_margin NUMERIC := 0;

BEGINBEGIN

  -- ==========================================  -- ==========================================

  -- VALIDAÇÕES  -- VALIDAÇÕES

  -- ==========================================  -- ==========================================

    

  IF p_unit_id IS NULL THEN  IF p_unit_id IS NULL THEN

    RAISE EXCEPTION 'Unit ID não pode ser nulo';    RAISE EXCEPTION 'Unit ID não pode ser nulo';

  END IF;  END IF;

    

  IF p_start_date IS NULL OR p_end_date IS NULL THEN  IF p_start_date IS NULL OR p_end_date IS NULL THEN

    RAISE EXCEPTION 'Datas de início e fim não podem ser nulas';    RAISE EXCEPTION 'Datas de início e fim não podem ser nulas';

  END IF;  END IF;

    

  IF p_start_date > p_end_date THEN  IF p_start_date > p_end_date THEN

    RAISE EXCEPTION 'Data de início não pode ser maior que data final';    RAISE EXCEPTION 'Data de início não pode ser maior que data final';

  END IF;  END IF;

    

  -- ==========================================  -- ==========================================

  -- 1. RECEITAS BRUTAS (usando CTEs)  -- 1. RECEITAS BRUTAS

  -- ==========================================  -- ==========================================

    

  WITH receitas_agrupadas AS (  -- Buscar todas as categorias de receita e seus totais

    SELECT   SELECT 

      category_id,    COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0),

      SUM(COALESCE(net_amount, value)) as total    COALESCE(

    FROM revenues      jsonb_agg(

    WHERE unit_id = p_unit_id        jsonb_build_object(

      AND date BETWEEN p_start_date AND p_end_date          'categoria_id', c.id,

      AND is_active = true          'categoria_nome', c.name,

      AND category_id IS NOT NULL          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),

    GROUP BY category_id          'valor', COALESCE(cat_total.total, 0)

  )        )

  SELECT         ORDER BY COALESCE(cat_total.total, 0) DESC

    COALESCE(SUM(ra.total), 0),      ) FILTER (WHERE c.id IS NOT NULL),

    COALESCE(      '[]'::jsonb

      jsonb_agg(    )

        jsonb_build_object(  INTO v_receita_bruta, v_receitas_por_categoria

          'categoria_id', c.id,  FROM (

          'categoria_nome', c.name,    SELECT 

          'categoria_pai', COALESCE(parent_cat.name, 'Sem Pai'),      r.category_id,

          'valor', COALESCE(ra.total, 0)      SUM(COALESCE(r.net_amount, r.value)) as total

        )    FROM revenues r

        ORDER BY COALESCE(ra.total, 0) DESC    WHERE r.unit_id = p_unit_id

      ) FILTER (WHERE c.id IS NOT NULL),      AND r.date BETWEEN p_start_date AND p_end_date

      '[]'::jsonb      AND r.is_active = true

    )      AND r.category_id IS NOT NULL

  INTO v_receita_bruta, v_receitas_por_categoria    GROUP BY r.category_id

  FROM receitas_agrupadas ra  ) cat_total

  INNER JOIN categories c ON ra.category_id = c.id  INNER JOIN categories c ON cat_total.category_id = c.id

  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id

  WHERE c.category_type = 'Revenue'  WHERE c.category_type = 'Revenue'

    AND c.name NOT ILIKE '%dedu%'    AND c.name NOT ILIKE '%dedu%'  -- Excluir categorias de dedução

    AND c.name NOT ILIKE '%desconto%'    AND c.name NOT ILIKE '%desconto%'

    AND c.name NOT ILIKE '%financeir%'    AND c.name NOT ILIKE '%financeir%'  -- Excluir receitas financeiras

    AND c.name NOT ILIKE '%juros%'    AND c.name NOT ILIKE '%juros%'

    AND c.name NOT ILIKE '%rendiment%';    AND c.name NOT ILIKE '%rendiment%';

    

  -- ==========================================  -- ==========================================

  -- 2. DEDUÇÕES DA RECEITA (usando CTEs)  -- 2. DEDUÇÕES DA RECEITA

  -- ==========================================  -- ==========================================

    

  WITH deducoes_agrupadas AS (  -- Buscar deduções (descontos, devoluções, etc.)

    SELECT   SELECT 

      category_id,    COALESCE(SUM(e.value), 0),

      SUM(value) as total    COALESCE(

    FROM expenses      jsonb_agg(

    WHERE unit_id = p_unit_id        jsonb_build_object(

      AND date BETWEEN p_start_date AND p_end_date          'categoria_id', c.id,

      AND is_active = true          'categoria_nome', c.name,

      AND category_id IS NOT NULL          'valor', COALESCE(cat_total.total, 0)

    GROUP BY category_id        )

  )        ORDER BY COALESCE(cat_total.total, 0) DESC

  SELECT       ) FILTER (WHERE c.id IS NOT NULL),

    COALESCE(SUM(da.total), 0),      '[]'::jsonb

    COALESCE(    )

      jsonb_agg(  INTO v_deducoes, v_deducoes_por_categoria

        jsonb_build_object(  FROM (

          'categoria_id', c.id,    SELECT 

          'categoria_nome', c.name,      e.category_id,

          'valor', COALESCE(da.total, 0)      SUM(e.value) as total

        )    FROM expenses e

        ORDER BY COALESCE(da.total, 0) DESC    WHERE e.unit_id = p_unit_id

      ) FILTER (WHERE c.id IS NOT NULL),      AND e.date BETWEEN p_start_date AND p_end_date

      '[]'::jsonb      AND e.is_active = true

    )      AND e.category_id IS NOT NULL

  INTO v_deducoes, v_deducoes_por_categoria    GROUP BY e.category_id

  FROM deducoes_agrupadas da  ) cat_total

  INNER JOIN categories c ON da.category_id = c.id  INNER JOIN categories c ON cat_total.category_id = c.id

  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id

  WHERE c.category_type = 'Expense'  WHERE c.category_type = 'Expense'

    AND (    AND (

      c.name ILIKE '%dedu%'       c.name ILIKE '%dedu%' 

      OR c.name ILIKE '%desconto%'      OR c.name ILIKE '%desconto%'

      OR c.name ILIKE '%devolu%'      OR c.name ILIKE '%devolu%'

      OR parent_cat.name ILIKE '%dedu%'      OR parent_cat.name ILIKE '%dedu%'

    );    );

    

  v_receita_liquida := v_receita_bruta - v_deducoes;  -- Receita Líquida = Receita Bruta - Deduções

    v_receita_liquida := v_receita_bruta - v_deducoes;

  -- ==========================================  

  -- 3. CUSTOS OPERACIONAIS (Variáveis)  -- ==========================================

  -- ==========================================  -- 3. CUSTOS OPERACIONAIS (Variáveis)

    -- ==========================================

  WITH custos_agrupados AS (  

    SELECT   -- Custos relacionados diretamente à produção/serviço

      category_id,  SELECT 

      SUM(value) as total    COALESCE(SUM(e.value), 0),

    FROM expenses    COALESCE(

    WHERE unit_id = p_unit_id      jsonb_agg(

      AND date BETWEEN p_start_date AND p_end_date        jsonb_build_object(

      AND is_active = true          'categoria_id', c.id,

      AND category_id IS NOT NULL          'categoria_nome', c.name,

    GROUP BY category_id          'categoria_pai', COALESCE(parent_cat.name, 'OPERACIONAIS'),

  )          'valor', COALESCE(cat_total.total, 0)

  SELECT         )

    COALESCE(SUM(ca.total), 0),        ORDER BY COALESCE(cat_total.total, 0) DESC

    COALESCE(      ) FILTER (WHERE c.id IS NOT NULL),

      jsonb_agg(      '[]'::jsonb

        jsonb_build_object(    )

          'categoria_id', c.id,  INTO v_custos_operacionais, v_custos_por_categoria

          'categoria_nome', c.name,  FROM (

          'categoria_pai', COALESCE(parent_cat.name, 'OPERACIONAIS'),    SELECT 

          'valor', COALESCE(ca.total, 0)      e.category_id,

        )      SUM(e.value) as total

        ORDER BY COALESCE(ca.total, 0) DESC    FROM expenses e

      ) FILTER (WHERE c.id IS NOT NULL),    WHERE e.unit_id = p_unit_id

      '[]'::jsonb      AND e.date BETWEEN p_start_date AND p_end_date

    )      AND e.is_active = true

  INTO v_custos_operacionais, v_custos_por_categoria      AND e.category_id IS NOT NULL

  FROM custos_agrupados ca    GROUP BY e.category_id

  INNER JOIN categories c ON ca.category_id = c.id  ) cat_total

  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id  INNER JOIN categories c ON cat_total.category_id = c.id

  WHERE c.category_type = 'Expense'  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id

    AND parent_cat.name = 'OPERACIONAIS';  WHERE c.category_type = 'Expense'

      AND parent_cat.name = 'OPERACIONAIS'

  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;    AND c.name NOT ILIKE '%dedu%'

      AND c.name NOT ILIKE '%desconto%';

  -- ==========================================  

  -- 4. DESPESAS FIXAS (Administrativas)  -- Margem de Contribuição = Receita Líquida - Custos Operacionais

  -- ==========================================  v_margem_contribuicao := v_receita_liquida - v_custos_operacionais;

    

  WITH despesas_agrupadas AS (  -- ==========================================

    SELECT   -- 4. DESPESAS FIXAS (Administrativas)

      category_id,  -- ==========================================

      SUM(value) as total  

    FROM expenses  -- Despesas fixas administrativas

    WHERE unit_id = p_unit_id  SELECT 

      AND date BETWEEN p_start_date AND p_end_date    COALESCE(SUM(e.value), 0),

      AND is_active = true    COALESCE(

      AND category_id IS NOT NULL      jsonb_agg(

    GROUP BY category_id        jsonb_build_object(

  )          'categoria_id', c.id,

  SELECT           'categoria_nome', c.name,

    COALESCE(SUM(da.total), 0),          'categoria_pai', COALESCE(parent_cat.name, 'ADMINISTRATIVAS'),

    COALESCE(          'valor', COALESCE(cat_total.total, 0)

      jsonb_agg(        )

        jsonb_build_object(        ORDER BY COALESCE(cat_total.total, 0) DESC

          'categoria_id', c.id,      ) FILTER (WHERE c.id IS NOT NULL),

          'categoria_nome', c.name,      '[]'::jsonb

          'categoria_pai', COALESCE(parent_cat.name, 'ADMINISTRATIVAS'),    )

          'valor', COALESCE(da.total, 0)  INTO v_despesas_fixas, v_despesas_por_categoria

        )  FROM (

        ORDER BY COALESCE(da.total, 0) DESC    SELECT 

      ) FILTER (WHERE c.id IS NOT NULL),      e.category_id,

      '[]'::jsonb      SUM(e.value) as total

    )    FROM expenses e

  INTO v_despesas_fixas, v_despesas_por_categoria    WHERE e.unit_id = p_unit_id

  FROM despesas_agrupadas da      AND e.date BETWEEN p_start_date AND p_end_date

  INNER JOIN categories c ON da.category_id = c.id      AND e.is_active = true

  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id      AND e.category_id IS NOT NULL

  WHERE c.category_type = 'Expense'    GROUP BY e.category_id

    AND parent_cat.name = 'ADMINISTRATIVAS';  ) cat_total

    INNER JOIN categories c ON cat_total.category_id = c.id

  v_ebitda := v_margem_contribuicao - v_despesas_fixas;  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id

    WHERE c.category_type = 'Expense'

  -- ==========================================    AND parent_cat.name = 'ADMINISTRATIVAS'

  -- 5. IMPOSTOS E TRIBUTOS    AND c.name NOT ILIKE '%impost%'

  -- ==========================================    AND c.name NOT ILIKE '%tribut%';

    

  WITH impostos_agrupados AS (  -- EBITDA = Margem de Contribuição - Despesas Fixas

    SELECT   v_ebitda := v_margem_contribuicao - v_despesas_fixas;

      category_id,  

      SUM(value) as total  -- ==========================================

    FROM expenses  -- 5. IMPOSTOS E TRIBUTOS

    WHERE unit_id = p_unit_id  -- ==========================================

      AND date BETWEEN p_start_date AND p_end_date  

      AND is_active = true  -- Impostos e tributos

      AND category_id IS NOT NULL  SELECT 

    GROUP BY category_id    COALESCE(SUM(e.value), 0),

  )    COALESCE(

  SELECT       jsonb_agg(

    COALESCE(SUM(ia.total), 0),        jsonb_build_object(

    COALESCE(          'categoria_id', c.id,

      jsonb_agg(          'categoria_nome', c.name,

        jsonb_build_object(          'categoria_pai', COALESCE(parent_cat.name, 'IMPOSTO'),

          'categoria_id', c.id,          'valor', COALESCE(cat_total.total, 0)

          'categoria_nome', c.name,        )

          'categoria_pai', COALESCE(parent_cat.name, 'IMPOSTO'),        ORDER BY COALESCE(cat_total.total, 0) DESC

          'valor', COALESCE(ia.total, 0)      ) FILTER (WHERE c.id IS NOT NULL),

        )      '[]'::jsonb

        ORDER BY COALESCE(ia.total, 0) DESC    )

      ) FILTER (WHERE c.id IS NOT NULL),  INTO v_impostos, v_impostos_por_categoria

      '[]'::jsonb  FROM (

    )    SELECT 

  INTO v_impostos, v_impostos_por_categoria      e.category_id,

  FROM impostos_agrupados ia      SUM(e.value) as total

  INNER JOIN categories c ON ia.category_id = c.id    FROM expenses e

  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id    WHERE e.unit_id = p_unit_id

  WHERE c.category_type = 'Expense'      AND e.date BETWEEN p_start_date AND p_end_date

    AND (      AND e.is_active = true

      parent_cat.name = 'IMPOSTO'      AND e.category_id IS NOT NULL

      OR c.name ILIKE '%impost%'    GROUP BY e.category_id

      OR c.name ILIKE '%tribut%'  ) cat_total

      OR c.name ILIKE '%simples%'  INNER JOIN categories c ON cat_total.category_id = c.id

    );  LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id

    WHERE c.category_type = 'Expense'

  v_ebit := v_ebitda - v_impostos;    AND (

        parent_cat.name = 'IMPOSTO'

  -- ==========================================      OR c.name ILIKE '%impost%'

  -- 6. RESULTADO FINANCEIRO      OR c.name ILIKE '%tribut%'

  -- ==========================================      OR c.name ILIKE '%simples%'

      );

  -- Receitas Financeiras (juros recebidos, rendimentos, etc.)  

  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)  -- EBIT = EBITDA - Impostos

  INTO v_receitas_financeiras  v_ebit := v_ebitda - v_impostos;

  FROM revenues r  

  INNER JOIN categories c ON r.category_id = c.id  -- ==========================================

  WHERE r.unit_id = p_unit_id  -- 6. RESULTADO FINANCEIRO (Opcional)

    AND r.date BETWEEN p_start_date AND p_end_date  -- ==========================================

    AND r.is_active = true  

    AND (  -- Receitas Financeiras (juros recebidos, rendimentos, etc.)

      c.name ILIKE '%financeir%'  SELECT COALESCE(SUM(COALESCE(rv.net_amount, rv.value)), 0)

      OR c.name ILIKE '%juros%'  INTO v_receitas_financeiras

      OR c.name ILIKE '%rendiment%'  FROM revenues rv

    );  INNER JOIN categories ct ON rv.category_id = ct.id

    WHERE rv.unit_id = p_unit_id

  -- Despesas Financeiras (juros pagos, taxas bancárias, etc.)    AND rv.date BETWEEN p_start_date AND p_end_date

  SELECT COALESCE(SUM(e.value), 0)    AND rv.is_active = true

  INTO v_despesas_financeiras    AND (ct.name ILIKE '%financeir%' OR ct.name ILIKE '%juros%' OR ct.name ILIKE '%rendiment%');

  FROM expenses e  

  INNER JOIN categories c ON e.category_id = c.id  -- Despesas Financeiras (juros pagos, taxas bancárias, etc.)

  WHERE e.unit_id = p_unit_id  SELECT COALESCE(SUM(ex.value), 0)

    AND e.date BETWEEN p_start_date AND p_end_date  INTO v_despesas_financeiras

    AND e.is_active = true  FROM expenses ex

    AND (  INNER JOIN categories ct ON ex.category_id = ct.id

      c.name ILIKE '%financeir%'  WHERE ex.unit_id = p_unit_id

      OR c.name ILIKE '%juros%'    AND ex.date BETWEEN p_start_date AND p_end_date

      OR c.name ILIKE '%taxa banc%'    AND ex.is_active = true

    );    AND (ct.name ILIKE '%financeir%' OR ct.name ILIKE '%juros%' OR ct.name ILIKE '%taxa banc%');

    

  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;  v_resultado_financeiro := v_receitas_financeiras - v_despesas_financeiras;

    

  -- ==========================================  -- ==========================================

  -- 7. LUCRO LÍQUIDO  -- 7. LUCRO LÍQUIDO

  -- ==========================================  -- ==========================================

    

  v_lucro_liquido := v_ebit + v_resultado_financeiro;  v_lucro_liquido := v_ebit + v_resultado_financeiro;

    

  -- ==========================================  -- ==========================================

  -- 8. CÁLCULO DE PERCENTUAIS  -- 8. CÁLCULO DE PERCENTUAIS

  -- ==========================================  -- ==========================================

    

  IF v_receita_bruta > 0 THEN  -- Evitar divisão por zero

    v_margem_liquida := (v_lucro_liquido / v_receita_bruta) * 100;  IF v_receita_bruta > 0 THEN

    v_margem_contribuicao_pct := (v_margem_contribuicao / v_receita_bruta) * 100;    v_margem_liquida := (v_lucro_liquido / v_receita_bruta) * 100;

    v_ebitda_margin := (v_ebitda / v_receita_bruta) * 100;    v_margem_contribuicao_pct := (v_margem_contribuicao / v_receita_bruta) * 100;

  END IF;    v_ebitda_margin := (v_ebitda / v_receita_bruta) * 100;

    END IF;

  -- ==========================================  

  -- 9. MONTAGEM DO RESULTADO FINAL  -- ==========================================

  -- ==========================================  -- 9. MONTAGEM DO RESULTADO FINAL

    -- ==========================================

  v_result := json_build_object(  

    'sucesso', true,  v_result := json_build_object(

    'periodo', json_build_object(    'sucesso', true,

      'inicio', p_start_date,    'periodo', json_build_object(

      'fim', p_end_date,      'inicio', p_start_date,

      'descricao', TO_CHAR(p_start_date, 'TMMonth/YYYY')      'fim', p_end_date,

    ),      'descricao', TO_CHAR(p_start_date, 'TMMonth/YYYY')

    'unit_id', p_unit_id,    ),

        'unit_id', p_unit_id,

    -- RECEITAS    

    'receita_bruta', v_receita_bruta,    -- RECEITAS

    'receitas_detalhadas', v_receitas_por_categoria,    'receita_bruta', v_receita_bruta,

        'receitas_detalhadas', v_receitas_por_categoria,

    -- DEDUÇÕES    

    'deducoes', v_deducoes,    -- DEDUÇÕES

    'deducoes_detalhadas', v_deducoes_por_categoria,    'deducoes', v_deducoes,

    'receita_liquida', v_receita_liquida,    'deducoes_detalhadas', v_deducoes_por_categoria,

        'receita_liquida', v_receita_liquida,

    -- CUSTOS OPERACIONAIS    

    'custos_operacionais', v_custos_operacionais,    -- CUSTOS OPERACIONAIS

    'custos_detalhados', v_custos_por_categoria,    'custos_operacionais', v_custos_operacionais,

    'margem_contribuicao', v_margem_contribuicao,    'custos_detalhados', v_custos_por_categoria,

        'margem_contribuicao', v_margem_contribuicao,

    -- DESPESAS FIXAS    

    'despesas_fixas', v_despesas_fixas,    -- DESPESAS FIXAS

    'despesas_detalhadas', v_despesas_por_categoria,    'despesas_fixas', v_despesas_fixas,

    'ebitda', v_ebitda,    'despesas_detalhadas', v_despesas_por_categoria,

        'ebitda', v_ebitda,

    -- IMPOSTOS    

    'impostos', v_impostos,    -- IMPOSTOS

    'impostos_detalhados', v_impostos_por_categoria,    'impostos', v_impostos,

    'ebit', v_ebit,    'impostos_detalhados', v_impostos_por_categoria,

        'ebit', v_ebit,

    -- RESULTADO FINANCEIRO    

    'receitas_financeiras', v_receitas_financeiras,    -- RESULTADO FINANCEIRO

    'despesas_financeiras', v_despesas_financeiras,    'receitas_financeiras', v_receitas_financeiras,

    'resultado_financeiro', v_resultado_financeiro,    'despesas_financeiras', v_despesas_financeiras,

        'resultado_financeiro', v_resultado_financeiro,

    -- LUCRO LÍQUIDO    

    'lucro_liquido', v_lucro_liquido,    -- LUCRO LÍQUIDO

        'lucro_liquido', v_lucro_liquido,

    -- PERCENTUAIS    

    'percentuais', json_build_object(    -- PERCENTUAIS

      'margem_liquida', ROUND(v_margem_liquida, 2),    'percentuais', json_build_object(

      'margem_contribuicao', ROUND(v_margem_contribuicao_pct, 2),      'margem_liquida', ROUND(v_margem_liquida, 2),

      'ebitda_margin', ROUND(v_ebitda_margin, 2),      'margem_contribuicao', ROUND(v_margem_contribuicao_pct, 2),

      'receita_bruta', 100.00,      'ebitda_margin', ROUND(v_ebitda_margin, 2),

      'deducoes', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_deducoes / v_receita_bruta) * 100, 2) ELSE 0 END,      'receita_bruta', 100.00,

      'receita_liquida', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_receita_liquida / v_receita_bruta) * 100, 2) ELSE 0 END,      'deducoes', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_deducoes / v_receita_bruta) * 100, 2) ELSE 0 END,

      'custos_operacionais', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_custos_operacionais / v_receita_bruta) * 100, 2) ELSE 0 END,      'receita_liquida', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_receita_liquida / v_receita_bruta) * 100, 2) ELSE 0 END,

      'despesas_fixas', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_despesas_fixas / v_receita_bruta) * 100, 2) ELSE 0 END,      'custos_operacionais', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_custos_operacionais / v_receita_bruta) * 100, 2) ELSE 0 END,

      'impostos', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_impostos / v_receita_bruta) * 100, 2) ELSE 0 END      'despesas_fixas', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_despesas_fixas / v_receita_bruta) * 100, 2) ELSE 0 END,

    )      'impostos', CASE WHEN v_receita_bruta > 0 THEN ROUND((v_impostos / v_receita_bruta) * 100, 2) ELSE 0 END

  );    )

    );

  RETURN v_result;  

    RETURN v_result;

EXCEPTION  

  WHEN OTHERS THENEXCEPTION

    RETURN json_build_object(  WHEN OTHERS THEN

      'sucesso', false,    RETURN json_build_object(

      'erro', SQLERRM,      'sucesso', false,

      'detalhes', SQLSTATE      'erro', SQLERRM,

    );      'detalhes', SQLSTATE

END;    );

$$;END;

$$;

-- =====================================================

-- Comentários e Permissões-- =====================================================

-- =====================================================-- Comentários e Permissões

-- =====================================================

COMMENT ON FUNCTION public.fn_calculate_dre_dynamic(uuid, date, date) IS 

'Calcula o DRE (Demonstração do Resultado do Exercício) de forma dinâmica usando categorias reais do sistema.COMMENT ON FUNCTION public.fn_calculate_dre_dynamic(uuid, date, date) IS 

'Calcula o DRE (Demonstração do Resultado do Exercício) de forma dinâmica baseado nas categorias financeiras cadastradas no sistema.

Estrutura do DRE:

1. (+) RECEITA BRUTA - Todas as receitas por categoria (exceto financeiras)Estrutura do DRE:

2. (-) Deduções - Descontos, devoluções1. (+) RECEITA BRUTA - Todas as receitas por categoria

3. (=) RECEITA LÍQUIDA2. (-) Deduções - Descontos, devoluções

4. (-) Custos Operacionais - Custos variáveis (categoria pai: OPERACIONAIS)3. (=) RECEITA LÍQUIDA

5. (=) MARGEM DE CONTRIBUIÇÃO4. (-) Custos Operacionais - Custos variáveis (categoria pai: OPERACIONAIS)

6. (-) Despesas Fixas - Despesas administrativas (categoria pai: ADMINISTRATIVAS)5. (=) MARGEM DE CONTRIBUIÇÃO

7. (=) EBITDA6. (-) Despesas Fixas - Despesas administrativas (categoria pai: ADMINISTRATIVAS)

8. (-) Impostos e Tributos (categoria pai: IMPOSTO)7. (=) EBITDA

9. (=) EBIT8. (-) Impostos e Tributos (categoria pai: IMPOSTO)

10. (+/-) Resultado Financeiro (receitas e despesas financeiras)9. (=) EBIT

11. (=) LUCRO LÍQUIDO10. (+/-) Resultado Financeiro

11. (=) LUCRO LÍQUIDO

Parâmetros:

  - p_unit_id: ID da unidadeParâmetros:

  - p_start_date: Data inicial do período  - p_unit_id: ID da unidade

  - p_end_date: Data final do período  - p_start_date: Data inicial do período

  - p_end_date: Data final do período

Retorna JSON com:

  - Valores consolidados por seçãoRetorna JSON com:

  - Detalhamento completo por categoria  - Valores consolidados

  - Percentuais sobre receita bruta  - Detalhamento por categoria

  - Indicadores de performance (margem líquida, EBITDA margin, etc.)  - Percentuais sobre receita bruta

  - Indicadores (margem líquida, EBITDA margin, etc.)';

Versão 2.1.0 - Corrigida usando CTEs para evitar problemas de escopo de aliases SQL.';

-- Grant execute permission to authenticated users

-- Grant execute permission to authenticated usersGRANT EXECUTE ON FUNCTION public.fn_calculate_dre_dynamic(uuid, date, date) TO authenticated;

GRANT EXECUTE ON FUNCTION public.fn_calculate_dre_dynamic(uuid, date, date) TO authenticated;

-- =====================================================

-- =====================================================-- Exemplo de Uso

-- Exemplo de Uso-- =====================================================

-- =====================================================

-- SELECT fn_calculate_dre_dynamic(

/*--   'unit-id-aqui'::uuid,

-- Exemplo 1: DRE do mês atual--   '2025-01-01'::date,

SELECT fn_calculate_dre_dynamic(--   '2025-01-31'::date

  'sua-unit-id-aqui'::uuid,-- );

  DATE_TRUNC('month', CURRENT_DATE)::date,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
);

-- Exemplo 2: DRE de um período específico
SELECT fn_calculate_dre_dynamic(
  'sua-unit-id-aqui'::uuid,
  '2025-01-01'::date,
  '2025-01-31'::date
);
*/
