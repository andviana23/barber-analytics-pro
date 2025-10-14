# 🔥 PROMPT URGENTE PARA COPILOT - CORRIGIR RLS

## ❌ PROBLEMA CRÍTICO

O frontend está dando **timeout de 30 segundos** ao tentar carregar profissionais, mas quando você testou direto no banco funcionou em 46ms.

**Causa:** As políticas RLS estão **BLOQUEANDO** o acesso do usuário autenticado.

---

## 🎯 MISSÃO: CORRIGIR POLÍTICAS RLS

Execute os seguintes comandos SQL **NA ORDEM**:

### 1️⃣ VERIFICAR USUÁRIO ATUAL NO BANCO

```sql
-- Ver qual usuário está logado no sistema
SELECT
    p.id,
    p.name,
    p.role,
    p.user_id,
    p.unit_id,
    u.email
FROM professionals p
LEFT JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

**ME REPORTE:** Quantos usuários existem? Qual o `role` deles?

---

### 2️⃣ VERIFICAR FUNÇÕES RLS

```sql
-- Testar função get_user_role() manualmente
SELECT get_user_role() AS user_role;

-- Testar função is_admin()
SELECT is_admin() AS is_admin_result;

-- Testar auth.uid()
SELECT auth.uid() AS current_user_id;

-- Ver se o profissional existe para o usuário atual
SELECT * FROM professionals WHERE user_id = auth.uid();
```

**ME REPORTE:** O que cada função retornou?

---

### 3️⃣ ADICIONAR POLÍTICA TEMPORÁRIA PERMISSIVA

```sql
-- REMOVER esta política depois de resolver o problema
-- Esta política permite que QUALQUER usuário autenticado leia professionals
DROP POLICY IF EXISTS "professionals_select_policy_temp_debug" ON professionals;

CREATE POLICY "professionals_select_policy_temp_debug" ON professionals
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Verificar se a política foi criada
SELECT * FROM pg_policies WHERE tablename = 'professionals';
```

**ME REPORTE:** A nova política foi criada?

---

### 4️⃣ TESTAR QUERY AGORA

```sql
-- Simular a query que o frontend está fazendo
SELECT
    p.*,
    u.id as unit_id,
    u.name as unit_name
FROM professionals p
LEFT JOIN units u ON p.unit_id = u.id
ORDER BY p.created_at DESC;
```

**ME REPORTE:** A query funcionou? Quanto tempo levou?

---

### 5️⃣ VERIFICAR POLÍTICAS RLS NA TABELA UNITS

```sql
-- Ver políticas na tabela units
SELECT * FROM pg_policies WHERE tablename = 'units';

-- Verificar se RLS está habilitado em units
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'units';
```

**ME REPORTE:** RLS está ativado em `units`? Quais políticas existem?

---

### 6️⃣ ADICIONAR POLÍTICA PERMISSIVA PARA UNITS (SE NECESSÁRIO)

```sql
-- Se RLS estiver bloqueando units também
DROP POLICY IF EXISTS "units_select_policy_temp_debug" ON units;

CREATE POLICY "units_select_policy_temp_debug" ON units
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
```

---

## 🔍 DIAGNÓSTICO ESPERADO

Após executar os comandos acima, você deve reportar:

1. **Quantos usuários existem** na tabela `professionals`
2. **Qual o role** de cada usuário
3. **Se as funções RLS** estão retornando valores corretos
4. **Se a política temporária** resolveu o problema
5. **Se RLS em `units`** está bloqueando o JOIN

---

## ✅ SOLUÇÃO PERMANENTE (APÓS DEBUG)

Depois de identificar o problema, vamos criar uma política RLS correta:

```sql
-- REMOVER políticas temporárias
DROP POLICY IF EXISTS "professionals_select_policy_temp_debug" ON professionals;
DROP POLICY IF EXISTS "units_select_policy_temp_debug" ON units;

-- RECRIAR política correta para professionals
DROP POLICY IF EXISTS "professionals_select_policy" ON professionals;

CREATE POLICY "professionals_select_policy" ON professionals
    FOR SELECT
    USING (
        -- Qualquer usuário autenticado pode ver profissionais da sua unidade ou ele mesmo
        auth.uid() IS NOT NULL
        AND (
            -- Ver a si mesmo
            user_id = auth.uid()
            OR
            -- Admins veem todos
            (SELECT role FROM professionals WHERE user_id = auth.uid()) = 'admin'
            OR
            -- Managers veem sua unidade
            (
                (SELECT role FROM professionals WHERE user_id = auth.uid()) IN ('manager', 'gerente')
                AND unit_id = (SELECT unit_id FROM professionals WHERE user_id = auth.uid())
            )
        )
    );

-- RECRIAR política para units (todos podem ver unidades)
DROP POLICY IF EXISTS "units_select_policy" ON units;

CREATE POLICY "units_select_policy" ON units
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
```

---

## 🚨 SE AS POLÍTICAS TEMPORÁRIAS RESOLVEREM

Isso confirmará que **RLS estava bloqueando**. Neste caso:

1. Mantenha as políticas temporárias por enquanto
2. Me reporte que funcionou
3. Vamos refinar as políticas permanentes juntos

---

**EXECUTE E ME REPORTE OS RESULTADOS!** 🚀
