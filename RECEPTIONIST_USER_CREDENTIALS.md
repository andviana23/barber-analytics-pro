# 🔑 CREDENCIAIS DO USUÁRIO RECEPCIONISTA

## ✅ USUÁRIO CRIADO COM SUCESSO

O usuário **Recepcionista** foi criado e vinculado ao profissional existente.

---

## 👤 DADOS DO USUÁRIO

### **Credenciais de Acesso:**

```
Email: raissa@tratodebarbados.com.br
Senha: 123456
```

### **Informações do Perfil:**

| Campo               | Valor                                |
| ------------------- | ------------------------------------ |
| **Nome**            | Raissa                               |
| **Papel**           | Recepcionista                        |
| **Email**           | raissa@tratodebarbados.com.br        |
| **Senha**           | 123456                               |
| **Unidade**         | Nova Lima                            |
| **User ID**         | 224dd4ba-a623-4974-8fb6-7844d8cc087e |
| **Professional ID** | 4f62998f-eea7-4a89-9adf-25279a6cd73e |

---

## 🔐 PERMISSÕES DO RECEPCIONISTA

### **✅ Acesso Permitido:**

- **Lista da Vez** (todas as unidades)
  - Visualizar barbeiros
  - Adicionar pontos (+1)
  - Atualizar ordem
  - Ver histórico

### **❌ Acesso Bloqueado:**

- Dashboard
- Módulo Financeiro
- Relatórios Financeiros
- Cadastros (Unidades, Profissionais)
- Configurações
- Gerenciamento de Usuários

---

## 🧪 COMO TESTAR

1. **Faça logout** do usuário atual
2. **Acesse a tela de login**
3. **Digite as credenciais:**
   - Email: `raissa@tratodebarbados.com.br`
   - Senha: `123456`
4. **Clique em "Entrar"**
5. **Verifique:**
   - ✅ Menu lateral mostra apenas "Lista da Vez"
   - ✅ Consegue ver todas as unidades (Mangabeiras e Nova Lima)
   - ✅ Consegue adicionar pontos aos barbeiros
   - ✅ Não consegue acessar outras páginas

---

## 🔄 VINCULAR PROFISSIONAL AO USUÁRIO

O profissional existente foi automaticamente vinculado ao usuário de autenticação:

```sql
UPDATE public.professionals
SET user_id = '224dd4ba-a623-4974-8fb6-7844d8cc087e'
WHERE name = 'Raissa'
  AND role = 'recepcionista';
```

---

## 📋 ESTRUTURA NO BANCO DE DADOS

### **Tabela: `auth.users`**

```json
{
  "id": "224dd4ba-a623-4974-8fb6-7844d8cc087e",
  "email": "raissa@tratodebarbados.com.br",
  "role": "authenticated",
  "raw_user_meta_data": {
    "name": "Raissa",
    "role": "recepcionista",
    "permissions": ["lista_da_vez:read", "lista_da_vez:write"]
  }
}
```

### **Tabela: `public.professionals`**

```json
{
  "id": "4f62998f-eea7-4a89-9adf-25279a6cd73e",
  "user_id": "224dd4ba-a623-4974-8fb6-7844d8cc087e",
  "name": "Raissa",
  "role": "recepcionista",
  "unit_id": "577aa606-ae95-433d-8869-e90275241076"
}
```

---

## 🚨 SEGURANÇA

### **RLS (Row Level Security):**

- ✅ Políticas aplicadas nas tabelas:
  - `barbers_turn_list`
  - `barbers_turn_history`
  - `barbers_turn_daily_history`
  - `units` (visualização de todas)
  - `professionals` (visualização de todos)

### **Frontend:**

- ✅ Menu lateral filtrado por papel
- ✅ Rotas protegidas por `ReceptionistRoute`
- ✅ Redirecionamento automático para `/queue`

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### **Problema 1: Erro 400 ao fazer login**

**Causa:** Usuário não existia na tabela `auth.users`
**Solução:** ✅ Usuário criado com a migração `create_receptionist_user_raissa`

### **Problema 2: Profissional não vinculado**

**Causa:** `user_id` estava NULL na tabela `professionals`
**Solução:** ✅ Vinculação automática realizada na migração

---

## ⚠️ IMPORTANTE

### **Alterar Senha:**

A senha padrão é `123456`. **Recomenda-se alterar** após o primeiro login.

Para alterar a senha:

1. Faça login com as credenciais acima
2. Acesse o perfil do usuário
3. Atualize a senha

---

## 📊 VERIFICAÇÃO FINAL

| Item                               | Status |
| ---------------------------------- | ------ |
| Usuário criado em `auth.users`     | ✅     |
| Profissional vinculado             | ✅     |
| Role definido como `recepcionista` | ✅     |
| Permissões configuradas            | ✅     |
| RLS aplicado                       | ✅     |
| Frontend protegido                 | ✅     |

---

**📅 DATA:** 27/01/2025
**✅ STATUS:** Usuário Recepcionista criado e ativo
**🎯 MIGRAÇÃO:** `create_receptionist_user_raissa`
**🔑 LOGIN:** `raissa@tratodebarbados.com.br` / `123456`
