# 🎯 Próxima Tarefa: Atualizar Sidebar para Gerente

## 📋 Objetivo

Ocultar itens de menu no **Sidebar** que o gerente não pode acessar, garantindo que a interface reflita as permissões reais do usuário.

---

## 🔍 Análise Necessária

### 1. Localizar arquivo do Sidebar

```bash
# Procurar pelo componente Sidebar
src/components/Layout/Sidebar.jsx
# ou
src/organisms/Sidebar/Sidebar.jsx
```

### 2. Identificar estrutura de menu

**Esperado:**

```jsx
const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Financeiro', path: '/financial', icon: '💰' },
  { label: 'Lista da Vez', path: '/queue', icon: '📋' },
  // ...
  {
    label: 'Cadastros',
    icon: '📝',
    children: [
      { label: 'Categorias', path: '/cadastros/categorias' },
      { label: 'Clientes', path: '/cadastros/clientes' },
      { label: 'Formas de Pagamento', path: '/cadastros/formas-pagamento' }, // ❌ Ocultar para gerente
      { label: 'Produtos', path: '/cadastros/produtos' }, // ❌ Ocultar para gerente
    ],
  },
];
```

---

## ✅ Implementação

### Opção 1: Adicionar propriedade `roles` nos itens

```jsx
const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: ['admin', 'gerente', 'barbeiro'], // Todos
  },
  {
    label: 'Formas de Pagamento',
    path: '/cadastros/formas-pagamento',
    icon: '💳',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Produtos',
    path: '/cadastros/produtos',
    icon: '📦',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Contas Bancárias',
    path: '/financeiro/contas-bancarias',
    icon: '🏦',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Profissionais',
    path: '/professionals',
    icon: '👥',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Unidades',
    path: '/units',
    icon: '🏢',
    roles: ['admin'], // ❌ Apenas admin
  },
];
```

### Opção 2: Filtrar menu dinamicamente

```jsx
import { useAuth } from '../../context/AuthContext';

function Sidebar() {
  const { userRole, adminStatus } = useAuth();

  // Filtrar itens baseado na role
  const visibleItems = menuItems.filter(item => {
    // Admin vê tudo
    if (adminStatus) return true;

    // Se o item não especifica roles, todos veem
    if (!item.roles || item.roles.length === 0) return true;

    // Verificar se a role do usuário está permitida
    return item.roles.includes(userRole);
  });

  return (
    <nav>
      {visibleItems.map(item => (
        <MenuItem key={item.path} {...item} />
      ))}
    </nav>
  );
}
```

### Opção 3: Usar helper function

```jsx
// src/utils/permissions.js
export const canAccessRoute = (route, userRole, adminStatus) => {
  // Admin tem acesso total
  if (adminStatus) return true;

  const routePermissions = {
    '/cadastros/formas-pagamento': ['admin'],
    '/cadastros/produtos': ['admin'],
    '/financeiro/contas-bancarias': ['admin'],
    '/professionals': ['admin'],
    '/units': ['admin'],
    '/settings': ['admin'],
  };

  const allowedRoles = routePermissions[route];

  // Se não há restrição, todos podem acessar
  if (!allowedRoles) return true;

  // Verificar se a role está permitida
  return allowedRoles.includes(userRole);
};

// Uso no Sidebar
import { canAccessRoute } from '../../utils/permissions';

const visibleItems = menuItems.filter(item =>
  canAccessRoute(item.path, userRole, adminStatus)
);
```

---

## 🎨 Resultado Esperado

### Admin vê todos os itens:

```
📊 Dashboard
💰 Financeiro
  ├─ Receitas
  ├─ Despesas
  ├─ 🏦 Contas Bancárias ✅ (admin only)
  └─ Conciliação
📋 Lista da Vez
📝 Cadastros
  ├─ Categorias
  ├─ Clientes
  ├─ Fornecedores
  ├─ 💳 Formas de Pagamento ✅ (admin only)
  ├─ 📦 Produtos ✅ (admin only)
  └─ Metas
📊 DRE
📈 Relatórios
👥 Profissionais ✅ (admin only)
🏢 Unidades ✅ (admin only)
⚙️ Configurações ✅ (admin only)
```

### Gerente vê apenas itens permitidos:

```
📊 Dashboard
💰 Financeiro
  ├─ Receitas
  └─ Despesas
📋 Lista da Vez
📝 Cadastros
  ├─ Categorias
  ├─ Clientes
  ├─ Fornecedores
  └─ Metas
📊 DRE
📈 Relatórios
```

---

## 🧪 Testes

### Teste Manual

1. Login como **admin** (andrey@tratodebarbados.com)
   - ✅ Deve ver todos os itens do menu

2. Logout e login como **gerente** (sofiasantos@tratodebarbados.com)
   - ✅ Não deve ver: Formas de Pagamento, Produtos, Contas Bancárias, Profissionais, Unidades, Configurações

3. Login como **barbeiro**
   - ✅ Deve ver apenas: Dashboard, Lista da Vez, Perfil

### Teste Automatizado

```javascript
// e2e/sidebar-permissions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sidebar Permissions', () => {
  test('admin sees all menu items', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard');

    await expect(page.locator('text=Formas de Pagamento')).toBeVisible();
    await expect(page.locator('text=Produtos')).toBeVisible();
    await expect(page.locator('text=Profissionais')).toBeVisible();
  });

  test('gerente does not see admin-only items', async ({ page }) => {
    await loginAs(page, 'gerente');
    await page.goto('/dashboard');

    await expect(page.locator('text=Formas de Pagamento')).not.toBeVisible();
    await expect(page.locator('text=Produtos')).not.toBeVisible();
    await expect(page.locator('text=Profissionais')).not.toBeVisible();
  });
});
```

---

## 📝 Checklist de Implementação

- [ ] Localizar arquivo do Sidebar (`Sidebar.jsx`)
- [ ] Identificar estrutura atual de `menuItems`
- [ ] Adicionar propriedade `roles` nos itens de menu
- [ ] Importar `useAuth()` no componente
- [ ] Implementar filtro de itens visíveis
- [ ] Testar com usuário admin
- [ ] Testar com usuário gerente
- [ ] Testar com usuário barbeiro
- [ ] Verificar submenus (nested items)
- [ ] Atualizar testes E2E

---

## 🔍 Pontos de Atenção

### 1. Submenus (Nested Items)

Se o menu tem estrutura hierárquica:

```jsx
const filterMenuItems = items => {
  return items
    .filter(item => canAccessRoute(item.path, userRole, adminStatus))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: filterMenuItems(item.children), // Recursivo
        };
      }
      return item;
    })
    .filter(item => !item.children || item.children.length > 0); // Remover pais vazios
};
```

### 2. Ícones Dinâmicos

Se os ícones são componentes React:

```jsx
import { DashboardIcon, FinanceIcon, SettingsIcon } from './icons';

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon },
  { label: 'Configurações', icon: SettingsIcon, roles: ['admin'] },
];
```

### 3. Badges/Contadores

Se existem badges (ex: "3 novos"):

```jsx
{
  label: 'Lista da Vez',
  path: '/queue',
  badge: queueCount,
  roles: ['admin', 'gerente', 'barbeiro']
}
```

---

## 🎯 Exemplo Completo

```jsx
// src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuConfig = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: [], // Todos podem acessar
  },
  {
    label: 'Financeiro',
    path: '/financial',
    icon: '💰',
    roles: ['admin', 'gerente'],
  },
  {
    label: 'Lista da Vez',
    path: '/queue',
    icon: '📋',
    roles: [], // Todos
  },
  {
    label: 'Formas de Pagamento',
    path: '/cadastros/formas-pagamento',
    icon: '💳',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Produtos',
    path: '/cadastros/produtos',
    icon: '📦',
    roles: ['admin'], // ❌ Apenas admin
  },
  {
    label: 'Profissionais',
    path: '/professionals',
    icon: '👥',
    roles: ['admin'], // ❌ Apenas admin
  },
];

export function Sidebar() {
  const { userRole, adminStatus } = useAuth();

  const canAccess = item => {
    if (adminStatus) return true;
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
  };

  const visibleItems = menuConfig.filter(canAccess);

  return (
    <aside className="sidebar">
      <nav>
        {visibleItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'menu-item active' : 'menu-item'
            }
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
```

---

## 🚀 Pronto para Implementar

Execute os passos do checklist e valide com os testes manuais e automatizados.

**Próximo comando:**

```bash
# Localizar arquivo do Sidebar
code src/components/Layout/Sidebar.jsx
# ou
code src/organisms/Sidebar/Sidebar.jsx
```

---

**Status:** ⏳ Pendente  
**Prioridade:** 🔥 Alta  
**Estimativa:** 30 minutos
