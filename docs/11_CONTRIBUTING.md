---
title: 'Barber Analytics Pro - Contributing Guide'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 11 - Contributing Guide

Guia completo para contribuir com o projeto Barber Analytics Pro.

---

## 📋 Índice

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Commit Conventions](#commit-conventions)
- [Testing Guidelines](#testing-guidelines)

---

## 🤝 Code of Conduct

### Nossos Valores

- **Respeito**: Tratamos todos com dignidade e profissionalismo
- **Colaboração**: Trabalhamos juntos para alcançar objetivos comuns
- **Excelência**: Buscamos qualidade em tudo que fazemos
- **Transparência**: Comunicação clara e honesta
- **Aprendizado**: Compartilhamos conhecimento e crescemos juntos

### Comportamento Esperado

✅ **Faça:**

- Seja respeitoso e inclusivo
- Forneça feedback construtivo
- Aceite críticas com profissionalismo
- Foque no problema, não na pessoa
- Ajude outros desenvolvedores

❌ **Não Faça:**

- Usar linguagem ofensiva ou discriminatória
- Fazer ataques pessoais
- Compartilhar informações confidenciais
- Fazer spam ou trolling
- Assédio de qualquer tipo

---

## 🚀 Getting Started

### 1. Fork e Clone

```bash
# Fork o repositório via GitHub UI
# https://github.com/andviana23/barber-analytics-pro

# Clone seu fork
git clone git@github.com:SEU_USERNAME/barber-analytics-pro.git
cd barber-analytics-pro

# Adicione o upstream
git remote add upstream git@github.com:andviana23/barber-analytics-pro.git
```

### 2. Setup do Ambiente

```bash
# Instalar Node.js 20+
node --version  # v20.x.x

# Instalar pnpm
npm install -g pnpm@8
pnpm --version  # 8.x.x

# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase
```

### 3. Conectar ao Supabase

```bash
# Instalar Supabase CLI
brew install supabase/tap/supabase
# ou
npm install -g supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref seu-projeto-id

# Aplicar migrations localmente
supabase db reset
```

### 4. Rodar o Projeto

```bash
# Desenvolvimento
pnpm dev
# Aplicação rodando em http://localhost:5173

# Build
pnpm build

# Preview do build
pnpm preview

# Testes
pnpm test
pnpm test:e2e
```

---

## 🔄 Development Workflow

### Fluxo Básico

```
1. Criar branch feature
2. Desenvolver e testar localmente
3. Fazer commits seguindo convenção
4. Push para seu fork
5. Abrir Pull Request
6. Code review e ajustes
7. Merge após aprovação
```

### Exemplo Prático

```bash
# 1. Atualizar main
git checkout main
git pull upstream main

# 2. Criar feature branch
git checkout -b feature/commission-calculator

# 3. Desenvolver
# ... código aqui ...

# 4. Testar
pnpm test
pnpm lint

# 5. Commit
git add .
git commit -m "feat(financial): add commission calculator"

# 6. Push
git push origin feature/commission-calculator

# 7. Abrir PR no GitHub
```

---

## 💅 Code Style

### ESLint Configuration

**Arquivo:** `eslint.config.js`

```javascript
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // React
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Code Quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',

      // Imports
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
    },
  },
];
```

### Prettier Configuration

**Arquivo:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Naming Conventions

#### Arquivos e Pastas

```
✅ CORRETO:
components/
  ├── KPICard.jsx          (PascalCase para componentes)
  ├── useRevenues.js       (camelCase para hooks)
  ├── revenueService.js    (camelCase para services)
  └── formatCurrency.js    (camelCase para utils)

❌ ERRADO:
components/
  ├── kpi-card.jsx
  ├── UseRevenues.js
  ├── revenue_service.js
```

#### Variáveis e Funções

```javascript
// ✅ CORRETO
const userName = 'João';
const isActive = true;
const getUserData = () => {};
const handleClick = () => {};

// ❌ ERRADO
const user_name = 'João';
const IsActive = true;
const get_user_data = () => {};
const HandleClick = () => {};
```

#### Componentes React

```javascript
// ✅ CORRETO
function KPICard({ title, value, trend }) {
  return (
    <div className="card-theme">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default KPICard;

// ❌ ERRADO
function kpiCard(props) {
  return <div className="bg-white">{props.title}</div>;
}
```

#### Constantes

```javascript
// ✅ CORRETO
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// ❌ ERRADO
const apiBaseUrl = 'https://api.example.com';
const maxRetries = 3;
```

### Import Order

```javascript
// 1. Built-in modules
import { useState, useEffect } from 'react';

// 2. External dependencies
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// 3. Internal modules
import { revenueService } from '@/services/revenueService';
import { formatCurrency } from '@/utils/formatters';

// 4. Components
import { KPICard } from '@/molecules/KPICard';
import { Button } from '@/atoms/Button';

// 5. Styles (se necessário)
import './styles.css';
```

### Component Structure

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * KPICard - Exibe um indicador chave de performance
 *
 * @param {string} title - Título do KPI
 * @param {string} value - Valor formatado
 * @param {number} trend - Variação percentual (opcional)
 * @returns {JSX.Element}
 */
function KPICard({ title, value, trend }) {
  // 1. Hooks
  const [isLoading, setIsLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Logic here
  }, []);

  // 3. Handlers
  const handleClick = () => {
    // Logic here
  };

  // 4. Render helpers
  const renderTrend = () => {
    if (!trend) return null;
    return (
      <span className={trend > 0 ? 'positive' : 'negative'}>
        {trend > 0 ? '+' : ''}
        {trend}%
      </span>
    );
  };

  // 5. Return
  return (
    <div className="card-theme p-6">
      <h3 className="text-theme-primary">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      {renderTrend()}
    </div>
  );
}

// 6. PropTypes
KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  trend: PropTypes.number,
};

export default KPICard;
```

---

## 🌿 Git Workflow

### Gitflow Branching Strategy

```
main (produção)
  │
  └─── production (pre-release)
        │
        └─── develop (desenvolvimento)
              │
              ├─── feature/nome-da-feature
              ├─── bugfix/nome-do-bug
              ├─── hotfix/nome-do-hotfix
              └─── release/v1.2.0
```

### Branch Naming

| Tipo         | Padrão                     | Exemplo                         |
| ------------ | -------------------------- | ------------------------------- |
| **Feature**  | `feature/descricao-curta`  | `feature/commission-calculator` |
| **Bugfix**   | `bugfix/descricao-do-bug`  | `bugfix/cashflow-calculation`   |
| **Hotfix**   | `hotfix/descricao-urgente` | `hotfix/security-vulnerability` |
| **Release**  | `release/v1.2.0`           | `release/v1.2.0`                |
| **Docs**     | `docs/descricao`           | `docs/update-api-reference`     |
| **Refactor** | `refactor/descricao`       | `refactor/service-layer`        |

### Branch Lifecycle

```bash
# Feature Branch
git checkout develop
git pull origin develop
git checkout -b feature/add-commissions
# ... desenvolvimento ...
git push origin feature/add-commissions
# Abrir PR para develop

# Release Branch
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
# Ajustes finais, bump version
git push origin release/v1.2.0
# Abrir PR para main E develop

# Hotfix Branch
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
# Fix the bug
git push origin hotfix/critical-bug
# Abrir PR para main E develop
```

### Protected Branches

**main:**

- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators

**develop:**

- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass

---

## 🔀 Pull Request Process

### 1. Antes de Abrir o PR

```bash
# Atualizar com a branch base
git checkout develop
git pull origin develop
git checkout feature/minha-feature
git merge develop

# Rodar testes
pnpm test
pnpm lint
pnpm lint:fix

# Build
pnpm build
```

### 2. Template de PR

**Título:** `feat(financial): add commission calculator`

**Descrição:**

```markdown
## 📝 Descrição

Implementa calculadora de comissões para profissionais com suporte a:

- Comissão percentual sobre valor líquido
- Comissão fixa por serviço
- Regras customizáveis por unidade

## 🎯 Issue Relacionada

Closes #42

## 🧪 Como Testar

1. Acesse a página de Profissionais
2. Clique em "Configurar Comissões"
3. Defina uma regra de 10% sobre valor líquido
4. Registre uma receita de R$ 100,00
5. Verifique que a comissão calculada é R$ 10,00

## 📸 Screenshots

![Tela de configuração](screenshot-config.png)
![Resultado do cálculo](screenshot-result.png)

## ✅ Checklist

- [x] Código implementado e funcional
- [x] Testes unitários adicionados (coverage 85%)
- [x] Testes E2E para fluxo crítico
- [x] Documentação atualizada
- [x] Sem warnings do linter
- [x] Build passa sem erros
- [x] Validado manualmente

## 🚨 Breaking Changes

Nenhum breaking change.

## 📚 Documentação

- Atualizado `06_API_REFERENCE.md` com `commissionService`
- Adicionado exemplo em `EXAMPLES.md`

## 🔗 Links Úteis

- [Design no Figma](https://figma.com/...)
- [Discussão no Slack](https://slack.com/...)
```

### 3. Code Review Checklist

**Para Revisor:**

- [ ] **Funcionalidade**: O código faz o que deveria?
- [ ] **Testes**: Testes adequados e passando?
- [ ] **Arquitetura**: Segue Clean Architecture?
- [ ] **Performance**: Sem gargalos evidentes?
- [ ] **Segurança**: Sem vulnerabilidades?
- [ ] **Code Style**: Segue padrões do projeto?
- [ ] **Documentação**: Comentários e docs atualizados?
- [ ] **Design System**: Usa classes utilitárias corretas?

**Tipos de Comentário:**

```markdown
# 🔴 Blocking (deve ser corrigido)

[BLOCKING] Este método pode causar SQL injection.
Sugestão: Usar prepared statements.

# 🟡 Non-blocking (sugestão)

[SUGGESTION] Considere extrair esta lógica para um service.
Motivo: Melhor testabilidade.

# 💡 Nit (estilo/preferência)

[NIT] Prefira `const` ao invés de `let` aqui.

# 👍 Praise (reconhecimento)

[PRAISE] Excelente uso de memoização aqui! 🎉
```

### 4. Respondendo ao Review

```markdown
# Aceitar sugestão

✅ Aplicado em commit abc123

# Discordar com explicação

❌ Não aplicado. Motivo: Esta abordagem foi escolhida porque...
Referência: [Link para discussão anterior]

# Pedir esclarecimento

❓ Pode elaborar mais sobre esta sugestão?
Não entendi como isso ajudaria na performance.
```

---

## 📜 Commit Conventions

### Conventional Commits

**Formato:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Descrição           | Exemplo                                        |
| ---------- | ------------------- | ---------------------------------------------- |
| `feat`     | Nova funcionalidade | `feat(financial): add DRE calculator`          |
| `fix`      | Correção de bug     | `fix(cashflow): correct accumulated balance`   |
| `docs`     | Documentação        | `docs(api): update service signatures`         |
| `style`    | Formatação          | `style(components): format with prettier`      |
| `refactor` | Refatoração         | `refactor(services): extract validation logic` |
| `test`     | Adicionar testes    | `test(revenue): add unit tests for service`    |
| `chore`    | Manutenção          | `chore(deps): update dependencies`             |
| `perf`     | Performance         | `perf(queries): optimize revenue query`        |
| `ci`       | CI/CD               | `ci(github): add deploy workflow`              |
| `build`    | Build system        | `build(vite): update config`                   |

### Scopes

```
financial, payments, clients, scheduler, reports, notifications,
auth, database, ui, api, tests, docs, config, deps
```

### Exemplos de Commits

```bash
# Feature
git commit -m "feat(financial): add commission calculator

Implementa calculadora de comissões com suporte a:
- Percentual sobre valor líquido
- Valor fixo por serviço
- Regras customizáveis

Refs: #42"

# Bugfix
git commit -m "fix(cashflow): correct accumulated balance calculation

O saldo acumulado estava sendo calculado incorretamente
quando havia transações no mesmo dia.

Fixes: #58"

# Docs
git commit -m "docs(api): update commissionService signatures"

# Refactor
git commit -m "refactor(services): extract DTO validation to separate layer"

# Breaking Change
git commit -m "feat(auth)!: migrate to JWT tokens

BREAKING CHANGE: Remove suporte a session cookies.
Usuários precisarão fazer login novamente."
```

### Commit Message Guidelines

**✅ Boas Práticas:**

- Use imperativo ("add" não "added")
- Primeira linha com máx 72 caracteres
- Corpo com máx 80 caracteres por linha
- Separe subject do body com linha vazia
- Explique o "porquê", não o "como"
- Referencie issues quando relevante

**❌ Evite:**

```bash
# ❌ Muito vago
git commit -m "fix bug"

# ❌ Sem contexto
git commit -m "update"

# ❌ Multiplos tipos
git commit -m "fix bug and add feature"

# ❌ Caps lock
git commit -m "FIX CASHFLOW BUG"
```

**✅ Exemplos Corretos:**

```bash
# ✅ Claro e descritivo
git commit -m "fix(cashflow): prevent negative balance in accumulated total"

# ✅ Com contexto
git commit -m "feat(reports): add Excel export for DRE

Allows users to export DRE reports to Excel format
using SheetJS library. Includes proper formatting
and monetary values."

# ✅ Breaking change
git commit -m "refactor(api)!: change revenue endpoint response structure

BREAKING CHANGE: The revenue API now returns a nested
object instead of a flat structure. Update clients accordingly.

Before: { id, value, date }
After: { id, data: { value, date } }"
```

### Commitlint Configuration

**Arquivo:** `commitlint.config.js`

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'financial',
        'payments',
        'clients',
        'scheduler',
        'reports',
        'notifications',
        'auth',
        'database',
        'ui',
        'api',
        'tests',
        'docs',
        'config',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 80],
  },
};
```

---

## 🧪 Testing Guidelines

### Test Coverage Requirements

| Layer        | Coverage | Priority  |
| ------------ | -------- | --------- |
| Services     | 80%+     | 🔴 High   |
| Repositories | 70%+     | 🔴 High   |
| Hooks        | 75%+     | 🟡 Medium |
| Components   | 60%+     | 🟡 Medium |
| Utils        | 90%+     | 🔴 High   |

### Writing Good Tests

```javascript
// ✅ CORRETO: AAA Pattern (Arrange, Act, Assert)
it('should calculate commission correctly', () => {
  // Arrange
  const revenue = {
    value: 100,
    professional: { commission_rate: 0.1 },
  };

  // Act
  const result = calculateCommission(revenue);

  // Assert
  expect(result).toBe(10);
});

// ❌ ERRADO: Sem estrutura clara
it('test commission', () => {
  expect(calculateCommission({ value: 100 })).toBe(10);
});
```

### Test Naming

```javascript
// ✅ CORRETO: Descritivo
describe('revenueService', () => {
  describe('createRevenue', () => {
    it('should create revenue with valid data', () => {});
    it('should reject negative values', () => {});
    it('should calculate fees automatically', () => {});
    it('should throw error when user lacks permission', () => {});
  });
});

// ❌ ERRADO: Vago
describe('revenue', () => {
  it('test 1', () => {});
  it('should work', () => {});
});
```

### Before Submitting

```bash
# Rodar todos os testes
pnpm test

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# Lint
pnpm lint

# Type check
pnpm tsc --noEmit
```

---

## 📚 Additional Resources

### Documentação Interna

- [Architecture Overview](./02_ARCHITECTURE.md)
- [API Reference](./06_API_REFERENCE.md)
- [Testing Strategy](./08_TESTING_STRATEGY.md)
- [Deployment Guide](./09_DEPLOYMENT_GUIDE.md)

### Links Úteis

- **React Docs**: https://react.dev/
- **Vite Guide**: https://vitejs.dev/guide/
- **Supabase Docs**: https://supabase.com/docs
- **TanStack Query**: https://tanstack.com/query/latest
- **Conventional Commits**: https://www.conventionalcommits.org/

### Getting Help

- 💬 **Slack**: `#barber-analytics-dev`
- 📧 **Email**: dev@barber-analytics.com
- 🐛 **Issues**: https://github.com/andviana23/barber-analytics-pro/issues
- 📖 **Wiki**: https://github.com/andviana23/barber-analytics-pro/wiki

---

## 🔗 Navegação

- [← 10 - Project Management](./10_PROJECT_MANAGEMENT.md)
- [→ 12 - Changelog](./12_CHANGELOG.md)
- [📚 Summary](./SUMMARY.md)

---

## 📖 Referências

1. **Clean Code**. Robert C. Martin (2008)
2. **Refactoring**. Martin Fowler (2018)
3. **Conventional Commits**. https://www.conventionalcommits.org/
4. **Git Best Practices**. https://git-scm.com/book/en/v2

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
