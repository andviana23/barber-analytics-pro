-- FASE 5.1.3: Test Reconciliations Table
-- Data: 13/10/2025 
-- Objetivo: Validar status updates, algoritmos de auto-match, linking manual

-- =====================================================
-- 1. PREPARAÇÃO DOS DADOS DE TESTE
-- =====================================================
DO $$
DECLARE
    v_unit_id UUID;
    v_bank_account_id UUID;
    v_revenue_id UUID;
    v_expense_id UUID;
    v_statement_id UUID;
    v_reconciliation_id UUID;
    v_count INTEGER;
    v_status TEXT;
BEGIN
    RAISE NOTICE '=== INICIANDO TESTES DA TABELA RECONCILIATIONS ===';
    
    -- Buscar dados existentes para teste
    SELECT id INTO v_unit_id FROM units WHERE status = true LIMIT 1;
    SELECT id INTO v_bank_account_id FROM bank_accounts WHERE unit_id = v_unit_id LIMIT 1;
    
    -- Criar revenue para teste de reconciliação
    INSERT INTO revenues (
        description, amount, category, received_date, unit_id, account_id
    ) VALUES (
        'Pagamento Cliente - Teste Reconciliação', 
        1500.00, 
        'Servicos', 
        CURRENT_DATE - INTERVAL '2 days',
        v_unit_id,
        v_bank_account_id
    ) RETURNING id INTO v_revenue_id;
    
    RAISE NOTICE 'Revenue de teste criada: %', v_revenue_id;
    
    -- Criar expense para teste de reconciliação
    INSERT INTO expenses (
        description, amount, category, due_date, unit_id, account_id
    ) VALUES (
        'Pagamento Fornecedor - Teste Reconciliação', 
        800.00, 
        'Materiais', 
        CURRENT_DATE - INTERVAL '1 day',
        v_unit_id,
        v_bank_account_id
    ) RETURNING id INTO v_expense_id;
    
    RAISE NOTICE 'Expense de teste criada: %', v_expense_id;
    
    -- Criar bank statement para teste de reconciliação
    INSERT INTO bank_statements (
        bank_account_id, transaction_date, description, amount, type
    ) VALUES (
        v_bank_account_id, 
        CURRENT_DATE - INTERVAL '2 days', 
        'Depósito PIX Cliente', 
        1500.00, 
        'Entrada'
    ) RETURNING id INTO v_statement_id;
    
    RAISE NOTICE 'Bank statement de teste criado: %', v_statement_id;
    
    -- =====================================================
    -- 2. TESTE DE RECONCILIAÇÃO MANUAL
    -- =====================================================
    
    -- 2.1 Criar reconciliação manual revenue + bank statement
    BEGIN
        INSERT INTO reconciliations (
            bank_statement_id, revenue_id, reconciliation_type, status, notes
        ) VALUES (
            v_statement_id, 
            v_revenue_id, 
            'Manual', 
            'Confirmed',
            'Reconciliação manual de teste - pagamento cliente'
        ) RETURNING id INTO v_reconciliation_id;
        
        RAISE NOTICE '✅ Reconciliação manual criada: %', v_reconciliation_id;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar reconciliação manual: %', SQLERRM;
    END;
    
    -- Verificar se bank statement foi marcado como reconciliado
    SELECT reconciled INTO v_status FROM bank_statements WHERE id = v_statement_id;
    
    IF v_status = true THEN
        RAISE NOTICE '✅ Bank statement marcado como reconciliado automaticamente';
    ELSE
        RAISE NOTICE '❌ Bank statement não foi marcado como reconciliado';
    END IF;
    
    -- =====================================================
    -- 3. TESTE DE RECONCILIAÇÃO AUTOMÁTICA
    -- =====================================================
    
    -- Criar novos dados para teste automático
    INSERT INTO bank_statements (
        bank_account_id, transaction_date, description, amount, type
    ) VALUES (
        v_bank_account_id, 
        CURRENT_DATE - INTERVAL '1 day', 
        'TED Fornecedor XYZ', 
        800.00, 
        'Saida'
    ) RETURNING id INTO v_statement_id;
    
    -- 3.1 Criar reconciliação automática expense + bank statement
    BEGIN
        INSERT INTO reconciliations (
            bank_statement_id, expense_id, reconciliation_type, status, confidence_score
        ) VALUES (
            v_statement_id, 
            v_expense_id, 
            'Automatic', 
            'Pending_Review',
            0.95
        ) RETURNING id INTO v_reconciliation_id;
        
        RAISE NOTICE '✅ Reconciliação automática criada: % (confidence: 95%%)', v_reconciliation_id;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar reconciliação automática: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 4. TESTE DE STATUS UPDATES
    -- =====================================================
    
    -- 4.1 Testar mudança de status Pending → Confirmed
    BEGIN
        UPDATE reconciliations 
        SET status = 'Confirmed', 
            notes = 'Confirmado após revisão manual'
        WHERE id = v_reconciliation_id;
        
        RAISE NOTICE '✅ Status atualizado para Confirmed';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao atualizar status: %', SQLERRM;
    END;
    
    -- 4.2 Testar mudança para Rejected
    INSERT INTO reconciliations (
        bank_statement_id, expense_id, reconciliation_type, status
    ) VALUES (
        v_statement_id, v_expense_id, 'Manual', 'Rejected'
    ) RETURNING id INTO v_reconciliation_id;
    
    UPDATE reconciliations 
    SET status = 'Rejected', 
        notes = 'Rejeitado - valores não conferem'
    WHERE id = v_reconciliation_id;
    
    RAISE NOTICE '✅ Reconciliação rejeitada criada e atualizada';
    
    -- =====================================================
    -- 5. TESTE DE CONSTRAINTS E VALIDAÇÕES
    -- =====================================================
    
    -- 5.1 Teste de constraint: deve ter revenue OU expense (não ambos)
    BEGIN
        INSERT INTO reconciliations (
            bank_statement_id, revenue_id, expense_id, reconciliation_type, status
        ) VALUES (
            v_statement_id, v_revenue_id, v_expense_id, 'Manual', 'Confirmed'
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu revenue E expense simultaneamente';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint revenue XOR expense funcionando';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado no teste XOR: %', SQLERRM;
    END;
    
    -- 5.2 Teste de constraint: deve ter pelo menos revenue OU expense
    BEGIN
        INSERT INTO reconciliations (
            bank_statement_id, reconciliation_type, status
        ) VALUES (
            v_statement_id, 'Manual', 'Confirmed'
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu reconciliação sem revenue nem expense';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint OR revenue/expense funcionando';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado no teste OR: %', SQLERRM;
    END;
    
    -- 5.3 Teste confidence score válido (0-1)
    BEGIN
        INSERT INTO reconciliations (
            bank_statement_id, revenue_id, reconciliation_type, status, confidence_score
        ) VALUES (
            v_statement_id, v_revenue_id, 'Automatic', 'Pending_Review', 1.5
        );
        
        RAISE NOTICE '❌ FALHA: Permitiu confidence score > 1';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint confidence score (0-1) funcionando';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado no teste confidence: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 6. TESTE DE PERFORMANCE E CONSULTAS
    -- =====================================================
    
    -- Criar múltiplas reconciliações para teste de performance
    FOR i IN 1..30 LOOP
        BEGIN
            -- Criar bank statement
            INSERT INTO bank_statements (
                bank_account_id, transaction_date, description, amount, type
            ) VALUES (
                v_bank_account_id,
                CURRENT_DATE - (i || ' days')::INTERVAL,
                'Transação automática ' || i,
                (RANDOM() * 1000 + 100)::NUMERIC(10,2),
                CASE WHEN i % 2 = 0 THEN 'Entrada' ELSE 'Saida' END
            ) RETURNING id INTO v_statement_id;
            
            -- Criar revenue/expense correspondente
            IF i % 2 = 0 THEN
                INSERT INTO revenues (
                    description, amount, category, received_date, unit_id, account_id
                ) VALUES (
                    'Revenue automática ' || i,
                    (RANDOM() * 1000 + 100)::NUMERIC(10,2),
                    'Servicos',
                    CURRENT_DATE - (i || ' days')::INTERVAL,
                    v_unit_id,
                    v_bank_account_id
                ) RETURNING id INTO v_revenue_id;
                
                -- Reconciliação com revenue
                INSERT INTO reconciliations (
                    bank_statement_id, revenue_id, reconciliation_type, status, confidence_score
                ) VALUES (
                    v_statement_id, 
                    v_revenue_id, 
                    CASE WHEN i % 3 = 0 THEN 'Manual' ELSE 'Automatic' END,
                    CASE 
                        WHEN i % 4 = 0 THEN 'Confirmed'
                        WHEN i % 4 = 1 THEN 'Pending_Review'
                        ELSE 'Rejected'
                    END,
                    (RANDOM() * 0.5 + 0.5)::NUMERIC(3,2)
                );
            ELSE
                INSERT INTO expenses (
                    description, amount, category, due_date, unit_id, account_id
                ) VALUES (
                    'Expense automática ' || i,
                    (RANDOM() * 1000 + 100)::NUMERIC(10,2),
                    'Materiais',
                    CURRENT_DATE - (i || ' days')::INTERVAL,
                    v_unit_id,
                    v_bank_account_id
                ) RETURNING id INTO v_expense_id;
                
                -- Reconciliação com expense
                INSERT INTO reconciliations (
                    bank_statement_id, expense_id, reconciliation_type, status, confidence_score
                ) VALUES (
                    v_statement_id, 
                    v_expense_id, 
                    CASE WHEN i % 3 = 0 THEN 'Manual' ELSE 'Automatic' END,
                    CASE 
                        WHEN i % 4 = 0 THEN 'Confirmed'
                        WHEN i % 4 = 1 THEN 'Pending_Review'
                        ELSE 'Rejected'
                    END,
                    (RANDOM() * 0.5 + 0.5)::NUMERIC(3,2)
                );
            END IF;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao criar reconciliação %: %', i, SQLERRM;
        END;
    END LOOP;
    
    -- =====================================================
    -- 7. TESTE DE CONSULTAS COMPLEXAS
    -- =====================================================
    
    -- 7.1 Consulta por status
    SELECT COUNT(*) INTO v_count 
    FROM reconciliations 
    WHERE status = 'Confirmed';
    
    RAISE NOTICE 'Reconciliações confirmadas: %', v_count;
    
    -- 7.2 Consulta por tipo
    SELECT COUNT(*) INTO v_count 
    FROM reconciliations 
    WHERE reconciliation_type = 'Automatic';
    
    RAISE NOTICE 'Reconciliações automáticas: %', v_count;
    
    -- 7.3 Consulta por confidence score alto
    SELECT COUNT(*) INTO v_count 
    FROM reconciliations 
    WHERE confidence_score >= 0.8;
    
    RAISE NOTICE 'Reconciliações com alta confiança (>=80%%): %', v_count;
    
    -- 7.4 Teste de joins complexos
    SELECT COUNT(*) INTO v_count
    FROM reconciliations r
    INNER JOIN bank_statements bs ON r.bank_statement_id = bs.id
    LEFT JOIN revenues rev ON r.revenue_id = rev.id
    LEFT JOIN expenses exp ON r.expense_id = exp.id
    WHERE bs.transaction_date >= CURRENT_DATE - INTERVAL '30 days';
    
    RAISE NOTICE 'Reconciliações dos últimos 30 dias (com joins): %', v_count;
    
    RAISE NOTICE '=== TESTES DA TABELA RECONCILIATIONS CONCLUÍDOS ===';
    
END $$;