# 🚀 GUIA RÁPIDO: Criar Usuário Gerente Sofia Santos

## ⚡ Método 1: Via Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar Authentication

1. Abra o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o projeto **barber-analytics-pro**
3. No menu lateral, clique em **Authentication** > **Users**

### Passo 2: Adicionar Novo Usuário

1. Clique no botão **"Add user"** (canto superior direito)
2. Selecione **"Create new user"**

### Passo 3: Preencher Dados

```
Email: sofiasantos@tratodebarbados.com
Password: Sofia@2025
Auto Confirm User: ✅ SIM (marcar checkbox)
```

### Passo 4: Adicionar Metadados

Na seção **"User Metadata"**, cole este JSON:

```json
{
  "role": "gerente",
  "name": "Sofia Santos"
}
```

### Passo 5: Criar Usuário

1. Clique em **"Create User"**
2. ✅ Usuário criado!
3. **COPIE O UUID** gerado (você vai precisar)

---

## 📋 Método 2: Via SQL Editor

Se preferir criar via SQL, siga estes passos:

### Passo 1: Abrir SQL Editor

1. Supabase Dashboard > **SQL Editor**
2. Clique em **"New query"**

### Passo 2: Executar Script

Cole e execute o script: `db/security-audit-gerente/CREATE_USER_GERENTE_SOFIA.sql`

**OU** execute manualmente:

```sql
-- 1. Criar usuário via Dashboard primeiro (não é possível via SQL direto)
-- Depois, vincular com professional:

DO $$
DECLARE
    v_professional_id UUID;
    v_user_id UUID;
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'sofiasantos@tratodebarbados.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado! Crie no Dashboard primeiro.';
    END IF;

    -- Verificar se professional já existe
    SELECT id INTO v_professional_id
    FROM professionals
    WHERE name = 'Sofia Santos' AND role = 'gerente'
    LIMIT 1;

    IF v_professional_id IS NOT NULL THEN
        -- Atualizar existente
        UPDATE professionals
        SET user_id = v_user_id,
            is_active = true,
            updated_at = NOW()
        WHERE id = v_professional_id;

        RAISE NOTICE '✅ Professional atualizado: %', v_professional_id;
    ELSE
        -- Criar novo
        INSERT INTO professionals (
            unit_id,
            user_id,
            name,
            role,
            is_active
        )
        VALUES (
            '577aa606-ae95-433d-8869-e90275241076', -- Nova Lima
            v_user_id,
            'Sofia Santos',
            'gerente',
            true
        )
        RETURNING id INTO v_professional_id;

        RAISE NOTICE '✅ Professional criado: %', v_professional_id;
    END IF;
END $$;
```

---

## ✅ Validar Criação

Execute para validar:

```sql
SELECT
    u.email,
    u.raw_user_meta_data->>'role' AS role,
    u.email_confirmed_at IS NOT NULL AS email_confirmado,
    p.name AS professional_name,
    p.role AS professional_role,
    unit.name AS unit_name,
    p.is_active AS ativo
FROM auth.users u
LEFT JOIN professionals p ON p.user_id = u.id
LEFT JOIN units unit ON unit.id = p.unit_id
WHERE u.email = 'sofiasantos@tratodebarbados.com';
```

**Resultado esperado:**

```
email: sofiasantos@tratodebarbados.com
role: gerente
email_confirmado: true
professional_name: Sofia Santos
professional_role: gerente
unit_name: Nova Lima
ativo: true
```

---

## 🧪 Testar Login

### No Frontend:

1. Faça logout do usuário atual
2. Acesse a página de login
3. Use as credenciais:
   ```
   Email: sofiasantos@tratodebarbados.com
   Senha: Sofia@2025
   ```
4. ✅ Login deve funcionar!

### Verificar Permissões:

Após login, Sofia deve ter acesso a:

- ✅ Dashboard (KPIs da unidade Nova Lima)
- ✅ Financeiro Avançado > Receitas (ver/criar/editar)
- ✅ Financeiro Avançado > Despesas (ver/criar/editar)
- ✅ Cadastros (ver/criar clientes, categorias, etc)
- ✅ Lista da Vez (ver/atualizar)
- ✅ Metas (ver/criar/editar)

Sofia NÃO deve ter acesso a:

- ❌ Configurações Administrativas
- ❌ Assinaturas
- ❌ Produtos/Estoque
- ❌ Conciliação Bancária
- ❌ Botão DELETE em receitas/despesas

---

## 🔐 Segurança

**Senha Temporária:** `Sofia@2025`

⚠️ **IMPORTANTE:** Peça para Sofia trocar a senha no primeiro login!

Você pode forçar troca de senha via Supabase Dashboard:

1. Authentication > Users
2. Clique no usuário Sofia
3. Em "Password", clique em "Send password reset email"

---

## 🐛 Troubleshooting

### Erro: "Invalid credentials"

**Causa:** Usuário não criado ou senha incorreta
**Solução:** Verifique se usuário existe no Supabase Dashboard

### Erro: "Email not confirmed"

**Causa:** Checkbox "Auto Confirm User" não foi marcado
**Solução:**

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'sofiasantos@tratodebarbados.com';
```

### Erro: "Sem permissão para acessar"

**Causa:** Professional não vinculado ou role incorreto
**Solução:** Execute query de validação acima e verifique vinculação

### Professional sem user_id

**Solução:**

```sql
UPDATE professionals
SET user_id = (SELECT id FROM auth.users WHERE email = 'sofiasantos@tratodebarbados.com')
WHERE name = 'Sofia Santos' AND role = 'gerente';
```

---

## 📞 Suporte

Se o erro persistir:

1. Execute query de validação
2. Verifique logs no console do navegador
3. Verifique RLS policies: `SELECT * FROM pg_policies WHERE policyname LIKE 'gerente%';`

---

**Status:** ⏳ Aguardando criação do usuário no Supabase Dashboard

**Próximo passo:** Criar usuário via Dashboard e testar login!
