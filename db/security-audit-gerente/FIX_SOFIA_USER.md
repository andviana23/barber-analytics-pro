# 🔐 CORREÇÃO: Usuário Sofia Santos

## ❌ Problema Identificado

O erro `400 - invalid_credentials` ocorre porque o usuário foi criado **diretamente na tabela** `auth.users` usando `crypt()` do PostgreSQL.

**O Supabase Auth NÃO aceita senhas inseridas diretamente no banco de dados.**

---

## ✅ Solução: Criar Usuário via Supabase Dashboard

### Opção 1: Via Dashboard (RECOMENDADO)

1. **Acesse o Supabase Dashboard:**

   ```
   https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm
   ```

2. **Vá em Authentication > Users**

3. **Clique em "Add User" (ou "Invite User")**

4. **Preencha os dados:**
   - **Email:** `sofiasantos@tratodebarbados.com`
   - **Password:** `Sofia@2025`
   - **Auto Confirm User:** ✅ **SIM** (importante!)
   - **Send Email Invitation:** ❌ Não (vamos criar diretamente)

5. **Adicione User Metadata (JSON):**

   ```json
   {
     "role": "gerente",
     "name": "Sofia Santos"
   }
   ```

6. **Clique em "Create User"**

7. **Copie o UUID gerado** (você vai precisar dele)

---

### Opção 2: Via Edge Function (Mais Complexo)

Se preferir automatizar, você pode criar uma Edge Function:

```typescript
// supabase/functions/create-user/index.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async req => {
  try {
    // Criar usuário com senha
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'sofiasantos@tratodebarbados.com',
      password: 'Sofia@2025',
      email_confirm: true, // Auto-confirmar
      user_metadata: {
        role: 'gerente',
        name: 'Sofia Santos',
      },
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, user: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

### Opção 3: Via API REST (Simples)

Use o endpoint Admin do Supabase:

```bash
# Obtenha a SERVICE_ROLE_KEY do Supabase Dashboard > Settings > API

curl -X POST 'https://cwfrtqtienguzwsybvwm.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sofiasantos@tratodebarbados.com",
    "password": "Sofia@2025",
    "email_confirm": true,
    "user_metadata": {
      "role": "gerente",
      "name": "Sofia Santos"
    }
  }'
```

---

## 🔄 Passos Após Criar o Usuário

### 1. Vincular com a tabela `professionals`

Após criar o usuário no Dashboard/API, execute este SQL no **Supabase SQL Editor**:

```sql
-- ============================================================================
-- VINCULAR USUÁRIO COM PROFESSIONAL
-- ============================================================================
DO $$
DECLARE
    v_user_id UUID;
    v_unit_id UUID;
    v_professional_id UUID;
BEGIN
    -- 1. Buscar ID do usuário
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'sofiasantos@tratodebarbados.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado!';
    END IF;

    RAISE NOTICE '✅ Usuário encontrado: %', v_user_id;

    -- 2. Buscar ID da unidade (vamos usar a primeira ativa)
    SELECT id INTO v_unit_id
    FROM units
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;

    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION '❌ Nenhuma unidade ativa encontrada!';
    END IF;

    RAISE NOTICE '✅ Unidade encontrada: %', v_unit_id;

    -- 3. Verificar se já existe professional para este usuário
    SELECT id INTO v_professional_id
    FROM professionals
    WHERE user_id = v_user_id;

    -- 4. Criar ou atualizar professional
    IF v_professional_id IS NULL THEN
        -- Criar novo professional
        INSERT INTO professionals (
            unit_id,
            user_id,
            name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            v_unit_id,
            v_user_id,
            'Sofia Santos',
            'gerente',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_professional_id;

        RAISE NOTICE '✅ Professional criado: %', v_professional_id;
    ELSE
        -- Atualizar existing professional
        UPDATE professionals
        SET
            role = 'gerente',
            name = 'Sofia Santos',
            is_active = true,
            updated_at = NOW()
        WHERE id = v_professional_id;

        RAISE NOTICE '✅ Professional atualizado: %', v_professional_id;
    END IF;

    RAISE NOTICE '🎉 SUCESSO! Usuário gerente criado e vinculado.';
END $$;
```

---

## 🧪 Testar o Login

Após executar os passos acima:

1. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
2. **Acesse:** http://localhost:5173/login
3. **Credenciais:**
   - Email: `sofiasantos@tratodebarbados.com`
   - Senha: `Sofia@2025`
4. **Clique em "Entrar"**
5. ✅ **Deve redirecionar para /dashboard** com badge "Gerente"

---

## 🗑️ Limpar Usuário Antigo (Opcional)

Se quiser remover o usuário criado incorretamente:

```sql
-- ⚠️ CUIDADO: Isso vai deletar o usuário e todos os dados relacionados

-- 1. Deletar professional vinculado
DELETE FROM professionals
WHERE user_id = (
    SELECT id FROM auth.users
    WHERE email = 'sofiasantos@tratodebarbados.com'
);

-- 2. Deletar usuário (via Dashboard é mais seguro)
-- Vá em Authentication > Users > Encontre Sofia Santos > Delete
```

**OU via SQL (se tiver permissão):**

```sql
-- ⚠️ Requer privilégios de admin
DELETE FROM auth.users
WHERE email = 'sofiasantos@tratodebarbados.com';
```

---

## 📝 Checklist de Implementação

- [ ] Deletar usuário antigo (via Dashboard ou SQL)
- [ ] Criar novo usuário via Dashboard (Authentication > Users > Add User)
- [ ] Email: sofiasantos@tratodebarbados.com
- [ ] Senha: Sofia@2025
- [ ] Auto Confirm User: ✅ SIM
- [ ] User Metadata: `{"role": "gerente", "name": "Sofia Santos"}`
- [ ] Copiar UUID gerado
- [ ] Executar SQL para vincular com professionals
- [ ] Limpar cache do navegador
- [ ] Testar login
- [ ] Verificar badge "Gerente"
- [ ] Testar acesso a rotas permitidas
- [ ] Verificar bloqueio de rotas restritas

---

## 🎯 Resultado Esperado

✅ Login bem-sucedido  
✅ Badge mostra "Gerente"  
✅ Acesso a: Dashboard, Financeiro, Lista da Vez, Cadastros (limitado), DRE  
❌ Bloqueado: Formas de Pagamento, Produtos, Contas Bancárias, Profissionais, Unidades

---

## 🆘 Troubleshooting

### Ainda recebendo 400 após recriar

1. **Limpe completamente o cache:** Ctrl + Shift + Delete > "Tudo" > Limpar
2. **Feche todas as abas** do navegador
3. **Reabra** e tente novamente
4. **Verifique no Supabase Dashboard** > Authentication > Users se o usuário está "Confirmed"

### Senha não funciona

1. **Resete a senha** via Dashboard: Authentication > Users > Sofia Santos > Reset Password
2. **Ou use "Send Magic Link"** para fazer login sem senha

### Usuário não aparece na lista

- Aguarde alguns segundos (pode ter delay de sincronização)
- Atualize a página do Dashboard (F5)

---

**Próxima Ação:** Siga a **Opção 1** (Dashboard) para criar o usuário corretamente.
