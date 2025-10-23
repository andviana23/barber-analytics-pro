# 🔐 Controle de Acesso - Papel Gerente

## 📋 Visão Geral

Este documento detalha o **controle de acesso completo** implementado para o papel **gerente** no Barber Analytics Pro.

A implementação segue uma **defesa em profundidade** (defense-in-depth):

- 🛡️ **Backend**: Row Level Security (RLS) no PostgreSQL
- 🚪 **Frontend**: Controle de rotas baseado em roles

---

## 🎯 Matriz de Permissões

### ✅ Páginas Permitidas para Gerente

| Rota                      | Acesso       | Permissões                                    |
| ------------------------- | ------------ | --------------------------------------------- |
| `/dashboard`              | ✅ Permitido | Visualizar KPIs gerais                        |
| `/financial`              | ✅ Permitido | Criar, editar, visualizar receitas e despesas |
| `/financeiro/receitas`    | ✅ Permitido | Gerenciar receitas                            |
| `/financeiro/despesas`    | ✅ Permitido | Gerenciar despesas                            |
| `/queue` (Lista da Vez)   | ✅ Permitido | Visualizar e editar fila                      |
| `/queue/history`          | ✅ Permitido | Histórico de atendimentos                     |
| `/cadastros/categorias`   | ✅ Permitido | Criar e visualizar categorias                 |
| `/cadastros/clientes`     | ✅ Permitido | Criar e visualizar clientes                   |
| `/cadastros/fornecedores` | ✅ Permitido | Criar e visualizar fornecedores               |
| `/cadastros/metas`        | ✅ Permitido | Visualizar e criar metas                      |
| `/dre`                    | ✅ Permitido | Visualizar DRE (Demonstrativo de Resultados)  |
| `/relatorios`             | ✅ Permitido | Relatórios gerenciais                         |

### ❌ Páginas Bloqueadas para Gerente

| Rota                           | Bloqueado    | Motivo                    |
| ------------------------------ | ------------ | ------------------------- |
| `/cadastros/formas-pagamento`  | ❌ Bloqueado | Apenas admin              |
| `/cadastros/produtos`          | ❌ Bloqueado | Apenas admin              |
| `/financeiro/contas-bancarias` | ❌ Bloqueado | Apenas admin              |
| `/financeiro/conciliacao`      | ❌ Bloqueado | Apenas admin              |
| `/professionals`               | ❌ Bloqueado | Gestão administrativa     |
| `/units`                       | ❌ Bloqueado | Gestão administrativa     |
| `/settings`                    | ❌ Bloqueado | Configurações do sistema  |
| `/user-management`             | ❌ Bloqueado | Gerenciamento de usuários |

---

## 🔧 Implementação Técnica

### 1. Backend - Row Level Security (RLS)

**36 políticas criadas** cobrindo:

```sql
-- ✅ Permitir SELECT nas tabelas de negócio
CREATE POLICY "gerente_select_revenues" ON revenues FOR SELECT...
CREATE POLICY "gerente_select_expenses" ON expenses FOR SELECT...
CREATE POLICY "gerente_select_categories" ON categories FOR SELECT...

-- ✅ Permitir INSERT/UPDATE nas tabelas de negócio
CREATE POLICY "gerente_insert_revenues" ON revenues FOR INSERT...
CREATE POLICY "gerente_update_expenses" ON expenses FOR UPDATE...

-- ❌ BLOQUEAR DELETE em todas as tabelas
CREATE POLICY "gerente_no_delete_revenues" ON revenues FOR DELETE USING (false);
CREATE POLICY "gerente_no_delete_expenses" ON expenses FOR DELETE USING (false);

-- ❌ BLOQUEAR acesso a tabelas administrativas
-- Não há políticas de acesso para:
-- - bank_accounts
-- - payment_methods
-- - products
-- - units (exceto leitura)
-- - subscriptions
```

**Isolamento por Unidade:**

```sql
-- Gerente só vê dados da própria unidade
WHERE unit_id IN (
  SELECT unit_id
  FROM professionals
  WHERE user_id = auth.uid()
)
```

### 2. Frontend - Controle de Rotas

#### **ProtectedRoute Component**

```jsx
// src/components/ProtectedRoute/ProtectedRoute.jsx
export function ProtectedRoute({
  children,
  roles = [],
  redirectTo = '/login',
}) {
  const { isAuthenticated, loading, userRole, adminStatus } = useAuth();

  // Verificar autenticação
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={redirectTo} replace />;

  // Verificar role (se especificado)
  if (roles.length > 0) {
    // Admin tem acesso total
    if (adminStatus) return children;

    // Outros precisam ter a role necessária
    if (!roles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
```

#### **Uso em App.jsx**

**Exemplo: Rota permitida para gerente**

```jsx
<Route
  path="/financial"
  element={
    <ProtectedRoute roles={['admin', 'gerente']}>
      <Layout activeMenuItem="financial">
        <FinanceiroAdvancedPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

**Exemplo: Rota bloqueada para gerente**

```jsx
<Route
  path="/cadastros/formas-pagamento"
  element={
    <ReceptionistRoute>
      <ProtectedRoute roles={['admin']}>
        <PaymentMethodsPage />
      </ProtectedRoute>
    </ReceptionistRoute>
  }
/>
```

**Exemplo: Rota pública (todos os autenticados)**

```jsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      {' '}
      {/* Sem roles = todos autenticados */}
      <Layout activeMenuItem="dashboard">
        <DashboardPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

---

## 🧪 Testes de Validação

### Usuário de Teste

**Email:** sofiasantos@tratodebarbados.com  
**Senha:** Sofia@2025  
**Role:** gerente  
**Unidade:** Unidade Default

### Cenários de Teste

#### ✅ Deve Permitir Acesso

```bash
# Login
1. Acessar /login
2. Entrar com sofiasantos@tratodebarbados.com / Sofia@2025
3. ✅ Deve redirecionar para /dashboard

# Dashboard
4. Acessar /dashboard
5. ✅ Deve exibir KPIs gerais

# Financeiro
6. Acessar /financial
7. ✅ Deve exibir receitas e despesas
8. Clicar em "Nova Receita"
9. ✅ Deve abrir modal de criação

# Lista da Vez
10. Acessar /queue
11. ✅ Deve exibir fila de atendimento

# Cadastros (permitidos)
12. Acessar /cadastros/categorias
13. ✅ Deve exibir categorias
14. Acessar /cadastros/clientes
15. ✅ Deve exibir clientes
```

#### ❌ Deve Bloquear Acesso

```bash
# Formas de Pagamento
1. Tentar acessar /cadastros/formas-pagamento
2. ❌ Deve redirecionar para /unauthorized

# Produtos
3. Tentar acessar /cadastros/produtos
4. ❌ Deve redirecionar para /unauthorized

# Contas Bancárias
5. Tentar acessar /financeiro/contas-bancarias
6. ❌ Deve redirecionar para /unauthorized

# Gestão de Profissionais
7. Tentar acessar /professionals
8. ❌ Deve redirecionar para /unauthorized

# Unidades
9. Tentar acessar /units
10. ❌ Deve redirecionar para /unauthorized

# Configurações
11. Tentar acessar /settings
12. ❌ Deve redirecionar para /unauthorized
```

### Script de Teste Automatizado

```javascript
// tests/access-control/gerente.spec.js
describe('Gerente Access Control', () => {
  beforeEach(async () => {
    await loginAs('sofiasantos@tratodebarbados.com', 'Sofia@2025');
  });

  it('should access allowed routes', async () => {
    const allowedRoutes = [
      '/dashboard',
      '/financial',
      '/queue',
      '/cadastros/categorias',
      '/cadastros/clientes',
      '/dre',
    ];

    for (const route of allowedRoutes) {
      await page.goto(route);
      expect(page.url()).not.toContain('/unauthorized');
    }
  });

  it('should block restricted routes', async () => {
    const blockedRoutes = [
      '/cadastros/formas-pagamento',
      '/cadastros/produtos',
      '/financeiro/contas-bancarias',
      '/professionals',
      '/units',
      '/settings',
    ];

    for (const route of blockedRoutes) {
      await page.goto(route);
      expect(page.url()).toContain('/unauthorized');
    }
  });

  it('should display correct role badge', async () => {
    await page.goto('/dashboard');
    const badge = await page.locator('[data-testid="user-role-badge"]');
    expect(await badge.textContent()).toBe('Gerente');
  });
});
```

---

## 📊 Resumo de Implementação

### ✅ Arquivos Modificados

| Arquivo                                            | Modificação                        | Status       |
| -------------------------------------------------- | ---------------------------------- | ------------ |
| `src/components/ProtectedRoute/ProtectedRoute.jsx` | Adicionado suporte a `roles` array | ✅ Concluído |
| `src/context/AuthContext.jsx`                      | Adicionado `gerenteStatus`         | ✅ Concluído |
| `src/organisms/Navbar/Navbar.jsx`                  | Corrigido mapeamento de roles      | ✅ Concluído |
| `src/pages/UserProfilePage/UserProfilePage.jsx`    | Removido fallback para 'barbeiro'  | ✅ Concluído |
| `src/App.jsx`                                      | Aplicadas restrições de rotas      | ✅ Concluído |

### 🛡️ Segurança em Camadas

```
┌─────────────────────────────────────────┐
│         USUÁRIO GERENTE                 │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   1. Frontend Route Protection          │
│   - ProtectedRoute com roles            │
│   - Redirect para /unauthorized         │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   2. Backend RLS Policies               │
│   - 36 políticas específicas            │
│   - Isolamento por unit_id              │
│   - Bloqueio de DELETE                  │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   3. PostgreSQL Database                │
│   - Dados seguros e isolados            │
└─────────────────────────────────────────┘
```

---

## 🔄 Próximos Passos

1. ✅ **Validar acesso com usuário Sofia Santos**
2. ⏳ **Atualizar Sidebar** para ocultar itens de menu bloqueados
3. ⏳ **Criar testes E2E** (Playwright) para validação automática
4. ⏳ **Documentar casos de uso** específicos do gerente
5. ⏳ **Criar guia de treinamento** para gerentes

---

## 📝 Notas Importantes

### Defesa em Profundidade

- **Frontend**: Controla UI e navegação (experiência do usuário)
- **Backend**: Garante segurança real (proteção de dados)
- **Mesmo que alguém burle o frontend, o RLS bloqueia no banco**

### Isolamento por Unidade

- Gerente só vê dados da **própria unidade**
- Regra aplicada via `unit_id` em todas as políticas RLS
- Impossível acessar dados de outras unidades

### Admin Bypass

- Admin tem acesso irrestrito (por design)
- Implementado em `ProtectedRoute`: `if (adminStatus) return children`

### Soft Delete

- Todas as exclusões são **soft delete** (`is_active = false`)
- Gerente **não pode deletar** (hard ou soft)
- Apenas admin pode executar exclusões

---

## 🆘 Troubleshooting

### Gerente vê página em branco ao acessar rota bloqueada

**Problema:** Página `/unauthorized` não está sendo renderizada  
**Solução:** Verificar se a rota está configurada em `App.jsx`:

```jsx
<Route path="/unauthorized" element={<UnauthorizedPage />} />
```

### Gerente ainda tem acesso a rota bloqueada

**Problema:** Rota não tem restrição de role  
**Solução:** Adicionar `roles={['admin']}` ao `ProtectedRoute`:

```jsx
<ProtectedRoute roles={['admin']}>
  <BlockedPage />
</ProtectedRoute>
```

### Badge mostra "Usuário" em vez de "Gerente"

**Problema:** Role não está sendo lida corretamente  
**Solução:** Verificar `user_metadata.role` no Supabase:

```sql
SELECT raw_user_meta_data
FROM auth.users
WHERE email = 'sofiasantos@tratodebarbados.com';
```

---

## 📚 Referências

- [FINANCIAL_MODULE.md](./FINANCIAL_MODULE.md) - Módulo Financeiro
- [LISTA_DA_VEZ_MODULE.md](./LISTA_DA_VEZ_MODULE.md) - Lista da Vez
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura Geral
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Esquema do Banco

---

**Autor:** Andrey Viana  
**Data:** 2025-01-26  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
