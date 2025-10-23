-- ============================================================================
-- 🔧 CORREÇÃO: ATUALIZAR RLS POLICIES PARA USAR get_user_role()
-- ============================================================================
--
-- Este script atualiza TODAS as 36 políticas RLS para o papel gerente
-- para usar a função helper get_user_role() que acessa corretamente
-- a role do user_metadata no JWT do Supabase.
--
-- ANTES: (auth.jwt() ->> 'role') = 'gerente'  ❌
-- DEPOIS: (get_user_role() = 'gerente')       ✅
--
-- @author Andrey Viana
-- @date 2025-10-23
-- ============================================================================

BEGIN;

-- ============================================================================
-- REVENUES (Receitas)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_revenues ON revenues;
CREATE POLICY gerente_select_revenues
ON revenues FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_revenues ON revenues;
CREATE POLICY gerente_insert_revenues
ON revenues FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_update_revenues ON revenues;
CREATE POLICY gerente_update_revenues
ON revenues FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_revenues ON revenues;
CREATE POLICY gerente_no_delete_revenues
ON revenues FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- EXPENSES (Despesas)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_expenses ON expenses;
CREATE POLICY gerente_select_expenses
ON expenses FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_expenses ON expenses;
CREATE POLICY gerente_insert_expenses
ON expenses FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_update_expenses ON expenses;
CREATE POLICY gerente_update_expenses
ON expenses FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_expenses ON expenses;
CREATE POLICY gerente_no_delete_expenses
ON expenses FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- CATEGORIES (Categorias)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_categories ON categories;
CREATE POLICY gerente_select_categories
ON categories FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_categories ON categories;
CREATE POLICY gerente_insert_categories
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_update_categories ON categories;
CREATE POLICY gerente_no_update_categories
ON categories FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_categories ON categories;
CREATE POLICY gerente_no_delete_categories
ON categories FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- PARTIES (Clientes/Fornecedores)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_parties ON parties;
CREATE POLICY gerente_select_parties
ON parties FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_parties ON parties;
CREATE POLICY gerente_insert_parties
ON parties FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_update_parties ON parties;
CREATE POLICY gerente_update_parties
ON parties FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_parties ON parties;
CREATE POLICY gerente_no_delete_parties
ON parties FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- GOALS (Metas)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_goals ON goals;
CREATE POLICY gerente_select_goals
ON goals FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_goals ON goals;
CREATE POLICY gerente_insert_goals
ON goals FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_update_goals ON goals;
CREATE POLICY gerente_update_goals
ON goals FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_goals ON goals;
CREATE POLICY gerente_no_delete_goals
ON goals FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- EXPENSE_PAYMENTS (Parcelas de Despesas)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_expense_payments ON expense_payments;
CREATE POLICY gerente_select_expense_payments
ON expense_payments FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_insert_expense_payments ON expense_payments;
CREATE POLICY gerente_insert_expense_payments
ON expense_payments FOR INSERT
TO authenticated
WITH CHECK (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_update_expense_payments ON expense_payments;
CREATE POLICY gerente_update_expense_payments
ON expense_payments FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_delete_expense_payments ON expense_payments;
CREATE POLICY gerente_no_delete_expense_payments
ON expense_payments FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- BARBERS_TURN_LIST (Lista da Vez)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_turn_list ON barbers_turn_list;
CREATE POLICY gerente_select_turn_list
ON barbers_turn_list FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (
    SELECT p.unit_id FROM professionals p 
    WHERE p.user_id = auth.uid() AND p.is_active = true
  ))
);

DROP POLICY IF EXISTS gerente_update_turn_list ON barbers_turn_list;
CREATE POLICY gerente_update_turn_list
ON barbers_turn_list FOR UPDATE
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (get_user_role() = 'receptionist')
);

DROP POLICY IF EXISTS gerente_no_insert_turn_list ON barbers_turn_list;
CREATE POLICY gerente_no_insert_turn_list
ON barbers_turn_list FOR INSERT
TO authenticated
WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS gerente_no_delete_turn_list ON barbers_turn_list;
CREATE POLICY gerente_no_delete_turn_list
ON barbers_turn_list FOR DELETE
TO authenticated
USING (get_user_role() = 'admin');

-- ============================================================================
-- PROFESSIONALS (apenas leitura)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_professionals ON professionals;
CREATE POLICY gerente_select_professionals
ON professionals FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_modify_professionals ON professionals;
CREATE POLICY gerente_no_modify_professionals
ON professionals FOR ALL
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

-- ============================================================================
-- UNITS (apenas leitura para todos)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_all_units ON units;
CREATE POLICY gerente_select_all_units
ON units FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS gerente_no_modify_units ON units;
CREATE POLICY gerente_no_modify_units
ON units FOR ALL
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR
  (user_id = auth.uid())
);

-- ============================================================================
-- PAYMENT_METHODS (apenas leitura)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_payment_methods ON payment_methods;
CREATE POLICY gerente_select_payment_methods
ON payment_methods FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_modify_payment_methods ON payment_methods;
CREATE POLICY gerente_no_modify_payment_methods
ON payment_methods FOR ALL
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

-- ============================================================================
-- BANK_ACCOUNTS (apenas leitura)
-- ============================================================================

DROP POLICY IF EXISTS gerente_select_bank_accounts ON bank_accounts;
CREATE POLICY gerente_select_bank_accounts
ON bank_accounts FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR 
  (
    (get_user_role() = 'gerente') 
    AND 
    (unit_id IN (
      SELECT p.unit_id FROM professionals p 
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS gerente_no_modify_bank_accounts ON bank_accounts;
CREATE POLICY gerente_no_modify_bank_accounts
ON bank_accounts FOR ALL
TO authenticated
USING (
  (get_user_role() = 'admin') 
  OR
  (unit_id IN (SELECT id FROM units WHERE user_id = auth.uid()))
);

COMMIT;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT 
    'RLS Policies Atualizadas' AS status,
    COUNT(*) AS total_policies
FROM pg_policies
WHERE policyname ILIKE '%gerente%';
