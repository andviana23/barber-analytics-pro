# 🚀 ETL Funciona SEM OpenAI

**Data:** 10 de novembro de 2025
**Versão:** 1.0.0

---

## ✅ **Resposta Rápida: NÃO PRECISA configurar OpenAI para testar ETL!**

O **ETL Diário** é **completamente independente** da API do OpenAI.

---

## 📊 **O que o ETL faz?**

### **Fluxo ETL (sem IA):**

```mermaid
graph LR
    A[1. Extract] --> B[2. Transform]
    B --> C[3. Load]
    C --> D[4. Detect Anomalies]

    A --> A1[Busca Receitas]
    A --> A2[Busca Despesas]

    B --> B1[Calcula Métricas]
    B --> B2[Agrupa por Data]

    C --> C1[Salva ai_metrics_daily]

    D --> D1[Z-Score Anomalias]
    D --> D2[Gera Alertas]
```

### **Etapas:**

1. **Extract** (Extrair)
   - Busca receitas do período via `revenueRepository`
   - Busca despesas do período via `expenseRepository`
   - **Sem API externa**

2. **Transform** (Transformar)
   - Usa **Danfo.js** para criar DataFrames
   - Agrupa por data e unidade
   - Calcula métricas:
     - `gross_revenue` (receita bruta)
     - `total_expenses` (despesas totais)
     - `margin_percentage` (margem %)
     - `average_ticket` (ticket médio)
     - `revenue_count` (quantidade de receitas)
     - `expense_count` (quantidade de despesas)
   - **Cálculos locais, sem API externa**

3. **Load** (Carregar)
   - Salva métricas em `ai_metrics_daily`
   - **Apenas INSERT no Supabase**

4. **Detect Anomalies** (Detecção de Anomalias)
   - Usa **Z-Score** (estatística local)
   - Compara métricas com histórico
   - Gera alertas se detectar anomalias
   - **Sem API externa, usa `lib/analytics/anomalies.ts`**

---

## 🤖 **Quando o OpenAI é usado?**

O OpenAI **NÃO é usado no ETL diário**. É usado apenas em:

### **1. APIs de Análise (Opcional):**

| API                                   | Usa OpenAI? | Propósito                         |
| ------------------------------------- | ----------- | --------------------------------- |
| `/api/ia-financeira/analise-saude`    | ✅ **Sim**  | Análise textual detalhada com GPT |
| `/api/ia-financeira/analise-anomalia` | ✅ **Sim**  | Explicação de anomalias com GPT   |
| `/api/cron/etl-diario`                | ❌ **NÃO**  | Pipeline ETL (cálculos locais)    |
| `/api/cron/enviar-alertas`            | ❌ **NÃO**  | Envia alertas Telegram (sem IA)   |

### **2. Dashboard de Análises (UI):**

- **IA Financeira** (página) → Usa OpenAI para gerar insights textuais
- **KPIs** (dashboard) → **NÃO usa OpenAI** (apenas métricas)
- **Alertas** (dashboard) → **NÃO usa OpenAI** (apenas Z-Score)

---

## 🧪 **Como Testar ETL Sem OpenAI**

### **Pré-requisitos:**

✅ Servidor rodando: `npm run dev` (porta 5174)
✅ CORS resolvido (já feito)
✅ Dados de teste no banco: `revenues` e `expenses`

### **Opção 1: Executar ETL via API**

```bash
# 1. Executar ETL diário manualmente
curl -X GET \
  -H "Authorization: Bearer 6ee7c402382fe346a673b355706e1164c9c99a226d9ae04b11e1c044fe77139a" \
  "http://localhost:5174/api/cron/etl-diario"

# Resposta esperada:
# {
#   "success": true,
#   "runId": "uuid-123",
#   "correlationId": "etl-123456",
#   "runDate": "2025-11-10",
#   "durationSeconds": 15,
#   "summary": {
#     "totalUnits": 2,
#     "successfulUnits": 2,
#     "failedUnits": 0,
#     "totalMetricsProcessed": 2
#   }
# }
```

### **Opção 2: Verificar Resultado no Banco**

```sql
-- @pgsql - Conectar ao banco

-- 1. Verificar se ETL rodou
SELECT * FROM etl_runs
ORDER BY started_at DESC
LIMIT 5;

-- 2. Ver métricas geradas
SELECT
  unit_id,
  date,
  gross_revenue,
  total_expenses,
  margin_percentage,
  average_ticket,
  revenue_count,
  expense_count
FROM ai_metrics_daily
ORDER BY date DESC
LIMIT 10;

-- 3. Ver alertas gerados (se houver anomalias)
SELECT
  unit_id,
  alert_type,
  severity,
  message,
  created_at
FROM alerts_events
WHERE status = 'OPEN'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ⚠️ **O que PRECISA estar configurado?**

### **Variáveis Obrigatórias para ETL:**

```bash
# .env.local

# ✅ Supabase (OBRIGATÓRIO)
VITE_SUPABASE_URL=https://cwfrtqtienguzwsybvwm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ Service Role (OBRIGATÓRIO - para ETL bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ✅ Cron Secret (OBRIGATÓRIO - para autenticar cron)
CRON_SECRET=6ee7c402382fe346a673b355706e1164c9c99a226d9ae04b11e1c044fe77139a

# ❌ OpenAI (NÃO OBRIGATÓRIO PARA ETL)
# OPENAI_API_KEY=sk-...  # Só precisa para /api/ia-financeira/*
```

### **Verificar Service Role Key:**

```bash
# Verificar se está configurado
echo $SUPABASE_SERVICE_ROLE_KEY

# Se não estiver, buscar no Supabase Dashboard:
# 1. Ir em: https://supabase.com/dashboard/project/cwfrtqtienguzwsybvwm/settings/api
# 2. Copiar "service_role" key (secreta, não expor!)
# 3. Adicionar em .env.local
```

---

## 🔧 **Configuração Mínima para Testar ETL**

### **Arquivo `.env.local` (mínimo):**

```bash
# Supabase
VITE_SUPABASE_URL=https://cwfrtqtienguzwsybvwm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron
CRON_SECRET=6ee7c402382fe346a673b355706e1164c9c99a226d9ae04b11e1c044fe77139a

# Analytics (opcional - usa defaults)
ANALYTICS_BATCH_SIZE=5
ANALYTICS_ANOMALY_LOOKBACK_DAYS=30
ANALYTICS_ANOMALY_ZSCORE_THRESHOLD=2
```

---

## 📝 **Checklist para Testar ETL**

### **Antes de Executar:**

- [ ] ✅ Servidor rodando: `npm run dev`
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] ✅ `CRON_SECRET` configurado
- [ ] ✅ Dados de teste existem: `revenues` e `expenses` (pelo menos 1 registro)
- [ ] ✅ Unidades ativas: `SELECT * FROM units WHERE is_active = true`

### **Durante Execução:**

- [ ] ✅ ETL retorna `success: true`
- [ ] ✅ `summary.totalUnits > 0`
- [ ] ✅ `summary.successfulUnits > 0`
- [ ] ✅ `summary.totalMetricsProcessed > 0`

### **Após Execução:**

- [ ] ✅ Registro criado em `etl_runs` com status `SUCCESS`
- [ ] ✅ Métricas salvas em `ai_metrics_daily`
- [ ] ✅ Alertas gerados em `alerts_events` (se houver anomalias)

---

## 🚨 **Possíveis Erros e Soluções**

### **Erro 1: "No units found"**

```json
{
  "success": true,
  "message": "Nenhuma unidade ativa para processar",
  "unitsProcessed": 0
}
```

**Causa:** Nenhuma unidade com `is_active = true`

**Solução:**

```sql
-- @pgsql
UPDATE units SET is_active = true WHERE id = 'sua-unit-id';
```

---

### **Erro 2: "Failed to extract data"**

```json
{
  "success": false,
  "errors": ["Failed to extract data from database"]
}
```

**Causa:** Erro ao buscar receitas/despesas

**Solução:**

```sql
-- Verificar se há dados
SELECT COUNT(*) FROM revenues WHERE is_active = true;
SELECT COUNT(*) FROM expenses WHERE is_active = true;

-- Se zero, criar dados de teste
INSERT INTO revenues (unit_id, professional_id, value, date, description, category_id, payment_method_id, bank_account_id)
VALUES ('unit-123', 'prof-456', 150.00, '2025-11-10', 'Teste ETL', 'servicos', 'pix', 'conta-principal');
```

---

### **Erro 3: "Unauthorized"**

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Causa:** `CRON_SECRET` incorreto ou ausente

**Solução:**

```bash
# Verificar se está no header
curl -X GET \
  -H "Authorization: Bearer SEU_CRON_SECRET_AQUI" \
  "http://localhost:5174/api/cron/etl-diario"
```

---

### **Erro 4: "service_role key not found"**

```json
{
  "success": false,
  "error": "Missing service role key"
}
```

**Causa:** `SUPABASE_SERVICE_ROLE_KEY` não configurado

**Solução:**

```bash
# 1. Buscar no Supabase Dashboard
# 2. Adicionar em .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=eyJ..." >> .env.local

# 3. Reiniciar servidor
npm run dev
```

---

## 🎯 **Resumo Final**

| Item                 | Status             | Necessário para ETL?            |
| -------------------- | ------------------ | ------------------------------- |
| **Supabase URL**     | ✅ Configurado     | ✅ **Sim**                      |
| **Anon Key**         | ✅ Configurado     | ✅ **Sim**                      |
| **Service Role Key** | ⚠️ Verificar       | ✅ **Sim**                      |
| **CRON_SECRET**      | ✅ Configurado     | ✅ **Sim**                      |
| **OpenAI API Key**   | ❌ Não configurado | ❌ **NÃO** (só para IA textual) |
| **Telegram Token**   | ✅ Configurado     | ❌ Não (só para alertas)        |
| **Dados de teste**   | ⚠️ Verificar       | ✅ **Sim**                      |

---

## 🚀 **Próximo Passo**

**Execute o ETL agora mesmo!**

```bash
# Testar ETL local
curl -X GET \
  -H "Authorization: Bearer 6ee7c402382fe346a673b355706e1164c9c99a226d9ae04b11e1c044fe77139a" \
  "http://localhost:5174/api/cron/etl-diario"
```

Se funcionar, você verá:

- ✅ Status: `success: true`
- ✅ Unidades processadas
- ✅ Métricas salvas
- ✅ Alertas gerados (se houver anomalias)

**Depois disso**, você pode testar as APIs de IA (que precisam do OpenAI).

---

**Documentação relacionada:**

- [CHECKLIST_IA_FINANCEIRA.md](../CHECKLIST_IA_FINANCEIRA.md) - Seção 3.1 (ETL)
- [VALIDACAO_SEGURANCA.md](../VALIDACAO_SEGURANCA.md) - Validação RLS
- [lib/analytics/etl.ts](../lib/analytics/etl.ts) - Código fonte ETL
