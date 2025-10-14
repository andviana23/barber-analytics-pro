-- ==========================================
-- POLÍTICAS RLS PARA PAYMENT_METHODS
-- Apenas ADMINISTRADORES podem criar/editar/excluir
-- ==========================================

-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Only admins can create payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Only admins can update payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Only admins can delete payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view payment methods from their unit" ON payment_methods;
DROP POLICY IF EXISTS "Admins and managers can create payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins and managers can update payment methods" ON payment_methods;

-- 2. POLÍTICA SELECT (Visualizar)
-- Admin vê TODAS as formas de pagamento
-- Outros usuários veem apenas da sua unidade
CREATE POLICY "Users can view payment methods from their unit"
ON payment_methods
FOR SELECT
TO public
USING (
    -- Admin vê todas as formas de pagamento
    get_user_role() = 'admin'
    
    OR
    
    -- Outros usuários veem apenas da sua unidade
    unit_id IN (
        SELECT unit_id 
        FROM professionals 
        WHERE user_id = auth.uid()
        AND unit_id IS NOT NULL
    )
);

-- 3. POLÍTICA INSERT (Criar)
-- Apenas ADMIN pode criar formas de pagamento
CREATE POLICY "Only admins can create payment methods"
ON payment_methods
FOR INSERT
TO public
WITH CHECK (
    get_user_role() = 'admin'
    AND unit_id IN (
        SELECT id 
        FROM units 
        WHERE is_active = true
    )
);

-- 4. POLÍTICA UPDATE (Editar)
-- Apenas ADMIN pode editar formas de pagamento
CREATE POLICY "Only admins can update payment methods"
ON payment_methods
FOR UPDATE
TO public
USING (
    get_user_role() = 'admin'
    AND unit_id IN (
        SELECT unit_id 
        FROM professionals 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    get_user_role() = 'admin'
    AND unit_id IN (
        SELECT id 
        FROM units 
        WHERE is_active = true
    )
);

-- 5. POLÍTICA DELETE (Excluir)
-- Apenas ADMIN pode excluir formas de pagamento
CREATE POLICY "Only admins can delete payment methods"
ON payment_methods
FOR DELETE
TO public
USING (
    get_user_role() = 'admin'
);

-- ==========================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ==========================================

SELECT 
    policyname AS "Política",
    cmd AS "Operação",
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ Visualizar'
        WHEN cmd = 'INSERT' THEN '➕ Criar'
        WHEN cmd = 'UPDATE' THEN '✏️ Editar'
        WHEN cmd = 'DELETE' THEN '🗑️ Excluir'
    END AS "Ação",
    CASE 
        WHEN policyname LIKE '%admin%' AND cmd != 'SELECT' THEN '🔒 Apenas Admin'
        WHEN cmd = 'SELECT' THEN '👁️ Admin: Todas | Outros: Sua unidade'
        ELSE '❓ Verificar'
    END AS "Permissão"
FROM 
    pg_policies
WHERE 
    tablename = 'payment_methods'
ORDER BY 
    CASE cmd 
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
    END;

-- ==========================================
-- RESULTADO ESPERADO:
-- ==========================================
-- | Política                                         | Operação | Ação          | Permissão                            |
-- |--------------------------------------------------|----------|---------------|--------------------------------------|
-- | Users can view payment methods from their unit   | SELECT   | 👁️ Visualizar | 👁️ Admin: Todas | Outros: Sua unidade |
-- | Only admins can create payment methods           | INSERT   | ➕ Criar      | 🔒 Apenas Admin                      |
-- | Only admins can update payment methods           | UPDATE   | ✏️ Editar     | 🔒 Apenas Admin                      |
-- | Only admins can delete payment methods           | DELETE   | 🗑️ Excluir    | 🔒 Apenas Admin                      |
