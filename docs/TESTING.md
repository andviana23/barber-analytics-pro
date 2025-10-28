# 🧪 Estratégia de Testes

> **Plano consolidado para cobrir unidade, integração e E2E no Barber Analytics Pro.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Objetivo

Garantir qualidade contínua nos módulos Financeiro, DRE, Conciliação e Lista da Vez através de três camadas de testes automatizados: **Unit**, **Integration** e **End-to-End**.

---

## 🛠️ Toolchain

- ✅ **Unit / Integration:** Vitest (`vitest`, `@testing-library/react`, `jsdom`).
- ✅ **End-to-End:** Playwright (`@playwright/test`).

### Comandos úteis

```
npm run test          # modo interativo Vitest
npm run test:run      # execução única (CI/local)
npm run test:coverage # relatório de cobertura
npm run test:ui       # UI do Vitest
npx playwright test   # suíte E2E (Playwright)
```

---

## 🧱 Estrutura Recomendada

- 📁 Testes próximos ao código-fonte ou em `src/__tests__/`.
- 📄 Arquivo existente: `src/__tests__/financial-basics.spec.ts`.
- ⚙️ Setup opcional: `src/test/setup.ts` (polyfills, mocks globais).

---

## 🔍 Escopo por Camada

### 1. DTOs (`src/dtos/*`)

- [✅] Validar whitelists/blacklists e mensagens Zod.
- [✅] Garantir normalização de status e valores padrão.

### 2. Services (`src/services/*`)

- [✅] Mockar `repositories`/Supabase para isolar regras de negócio.
- [⚠️] Expandir cobertura para criação de receitas/despesas, agregações (DRE, fluxo de caixa) e conciliação.

### 3. Hooks & UI (`src/hooks/*`, `src/components/*`)

- [⚠️] Cobrir renderização, estados de loading/erro e integração com contextos (Auth, Theme, Unit, Toast) usando Testing Library.

### 4. E2E (Playwright)

- [✅] `npx playwright install` executado.
- [✅] `playwright.config.ts` criado + pasta `e2e/` com suites base.
- [✅] Cenários mapeados: login, fluxo financeiro, conciliação e Lista da Vez (marcados como `skip` até captura de seletores reais).

---

## 📌 Próximos Passos

1. Popular fixtures de dados para destravar implementação real dos testes E2E.
2. Integrar Playwright e Vitest ao pipeline de CI (GitHub Actions).
3. Adicionar mocks de Supabase Auth/Realtime para cenários offline e testes de hooks.
