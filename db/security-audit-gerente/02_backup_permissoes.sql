/**
 * 📦 SCRIPT 02: BACKUP DE PERMISSÕES ATUAIS
 * 
 * Objetivo: Criar backup completo das policies RLS existentes para rollback seguro.
 * 
 * ⚠️ MODO: SOMENTE LEITURA
 * ✅ SEGURO para executar em produção
 * 
 * INSTRUÇÕES:
 * 1. Execute este script ANTES de aplicar qualquer mudança
 * 2. Salve o output em um arquivo .sql
 * 3. Use o output para rollback se necessário
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- 1. GERAR COMANDOS PARA RECRIAR TODAS AS POLICIES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    'DROP POLICY IF EXISTS "' || policyname || '" ON ' || schemaname || '.' || tablename || ';' AS drop_command,
    pg_get_policydef(oid) AS create_command
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, p.polname;

-- ============================================================================
-- 2. BACKUP DAS POLICIES RELACIONADAS A GERENTE
-- ============================================================================
WITH gerente_policies AS (
    SELECT 
        p.polrelid,
        n.nspname AS schemaname,
        c.relname AS tablename,
        p.polname AS policyname,
        p.polcmd,
        p.polpermissive,
        p.polroles,
        pg_get_expr(p.polqual, p.polrelid) AS qual,
        pg_get_expr(p.polwithcheck, p.polrelid) AS with_check,
        pg_get_policydef(p.oid) AS full_definition
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND (
          p.polname ILIKE '%gerente%'
          OR p.polname ILIKE '%manager%'
          OR pg_get_expr(p.polqual, p.polrelid) ILIKE '%gerente%'
          OR pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%gerente%'
      )
)
SELECT 
    '-- ========================================' AS backup_line
    UNION ALL
SELECT '-- BACKUP: ' || tablename || ' - ' || policyname FROM gerente_policies
    UNION ALL
SELECT '-- ========================================' FROM gerente_policies
    UNION ALL
SELECT full_definition || ';' FROM gerente_policies
    UNION ALL
SELECT '' FROM gerente_policies;

-- ============================================================================
-- 3. BACKUP DE TODAS AS POLICIES DE TABELAS FINANCEIRAS
-- ============================================================================
SELECT 
    '-- BACKUP POLICY: ' || schemaname || '.' || tablename || ' -> ' || policyname AS comment,
    pg_get_policydef(p.oid) || ';' AS policy_definition
FROM pg_policy p
JOIN pg_class c ON c.oid = p.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
      'revenues', 'expenses', 'expense_payments', 'categories', 
      'parties', 'professionals', 'payment_methods', 'bank_accounts',
      'barbers_turn_list', 'barbers_turn_daily_history', 'barbers_turn_history',
      'goals'
  )
ORDER BY c.relname, p.polname;

-- ============================================================================
-- 4. VERIFICAR RLS HABILITADO EM CADA TABELA
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE schemaname = 'public'
  AND tablename IN (
      'revenues', 'expenses', 'categories', 'parties', 'professionals',
      'barbers_turn_list', 'goals', 'units', 'bank_accounts'
  )
ORDER BY tablename;

-- ============================================================================
-- 5. SALVAR METADATA DE USUÁRIOS GERENTES (SE HOUVER)
-- ============================================================================
SELECT 
    '-- USUÁRIO GERENTE BACKUP' AS comment,
    'UPDATE auth.users SET raw_user_meta_data = ''' || 
        u.raw_user_meta_data::TEXT || 
        '''::JSONB WHERE id = ''' || u.id || ''';' AS restore_command
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' IN ('gerente', 'manager');

-- ============================================================================
-- ✅ INSTRUÇÕES DE USO:
-- 
-- 1. Execute este script completo
-- 2. Salve o output em: 02_backup_permissoes_BACKUP_<data>.sql
-- 3. Verifique se todos os comandos estão corretos
-- 4. Mantenha o backup em local seguro para rollback
-- 
-- Para restaurar:
-- - Execute o arquivo de backup gerado
-- - Todas as policies serão recriadas no estado original
-- ============================================================================
