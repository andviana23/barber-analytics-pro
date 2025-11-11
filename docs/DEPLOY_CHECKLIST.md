---
title: 'Checklist de Deploy - Produção'
author: 'Andrey Viana'
date: '11/11/2025'
status: 'IN PROGRESS'
---

# ✅ Checklist de Deploy para Produção

Verificação completa antes do deploy no Vercel com funcionalidades de IA.

---

## 📊 Status Geral

| Categoria          | Status          | Progresso |
| ------------------ | --------------- | --------- |
| 🤖 IA e Relatórios | ✅ Completo     | 100%      |
| 📱 Telegram        | ✅ Completo     | 100%      |
| 🗄️ Banco de Dados  | ✅ Completo     | 100%      |
| ⚙️ Configuração    | ⚠️ Pendente     | 80%       |
| 🧪 Testes          | ⚠️ Pendente     | 60%       |
| 📚 Documentação    | ✅ Completo     | 100%      |
| 🚀 Deploy          | ⏳ Não Iniciado | 0%        |

---

## 1️⃣ Funcionalidades de IA ✅ COMPLETO

### ✅ Implementado

- [x] **Categorização de Receitas**
  - Arquivo: `lib/services/revenueCategorizationService.ts`
  - Status: ✅ Testado e funcionando
  - Categorias: Assinaturas, Produtos, Avulso

- [x] **Comparação Temporal**
  - Arquivo: `lib/services/revenueComparison.ts`
  - Status: ✅ Testado e funcionando
  - Períodos: Dia, Semana, Mês

- [x] **Cálculo de Metas**
  - Arquivo: `lib/services/goalTracking.ts`
  - Status: ✅ Testado e funcionando
  - Status: ahead, on_track, at_risk, behind

- [x] **Detecção de Padrões**
  - Arquivo: `lib/services/reportLearning.ts`
  - Status: ✅ Testado e funcionando
  - Tipos: 4 padrões detectados

- [x] **Insights com OpenAI**
  - Arquivo: `lib/services/reportLearning.ts`
  - Status: ✅ Testado e funcionando
  - Modelo: gpt-4o-mini
  - Custo: ~$0.000074 por relatório

- [x] **Relatórios Diários**
  - Arquivo: `app/api/cron/relatorio-diario/route.ts`
  - Status: ✅ Testado e funcionando
  - Horário: 21:00 (9 PM)

---

## 2️⃣ Telegram ✅ COMPLETO

### ✅ Configurado

- [x] **Telegram por Unidade**
  - Mangabeiras: ✅ Bot configurado (@tratoemangabeirasbot)
  - Nova Lima: ✅ Bot configurado (@tratonovalimabot)
  - Ambos testados e funcionando

- [x] **Banco de Dados**
  - Tabela `units` com colunas Telegram
  - `telegram_bot_token`, `telegram_chat_id`, `telegram_enabled`
  - Ambas unidades habilitadas

- [x] **Service Layer**
  - Arquivo: `lib/services/unitTelegramConfig.ts`
  - Funções para buscar configuração por unidade
  - Validação de credenciais

- [x] **Envio de Mensagens**
  - Arquivo: `lib/telegram.ts`
  - Suporte a bot token por requisição
  - Formatação Markdown

---

## 3️⃣ Banco de Dados ✅ COMPLETO

### ✅ Tabelas Criadas

- [x] **report_patterns**
  - Armazena padrões detectados
  - RLS policies configuradas
  - Índices otimizados

- [x] **daily_reports_history**
  - Histórico de relatórios
  - UNIQUE constraint (unit_id, report_date)
  - RLS policies configuradas

- [x] **ai_costs_tracking**
  - Monitoramento de custos OpenAI
  - Agregação por mês/unidade
  - Índices otimizados

- [x] **units (modificada)**
  - Colunas Telegram adicionadas
  - `telegram_bot_token`, `telegram_chat_id`, `telegram_enabled`
  - Ambas unidades configuradas

---

## 4️⃣ Configuração ⚠️ PENDENTE (80%)

### ✅ Completo

- [x] Arquivo `.env` organizado e documentado
- [x] Telegram tokens documentados por unidade
- [x] OpenAI API key configurada
- [x] CRON_SECRET gerado
- [x] Supabase credentials configuradas

### ⚠️ Pendente

- [ ] **Variáveis de Ambiente no Vercel** 🔴 CRÍTICO
  - Acessar: https://vercel.com/andviana23/barber-analytics-pro/settings/environment-variables
  - Copiar todas as variáveis do `.env`
  - Verificar especialmente:
    - `OPENAI_API_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `CRON_SECRET`
    - `TELEGRAM_BOT_TOKEN` (global, para alertas)
    - `TELEGRAM_CHAT_ID` (global, para alertas)

- [ ] **Verificar URLs de Produção** 🟡 IMPORTANTE
  ```bash
  # Atualizar .env.production (se existir)
  VITE_APP_URL=https://barber-analytics-pro.vercel.app
  VITE_AUTH_REDIRECT_URL=https://barber-analytics-pro.vercel.app
  ALLOWED_ORIGINS=https://barber-analytics-pro.vercel.app
  ```

---

## 5️⃣ Testes ⚠️ PENDENTE (60%)

### ✅ Testado Localmente

- [x] Relatórios diários (ambas unidades)
- [x] Telegram delivery (ambas unidades)
- [x] Geração de insights com OpenAI
- [x] Detecção de padrões
- [x] Cálculo de metas

### ⚠️ Falta Testar

- [ ] **Cron Job no Vercel** 🔴 CRÍTICO
  - Deploy em staging primeiro
  - Aguardar execução às 21:00
  - Verificar logs no Vercel
  - Confirmar recebimento no Telegram

- [ ] **Autenticação do Cron** 🔴 CRÍTICO

  ```bash
  # Testar manualmente:
  curl -X GET \
    https://sua-app.vercel.app/api/cron/relatorio-diario \
    -H "Authorization: Bearer ${CRON_SECRET}"
  ```

- [ ] **Fallback da OpenAI** 🟡 IMPORTANTE
  - Testar com API key inválida
  - Verificar se usa gpt-3.5-turbo como fallback

- [ ] **Rate Limiting** 🟢 OPCIONAL
  - Verificar limite de 100 req/min
  - Testar múltiplas chamadas simultâneas

- [ ] **Alertas de Custo** 🟡 IMPORTANTE
  ```bash
  pnpm tsx scripts/create-test-alert.ts
  ```

---

## 6️⃣ Documentação ✅ COMPLETO

### ✅ Criado

- [x] **AI_FEATURES.md**
  - Visão geral das funcionalidades
  - Configuração completa
  - Troubleshooting
  - Custos e monitoramento

- [x] **RELATORIO_DIARIO_AUTOMATICO.md**
  - Guia completo de relatórios
  - Arquitetura do sistema
  - Exemplos de uso

- [x] **ETL_SEM_OPENAI.md**
  - Sistema ETL de extratos bancários
  - Fluxo de importação

- [x] **README.md atualizado** (se necessário)

### ⚠️ Recomendado

- [ ] **Adicionar ao SUMMARY.md** 🟡 IMPORTANTE
  ```markdown
  ## 🤖 Inteligência Artificial

  - [AI Features](./AI_FEATURES.md)
  - [Relatórios Diários](./guides/RELATORIO_DIARIO_AUTOMATICO.md)
  ```

---

## 7️⃣ Deploy no Vercel ⏳ NÃO INICIADO

### Pré-requisitos

- [ ] **1. Commit das Alterações** 🔴 CRÍTICO

  ```bash
  git add .
  git commit -m "feat: adicionar funcionalidades de IA e relatórios diários"
  git push origin feature/ai-finance-integration
  ```

- [ ] **2. Configurar Variáveis no Vercel** 🔴 CRÍTICO
  - Acessar dashboard Vercel
  - Settings → Environment Variables
  - Adicionar todas as variáveis do `.env`

- [ ] **3. Verificar vercel.json** ✅ JÁ ESTÁ CONFIGURADO
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/relatorio-diario",
        "schedule": "0 21 * * *",
        "description": "Relatório Diário..."
      }
    ]
  }
  ```

### Processo de Deploy

#### Opção 1: Deploy via CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI (se necessário)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy em preview (testar primeiro)
vercel

# 4. Testar preview
# Acessar URL gerada
# Verificar funcionalidades

# 5. Deploy em produção
vercel --prod
```

#### Opção 2: Deploy via GitHub (Automático)

```bash
# 1. Fazer merge para main
git checkout main
git merge feature/ai-finance-integration
git push origin main

# 2. Vercel fará deploy automático
# 3. Verificar no dashboard
```

### Pós-Deploy

- [ ] **Verificar Build** 🔴 CRÍTICO
  - Acessar Vercel Dashboard
  - Deployments → Último deploy
  - Verificar status: Success ✅

- [ ] **Verificar Logs** 🔴 CRÍTICO
  - Dashboard → Logs
  - Filtrar por "relatorio-diario"
  - Verificar erros

- [ ] **Testar Cron Manualmente** 🔴 CRÍTICO

  ```bash
  curl -X GET \
    https://barber-analytics-pro.vercel.app/api/cron/relatorio-diario \
    -H "Authorization: Bearer ${CRON_SECRET}"
  ```

- [ ] **Aguardar Execução Automática** 🔴 CRÍTICO
  - Primeira execução: Hoje às 21:00
  - Verificar Telegram de ambas unidades
  - Verificar logs no Vercel

- [ ] **Monitorar Custos OpenAI** 🟡 IMPORTANTE
  - Acessar: https://platform.openai.com/usage
  - Verificar custos diários
  - Confirmar ~$0.15/dia para 2 unidades

---

## 🔒 Segurança

### ✅ Implementado

- [x] RLS policies em todas as tabelas
- [x] CRON_SECRET para autenticação
- [x] Telegram webhook secrets
- [x] Service role key apenas no servidor
- [x] Variáveis sensíveis em `.env` (não commitado)

### ⚠️ Verificar

- [ ] **`.env` no .gitignore** 🔴 CRÍTICO

  ```bash
  # Verificar
  git check-ignore .env
  # Deve retornar: .env
  ```

- [ ] **Service Role Key não exposta** 🔴 CRÍTICO

  ```bash
  # Procurar no código
  grep -r "SUPABASE_SERVICE_ROLE_KEY" src/
  # NÃO deve aparecer em arquivos do frontend
  ```

- [ ] **API Keys rotacionadas** 🟡 IMPORTANTE
  - OpenAI: Rotacionar a cada 90 dias
  - Telegram: Apenas se comprometida

---

## 📊 Monitoramento Pós-Deploy

### Primeira Semana

- [ ] **Dia 1: Verificar execução do cron**
  - Hora: 21:00
  - Verificar: 2 mensagens no Telegram
  - Verificar: Logs no Vercel

- [ ] **Dia 2-7: Monitorar diariamente**
  - Relatórios enviados?
  - Insights fazem sentido?
  - Erros nos logs?

- [ ] **Fim da semana: Revisar custos**
  - OpenAI: ~$0.50-1.00 para 7 dias
  - Vercel: Incluído no plano

### Primeiro Mês

- [ ] **Coletar feedback dos usuários**
  - Qualidade dos insights
  - Relevância das recomendações
  - Horário ideal para relatórios

- [ ] **Analisar padrões detectados**
  - Padrões fazem sentido?
  - Confidence adequada?
  - Ajustar thresholds se necessário

- [ ] **Revisar custos mensais**
  - OpenAI: ~$4-5/mês esperado
  - Alertar se > $10/mês

---

## 🚨 Plano de Contingência

### Se o Cron Falhar

1. **Verificar logs no Vercel**

   ```bash
   vercel logs --follow
   ```

2. **Executar manualmente**

   ```bash
   curl -X GET <URL> -H "Authorization: Bearer ${CRON_SECRET}"
   ```

3. **Verificar configuração**
   - `vercel.json` correto?
   - Variáveis de ambiente definidas?
   - CRON_SECRET válido?

### Se a OpenAI Falhar

1. **Verificar quota**
   - https://platform.openai.com/usage
   - Aumentar limite se necessário

2. **Usar fallback**
   - Sistema já usa gpt-3.5-turbo automaticamente

3. **Desabilitar temporariamente**
   ```typescript
   // Comentar chamada OpenAI
   // const insights = await generateLearnedInsights(...);
   const insights = ['Sistema temporariamente sem IA'];
   ```

### Se o Telegram Falhar

1. **Verificar bot tokens**

   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getMe
   ```

2. **Recriar bot se necessário**
   - @BotFather no Telegram
   - /newbot
   - Atualizar token no banco

3. **Desabilitar unidade temporariamente**
   ```sql
   UPDATE units
   SET telegram_enabled = false
   WHERE name = 'Nome Unidade';
   ```

---

## ✅ Resumo Final

### O que está PRONTO ✅

1. ✅ Todas as funcionalidades de IA implementadas
2. ✅ Telegram configurado para ambas unidades
3. ✅ Banco de dados estruturado e populado
4. ✅ Testes locais passando
5. ✅ Documentação completa

### O que FALTA fazer 🔴

1. 🔴 **Configurar variáveis de ambiente no Vercel**
2. 🔴 **Fazer deploy (staging → produção)**
3. 🔴 **Testar cron job no Vercel**
4. 🟡 **Atualizar SUMMARY.md**
5. 🟡 **Monitorar primeira semana**

### Tempo Estimado para Produção

| Tarefa                     | Tempo    | Prioridade |
| -------------------------- | -------- | ---------- |
| Configurar Vercel          | 15 min   | 🔴 Alta    |
| Deploy staging             | 5 min    | 🔴 Alta    |
| Testar staging             | 10 min   | 🔴 Alta    |
| Deploy produção            | 5 min    | 🔴 Alta    |
| Aguardar primeira execução | 1-24h    | 🔴 Alta    |
| Monitoramento inicial      | 1 semana | 🟡 Média   |

**Total para deploy:** ~35 minutos + aguardar execução
**Total para validação completa:** ~1 semana

---

## 🎯 Próximos Passos Imediatos

### AGORA (Próximos 30 minutos)

```bash
# 1. Commit e push
git add .
git commit -m "feat: adicionar IA, relatórios diários e Telegram por unidade"
git push origin feature/ai-finance-integration

# 2. Acessar Vercel Dashboard
# https://vercel.com/andviana23/barber-analytics-pro

# 3. Configurar Environment Variables
# Copiar todas as variáveis do .env

# 4. Deploy staging
vercel

# 5. Testar staging
# Executar curl no endpoint de cron

# 6. Deploy produção
vercel --prod
```

### HOJE (21:00 - Primeira Execução)

- Verificar Telegram de ambas unidades
- Verificar logs no Vercel
- Confirmar custos OpenAI
- Documentar qualquer problema

### ESTA SEMANA

- Monitorar execuções diárias
- Coletar feedback
- Ajustar insights se necessário
- Revisar custos acumulados

---

**Status:** ⚠️ **85% Completo - Pronto para Deploy**
**Próxima Ação:** 🔴 **Configurar variáveis no Vercel e fazer deploy**
**Tempo Estimado:** 30-45 minutos
**Data/Hora:** 11/11/2025 - 16:50

---

**Última atualização:** 11 de novembro de 2025, 16:50
**Autor:** Andrey Viana
