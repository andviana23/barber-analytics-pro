# ✅ Checklist de Implementação - Infraestrutura v4.0

**Versão:** 4.0
**Data de Criação:** 8 de novembro de 2025
**Baseado em:** INFRASTRUCTURE_v4.0.md

---

## 📋 Resumo Executivo

Este checklist garante a implementação completa de todas as melhorias de resiliência, observabilidade e performance descritas na documentação da Infraestrutura v4.0.

**Status Geral:** 🟡 Em Progresso

---

## 🔵 FASE 1: Preparação e Migrações SQL

### 1.1 Backup e Preparação

- [ ] **1.1.1** Criar backup completo do Supabase antes de iniciar
  - [ ] Backup do banco de dados via Supabase Dashboard
  - [ ] Exportar dados críticos (units, revenues, expenses)
  - [ ] Documentar versão atual do schema

- [ ] **1.1.2** Criar branch `infra/v4` para isolar mudanças
  ```bash
  git checkout -b infra/v4
  ```

### 1.2 Migrações SQL

- [ ] **1.2.1** Criar tabela `openai_cache`
  - [ ] Criar migration: `supabase/migrations/YYYYMMDDHHMMSS_create_openai_cache.sql`
  - [ ] Implementar estrutura conforme documentação:
    ```sql
    CREATE TABLE IF NOT EXISTS openai_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key VARCHAR(255) UNIQUE NOT NULL,
      response TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_cache_key ON openai_cache(cache_key);
    CREATE INDEX idx_created_at ON openai_cache(created_at);
    ```
  - [ ] Criar função de limpeza automática:
    ```sql
    CREATE OR REPLACE FUNCTION fn_cleanup_old_cache()
    RETURNS void AS $$
    BEGIN
      DELETE FROM openai_cache
      WHERE created_at < NOW() - INTERVAL '7 days';
    END;
    $$ LANGUAGE plpgsql;
    ```
  - [ ] Aplicar migration: `supabase db push`
  - [ ] Verificar criação da tabela e índices

- [ ] **1.2.2** Criar tabela `openai_cost_tracking`
  - [ ] Criar migration: `supabase/migrations/YYYYMMDDHHMMSS_create_openai_cost_tracking.sql`
  - [ ] Implementar estrutura conforme documentação:
    ```sql
    CREATE TABLE IF NOT EXISTS openai_cost_tracking (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID REFERENCES units(id),
      date DATE NOT NULL,
      tokens_used INTEGER NOT NULL,
      cost_usd DECIMAL(10, 4) NOT NULL,
      model VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_date ON openai_cost_tracking(date);
    CREATE INDEX idx_unit_date ON openai_cost_tracking(unit_id, date);
    ```
  - [ ] Aplicar migration: `supabase db push`
  - [ ] Verificar criação da tabela e índices

- [ ] **1.2.3** Verificar tabela `etl_runs` existe e tem estrutura correta
  - [ ] Verificar campos: `id`, `run_type`, `run_date`, `status`, `started_at`, `finished_at`, `error_message`
  - [ ] Se não existir, criar migration conforme necessário
  - [ ] Verificar índices em `run_type`, `run_date`, `status`

---

## 🔵 FASE 2: Bibliotecas Core (lib/)

### 2.1 Idempotência ✅

- [x] **2.1.1** Verificar `lib/idempotency.ts` existe e está completo
  - [x] Função `ensureIdempotency()` implementada
  - [x] Função `createRunRecord()` implementada
  - [x] Função `updateRunStatus()` implementada
  - [x] Tratamento de execuções travadas (>10min)
  - [x] Exportação correta de tipos e funções

### 2.2 Circuit Breaker ✅

- [x] **2.2.1** Verificar `lib/circuitBreaker.ts` existe e está completo
  - [x] Classe `CircuitBreaker` implementada
  - [x] Estados: `CLOSED`, `OPEN`, `HALF_OPEN`
  - [x] Instâncias singleton: `openaiCircuitBreaker`, `telegramCircuitBreaker`
  - [x] Métodos: `execute()`, `getState()`, `reset()`
  - [x] Configurações padrão conforme documentação

- [ ] **2.2.2** Integrar circuit breaker em `lib/ai/openai.ts`
  - [ ] Importar `openaiCircuitBreaker`
  - [ ] Envolver chamadas OpenAI com `openaiCircuitBreaker.execute()`
  - [ ] Tratar erros quando circuit breaker está OPEN
  - [ ] Adicionar logging quando circuit breaker abre/fecha

- [ ] **2.2.3** Integrar circuit breaker em `lib/telegram.ts`
  - [ ] Importar `telegramCircuitBreaker`
  - [ ] Envolver chamadas Telegram com `telegramCircuitBreaker.execute()`
  - [ ] Tratar erros quando circuit breaker está OPEN
  - [ ] Adicionar logging quando circuit breaker abre/fecha

### 2.3 Retry com Backoff Exponencial ✅

- [x] **2.3.1** Verificar `lib/retry.ts` existe e está completo
  - [x] Função `retryWithBackoff()` implementada
  - [x] Função `retryWithLogging()` implementada (se existir)
  - [x] Configurações: `maxAttempts`, `initialDelay`, `maxDelay`, `backoffMultiplier`
  - [x] Tratamento de erros retryable

- [ ] **2.3.2** Integrar retry em `lib/ai/openai.ts`
  - [ ] Usar `retryWithBackoff()` nas chamadas OpenAI
  - [ ] Configurar tentativas: 3, delay inicial: 1000ms, multiplier: 2
  - [ ] Tratar erros específicos (ECONNRESET, ETIMEDOUT, ENOTFOUND)

### 2.4 Cache Inteligente ✅

- [x] **2.4.1** Verificar `lib/cache.ts` existe e está completo
  - [x] Função `getCachedAnalysis()` implementada
  - [x] Função `setCachedAnalysis()` implementada
  - [x] Função `generateCacheKey()` implementada
  - [x] TTL padrão de 24 horas (86400 segundos)
  - [x] Limpeza automática de cache expirado

- [ ] **2.4.2** Integrar cache em `lib/ai/openai.ts`
  - [ ] Verificar cache antes de chamar OpenAI
  - [ ] Gerar cache key usando `generateCacheKey()`
  - [ ] Salvar resposta no cache após chamada bem-sucedida
  - [ ] Adicionar logging de cache hit/miss

### 2.5 Structured Logging ✅

- [x] **2.5.1** Verificar `lib/logger.ts` existe e está completo
  - [x] Classe `Logger` implementada
  - [x] Métodos: `info()`, `error()`, `warn()`, `debug()`
  - [x] Geração automática de `correlationId`
  - [x] Formato JSON estruturado
  - [x] Exportação de instância `logger`

- [ ] **2.5.2** Integrar logging em todos os cron jobs
  - [ ] `app/api/cron/etl-diario/route.ts` - ✅ Já implementado
  - [ ] `app/api/cron/relatorio-semanal/route.ts`
  - [ ] `app/api/cron/fechamento-mensal/route.ts`
  - [ ] `app/api/cron/enviar-alertas/route.ts`
  - [ ] `app/api/cron/gerar-despesas-recorrentes/route.ts`
  - [ ] `app/api/cron/health-check/route.ts`
  - [ ] Usar `correlationId` e `jobId` em todos os logs

### 2.6 Monitoramento de Custos ✅

- [x] **2.6.1** Verificar `lib/monitoring.ts` existe e está completo
  - [x] Função `trackOpenAICost()` implementada
  - [x] Função `getMonthlyOpenAICost()` implementada
  - [x] Função `checkCostThreshold()` implementada
  - [x] Integração com tabela `openai_cost_tracking`

- [ ] **2.6.2** Integrar tracking de custos em `lib/ai/openai.ts`
  - [ ] Capturar `tokens_used` e `cost_usd` da resposta OpenAI
  - [ ] Chamar `trackOpenAICost()` após cada chamada bem-sucedida
  - [ ] Verificar threshold antes de chamadas (opcional)
  - [ ] Adicionar logging de custos

### 2.7 Processamento Paralelo ✅

- [x] **2.7.1** Verificar `lib/parallelProcessing.ts` existe e está completo
  - [x] Função `processInBatches()` implementada
  - [x] Configuração de batch size (padrão: 5)
  - [x] Tratamento de erros por item

- [ ] **2.7.2** Integrar processamento paralelo no ETL
  - [ ] Usar `processInBatches()` em `app/api/cron/etl-diario/route.ts`
  - [ ] Processar unidades em batches de 5
  - [ ] Tratar erros individuais sem interromper batch completo
  - [ ] Adicionar logging de progresso por batch

---

## 🔵 FASE 3: Health Checks

### 3.1 Health Check Básico

- [ ] **3.1.1** Verificar `app/api/health/route.ts` existe
  - [ ] Verificar conectividade com Supabase
  - [ ] Verificar presença de env vars críticas
  - [ ] Retornar status 200 quando saudável
  - [ ] Retornar status 503 quando degradado

### 3.2 Health Check Detalhado

- [ ] **3.2.1** Criar `app/api/health/detailed/route.ts`
  - [ ] Implementar função `checkSupabaseHealth()`
    - [ ] Testar query simples (`SELECT id FROM units LIMIT 1`)
    - [ ] Medir latência
    - [ ] Retornar `{ healthy: boolean, latency?: number }`
  - [ ] Implementar função `checkOpenAIHealth()`
    - [ ] Verificar custo mensal via `getMonthlyOpenAICost()`
    - [ ] Comparar com threshold (`OPENAI_COST_ALERT_THRESHOLD`)
    - [ ] Retornar `{ healthy: boolean, quota?: number }`
  - [ ] Implementar função `checkLastCronExecution()`
    - [ ] Buscar último ETL executado com sucesso
    - [ ] Verificar se foi há menos de 25 horas
    - [ ] Retornar `{ healthy: boolean, lastRun?: string }`
  - [ ] Implementar função `checkStorageUsage()`
    - [ ] Verificar uso de storage do Supabase (se possível)
    - [ ] Retornar `{ healthy: boolean, usage?: number }`
  - [ ] Endpoint retorna JSON com status de todos os serviços
  - [ ] Proteger com autenticação (`CRON_SECRET`)

### 3.3 Health Check Automático (Cron)

- [ ] **3.3.1** Criar `app/api/cron/health-check/route.ts`
  - [ ] Executar todos os checks de saúde
  - [ ] Se algum serviço estiver degradado, enviar alerta Telegram
  - [ ] Logar resultados com structured logging
  - [ ] Retornar JSON com status e checks
  - [ ] Proteger com autenticação (`CRON_SECRET`)

- [ ] **3.3.2** Configurar cron job no Vercel
  - [ ] Adicionar em `vercel.json`:
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/health-check",
          "schedule": "*/5 * * * *"
        }
      ]
    }
    ```
  - [ ] Schedule: A cada 5 minutos (`*/5 * * * *`)
  - [ ] Timezone: `America/Sao_Paulo`
  - [ ] Verificar configuração no dashboard Vercel

---

## 🔵 FASE 4: Atualização de Cron Jobs

### 4.1 ETL Diário

- [x] **4.1.1** Verificar idempotência implementada ✅
  - [x] Chamada `ensureIdempotency()` antes de processar
  - [x] Early return se `canProceed = false`
  - [x] Criação de registro via `createRunRecord()`
  - [x] Atualização de status via `updateRunStatus()`

- [x] **4.1.2** Verificar structured logging implementado ✅
  - [x] Uso de `logger.info()`, `logger.error()`
  - [x] `correlationId` e `jobId` em todos os logs

- [ ] **4.1.3** Integrar cache OpenAI
  - [ ] Verificar cache antes de gerar análise
  - [ ] Salvar no cache após análise bem-sucedida
  - [ ] Logging de cache hit/miss

- [ ] **4.1.4** Integrar circuit breaker OpenAI
  - [ ] Envolver chamadas OpenAI com `openaiCircuitBreaker.execute()`
  - [ ] Tratar erro quando circuit breaker está OPEN
  - [ ] Logging quando circuit breaker abre/fecha

- [ ] **4.1.5** Integrar retry OpenAI
  - [ ] Usar `retryWithBackoff()` nas chamadas OpenAI
  - [ ] Configurar 3 tentativas com backoff exponencial

- [ ] **4.1.6** Integrar processamento paralelo
  - [ ] Usar `processInBatches()` para processar unidades
  - [ ] Batch size: 5 unidades
  - [ ] Tratamento de erros por unidade

- [ ] **4.1.7** Integrar tracking de custos
  - [ ] Capturar tokens e custo da resposta OpenAI
  - [ ] Chamar `trackOpenAICost()` após cada análise
  - [ ] Verificar threshold antes de processar (opcional)

### 4.2 Relatório Semanal

- [ ] **4.2.1** Implementar idempotência
  - [ ] Chamada `ensureIdempotency('RELATORIO_SEMANAL', runDate)`
  - [ ] Early return se já executado
  - [ ] Criação de registro via `createRunRecord()`

- [ ] **4.2.2** Implementar structured logging
  - [ ] Usar `logger` em todas as etapas
  - [ ] `correlationId` e `jobId` em todos os logs

- [ ] **4.2.3** Integrar cache, circuit breaker, retry e tracking de custos
  - [ ] Mesmas integrações do ETL diário

### 4.3 Fechamento Mensal

- [ ] **4.3.1** Implementar idempotência
  - [ ] Chamada `ensureIdempotency('FECHAMENTO_MENSAL', runDate)`
  - [ ] Early return se já executado
  - [ ] Criação de registro via `createRunRecord()`

- [ ] **4.3.2** Implementar structured logging
  - [ ] Usar `logger` em todas as etapas
  - [ ] `correlationId` e `jobId` em todos os logs

- [ ] **4.3.3** Integrar cache, circuit breaker, retry e tracking de custos
  - [ ] Mesmas integrações do ETL diário

### 4.4 Enviar Alertas

- [ ] **4.4.1** Implementar idempotência (se aplicável)
  - [ ] Decidir se precisa idempotência (pode executar múltiplas vezes)
  - [ ] Se sim, implementar verificação

- [ ] **4.4.2** Implementar structured logging
  - [ ] Usar `logger` em todas as etapas
  - [ ] `correlationId` e `jobId` em todos os logs

- [ ] **4.4.3** Integrar circuit breaker Telegram
  - [ ] Envolver chamadas Telegram com `telegramCircuitBreaker.execute()`
  - [ ] Tratar erro quando circuit breaker está OPEN

### 4.5 Gerar Despesas Recorrentes

- [x] **4.5.1** Verificar idempotência implementada ✅
  - [x] Chamada `ensureIdempotency()` antes de processar
  - [x] Early return se `canProceed = false`

- [x] **4.5.2** Verificar structured logging implementado ✅
  - [x] Uso de `logger` em todas as etapas

---

## 🔵 FASE 5: Configurações e Variáveis de Ambiente

### 5.1 Variáveis de Ambiente

- [ ] **5.1.1** Adicionar variáveis novas no `.env.example`
  - [ ] `CRON_SECRET=your-secret-key-here-change-me`
  - [ ] `OPENAI_COST_ALERT_THRESHOLD=80`
  - [ ] `HEALTH_CHECK_ENABLED=true`
  - [ ] `REDIS_URL=` (opcional)
  - [ ] `OPENAI_MODEL_FALLBACK=gpt-4o-mini`

- [ ] **5.1.2** Configurar variáveis no Vercel Dashboard
  - [ ] Production: Todas as variáveis
  - [ ] Preview: Todas as variáveis
  - [ ] Development: Variáveis locais (`.env.local`)

- [ ] **5.1.3** Gerar `CRON_SECRET` seguro
  - [ ] Gerar string aleatória de 32+ caracteres
  - [ ] Configurar no Vercel Dashboard
  - [ ] Documentar em local seguro (1Password, etc.)

### 5.2 Configuração Vercel (vercel.json)

- [ ] **5.2.1** Verificar headers de segurança
  - [ ] `Content-Security-Policy`
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options`
  - [ ] `Referrer-Policy`
  - [ ] `Permissions-Policy`

- [ ] **5.2.2** Verificar configuração de cron jobs
  - [ ] ETL Diário: `0 3 * * *` (America/Sao_Paulo)
  - [ ] Relatório Semanal: `0 6 * * 1` (Segunda 06:00)
  - [ ] Fechamento Mensal: `0 7 1 * *` (Dia 1, 07:00)
  - [ ] Enviar Alertas: `*/15 * * * *` (A cada 15min)
  - [ ] Health Check: `*/5 * * * *` (A cada 5min)

- [ ] **5.2.3** Verificar configuração de região
  - [ ] Região: `gru1` (Brasil) se disponível
  - [ ] Ou região mais próxima do Brasil

---

## 🔵 FASE 6: Dashboard de Saúde e Observabilidade

### 6.1 Dashboard de Saúde

- [ ] **6.1.1** Criar página `/app/admin/health/page.tsx`
  - [ ] Proteger com autenticação e role admin
  - [ ] Buscar dados de `/api/health/detailed`
  - [ ] Exibir status de cada serviço (Supabase, OpenAI, Telegram)
  - [ ] Exibir última execução de cada cron job
  - [ ] Exibir custos OpenAI do mês atual
  - [ ] Exibir métricas de performance (latência, taxa de erro)
  - [ ] Exibir alertas recentes
  - [ ] Atualização automática a cada 30 segundos

- [ ] **6.1.2** Criar componente de status visual
  - [ ] Indicadores coloridos (verde/amarelo/vermelho)
  - [ ] Cards para cada serviço
  - [ ] Gráficos de tendência (se possível)

### 6.2 Métricas Customizadas

- [ ] **6.2.1** Criar `lib/metrics.ts`
  - [ ] Interface `SystemMetrics`
  - [ ] Função `getSystemMetrics()`
  - [ ] Calcular `etlSuccessRate`
  - [ ] Calcular `averageETLDuration`
  - [ ] Calcular `openaiCacheHitRate`
  - [ ] Obter `circuitBreakerState`
  - [ ] Calcular `costSavingsFromCache`

- [ ] **6.2.2** Criar endpoint `/api/metrics`
  - [ ] Retornar métricas do sistema
  - [ ] Proteger com autenticação admin
  - [ ] Cachear resposta por 1 minuto

- [ ] **6.2.3** Integrar métricas no dashboard
  - [ ] Exibir métricas customizadas
  - [ ] Gráficos de tendência (se possível)

---

## 🔵 FASE 7: Testes e Validação

### 7.1 Testes Locais

- [ ] **7.1.1** Testar idempotência
  - [ ] Executar cron job duas vezes seguidas
  - [ ] Verificar que segunda execução é pulada
  - [ ] Verificar logs indicam skip

- [ ] **7.1.2** Testar circuit breaker
  - [ ] Simular falhas consecutivas (5+)
  - [ ] Verificar circuit breaker abre
  - [ ] Aguardar timeout e verificar tenta resetar
  - [ ] Simular sucesso e verificar fecha

- [ ] **7.1.3** Testar retry
  - [ ] Simular falha temporária
  - [ ] Verificar retry com backoff exponencial
  - [ ] Verificar sucesso após retry

- [ ] **7.1.4** Testar cache
  - [ ] Primeira chamada: cache miss, salva no cache
  - [ ] Segunda chamada: cache hit, retorna do cache
  - [ ] Verificar TTL funciona (aguardar expiração)

- [ ] **7.1.5** Testar health checks
  - [ ] Executar `/api/health` - deve retornar 200
  - [ ] Executar `/api/health/detailed` - deve retornar JSON completo
  - [ ] Executar `/api/cron/health-check` - deve verificar serviços

- [ ] **7.1.6** Testar processamento paralelo
  - [ ] Executar ETL com múltiplas unidades
  - [ ] Verificar processamento em batches
  - [ ] Verificar tratamento de erros individuais

### 7.2 Testes em Preview (Vercel)

- [ ] **7.2.1** Deploy em preview branch
  - [ ] Criar PR com branch `infra/v4`
  - [ ] Verificar deploy automático no Vercel
  - [ ] Verificar variáveis de ambiente configuradas

- [ ] **7.2.2** Testar cron jobs em preview
  - [ ] Executar manualmente cada cron job
  - [ ] Verificar logs no Vercel Logs
  - [ ] Verificar idempotência funciona
  - [ ] Verificar structured logging aparece

- [ ] **7.2.3** Testar health checks em preview
  - [ ] Executar health checks manualmente
  - [ ] Verificar alertas Telegram funcionam
  - [ ] Verificar dashboard de saúde (se criado)

### 7.3 Validação Final

- [ ] **7.3.1** Verificar todas as migrations aplicadas
  - [ ] Tabela `openai_cache` existe
  - [ ] Tabela `openai_cost_tracking` existe
  - [ ] Tabela `etl_runs` tem estrutura correta

- [ ] **7.3.2** Verificar todas as libs implementadas
  - [ ] `lib/idempotency.ts` ✅
  - [ ] `lib/circuitBreaker.ts` ✅
  - [ ] `lib/retry.ts` ✅
  - [ ] `lib/cache.ts` ✅
  - [ ] `lib/logger.ts` ✅
  - [ ] `lib/monitoring.ts` ✅
  - [ ] `lib/parallelProcessing.ts` ✅

- [ ] **7.3.3** Verificar integrações nos cron jobs
  - [ ] ETL Diário: todas as integrações ✅
  - [ ] Relatório Semanal: todas as integrações
  - [ ] Fechamento Mensal: todas as integrações
  - [ ] Enviar Alertas: circuit breaker Telegram
  - [ ] Gerar Despesas Recorrentes: idempotência ✅

- [ ] **7.3.4** Verificar health checks funcionando
  - [ ] `/api/health` retorna 200
  - [ ] `/api/health/detailed` retorna JSON completo
  - [ ] `/api/cron/health-check` executa a cada 5min
  - [ ] Alertas Telegram funcionam quando serviços degradados

---

## 🔵 FASE 8: Deploy e Monitoramento

### 8.1 Deploy em Produção

- [ ] **8.1.1** Merge da branch `infra/v4` para `main`
  - [ ] Revisar todas as mudanças
  - [ ] Verificar testes passaram
  - [ ] Fazer merge

- [ ] **8.1.2** Deploy automático no Vercel
  - [ ] Verificar deploy iniciou automaticamente
  - [ ] Monitorar logs do deploy
  - [ ] Verificar deploy concluído com sucesso

- [ ] **8.1.3** Verificar migrations aplicadas em produção
  - [ ] Conectar ao Supabase produção
  - [ ] Verificar tabelas criadas
  - [ ] Verificar índices criados

### 8.2 Monitoramento Pós-Deploy

- [ ] **8.2.1** Monitorar por 48 horas
  - [ ] Verificar logs do ETL diário
  - [ ] Verificar health checks executando
  - [ ] Verificar cache funcionando (redução de custos)
  - [ ] Verificar circuit breaker não abriu desnecessariamente
  - [ ] Verificar alertas Telegram funcionando

- [ ] **8.2.2** Validar métricas
  - [ ] Verificar dashboard de saúde (se criado)
  - [ ] Verificar custos OpenAI reduzidos
  - [ ] Verificar taxa de sucesso do ETL
  - [ ] Verificar cache hit rate

- [ ] **8.2.3** Documentar resultados
  - [ ] Redução de custos OpenAI (%)
  - [ ] Melhoria na taxa de sucesso do ETL (%)
  - [ ] Cache hit rate (%)
  - [ ] Tempo médio de execução do ETL

---

## 📊 Resumo de Progresso

### Status por Fase

- **FASE 1: Preparação e Migrações SQL** - 🟡 Em Progresso
- **FASE 2: Bibliotecas Core** - 🟢 85% Completo
- **FASE 3: Health Checks** - 🔴 Não Iniciado
- **FASE 4: Atualização de Cron Jobs** - 🟡 40% Completo
- **FASE 5: Configurações e Variáveis** - 🟡 Em Progresso
- **FASE 6: Dashboard de Saúde** - 🔴 Não Iniciado
- **FASE 7: Testes e Validação** - 🔴 Não Iniciado
- **FASE 8: Deploy e Monitoramento** - 🔴 Não Iniciado

### Próximos Passos Prioritários

1. ✅ Completar integrações nas libs existentes (circuit breaker, retry, cache)
2. ✅ Implementar health checks (básico, detalhado, cron)
3. ✅ Atualizar cron jobs restantes (relatório semanal, fechamento mensal)
4. ✅ Criar dashboard de saúde
5. ✅ Configurar variáveis de ambiente no Vercel
6. ✅ Testar tudo em preview antes de produção

---

## 📝 Notas Importantes

- **Idempotência**: Já implementada no ETL diário e gerar despesas recorrentes ✅
- **Structured Logging**: Já implementado no ETL diário ✅
- **Bibliotecas Core**: Todas as libs existem, falta integrar em alguns lugares
- **Cache**: Implementado, falta integrar no ETL
- **Circuit Breaker**: Implementado, falta integrar nas chamadas OpenAI e Telegram
- **Retry**: Implementado, falta integrar nas chamadas OpenAI
- **Processamento Paralelo**: Implementado, falta integrar no ETL

---

**Última atualização:** 8 de novembro de 2025
**Próxima revisão:** Após completar FASE 3

