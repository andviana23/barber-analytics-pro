# 🧪 Testes - Barber Analytics Pro

## 📋 Estrutura de Testes

```
tests/
├── unit/              # Testes unitários (Vitest)
├── integration/       # Testes de integração (Vitest + Supertest)
├── load/             # Testes de carga (k6)
└── setup.ts          # Configuração global
```

## 🛠️ Ferramentas

### Vitest

- **Uso**: Testes unitários e de integração
- **Coverage**: 85% (branches, functions, lines, statements)
- **Setup**: `tests/setup.ts`

### Supertest

- **Uso**: Testes HTTP/API
- **Integração**: Edge Functions, Repositories
- **Mock**: Supabase auth e queries

### k6

- **Uso**: Testes de carga e stress
- **Instalação**: `sudo dnf install k6 -y`
- **Scripts**: `tests/load/`

## 📦 Scripts Disponíveis

```bash
# Testes Unitários
pnpm test                    # Watch mode
pnpm test:run                # Run once
pnpm test:unit               # Apenas unitários
pnpm test:coverage           # Com coverage

# Testes de Integração
pnpm test:integration        # API/Repository tests

# Testes E2E
pnpm test:e2e                # Playwright
pnpm test:e2e:ui             # Playwright UI mode

# Testes de Carga (k6)
pnpm test:load               # Basic load test
pnpm test:stress             # Stress test

# Validação Completa
pnpm test:all                # Unit + Integration + E2E
pnpm validate                # Lint + Format + TypeCheck
```

## 🎯 Executar Testes

### 1. Testes Unitários (Vitest)

```bash
# Watch mode (desenvolvimento)
pnpm test

# Run once (CI/CD)
pnpm test:run

# Com coverage
pnpm test:coverage
```

### 2. Testes de Integração (Supertest)

```bash
pnpm test:integration
```

### 3. Testes de Carga (k6)

**Pré-requisito**: Aplicação rodando localmente

```bash
# Terminal 1: Iniciar aplicação
pnpm dev

# Terminal 2: Executar testes de carga
k6 run tests/load/basic-load.js

# Stress test
k6 run tests/load/stress-test.js
```

### 4. Testes E2E (Playwright)

```bash
# Headless mode
pnpm test:e2e

# UI mode (debug)
pnpm test:e2e:ui

# Com relatório
pnpm test:e2e:report
```

## 📊 Coverage

**Thresholds mínimos:**

- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

**Ver relatório:**

```bash
pnpm test:coverage
# Abre: coverage/index.html
```

## 🔧 Configuração

### Vitest Config

Ver: `vite.config.test.ts`

```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  coverage: {
    provider: 'v8',
    thresholds: { global: { lines: 85 } }
  }
}
```

### k6 Config

Ver: `tests/load/basic-load.js`

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};
```

## 🚀 CI/CD

Testes são executados automaticamente no GitHub Actions:

1. **Lint & Format**
2. **Unit Tests** (85% coverage)
3. **Integration Tests**
4. **E2E Tests** (Playwright)
5. **Build Validation**

Ver: `.github/workflows/ci.yml`

## 📖 Documentação Completa

- [08 - Testing Strategy](../docs/08_TESTING_STRATEGY.md)
- [11 - Contributing](../docs/11_CONTRIBUTING.md)

## 🐛 Troubleshooting

**Erro: k6 não encontrado**

```bash
sudo dnf install k6 -y
```

**Erro: Supertest não instalado**

```bash
pnpm add -D supertest
```

**Coverage baixo**

```bash
pnpm test:coverage
# Abra coverage/index.html e verifique arquivos não testados
```

**Testes E2E falhando**

```bash
# Instalar navegadores
pnpm exec playwright install

# Debug mode
pnpm test:e2e:debug
```
