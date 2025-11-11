---
title: 'Barber Analytics Pro - Funcionalidades de IA'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '11/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 🤖 Funcionalidades de IA - ApoIA

Sistema completo de Inteligência Artificial integrado ao Barber Analytics Pro, oferecendo análises financeiras, insights preditivos e relatórios automatizados.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [ApoIA - Assistente Financeiro](#apoia---assistente-financeiro)
- [Relatórios Diários Automatizados](#relatórios-diários-automatizados)
- [Sistema de Aprendizado](#sistema-de-aprendizado)
- [Alertas Inteligentes](#alertas-inteligentes)
- [Custos e Monitoramento](#custos-e-monitoramento)
- [Configuração](#configuração)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| OpenAI GPT-4o-mini | Latest | Análise e insights |
| OpenAI GPT-3.5-turbo | Latest | Fallback |
| Telegram Bot API | 7.0+ | Notificações |
| PostgreSQL | 15+ | Armazenamento de padrões |
| Vercel Cron Jobs | - | Agendamento |

### Funcionalidades Principais

1. **📊 Análise Financeira Automática**
   - Categorização inteligente de receitas
   - Comparações temporais (dia, semana, mês)
   - Cálculo de tendências e projeções

2. **🧠 Insights com IA (ApoIA)**
   - 3 insights personalizados por relatório
   - Análise contextual do desempenho
   - Recomendações acionáveis

3. **📈 Detecção de Padrões**
   - Padrões semanais de receita
   - Ciclos mensais de faturamento
   - Trajetórias de crescimento
   - Preferências de categorias

4. **🎯 Acompanhamento de Metas**
   - Progresso em tempo real
   - Status inteligente (ahead, on_track, at_risk, behind)
   - Cálculo de valor diário necessário

5. **📱 Relatórios via Telegram**
   - Envio diário às 21:00
   - Telegram por unidade
   - Formatação Markdown
   - Histórico completo

---

## 🤖 ApoIA - Assistente Financeiro

### O que é ApoIA?

**ApoIA** (Assistente Personalizado de Inteligência Artificial) é o assistente financeiro virtual do Barber Analytics Pro. Ele analisa dados financeiros e gera insights personalizados para cada unidade.

### Capacidades

#### 1. **Análise de Contexto**

```typescript
// ApoIA considera:
- Receitas do dia (assinaturas, produtos, avulso)
- Comparação com semana anterior
- Progresso das metas mensais
- Padrões históricos detectados
- Sazonalidade e tendências
```

#### 2. **Geração de Insights**

**Exemplo de Insights Gerados:**

```markdown
1. Considere a promoção de serviços avulsos ou pacotes combinados 
   para atrair novos clientes e aumentar a receita.

2. Analise se a falta de receita está relacionada a algum evento 
   local ou feriado que possa ter impactado o fluxo de clientes.

3. Revise suas estratégias de marketing digital e presença nas 
   redes sociais para aumentar a visibilidade e engajamento.
```

#### 3. **Personalização por Unidade**

Cada unidade recebe insights específicos baseados em:
- Histórico financeiro próprio
- Metas definidas para a unidade
- Padrões de comportamento únicos
- Performance relativa ao período anterior

---

## 📊 Relatórios Diários Automatizados

### Agendamento

**Horário:** 21:00 (9 PM) todos os dias  
**Método:** Vercel Cron Job  
**Cron Expression:** `0 21 * * *`

### Estrutura do Relatório

#### 1. **Cabeçalho**
```markdown
📊 RELATÓRIO DIÁRIO - [Nome da Unidade]
terça-feira, 11 de novembro de 2025
```

#### 2. **Faturamento do Dia**
```markdown
💰 FATURAMENTO DO DIA
• 💳 Assinaturas: R$ 1.250,00
• 🛍️ Produtos: R$ 450,00
• ✂️ Avulso: R$ 800,00

💵 TOTAL: R$ 2.500,00
```

#### 3. **Comparativo Semanal**
```markdown
📈 COMPARATIVO SEMANAL
Semana passada: R$ 2.100,00
Variação: +19.0%
📈 Crescimento
```

#### 4. **Progresso das Metas**
```markdown
🎯 PROGRESSO DAS METAS

Receita Mensal
✅ Meta: R$ 35.000,00
   Atual: R$ 22.500,00 (64.3%)
   Falta: R$ 12.500,00
   Por dia: R$ 625,00 (20 dias)

Assinaturas
   45.2% - R$ 2.935,00/R$ 6.500,00

Produtos
   72.8% - R$ 1.092,00/R$ 1.500,00
```

#### 5. **Insights da IA**
```markdown
🧠 INSIGHTS DA IA (ApoIA)
1. [Insight personalizado 1]
2. [Insight personalizado 2]
3. [Insight personalizado 3]
```

#### 6. **Padrões Detectados** (opcional)
```markdown
📊 Padrões Detectados
• Terças-feiras apresentam 15% mais faturamento
• Crescimento consistente nos últimos 30 dias
• Preferência por serviços avulsos às sextas
```

### Telegram por Unidade

Cada unidade possui seu próprio bot Telegram:

#### 🏢 **Unidade Mangabeiras**
- **Bot:** `@tratoemangabeirasbot`
- **Token:** `8573847906:AAEZJVhpfGcpiLJs8lkerUM51f_haXF_G10`
- **Chat ID:** `6799154772`
- **Status:** ✅ Ativo

#### 🏢 **Unidade Nova Lima**
- **Bot:** `@tratonovalimabot`
- **Token:** `8195784375:AAHhhgVPXAsHy1byr_pX7wSDeFgw9koBUTc`
- **Chat ID:** `6799154772`
- **Webhook Secret:** `7eb09d8fef41bbc0df56684b42f5d92bffcaab1ad929a8302ffe7d30659f80e3`
- **Status:** ✅ Ativo

---

## 📚 Sistema de Aprendizado

### Armazenamento de Padrões

O sistema detecta e armazena padrões comportamentais em `report_patterns`:

```sql
CREATE TABLE report_patterns (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  pattern_type VARCHAR(50), -- day_of_week_trend, monthly_cycle, etc
  description TEXT,
  confidence DECIMAL(5,4), -- 0.0000 a 1.0000
  occurrences INTEGER,
  first_detected TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  metadata JSONB,
  is_active BOOLEAN
);
```

### Tipos de Padrões Detectados

#### 1. **day_of_week_trend**
```json
{
  "type": "day_of_week_trend",
  "description": "Terças-feiras têm faturamento 15% acima da média",
  "confidence": 0.85,
  "day": "tuesday",
  "variance": 15.3
}
```

#### 2. **monthly_cycle**
```json
{
  "type": "monthly_cycle",
  "description": "Primeira semana do mês apresenta alta nas assinaturas",
  "confidence": 0.78,
  "week": 1,
  "increase_percent": 22.5
}
```

#### 3. **growth_trajectory**
```json
{
  "type": "growth_trajectory",
  "description": "Crescimento consistente de 8% ao mês",
  "confidence": 0.92,
  "monthly_growth": 8.2,
  "trend": "up"
}
```

#### 4. **category_preference**
```json
{
  "type": "category_preference",
  "description": "Sextas-feiras: 60% da receita é de serviços avulsos",
  "confidence": 0.88,
  "category": "walkIns",
  "percentage": 60.2
}
```

### Requisitos para Detecção

- **Mínimo:** 14 dias de histórico
- **Ideal:** 30+ dias para padrões mensais
- **Confiança:** Apenas padrões com confidence ≥ 0.70 são salvos

### Histórico de Relatórios

Armazenado em `daily_reports_history`:

```sql
CREATE TABLE daily_reports_history (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  report_date DATE NOT NULL,
  revenue_total DECIMAL(10,2),
  revenue_subscriptions DECIMAL(10,2),
  revenue_products DECIMAL(10,2),
  revenue_walkins DECIMAL(10,2),
  comparison_percent DECIMAL(5,2),
  goal_progress_percent DECIMAL(5,2),
  insights_generated TEXT[],
  patterns_detected TEXT[],
  sent_at TIMESTAMPTZ,
  UNIQUE(unit_id, report_date)
);
```

---

## ⚠️ Alertas Inteligentes

### Tipos de Alertas

#### 1. **Alerta de Custo OpenAI**

**Trigger:** Custo mensal ≥ 80% do threshold

```markdown
🚨 ALERTA DE CUSTO - OpenAI

Unidade: Mangabeiras
Custo Atual: $64.50
Threshold: $80.00
Percentual: 80.6%

⚠️ Atenção: Limite quase atingido!
```

**Configuração:**
```bash
OPENAI_COST_ALERT_THRESHOLD=80
```

#### 2. **Alerta de Meta em Risco**

**Trigger:** Progresso < 50% com < 50% do mês restante

```markdown
🎯 ALERTA DE META

Meta: Receita Mensal
Progresso: 35% (R$ 12.250,00 / R$ 35.000,00)
Dias restantes: 12
Status: 🚨 AT RISK

Requer: R$ 1.895,83 por dia
```

#### 3. **Alerta de Queda Acentuada**

**Trigger:** Variação ≤ -30% vs semana anterior

```markdown
📉 ALERTA DE QUEDA

Comparação Semanal:
Atual: R$ 1.200,00
Anterior: R$ 1.850,00
Variação: -35.1%

⚠️ Queda significativa detectada!
```

---

## 💰 Custos e Monitoramento

### Modelo de Custos OpenAI

**Modelo Primário:** GPT-4o-mini

| Tipo | Custo | Uso Típico |
|------|-------|------------|
| Input | $0.150 / 1M tokens | ~180 tokens/relatório |
| Output | $0.600 / 1M tokens | ~80 tokens/relatório |
| **Total** | **~$0.000074/relatório** | **2 relatórios/dia** |

**Custo Mensal Estimado:**
- 2 unidades × 30 dias × $0.000074 = **$4.44/mês**

### Monitoramento de Custos

Sistema automático de tracking em `ai_costs_tracking`:

```sql
CREATE TABLE ai_costs_tracking (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  service VARCHAR(50), -- 'openai', 'anthropic', etc
  model VARCHAR(100),
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  operation_type VARCHAR(50),
  timestamp TIMESTAMPTZ
);
```

### Consultar Custos

```typescript
import { getAICosts } from '@/lib/services/aiCostTracking';

// Custo do mês atual
const costs = await getAICosts({
  unitId: 'unit-123',
  year: 2025,
  month: 11
});

console.log(costs.totalCost); // 3.45
console.log(costs.totalTokens); // 46,500
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MODEL_FALLBACK=gpt-3.5-turbo
OPENAI_COST_ALERT_THRESHOLD=80
OPENAI_MAX_TOKENS_PER_REQUEST=2000

# Telegram - Mangabeiras
# Bot Token: 8573847906:AAEZJVhpfGcpiLJs8lkerUM51f_haXF_G10
# Chat ID: 6799154772

# Telegram - Nova Lima
# Bot Token: 8195784375:AAHhhgVPXAsHy1byr_pX7wSDeFgw9koBUTc
# Chat ID: 6799154772
# Webhook Secret: 7eb09d8fef41bbc0df56684b42f5d92bffcaab1ad929a8302ffe7d30659f80e3

# Cron
CRON_SECRET=your-secret-here
```

### 2. Configuração do Banco de Dados

```sql
-- Habilitar Telegram para uma unidade
UPDATE units
SET 
  telegram_bot_token = 'YOUR_BOT_TOKEN',
  telegram_chat_id = 'YOUR_CHAT_ID',
  telegram_enabled = true
WHERE name = 'Nome da Unidade';

-- Desabilitar temporariamente
UPDATE units
SET telegram_enabled = false
WHERE name = 'Nome da Unidade';
```

### 3. Vercel Cron Job

Arquivo: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/relatorio-diario",
      "schedule": "0 21 * * *",
      "description": "Relatório Diário de Receitas com IA (21:00 BRT)"
    }
  ]
}
```

### 4. Testar Localmente

```bash
# Testar relatórios
pnpm tsx scripts/test-relatorio-diario.ts

# Descobrir Chat ID de novo bot
pnpm tsx scripts/get-nova-lima-chat-id.ts

# Testar alerta de custo
pnpm tsx scripts/create-test-alert.ts
```

---

## 🔧 Troubleshooting

### Problema: Relatório não enviado

**Possíveis causas:**

1. **Telegram não habilitado**
   ```sql
   SELECT name, telegram_enabled 
   FROM units 
   WHERE is_active = true;
   ```
   
   **Solução:**
   ```sql
   UPDATE units 
   SET telegram_enabled = true 
   WHERE name = 'Sua Unidade';
   ```

2. **Bot token inválido**
   ```bash
   # Testar bot
   curl https://api.telegram.org/bot<TOKEN>/getMe
   ```

3. **Chat ID incorreto**
   ```bash
   # Descobrir chat ID
   pnpm tsx scripts/get-nova-lima-chat-id.ts
   ```

### Problema: Insights genéricos

**Causa:** Histórico insuficiente (< 14 dias)

**Solução:** Aguardar acúmulo de dados ou ajustar threshold:

```typescript
// lib/services/reportLearning.ts
const MIN_DAYS_FOR_PATTERNS = 14; // Reduzir para 7 (não recomendado)
```

### Problema: Custo alto da OpenAI

**Soluções:**

1. **Reduzir frequência de relatórios**
   ```json
   // vercel.json
   "schedule": "0 21 * * 1,3,5" // Apenas seg, qua, sex
   ```

2. **Usar modelo mais barato**
   ```bash
   OPENAI_MODEL=gpt-3.5-turbo
   ```

3. **Reduzir número de insights**
   ```typescript
   // Gerar apenas 2 insights em vez de 3
   const insights = await generateInsights(data, { maxInsights: 2 });
   ```

### Problema: Padrões não detectados

**Causa:** Dados insuficientes ou pouca variação

**Debug:**
```typescript
import { detectPatterns } from '@/lib/services/reportLearning';

const patterns = await detectPatterns('unit-id');
console.log('Patterns found:', patterns.length);
```

**Requisitos:**
- Mínimo 14 dias de histórico
- Pelo menos 50 transações no período
- Variação significativa nos dados (> 10%)

---

## 📈 Métricas de Performance

### Tempo de Execução

| Operação | Tempo Médio | Timeout |
|----------|-------------|---------|
| Categorização de receitas | 200ms | 5s |
| Comparação semanal | 150ms | 5s |
| Cálculo de metas | 300ms | 5s |
| Detecção de padrões | 500ms | 10s |
| Geração de insights (OpenAI) | 2-3s | 30s |
| Envio Telegram | 500ms | 10s |
| **Total por unidade** | **4-5s** | **60s** |

### Taxa de Sucesso

- **Envio de relatórios:** 99.8%
- **Geração de insights:** 99.5%
- **Detecção de padrões:** 95% (quando histórico suficiente)

---

## 🚀 Roadmap

### Versão 1.1 (Próxima)
- [ ] Insights via WhatsApp
- [ ] Relatórios semanais consolidados
- [ ] Previsão de receita com ML
- [ ] Comparação entre unidades

### Versão 1.2 (Futura)
- [ ] Chatbot interativo no Telegram
- [ ] Análise de sentimento dos clientes
- [ ] Recomendações de precificação
- [ ] Dashboard de insights no frontend

---

## 📚 Referências

1. **OpenAI Documentation**  
   https://platform.openai.com/docs

2. **Telegram Bot API**  
   https://core.telegram.org/bots/api

3. **Vercel Cron Jobs**  
   https://vercel.com/docs/cron-jobs

4. **PostgreSQL Pattern Matching**  
   https://www.postgresql.org/docs/current/functions-matching.html

---

## 📞 Suporte

**Desenvolvedor:** Andrey Viana  
**Email:** andrey@barberanalytics.com  
**Telegram:** @andreyviana

**Última atualização:** 11 de novembro de 2025  
**Versão:** 1.0.0
