-- Script para verificar e criar Foreign Keys para Categories
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- 1. VERIFICAR FOREIGN KEYS EXISTENTES
-- =====================================================

-- Ver todas as FKs das tabelas revenues e expenses
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('revenues', 'expenses');

-- =====================================================
-- 2. VERIFICAR SE A COLUNA category_id EXISTE
-- =====================================================

-- Verificar estrutura da tabela revenues
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'revenues'
    AND column_name = 'category_id';

-- Verificar estrutura da tabela expenses
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses'
    AND column_name = 'category_id';

-- =====================================================
-- 3. CRIAR FOREIGN KEYS (SE NÃO EXISTIREM)
-- =====================================================

-- IMPORTANTE: Execute APENAS se as FKs não existirem

-- FK para revenues
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'revenues_category_id_fkey'
            AND table_name = 'revenues'
    ) THEN
        ALTER TABLE revenues
        ADD CONSTRAINT revenues_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'FK revenues_category_id_fkey criada com sucesso';
    ELSE
        RAISE NOTICE 'FK revenues_category_id_fkey já existe';
    END IF;
END $$;

-- FK para expenses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'expenses_category_id_fkey'
            AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'FK expenses_category_id_fkey criada com sucesso';
    ELSE
        RAISE NOTICE 'FK expenses_category_id_fkey já existe';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR SE AS FKs FORAM CRIADAS
-- =====================================================

SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('revenues', 'expenses')
    AND kcu.column_name = 'category_id';

-- =====================================================
-- 5. VERIFICAR DADOS (OPCIONAL)
-- =====================================================

-- Ver quantas receitas têm categoria
SELECT 
    COUNT(*) as total_revenues,
    COUNT(category_id) as com_categoria,
    COUNT(*) - COUNT(category_id) as sem_categoria
FROM revenues
WHERE is_active = true;

-- Ver quantas despesas têm categoria
SELECT 
    COUNT(*) as total_expenses,
    COUNT(category_id) as com_categoria,
    COUNT(*) - COUNT(category_id) as sem_categoria
FROM expenses
WHERE is_active = true;

-- Ver categorias mais usadas em receitas
SELECT 
    c.name as categoria,
    COUNT(r.id) as quantidade,
    SUM(r.value) as valor_total
FROM revenues r
LEFT JOIN categories c ON c.id = r.category_id
WHERE r.is_active = true
GROUP BY c.name
ORDER BY quantidade DESC
LIMIT 10;

-- Ver categorias mais usadas em despesas
SELECT 
    c.name as categoria,
    COUNT(d.id) as quantidade,
    SUM(d.value) as valor_total
FROM expenses d
LEFT JOIN categories c ON c.id = d.category_id
WHERE d.is_active = true
GROUP BY c.name
ORDER BY quantidade DESC
LIMIT 10;
