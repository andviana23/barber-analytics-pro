/**
 * 🔐 SCRIPT 04: APLICAR PERMISSÕES PARA PAPEL GERENTE
 * 
 * Objetivo: Implementar permissões mínimas e seguras para usuários com papel 'gerente'.
 * 
 * ⚠️ MODO: MODIFICAÇÃO (DROP/CREATE POLICIES)
 * ⚠️ EXECUTAR EM TRANSAÇÃO
 * ⚠️ BACKUP OBRIGATÓRIO ANTES DE EXECUTAR
 * 
 * PERMISSÕES CONCEDIDAS:
 * ✅ Receitas (revenues): SELECT, INSERT, UPDATE (somente da sua unidade)
 * ✅ Despesas (expenses): SELECT, INSERT, UPDATE (somente da sua unidade)
 * ✅ Baixas (expense_payments): SELECT, INSERT, UPDATE
 * ✅ Categorias (categories): SELECT, INSERT (somente da sua unidade)
 * ✅ Clientes/Fornecedores (parties): SELECT, INSERT (somente da sua unidade)
 * ✅ Profissionais (professionals): SELECT (somente da sua unidade)
 * ✅ Formas Pagamento (payment_methods): SELECT (somente da sua unidade)
 * ✅ Contas Bancárias (bank_accounts): SELECT (somente da sua unidade)
 * ✅ Lista da Vez (barbers_turn_list): SELECT, UPDATE (somente da sua unidade)
 * ✅ Metas (goals): SELECT, INSERT, UPDATE (somente da sua unidade)
 * ✅ Unidades (units): SELECT (todas para seletor)
 * ✅ TODAS as Views: SELECT (para Dashboard/Relatórios)
 * 
 * PERMISSÕES NEGADAS:
 * ❌ DELETE em todas as tabelas críticas
 * ❌ Acesso a subscriptions, products, bank_statements, reconciliations
 * ❌ Acesso a logs administrativos (access_logs, asaas_webhook_logs)
 * ❌ Modificação de units, professionals, bank_accounts
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- INÍCIO DA TRANSAÇÃO (ROLLBACK AUTOMÁTICO EM CASO DE ERRO)
-- ============================================================================
BEGIN;

-- ============================================================================
-- BLOCO 1: REVENUES (RECEITAS) - FINANCEIRO AVANÇADO
-- ============================================================================

-- DROP policies antigas genéricas
DROP POLICY IF EXISTS "authenticated_select_revenues" ON revenues;
DROP POLICY IF EXISTS "authenticated_insert_revenues" ON revenues;
DROP POLICY IF EXISTS "authenticated_update_revenues" ON revenues;
DROP POLICY IF EXISTS "authenticated_delete_revenues" ON revenues;

-- ✅ GERENTE pode visualizar receitas da sua unidade
CREATE POLICY "gerente_select_revenues" ON revenues
FOR SELECT
TO authenticated
USING (
    -- Admin vê tudo
    (auth.jwt()->>'role' = 'admin')
    OR
    -- Gerente vê apenas da sua unidade
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    -- Proprietário vê da sua unidade
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode inserir receitas na sua unidade
CREATE POLICY "gerente_insert_revenues" ON revenues
FOR INSERT
TO authenticated
WITH CHECK (
    -- Admin pode inserir em qualquer unidade
    (auth.jwt()->>'role' = 'admin')
    OR
    -- Gerente só pode inserir na sua unidade
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    -- Proprietário pode inserir na sua unidade
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar receitas da sua unidade
CREATE POLICY "gerente_update_revenues" ON revenues
FOR UPDATE
TO authenticated
USING (
    -- Admin pode atualizar tudo
    (auth.jwt()->>'role' = 'admin')
    OR
    -- Gerente só pode atualizar da sua unidade
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    -- Proprietário pode atualizar da sua unidade
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
)
WITH CHECK (
    -- Mesma lógica para o novo valor
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR RECEITAS (apenas admin)
CREATE POLICY "gerente_no_delete_revenues" ON revenues
FOR DELETE
TO authenticated
USING (
    auth.jwt()->>'role' = 'admin'
);

-- ============================================================================
-- BLOCO 2: EXPENSES (DESPESAS) - FINANCEIRO AVANÇADO
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_expenses" ON expenses;
DROP POLICY IF EXISTS "authenticated_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "authenticated_update_expenses" ON expenses;
DROP POLICY IF EXISTS "authenticated_delete_expenses" ON expenses;

-- ✅ GERENTE pode visualizar despesas da sua unidade
CREATE POLICY "gerente_select_expenses" ON expenses
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode inserir despesas na sua unidade
CREATE POLICY "gerente_insert_expenses" ON expenses
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar despesas da sua unidade
CREATE POLICY "gerente_update_expenses" ON expenses
FOR UPDATE
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
)
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR DESPESAS
CREATE POLICY "gerente_no_delete_expenses" ON expenses
FOR DELETE
TO authenticated
USING (
    auth.jwt()->>'role' = 'admin'
);

-- ============================================================================
-- BLOCO 3: CATEGORIES (CATEGORIAS) - CADASTROS
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_insert_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_update_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_delete_categories" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

-- ✅ GERENTE pode visualizar categorias da sua unidade
CREATE POLICY "gerente_select_categories" ON categories
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode criar categorias na sua unidade
CREATE POLICY "gerente_insert_categories" ON categories
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE ATUALIZAR/DELETAR CATEGORIAS (risco de inconsistência)
CREATE POLICY "gerente_no_update_categories" ON categories
FOR UPDATE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "gerente_no_delete_categories" ON categories
FOR DELETE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 4: PARTIES (CLIENTES/FORNECEDORES) - CADASTROS
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_parties" ON parties;
DROP POLICY IF EXISTS "authenticated_insert_parties" ON parties;
DROP POLICY IF EXISTS "authenticated_update_parties" ON parties;
DROP POLICY IF EXISTS "authenticated_delete_parties" ON parties;

-- ✅ GERENTE pode visualizar clientes/fornecedores da sua unidade
CREATE POLICY "gerente_select_parties" ON parties
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode criar clientes/fornecedores na sua unidade
CREATE POLICY "gerente_insert_parties" ON parties
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar clientes/fornecedores da sua unidade
CREATE POLICY "gerente_update_parties" ON parties
FOR UPDATE
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR PARTIES
CREATE POLICY "gerente_no_delete_parties" ON parties
FOR DELETE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 5: PROFESSIONALS (PROFISSIONAIS) - CADASTROS (SOMENTE LEITURA)
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_users_can_view_all_professionals" ON professionals;
DROP POLICY IF EXISTS "users_can_insert_professionals" ON professionals;
DROP POLICY IF EXISTS "users_can_update_professionals" ON professionals;
DROP POLICY IF EXISTS "users_can_delete_professionals" ON professionals;

-- ✅ GERENTE pode visualizar profissionais da sua unidade
CREATE POLICY "gerente_select_professionals" ON professionals
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE MODIFICAR PROFISSIONAIS (apenas admin)
CREATE POLICY "gerente_no_modify_professionals" ON professionals
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 6: BANK_ACCOUNTS (CONTAS BANCÁRIAS) - SOMENTE LEITURA
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "authenticated_insert_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "authenticated_update_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "authenticated_delete_bank_accounts" ON bank_accounts;

-- ✅ GERENTE pode visualizar contas bancárias da sua unidade
CREATE POLICY "gerente_select_bank_accounts" ON bank_accounts
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE MODIFICAR CONTAS BANCÁRIAS
CREATE POLICY "gerente_no_modify_bank_accounts" ON bank_accounts
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 7: PAYMENT_METHODS (FORMAS DE PAGAMENTO) - SOMENTE LEITURA
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_select_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "authenticated_insert_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "authenticated_update_payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "authenticated_delete_payment_methods" ON payment_methods;

-- ✅ GERENTE pode visualizar formas de pagamento da sua unidade
CREATE POLICY "gerente_select_payment_methods" ON payment_methods
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE MODIFICAR FORMAS DE PAGAMENTO
CREATE POLICY "gerente_no_modify_payment_methods" ON payment_methods
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 8: BARBERS_TURN_LIST (LISTA DA VEZ)
-- ============================================================================

DROP POLICY IF EXISTS "Managers can update turn list for their unit" ON barbers_turn_list;
DROP POLICY IF EXISTS "Users can view turn list for their unit" ON barbers_turn_list;
DROP POLICY IF EXISTS "Admins can manage all turn lists" ON barbers_turn_list;
DROP POLICY IF EXISTS "Receptionists can manage all turn lists" ON barbers_turn_list;

-- ✅ GERENTE pode visualizar lista da vez da sua unidade
CREATE POLICY "gerente_select_turn_list" ON barbers_turn_list
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' IN ('gerente', 'receptionist'))
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar lista da vez da sua unidade
CREATE POLICY "gerente_update_turn_list" ON barbers_turn_list
FOR UPDATE
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' IN ('gerente', 'receptionist'))
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR LISTA DA VEZ
CREATE POLICY "gerente_no_delete_turn_list" ON barbers_turn_list
FOR DELETE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 9: GOALS (METAS)
-- ============================================================================

DROP POLICY IF EXISTS "goals_select_by_unit_or_admin" ON goals;
DROP POLICY IF EXISTS "goals_insert_by_unit_or_admin" ON goals;
DROP POLICY IF EXISTS "goals_update_by_unit_or_admin" ON goals;
DROP POLICY IF EXISTS "goals_delete_by_unit_or_admin" ON goals;
DROP POLICY IF EXISTS "authenticated_select_goals" ON goals;
DROP POLICY IF EXISTS "authenticated_insert_goals" ON goals;
DROP POLICY IF EXISTS "authenticated_update_goals" ON goals;
DROP POLICY IF EXISTS "authenticated_delete_goals" ON goals;

-- ✅ GERENTE pode visualizar metas da sua unidade
CREATE POLICY "gerente_select_goals" ON goals
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode criar metas na sua unidade
CREATE POLICY "gerente_insert_goals" ON goals
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar metas da sua unidade
CREATE POLICY "gerente_update_goals" ON goals
FOR UPDATE
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR METAS
CREATE POLICY "gerente_no_delete_goals" ON goals
FOR DELETE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 10: UNITS (UNIDADES) - SOMENTE LEITURA PARA SELETOR
-- ============================================================================

DROP POLICY IF EXISTS "authenticated_users_can_view_all_units" ON units;
DROP POLICY IF EXISTS "users_can_insert_their_units" ON units;
DROP POLICY IF EXISTS "users_can_update_their_units" ON units;
DROP POLICY IF EXISTS "users_can_delete_their_units" ON units;

-- ✅ GERENTE pode visualizar TODAS as unidades (para seletor global)
CREATE POLICY "gerente_select_all_units" ON units
FOR SELECT
TO authenticated
USING (true); -- Todos veem todas as unidades

-- ❌ GERENTE NÃO PODE MODIFICAR UNIDADES
CREATE POLICY "gerente_no_modify_units" ON units
FOR ALL
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (user_id = auth.uid()) -- Apenas proprietário
);

-- ============================================================================
-- BLOCO 11: EXPENSE_PAYMENTS (BAIXAS DE DESPESAS)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view expense payments from their units" ON expense_payments;
DROP POLICY IF EXISTS "Users can insert expense payments in their units" ON expense_payments;
DROP POLICY IF EXISTS "Users can update expense payments in their units" ON expense_payments;
DROP POLICY IF EXISTS "Users can delete expense payments in their units" ON expense_payments;

-- ✅ GERENTE pode visualizar baixas da sua unidade
CREATE POLICY "gerente_select_expense_payments" ON expense_payments
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode criar baixas na sua unidade
CREATE POLICY "gerente_insert_expense_payments" ON expense_payments
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ✅ GERENTE pode atualizar baixas da sua unidade
CREATE POLICY "gerente_update_expense_payments" ON expense_payments
FOR UPDATE
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' = 'gerente')
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ❌ GERENTE NÃO PODE DELETAR BAIXAS
CREATE POLICY "gerente_no_delete_expense_payments" ON expense_payments
FOR DELETE
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

-- ============================================================================
-- BLOCO 12: HISTÓRICOS DA LISTA DA VEZ (SOMENTE LEITURA)
-- ============================================================================

-- BARBERS_TURN_DAILY_HISTORY
DROP POLICY IF EXISTS "Managers can view their unit daily history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "Barbers can view their own daily history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "Admins can view all daily history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "Receptionists can manage all daily history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "System can insert daily history" ON barbers_turn_daily_history;
DROP POLICY IF EXISTS "System can update daily history" ON barbers_turn_daily_history;

CREATE POLICY "gerente_select_daily_history" ON barbers_turn_daily_history
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' IN ('gerente', 'receptionist'))
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- BARBERS_TURN_HISTORY
DROP POLICY IF EXISTS "Users can view history for their unit" ON barbers_turn_history;
DROP POLICY IF EXISTS "Admins can manage all history" ON barbers_turn_history;
DROP POLICY IF EXISTS "Receptionists can manage all turn history" ON barbers_turn_history;

CREATE POLICY "gerente_select_monthly_history" ON barbers_turn_history
FOR SELECT
TO authenticated
USING (
    (auth.jwt()->>'role' = 'admin')
    OR
    (
        (auth.jwt()->>'role' IN ('gerente', 'receptionist'))
        AND unit_id IN (
            SELECT p.unit_id 
            FROM professionals p 
            WHERE p.user_id = auth.uid() AND p.is_active = true
        )
    )
    OR
    (
        unit_id IN (
            SELECT id FROM units WHERE user_id = auth.uid()
        )
    )
);

-- ============================================================================
-- ✅ COMMIT DA TRANSAÇÃO
-- ============================================================================
COMMIT;

-- ============================================================================
-- ✅ RESULTADO ESPERADO:
-- 
-- Após a execução deste script:
-- 1. Gerente PODE:
--    - Ver e modificar receitas/despesas da sua unidade
--    - Ver e criar clientes/fornecedores/categorias da sua unidade
--    - Ver profissionais, contas bancárias, formas de pagamento
--    - Ver e atualizar lista da vez
--    - Ver e criar metas
--    - Ver todas as views do dashboard
-- 
-- 2. Gerente NÃO PODE:
--    - Deletar registros críticos
--    - Acessar dados de outras unidades
--    - Modificar configurações administrativas
--    - Acessar subscriptions, products, bank_statements
--    - Ver logs de auditoria e webhooks
-- 
-- 3. Segurança:
--    - Todas as permissões filtradas por unit_id
--    - DELETE bloqueado para preservar auditoria
--    - Admin mantém acesso total
-- ============================================================================
