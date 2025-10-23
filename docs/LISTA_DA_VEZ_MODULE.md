# 🪑 Módulo Lista da Vez

> **Sistema de pontuação e ordem de atendimento para barbeiros, com reset mensal automatizado.**
>
> **Criado em:** 2024-10-16  
> **Atualizado em:** 2025-10-22  
> **Autor:** Codex (IA)

---

## 🎯 Visão Geral

A Lista da Vez organiza o atendimento de profissionais por unidade, atribuindo pontos a cada atendimento e garantindo rotação justa. O módulo inclui histórico mensal, reset automático via Edge Function e dashboards em tempo real.

---

## 🔑 Objetivos Principais

- ✅ Listar barbeiros ativos por unidade com pontuação atualizada.
- ✅ Permitir adição manual de pontos (um por vez) com logs.
- ✅ Reordenar automaticamente conforme pontuação/data cadastro.
- ✅ Resetar a fila no último dia do mês às 23:59 (Edge Function).
- ✅ Registrar histórico mensal completo (`barbers_turn_history`).
- ✅ Disponibilizar relatórios e exportações por unidade/período.

---

## 🧱 Arquitetura

| Camada | Artefatos | Descrição |
|--------|-----------|-----------|
| UI | `ListaDaVezPage.jsx`, componentes em `src/molecules/RankingProfissionais` | Visualização em tempo real e ações de pontos |
| Hooks | `useListaDaVez.js`, `useFilaRealtime.js` | Sincronização (Realtime) e cache TanStack Query |
| Services | `listaDaVezService.js`, `turnHistoryService.js`, `filaService.js` | Regras de negócio, reset manual, estatísticas |
| Domain | `listaDaVezDTO.js` | DTOs para inicialização, adição de ponto, histórico, exportação |
| Infra | `supabase/functions/monthly-reset`, migrations `create_lista_da_vez_tables.sql` | Persistência, RLS, funções RPC |

---

## 🗄️ Banco de Dados

- **Tabelas**
  - `barbers_turn_list` — estado atual (pontuação, posição, timestamps).  
  - `barbers_turn_history` — snapshots mensais pós-reset.  
- **Funções SQL** (`create_lista_da_vez_tables.sql`)
  - `fn_initialize_turn_list(unit_id)` — inicializa fila com barbeiros ativos.  
  - `fn_add_point_to_barber(unit_id, professional_id)` — incrementa pontuação e registra logs.  
  - `fn_reorder_turn_list(unit_id)` — ordena por pontos e data de cadastro.  
  - `fn_monthly_reset_turn_list()` — salva histórico e zera pontos.
- **Policies RLS** garantem que cada usuário veja apenas sua unidade.

---

## 🛰️ Edge Function `monthly-reset`

- Local: `supabase/functions/monthly-reset/index.ts` (Deno).  
- Executa `fn_monthly_reset_turn_list()` com chaves `SUPABASE_SERVICE_ROLE_KEY`.  
- Suporta execução manual ou agendada (cron scheduler).  
- Gera logs de auditoria (`monthly_reset_executed`).

---

## 🔄 Fluxos Essenciais

1. **Inicialização** — `fn_initialize_turn_list` preenche a fila ao criar unidade ou reset manual.
2. **Adição de Pontos** — UI chama `listaDaVezService.addPoint()` → RPC `fn_add_point_to_barber` → reorder automático.
3. **Reset Mensal** — Edge Function executa RPC, salva histórico e reordena conforme data de cadastro.
4. **Relatórios** — `turnHistoryService` produz estatísticas (`TurnListStatsDTO`, `TurnHistoryDTO`).

---

## 🎨 UI & Experiência

- Ranking em tempo real com cores por posição.  
- Botões de ação rápida (adicionar ponto, reset manual).  
- Modais para histórico mensal e exportação (`ExportDataDTO`).

---

## 🧪 Testes e Monitoramento

- Recomendado: testes unitários nos DTOs (validação de UUID e datas).  
- Simular Edge Function localmente antes de deploy (Supabase CLI).  
- Monitorar execução mensal via logs e dashboards Supabase.

---

## 📌 Próximos Passos

1. Adicionar métricas de engajamento (turnos concluídos por profissional).  
2. Sincronizar notificações (push/app) para alertar sobre reset e posição.  
3. Criar testes E2E garantindo fluxo de pontuação e reset.

