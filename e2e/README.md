# 📁 Estrutura de Testes E2E

Este diretório contém os testes end-to-end do Barber Analytics Pro usando Playwright.

## 📂 Estrutura

```
e2e/
├── auth/           # Testes de autenticação
├── orders/         # Testes de comandas
├── cashRegister/   # Testes de caixa
├── clients/        # Testes de clientes
├── services/       # Testes de serviços
├── professionals/  # Testes de profissionais
├── reports/        # Testes de relatórios
└── fixtures/       # Dados de teste compartilhados
```

## 🎯 Prioridades

- **P0 (Crítico):** Login, Comandas, Caixa
- **P1 (Alto):** Cadastros, Relatórios
- **P2 (Médio):** Filtros, Edições
- **P3 (Baixo):** UI/UX

## 🚀 Executar Testes

```bash
# Todos os testes
npm run test:e2e

# Teste específico
npx playwright test e2e/orders/create-order.spec.ts

# Modo debug
npx playwright test --debug

# UI mode
npx playwright test --ui
```

## 📖 Documentação

Veja o guia completo em `docs/PLAYWRIGHT_GUIDE.md`
