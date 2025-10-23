# 🔁 Reset Mensal dos Contadores

> **Execução automática da rotação mensal da Lista da Vez, garantindo histórico e auditoria completos.**
>
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Objetivo

Resetar os contadores da Lista da Vez no **último dia de cada mês às 23:59**, salvando o histórico dos barbeiros e garantindo o início de um novo ciclo de atendimento em todas as unidades.

---

## 🧱 Componentes Envolvidos

- 🗃️ Tabelas: `barbers_turn_list`, `barbers_turn_history`
- 🧠 Função SQL: `fn_monthly_reset_turn_list()`
- 🛰️ Edge Function: `supabase/functions/monthly-reset/index.ts`
- 🛡️ Policies RLS: garantem execução segura por unidade

---

## ⚙️ Funcionamento

1. **Agendamento** — Supabase Function é disparada via cron (último dia às 23:59) ou manualmente com chave de serviço.  
2. **Execução** — `fn_monthly_reset_turn_list()` percorre todas as unidades, salva histórico (`barbers_turn_history`) e zera pontuações.  
3. **Reordenação** — posição redefinida considerando data de cadastro.  
4. **Auditoria** — logs gerados no console da Edge Function (ação `monthly_reset_executed`).

---

## 🛰️ Edge Function `monthly-reset`

- **Headers esperados:** `Authorization` ou `apikey` com chave `SERVICE_ROLE`.  
- **Variáveis:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ENVIRONMENT`.  
- **Fluxo de resposta:**
  ```json
  {
    "success": true,
    "message": "Reset mensal executado com sucesso",
    "data": { ... },
    "timestamp": "2025-09-30T23:59:59.000Z"
  }
  ```

---

## 🧾 Execução Manual (SQL)

```sql
-- Reset manual (caso necessite rodar fora do agendamento)
SELECT fn_monthly_reset_turn_list();

-- Verificar histórico recente
SELECT *
  FROM barbers_turn_history
 ORDER BY created_at DESC
 LIMIT 10;
```

---

## 🔍 Monitoramento

- 📜 Verificar logs da função no dashboard Supabase (função `monthly-reset`).
- 🧪 Recomenda-se executar em ambiente de staging antes de produção.
- 🛎️ Configurar alertas (ex.: Slack/Webhook) consumindo os logs ou respostas da função.

---

## ✅ Checklist de Saúde

- [✅] Função SQL `fn_monthly_reset_turn_list` migrada e versionada.  
- [✅] Edge Function deployada com variáveis seguras.  
- [✅] Cron configurado (ou workflow externo agendado).  
- [⚠️] Validar logs após cada execução mensal.  
- [⚠️] Manter script manual para contingência.

