# 🔥 PROMPT URGENTE - CORRIGIR FUNÇÃO RPC

## ❌ ERRO AO CRIAR PROFISSIONAL

```
Erro ao criar profissional: column "email_confirm_sent_at" of relation "users" does not exist
```

**Causa:** A função `create_professional_with_user` está tentando inserir colunas que não existem na tabela `auth.users`.

---

## 🎯 MISSÃO: CORRIGIR A FUNÇÃO RPC

### 1️⃣ VERIFICAR ESTRUTURA DA TABELA auth.users

```sql
-- Ver quais colunas REALMENTE existem em auth.users
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
    AND table_name = 'users'
ORDER BY ordinal_position;
```

**ME REPORTE:** Quais colunas existem na tabela `auth.users`?

---

### 2️⃣ RECRIAR A FUNÇÃO COM AS COLUNAS CORRETAS

```sql
-- Drop da função existente
DROP FUNCTION IF EXISTS create_professional_with_user(text, text, text, user_role, uuid, numeric);

-- Recriar com apenas as colunas que existem
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
        -- Criar usuário no auth.users usando APENAS colunas que existem
        -- Versão simplificada e segura
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role
        )
        VALUES (
            gen_random_uuid(),
            user_email,
            crypt(user_password, gen_salt('bf')),
            now(), -- Email já confirmado
            now(),
            now(),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            jsonb_build_object('role', professional_role::text, 'name', professional_name),
            'authenticated',
            'authenticated'
        )
        RETURNING id INTO new_user_id;

        -- Criar profissional em professionals
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

        -- Retornar sucesso
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

-- Grant de execução
GRANT EXECUTE ON FUNCTION create_professional_with_user TO authenticated;
```

---

### 3️⃣ TESTAR A FUNÇÃO CORRIGIDA

```sql
-- Testar criação de profissional
SELECT create_professional_with_user(
    'teste.funcao@barber.com',
    'senha123456',
    'Teste Função Corrigida',
    'barbeiro'::user_role,
    (SELECT id FROM units LIMIT 1),
    50.00
);
```

**RESULTADO ESPERADO:**
```json
{
  "success": true,
  "user_id": "uuid-gerado",
  "professional_id": "uuid-gerado",
  "message": "Profissional criado com sucesso"
}
```

---

### 4️⃣ VERIFICAR SE O USUÁRIO FOI CRIADO

```sql
-- Ver se o usuário foi criado em auth.users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'teste.funcao@barber.com';

-- Ver se o profissional foi criado
SELECT
    p.id,
    p.name,
    p.role,
    p.user_id,
    u.email
FROM professionals p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'teste.funcao@barber.com';
```

---

## 🔍 COLUNAS ALTERNATIVAS PARA auth.users

Se as colunas que usei não existirem, aqui estão as **colunas mínimas obrigatórias**:

```sql
-- Versão minimalista (PLANO B)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    created_at,
    updated_at,
    aud,
    role
)
VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    'authenticated',
    'authenticated'
)
RETURNING id INTO new_user_id;
```

---

## ✅ CHECKLIST

Após executar:

- [ ] Verificou quais colunas existem em `auth.users`
- [ ] Recriou a função RPC com sucesso
- [ ] Testou a função e retornou `success: true`
- [ ] Verificou que usuário e profissional foram criados
- [ ] Função executa sem erros

---

**EXECUTE E ME REPORTE O RESULTADO!** 🚀
