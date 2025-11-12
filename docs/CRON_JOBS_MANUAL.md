# 🕐 Guia de Cron Jobs - Barber Analytics Pro

## ⚡ Status Atual: 11 Crons Automáticos Ativos

**Última atualização:** 12 de novembro de 2025

### ✅ TODOS OS CRONS ESTÃO ATIVOS E AUTOMATIZADOS VIA pg_cron

Os cron jobs estão configurados para executar automaticamente usando `pg_cron` do Supabase + `net.http_post` para chamar endpoints da API.

### ⚠️ MUDANÇA IMPORTANTE: DADOS DO DIA ANTERIOR (D-1)

Todos os relatórios agora processam dados do **DIA ANTERIOR** ao invés do dia atual:
- **Motivo:** Garantir que os dados estejam completos e fechados
- **Exemplo:** Cron das 21:00 de terça-feira envia relatório de segunda-feira

---

## 📊 Crons Diários

### 1. 📊 Relatório Diário de Receitas (21:00 BRT)

- **Endpoint:** `/api/cron/relatorio-diario`
- **Horário:** 21:00 todos os dias
- **Função:** Gera relatório do DIA ANTERIOR com análise de IA (ApoIA) e envia via Telegram
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 21 * * *`
- **Inclui:**
  - Categorização de receitas (assinaturas, produtos, avulso)
  - Comparação com semana anterior
  - Progresso das metas
  - Padrões comportamentais
  - Insights gerados por IA

### 2. 🔄 ETL Diário (03:00 BRT)

- **Endpoint:** `/api/cron/etl-diario`
- **Horário:** 03:00 todos os dias
- **Função:** Processa métricas e consolida dados analíticos
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 3 * * *`

### 3. ✅ Validar Saldos (04:00 BRT)

- **Endpoint:** `/api/cron/validate-balance`
- **Horário:** 04:00 todos os dias
- **Função:** Valida consistência dos saldos acumulados
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 4 * * *`

### 4. ❤️ Health Check (05:00 BRT)

- **Endpoint:** `/api/cron/health-check`
- **Horário:** 05:00 todos os dias
- **Função:** Verifica saúde do sistema e envia status
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 5 * * *`

### 5. 🔔 Enviar Alertas (22:00 BRT)

- **Endpoint:** `/api/cron/enviar-alertas`
- **Horário:** 22:00 todos os dias
- **Função:** Envia alertas de saúde e anomalias via Telegram
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 22 * * *`

### 6. 📋 Backup Diário Lista da Vez (23:30 BRT)

- **Função:** `fn_backup_turn_list('daily')`
- **Horário:** 23:30 todos os dias
- **Função:** Faz backup diário da Lista da Vez
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `30 23 * * *`

---

## 📅 Crons Semanais

### 7. 📅 Relatório Semanal (08:00 segundas-feiras)

- **Endpoint:** `/api/cron/relatorio-semanal`
- **Horário:** 08:00 toda segunda-feira
- **Função:** Gera relatório semanal consolidado
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 8 * * 1`

---

## 📆 Crons Mensais

### 8. � Gerar Despesas Recorrentes (02:00, dia 1)

- **Endpoint:** `/api/cron/gerar-despesas-recorrentes`
- **Horário:** 02:00 do dia 1 de cada mês
- **Função:** Gera automaticamente despesas recorrentes do mês
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 2 1 * *`

### 9. 🧹 Cleanup Backups (02:00, dia 1)

- **Função:** `fn_cleanup_old_backups(30)`
- **Horário:** 02:00 do dia 1 de cada mês
- **Função:** Remove backups antigos (>30 dias)
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 2 1 * *`

### 10. 📆 Fechamento Mensal (09:00, dia 1)

- **Endpoint:** `/api/cron/fechamento-mensal`
- **Horário:** 09:00 do dia 1 de cada mês
- **Função:** Gera relatório de fechamento mensal
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 9 1 * *`

### 11. 🔄 Reset Mensal Lista da Vez (23:00, fim do mês)

- **Função:** `fn_monthly_reset_turn_list()`
- **Horário:** 23:00 dos dias 28-31 (verifica se é último dia)
- **Função:** Reseta lista da vez no fim do mês
- **Status:** ✅ Ativo (automático)
- **Cron Expression:** `0 23 28-31 * *`

---

## 🧪 Como Testar

### Teste Rápido do Telegram

```bash
npx tsx scripts/test-telegram-report.ts
```

Este script:
- ✅ Gera relatório de teste com dados fictícios
- ✅ Envia para o Telegram da unidade Mangabeiras
- ✅ Usa dados do DIA ANTERIOR
- ✅ Valida formatação Markdown

### Teste Manual de Endpoint

```bash
curl "https://seu-dominio.vercel.app/api/cron/relatorio-diario?secret=$CRON_SECRET"
```

---

## � Monitoramento

### Ver logs dos crons no PostgreSQL

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'relatorio-diario-telegram')
ORDER BY start_time DESC
LIMIT 10;
```

### Ver todos os crons ativos

```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database,
  CASE 
    WHEN schedule = '0 21 * * *' THEN '21:00 diariamente'
    WHEN schedule = '0 3 * * *' THEN '03:00 diariamente'
    WHEN schedule = '0 2 1 * *' THEN '02:00 dia 1'
    WHEN schedule = '0 4 * * *' THEN '04:00 diariamente'
    WHEN schedule = '0 22 * * *' THEN '22:00 diariamente'
    WHEN schedule = '0 5 * * *' THEN '05:00 diariamente'
    WHEN schedule = '0 8 * * 1' THEN '08:00 segunda-feira'
    WHEN schedule = '0 9 1 * *' THEN '09:00 dia 1'
    WHEN schedule = '0 23 28-31 * *' THEN '23:00 fim do mês'
    WHEN schedule = '30 23 * * *' THEN '23:30 diariamente'
    ELSE schedule
  END AS descricao_horario
FROM cron.job
ORDER BY jobid;
```

---

## 🔧 Configuração do Telegram por Unidade

Cada unidade tem sua própria configuração de Telegram:

```sql
-- Verificar configuração
SELECT 
  name,
  telegram_bot_token,
  telegram_chat_id,
  telegram_enabled
FROM units
WHERE is_active = true;
```

**Unidades configuradas:**
- ✅ **Mangabeiras**: Bot 8573847906, Chat 6799154772
- ✅ **Nova Lima**: Bot 8195784375, Chat 6799154772

---

## � Deployment no VPS

Quando migrar para VPS, os crons do PostgreSQL continuarão funcionando:

1. **pg_cron** roda no Supabase (nuvem)
2. **http_post** chama endpoints da API no VPS
3. **Atualizar URLs** nos crons:

```sql
-- Atualizar URL do endpoint
SELECT cron.unschedule('relatorio-diario-telegram');
SELECT cron.schedule(
  'relatorio-diario-telegram',
  '0 21 * * *',
  $$
    SELECT net.http_post(
      url := 'https://seu-vps.com/api/cron/relatorio-diario?secret=...',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

---

## 📝 Changelog

- **2025-11-12** - ✅ **TODOS OS 11 CRONS ATIVADOS**
  - Mudança para dados do DIA ANTERIOR (D-1)
  - Criação de script de teste do Telegram
  - Automatização completa via pg_cron
- **2025-11-10** - Implementação inicial com 8 crons
- **2025-11-07** - Setup do pg_cron e primeiros crons

---

**Última atualização:** 12 de novembro de 2025
**Autor:** Andrey Viana
