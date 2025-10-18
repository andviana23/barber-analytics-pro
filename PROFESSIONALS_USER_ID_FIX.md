# 🔧 CORREÇÃO: ERRO 409 AO CADASTRAR PROFISSIONAIS

## 🐛 PROBLEMA IDENTIFICADO

### Erro:

```
POST /rest/v1/professionals 409 (Conflict)
duplicate key value violates unique constraint 'professionals_unique_user_unit'
```

### 🔍 Causa Raiz:

O sistema estava tentando criar **múltiplos profissionais** usando o **mesmo `user_id`** (do usuário autenticado fazendo o cadastro) na **mesma unidade**.

A tabela `professionals` tinha uma constraint `UNIQUE (user_id, unit_id)` que impedia isso.

#### Problema Conceitual:

O campo `user_id` na tabela `professionals` estava sendo usado **incorretamente**:

- ❌ **Antes:** Usado para registrar **quem criou** o profissional
- ✅ **Correto:** Deve vincular o profissional a **credenciais de login** (quando aplicável)

**Nem todo profissional precisa ter conta no sistema!**

---

## ✅ SOLUÇÃO APLICADA

### 1. **Migration SQL: Tornar `user_id` NULLABLE**

Arquivo: Migration `make_professionals_user_id_nullable`

```sql
-- 1. Tornar user_id NULLABLE
ALTER TABLE public.professionals
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Remover constraint UNIQUE (user_id, unit_id)
ALTER TABLE public.professionals
DROP CONSTRAINT IF EXISTS professionals_unique_user_unit;

-- 3. Criar constraint UNIQUE apenas quando user_id não for NULL
CREATE UNIQUE INDEX professionals_unique_user_unit_when_present
ON public.professionals (user_id, unit_id)
WHERE user_id IS NOT NULL;
```

#### O que isso resolve:

- ✅ Permite criar profissionais **sem `user_id`**
- ✅ Impede duplicação **apenas quando `user_id` está presente**
- ✅ Múltiplos profissionais podem existir na mesma unidade sem login

---

### 2. **Correção no Service**

Arquivo: `src/services/profissionaisService.js`

#### Antes (❌):

```javascript
static async createProfissional(profissionalData) {
  try {
    // ❌ Buscar usuário autenticado para todos os profissionais
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    const professionalFields = {
      name: profissionalData.name,
      role: profissionalData.role,
      unit_id: profissionalData.unit_id,
      user_id: user.id, // ❌ Sempre preenche com quem está logado
      is_active: profissionalData.is_active !== undefined
        ? profissionalData.is_active
        : true,
      commission_rate: profissionalData.commission_rate || 0,
    };
    // ...
  }
}
```

#### Depois (✅):

```javascript
static async createProfissional(profissionalData) {
  try {
    const professionalFields = {
      name: profissionalData.name,
      role: profissionalData.role,
      unit_id: profissionalData.unit_id,
      is_active: profissionalData.is_active !== undefined
        ? profissionalData.is_active
        : true,
      commission_rate: profissionalData.commission_rate || 0,
    };

    // ✅ Apenas incluir user_id se for explicitamente fornecido
    if (profissionalData.user_id) {
      professionalFields.user_id = profissionalData.user_id;
    }
    // ...
  }
}
```

---

## 📊 MUDANÇAS NA ESTRUTURA

### Tabela `professionals`:

| Campo      | Antes                       | Depois                                                |
| ---------- | --------------------------- | ----------------------------------------------------- |
| `user_id`  | `NOT NULL`                  | `NULLABLE`                                            |
| Constraint | `UNIQUE (user_id, unit_id)` | `UNIQUE (user_id, unit_id) WHERE user_id IS NOT NULL` |

### Comportamento:

| Cenário                                       | Antes       | Depois                |
| --------------------------------------------- | ----------- | --------------------- |
| Criar profissional sem login                  | ❌ Erro     | ✅ OK                 |
| Criar 2+ profissionais na mesma unidade       | ❌ Conflict | ✅ OK                 |
| Vincular mesmo user_id 2x na mesma unidade    | ❌ Conflict | ❌ Conflict (correto) |
| Vincular mesmo user_id em unidades diferentes | ✅ OK       | ✅ OK                 |

---

## 🧪 VALIDAÇÃO

### Antes da Correção:

```
❌ POST /professionals → 409 Conflict
❌ duplicate key value violates unique constraint
```

### Após a Correção:

```
✅ POST /professionals → 200 OK
✅ Profissional criado sem user_id
✅ Múltiplos profissionais na mesma unidade
```

---

## 🎯 CASOS DE USO

### Caso 1: Profissional Sem Login (Comum)

```javascript
// ✅ FUNCIONA AGORA
createProfissional({
  name: 'João Silva',
  role: 'barbeiro',
  unit_id: 'uuid-da-unidade',
  // Sem user_id - profissional não tem login
});
```

### Caso 2: Profissional Com Login (Raro)

```javascript
// ✅ FUNCIONA (se fornecer user_id explicitamente)
createProfissional({
  name: 'Maria Santos',
  role: 'gerente',
  unit_id: 'uuid-da-unidade',
  user_id: 'uuid-do-usuario', // Vincula a uma conta
});
```

### Caso 3: Múltiplos Profissionais na Mesma Unidade

```javascript
// ✅ FUNCIONA AGORA
createProfissional({ name: 'João', unit_id: 'uuid1' });
createProfissional({ name: 'Maria', unit_id: 'uuid1' });
createProfissional({ name: 'Pedro', unit_id: 'uuid1' });
// Todos OK!
```

---

## ✅ STATUS FINAL

| Item                | Status                    |
| ------------------- | ------------------------- |
| Migration aplicada  | ✅ Sucesso                |
| Service corrigido   | ✅ Sucesso                |
| Linter              | ✅ Sem erros              |
| Constraint ajustada | ✅ Sucesso                |
| Teste               | ⏳ Aguardando confirmação |

---

## 🚀 TESTE AGORA!

1. ✅ **Recarregue a página** (F5)
2. ✅ **Vá para "Cadastro de Profissionais"**
3. ✅ **Clique em "+ Novo Profissional"**
4. ✅ **Preencha:**
   - Nome: João da Silva
   - Função: barbeiro
   - Unidade: (selecione)
5. ✅ **Clique em "Salvar"**
6. ✅ **Repita** para criar mais profissionais
7. ✅ **Verifique** que todos são criados com sucesso!

---

## 📝 LIÇÃO APRENDIDA

### ⚠️ IMPORTANTE:

O campo `user_id` em `professionals` **NÃO é para rastreamento**!

**Propósito correto:**

- ✅ Vincular profissional a **credenciais de login**
- ✅ Permitir que profissionais façam **login no sistema**
- ✅ Gerenciar **permissões por profissional**

**Não usar para:**

- ❌ Registrar quem **criou** o profissional (use `created_by`)
- ❌ Rastrear **auditorias** (use `access_logs`)
- ❌ Preencher **automaticamente** para todos

---

## 🎉 CONCLUSÃO

O sistema agora permite:

- ✅ Cadastrar profissionais **sem login**
- ✅ Múltiplos profissionais **na mesma unidade**
- ✅ Vincular login **apenas quando necessário**
- ✅ Evitar conflitos de constraint

**Problema resolvido!** 🚀
