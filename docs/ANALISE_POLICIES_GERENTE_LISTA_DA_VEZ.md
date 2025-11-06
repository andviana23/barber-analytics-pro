# 🔍 ANÁLISE: Políticas RLS - Gerente vs Lista da Vez

**Data:** 5 de novembro de 2025
**Status:** ⚠️ **INCONSISTÊNCIAS IDENTIFICADAS**

---

## 📋 Problemas Identificados

### ❌ **1. Inconsistência entre Tabelas**

| Tabela              | Policy para Gerente                   | Acesso                    |
| ------------------- | ------------------------------------- | ------------------------- |
| `units`             | `gerente_select_all_units = true`     | ✅ **Todas as unidades**  |
| `barbers_turn_list` | `manager_can_see_all_units_turn_list` | ✅ **Todas as unidades**  |
| `professionals`     | `professionals_select_policy_v2`      | ❌ **Apenas sua unidade** |

### ⚠️ **2. Problema na View `vw_turn_list_complete`**

A view faz JOIN entre tabelas com políticas diferentes:

```sql
-- View vw_turn_list_complete
SELECT
    btl.*,  -- Gerente vê TODAS as unidades
    u.name, -- Gerente vê TODAS as unidades
    p.name  -- Gerente vê APENAS SUA unidade ❌
FROM barbers_turn_list btl
JOIN units u ON u.id = btl.unit_id
JOIN professionals p ON p.id = btl.professional_id  -- FALHA AQUI
```

**Resultado:** Gerente vê lista da vez de todas as unidades, mas **SEM os nomes dos profissionais** de outras unidades.

### ❌ **3. Policy UPDATE Restritiva**

```sql
-- Policy atual para UPDATE
gerente_update_turn_list:
  (get_user_role() = 'gerente')
  AND (unit_id IN (SELECT p.unit_id FROM professionals...))
```

**Problema:** Gerente só pode **modificar** a lista da vez da própria unidade, mas pode **ver** todas.

---

## 🛠️ Soluções Necessárias

### **Solução 1: Corrigir Policy de Professionals**

```sql
-- Atual (restritiva)
professionals_select_policy_v2:
  (get_user_role() = 'admin')
  OR (unit_id IN (SELECT get_user_unit_ids()))
  OR (user_id = auth.uid())

-- Nova (gerente vê todos)
CREATE POLICY "professionals_gerente_select_all"
ON professionals FOR SELECT
USING (
  get_user_role() = 'admin'
  OR get_user_role() = 'gerente'  -- Gerente vê todos os profissionais
  OR unit_id IN (SELECT get_user_unit_ids())
  OR user_id = auth.uid()
);
```

### **Solução 2: Padronizar Policy UPDATE**

```sql
-- Permitir gerente modificar lista de qualquer unidade
CREATE POLICY "gerente_update_all_units_turn_list"
ON barbers_turn_list FOR UPDATE
USING (
  get_user_role() = 'admin'
  OR get_user_role() = 'gerente'  -- Gerente pode modificar qualquer unidade
  OR get_user_role() = 'receptionist'
  OR unit_id IN (SELECT get_user_unit_ids())
);
```

---

## 🎯 Objetivo: Gerente com Acesso Total à Lista da Vez

### **✅ Deve Funcionar:**

- ✅ Ver lista da vez de **todas as unidades**
- ✅ Ver **nomes dos profissionais** de todas as unidades
- ✅ **Modificar** lista da vez de qualquer unidade
- ✅ **Reordenar** profissionais de qualquer unidade

### **🔒 Outros Roles (Barbeiro, Recepcionista):**

- ✅ Ver apenas lista da vez da **própria unidade**
- ✅ Modificar apenas lista da vez da **própria unidade**

---

## 📊 Estado Atual vs Esperado

### **🔴 Estado Atual (COM PROBLEMAS):**

```
Gerente acessa Lista da Vez:
✅ Vê registros de todas as unidades
❌ NÃO vê nomes dos profissionais de outras unidades
❌ NÃO pode modificar listas de outras unidades
```

### **🟢 Estado Esperado (CORRETO):**

```
Gerente acessa Lista da Vez:
✅ Vê registros de todas as unidades
✅ Vê nomes dos profissionais de todas as unidades
✅ Pode modificar listas de todas as unidades
```

---

## ⚡ Implementação Recomendada

### **Ordem de Execução:**

1. **Corrigir policy de professionals** (acesso SELECT)
2. **Corrigir policy de barbers_turn_list** (acesso UPDATE)
3. **Testar view `vw_turn_list_complete`**
4. **Validar acesso completo do gerente**

### **Impacto:**

- ✅ **Zero impacto** para outros roles
- ✅ **Melhoria** para gerentes
- ✅ **Consistência** entre todas as tabelas

---

**Status:** Aguardando aprovação para implementar correções.
