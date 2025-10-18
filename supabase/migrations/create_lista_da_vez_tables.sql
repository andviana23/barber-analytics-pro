-- =====================================================
-- MÓDULO LISTA DA VEZ - TABELAS E POLÍTICAS RLS
-- =====================================================
-- Sistema de gestão de ordem de atendimento dos barbeiros
-- com pontuação automática e reset mensal
-- =====================================================

-- Tabela principal: Lista da vez atual
CREATE TABLE IF NOT EXISTS public.barbers_turn_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0 NOT NULL,
    position INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT barbers_turn_list_points_check CHECK (points >= 0),
    CONSTRAINT barbers_turn_list_position_check CHECK (position > 0),
    
    -- Índices únicos por unidade
    UNIQUE(unit_id, professional_id),
    UNIQUE(unit_id, position)
);

-- Tabela de histórico mensal
CREATE TABLE IF NOT EXISTS public.barbers_turn_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    total_points INTEGER DEFAULT 0 NOT NULL,
    final_position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT barbers_turn_history_points_check CHECK (total_points >= 0),
    CONSTRAINT barbers_turn_history_position_check CHECK (final_position > 0),
    
    -- Índice único por profissional/mês/ano/unidade
    UNIQUE(unit_id, professional_id, month, year)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para barbers_turn_list
CREATE INDEX IF NOT EXISTS idx_barbers_turn_list_unit_id ON public.barbers_turn_list(unit_id);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_list_professional_id ON public.barbers_turn_list(professional_id);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_list_position ON public.barbers_turn_list(unit_id, position);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_list_points ON public.barbers_turn_list(unit_id, points);

-- Índices para barbers_turn_history
CREATE INDEX IF NOT EXISTS idx_barbers_turn_history_unit_id ON public.barbers_turn_history(unit_id);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_history_professional_id ON public.barbers_turn_history(professional_id);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_history_month_year ON public.barbers_turn_history(unit_id, year, month);
CREATE INDEX IF NOT EXISTS idx_barbers_turn_history_created_at ON public.barbers_turn_history(created_at);

-- =====================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_barbers_turn_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_barbers_turn_list_updated_at
    BEFORE UPDATE ON public.barbers_turn_list
    FOR EACH ROW
    EXECUTE FUNCTION public.update_barbers_turn_list_updated_at();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para inicializar lista da vez para uma unidade
CREATE OR REPLACE FUNCTION public.fn_initialize_turn_list(p_unit_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_professional RECORD;
    v_position INTEGER := 1;
    v_result JSON;
BEGIN
    -- Limpar lista existente da unidade
    DELETE FROM public.barbers_turn_list WHERE unit_id = p_unit_id;
    
    -- Inserir todos os barbeiros ativos da unidade
    FOR v_professional IN 
        SELECT p.id, p.name, p.role
        FROM public.professionals p
        WHERE p.unit_id = p_unit_id 
        AND p.role = 'barbeiro'
        AND p.is_active = true
        ORDER BY p.created_at ASC
    LOOP
        INSERT INTO public.barbers_turn_list (
            unit_id, 
            professional_id, 
            points, 
            position
        ) VALUES (
            p_unit_id, 
            v_professional.id, 
            0, 
            v_position
        );
        
        v_position := v_position + 1;
    END LOOP;
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'unit_id', p_unit_id,
        'total_barbers', v_position - 1,
        'message', 'Lista da vez inicializada com sucesso'
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Função para adicionar ponto a um barbeiro
CREATE OR REPLACE FUNCTION public.fn_add_point_to_barber(
    p_unit_id UUID,
    p_professional_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_points INTEGER;
    v_new_points INTEGER;
    v_result JSON;
BEGIN
    -- Verificar se o barbeiro existe na lista da unidade
    SELECT points INTO v_current_points
    FROM public.barbers_turn_list
    WHERE unit_id = p_unit_id AND professional_id = p_professional_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Barbeiro não encontrado na lista desta unidade'
        );
    END IF;
    
    -- Adicionar 1 ponto
    v_new_points := v_current_points + 1;
    
    UPDATE public.barbers_turn_list
    SET points = v_new_points,
        last_updated = NOW()
    WHERE unit_id = p_unit_id AND professional_id = p_professional_id;
    
    -- Reordenar lista automaticamente
    PERFORM public.fn_reorder_turn_list(p_unit_id);
    
    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'professional_id', p_professional_id,
        'new_points', v_new_points,
        'message', 'Ponto adicionado com sucesso'
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Função para reordenar lista baseada na pontuação
CREATE OR REPLACE FUNCTION public.fn_reorder_turn_list(p_unit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_barber RECORD;
    v_position INTEGER := 1;
BEGIN
    -- Reordenar por pontos (menor primeiro) e depois por data de cadastro
    FOR v_barber IN 
        SELECT btl.professional_id, btl.points
        FROM public.barbers_turn_list btl
        JOIN public.professionals p ON p.id = btl.professional_id
        WHERE btl.unit_id = p_unit_id
        ORDER BY btl.points ASC, p.created_at ASC
    LOOP
        UPDATE public.barbers_turn_list
        SET position = v_position
        WHERE unit_id = p_unit_id AND professional_id = v_barber.professional_id;
        
        v_position := v_position + 1;
    END LOOP;
END;
$$;

-- Função para reset mensal automático
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
        'message', 'Reset mensal executado com sucesso'
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.barbers_turn_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers_turn_history ENABLE ROW LEVEL SECURITY;

-- Políticas para barbers_turn_list
CREATE POLICY "Users can view turn list for their unit" ON public.barbers_turn_list
    FOR SELECT USING (
        unit_id IN (
            SELECT unit_id FROM public.professionals 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can update turn list for their unit" ON public.barbers_turn_list
    FOR UPDATE USING (
        unit_id IN (
            SELECT unit_id FROM public.professionals 
            WHERE user_id = auth.uid() 
            AND role IN ('gerente', 'admin') 
            AND is_active = true
        )
    );

CREATE POLICY "Admins can manage all turn lists" ON public.barbers_turn_list
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.professionals 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Políticas para barbers_turn_history
CREATE POLICY "Users can view history for their unit" ON public.barbers_turn_history
    FOR SELECT USING (
        unit_id IN (
            SELECT unit_id FROM public.professionals 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can manage all history" ON public.barbers_turn_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.professionals 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.barbers_turn_list IS 'Lista atual da vez dos barbeiros por unidade com pontuação';
COMMENT ON TABLE public.barbers_turn_history IS 'Histórico mensal de pontuação dos barbeiros';

COMMENT ON COLUMN public.barbers_turn_list.points IS 'Pontos acumulados pelo barbeiro (quanto mais pontos, mais para o final da fila)';
COMMENT ON COLUMN public.barbers_turn_list.position IS 'Posição atual na fila (1 = primeiro da vez)';
COMMENT ON COLUMN public.barbers_turn_list.last_updated IS 'Última vez que pontos foram adicionados';

COMMENT ON COLUMN public.barbers_turn_history.total_points IS 'Total de pontos acumulados no mês';
COMMENT ON COLUMN public.barbers_turn_history.final_position IS 'Posição final no mês';

-- =====================================================
-- VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View para lista da vez com dados completos
CREATE OR REPLACE VIEW public.vw_turn_list_complete AS
SELECT 
    btl.id,
    btl.unit_id,
    u.name as unit_name,
    btl.professional_id,
    p.name as professional_name,
    btl.points,
    btl.position,
    btl.last_updated,
    btl.created_at,
    btl.updated_at
FROM public.barbers_turn_list btl
JOIN public.units u ON u.id = btl.unit_id
JOIN public.professionals p ON p.id = btl.professional_id
WHERE u.is_active = true AND p.is_active = true
ORDER BY btl.unit_id, btl.position;

-- View para histórico com dados completos
CREATE OR REPLACE VIEW public.vw_turn_history_complete AS
SELECT 
    bth.id,
    bth.unit_id,
    u.name as unit_name,
    bth.professional_id,
    p.name as professional_name,
    bth.month,
    bth.year,
    bth.total_points,
    bth.final_position,
    bth.created_at
FROM public.barbers_turn_history bth
JOIN public.units u ON u.id = bth.unit_id
JOIN public.professionals p ON p.id = bth.professional_id
WHERE u.is_active = true AND p.is_active = true
ORDER BY bth.year DESC, bth.month DESC, bth.unit_id, bth.final_position;

-- =====================================================
-- GRANTS E PERMISSÕES
-- =====================================================

-- Conceder permissões para authenticated users
GRANT SELECT, INSERT, UPDATE ON public.barbers_turn_list TO authenticated;
GRANT SELECT ON public.barbers_turn_history TO authenticated;
GRANT SELECT ON public.vw_turn_list_complete TO authenticated;
GRANT SELECT ON public.vw_turn_history_complete TO authenticated;

-- Conceder permissões para service role (Edge Functions)
GRANT ALL ON public.barbers_turn_list TO service_role;
GRANT ALL ON public.barbers_turn_history TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_initialize_turn_list(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_add_point_to_barber(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_reorder_turn_list(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_monthly_reset_turn_list() TO service_role;
