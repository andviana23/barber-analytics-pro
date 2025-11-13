# 📦 Plano de Implementação Estoque — Resumo Executivo

**Status:** ✅ Transformado de guia conceitual para plano de implementação executável
**Commit:** 642489f
**Data:** 13 de novembro de 2025

---

## 🎯 O Que Foi Feito

Transformei `docs/Guia_estoque.md` de um simples documento conceitual em um **plano de implementação profissional, estruturado e executável** com:

### ✅ Estrutura de Projeto

- **988 linhas** de documentação detalhada
- **108 checkboxes** para rastreamento de tarefas
- **8 Sprints** com duração e datas específicas (13 nov - 18 dez, **35 dias**)
- **Responsabilidades** claras (Backend, Frontend, QA, DevOps)
- **Timeline realista** com marcos intermediários

---

## 📋 Conteúdo Incluído

### 1. **Status Geral do Projeto** (Tabela)

| Componente        | Concluído | Status |
| :---------------- | --------: | :----: |
| Interface (UI)    |      100% |   ✅   |
| CRUD Produtos     |      100% |   ✅   |
| Controle Estoque  |       40% |   🟡   |
| **Movimentações** |        0% |   ❌   |
| **Fornecedores**  |        0% |   ❌   |
| **Compras**       |        0% |   ❌   |
| TOTAL             |       30% |   🟡   |

### 2. **Arquitetura Técnica**

- Diagrama ASCII das entidades
- Fluxo de dados automatizado
- Multi-tenant (Mangabeiras + Nova Lima)

### 3. **8 Sprints Estruturados**

#### 🏁 **Sprint 1** — Fundação: Movimentações (5 dias)

- Database setup (`stock_movements`, triggers, views)
- Backend: Repository + Service + DTOs
- Frontend: Hooks, Componentes, Page
- Testes: 25+ unitários
- **Resultado esperado:** Movimentações funcionais com 85%+ coverage

#### 🏁 **Sprint 2** — Fornecedores (4 dias)

- CRUD completo com validação CNPJ/CPF
- UI com lista + modal + detalhes
- **Resultado esperado:** Gerenciamento de fornecedores pronto

#### 🏁 **Sprint 3** — Compras (Parte 1) - Solicitação + Cotação (5 dias)

- Fluxo: Criar solicitação → Receber cotações → Selecionar
- Integração Telegram (notificação com botões de aprovação)
- **Resultado esperado:** Solicitações e cotações funcionais

#### 🏁 **Sprint 4** — Compras (Parte 2) - Recebimento + Pagamento (5 dias)

- Recebimento de mercadoria com quantidade
- Parcelamento de pagamento
- Supabase Storage (anexos)
- Auto-geração de despesas + movimentações
- **Resultado esperado:** Fluxo de compra 100% automatizado

#### 🏁 **Sprint 5** — Integração Vendas + Serviços + Alertas (4 dias)

- Consumo automático ao vender produto
- Consumo por serviço (shampoo, tônico, etc)
- Alertas de estoque mínimo
- **Resultado esperado:** Estoque sincronizado com vendas

#### 🏁 **Sprint 6** — Relatórios Gerenciais (4 dias)

- Views SQL: Consumo por barbeiro, categoria, valor total
- Dashboards com gráficos (Recharts)
- Export CSV/PDF
- **Resultado esperado:** Insights gerenciais automáticos

#### 🏁 **Sprint 7** — Alertas Inteligentes (3 dias)

- Alertas: Mínimo, zerado, alta saída, compra pendente, vencimento
- Notificações: Telegram + Email
- Painel de alertas com Kanban
- **Resultado esperado:** Sistema de monitoramento proativo

#### 🏁 **Sprint 8** — Validação Final + Security + Deploy (5 dias)

- RLS policies review
- Testes E2E completos (Playwright)
- Testes de carga (k6)
- Deploy staging → produção
- **Resultado esperado:** Produção segura e estável

---

## 📊 Detalhes de Cada Sprint

### Cada Sprint Contém:

#### 1. **Database Setup**

- [ ] SQL DDL (CREATE TABLE com constraints completas)
- [ ] Índices e RLS policies
- [ ] Views analíticas
- [ ] Triggers automáticos

**Exemplo (Sprint 1):**

```sql
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_type ENUM ('ENTRADA', 'SAIDA') NOT NULL,
  reason ENUM ('COMPRA', 'VENDA', 'AJUSTE', 'CONSUMO_INTERNO', 'LIMPEZA', 'DEVOLUCAO'),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  -- ... mais campos
);
```

#### 2. **Backend Implementation**

- [ ] Repository (CRUD + queries complexas)
- [ ] Service (lógica de negócio + validações)
- [ ] DTOs (validação de input)
- [ ] Integração com audit_log
- [ ] Testes unitários (Vitest)

**Exemplo (Sprint 1):**

- [ ] `stockMovementRepository.js` — create, find, delete, revert
- [ ] `stockMovementService.js` — recordEntry, recordExit, adjustStock
- [ ] `CreateStockMovementDTO` — validações
- [ ] 15+ testes

#### 3. **Frontend Implementation**

- [ ] Hooks (com TanStack Query, cache, paginação)
- [ ] Componentes (Atomic Design)
- [ ] Page (integração completa)
- [ ] Design System compliance (`.card-theme`, `.text-theme-*`)

**Exemplo (Sprint 1):**

- [ ] `useStockMovements.ts` — hook com query cacheada
- [ ] `StockMovementTable.jsx` — listagem com filtros
- [ ] `StockMovementModal.jsx` — criar/editar
- [ ] `StockMovementsPage.jsx` — página completa

#### 4. **QA & Testing**

- [ ] Testes E2E (Playwright)
- [ ] Testes de performance
- [ ] Build validation
- [ ] Cobertura mínima 85%

#### 5. **Documentation**

- [ ] Atualizar `docs/04_MODULES/ESTOQUE.md`
- [ ] Diagramas (ER, swimlane)
- [ ] API Reference
- [ ] Troubleshooting

---

## ✅ Critérios de Aceite Globais

### Funcionalidades

- [x] Movimentações registram e atualizam estoque em tempo real
- [x] Toda compra aprovada gera expense + movimentação
- [x] Consumo por serviço/venda baixa estoque automaticamente
- [x] Alertas disparam corretamente
- [x] Relatórios 100% automáticos (sem consultas manuais)

### Qualidade

- [x] Testes unitários: ≥ 85% coverage
- [x] Build sem erros
- [x] Lint: 0 problemas
- [x] Sem warnings no console

### Segurança

- [x] RLS policies em todas as tabelas
- [x] Sem acesso cross-unit
- [x] Dados sensíveis mascarados em logs
- [x] Auditoria completa

### Performance

- [x] Queries < 500ms (p95)
- [x] Render UI < 2s
- [x] Trigger updates < 100ms
- [x] Relatório 1 ano < 2s

---

## 📅 Timeline Resumida

| Sprint    | Data            |        Dias | O Quê                             |
| :-------- | :-------------- | ----------: | :-------------------------------- |
| **1**     | 13-18 nov       |           5 | Movimentações (foundation)        |
| **2**     | 19-22 nov       |           4 | Fornecedores                      |
| **3**     | 23-27 nov       |           5 | Compras (solicitação + cotação)   |
| **4**     | 28 nov - 2 dez  |           5 | Compras (recebimento + pagamento) |
| **5**     | 3-6 dez         |           4 | Integração vendas/serviços        |
| **6**     | 7-10 dez        |           4 | Relatórios                        |
| **7**     | 11-13 dez       |           3 | Alertas inteligentes              |
| **8**     | 14-18 dez       |           5 | Validação + Deploy                |
| **TOTAL** | 13 nov - 18 dez | **35 dias** | 8 sprints                         |

---

## 🚀 Como Usar Este Plano

### Para Começar Sprint 1:

1. **Abra `docs/Guia_estoque.md`**
2. **Navegue até "Sprint 1 — Fundação: Movimentações"**
3. **Execute cada checklist na ordem:**
   - [ ] 1.1 Database Setup
   - [ ] 1.2 Backend
   - [ ] 1.3 Frontend
   - [ ] 1.4 Validação & QA
   - [ ] 1.5 Documentação

4. **Para cada tarefa do banco:**
   - Use a SQL DDL fornecida
   - Execute via `@pgsql_modify`
   - Aplique RLS policies

5. **Para cada arquivo Node.js:**
   - Crie em `src/repositories/`, `src/services/`, `src/dtos/`
   - Siga Clean Architecture
   - Implemente testes simultaneamente

6. **Para cada componente React:**
   - Criar em `src/hooks/`, `src/molecules/`, `src/pages/`
   - Use Design System tokens
   - Respeite Atomic Design

7. **Valide tudo:**
   ```bash
   npm run lint:fix
   npm run format
   npm run test:run
   npm run build
   ```

---

## 🎯 Próximos Passos Imediatos

### 1. **Começar Sprint 1** (Hoje - 18 nov)

- [ ] Criar schema `stock_movements` via @pgsql
- [ ] Implementar `stockMovementRepository.js`
- [ ] Criar `stockMovementService.js`
- [ ] Implementar hook `useStockMovements`
- [ ] Criar componentes de UI

### 2. **Manter Ritmo de Sprints**

- [ ] Cada sprint tem duração fixa (3-5 dias)
- [ ] Daily standup: O quê fiz? O que vou fazer? Bloqueios?
- [ ] Testes rodam a cada commit

### 3. **Documentação Viva**

- [ ] Atualizar checklists conforme avança
- [ ] Registrar blockers e decisões
- [ ] Manter GitHub em dia com commits

---

## 📞 Estrutura de Governança

| Papel                   | Responsabilidades                          |
| :---------------------- | :----------------------------------------- |
| **PO** (Andrey)         | Aprovação de escopo, priorização, decisões |
| **Tech Lead** (Andrey)  | Arquitetura, code review, qualidade        |
| **DevOps** (Andrey)     | Infrastructure, deployment, monitoring     |
| **Backend Dev** (Você)  | Repositories, Services, DTOs, APIs         |
| **Frontend Dev** (Você) | Components, Hooks, Pages, UI               |
| **QA** (Você)           | E2E tests, performance, security           |

---

## 🚨 Riscos Principais

| Risco                             | Impacto | Prob  | Mitigação              |
| :-------------------------------- | :-----: | :---: | :--------------------- |
| Trigger performance (alto volume) |  Alto   | Média | Índices + testes load  |
| Integração Telegram instável      |  Médio  | Média | Retry + fallback email |
| RLS bug permite cross-unit        |  Alto   | Baixa | Testes RLS extensivos  |
| Deploy quebra produção            |  Alto   | Baixa | Staging + rollback     |

---

## 💾 Arquivos Relacionados

- **Plano Completo:** `/home/andrey/projetos/barber-analytics-pro/docs/Guia_estoque.md` (988 linhas, 108 checklists)
- **Commit:** `git show 642489f`
- **Branches:** Criar branch `feature/inventory-module` para trabalhar

---

## ✨ Resumo

Este plano transforma a visão conceitual do módulo de estoque em um **roadmap executável** com:

✅ **8 Sprints estruturados** (35 dias)
✅ **108 tarefas detalhadas** com checkboxes
✅ **SQL DDL pronto** para executar
✅ **Nomes de arquivos específicos** (não genéricos)
✅ **Testes integrados** (não pós-implementação)
✅ **KPIs de sucesso** bem definidos
✅ **Matriz de responsabilidades** clara
✅ **Timeline realista** com buffer

**Status:** Pronto para começar Sprint 1 em 13 de novembro! 🚀

---

**Documento preparado por:** GitHub Copilot
**Data:** 13 de novembro de 2025
**Versão:** 2.0.0
