-- ================================================
-- SCRIPT DE TESTE - SISTEMA DE PERMISSÕES
-- Teste das funções e políticas RLS
-- Data: 2025-10-11
-- ================================================

-- 1. TESTAR AS FUNÇÕES DE PERMISSÃO

-- Verificar se o enum foi criado
SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
) as enum_user_role_exists;

-- Verificar se a coluna role foi adicionada na tabela professionals
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professionals' 
    AND column_name = 'role'
) as column_role_exists;

-- Testar as funções auxiliares
SELECT 
    'Função get_user_role()' as teste,
    get_user_role() as resultado;

SELECT 
    'Função is_admin()' as teste,
    is_admin() as resultado;

SELECT 
    'Função is_manager_or_admin()' as teste,
    is_manager_or_admin() as resultado;

-- 2. VERIFICAR SE AS POLÍTICAS RLS FORAM CRIADAS

-- Listar políticas da tabela professionals
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'professionals';

-- Listar políticas da tabela revenues
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'revenues';

-- Listar políticas da tabela expenses
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'expenses';

-- 3. VERIFICAR SE RLS ESTÁ HABILITADO

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('professionals', 'revenues', 'expenses');

-- 4. TESTAR INSERÇÃO DE DADOS DE EXEMPLO

-- Verificar se as unidades foram inseridas
SELECT 
    id,
    name,
    address,
    phone,
    active
FROM units
ORDER BY name;

-- ================================================
-- RESULTADO ESPERADO:
-- - enum_user_role_exists: true
-- - column_role_exists: true
-- - Todas as funções devem executar sem erro
-- - Deve haver 4 políticas para professionals
-- - Deve haver 4 políticas para revenues
-- - Deve haver 4 políticas para expenses
-- - rowsecurity deve ser true para todas as tabelas
-- - Deve haver 2 unidades: Mangabeiras e Nova Lima
-- ================================================