# 🧱 Arquitetura do Sistema

> **Arquitetura em camadas inspirada em Clean Architecture, com integração direta ao Supabase e fluxo SPA React.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)  
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🎯 Visão Geral

O Barber Analytics Pro adota uma arquitetura em camadas que separa responsabilidades entre **UI**, **Application**, **Domain** e **Infrastructure**. Não existe backend Express dedicado; os dados são persistidos e expostos via **Supabase (PostgreSQL, Auth, Realtime e Edge Functions)**.

### Stack Principal

- ⚛️ React 19 + Vite 7 + Tailwind CSS 3
- 🔌 Supabase JS (`@supabase/supabase-js`)
- 🧮 Zod para validação (DTOs)
- 🗓️ date-fns, ⚙️ react-router-dom, ✨ framer-motion, 📊 Recharts / Chart.js

---

## 🗂️ Estrutura Macro

```
src/
  atoms/         # Componentes UI mínimos
  molecules/     # Composições simples
  organisms/     # Estruturas complexas
  templates/     # Modais/layouts avançados
  pages/         # Páginas completas
  hooks/         # Hooks de dados/UI (TanStack Query + Supabase)
  context/       # Providers (Auth, Theme, Unit, Toast)
  services/      # Orquestração de regras de negócio
  repositories/  # Acesso a dados (Supabase)
  dtos/          # Contratos e validações (Zod/classes)
  utils/         # Funções auxiliares
supabase/
  functions/     # Edge Functions (Deno)
  migrations/    # Schema, policies, views
```

---

## 🧬 Camadas e Responsabilidades

| Camada | Responsabilidades | Artefatos principais |
|--------|-------------------|-----------------------|
| 🎨 UI | Renderização, roteamento, captura de eventos | `src/pages`, `src/atoms`, `src/molecules`, `src/organisms`, `src/templates` |
| 🤖 Application | Orquestra fluxos de negócio, aplica DTOs, coordena contextos | `src/services`, `src/hooks`, `src/context` |
| 🧠 Domain | Contratos, validação, whitelists/blacklists, normalização de status | `src/dtos`, helpers específicos |
| 🗄️ Infrastructure | Persistência via Supabase (CRUD, RPC, views) | `src/repositories`, `src/services/supabase.js`, `supabase/functions`, `supabase/migrations` |

### Fluxos

- **Escrita (Command):** UI → Service → DTO (validação) → Repository → Supabase.
- **Leitura (Query):** UI/Hook → Service (transformação) → Repository → Supabase/View.

---

## 🔐 Segurança e Supabase

- 🛡️ **Row-Level Security** por `unit_id` garante isolamento multi-tenant.
- 🧾 Migrations documentam policies, views e funções (`supabase/migrations/*`).
- ⚙️ Edge Function `monthly-reset` executa `fn_monthly_reset_turn_list()` para o reset automático da Lista da Vez.
- 📦 Storage e Auth gerenciados diretamente via Supabase (sem backend intermediário).

---

## 💼 Módulos Principais

- 💰 **Financeiro:** `financeiroService`, `revenueRepository`, `expenseRepository`, DTOs de receitas/despesas.
- 📈 **DRE:** `dreService.js`, hooks `useDRE`, função SQL `fn_calculate_dre`.
- 🔄 **Conciliação:** `reconciliationService`, `bankFileParser`, DTOs de extrato.
- 🧑‍🤝‍🧑 **Lista da Vez:** `listaDaVezService`, edge function `monthly-reset`, migrations `create_lista_da_vez_tables.sql`.

---

## 📌 Convenções

- 📁 Código em inglês; documentação em português.
- 🧾 DTOs mantêm listas brancas/pretas explícitas para segurança.
- 🔄 Services não manipulam Supabase diretamente; usam repositories.
- 🧪 Testes unitários e de integração via Vitest (ver `docs/TESTING.md`).

---

## 📚 Referências Cruzadas

- [`docs/DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — detalhes de tabelas, views e policies.
- [`docs/CONTRATOS.md`](CONTRATOS.md) — DTOs, repositories e RPCs.
- `supabase/migrations/*.sql` — esquema oficial do banco.
- `supabase/functions/monthly-reset/index.ts` — Edge Function em Deno.

