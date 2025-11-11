---
title: 'Relatório Diário Automatizado - Barber Analytics Pro'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '11/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 📊 Relatório Diário Automatizado com IA (ApoIA)

Sistema inteligente de relatórios diários enviados automaticamente via Telegram às **21:00 (9 PM)** todos os dias.

---

## 🎯 Visão Geral

O sistema gera relatórios diários automatizados que incluem:

- **💰 Faturamento categorizado** (Assinaturas, Produtos, Avulso)
- **📈 Comparação semanal** (variação vs semana anterior)
- **🎯 Progresso de metas** (com cálculo de necessidade diária)
- **🧠 Insights da IA** (análise contextual com aprendizado contínuo)
- **📊 Padrões detectados** (comportamento ao longo do tempo)

---

## 🏗️ Arquitetura

### Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│                 Cron Job (21:00 Diariamente)                │
│                                                             │
│  1. Buscar unidades ativas                                 │
│  2. Para cada unidade:                                      │
│     ├─ Categorizar receitas do dia                         │
│     ├─ Comparar com semana anterior                        │
│     ├─ Calcular progresso das metas                        │
│     ├─ Detectar padrões comportamentais                    │
│     ├─ Gerar insights com IA (OpenAI)                      │
│     ├─ Formatar mensagem Markdown                          │
│     ├─ Enviar via Telegram                                 │
│     └─ Salvar histórico                                    │
│  3. Retornar resultado consolidado                         │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

#### 1. **Revenue Categorization Service**

**Arquivo:** `lib/services/revenueCategorizationService.ts`

**Funções principais:**

```typescript
categorizeRevenues(unitId, startDate, endDate) → CategorizedRevenue
getDailyRevenues(unitId, date) → CategorizedRevenue
getWeeklyRevenues(unitId, weekStartDate) → CategorizedRevenue
getMonthlyRevenues(unitId, year, month) → CategorizedRevenue
```

**Lógica de categorização:**

- **Assinaturas**: Receitas com categoria contendo "assinatura" ou "subscription"
- **Produtos**: Receitas do tipo `product` ou categorias "Cosmeticos"/"Comodidades"
- **Avulso**: Receitas de serviços sem assinatura (categoria "Avulso")

#### 2. **Revenue Comparison Service**

**Arquivo:** `lib/services/revenueComparison.ts`

**Funções principais:**

```typescript
compareWithLastWeek(unitId, currentDate) → ComparisonResult
compareWithYesterday(unitId, currentDate) → ComparisonResult
compareWithLastMonth(unitId, year, month) → ComparisonResult
compareDetailed(unitId, currentDate) → DetailedComparison
```

**Lógica de tendência:**

- **up** (📈): variação >= +5%
- **stable** (➡️): variação entre -5% e +5%
- **down** (📉): variação <= -5%

#### 3. **Goal Tracking Service**

**Arquivo:** `lib/services/goalTracking.ts`

**Funções principais:**

```typescript
calculateGoalProgress(unitId, year, month, goalType) → GoalProgress
calculateAllGoalsProgress(unitId, year, month) → AllGoalsProgress
getProjectionStatus(progress) → { willAchieve, confidence, message }
```

**Status de metas:**

- **ahead** (🎉): Acima de 10% do esperado
- **on_track** (✅): Dentro do esperado (±10%)
- **behind** (⚠️): Abaixo de 10% do esperado
- **at_risk** (🚨): Abaixo de 20% do esperado

#### 4. **Report Learning Service (ApoIA)**

**Arquivo:** `lib/services/reportLearning.ts`

**Funções principais:**

```typescript
detectPatterns(unitId) → DetectedPattern[]
generateLearnedInsights(unitId, reportData, patterns) → string[]
saveDailyReport(reportData) → void
getReportHistory(unitId, days) → DailyReportData[]
```

**Padrões detectados:**

1. **day_of_week_trend**: Melhor/pior dia da semana
2. **monthly_cycle**: Início, meio ou fim de mês mais forte
3. **growth_trajectory**: Tendência de crescimento/queda
4. **category_preference**: Categoria dominante (>50%)

#### 5. **Cron Job**

**Arquivo:** `app/api/cron/relatorio-diario/route.ts`

**Schedule:** `0 21 * * *` (Todos os dias às 21:00 BRT)

**Configuração:** `vercel.json`

---

## 📊 Estrutura do Banco de Dados

### Tabela: `report_patterns`

Armazena padrões detectados pela IA para aprendizado contínuo.

```sql
CREATE TABLE report_patterns (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  pattern_type VARCHAR(50),
  description TEXT,
  confidence NUMERIC(3,2), -- 0.00 a 1.00
  first_detected TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  occurrences INTEGER,
  metadata JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Tipos de padrões:**

- `day_of_week_trend`
- `monthly_cycle`
- `growth_trajectory`
- `category_preference`
- `seasonal_pattern`

### Tabela: `daily_reports_history`

Histórico de todos os relatórios gerados.

```sql
CREATE TABLE daily_reports_history (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  report_date DATE,
  revenue_total NUMERIC(10,2),
  revenue_subscriptions NUMERIC(10,2),
  revenue_products NUMERIC(10,2),
  revenue_walkins NUMERIC(10,2),
  comparison_percent NUMERIC(5,2),
  goal_progress_percent NUMERIC(5,2),
  insights_generated TEXT[],
  patterns_detected TEXT[],
  sent_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  CONSTRAINT unique_report_per_day UNIQUE(unit_id, report_date)
);
```

---

## 📱 Formato do Relatório (Telegram)

### Exemplo de Mensagem

```markdown
📊 _RELATÓRIO DIÁRIO - Unidade Centro_
_quinta-feira, 07 de novembro de 2025_

━━━━━━━━━━━━━━━━━━

💰 _FATURAMENTO DO DIA_
• 💳 Assinaturas: R$ 449,98
• 🛍️ Produtos: R$ 542,31
• ✂️ Avulso: R$ 3.302,80

━━━━━━━━━━━━━━━━━━
_💵 TOTAL: R$ 4.295,09_

━━━━━━━━━━━━━━━━━━

📈 _COMPARATIVO SEMANAL_
Semana passada: R$ 3.215,32
Variação: +33.6%
📈 Crescimento!

━━━━━━━━━━━━━━━━━━

🎯 _PROGRESSO DAS METAS_
_Receita Mensal_
✅ Meta: R$ 35.000,00
Atual: R$ 21.450,32 (61.3%)
Falta: R$ 13.549,68
Por dia: R$ 677,48 (20 dias)

_Assinaturas_
52.3% - R$ 3.400,00/R$ 6.500,00

_Produtos_
38.7% - R$ 580,50/R$ 1.500,00

━━━━━━━━━━━━━━━━━━

🧠 _INSIGHTS DA IA (ApoIA)_

1. Quinta-feira é o melhor dia (média: R$ 4.215,32) - aproveite para campanhas
2. Produtos cresceram 45% vs semana passada - destaque os mais vendidos
3. Meta de assinaturas está em risco - acelere renovações e prospecção

━━━━━━━━━━━━━━━━━━

📊 _Padrões Detectados_
• Quinta-feira é o melhor dia (média: R$ 4.215,32)
• Início do mês 18% mais forte
• Assinaturas representa 52% da receita

━━━━━━━━━━━━━━━━━━

_Relatório gerado automaticamente às 21:00_
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

**Arquivo:** `.env`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (para insights)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890

# Cron Secret
CRON_SECRET=your-secure-random-string
```

### 2. Vercel Cron

**Arquivo:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/relatorio-diario",
      "schedule": "0 21 * * *",
      "description": "Relatório Diário de Receitas - Todos os dias às 21:00 BRT (com IA ApoIA)"
    }
  ]
}
```

### 3. Metas no Sistema

Para que o relatório calcule progresso de metas, cadastre na tabela `goals`:

```sql
INSERT INTO goals (
  unit_id,
  goal_type,
  period,
  target_value,
  goal_year,
  goal_month,
  is_active
) VALUES
  ('unit-id', 'revenue_general', 'monthly', 35000.00, 2025, 11, true),
  ('unit-id', 'subscription', 'monthly', 6500.00, 2025, 11, true),
  ('unit-id', 'product_sales', 'monthly', 1500.00, 2025, 11, true);
```

---

## 🧪 Teste Manual

### Executar via cURL

```bash
curl -X GET \
  https://your-app.vercel.app/api/cron/relatorio-diario \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Executar localmente

```bash
# 1. Iniciar servidor dev
pnpm dev

# 2. Executar cron
curl -X GET \
  http://localhost:3000/api/cron/relatorio-diario \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

### Resposta esperada

```json
{
  "success": true,
  "correlationId": "daily-report-1731355200000",
  "timestamp": "2025-11-11T21:00:00.000Z",
  "reports_sent": 2,
  "reports_failed": 0,
  "results": [
    {
      "unit_id": "28c57936-5b4b-45a3-b6ef-eaebb96a9479",
      "unit_name": "Unidade Centro",
      "revenue": 4295.09,
      "sent": true,
      "timestamp": "2025-11-11T21:00:15.345Z"
    },
    {
      "unit_id": "577aa606-ae95-433d-8869-e90275241076",
      "unit_name": "Unidade Norte",
      "revenue": 3189.5,
      "sent": true,
      "timestamp": "2025-11-11T21:00:18.123Z"
    }
  ]
}
```

---

## 📈 Aprendizado da IA (ApoIA)

### Como funciona

1. **Histórico:** Sistema mantém histórico de 90 dias em `daily_reports_history`
2. **Padrões:** A cada execução, detecta padrões nos dados históricos
3. **Armazenamento:** Salva padrões em `report_patterns` com nível de confiança
4. **Insights:** OpenAI usa padrões detectados para gerar insights contextualizados
5. **Melhoria contínua:** Quanto mais relatórios, melhores os insights

### Exemplos de Insights Aprendidos

**Semana 1 (sem histórico):**

```
1. Receita cresceu 33% vs semana passada
2. Meta mensal está em 61% - no caminho certo
3. Produtos tiveram bom desempenho hoje
```

**Semana 4 (com padrões):**

```
1. Quinta-feira é consistentemente o melhor dia - aproveite para promoções
2. Início do mês é 18% mais forte - planeje estoque de produtos
3. Assinaturas estão estáveis em 52% da receita - foco em produtos para diversificar
```

**Mês 3 (aprendizado consolidado):**

```
1. Últimos 10 dias de queda - revisar satisfação dos clientes
2. Meta de produtos em risco (38%) - criar combo com serviços
3. Crescimento de 12% nos últimos 30 dias - manter estratégia atual
```

---

## 🐛 Troubleshooting

### Relatório não foi enviado

**Possíveis causas:**

1. **Cron não executou**
   - Verificar logs: `vercel logs --project=barber-analytics-pro`
   - Checar configuração: `vercel.json` → `crons`

2. **Erro de autenticação**

   ```json
   { "error": "Unauthorized" }
   ```

   - Verificar `CRON_SECRET` no Vercel
   - Testar manualmente: `curl ... -H "Authorization: Bearer ${CRON_SECRET}"`

3. **Erro ao buscar unidades**
   - Verificar `SUPABASE_SERVICE_ROLE_KEY`
   - Confirmar que há unidades ativas: `SELECT * FROM units WHERE is_active = true`

4. **Telegram não envia**
   - Verificar `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID`
   - Testar Telegram: `scripts/test-telegram.ts`

### Insights vazios

**Causa:** Histórico insuficiente (< 14 dias)

**Solução:** Aguardar acúmulo de dados ou popular histórico:

```sql
-- Popular histórico manualmente (para testes)
INSERT INTO daily_reports_history (
  unit_id, report_date, revenue_total,
  revenue_subscriptions, revenue_products, revenue_walkins,
  sent_at
)
SELECT
  unit_id,
  date,
  SUM(value) FILTER (WHERE category ILIKE '%assinatura%'),
  SUM(value) FILTER (WHERE type = 'product'),
  SUM(value) FILTER (WHERE category ILIKE '%avulso%'),
  NOW()
FROM revenues
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  AND is_active = true
GROUP BY unit_id, date;
```

### Erro OpenAI

**Erro:**

```
Error: Cannot read properties of undefined (reading 'toFixed')
```

**Causa:** Dados insuficientes ou valores nulos

**Solução:** Verificar dados do dia:

```sql
SELECT
  COUNT(*) as total_receitas,
  SUM(value) as total_valor,
  AVG(value) as valor_medio
FROM revenues
WHERE date = CURRENT_DATE
  AND is_active = true;
```

### Performance lenta

**Causa:** Muitas unidades ou histórico grande

**Otimização:**

1. **Adicionar índices**

```sql
CREATE INDEX idx_revenues_unit_date
  ON revenues(unit_id, date DESC)
  WHERE is_active = true;

CREATE INDEX idx_goals_unit_period
  ON goals(unit_id, goal_year, goal_month)
  WHERE is_active = true;
```

2. **Limitar histórico**
   Usar apenas 60 dias em vez de 90:

```typescript
const history = await getReportHistory(unitId, 60); // Em vez de 90
```

3. **Processar em lote**
   Processar 3 unidades por vez em vez de todas simultaneamente.

---

## 📊 Métricas e Monitoramento

### Logs importantes

```typescript
logger.info('Relatório enviado', {
  unitId,
  revenue: revenue.total,
  patterns: patterns.length,
  insights: insights.length,
  durationMs: Date.now() - startTime,
});
```

### Queries de monitoramento

**Total de relatórios enviados:**

```sql
SELECT
  COUNT(*) as total_relatorios,
  DATE_TRUNC('month', sent_at) as mes
FROM daily_reports_history
WHERE sent_at IS NOT NULL
GROUP BY mes
ORDER BY mes DESC;
```

**Taxa de sucesso:**

```sql
SELECT
  ROUND(AVG(CASE WHEN sent_at IS NOT NULL THEN 1 ELSE 0 END) * 100, 2) as taxa_sucesso
FROM daily_reports_history
WHERE report_date >= CURRENT_DATE - INTERVAL '30 days';
```

**Padrões mais confiáveis:**

```sql
SELECT
  pattern_type,
  description,
  confidence,
  occurrences
FROM report_patterns
WHERE is_active = true
  AND confidence >= 0.75
ORDER BY confidence DESC, occurrences DESC
LIMIT 10;
```

---

## 🔗 Referências

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📝 Changelog

### v1.0.0 - 11/11/2025

- ✅ Implementação inicial completa
- ✅ Categorização de receitas (assinaturas, produtos, avulso)
- ✅ Comparação semanal
- ✅ Tracking de metas
- ✅ Detecção de padrões (4 tipos)
- ✅ Insights com OpenAI
- ✅ Envio via Telegram formatado
- ✅ Cron job às 21:00 diariamente

---

**Última atualização:** 11 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
