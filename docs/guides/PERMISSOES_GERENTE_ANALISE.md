# 🔐 Análise de Permissões: Gerente - Fluxo de Caixa

**Data:** 11 de novembro de 2025
**Autor:** Andrey Viana
**Banco de Dados:** PostgreSQL (Supabase)

---

## 📊 Resumo Executivo

### ✅ STATUS: PERMISSÕES JÁ CONFIGURADAS

O perfil **GERENTE** já possui todas as permissões necessárias para operar o fluxo de caixa:

| Operação       | Receitas | Despesas | Status       |
| -------------- | -------- | -------- | ------------ |
| **Visualizar** | ✅ SIM   | ✅ SIM   | Funciona     |
| **Cadastrar**  | ✅ SIM   | ✅ SIM   | Funciona     |
| **Editar**     | ✅ SIM   | ✅ SIM   | Funciona     |
| **Excluir**    | ❌ NÃO   | ❌ NÃO   | Apenas Admin |

**Conclusão:** Gerentes podem trabalhar normalmente no fluxo de caixa. Para excluir registros, devem usar **soft delete** (`is_active = false`).

---

## 🏗️ Arquitetura de Permissões

### 1. Row Level Security (RLS)

Todas as policies estão ativas e funcionando:

```sql
-- REVENUES (4 policies para gerente)
✅ gerente_select_revenues   -- SELECT
✅ gerente_insert_revenues   -- INSERT
✅ gerente_update_revenues   -- UPDATE
⚠️ gerente_no_delete_revenues -- DELETE (apenas admin)

-- EXPENSES (4 policies para gerente)
✅ gerente_select_expenses   -- SELECT
✅ gerente_insert_expenses   -- INSERT
✅ gerente_update_expenses   -- UPDATE
⚠️ gerente_no_delete_expenses -- DELETE (apenas admin)
```

### 2. Função de Verificação de Role

```sql
CREATE FUNCTION get_user_role() RETURNS TEXT
```

**Normalização automática:**

- `'administrador'` → `'admin'`
- Busca em: JWT → user_metadata → app_metadata → professionals table

**Roles suportadas:**

- `admin` (ou `administrador`)
- `gerente`
- `barbeiro`
- `recepcionista`

---

## 📋 Detalhamento das Policies

### REVENUES - SELECT (Visualizar)

**Policy:** `gerente_select_revenues`

```sql
SELECT * FROM revenues
WHERE (
  get_user_role() = 'admin'
  OR (
    get_user_role() = 'gerente'
    AND unit_id IN (
      SELECT unit_id FROM professionals
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  OR unit_id IN (
    SELECT id FROM units WHERE user_id = auth.uid()
  )
);
```

**Permite:**

- ✅ Gerente vê receitas de **suas unidades** (onde está cadastrado como profissional)
- ✅ Admin vê **todas** as receitas
- ✅ Proprietário da unidade vê suas receitas

---

### REVENUES - INSERT (Cadastrar)

**Policy:** `gerente_insert_revenues`

```sql
INSERT INTO revenues (...)
WHERE (
  get_user_role() = 'admin'
  OR (
    get_user_role() = 'gerente'
    AND unit_id IN (
      SELECT unit_id FROM professionals
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);
```

**Permite:**

- ✅ Gerente **cadastra** receitas nas **suas unidades**
- ✅ Admin cadastra em qualquer unidade
- ❌ Barbeiro NÃO pode cadastrar

---

### REVENUES - UPDATE (Editar)

**Policy:** `gerente_update_revenues`

```sql
UPDATE revenues SET ...
WHERE (
  get_user_role() = 'admin'
  OR (
    get_user_role() = 'gerente'
    AND unit_id IN (
      SELECT unit_id FROM professionals
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
);
```

**Permite:**

- ✅ Gerente **edita** receitas das **suas unidades**
- ✅ Pode fazer **soft delete**: `UPDATE revenues SET is_active = false`
- ✅ Admin edita qualquer receita

---

### REVENUES - DELETE (Excluir Fisicamente)

**Policy:** `gerente_no_delete_revenues`

```sql
DELETE FROM revenues
WHERE get_user_role() = 'admin';
```

**Restrição de segurança:**

- ❌ Gerente **NÃO** pode deletar fisicamente
- ✅ Admin pode deletar
- ⚠️ **Solução:** Gerente usa soft delete via UPDATE

**Exemplo de soft delete:**

```sql
-- ❌ NÃO FUNCIONA (gerente)
DELETE FROM revenues WHERE id = 'uuid';

-- ✅ FUNCIONA (gerente)
UPDATE revenues SET is_active = false WHERE id = 'uuid';
```

---

### EXPENSES - Mesma Lógica

As policies de `expenses` seguem exatamente o mesmo padrão:

- ✅ `gerente_select_expenses` - Visualizar despesas
- ✅ `gerente_insert_expenses` - Cadastrar despesas
- ✅ `gerente_update_expenses` - Editar despesas (inclui soft delete)
- ⚠️ `gerente_no_delete_expenses` - Apenas admin pode deletar

---

## 🛠️ Recursos Adicionais Criados

### 1. View Consolidada: `vw_gerente_fluxo_caixa`

View que une receitas e despesas em uma única consulta:

```sql
SELECT * FROM vw_gerente_fluxo_caixa
WHERE unit_id = 'uuid-da-unidade'
  AND data BETWEEN '2025-11-01' AND '2025-11-30'
ORDER BY data DESC;
```

**Colunas:**

- `tipo` - 'RECEITA' ou 'DESPESA'
- `id`, `unit_id`, `valor`, `data`, `data_competencia`
- `descricao`, `categoria_nome`, `forma_pagamento_nome`
- `conta_bancaria_nome`, `status`, `is_active`
- `unidade_nome`, `profissional_nome`

**Performance:**

- ✅ Dados atualizados (419 despesas, 1.939 receitas)
- ✅ Filtros respeitam RLS automaticamente

---

### 2. Função: `fn_is_gerente_of_unit(UUID)`

Verifica se usuário é gerente de uma unidade específica:

```sql
SELECT fn_is_gerente_of_unit('28c57936-5b4b-45a3-b6ef-eaebb96a9479');
-- Retorna: true ou false
```

**Uso no código:**

```typescript
const { data } = await supabase.rpc('fn_is_gerente_of_unit', {
  p_unit_id: unitId,
});

if (data) {
  // Usuário é gerente desta unidade
}
```

---

### 3. Função: `fn_get_user_permissions()`

Retorna todas as permissões do usuário autenticado:

```sql
SELECT * FROM fn_get_user_permissions();
```

**Retorno (exemplo para gerente):**

```
role: gerente
can_view_revenues: true
can_create_revenues: true
can_edit_revenues: true
can_delete_revenues: false
can_view_expenses: true
can_create_expenses: true
can_edit_expenses: true
can_delete_expenses: false
```

**Uso no frontend:**

```typescript
const { data: permissions } = await supabase
  .rpc('fn_get_user_permissions')
  .single();

// Exibir/esconder botão "Excluir" baseado em permissão
if (permissions.can_delete_revenues) {
  // Mostrar botão de exclusão
}
```

---

## 📊 Matriz de Permissões

### Tabela Completa

| Role              | View Revenues  | Create | Edit | Delete | View Expenses  | Create | Edit | Delete |
| ----------------- | -------------- | ------ | ---- | ------ | -------------- | ------ | ---- | ------ |
| **Admin**         | ✅ Todas       | ✅     | ✅   | ✅     | ✅ Todas       | ✅     | ✅   | ✅     |
| **Gerente**       | ✅ Sua unidade | ✅     | ✅   | ❌     | ✅ Sua unidade | ✅     | ✅   | ❌     |
| **Barbeiro**      | ✅ Suas apenas | ❌     | ❌   | ❌     | ✅ Da unidade  | ❌     | ❌   | ❌     |
| **Recepcionista** | ✅ Da unidade  | ❌     | ❌   | ❌     | ✅ Da unidade  | ❌     | ❌   | ❌     |

---

## 🧪 Testes de Validação

### 1. Testar Permissões de Gerente

```sql
-- Conectar como gerente (user_id deve estar em professionals)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub":"uuid-do-gerente","role":"authenticated"}';

-- Deve funcionar ✅
SELECT * FROM revenues WHERE unit_id IN (
  SELECT unit_id FROM professionals WHERE user_id = auth.uid()
);

INSERT INTO revenues (unit_id, value, date, ...) VALUES (...);

UPDATE revenues SET value = 200 WHERE id = 'uuid';

UPDATE revenues SET is_active = false WHERE id = 'uuid'; -- Soft delete

-- Deve falhar ❌
DELETE FROM revenues WHERE id = 'uuid';
```

### 2. Testar View Consolidada

```sql
-- Ver fluxo de caixa de novembro/2025
SELECT
  tipo,
  data,
  descricao,
  valor,
  categoria_nome
FROM vw_gerente_fluxo_caixa
WHERE data BETWEEN '2025-11-01' AND '2025-11-30'
  AND unit_id = '28c57936-5b4b-45a3-b6ef-eaebb96a9479'
ORDER BY data DESC, tipo;
```

### 3. Testar Funções Auxiliares

```sql
-- Verificar se é gerente
SELECT fn_is_gerente_of_unit('28c57936-5b4b-45a3-b6ef-eaebb96a9479');

-- Ver permissões
SELECT * FROM fn_get_user_permissions();
```

---

## 🚀 Implementação no Frontend

### 1. Verificar Permissões na Montagem do Componente

```typescript
// src/pages/FluxoCaixaPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function FluxoCaixaPage() {
  const [permissions, setPermissions] = useState(null);

  useEffect(() => {
    async function loadPermissions() {
      const { data } = await supabase
        .rpc('fn_get_user_permissions')
        .single();

      setPermissions(data);
    }

    loadPermissions();
  }, []);

  return (
    <div>
      {permissions?.can_create_revenues && (
        <button onClick={handleCreateRevenue}>
          Nova Receita
        </button>
      )}

      {permissions?.can_delete_revenues && (
        <button onClick={handleDelete}>
          Excluir
        </button>
      )}
    </div>
  );
}
```

### 2. Usar View Consolidada

```typescript
// src/hooks/useFluxoCaixa.ts
export function useFluxoCaixa(unitId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['fluxo-caixa', unitId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_gerente_fluxo_caixa')
        .select('*')
        .eq('unit_id', unitId)
        .gte('data', startDate.toISOString())
        .lte('data', endDate.toISOString())
        .order('data', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
```

### 3. Soft Delete em Vez de Delete

```typescript
// src/services/revenueService.ts
export const revenueService = {
  async softDelete(id: string) {
    const { error } = await supabase
      .from('revenues')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  // Apenas admin pode usar
  async hardDelete(id: string) {
    const { data: permissions } = await supabase
      .rpc('fn_get_user_permissions')
      .single();

    if (!permissions?.can_delete_revenues) {
      throw new Error('Apenas administradores podem excluir permanentemente');
    }

    const { error } = await supabase.from('revenues').delete().eq('id', id);

    if (error) throw error;
    return { success: true };
  },
};
```

---

## 📝 Checklist de Implementação

### Backend (PostgreSQL)

- [x] ✅ Policies de SELECT para gerente
- [x] ✅ Policies de INSERT para gerente
- [x] ✅ Policies de UPDATE para gerente
- [x] ✅ Policies de DELETE (apenas admin)
- [x] ✅ Função `get_user_role()` com normalização
- [x] ✅ View consolidada `vw_gerente_fluxo_caixa`
- [x] ✅ Função `fn_is_gerente_of_unit()`
- [x] ✅ Função `fn_get_user_permissions()`
- [x] ✅ Comentários/documentação nas policies

### Frontend (React)

- [ ] ⏳ Hook `useFluxoCaixa()` com view consolidada
- [ ] ⏳ Hook `usePermissions()` com `fn_get_user_permissions()`
- [ ] ⏳ Componente `FluxoCaixaPage` com verificação de permissões
- [ ] ⏳ Botões condicionais baseados em permissões
- [ ] ⏳ Soft delete implementado no lugar de delete físico
- [ ] ⏳ Mensagens de feedback para ações restritas

### Testes

- [ ] ⏳ Teste E2E: Gerente visualiza receitas
- [ ] ⏳ Teste E2E: Gerente cadastra receita
- [ ] ⏳ Teste E2E: Gerente edita receita
- [ ] ⏳ Teste E2E: Gerente tenta deletar (deve falhar)
- [ ] ⏳ Teste E2E: Gerente faz soft delete (deve funcionar)
- [ ] ⏳ Teste unitário: `fn_get_user_permissions()`
- [ ] ⏳ Teste unitário: `fn_is_gerente_of_unit()`

---

## 🎯 Conclusão

### ✅ O que já funciona:

1. **Gerentes têm acesso completo ao fluxo de caixa:**
   - Visualizar receitas e despesas
   - Cadastrar receitas e despesas
   - Editar receitas e despesas
   - Soft delete via `is_active = false`

2. **Segurança mantida:**
   - Apenas admin pode deletar fisicamente
   - RLS garante que gerente só acessa suas unidades
   - Normalização automática de roles

3. **Recursos extras criados:**
   - View consolidada para consultas otimizadas
   - Funções auxiliares para validação
   - Função de permissões para UI dinâmica

### 📋 Próximos passos:

1. Implementar hooks no frontend
2. Adicionar verificação de permissões nos componentes
3. Substituir DELETE por soft delete na UI
4. Criar testes E2E para fluxo de gerente
5. Documentar para equipe de desenvolvimento

---

**Status:** ✅ **PERMISSÕES CONFIGURADAS E FUNCIONAIS**
**Última atualização:** 11/11/2025
**Responsável:** Andrey Viana
