-- ========================================
-- Migration: Update Revenues RLS Policies
-- Date: 2025-10-13
-- Description: Remove professional_id dependency and use account_id
-- ========================================

-- ========================================
-- DROP OLD POLICIES
-- ========================================

DROP POLICY IF EXISTS revenues_insert_policy ON revenues;
DROP POLICY IF EXISTS revenues_select_policy ON revenues;
DROP POLICY IF EXISTS revenues_update_policy ON revenues;
DROP POLICY IF EXISTS revenues_delete_policy ON revenues;

-- ========================================
-- CREATE NEW POLICIES (account_id based)
-- ========================================

-- INSERT POLICY
-- Admin can insert anywhere, managers and barbers only in their unit
CREATE POLICY revenues_insert_policy ON revenues
FOR INSERT
WITH CHECK (
    -- Admin pode inserir em qualquer unidade
    is_admin() 
    OR 
    -- Gerente pode inserir na própria unidade
    (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR
    -- Barbeiro pode inserir receitas da própria unidade
    (unit_id = get_user_unit_id())
);

-- SELECT POLICY
-- Users can only see revenues from their unit (except admins)
CREATE POLICY revenues_select_policy ON revenues
FOR SELECT
USING (
    -- Admin vê tudo
    is_admin() 
    OR 
    -- Gerente vê da própria unidade
    (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR
    -- Barbeiro vê da própria unidade
    (unit_id = get_user_unit_id())
);

-- UPDATE POLICY
-- Users can update revenues from their unit
CREATE POLICY revenues_update_policy ON revenues
FOR UPDATE
USING (
    -- Admin pode atualizar tudo
    is_admin() 
    OR 
    -- Gerente pode atualizar da própria unidade
    (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR
    -- Barbeiro pode atualizar da própria unidade
    (unit_id = get_user_unit_id())
);

-- DELETE POLICY
-- Only admins and managers can delete
CREATE POLICY revenues_delete_policy ON revenues
FOR DELETE
USING (
    -- Admin pode deletar tudo
    is_admin() 
    OR 
    -- Gerente pode deletar da própria unidade
    (is_gerente_or_admin() AND unit_id = get_user_unit_id())
);

-- ========================================
-- VERIFY POLICIES
-- ========================================

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual 
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'revenues'
    AND policyname LIKE '%_policy'
ORDER BY cmd, policyname;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON POLICY revenues_insert_policy ON revenues IS 
'Allows admins to insert anywhere, managers and barbers only in their own unit. Uses account_id instead of professional_id.';

COMMENT ON POLICY revenues_select_policy ON revenues IS 
'Allows users to view revenues from their unit (unit_id based, not professional_id).';

COMMENT ON POLICY revenues_update_policy ON revenues IS 
'Allows admins, managers, and barbers to update revenues from their unit.';

COMMENT ON POLICY revenues_delete_policy ON revenues IS 
'Only admins and managers can delete revenues from their unit. Barbers cannot delete.';
