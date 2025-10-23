/**
 * 🔧 SCRIPT: CORRIGIR ROLE DO USUÁRIO
 * 
 * Use este script quando um usuário estiver aparecendo com role incorreto
 * no frontend após login.
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- 1. DIAGNOSTICAR PROBLEMA
-- ============================================================================

-- Verificar role em todos os lugares para um email específico
SELECT 
    '🔍 DIAGNÓSTICO' AS etapa,
    u.email,
    u.raw_user_meta_data->>'role' AS auth_metadata_role,
    p.role AS professional_role,
    p.is_active AS professional_ativo,
    unit.name AS unidade,
    u.created_at AS user_criado,
    u.updated_at AS user_atualizado,
    p.updated_at AS professional_atualizado
FROM auth.users u
LEFT JOIN professionals p ON p.user_id = u.id
LEFT JOIN units unit ON unit.id = p.unit_id
WHERE u.email = 'SEU_EMAIL_AQUI@exemplo.com'; -- ⚠️ TROCAR EMAIL

-- ============================================================================
-- 2. CORRIGIR ROLE NO AUTH.USERS (USER_METADATA)
-- ============================================================================

-- Atualizar role no user_metadata
UPDATE auth.users
SET 
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"ROLE_DESEJADO"'::jsonb  -- ⚠️ TROCAR: admin, gerente, barbeiro, recepcionista
    ),
    updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com'
RETURNING 
    email,
    raw_user_meta_data->>'role' AS novo_role,
    updated_at;

-- ============================================================================
-- 3. CORRIGIR ROLE NA TABELA PROFESSIONALS
-- ============================================================================

-- Atualizar role no professional
UPDATE professionals
SET 
    role = 'ROLE_DESEJADO',  -- ⚠️ TROCAR: admin, gerente, barbeiro, recepcionista
    updated_at = NOW()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI@exemplo.com')
RETURNING 
    name,
    role AS novo_role,
    updated_at;

-- ============================================================================
-- 4. VALIDAR CORREÇÃO
-- ============================================================================

-- Verificar se correção foi aplicada
SELECT 
    '✅ VALIDAÇÃO' AS status,
    u.email,
    u.raw_user_meta_data->>'role' AS auth_role,
    p.role AS professional_role,
    unit.name AS unidade,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = p.role
        THEN '✅ ROLES SINCRONIZADOS'
        ELSE '❌ ROLES DIFERENTES - EXECUTAR CORREÇÃO'
    END AS resultado,
    CASE
        WHEN u.raw_user_meta_data->>'role' = p.role
        THEN '👉 Faça LOGOUT e LOGIN novamente'
        ELSE '👉 Execute os passos 2 e 3'
    END AS proximo_passo
FROM auth.users u
INNER JOIN professionals p ON p.user_id = u.id
INNER JOIN units unit ON unit.id = p.unit_id
WHERE u.email = 'SEU_EMAIL_AQUI@exemplo.com';

-- ============================================================================
-- 5. SCRIPT AUTOMÁTICO (USE COM CUIDADO!)
-- ============================================================================

-- Script que corrige automaticamente role baseado em um email e role desejado
DO $$
DECLARE
    v_email TEXT := 'SEU_EMAIL_AQUI@exemplo.com';  -- ⚠️ TROCAR
    v_novo_role TEXT := 'gerente';                  -- ⚠️ TROCAR
    v_user_id UUID;
BEGIN
    -- Buscar user_id
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado com email: %', v_email;
    END IF;
    
    -- Atualizar auth.users
    UPDATE auth.users
    SET 
        raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            to_jsonb(v_novo_role)
        ),
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Atualizar professionals
    UPDATE professionals
    SET 
        role = v_novo_role,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    RAISE NOTICE '✅ Role atualizado para: %', v_novo_role;
    RAISE NOTICE '👉 Peça ao usuário para fazer LOGOUT e LOGIN novamente';
    RAISE NOTICE '👉 Limpar cache do navegador se necessário (Ctrl+Shift+Del)';
END $$;

-- ============================================================================
-- 6. LIMPAR CACHE DE SESSÃO (OPCIONAL)
-- ============================================================================

-- Se o problema persistir, pode ser necessário invalidar todas as sessões do usuário
-- ⚠️ CUIDADO: Isso fará logout forçado em todos os dispositivos

/*
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI@exemplo.com');
*/

-- ============================================================================
-- ROLES VÁLIDOS NO SISTEMA:
-- - admin: Administrador completo
-- - gerente: Gerente de unidade (acesso restrito)
-- - barbeiro: Barbeiro/profissional
-- - recepcionista: Recepcionista
-- - receptionist: Recepcionista (inglês)
-- ============================================================================

-- ============================================================================
-- TROUBLESHOOTING:
--
-- Se após LOGOUT/LOGIN o problema persistir:
-- 1. Limpar cache do navegador (Ctrl+Shift+Del)
-- 2. Limpar localStorage: localStorage.clear() no Console
-- 3. Invalidar sessões (usar query acima)
-- 4. Verificar se AuthContext está pegando dados corretos
-- 5. Verificar logs do console do navegador
-- ============================================================================
