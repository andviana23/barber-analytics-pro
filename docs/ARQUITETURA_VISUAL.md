# BARBER ANALYTICS PRO - ARQUITETURA VISUAL

## 1. CAMADAS DA APLICAÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                       │
│                     (React Components)                          │
├─────────────────────────────────────────────────────────────────┤
│ Atoms (15) │ Molecules (30+) │ Organisms (18+) │ Pages (23)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA DE APLICAÇÃO                            │
│                  (Business Logic)                               │
├─────────────────────────────────────────────────────────────────┤
│ Custom Hooks (90+) │ Services (85+) │ Context (4) │ Utils       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA DE DADOS                                │
│                (Data Access Layer)                              │
├─────────────────────────────────────────────────────────────────┤
│ Repositories (19) │ DTOs │ Validações (Zod)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA DE INFRAESTRUTURA                       │
│                 (External Services)                             │
├─────────────────────────────────────────────────────────────────┤
│ Supabase │ OpenAI │ Telegram │ Vercel │ Storage                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ESTRUTURA DE PACOTES (Package Structure)

```
barber-analytics-pro/
│
├── FRONTEND (src/)
│   │
│   ├── [Presentation Layer]
│   │   ├── atoms/              - 15 componentes básicos
│   │   ├── molecules/          - 30+ componentes compostos
│   │   ├── organisms/          - 18+ seções complexas
│   │   ├── pages/              - 23 páginas
│   │   └── components/         - Componentes diversos
│   │
│   ├── [Application Layer]
│   │   ├── hooks/              - 90+ custom hooks
│   │   ├── services/           - 85+ serviços
│   │   ├── context/            - 4 contextos globais
│   │   └── utils/              - Utilitários
│   │
│   ├── [Data Layer]
│   │   ├── repositories/       - 19 repositórios
│   │   ├── dtos/               - Data Transfer Objects
│   │   └── types/              - Tipos TypeScript
│   │
│   └── [Configuration]
│       ├── styles/             - Tailwind CSS
│       └── constants/          - Constantes
│
├── BACKEND (app/api/ + lib/)
│   │
│   ├── API Routes (app/api/)
│   │   ├── cron/               - 7 cron jobs
│   │   ├── alerts/             - Alertas
│   │   ├── forecasts/          - Previsões
│   │   ├── kpis/               - KPIs
│   │   ├── reports/            - Relatórios
│   │   └── telegram/           - Webhook Telegram
│   │
│   └── Backend Libraries (lib/)
│       ├── ai/                 - Integração OpenAI
│       ├── analytics/          - ETL & Análises
│       ├── auth/               - Autenticação
│       ├── middleware/         - Middlewares
│       ├── repositories/       - Data Access Backend
│       ├── services/           - Notificações
│       └── telegram/           - Bot Telegram
│
└── DOCUMENTAÇÃO & CONFIG
    ├── docs/                   - Documentação técnica
    ├── e2e/                    - Testes E2E
    ├── tests/                  - Testes Unit/Integration
    ├── scripts/                - Scripts automação
    ├── supabase/               - Migrations + Edge Functions
    └── [Arquivos de config]
```

---

## 3. FLUXO DE DADOS (Data Flow)

### 3.1 Fluxo Frontend

```
┌─────────────────────────────────┐
│   USER INTERACTION              │
│   (click, submit, etc)          │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   PAGE COMPONENT                │
│   (React Component)             │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   CUSTOM HOOK                   │
│   (useBankAccounts, etc)        │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   SERVICE LAYER                 │
│   (bankAccountsService)         │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   REPOSITORY LAYER              │
│   (bankAccountsRepository)      │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│   SUPABASE CLIENT               │
│   (useSupabaseClient)           │
└────────────┬────────────────────┘
             │
             ↓ (RLS applied by Supabase)
┌─────────────────────────────────┐
│   DATABASE (PostgreSQL)         │
│   (row-level security)          │
└────────────┬────────────────────┘
             │
             ↓ (data returned)
         [CACHE]
             │
             ↓ (TanStack Query)
      STATE UPDATE
             │
             ↓
         RE-RENDER
```

### 3.2 Fluxo Backend (Cron/API)

```
┌──────────────────────────┐
│  VERCEL CRON JOB        │
│  (scheduled trigger)    │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  API ROUTE HANDLER      │
│  (/api/cron/etl-diario) │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  MIDDLEWARE             │
│  (auth, rate-limit)     │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  BUSINESS LOGIC         │
│  (lib/analytics/etl.ts) │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  DATA ACCESS            │
│  (Supabase Admin)       │
└────────────┬─────────────┘
             │
             ↓ (bypass RLS)
┌──────────────────────────┐
│  DATABASE               │
│  (PostgreSQL)           │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  NOTIFICATIONS          │
│  (Telegram, etc)        │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│  RESPONSE/LOGGING       │
│  (success or error)     │
└──────────────────────────┘
```

---

## 4. MÓDULOS POR DOMÍNIO

```
┌─────────────────────────────────────────────────────────────────┐
│                    BARBER ANALYTICS PRO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   FINANCEIRO    │  │   OPERACIONAL   │  │   ADMINISTRAÇÃO │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ DRE             │  │ Fila (Lista)    │  │ Profissionais   │ │
│  │ Fluxo de Caixa  │  │ Caixa Register  │  │ Unidades        │ │
│  │ Receitas        │  │ Pedidos         │  │ Permissões      │ │
│  │ Despesas        │  │ Serviços        │  │ Auditoria       │ │
│  │ Conciliação     │  │ Comissões       │  │ Relatórios      │ │
│  │ Metas           │  │ Turnos          │  │                 │ │
│  │ Saldos          │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   CADASTROS     │  │     ANÁLISE     │  │    INTEGRAÇÕES  │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ Categorias      │  │ Dashboard       │  │ OpenAI          │ │
│  │ Produtos        │  │ KPIs            │  │ Telegram        │ │
│  │ Fornecedores    │  │ Alertas         │  │ Supabase        │ │
│  │ Clientes        │  │ Previsões       │  │ Vercel Cron     │ │
│  │ Formas Pagt     │  │ Anomalias       │  │ Storage         │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. TECNOLOGIAS POR CAMADA

```
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                              │
├────────────────────────────────────────────────────────────────┤
│ React 19 → React Router 7 → TanStack Query 5                   │
│ ↓                                                              │
│ React Hook Form + Zod (Validação)                             │
│ ↓                                                              │
│ Tailwind CSS 3.4 (Styling)                                    │
│ ↓                                                              │
│ Recharts + Chart.js (Gráficos)                                │
│ ↓                                                              │
│ Framer Motion (Animações)                                     │
│ ↓                                                              │
│ Supabase JS Client (Dados)                                    │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    BACKEND STACK                               │
├────────────────────────────────────────────────────────────────┤
│ Next.js 15 App Router → TypeScript 5.9                         │
│ ↓                                                              │
│ Vercel Functions (Serverless)                                 │
│ ↓                                                              │
│ OpenAI SDK (GPT-4o)                                           │
│ ↓                                                              │
│ Supabase Admin Client (Data Access)                           │
│ ↓                                                              │
│ Telegram Bot API (Notifications)                              │
│ ↓                                                              │
│ Pino Logger (Logging)                                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    DATA & INFRA STACK                          │
├────────────────────────────────────────────────────────────────┤
│ Supabase (PostgreSQL + Auth + RLS + Storage)                  │
│ ↓                                                              │
│ Vercel (Hosting + Cron + Edge Functions)                      │
│ ↓                                                              │
│ PostgreSQL (Database)                                         │
│ ↓                                                              │
│ Supabase Realtime (WebSockets)                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    TESTING STACK                               │
├────────────────────────────────────────────────────────────────┤
│ Vitest (Unit + Integration) → Playwright (E2E)                │
│ ↓                                                              │
│ Testing Library (Component Testing)                           │
│ ↓                                                              │
│ k6 (Load Testing)                                             │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. FLUXO DE DESENVOLVIMENTO

```
┌──────────────────┐
│  Feature Branch  │
│  (feature/xyz)   │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────┐
│  Development                     │
│  - pnpm dev (local)              │
│  - pnpm test (unit/integration)  │
└────────┬───────────────────────┬─┘
         │                       │
         ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  Code Review     │    │  Pre-commit Hook │
│  (GitHub)        │    │  (eslint, fmt)   │
└────────┬─────────┘    └──────┬───────────┘
         │                    │
         └────────┬──────────┘
                  │
                  ↓
         ┌────────────────┐
         │  Merge to main │
         └────────┬───────┘
                  │
                  ↓
         ┌────────────────┐
         │  CI/CD Trigger │
         │  (GitHub Actns)│
         └────────┬───────┘
                  │
         ┌────────┴────────┐
         ↓                 ↓
    ┌────────┐       ┌──────────┐
    │ Tests  │       │  Lint    │
    │(vitest)│       │(eslint)  │
    └────┬───┘       └─────┬────┘
         │                 │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  Build (Vite)   │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │ Deploy (Vercel) │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │ Production Live │
         │ Cron Jobs ON    │
         └─────────────────┘
```

---

## 7. ARQUITETURA DE COMPONENTES REACT

```
┌─────────────────────────────────────────────────┐
│              APP COMPONENT                      │
│  (Root with Providers)                          │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
┌─────────┐    ┌──────────────────┐
│ Layout  │    │    Routes        │
│ (Navbar)│    │  (React Router)  │
│ Sidebar │    │                  │
└────┬────┘    └────────┬─────────┘
     │                  │
     │          ┌───────┴────────┐
     │          │                │
     ↓          ↓                ↓
   Pages    Private Routes   Public Routes
     │
     ↓
 ┌──────────────────────────┐
 │  Page Component          │
 │  (e.g., DashboardPage)   │
 └───────────┬──────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
┌──────────┐     ┌────────────┐
│ Organisms│     │  Modals    │
│ (complex)│     │            │
└─────┬────┘     └────┬───────┘
      │               │
      ↓               ↓
  ┌──────────┐   ┌──────────┐
  │ Molecules│   │ Organisms│
  │(composed)│   │(complex) │
  └─────┬────┘   └────┬─────┘
        │             │
        └──────┬──────┘
               │
               ↓
           ┌──────────┐
           │  Atoms   │
           │ (basic)  │
           └──────────┘
```

---

## 8. ESTADO GLOBAL (Context + Query)

```
┌──────────────────────────────────────────────────┐
│          CONTEXT PROVIDERS                      │
│          (src/context/)                         │
├──────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌──────────────┐            │
│  │ AuthContext │  │ ThemeContext │            │
│  │             │  │              │            │
│  │ - user      │  │ - dark mode  │            │
│  │ - roles     │  │ - language   │            │
│  └──────┬──────┘  └──────┬───────┘            │
│         │                │                    │
│  ┌──────▼──────┐  ┌──────▼────────┐          │
│  │ UnitContext │  │ ToastContext  │          │
│  │             │  │               │          │
│  │ - unit      │  │ - notifications
│  │ - permissions│ │ - toast msgs   │          │
│  └─────────────┘  └───────────────┘          │
│                                                 │
└──────────────────────────────────────────────────┘
                    │
                    ↓
        ┌─────────────────────────┐
        │  QUERY CLIENT           │
        │  (TanStack Query)       │
        ├─────────────────────────┤
        │                         │
        │ - caching               │
        │ - refetching            │
        │ - synchronization       │
        │ - background updates    │
        │                         │
        └─────────────────────────┘
```

---

## 9. SEGURANÇA (Security Layers)

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT SIDE                         │
├────────────────────────────────────────────────────────┤
│ Public Keys Only (NEXT_PUBLIC_*) ✓                     │
│ no credentials, no secrets                             │
└────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────┐
│                  SUPABASE AUTH                        │
├────────────────────────────────────────────────────────┤
│ JWT Token Validation ✓                                │
│ Session Management ✓                                  │
│ Credentials NOT exposed ✓                             │
└────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────┐
│              ROW-LEVEL SECURITY (RLS)                 │
├────────────────────────────────────────────────────────┤
│ PostgreSQL Policies ✓                                 │
│ Per-row access control ✓                              │
│ Tenant isolation ✓                                    │
└────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────┐
│              API LAYER SECURITY                       │
├────────────────────────────────────────────────────────┤
│ Rate Limiting ✓                                       │
│ Auth Middleware ✓                                     │
│ Request Validation (Zod) ✓                            │
│ CORS Headers ✓                                        │
└────────────────────────────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────┐
│           DATABASE LAYER SECURITY                     │
├────────────────────────────────────────────────────────┤
│ SQL Injection Prevention ✓                            │
│ Parameterized Queries ✓                               │
│ Data Encryption ✓                                     │
│ Audit Logging ✓                                       │
└────────────────────────────────────────────────────────┘
```

---

## 10. INTEGRAÇÃO COM SERVIÇOS EXTERNOS

```
┌────────────────────────────────────────────────┐
│         BARBER ANALYTICS PRO                   │
└────────────┬─────────────────────────────────┬─┘
             │                                 │
    ┌────────▼────────┐           ┌────────────▼────┐
    │    SUPABASE     │           │      VERCEL     │
    ├─────────────────┤           ├─────────────────┤
    │ - PostgreSQL    │           │ - Hosting       │
    │ - Auth          │           │ - Serverless    │
    │ - RLS           │           │ - Cron Jobs     │
    │ - Storage       │           │ - Analytics     │
    │ - Realtime      │           │ - CI/CD         │
    └─────────────────┘           └─────────────────┘
             │                                 │
    ┌────────▼────────┐           ┌────────────▼────┐
    │     OPENAI      │           │     TELEGRAM    │
    ├─────────────────┤           ├─────────────────┤
    │ - GPT-4o        │           │ - Bot API       │
    │ - Embeddings    │           │ - Notifications │
    │ - Completions   │           │ - Commands      │
    │ - Analysis      │           │ - Alertas       │
    └─────────────────┘           └─────────────────┘
```

---

## 11. ESTRUTURA DE PASTAS (Detalhada)

```
barber-analytics-pro/
│
├── src/
│   ├── atoms/                          # 15 componentes base
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Alert/
│   │   └── ... (10 mais)
│   │
│   ├── molecules/                      # 30+ componentes compostos
│   │   ├── BankAccountCard/
│   │   ├── CashflowChart/
│   │   ├── ProductModals/
│   │   └── ... (27 mais)
│   │
│   ├── organisms/                      # 18+ seções complexas
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   ├── ConciliacaoPanel/
│   │   └── ... (15 mais)
│   │
│   ├── pages/                          # 23 páginas
│   │   ├── DashboardPage/
│   │   ├── DREPage.jsx
│   │   ├── CommissionsPage.jsx
│   │   ├── OrdersPage.jsx
│   │   └── ... (19 mais)
│   │
│   ├── services/                       # 85+ serviços
│   │   ├── dreService.js
│   │   ├── cashflowService.js
│   │   ├── orderService.js
│   │   └── ... (82 mais)
│   │
│   ├── repositories/                   # 19 repositórios
│   │   ├── bankStatementRepository.js
│   │   ├── orderRepository.js
│   │   └── ... (17 mais)
│   │
│   ├── hooks/                          # 90+ custom hooks
│   │   ├── useDRE.js
│   │   ├── useOrders.js
│   │   └── ... (88 mais)
│   │
│   ├── context/                        # 4 contextos
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   ├── ToastContext.jsx
│   │   └── UnitContext.jsx
│   │
│   ├── utils/                          # Utilitários
│   │   ├── formatters.js
│   │   ├── permissions.js
│   │   └── ... (8 mais)
│   │
│   ├── types/                          # Tipos TypeScript
│   ├── dtos/                           # DTOs com validação Zod
│   ├── constants/                      # Constantes da app
│   ├── styles/                         # CSS/Tailwind
│   ├── App.jsx                         # Root component + Router
│   └── main.jsx                        # Entry point
│
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   ├── etl-diario/
│   │   │   ├── relatorio-semanal/
│   │   │   ├── fechamento-mensal/
│   │   │   ├── enviar-alertas/
│   │   │   ├── health-check/
│   │   │   ├── validate-balance/
│   │   │   └── gerar-despesas-recorrentes/
│   │   ├── alerts/query/
│   │   ├── forecasts/cashflow/
│   │   ├── kpis/health/
│   │   ├── reports/weekly/
│   │   └── telegram/webhook/
│   │
│   └── ia-financeira/
│       ├── saude/page.tsx
│       ├── alertas/page.tsx
│       └── fluxo/page.tsx
│
├── lib/
│   ├── ai/
│   │   ├── analysis.ts
│   │   ├── anonymization.ts
│   │   ├── openai.ts
│   │   └── prompts.ts
│   │
│   ├── analytics/
│   │   ├── anomalies.ts
│   │   ├── calculations.ts
│   │   ├── cashflowForecast.ts
│   │   ├── etl.ts
│   │   └── validateBalance.ts
│   │
│   ├── auth/
│   │   └── apiAuth.ts
│   │
│   ├── middleware/
│   │   ├── cronAuth.ts
│   │   └── rateLimit.ts
│   │
│   ├── repositories/
│   │   ├── aiMetricsRepository.ts
│   │   ├── alertsRepository.ts
│   │   └── kpiTargetsRepository.ts
│   │
│   ├── services/
│   │   └── recurringExpenseNotifications.ts
│   │
│   ├── telegram/
│   │   ├── commands.ts
│   │   └── telegram.ts
│   │
│   ├── cache.ts
│   ├── circuitBreaker.ts
│   ├── idempotency.ts
│   ├── logger.ts
│   ├── monitoring.ts
│   ├── parallelProcessing.ts
│   ├── retry.ts
│   ├── supabaseAdmin.ts
│   └── telegram.ts
│
├── docs/                              # Documentação técnica
│   ├── 00_OVERVIEW.md
│   ├── 01_REQUIREMENTS.md
│   ├── 02_ARCHITECTURE.md
│   └── ... (9 mais)
│
├── tests/
│   ├── unit/                          # Testes unitários (Vitest)
│   ├── integration/                   # Testes integração
│   └── load/                          # Testes carga (k6)
│
├── e2e/                               # Testes E2E (Playwright)
│   ├── auth.spec.ts
│   ├── financial-flow.spec.ts
│   └── ... (8 mais)
│
├── supabase/
│   ├── functions/
│   │   ├── calculate-order-totals/
│   │   └── monthly-reset/
│   │
│   └── migrations/
│       └── [SQL migration files]
│
├── scripts/
│   ├── audit-design-system.js
│   ├── validate-apis.ts
│   └── ... (9 mais)
│
└── [Config files]
    ├── package.json
    ├── vite.config.js
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── vercel.json
    ├── eslint.config.js
    ├── playwright.config.ts
    └── ... (mais)
```

---

## RESUMO VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           BARBER ANALYTICS PRO ARCHITECTURE                │
│                                                             │
│  500+ Components, Hooks & Services                          │
│  Organized in 7 Clean Architecture Layers                  │
│  Full-stack TypeScript (Frontend + Backend)                │
│  100% Secure with RLS + JWT                                │
│  Auto-scaling on Vercel Serverless                         │
│  Real-time sync via Supabase Realtime                      │
│  AI-powered insights (OpenAI GPT-4o)                       │
│  Comprehensive test suite (Unit + E2E)                     │
│                                                             │
│  Modern, Scalable, Production-Ready                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

