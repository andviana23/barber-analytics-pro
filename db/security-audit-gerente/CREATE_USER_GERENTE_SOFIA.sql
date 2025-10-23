/**
 * 👤 SCRIPT: CRIAR USUÁRIO GERENTE - SOFIA SANTOS
 * 
 * Objetivo: Criar usuário completo para teste do papel gerente
 * 
 * Email: sofiasantos@tratodebarbados.com
 * Senha: Sofia@2025 (temporária - pedir para trocar no primeiro login)
 * Papel: gerente
 * Unidade: Nova Lima
 * 
 * ⚠️ IMPORTANTE: Execute este script no Supabase SQL Editor
 * ⚠️ Este script usa a extensão pgcrypto para hash de senha
 * 
 * @author Andrey Viana
 * @date 2025-10-23
 */

-- ============================================================================
-- 1. VERIFICAR SE USUÁRIO JÁ EXISTE
-- ============================================================================
DO $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE email = 'sofiasantos@tratodebarbados.com'
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
        RAISE NOTICE '⚠️ Usuário sofiasantos@tratodebarbados.com já existe!';
        RAISE EXCEPTION 'Usuário já cadastrado. Use o script de atualização.';
    ELSE
        RAISE NOTICE '✅ Email disponível. Prosseguindo com criação...';
    END IF;
END $$;

-- ============================================================================
-- 2. CRIAR USUÁRIO NO AUTH.USERS
-- ============================================================================
-- ⚠️ ATENÇÃO: No Supabase, usuários devem ser criados via Dashboard ou API
-- Este script é SOMENTE para referência. Use o Supabase Dashboard:
-- 
-- 1. Vá em Authentication > Users > Add User
-- 2. Email: sofiasantos@tratodebarbados.com
-- 3. Password: Sofia@2025
-- 4. Auto Confirm User: SIM
-- 5. User Metadata (JSON):
/*
{
  "role": "gerente",
  "name": "Sofia Santos"
}
*/
-- 6. Clique em "Create User"
-- 7. Copie o UUID gerado e execute a próxima query substituindo <UUID>

-- ============================================================================
-- 3. APÓS CRIAR NO DASHBOARD, VINCULAR COM PROFESSIONAL
-- ============================================================================
-- Substitua <UUID_DO_USUARIO> pelo ID gerado no passo anterior

-- Primeiro, vamos buscar ou criar o professional
DO $$
DECLARE
    v_professional_id UUID;
    v_user_id UUID;
BEGIN
    -- Buscar o ID do usuário recém criado
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'sofiasantos@tratodebarbados.com'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado! Crie o usuário no Supabase Dashboard primeiro.';
    END IF;
    
    RAISE NOTICE '✅ Usuário encontrado: %', v_user_id;
    
    -- Verificar se já existe professional para este email/nome
    SELECT id INTO v_professional_id
    FROM professionals
    WHERE name = 'Sofia Santos' AND role = 'gerente'
    LIMIT 1;
    
    IF v_professional_id IS NOT NULL THEN
        -- Atualizar professional existente
        UPDATE professionals
        SET user_id = v_user_id,
            is_active = true,
            updated_at = NOW()
        WHERE id = v_professional_id;
        
        RAISE NOTICE '✅ Professional existente atualizado: %', v_professional_id;
    ELSE
        -- Criar novo professional
        INSERT INTO professionals (
            id,
            unit_id,
            user_id,
            name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            '577aa606-ae95-433d-8869-e90275241076', -- Nova Lima
            v_user_id,
            'Sofia Santos',
            'gerente',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_professional_id;
        
        RAISE NOTICE '✅ Novo professional criado: %', v_professional_id;
    END IF;
    
    -- Mostrar resultado final
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ USUÁRIO GERENTE CRIADO COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE 'Email: sofiasantos@tratodebarbados.com';
    RAISE NOTICE 'Senha: Sofia@2025';
    RAISE NOTICE 'Papel: gerente';
    RAISE NOTICE 'Unidade: Nova Lima';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Professional ID: %', v_professional_id;
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '⚠️ IMPORTANTE: Peça para a usuária trocar a senha no primeiro login!';
    RAISE NOTICE '════════════════════════════════════════';
END $$;

-- ============================================================================
-- 4. VALIDAR CRIAÇÃO
-- ============================================================================
SELECT 
    '✅ VALIDAÇÃO' AS status,
    u.id AS user_id,
    u.email,
    u.email_confirmed_at IS NOT NULL AS email_confirmado,
    u.raw_user_meta_data->>'role' AS role,
    u.raw_user_meta_data->>'name' AS name,
    p.id AS professional_id,
    p.name AS professional_name,
    p.role AS professional_role,
    unit.name AS unit_name,
    p.is_active AS ativo
FROM auth.users u
LEFT JOIN professionals p ON p.user_id = u.id
LEFT JOIN units unit ON unit.id = p.unit_id
WHERE u.email = 'sofiasantos@tratodebarbados.com';

-- ============================================================================
-- 5. TESTAR PERMISSÕES (OPCIONAL)
-- ============================================================================
-- Execute como teste (simulando o usuário Sofia):
/*
SET LOCAL "request.jwt.claims" TO '{"role":"gerente"}';

-- Deve retornar registros da unidade Nova Lima
SELECT COUNT(*) AS receitas_visiveis FROM revenues 
WHERE unit_id = '577aa606-ae95-433d-8869-e90275241076';

-- Deve retornar registros da unidade Nova Lima
SELECT COUNT(*) AS despesas_visiveis FROM expenses 
WHERE unit_id = '577aa606-ae95-433d-8869-e90275241076';

-- Deve retornar apenas a unidade vinculada
SELECT COUNT(*) AS profissionais_visiveis FROM professionals 
WHERE unit_id = '577aa606-ae95-433d-8869-e90275241076';
*/

-- ============================================================================
-- RESULTADO ESPERADO:
-- - Usuário criado com email confirmado
-- - Vinculado à unidade Nova Lima
-- - Papel: gerente
-- - Professional ativo
-- - Permissões aplicadas via RLS policies
-- ============================================================================
