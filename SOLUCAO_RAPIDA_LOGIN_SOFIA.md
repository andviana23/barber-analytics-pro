# 🚨 SOLUÇÃO RÁPIDA: Erro 400 no Login Sofia Santos

## ❌ Problema

```
Failed to load resource: the server responded with a status of 400
Error: invalid_credentials
```

**Causa:** Usuário foi criado **diretamente no banco de dados** usando `crypt()` do PostgreSQL, que **não é compatível** com o sistema de autenticação do Supabase Auth.

---

## ✅ Solução em 3 Passos

### **PASSO 1: Deletar Usuário Incorreto** (via MCP)

Execute este comando via **MCP PostgreSQL**:

```sql
-- Deletar usuário criado incorretamente
DELETE FROM professionals
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sofiasantos@tratodebarbados.com');

DELETE FROM auth.users
WHERE email = 'sofiasantos@tratodebarbados.com';
```

---

### **PASSO 2: Criar Usuário Correto** (via Supabase Dashboard)

1. **Acesse:** https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm

2. **Vá em:** `Authentication` > `Users` > `Add User`

3. **Preencha:**

   ```
   Email: sofiasantos@tratodebarbados.com
   Password: Sofia@2025
   Auto Confirm User: ✅ SIM (IMPORTANTE!)
   ```

4. **User Metadata (JSON):**

   ```json
   {
     "role": "gerente",
     "name": "Sofia Santos"
   }
   ```

5. **Clique em:** `Create User`

6. **Copie o UUID gerado** (você vai precisar)

---

### **PASSO 3: Vincular com Professional** (via MCP)

Execute este SQL via **MCP PostgreSQL** (substitua `<UUID>` pelo ID copiado):

```sql
DO $$
DECLARE
    v_user_id UUID := '<COLE_O_UUID_AQUI>'; -- ⚠️ Substitua pelo UUID copiado
    v_unit_id UUID;
BEGIN
    -- Buscar primeira unidade ativa
    SELECT id INTO v_unit_id
    FROM units
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;

    -- Criar professional
    INSERT INTO professionals (
        unit_id, user_id, name, role, is_active
    )
    VALUES (
        v_unit_id, v_user_id, 'Sofia Santos', 'gerente', true
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'gerente', name = 'Sofia Santos', is_active = true;

    RAISE NOTICE '✅ Professional vinculado com sucesso!';
END $$;
```

---

## 🧪 Testar

1. **Limpe o cache:** Ctrl + Shift + Delete
2. **Acesse:** http://localhost:5173/login
3. **Login:**
   - Email: `sofiasantos@tratodebarbados.com`
   - Senha: `Sofia@2025`
4. ✅ **Deve funcionar!**

---

## 📋 Resumo

| Ação        | Onde               | O Quê                                      |
| ----------- | ------------------ | ------------------------------------------ |
| 1️⃣ Deletar  | MCP PostgreSQL     | DELETE FROM auth.users WHERE email = '...' |
| 2️⃣ Criar    | Supabase Dashboard | Add User com Auto Confirm ✅               |
| 3️⃣ Vincular | MCP PostgreSQL     | INSERT INTO professionals                  |
| 4️⃣ Testar   | Navegador          | Login + verificar badge "Gerente"          |

---

## 🔑 Informações Importantes

- **Supabase Project:** cwfrtqtienguzwsybvwm
- **Email:** sofiasantos@tratodebarbados.com
- **Senha:** Sofia@2025
- **Role:** gerente
- **Dashboard:** https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm

---

**Status:** ⏳ Aguardando execução dos 3 passos  
**Prioridade:** 🔥 Urgente  
**Tempo Estimado:** 5 minutos
