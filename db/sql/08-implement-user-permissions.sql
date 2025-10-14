-- ================================================
-- SISTEMA DE PERMISSÕES POR PERFIL
-- Implementação de Admin, Manager, Barber roles
-- Data: 2025-10-11
-- ================================================

-- 1. CRIAR ENUM PARA PERFIS DE USUÁRIO (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'manager', 'barber');
    END IF;
END $$;

-- 2. VERIFICAR SE COLUNA ROLE EXISTE NA TABELA PROFESSIONALS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'professionals' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE professionals 
        ADD COLUMN role user_role DEFAULT 'barber';
    END IF;
END $$;

-- 3. ATUALIZAR PERFIS EXISTENTES (ASSUMINDO QUE JÁ EXISTEM DADOS)
-- Admin: usuário principal do sistema
-- Manager: gerente de cada unidade  
-- Barber: barbeiros

-- Exemplo de como definir um admin (substitua pelo user_id real)
-- UPDATE professionals 
-- SET role = 'admin' 
-- WHERE user_id = 'seu-user-id-admin-aqui';

-- Exemplo de como definir managers
-- UPDATE professionals 
-- SET role = 'manager' 
-- WHERE position = 'Gerente' OR position ILIKE '%gerente%';

-- 4. CRIAR FUNÇÕES AUXILIARES PARA VERIFICAR PERMISSÕES

-- Função para obter o role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(
        (SELECT role FROM professionals WHERE user_id = auth.uid()),
        'barber'::user_role
    );
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT get_user_role() = 'admin';
$$;

-- Função para verificar se usuário é manager ou admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT get_user_role() IN ('admin', 'manager');
$$;

-- Função para obter a unit_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_unit_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT unit_id FROM professionals WHERE user_id = auth.uid();
$$;

-- 5. POLÍTICAS RLS PARA TABELA PROFESSIONALS

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "professionals_select_policy" ON professionals;
DROP POLICY IF EXISTS "professionals_insert_policy" ON professionals;
DROP POLICY IF EXISTS "professionals_update_policy" ON professionals;
DROP POLICY IF EXISTS "professionals_delete_policy" ON professionals;

-- Habilitar RLS
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

-- SELECT: 
-- - Admin vê todos
-- - Manager vê apenas sua unidade  
-- - Barber vê apenas seus próprios dados
CREATE POLICY "professionals_select_policy" ON professionals
    FOR SELECT
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        user_id = auth.uid()
    );

-- INSERT:
-- - Admin pode inserir qualquer professional
-- - Manager pode inserir professionals em sua unidade
-- - Barber não pode inserir
CREATE POLICY "professionals_insert_policy" ON professionals
    FOR INSERT
    WITH CHECK (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id())
    );

-- UPDATE:
-- - Admin pode atualizar qualquer professional
-- - Manager pode atualizar professionals em sua unidade
-- - Barber pode atualizar apenas seus próprios dados (exceto role e unit_id)
CREATE POLICY "professionals_update_policy" ON professionals
    FOR UPDATE
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        user_id = auth.uid()
    )
    WITH CHECK (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        (user_id = auth.uid() AND unit_id = get_user_unit_id() AND role = get_user_role())
    );

-- DELETE:
-- - Apenas Admin pode deletar
CREATE POLICY "professionals_delete_policy" ON professionals
    FOR DELETE
    USING (is_admin());

-- 6. POLÍTICAS RLS PARA TABELA REVENUES

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "revenues_select_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_insert_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_update_policy" ON revenues;
DROP POLICY IF EXISTS "revenues_delete_policy" ON revenues;

-- Habilitar RLS
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- SELECT: 
-- - Admin vê todas
-- - Manager vê apenas de sua unidade
-- - Barber vê apenas suas próprias receitas
CREATE POLICY "revenues_select_policy" ON revenues
    FOR SELECT
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        professional_id = (SELECT id FROM professionals WHERE user_id = auth.uid())
    );

-- INSERT:
-- - Admin pode inserir qualquer receita
-- - Manager pode inserir receitas em sua unidade
-- - Barber pode inserir apenas suas próprias receitas
CREATE POLICY "revenues_insert_policy" ON revenues
    FOR INSERT
    WITH CHECK (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        (professional_id = (SELECT id FROM professionals WHERE user_id = auth.uid()) 
         AND unit_id = get_user_unit_id())
    );

-- UPDATE:
-- - Admin pode atualizar qualquer receita
-- - Manager pode atualizar receitas em sua unidade
-- - Barber pode atualizar apenas suas próprias receitas
CREATE POLICY "revenues_update_policy" ON revenues
    FOR UPDATE
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id()) OR
        professional_id = (SELECT id FROM professionals WHERE user_id = auth.uid())
    );

-- DELETE:
-- - Admin pode deletar qualquer receita
-- - Manager pode deletar receitas em sua unidade (com restrições)
CREATE POLICY "revenues_delete_policy" ON revenues
    FOR DELETE
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id())
    );

-- 7. POLÍTICAS RLS PARA TABELA EXPENSES

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "expenses_select_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;

-- Habilitar RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- SELECT: 
-- - Admin vê todas
-- - Manager vê apenas de sua unidade
-- - Barber não vê despesas (apenas receitas próprias)
CREATE POLICY "expenses_select_policy" ON expenses
    FOR SELECT
    USING (
        is_admin() OR
        (is_manager_or_admin() AND unit_id = get_user_unit_id())
    );

-- INSERT/UPDATE/DELETE:
-- - Apenas Admin e Manager podem gerenciar despesas
CREATE POLICY "expenses_insert_policy" ON expenses
    FOR INSERT
    WITH CHECK (is_manager_or_admin());

CREATE POLICY "expenses_update_policy" ON expenses
    FOR UPDATE
    USING (is_manager_or_admin());

CREATE POLICY "expenses_delete_policy" ON expenses
    FOR DELETE
    USING (is_manager_or_admin());

-- 8. GRANTS PARA API USAGE

-- Garantir que authenticated users possam executar as funções
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_manager_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unit_id() TO authenticated;

-- 9. COMENTÁRIOS DE DOCUMENTAÇÃO

COMMENT ON FUNCTION get_user_role() IS 'Retorna o role do usuário autenticado atual';
COMMENT ON FUNCTION is_admin() IS 'Verifica se o usuário atual é admin';
COMMENT ON FUNCTION is_manager_or_admin() IS 'Verifica se o usuário atual é manager ou admin';
COMMENT ON FUNCTION get_user_unit_id() IS 'Retorna a unit_id do usuário autenticado atual';

-- 10. INSERIR DADOS DE EXEMPLO (OPCIONAL - REMOVER EM PRODUÇÃO)

-- Exemplo: inserir unidades se não existirem
INSERT INTO units (id, name, address, phone, active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Mangabeiras', 'Rua das Mangabeiras, 123', '(31) 99999-0001', true),
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'Nova Lima', 'Av. Nova Lima, 456', '(31) 99999-0002', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- FIM DO SCRIPT DE PERMISSÕES
-- ================================================