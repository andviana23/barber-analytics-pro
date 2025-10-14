-- ================================================
-- FUNÇÕES PARA GERENCIAMENTO DA FILA DE ATENDIMENTO
-- Implementação das funções restantes do plano
-- Data: 2025-10-11
-- ================================================

-- 1. FUNÇÃO PARA ATUALIZAR POSIÇÃO NA FILA
CREATE OR REPLACE FUNCTION atualizar_posicao_fila(barbeiro_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Move o barbeiro para o final da fila atualizando a ultima_atualizacao
    UPDATE queue_attendances 
    SET last_update = NOW()
    WHERE barber_id = barbeiro_id;
    
    -- Log da operação (opcional)
    INSERT INTO attendance_history (
        barber_id,
        unit,
        date,
        start_time,
        end_time,
        duration,
        service_value,
        action
    ) VALUES (
        barbeiro_id,
        (SELECT unit FROM queue_attendances WHERE barber_id = barbeiro_id LIMIT 1),
        CURRENT_DATE,
        NOW(),
        NOW(),
        '00:00:00'::interval,
        0,
        'position_updated'
    );
END;
$$;

-- 2. FUNÇÃO PARA FINALIZAR ATENDIMENTO
CREATE OR REPLACE FUNCTION finalizar_atendimento(
    barbeiro_id UUID, 
    valor_servico DECIMAL DEFAULT 0,
    duracao_minutos INTEGER DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unit_name TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    calculated_duration INTERVAL;
BEGIN
    -- Buscar dados atuais do barbeiro
    SELECT unit INTO unit_name 
    FROM queue_attendances 
    WHERE barber_id = barbeiro_id;
    
    -- Definir horários
    end_time := NOW();
    
    -- Buscar último atendimento em progresso para calcular duração
    SELECT start_time INTO start_time
    FROM attendance_history 
    WHERE barber_id = barbeiro_id 
      AND date = CURRENT_DATE 
      AND end_time IS NULL
    ORDER BY start_time DESC 
    LIMIT 1;
    
    -- Se não encontrar início, usar horário atual menos duração padrão
    IF start_time IS NULL THEN
        IF duracao_minutos IS NOT NULL THEN
            start_time := end_time - (duracao_minutos || ' minutes')::interval;
        ELSE
            start_time := end_time - '30 minutes'::interval; -- duração padrão
        END IF;
    END IF;
    
    calculated_duration := end_time - start_time;
    
    -- Atualizar histórico existente ou criar novo registro
    INSERT INTO attendance_history (
        barber_id,
        unit,
        date,
        start_time,
        end_time,
        duration,
        service_value
    ) VALUES (
        barbeiro_id,
        unit_name,
        CURRENT_DATE,
        start_time,
        end_time,
        calculated_duration,
        COALESCE(valor_servico, 0)
    )
    ON CONFLICT (barber_id, date, start_time) 
    DO UPDATE SET
        end_time = EXCLUDED.end_time,
        duration = EXCLUDED.duration,
        service_value = EXCLUDED.service_value;
    
    -- Incrementar total de atendimentos e atualizar status
    UPDATE queue_attendances 
    SET 
        total_attendances = total_attendances + 1,
        status = 'available'::queue_status,
        last_update = NOW()
    WHERE barber_id = barbeiro_id;
    
    -- Criar receita automaticamente se valor > 0
    IF valor_servico > 0 THEN
        INSERT INTO revenues (
            unit_id,
            professional_id,
            type,
            amount,
            date,
            origin,
            notes
        ) VALUES (
            (SELECT id FROM units WHERE name = unit_name LIMIT 1),
            (SELECT id FROM professionals WHERE user_id = barbeiro_id LIMIT 1),
            'service',
            valor_servico,
            CURRENT_DATE,
            'queue_service',
            'Atendimento registrado via fila - ' || TO_CHAR(end_time, 'HH24:MI')
        );
    END IF;
    
    -- Retornar resumo da operação
    RETURN jsonb_build_object(
        'success', true,
        'barber_id', barbeiro_id,
        'start_time', start_time,
        'end_time', end_time,
        'duration_minutes', EXTRACT(EPOCH FROM calculated_duration)/60,
        'service_value', valor_servico,
        'new_total_attendances', (SELECT total_attendances FROM queue_attendances WHERE barber_id = barbeiro_id)
    );
END;
$$;

-- 3. FUNÇÃO PARA OBTER FILA ORDENADA
CREATE OR REPLACE FUNCTION get_fila_ordenada(unidade_param TEXT DEFAULT NULL)
RETURNS TABLE (
    barber_id UUID,
    barber_name TEXT,
    unit TEXT,
    total_attendances INTEGER,
    status queue_status,
    last_update TIMESTAMP,
    position INTEGER,
    avatar_url TEXT,
    time_since_last_update INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH ordered_queue AS (
        SELECT 
            qa.barber_id,
            p.name as barber_name,
            qa.unit,
            qa.total_attendances,
            qa.status,
            qa.last_update,
            p.avatar_url,
            NOW() - qa.last_update as time_since_last_update,
            ROW_NUMBER() OVER (
                PARTITION BY qa.unit 
                ORDER BY 
                    CASE WHEN qa.status = 'in_service' THEN 0 ELSE 1 END,
                    qa.total_attendances ASC,
                    qa.last_update ASC
            ) as position
        FROM queue_attendances qa
        JOIN professionals p ON p.user_id = qa.barber_id
        WHERE 
            qa.status IN ('available', 'in_service')
            AND p.active = true
            AND p.position ILIKE '%barbeiro%'
            AND (unidade_param IS NULL OR qa.unit = unidade_param)
    )
    SELECT 
        oq.barber_id,
        oq.barber_name,
        oq.unit,
        oq.total_attendances,
        oq.status,
        oq.last_update,
        oq.position::INTEGER,
        oq.avatar_url,
        oq.time_since_last_update
    FROM ordered_queue oq
    ORDER BY oq.unit, oq.position;
END;
$$;

-- 4. FUNÇÃO PARA PULAR BARBEIRO NA FILA
CREATE OR REPLACE FUNCTION pular_barbeiro(barbeiro_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_unit TEXT;
    next_barber_update TIMESTAMP;
BEGIN
    -- Obter unidade do barbeiro
    SELECT unit INTO current_unit 
    FROM queue_attendances 
    WHERE barber_id = barbeiro_id;
    
    -- Encontrar o próximo barbeiro na fila da mesma unidade
    SELECT last_update INTO next_barber_update
    FROM queue_attendances 
    WHERE unit = current_unit 
      AND barber_id != barbeiro_id
      AND status = 'available'
    ORDER BY total_attendances ASC, last_update ASC
    LIMIT 1;
    
    -- Atualizar o barbeiro para ficar depois do próximo
    IF next_barber_update IS NOT NULL THEN
        UPDATE queue_attendances 
        SET last_update = next_barber_update + '1 second'::interval
        WHERE barber_id = barbeiro_id;
    ELSE
        -- Se não há próximo, apenas atualiza para agora + 1 minuto
        UPDATE queue_attendances 
        SET last_update = NOW() + '1 minute'::interval
        WHERE barber_id = barbeiro_id;
    END IF;
    
    -- Log da operação
    INSERT INTO attendance_history (
        barber_id,
        unit,
        date,
        start_time,
        end_time,
        duration,
        service_value,
        action
    ) VALUES (
        barbeiro_id,
        current_unit,
        CURRENT_DATE,
        NOW(),
        NOW(),
        '00:00:00'::interval,
        0,
        'barber_skipped'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Barbeiro movido na fila',
        'barber_id', barbeiro_id,
        'unit', current_unit
    );
END;
$$;

-- 5. FUNÇÃO PARA RESETAR CONTADORES MENSAIS (TRIGGER)
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Executar apenas no último dia do mês às 23:59
    -- Verifica se é o último dia do mês e se são 23:59
    IF DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day' = CURRENT_DATE
       AND EXTRACT(HOUR FROM NOW()) = 23 
       AND EXTRACT(MINUTE FROM NOW()) = 59 THEN
        
        UPDATE queue_attendances 
        SET total_attendances = 0;
        
        -- Log do reset mensal
        INSERT INTO attendance_history (
            barber_id,
            unit,
            date,
            start_time,
            end_time,
            duration,
            service_value,
            action
        )
        SELECT 
            barber_id,
            unit,
            CURRENT_DATE,
            NOW(),
            NOW(),
            '00:00:00'::interval,
            0,
            'monthly_reset'
        FROM queue_attendances;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. CRIAR TRIGGER PARA RESET MENSAL
DROP TRIGGER IF EXISTS trigger_reset_monthly_counters ON queue_attendances;
CREATE TRIGGER trigger_reset_monthly_counters
    AFTER UPDATE ON queue_attendances
    FOR EACH STATEMENT
    EXECUTE FUNCTION reset_monthly_counters();

-- 7. FUNÇÃO PARA ESTATÍSTICAS DA FILA
CREATE OR REPLACE FUNCTION get_queue_stats(unidade_param TEXT DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
BEGIN
    WITH stats AS (
        SELECT 
            qa.unit,
            COUNT(*) as total_barbers,
            COUNT(*) FILTER (WHERE qa.status = 'available') as available_barbers,
            COUNT(*) FILTER (WHERE qa.status = 'in_service') as busy_barbers,
            COUNT(*) FILTER (WHERE qa.status = 'paused') as paused_barbers,
            SUM(qa.total_attendances) as total_daily_services,
            AVG(qa.total_attendances) as avg_services_per_barber
        FROM queue_attendances qa
        JOIN professionals p ON p.user_id = qa.barber_id
        WHERE 
            p.active = true
            AND (unidade_param IS NULL OR qa.unit = unidade_param)
        GROUP BY qa.unit
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'unit', unit,
            'total_barbers', total_barbers,
            'available_barbers', available_barbers,
            'busy_barbers', busy_barbers,
            'paused_barbers', paused_barbers,
            'total_daily_services', total_daily_services,
            'avg_services_per_barber', ROUND(avg_services_per_barber::numeric, 2)
        )
    ) INTO result
    FROM stats;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 8. GRANTS PARA USO VIA API
GRANT EXECUTE ON FUNCTION atualizar_posicao_fila(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION finalizar_atendimento(UUID, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fila_ordenada(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION pular_barbeiro(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_stats(TEXT) TO authenticated;

-- 9. FUNÇÃO PARA RESET MENSAL MANUAL (ALTERNATIVA MAIS CONFIÁVEL)
CREATE OR REPLACE FUNCTION execute_monthly_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Resetar todos os contadores mensais
    UPDATE queue_attendances 
    SET total_attendances = 0;
    
    -- Log do reset mensal
    INSERT INTO attendance_history (
        barber_id,
        unit,
        date,
        start_time,
        end_time,
        duration,
        service_value,
        action
    )
    SELECT 
        barber_id,
        unit,
        CURRENT_DATE,
        NOW(),
        NOW(),
        '00:00:00'::interval,
        0,
        'monthly_reset_manual'
    FROM queue_attendances;
    
    RAISE NOTICE 'Reset mensal executado com sucesso em %', NOW();
END;
$$;

-- 10. AGENDAMENTO COM PG_CRON (SE DISPONÍVEL NO SUPABASE)
-- Esta função deve ser executada manualmente pelo sistema no último dia do mês às 23:59
-- Exemplo de uso: SELECT execute_monthly_reset();

-- Alternativa com pg_cron (descomente se pg_cron estiver disponível):
-- SELECT cron.schedule('monthly-queue-reset', '59 23 28-31 * *', 'SELECT execute_monthly_reset() WHERE EXTRACT(DAY FROM CURRENT_DATE + INTERVAL ''1 day'') = 1;');

-- 11. COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON FUNCTION atualizar_posicao_fila(UUID) IS 'Atualiza a posição do barbeiro na fila movendo para o final';
COMMENT ON FUNCTION finalizar_atendimento(UUID, DECIMAL, INTEGER) IS 'Finaliza atendimento, incrementa contador e registra histórico';
COMMENT ON FUNCTION get_fila_ordenada(TEXT) IS 'Retorna fila ordenada por total de atendimentos e tempo';
COMMENT ON FUNCTION pular_barbeiro(UUID) IS 'Move barbeiro uma posição abaixo na fila';
COMMENT ON FUNCTION get_queue_stats(TEXT) IS 'Retorna estatísticas da fila por unidade';
COMMENT ON FUNCTION reset_monthly_counters() IS 'Trigger para resetar contadores no último dia do mês às 23:59';
COMMENT ON FUNCTION execute_monthly_reset() IS 'Função manual para executar reset mensal dos contadores';

-- ================================================
-- FIM DAS FUNÇÕES DE FILA
-- ================================================