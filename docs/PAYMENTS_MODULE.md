# 💳 Módulo de Pagamentos (Payments)

Este documento descreve o módulo de Pagamentos do Barber Analytics Pro: gestão de formas de pagamento, registros de baixa de despesas, prazos e taxas, integração com receitas e conciliação bancária. Inclui um resumo estilo README e detalhes técnicos com arquitetura, schema, RLS e fluxos.

---

## 📌 Resumo Rápido (README)

- Objetivo: centralizar e padronizar pagamentos no financeiro (receitas e despesas) por unidade.
- Escopo:
  - Formas de pagamento (CRUD, ativo/inativo, taxa %, prazo D+N)
  - Baixas de despesas (expense_payments) e atualização de status
  - Uso de forma de pagamento em receitas (para prazos e taxas)
  - Conciliação com extratos (bank_statements) e DRE com taxas automáticas
- Entidades:
  - payment_methods, expenses, expense_payments, revenues, bank_accounts, bank_statements
- Padrões:
  - Clean Architecture (Service/Hook/UI), retorno { data, error }
  - RLS por unidade, permissões por role (admin/gerente)
  - Soft delete por is_active
- Onde usar na UI:
  - Página Formas de Pagamento: `src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx`
  - Baixa de despesas: `src/pages/FinanceiroAdvancedPage/DespesasAccrualTab*.jsx`
- Serviços/Hooks:
  - Service: `src/services/paymentMethodsService.js`
  - Hook: `src/hooks/usePaymentMethods.js`
- SQL relevante:
  - Schema financeiro completo: `supabase/migrations/20251022000001_financial_module_complete_schema.sql`
  - RLS: `supabase/migrations/20251022000002_financial_module_rls_policies.sql`
  - DRE (taxas automáticas): `supabase/migrations/20251030_dre_taxas_automaticas.sql`
  - Tabela de baixas: `db/create_expense_payments_table.sql`

---

## 🏗️ Arquitetura e Componentes

- Camadas: Repository → Service → DTO → Hook → Page
- Principais artefatos:
  - Repository: `src/repositories/paymentMethodsRepository.js`
    - findAll, findById, create, update, softDelete, activate, hardDelete
  - DTOs: `src/dtos/paymentMethodDTO.js`
    - CreatePaymentMethodDTO, UpdatePaymentMethodDTO, PaymentMethodResponseDTO
  - Service: `src/services/paymentMethodsService.js`
    - getPaymentMethods, getPaymentMethodById, createPaymentMethod, updatePaymentMethod,
      deletePaymentMethod (soft), activatePaymentMethod, hardDeletePaymentMethod, getPaymentMethodsStats
    - Agora utiliza Repository + DTOs (sem acesso direto ao Supabase)
  - Hook: `src/hooks/usePaymentMethods.js`
    - Cache TTL, Realtime, loading/error, stats, refetch e mutations (create/update/delete/activate)
  - UI: `src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx`
    - Lista, filtros, KPIs, modal de criação/edição, ativar/desativar (apenas admin)
  - Baixas de despesas: `src/pages/FinanceiroAdvancedPage/DespesasAccrualTab*.jsx`
    - Criação de `expense_payments` e atualização de `expenses.status`

---

## 🗄️ Modelo de Dados (Postgres)

- payment_methods
  - id (uuid, pk)
  - unit_id (uuid, fk → units)
  - name (varchar, unique por unidade)
  - type (varchar) — PIX, Cartão, Dinheiro, Transferência
  - fee_percentage (numeric) — taxa % aplicada à receita (ex.: cartão)
  - receipt_days (integer) — prazo de recebimento em dias corridos (D+N)
  - is_active (boolean)
  - created_at, updated_at (timestamptz)
  - Observações:
    - fee_percentage/receipt_days são usados amplamente no app e na DRE (ver `20251030_dre_taxas_automaticas.sql`).

- revenues (campos relevantes)
  - payment_method_id (uuid, fk → payment_methods)
  - expected_receipt_date, actual_receipt_date, date, data_competencia

- expenses (campos relevantes)
  - expected_payment_date, payment_date, actual_payment_date, status ('pending'|'paid'|'cancelled')

- expense_payments (registro detalhado da baixa)
  - id (uuid, pk), expense_id (fk), unit_id (fk)
  - payment_date (date), bank_id (fk → bank_accounts)
  - paid_value, interest_value, discount_value (numeric)
  - observation, created_by, created_at, updated_at

- bank_statements (suporte à conciliação)
  - reconciled, reconciled_with_type, reconciled_with_id, source_hash

Referências SQL:

- `supabase/migrations/20251022000001_financial_module_complete_schema.sql`
- `db/create_expense_payments_table.sql`

---

## 🔐 RLS e Permissões

- Políticas por tabela (trechos relevantes em `20251022000002_financial_module_rls_policies.sql`):
  - payment_methods
    - SELECT: usuários da mesma unidade (unit_id ∈ get_user_unit_ids())
    - INSERT: admin
    - UPDATE: admin e gerente (na própria unidade)
  - expenses/revenues/bank_statements: acesso restrito à unidade
  - expense_payments: RLS habilitado; políticas locais no arquivo de criação
- Normalização de roles: `get_user_role()` aceita 'admin' e 'administrador' (ver `docs/FIX_RLS_ADMINISTRADOR_ROLE.md`)
- Regras críticas:
  - Profissional precisa estar ativo e vinculado à unidade para operações
  - Soft delete via is_active quando aplicável

---

## 🔄 Fluxos Principais

1. Gestão de Formas de Pagamento (Admin)

- Criar/editar/ativar/desativar em `PaymentMethodsPage.jsx`
- Service valida inputs básicos (nome, taxa 0–100, prazo ≥ 0) e retorna `{ data, error }`
- Hook mantém cache, stats e assinaturas Realtime

2. Baixa de Despesas (Financeiro)

- Na aba de Despesas: abrir modal de baixa ou usar baixa rápida
- Persistência:
  - Inserir em `expense_payments` com valores (pago, juros, desconto, banco)
  - Atualizar `expenses.status = 'Paid'` e `actual_payment_date`

3. Receitas com Forma de Pagamento (Vendas/Recebimentos)

- Associação a `payment_method_id` em `revenues`
- `receipt_days` define previsão de recebimento (D+N)
- `fee_percentage` alimenta a DRE com cálculo automático de taxas

4. Conciliação Bancária

- Importação de `bank_statements` com `source_hash`
- Processo manual/automático relaciona lançamentos com `revenues/expenses`

---

## 🧠 Lógica de Negócio (Highlights)

- Taxas na DRE: `fn_calculate_dre_dynamic()` soma automaticamente `r.value × (pm.fee_percentage/100)` por forma de pagamento e deduz das receitas para obter receita líquida.
- Previsão de recebimento: UI e serviços usam `receipt_days` para exibir D+N e estimar `expected_receipt_date`.
- Deduplicação/Conciliação: `source_hash` em `bank_statements` e `revenues/expenses` (quando aplicável) apoia reconciliação e evita duplicidades.

---

## 🧩 Serviços, Hooks e Contratos

- Service `paymentMethodsService.js`
  - Entrada/Saída: sempre `{ data, error }`
  - Funções:
    - getPaymentMethods(unitId?, includeInactive?)
    - getPaymentMethodById(id)
    - createPaymentMethod({ unit_id, name, fee_percentage, receipt_days, is_active? })
    - updatePaymentMethod(id, updates)
    - deletePaymentMethod(id) → soft delete (is_active=false)
    - activatePaymentMethod(id)
    - hardDeletePaymentMethod(id)
    - getPaymentMethodsStats(unitId)
  - Erros comuns:
    - Nome vazio, taxa fora de 0–100, prazo negativo, violação de unique por unidade

- Hook `usePaymentMethods.js`
  - Estado: `data, loading, error, stats`
  - Ações: `refetch, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, activatePaymentMethod`
  - Realtime: inscrito em `payment_methods` por unidade quando habilitado
  - Cache: Map com TTL de 5 minutos por chave `payment_methods_{unitId}_{includeInactive}`

---

## ✅ Regras de UI (Design System)

- Evitar classes hardcoded. Usar utilitárias do Design System (ver `docs/DESIGN_SYSTEM.md`).
- Exemplos:
  - Botões: `.btn-theme-primary`/`.btn-theme-secondary`
  - Cards: `.card-theme`
  - Inputs: `.input-theme`

Observação: telas legadas podem conter classes Tailwind diretas; priorizar padronização nas evoluções.

---

## 🧪 Testes e Qualidade

- End-to-end e flows financeiros em `e2e/financial-flow.spec.ts`, `e2e/orders-flow.spec.ts`, etc.
- Recomendações:
  - Adicionar testes unitários para `paymentMethodsService` (validações de taxa/prazo e erros de RLS)
  - Testes de integração para baixa de despesas (cria `expense_payments` e muda status)

---

## ⚠️ Edge Cases e Observações

- Duplicidade de nome por unidade (constraint UNIQUE): tratar erro amigável
- Alteração de fee_percentage impacta DRE do período — revisar comunicados internos
- receipt_days = 0 (pagamento imediato); >0 usa D+N (dias corridos)
- Operações multi-unidade: garantir `unit_id` correto em todas as inserções
- RLS: usuário sem vínculo/role adequado verá erros de permissão

---

## 🚀 Próximos Passos (Evolução)

- Extrair `paymentMethodsRepository.js` e DTOs: `CreatePaymentMethodDTO`, `UpdatePaymentMethodDTO`, `PaymentMethodResponseDTO`
- Padrão de Design System nas páginas/inputs antigos
- Endpoint/Edge Function para conciliação assistida por IA com `source_hash`
- Auditoria de RLS do `expense_payments` para alinhar com `get_user_unit_ids()`

---

## 🔗 Referências

- Arquitetura: `docs/ARQUITETURA.md`, `docs/ARCHITECTURE.md`
- Financeiro: `docs/FINANCIAL_MODULE.md`
- DRE: `docs/DRE_MODULE.md`, função `fn_calculate_dre_dynamic`
- RLS (roles): `docs/FIX_RLS_ADMINISTRADOR_ROLE.md`
- Código:
  - `src/services/paymentMethodsService.js`
  - `src/hooks/usePaymentMethods.js`
  - `src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx`
  - `src/pages/FinanceiroAdvancedPage/DespesasAccrualTab*.jsx`
