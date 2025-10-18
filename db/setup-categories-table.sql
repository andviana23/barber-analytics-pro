-- Script para verificar e corrigir a estrutura da tabela categories
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================

-- Ver todas as colunas da tabela categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- =====================================================
-- 2. VERIFICAR SE A TABELA EXISTE
-- =====================================================

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'categories'
) AS table_exists;

-- =====================================================
-- 3. CRIAR TABELA SE NÃO EXISTIR
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) >= 2),
    description TEXT,
    category_type VARCHAR(20) NOT NULL CHECK (category_type IN ('Revenue', 'Expense')),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. CRIAR ÍNDICES (SE NÃO EXISTIREM)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_unit_type 
    ON categories (unit_id, category_type) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_categories_name_search 
    ON categories (name);

CREATE INDEX IF NOT EXISTS idx_categories_parent 
    ON categories (parent_id) 
    WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_active 
    ON categories (unit_id, category_type, is_active);

-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR POLÍTICAS RLS (SE NÃO EXISTIREM)
-- =====================================================

-- Política para SELECT
DROP POLICY IF EXISTS "Users can view categories from their units" ON categories;
CREATE POLICY "Users can view categories from their units"
ON categories FOR SELECT
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Política para INSERT
DROP POLICY IF EXISTS "Users can insert categories in their units" ON categories;
CREATE POLICY "Users can insert categories in their units"
ON categories FOR INSERT
WITH CHECK (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Política para UPDATE
DROP POLICY IF EXISTS "Users can update categories in their units" ON categories;
CREATE POLICY "Users can update categories in their units"
ON categories FOR UPDATE
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Política para DELETE
DROP POLICY IF EXISTS "Users can delete categories in their units" ON categories;
CREATE POLICY "Users can delete categories in their units"
ON categories FOR DELETE
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- 7. CRIAR TRIGGER PARA updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INSERIR CATEGORIAS PADRÃO (EXEMPLO)
-- =====================================================

-- IMPORTANTE: Substitua 'YOUR_UNIT_ID' pelo ID real da sua unidade
-- Para pegar o unit_id: SELECT id FROM units LIMIT 1;

DO $$
DECLARE
    v_unit_id UUID;
    v_servicos_id UUID;
    v_produtos_id UUID;
    v_despesas_op_id UUID;
    v_despesas_pessoal_id UUID;
BEGIN
    -- Buscar a primeira unidade (ajuste conforme necessário)
    SELECT id INTO v_unit_id FROM units LIMIT 1;
    
    IF v_unit_id IS NULL THEN
        RAISE NOTICE 'Nenhuma unidade encontrada. Crie uma unidade primeiro.';
        RETURN;
    END IF;

    -- Verificar se já existem categorias
    IF EXISTS (SELECT 1 FROM categories WHERE unit_id = v_unit_id) THEN
        RAISE NOTICE 'Categorias já existem para esta unidade.';
        RETURN;
    END IF;

    -- ===== CATEGORIAS DE RECEITA =====
    
    -- Serviços (pai)
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES (v_unit_id, 'Serviços', 'Receitas provenientes de serviços prestados', 'Revenue', NULL)
    RETURNING id INTO v_servicos_id;
    
    -- Subcategorias de Serviços
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES 
        (v_unit_id, 'Corte de Cabelo', 'Serviços de corte', 'Revenue', v_servicos_id),
        (v_unit_id, 'Barba', 'Serviços de barba', 'Revenue', v_servicos_id),
        (v_unit_id, 'Coloração', 'Serviços de coloração', 'Revenue', v_servicos_id),
        (v_unit_id, 'Outros Serviços', 'Outros serviços diversos', 'Revenue', v_servicos_id);
    
    -- Produtos (pai)
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES (v_unit_id, 'Produtos', 'Receitas de venda de produtos', 'Revenue', NULL)
    RETURNING id INTO v_produtos_id;
    
    -- Subcategorias de Produtos
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES 
        (v_unit_id, 'Cosméticos', 'Produtos cosméticos', 'Revenue', v_produtos_id),
        (v_unit_id, 'Acessórios', 'Acessórios diversos', 'Revenue', v_produtos_id);

    -- ===== CATEGORIAS DE DESPESA =====
    
    -- Despesas Operacionais (pai)
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES (v_unit_id, 'Despesas Operacionais', 'Despesas gerais de operação', 'Expense', NULL)
    RETURNING id INTO v_despesas_op_id;
    
    -- Subcategorias de Despesas Operacionais
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES 
        (v_unit_id, 'Aluguel', 'Aluguel do estabelecimento', 'Expense', v_despesas_op_id),
        (v_unit_id, 'Energia', 'Conta de energia elétrica', 'Expense', v_despesas_op_id),
        (v_unit_id, 'Água', 'Conta de água', 'Expense', v_despesas_op_id),
        (v_unit_id, 'Internet', 'Serviços de internet', 'Expense', v_despesas_op_id),
        (v_unit_id, 'Material de Limpeza', 'Produtos de limpeza', 'Expense', v_despesas_op_id);
    
    -- Pessoal (pai)
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES (v_unit_id, 'Pessoal', 'Despesas com pessoal', 'Expense', NULL)
    RETURNING id INTO v_despesas_pessoal_id;
    
    -- Subcategorias de Pessoal
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES 
        (v_unit_id, 'Salários', 'Salários de funcionários', 'Expense', v_despesas_pessoal_id),
        (v_unit_id, 'Encargos', 'Encargos sociais', 'Expense', v_despesas_pessoal_id),
        (v_unit_id, 'Comissões', 'Comissões de barbeiros', 'Expense', v_despesas_pessoal_id);
    
    -- Compras de Insumos (pai)
    INSERT INTO categories (unit_id, name, description, category_type, parent_id)
    VALUES (v_unit_id, 'Compra de Insumos', 'Compra de produtos e materiais', 'Expense', NULL);

    RAISE NOTICE 'Categorias padrão criadas com sucesso para unit_id: %', v_unit_id;
END $$;

-- =====================================================
-- 9. VERIFICAR CATEGORIAS CRIADAS
-- =====================================================

SELECT 
    c.id,
    c.name,
    c.category_type,
    p.name as parent_name,
    c.is_active,
    c.created_at
FROM categories c
LEFT JOIN categories p ON p.id = c.parent_id
ORDER BY c.category_type, c.parent_id NULLS FIRST, c.name;

-- =====================================================
-- 10. ESTATÍSTICAS
-- =====================================================

-- Total de categorias por tipo
SELECT 
    category_type,
    COUNT(*) as total,
    COUNT(parent_id) as subcategorias,
    COUNT(*) - COUNT(parent_id) as categorias_pai
FROM categories
WHERE is_active = true
GROUP BY category_type;
