-- =====================================================
-- FIX: Lista da Vez - RLS para Views
-- =====================================================
-- Data: 2025-10-31
-- Problema: Views não conseguem acessar units devido a RLS
-- Solução: Recriar views com SECURITY DEFINER ou ajustar RLS
-- =====================================================

-- =====================================================
-- OPÇÃO 1: Recriar views com SECURITY DEFINER
-- (Views executam com permissões do criador, bypassando RLS)
-- =====================================================

-- Drop views existentes
DROP VIEW IF EXISTS public.vw_turn_list_complete CASCADE;
DROP VIEW IF EXISTS public.vw_turn_history_complete CASCADE;

-- Recriar view para lista da vez com SECURITY DEFINER
CREATE OR REPLACE VIEW public.vw_turn_list_complete 
WITH (security_barrier = false, security_invoker = false) AS
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
WHERE u.is_active = true AND p.is_active = true;

-- Recriar view para histórico com SECURITY DEFINER
CREATE OR REPLACE VIEW public.vw_turn_history_complete 
WITH (security_barrier = false, security_invoker = false) AS
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
WHERE u.is_active = true AND p.is_active = true;

-- Recriar grants
GRANT SELECT ON public.vw_turn_list_complete TO authenticated;
GRANT SELECT ON public.vw_turn_history_complete TO authenticated;

-- =====================================================
-- OPÇÃO 2 (ALTERNATIVA): Função auxiliar que bypassa RLS
-- =====================================================

-- Função para buscar lista da vez (bypassa RLS internamente)
CREATE OR REPLACE FUNCTION public.fn_get_turn_list_for_unit(p_unit_id UUID)
RETURNS TABLE (
    id UUID,
    unit_id UUID,
    unit_name TEXT,
    professional_id UUID,
    professional_name TEXT,
    points INTEGER,
    position INTEGER,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER -- Executa com permissões do owner (bypassa RLS)
STABLE
AS $$
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
    WHERE btl.unit_id = p_unit_id
      AND u.is_active = true 
      AND p.is_active = true
    ORDER BY btl.position;
$$;

-- Função para buscar histórico mensal (bypassa RLS internamente)
CREATE OR REPLACE FUNCTION public.fn_get_turn_history_for_unit(
    p_unit_id UUID,
    p_month INTEGER DEFAULT NULL,
    p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    unit_id UUID,
    unit_name TEXT,
    professional_id UUID,
    professional_name TEXT,
    month INTEGER,
    year INTEGER,
    total_points INTEGER,
    final_position INTEGER,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
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
    WHERE bth.unit_id = p_unit_id
      AND (p_month IS NULL OR bth.month = p_month)
      AND (p_year IS NULL OR bth.year = p_year)
      AND u.is_active = true 
      AND p.is_active = true
    ORDER BY bth.year DESC, bth.month DESC, bth.final_position;
$$;

-- Grants para as funções
GRANT EXECUTE ON FUNCTION public.fn_get_turn_list_for_unit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_turn_history_for_unit(UUID, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON VIEW public.vw_turn_list_complete IS 
'View segura para lista da vez com dados completos (bypassa RLS internamente)';

COMMENT ON VIEW public.vw_turn_history_complete IS 
'View segura para histórico com dados completos (bypassa RLS internamente)';

COMMENT ON FUNCTION public.fn_get_turn_list_for_unit(UUID) IS 
'Função segura para buscar lista da vez de uma unidade específica (SECURITY DEFINER bypassa RLS)';

COMMENT ON FUNCTION public.fn_get_turn_history_for_unit(UUID, INTEGER, INTEGER) IS 
'Função segura para buscar histórico de uma unidade específica (SECURITY DEFINER bypassa RLS)';

-- =====================================================
-- VALIDAÇÃO
-- =====================================================

-- Verificar se views estão acessíveis
DO $$
BEGIN
    RAISE NOTICE 'Testing vw_turn_list_complete access...';
    PERFORM 1 FROM public.vw_turn_list_complete LIMIT 1;
    RAISE NOTICE '✅ vw_turn_list_complete is accessible';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ vw_turn_list_complete is not accessible: %', SQLERRM;
END;
$$;

DO $$
BEGIN
    RAISE NOTICE 'Testing vw_turn_history_complete access...';
    PERFORM 1 FROM public.vw_turn_history_complete LIMIT 1;
    RAISE NOTICE '✅ vw_turn_history_complete is accessible';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ vw_turn_history_complete is not accessible: %', SQLERRM;
END;
$$;
