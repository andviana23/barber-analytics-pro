-- =====================================================
-- Seeds/Fixtures para DRE - Ambiente de Staging
-- Description: Dados de teste para validação do módulo DRE
-- Author: Barber Analytics Pro Team
-- Date: 2025-10-21
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- IMPORTANTE: Este script cria dados fictícios
-- Use apenas em ambientes de desenvolvimento/staging
-- NÃO execute em produção!
-- =====================================================

-- Verificar se estamos em ambiente de desenvolvimento
DO $$
BEGIN
  IF current_database() = 'postgres' AND EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'units'
  ) THEN
    RAISE NOTICE 'Criando seeds para ambiente de staging...';
  ELSE
    RAISE EXCEPTION 'Este script deve ser executado apenas em ambiente de staging!';
  END IF;
END $$;

-- =====================================================
-- 1. Criar Unidade de Teste
-- =====================================================

-- Criar unidade de teste (se não existir)
INSERT INTO units (id, name, user_id, status, is_active, created_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Barbearia Teste - DRE',
  (SELECT id FROM auth.users LIMIT 1), -- Pega primeiro usuário disponível
  true,
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. Criar Categorias Necessárias
-- =====================================================

-- Categorias de Receita
INSERT INTO categories (id, unit_id, name, category_type, is_active, created_at)
VALUES 
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Assinatura', 'Revenue', true, NOW()),
  ('bbbbbbbb-0001-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Avulso', 'Revenue', true, NOW()),
  ('bbbbbbbb-0001-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cosmeticos', 'Revenue', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Categorias de Custos Operacionais
INSERT INTO categories (id, unit_id, name, category_type, is_active, created_at)
VALUES 
  ('bbbbbbbb-0002-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bebidas e cortesias', 'Expense', true, NOW()),
  ('bbbbbbbb-0002-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bonificações e metas', 'Expense', true, NOW()),
  ('bbbbbbbb-0002-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Comissões', 'Expense', true, NOW()),
  ('bbbbbbbb-0002-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Limpeza e lavanderia', 'Expense', true, NOW()),
  ('bbbbbbbb-0002-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Produtos de uso interno', 'Expense', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Categorias de Despesas Administrativas
INSERT INTO categories (id, unit_id, name, category_type, is_active, created_at)
VALUES 
  ('bbbbbbbb-0003-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Aluguel e condomínio', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Contabilidade', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Contas fixas (energia, água, internet, telefone)', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Encargos e benefícios', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Manutenção e Seguros', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Marketing e Comercial', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Salários / Pró-labore', 'Expense', true, NOW()),
  ('bbbbbbbb-0003-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sistemas', 'Expense', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Categoria de Impostos
INSERT INTO categories (id, unit_id, name, category_type, is_active, created_at)
VALUES 
  ('bbbbbbbb-0004-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Simpes Nascional', 'Expense', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. Criar Receitas de Teste (Outubro 2025)
-- =====================================================

-- Receitas de Assinatura (30 clientes x R$ 150)
INSERT INTO revenues (unit_id, category_id, type, value, net_amount, date, status, is_active, created_at)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-0001-0000-0000-000000000001',
  'service',
  150.00,
  145.00, -- Deduzindo R$ 5 de taxa
  '2025-10-' || LPAD(generate_series::text, 2, '0'),
  'Received',
  true,
  NOW()
FROM generate_series(1, 30);

-- Receitas Avulsas (variadas ao longo do mês)
INSERT INTO revenues (unit_id, category_id, type, value, net_amount, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 80.00, 78.00, '2025-10-01', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 120.00, 117.00, '2025-10-02', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 65.00, 63.50, '2025-10-03', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 95.00, 92.50, '2025-10-05', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 110.00, 107.00, '2025-10-07', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 75.00, 73.00, '2025-10-08', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 140.00, 136.00, '2025-10-10', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 88.00, 85.50, '2025-10-12', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 105.00, 102.00, '2025-10-14', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 92.00, 89.50, '2025-10-16', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 130.00, 126.50, '2025-10-18', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 70.00, 68.00, '2025-10-20', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 115.00, 111.50, '2025-10-22', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 98.00, 95.00, '2025-10-24', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000002', 'service', 125.00, 121.50, '2025-10-26', 'Received', true, NOW());

-- Vendas de Cosméticos
INSERT INTO revenues (unit_id, category_id, type, value, net_amount, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000003', 'product', 85.00, 85.00, '2025-10-03', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000003', 'product', 120.00, 120.00, '2025-10-08', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000003', 'product', 95.00, 95.00, '2025-10-15', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000003', 'product', 110.00, 110.00, '2025-10-21', 'Received', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-000000000003', 'product', 75.00, 75.00, '2025-10-28', 'Received', true, NOW());

-- =====================================================
-- 4. Criar Despesas de Teste (Custos Operacionais)
-- =====================================================

-- Bebidas e cortesias
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000001', 'supplies', 320.00, '2025-10-05', 'Paid', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000001', 'supplies', 280.00, '2025-10-20', 'Paid', true, NOW());

-- Bonificações e metas
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000002', 'salary', 500.00, '2025-10-31', 'Paid', true, NOW());

-- Comissões (15% da receita de serviços)
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000003', 'salary', 1050.00, '2025-10-31', 'Paid', true, NOW());

-- Limpeza e lavanderia
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000004', 'supplies', 450.00, '2025-10-10', 'Paid', true, NOW());

-- Produtos de uso interno
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-000000000005', 'supplies', 680.00, '2025-10-15', 'Paid', true, NOW());

-- =====================================================
-- 5. Criar Despesas Administrativas
-- =====================================================

-- Aluguel e condomínio
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000001', 'rent', 3500.00, '2025-10-05', 'Paid', true, NOW());

-- Contabilidade
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000002', 'other', 800.00, '2025-10-10', 'Paid', true, NOW());

-- Contas fixas (energia, água, internet, telefone)
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000003', 'utilities', 650.00, '2025-10-08', 'Paid', true, NOW()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000003', 'utilities', 320.00, '2025-10-12', 'Paid', true, NOW());

-- Encargos e benefícios
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000004', 'salary', 1200.00, '2025-10-05', 'Paid', true, NOW());

-- Manutenção e Seguros
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000005', 'other', 420.00, '2025-10-18', 'Paid', true, NOW());

-- Marketing e Comercial
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000006', 'other', 890.00, '2025-10-15', 'Paid', true, NOW());

-- Salários / Pró-labore
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000007', 'salary', 4500.00, '2025-10-05', 'Paid', true, NOW());

-- Sistemas
INSERT INTO expenses (unit_id, category_id, type, value, date, status, is_active, created_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-000000000008', 'other', 350.00, '2025-10-20', 'Paid', true, NOW());

-- =====================================================
-- 6. Verificar Resultados
-- =====================================================

-- Calcular DRE com os dados criados
DO $$
DECLARE
  v_dre_result JSON;
BEGIN
  SELECT fn_calculate_dre(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '2025-10-01'::date,
    '2025-10-31'::date
  ) INTO v_dre_result;
  
  RAISE NOTICE 'DRE calculado com sucesso!';
  RAISE NOTICE 'Receita Bruta: R$ %', (v_dre_result->>'receita_bruta')::json->>'total';
  RAISE NOTICE 'Lucro Líquido: R$ %', v_dre_result->>'lucro_liquido';
END $$;

-- =====================================================
-- Seeds criados com sucesso!
-- =====================================================

RAISE NOTICE '✅ Seeds/Fixtures criados com sucesso!';
RAISE NOTICE 'Unit ID: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
RAISE NOTICE 'Período: Outubro/2025';
RAISE NOTICE 'Para testar, execute: SELECT fn_calculate_dre(''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'', ''2025-10-01'', ''2025-10-31'');';
