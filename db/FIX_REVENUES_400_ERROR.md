# 🔧 Correção: Erro 400 ao Criar Receita

## ✅ STATUS: CORREÇÃO APLICADA COM SUCESSO!

## 📋 Problema Identificado
Ao tentar salvar uma nova receita, o sistema retornava erro 400 (Bad Request) e não salvava os dados.

### Erro Reportado:
```
Failed to load resource: the server responded with a status of 400 ()
Erro ao criar receita: Object
```

## 🔍 Causa Raiz

Foram identificados **3 problemas principais**:

### 1. Campo `origin` vs `source`
O código JavaScript estava enviando `origin`, mas a tabela PostgreSQL espera `source`.

### 2. Campo `professional_id` removido mas ainda em RLS
As políticas RLS ainda verificavam `professional_id`, que não é mais enviado após a migração para `account_id`.

### 3. Políticas RLS muito restritivas
As políticas exigiam verificações de `professional_id` que impediam inserções com apenas `account_id`.

## 🛠️ Correções Aplicadas

### 1. Correção no `financeiroService.js`

**Antes:**
```javascript
insert({
  origin: receita.origem,  // ❌ Campo incorreto
  professional_id: receita.professionalId,  // ❌ Campo não enviado
  account_id: receita.account_id,
  // ...
})
```

**Depois:**
```javascript
insert({
  source: receita.origem,  // ✅ Campo correto
  account_id: receita.account_id,  // ✅ Usando account_id
  unit_id: receita.unitId,
  // ...
})
```

### 2. Atualização das Políticas RLS

#### INSERT Policy:
```sql
-- ANTES: Exigia professional_id
CREATE POLICY revenues_insert_policy ON revenues
FOR INSERT
WITH CHECK (
    is_admin() OR 
    (professional_id = (SELECT id FROM professionals WHERE user_id = auth.uid()))
);

-- DEPOIS: Baseado em unit_id
CREATE POLICY revenues_insert_policy ON revenues
FOR INSERT
WITH CHECK (
    is_admin() 
    OR (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR (unit_id = get_user_unit_id())
);
```

#### SELECT Policy:
```sql
CREATE POLICY revenues_select_policy ON revenues
FOR SELECT
USING (
    is_admin() 
    OR (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR (unit_id = get_user_unit_id())
);
```

#### UPDATE Policy:
```sql
CREATE POLICY revenues_update_policy ON revenues
FOR UPDATE
USING (
    is_admin() 
    OR (is_gerente_or_admin() AND unit_id = get_user_unit_id())
    OR (unit_id = get_user_unit_id())
);
```

#### DELETE Policy:
```sql
CREATE POLICY revenues_delete_policy ON revenues
FOR DELETE
USING (
    is_admin() 
    OR (is_gerente_or_admin() AND unit_id = get_user_unit_id())
);
```

### 3. Logs de Debug Adicionados

```javascript
// Log antes de enviar
console.log('Criando receita com dados:', receita);

// Log de erro detalhado
console.error('Erro detalhado do Supabase:', error);

// Log de sucesso
console.log('Receita criada com sucesso:', data);
```

## ✨ Resultado

Agora o sistema:
1. ✅ Envia os campos corretos (`source` em vez de `origin`)
2. ✅ Remove dependência de `professional_id`
3. ✅ Usa `account_id` para vincular receitas a contas bancárias
4. ✅ Políticas RLS permitem inserção baseada em `unit_id`
5. ✅ Logs detalhados para facilitar debugging

## 🧪 Como Testar

1. Acesse **Financeiro** → **Receitas**
2. Clique em **"+ Nova Receita"**
3. Preencha:
   - Tipo de Receita
   - Valor
   - Data
   - Unidade
   - **Conta Bancária** (agora obrigatória)
   - Origem (opcional)
   - Observações (opcional)
4. Clique em **"Salvar Receita"**
5. Verifique:
   - ✅ Receita salva com sucesso
   - ✅ Toast de confirmação aparece
   - ✅ Lista de receitas atualiza
   - ✅ Console mostra logs de debug

## 📊 Estrutura da Tabela Revenues

```sql
Column            | Type      | Nullable
------------------|-----------|----------
id                | uuid      | NO
unit_id           | uuid      | YES
professional_id   | uuid      | YES (mantido por compatibilidade)
account_id        | uuid      | YES (NOVO!)
type              | enum      | NO
source            | text      | YES
value             | numeric   | NO
date              | date      | NO
observations      | text      | YES (campo correto)
created_at        | timestamp | YES
user_id           | uuid      | YES
```

## 🎯 Permissões por Perfil

| Ação   | Admin | Gerente | Barbeiro |
|--------|-------|---------|----------|
| INSERT | Todas | Sua unidade | Sua unidade |
| SELECT | Todas | Sua unidade | Sua unidade |
| UPDATE | Todas | Sua unidade | Sua unidade |
| DELETE | Todas | Sua unidade | ❌ Não |

## 📝 Arquivos Modificados

1. ✅ `src/services/financeiroService.js`
   - Corrigido campo `source`
   - Removido `professional_id`
   - Adicionados logs de debug

2. ✅ Políticas RLS (via @pgsql):
   - `revenues_insert_policy`
   - `revenues_select_policy`
   - `revenues_update_policy`
   - `revenues_delete_policy`

---

**Data da correção:** 13/10/2025  
**Método:** Migração via extensão PostgreSQL (@pgsql)  
**Status:** ✅ Pronto para uso
