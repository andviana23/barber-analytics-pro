# 📝 Convenções de Código

> **Objetivo**: Estabelecer padrões consistentes de código para garantir legibilidade, manutenibilidade e qualidade no Barber Analytics Pro.

---

## 📋 Índice

- [Princípios Fundamentais](#-princípios-fundamentais)
- [Naming Conventions](#-naming-conventions)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [JavaScript/React](#-javascriptreact)
- [CSS/Tailwind](#-csstailwind)
- [Comentários e Documentação](#-comentários-e-documentação)
- [Git Workflow](#-git-workflow)
- [Code Review Checklist](#-code-review-checklist)

---

## 🎯 Princípios Fundamentais

Este projeto segue os princípios de **Clean Code** (Robert C. Martin):

### 1. SOLID Principles

- **S**ingle Responsibility: Uma função/componente faz uma coisa
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Subtipos devem ser substituíveis
- **I**nterface Segregation: Interfaces específicas > interfaces gerais
- **D**ependency Inversion: Dependa de abstrações, não de concretizações

### 2. DRY (Don't Repeat Yourself)

```javascript
// ❌ Ruim - código duplicado
function formatRevenueAmount(revenue) {
  return `R$ ${revenue.amount.toFixed(2)}`;
}

function formatExpenseAmount(expense) {
  return `R$ ${expense.amount.toFixed(2)}`;
}

// ✅ Bom - reutilização
function formatCurrency(amount) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}
```

### 3. KISS (Keep It Simple, Stupid)

```javascript
// ❌ Ruim - complexo demais
function isUserEligible(user) {
  return user.role === 'admin' || user.role === 'manager' ||
         (user.role === 'barbeiro' && user.units.length > 0 &&
          user.active === true);
}

// ✅ Bom - simples e claro
function isUserEligible(user) {
  if (user.role === 'admin' || user.role === 'manager') {
    return true;
  }

  return user.role === 'barbeiro' && user.active && user.units.length > 0;
}
```

### 4. YAGNI (You Aren't Gonna Need It)

- Não implemente funcionalidades "caso precise no futuro"
- Código não usado é código que precisa de manutenção

---

## 📛 Naming Conventions

### Arquivos e Pastas

```
✅ Bom
src/atoms/Button/Button.jsx
src/hooks/useDashboard.js
src/services/revenueService.js
src/utils/formatters.js

❌ Ruim
src/atoms/button.jsx
src/hooks/DashboardHook.js
src/services/Revenue-Service.js
src/utils/Formatters.js
```

**Regras**:
- Componentes: `PascalCase.jsx`
- Hooks: `camelCase.js` com prefixo `use`
- Services: `camelCase.js` com sufixo `Service`
- Utils: `camelCase.js`
- Pastas: `PascalCase` (componentes) ou `camelCase` (demais)

### Variáveis

```javascript
// ✅ Bom - nomes descritivos
const totalRevenue = calculateTotalRevenue(revenues);
const isUserAuthenticated = checkAuthentication(user);
const MAX_RETRIES = 3;

// ❌ Ruim - nomes vagos
const data = calculate(arr);
const flag = check(u);
const x = 3;
```

**Regras**:
- Variáveis: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Booleanos: prefixo `is`, `has`, `should`
- Arrays/Listas: plural (`revenues`, `users`)

### Funções

```javascript
// ✅ Bom - verbos de ação
function calculateTotalRevenue(revenues) { }
function fetchUserData(userId) { }
function validateEmail(email) { }
function isValidDate(date) { }

// ❌ Ruim - nomes de substantivo
function revenue(data) { }
function user(id) { }
function email(string) { }
```

**Regras**:
- Funções: `camelCase` + verbo de ação
- Getters: prefixo `get`
- Setters: prefixo `set`
- Validações: prefixo `validate` ou `is`
- Transformações: prefixo `format`, `transform`, `convert`

### Componentes React

```javascript
// ✅ Bom
function DashboardPage() { }
function KPICard() { }
function UserProfileModal() { }

// ❌ Ruim
function dashboard() { }
function kpiCard() { }
function userProfile_modal() { }
```

**Regras**:
- Componentes: `PascalCase`
- Props: `camelCase`
- Event handlers: prefixo `handle` ou `on`

### Classes e DTOs

```javascript
// ✅ Bom
class RevenueDTO { }
class ValidationError extends Error { }
class AuthService { }

// ❌ Ruim
class revenueDto { }
class validationError { }
class authService { }
```

---

## 📁 Estrutura de Arquivos

### Componente Completo

```
src/atoms/Button/
├── Button.jsx          # Componente principal
├── Button.test.jsx     # Testes unitários
├── Button.stories.jsx  # Storybook (se usado)
└── index.js            # Export default
```

### Exports

```javascript
// ✅ Bom - index.js como barrel
// src/atoms/Button/index.js
export { default } from './Button';

// src/atoms/index.js
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Card } from './Card';
```

### Imports

```javascript
// ✅ Bom - ordem e agrupamento
// 1. External dependencies
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// 2. Internal dependencies
import { Button, Input, Card } from '../atoms';
import KPICard from '../molecules/KPICard';

// 3. Services/Hooks/Utils
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/formatters';

// 4. Types/Constants
import { USER_ROLES } from '../types/constants';

// 5. Styles/Assets
import './Dashboard.css';

// ❌ Ruim - sem organização
import { formatCurrency } from '../utils/formatters';
import { useState } from 'react';
import { Button } from '../atoms';
import { motion } from 'framer-motion';
```

---

## ⚛️ JavaScript/React

### Componentes Funcionais

```javascript
// ✅ Bom - functional component com hooks
import { useState, useEffect } from 'react';

/**
 * Componente de listagem de receitas
 */
export default function RevenuesList({ filters, onRevenueClick }) {
  const [revenues, setRevenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenues(filters);
  }, [filters]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {revenues.map(revenue => (
        <RevenueCard
          key={revenue.id}
          revenue={revenue}
          onClick={() => onRevenueClick(revenue)}
        />
      ))}
    </div>
  );
}

// ❌ Ruim - class component (evitar)
class RevenuesList extends React.Component {
  state = { revenues: [] };

  componentDidMount() {
    this.fetchRevenues();
  }

  render() {
    return <div>{/* ... */}</div>;
  }
}
```

### Props e Destructuring

```javascript
// ✅ Bom - destructuring com defaults
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  ...props
}) {
  return (
    <button
      className={`btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

// ❌ Ruim - props sem destructuring
function Button(props) {
  return (
    <button
      className={`btn-${props.variant || 'primary'}`}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
```

### Hooks

```javascript
// ✅ Bom - hooks customizados bem estruturados
export function useRevenues(filters = {}) {
  const [revenues, setRevenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setIsLoading(true);
        const data = await revenueService.getRevenues(filters);

        if (isMounted) {
          setRevenues(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  return { revenues, isLoading, error };
}

// ❌ Ruim - sem tratamento de cleanup
export function useRevenues(filters) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/revenues').then(r => r.json()).then(setData);
  }, []);

  return data;
}
```

### Conditional Rendering

```javascript
// ✅ Bom - condicional clara
function Dashboard({ user }) {
  if (!user) {
    return <LoginPrompt />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} />;
  }

  return <UserDashboard user={user} />;
}

// ✅ Bom - operador ternário simples
function StatusBadge({ status }) {
  return (
    <span className={status === 'paid' ? 'badge-success' : 'badge-warning'}>
      {status === 'paid' ? 'Pago' : 'Pendente'}
    </span>
  );
}

// ❌ Ruim - ternário aninhado complexo
function Status({ item }) {
  return (
    <div>
      {item.status === 'paid' ? (
        <span>Pago</span>
      ) : item.status === 'pending' ? (
        item.dueDate < Date.now() ? (
          <span>Vencido</span>
        ) : (
          <span>Pendente</span>
        )
      ) : (
        <span>Cancelado</span>
      )}
    </div>
  );
}
```

### Event Handlers

```javascript
// ✅ Bom - handlers inline para callbacks simples
<button onClick={() => deleteRevenue(revenue.id)}>
  Deletar
</button>

// ✅ Bom - handlers nomeados para lógica complexa
function RevenueCard({ revenue, onDelete }) {
  const handleDelete = (e) => {
    e.preventDefault();

    if (confirm('Tem certeza?')) {
      onDelete(revenue.id);
    }
  };

  return (
    <div>
      <button onClick={handleDelete}>Deletar</button>
    </div>
  );
}

// ❌ Ruim - bind no render
<button onClick={this.handleClick.bind(this, revenue.id)}>
  Click
</button>
```

### Error Handling

```javascript
// ✅ Bom - tratamento robusto de erros
async function fetchRevenues() {
  try {
    const { data, error } = await supabase
      .from('revenues')
      .select('*');

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    toast.error('Falha ao carregar receitas');
    throw error; // Re-throw para caller decidir
  }
}

// ❌ Ruim - ignorar erros
async function fetchRevenues() {
  const { data } = await supabase.from('revenues').select('*');
  return data;
}
```

---

## 🎨 CSS/Tailwind

### Organização de Classes

```javascript
// ✅ Bom - classes organizadas e legíveis
<button
  className={`
    px-4 py-2 rounded-lg
    font-medium text-white
    bg-primary-600 hover:bg-primary-700
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
>
  Salvar
</button>

// ✅ Bom - usando clsx para condicionais
import clsx from 'clsx';

<div className={clsx(
  'p-4 rounded-lg',
  isPaid ? 'bg-green-100' : 'bg-yellow-100',
  isSelected && 'ring-2 ring-primary-500'
)}>
  {/* ... */}
</div>

// ❌ Ruim - classes inline longas
<button className="px-4 py-2 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50">
  Salvar
</button>
```

### Responsividade

```javascript
// ✅ Bom - mobile-first
<div className="
  w-full           // Mobile
  md:w-1/2         // Tablet
  lg:w-1/3         // Desktop
  p-4              // Mobile
  md:p-6           // Tablet
  lg:p-8           // Desktop
">
  {/* ... */}
</div>
```

### Cores e Tema

```javascript
// ✅ Bom - usar variáveis do tema
className="bg-primary-600 text-white"
className="bg-danger-500 text-white"
className="bg-success-600 text-white"

// ❌ Ruim - cores hardcoded
className="bg-blue-600 text-white"
className="bg-red-500 text-white"
```

---

## 💬 Comentários e Documentação

### JSDoc

```javascript
/**
 * Calcula o total de receitas em um período
 *
 * @param {Array<Object>} revenues - Lista de receitas
 * @param {Date} startDate - Data inicial do período
 * @param {Date} endDate - Data final do período
 * @returns {number} Total em reais
 *
 * @example
 * const total = calculateTotalRevenue(revenues, new Date('2024-01-01'), new Date('2024-01-31'));
 * console.log(total); // 15000.00
 */
function calculateTotalRevenue(revenues, startDate, endDate) {
  return revenues
    .filter(r => r.date >= startDate && r.date <= endDate)
    .reduce((sum, r) => sum + r.amount, 0);
}
```

### Comentários Inline

```javascript
// ✅ Bom - comentar o "porquê", não o "o quê"
// Aguardar 100ms para debounce do input antes de fazer busca
await delay(100);

// Supabase RLS requer auth.uid() para queries de perfil
const { data } = await supabase.auth.getUser();

// ❌ Ruim - comentar o óbvio
// Incrementa i em 1
i++;

// Seta loading como true
setIsLoading(true);
```

### TODO Comments

```javascript
// TODO: Implementar paginação quando houver mais de 100 itens
// FIXME: Query está lenta, adicionar índice na coluna transaction_date
// HACK: Workaround temporário até Supabase adicionar suporte a timezone
// NOTE: Esta lógica precisa estar sincronizada com o backend
```

---

## 🌳 Git Workflow

### Branch Naming

```bash
✅ Bom
feature/add-revenue-export
fix/correct-dre-calculation
refactor/simplify-auth-logic
chore/update-dependencies
docs/add-api-documentation

❌ Ruim
my-changes
update
fix-bug
improvements
```

**Padrões**:
- `feature/` - Nova funcionalidade
- `fix/` - Correção de bug
- `refactor/` - Refatoração sem mudança de comportamento
- `chore/` - Tarefas de manutenção
- `docs/` - Apenas documentação
- `test/` - Adição/correção de testes

### Conventional Commits

```bash
# Estrutura: <type>(<scope>): <subject>

✅ Bom
feat(revenues): add export to Excel functionality
fix(dre): correct calculation for accrual revenues
refactor(auth): simplify user validation logic
docs(api): add endpoints documentation
test(services): add unit tests for revenueService
chore(deps): update React to v19
style(button): adjust padding and colors

❌ Ruim
updated files
bug fix
changes
improvements
```

**Types**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração
- `docs`: Documentação
- `test`: Testes
- `chore`: Manutenção
- `style`: Formatação/estilos
- `perf`: Performance
- `ci`: CI/CD

### Commit Messages

```bash
# ✅ Bom - mensagem descritiva
feat(revenues): add filtering by date range and unit

Implementa filtros de data e unidade na listagem de receitas.
Adiciona DateRangePicker e UnitSelector.
Atualiza hook useRevenues para aceitar filtros.

Closes #123

# ❌ Ruim - vago
update code
fix bug
changes
```

**Regras**:
- Primeira linha: máximo 72 caracteres
- Use imperativo: "add" não "added" ou "adds"
- Corpo explica o "porquê", não o "o quê"
- Referência issues: `Closes #123`, `Fixes #456`

---

## ✅ Code Review Checklist

### Funcionalidade

- [ ] Código faz o que deveria fazer?
- [ ] Edge cases estão cobertos?
- [ ] Erros são tratados adequadamente?
- [ ] Performance é aceitável?

### Qualidade

- [ ] Segue naming conventions?
- [ ] Código é legível e autoexplicativo?
- [ ] Não há duplicação desnecessária?
- [ ] Complexidade é justificada?

### Testes

- [ ] Testes unitários foram adicionados?
- [ ] Testes cobrem casos principais?
- [ ] Testes passam localmente?

### Documentação

- [ ] Código complexo está comentado?
- [ ] JSDoc atualizado?
- [ ] README atualizado (se necessário)?

### Segurança

- [ ] Não há credenciais hardcoded?
- [ ] Inputs são validados?
- [ ] XSS/SQL injection prevenidos?

### UI/UX

- [ ] Interface é responsiva?
- [ ] Acessibilidade (ARIA) implementada?
- [ ] Loading states presentes?
- [ ] Feedback visual adequado?

---

## 🔧 ESLint e Prettier

### Configuração ESLint

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
```

### Configuração Prettier

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Rodando Localmente

```bash
# Verificar problemas
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar código
npm run format
```

---

## 📚 Referências

- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [Effective JavaScript](https://effectivejs.com/) - David Herman
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Best Practices](https://react.dev/learn)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
