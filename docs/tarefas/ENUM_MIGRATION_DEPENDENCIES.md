# 📋 Inventário de Dependências - Migração de ENUMs

**Data:** 31/10/2025  
**Status:** ⚠️ Mapeamento completo realizado  
**Objetivo:** Documentar todas as dependências para completar SQL-05 e SQL-07

---

## 🎯 Resumo Executivo

### SQL-05: `professionals.role` → `professionals.role_new`

**Situação Atual:**

- ✅ ENUM `professional_role_enum` criado
- ✅ Coluna `role_new` adicionada e populada
- ⚠️ Coluna antiga `role` ainda existe
- ⚠️ Dependências identificadas precisam ser atualizadas

**Dependências Encontradas:**

#### 📊 Views (1)

1. **`vw_ranking_profissionais`** (linha 51)
   - Usa: `p.role AS professional_role`
   - Impacto: View de ranking de profissionais
   - Ação: Atualizar para `p.role_new::text AS professional_role`

#### 🔐 Policies (62)

**IMPORTANTE:** A maioria das policies usa:

- `get_user_role()` (via `auth.users.raw_user_meta_data->>'role'`)
- `auth.jwt()->>'role'`

**NÃO usam diretamente `professionals.role`**

**Policies que checam role diretamente na tabela `professionals`:**

1. **`barbers_turn_history.Admins can manage all history`**

   ```sql
   WHERE professionals.role::text = 'admin'::text
   ```

2. **Outras policies** usam `get_user_role()` ou `auth.jwt()->>'role'` (fonte: `auth.users` metadata)

---

### SQL-07: `expenses.forma_pagamento` → `expenses.payment_method`

**Situação Atual:**

- ✅ ENUM `payment_method_enum` criado
- ✅ Coluna `payment_method` adicionada e populada
- ⚠️ Coluna antiga `forma_pagamento` ainda existe
- ✅ **NENHUMA DEPENDÊNCIA ENCONTRADA!**

**Dependências Encontradas:**

- 📊 Views: **0** (nenhuma view usa `forma_pagamento`)
- 🔐 Policies: **0** (nenhuma policy usa `forma_pagamento`)

**Conclusão:** SQL-07 pode ser concluído imediatamente sem quebrar funcionalidades!

---

## 📝 Plano de Ação

### Fase 1: Atualizar Views ✅ Seguro

#### View 1: `vw_ranking_profissionais`

**Mudança:**

```sql
-- DE:
p.role AS professional_role

-- PARA:
p.role_new::text AS professional_role
```

**Impacto:** Baixo - apenas casting de ENUM para text

---

### Fase 2: Atualizar Policies ⚠️ Atenção

#### Policy 1: `barbers_turn_history.Admins can manage all history`

**Mudança:**

```sql
-- DE:
WHERE professionals.role::text = 'admin'::text

-- PARA:
WHERE professionals.role_new = 'admin'::professional_role_enum
```

**Impacto:** Médio - afeta permissões de administradores no histórico

---

### Fase 3: Remover Colunas Antigas ✅ Final

1. **`expenses.forma_pagamento`** - Pode ser removida AGORA (sem dependências)
2. **`professionals.role`** - Após atualizar view + policy

---

## 🧪 Estratégia de Execução

### Opção Recomendada: Migração Única e Atômica

**Arquivo:** `supabase/migrations/20251031_complete_enum_migration.sql`

**Ordem de Execução:**

1. Atualizar `vw_ranking_profissionais` (recreate view)
2. Atualizar policy `barbers_turn_history.Admins can manage all history`
3. Remover coluna `professionals.role`
4. Renomear `professionals.role_new` → `professionals.role`
5. Remover coluna `expenses.forma_pagamento`
6. Renomear `expenses.payment_method` → `expenses.forma_pagamento` (opcional)

---

## ⚠️ Riscos Identificados

### Baixo Risco

- ✅ `expenses.forma_pagamento` - Sem dependências
- ✅ `vw_ranking_profissionais` - Mudança trivial (apenas casting)

### Médio Risco

- ⚠️ Policy `barbers_turn_history` - Afeta permissões de admin

### Pontos de Atenção

1. **`get_user_role()`** - Função usa `auth.users.raw_user_meta_data->>'role'`
   - **Não afetada** pela mudança em `professionals.role`
   - Fonte: metadata do usuário no Auth, não na tabela professionals

2. **RLS Policies** - Maioria usa `get_user_role()` ou `auth.jwt()`
   - **Não afetadas** pela mudança em `professionals.role`
   - Apenas 1 policy usa diretamente `professionals.role`

---

## 🎯 Próximos Passos

1. [ ] **Criar migração SQL completa**
2. [ ] **Revisar com usuário antes de aplicar**
3. [ ] **Executar migração via @pgsql**
4. [ ] **Validar funcionamento:**
   - [ ] View `vw_ranking_profissionais` retorna dados
   - [ ] Admins conseguem gerenciar histórico
   - [ ] Sem erros em queries de despesas
5. [ ] **Atualizar código da aplicação** (usar novos nomes de coluna)
6. [ ] **Marcar SQL-05 e SQL-07 como ✅ CONCLUÍDOS**

---

## 📚 Referências

- **Migration SQL-05:** `supabase/migrations/20251031_create_enum_professional_role_v2.sql`
- **Migration SQL-07:** `supabase/migrations/20251031_create_enum_payment_method.sql`
- **Plano Geral:** `docs/tarefas/PLANO_DE_AJUSTES_BACKEND.md`

---

**Autor:** Andrey Viana  
**Sistema:** Barber Analytics Pro  
**Última atualização:** 31/10/2025
