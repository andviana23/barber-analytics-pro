-- =====================================================
-- FIXTURES: Financial Module Test Data
-- =====================================================
-- Description: Sample data for QA and E2E testing
-- Author: AI Assistant
-- Created: 2025-10-22
-- Version: 1.0.0
-- Usage: Run after main schema migrations
-- =====================================================

-- =====================================================
-- PREREQUISITES
-- =====================================================
-- This script assumes:
-- 1. Units table exists with at least one test unit
-- 2. Professionals table exists with test users
-- 3. All financial tables are created
-- =====================================================

-- =====================================================
-- 1. CREATE TEST BANK ACCOUNTS
-- =====================================================

INSERT INTO bank_accounts (id, unit_id, name, bank_name, account_number, agency, account_type, initial_balance, current_balance, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Conta Corrente Principal',
    'Banco do Brasil',
    '12345-6',
    '0001',
    'Corrente',
    10000.00,
    15000.00,
    true
FROM units u
WHERE u.name = 'Barbearia Teste' -- Ajuste conforme nome da unit de teste
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bank_accounts (id, unit_id, name, bank_name, account_number, agency, account_type, initial_balance, current_balance, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Conta Poupança',
    'Caixa Econômica',
    '98765-4',
    '0123',
    'Poupança',
    5000.00,
    5500.00,
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. CREATE TEST PAYMENT METHODS
-- =====================================================

INSERT INTO payment_methods (id, unit_id, name, type, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'PIX',
    'PIX',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (id, unit_id, name, type, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Cartão de Crédito',
    'Cartão',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO payment_methods (id, unit_id, name, type, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Dinheiro',
    'Dinheiro',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CREATE TEST PARTIES (CLIENTS AND SUPPLIERS)
-- =====================================================

INSERT INTO parties (id, unit_id, nome, tipo, cpf_cnpj, email, telefone, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'João Silva',
    'Cliente',
    '123.456.789-00',
    'joao.silva@email.com',
    '(11) 98765-4321',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO parties (id, unit_id, nome, tipo, cpf_cnpj, email, telefone, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Maria Santos',
    'Cliente',
    '987.654.321-00',
    'maria.santos@email.com',
    '(11) 91234-5678',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO parties (id, unit_id, nome, tipo, cpf_cnpj, email, telefone, is_active)
SELECT 
    gen_random_uuid(),
    u.id,
    'Distribuidora de Produtos',
    'Fornecedor',
    '12.345.678/0001-90',
    'contato@distribuidora.com',
    '(11) 3333-4444',
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. CREATE TEST CATEGORIES
-- =====================================================

-- Parent Categories
INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    NULL,
    'RECEITAS OPERACIONAIS',
    'Receitas provenientes da operação principal',
    'Revenue',
    true,
    1
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    NULL,
    'DESPESAS OPERACIONAIS',
    'Despesas necessárias para operação',
    'Expense',
    true,
    1
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Child Categories (Revenues)
INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'RECEITAS OPERACIONAIS' AND unit_id = u.id LIMIT 1),
    'Corte de Cabelo',
    'Serviço de corte de cabelo',
    'Revenue',
    true,
    1
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'RECEITAS OPERACIONAIS' AND unit_id = u.id LIMIT 1),
    'Barba',
    'Serviço de barba',
    'Revenue',
    true,
    2
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Child Categories (Expenses)
INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'DESPESAS OPERACIONAIS' AND unit_id = u.id LIMIT 1),
    'Comissão',
    'Comissão de profissionais',
    'Expense',
    true,
    1
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO categories (id, unit_id, parent_id, name, description, category_type, is_active, sort_order)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'DESPESAS OPERACIONAIS' AND unit_id = u.id LIMIT 1),
    'Produtos',
    'Compra de produtos',
    'Expense',
    true,
    2
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. CREATE TEST REVENUES
-- =====================================================

-- Current month revenues
INSERT INTO revenues (
    id, unit_id, category_id, party_id, payment_method_id, account_id,
    source, description, value, date, expected_receipt_date, actual_receipt_date,
    data_competencia, status, is_active, reconciled
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'Corte de Cabelo' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM parties WHERE nome = 'João Silva' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM payment_methods WHERE name = 'PIX' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM bank_accounts WHERE name = 'Conta Corrente Principal' AND unit_id = u.id LIMIT 1),
    'Serviço Prestado',
    'Corte de cabelo + barba',
    50.00,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    'Received',
    true,
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

INSERT INTO revenues (
    id, unit_id, category_id, party_id, payment_method_id,
    source, description, value, date, expected_receipt_date,
    data_competencia, status, is_active, reconciled
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'Barba' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM parties WHERE nome = 'Maria Santos' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM payment_methods WHERE name = 'Dinheiro' AND unit_id = u.id LIMIT 1),
    'Serviço Prestado',
    'Serviço de barba completo',
    30.00,
    NULL,
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE,
    'Pending',
    true,
    false
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- =====================================================
-- 6. CREATE TEST EXPENSES
-- =====================================================

-- Paid expense
INSERT INTO expenses (
    id, unit_id, category_id, party_id, account_id,
    description, value, paid_value, date, expected_payment_date, payment_date,
    actual_payment_date, data_competencia, forma_pagamento, status, is_active, reconciled
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'Produtos' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM parties WHERE nome = 'Distribuidora de Produtos' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM bank_accounts WHERE name = 'Conta Corrente Principal' AND unit_id = u.id LIMIT 1),
    'Compra de produtos para revenda',
    250.00,
    250.00,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '10 days',
    'Transferência',
    'paid',
    true,
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- Pending expense
INSERT INTO expenses (
    id, unit_id, category_id, party_id,
    description, value, date, expected_payment_date,
    data_competencia, forma_pagamento, status, is_active, reconciled
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'Comissão' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM professionals p WHERE p.unit_id = u.id LIMIT 1), -- Party_id do profissional
    'Comissão referente aos atendimentos do mês',
    500.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE,
    'PIX',
    'pending',
    true,
    false
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- Overdue expense
INSERT INTO expenses (
    id, unit_id, category_id, party_id,
    description, value, date, expected_payment_date,
    data_competencia, forma_pagamento, status, is_active, reconciled
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM categories WHERE name = 'Produtos' AND unit_id = u.id LIMIT 1),
    (SELECT id FROM parties WHERE nome = 'Distribuidora de Produtos' AND unit_id = u.id LIMIT 1),
    'Fatura atrasada - produtos do mês passado',
    180.00,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '20 days',
    'Boleto',
    'pending',
    true,
    false
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- =====================================================
-- 7. CREATE TEST BANK STATEMENTS
-- =====================================================

-- Credit transaction (revenue)
INSERT INTO bank_statements (
    id, unit_id, account_id, transaction_date, description, amount,
    transaction_type, balance_after, reconciled, source_hash, is_active
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM bank_accounts WHERE name = 'Conta Corrente Principal' AND unit_id = u.id LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days',
    'PIX - João Silva',
    50.00,
    'credit',
    15050.00,
    true,
    md5(random()::text),
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- Debit transaction (expense)
INSERT INTO bank_statements (
    id, unit_id, account_id, transaction_date, description, amount,
    transaction_type, balance_after, reconciled, source_hash, is_active
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM bank_accounts WHERE name = 'Conta Corrente Principal' AND unit_id = u.id LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days',
    'TRANSFERÊNCIA - Distribuidora',
    -250.00,
    'debit',
    14800.00,
    true,
    md5(random()::text),
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- Unreconciled transaction
INSERT INTO bank_statements (
    id, unit_id, account_id, transaction_date, description, amount,
    transaction_type, balance_after, reconciled, source_hash, is_active
)
SELECT 
    gen_random_uuid(),
    u.id,
    (SELECT id FROM bank_accounts WHERE name = 'Conta Corrente Principal' AND unit_id = u.id LIMIT 1),
    CURRENT_DATE - INTERVAL '2 days',
    'PIX - Cliente não identificado',
    35.00,
    'credit',
    14835.00,
    false,
    md5(random()::text),
    true
FROM units u
WHERE u.name = 'Barbearia Teste'
LIMIT 1;

-- =====================================================
-- FIXTURE SUMMARY
-- =====================================================
-- Created test data:
-- - 2 Bank Accounts
-- - 3 Payment Methods
-- - 3 Parties (2 clients, 1 supplier)
-- - 6 Categories (2 parent, 4 child)
-- - 2 Revenues (1 received, 1 pending)
-- - 3 Expenses (1 paid, 1 pending, 1 overdue)
-- - 3 Bank Statements (2 reconciled, 1 pending)
-- =====================================================
