# 🔒 Correção RLS - Role "administrador"

**Data:** 30/10/2025  
**Tipo:** Correção de Segurança  
**Severidade:** 🔴 CRÍTICA  
**Status:** ✅ RESOLVIDO

---

## 🐛 Problema Identificado

### Erro Reportado

```
code: "42501"
message: "new row violates row-level security policy for table \"services\""
```

### Causas Raiz (2 problemas encontrados)

#### 1️⃣ Inconsistência de Role

As funções de permissão do Supabase estavam validando role como `'admin'`, mas o usuário foi cadastrado com role `'administrador'`.

**Inconsistência:**

- ❌ Banco de dados esperava: `'admin'`
- ❌ User metadata contém: `'administrador'`
- ❌ Frontend usa: `'administrador'`

#### 2️⃣ Profissional Inativo ou Não Vinculado

A policy de INSERT exige que:

```sql
unit_id IN (
  SELECT p.unit_id
  FROM professionals p
  WHERE p.user_id = auth.uid() AND p.is_active = true
)
```

**Problemas encontrados:**

- ❌ Profissional estava com `is_active = false` na unidade Nova Lima
- ❌ Profissional não existia na unidade Mangabeiras (onde o erro ocorreu)

---

## 🔧 Soluções Aplicadas

### 1️⃣ Função `fn_can_manage_services`

**Antes:**

```sql
RETURN v_user_role IN ('gerente', 'admin');
```

**Depois:**

```sql
-- ✅ Aceita: 'gerente', 'admin' E 'administrador'
RETURN v_user_role IN ('gerente', 'admin', 'administrador');
```

---

### 2️⃣ Função `fn_can_manage_cash_register`

**Antes:**

```sql
-- Verificação 1:
IF v_professional_unit_id IS NULL AND v_user_role NOT IN ('admin', 'gerente') THEN
    RETURN FALSE;
END IF;

-- Verificação 2:
RETURN v_user_role IN ('recepcionista', 'gerente', 'admin');
```

**Depois:**

```sql
-- Verificação 1:
IF v_professional_unit_id IS NULL AND v_user_role NOT IN ('admin', 'administrador', 'gerente') THEN
    RETURN FALSE;
END IF;

-- Verificação 2:
RETURN v_user_role IN ('recepcionista', 'gerente', 'admin', 'administrador');
```

---

### 3️⃣ Função `get_user_role` (Normalização)

**Antes:**

```sql
SELECT COALESCE(
  auth.jwt() ->> 'role',
  auth.jwt() -> 'user_metadata' ->> 'role',
  -- ...
  'user'
);
```

**Depois:**

```sql
SELECT
  CASE
    -- ✅ Normaliza 'administrador' para 'admin'
    WHEN COALESCE(...) = 'administrador' THEN 'admin'
    ELSE COALESCE(...)
  END;
```

**Benefício:** Todas as policies que usam `get_user_role() = 'admin'` agora funcionam automaticamente.

---

### 4️⃣ Vínculo do Administrador com Unidades

**Problema:** Profissional inativo ou não cadastrado nas unidades.

**Solução aplicada:**

```sql
-- 1. Ativar profissional na unidade Nova Lima
UPDATE professionals
SET is_active = true, updated_at = NOW()
WHERE user_id = 'da99464e-7446-49b3-b462-a3fb532d5a32'
  AND unit_id = '577aa606-ae95-433d-8869-e90275241076';

-- 2. Criar profissional na unidade Mangabeiras
INSERT INTO professionals (user_id, unit_id, name, role, commission_rate, is_active)
VALUES (
    'da99464e-7446-49b3-b462-a3fb532d5a32',
    '28c57936-5b4b-45a3-b6ef-eaebb96a9479',
    'Andrey Administrador',
    'admin',
    0.00,
    true
);
```

**Resultado:**

- ✅ Administrador ativo em **Nova Lima**
- ✅ Administrador ativo em **Mangabeiras**

---

## ✅ Validação

### Teste de Permissão

```sql
SELECT
    fn_can_manage_services('da99464e-7446-49b3-b462-a3fb532d5a32'::uuid) as can_manage_services;
```

**Resultado:**

- ✅ `True` (anteriormente retornava `False`)

### Teste de Vínculo com Unidade

```sql
SELECT
    fn_can_manage_services('da99464e-7446-49b3-b462-a3fb532d5a32'::uuid) as can_manage,
    (
        SELECT COUNT(*)
        FROM professionals p
        WHERE p.user_id = 'da99464e-7446-49b3-b462-a3fb532d5a32'
          AND p.unit_id = '28c57936-5b4b-45a3-b6ef-eaebb96a9479'
          AND p.is_active = true
    ) as has_active_professional,
    (
        '28c57936-5b4b-45a3-b6ef-eaebb96a9479'::uuid IN (
            SELECT p.unit_id
            FROM professionals p
            WHERE p.user_id = 'da99464e-7446-49b3-b462-a3fb532d5a32'
              AND p.is_active = true
        )
    ) as unit_in_list;
```

**Resultado:**

- ✅ `can_manage: True`
- ✅ `has_active_professional: 1`
- ✅ `unit_in_list: True`

**Conclusão:** Todas as condições da policy de INSERT estão satisfeitas! ✅

---

## 📋 Tabelas Afetadas

As seguintes tabelas têm policies que agora aceitam role `'administrador'`:

✅ `services` - Criar/editar/deletar serviços  
✅ `cash_registers` - Gerenciar caixas  
✅ `orders` - Gerenciar comandas  
✅ `order_items` - Adicionar/remover itens  
✅ `revenues` - Gerenciar receitas  
✅ `expenses` - Gerenciar despesas  
✅ `parties` - Gerenciar clientes/fornecedores  
✅ `categories` - Gerenciar categorias  
✅ `goals` - Gerenciar metas  
✅ `professionals` - Gerenciar profissionais  
✅ `bank_accounts` - Gerenciar contas bancárias  
✅ `payment_methods` - Gerenciar formas de pagamento  
✅ `units` - Gerenciar unidades

---

## 🎯 Recomendações Futuras

### 1. Padronização de Roles

**Decisão necessária:** Escolher UM padrão único:

**Opção A - Usar 'admin' (Recomendado)**

- ✅ Padrão internacional
- ✅ Mais curto
- ✅ Alinhado com Supabase
- 🔧 Requer migração de user_metadata

**Opção B - Usar 'administrador'**

- ✅ Termo em português
- ✅ Não requer migração
- ⚠️ Mais verboso
- ⚠️ Requer manter normalização

### 2. Script de Migração (Opção A)

```sql
-- Normalizar todos os usuários para 'admin'
UPDATE auth.users
SET raw_user_meta_data =
  jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"admin"'
  )
WHERE raw_user_meta_data->>'role' = 'administrador';
```

### 3. Validação de DTOs

Atualizar validações no frontend para aceitar ambos:

```javascript
// serviceService.js
const ALLOWED_ROLES = ['gerente', 'admin', 'administrador'];
```

---

## 🧪 Como Testar

### 1. Criar Serviço

```javascript
// Frontend
const result = await serviceService.createService(
  {
    unitId: 'xxx',
    name: 'Teste',
    price: 50,
    commissionPercentage: 30,
    durationMinutes: 30,
  },
  user
);
```

**Resultado esperado:** ✅ Serviço criado com sucesso

### 2. Verificar Permissões

```sql
-- Via SQL
SELECT
  email,
  raw_user_meta_data->>'role' as role,
  fn_can_manage_services(id) as can_manage
FROM auth.users
WHERE email = 'andrey@tratodebarbados.com';
```

**Resultado esperado:**

```
email                        | role          | can_manage
----------------------------|---------------|------------
andrey@tratodebarbados.com  | admin         | true
```

---

## 📝 Commits Relacionados

- `fn_can_manage_services`: Aceita 'administrador'
- `fn_can_manage_cash_register`: Aceita 'administrador'
- `get_user_role`: Normaliza 'administrador' → 'admin'
- `professionals`: Ativado em Nova Lima + Criado em Mangabeiras

---

## 📊 Estado Final

### Profissionais do Administrador

| Unidade     | Status   | Role          |
| ----------- | -------- | ------------- |
| Nova Lima   | ✅ Ativo | administrador |
| Mangabeiras | ✅ Ativo | admin         |

### Funções de Permissão

| Função                        | Aceita 'administrador'    |
| ----------------------------- | ------------------------- |
| `fn_can_manage_services`      | ✅ Sim                    |
| `fn_can_manage_cash_register` | ✅ Sim                    |
| `get_user_role`               | ✅ Normaliza para 'admin' |

---

## 🔗 Referências

- **Issue:** #RLS-ADMIN-ROLE
- **Erro Original:** `42501 - new row violates row-level security policy`
- **Documentação:** [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

**Autor:** Andrey Viana  
**Revisado por:** Sistema automatizado  
**Aprovado em:** 30/10/2025
