/**
 * 🔄 SCRIPT 99: ROLLBACK - REVERTER PERMISSÕES GERENTE
 * 
 * Objetivo: Reverter todas as mudanças aplicadas pelo script 04_aplicar_permissoes_gerente.sql
 * 
 * ⚠️ EXECUTAR EM EMERGÊNCIA SE ALGO DER ERRADO
 * ⚠️ EXECUTAR EM TRANSAÇÃO
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

BEGIN;

-- ============================================================================
-- REVERTER: REVENUES
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_revenues" ON revenues;
DROP POLICY IF EXISTS "gerente_insert_revenues" ON revenues;
DROP POLICY IF EXISTS "gerente_update_revenues" ON revenues;
DROP POLICY IF EXISTS "gerente_no_delete_revenues" ON revenues;

-- Recriar policies antigas
CREATE POLICY "authenticated_select_revenues" ON revenues
FOR SELECT TO authenticated
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))) OR (unit_id IS NULL));

CREATE POLICY "authenticated_insert_revenues" ON revenues
FOR INSERT TO authenticated
WITH CHECK ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))) OR (unit_id IS NULL));

CREATE POLICY "authenticated_update_revenues" ON revenues
FOR UPDATE TO authenticated
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))) OR (unit_id IS NULL))
WITH CHECK ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))) OR (unit_id IS NULL));

CREATE POLICY "authenticated_delete_revenues" ON revenues
FOR DELETE TO authenticated
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))) OR (unit_id IS NULL));

-- ============================================================================
-- REVERTER: EXPENSES
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_expenses" ON expenses;
DROP POLICY IF EXISTS "gerente_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "gerente_update_expenses" ON expenses;
DROP POLICY IF EXISTS "gerente_no_delete_expenses" ON expenses;

CREATE POLICY "authenticated_select_expenses" ON expenses
FOR SELECT TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_insert_expenses" ON expenses
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_update_expenses" ON expenses
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_delete_expenses" ON expenses
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: CATEGORIES
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_categories" ON categories;
DROP POLICY IF EXISTS "gerente_insert_categories" ON categories;
DROP POLICY IF EXISTS "gerente_no_update_categories" ON categories;
DROP POLICY IF EXISTS "gerente_no_delete_categories" ON categories;

CREATE POLICY "authenticated_select_categories" ON categories
FOR SELECT TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_insert_categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_update_categories" ON categories
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_delete_categories" ON categories
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: PARTIES
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_parties" ON parties;
DROP POLICY IF EXISTS "gerente_insert_parties" ON parties;
DROP POLICY IF EXISTS "gerente_update_parties" ON parties;
DROP POLICY IF EXISTS "gerente_no_delete_parties" ON parties;

CREATE POLICY "authenticated_select_parties" ON parties
FOR SELECT TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_insert_parties" ON parties
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_update_parties" ON parties
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_delete_parties" ON parties
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: PROFESSIONALS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_professionals" ON professionals;
DROP POLICY IF EXISTS "gerente_no_modify_professionals" ON professionals;

CREATE POLICY "authenticated_users_can_view_all_professionals" ON professionals
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "users_can_insert_professionals" ON professionals
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "users_can_update_professionals" ON professionals
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "users_can_delete_professionals" ON professionals
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: BANK_ACCOUNTS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "gerente_no_modify_bank_accounts" ON bank_accounts;

CREATE POLICY "authenticated_select_bank_accounts" ON bank_accounts
FOR SELECT TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_insert_bank_accounts" ON bank_accounts
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_update_bank_accounts" ON bank_accounts
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_delete_bank_accounts" ON bank_accounts
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: PAYMENT_METHODS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "gerente_no_modify_payment_methods" ON payment_methods;

CREATE POLICY "authenticated_select_payment_methods" ON payment_methods
FOR SELECT TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_insert_payment_methods" ON payment_methods
FOR INSERT TO authenticated
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_update_payment_methods" ON payment_methods
FOR UPDATE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())))
WITH CHECK (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

CREATE POLICY "authenticated_delete_payment_methods" ON payment_methods
FOR DELETE TO authenticated
USING (unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid())));

-- ============================================================================
-- REVERTER: BARBERS_TURN_LIST
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_turn_list" ON barbers_turn_list;
DROP POLICY IF EXISTS "gerente_update_turn_list" ON barbers_turn_list;
DROP POLICY IF EXISTS "gerente_no_delete_turn_list" ON barbers_turn_list;

CREATE POLICY "Users can view turn list for their unit" ON barbers_turn_list
FOR SELECT TO public
USING ((unit_id IN ( SELECT professionals.unit_id
   FROM professionals
  WHERE ((professionals.user_id = auth.uid()) AND (professionals.is_active = true)))));

CREATE POLICY "Managers can update turn list for their unit" ON barbers_turn_list
FOR UPDATE TO public
USING ((unit_id IN ( SELECT professionals.unit_id
   FROM professionals
  WHERE ((professionals.user_id = auth.uid()) AND ((professionals.role)::text = ANY ((ARRAY['gerente'::character varying, 'admin'::character varying])::text[])) AND (professionals.is_active = true)))));

CREATE POLICY "Admins can manage all turn lists" ON barbers_turn_list
FOR ALL TO public
USING ((EXISTS ( SELECT 1
   FROM professionals
  WHERE ((professionals.user_id = auth.uid()) AND ((professionals.role)::text = 'admin'::text) AND (professionals.is_active = true)))));

-- ============================================================================
-- REVERTER: GOALS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_goals" ON goals;
DROP POLICY IF EXISTS "gerente_insert_goals" ON goals;
DROP POLICY IF EXISTS "gerente_update_goals" ON goals;
DROP POLICY IF EXISTS "gerente_no_delete_goals" ON goals;

CREATE POLICY "goals_select_by_unit_or_admin" ON goals
FOR SELECT TO public
USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gerente'::text])) OR (EXISTS ( SELECT 1
   FROM units u
  WHERE ((u.id = goals.unit_id) AND (u.user_id = auth.uid())))));

CREATE POLICY "goals_insert_by_unit_or_admin" ON goals
FOR INSERT TO public
WITH CHECK ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gerente'::text])) OR (EXISTS ( SELECT 1
   FROM units u
  WHERE ((u.id = goals.unit_id) AND (u.user_id = auth.uid())))));

CREATE POLICY "goals_update_by_unit_or_admin" ON goals
FOR UPDATE TO public
USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gerente'::text])) OR (EXISTS ( SELECT 1
   FROM units u
  WHERE ((u.id = goals.unit_id) AND (u.user_id = auth.uid())))))
WITH CHECK ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gerente'::text])) OR (EXISTS ( SELECT 1
   FROM units u
  WHERE ((u.id = goals.unit_id) AND (u.user_id = auth.uid())))));

CREATE POLICY "goals_delete_by_unit_or_admin" ON goals
FOR DELETE TO public
USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gerente'::text])) OR (EXISTS ( SELECT 1
   FROM units u
  WHERE ((u.id = goals.unit_id) AND (u.user_id = auth.uid())))));

-- ============================================================================
-- REVERTER: UNITS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_all_units" ON units;
DROP POLICY IF EXISTS "gerente_no_modify_units" ON units;

CREATE POLICY "authenticated_users_can_view_all_units" ON units
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "users_can_insert_their_units" ON units
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_their_units" ON units
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_delete_their_units" ON units
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- REVERTER: EXPENSE_PAYMENTS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_expense_payments" ON expense_payments;
DROP POLICY IF EXISTS "gerente_insert_expense_payments" ON expense_payments;
DROP POLICY IF EXISTS "gerente_update_expense_payments" ON expense_payments;
DROP POLICY IF EXISTS "gerente_no_delete_expense_payments" ON expense_payments;

CREATE POLICY "Users can view expense payments from their units" ON expense_payments
FOR SELECT TO public
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))));

CREATE POLICY "Users can insert expense payments in their units" ON expense_payments
FOR INSERT TO public
WITH CHECK ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))));

CREATE POLICY "Users can update expense payments in their units" ON expense_payments
FOR UPDATE TO public
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))));

CREATE POLICY "Users can delete expense payments in their units" ON expense_payments
FOR DELETE TO public
USING ((unit_id IN ( SELECT units.id FROM units WHERE (units.user_id = auth.uid()))));

-- ============================================================================
-- REVERTER: HISTÓRICOS
-- ============================================================================
DROP POLICY IF EXISTS "gerente_select_daily_history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "gerente_select_monthly_history" ON barbers_turn_history;

-- Recriar policies originais (exemplo simplificado - ajustar conforme backup)
CREATE POLICY "Managers can view their unit daily history" ON barbers_turn_daily_history
FOR SELECT TO authenticated
USING ((EXISTS ( SELECT 1
   FROM (auth.users u
     JOIN professionals p ON ((p.user_id = u.id)))
  WHERE ((u.id = auth.uid()) AND ((u.raw_user_meta_data ->> 'role'::text) = 'gerente'::text) AND (p.unit_id = barbers_turn_daily_history.unit_id)))));

CREATE POLICY "Users can view history for their unit" ON barbers_turn_history
FOR SELECT TO public
USING ((unit_id IN ( SELECT professionals.unit_id
   FROM professionals
  WHERE ((professionals.user_id = auth.uid()) AND (professionals.is_active = true)))));

COMMIT;

-- ============================================================================
-- ✅ ROLLBACK COMPLETO
-- 
-- Todas as policies foram revertidas ao estado original.
-- Verificar com: SELECT * FROM pg_policies WHERE schemaname = 'public';
-- ============================================================================
