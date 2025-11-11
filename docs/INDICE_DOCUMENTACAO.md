# Índice de Documentação - Mapeamento de Fluxo de Dados

## Arquivos Criados

### 1. **MAPEAMENTO_FLUXO_DADOS.md** (95 KB)
Documento técnico completo e detalhado com todas as informações do sistema.

**Conteúdo:**
- Seção 1: Fluxo Frontend para Backend (10 min de leitura)
- Seção 2: Processamento Backend e Banco de Dados (15 min)
- Seção 3: Processamento de Cron Jobs (20 min)
- Seção 4: Integrações OpenAI e Telegram (15 min)
- Seção 5: Ciclo de Vida de Receita/Despesa (12 min)
- Seção 6: Ciclo de Vida do ETL Diário (18 min)
- Seção 7: Sistema de Notificações (10 min)
- Seção 8: Arquitetura Geral (20 min)

**Total: 1500+ linhas, diagramas ASCII, exemplos práticos**

### 2. **MAPEAMENTO_RESUMO.txt** (22 KB)
Resumo executivo com pontos-chave e estatísticas.

**Conteúdo:**
- Fluxo rápido de 30 segundos
- Cronograma de jobs
- Principais componentes
- Tabelas do banco
- Segurança
- Performance
- Como usar os documentos
- Próximos passos recomendados

### 3. **INDICE_DOCUMENTACAO.md** (este arquivo)
Guia para navegar pela documentação.

---

## Como Começar

### Se você tem 5 minutos
Leia: `MAPEAMENTO_RESUMO.txt` seção "FLUXO RÁPIDO DE 30 SEGUNDOS"

### Se você tem 30 minutos
1. Leia: `MAPEAMENTO_RESUMO.txt` completo
2. Veja: `MAPEAMENTO_FLUXO_DADOS.md` seção 1 e 8

### Se você tem 2 horas
1. Leia: `MAPEAMENTO_FLUXO_DADOS.md` completo
2. Reserve tempo para consultar código nos arquivos listados

### Se você é desenvolvedor
1. Leia: Seções 2, 3, 4 do `MAPEAMENTO_FLUXO_DADOS.md`
2. Consulte arquivos-chave do código
3. Implemente novos features baseado em padrões documentados

---

## Mapa de Conteúdo

### Frontend → Backend
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 1)
**Tópicos:**
- CommissionsPage, CashRegisterPage
- React Hook Form + Validação
- APIs Next.js
- Supabase RLS
- React Query cache

**Código-referência:**
- `/src/pages/CommissionsPage.jsx`
- `/src/organisms/CommissionFormModal.jsx`
- `/app/api/revenues/*`

### Banco de Dados
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 2)
**Tópicos:**
- Estrutura de tabelas (revenues, expenses, ai_metrics_daily)
- Índices e performance
- Row Level Security (RLS)

**Código-referência:**
- `/supabase/migrations/*.sql`
- `/lib/repositories/*`

### Cron Jobs
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 3)
**Tópicos:**
- Cronograma (8 jobs)
- Fluxo geral de execução
- ETL Pipeline
- Idempotência

**Código-referência:**
- `/app/api/cron/etl-diario/route.ts`
- `/app/api/cron/enviar-alertas/route.ts`
- `/lib/analytics/etl.ts`
- `/lib/idempotency.ts`

### Integrações
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 4)
**Tópicos:**
- OpenAI (gpt-4o-mini)
- Cache inteligente (60% economia)
- Telegram Bot
- Webhook

**Código-referência:**
- `/lib/ai/openai.ts`
- `/lib/ai/analysis.ts`
- `/lib/telegram.ts`
- `/app/api/telegram/webhook/route.ts`
- `/lib/cache.ts`

### Ciclo de Vida
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 5)
**Tópicos:**
- Status de receitas (Pending → Received)
- Status de despesas (pending → paid)
- Transições de estado
- Soft delete

### ETL Pipeline
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 6)
**Tópicos:**
- Timeline (03:00 BRT)
- 4 fases: Extract, Transform, Load, Anomaly
- Batch processing
- Performance metrics

### Notificações
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 7)
**Tópicos:**
- Tipos de alertas
- Fluxo completo
- Severidade
- Formatação Markdown

**Código-referência:**
- `/lib/services/recurringExpenseNotifications.ts`

### Arquitetura Geral
**Arquivo:** MAPEAMENTO_FLUXO_DADOS.md (Seção 8)
**Tópicos:**
- Componentes principais
- Fluxo de dados geral
- Segurança (múltiplas camadas)
- Escalabilidade
- Performance

---

## Quick Reference

### Fluxo de uma Receita
1. Usuário cria no frontend → CommissionsPage
2. POST /api/revenues/create
3. INSERT INTO revenues (status='Pending')
4. ETL Diário (03:00) processa
5. Salva em ai_metrics_daily
6. Detecção de anomalias
7. Alertas criados se necessário
8. Relatório Diário (21:00)
9. Telegram notifica

**Tempo total:** 30 horas (do input até relatório)

### Fluxo de um Alerta
1. ETL detecta anomalia
2. INSERT INTO alerts_events (status='OPEN')
3. Cron: enviar-alertas (*/15)
4. sendTelegramAlert()
5. UPDATE status='ACKNOWLEDGED'
6. Usuário recebe no Telegram

**Tempo total:** 0-15 minutos

### Fluxo de uma Análise OpenAI
1. generateAnalysis(unitId, metrics)
2. Anonimizar dados
3. Verificar cache (24h TTL)
4. Se miss: chamar OpenAI
5. Processar resposta
6. Salvar em cache
7. Retornar resultado

**Tempo total:** 2-5 segundos (sem cache)

---

## Tópicos Importantes

### Segurança
- **Autenticação:** JWT via Supabase
- **Autorização:** RLS Policies (unit_id isolation)
- **Rate Limiting:** Por IP, usuário, global
- **Anonimização:** Dados removidos para OpenAI
- **Proteção de Jobs:** Idempotência, Circuit Breaker

### Performance
- **ETL:** 30-40 segundos (5 unidades)
- **OpenAI Cache:** 60% economia de custo
- **Telegram:** <1 segundo de latência
- **Database:** Índices em (unit_id, date)

### Escalabilidade
- **Batch Processing:** BATCH_SIZE=5
- **Parallelização:** 5 unidades por vez
- **Archival:** Dados >2 anos
- **Queue System:** Future enhancement

---

## Arquivos-Chave do Código

### ETL
- `/lib/analytics/etl.ts` - Pipeline principal
- `/app/api/cron/etl-diario/route.ts` - Orchestration
- `/lib/analytics/calculations.ts` - Cálculos KPI
- `/lib/analytics/anomalies.ts` - Detecção

### OpenAI
- `/lib/ai/openai.ts` - API calls
- `/lib/ai/analysis.ts` - Analysis logic
- `/lib/cache.ts` - Cache management
- `/lib/ai/prompts.ts` - Prompt templates

### Telegram
- `/lib/telegram.ts` - Envio de mensagens
- `/lib/telegram/commands.ts` - Handlers de comandos
- `/app/api/telegram/webhook/route.ts` - Webhook

### Cron Jobs
- `/app/api/cron/etl-diario/route.ts`
- `/app/api/cron/enviar-alertas/route.ts`
- `/app/api/cron/relatorio-diario/route.ts`
- `/app/api/cron/relatorio-semanal/route.ts`
- `/app/api/cron/gerar-despesas-recorrentes/route.ts`
- `/app/api/cron/validate-balance/route.ts`
- `/app/api/cron/fechamento-mensal/route.ts`

### Utilidades
- `/lib/idempotency.ts` - Evita execução duplicada
- `/lib/retry.ts` - Retry com backoff
- `/lib/circuitBreaker.ts` - Circuit breaker
- `/lib/parallelProcessing.ts` - Batch processing

### Banco de Dados
- `/supabase/migrations/20251022000001_financial_module_complete_schema.sql`

---

## Exemplo: Adicionar Novo Cron Job

1. **Criar arquivo:** `/app/api/cron/[nome]/route.ts`
2. **Estrutura padrão:**
   ```typescript
   // 1. Validar autenticação (cronAuthMiddleware)
   // 2. Criar correlationId para logging
   // 3. Verificar idempotência
   // 4. Criar registro em etl_runs (status=RUNNING)
   // 5. Executar lógica
   // 6. Atualizar etl_runs (status=SUCCESS/FAILED)
   // 7. Retornar JSON com resultado
   ```
3. **Exemplo:** Veja `/app/api/cron/etl-diario/route.ts`

---

## Debugging

### Problema: ETL falhou
**Passos:**
1. Verifique `etl_runs` table (status=FAILED)
2. Veja `error_message` field
3. Procure correlationId nos logs
4. Verifique `revenues` e `expenses` da data

### Problema: Alerta não foi enviado
**Passos:**
1. Verifique `alerts_events` (status=OPEN)
2. Procure o alerta específico
3. Verifique Telegram token/chat_id
4. Procure erros em `send-alerts-*` logs

### Problema: OpenAI chamada custosa
**Passos:**
1. Verifique `openai_cache` (cache_key match)
2. Procure TTL expirado (24h)
3. Verifique `openai_cost_tracking`
4. Considere aumentar BATCH_SIZE

---

## Contato & Suporte

Para dúvidas sobre o mapeamento:
- Consulte `/MAPEAMENTO_FLUXO_DADOS.md` (detalhes)
- Consulte `/MAPEAMENTO_RESUMO.txt` (resumo)
- Procure código-referência nos arquivos listados

---

## Histórico de Atualizações

**v1.0 - 11 de Novembro de 2025**
- Criação inicial do mapeamento
- 2 arquivos principais
- 8 seções técnicas
- 1500+ linhas de documentação

---

## Próximos Passos

1. Revisar este índice regularmente
2. Atualizar documentação quando mudar arquitetura
3. Adicionar exemplos específicos do seu caso de uso
4. Considerar screencasts para fluxos visuais

**Tempo estimado para ler tudo:** 2-3 horas

---

*Documento gerado: 11 de Novembro de 2025*
*Versão: 1.0*
