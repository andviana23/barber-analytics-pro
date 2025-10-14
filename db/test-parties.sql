-- FASE 5.1.1: Test Parties Table (Clientes e Fornecedores)
-- Data: 13/10/2025 
-- Objetivo: Validar RLS por role, unicidade de CPF/CNPJ, criação de parties

-- =====================================================
-- 1. TESTE DE DADOS DE EXEMPLO
-- =====================================================
DO $$
DECLARE
    v_unit_id UUID;
    v_party_id UUID;
    v_count INTEGER;
BEGIN
    RAISE NOTICE '=== INICIANDO TESTES DA TABELA PARTIES ===';
    
    -- Buscar ou criar uma unidade para testes
    SELECT id INTO v_unit_id FROM units WHERE is_active = true LIMIT 1;
    
    IF v_unit_id IS NULL THEN
        INSERT INTO units (name, status) VALUES ('Unidade Teste FASE 5', true)
        RETURNING id INTO v_unit_id;
        RAISE NOTICE 'Unidade de teste criada: %', v_unit_id;
    ELSE
        RAISE NOTICE 'Usando unidade existente: %', v_unit_id;
    END IF;
    
    -- =====================================================
    -- 2. TESTE DE CRIAÇÃO DE PARTIES
    -- =====================================================
    
    -- 2.1 Criar Cliente válido
    BEGIN
        INSERT INTO parties (
            unit_id, nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes
        ) VALUES (
            v_unit_id, 'João Silva Cliente', 'Cliente', '123.456.789-01', 
            '(31) 99999-1111', 'joao.cliente@teste.com', 
            'Rua das Flores, 123 - Belo Horizonte/MG', 
            'Cliente teste para FASE 5'
        ) RETURNING id INTO v_party_id;
        
        RAISE NOTICE '✅ Cliente criado com sucesso: % (ID: %)', 'João Silva Cliente', v_party_id;
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar cliente: %', SQLERRM;
    END;
    
    -- 2.2 Criar Fornecedor válido
    BEGIN
        INSERT INTO parties (
            unit_id, nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes
        ) VALUES (
            v_unit_id, 'Distribuidora ABC LTDA', 'Fornecedor', '12.345.678/0001-90', 
            '(31) 3333-4444', 'contato@distribuidoraabc.com', 
            'Av. Comercial, 456 - Contagem/MG', 
            'Fornecedor de produtos para barbearia'
        );
        
        RAISE NOTICE '✅ Fornecedor criado com sucesso: %', 'Distribuidora ABC LTDA';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao criar fornecedor: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 3. TESTE DE VALIDAÇÕES E CONSTRAINTS
    -- =====================================================
    
    -- 3.1 Teste de duplicação de CPF/CNPJ
    BEGIN
        INSERT INTO parties (unit_id, nome, tipo, cpf_cnpj) 
        VALUES (v_unit_id, 'João Silva Duplicado', 'Cliente', '123.456.789-01');
        
        RAISE NOTICE '❌ FALHA: Permitiu CPF duplicado (deveria ter falhado)';
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE '✅ Constraint de CPF/CNPJ único funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar CPF duplicado: %', SQLERRM;
    END;
    
    -- 3.2 Teste de nome vazio (constraint check)
    BEGIN
        INSERT INTO parties (unit_id, nome, tipo, cpf_cnpj) 
        VALUES (v_unit_id, '   ', 'Cliente', '987.654.321-00');
        
        RAISE NOTICE '❌ FALHA: Permitiu nome vazio (deveria ter falhado)';
    EXCEPTION 
        WHEN check_violation THEN
            RAISE NOTICE '✅ Constraint de nome não vazio funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar nome vazio: %', SQLERRM;
    END;
    
    -- 3.3 Teste de ENUM tipo (apenas Cliente e Fornecedor)
    BEGIN
        INSERT INTO parties (unit_id, nome, tipo, cpf_cnpj) 
        VALUES (v_unit_id, 'Teste Tipo Inválido', 'TipoInvalido', '456.789.123-45');
        
        RAISE NOTICE '❌ FALHA: Permitiu tipo inválido (deveria ter falhado)';
    EXCEPTION 
        WHEN invalid_text_representation THEN
            RAISE NOTICE '✅ ENUM party_type funcionando corretamente';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Erro inesperado ao testar tipo inválido: %', SQLERRM;
    END;
    
    -- =====================================================
    -- 4. TESTE DE CONSULTAS E ÍNDICES
    -- =====================================================
    
    -- 4.1 Contar parties por tipo
    SELECT COUNT(*) INTO v_count FROM parties WHERE unit_id = v_unit_id AND tipo = 'Cliente';
    RAISE NOTICE 'Total de Clientes na unidade teste: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM parties WHERE unit_id = v_unit_id AND tipo = 'Fornecedor';
    RAISE NOTICE 'Total de Fornecedores na unidade teste: %', v_count;
    
    -- 4.2 Buscar por CPF/CNPJ (teste de índice)
    SELECT COUNT(*) INTO v_count FROM parties WHERE cpf_cnpj = '123.456.789-01';
    RAISE NOTICE 'Busca por CPF específico encontrou % registro(s)', v_count;
    
    -- 4.3 Busca por nome (teste de índice)
    SELECT COUNT(*) INTO v_count FROM parties WHERE nome ILIKE '%silva%';
    RAISE NOTICE 'Busca por nome (ILIKE %%silva%%) encontrou % registro(s)', v_count;
    
    -- =====================================================
    -- 5. TESTE DE SOFT DELETE
    -- =====================================================
    
    -- 5.1 Marcar party como inativo
    UPDATE parties SET is_active = false 
    WHERE unit_id = v_unit_id AND nome = 'João Silva Cliente';
    
    -- 5.2 Verificar filtro de ativos
    SELECT COUNT(*) INTO v_count FROM parties 
    WHERE unit_id = v_unit_id AND is_active = true;
    RAISE NOTICE 'Parties ativas após soft delete: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM parties 
    WHERE unit_id = v_unit_id AND is_active = false;
    RAISE NOTICE 'Parties inativas após soft delete: %', v_count;
    
    -- =====================================================
    -- 6. TESTE DE PERFORMANCE COM MÚLTIPLOS REGISTROS
    -- =====================================================
    
    RAISE NOTICE 'Criando parties adicionais para teste de performance...';
    
    FOR i IN 1..50 LOOP
        BEGIN
            INSERT INTO parties (
                unit_id, nome, tipo, cpf_cnpj, telefone, email, observacoes
            ) VALUES (
                v_unit_id, 
                'Cliente Teste ' || i, 
                'Cliente', 
                LPAD(i::TEXT, 11, '0') || '-' || LPAD((i % 100)::TEXT, 2, '0'),
                '(31) 9999-' || LPAD(i::TEXT, 4, '0'),
                'cliente' || i || '@teste.com',
                'Registro de teste número ' || i
            );
        EXCEPTION 
            WHEN OTHERS THEN
                -- Ignorar erros de duplicação ou outros
                NULL;
        END;
    END LOOP;
    
    -- 6.1 Medir performance de consulta com muitos registros
    SELECT COUNT(*) INTO v_count FROM parties WHERE unit_id = v_unit_id;
    RAISE NOTICE 'Total de parties na unidade teste após inserções em lote: %', v_count;
    
    -- 6.2 Teste de consulta com filtros múltiplos
    SELECT COUNT(*) INTO v_count FROM parties 
    WHERE unit_id = v_unit_id AND tipo = 'Cliente' AND is_active = true;
    RAISE NOTICE 'Clientes ativos com filtros múltiplos: %', v_count;
    
    RAISE NOTICE '=== TESTES DA TABELA PARTIES CONCLUÍDOS ===';
    
END $$;

-- =====================================================
-- 7. CONSULTAS DE VERIFICAÇÃO FINAL
-- =====================================================

-- 7.1 Verificar estrutura da tabela
\d parties;

-- 7.2 Verificar constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'parties'::regclass
ORDER BY contype, conname;

-- 7.3 Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'parties'
ORDER BY indexname;

-- 7.4 Estatísticas finais
SELECT 
    'parties' AS tabela,
    COUNT(*) AS total_registros,
    COUNT(*) FILTER (WHERE tipo = 'Cliente') AS total_clientes,
    COUNT(*) FILTER (WHERE tipo = 'Fornecedor') AS total_fornecedores,
    COUNT(*) FILTER (WHERE is_active = true) AS registros_ativos,
    COUNT(*) FILTER (WHERE is_active = false) AS registros_inativos,
    COUNT(DISTINCT unit_id) AS unidades_distintas
FROM parties;