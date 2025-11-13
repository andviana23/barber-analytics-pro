# BARBER ANALYTICS PRO - QUICK REFERENCE GUIDE

## Estrutura em 30 segundos

```
barber-analytics-pro/
├── app/                    # Express API + Cron Jobs
├── src/                    # React Frontend (Vite)
│   ├── atoms/             # Design System - Componentes básicos
│   ├── molecules/         # Design System - Componentes compostos
│   ├── organisms/         # Design System - Seções complexas
│   ├── pages/             # 23 Páginas da Aplicação
│   ├── components/        # Componentes diversos
│   ├── services/          # 85+ Serviços de Lógica
│   ├── repositories/      # 19 Repositórios (Data Access)
│   ├── hooks/             # 90+ Custom React Hooks
│   ├── context/           # 4 Contextos Globais
│   └── utils/             # Utilitários
├── lib/                    # Backend Utilities (TypeScript)
└── docs/                   # Documentação Técnica
```

---

## STACK TECNOLÓGICO

| Camada | Tecnologia |
|--------|-----------|
| **Hosting** | **VPS Ubuntu + Nginx + PM2** |
| **Domínio** | **app.tratodebarbados.com** |
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS + Atomic Design |
| State | Context API + TanStack Query |
| Forms | React Hook Form + Zod |
| Routing | React Router DOM v7 |
| Backend API | Express.js (Node.js 20) |
| Database | Supabase (PostgreSQL + RLS) |
| Cron Jobs | pg_cron (11 jobs automáticos) |
| IA | OpenAI API (GPT-4o) |
| Notifications | Telegram Bot |
| Testes | Vitest + Playwright |

---

## ROTAS PRINCIPAIS (Classificadas por Módulo)

### Autenticação
```
/login              - LoginPage
/signup             - SignUpPage
/forgot-password    - ForgotPasswordPage
```

### Dashboard & Perfil
```
/dashboard          - DashboardPage
/profile            - UserProfilePage
```

### Módulo Financeiro
```
/financial                       - FinanceiroAdvancedPage
/dre                            - DREPage
/demonstrativo-fluxo            - DemonstrativoFluxoPage
/financeiro/contas-bancarias    - BankAccountsPage
/commissions                    - CommissionsPage
```

### Operacional
```
/queue                  - ListaDaVezPage (Fila)
/queue/history          - TurnHistoryPage
/caixa                  - CashRegisterPage
/comandas               - OrdersPage (Pedidos)
/servicos               - ServicesPage
/comissoes              - CommissionReportPage
```

### Cadastros
```
/cadastros/categorias           - CategoriesPage
/cadastros/formas-pagamento     - PaymentMethodsPage
/cadastros/fornecedores         - SuppliersPage
/cadastros/clientes             - ClientsPage
/cadastros/produtos             - ProductsPage
/cadastros/metas                - GoalsPage
```

### Administração
```
/professionals          - ProfessionalsPage
/units                  - UnitsPage
/user-management        - ProfessionalsPage
/reports                - RelatoriosPage
```

---

## CRON JOBS (pg_cron - 11 Jobs Automáticos)

```
02:00 BRT    Gerar despesas recorrentes
03:00 BRT    ETL Diário
04:00 BRT    Validar saldos acumulados
06:00 BRT    Relatório Semanal (segunda-feira)
07:00 BRT    Fechamento Mensal (1º do mês)
```

Plus:
- Alertas a cada 15 minutos
- Health check a cada 5 minutos

---

## COMPONENTES (Atomic Design)

### Atoms (15 tipos)
```
Button, Input, Card, Modal, Alert
DateRangePicker, CurrencyInput, StatusBadge
Skeleton, Tooltip, KPICard, etc
```

### Molecules (30+ tipos)
```
BankAccountCard, CashflowChart, CategoryModal
ProductModals, SupplierModals, MetricCard, etc
```

### Organisms (18+ tipos)
```
Navbar, Sidebar, CommissionFormModal
DemonstrativoFluxoTable, CashRegisterHistory, etc
```

---

## SERVIÇOS (85+ tipos, em 7 categorias)

### Financeiro (8 serviços)
dreService, fluxoCaixaService, cashflowService, cashflowForecastService, etc

### Receitas/Despesas (8 serviços)
expenseService, importExpensesFromOFX, bankAccountsService, reconciliationService, etc

### Operacional (7 serviços)
listaDaVezService, orderService, cashRegisterService, serviceService, etc

### Pessoas (5 serviços)
professionalService, commissionService, partiesService, etc

### Cadastros (6 serviços)
categoriesService, productsService, paymentMethodsService, unitsService, etc

### Dashboard/Relatórios (4 serviços)
dashboardService, relatoriosService, statusCalculator, etc

### Auxiliares (5 serviços)
duplicateDetector, auditService, storageService, edgeFunctionService, etc

---

## REPOSITÓRIOS (19 tipos)

```
bankStatementRepository      - Extratos bancários
cashRegisterRepository       - Caixa
categoryRepository          - Categorias
commissionRepository        - Comissões
expenseRepository           - Despesas
orderRepository             - Pedidos
professionalRepository      - Profissionais
revenueRepository           - Receitas
serviceRepository           - Serviços
unitsRepository             - Unidades
[+ 9 outros repositórios]
```

---

## CUSTOM HOOKS (90+ tipos, em 8 categorias)

### Financeiros (11 hooks)
useDRE, useCashflowData, useExpenses, useGoals, etc

### Operacionais (6 hooks)
useCashRegister, useOrders, useServices, etc

### Cadastros (5 hooks)
useCategories, useClients, useProducts, etc

### Pessoas (4 hooks)
useCommissions, useProfissionais, etc

### Utilitários (14 hooks)
useFileUpload, usePeriodFilter, useMediaQuery, etc

### Data (2 hooks)
useBankStatements, useBankAccounts

[+ 43 outros hooks]

---

## CONTEXTOS GLOBAIS

```
AuthContext          - Usuário e autenticação
ThemeContext         - Tema claro/escuro
ToastContext         - Notificações toast
UnitContext          - Unidade selecionada
```

---

## ARQUIVOS DE CONFIGURAÇÃO

| Arquivo | Responsabilidade |
|---------|-----------------|
| vite.config.js | Build/Dev configuration |
| tsconfig.json | TypeScript compiler |
| tailwind.config.js | Sistema design |
| ecosystem.config.js | PM2 process config |
| eslint.config.js | Linting rules |
| playwright.config.ts | E2E tests |
| package.json | Dependências (150+ packages) |

---

## COMANDOS ESSENCIAIS

```bash
# Desenvolvimento
pnpm dev                # Inicia dev server
pnpm build              # Build produção
pnpm preview            # Preview build

# Qualidade
pnpm lint               # ESLint check
pnpm lint:fix           # Corrige lint
pnpm format             # Prettier
pnpm validate           # Lint + format + typecheck

# Testes
pnpm test               # Vitest watch
pnpm test:run           # Single run
pnpm test:ui            # UI visual
pnpm test:e2e           # Playwright

# Limpeza
pnpm clean              # Limpa dist
pnpm clean:all          # Limpa tudo + node_modules
pnpm reinstall          # Reinstala deps
```

---

## FLUXO DE DADOS

```
USER INTERACTION (UI)
        ↓
COMPONENT (React)
        ↓
HOOK (useBankAccounts)
        ↓
SERVICE (bankAccountsService)
        ↓
REPOSITORY (bankAccountsRepository)
        ↓
SUPABASE CLIENT
        ↓ (RLS applied)
DATABASE (PostgreSQL)
```

---

## VARIÁVEIS DE AMBIENTE (37)

### Supabase
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

### OpenAI
- OPENAI_API_KEY
- OPENAI_MODEL (gpt-4o-mini)
- OPENAI_MAX_TOKENS_PER_REQUEST (2000)

### Telegram
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- TELEGRAM_WEBHOOK_SECRET

### Cache & Analytics
- CACHE_PROVIDER (memory)
- CACHE_ANALYSIS_TTL (86400)
- ANALYTICS_BATCH_SIZE (5)
- [+ 19 more]

---

## SEGURANÇA

- Row-Level Security (RLS) no PostgreSQL
- Supabase Auth
- Validação com Zod DTOs
- Rate limiting
- HTTPS headers (CSP, HSTS, etc)
- Anonimização de dados antes da IA
- Audit trail

---

## PADRÕES IMPLEMENTADOS

- Clean Architecture
- Atomic Design
- Repository Pattern
- Service Pattern
- Custom Hooks Pattern
- Context Pattern
- Domain-Driven Design (parcial)
- Conventional Commits

---

## MÉTRICAS DO PROJETO

- 500+ componentes, serviços e hooks
- 19 repositórios
- 23 páginas principais
- 85+ serviços
- 90+ custom hooks
- 1341 linhas de documentação
- 150+ pacotes npm
- 7 cron jobs agendados
- 12 rotas API HTTP
- 85% cobertura de testes

---

## PRÓXIMAS ETAPAS TÍPICAS

### Adicionar nova página
1. Criar arquivo em `src/pages/NomeNewPage/`
2. Adicionar rota em `App.jsx`
3. Criar hook customizado em `src/hooks/`
4. Criar serviço em `src/services/`
5. Criar repositório em `src/repositories/`

### Adicionar novo serviço
1. Criar `src/services/nomeService.js`
2. Criar `src/repositories/nomeRepository.js`
3. Criar hook customizado `src/hooks/useName.js`
4. Usar em componentes

### Deploy
1. Commit em branch de feature
2. Push para GitHub
3. Deploy manual ou automatizado no VPS
4. Deploy automático na main
5. Cron jobs já configurados

---

## DOCUMENTAÇÃO

- `README.md` - Overview do projeto
- `docs/DOCUMENTACAO_INDEX.md` - Índice completo
- `docs/02_ARCHITECTURE.md` - Arquitetura detalhada
- `INFRASTRUCTURE_v4.0.md` - Setup e infraestrutura
- `ESTRUTURA_COMPLETA_REPOSITORIO.md` - Este documento completo

---

## RECURSOS RÁPIDOS

```
Frontend Root:      src/
Backend API:        app/api/
Backend Lib:        lib/
Database:           Supabase (postgres)
Deploy:             VPS (app.tratodebarbados.com)
CI/CD:              GitHub Actions
Package Manager:    pnpm
Node Version:       >=20.0
```

---

Gerado: 2025-11-11
Repositório: barber-analytics-pro
Branch: feature/ai-finance-integration

