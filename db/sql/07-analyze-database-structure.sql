-- ================================================
-- ANÁLISE E IMPLEMENTAÇÃO DAS TABELAS DO SISTEMA
-- Barber Analytics Pro - Supabase Database
-- Data: 2025-10-11
-- ================================================

-- VERIFICAÇÃO DO ESTADO ATUAL DAS TABELAS
-- Execute este script no SQL Editor do Supabase para analisar a estrutura

-- 1. VERIFICAR TABELAS EXISTENTES
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFICAR ESTRUTURA DA TABELA UNITS (UNIDADES)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'units'
ORDER BY ordinal_position;

-- 3. VERIFICAR ESTRUTURA DA TABELA PROFESSIONALS (PROFISSIONAIS)  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'professionals'
ORDER BY ordinal_position;

-- 4. VERIFICAR ESTRUTURA DA TABELA REVENUES (RECEITAS)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'revenues'
ORDER BY ordinal_position;

-- 5. VERIFICAR ESTRUTURA DA TABELA EXPENSES (DESPESAS)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'expenses'
ORDER BY ordinal_position;

-- 6. VERIFICAR RLS (ROW LEVEL SECURITY) ATIVO
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    relname
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. LISTAR POLICIES EXISTENTES
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;