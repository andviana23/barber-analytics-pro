-- =====================================================
-- FIX: Row Level Security para cash_registers
-- =====================================================
-- Problema: "new row violates row-level security policy"
-- Solução: Atualizar políticas RLS para permitir INSERT
-- Data: 28/10/2025
-- =====================================================

-- 1. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view cash registers of their unit" ON cash_registers;
DROP POLICY IF EXISTS "Users can insert cash registers for their unit" ON cash_registers;
DROP POLICY IF EXISTS "Users can update cash registers of their unit" ON cash_registers;
DROP POLICY IF EXISTS "Managers can view all cash registers" ON cash_registers;
DROP POLICY IF EXISTS "Managers can manage all cash registers" ON cash_registers;

-- 2. Verificar se RLS está habilitado
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- 3. POLICY: SELECT - Visualizar caixas da unidade do usuário
CREATE POLICY "Users can view cash registers of their unit"
ON cash_registers
FOR SELECT
USING (
  -- Admin vê todos
  (auth.jwt()->>'role' = 'admin')
  OR
  -- Gerente vê todos da unidade
  (
    auth.jwt()->>'role' = 'gerente' 
    AND unit_id IN (
      SELECT unit_id FROM professionals WHERE user_id = auth.uid()
    )
  )
  OR
  -- Usuários veem apenas os que foram abertos por eles ou da sua unidade
  (
    unit_id IN (
      SELECT unit_id FROM professionals WHERE user_id = auth.uid()
    )
  )
);

-- 4. POLICY: INSERT - Criar novos caixas
CREATE POLICY "Users can insert cash registers for their unit"
ON cash_registers
FOR INSERT
WITH CHECK (
  -- Verificar se o usuário está autenticado
  auth.uid() IS NOT NULL
  AND
  (
    -- Admin pode criar para qualquer unidade
    (auth.jwt()->>'role' = 'admin')
    OR
    -- Gerente e outros podem criar apenas para unidades onde trabalham
    (
      unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
      AND
      -- E o opened_by deve ser o próprio usuário
      opened_by = auth.uid()
    )
  )
);

-- 5. POLICY: UPDATE - Atualizar caixas existentes
CREATE POLICY "Users can update cash registers of their unit"
ON cash_registers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND
  (
    -- Admin pode atualizar tudo
    (auth.jwt()->>'role' = 'admin')
    OR
    -- Gerente pode atualizar caixas da sua unidade
    (
      auth.jwt()->>'role' = 'gerente'
      AND unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
    OR
    -- Usuários podem atualizar apenas caixas que abriram
    (
      opened_by = auth.uid()
      AND unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND
  (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
      unit_id IN (
        SELECT unit_id FROM professionals WHERE user_id = auth.uid()
      )
    )
  )
);

-- 6. POLICY: DELETE - Soft delete (is_active = false)
-- Normalmente não permitimos DELETE, mas se necessário:
CREATE POLICY "Admins can delete cash registers"
ON cash_registers
FOR DELETE
USING (
  auth.jwt()->>'role' = 'admin'
);

-- =====================================================
-- VERIFICAÇÕES E TESTES
-- =====================================================

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cash_registers'
ORDER BY policyname;

-- Testar se a tabela tem RLS habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'cash_registers';

-- =====================================================
-- GRANTS (Permissões básicas)
-- =====================================================

-- Garantir que authenticated users têm permissões básicas
GRANT SELECT, INSERT, UPDATE ON cash_registers TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE cash_registers_id_seq TO authenticated;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. As políticas agora permitem:
--    - Admin: acesso total
--    - Gerente: acesso total à sua unidade
--    - Usuários: podem criar/editar caixas da sua unidade
--
-- 2. Validações importantes:
--    - opened_by DEVE ser o auth.uid() no INSERT
--    - unit_id DEVE ser da unidade onde o usuário trabalha
--    - Apenas um caixa aberto por vez (validado no service)
--
-- 3. Para executar este script:
--    - No Supabase SQL Editor
--    - Ou via Supabase CLI: supabase db reset
--
-- =====================================================
