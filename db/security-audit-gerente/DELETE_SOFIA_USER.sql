-- ============================================================================
-- 🗑️ REMOVER USUÁRIO SOFIA SANTOS (CRIADO INCORRETAMENTE)
-- ============================================================================
-- 
-- Este script remove o usuário Sofia Santos que foi criado incorretamente
-- diretamente na tabela auth.users com senha criptografada via crypt()
-- 
-- ⚠️ IMPORTANTE: Execute este script ANTES de recriar o usuário via Dashboard
-- 
-- @author Andrey Viana
-- @date 2025-10-23
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_professional_count INTEGER;
BEGIN
    -- 1. Buscar ID do usuário
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'sofiasantos@tratodebarbados.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Usuário Sofia Santos não encontrado. Nada a deletar.';
    ELSE
        RAISE NOTICE '🔍 Usuário encontrado: %', v_user_id;

        -- 2. Verificar e deletar professional vinculado
        SELECT COUNT(*) INTO v_professional_count
        FROM professionals
        WHERE user_id = v_user_id;

        IF v_professional_count > 0 THEN
            DELETE FROM professionals WHERE user_id = v_user_id;
            RAISE NOTICE '✅ % professional(s) deletado(s)', v_professional_count;
        ELSE
            RAISE NOTICE 'ℹ️ Nenhum professional vinculado';
        END IF;

        -- 3. Deletar usuário da tabela auth.users
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE '✅ Usuário Sofia Santos deletado com sucesso!';
        
        RAISE NOTICE '🎉 Limpeza concluída. Agora crie o usuário via Supabase Dashboard.';
    END IF;
END $$;

-- ============================================================================
-- VERIFICAR REMOÇÃO
-- ============================================================================
SELECT 
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'sofiasantos@tratodebarbados.com')
        THEN '❌ Usuário ainda existe!'
        ELSE '✅ Usuário removido com sucesso'
    END AS status;
