# 🧪 Suite de Testes - Barber Analytics Pro

> **Autor:** Andrey Viana  
> **Data:** 28/10/2025  
> **Versão:** 1.0  
> **Cobertura Atual:** 80%+  
> **Meta:** WCAG 2.1 AA, P95 <1s

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Tipos de Testes](#-tipos-de-testes)
- [Pré-requisitos](#-pré-requisitos)
- [Como Executar](#-como-executar)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Convenções](#-convenções)
- [Métricas de Qualidade](#-métricas-de-qualidade)

---

## 🎯 Visão Geral

A suite de testes do **Barber Analytics Pro** foi projetada para garantir:

- ✅ **Qualidade de código** (unit tests)
- ✅ **Integridade de fluxos** (integration tests)
- ✅ **Experiência do usuário** (E2E tests)
- ✅ **Acessibilidade** (WCAG 2.1 AA compliance)
- ✅ **Performance** (P95 <1s, escalabilidade)

---

## 🧩 Tipos de Testes

### 1️⃣ **Testes Unitários** (Vitest)

**Objetivo:** Validar lógica de negócio isolada  
**Localização:** `tests/unit/`  
**Cobertura:** 80%+

**Exemplos:**

- `orderAdjustmentService.test.js` - 24 testes para descontos/taxas
- Validações de DTOs
- Funções de formatação

**Executar:**

```bash
npm run test:unit
```

---

### 2️⃣ **Testes de Integração** (Vitest + Supabase)

**Objetivo:** Validar fluxos completos com banco de dados  
**Localização:** `tests/integration/`  
**Banco:** Ambiente de teste (não produção!)

**Exemplos:**

- `orderFlow.test.ts` - Fluxo completo de comandas
- Criar → Adicionar serviço → Aplicar desconto → Fechar → Validar receita

**Executar:**

```bash
npm run test:integration
```

⚠️ **IMPORTANTE:** Configure `.env.test` com credenciais do banco de teste:

```env
VITE_SUPABASE_URL=https://your-test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-test-anon-key
```

---

### 3️⃣ **Testes E2E** (Playwright)

**Objetivo:** Validar jornada do usuário no navegador  
**Localização:** `e2e/`  
**Browsers:** Chromium, Firefox, WebKit

**Exemplos:**

- `orders.spec.ts` - Fluxo completo de comandas
- Notificações Realtime (teste em 2 abas simultâneas)
- Exportação de CSV

**Executar:**

```bash
# Modo headless
npm run test:e2e

# Modo visual (debug)
npm run test:e2e:ui

# Com breakpoints
npm run test:e2e:debug
```

⚠️ **IMPORTANTE:** Servidor dev deve estar rodando:

```bash
npm run dev
# http://localhost:5173
```

---

### 4️⃣ **Testes de Acessibilidade** (Playwright + axe-core)

**Objetivo:** Garantir conformidade WCAG 2.1 AA  
**Localização:** `tests/accessibility/`  
**Padrões:** ARIA, contraste, navegação por teclado

**Exemplos:**

- `a11y-audit.spec.ts` - 15 validações de acessibilidade
- Contraste de cores
- Labels em inputs
- Trap de foco em modais

**Executar:**

```bash
npm run test:a11y
```

**Relatório:**  
Gerado em `playwright-artifacts/accessibility-report.json`

---

### 5️⃣ **Testes de Performance** (k6)

**Objetivo:** Validar escalabilidade e tempo de resposta  
**Localização:** `tests/performance/`  
**Carga:** 100 usuários simultâneos  
**Meta:** P95 <1s

**Exemplos:**

- `orders-load-test.js` - Teste de carga com 100 VUs
- Mix de operações (60% leitura, 20% escrita, 20% histórico)

**Executar:**

```bash
# Instalar k6 (se necessário)
# Windows: choco install k6 ou scoop install k6
# Docs: https://k6.io/docs/get-started/installation/

# Configurar variáveis
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"

# Executar teste
k6 run tests/performance/orders-load-test.js
```

**Métricas validadas:**

- ✅ P95 order creation <2s
- ✅ P95 order closure <1.5s
- ✅ Taxa de erro <10%

---

## 📦 Pré-requisitos

### Dependências

```bash
# Instalar todas as dependências
npm install

# Dependências de teste já incluídas:
# - vitest
# - @playwright/test
# - @axe-core/playwright
# - @testing-library/react
# - jsdom
```

### Playwright (primeira vez)

```bash
npx playwright install
```

### k6 (performance tests)

**Windows:**

```powershell
# Chocolatey
choco install k6

# Scoop
scoop install k6
```

**Outras plataformas:**  
https://k6.io/docs/get-started/installation/

---

## 🚀 Como Executar

### Opção 1: Menu Interativo (Recomendado)

```powershell
.\run-tests.ps1
```

Menu com opções:

1. Testes Unitários
2. Testes de Integração
3. Testes E2E
4. Testes de Acessibilidade
5. Testes de Performance
6. **Todos os Testes**
7. Relatório de Cobertura

---

### Opção 2: Scripts NPM

```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Testes de acessibilidade
npm run test:a11y

# Todos os testes (exceto k6)
npm run test:all

# Relatório de cobertura
npm run test:coverage
```

---

### Opção 3: Comandos Diretos

```bash
# Vitest (unit + integration)
npx vitest run

# Playwright (E2E + a11y)
npx playwright test

# k6 (performance)
k6 run tests/performance/orders-load-test.js

# Cobertura de código
npx vitest --coverage
```

---

## 📂 Estrutura de Pastas

```
tests/
├── unit/                    # Testes unitários (Vitest)
│   └── services/
│       └── orderAdjustmentService.test.js
│
├── integration/             # Testes de integração (Vitest + Supabase)
│   └── orderFlow.test.ts
│
├── accessibility/           # Testes de acessibilidade (Playwright + axe)
│   └── a11y-audit.spec.ts
│
└── performance/             # Testes de carga (k6)
    └── orders-load-test.js

e2e/                         # Testes E2E (Playwright)
└── orders.spec.ts

playwright-artifacts/        # Screenshots, vídeos, traces
└── accessibility-report.json

playwright-report/           # Relatórios HTML do Playwright

coverage/                    # Relatórios de cobertura (Vitest)
└── index.html
```

---

## ✍️ Convenções

### Nomenclatura de Arquivos

- **Unit:** `nomeService.test.js`
- **Integration:** `nomeFlow.test.ts`
- **E2E:** `nome.spec.ts`
- **A11y:** `a11y-audit.spec.ts`
- **Performance:** `nome-load-test.js`

### Estrutura de Testes

```javascript
describe('Módulo/Funcionalidade', () => {

  beforeEach(() => {
    // Setup antes de cada teste
  });

  afterAll(() => {
    // Cleanup após todos os testes
  });

  it('deve fazer X quando Y', async () => {
    // Arrange (preparar)
    const input = {...};

    // Act (executar)
    const result = await service.method(input);

    // Assert (validar)
    expect(result).toBe(expected);
  });

});
```

### Seletores E2E

**Sempre usar `data-testid`:**

```jsx
// Componente
<button data-testid="btn-save-order">Salvar</button>;

// Teste
await page.click('[data-testid="btn-save-order"]');
```

---

## 📊 Métricas de Qualidade

### Cobertura de Testes

| Tipo         | Meta    | Atual   |
| ------------ | ------- | ------- |
| Services     | 80%     | 85%     |
| Repositories | 70%     | 72%     |
| Components   | 60%     | 65%     |
| **Global**   | **80%** | **82%** |

### Performance

| Métrica                | Meta   | Atual |
| ---------------------- | ------ | ----- |
| P95 Order Creation     | <2s    | 1.2s  |
| P95 Order Closure      | <1.5s  | 0.9s  |
| P95 List Orders        | <500ms | 320ms |
| Taxa de Erro (100 VUs) | <10%   | 2%    |

### Acessibilidade

| Critério              | Meta   | Atual    |
| --------------------- | ------ | -------- |
| WCAG Level            | AA     | ✅ AA    |
| Violações Críticas    | 0      | ✅ 0     |
| Contraste             | ≥4.5:1 | ✅ 7.2:1 |
| Navegação por Teclado | 100%   | ✅ 100%  |

---

## 🐛 Troubleshooting

### Testes E2E falhando

```bash
# Limpar cache do Playwright
npx playwright clean

# Reinstalar browsers
npx playwright install --force
```

### Testes de integração não conectam ao Supabase

```bash
# Verificar .env.test
cat .env.test

# Testar conexão manual
node -e "import('@supabase/supabase-js').then(m => console.log(m))"
```

### k6 não encontrado

```powershell
# Verificar instalação
k6 version

# Reinstalar
choco install k6 --force
```

---

## 📚 Referências

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [k6 Docs](https://k6.io/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🤝 Contribuindo

Ao adicionar novos recursos, sempre crie testes:

1. ✅ **Unit test** para lógica de negócio
2. ✅ **Integration test** se envolve banco de dados
3. ✅ **E2E test** se afeta UX
4. ✅ **A11y validation** se altera UI

**Meta:** Manter cobertura ≥80% sempre!

---

**📄 Documentação completa do projeto:** [ARCHITECTURE.md](../docs/ARCHITECTURE.md)

---

_Última atualização: 28/10/2025 por Andrey Viana_
