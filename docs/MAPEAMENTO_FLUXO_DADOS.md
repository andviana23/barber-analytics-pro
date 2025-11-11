# Mapeamento Completo do Fluxo de Dados - Barber Analytics Pro

## Índice
1. [Fluxo Frontend para Backend](#1-fluxo-frontend-para-backend)
2. [Processamento Backend e Banco de Dados](#2-processamento-backend-e-banco-de-dados)
3. [Processamento de Cron Jobs](#3-processamento-de-cron-jobs)
4. [Integrações (OpenAI e Telegram)](#4-integrações-openai-e-telegram)
5. [Ciclo de Vida de Receita/Despesa](#5-ciclo-de-vida-de-receita-e-despesa)
6. [Ciclo de Vida do ETL Diário](#6-ciclo-de-vida-do-etl-diário)
7. [Sistema de Notificações](#7-sistema-de-notificações)
8. [Arquitetura Geral](#8-arquitetura-geral)

---

## 1. Fluxo Frontend para Backend

### 1.1 Criação de Receita/Despesa no Frontend

**Componentes Envolvidos:**
- **Frontend**: React/Vite com Context API e React Query
- **Páginas**: `CommissionsPage.jsx`, `CashRegisterPage.jsx`, `DREPage.jsx`
- **Serviços**: `profissionaisService`, `revenueService`, `expenseService`

**Fluxo de Dados:**

```
┌─────────────────────────────────────┐
│   USER INTERFACE (Frontend)          │
│  - CommissionsPage                  │
│  - CashRegisterPage                 │
│  - DREPage                          │
└────────────────┬────────────────────┘
                 │ Coleta dados do formulário
                 ▼
┌─────────────────────────────────────┐
│   FORM SUBMISSION                    │
│  - Validação local (React Hook Form)│
│  - Transformação via DTO            │
│  - Anonymização de dados sensíveis  │
└────────────────┬────────────────────┘
                 │ POST/PUT/DELETE
                 ▼
┌─────────────────────────────────────┐
│   API ENDPOINTS (Next.js)            │
│  - /api/revenues/*                  │
│  - /api/expenses/*                  │
│  - /api/commissions/*               │
└────────────────┬────────────────────┘
                 │ Validação + Autenticação
                 ▼
┌─────────────────────────────────────┐
│   SUPABASE (PostgreSQL)              │
│  - revenues table                   │
│  - expenses table                   │
│  - commission_manual table          │
└────────────────┬────────────────────┘
                 │ RLS Policies
                 ▼
┌─────────────────────────────────────┐
│   RESPOSTA AO FRONTEND              │
│  - Success/Error notification       │
│  - Toast com feedback               │
│  - Re-fetch de dados (React Query)  │
└─────────────────────────────────────┘
```

**Exemplo: Criar Nova Receita**

1. Usuário preenche formulário em `CommissionsPage` com:
   - professional_id (quem recebeu)
   - value (valor)
   - description (descrição)
   - date (data)
   - payment_method_id

2. React Hook Form valida os dados localmente

3. Request enviado:
   ```
   POST /api/revenues/create
   {
     "unit_id": "unit-uuid",
     "professional_id": "prof-uuid",
     "value": 150.00,
     "description": "Corte de cabelo",
     "date": "2025-11-11",
     "payment_method_id": "pm-uuid"
   }
   ```

4. API valida:
   - Autenticação via JWT
   - Autorização (usuário tem acesso à unidade?)
   - Dados válidos

5. Dados inseridos em `revenues` table:
   - Gerado UUID automático
   - Campo `source_hash` para deduplicação
   - `status = 'Pending'` inicial
   - `is_active = true`
   - `data_competencia` preenchido automaticamente

6. Resposta retorna:
   ```json
   {
     "success": true,
     "data": { "id": "rev-uuid", ... },
     "message": "Receita criada com sucesso"
   }
   ```

7. React Query refetch automático das receitas
8. Toast notifica usuário

---

### 1.2 Fluxo de Consulta de Dados (Query)

```
┌──────────────────────┐
│  Frontend Component  │
│  (useCommissions,    │
│   useTransactions)   │
└──────────┬───────────┘
           │ React Query hook
           ▼
┌──────────────────────────────────────────┐
│  Query Builder (Supabase JS Client)      │
│  .from('revenues')                       │
│  .select('*')                            │
│  .eq('unit_id', unitId)                  │
│  .gte('date', startDate)                 │
│  .order('date', { ascending: false })    │
└──────────┬───────────────────────────────┘
           │ Realtime subscription (optional)
           ▼
┌──────────────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)             │
│  - Filtra por unit_id (RLS Policy)       │
│  - Aplicar índices para performance      │
│  - Retorna apenas dados autorizados      │
└──────────┬───────────────────────────────┘
           │ Dados filtrados
           ▼
┌──────────────────────────────────────────┐
│  Frontend State (React Query Cache)      │
│  - Carrega dados na tabela               │
│  - Paginação (20 itens por página)       │
│  - Filtros adicionais no cliente         │
└──────────────────────────────────────────┘
```

---

## 2. Processamento Backend e Banco de Dados

### 2.1 Estrutura de Tabelas Principais

**Tabelas Core:**

```
revenues
├── id (UUID PK)
├── unit_id (FK → units)
├── category_id (FK → categories)
├── payment_method_id (FK → payment_methods)
├── professional_id (FK → professionals)
├── value (DECIMAL 15,2)
├── date (DATE)
├── data_competencia (DATE)
├── status ('Pending', 'Received', 'Cancelled')
├── is_active (BOOLEAN)
├── source_hash (VARCHAR 64) - para deduplicação
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

expenses
├── id (UUID PK)
├── unit_id (FK → units)
├── category_id (FK → categories)
├── party_id (FK → parties)
├── payment_method_id (FK → payment_methods)
├── value (DECIMAL 15,2)
├── date (DATE)
├── expected_payment_date (DATE)
├── is_recurring (BOOLEAN)
├── status ('pending', 'paid', 'cancelled')
├── is_active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

ai_metrics_daily
├── id (UUID PK)
├── unit_id (FK → units)
├── date (DATE UNIQUE per unit)
├── gross_revenue (DECIMAL 15,2)
├── total_expenses (DECIMAL 15,2)
├── margin_percentage (DECIMAL 5,2)
├── average_ticket (DECIMAL 15,2)
├── revenues_count (INTEGER)
├── expenses_count (INTEGER)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

alerts_events
├── id (UUID PK)
├── unit_id (FK → units)
├── alert_type (VARCHAR: REVENUE_DROP, LOW_MARGIN, etc)
├── severity ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
├── message (TEXT)
├── metadata (JSONB)
├── status ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')
├── created_at (TIMESTAMPTZ)
├── acknowledged_at (TIMESTAMPTZ)
└── resolved_at (TIMESTAMPTZ)

etl_runs
├── id (UUID PK)
├── run_type (VARCHAR: 'ETL_DIARIO', 'RELATORIO_SEMANAL', etc)
├── run_date (DATE)
├── status ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL')
├── units_processed (INTEGER)
├── records_inserted (INTEGER)
├── duration_seconds (INTEGER)
├── error_message (TEXT)
├── started_at (TIMESTAMPTZ)
├── finished_at (TIMESTAMPTZ)
└── created_at (TIMESTAMPTZ)

openai_cache
├── id (UUID PK)
├── cache_key (VARCHAR UNIQUE)
├── response (TEXT)
├── tokens_used (INTEGER)
├── cost (DECIMAL 10,6)
├── created_at (TIMESTAMPTZ)
└── expires_at (TIMESTAMPTZ)
```

### 2.2 Índices e Performance

```
revenues:
- idx_revenues_unit_id (unit_id) - busca por unidade
- idx_revenues_date (date) - filtro por período
- idx_revenues_unit_date (unit_id, date) - combinado
- idx_revenues_source_hash (source_hash) - deduplicação

expenses:
- idx_expenses_unit_id (unit_id)
- idx_expenses_date (date)
- idx_expenses_unit_date (unit_id, date)
- idx_expenses_recurring (is_recurring, status)

ai_metrics_daily:
- idx_ai_metrics_unit_date (unit_id, date) - UNIQUE
- idx_ai_metrics_created (created_at) - limpeza de cache

alerts_events:
- idx_alerts_unit_id (unit_id)
- idx_alerts_status (status)
- idx_alerts_created (created_at)

etl_runs:
- idx_etl_runs_type_date (run_type, run_date)
- idx_etl_runs_status (status)
```

### 2.3 Row Level Security (RLS)

```
Política: users_see_own_units
- SELECT: users.auth.uid() = auth.uid() AND units.auth_uid = auth.uid()

Política: users_see_unit_revenues
- SELECT/INSERT/UPDATE: auth.uid() in (
    SELECT auth_uid FROM units WHERE id = revenues.unit_id
  )

Política: users_see_unit_expenses
- SELECT/INSERT/UPDATE: auth.uid() in (
    SELECT auth_uid FROM units WHERE id = expenses.unit_id
  )

Política: users_see_unit_metrics
- SELECT: auth.uid() in (
    SELECT auth_uid FROM units WHERE id = ai_metrics_daily.unit_id
  )

Política: users_see_unit_alerts
- SELECT/UPDATE: auth.uid() in (
    SELECT auth_uid FROM units WHERE id = alerts_events.unit_id
  )
```

---

## 3. Processamento de Cron Jobs

### 3.1 Cronograma de Jobs

```
Cron Job                   | Schedule        | Responsável
--------------------------+----------------+----------------------------------
ETL Diário                | 0 3 * * *      | app/api/cron/etl-diario/route.ts
Relatório Diário          | 0 21 * * *     | app/api/cron/relatorio-diario/route.ts
Relatório Semanal         | 0 6 * * 1      | app/api/cron/relatorio-semanal/route.ts
Enviar Alertas            | */15 * * * *   | app/api/cron/enviar-alertas/route.ts
Despesas Recorrentes      | 0 8 * * *      | app/api/cron/gerar-despesas-recorrentes/route.ts
Fechamento Mensal         | 0 0 1 * *      | app/api/cron/fechamento-mensal/route.ts
Validar Saldo             | 0 4 * * *      | app/api/cron/validate-balance/route.ts
Health Check              | */5 * * * *    | app/api/cron/health-check/route.ts
```

### 3.2 Fluxo Geral de um Cron Job

```
VERCEL CRON
    │
    ▼
┌─────────────────────────────────────────┐
│ GET /api/cron/[jobname]/route.ts        │
│ - Middleware: cronAuthMiddleware()      │
│ - Verifica CRON_SECRET header           │
└────────────┬────────────────────────────┘
             │ Auth OK?
             ▼
┌─────────────────────────────────────────┐
│ Criar correlationId para rastreamento   │
│ - Format: "jobname-timestamp-random"    │
│ - Logging estruturado com correlationId │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Verificar Idempotência                  │
│ ensureIdempotency(runType, runDate)     │
│ - Buscar em etl_runs                    │
│ - Se SUCCESS: skip                      │
│ - Se RUNNING > 10min: mark FAILED       │
└────────────┬────────────────────────────┘
             │ Pode prosseguir?
             ▼
┌─────────────────────────────────────────┐
│ Criar registro em etl_runs              │
│ - Status: RUNNING                       │
│ - started_at: NOW()                     │
│ - run_type: (ETL_DIARIO, etc)          │
└────────────┬────────────────────────────┘
             │ Retorna runId
             ▼
┌─────────────────────────────────────────┐
│ PROCESSAR JOB ESPECÍFICO                │
│ (ver seções 3.3 a 3.8)                 │
│ - Executar lógica                       │
│ - Log de progresso                      │
│ - Tratamento de erros                   │
└────────────┬────────────────────────────┘
             │ Resultado (success/failure)
             ▼
┌─────────────────────────────────────────┐
│ Atualizar etl_runs                      │
│ - Status: SUCCESS/FAILED/PARTIAL        │
│ - finished_at: NOW()                    │
│ - duration_seconds: calculado           │
│ - error_message: se houver erro         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ NextResponse.json({                     │
│   success: boolean,                     │
│   correlationId,                        │
│   runId,                                │
│   summary: {...},                       │
│   durationSeconds                       │
│ })                                      │
└─────────────────────────────────────────┘
```

---

### 3.3 ETL Diário (0 3 * * * - 03:00 BRT)

**Arquivo**: `/app/api/cron/etl-diario/route.ts`
**Biblioteca**: `/lib/analytics/etl.ts`

```
┌──────────────────────────────────────────┐
│ GET /api/cron/etl-diario                 │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 1. BUSCAR UNIDADES ATIVAS                │
│ SELECT id, name FROM units              │
│ WHERE is_active = true                  │
└────────────┬─────────────────────────────┘
             │ units: Unit[]
             ▼
┌──────────────────────────────────────────┐
│ 2. PROCESSAR EM BATCHES PARALELOS        │
│ BATCH_SIZE = 5 unidades por vez         │
│ using: processInBatches()                │
└────────────┬─────────────────────────────┘
             │ Para cada unidade:
             ▼
    ┌────────────────────────────────┐
    │ Para cada unidade:             │
    │ etlDaily(unitId, runDate)      │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ FASE 1: EXTRACT                  │
    │ extractData(unitId, runDate)     │
    │                                  │
    │ SELECT FROM revenues WHERE:      │
    │ - unit_id = @unitId              │
    │ - date = @runDate                │
    │ - is_active = true               │
    │                                  │
    │ SELECT FROM expenses WHERE:      │
    │ - unit_id = @unitId              │
    │ - date = @runDate                │
    │ - is_active = true               │
    │                                  │
    │ Resultado: {                     │
    │   revenues: Revenue[],           │
    │   expenses: Expense[]            │
    │ }                                │
    └────────────┬────────────────────┘
                 │ inputData
                 ▼
    ┌──────────────────────────────────┐
    │ FASE 2: TRANSFORM                │
    │ transformData(inputData, ...)    │
    │                                  │
    │ Calcular:                        │
    │ - gross_revenue = SUM(revenues)  │
    │ - total_expenses = SUM(expenses) │
    │ - margin% = (rev - exp) / rev*100│
    │ - avg_ticket = rev / rev_count   │
    │                                  │
    │ Resultado: CalculatedMetrics     │
    └────────────┬────────────────────┘
                 │ metrics[]
                 ▼
    ┌──────────────────────────────────┐
    │ FASE 3: LOAD                     │
    │ loadMetrics(metrics, ...)        │
    │                                  │
    │ UPSERT INTO ai_metrics_daily:    │
    │ - unit_id                        │
    │ - date                           │
    │ - gross_revenue                  │
    │ - total_expenses                 │
    │ - margin_percentage              │
    │ - average_ticket                 │
    │ - revenues_count                 │
    │ - expenses_count                 │
    │                                  │
    │ ON CONFLICT (unit_id, date)      │
    │ DO UPDATE SET ...                │
    │                                  │
    │ Log: métrica salva com id        │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ FASE 4: DETECTAR ANOMALIAS       │
    │ detectAnomaliesAndCreateAlerts() │
    │                                  │
    │ 1. Buscar últimos 30 dias:       │
    │    FROM ai_metrics_daily         │
    │    WHERE unit_id = @unitId       │
    │    AND date >= (NOW - 30 days)   │
    │                                  │
    │ 2. Buscar target de margem:      │
    │    FROM kpi_targets              │
    │    WHERE unit_id = @unitId       │
    │    AND kpi = 'MARGIN'            │
    │                                  │
    │ 3. Detectar anomalias via        │
    │    detectAndGenerateAlerts()     │
    │    - Z-score (desvios padrão)    │
    │    - Quedas de receita > 20%     │
    │    - Margem abaixo do target     │
    │                                  │
    │ 4. Criar alertas em alerts_events│
    │    INSERT INTO alerts_events     │
    │    - alert_type                  │
    │    - severity (LOW/MED/HIGH/CRIT)│
    │    - message                     │
    │    - metadata (JSON)             │
    │    - status = 'OPEN'             │
    │                                  │
    │ Log: N alertas criados           │
    └────────────┬────────────────────┘
                 │ Retorna resultado
                 ▼
    ┌──────────────────────────────────┐
    │ Resultado da unidade:            │
    │ {                                │
    │   unitId,                        │
    │   unitName,                      │
    │   success: boolean,              │
    │   metricsProcessed: 1,           │
    │   errors?: []                    │
    │ }                                │
    └────────────────────────────────┘
             │
             ▼ (Próxima unidade no batch)
    
┌─────────────────────────────────────────┐
│ 3. AGREGAR RESULTADOS                   │
│ - Contar unidades com sucesso           │
│ - Contar unidades com falha             │
│ - Total de métricas processadas         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ 4. ATUALIZAR etl_runs                   │
│ UPDATE etl_runs SET:                    │
│ - status = SUCCESS/FAILED/PARTIAL       │
│ - units_processed                       │
│ - records_inserted                      │
│ - duration_seconds                      │
│ - finished_at = NOW()                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ RETORNAR JSON                           │
│ {                                       │
│   success: true,                        │
│   runId,                                │
│   correlationId,                        │
│   summary: {                            │
│     totalUnits,                         │
│     successfulUnits,                    │
│     failedUnits,                        │
│     totalMetricsProcessed               │
│   },                                    │
│   results: [...]                        │
│ }                                       │
└─────────────────────────────────────────┘
```

### 3.4 Enviar Alertas (*/15 * * * * - A cada 15 minutos)

**Arquivo**: `/app/api/cron/enviar-alertas/route.ts`

```
GET /api/cron/enviar-alertas
    │
    ▼
┌─────────────────────────────────────┐
│ 1. BUSCAR ALERTAS PENDENTES         │
│ SELECT * FROM alerts_events         │
│ WHERE status = 'OPEN'               │
│ ORDER BY created_at ASC             │
│ LIMIT 50                            │
│                                     │
│ Resultado: alerts []                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ 2. PARA CADA ALERTA:                │
│                                     │
│ a) Buscar informação da unidade:    │
│    SELECT id, name FROM units       │
│    WHERE id = @alert.unit_id        │
│                                     │
│ b) Chamar sendTelegramAlert()       │
│    com estrutura formatada          │
│                                     │
│    Formato:                         │
│    ⚠️ MEDIUM (emoji baseado sev.)   │
│    {mensagem}                       │
│    📍 Unidade: {unitName}           │
│    🆔 ID: {unitId}                  │
│    📊 Detalhes: {metadata}          │
│    ⏰ {timestamp}                   │
│                                     │
│ c) Atualizar status:                │
│    UPDATE alerts_events SET         │
│    - status = 'ACKNOWLEDGED'        │
│    - acknowledged_at = NOW()        │
│    WHERE id = @alertId              │
│                                     │
│ Log: Alerta enviado com sucesso     │
└────────────┬────────────────────────┘
             │ sentCount++
             ▼
┌─────────────────────────────────────┐
│ 3. VERIFICAR DESPESAS RECORRENTES   │
│ checkAndNotifyUpcomingExpenses(7)   │
│                                     │
│ - Buscar despesas com vencimento    │
│   nos próximos 7 dias               │
│ - Enviar notificação Telegram       │
│ - Log de resultado                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ RETORNAR JSON                       │
│ {                                   │
│   success: true,                    │
│   alertsFound,                      │
│   alertsSent,                       │
│   alertsFailed,                     │
│   recurringExpensesFound,           │
│   recurringNotificationsSent        │
│ }                                   │
└─────────────────────────────────────┘
```

### 3.5 Relatório Diário (0 21 * * * - 21:00 BRT)

**Arquivo**: `/app/api/cron/relatorio-diario/route.ts`

```
GET /api/cron/relatorio-diario
    │
    ▼
┌────────────────────────────────┐
│ Para cada unidade ativa:       │
└────────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────────┐
    │ 1. getDailyRevenues()          │
    │    - Receitas do dia           │
    │    - Agrupadas por categoria   │
    │    - Contabiliza assinaturas,  │
    │      produtos, avulsos         │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 2. compareWithLastWeek()        │
    │    - Comparar dia com semana    │
    │      anterior                  │
    │    - Calcular variação %       │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 3. calculateAllGoalsProgress()  │
    │    - Progresso das metas       │
    │    - % completado              │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 4. detectPatterns()            │
    │    - Padrões comportamentais   │
    │    - Hábitos identificados     │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 5. generateAnalysis()          │
    │    - Chamar OpenAI com dados   │
    │    - Cache check (24h TTL)     │
    │    - Gerar insights            │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 6. saveDailyReport()           │
    │    - Salvar em daily_reports   │
    │      (se tabela existir)       │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ 7. sendTelegramMessage()       │
    │    - Formato Markdown          │
    │    - Resumo do dia             │
    │    - Insights principais       │
    │    - Metas alcançadas          │
    └────────────────────────────────┘

┌────────────────────────────────┐
│ RETORNAR JSON                  │
│ {                              │
│   success: true,               │
│   reports_sent: N              │
│ }                              │
└────────────────────────────────┘
```

---

## 4. Integrações (OpenAI e Telegram)

### 4.1 Integração com OpenAI

**Arquivo**: `/lib/ai/openai.ts`, `/lib/ai/analysis.ts`

```
┌────────────────────────────────────────┐
│ generateAnalysis()                     │
│ (prompt: WEEKLY/ALERT/WHAT_IF/MONTHLY)│
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 1. ANONIMIZAR MÉTRICAS                 │
│ anonymizeMetrics(metrics)              │
│ - Remove IDs específicos               │
│ - Remove dados identifíc.              │
│ - Mantém apenas valores de análise     │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 2. GERAR CHAVE DE CACHE                │
│ generateCacheKey(unitId, metrics)      │
│ - Arredondar valores para similaridade │
│ - Incluir promptType e opções          │
│ - Key: openai:{unitId}:{hash}          │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 3. VERIFICAR CACHE                     │
│ getCachedAnalysis(cacheKey, ttl: 86400)│
│ - SELECT FROM openai_cache             │
│ - TTL: 24 horas padrão                 │
│ - Se encontrado: retornar              │
│   (cached: true)                       │
└────────────┬─────────────────────────┘
             │ NOT FOUND
             ▼
┌────────────────────────────────────────┐
│ 4. GERAR PROMPT APROPRIADO             │
│ Conforme promptType:                   │
│                                        │
│ WEEKLY:                                │
│   - Analise métricas da semana         │
│   - Identifique tendências             │
│   - Recomende ações                    │
│                                        │
│ ALERT:                                 │
│   - Analise por tipo de alerta         │
│   - Recomendações específicas          │
│                                        │
│ WHAT_IF:                               │
│   - Simule cenário fornecido           │
│   - Impacto na margem, receita, etc    │
│                                        │
│ MONTHLY_EXECUTIVE:                     │
│   - Resumo executivo do mês            │
│   - KPIs principais                    │
└────────────┬─────────────────────────┘
             │ messages[]
             ▼
┌────────────────────────────────────────┐
│ 5. CHAMAR OpenAI COM CIRCUIT BREAKER   │
│ callOpenAI(messages, options)          │
│                                        │
│ POST https://api.openai.com/v1/chat   │
│ /completions                           │
│                                        │
│ Payload:                               │
│ {                                      │
│   model: gpt-4o-mini,                 │
│   messages: [{role, content}],        │
│   temperature: 0.7,                    │
│   max_tokens: 2000,                    │
│   top_p: 0.9                           │
│ }                                      │
│                                        │
│ Proteções:                             │
│ - Circuit Breaker (5 falhas = trip)    │
│ - Retry com backoff exponencial        │
│ - Timeout: 30 segundos                 │
│ - Rate limiting por modelo             │
└────────────┬─────────────────────────┘
             │ response
             ▼
┌────────────────────────────────────────┐
│ 6. PROCESSAR RESPOSTA                  │
│ - Extract content                      │
│ - Contar tokens utilizados             │
│ - Tentar parsear JSON (se retornar)    │
│ - Log de custos (track em BD)          │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 7. SALVAR EM CACHE                     │
│ setCachedAnalysis(cacheKey, content,   │
│   { ttl: 86400 })                      │
│                                        │
│ INSERT INTO openai_cache:              │
│ - cache_key                            │
│ - response                             │
│ - tokens_used                          │
│ - cost                                 │
│ - expires_at (now + 24h)               │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ RETORNAR AnalysisResult                │
│ {                                      │
│   content: string,                     │
│   parsed?: JSON,                       │
│   cached: false,                       │
│   tokensUsed: N,                       │
│   cost: $XX                            │
│ }                                      │
└────────────────────────────────────────┘
```

**Controle de Custos OpenAI:**

```
openai_cost_tracking table:
├── id (UUID)
├── unit_id (FK)
├── prompt_type
├── model
├── tokens_input
├── tokens_output
├── cost_usd (DECIMAL 10,6)
├── date (DATE)
└── created_at

Rastreamento:
- Cada call registra em openai_cache
- Extrai tokens_used e calcula cost
- Insere em openai_cost_tracking
- Alert se custo mensal > threshold
```

### 4.2 Integração com Telegram

**Arquivos**: `/lib/telegram.ts`, `/lib/telegram/commands.ts`, `/app/api/telegram/webhook/route.ts`

#### 4.2.1 Envio de Mensagens (Ativo)

```
sendTelegramMessage(message, options)
    │
    ▼
┌──────────────────────────────────────┐
│ 1. VALIDAR CONFIGURAÇÃO              │
│ - TELEGRAM_BOT_TOKEN configurado?    │
│ - TELEGRAM_CHAT_ID configurado?      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. CIRCUIT BREAKER                   │
│ - Threshold: 5 falhas                │
│ - Reset timeout: 60s                 │
│ - Estado: CLOSED/OPEN/HALF_OPEN      │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. RETRY COM BACKOFF                 │
│ - Max attempts: 3                    │
│ - Inicial delay: 1s                  │
│ - Exponencial: delay *= 2            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. POST TO TELEGRAM API              │
│ https://api.telegram.org/bot         │
│ {BOT_TOKEN}/sendMessage              │
│                                      │
│ Body:                                │
│ {                                    │
│   chat_id: @chatId,                  │
│   text: @message,                    │
│   parse_mode: Markdown,              │
│   disable_web_page_preview: true     │
│ }                                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 5. TRATAR RESPOSTA                   │
│ - Se OK: retornar messageId          │
│ - Se erro: log detalhado             │
│ - Atualizar Circuit Breaker          │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ RETORNAR                             │
│ {                                    │
│   success: boolean,                  │
│   messageId?: number,                │
│   error?: string                     │
│ }                                    │
└──────────────────────────────────────┘
```

**Formatação de Alertas:**

```
sendTelegramAlert(alert) →

Saída formatada:
⚠️ *MEDIUM*
{mensagem}

📍 *Unidade:* UnitName
🆔 *ID:* `unit-uuid`

📊 *Detalhes:*
• *Tipo:* REVENUE_DROP
• *Severidade:* MEDIUM
• *Criado em:* 11/11/2025 14:32:45

⏰ 11/11/2025 14:32:45
```

#### 4.2.2 Recepção de Mensagens (Webhook)

**Arquivo**: `/app/api/telegram/webhook/route.ts`

```
POST /api/telegram/webhook (Telegram Bot API)
    │
    ▼
┌──────────────────────────────────────┐
│ 1. VALIDAR WEBHOOK SECRET            │
│ header: x-telegram-bot-api-secret    │
│ -token == TELEGRAM_WEBHOOK_SECRET    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. PARSEAR UPDATE DO TELEGRAM        │
│ {                                    │
│   update_id: 12345,                  │
│   message: {                         │
│     message_id: 789,                 │
│     date: 1731355200,                │
│     chat: { id: -1001234567890 },   │
│     from: {                          │
│       id: 123456,                    │
│       username: "username",          │
│       first_name: "Name"             │
│     },                               │
│     text: "/status"                  │
│   }                                  │
│ }                                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. VALIDAÇÕES                        │
│ - Mensagem não muito antiga (5+ min)?│
│   (ignorar se sim)                   │
│ - Conteúdo válido?                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. VERIFICAR TIPO DE MENSAGEM        │
└────────┬───────────────────────┬─────┘
         │                       │
         ▼                       ▼
    Comando                  Texto normal
    (inicia com /)           (mensagem)
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌────────────────┐
│handleTelegramCmd │    │sendHelp()      │
│                  │    │Enviar: /status │
│Comandos:         │    │/semanal        │
│/status           │    │/alertas        │
│/semanal          │    │/whatif         │
│/alertas          │    │/help           │
│/whatif <scenario>│    └────────────────┘
│/help             │
└──────────────────┘

┌──────────────────────────────────────┐
│ 5. EXECUTAR HANDLER APROPRIADO       │
│                                      │
│ /status:                             │
│   getHealthStatus() + sendTelegram() │
│   → Retorna: receita, despesas,      │
│     margem do dia                    │
│                                      │
│ /semanal:                            │
│   getWeeklyReport() + sendTelegram() │
│   → Retorna: resumo da semana        │
│                                      │
│ /alertas:                            │
│   queryPendingAlerts() + format()    │
│   → Retorna: lista de alertas        │
│                                      │
│ /whatif <scenario>:                  │
│   generateAnalysis(WHAT_IF,          │
│     scenario) + sendTelegram()       │
│   → Simula cenário fornecido         │
│                                      │
│ /help:                               │
│   sendHelpMenu() → Lista comandos    │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ RETORNAR                             │
│ NextResponse.json({ ok: true })      │
└──────────────────────────────────────┘
```

---

## 5. Ciclo de Vida de Receita e Despesa

### 5.1 Fluxo Completo de uma Receita

```
CRIAÇÃO (Estado 1)
────────────────────────────────────
1. Usuário preenche formulário frontend
   └─ CommissionsPage / CashRegisterPage

2. Dados enviados via API
   POST /api/revenues/create
   ├─ Validação (DTO)
   ├─ Autenticação (JWT)
   └─ Autorização (RLS)

3. Inserir em revenues table
   ├─ INSERT INTO revenues (
   │  id: UUID,
   │  unit_id,
   │  category_id,
   │  professional_id,
   │  payment_method_id,
   │  value,
   │  date,
   │  data_competencia,
   │  source_hash (para dedup),
   │  status: 'Pending',
   │  is_active: true,
   │  created_at, updated_at
   │)
   └─ Retorna id da receita

4. React Query atualiza cache
   └─ Toast de sucesso


ESTADO: Pending
────────────────────────────────────
5. ETL Diário processa a receita (03:00)
   ├─ EXTRACT: busca revenues do dia
   ├─ TRANSFORM: agrega valores
   ├─ LOAD: salva em ai_metrics_daily
   └─ Cria alertas se necessário


RECEPCÃO EFETIVA (Opcional)
────────────────────────────────────
6. Usuário marca como "Received"
   └─ UPDATE revenues SET
      ├─ status: 'Received'
      ├─ actual_receipt_date: NOW()
      └─ reconciled: true

7. Reconciliação (opcional)
   └─ Validar saldo com banco


FECHAMENTO
────────────────────────────────────
8. Relatório Diário (21:00)
   ├─ Busca receitas pendentes e recebidas
   ├─ Compara com semana anterior
   ├─ Chama OpenAI para análise
   └─ Envia via Telegram

9. Arquivamento (Final do mês)
   ├─ Dados permanecem em revenues
   ├─ status_arquivado: true (se tabela houver)
   └─ Disponível para relatórios históricos


DELEÇÃO (Soft Delete)
────────────────────────────────────
10. Usuário deleta receita
    └─ UPDATE revenues SET
       ├─ is_active: false
       ├─ deleted_by: user_id
       └─ deleted_at: NOW()
       
       (Dados permanecem para auditoria)
```

### 5.2 Fluxo Completo de uma Despesa

```
CRIAÇÃO
────────────────────────────────────
1. Formulário de Despesa
   ├─ Se recorrente:
   │  ├─ is_recurring: true
   │  ├─ recurring_series_id (agrupa instâncias)
   │  ├─ installment_number (qual parcela)
   │  └─ recurrence_rule (MONTHLY, WEEKLY, etc)
   └─ Se avulso:
      └─ is_recurring: false

2. Inserir em expenses table
   ├─ value DECIMAL(15,2)
   ├─ status: 'pending' | 'paid' | 'cancelled'
   ├─ expected_payment_date
   ├─ actual_payment_date (null inicialmente)
   └─ is_active: true


CICLO DE RECORRENTES
────────────────────────────────────
3. Cron: gerar-despesas-recorrentes (08:00)
   ├─ SELECT WHERE is_recurring = true
   ├─ Verificar se próxima instância precisa ser criada
   ├─ INSERT nova instância
   │  ├─ installment_number += 1
   │  ├─ expected_payment_date atualizado
   │  └─ status: 'pending'
   └─ Log: N instâncias criadas


NOTIFICAÇÃO DE VENCIMENTO
────────────────────────────────────
4. Cron: enviar-alertas (a cada 15min)
   ├─ checkAndNotifyUpcomingExpenses(7)
   ├─ SELECT FROM expenses WHERE:
   │  ├─ is_recurring = true
   │  ├─ status = 'pending'
   │  └─ expected_payment_date BETWEEN
   │     (TODAY, TODAY+7)
   ├─ Agrupar por unidade
   └─ sendTelegramMessage()


PAGAMENTO
────────────────────────────────────
5. Usuário marca como "Pago"
   ├─ UPDATE expenses SET
   │  ├─ status: 'paid'
   │  ├─ actual_payment_date: NOW()
   │  └─ updated_at: NOW()
   └─ POST /api/expenses/{id}/mark-paid


INTEGRAÇÕES
────────────────────────────────────
6. ETL Diário (03:00)
   ├─ Busca despesas pagas do dia
   ├─ Calcula total_expenses
   ├─ Afeta margin_percentage
   └─ Cria alertas se margem baixa

7. Validação de Saldo (04:00)
   ├─ Soma bank_accounts.current_balance
   ├─ Compara com saldo acumulado teórico
   └─ Alerta se diferença > threshold


FECHAMENTO MENSAL
────────────────────────────────────
8. Cron: fechamento-mensal (00:00 do mês)
   ├─ Calcular DRE (Demonstrativo de Resultado)
   ├─ Receitas vs Despesas
   ├─ KPIs mensais
   └─ Arquivo (marcar período como fechado)


DELEÇÃO
────────────────────────────────────
9. Soft delete:
   └─ UPDATE expenses SET
      ├─ is_active: false
      ├─ deleted_at: NOW()
      └─ (Dados preservados para auditoria)
```

---

## 6. Ciclo de Vida do ETL Diário

### 6.1 Timeline Completa (Diário)

```
02:55 BRT
─────────────────────────────────────
Vercel Cron prepara execução
└─ Carrega função: /api/cron/etl-diario

03:00 BRT
─────────────────────────────────────
GET /api/cron/etl-diario

1. VALIDAÇÃO (0-30ms)
   ├─ Validar CRON_SECRET
   ├─ Criar correlationId
   └─ Log: "ETL iniciado"

2. IDEMPOTÊNCIA (30-60ms)
   ├─ Buscar em etl_runs
   │  WHERE run_type = 'ETL_DIARIO'
   │  AND run_date = TODAY
   ├─ Se SUCCESS: SKIP (retorna imediato)
   ├─ Se RUNNING > 10min: mark FAILED
   └─ Caso contrário: prosseguir

3. CRIAR REGISTRO (60-100ms)
   ├─ INSERT INTO etl_runs
   │  ├─ run_type: 'ETL_DIARIO'
   │  ├─ run_date: TODAY
   │  ├─ status: 'RUNNING'
   │  ├─ started_at: NOW()
   │  └─ trigger_type: 'cron'
   └─ Retorna runId (para tracking)

4. BUSCAR UNIDADES (100-200ms)
   ├─ SELECT id, name FROM units
   │  WHERE is_active = true
   ├─ Exemplo: 5 unidades encontradas
   └─ Log: "5 unidades ativas encontradas"

5. PROCESSAR BATCHES (200ms - ~30s)
   │
   ├─ BATCH 1 (Paralelo)
   │  ├─ Unit A
   │  │  ├─ EXTRACT (100-200ms)
   │  │  │  ├─ SELECT FROM revenues (10 registros)
   │  │  │  ├─ SELECT FROM expenses (5 registros)
   │  │  │  └─ Remove duplicatas
   │  │  ├─ TRANSFORM (50-100ms)
   │  │  │  ├─ gross_revenue: R$ 5000
   │  │  │  ├─ total_expenses: R$ 1500
   │  │  │  ├─ margin%: 70%
   │  │  │  ├─ avg_ticket: R$ 500
   │  │  │  └─ Log métricas calculadas
   │  │  ├─ LOAD (100-200ms)
   │  │  │  ├─ UPSERT INTO ai_metrics_daily
   │  │  │  ├─ Sucesso: métrica ID = abc123
   │  │  │  └─ Log: "Métrica salva"
   │  │  └─ ANOMALIAS (200-300ms)
   │  │     ├─ Buscar últimos 30 dias
   │  │     ├─ Comparar z-score
   │  │     ├─ Detectar quedas > 20%
   │  │     ├─ 2 alertas criados
   │  │     └─ Log: "2 alertas criados"
   │  │
   │  ├─ Unit B (paralelo)
   │  │  ├─ EXTRACT: 8 receitas, 3 despesas
   │  │  ├─ TRANSFORM: margem 65%
   │  │  ├─ LOAD: OK
   │  │  └─ ANOMALIAS: 1 alerta criado
   │  │
   │  ├─ Unit C (paralelo)
   │  │  ├─ EXTRACT: 0 receitas, 2 despesas
   │  │  ├─ TRANSFORM: margem -40% (prejuízo)
   │  │  ├─ LOAD: OK
   │  │  └─ ANOMALIAS: 3 alertas (crítico)
   │  │
   │  ├─ Unit D (paralelo)
   │  │  └─ EXTRACT: ERRO ao buscar DB
   │  │     ├─ Log erro: "Connection timeout"
   │  │     └─ Status: FAILURE
   │  │
   │  └─ Unit E (paralelo)
   │     ├─ Normal: sucesso
   │     └─ Status: SUCCESS
   │
   └─ Fim do BATCH 1: ~2-3 segundos

6. AGREGAR RESULTADOS (~32s)
   ├─ totalUnits: 5
   ├─ successfulUnits: 4 (A, B, C, E)
   ├─ failedUnits: 1 (D)
   └─ totalMetricsProcessed: 4

7. ATUALIZAR etl_runs (~33s)
   ├─ UPDATE etl_runs SET
   │  ├─ status: 'PARTIAL'
   │     (pois 1 falha de 5)
   │  ├─ units_processed: 5
   │  ├─ records_inserted: 4
   │  ├─ duration_seconds: 33
   │  ├─ error_message: "Unit D failed:
   │     │Connection timeout"
   │  └─ finished_at: NOW()
   └─ Log: "etl_runs atualizado"

8. RETORNAR RESPOSTA (~33s)
   └─ NextResponse.json({
      success: true,
      runId: "etl-run-12345",
      correlationId: "etl-...",
      runDate: "2025-11-11",
      durationSeconds: 33,
      summary: {
        totalUnits: 5,
        successfulUnits: 4,
        failedUnits: 1,
        totalMetricsProcessed: 4
      },
      results: [
        { unitId: "a", success: true, metricsProcessed: 1 },
        { unitId: "b", success: true, metricsProcessed: 1 },
        { unitId: "c", success: true, metricsProcessed: 1 },
        { unitId: "d", success: false, errors: ["Connection timeout"] },
        { unitId: "e", success: true, metricsProcessed: 1 }
      ]
    })

03:00 (após ~35s)
─────────────────────────────────────
Resposta retornada ao Vercel
├─ Status 200 OK
└─ Cron job finalizado


03:15 BRT
─────────────────────────────────────
Próximo job: enviar-alertas
├─ 6 alertas pendentes criados pelo ETL
├─ Enviar via Telegram
└─ Marcar como ACKNOWLEDGED


21:00 BRT
─────────────────────────────────────
Relatório Diário
├─ Busca receitas/despesas diárias
├─ Chama OpenAI (ou retorna do cache)
├─ Envia resumo formatado via Telegram
└─ Salva em daily_reports (se houver)


04:00 (próximo dia)
─────────────────────────────────────
Validação de Saldo
├─ Compara bank_accounts com teórico
└─ Alerta se diferença significativa
```

### 6.2 Detalhamento de Cada Fase ETL

#### EXTRACT Phase

```
extractData(unitId, runDate)
    │
    ▼
┌─────────────────────────────────┐
│ Converter runDate para YYYY-MM-DD│
│ Ex: new Date('2025-11-11')      │
│  → '2025-11-11'                 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ SELECT FROM revenues WHERE:     │
│ - unit_id = '...'               │
│ - date = '2025-11-11'           │
│ - is_active = true              │
│                                 │
│ Retorna: Array<{                │
│   id, value, date, status,      │
│   unit_id, category_id,         │
│   payment_method_id             │
│ }>                              │
│ Ex: [                           │
│   {id: 'r1', value: 1000},     │
│   {id: 'r2', value: 2000},     │
│   {id: 'r3', value: 2000}      │
│ ]                               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ SELECT FROM expenses WHERE:     │
│ - unit_id = '...'               │
│ - date = '2025-11-11'           │
│ - is_active = true              │
│                                 │
│ Retorna: Array<{                │
│   id, value, date, status,      │
│   unit_id, category_id          │
│ }>                              │
│ Ex: [                           │
│   {id: 'e1', value: 500},      │
│   {id: 'e2', value: 300},      │
│   {id: 'e3', value: 700}       │
│ ]                               │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ Deduplicate por id              │
│ (remover registros duplicados)  │
│                                 │
│ Retorna: {                      │
│   revenues: Revenue[],          │
│   expenses: Expense[]           │
│ }                               │
└────────────────────────────────┘
```

#### TRANSFORM Phase

```
transformData(inputData, unitId, runDate)
    │
    ▼
┌──────────────────────────────────┐
│ Calcular gross_revenue           │
│ = SUM(revenues.map(r => r.value))│
│ = 1000 + 2000 + 2000             │
│ = 5000                           │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Calcular total_expenses          │
│ = SUM(expenses.map(e => e.value))│
│ = 500 + 300 + 700               │
│ = 1500                           │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Calcular margin_percentage       │
│ = ((rev - exp) / rev) * 100      │
│ = ((5000 - 1500) / 5000) * 100   │
│ = 70%                            │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Calcular average_ticket          │
│ = gross_revenue / revenues_count │
│ = 5000 / 3                       │
│ = 1666.67                        │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Retorna CalculatedMetrics:       │
│ {                                │
│   gross_revenue: 5000,           │
│   total_expenses: 1500,          │
│   margin_percentage: 70,         │
│   average_ticket: 1666.67,       │
│   revenues_count: 3,             │
│   expenses_count: 3              │
│ }                                │
└──────────────────────────────────┘
```

#### LOAD Phase

```
loadMetrics(metrics, unitId, runDate)
    │
    ▼
┌───────────────────────────────────┐
│ Para cada métrica (geralmente 1): │
└────────────┬──────────────────────┘
             │
             ▼
    ┌─────────────────────────────────┐
    │ Preparar dados para UPSERT:     │
    │ {                               │
    │   unit_id: 'unit-123',          │
    │   date: '2025-11-11',           │
    │   gross_revenue: 5000,          │
    │   total_expenses: 1500,         │
    │   margin_percentage: 70,        │
    │   average_ticket: 1666.67,      │
    │   revenues_count: 3,            │
    │   expenses_count: 3             │
    │ }                               │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ UPSERT INTO ai_metrics_daily    │
    │                                 │
    │ ON CONFLICT (unit_id, date)     │
    │ DO UPDATE SET (...)             │
    │                                 │
    │ Resultado:                      │
    │ ✓ Nova métrica ID: 'metric-456' │
    │ ✓ Log: "Métrica salva com id"   │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Próxima métrica (se houver)     │
    │ (geralmente não há múltiplas)   │
    └─────────────────────────────────┘

┌───────────────────────────────────┐
│ Se todos sucesso:                 │
│ return { success: true }          │
│                                   │
│ Se alguma falha:                  │
│ return {                          │
│   success: false,                 │
│   errors: ["Erro mensagem"]       │
│ }                                 │
└───────────────────────────────────┘
```

#### ANOMALY DETECTION Phase

```
detectAnomaliesAndCreateAlerts(unitId, currentMetric, runDate)
    │
    ▼
┌──────────────────────────────────────┐
│ 1. Buscar histórico (últimos 30 dias)│
│ SELECT FROM ai_metrics_daily WHERE:  │
│ - unit_id = @unitId                  │
│ - date BETWEEN                       │
│   (runDate - 30 days, runDate)       │
│ - is_active = true                   │
│                                      │
│ Resultado: [ metric1, metric2, ... ] │
│ Mínimo 7 dias exigido (senão skip)   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 2. Buscar target de margem           │
│ SELECT FROM kpi_targets WHERE:       │
│ - unit_id = @unitId                  │
│ - kpi = 'MARGIN'                     │
│                                      │
│ Resultado: { target_value: 65 }      │
│ (ou null se não configurado)         │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 3. Chamar detectAndGenerateAlerts()  │
│                                      │
│ Algoritmos:                          │
│                                      │
│ A) Z-Score (desvios padrão)          │
│    - Calcular média histórica        │
│    - Calcular desvio padrão          │
│    - Z = (valor - média) / σ         │
│    - Se |Z| > 2: anomalia            │
│    - Alerta: ANOMALY_DETECTED        │
│    - Severidade: HIGH                │
│                                      │
│ B) Queda de Receita                  │
│    - Comparar receita (hoje vs méd.) │
│    - Se queda > 20%: anomalia        │
│    - Alerta: REVENUE_DROP            │
│    - Severidade: HIGH                │
│                                      │
│ C) Margem Baixa                      │
│    - Se margem_atual < target: alerta│
│    - Alerta: LOW_MARGIN              │
│    - Severidade: MEDIUM              │
│                                      │
│ Resultado:                           │
│ [                                    │
│   {                                  │
│     alert_type: 'REVENUE_DROP',      │
│     severity: 'HIGH',                │
│     message: 'Queda de 25% em relação│
│               à média',              │
│     metadata: {                      │
│       current: 5000,                 │
│       average: 6666.67,              │
│       variance: -25.0                │
│     }                                │
│   },                                 │
│   { ... more alerts ... }            │
│ ]                                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ 4. Criar alertas em alerts_events    │
│                                      │
│ Para cada alert detectado:           │
│ INSERT INTO alerts_events (          │
│   unit_id,                           │
│   alert_type,                        │
│   severity,                          │
│   message,                           │
│   metadata,                          │
│   status: 'OPEN',                    │
│   created_at: NOW()                  │
│ )                                    │
│                                      │
│ Log: "Alerta criado: REVENUE_DROP"   │
│                                      │
│ Próximo job (*/15):                  │
│ - Buscar alertas OPEN                │
│ - Enviar via Telegram                │
│ - Marcar como ACKNOWLEDGED           │
└──────────────────────────────────────┘
```

---

## 7. Sistema de Notificações

### 7.1 Fluxo Completo de Notificações

```
┌─────────────────────────────────────┐
│ EVENTO GERADOR DE ALERTA            │
├─────────────────────────────────────┤
│ 1. ETL Diário cria alertas          │
│    (anomalias detectadas)           │
│                                     │
│ 2. Validação de Saldo cria alertas  │
│    (diferenças encontradas)         │
│                                     │
│ 3. Despesas recorrentes vencem      │
│    (próximos 7 dias)                │
│                                     │
│ 4. KPI não atingido                 │
│    (meta não alcançada)             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ PERSISTIR EM DB                     │
├─────────────────────────────────────┤
│ INSERT INTO alerts_events (         │
│   unit_id,                          │
│   alert_type,                       │
│   severity,                         │
│   message,                          │
│   metadata,                         │
│   status: 'OPEN',                   │
│   created_at                        │
│ )                                   │
│                                     │
│ OU                                  │
│                                     │
│ sendUpcomingExpenseNotifications()  │
│ (notificação direta)                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ CRON: ENVIAR ALERTAS (*/15)         │
├─────────────────────────────────────┤
│ GET /api/cron/enviar-alertas        │
│                                     │
│ 1. Buscar alertas OPEN              │
│    SELECT * FROM alerts_events      │
│    WHERE status = 'OPEN'            │
│    LIMIT 50                         │
│                                     │
│ 2. Para cada alerta:                │
│    a) Buscar dados da unidade       │
│    b) Formatar mensagem Telegram    │
│    c) Enviar via Telegram           │
│    d) Atualizar status → ACKNOWLEDGED
│                                     │
│ 3. Verificar despesas recorrentes   │
│    checkAndNotifyUpcomingExpenses(7)│
│    - Buscar vencimentos próximos    │
│    - Enviar notificação             │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ ENVIAR VIA TELEGRAM                 │
├─────────────────────────────────────┤
│ sendTelegramMessage()               │
│ sendTelegramAlert()                 │
│ sendBalanceValidationAlert()        │
│ sendUpcomingExpenseNotifications()  │
│                                     │
│ Proteções:                          │
│ - Circuit Breaker                   │
│ - Retry com backoff                 │
│ - Timeout 30s                       │
│                                     │
│ Formato: Markdown com emojis        │
│ Exemplo:                            │
│ ⚠️ *HIGH*                           │
│ Queda de receita em 25%             │
│ 📍 *Unidade:* Unit A                │
│ 🆔 *ID:* unit-123                   │
│ ⏰ 11/11/2025 14:32                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ ATUALIZAR STATUS EM DB              │
├─────────────────────────────────────┤
│ UPDATE alerts_events SET            │
│ - status = 'ACKNOWLEDGED'           │
│ - acknowledged_at = NOW()           │
│ WHERE id = @alertId                 │
│                                     │
│ Log: Alerta enviado com sucesso     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ RETORNAR RESULTADO                  │
├─────────────────────────────────────┤
│ {                                   │
│   success: true,                    │
│   alertsFound: 6,                   │
│   alertsSent: 5,                    │
│   alertsFailed: 1,                  │
│   recurringExpensesFound: 3,        │
│   recurringNotificationsSent: 3,    │
│   durationMs: 2547                  │
│ }                                   │
└─────────────────────────────────────┘
```

### 7.2 Tipos de Notificações

```
ALERTAS AUTOMÁTICOS (gerados por ETL):
├─ REVENUE_DROP (Queda de receita > 20%)
│  └─ Severidade: HIGH
│
├─ LOW_MARGIN (Margem < target)
│  └─ Severidade: MEDIUM
│
├─ ANOMALY_DETECTED (Z-score > 2σ)
│  └─ Severidade: HIGH / CRITICAL
│
└─ BALANCE_MISMATCH (Saldo incoerente)
   └─ Severidade: CRITICAL


NOTIFICAÇÕES DE VENCIMENTO:
├─ UPCOMING_EXPENSE (Despesa vence em 7 dias)
│  └─ Severidade: MEDIUM
│
└─ OVERDUE_EXPENSE (Vencida)
   └─ Severidade: HIGH


NOTIFICAÇÕES DE RELATÓRIO:
├─ DAILY_REPORT (21:00 - Resumo do dia)
│  └─ Conteúdo: receita, despesas, margem, metas
│
├─ WEEKLY_REPORT (Segunda 06:00)
│  └─ Conteúdo: análise semanal, tendências
│
└─ MONTHLY_REPORT (1º do mês 00:00)
   └─ Conteúdo: DRE, KPIs, comparativo


NOTIFICAÇÕES MANUAIS:
├─ Comando /status (Telegram)
│  └─ Resposta em tempo real
│
├─ Comando /alertas (Telegram)
│  └─ Lista de alertas pendentes
│
└─ Comando /whatif (Telegram)
   └─ Simulação de cenário
```

---

## 8. Arquitetura Geral

### 8.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React)                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages:                                              │  │
│  │  - CommissionsPage (Receitas)                        │  │
│  │  - CashRegisterPage (Caixa)                          │  │
│  │  - DREPage (DRE)                                     │  │
│  │  - RelatoriosPage (Relatórios)                       │  │
│  │  - FinanceiroAdvancedPage (Financeiro)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hooks:                                              │  │
│  │  - useCommissions, useTransactions                   │  │
│  │  - React Query (TanStack Query)                      │  │
│  │  - Context API (UnitContext, AuthContext)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Clients:                                        │  │
│  │  - Supabase JS Client                               │  │
│  │  - Axios (fallback)                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┬───────────────────┘
                                          │ HTTPS
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│             BACKEND (Next.js + TypeScript)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (app/api/):                              │  │
│  │  - /revenues/* (CRUD de receitas)                    │  │
│  │  - /expenses/* (CRUD de despesas)                    │  │
│  │  - /commissions/* (CRUD de comissões)                │  │
│  │  - /telegram/webhook (Webhook do Telegram)           │  │
│  │  - /cron/* (Jobs cronometrados)                      │  │
│  │  - /ai/* (Endpoints de IA)                           │  │
│  │  - /reports/* (Relatórios)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Core Libraries:                                     │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Analytics (lib/analytics/):                  │  │  │
│  │  │  - etl.ts (Extract-Transform-Load)           │  │  │
│  │  │  - calculations.ts (KPI calculations)        │  │  │
│  │  │  - anomalies.ts (Detecção de anomalias)     │  │  │
│  │  │  - validateBalance.ts (Validação de saldo)  │  │  │
│  │  │  - cashflowForecast.ts (Previsão fluxo)     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  AI Integration (lib/ai/):                    │  │  │
│  │  │  - openai.ts (Chamadas à API)                │  │  │
│  │  │  - analysis.ts (Geração de análises)        │  │  │
│  │  │  - prompts.ts (Prompts templates)           │  │  │
│  │  │  - anonymization.ts (Anonimização de dados) │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Telegram (lib/telegram/):                    │  │  │
│  │  │  - telegram.ts (Envio de mensagens)          │  │  │
│  │  │  - commands.ts (Handlers de comandos)        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Repositories (lib/repositories/):            │  │  │
│  │  │  - aiMetricsRepository.ts                    │  │  │
│  │  │  - alertsRepository.ts                       │  │  │
│  │  │  - kpiTargetsRepository.ts                   │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Services (lib/services/):                    │  │  │
│  │  │  - revenueCategorizationService.ts           │  │  │
│  │  │  - revenueComparison.ts                      │  │  │
│  │  │  - goalTracking.ts                           │  │  │
│  │  │  - reportLearning.ts                         │  │  │
│  │  │  - recurringExpenseNotifications.ts          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Middleware (lib/middleware/):                │  │  │
│  │  │  - cronAuth.ts (Autenticação de crons)      │  │  │
│  │  │  - rateLimit.ts (Rate limiting)             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Utilities (lib/):                            │  │  │
│  │  │  - cache.ts (Cache OpenAI com TTL)           │  │  │
│  │  │  - idempotency.ts (Controle idempotência)    │  │  │
│  │  │  - retry.ts (Retry com backoff)              │  │  │
│  │  │  - circuitBreaker.ts (Circuit breaker)       │  │  │
│  │  │  - logger.ts (Logging estruturado)           │  │  │
│  │  │  - monitoring.ts (Monitoramento)             │  │  │
│  │  │  - parallelProcessing.ts (Batch processing)  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                       │                                      │
└───────────┬───────────┼───────────┬──────────────────────────┘
            │           │           │
            ▼           ▼           ▼
     ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
     │  SUPABASE   │ │  OPENAI API  │ │ TELEGRAM API │
     │  PostgreSQL │ │              │ │              │
     │  + RLS      │ │ gpt-4o-mini  │ │ Bot messages │
     │  + Storage  │ │ gpt-4        │ │ Webhooks     │
     │             │ │              │ │              │
     │ Tables:     │ │ Endpoints:   │ │              │
     │ - revenues  │ │ /v1/chat/    │ │ Endpoints:   │
     │ - expenses  │ │ completions  │ │ /sendMessage │
     │ - ai_metrics│ │              │ │ /setWebhook  │
     │ - alerts    │ │ Features:    │ │              │
     │ - etl_runs  │ │ - Caching    │ │ Features:    │
     │ - units     │ │ - Anon. data │ │ - Commands   │
     │ - categories│ │ - Cost track │ │ - Callbacks  │
     │ - bank_acc. │ │              │ │              │
     └─────────────┘ └──────────────┘ └──────────────┘
```

### 8.2 Fluxo de Dados Geral

```
USER ACTIONS
    │
    ├─ Preenche formulário
    ├─ Submete dados
    └─ Consulta relatórios
         │
         ▼
    ┌──────────────────────┐
    │  Frontend (React)     │
    │  - Validação local   │
    │  - State management  │
    │  - UI/UX             │
    └──────────┬───────────┘
               │ HTTP Request
               ▼
    ┌──────────────────────┐
    │  API Endpoint        │
    │  (Next.js)           │
    │  - Validação         │
    │  - Autenticação      │
    │  - Autorização       │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Supabase            │
    │  - PostgreSQL        │
    │  - RLS Policies      │
    │  - Índices           │
    └──────────┬───────────┘
               │
               ├─────────────┬─────────────┐
               │             │             │
               ▼             ▼             ▼
    ┌──────────────┐ ┌───────────┐ ┌─────────────┐
    │ Dados salvos │ │ ETL Diário│ │    Cache    │
    │              │ │  (03:00)  │ │  OpenAI     │
    │ Tabelas:     │ │           │ │             │
    │ - revenues   │ │ Extract → │ │ TTL: 24h    │
    │ - expenses   │ │ Transform │ │             │
    │              │ │ Load →    │ │ Reduz:      │
    │              │ │ Anomalies │ │ - Custo     │
    │              │ │           │ │ - Latência  │
    │              │ │ Output:   │ │ - Requisições
    │              │ │ ai_metrics│ │             │
    │              │ │ alerts    │ │             │
    └──────────────┘ └──────────┘ └─────────────┘
               │
               └────────────┬────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  CRON JOBS (Vercel)     │
              │                         │
              │  ✓ ETL Diário (03:00)   │
              │  ✓ Relatório Diário     │
              │    (21:00)              │
              │  ✓ Enviar Alertas       │
              │    (*/15)               │
              │  ✓ Rel. Semanal (06:00) │
              │  ✓ Validar Saldo (04:00)│
              │  ✓ Despesas Rec. (08:00)│
              │  ✓ Fechamento (00:00    │
              │    1º mês)              │
              └────────────┬────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  EXTERNAL INTEGRATIONS   │
              │                          │
              │  ┌────────────────────┐  │
              │  │   OpenAI API       │  │
              │  │                    │  │
              │  │ Análises:          │  │
              │  │ - Weekly           │  │
              │  │ - Monthly          │  │
              │  │ - Alerts           │  │
              │  │ - What-if          │  │
              │  │                    │  │
              │  │ Output: Insights   │  │
              │  └────────────────────┘  │
              │                          │
              │  ┌────────────────────┐  │
              │  │  Telegram Bot      │  │
              │  │                    │  │
              │  │ Recebe:            │  │
              │  │ - Alertas          │  │
              │  │ - Relatórios       │  │
              │  │ - Notificações     │  │
              │  │                    │  │
              │  │ Responde:          │  │
              │  │ - /status          │  │
              │  │ - /semanal         │  │
              │  │ - /alertas         │  │
              │  │ - /whatif          │  │
              │  └────────────────────┘  │
              └──────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────────┐
              │    USER NOTIFICATIONS    │
              │                          │
              │  - Telegram              │
              │  - Toast (Frontend)      │
              │  - Alerts (UI)           │
              └──────────────────────────┘
```

### 8.3 Segurança e Proteções

```
AUTENTICAÇÃO:
├─ JWT via Supabase Auth
├─ Session management
├─ API key para cron jobs (CRON_SECRET)
└─ Telegram webhook secret

AUTORIZAÇÃO:
├─ RLS (Row Level Security)
│  ├─ Usuário vê apenas suas unidades
│  ├─ Cada unidade isolada no banco
│  └─ Queries filtram por auth.uid()
└─ Permissões por role (admin, manager, etc)

PROTEÇÃO DE API:
├─ Rate limiting
│  ├─ Por IP
│  ├─ Por usuário
│  └─ Global
├─ Validação de input (class-validator)
├─ Sanitização (DOMPurify)
└─ CORS configurado

PROTEÇÃO DE JOBS:
├─ Idempotência (evita execução duplicada)
├─ Circuit breaker (proteção contra falhas)
├─ Retry com backoff (recuperação de erros)
├─ Timeout enforcement
└─ Structured logging (rastreabilidade)

PROTEÇÃO DE DADOS SENSÍVEIS:
├─ Anonimização para OpenAI
│  ├─ Remove IDs específicos
│  ├─ Remove nomes da unidade
│  └─ Mantém apenas agregados
├─ Cache com TTL
│  ├─ 24 horas para análises
│  └─ Reduz exposição
└─ Masking de informações no log

MONITORAMENTO:
├─ Logging estruturado
│  ├─ correlationId para rastreamento
│  ├─ Timestamps em UTC
│  ├─ Severidade (info, warn, error)
│  └─ Stack traces para erros
├─ Métricas de performance
│  ├─ Duração de jobs
│  ├─ Sucesso/falha rates
│  └─ Custo OpenAI
└─ Alertas em caso de anomalias
```

### 8.4 Scalability Considerations

```
DATABASES:
├─ Índices estratégicos
│  ├─ (unit_id, date) para queries comuns
│  ├─ (status) para filtros
│  └─ source_hash para deduplicação
├─ Particionamento (se volume > 10M registros)
│  └─ Por mês e unidade
└─ Archival (dados > 2 anos para cold storage)

CACHING:
├─ Application cache (openai_cache)
│  ├─ TTL: 24 horas
│  ├─ Reduz 60% das chamadas OpenAI
│  └─ Economiza ~$100/mês
├─ Query cache (Supabase)
├─ Frontend cache (React Query)
│  ├─ Stale-while-revalidate
│  └─ Background refetch
└─ CDN para assets estáticos

BATCH PROCESSING:
├─ BATCH_SIZE = 5 unidades por vez
├─ Processamento paralelo
├─ Evita timeouts de Vercel (máx 60s)
└─ Escalável para 1000s de unidades

QUEUE SYSTEM (Future):
├─ Bull/BullMQ para jobs complexos
├─ Redis para estado de jobs
├─ Retry automático com backoff
└─ Dead letter queue para falhas persistentes

API LIMITS:
├─ OpenAI
│  ├─ Rate limit: 10 req/min (standard)
│  ├─ Token limit: 2000/request
│  └─ Custo controle via billing
├─ Telegram
│  ├─ Rate limit: 30 msg/segundo
│  └─ Batch sends em queues
└─ Supabase
   ├─ Connection pooling
   ├─ Query optimization
   └─ Realtime subscriptions (limitadas)
```

---

## Resumo Executivo

Este documento mapeia o fluxo completo de dados do sistema Barber Analytics Pro:

1. **Frontend** coleta dados via formulários React
2. **APIs** validam, autenticam e persistem dados em Supabase
3. **Cron Jobs** (Vercel) executam processamento batch:
   - ETL: Extrai, transforma e carrega métricas
   - Alertas: Detecta anomalias automaticamente
   - Relatórios: Gera análises com OpenAI
4. **Notificações** são enviadas via Telegram
5. **Integrações** com OpenAI fornecem insights com IA
6. **Segurança** em múltiplas camadas (Auth, RLS, Validação, Rate limiting)

O sistema processa dados em tempo real para frontend e em batches para analytics backend, garantindo performance e escalabilidade mesmo com múltiplas unidades e milhares de transações diárias.

