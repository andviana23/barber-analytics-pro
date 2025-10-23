/**
 * 🔍 SCRIPT 01: MAPEAMENTO DE OBJETOS DO BANCO
 * 
 * Objetivo: Descobrir todas as tabelas, views, policies e permissões relacionadas
 * ao papel 'gerente' no sistema Barber Analytics Pro.
 * 
 * ⚠️ MODO: SOMENTE LEITURA (queries SELECT)
 * ✅ SEGURO para executar em produção
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- 1. LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
-- ============================================================================
SELECT 
    'TABLE' AS object_type,
    schemaname AS schema,
    tablename AS object_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns c 
     WHERE c.table_schema = t.schemaname 
       AND c.table_name = t.tablename) AS num_columns,
    NULL AS depends_on
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- ============================================================================
-- 2. LISTAR TODAS AS VIEWS (PARA DASHBOARD/RELATÓRIOS)
-- ============================================================================
SELECT 
    'VIEW' AS object_type,
    schemaname AS schema,
    viewname AS object_name,
    NULL AS num_columns,
    'Dashboard/Relatórios' AS purpose
FROM pg_views
WHERE schemaname = 'public'
  AND viewname NOT LIKE 'pg_%'
ORDER BY viewname;

-- ============================================================================
-- 3. LISTAR POLICIES RLS EXISTENTES
-- ============================================================================
SELECT 
    'POLICY' AS object_type,
    schemaname AS schema,
    tablename AS table_name,
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    CASE 
        WHEN policyname ILIKE '%gerente%' THEN '⚠️ GERENTE'
        WHEN policyname ILIKE '%manager%' THEN '⚠️ MANAGER'
        WHEN policyname ILIKE '%admin%' THEN 'ADMIN'
        WHEN policyname ILIKE '%authenticated%' THEN 'AUTHENTICATED'
        ELSE 'OTHER'
    END AS role_detected
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY 
    CASE 
        WHEN policyname ILIKE '%gerente%' OR policyname ILIKE '%manager%' THEN 0
        ELSE 1
    END,
    tablename, 
    policyname;

-- ============================================================================
-- 4. LISTAR POLICIES QUE MENCIONAM 'GERENTE' NO CÓDIGO
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
      qual::TEXT ILIKE '%gerente%' 
      OR with_check::TEXT ILIKE '%gerente%'
      OR qual::TEXT ILIKE '%manager%'
      OR with_check::TEXT ILIKE '%manager%'
  )
ORDER BY tablename;

-- ============================================================================
-- 5. VERIFICAR USUÁRIOS COM PAPEL 'GERENTE' NO SISTEMA
-- ============================================================================
SELECT 
    u.id AS user_id,
    u.email,
    u.raw_user_meta_data->>'role' AS role_in_metadata,
    p.id AS professional_id,
    p.name AS professional_name,
    p.role AS professional_role,
    p.unit_id,
    unit.name AS unit_name,
    u.created_at AS user_created,
    u.last_sign_in_at AS last_login
FROM auth.users u
LEFT JOIN professionals p ON p.user_id = u.id
LEFT JOIN units unit ON unit.id = p.unit_id
WHERE 
    u.raw_user_meta_data->>'role' IN ('gerente', 'manager', 'receptionist')
    OR p.role ILIKE '%gerente%'
    OR p.role ILIKE '%manager%'
    OR p.role ILIKE '%recepc%'
ORDER BY u.created_at DESC;

-- ============================================================================
-- 6. LISTAR FUNÇÕES SQL QUE PODEM SER USADAS POR GERENTE
-- ============================================================================
SELECT 
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END AS volatility,
    pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname IN (
      'calculate_goal_achieved_value',
      'fn_calculate_dre',
      'fn_update_timestamp',
      'trigger_recalculate_account_balance_on_revenue',
      'trigger_recalculate_account_balance_on_expense'
  )
ORDER BY p.proname;

-- ============================================================================
-- 7. ANÁLISE DE DEPENDÊNCIAS DE TABELAS CRÍTICAS
-- ============================================================================
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text IN ('revenues', 'expenses', 'goals', 'barbers_turn_list')
  AND contype = 'f' -- Foreign keys
ORDER BY table_name, constraint_name;

-- ============================================================================
-- 8. RESUMO EXECUTIVO: TABELAS POR CATEGORIA
-- ============================================================================
SELECT 
    'Financeiro (PERMITIDAS)' AS categoria,
    STRING_AGG(tablename, ', ') AS tabelas
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('revenues', 'expenses', 'expense_payments', 'categories', 'payment_methods', 'bank_accounts')

UNION ALL

SELECT 
    'Cadastros (PERMITIDAS)' AS categoria,
    STRING_AGG(tablename, ', ') AS tabelas
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('parties', 'professionals', 'units')

UNION ALL

SELECT 
    'Lista da Vez (PERMITIDAS)' AS categoria,
    STRING_AGG(tablename, ', ') AS tabelas
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('barbers_turn_list', 'barbers_turn_daily_history', 'barbers_turn_history')

UNION ALL

SELECT 
    'Metas (PERMITIDAS)' AS categoria,
    STRING_AGG(tablename, ', ') AS tabelas
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('goals')

UNION ALL

SELECT 
    'ADMINISTRATIVAS (BLOQUEADAS)' AS categoria,
    STRING_AGG(tablename, ', ') AS tabelas
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
      'subscriptions', 'subscription_payments', 'products', 'product_movements',
      'bank_statements', 'reconciliations', 'asaas_webhook_logs', 'access_logs',
      'recurring_expenses', 'bank_account_balance_logs', 'expense_attachments'
  );

-- ============================================================================
-- 9. ESTATÍSTICAS DE REGISTROS POR TABELA (VERIFICAÇÃO DE VOLUME)
-- ============================================================================
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_rows,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('revenues', 'expenses', 'goals', 'barbers_turn_list', 'parties', 'professionals')
ORDER BY n_live_tup DESC;

-- ============================================================================
-- ✅ RESULTADO ESPERADO:
-- 
-- Este script deve retornar:
-- - Lista completa de tabelas (43 encontradas)
-- - Lista de views (25 encontradas)
-- - Policies RLS existentes (muitas com 'authenticated')
-- - Usuários com papel gerente (se houver)
-- - Funções acessíveis
-- - Dependências de FK
-- - Resumo por categoria
-- - Estatísticas de volume
-- ============================================================================
