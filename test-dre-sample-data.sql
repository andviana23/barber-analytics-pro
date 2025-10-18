-- =====================================================
-- Script de Teste do Módulo DRE
-- Cria dados de exemplo para testar o cálculo do DRE
-- =====================================================

-- ATENÇÃO: Este script insere dados de TESTE
-- Execute apenas em ambiente de desenvolvimento/homologação

BEGIN;

-- =====================================================
-- 1. Verificar se existem unidades
-- =====================================================

DO $$
DECLARE
  v_unit_id UUID;
  v_category_assinatura UUID;
  v_category_avulso UUID;
  v_category_cosmeticos UUID;
  v_category_comissoes UUID;
  v_category_aluguel UUID;
  v_category_simples UUID;
BEGIN
  -- Pegar primeira unidade disponível
  SELECT id INTO v_unit_id FROM units WHERE is_active = true LIMIT 1;
  
  IF v_unit_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma unidade encontrada. Crie uma unidade primeiro.';
  END IF;
  
  RAISE NOTICE 'Usando unidade: %', v_unit_id;
  
  -- =====================================================
  -- 2. Buscar IDs das categorias
  -- =====================================================
  
  SELECT id INTO v_category_assinatura FROM categories 
  WHERE name = 'Assinatura' AND category_type = 'Revenue' LIMIT 1;
  
  SELECT id INTO v_category_avulso FROM categories 
  WHERE name = 'Avulso' AND category_type = 'Revenue' LIMIT 1;
  
  SELECT id INTO v_category_cosmeticos FROM categories 
  WHERE name = 'Cosmeticos' AND category_type = 'Revenue' LIMIT 1;
  
  SELECT id INTO v_category_comissoes FROM categories 
  WHERE name = 'Comissões' AND category_type = 'Expense' LIMIT 1;
  
  SELECT id INTO v_category_aluguel FROM categories 
  WHERE name = 'Aluguel e condomínio' AND category_type = 'Expense' LIMIT 1;
  
  SELECT id INTO v_category_simples FROM categories 
  WHERE name = 'Simpes Nascional' AND category_type = 'Expense' LIMIT 1;
  
  -- =====================================================
  -- 3. Inserir Receitas de Teste (Janeiro 2024)
  -- =====================================================
  
  RAISE NOTICE 'Inserindo receitas de teste...';
  
  -- Assinaturas (10 clientes x R$ 150,00)
  INSERT INTO revenues (
    unit_id, 
    type, 
    value, 
    date, 
    category_id,
    status,
    source,
    observations
  )
  SELECT 
    v_unit_id,
    'service',
    150.00,
    '2024-01-' || LPAD(generate_series::text, 2, '0'),
    v_category_assinatura,
    'Received',
    'Assinatura Mensal',
    'Cliente teste ' || generate_series
  FROM generate_series(1, 10);
  
  -- Serviços Avulsos (20 atendimentos x R$ 50,00)
  INSERT INTO revenues (
    unit_id, 
    type, 
    value, 
    date, 
    category_id,
    status,
    source,
    observations
  )
  SELECT 
    v_unit_id,
    'service',
    50.00,
    '2024-01-' || LPAD((generate_series % 28 + 1)::text, 2, '0'),
    v_category_avulso,
    'Received',
    'Corte Avulso',
    'Atendimento avulso ' || generate_series
  FROM generate_series(1, 20);
  
  -- Venda de Produtos (5 vendas x R$ 80,00)
  INSERT INTO revenues (
    unit_id, 
    type, 
    value, 
    date, 
    category_id,
    status,
    source,
    observations
  )
  SELECT 
    v_unit_id,
    'product',
    80.00,
    '2024-01-' || LPAD((generate_series * 5)::text, 2, '0'),
    v_category_cosmeticos,
    'Received',
    'Venda de Produto',
    'Produto ' || generate_series
  FROM generate_series(1, 5);
  
  RAISE NOTICE '✅ Receitas inseridas com sucesso';
  
  -- =====================================================
  -- 4. Inserir Despesas de Teste (Janeiro 2024)
  -- =====================================================
  
  RAISE NOTICE 'Inserindo despesas de teste...';
  
  -- Comissões (R$ 500,00)
  INSERT INTO expenses (
    unit_id,
    type,
    value,
    date,
    category_id,
    status,
    description,
    observations
  ) VALUES (
    v_unit_id,
    'other',
    500.00,
    '2024-01-31',
    v_category_comissoes,
    'Paid',
    'Comissões do mês',
    'Pagamento de comissões de janeiro'
  );
  
  -- Aluguel (R$ 3.000,00)
  INSERT INTO expenses (
    unit_id,
    type,
    value,
    date,
    category_id,
    status,
    description,
    observations
  ) VALUES (
    v_unit_id,
    'rent',
    3000.00,
    '2024-01-10',
    v_category_aluguel,
    'Paid',
    'Aluguel Janeiro/2024',
    'Pagamento de aluguel do ponto comercial'
  );
  
  -- Simples Nacional (será calculado automaticamente se não informado)
  -- Mas vamos inserir um valor de exemplo: R$ 200,00
  INSERT INTO expenses (
    unit_id,
    type,
    value,
    date,
    category_id,
    status,
    description,
    observations
  ) VALUES (
    v_unit_id,
    'other',
    200.00,
    '2024-01-20',
    v_category_simples,
    'Paid',
    'Simples Nacional Janeiro/2024',
    'Pagamento de imposto'
  );
  
  RAISE NOTICE '✅ Despesas inseridas com sucesso';
  
  -- =====================================================
  -- 5. Calcular e Exibir DRE
  -- =====================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Calculando DRE para Janeiro/2024...';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  
  DECLARE
    v_dre JSON;
  BEGIN
    SELECT fn_calculate_dre(v_unit_id, '2024-01-01', '2024-01-31')
    INTO v_dre;
    
    RAISE NOTICE 'DRE Calculado:';
    RAISE NOTICE '%', v_dre::text;
  END;
  
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Teste concluído com sucesso!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo dos dados inseridos:';
  RAISE NOTICE '  - 10 assinaturas (R$ 150,00 cada)';
  RAISE NOTICE '  - 20 atendimentos avulsos (R$ 50,00 cada)';
  RAISE NOTICE '  -  5 vendas de produtos (R$ 80,00 cada)';
  RAISE NOTICE '  - Comissões: R$ 500,00';
  RAISE NOTICE '  - Aluguel: R$ 3.000,00';
  RAISE NOTICE '  - Impostos: R$ 200,00';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Para visualizar o DRE:';
  RAISE NOTICE '  1. Acesse: /dre';
  RAISE NOTICE '  2. Selecione Janeiro/2024';
  RAISE NOTICE '  3. Ou execute: SELECT fn_calculate_dre(''%'', ''2024-01-01'', ''2024-01-31'');', v_unit_id;
  
END $$;

-- =====================================================
-- 6. Exibir resumo de validação
-- =====================================================

SELECT 
  'Receitas Janeiro/2024' as tabela,
  COUNT(*) as total_registros,
  SUM(value) as valor_total
FROM revenues
WHERE date BETWEEN '2024-01-01' AND '2024-01-31'
  AND is_active = true

UNION ALL

SELECT 
  'Despesas Janeiro/2024' as tabela,
  COUNT(*) as total_registros,
  SUM(value) as valor_total
FROM expenses
WHERE date BETWEEN '2024-01-01' AND '2024-01-31'
  AND is_active = true;

-- Se tudo estiver OK, faça COMMIT
-- Se quiser desfazer, faça ROLLBACK
COMMIT;
-- ROLLBACK;  -- Descomente para desfazer as inserções

