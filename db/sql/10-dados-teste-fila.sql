-- =====================================================
-- DADOS DE TESTE PARA LISTA DA VEZ
-- =====================================================

-- Inserir unidades de teste (se não existirem)
INSERT INTO units (id, name, status, created_at) VALUES
(gen_random_uuid(), 'Mangabeiras', true, NOW()),
(gen_random_uuid(), 'Nova Lima', true, NOW())
ON CONFLICT (name) DO NOTHING;

-- Buscar IDs das unidades
DO $$
DECLARE
    v_unit_mangabeiras UUID;
    v_unit_nova_lima UUID;
    v_user_admin UUID;
BEGIN
    -- Buscar ou criar usuário admin para testes
    SELECT id INTO v_user_admin FROM auth.users WHERE email = 'admin@barberanalytics.com' LIMIT 1;
    
    IF v_user_admin IS NULL THEN
        -- Se não houver usuário admin, usar um UUID fictício para desenvolvimento
        v_user_admin := gen_random_uuid();
    END IF;
    
    -- Buscar IDs das unidades
    SELECT id INTO v_unit_mangabeiras FROM units WHERE name = 'Mangabeiras';
    SELECT id INTO v_unit_nova_lima FROM units WHERE name = 'Nova Lima';
    
    -- Inserir barbeiros de teste para Mangabeiras
    INSERT INTO professionals (id, name, role, is_active, unit_id, user_id, commission_rate) VALUES
    (gen_random_uuid(), 'João Silva', 'barbeiro', true, v_unit_mangabeiras, v_user_admin, 50.00),
    (gen_random_uuid(), 'Pedro Santos', 'barbeiro', true, v_unit_mangabeiras, v_user_admin, 45.00),
    (gen_random_uuid(), 'Carlos Oliveira', 'barbeiro', true, v_unit_mangabeiras, v_user_admin, 55.00)
    ON CONFLICT (name, unit_id) DO NOTHING;
    
    -- Inserir barbeiros de teste para Nova Lima
    INSERT INTO professionals (id, name, role, is_active, unit_id, user_id, commission_rate) VALUES
    (gen_random_uuid(), 'Marcos Lima', 'barbeiro', true, v_unit_nova_lima, v_user_admin, 50.00),
    (gen_random_uuid(), 'Rafael Costa', 'barbeiro', true, v_unit_nova_lima, v_user_admin, 45.00),
    (gen_random_uuid(), 'Diego Ferreira', 'barbeiro', true, v_unit_nova_lima, v_user_admin, 48.00)
    ON CONFLICT (name, unit_id) DO NOTHING;
    
    -- Inserir alguns barbeiros na fila para teste
    INSERT INTO fila_atendimento (barbeiro_id, unidade_id, total_atendimentos, status, data_atual)
    SELECT 
        p.id, 
        p.unit_id, 
        floor(random() * 5)::integer, -- 0-4 atendimentos aleatórios
        CASE floor(random() * 3)
            WHEN 0 THEN 'active'::queue_status
            WHEN 1 THEN 'paused'::queue_status
            ELSE 'attending'::queue_status
        END,
        CURRENT_DATE
    FROM professionals p 
    WHERE p.role = 'barbeiro' AND p.is_active = true
    ON CONFLICT (barbeiro_id, unidade_id, data_atual) DO UPDATE SET
        total_atendimentos = EXCLUDED.total_atendimentos,
        status = EXCLUDED.status,
        ultima_atualizacao = NOW();
        
    -- Inserir alguns atendimentos históricos para hoje
    INSERT INTO historico_atendimentos (
        barbeiro_id, 
        unidade_id, 
        hora_inicio, 
        hora_fim, 
        tipo_servico, 
        valor_servico, 
        status
    )
    SELECT 
        p.id,
        p.unit_id,
        CURRENT_DATE + (random() * interval '8 hours') + interval '8 hours', -- Entre 8h e 16h
        CURRENT_DATE + (random() * interval '8 hours') + interval '8 hours' + interval '30 minutes', -- +30min
        CASE floor(random() * 4)
            WHEN 0 THEN 'Corte Simples'
            WHEN 1 THEN 'Corte + Barba'
            WHEN 2 THEN 'Barba'
            ELSE 'Corte Completo'
        END,
        (20 + random() * 30)::decimal(10,2), -- R$ 20-50
        'concluido'
    FROM professionals p 
    WHERE p.role = 'barbeiro' AND p.is_active = true
        AND random() < 0.7 -- 70% chance de ter atendimento
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Dados de teste inseridos com sucesso!';
    RAISE NOTICE 'Unidade Mangabeiras: %', v_unit_mangabeiras;
    RAISE NOTICE 'Unidade Nova Lima: %', v_unit_nova_lima;
END $$;