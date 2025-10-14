# Restrição de Acesso - Formas de Pagamento

## 📋 Resumo das Alterações

Implementada restrição de acesso para que **apenas usuários ADMINISTRADORES** possam criar, editar e excluir formas de pagamento. Gerentes e barbeiros podem apenas **visualizar**.

---

## 🔒 Alterações no Banco de Dados (RLS Policies)

### **Antes** - Política Antiga
```sql
-- ❌ Admins E Gerentes podiam criar
CREATE POLICY "Admins and managers can create payment methods"
```

### **Depois** - Nova Política
```sql
-- ✅ APENAS Admins podem criar
CREATE POLICY "Only admins can create payment methods"
ON payment_methods
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE users.id = auth.uid() 
        AND users.raw_user_meta_data->>'role' = 'admin'
    )
    AND unit_id IN (
        SELECT id 
        FROM units 
        WHERE is_active = true
    )
);
```

### 📊 Resumo das Políticas Atualizadas

| Operação | Política Anterior | Política Nova | Permissão |
|----------|-------------------|---------------|-----------|
| **INSERT** (Criar) | Admins + Gerentes | **Apenas Admins** | 🔒 Admin |
| **UPDATE** (Editar) | Admins + Gerentes | **Apenas Admins** | 🔒 Admin |
| **DELETE** (Excluir) | Apenas Admins | Apenas Admins | 🔒 Admin |
| **SELECT** (Visualizar) | Todos da unidade | Todos da unidade | 👁️ Todos |

---

## 🎨 Alterações no Frontend

### 1. **Verificação de Permissões**

**Antes**:
```javascript
const canManage = useMemo(() => {
  const role = user?.user_metadata?.role;
  return ['admin', 'gerente'].includes(role); // ❌ Permitia gerentes
}, [user]);
```

**Depois**:
```javascript
const isAdmin = useMemo(() => {
  return user?.user_metadata?.role === 'admin'; // ✅ Apenas admin
}, [user]);
```

### 2. **Botão "Nova Forma de Pagamento"**

**Para Administradores**:
```jsx
<button className="bg-primary text-white ...">
  Nova Forma de Pagamento
</button>
```

**Para Não-Administradores**:
```jsx
<div 
  className="bg-gray-100 text-gray-400 cursor-not-allowed" 
  title="Apenas administradores podem criar formas de pagamento"
>
  Nova Forma de Pagamento
</div>
```

### 3. **Aviso Visual**

Quando um usuário **não-administrador** acessa a página, aparece um aviso:

```
⚠️ Acesso Restrito

Apenas administradores podem criar, editar ou excluir formas de pagamento. 
Você pode visualizar as formas de pagamento cadastradas, mas não pode modificá-las.
```

### 4. **Coluna de Ações na Tabela**

- **Admin**: Vê coluna "Ações" com botões Editar e Excluir
- **Não-Admin**: Coluna "Ações" não aparece na tabela

---

## 🧪 Casos de Teste

### Cenário 1: Usuário Administrador
```
✅ Pode criar novas formas de pagamento
✅ Pode editar formas de pagamento existentes
✅ Pode desativar/ativar formas de pagamento
✅ Pode excluir formas de pagamento
✅ Vê coluna "Ações" na tabela
✅ Não vê aviso de acesso restrito
```

### Cenário 2: Usuário Gerente
```
✅ Pode visualizar todas as formas de pagamento da sua unidade
❌ Não pode criar novas formas de pagamento (botão desabilitado)
❌ Não pode editar formas de pagamento (coluna "Ações" oculta)
❌ Não pode excluir formas de pagamento (coluna "Ações" oculta)
✅ Vê aviso: "Acesso Restrito - Apenas administradores..."
```

### Cenário 3: Usuário Barbeiro
```
✅ Pode visualizar formas de pagamento da sua unidade
❌ Não pode criar, editar ou excluir
❌ Coluna "Ações" não aparece
✅ Vê aviso de acesso restrito
```

---

## 🔐 Segurança em Camadas

### Camada 1: Banco de Dados (RLS)
```
🛡️ PostgreSQL Row-Level Security
   └─ Políticas impedem INSERT/UPDATE/DELETE se não for admin
   └─ Tentativa de burlar o frontend resulta em erro 403
```

### Camada 2: Frontend (UI)
```
🎨 Interface Adaptativa
   └─ Botões desabilitados/ocultos para não-admins
   └─ Aviso visual de permissões
   └─ Melhor UX: usuário entende limitações
```

### Camada 3: Service Layer
```
📡 Hook usePaymentMethods
   └─ Valida permissões antes de chamar API
   └─ Retorna erros claros se não autorizado
```

---

## 📊 Exemplo de Tentativa de Acesso Negado

### Gerente tenta criar forma de pagamento:

**Frontend**:
```
❌ Botão desabilitado visualmente
```

**Backend (se tentar via API)**:
```json
{
  "error": {
    "message": "permission denied for table payment_methods",
    "code": "42501",
    "details": "new row violates row-level security policy"
  }
}
```

**Toast Message**:
```
❌ Erro ao criar forma de pagamento
```

---

## 🎯 Impacto nas Funcionalidades

| Funcionalidade | Admin | Gerente | Barbeiro |
|----------------|-------|---------|----------|
| Ver lista de formas de pagamento | ✅ Todas | ✅ Da sua unidade | ✅ Da sua unidade |
| Criar nova forma de pagamento | ✅ Sim | ❌ Não | ❌ Não |
| Editar forma de pagamento | ✅ Sim | ❌ Não | ❌ Não |
| Desativar forma de pagamento | ✅ Sim | ❌ Não | ❌ Não |
| Ativar forma de pagamento | ✅ Sim | ❌ Não | ❌ Não |
| Excluir permanentemente | ✅ Sim | ❌ Não | ❌ Não |
| Ver estatísticas (KPIs) | ✅ Sim | ✅ Sim | ✅ Sim |
| Buscar/filtrar | ✅ Sim | ✅ Sim | ✅ Sim |

---

## 📁 Arquivos Modificados

### 1. **Banco de Dados**
- Políticas RLS na tabela `payment_methods`:
  - `Only admins can create payment methods` (INSERT)
  - `Only admins can update payment methods` (UPDATE)
  - `Only admins can delete payment methods` (DELETE)
  - `Users can view payment methods from their unit` (SELECT)

### 2. **Frontend**
- `src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx`:
  - Alterada verificação de permissões
  - Adicionado aviso para não-admins
  - Botão "Nova Forma de Pagamento" desabilitado para não-admins
  - Coluna "Ações" oculta para não-admins

---

## ✅ Validação

### Build
```
✅ Build: 24.74s
✅ CSS: 10.88 kB gzipped
✅ JS: 770.10 kB gzipped
✅ 0 erros de compilação
```

### Políticas RLS
```
✅ INSERT: Apenas admin
✅ UPDATE: Apenas admin
✅ DELETE: Apenas admin
✅ SELECT: Todos (filtrado por unidade)
```

### Interface
```
✅ Aviso exibido para não-admins
✅ Botão desabilitado para não-admins
✅ Coluna "Ações" oculta para não-admins
✅ Toast messages apropriadas
```

---

## 🚀 Próximos Passos (Opcional)

1. **Auditoria de Alterações**
   - Registrar em log quem criou/editou cada forma de pagamento
   - Adicionar campos `created_by` e `updated_by`

2. **Notificações**
   - Notificar gerentes quando formas de pagamento forem alteradas
   - Email/Push notification para mudanças importantes

3. **Histórico de Alterações**
   - Tabela `payment_methods_history`
   - Rastrear todas as modificações ao longo do tempo

4. **Permissões Granulares**
   - Permitir que admin conceda permissões específicas
   - Ex: Gerente pode editar, mas não excluir

---

## 📝 Conclusão

A restrição foi implementada com sucesso em **duas camadas de segurança**:

1. **Database (RLS)**: Garante que mesmo tentativas de burlar o frontend falhem
2. **Frontend (UI)**: Melhora UX mostrando claramente as limitações

Agora apenas **ADMINISTRADORES** podem gerenciar formas de pagamento, enquanto gerentes e barbeiros podem apenas visualizá-las para uso em vendas e relatórios.

**Status**: ✅ Implementado e Testado
**Segurança**: 🔒 Alta (RLS + Frontend)
**UX**: ⭐⭐⭐⭐⭐ (Aviso claro + botões adaptados)
