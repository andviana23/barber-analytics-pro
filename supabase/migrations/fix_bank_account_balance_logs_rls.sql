-- ========================================
-- CORREÇÃO: Políticas RLS para bank_account_balance_logs
-- ========================================
--
-- PROBLEMA: A tabela bank_account_balance_logs tem RLS ativado mas falta
-- política para INSERT, causando erro quando ajustamos saldo inicial.
--
-- SOLUÇÃO: Adicionar políticas RLS para INSERT e UPDATE.
--

-- 1. Verificar se a tabela tem RLS ativo
-- (já está ativo, verificado no erro)

-- 2. Adicionar política para INSERT
-- Permite inserir logs quando o usuário tem acesso à conta bancária da sua unidade
CREATE POLICY "Users can insert balance logs from their unit"
    ON bank_account_balance_logs
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT ba.id
            FROM bank_accounts ba
            INNER JOIN units u ON u.id = ba.unit_id
            INNER JOIN professionals p ON p.unit_id = u.id
            WHERE p.user_id = auth.uid()
            AND p.is_active = true
        )
    );

-- 3. Adicionar política para UPDATE (caso necessário no futuro)
CREATE POLICY "Users can update balance logs from their unit"
    ON bank_account_balance_logs
    FOR UPDATE
    USING (
        account_id IN (
            SELECT ba.id
            FROM bank_accounts ba
            INNER JOIN units u ON u.id = ba.unit_id
            INNER JOIN professionals p ON p.unit_id = u.id
            WHERE p.user_id = auth.uid()
            AND p.is_active = true
        )
    );

-- 4. Verificar se a função ainda funciona após correções RLS
-- (A função update_account_initial_balance deve agora conseguir inserir logs)

-- 5. Comentários para documentação
COMMENT ON POLICY "Users can insert balance logs from their unit" ON bank_account_balance_logs IS
    'Permite inserir logs de saldo para contas bancárias da unidade do usuário';

COMMENT ON POLICY "Users can update balance logs from their unit" ON bank_account_balance_logs IS
    'Permite atualizar logs de saldo para contas bancárias da unidade do usuário';

-- ========================================
-- VALIDAÇÃO
-- ========================================

-- Listar todas as políticas da tabela
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'bank_account_balance_logs';

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename = 'bank_account_balance_logs';
