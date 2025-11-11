# ESTRUTURA COMPLETA DO REPOSITÓRIO - Barber Analytics Pro

Documento gerado em: 2025-11-11
Repositório: `/home/andrey/projetos/barber-analytics-pro`
Branch atual: `feature/ai-finance-integration`

---

## 1. VISÃO GERAL DO PROJETO

### Stack Principal
- **Frontend**: React 19 + TypeScript + Vite
- **Roteamento**: React Router DOM v7
- **Styling**: Tailwind CSS 3.4 + Design System Atômico
- **Estado**: React Context + TanStack Query 5 + React Hook Form
- **Backend API**: Next.js 15 (app/api) + Vercel Serverless
- **Banco de Dados**: Supabase (PostgreSQL) + RLS
- **IA**: OpenAI API (GPT-4o-mini)
- **Notificações**: Telegram Bot API
- **Testes**: Vitest + Playwright
- **Build/Deploy**: Vite + Vercel

### Características Principais
- Gestão financeira completa (DRE, Fluxo de Caixa, Despesas/Receitas)
- Sistema de fila inteligente (Lista da Vez)
- Conciliação bancária automática
- Multi-unidade com permissões RLS
- Relatórios com IA integrada
- Dashboard em tempo real

---

## 2. ESTRUTURA DE DIRETÓRIOS COMPLETA

```
barber-analytics-pro/
│
├── app/                          # Next.js App Router + APIs Serverless
│   ├── api/                      # Rotas API HTTP
│   │   ├── cron/                 # Cron jobs agendados (Vercel)
│   │   │   ├── etl-diario/       # ETL diário (03:00 BRT)
│   │   │   ├── relatorio-semanal/# Relatório semanal (seg 06:00)
│   │   │   ├── fechamento-mensal/# Fechamento mensal (1º às 07:00)
│   │   │   ├── enviar-alertas/   # Alertas a cada 15 min
│   │   │   ├── health-check/     # Health check a cada 5 min
│   │   │   ├── validate-balance/ # Validação de saldo (04:00)
│   │   │   └── gerar-despesas-recorrentes/ # Despesas recorrentes (02:00)
│   │   ├── alerts/
│   │   │   └── query/            # Consulta alertas
│   │   ├── forecasts/
│   │   │   └── cashflow/         # Previsão de fluxo de caixa
│   │   ├── kpis/
│   │   │   └── health/           # Health check de KPIs
│   │   ├── reports/
│   │   │   └── weekly/           # Relatório semanal
│   │   └── telegram/
│   │       └── webhook/          # Webhook Telegram
│   │
│   └── ia-financeira/            # Páginas da IA Financeira (Next.js Pages)
│       ├── saude/page.tsx        # Dashboard de saúde financeira
│       ├── alertas/page.tsx      # Página de alertas
│       └── fluxo/page.tsx        # Página de previsão de fluxo
│
├── src/                          # Aplicação React Frontend (Vite)
│   │
│   ├── main.jsx                  # Entry point React (Vite)
│   ├── App.jsx                   # Root component + Router
│   │
│   ├── atoms/                    # Design System - Componentes Básicos
│   │   ├── Alert/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── CurrencyInput.jsx
│   │   ├── DateRangePicker/
│   │   ├── EmptyState/
│   │   ├── Input/
│   │   ├── KPICard.jsx
│   │   ├── Modal/
│   │   ├── MonthYearPicker.jsx
│   │   ├── PartySelector/
│   │   ├── PeriodFilter/
│   │   ├── ProtectedButton.jsx
│   │   ├── Skeleton.jsx
│   │   ├── StatusBadge/
│   │   ├── ThemeToggle/
│   │   ├── TimeInput.jsx
│   │   ├── Tooltip/
│   │   ├── UnitSelector/
│   │   ├── ConfidenceBadge/
│   │   ├── AnimatedComponents.jsx
│   │   └── index.js
│   │
│   ├── molecules/                # Design System - Componentes Compostos
│   │   ├── BankAccountCard/
│   │   ├── CashflowForecastChart/
│   │   ├── CashflowTable/
│   │   ├── CashflowTimelineChart/
│   │   ├── CashRegisterCard.jsx
│   │   ├── CategoryModal/
│   │   ├── CategoryModals/
│   │   ├── ChartComponent/
│   │   ├── ChartContainer.jsx
│   │   ├── DemonstrativoFluxoFilters/
│   │   ├── DemonstrativoFluxoSummary/
│   │   ├── DiscountModal.jsx
│   │   ├── FluxoCaixaFilters.jsx
│   │   ├── FluxoCaixaKPIs.jsx
│   │   ├── FluxoCaixaTimeline.jsx
│   │   ├── KPICard/
│   │   ├── MetricCard.jsx
│   │   ├── NovaFormaPagamentoModal/
│   │   ├── OrderListItem.jsx
│   │   ├── PieChartCard/
│   │   ├── ProductModals/
│   │   │   ├── CreateProductModal.jsx
│   │   │   ├── EditProductModal.jsx
│   │   │   └── StockMovementModal.jsx
│   │   ├── ServiceCard.jsx
│   │   ├── ServiceSelector.jsx
│   │   ├── SupplierModals/
│   │   │   ├── CreateSupplierModal.jsx
│   │   │   ├── CreateSupplierModalRefactored.jsx
│   │   │   ├── EditSupplierModal.jsx
│   │   │   └── SupplierInfoModal.jsx
│   │   └── [mais componentes...]
│   │
│   ├── organisms/                # Design System - Seções Complexas
│   │   ├── BarbeiroBottomNav/
│   │   ├── BarbeiroHeader/
│   │   ├── BarbeiroStatsCard/
│   │   ├── BankAccountModals/
│   │   │   ├── CreateBankAccountModal.jsx
│   │   │   ├── DeleteBankAccountModal.jsx
│   │   │   ├── EditBankAccountModal.jsx
│   │   │   └── EditInitialBalanceModal.jsx
│   │   ├── CashRegisterHistory.jsx
│   │   ├── CashRegisterHeader.jsx
│   │   ├── CashReportPanel.jsx
│   │   ├── CommissionFormModal.jsx
│   │   ├── CommissionSummaryCard.jsx
│   │   ├── ConciliacaoPanel/
│   │   │   ├── AutoMatchStep/
│   │   │   └── ConciliacaoPanel.jsx
│   │   ├── DashboardDemo/
│   │   ├── DemonstrativoFluxoTable/
│   │   ├── EditInitialBalanceModal/
│   │   ├── FinancialSeparationCard.jsx
│   │   ├── MainContainer/
│   │   ├── Navbar/
│   │   ├── OrderItemsTable.jsx
│   │   ├── OrdersTable.jsx
│   │   ├── PalettePreview/
│   │   ├── ServicesTable.jsx
│   │   └── Sidebar/
│   │
│   ├── templates/                # Templates de Layout
│   │   ├── modals/
│   │   │   ├── CloseCashModal.jsx
│   │   │   ├── OrderModal.jsx
│   │   │   └── OrderPaymentModal.jsx
│   │   └── [mais templates...]
│   │
│   ├── components/               # Componentes Avulsos (não segue Atomic Design)
│   │   ├── Layout/
│   │   ├── ProtectedRoute/
│   │   ├── AuthDiagnostic/
│   │   ├── AuthDebugger/
│   │   ├── PermissionsTest/
│   │   ├── ThemeValidator/
│   │   ├── LoadingComponents/
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── modals/
│   │   ├── finance/
│   │   │   ├── DREDynamicView.jsx
│   │   │   ├── ImportExpensesFromOFX*.jsx
│   │   │   ├── ImportRevenuesFromStatement*.jsx
│   │   │   └── MetasCard.jsx
│   │   └── __tests__/
│   │       └── KPICard.spec.tsx
│   │
│   ├── pages/                    # Páginas da Aplicação (Rotas)
│   │   ├── AtomsDemo.jsx
│   │   ├── BankAccountsPage/
│   │   ├── BarbeiroPortal/
│   │   ├── CashRegisterPage.jsx
│   │   ├── CashflowForecastPage.jsx
│   │   ├── CategoriesPage/
│   │   ├── ClientsPage/
│   │   ├── CommissionReportPage.jsx
│   │   ├── CommissionsPage.jsx         # Gestão de comissões
│   │   ├── ConciliacaoPage/            # Conciliação bancária
│   │   ├── DashboardPage/
│   │   ├── DebugAuthPage.jsx
│   │   ├── DemonstrativoFluxoPage.jsx  # Demonstrativo fluxo acumulado
│   │   ├── DREPage.jsx
│   │   ├── FinanceiroAdvancedPage/
│   │   ├── FluxoCaixaPage.jsx
│   │   ├── ForgotPasswordPage/
│   │   ├── GoalsPage/
│   │   ├── ListaDaVezPage/             # Fila de atendimento
│   │   ├── LoginPage/
│   │   ├── OrderHistoryPage.jsx
│   │   ├── OrdersPage.jsx              # Comandas
│   │   ├── PaymentMethodsPage/
│   │   ├── ProductsPage/
│   │   ├── ProfessionalsPage/
│   │   ├── RelatoriosPage/
│   │   ├── ServicesPage.jsx            # Serviços
│   │   ├── SignUpPage/
│   │   ├── SuppliersPage/
│   │   ├── TurnHistoryPage/
│   │   ├── UnitsPage/
│   │   ├── UserManagementPage/
│   │   ├── UserProfilePage/
│   │   ├── index.js
│   │
│   ├── services/                 # Lógica de Negócio (85 arquivos)
│   │   ├── auditService.js
│   │   ├── autoCategorization.js
│   │   ├── balanceAdjustmentService.js
│   │   ├── bankAccountsService.js
│   │   ├── bankFileParser.js      # Parser OFX/CSV
│   │   ├── bankStatementsService.js
│   │   ├── cashRegisterService.js
│   │   ├── cashflowForecastService.js
│   │   ├── cashflowService.js
│   │   ├── categoriesService.js
│   │   ├── commissionService.js
│   │   ├── dashboardService.js
│   │   ├── demonstrativoFluxoService.js
│   │   ├── dreService.js           # DRE (Demonstração de Resultado)
│   │   ├── duplicateDetector.js
│   │   ├── edgeFunctionService.js
│   │   ├── expenseService.js
│   │   ├── filaService.js
│   │   ├── financeiroService.js
│   │   ├── fluxoCaixaService.js
│   │   ├── fluxoExportService.js
│   │   ├── goalsService.js
│   │   ├── importExpensesFromOFX.js
│   │   ├── importRevenueFromStatement.js
│   │   ├── listaDaVezService.js
│   │   ├── orderAdjustmentService.js
│   │   ├── orderService.js
│   │   ├── partiesService.js
│   │   ├── paymentMethodsService.js
│   │   ├── productsService.js
│   │   ├── professionalCommissionService.js
│   │   ├── professionalService.js
│   │   ├── profissionaisService.js
│   │   ├── reconciliationService.js
│   │   ├── relatoriosService.js
│   │   ├── serviceService.js
│   │   ├── statusCalculator.js
│   │   ├── storageService.js
│   │   ├── supabase.js
│   │   ├── turnHistoryService.js
│   │   ├── unitsService.js
│   │   └── [mais 40+ serviços...]
│   │
│   ├── repositories/             # Data Access Layer (35 arquivos)
│   │   ├── bankStatementRepository.js
│   │   ├── cashRegisterRepository.js
│   │   ├── categoryRepository.js
│   │   ├── commissionRepository.js
│   │   ├── demonstrativoFluxoRepository.js
│   │   ├── expenseAttachmentRepository.js
│   │   ├── expenseRepository.js
│   │   ├── fluxoCaixaRepository.js
│   │   ├── listaDaVezRepository.js
│   │   ├── orderRepository.js
│   │   ├── partiesRepository.js
│   │   ├── paymentMethodsRepository.js
│   │   ├── professionalRepository.js
│   │   ├── relatoriosRepository.js
│   │   ├── revenueAttachmentRepository.js
│   │   ├── revenueRepository.js
│   │   ├── serviceRepository.js
│   │   ├── turnHistoryRepository.js
│   │   ├── unitsRepository.js
│   │   └── [mais repositórios...]
│   │
│   ├── hooks/                    # Custom React Hooks (90+ arquivos)
│   │   ├── index.js
│   │   ├── useAudit.js
│   │   ├── useBankAccounts.js
│   │   ├── useBankStatements.js
│   │   ├── useCashRegister.js
│   │   ├── useCashflowData.js
│   │   ├── useCashflowForecast.js
│   │   ├── useCashflowTable.js
│   │   ├── useCashflowTimeline.js
│   │   ├── useCategories.js
│   │   ├── useClients.js
│   │   ├── useCommissions.js
│   │   ├── useComparativos.js
│   │   ├── useDRE.js
│   │   ├── useDashboard.js
│   │   ├── useDemonstrativoFluxo.js
│   │   ├── useExpenses.js
│   │   ├── useFileUpload.js
│   │   ├── useFinancialKPIs.js
│   │   ├── useFluxoCaixa.js
│   │   ├── useGoals.js
│   │   ├── useListaDaVez.js
│   │   ├── useMediaQuery.js
│   │   ├── useOrders.js
│   │   ├── usePaymentMethods.js
│   │   ├── usePeriodFilter.js
│   │   ├── useProducts.js
│   │   ├── useUnits.js
│   │   ├── useUserPermissions.js
│   │   └── [mais 60+ hooks...]
│   │
│   ├── context/                  # Estado Global (Context API)
│   │   ├── index.js
│   │   ├── AuthContext.jsx        # Autenticação
│   │   ├── ThemeContext.jsx       # Tema claro/escuro
│   │   ├── ToastContext.jsx       # Notificações toast
│   │   └── UnitContext.jsx        # Unidade selecionada
│   │
│   ├── utils/                    # Funções Utilitárias
│   │   ├── index.js
│   │   ├── accessibility.jsx     # Acessibilidade
│   │   ├── animations.jsx        # Animações Framer Motion
│   │   ├── businessDays.js       # Cálculo dias úteis
│   │   ├── exportCommissions.js  # Export comissões
│   │   ├── exportUtils.js        # Utilitários export
│   │   ├── formatters.js         # Formatadores (data, moeda)
│   │   ├── permissions.js        # Controle de permissões
│   │   ├── performance.jsx       # Profiling
│   │   ├── secureLogger.js       # Logging seguro
│   │   └── testSupabaseConnection.js
│   │
│   ├── dtos/                     # Data Transfer Objects
│   │   └── [contratos de dados]
│   │
│   ├── constants/                # Constantes da Aplicação
│   │   └── [valores constantes]
│   │
│   ├── types/                    # Tipos TypeScript
│   │   └── [definições de tipos]
│   │
│   ├── styles/                   # Estilos CSS/Tailwind
│   │   └── index.css
│   │
│   ├── test/                     # Setup de testes
│   │   └── setup.ts
│   │
│   └── __tests__/                # Testes da aplicação
│       └── [testes]
│
├── lib/                          # Backend Utilities (TypeScript)
│   ├── ai/                       # Integração OpenAI
│   │   ├── analysis.ts
│   │   ├── anonymization.ts      # Anonimização de dados
│   │   ├── openai.ts            # Cliente OpenAI
│   │   ├── prompts.ts           # Prompts para IA
│   │   └── .structure.md
│   │
│   ├── analytics/               # Analytics & ETL
│   │   ├── anomalies.ts         # Detecção de anomalias
│   │   ├── calculations.ts      # Cálculos financeiros
│   │   ├── cashflowForecast.ts  # Previsão fluxo
│   │   ├── etl.ts               # ETL process
│   │   ├── validateBalance.ts   # Validação saldos
│   │   └── .structure.md
│   │
│   ├── auth/
│   │   └── apiAuth.ts           # Auth para APIs
│   │
│   ├── middleware/
│   │   ├── cronAuth.ts          # Auth para cron jobs
│   │   └── rateLimit.ts         # Rate limiting
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
│   │   ├── commands.ts          # Comandos Telegram
│   │   └── telegram.ts
│   │
│   ├── cache.ts                 # Sistema de cache
│   ├── circuitBreaker.ts        # Circuit breaker
│   ├── idempotency.ts           # Idempotência
│   ├── logger.ts                # Logging estruturado
│   ├── monitoring.ts            # Monitoramento
│   ├── parallelProcessing.ts    # Processamento paralelo
│   ├── retry.ts                 # Retry logic
│   ├── supabaseAdmin.ts         # Admin Supabase
│   └── telegram.ts              # Telegram Bot
│
├── hooks/                       # Hooks de backend (TypeScript)
│   └── useHealthKPIs.ts
│
├── scripts/                     # Scripts de Automação
│   ├── audit-design-system.js
│   ├── create-test-alert.ts
│   ├── get-telegram-chat-id.ts
│   ├── migrate-design-system.js
│   ├── run-etl.ts
│   ├── test-etl.sh
│   ├── test-openai.ts
│   ├── test-telegram-commands.ts
│   ├── test-telegram.ts
│   ├── validate-api-components.ts
│   ├── validate-apis.ts
│   └── validate-rls.sql
│
├── tests/                       # Testes Automatizados
│   ├── unit/                    # Testes Unitários (Vitest)
│   │   ├── calculations.test.ts
│   │   ├── formatters.test.js
│   │   ├── idempotency.test.ts
│   │   ├── margin.test.ts
│   │   └── [mais testes...]
│   │
│   ├── integration/             # Testes de Integração (Vitest)
│   │   ├── api.test.ts
│   │   ├── forecasts.test.ts
│   │   └── [mais testes...]
│   │
│   ├── load/                    # Testes de Carga (k6)
│   │   ├── basic-load.js
│   │   └── stress-test.js
│   │
│   └── setup.ts                 # Configuração de testes
│
├── e2e/                         # Testes E2E (Playwright)
│   ├── auth.spec.ts
│   ├── cash-register-flow.spec.ts
│   ├── demonstrativo-fluxo.spec.ts
│   ├── dre-flow.spec.ts
│   ├── financial-flow.spec.ts
│   ├── orders.spec.ts
│   ├── orders-flow.spec.ts
│   ├── reconciliation.spec.ts
│   ├── services-flow.spec.ts
│   └── turn-list.spec.ts
│
├── supabase/                    # Configuração Supabase
│   ├── functions/               # Edge Functions
│   │   ├── calculate-order-totals/
│   │   └── monthly-reset/
│   │
│   └── migrations/              # Migrações SQL
│       └── [arquivos .sql]
│
├── docs/                        # Documentação Técnica
│   ├── 00_OVERVIEW.md
│   ├── 01_REQUIREMENTS.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_DOMAIN_MODEL.md
│   ├── 04_MODULES/
│   │   ├── 01_FINANCIAL.md
│   │   ├── 02_PAYMENTS.md
│   │   ├── 03_CLIENTS.md
│   │   ├── 04_SCHEDULER.md
│   │   ├── 05_REPORTS.md
│   │   └── 06_NOTIFICATIONS.md
│   ├── 05_INFRASTRUCTURE.md
│   ├── 06_API_REFERENCE.md
│   ├── 07_DATA_MODEL.md
│   ├── 08_TESTING_STRATEGY.md
│   ├── 09_DEPLOYMENT_GUIDE.md
│   ├── 10_PROJECT_MANAGEMENT.md
│   ├── 11_CONTRIBUTING.md
│   ├── 12_CHANGELOG.md
│   ├── DESIGN_SYSTEM.md
│   ├── SUMMARY.md
│   └── guides/
│       ├── CODE_CONVENTIONS.md
│       ├── FAQ.md
│       └── PERMISSOES_GERENTE_ANALISE.md
│
├── components/                  # Componentes de banco
│   └── molecules/               # (duplicado em src/)
│
├── eslint-plugin-barber-design-system/  # ESLint Plugin customizado
│   └── rules/
│
├── reports/                     # Relatórios gerados
│   └── design-system-audit.json
│
├── public/                      # Assets estáticos
│   └── [imagens, fontes, etc]
│
├── dist/                        # Build output (Vite)
│   └── assets/
│
├── node_modules/                # Dependências npm/pnpm
│
├── .github/                     # GitHub Configuration
│   ├── workflows/               # CI/CD (GitHub Actions)
│   ├── copilot/
│   │   └── agents.json
│   ├── chatmodes/
│   └── copilot-instructions.md
│
├── .cursor/                     # Cursor IDE Config
│   ├── commands/                # Custom commands
│   └── rules/                   # Custom rules
│
├── .vscode/                     # VS Code Config
│   ├── extensions.json
│   ├── launch.json              # Debug config
│   ├── mcp.json
│   ├── settings.json
│   └── tasks.json
│
├── .husky/                      # Git Hooks (Husky)
│   └── _/                       # Hook scripts
│
├── .trae/                       # TRAE (Code generation)
│   └── rules/
│
├── Configuration Files
│   ├── .editorconfig
│   ├── .env                     # Env (atual)
│   ├── .env.example             # Exemplo env vars
│   ├── .env.development.example
│   ├── .eslintrc.js
│   ├── .gitignore
│   ├── .npmrc
│   ├── .nvmrc
│   ├── .prettierignore
│   ├── .prettierrc
│   ├── .cursor.json
│   ├── commitlint.config.js
│   ├── eslint.config.js
│   ├── index.html               # HTML entry point
│   ├── jsconfig.json
│   ├── package.json
│   ├── playwright.config.ts
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.cli.json        # Config CLI scripts
│   ├── tsconfig.node.json
│   ├── vercel.json              # Deploy config Vercel
│   ├── vite.config.js           # Build config Vite
│   └── vite.config.test.ts      # Test config Vite
│
└── Documentation & Files
    ├── ANALISE_*.md             # Análises e documentações
    ├── CHECKLIST_*.md
    ├── CORS_FIX_*.md/html
    ├── ETL_VS_OPENAI.md
    ├── ESCOPO_FINAL.md
    ├── FUNCIONALIDADES_PENDENTES.md
    ├── INFRASTRUCTURE_v*.md     # Documentação infraestrutura
    ├── MODULO_FINANCEIRO_STATUS.md
    ├── PRD_BARBER_ANALYTICS_PRO.md
    ├── README.md
    ├── VALIDACAO_SEGURANCA.md
    ├── dev.sh                   # Script desenvolvimento
    ├── pnpm-lock.yaml           # Lock file pnpm
    └── etl-output.log           # Logs ETL

```

---

## 3. COMPONENTES PRINCIPAIS E RESPONSABILIDADES

### 3.1 Atomic Design Pattern

#### Atoms (Componentes Básicos)
Componentes reutilizáveis e independentes:

| Componente | Arquivo | Responsabilidade |
|------------|---------|-----------------|
| Alert | Alert.jsx | Alertas e notificações |
| Button | Button/Button.jsx | Botões genéricos |
| Card | Card/Card.jsx | Containers com estilo |
| CurrencyInput | CurrencyInput.jsx | Input para valores monetários |
| DateRangePicker | DateRangePicker/DateRangePicker.jsx | Seletor de período |
| EmptyState | EmptyState/EmptyState.jsx | Estado vazio |
| Input | Input/Input.jsx | Input de texto |
| KPICard | KPICard.jsx | Card de KPI |
| Modal | Modal/Modal.jsx | Modal genérico |
| PartySelector | PartySelector/PartySelector.jsx | Seletor de parte |
| PeriodFilter | PeriodFilter/PeriodFilter.jsx | Filtro de período |
| Skeleton | Skeleton.jsx | Placeholder de carregamento |
| StatusBadge | StatusBadge/StatusBadge.jsx | Badge de status |
| ThemeToggle | ThemeToggle/ThemeToggle.jsx | Toggle tema claro/escuro |
| Tooltip | Tooltip/Tooltip.jsx | Tooltip com Radix UI |

#### Molecules (Componentes Compostos)
Combinações de atoms com lógica específica:

| Componente | Arquivo | Responsabilidade |
|------------|---------|-----------------|
| BankAccountCard | BankAccountCard/BankAccountCard.jsx | Card de conta bancária |
| CashflowForecastChart | CashflowForecastChart/ | Gráfico previsão fluxo |
| CashflowTable | CashflowTable/CashflowTable.jsx | Tabela fluxo de caixa |
| CashflowTimelineChart | CashflowTimelineChart/ | Timeline de fluxo |
| CashRegisterCard | CashRegisterCard.jsx | Card caixa |
| CategoryModal | CategoryModal/CategoryModal.jsx | Modal categoria |
| ChartComponent | ChartComponent/ChartComponent.jsx | Wrapper gráficos |
| DemonstrativoFluxoFilters | DemonstrativoFluxoFilters/ | Filtros demonstrativo |
| DemonstrativoFluxoSummary | DemonstrativoFluxoSummary/ | Resumo demonstrativo |
| FinancialSeparationDemo | FinancialSeparationDemo.jsx | Demo separação financeira |
| KPICard | KPICard/KPICard.jsx | Card com KPI |
| MetricCard | MetricCard.jsx | Card métrica |
| OrderListItem | OrderListItem.jsx | Item lista de pedidos |
| PieChartCard | PieChartCard/PieChartCard.jsx | Gráfico pizza |
| ProductModals | ProductModals/ | Modais de produtos |
| ServiceCard | ServiceCard.jsx | Card serviço |
| SupplierModals | SupplierModals/ | Modais fornecedor |

#### Organisms (Seções Complexas)
Componentes com lógica de negócio e múltiplas moléculas:

| Componente | Arquivo | Responsabilidade |
|------------|---------|-----------------|
| BankAccountModals | BankAccountModals/ | Modais conta bancária |
| CashRegisterHistory | CashRegisterHistory.jsx | Histórico caixa |
| CashRegisterHeader | CashRegisterHeader.jsx | Header caixa |
| CashReportPanel | CashReportPanel.jsx | Painel relatório caixa |
| CommissionFormModal | CommissionFormModal.jsx | Modal formulário comissão |
| CommissionSummaryCard | CommissionSummaryCard.jsx | Sumário comissões |
| ConciliacaoPanel | ConciliacaoPanel/ | Painel conciliação |
| DemonstrativoFluxoTable | DemonstrativoFluxoTable/ | Tabela demonstrativo |
| FinancialSeparationCard | FinancialSeparationCard.jsx | Card separação financeira |
| MainContainer | MainContainer/MainContainer.jsx | Container principal |
| Navbar | Navbar/Navbar.jsx | Barra navegação |
| OrderItemsTable | OrderItemsTable.jsx | Tabela itens pedido |
| OrdersTable | OrdersTable.jsx | Tabela pedidos |
| ServicesTable | ServicesTable.jsx | Tabela serviços |
| Sidebar | Sidebar/Sidebar.jsx | Barra lateral |

### 3.2 Páginas e Rotas

#### Rotas Públicas (Sem Autenticação)
```
/login                  - LoginPage
/signup                 - SignUpPage
/forgot-password        - ForgotPasswordPage
```

#### Rotas Protegidas (Com Autenticação)

**Dashboard & Core:**
```
/dashboard              - DashboardPage
/profile                - UserProfilePage
/settings               - Settings (em desenvolvimento)
```

**Módulo Financeiro:**
```
/financial              - FinanceiroAdvancedPage (Receitas, Despesas, Fluxo)
/commissions            - CommissionsPage (Gestão de comissões)
/dre                    - DREPage (Demonstração de Resultado)
/demonstrativo-fluxo    - DemonstrativoFluxoPage (Fluxo acumulado)
/financeiro/contas-bancarias - BankAccountsPage (Contas)
```

**Operacional:**
```
/queue                  - ListaDaVezPage (Fila de atendimento)
/queue/history          - TurnHistoryPage (Histórico fila)
/servicos               - ServicesPage (Catálogo de serviços)
/caixa                  - CashRegisterPage (Caixa)
/comandas               - OrdersPage (Pedidos/Comandas)
/comissoes              - CommissionReportPage (Relatório comissões)
```

**Cadastros:**
```
/cadastros/categorias           - CategoriesPage
/cadastros/formas-pagamento     - PaymentMethodsPage
/cadastros/fornecedores         - SuppliersPage
/cadastros/clientes             - ClientsPage
/cadastros/produtos             - ProductsPage
/cadastros/metas                - GoalsPage
```

**Administração:**
```
/professionals                  - ProfessionalsPage (Profissionais)
/units                          - UnitsPage (Unidades)
/user-management                - ProfessionalsPage (Gestão usuários)
/reports                        - RelatoriosPage (Relatórios)
```

**Barbeiro Portal:**
```
/barbeiro/portal                - BarbeiroPortalPage
```

**Debug:**
```
/debug/auth                     - DebugAuthPage
/unauthorized                   - UnauthorizedPage
```

### 3.3 APIs Backend (Vercel Serverless)

#### Cron Jobs (Vercel Cron)

| Rota | Schedule | Descrição |
|------|----------|-----------|
| `/api/cron/etl-diario` | 0 3 * * * | ETL diário (03:00 BRT) |
| `/api/cron/relatorio-semanal` | 0 6 * * 1 | Relatório semanal (seg 06:00) |
| `/api/cron/fechamento-mensal` | 0 7 1 * * | Fechamento mensal (1º às 07:00) |
| `/api/cron/enviar-alertas` | */15 * * * * | Envio alertas (15 min) |
| `/api/cron/health-check` | */5 * * * * | Health check (5 min) |
| `/api/cron/validate-balance` | 0 4 * * * | Validação saldo (04:00) |
| `/api/cron/gerar-despesas-recorrentes` | 0 2 * * * | Despesas recorrentes (02:00) |

#### APIs HTTP

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/alerts/query` | GET/POST | Consultar alertas |
| `/api/forecasts/cashflow` | GET/POST | Previsão fluxo de caixa |
| `/api/kpis/health` | GET | KPIs de saúde |
| `/api/reports/weekly` | GET | Relatório semanal |
| `/api/telegram/webhook` | POST | Webhook Telegram |

---

## 4. SERVIÇOS (BUSINESS LOGIC)

### 4.1 Serviços Financeiros
```
financeiro/                    # Gestão geral financeira
├── dreService.js              # DRE (Demonstração de Resultado)
├── fluxoCaixaService.js       # Fluxo de caixa básico
├── fluxoExportService.js      # Export fluxo (PDF, Excel)
├── cashflowService.js         # Fluxo avançado
├── cashflowForecastService.js # Previsão fluxo
├── demonstrativoFluxoService.js # Demonstrativo acumulado
├── financeiroService.js       # Orquestração geral
└── balanceAdjustmentService.js # Ajuste saldos
```

### 4.2 Serviços de Receitas e Despesas
```
receitas/despesas/
├── expenseService.js                  # Gestão despesas
├── importExpensesFromOFX.js           # Import OFX
├── importRevenueFromStatement.js      # Import extrato
├── bankFileParser.js                  # Parser arquivos
├── autoCategorization.js              # Categorização automática
├── bankAccountsService.js             # Contas bancárias
├── bankStatementsService.js           # Extratos bancários
└── reconciliationService.js           # Conciliação
```

### 4.3 Serviços Operacionais
```
operacional/
├── listaDaVezService.js       # Fila de atendimento
├── filaService.js             # Serviço fila
├── orderService.js            # Pedidos/Comandas
├── orderAdjustmentService.js  # Ajustes pedidos
├── serviceService.js          # Catálogo serviços
├── cashRegisterService.js     # Caixa
└── turnHistoryService.js      # Histórico turnos
```

### 4.4 Serviços de Pessoas
```
pessoas/
├── professionalService.js              # Profissionais
├── profissionaisService.js             # Profissionais (alternativo)
├── professionalCommissionService.js    # Comissões profissionais
├── commissionService.js                # Gestão comissões
└── partiesService.js                   # Partes (clientes/fornecedores)
```

### 4.5 Serviços de Cadastros
```
cadastros/
├── categoriesService.js       # Categorias
├── productsService.js         # Produtos
├── paymentMethodsService.js   # Formas pagamento
├── unitsService.js            # Unidades
├── goalsService.js            # Metas
└── suppliersService.js        # Fornecedores (via página)
```

### 4.6 Serviços de Dashboard & Relatórios
```
analytics/
├── dashboardService.js        # Dashboard executivo
├── relatoriosService.js       # Relatórios
├── statusCalculator.js        # Cálculo status
└── clientsService.js          # Dados clientes
```

### 4.7 Serviços Auxiliares
```
auxiliares/
├── duplicateDetector.js       # Detecção duplicatas
├── auditService.js            # Auditoria
├── storageService.js          # Armazenamento
├── edgeFunctionService.js     # Edge Functions
└── supabase.js                # Cliente Supabase
```

---

## 5. REPOSITÓRIOS (DATA ACCESS LAYER)

### 5.1 Estrutura de Repositórios

| Repositório | Tabela | Responsabilidade |
|-------------|--------|-----------------|
| bankStatementRepository | bank_statements | Extratos bancários |
| cashRegisterRepository | cash_registers | Registros caixa |
| categoryRepository | categories | Categorias |
| commissionRepository | commissions | Comissões |
| demonstrativoFluxoRepository | - | Demonstrativo fluxo |
| expenseAttachmentRepository | expense_attachments | Anexos despesas |
| expenseRepository | expenses | Despesas |
| fluxoCaixaRepository | cashflow | Fluxo de caixa |
| listaDaVezRepository | fila_atendimento | Fila |
| orderRepository | orders | Pedidos |
| partiesRepository | parties | Partes |
| paymentMethodsRepository | payment_methods | Formas pagamento |
| professionalRepository | professionals | Profissionais |
| relatoriosRepository | - | Relatórios |
| revenueAttachmentRepository | revenue_attachments | Anexos receitas |
| revenueRepository | revenues | Receitas |
| serviceRepository | services | Serviços |
| turnHistoryRepository | turn_history | Histórico turnos |
| unitsRepository | units | Unidades |

---

## 6. CUSTOM HOOKS (STATE MANAGEMENT)

### 6.1 Hooks Financeiros
```
useAccountBalance()         - Saldo de contas
useBankAccounts()          - Contas bancárias
useBankStatements()        - Extratos
useCashflowData()          - Dados fluxo
useCashflowForecast()      - Previsão fluxo
useCashflowTable()         - Dados tabela fluxo
useCashflowTimeline()      - Timeline fluxo
useDemonstrativoFluxo()    - Dados demonstrativo
useDRE()                   - Dados DRE
useExpenses()              - Despesas
useFinancialKPIs()         - KPIs financeiros
useFluxoCaixa()            - Fluxo (alternativo)
useGoals()                 - Metas financeiras
```

### 6.2 Hooks Operacionais
```
useCashRegister()          - Caixa
useListaDaVez()            - Fila
useOrders()                - Pedidos
useOrderNotifications()    - Notificações pedidos
useServices()              - Serviços
useTurnHistory()           - Histórico turnos
```

### 6.3 Hooks de Cadastros
```
useCategories()            - Categorias
useClients()               - Clientes
usePaymentMethods()        - Formas pagamento
useProducts()              - Produtos
useSuppliers()             - Fornecedores
useUnits()                 - Unidades
```

### 6.4 Hooks de Pessoas
```
useCommissions()           - Comissões
useProfissionais()         - Profissionais
useProfessionalCommissions() - Comissões profissionais
useRankingProfissionais()  - Ranking
```

### 6.5 Hooks Utilitários
```
useAudit()                 - Auditoria
useCategories()            - Categorias
useComparativos()          - Comparativos
useFileUpload()            - Upload arquivos
useInvalidateFluxoCaixa()  - Invalidar cache
useMediaQuery()            - Media queries
usePeriodFilter()          - Filtro período
useReconciliationMatches() - Conciliação
useRelatorios()            - Relatórios
useRelatoriosKPIs()        - KPIs relatórios
useRevenueStatusValidator()- Validação status
useUserPermissions()       - Permissões usuário
```

---

## 7. CONTEXTOS GLOBAIS (STATE)

| Contexto | Arquivo | Responsabilidade |
|----------|---------|-----------------|
| AuthContext | AuthContext.jsx | Autenticação e usuário |
| ThemeContext | ThemeContext.jsx | Tema claro/escuro |
| ToastContext | ToastContext.jsx | Notificações toast |
| UnitContext | UnitContext.jsx | Unidade selecionada |

---

## 8. UTILIDADES (UTILITIES)

| Utilidade | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| Acessibilidade | accessibility.jsx | A11y (skip links, ARIA) |
| Animações | animations.jsx | Framer Motion helpers |
| Dias Úteis | businessDays.js | Cálculo dias úteis |
| Export | exportCommissions.js | Export comissões |
| Export Utils | exportUtils.js | Utilitários export |
| Formatadores | formatters.js | Data, moeda, números |
| Permissões | permissions.js | Controle de acesso |
| Performance | performance.jsx | Profiling e métricas |
| Logging Seguro | secureLogger.js | Logs sem dados sensíveis |
| Supabase Test | testSupabaseConnection.js | Teste conexão DB |

---

## 9. CONFIGURAÇÕES DO PROJETO

### 9.1 Vite (Build/Dev)
**Arquivo:** `vite.config.js`

Principais configurações:
- **Servidor Dev**: Port 5173, host: true
- **Build Output**: dist/, source maps habilitados
- **Chunk Splitting**: vendor, charts, supabase, utils
- **Aliases**: @/, @atoms/, @molecules/, etc
- **Test**: Vitest + JSDOM
- **Coverage**: 85% threshold

### 9.2 TypeScript
**Arquivo:** `tsconfig.json`

Configurações:
- **Target**: ES2020
- **Módulo**: ESNext
- **JSX**: react-jsx
- **Strict Mode**: true
- **Path Mapping**: aliasses para cada pasta

### 9.3 Tailwind CSS
**Arquivo:** `tailwind.config.js`

Sistema de design:
- **Tema**: Claro/Escuro com custom colors
- **Paleta**: Primário, secundário, success, warning, error, etc
- **Extensões**: Custom utilities

### 9.4 Vercel Deployment
**Arquivo:** `vercel.json`

Configuração:
- **Rewrite**: Todas rotas para /index.html (SPA)
- **Variáveis**: 37 env vars configuradas
- **Cron Jobs**: 7 agendamentos
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc

### 9.5 ESLint
**Arquivo:** `eslint.config.js`

Regras:
- React recommended rules
- A11y plugins
- Custom plugin barber-design-system
- Max warnings: 0

### 9.6 Git Hooks
**Arquivo:** `.husky/`

Hooks:
- Pre-commit: lint-staged (eslint, prettier)
- Pre-push: validações

---

## 10. DEPENDÊNCIAS PRINCIPAIS

### Frontend
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.4",
  "@tanstack/react-query": "^5.90.6",
  "react-hook-form": "^7.66.0",
  "@hookform/resolvers": "^5.2.2",
  "zod": "^4.1.12",
  "tailwindcss": "^3.4.18",
  "recharts": "^3.3.0",
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.1",
  "date-fns": "^4.1.0",
  "dayjs": "^1.11.19",
  "lodash": "^4.17.21",
  "uuid": "^13.0.0",
  "clsx": "^2.1.1",
  "framer-motion": "^12.23.24",
  "@supabase/supabase-js": "^2.78.0",
  "axios": "^1.13.1",
  "lucide-react": "^0.545.0",
  "sonner": "^2.0.7",
  "react-hot-toast": "^2.6.0"
}
```

### Backend/Tools
```json
{
  "openai": "^4.67.0",
  "@types/node": "^24.10.0",
  "typescript": "^5.9.3",
  "tsx": "^4.20.6",
  "vite": "^7.1.12",
  "vitest": "^3.2.4",
  "@playwright/test": "^1.56.1",
  "pino": "^10.1.0",
  "pino-pretty": "^13.1.2",
  "class-validator": "^0.14.2",
  "class-transformer": "^0.5.1"
}
```

---

## 11. PADRÕES E ARQUITETURA

### 11.1 Clean Architecture
- **Presentation**: atoms → molecules → organisms → pages
- **Application**: hooks, services, context
- **Domain**: DTOs, types, constants
- **Infrastructure**: repositories, API clients

### 11.2 Atomic Design
- **Atoms**: Componentes básicos (Button, Input, Card)
- **Molecules**: Composições simples (Form, List Item)
- **Organisms**: Seções complexas (Dashboard, Modal)
- **Templates**: Layouts
- **Pages**: Rotas completas

### 11.3 Design Patterns
- **Repository Pattern**: abstração de dados
- **Service Pattern**: lógica de negócio
- **Hook Pattern**: reusabilidade React
- **Context Pattern**: estado global
- **Middleware Pattern**: APIs

### 11.4 Segurança
- **RLS**: Row-Level Security no Supabase
- **Auth**: Supabase Auth
- **Validação**: Zod DTOs
- **Criptografia**: crypto-js
- **Rate Limit**: middleware

---

## 12. TESTES

### 12.1 Vitest (Unit/Integration)
```bash
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # Com cobertura
```

Locais: `tests/unit/` e `tests/integration/`

### 12.2 Playwright (E2E)
```bash
pnpm test:e2e       # Executa testes E2E
pnpm test:e2e:ui    # Interface visual
pnpm test:e2e:debug # Debug mode
```

Locais: `e2e/`

### 12.3 Cobertura Mínima (85%)
- branches: 85%
- functions: 85%
- lines: 85%
- statements: 85%

---

## 13. SCRIPTS DE DESENVOLVIMENTO

### 13.1 Desenvolvimento
```bash
pnpm dev             # Inicia servidor dev
pnpm build           # Build produção
pnpm preview         # Preview build
```

### 13.2 Qualidade
```bash
pnpm lint            # ESLint
pnpm lint:fix        # Corrige automaticamente
pnpm format          # Prettier
pnpm format:check    # Verifica formatação
pnpm typecheck       # TypeScript check
pnpm validate        # Lint + format + typecheck
```

### 13.3 Testes
```bash
pnpm test            # Vitest watch
pnpm test:run        # Single run
pnpm test:ui         # Interface visual
pnpm test:coverage   # Cobertura
pnpm test:e2e        # Playwright
```

### 13.4 Build & Deploy
```bash
pnpm clean           # Limpa dist
pnpm clean:all       # Limpa tudo
pnpm reinstall       # Reinstala deps
```

### 13.5 Scripts Customizados
```bash
node scripts/audit-design-system.js
node scripts/migrate-design-system.js
node scripts/test-etl.sh
ts-node scripts/run-etl.ts
ts-node scripts/validate-apis.ts
```

---

## 14. ARQUIVOS IMPORTANTES

| Arquivo | Descrição |
|---------|-----------|
| `.env` | Variáveis de ambiente (atual) |
| `.env.example` | Template variáveis |
| `vercel.json` | Config deploy Vercel |
| `vite.config.js` | Config build/dev Vite |
| `tailwind.config.js` | Sistema design Tailwind |
| `tsconfig.json` | Config TypeScript |
| `package.json` | Dependências e scripts |
| `pnpm-lock.yaml` | Lock file |
| `eslint.config.js` | Regras ESLint |
| `playwright.config.ts` | Config testes E2E |

---

## 15. FLUXO DE DADOS

### 15.1 Fluxo Frontend
```
Page Component
  ↓
Hook (useData)
  ↓ (Context)
Service (getData)
  ↓
Repository (query DB)
  ↓
Supabase API
  ↓ (RLS applied)
Database
```

### 15.2 Fluxo Backend
```
HTTP Request → Vercel Function
  ↓
Middleware (auth, rate-limit)
  ↓
Business Logic (service)
  ↓
Data Access (repository)
  ↓
Supabase Admin Client
  ↓ (bypass RLS)
Database
  ↓
Response
```

### 15.3 Fluxo ETL
```
Cron Job Trigger (Vercel)
  ↓
/api/cron/etl-diario
  ↓
ETL Process (lib/analytics/etl.ts)
  ↓
Data Aggregation
  ↓
Database Updates
  ↓
Notifications (Telegram)
  ↓
Completion Log
```

---

## 16. VARIÁVEIS DE AMBIENTE

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### OpenAI
```
OPENAI_API_KEY
OPENAI_MODEL (default: gpt-4o-mini)
OPENAI_MODEL_FALLBACK (default: gpt-3.5-turbo)
OPENAI_MAX_TOKENS_PER_REQUEST (default: 2000)
OPENAI_COST_ALERT_THRESHOLD (default: 80)
```

### Telegram
```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
TELEGRAM_WEBHOOK_SECRET
```

### Analytics & Cache
```
CACHE_PROVIDER (memory, redis)
CACHE_ANALYSIS_TTL (default: 86400)
CACHE_KPI_TTL (default: 300)
ANALYTICS_BATCH_SIZE
ANALYTICS_MAX_PARALLEL
ANALYTICS_ANOMALY_LOOKBACK_DAYS
ANALYTICS_ANOMALY_ZSCORE_THRESHOLD
ANALYTICS_ETL_TIMEOUT
```

### Observabilidade
```
LOG_LEVEL (info, debug, error)
ENABLE_STRUCTURED_LOGGING (true)
ENABLE_TRACE_IDS (true)
HEALTH_CHECK_ENABLED
HEALTH_CHECK_INTERVAL
HEALTH_CHECK_SEND_ALERTS
```

### Segurança
```
CRON_SECRET (proteção cron jobs)
INTERNAL_SECRET (proteção APIs internas)
RETRY_MAX_ATTEMPTS
RETRY_INITIAL_DELAY
RETRY_BACKOFF_MULTIPLIER
CIRCUIT_BREAKER_FAILURE_THRESHOLD
CIRCUIT_BREAKER_RESET_TIMEOUT
```

---

## 17. ESTRUTURA DE TIPOS

Os tipos são definidos em:
- `src/types/` - Tipos TypeScript
- `src/dtos/` - Data Transfer Objects (Zod)
- Tipos inline nos arquivos

Principais tipos:
- User, Unit, Professional
- Order, OrderItem, Service
- Expense, Revenue, BankAccount
- DREData, CashflowData, KPI
- Alert, Notification

---

## 18. FLUXO DE DESENVOLVIMENTO

### 18.1 Branch Strategy
```
main (produção)
  ↑
develop (staging)
  ↑
feature/nome-feature (desenvolvimento)
```

### 18.2 Workflow
1. Cria branch: `git checkout -b feature/nome`
2. Desenvolve com padrões do projeto
3. Testa: `pnpm test`
4. Valida: `pnpm validate`
5. Commit: `git commit -m "feat: descrição"`
6. Push e abre PR
7. CI/CD valida automaticamente
8. Merge em develop
9. Deploy automático em produção

### 18.3 Conventional Commits
```
feat(scope): descrição        # Feature
fix(scope): descrição         # Bug fix
docs(scope): descrição        # Documentação
style(scope): descrição       # Estilo (sem lógica)
refactor(scope): descrição    # Refatoração
perf(scope): descrição        # Performance
test(scope): descrição        # Testes
chore(scope): descrição       # Tarefas
```

---

## RESUMO EXECUTIVO

**Barber Analytics Pro** é uma aplicação web full-stack moderna com:

- **Frontend Robusto**: React 19 + TypeScript + Design System Atômico
- **Backend Serverless**: Vercel Functions + Next.js App Router
- **Persistência**: Supabase (PostgreSQL) com RLS nativo
- **IA Integrada**: OpenAI GPT-4o para relatórios inteligentes
- **Arquitetura Clara**: Clean Architecture + Repository Pattern
- **Testes Abrangentes**: Vitest + Playwright
- **Deploy Automático**: Vercel CI/CD

Total de **500+ componentes, serviços e hooks** organizados em camadas bem definidas, com documentação técnica completa e padrões de código rigorosos.

