-- FASE 5.1.2: Test Bank Statements Table
-- Data: 13/10/2025 
-- Objetivo: Validar duplicatas (hash_unique), conciliado = false inicial, importação

-- =====================================================
-- 1. PREPARAÇÃO DOS DADOS DE TESTE
-- =====================================================
DO $$
DECLARE
    v_unit_id UUID;
    v_bank_account_id UUID;
    v_statement_id UUID;
    v_count INTEGER;
    v_hash_test VARCHAR(64);
BEGIN
    RAISE NOTICE '=== INICIANDO TESTES DA TABELA BANK_STATEMENTS ===';
    
    -- Buscar ou criar unidade para teste
    SELECT id INTO v_unit_id FROM units WHERE status = true LIMIT 1;
    
    IF v_unit_id IS NULL THEN
        INSERT INTO units (name, status) VALUES ('Unidade Teste Bank Statements', true)
        RETURNING id INTO v_unit_id;
        RAISE NOTICE 'Unidade de teste criada: %', v_unit_id;
    END IF;
    
    -- Criar ou buscar conta bancária para teste
    SELECT id INTO v_bank_account_id FROM bank_accounts WHERE unit_id = v_unit_id LIMIT 1;
    
    IF v_bank_account_id IS NULL THEN
        INSERT INTO bank_accounts (
            name, bank, agency, account_number, unit_id, initial_balance
        ) VALUES (
            'Conta Corrente Teste', 'Banco Teste', '1234', '567890-1', v_unit_id, 10000.00
        ) RETURNING id INTO v_bank_account_id;
        RAISE NOTICE 'Conta bancária de teste criada: %', v_bank_account_id;
    ELSE
        RAISE NOTICE 'Usando conta bancária existente: %', v_bank_account_id;
    END IF;
    
    -- =====================================================
    -- 2. TESTE DE CRIAÇÃO DE BANK STATEMENTS
    -- =====================================================
    
    -- 2.1 Criar statement de entrada válido
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type, balance_after
        ) VALUES (
            v_bank_account_id, 
            CURRENT_DATE - INTERVAL '5 days', 
            'Depósito em dinheiro', 
            1500.00, 
            'Entrada', 
            11500.00
        ) RETURNING id, hash_unique INTO v_statement_id, v_hash_test;
        
        RAISE NOTICE '✅ Statement de entrada criado: % (Hash: %)', v_statement_id, v_hash_test;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar statement de entrada: %', SQLERRM;
    END;
    
    -- 2.2 Criar statement de saída válido
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type, balance_after
        ) VALUES (
            v_bank_account_id, 
            CURRENT_DATE - INTERVAL '4 days', 
            'TED para fornecedor', 
            800.00, 
            'Saida', 
            10700.00
        );
        
        RAISE NOTICE '✅ Statement de saída criado com sucesso';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar statement de saída: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 3. TESTE DE HASH ÚNICO E DUPLICATAS
    -- =====================================================
    
    -- 3.1 Testar geração automática de hash
    SELECT hash_unique INTO v_hash_test 
    FROM bank_statements 
    WHERE id = v_statement_id;
    
    IF v_hash_test IS NOT NULL AND LENGTH(v_hash_test) = 32 THEN
        RAISE NOTICE '✅ Hash gerado automaticamente: % (tamanho: %)', v_hash_test, LENGTH(v_hash_test);
    ELSE
        RAISE NOTICE '❌ Falha na geração automática de hash';
    END IF;
    
    -- 3.2 Testar detecção de duplicatas
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type, balance_after
        ) VALUES (
            v_bank_account_id, 
            CURRENT_DATE - INTERVAL '5 days', 
            'Depósito em dinheiro',  -- Mesma descrição
            1500.00,                 -- Mesmo valor
            'Entrada',               -- Mesmo tipo
            11500.00
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu statement duplicado (deveria ter falhado)';
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE '✅ Detecção de duplicatas funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar duplicatas: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 4. TESTE DE VALIDAÇÕES E CONSTRAINTS
    -- =====================================================
    
    -- 4.1 Teste valor negativo (deve falhar)
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type
        ) VALUES (
            v_bank_account_id, CURRENT_DATE, 'Teste valor negativo', -100.00, 'Entrada'
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu valor negativo (deveria ter falhado)';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint de valor positivo funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar valor negativo: %', SQLERRM;
    END;
    
    -- 4.2 Teste descrição vazia (deve falhar)
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type
        ) VALUES (
            v_bank_account_id, CURRENT_DATE, '   ', 100.00, 'Entrada'
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu descrição vazia (deveria ter falhado)';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint de descrição não vazia funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar descrição vazia: %', SQLERRM;
    END;
    
    -- 4.3 Teste tipo inválido (deve falhar)
    BEGIN
        INSERT INTO bank_statements (
            bank_account_id, transaction_date, description, amount, type
        ) VALUES (
            v_bank_account_id, CURRENT_DATE, 'Teste tipo inválido', 100.00, 'TipoInvalido'
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu tipo inválido (deveria ter falhado)';
    EXCEPTION 
        WHEN invalid_text_representation THEN
            RAISE NOTICE '✅ ENUM statement_type funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar tipo inválido: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 5. TESTE DE STATUS DE RECONCILIAÇÃO INICIAL
    -- =====================================================
    
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id AND reconciled = false;
    
    RAISE NOTICE 'Statements não reconciliados (esperado > 0): %', v_count;
    
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id AND reconciled = true;
    
    RAISE NOTICE 'Statements já reconciliados (esperado = 0): %', v_count;
    
    -- =====================================================
    -- 6. TESTE DE PERFORMANCE COM INSERÇÕES EM LOTE
    -- =====================================================
    
    RAISE NOTICE 'Criando statements em lote para teste de performance...';
    
    FOR i IN 1..100 LOOP
        BEGIN
            INSERT INTO bank_statements (
                bank_account_id, transaction_date, description, amount, type, balance_after
            ) VALUES (
                v_bank_account_id,
                CURRENT_DATE - (i || ' days')::INTERVAL,
                'Transação automática ' || i,
                (RANDOM() * 1000 + 50)::NUMERIC(10,2),
                CASE WHEN i % 2 = 0 THEN 'Entrada' ELSE 'Saida' END,
                10000 + (RANDOM() * 5000)::NUMERIC(10,2)
            );
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao inserir statement %: %', i, SQLERRM;
        END;
    END LOOP;
    
    -- =====================================================
    -- 7. TESTE DE CONSULTAS E ÍNDICES
    -- =====================================================
    
    -- 7.1 Teste de filtro por data (usando índice)
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id 
    AND transaction_date >= CURRENT_DATE - INTERVAL '30 days';
    
    RAISE NOTICE 'Statements dos últimos 30 dias: %', v_count;
    
    -- 7.2 Teste de filtro por tipo
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id AND type = 'Entrada';
    
    RAISE NOTICE 'Statements de entrada: %', v_count;
    
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id AND type = 'Saida';
    
    RAISE NOTICE 'Statements de saída: %', v_count;
    
    -- 7.3 Teste de filtro por reconciliação (índice parcial)
    SELECT COUNT(*) INTO v_count 
    FROM bank_statements 
    WHERE bank_account_id = v_bank_account_id AND reconciled = false;
    
    RAISE NOTICE 'Statements não reconciliados (índice parcial): %', v_count;
    
    -- =====================================================
    -- 8. TESTE DE TRIGGER DE HASH AUTOMÁTICO
    -- =====================================================
    
    -- Inserir sem especificar hash (deve gerar automaticamente)
    INSERT INTO bank_statements (
        bank_account_id, transaction_date, description, amount, type
    ) VALUES (
        v_bank_account_id, CURRENT_DATE, 'Teste trigger hash', 250.00, 'Entrada'
    ) RETURNING hash_unique INTO v_hash_test;
    
    IF v_hash_test IS NOT NULL THEN
        RAISE NOTICE '✅ Trigger de hash automático funcionando: %', v_hash_test;
    ELSE
        RAISE NOTICE '❌ Trigger de hash automático não funcionou';
    END IF;
    
    RAISE NOTICE '=== TESTES DA TABELA BANK_STATEMENTS CONCLUÍDOS ===';
    
END $$;