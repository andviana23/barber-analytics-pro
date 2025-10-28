# 🔗 Contratos de Dados e Integrações

> **Catálogo dos contratos utilizados entre UI → Services → Repositories → Supabase, incluindo DTOs, políticas de whitelists e integrações RPC/Edge.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)  
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🎯 Escopo

Este documento centraliza as regras de contratos de dados (DTOs), operações dos repositories e integrações oferecidas via Supabase (RPC e Edge Functions). Não há backend Express; toda comunicação é feita diretamente com o Supabase.

---

## 🗄️ Repositories (Infra Layer)

| Repository                | Operações           | Regras / Observações                                                                                                                                  |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `revenueRepository`       | `create`, `findAll` | • Whitelists/blacklists em `revenueDTO` • Filtros: `unit_id`, intervalo de `date`, `status`, `type`, `account_id`, `category_id`, `payment_method_id` |
| `expenseRepository`       | CRUD                | • Validação Zod (`expenseDTO`) • Mesmos padrões de filtros e whitelists                                                                               |
| `bankStatementRepository` | CRUD + filtros      | • Suporte a reconciliação • Usa `bankStatementDTO` e hash único para deduplicação                                                                     |

---

## 🧠 DTOs (Domain Layer)

- **Receitas — `src/dtos/revenueDTO.js`**
  - Status do banco: `Pending`, `Partial`, `Received`, `Paid`, `Cancelled`, `Overdue`.
  - Whitelist: campos financeiros (`value`, `gross_amount`, `net_amount`, `fees`), relacionamentos (`unit_id`, `account_id`, `professional_id`, `payment_method_id`, `category_id`, `party_id`, `user_id`), datas (`date`, `accrual_*`, `expected_receipt_date`, `actual_receipt_date`) e metadados (`source`, `source_hash`, `observations`, `status`).
  - Blacklist: campos calculados (`profit`, `profit_margin`, etc.), auto-gerados (`id`, `created_at`), variantes em português (legado).

- **Despesas — `src/dtos/expenseDTO.js`**
  - Schemas Zod (`CreateExpenseDTO`, `UpdateExpenseDTO`, `ExpenseFiltersDTO`).
  - Obrigatórios: `unit_id`, `value`, `date`, `status`, `description`.
  - Opcionais: `type`, `account_id`, `category_id`, `party_id`, `expected_payment_date`, `actual_payment_date`, `observations`, `user_id`.

- **Extratos — `src/dtos/bankStatementDTO.js`**
  - Obrigatórios: `bank_account_id`, `transaction_date`, `description`, `amount`, `type (Credit|Debit)`, `hash_unique`.
  - Opcionais: `status`, `reconciled`, `fitid`, `observations`.

- **Lista da Vez — `src/dtos/listaDaVezDTO.js`**
  - DTOs para inicialização, adição de pontos, histórico mensal e estatísticas.
  - Validação rígida de UUID e formatos de data.

---

## 🤖 Services (Application Layer)

- `financeiroService`
  - `getReceitas(filters, pagination)` → delega para o repository e retorna `RevenueResponseDTO`.
  - `createReceita(data)` → valida com DTO, saneia campos e persiste.

- `reconciliationService` & `bankFileParser`
  - Importação de OFX/CSV, cálculo de hash (`hash_unique`), detecção de duplicidade e reconciliação com extratos.

- `dreService`, `cashflowService`, `dashboardService`
  - Agregações, cálculos de indicadores e transformação de dados para UI.

---

## 🛰️ Supabase RPC & Edge Functions

### RPC (PostgreSQL)

| Função                                             | Descrição                                   | Local                                                |
| -------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------- |
| `fn_initialize_turn_list(unit_id)`                 | Inicializa a Lista da Vez para uma unidade  | `supabase/migrations/create_lista_da_vez_tables.sql` |
| `fn_add_point_to_barber(unit_id, professional_id)` | Incrementa pontuação do barbeiro            | idem                                                 |
| `fn_reorder_turn_list(unit_id)`                    | Reordena fila conforme pontos/data cadastro | idem                                                 |
| `fn_monthly_reset_turn_list()`                     | Zera pontos e gera histórico mensal         | idem                                                 |

### Edge Function

- `supabase/functions/monthly-reset/index.ts`
  - Runtime Deno (Supabase Functions).
  - Headers esperados: `Authorization` ou `apikey`.
  - Variáveis ambiente: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Executa `fn_monthly_reset_turn_list()` e gera logs/auditoria.

---

## 👓 Views de Apoio

- `vw_turn_list_complete` — join de `barbers_turn_list`, `units`, `professionals`.
- `vw_turn_history_complete` — histórico mensal com metadados de unidade/profissional.

---

## 💡 Exemplos Rápidos

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.rpc('fn_monthly_reset_turn_list');
```

---

## 📌 Observações

- 📁 A fonte da verdade dos contratos está nos próprios arquivos DTO (`src/dtos/*`).
- 🔌 Todas as integrações externas passam pelo Supabase (Auth, Storage, DB, RPC, Edge). Não há endpoints HTTP Express neste projeto.
