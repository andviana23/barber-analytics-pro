-- =====================================================
-- Migration: Create DRE Function and Auxiliary Views
-- Description: Demonstração do Resultado do Exercício
-- Author: Barber Analytics Pro Team
-- Date: 2025-10-21
-- Version: 1.0.0
-- =====================================================

-- Drop existing function if exists (safe recreation)
DROP FUNCTION IF EXISTS public.fn_calculate_dre(uuid, date, date);

-- =====================================================
-- Main DRE Calculation Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_calculate_dre(
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
  v_receita_bruta NUMERIC := 0;
  v_receita_servico_assinatura NUMERIC := 0;
  v_receita_servico_avulso NUMERIC := 0;
  v_receita_produtos_cosmeticos NUMERIC := 0;
  
  v_custos_operacionais NUMERIC := 0;
  v_bebidas_cortesias NUMERIC := 0;
  v_bonificacoes_metas NUMERIC := 0;
  v_comissoes NUMERIC := 0;
  v_limpeza_lavanderia NUMERIC := 0;
  v_produtos_uso_interno NUMERIC := 0;
  
  v_despesas_administrativas NUMERIC := 0;
  v_aluguel_condominio NUMERIC := 0;
  v_contabilidade NUMERIC := 0;
  v_contas_fixas NUMERIC := 0;
  v_encargos_beneficios NUMERIC := 0;
  v_manutencao_seguros NUMERIC := 0;
  v_marketing_comercial NUMERIC := 0;
  v_salarios_prolabore NUMERIC := 0;
  v_sistemas NUMERIC := 0;
  
  v_impostos NUMERIC := 0;
  v_simples_nacional NUMERIC := 0;
  
  v_margem_contribuicao NUMERIC := 0;
  v_ebit NUMERIC := 0;
  v_lucro_liquido NUMERIC := 0;
BEGIN
  -- ==========================================
  -- VALIDAÇÕES DE ENTRADA
  -- ==========================================
  
  IF p_unit_id IS NULL THEN
    RAISE EXCEPTION 'Unit ID cannot be null';
  END IF;
  
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    RAISE EXCEPTION 'Start date and end date cannot be null';
  END IF;
  
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be greater than end date';
  END IF;
  
  -- ==========================================
  -- RECEITAS
  -- ==========================================
  
  -- Receita de Serviço - Assinatura
  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
  INTO v_receita_servico_assinatura
  FROM revenues r
  INNER JOIN categories c ON r.category_id = c.id
  WHERE r.unit_id = p_unit_id
    AND r.date BETWEEN p_start_date AND p_end_date
    AND r.is_active = true
    AND c.name = 'Assinatura'
    AND c.category_type = 'Revenue';
  
  -- Receita de Serviço - Avulso
  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
  INTO v_receita_servico_avulso
  FROM revenues r
  INNER JOIN categories c ON r.category_id = c.id
  WHERE r.unit_id = p_unit_id
    AND r.date BETWEEN p_start_date AND p_end_date
    AND r.is_active = true
    AND c.name = 'Avulso'
    AND c.category_type = 'Revenue';
  
  -- Receita de Produtos - Cosméticos
  SELECT COALESCE(SUM(COALESCE(r.net_amount, r.value)), 0)
  INTO v_receita_produtos_cosmeticos
  FROM revenues r
  INNER JOIN categories c ON r.category_id = c.id
  WHERE r.unit_id = p_unit_id
    AND r.date BETWEEN p_start_date AND p_end_date
    AND r.is_active = true
    AND c.name = 'Cosmeticos'
    AND c.category_type = 'Revenue';
  
  -- Total Receita Bruta
  v_receita_bruta := v_receita_servico_assinatura + v_receita_servico_avulso + v_receita_produtos_cosmeticos;
  
  -- ==========================================
  -- CUSTOS OPERACIONAIS
  -- ==========================================
  
  -- Bebidas e cortesias
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_bebidas_cortesias
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Bebidas e cortesias'
    AND c.category_type = 'Expense';
  
  -- Bonificações e metas
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_bonificacoes_metas
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Bonificações e metas'
    AND c.category_type = 'Expense';
  
  -- Comissões
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_comissoes
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Comissões'
    AND c.category_type = 'Expense';
  
  -- Limpeza e lavanderia
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_limpeza_lavanderia
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Limpeza e lavanderia'
    AND c.category_type = 'Expense';
  
  -- Produtos de uso interno
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_produtos_uso_interno
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Produtos de uso interno'
    AND c.category_type = 'Expense';
  
  -- Total Custos Operacionais
  v_custos_operacionais := v_bebidas_cortesias + v_bonificacoes_metas + v_comissoes + v_limpeza_lavanderia + v_produtos_uso_interno;
  
  -- Margem de Contribuição
  v_margem_contribuicao := v_receita_bruta - v_custos_operacionais;
  
  -- ==========================================
  -- DESPESAS ADMINISTRATIVAS
  -- ==========================================
  
  -- Aluguel e condomínio
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_aluguel_condominio
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Aluguel e condomínio'
    AND c.category_type = 'Expense';
  
  -- Contabilidade
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_contabilidade
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Contabilidade'
    AND c.category_type = 'Expense';
  
  -- Contas fixas
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_contas_fixas
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Contas fixas (energia, água, internet, telefone)'
    AND c.category_type = 'Expense';
  
  -- Encargos e benefícios
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_encargos_beneficios
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Encargos e benefícios'
    AND c.category_type = 'Expense';
  
  -- Manutenção e Seguros
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_manutencao_seguros
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Manutenção e Seguros'
    AND c.category_type = 'Expense';
  
  -- Marketing e Comercial
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_marketing_comercial
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Marketing e Comercial'
    AND c.category_type = 'Expense';
  
  -- Salários / Pró-labore
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_salarios_prolabore
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Salários / Pró-labore'
    AND c.category_type = 'Expense';
  
  -- Sistemas
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_sistemas
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Sistemas'
    AND c.category_type = 'Expense';
  
  -- Total Despesas Administrativas
  v_despesas_administrativas := v_aluguel_condominio + v_contabilidade + v_contas_fixas + v_encargos_beneficios + 
                                v_manutencao_seguros + v_marketing_comercial + v_salarios_prolabore + v_sistemas;
  
  -- EBIT (Resultado Antes dos Impostos)
  v_ebit := v_margem_contribuicao - v_despesas_administrativas;
  
  -- ==========================================
  -- IMPOSTOS
  -- ==========================================
  
  -- Simples Nacional (pode ser lançado manualmente ou calculado como % do EBIT)
  SELECT COALESCE(SUM(e.value), 0)
  INTO v_simples_nacional
  FROM expenses e
  INNER JOIN categories c ON e.category_id = c.id
  WHERE e.unit_id = p_unit_id
    AND e.date BETWEEN p_start_date AND p_end_date
    AND e.is_active = true
    AND c.name = 'Simpes Nascional'
    AND c.category_type = 'Expense';
  
  -- Se não houver lançamento manual, calcula 8% do EBIT (conforme especificação)
  IF v_simples_nacional = 0 AND v_ebit > 0 THEN
    v_simples_nacional := v_ebit * 0.08;
  END IF;
  
  v_impostos := v_simples_nacional;
  
  -- Lucro Líquido
  v_lucro_liquido := v_ebit - v_impostos;
  
  -- ==========================================
  -- MONTAR JSON DE RETORNO
  -- ==========================================
  
  v_result := json_build_object(
    'periodo', json_build_object(
      'inicio', p_start_date,
      'fim', p_end_date,
      'dias', (p_end_date - p_start_date) + 1,
      'gerado_em', NOW()
    ),
    'receita_bruta', json_build_object(
      'receita_servico', json_build_object(
        'assinatura', v_receita_servico_assinatura,
        'avulso', v_receita_servico_avulso,
        'total', v_receita_servico_assinatura + v_receita_servico_avulso
      ),
      'receita_produtos', json_build_object(
        'cosmeticos', v_receita_produtos_cosmeticos,
        'total', v_receita_produtos_cosmeticos
      ),
      'total', v_receita_bruta
    ),
    'custos_operacionais', json_build_object(
      'bebidas_cortesias', v_bebidas_cortesias,
      'bonificacoes_metas', v_bonificacoes_metas,
      'comissoes', v_comissoes,
      'limpeza_lavanderia', v_limpeza_lavanderia,
      'produtos_uso_interno', v_produtos_uso_interno,
      'total', v_custos_operacionais
    ),
    'margem_contribuicao', v_margem_contribuicao,
    'despesas_administrativas', json_build_object(
      'aluguel_condominio', v_aluguel_condominio,
      'contabilidade', v_contabilidade,
      'contas_fixas', v_contas_fixas,
      'encargos_beneficios', v_encargos_beneficios,
      'manutencao_seguros', v_manutencao_seguros,
      'marketing_comercial', v_marketing_comercial,
      'salarios_prolabore', v_salarios_prolabore,
      'sistemas', v_sistemas,
      'total', v_despesas_administrativas
    ),
    'ebit', v_ebit,
    'impostos', json_build_object(
      'simples_nacional', v_simples_nacional,
      'total', v_impostos
    ),
    'lucro_liquido', v_lucro_liquido,
    'indicadores', json_build_object(
      'margem_contribuicao_percentual', CASE WHEN v_receita_bruta > 0 THEN (v_margem_contribuicao / v_receita_bruta * 100) ELSE 0 END,
      'margem_ebit_percentual', CASE WHEN v_receita_bruta > 0 THEN (v_ebit / v_receita_bruta * 100) ELSE 0 END,
      'margem_liquida_percentual', CASE WHEN v_receita_bruta > 0 THEN (v_lucro_liquido / v_receita_bruta * 100) ELSE 0 END,
      'custo_operacional_percentual', CASE WHEN v_receita_bruta > 0 THEN (v_custos_operacionais / v_receita_bruta * 100) ELSE 0 END,
      'despesa_administrativa_percentual', CASE WHEN v_receita_bruta > 0 THEN (v_despesas_administrativas / v_receita_bruta * 100) ELSE 0 END
    ),
    'metadata', json_build_object(
      'version', '1.0.0',
      'unit_id', p_unit_id,
      'calculation_timestamp', NOW()
    )
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error calculating DRE: %', SQLERRM;
END;
$$;

-- =====================================================
-- Comments and Documentation
-- =====================================================

COMMENT ON FUNCTION public.fn_calculate_dre(uuid, date, date) IS 
'Calcula o DRE (Demonstração do Resultado do Exercício) para uma unidade em um período específico.
Retorna JSON estruturado com receitas, custos, despesas, EBIT, lucro líquido e indicadores percentuais.
Versão: 1.0.0
Autor: Barber Analytics Pro Team';

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION public.fn_calculate_dre(uuid, date, date) TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
