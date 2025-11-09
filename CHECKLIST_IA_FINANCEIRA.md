# 📋 CHECKLIST DE IMPLEMENTAÇÃO — IA FINANCEIRA

## Barber Analytics Pro — Inteligência Financeira Integrada

**Versão:** 1.0.0
**Data:** 8 de novembro de 2025
**Autor:** Andrey Viana
**Baseado em:** INFRASTRUCTURE_v4.0.md, Módulos Financeiro e Pagamentos, Arquitetura Clean + DDD

---

## 🎯 Objetivo

Implementar sistema completo de análise financeira com IA (GPT-5/GPT-4o) para monitorar, prever e alertar sobre saúde financeira das unidades Mangabeiras e Nova Lima da Trato de Barbados.

---

## 📦 1. PREPARAÇÃO DE AMBIENTE E REPOSITÓRIO

### 1.1 Configuração Inicial

- [ ] **1.1.1** Revisar e validar conexão com Supabase
  - **Tecnologia:** Supabase Client (`@supabase/supabase-js`)
  - **Dependências:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` configuradas
  - **Critério:** Teste de conexão retorna `{ connected: true }`
  - **Arquivo:** `lib/supabase.ts`

- [ ] **1.1.2** Configurar variáveis de ambiente obrigatórias
  - **Tecnologia:** Vercel Environment Variables
  - **Variáveis:**
    - `OPENAI_API_KEY`
    - `OPENAI_MODEL` (padrão: `gpt-4o-mini`)
    - `OPENAI_MODEL_FALLBACK`
    - `OPENAI_COST_ALERT_THRESHOLD` (padrão: `80`)
    - `CRON_SECRET`
    - `TELEGRAM_BOT_TOKEN`
    - `TELEGRAM_CHAT_ID`
    - `HEALTH_CHECK_ENABLED` (padrão: `true`)
  - **Critério:** Todas as variáveis presentes e validadas via `/api/health`
  - **Arquivo:** `.env.example`, `vercel.json`

- [ ] **1.1.3** Criar branch de feature
  - **Comando:** `git checkout -b feature/ai-finance-integration`
  - **Critério:** Branch criada e sincronizada com `main`

- [ ] **1.1.4** Definir estrutura de diretórios
  - **Estrutura:**
    ```
    /app/api/cron/etl-diario/route.ts
    /app/api/cron/relatorio-semanal/route.ts
    /app/api/cron/fechamento-mensal/route.ts
    /app/api/cron/enviar-alertas/route.ts
    /app/api/cron/health-check/route.ts
    /app/api/kpis/health/route.ts
    /app/api/forecasts/cashflow/route.ts
    /app/api/alerts/query/route.ts
    /app/api/reports/weekly/route.ts
    /lib/ai/
      - openai.ts
      - prompts.ts
      - analysis.ts
    /lib/analytics/
      - etl.ts
      - calculations.ts
      - anomalies.ts
    ```
  - **Critério:** Estrutura criada e documentada

---

## 🗄️ 2. BANCO DE DADOS (SUPABASE)

### 2.1 Tabelas Auxiliares para IA

- [x] **2.1.1** Criar tabela `ai_metrics_daily` ✅
  - **Tecnologia:** PostgreSQL (Supabase)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Campos:**
    - `id` (UUID, PK)
    - `unit_id` (UUID, FK → units)
    - `date` (DATE)
    - `receita_bruta`, `despesas_totais`, `margem_percentual`, `ticket_medio`
    - `receitas_count`, `despesas_count`
    - `created_at`, `updated_at` (TIMESTAMPTZ)
  - **Índices:** `(unit_id, date DESC)`, `(date DESC)`
  - **RLS:** ✅ Configurado (SELECT por unit, INSERT/UPDATE/DELETE por admin)

- [x] **2.1.2** Criar tabela `forecasts_cashflow` ✅
  - **Tecnologia:** PostgreSQL (Supabase)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Campos:** `id`, `unit_id`, `forecast_date`, `receita_prevista`, `despesa_prevista`, `saldo_previsto`, `confidence_level`, `model_version`
  - **Índices:** `(unit_id, forecast_date ASC)`, `(forecast_date)`
  - **RLS:** ✅ Configurado (SELECT por unit, INSERT por admin)

- [x] **2.1.3** Criar tabela `alerts_events` ✅
  - **Tecnologia:** PostgreSQL (Supabase)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Campos:** `id`, `unit_id`, `alert_type`, `severity`, `message`, `metadata`, `status`, `created_at`, `resolved_at`
  - **Tipos de alerta:** `MARGEM_BAIXA`, `QUEDA_RECEITA`, `ANOMALIA`, `DESPESA_ALTA`
  - **Severidade:** `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - **RLS:** ✅ Configurado (SELECT por unit)

- [x] **2.1.4** Criar tabela `kpi_targets` ✅
  - **Tecnologia:** PostgreSQL (Supabase)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Campos:** `id`, `unit_id`, `kpi_name`, `target_value`, `period`, `start_date`, `end_date`, `is_active`, `created_by`
  - **KPI nomes:** `MARGEM`, `TICKET_MEDIO`, `RECEITA_MENSAL`, `DESPESA_MAXIMA`
  - **Períodos:** `MONTHLY`, `QUARTERLY`, `YEARLY`
  - **RLS:** ✅ Configurado (SELECT por unit, INSERT/UPDATE por admin)

- [x] **2.1.5** Criar tabela `etl_runs` ✅
  - **Tecnologia:** PostgreSQL (Supabase)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Campos:** `id`, `run_type`, `run_date`, `status`, `trigger_source`, `started_at`, `finished_at`, `duration_seconds`, `error_message`, `units_processed`, `records_inserted`, `records_updated`
  - **Tipos de execução:** `ETL_DIARIO`, `RELATORIO_SEMANAL`, `FECHAMENTO_MENSAL`
  - **Status:** `RUNNING`, `SUCCESS`, `FAILED`, `PARTIAL`
  - **Índices:** `(status, created_at DESC)`, `(run_type, run_date DESC)`, `(created_at DESC)`

- [ ] **2.1.6** Criar tabelas de cache e monitoramento (v4.0)
  - **Tecnologias:** `openai_cache`, `openai_cost_tracking`
  - **Dependências:** Migrations já criadas em `INFRASTRUCTURE_v4.0.md`
  - **Critério:** Migrations aplicadas e validadas
  - **Arquivos:**
    - `supabase/migrations/20241108000001_create_openai_cache.sql`
    - `supabase/migrations/20241108000002_create_openai_cost_tracking.sql`

### 2.2 Políticas RLS (Row Level Security)

- [x] **2.2.1** Implementar RLS em `ai_metrics_daily` ✅
  - **Tecnologia:** PostgreSQL RLS Policies
  - **Status:** ✅ IMPLEMENTADO
  - **Regra SELECT:** Usuários veem apenas métricas de suas unidades, admins veem todas
  - **Regra INSERT/UPDATE/DELETE:** Apenas admins

- [x] **2.2.2** Implementar RLS em `forecasts_cashflow` ✅
  - **Status:** ✅ IMPLEMENTADO
  - **Critério:** Mesma lógica de `ai_metrics_daily`

- [x] **2.2.3** Implementar RLS em `alerts_events` ✅
  - **Status:** ✅ IMPLEMENTADO
  - **Critério:** Usuários veem alertas de suas unidades, admins veem todos

- [x] **2.2.4** Implementar RLS em `kpi_targets` ✅
  - **Status:** ✅ IMPLEMENTADO
  - **Critério:** Apenas admins podem criar/editar, todos podem visualizar suas unidades

### 2.3 Views e Funções SQL

- [x] **2.3.1** Criar view `vw_ai_metrics_consolidated` ✅
  - **Tecnologia:** PostgreSQL View
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Propósito:** Consolidar métricas diárias com agregações semanais/mensais
  - **Funcionalidades:**
    - Agregações 7-dias (média móvel)
    - Agregações mensais (SUM)
    - Indicadores de tendência (YoY comparison)
    - Detecção de anomalias (z-score)
    - Comparação com targets KPI
  - **Colunas principais:** `metric_id`, `unit_id`, `metric_date`, `granularity`, `receita_bruta`, `despesas_totais`, `margem_percentual`, `receita_bruta_media_7d`, `despesas_media_7d`, `margem_media_7d`, `receita_bruta_mes`, `despesas_mes`, `receita_trend_percentual`, `margem_trend_pontos`, `performance_vs_target_percentual`, `anomalia_receita_detectada`
  - **Arquivo:** Criada inline via `pgsql_modify`

- [x] **2.3.2** Criar função `fn_calculate_kpis(unit_id, start_date, end_date)` ✅
  - **Tecnologia:** PostgreSQL Function (plpgsql)
  - **Status:** ✅ CRIADA COM SUCESSO
  - **Retorno:** JSON com KPIs calculados (estruturado)
  - **Parâmetros de entrada:** `unit_id` (UUID), `start_date` (DATE), `end_date` (DATE)
  - **Estrutura de retorno JSON:**
    - `periodo`: inicio, fim, dias_operacao
    - `metricas_receita`: receita_bruta, receita_media_diaria, numero_transacoes, ticket_medio, tendencia_percentual
    - `metricas_despesa`: despesas_totais, despesa_media_diaria, numero_despesas
    - `metricas_rentabilidade`: margem_percentual, margem_target, performance_vs_target_percentual, lucro_bruto
    - `timestamp`: moment of calculation
  - **Validações:** Verifica unit_id != NULL, end_date >= start_date, trata erros com JSON response
  - **Arquivo:** Criada inline via `pgsql_modify`

- [ ] **2.3.3** Validar view `vw_demonstrativo_fluxo` existente
  - **Dependências:** View já existe no módulo financeiro
  - **Critério:** View retorna dados corretos, performance < 500ms

---

## 🔄 3. ETL E CÁLCULOS (Danfo.js + Math.js)

### 3.1 Pipeline ETL Diário

- [ ] **3.1.1** Desenvolver função `etlDaily(unitId, runDate)`
  - **Tecnologia:** TypeScript, Danfo.js
  - **Localização:** `lib/analytics/etl.ts`
  - **Fluxo:**
    1. Buscar receitas do período (via `revenueRepository`)
    2. Buscar despesas do período (via `expenseRepository`)
    3. Criar DataFrame com Danfo.js
    4. Agrupar por data e unidade
    5. Calcular métricas consolidadas
    6. Salvar em `ai_metrics_daily`
  - **Dependências:** `revenueRepository`, `expenseRepository`, `aiMetricsRepository`
  - **Critério:** Função processa dados corretamente, salva métricas válidas
  - **Teste:** Executar com dados reais das unidades Mangabeiras e Nova Lima

- [ ] **3.1.2** Implementar processamento paralelo em batches
  - **Tecnologia:** `lib/parallelProcessing.ts` (v4.0)
  - **Configuração:** Batch size = 5 unidades
  - **Critério:** Processa múltiplas unidades simultaneamente sem timeout
  - **Uso:** `processInBatches(units, etlDaily, 5)`

- [ ] **3.1.3** Implementar idempotência no ETL
  - **Tecnologia:** `lib/idempotency.ts` (v4.0)
  - **Fluxo:**
    1. Verificar `ensureIdempotency('ETL_DIARIO', runDate)`
    2. Se `canProceed = false`, retornar early
    3. Criar registro em `etl_runs` com status `RUNNING`
    4. Processar unidades
    5. Atualizar status para `SUCCESS` ou `FAILED`
  - **Critério:** Não processa mesma data duas vezes, detecta execuções travadas

- [ ] **3.1.4** Implementar structured logging
  - **Tecnologia:** `lib/logger.ts` (v4.0)
  - **Campos:** `jobId`, `correlationId`, `unitId`, `runDate`
  - **Critério:** Logs estruturados aparecem no Vercel Logs com formato JSON

### 3.2 Cálculos de KPIs

- [ ] **3.2.1** Implementar cálculo de margem percentual
  - **Tecnologia:** Math.js
  - **Fórmula:** `(receita_liquida - despesas_totais) / receita_bruta * 100`
  - **Localização:** `lib/analytics/calculations.ts`
  - **Critério:** Cálculo correto para dados conhecidos

- [ ] **3.2.2** Implementar cálculo de ticket médio
  - **Fórmula:** `receita_bruta / numero_de_transacoes`
  - **Critério:** Validação com dados reais

- [ ] **3.2.3** Implementar cálculo de saldo acumulado
  - **Tecnologia:** Danfo.js (rolling sum)
  - **Critério:** Saldo acumulado bate com `vw_demonstrativo_fluxo`

- [ ] **3.2.4** Implementar forecast de fluxo de caixa
  - **Tecnologia:** Math.js (média móvel 30 dias)
  - **Algoritmo:** Média móvel simples + tendência linear
  - **Critério:** Previsões dentro de intervalo de confiança razoável

### 3.3 Detecção de Anomalias

- [ ] **3.3.1** Implementar detecção via z-score
  - **Tecnologia:** Math.js (mean, stdDev)
  - **Limite:** `|z-score| > 2` (2 desvios padrão)
  - **Localização:** `lib/analytics/anomalies.ts`
  - **Critério:** Detecta anomalias conhecidas em dados de teste

- [ ] **3.3.2** Implementar detecção de quedas significativas
  - **Regra:** Queda > 10% comparado com média dos últimos 7 dias
  - **Critério:** Gera alerta quando receita cai > 10%

- [ ] **3.3.3** Implementar detecção de margem abaixo do target
  - **Regra:** Margem < target definido em `kpi_targets`
  - **Critério:** Gera alerta quando margem < target

---

## 🔌 4. APIs (Next.js App Router)

### 4.1 Endpoint: `/api/kpis/health`

- [ ] **4.1.1** Criar rota `/app/api/kpis/health/route.ts`
  - **Método:** `GET`
  - **Autenticação:** Bearer JWT (Supabase Auth)
  - **Query Params:** `unitId`, `startDate`, `endDate`, `granularity`
  - **Retorno:** JSON com KPIs de saúde financeira
  - **Tecnologias:** Next.js 15, TypeScript, Supabase Client
  - **Critério:** Retorna KPIs corretos, valida permissões RLS
  - **Exemplo de resposta:**
    ```json
    {
      "receitaBruta": 50000,
      "despesasTotais": 35000,
      "margemPercentual": 30,
      "ticketMedio": 150,
      "tendencia": "CRESCENTE",
      "alerts": []
    }
    ```

- [ ] **4.1.2** Implementar cache de resposta
  - **Tecnologia:** TanStack Query (client-side) ou Supabase Cache
  - **TTL:** 5 minutos
  - **Critério:** Reduz chamadas ao banco em 80%

### 4.2 Endpoint: `/api/forecasts/cashflow`

- [ ] **4.2.1** Criar rota `/app/api/forecasts/cashflow/route.ts`
  - **Método:** `GET`
  - **Query Params:** `unitId`, `days` (padrão: 30)
  - **Retorno:** Array de previsões diárias
  - **Critério:** Retorna previsões válidas para próximos N dias

- [ ] **4.2.2** Integrar com função de forecast
  - **Dependências:** `lib/analytics/calculations.ts` → `calculateForecast()`
  - **Critério:** Previsões salvas em `forecasts_cashflow`

### 4.3 Endpoint: `/api/alerts/query`

- [ ] **4.3.1** Criar rota `/app/api/alerts/query/route.ts`
  - **Método:** `GET`
  - **Query Params:** `unitId`, `status`, `severity`, `startDate`, `endDate`
  - **Retorno:** Array de alertas filtrados
  - **Critério:** Retorna apenas alertas da unidade do usuário (RLS)

- [ ] **4.3.2** Implementar paginação
  - **Parâmetros:** `page`, `limit` (padrão: 20)
  - **Critério:** Paginação funciona corretamente

### 4.4 Endpoint: `/api/reports/weekly`

- [ ] **4.4.1** Criar rota `/app/api/reports/weekly/route.ts`
  - **Método:** `GET`
  - **Query Params:** `unitId`, `weekStartDate`
  - **Retorno:** Relatório semanal completo (métricas + análise IA)
  - **Critério:** Retorna relatório formatado com insights da IA

### 4.5 Autenticação e Segurança

- [ ] **4.5.1** Implementar middleware de autenticação
  - **Tecnologia:** `@supabase/auth-helpers-nextjs`
  - **Critério:** Rotas protegidas retornam 401 se não autenticado

- [ ] **4.5.2** Implementar rate limiting
  - **Limites:** 100 req/min por IP, 10 req/hora por usuário no Telegram
  - **Critério:** Rate limit funciona, retorna 429 quando excedido

- [ ] **4.5.3** Validar `CRON_SECRET` em rotas `/api/cron/*`
  - **Critério:** Rotas cron retornam 401 se secret inválido

---

## 🤖 5. IA (GPT-5 / GPT-4o)

### 5.1 Configuração OpenAI

- [ ] **5.1.1** Configurar SDK OpenAI
  - **Tecnologia:** `openai` (npm package v4.x)
  - **Localização:** `lib/ai/openai.ts`
  - **Configuração:**
    ```typescript
    import OpenAI from 'openai';
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    ```
  - **Critério:** Cliente inicializado, teste de conexão bem-sucedido

- [ ] **5.1.2** Implementar circuit breaker para OpenAI
  - **Tecnologia:** `lib/circuitBreaker.ts` (v4.0)
  - **Configuração:** `failureThreshold: 5`, `resetTimeout: 60000`
  - **Critério:** Circuit breaker abre após 5 falhas, fecha após 1 minuto

- [ ] **5.1.3** Implementar retry com backoff exponencial
  - **Tecnologia:** `lib/retry.ts` (v4.0)
  - **Configuração:** `maxAttempts: 3`, `initialDelay: 1000ms`
  - **Critério:** Retry funciona, não tenta novamente em erros 4xx

- [ ] **5.1.4** Implementar cache de análises
  - **Tecnologia:** `lib/cache.ts` (v4.0)
  - **TTL:** 24 horas
  - **Critério:** Cache reduz custos em 40-60%, análises similares retornam do cache

### 5.2 Prompts Principais

- [ ] **5.2.1** Criar prompt de análise semanal
  - **Localização:** `lib/ai/prompts.ts`
  - **Função:** `getWeeklyAnalysisPrompt(metrics)`
  - **Estrutura:**
    - Contexto: métricas da semana
    - Instruções: analisar tendências, identificar pontos fortes/fracos
    - Formato: JSON estruturado
  - **Critério:** Prompt gera análises coerentes e acionáveis

- [ ] **5.2.2** Criar prompt de alerta financeiro
  - **Função:** `getAlertPrompt(alertType, metrics)`
  - **Propósito:** Explicar causa do alerta e sugerir ações
  - **Critério:** Alertas têm explicação clara e recomendações práticas

- [ ] **5.2.3** Criar prompt de simulação (what-if)
  - **Função:** `getWhatIfPrompt(scenario, currentMetrics)`
  - **Exemplo:** "Se aumentarmos preço em 10%, qual impacto na receita?"
  - **Critério:** Simulações retornam resultados realistas

- [ ] **5.2.4** Criar prompt de sumário executivo mensal
  - **Função:** `getMonthlyExecutiveSummary(metrics)`
  - **Critério:** Sumário em português, máximo 500 palavras, foco em ações

### 5.3 Geração de Insights

- [ ] **5.3.1** Implementar função `generateAnalysis(unitId, metrics, promptType)`
  - **Localização:** `lib/ai/analysis.ts`
  - **Fluxo:**
    1. Verificar cache (`getCachedAnalysis()`)
    2. Se cache hit, retornar
    3. Se cache miss, chamar OpenAI com circuit breaker
    4. Salvar no cache (`setCachedAnalysis()`)
    5. Registrar custo (`trackOpenAICost()`)
  - **Critério:** Função completa o fluxo, trata erros corretamente

- [ ] **5.3.2** Implementar anonimização de dados
  - **Regra:** Remover PII (nomes, telefones, CPF) antes de enviar à OpenAI
  - **Localização:** `lib/ai/analysis.ts` → `anonymizeMetrics()`
  - **Critério:** Dados enviados não contêm PII

- [ ] **5.3.3** Implementar parsing de resposta JSON
  - **Validação:** Zod schema para resposta estruturada
  - **Critério:** Parsing funciona, retorna erro se formato inválido

### 5.4 Monitoramento de Custos

- [ ] **5.4.1** Implementar rastreamento de custos
  - **Tecnologia:** `lib/monitoring.ts` (v4.0)
  - **Função:** `trackOpenAICost(unitId, tokensUsed, model, costUSD)`
  - **Critério:** Custos registrados em `openai_cost_tracking`

- [ ] **5.4.2** Implementar alertas de custo
  - **Função:** `checkCostThreshold()`
  - **Critério:** Alerta Telegram quando custo >= 80% do threshold

---

## ⏰ 6. AUTOMAÇÃO (Vercel Cron)

### 6.1 Cron: ETL Diário

- [ ] **6.1.1** Criar rota `/app/api/cron/etl-diario/route.ts`
  - **Método:** `GET`
  - **Autenticação:** `CRON_SECRET` via header `Authorization: Bearer {secret}`
  - **Fluxo:**
    1. Verificar idempotência
    2. Criar registro `etl_runs`
    3. Buscar unidades ativas
    4. Processar em batches paralelos
    5. Atualizar status `etl_runs`
    6. Logging estruturado
  - **Critério:** Execução completa em < 10 minutos, idempotente

- [ ] **6.1.2** Configurar Vercel Cron
  - **Arquivo:** `vercel.json`
  - **Configuração:**
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/etl-diario",
          "schedule": "0 3 * * *"
        }
      ]
    }
    ```
  - **Critério:** Cron executa diariamente às 03:00 BRT

### 6.2 Cron: Relatório Semanal

- [ ] **6.2.1** Criar rota `/app/api/cron/relatorio-semanal/route.ts`
  - **Schedule:** `0 6 * * 1` (Segunda 06:00)
  - **Fluxo:**
    1. Buscar métricas da semana anterior
    2. Gerar análise via OpenAI
    3. Salvar relatório
    4. Enviar via Telegram
  - **Critério:** Relatório gerado e enviado corretamente

### 6.3 Cron: Fechamento Mensal

- [ ] **6.3.1** Criar rota `/app/api/cron/fechamento-mensal/route.ts`
  - **Schedule:** `0 7 1 * *` (Dia 1, 07:00)
  - **Fluxo:**
    1. Calcular DRE do mês anterior
    2. Gerar sumário executivo via OpenAI
    3. Comparar com targets (`kpi_targets`)
    4. Enviar relatório completo
  - **Critério:** DRE calculada corretamente, relatório completo

### 6.4 Cron: Envio de Alertas

- [ ] **6.4.1** Criar rota `/app/api/cron/enviar-alertas/route.ts`
  - **Schedule:** `*/15 * * * *` (A cada 15 minutos)
  - **Fluxo:**
    1. Buscar alertas pendentes (`status = 'OPEN'`)
    2. Enviar via Telegram
    3. Atualizar status para `ACKNOWLEDGED`
  - **Critério:** Alertas enviados, não duplicados

### 6.5 Cron: Health Check

- [ ] **6.5.1** Criar rota `/app/api/cron/health-check/route.ts`
  - **Schedule:** `*/5 * * * *` (A cada 5 minutos)
  - **Checks:**
    - Supabase conectividade
    - OpenAI quota/custos
    - Última execução de cron
    - Storage usage
  - **Critério:** Health check executa, dispara alertas quando necessário

---

## 📱 7. BOT DO TELEGRAM

### 7.1 Configuração do Bot

- [ ] **7.1.1** Criar bot no Telegram
  - **Ferramenta:** @BotFather no Telegram
  - **Critério:** Bot criado, token obtido

- [ ] **7.1.2** Configurar webhook
  - **Rota:** `/app/api/telegram/webhook/route.ts`
  - **Método:** `POST`
  - **Validação:** Verificar `TELEGRAM_BOT_TOKEN`
  - **Critério:** Webhook recebe updates do Telegram

### 7.2 Comandos do Bot

- [ ] **7.2.1** Implementar comando `/status`
  - **Ação:** Retorna saúde financeira atual da unidade
  - **Formato:** Markdown com KPIs principais
  - **Critério:** Comando retorna dados corretos

- [ ] **7.2.2** Implementar comando `/semanal`
  - **Ação:** Envia relatório semanal completo
  - **Formato:** Markdown + análise IA
  - **Critério:** Relatório completo e legível

- [ ] **7.2.3** Implementar comando `/alertas`
  - **Ação:** Lista alertas pendentes
  - **Formato:** Lista numerada com severidade
  - **Critério:** Lista apenas alertas da unidade do usuário

- [ ] **7.2.4** Implementar comando `/whatif`
  - **Sintaxe:** `/whatif <cenario>`
  - **Exemplo:** `/whatif aumentar preço em 10%`
  - **Ação:** Gera simulação via OpenAI
  - **Critério:** Simulação retorna resultados válidos

### 7.3 Envio de Alertas Automáticos

- [ ] **7.3.1** Implementar função `sendTelegramAlert(alert)`
  - **Localização:** `lib/telegram.ts`
  - **Tecnologia:** `node-telegram-bot-api`
  - **Formato:** Markdown com emojis de severidade
  - **Critério:** Alertas enviados corretamente, formato legível

- [ ] **7.3.2** Implementar circuit breaker para Telegram
  - **Tecnologia:** `lib/circuitBreaker.ts` → `telegramCircuitBreaker`
  - **Critério:** Circuit breaker protege contra falhas do Telegram

---

## 📊 8. DASHBOARDS (React + Recharts)

### 8.1 Página: Dashboard de Saúde Financeira

- [ ] **8.1.1** Criar página `/app/ia-financeira/saude/page.tsx`
  - **Tecnologia:** Next.js 15, React 19, TypeScript
  - **Componentes:**
    - Cards de KPI (Receita, Despesa, Margem, Ticket Médio)
    - Gráfico de linha (tendência de receita)
    - Gráfico de área (margem ao longo do tempo)
    - Tabela de alertas recentes
  - **Critério:** Página renderiza corretamente, dados carregam via TanStack Query

- [ ] **8.1.2** Implementar hook `useHealthKPIs(unitId, period)`
  - **Localização:** `hooks/useHealthKPIs.ts`
  - **Tecnologia:** TanStack Query v5
  - **Cache:** `staleTime: 5min`
  - **Critério:** Hook retorna dados, invalida cache quando necessário

- [ ] **8.1.3** Criar componente `HealthKPICard`
  - **Props:** `title`, `value`, `trend`, `target`
  - **Tecnologia:** TailwindCSS, Design System
  - **Critério:** Card responsivo, mostra tendência visual

### 8.2 Página: Dashboard de Fluxo de Caixa

- [ ] **8.2.1** Criar página `/app/ia-financeira/fluxo/page.tsx`
  - **Componentes:**
    - Gráfico de linha (saldo acumulado histórico)
    - Gráfico de área (previsão 30/60/90 dias)
    - Filtros: período, unidade, regime
  - **Critério:** Gráficos interativos, previsões visíveis

- [ ] **8.2.2** Implementar gráfico de previsão
  - **Tecnologia:** Recharts `AreaChart`
  - **Dados:** Histórico + `forecasts_cashflow`
  - **Critério:** Previsão visualmente distinta do histórico

### 8.3 Página: Dashboard de Alertas

- [ ] **8.3.1** Criar página `/app/ia-financeira/alertas/page.tsx`
  - **Componentes:**
    - Tabela de alertas com filtros
    - Filtros: status, severidade, período
    - Ações: marcar como resolvido
  - **Critério:** Tabela paginada, filtros funcionam

### 8.4 Componentes Reutilizáveis

- [ ] **8.4.1** Criar componente `KPICard`
  - **Localização:** `components/molecules/KPICard.tsx`
  - **Props:** `title`, `value`, `trend`, `icon`, `target`
  - **Critério:** Componente segue Design System, suporta dark mode

- [ ] **8.4.2** Criar componente `TrendChart`
  - **Tecnologia:** Recharts `LineChart`
  - **Props:** `data`, `xKey`, `yKey`, `color`
  - **Critério:** Gráfico responsivo, acessível

- [ ] **8.4.3** Criar componente `ForecastAreaChart`
  - **Tecnologia:** Recharts `AreaChart`
  - **Props:** `historicalData`, `forecastData`, `confidenceInterval`
  - **Critério:** Mostra intervalo de confiança visualmente

---

## 🧪 9. TESTES E QA

### 9.1 Testes Unitários

- [ ] **9.1.1** Testar cálculos de margem
  - **Arquivo:** `__tests__/analytics/calculations.spec.ts`
  - **Cenários:**
    - Margem positiva
    - Margem negativa
    - Margem zero
  - **Critério:** Todos os testes passam

- [ ] **9.1.2** Testar cálculo de ticket médio
  - **Critério:** Cálculo correto para diferentes volumes

- [ ] **9.1.3** Testar detecção de anomalias
  - **Critério:** Detecta anomalias conhecidas, não gera falsos positivos

- [ ] **9.1.4** Testar idempotência
  - **Arquivo:** `__tests__/lib/idempotency.spec.ts`
  - **Critério:** Não permite execuções duplicadas

- [ ] **9.1.5** Testar circuit breaker
  - **Arquivo:** `__tests__/lib/circuitBreaker.spec.ts`
  - **Critério:** Abre após threshold, fecha após timeout

- [ ] **9.1.6** Testar cache
  - **Arquivo:** `__tests__/lib/cache.spec.ts`
  - **Critério:** Cache funciona, TTL respeitado

### 9.2 Testes de Integração

- [ ] **9.2.1** Testar ETL completo
  - **Arquivo:** `__tests__/integration/etl.spec.ts`
  - **Cenário:** Executar ETL com dados de teste
  - **Critério:** Métricas salvas corretamente, idempotência funciona

- [ ] **9.2.2** Testar API `/api/kpis/health`
  - **Critério:** Retorna dados corretos, valida permissões

- [ ] **9.2.3** Testar integração OpenAI
  - **Mock:** Mockar chamadas OpenAI em testes
  - **Critério:** Análises geradas corretamente, cache funciona

- [ ] **9.2.4** Testar integração Telegram
  - **Mock:** Mockar API do Telegram
  - **Critério:** Mensagens enviadas corretamente

### 9.3 Testes de UI

- [ ] **9.3.1** Testar dashboard de saúde
  - **Ferramenta:** Playwright ou Cypress
  - **Critério:** Página carrega, dados exibidos corretamente

- [ ] **9.3.2** Testar responsividade
  - **Breakpoints:** Mobile, Tablet, Desktop
  - **Critério:** Layout responsivo em todos os tamanhos

- [ ] **9.3.3** Testar filtros e interações
  - **Critério:** Filtros funcionam, gráficos atualizam

### 9.4 Simulações de Falhas

- [ ] **9.4.1** Simular falha do Supabase
  - **Critério:** Sistema trata erro graciosamente, não quebra

- [ ] **9.4.2** Simular falha do OpenAI
  - **Critério:** Circuit breaker ativa, retry funciona

- [ ] **9.4.3** Simular timeout de cron
  - **Critério:** Execução marcada como falha, pode retry

- [ ] **9.4.4** Simular alertas falsos positivos
  - **Critério:** Sistema permite marcar como resolvido, não reenvia

---

## 🔒 10. SEGURANÇA E GOVERNANÇA

### 10.1 Row Level Security (RLS)

- [ ] **10.1.1** Validar RLS em todas as tabelas novas
  - **Tabelas:** `ai_metrics_daily`, `forecasts_cashflow`, `alerts_events`, `kpi_targets`
  - **Critério:** Usuários não conseguem acessar dados de outras unidades

- [ ] **10.1.2** Testar políticas RLS
  - **Cenários:**
    - Usuário barbeiro acessa apenas sua unidade
    - Admin acessa todas as unidades
    - Usuário sem unidade não acessa nada
  - **Critério:** Todos os cenários funcionam corretamente

### 10.2 Segredos e Credenciais

- [ ] **10.2.1** Centralizar segredos no Vercel
  - **Critério:** Nenhum secret hardcoded no código

- [ ] **10.2.2** Implementar rotação de secrets
  - **Frequência:** Trimestral
  - **Critério:** Processo documentado e executável

- [ ] **10.2.3** Validar uso de Service Role
  - **Regra:** Apenas em rotas server-side (`/api/cron/*`)
  - **Critério:** Service role não exposto no client

### 10.3 Auditoria e Logs

- [ ] **10.3.1** Implementar logging estruturado em todas as rotas críticas
  - **Tecnologia:** `lib/logger.ts` (v4.0)
  - **Campos:** `correlationId`, `jobId`, `userId`, `unitId`
  - **Critério:** Logs aparecem no Vercel Logs formatados

- [ ] **10.3.2** Criar tabela de auditoria (se não existir)
  - **Campos:** `user_id`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at`
  - **Critério:** Ações críticas registradas

- [ ] **10.3.3** Validar conformidade de dados (PII)
  - **Regra:** Dados enviados à OpenAI não contêm PII
  - **Função:** `anonymizeMetrics()` em `lib/ai/analysis.ts`
  - **Critério:** Teste manual confirma ausência de PII

### 10.4 Headers de Segurança

- [ ] **10.4.1** Configurar CSP em `vercel.json`
  - **Configuração:**
    ```json
    {
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "Content-Security-Policy",
              "value": "default-src 'self'; connect-src 'self' https://*.supabase.co https://api.openai.com"
            }
          ]
        }
      ]
    }
    ```
  - **Critério:** CSP configurado, não bloqueia recursos legítimos

- [ ] **10.4.2** Configurar HSTS
  - **Critério:** Header `Strict-Transport-Security` presente

---

## 🚀 11. ENTREGA E VALIDAÇÃO

### 11.1 Deploy em Staging

- [ ] **11.1.1** Criar ambiente de staging
  - **Ferramenta:** Vercel Preview Environment
  - **Critério:** Ambiente isolado com dados de teste

- [ ] **11.1.2** Aplicar migrations no staging
  - **Comando:** `supabase db push --db-url $STAGING_DB_URL`
  - **Critério:** Todas as migrations aplicadas

- [ ] **11.1.3** Configurar variáveis de ambiente no staging
  - **Critério:** Todas as variáveis configuradas

- [ ] **11.1.4** Executar checklist completo em staging
  - **Critério:** Todas as funcionalidades testadas

### 11.2 Validação com Dados Reais

- [ ] **11.2.1** Executar ETL com dados reais (backup)
  - **Critério:** ETL processa dados corretamente

- [ ] **11.2.2** Validar relatórios gerados
  - **Critério:** Relatórios coerentes com dados reais

- [ ] **11.2.3** Validar alertas gerados
  - **Critério:** Alertas relevantes, não falsos positivos

- [ ] **11.2.4** Validar custos OpenAI
  - **Critério:** Custos dentro do esperado, cache funcionando

### 11.3 Deploy em Produção

- [ ] **11.3.1** Merge para `main`
  - **Critério:** Code review aprovado, testes passando

- [ ] **11.3.2** Deploy automático via Vercel
  - **Critério:** Deploy bem-sucedido, sem erros

- [ ] **11.3.3** Aplicar migrations em produção
  - **Comando:** `supabase db push`
  - **Critério:** Migrations aplicadas, sem downtime

- [ ] **11.3.4** Validar cron jobs em produção
  - **Critério:** Cron jobs executam corretamente

### 11.4 Monitoramento Pós-Deploy

- [ ] **11.4.1** Monitorar logs por 48h
  - **Ferramenta:** Vercel Logs, Supabase Logs
  - **Critério:** Sem erros críticos

- [ ] **11.4.2** Monitorar custos OpenAI
  - **Ferramenta:** Dashboard OpenAI + `lib/monitoring.ts`
  - **Critério:** Custos dentro do esperado

- [ ] **11.4.3** Validar health checks
  - **Critério:** Health checks executam, alertas funcionam

- [ ] **11.4.4** Coletar feedback dos usuários
  - **Critério:** Feedback positivo, ajustes documentados

### 11.5 Documentação Final

- [ ] **11.5.1** Atualizar documentação técnica
  - **Arquivos:** `docs/04_MODULES/01_FINANCIAL.md`, `INFRASTRUCTURE_v4.0.md`
  - **Critério:** Documentação atualizada com novas funcionalidades

- [ ] **11.5.2** Criar guia de uso para usuários finais
  - **Critério:** Guia claro e visual

- [ ] **11.5.3** Documentar troubleshooting
  - **Critério:** Problemas comuns documentados com soluções

---

## ✅ CRITÉRIOS DE ACEITE FINAL

### Funcionalidades

- [ ] ✅ ETL diário executa automaticamente às 03:00 BRT
- [ ] ✅ Relatório semanal gerado e enviado via Telegram
- [ ] ✅ Alertas automáticos funcionando
- [ ] ✅ Dashboards exibem dados corretos
- [ ] ✅ Bot Telegram responde a todos os comandos
- [ ] ✅ Previsões de fluxo de caixa geradas corretamente
- [ ] ✅ Análises IA geradas e cacheadas

### Performance

- [ ] ✅ ETL completa em < 10 minutos
- [ ] ✅ APIs respondem em < 500ms (P95)
- [ ] ✅ Dashboards carregam em < 2 segundos
- [ ] ✅ Cache reduz custos OpenAI em 40-60%

### Segurança

- [ ] ✅ RLS funcionando em todas as tabelas
- [ ] ✅ Nenhum PII enviado à OpenAI
- [ ] ✅ Secrets centralizados no Vercel
- [ ] ✅ Rate limiting funcionando

### Observabilidade

- [ ] ✅ Logs estruturados em todas as rotas críticas
- [ ] ✅ Health checks executando a cada 5 minutos
- [ ] ✅ Alertas de custo funcionando
- [ ] ✅ Métricas disponíveis no dashboard

---

## 📝 NOTAS FINAIS

### Dependências Críticas

1. **Infraestrutura v4.0** deve estar implementada (idempotência, cache, circuit breaker)
2. **Módulo Financeiro** deve estar funcional (receitas, despesas, DRE)
3. **Módulo de Pagamentos** deve estar funcional (formas de pagamento, contas bancárias)

### Riscos e Mitigações

- **Risco:** Custos OpenAI elevados
  - **Mitigação:** Cache implementado, monitoramento ativo, alertas configurados

- **Risco:** Timeout em ETL
  - **Mitigação:** Processamento paralelo em batches, idempotência para retry

- **Risco:** Falhas silenciosas
  - **Mitigação:** Health checks automáticos, structured logging, alertas Telegram

### Próximos Passos Após Implementação

1. Coletar métricas de uso por 30 dias
2. Ajustar thresholds de alertas baseado em dados reais
3. Melhorar prompts da IA baseado em feedback
4. Adicionar mais KPIs conforme necessidade do negócio
5. Implementar notificações push (futuro)

---

**Fim do Checklist**

**Total de Tarefas:** ~150 itens
**Estimativa de Tempo:** 4-6 semanas (1 desenvolvedor full-time)
**Prioridade:** Alta
**Status:** 📋 Pronto para execução
