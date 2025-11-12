# 🕐 Guia de Cron Jobs - Barber Analytics Pro

## ⚡ Crons Automáticos (Vercel Hobby - 2 slots)

### 1. 📊 Relatório Diário (IA Financeira)
- **Horário:** 21:00 BRT (todos os dias)
- **Endpoint:** `/api/cron/relatorio-diario`
- **Função:** Gera relatório diário com análise de IA e envia via Telegram
- **Status:** ✅ Ativo (automático)

### 2. 🔄 ETL Diário
- **Horário:** 03:00 BRT (todos os dias)
- **Endpoint:** `/api/cron/etl-diario`
- **Função:** Processa métricas e consolida dados analíticos
- **Status:** ✅ Ativo (automático)

---

## 🔧 Crons Manuais (executar via curl ou navegador)

### Como Executar Manualmente

```bash
# Template
curl -X GET "https://seu-dominio.vercel.app/api/cron/NOME_DO_ENDPOINT?secret=SEU_CRON_SECRET"

# Ou diretamente no navegador
https://seu-dominio.vercel.app/api/cron/NOME_DO_ENDPOINT?secret=SEU_CRON_SECRET
```

### 3. 💰 Gerar Despesas Recorrentes
- **Endpoint:** `/api/cron/gerar-despesas-recorrentes`
- **Função:** Gera automaticamente despesas recorrentes do mês
- **Recomendação:** Executar **dia 1 de cada mês** antes do ETL
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/gerar-despesas-recorrentes?secret=$CRON_SECRET"
```

### 4. ✅ Validar Saldo Acumulado
- **Endpoint:** `/api/cron/validate-balance`
- **Função:** Valida consistência dos saldos acumulados
- **Recomendação:** Executar **após fechamentos importantes** ou quando suspeitar de inconsistência
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/validate-balance?secret=$CRON_SECRET"
```

### 5. 🔔 Enviar Alertas
- **Endpoint:** `/api/cron/enviar-alertas`
- **Função:** Envia alertas de saúde e anomalias via Telegram
- **Recomendação:** Executar **quando quiser verificar alertas pendentes**
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/enviar-alertas?secret=$CRON_SECRET"
```

### 6. ❤️ Health Check
- **Endpoint:** `/api/cron/health-check`
- **Função:** Verifica saúde do sistema e envia status
- **Recomendação:** Usar **Vercel Analytics** ao invés de cron
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/health-check?secret=$CRON_SECRET"
```

### 7. 📅 Relatório Semanal
- **Endpoint:** `/api/cron/relatorio-semanal`
- **Função:** Gera relatório semanal consolidado
- **Recomendação:** Executar **toda segunda-feira de manhã**
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/relatorio-semanal?secret=$CRON_SECRET"
```

### 8. 📆 Fechamento Mensal
- **Endpoint:** `/api/cron/fechamento-mensal`
- **Função:** Gera relatório de fechamento mensal
- **Recomendação:** Executar **dia 1 de cada mês**
- **Comando:**
```bash
curl "https://seu-dominio.vercel.app/api/cron/fechamento-mensal?secret=$CRON_SECRET"
```

---

## 🎯 Rotina Recomendada

### Diária (Automática)
- ✅ **03:00** - ETL Diário (automático)
- ✅ **21:00** - Relatório Diário com IA (automático)

### Diária (Manual - Opcional)
- 🔧 **02:00** - Gerar Despesas Recorrentes (dia 1 do mês)
- 🔧 **04:00** - Validar Saldo (quando necessário)

### Semanal (Manual)
- 🔧 **Segunda 08:00** - Relatório Semanal

### Mensal (Manual)
- 🔧 **Dia 1 às 08:00** - Fechamento Mensal

---

## 🚀 Automação Avançada

### Opção 1: GitHub Actions (Gratuito)

Criar `.github/workflows/cron-jobs.yml`:

```yaml
name: Cron Jobs Backup

on:
  schedule:
    # Gerar Despesas Recorrentes - Dia 1 às 02:00
    - cron: '0 2 1 * *'
    # Validar Saldo - Diariamente às 04:00
    - cron: '0 4 * * *'
    # Relatório Semanal - Segunda às 06:00
    - cron: '0 6 * * 1'
    # Fechamento Mensal - Dia 1 às 07:00
    - cron: '0 7 1 * *'

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Cron
        run: |
          curl -X GET "${{ secrets.VERCEL_URL }}/api/cron/${{ github.event.schedule }}?secret=${{ secrets.CRON_SECRET }}"
```

### Opção 2: Serviço Externo (cron-job.org)

1. Acesse https://cron-job.org
2. Crie conta gratuita
3. Adicione os endpoints como cron jobs
4. Configure horários conforme necessário

### Opção 3: Upgrade Vercel Pro ($20/mês)

- **40 cron jobs** ilimitados
- **Unlimited cron invocations**
- Vale a pena se o sistema for crítico

---

## 🔒 Segurança

### Proteção dos Endpoints

Todos os crons verificam o `CRON_SECRET`:

```typescript
const secret = req.query.secret || req.headers['x-vercel-cron-secret'];
if (secret !== process.env.CRON_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### Configurar CRON_SECRET

1. Gerar secret seguro:
```bash
openssl rand -base64 32
```

2. Adicionar no Vercel:
```bash
vercel env add CRON_SECRET
```

---

## 📊 Monitoramento

### Logs dos Crons

Ver logs no Vercel Dashboard:
```
https://vercel.com/seu-usuario/barber-analytics-pro/logs
```

### Alertas de Falha

Os crons automaticamente enviam alertas via Telegram quando:
- ❌ Falha na execução
- ⚠️ Timeout (>10min)
- 🔴 Dados inconsistentes detectados

---

## 🆘 Troubleshooting

### Cron não executou

1. **Verificar secret:**
   ```bash
   echo $CRON_SECRET
   ```

2. **Testar endpoint manualmente:**
   ```bash
   curl -v "https://seu-dominio.vercel.app/api/cron/health-check?secret=$CRON_SECRET"
   ```

3. **Ver logs do Vercel:**
   ```bash
   vercel logs --follow
   ```

### Upgrade para Pro se necessário

Se os crons manuais forem inconvenientes:

```bash
vercel upgrade pro
```

Benefícios:
- ✅ 40 cron jobs
- ✅ Execuções ilimitadas
- ✅ Prioridade no processamento
- ✅ Suporte técnico

---

## 📝 Changelog

- **2025-11-12** - Redução de 8 → 2 crons automáticos (limite Hobby)
- **2025-11-10** - Implementação inicial com 8 crons

---

**Última atualização:** 12 de novembro de 2025  
**Autor:** Andrey Viana
