-- =====================================================
-- BACKUP AUTOMÁTICO DIÁRIO - LISTA DA VEZ
-- =====================================================
-- Autor: Andrey Viana
-- Data: 11/11/2025
-- Objetivo: Criar sistema de backup diário automático
--           para prevenir perda de dados
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA DE BACKUP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.barbers_turn_list_backup (
    id UUID,
    unit_id UUID,
    professional_id UUID,
    points INTEGER,
    position INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,

    -- Campos de controle do backup
    backup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    backup_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    backup_type TEXT DEFAULT 'daily', -- 'daily', 'manual', 'pre_reset'

    PRIMARY KEY (id, backup_date)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_backup_date
ON public.barbers_turn_list_backup(backup_date DESC);

CREATE INDEX IF NOT EXISTS idx_backup_unit_date
ON public.barbers_turn_list_backup(unit_id, backup_date DESC);

CREATE INDEX IF NOT EXISTS idx_backup_professional_date
ON public.barbers_turn_list_backup(professional_id, backup_date DESC);

-- Comentários
COMMENT ON TABLE public.barbers_turn_list_backup IS
'Backup automático diário da lista da vez - mantém histórico de 30 dias';

COMMENT ON COLUMN public.barbers_turn_list_backup.backup_type IS
'Tipo de backup: daily (automático diário), manual (executado manualmente), pre_reset (antes de reset mensal)';

-- =====================================================
-- 2. FUNÇÃO PARA CRIAR BACKUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_backup_turn_list(
    p_backup_type TEXT DEFAULT 'daily'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_records_backed_up INTEGER;
    v_backup_date DATE := CURRENT_DATE;
    v_result JSON;
BEGIN
    -- Deletar backup existente da data atual (se houver)
    DELETE FROM public.barbers_turn_list_backup
    WHERE backup_date = v_backup_date
    AND backup_type = p_backup_type;

    -- Inserir backup atual
    INSERT INTO public.barbers_turn_list_backup (
        id,
        unit_id,
        professional_id,
        points,
        position,
        last_updated,
        created_at,
        updated_at,
        backup_date,
        backup_timestamp,
        backup_type
    )
    SELECT
        id,
        unit_id,
        professional_id,
        points,
        position,
        last_updated,
        created_at,
        updated_at,
        v_backup_date,
        NOW(),
        p_backup_type
    FROM public.barbers_turn_list;

    GET DIAGNOSTICS v_records_backed_up = ROW_COUNT;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'backup_date', v_backup_date,
        'backup_type', p_backup_type,
        'records_backed_up', v_records_backed_up,
        'message', format('Backup criado com sucesso: %s registros', v_records_backed_up)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_backup_turn_list IS
'Cria backup da lista da vez atual. Tipos: daily, manual, pre_reset';

-- =====================================================
-- 3. FUNÇÃO PARA RESTAURAR DO BACKUP
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_restore_from_backup(
    p_backup_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_records_restored INTEGER;
    v_backup_exists BOOLEAN;
    v_result JSON;
BEGIN
    -- Verificar se o backup existe
    SELECT EXISTS (
        SELECT 1 FROM public.barbers_turn_list_backup
        WHERE backup_date = p_backup_date
    ) INTO v_backup_exists;

    IF NOT v_backup_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Backup não encontrado para a data: %s', p_backup_date)
        );
    END IF;

    -- Limpar dados atuais
    DELETE FROM public.barbers_turn_list;

    -- Restaurar do backup
    INSERT INTO public.barbers_turn_list (
        id,
        unit_id,
        professional_id,
        points,
        position,
        last_updated,
        created_at,
        updated_at
    )
    SELECT
        id,
        unit_id,
        professional_id,
        points,
        position,
        last_updated,
        created_at,
        NOW() -- Atualizar updated_at para agora
    FROM public.barbers_turn_list_backup
    WHERE backup_date = p_backup_date
    -- Pegar apenas o último backup do dia se houver múltiplos
    AND backup_timestamp = (
        SELECT MAX(backup_timestamp)
        FROM public.barbers_turn_list_backup
        WHERE backup_date = p_backup_date
    );

    GET DIAGNOSTICS v_records_restored = ROW_COUNT;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'backup_date', p_backup_date,
        'records_restored', v_records_restored,
        'message', format('Backup restaurado com sucesso: %s registros', v_records_restored)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_restore_from_backup IS
'Restaura lista da vez a partir de um backup específico';

-- =====================================================
-- 4. FUNÇÃO PARA LIMPEZA DE BACKUPS ANTIGOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_cleanup_old_backups(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_records_deleted INTEGER;
    v_cutoff_date DATE;
    v_result JSON;
BEGIN
    -- Calcular data de corte
    v_cutoff_date := CURRENT_DATE - (p_days_to_keep || ' days')::INTERVAL;

    -- Deletar backups antigos
    DELETE FROM public.barbers_turn_list_backup
    WHERE backup_date < v_cutoff_date;

    GET DIAGNOSTICS v_records_deleted = ROW_COUNT;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'cutoff_date', v_cutoff_date,
        'days_kept', p_days_to_keep,
        'records_deleted', v_records_deleted,
        'message', format('Limpeza concluída: %s registros removidos', v_records_deleted)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.fn_cleanup_old_backups IS
'Remove backups mais antigos que X dias (padrão: 30)';

-- =====================================================
-- 5. MODIFICAR FUNÇÃO DE RESET MENSAL
-- =====================================================
-- Adicionar backup automático ANTES do reset

CREATE OR REPLACE FUNCTION public.fn_monthly_reset_turn_list()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unit RECORD;
    v_barber RECORD;
    v_month INTEGER;
    v_year INTEGER;
    v_result JSON;
    v_total_units INTEGER := 0;
    v_total_barbers INTEGER := 0;
BEGIN
    -- ✅ NOVO: Criar backup PRÉ-RESET
    PERFORM public.fn_backup_turn_list('pre_reset');

    -- Obter mês e ano atual
    v_month := EXTRACT(MONTH FROM NOW());
    v_year := EXTRACT(YEAR FROM NOW());

    -- Processar cada unidade
    FOR v_unit IN SELECT id, name FROM public.units WHERE is_active = true LOOP
        -- Salvar histórico antes do reset
        FOR v_barber IN
            SELECT btl.professional_id, btl.points, btl.position
            FROM public.barbers_turn_list btl
            WHERE btl.unit_id = v_unit.id
        LOOP
            INSERT INTO public.barbers_turn_history (
                unit_id,
                professional_id,
                month,
                year,
                total_points,
                final_position
            ) VALUES (
                v_unit.id,
                v_barber.professional_id,
                v_month,
                v_year,
                v_barber.points,
                v_barber.position
            ) ON CONFLICT (unit_id, professional_id, month, year)
            DO UPDATE SET
                total_points = EXCLUDED.total_points,
                final_position = EXCLUDED.final_position;
        END LOOP;

        -- Zerar pontos e reordenar por data de cadastro
        UPDATE public.barbers_turn_list
        SET points = 0,
            position = sub.position,
            last_updated = NOW()
        FROM (
            SELECT professional_id, ROW_NUMBER() OVER (ORDER BY p.created_at ASC) as position
            FROM public.barbers_turn_list btl
            JOIN public.professionals p ON p.id = btl.professional_id
            WHERE btl.unit_id = v_unit.id
        ) sub
        WHERE barbers_turn_list.unit_id = v_unit.id
        AND barbers_turn_list.professional_id = sub.professional_id;

        v_total_units := v_total_units + 1;
        v_total_barbers := v_total_barbers + (
            SELECT COUNT(*) FROM public.barbers_turn_list WHERE unit_id = v_unit.id
        );
    END LOOP;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'month', v_month,
        'year', v_year,
        'total_units_processed', v_total_units,
        'total_barbers_reset', v_total_barbers,
        'backup_created', true,
        'message', 'Reset mensal executado com sucesso (backup criado)'
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- =====================================================
-- 6. CONFIGURAR CRON JOB PARA BACKUP DIÁRIO
-- =====================================================

-- Habilitar pg_cron se ainda não estiver
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover cron anterior se existir
SELECT cron.unschedule('backup-diario-lista-da-vez');

-- Criar cron job para backup diário às 23:30
SELECT cron.schedule(
  'backup-diario-lista-da-vez',
  '30 23 * * *', -- Todo dia às 23:30 (antes do possível reset)
  $$
    SELECT public.fn_backup_turn_list('daily');
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Agendador de tarefas periódicas';

-- =====================================================
-- 7. CONFIGURAR CRON JOB PARA LIMPEZA MENSAL
-- =====================================================

-- Remover cron anterior se existir
SELECT cron.unschedule('cleanup-backups-lista-da-vez');

-- Criar cron job para limpeza mensal (1º dia do mês às 02:00)
SELECT cron.schedule(
  'cleanup-backups-lista-da-vez',
  '0 2 1 * *', -- Dia 1 de cada mês às 02:00
  $$
    SELECT public.fn_cleanup_old_backups(30); -- Manter últimos 30 dias
  $$
);

-- =====================================================
-- 8. VIEW PARA CONSULTAR BACKUPS
-- =====================================================

CREATE OR REPLACE VIEW public.vw_backups_lista_da_vez AS
SELECT
    backup_date,
    backup_type,
    COUNT(*) as total_registros,
    STRING_AGG(DISTINCT u.name, ', ') as unidades,
    MAX(backup_timestamp) as ultimo_backup_timestamp
FROM public.barbers_turn_list_backup btlb
JOIN public.units u ON u.id = btlb.unit_id
GROUP BY backup_date, backup_type
ORDER BY backup_date DESC, backup_type;

COMMENT ON VIEW public.vw_backups_lista_da_vez IS
'Resumo dos backups disponíveis da lista da vez';

-- =====================================================
-- 9. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.barbers_turn_list_backup ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os backups
CREATE POLICY "Admins can view all backups" ON public.barbers_turn_list_backup
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.professionals
            WHERE user_id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Managers podem ver backups de suas unidades
CREATE POLICY "Managers can view their unit backups" ON public.barbers_turn_list_backup
    FOR SELECT USING (
        unit_id IN (
            SELECT unit_id FROM public.professionals
            WHERE user_id = auth.uid()
            AND role IN ('gerente', 'admin')
            AND is_active = true
        )
    );

-- =====================================================
-- 10. GRANTS E PERMISSÕES
-- =====================================================

-- Conceder permissões para service role
GRANT ALL ON public.barbers_turn_list_backup TO service_role;
GRANT SELECT ON public.vw_backups_lista_da_vez TO authenticated;
GRANT SELECT ON public.vw_backups_lista_da_vez TO service_role;

GRANT EXECUTE ON FUNCTION public.fn_backup_turn_list(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_restore_from_backup(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_cleanup_old_backups(INTEGER) TO service_role;

-- =====================================================
-- 11. CRIAR PRIMEIRO BACKUP MANUAL
-- =====================================================

-- Executar primeiro backup imediatamente
SELECT public.fn_backup_turn_list('manual');

-- =====================================================
-- 12. VERIFICAR CRON JOBS CONFIGURADOS
-- =====================================================

SELECT
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%lista-da-vez%'
ORDER BY jobname;

-- =====================================================
-- DOCUMENTAÇÃO
-- =====================================================

/*

RESUMO DO SISTEMA DE BACKUP:

1. **Backup Automático Diário:**
   - Horário: 23:30 (antes do possível reset às 23:00)
   - Tipo: 'daily'
   - Mantém últimos 30 dias

2. **Backup Pré-Reset:**
   - Executado automaticamente antes do reset mensal
   - Tipo: 'pre_reset'
   - Garante dados antes de zerar

3. **Backup Manual:**
   - Pode ser executado a qualquer momento
   - SQL: SELECT fn_backup_turn_list('manual');
   - Tipo: 'manual'

4. **Restauração:**
   - Restaurar último backup: SELECT fn_restore_from_backup(CURRENT_DATE - 1);
   - Restaurar data específica: SELECT fn_restore_from_backup('2025-11-11');

5. **Limpeza Automática:**
   - Horário: 1º dia de cada mês às 02:00
   - Remove backups > 30 dias
   - Libera espaço automaticamente

6. **Consultar Backups Disponíveis:**
   - View: SELECT * FROM vw_backups_lista_da_vez;
   - Mostra datas, tipos e quantidades

EXEMPLOS DE USO:

-- Criar backup manual agora
SELECT fn_backup_turn_list('manual');

-- Restaurar backup de ontem
SELECT fn_restore_from_backup(CURRENT_DATE - 1);

-- Ver backups disponíveis
SELECT * FROM vw_backups_lista_da_vez;

-- Limpar backups antigos manualmente
SELECT fn_cleanup_old_backups(30);

*/

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
