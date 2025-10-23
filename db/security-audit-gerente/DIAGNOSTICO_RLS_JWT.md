# 🔍 DIAGNÓSTICO: RLS Policies e JWT

## ❌ Problema Identificado

As **RLS policies** estão **CORRETAS**, mas há um **desalinhamento** entre:

1. **Onde a role está armazenada:** `user_metadata.role`
2. **Como as policies estão acessando:** `auth.jwt() ->> 'role'`

---

## 📊 Análise do Banco de Dados

### ✅ Usuário Sofia Santos

```json
{
  "id": "2a5bc9e6-dacc-45eb-9095-6f323ca1652e",
  "email": "sofiasantos@tratodebarbados.com",
  "status": "ACTIVE",
  "user_metadata": {
    "name": "Sofia Santos",
    "role": "gerente" // ✅ Role está aqui
  },
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
    // ❌ Não tem 'role' aqui
  }
}
```

### ✅ Professional Vinculado

```sql
professional_id: c35bcf9a-324f-4acd-bca9-b997895f3362
user_id: 2a5bc9e6-dacc-45eb-9095-6f323ca1652e
unit_id: 577aa606-ae95-433d-8869-e90275241076
name: Sofia Santos
role: gerente ✅
is_active: true ✅
unit_name: Nova Lima
```

### ✅ RLS Policies Criadas

**36 políticas criadas** para o papel gerente, exemplo:

```sql
-- revenues (Receitas)
✅ gerente_select_revenues   (SELECT)
✅ gerente_insert_revenues   (INSERT)
✅ gerente_update_revenues   (UPDATE)
✅ gerente_no_delete_revenues (DELETE bloqueado)

-- expenses (Despesas)
✅ gerente_select_expenses
✅ gerente_insert_expenses
✅ gerente_update_expenses
✅ gerente_no_delete_expenses

-- categories (Categorias)
✅ gerente_select_categories
✅ gerente_insert_categories
-- ... etc
```

---

## 🐛 O Problema Real

### Como as Policies Estão Acessando (ERRADO):

```sql
(auth.jwt() ->> 'role') = 'gerente'
```

Isso busca a chave `role` **diretamente no JWT root**, mas no Supabase o `user_metadata` fica dentro de um subcampo.

### Como Deveria Ser (CORRETO):

**Opção A:** Acessar via subcampo `user_metadata`:

```sql
(auth.jwt() -> 'user_metadata' ->> 'role') = 'gerente'
```

**Opção B:** Usar claims customizados (requer configuração do Supabase):

```sql
(auth.jwt() ->> 'role') = 'gerente'
```

Mas isso requer configurar **custom claims** no Supabase Auth.

---

## ✅ Soluções Possíveis

### Solução 1: Atualizar Policies para user_metadata (RECOMENDADO)

Atualizar todas as 36 políticas para acessar corretamente:

```sql
-- ANTES (errado):
(auth.jwt() ->> 'role') = 'gerente'

-- DEPOIS (correto):
(auth.jwt() -> 'user_metadata' ->> 'role') = 'gerente'
```

**Vantagens:**

- ✅ Não requer mudanças no Supabase Auth
- ✅ Funciona imediatamente
- ✅ Segue padrão do Supabase

**Desvantagens:**

- ⚠️ Precisa atualizar 36 políticas

---

### Solução 2: Configurar Custom Claims no Supabase

Adicionar hook de autenticação no Supabase para expor `role` diretamente no JWT root.

**Database Webhook:**

```sql
-- Criar função para expor role no JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Buscar role do user_metadata
  user_role := event->'claims'->'user_metadata'->>'role';

  -- Adicionar ao root do JWT
  claims := event->'claims';
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;
```

Depois configurar no Supabase Dashboard:

```
Authentication > Hooks > Custom Access Token
```

**Vantagens:**

- ✅ Policies ficam mais limpas
- ✅ Padrão mais comum

**Desvantagens:**

- ❌ Requer configuração adicional
- ❌ Mais complexo

---

### Solução 3: Hybrid Approach (MAIS RÁPIDO)

Criar uma **função helper** que facilita o acesso:

```sql
-- Função helper para pegar role do JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',  -- Tenta root primeiro (custom claims)
    auth.jwt() -> 'user_metadata' ->> 'role'  -- Fallback para user_metadata
  );
$$;
```

Depois usar nas policies:

```sql
-- ANTES:
(auth.jwt() ->> 'role') = 'gerente'

-- DEPOIS:
(get_user_role() = 'gerente')
```

**Vantagens:**

- ✅ Flexível (funciona com ambos os formatos)
- ✅ Fácil de atualizar policies
- ✅ Mais legível

**Desvantagens:**

- ⚠️ Adiciona uma camada extra

---

## 🎯 Recomendação Final

**Use a Solução 3 (Hybrid Approach):**

1. **Criar função helper** `get_user_role()`
2. **Atualizar as 36 policies** para usar a função
3. **Testar** com usuário Sofia Santos

---

## 📝 Script de Correção

```sql
-- ============================================================================
-- 1. CRIAR FUNÇÃO HELPER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role'
  );
$$;

-- ============================================================================
-- 2. EXEMPLO: ATUALIZAR POLICY DE REVENUES
-- ============================================================================
DROP POLICY IF EXISTS gerente_select_revenues ON revenues;

CREATE POLICY gerente_select_revenues
ON revenues FOR SELECT
TO authenticated
USING (
  (get_user_role() = 'admin')
  OR
  (
    (get_user_role() = 'gerente')
    AND
    (unit_id IN (
      SELECT p.unit_id
      FROM professionals p
      WHERE p.user_id = auth.uid() AND p.is_active = true
    ))
  )
  OR
  (unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  ))
);

-- Repetir para todas as 36 policies...
```

---

## 🧪 Como Testar

Após aplicar a correção:

```sql
-- Simular usuário Sofia Santos
SET request.jwt.claims = '{
  "sub": "2a5bc9e6-dacc-45eb-9095-6f323ca1652e",
  "user_metadata": {"role": "gerente"}
}';

-- Testar SELECT em revenues
SELECT COUNT(*) FROM revenues;
-- Deve retornar receitas da unidade Nova Lima

-- Testar INSERT
INSERT INTO revenues (unit_id, amount, description)
VALUES ('577aa606-ae95-433d-8869-e90275241076', 100.00, 'Teste');
-- Deve funcionar

-- Testar DELETE
DELETE FROM revenues WHERE id = '...';
-- Deve BLOQUEAR (403 Forbidden)
```

---

## 📊 Status Atual

| Item                   | Status      | Observação                        |
| ---------------------- | ----------- | --------------------------------- |
| Usuário Sofia criado   | ✅ OK       | Confirmed, Active                 |
| Professional vinculado | ✅ OK       | role='gerente', unit_id correto   |
| RLS Policies criadas   | ✅ OK       | 36 políticas ativas               |
| JWT com role           | ❌ PROBLEMA | Policies acessando caminho errado |
| Frontend routes        | ✅ OK       | Restrições implementadas          |

---

## 🚀 Próxima Ação

**Execute o script de correção** para criar a função helper e atualizar as policies.

Quer que eu gere o script SQL completo para corrigir todas as 36 policies?
