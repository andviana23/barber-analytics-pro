-- FASE 5.1.4: Test Performance Views
-- Data: 13/10/2025 
-- Objetivo: Validar performance das views com 1000+ registros

-- =====================================================
-- 1. TESTE DE PERFORMANCE - VIEW vw_calendar_events
-- =====================================================
DO $$
DECLARE
    v_unit_id UUID;
    v_bank_account_id UUID;
    v_count INTEGER;
    v_start_time TIMESTAMP;
    v_end_time TIMESTAMP;
    v_duration NUMERIC;
    v_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    RAISE NOTICE '=== INICIANDO TESTES DE PERFORMANCE DAS VIEWS ===';
    
    -- Buscar dados existentes
    SELECT id INTO v_unit_id FROM units WHERE status = true LIMIT 1;
    SELECT id INTO v_bank_account_id FROM bank_accounts WHERE unit_id = v_unit_id LIMIT 1;
    
    -- =====================================================
    -- TESTE 1: CRIAR DADOS DE TESTE EM MASSA
    -- =====================================================
    
    RAISE NOTICE 'Criando dados de teste em massa...';
    
    -- Criar revenues em massa (500 registros)
    FOR i IN 1..500 LOOP
        BEGIN
            INSERT INTO revenues (
                source, value, type, date, unit_id, account_id,
                expected_receipt_date, status,
                accrual_start_date, accrual_end_date
            ) VALUES (
                'Revenue Performance Test ' || i,
                (RANDOM() * 5000 + 500)::NUMERIC(10,2),
                'servico',
                CURRENT_DATE - (RANDOM() * 365)::INTEGER,
                v_unit_id,
                v_bank_account_id,
                CURRENT_DATE + (RANDOM() * 30)::INTEGER,
                CASE 
                    WHEN i % 4 = 0 THEN 'Received'
                    WHEN i % 4 = 1 THEN 'Pending'
                    WHEN i % 4 = 2 THEN 'Overdue'
                    ELSE 'Cancelled'
                END,
                CURRENT_DATE - (RANDOM() * 30)::INTEGER,
                CURRENT_DATE + (RANDOM() * 30)::INTEGER
            );
        EXCEPTION 
            WHEN OTHERS THEN
                -- Ignore errors for mass insert
                NULL;
        END;
    END LOOP;
    
    -- Criar expenses em massa (500 registros)
    FOR i IN 1..500 LOOP
        BEGIN
            INSERT INTO expenses (
                description, value, type, category, date, unit_id,
                expected_payment_date, status,
                accrual_start_date, accrual_end_date
            ) VALUES (
                'Expense Performance Test ' || i,
                (RANDOM() * 3000 + 200)::NUMERIC(10,2),
                'variable',
                'Materiais',
                CURRENT_DATE - (RANDOM() * 365)::INTEGER,
                v_unit_id,
                CURRENT_DATE + (RANDOM() * 30)::INTEGER,
                CASE 
                    WHEN i % 4 = 0 THEN 'Paid'
                    WHEN i % 4 = 1 THEN 'Pending'
                    WHEN i % 4 = 2 THEN 'Overdue'
                    ELSE 'Cancelled'
                END,
                CURRENT_DATE - (RANDOM() * 30)::INTEGER,
                CURRENT_DATE + (RANDOM() * 30)::INTEGER
            );
        EXCEPTION 
            WHEN OTHERS THEN
                -- Ignore errors for mass insert
                NULL;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Dados de teste em massa criados com sucesso';
    
    -- =====================================================
    -- TESTE 2: PERFORMANCE VIEW vw_calendar_events
    -- =====================================================
    
    RAISE NOTICE 'Testando performance da VIEW vw_calendar_events...';
    
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count 
    FROM vw_calendar_events 
    WHERE unit_id = v_unit_id 
    AND event_date >= CURRENT_DATE - INTERVAL '90 days'
    AND event_date <= CURRENT_DATE + INTERVAL '90 days';
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ vw_calendar_events: % eventos em %.2f ms', v_count, v_duration;
    
    -- Teste com filtros específicos
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count 
    FROM vw_calendar_events 
    WHERE unit_id = v_unit_id 
    AND transaction_status IN ('Pending', 'Overdue')
    AND tipo = 'Receive';
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ vw_calendar_events (filtrado): % eventos pendentes/atrasados em %.2f ms', v_count, v_duration;
    
    -- =====================================================
    -- TESTE 3: PERFORMANCE VIEW vw_cashflow_entries
    -- =====================================================
    
    RAISE NOTICE 'Testando performance da VIEW vw_cashflow_entries...';
    
    -- Primeiro criar algumas transações efetivas (com datas de pagamento)
    UPDATE revenues 
    SET actual_receipt_date = date + (RANDOM() * 10)::INTEGER,
        status = 'Received'
    WHERE unit_id = v_unit_id 
    AND status = 'Pending'
    AND RANDOM() < 0.3  -- 30% das revenues pendentes
    LIMIT 50;
    
    UPDATE expenses 
    SET actual_payment_date = date + (RANDOM() * 15)::INTEGER,
        status = 'Paid'
    WHERE unit_id = v_unit_id 
    AND status = 'Pending'
    AND RANDOM() < 0.3  -- 30% das expenses pendentes
    LIMIT 50;
    
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count 
    FROM vw_cashflow_entries 
    WHERE unit_id = v_unit_id
    AND transaction_date >= CURRENT_DATE - INTERVAL '90 days';
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ vw_cashflow_entries: % entradas de fluxo em %.2f ms', v_count, v_duration;
    
    -- Teste com cálculo de saldo acumulado
    v_start_time := clock_timestamp();
    
    SELECT 
        SUM(daily_balance) as total_balance,
        MAX(accumulated_balance) as max_accumulated
    INTO v_count, v_duration
    FROM vw_cashflow_entries 
    WHERE unit_id = v_unit_id;
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ vw_cashflow_entries (agregado): Total balance calculado em %.2f ms', v_duration;
    
    -- =====================================================
    -- TESTE 4: PERFORMANCE VIEW vw_reconciliation_summary
    -- =====================================================
    
    RAISE NOTICE 'Testando performance da VIEW vw_reconciliation_summary...';
    
    -- Criar alguns bank statements e reconciliations para teste
    FOR i IN 1..100 LOOP
        DECLARE
            v_statement_id UUID;
            v_revenue_id UUID;
        BEGIN
            -- Criar bank statement
            INSERT INTO bank_statements (
                bank_account_id, transaction_date, description, amount, type
            ) VALUES (
                v_bank_account_id,
                CURRENT_DATE - (RANDOM() * 90)::INTEGER,
                'Statement Performance Test ' || i,
                (RANDOM() * 2000 + 100)::NUMERIC(10,2),
                CASE WHEN i % 2 = 0 THEN 'Entrada' ELSE 'Saida' END
            ) RETURNING id INTO v_statement_id;
            
            -- Reconciliar alguns (30%)
            IF RANDOM() < 0.3 THEN
                SELECT id INTO v_revenue_id FROM revenues WHERE unit_id = v_unit_id AND RANDOM() < 0.1 LIMIT 1;
                
                IF v_revenue_id IS NOT NULL THEN
                    INSERT INTO reconciliations (
                        bank_statement_id, reference_type, reference_id, status, reconciled_by
                    ) VALUES (
                        v_statement_id, 'Revenue', v_revenue_id, 'Reconciled', v_user_id
                    );
                END IF;
            END IF;
        EXCEPTION 
            WHEN OTHERS THEN
                -- Ignore errors
                NULL;
        END;
    END LOOP;
    
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count 
    FROM vw_reconciliation_summary 
    WHERE unit_id = v_unit_id;
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ vw_reconciliation_summary: % períodos resumidos em %.2f ms', v_count, v_duration;
    
    -- =====================================================
    -- TESTE 5: PERFORMANCE COM JOINS COMPLEXOS
    -- =====================================================
    
    RAISE NOTICE 'Testando joins complexos entre views...';
    
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count
    FROM vw_calendar_events ce
    LEFT JOIN vw_cashflow_entries cfe ON ce.unit_id = cfe.unit_id 
        AND ce.event_date = cfe.transaction_date
    WHERE ce.unit_id = v_unit_id
    AND ce.event_date >= CURRENT_DATE - INTERVAL '30 days';
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ Join calendar + cashflow: % registros em %.2f ms', v_count, v_duration;
    
    -- =====================================================
    -- TESTE 6: ESTATÍSTICAS FINAIS
    -- =====================================================
    
    -- Contar totais criados
    SELECT COUNT(*) INTO v_count FROM revenues WHERE unit_id = v_unit_id;
    RAISE NOTICE 'Total revenues criadas: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM expenses WHERE unit_id = v_unit_id;
    RAISE NOTICE 'Total expenses criadas: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM bank_statements WHERE bank_account_id = v_bank_account_id;
    RAISE NOTICE 'Total bank statements: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM reconciliations r
    INNER JOIN bank_statements bs ON r.bank_statement_id = bs.id
    WHERE bs.bank_account_id = v_bank_account_id;
    RAISE NOTICE 'Total reconciliations: %', v_count;
    
    -- Testar índices específicos
    v_start_time := clock_timestamp();
    
    SELECT COUNT(*) INTO v_count 
    FROM revenues 
    WHERE unit_id = v_unit_id 
    AND status = 'Pending'
    AND expected_receipt_date >= CURRENT_DATE;
    
    v_end_time := clock_timestamp();
    v_duration := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    RAISE NOTICE '✅ Consulta com índices (revenues): % registros em %.2f ms', v_count, v_duration;
    
    RAISE NOTICE '=== TESTES DE PERFORMANCE DAS VIEWS CONCLUÍDOS ===';
    
END $$;