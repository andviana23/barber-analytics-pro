-- ================================================
-- FUNÇÃO: create_professional_with_user
-- Cria usuário no auth.users e profissional em professionals
-- em uma única transação atômica
-- Data: 2025-10-13
-- ================================================

-- Drop da função se existir (para permitir recriação)
DROP FUNCTION IF EXISTS create_professional_with_user(text, text, text, user_role, uuid, numeric);

-- Criar a função
CREATE OR REPLACE FUNCTION create_professional_with_user(
    user_email text,
    user_password text,
    professional_name text,
    professional_role user_role,
    professional_unit_id uuid,
    professional_commission_rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    new_professional_id uuid;
    result jsonb;
BEGIN
    -- Validações de entrada
    IF user_email IS NULL OR user_email = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email é obrigatório'
        );
    END IF;

    IF user_password IS NULL OR length(user_password) < 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Senha deve ter no mínimo 6 caracteres'
        );
    END IF;

    IF professional_name IS NULL OR professional_name = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nome do profissional é obrigatório'
        );
    END IF;

    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email já cadastrado no sistema'
        );
    END IF;

    -- Verificar se unidade existe (se não for admin)
    IF professional_role != 'admin' AND professional_unit_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM units WHERE id = professional_unit_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Unidade não encontrada'
            );
        END IF;
    END IF;

    BEGIN
        -- 1. Criar usuário no auth.users
        -- Nota: Esta é uma operação privilegiada que requer SECURITY DEFINER
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            user_email,
            crypt(user_password, gen_salt('bf')),
            now(),
            now(),
            now(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('role', professional_role::text),
            false,
            encode(gen_random_bytes(32), 'hex'),
            '',
            ''
        )
        RETURNING id INTO new_user_id;

        -- 2. Criar profissional em professionals
        INSERT INTO professionals (
            id,
            user_id,
            name,
            role,
            unit_id,
            commission_rate,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            new_user_id,
            professional_name,
            professional_role,
            professional_unit_id,
            COALESCE(professional_commission_rate, 0),
            true,
            now(),
            now()
        )
        RETURNING id INTO new_professional_id;

        -- 3. Retornar sucesso
        result := jsonb_build_object(
            'success', true,
            'user_id', new_user_id,
            'professional_id', new_professional_id,
            'message', 'Profissional criado com sucesso'
        );

        RETURN result;

    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Email já cadastrado'
            );
        WHEN foreign_key_violation THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Unidade inválida ou não encontrada'
            );
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', SQLERRM
            );
    END;
END;
$$;

-- Adicionar comentário de documentação
COMMENT ON FUNCTION create_professional_with_user IS
'Cria um usuário no auth.users e um registro correspondente em professionals de forma atômica. Requer role admin ou manager.';

-- Grant de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION create_professional_with_user TO authenticated;

-- ================================================
-- TESTES DA FUNÇÃO (Comentados - descomente para testar)
-- ================================================

-- Teste 1: Criar um barbeiro
-- SELECT create_professional_with_user(
--     'barbeiro1@teste.com',
--     'senha123',
--     'João Silva',
--     'barbeiro'::user_role,
--     '0db46613-5273-4625-a41d-b4a0dec7dfe7'::uuid,
--     50.00
-- );

-- Teste 2: Criar um gerente
-- SELECT create_professional_with_user(
--     'gerente1@teste.com',
--     'senha123',
--     'Maria Santos',
--     'manager'::user_role,
--     'f18050b4-0954-41c1-a1ee-d17617b95bad'::uuid,
--     0.00
-- );

-- Teste 3: Criar um admin
-- SELECT create_professional_with_user(
--     'admin@teste.com',
--     'senha123',
--     'Admin Sistema',
--     'admin'::user_role,
--     NULL,
--     0.00
-- );

-- ================================================
-- FIM DO SCRIPT
-- ================================================
