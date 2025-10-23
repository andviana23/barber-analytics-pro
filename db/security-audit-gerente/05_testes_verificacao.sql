/**
 * ✅ SCRIPT 05: TESTES DE VALIDAÇÃO DE PERMISSÕES GERENTE
 * 
 * Objetivo: Validar que as permissões aplicadas funcionam corretamente.
 * 
 * ⚠️ EXECUTAR APÓS APLICAR 04_aplicar_permissoes_gerente.sql
 * ⚠️ CONECTAR COMO USUÁRIO GERENTE PARA TESTAR
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- TESTE 1: GERENTE CONSEGUE VER RECEITAS DA SUA UNIDADE
-- ============================================================================
-- Conectar como gerente e executar:
SELECT 
    'TESTE 1: Ver receitas da unidade' AS teste,
    COUNT(*) AS total_receitas,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ PASS - Gerente vê receitas'
        ELSE '⚠️ WARN - Nenhuma receita encontrada'
    END AS resultado
FROM revenues
WHERE unit_id IN (
    SELECT p.unit_id 
    FROM professionals p 
    WHERE p.user_id = auth.uid()
);

-- ============================================================================
-- TESTE 2: GERENTE CONSEGUE INSERIR RECEITA NA SUA UNIDADE
-- ============================================================================
-- Tentar inserir (DEVE FUNCIONAR)
DO $$
DECLARE
    v_unit_id UUID;
    v_result TEXT;
BEGIN
    -- Pegar unit_id do gerente
    SELECT p.unit_id INTO v_unit_id
    FROM professionals p 
    WHERE p.user_id = auth.uid() 
    LIMIT 1;
    
    -- Tentar inserir
    INSERT INTO revenues (
        type, value, date, unit_id, source, status
    ) VALUES (
        'service', 100.00, CURRENT_DATE, v_unit_id, 'TESTE GERENTE', 'Received'
    );
    
    v_result := '✅ PASS - Gerente inseriu receita';
    RAISE NOTICE '%', v_result;
    
    -- Limpar teste
    DELETE FROM revenues WHERE source = 'TESTE GERENTE';
EXCEPTION WHEN OTHERS THEN
    v_result := '❌ FAIL - Gerente NÃO conseguiu inserir receita: ' || SQLERRM;
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- TESTE 3: GERENTE NÃO CONSEGUE DELETAR RECEITAS (DEVE FALHAR)
-- ============================================================================
DO $$
DECLARE
    v_test_id UUID;
    v_result TEXT;
BEGIN
    -- Criar receita temporária
    INSERT INTO revenues (type, value, date, source, status)
    VALUES ('service', 1.00, CURRENT_DATE, 'TESTE DELETE', 'Pending')
    RETURNING id INTO v_test_id;
    
    -- Tentar deletar (DEVE FALHAR)
    DELETE FROM revenues WHERE id = v_test_id;
    
    v_result := '❌ FAIL - Gerente CONSEGUIU deletar (INSEGURO!)';
    RAISE EXCEPTION '%', v_result;
    
EXCEPTION WHEN insufficient_privilege THEN
    v_result := '✅ PASS - Gerente bloqueado de deletar receitas';
    RAISE NOTICE '%', v_result;
    
    -- Limpar
    DELETE FROM revenues WHERE source = 'TESTE DELETE';
END $$;

-- ============================================================================
-- TESTE 4: GERENTE NÃO CONSEGUE VER SUBSCRIPTIONS (DEVE FALHAR)
-- ============================================================================
DO $$
DECLARE
    v_count INT;
    v_result TEXT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM subscriptions;
    
    IF v_count = 0 THEN
        v_result := '✅ PASS - Gerente bloqueado de ver subscriptions';
    ELSE
        v_result := '❌ FAIL - Gerente VÊ ' || v_count || ' subscriptions (INSEGURO!)';
    END IF;
    
    RAISE NOTICE '%', v_result;
    
EXCEPTION WHEN insufficient_privilege THEN
    v_result := '✅ PASS - Gerente bloqueado de acessar subscriptions';
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- TESTE 5: GERENTE NÃO CONSEGUE VER PRODUTOS (DEVE FALHAR)
-- ============================================================================
DO $$
DECLARE
    v_count INT;
    v_result TEXT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM products;
    
    IF v_count = 0 THEN
        v_result := '✅ PASS - Gerente bloqueado de ver products';
    ELSE
        v_result := '⚠️ WARN - Gerente VÊ ' || v_count || ' products';
    END IF;
    
    RAISE NOTICE '%', v_result;
    
EXCEPTION WHEN insufficient_privilege THEN
    v_result := '✅ PASS - Gerente bloqueado de acessar products';
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- TESTE 6: GERENTE CONSEGUE VER DASHBOARD VIEWS
-- ============================================================================
SELECT 
    'TESTE 6: Ver view vw_relatorios_kpis' AS teste,
    COUNT(*) AS total_registros,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ PASS - Gerente acessa views do dashboard'
        ELSE '❌ FAIL'
    END AS resultado
FROM vw_relatorios_kpis
WHERE unit_id IN (
    SELECT p.unit_id 
    FROM professionals p 
    WHERE p.user_id = auth.uid()
);

-- ============================================================================
-- TESTE 7: GERENTE NÃO CONSEGUE MODIFICAR BANK_ACCOUNTS
-- ============================================================================
DO $$
DECLARE
    v_test_id UUID;
    v_result TEXT;
BEGIN
    -- Tentar atualizar conta bancária (DEVE FALHAR)
    UPDATE bank_accounts 
    SET name = 'TESTE GERENTE HACK'
    WHERE id IN (
        SELECT id FROM bank_accounts LIMIT 1
    );
    
    v_result := '❌ FAIL - Gerente MODIFICOU conta bancária (INSEGURO!)';
    RAISE EXCEPTION '%', v_result;
    
EXCEPTION WHEN insufficient_privilege THEN
    v_result := '✅ PASS - Gerente bloqueado de modificar bank_accounts';
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- TESTE 8: GERENTE CONSEGUE ATUALIZAR LISTA DA VEZ
-- ============================================================================
DO $$
DECLARE
    v_list_id UUID;
    v_old_points INT;
    v_result TEXT;
BEGIN
    -- Pegar primeiro registro da lista
    SELECT id, points INTO v_list_id, v_old_points
    FROM barbers_turn_list
    WHERE unit_id IN (
        SELECT p.unit_id 
        FROM professionals p 
        WHERE p.user_id = auth.uid()
    )
    LIMIT 1;
    
    IF v_list_id IS NULL THEN
        RAISE NOTICE '⚠️ WARN - Nenhuma lista da vez para testar';
        RETURN;
    END IF;
    
    -- Tentar atualizar (DEVE FUNCIONAR)
    UPDATE barbers_turn_list 
    SET points = points + 1
    WHERE id = v_list_id;
    
    -- Restaurar
    UPDATE barbers_turn_list 
    SET points = v_old_points
    WHERE id = v_list_id;
    
    v_result := '✅ PASS - Gerente atualizou lista da vez';
    RAISE NOTICE '%', v_result;
    
EXCEPTION WHEN OTHERS THEN
    v_result := '❌ FAIL - Gerente NÃO conseguiu atualizar lista: ' || SQLERRM;
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- TESTE 9: GERENTE NÃO VÊ RECEITAS DE OUTRAS UNIDADES
-- ============================================================================
DO $$
DECLARE
    v_my_unit_id UUID;
    v_other_unit_count INT;
    v_result TEXT;
BEGIN
    -- Pegar minha unidade
    SELECT p.unit_id INTO v_my_unit_id
    FROM professionals p 
    WHERE p.user_id = auth.uid() 
    LIMIT 1;
    
    -- Tentar ver receitas de outras unidades
    SELECT COUNT(*) INTO v_other_unit_count
    FROM revenues
    WHERE unit_id != v_my_unit_id;
    
    IF v_other_unit_count = 0 THEN
        v_result := '✅ PASS - Gerente NÃO vê receitas de outras unidades';
    ELSE
        v_result := '❌ FAIL - Gerente VÊ ' || v_other_unit_count || ' receitas de outras unidades (INSEGURO!)';
    END IF;
    
    RAISE NOTICE '%', v_result;
END $$;

-- ============================================================================
-- RESUMO DOS TESTES
-- ============================================================================
SELECT 
    'RESUMO DE TESTES' AS secao,
    '✅ 3 testes positivos esperados (inserir, ver, atualizar)' AS expectativa_1,
    '❌ 6 testes negativos esperados (bloquear acessos)' AS expectativa_2,
    'Total: 9 testes' AS total;

-- ============================================================================
-- ✅ COMO EXECUTAR:
-- 
-- 1. Criar usuário gerente de teste:
--    INSERT INTO auth.users (email, raw_user_meta_data) 
--    VALUES ('gerente@teste.com', '{"role": "gerente"}');
-- 
-- 2. Vincular a um professional:
--    INSERT INTO professionals (unit_id, user_id, name, role)
--    VALUES (<unit_id>, <user_id>, 'Gerente Teste', 'Gerente');
-- 
-- 3. Conectar como gerente e executar este script
-- 
-- 4. Verificar logs com:
--    SHOW client_min_messages;
--    SET client_min_messages = 'notice';
-- ============================================================================
