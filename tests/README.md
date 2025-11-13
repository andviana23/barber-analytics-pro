# 🧪 Testes - Barber Analytics Pro

**Versão:** 2.0.0 (VPS)
**Última atualização:** 12 de novembro de 2025

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

**⚠️ IMPORTANTE:** Use `npm` como gerenciador de pacotes (padrão do projeto)

```bash
# Testes Unitários
npm test                    # Watch mode
npm run test:run            # Run once
npm run test:unit           # Apenas unitários
npm run test:coverage       # Com coverage

# Testes de Integração
npm run test:integration    # API/Repository tests

# Testes E2E
npm run test:e2e            # Playwright
npm run test:e2e:ui         # Playwright UI mode

# Testes de Carga (k6)
npm run test:load           # Basic load test
npm run test:stress         # Stress test

# Validação Completa
npm run test:all            # Unit + Integration + E2E
npm run validate            # Lint + Format + TypeCheck
```

## 🎯 Executar Testes

### 1. Testes Unitários (Vitest)

```bash
# Watch mode (desenvolvimento)
npm run test

# Run once (CI/CD)
npm run test:run

# Com coverage
npm run test:coverage
```

### 2. Testes de Integração (Supertest)

```bash
npm run test:integration
```

### 3. Testes de Carga (k6)

**Pré-requisito**: Aplicação rodando localmente

```bash
# Terminal 1: Iniciar aplicação
npm run dev

# Terminal 2: Executar testes de carga
k6 run tests/load/basic-load.js

# Stress test
k6 run tests/load/stress-test.js
```

### 4. Testes E2E (Playwright)

```bash
# Headless mode
npm run test:e2e

# UI mode (debug)
npm run test:e2e:ui

# Com relatório
npm run test:e2e:report
```

## 📊 Coverage

**Thresholds mínimos:**

- Branches: 85%
- Functions: 85%
- Lines: 85%
- Statements: 85%

**Ver relatório:**

```bash
npm run test:coverage
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
npm install -D supertest
```

**Coverage baixo**

```bash
npm run test:coverage
# Abra coverage/index.html e verifique arquivos não testados
```

**Testes E2E falhando**

```bash
# Instalar navegadores
npx playwright install

# Debug mode
npm run test:e2e:debug
```
