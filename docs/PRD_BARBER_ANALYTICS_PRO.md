# Product Requirements Document (PRD)
# Barber Analytics Pro

**Versão**: 2.0.0
**Data**: 07 de novembro de 2025
**Status**: Em Produção (65% Completo)
**Autor**: Andrey Viana
**Cliente**: Barbearia Grupo Mangabeiras

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Resumo Executivo

O **Barber Analytics Pro** é uma plataforma SaaS completa de gestão para barbearias premium, projetada para transformar barbearias tradicionais em negócios data-driven através de ferramentas profissionais de gestão financeira, operacional e estratégica.

### 1.2 Problema que Resolve

Barbearias enfrentam:
- ❌ Gestão financeira manual e propensa a erros
- ❌ Falta de visibilidade sobre saúde financeira
- ❌ Dificuldade em controlar múltiplas unidades
- ❌ Perda de clientes por falta de sistema de fidelização
- ❌ No-shows sem sistema de lembretes
- ❌ Comissões calculadas manualmente

### 1.3 Solução Oferecida

Plataforma integrada que oferece:
- ✅ Gestão financeira automatizada com DRE e Fluxo de Caixa
- ✅ Controle de caixa e comandas em tempo real
- ✅ Conciliação bancária inteligente
- ✅ Sistema de lista da vez com rodízio justo
- ✅ Portal dedicado para barbeiros
- ✅ Relatórios executivos com gráficos interativos
- ✅ Multi-tenant (múltiplas unidades)
- ✅ Segurança nível enterprise (RLS)

### 1.4 Métricas de Sucesso

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| Redução de erros financeiros | 95% | 98% ✅ |
| Aumento de retenção de clientes | 30% | 🔜 Pendente (requer Fidelização) |
| Redução de no-shows | 40% | 🔜 Pendente (requer Calendário) |
| Tempo de fechamento de caixa | -70% | -85% ✅ |
| Uptime | >99.9% | 99.95% ✅ |

### 1.5 Público-Alvo

**Personas**:

1. **Dono de Barbearia** (Administrador)
   - Necessita: Visão completa do negócio, múltiplas unidades, relatórios estratégicos
   - Acesso: Total

2. **Gerente**
   - Necessita: Gestão financeira, fechamento de caixa, relatórios da unidade
   - Acesso: Gerencial

3. **Barbeiro**
   - Necessita: Ver lista da vez, criar comandas, acompanhar comissões
   - Acesso: Operacional

4. **Recepcionista**
   - Necessita: Abrir/fechar caixa, criar comandas, gerenciar clientes
   - Acesso: Limitado

---

## 2. STACK TECNOLÓGICA

### 2.1 Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 19.2.0 | Framework principal |
| **Vite** | 7.1.9 | Build tool e dev server |
| **TailwindCSS** | 3.4.18 | Estilização utilitária |
| **React Router** | 7.9.4 | Roteamento SPA |
| **TanStack Query** | 5.90.3 | Cache e estado server-side |
| **Framer Motion** | 12.23.24 | Animações suaves |
| **Recharts** | 3.3.0 | Gráficos e visualizações |
| **React Hook Form** | 7.65.0 | Formulários controlados |
| **Zod** | 4.1.12 | Validação de schemas |
| **Lucide React** | - | Biblioteca de ícones |

### 2.2 Backend & Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| **Supabase** | BaaS (PostgreSQL, Auth, Realtime, Storage) |
| **PostgreSQL** | 17.6 - Banco de dados relacional |
| **Row-Level Security** | Segurança granular a nível de linha |
| **Edge Functions (Deno)** | Serverless functions |
| **Vercel** | Hosting, CI/CD, CDN |

### 2.3 Qualidade & Testes

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Vitest** | 3.2.4 | Testes unitários (60% coverage) |
| **Testing Library** | 16.3.0 | Testes de componentes React |
| **Playwright** | 1.56.0 | Testes E2E (10 spec files) |
| **ESLint** | 9.37.0 | Linting e análise estática |
| **Prettier** | 3.6.2 | Formatação de código |

### 2.4 Arquitetura

**Clean Architecture** com 4 camadas:

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │  React Components (Atomic Design)
│   - Atoms, Molecules, Organisms     │
│   - Pages, Templates                │
├─────────────────────────────────────┤
│   Application Layer                 │  Hooks, Services, DTOs
│   - Business Logic                  │
│   - Use Cases                       │
├─────────────────────────────────────┤
│   Domain Layer (Core)               │  Entities, Value Objects
│   - Business Rules                  │  Aggregates, Domain Services
│   - Framework-independent           │
├─────────────────────────────────────┤
│   Infrastructure Layer              │  Repositories, Supabase Client
│   - External Services               │  APIs, Cache, Storage
└─────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADES IMPLEMENTADAS ✅

### 3.1 Módulo Financeiro (92% Completo)

#### 3.1.1 Fluxo de Caixa Acumulado ✅
**Status**: Totalmente funcional
**Coverage**: 48 testes (38 unitários + 10 E2E)

**Funcionalidades**:
- ✅ Demonstrativo diário com saldo acumulado
- ✅ Filtros: Unidade, Conta Bancária, Período (até 2 anos)
- ✅ Dashboard com 6 KPIs:
  - Saldo Inicial
  - Total de Entradas
  - Total de Saídas
  - Saldo Final
  - Variação Percentual
  - Tendência (crescimento/queda)
- ✅ Tabela interativa com sorting e paginação (TanStack Table)
- ✅ Gráfico de evolução temporal (Recharts)
- 🔜 Export Excel/PDF/CSV (em desenvolvimento)

**Arquivos**:
- [DemonstrativoFluxoPage.jsx](src/pages/DemonstrativoFluxoPage.jsx)
- [useDemonstrativoFluxo.js](src/hooks/useDemonstrativoFluxo.js)
- [demonstrativoFluxoService.js](src/services/demonstrativoFluxoService.js)
- [DemonstrativoFluxoFilters/](src/molecules/DemonstrativoFluxoFilters/)
- [DemonstrativoFluxoSummary/](src/molecules/DemonstrativoFluxoSummary/)
- [DemonstrativoFluxoTable/](src/organisms/DemonstrativoFluxoTable/)

**View do Banco**:
```sql
vw_demonstrativo_fluxo
```

**Rota**: `/demonstrativo-fluxo`

---

#### 3.1.2 DRE (Demonstração do Resultado) ✅
**Status**: Funcional com cálculos automáticos

**Funcionalidades**:
- ✅ Receita Bruta
- ✅ Deduções (taxas de pagamento automáticas)
- ✅ Receita Líquida
- ✅ Custos Fixos (aluguel, salários)
- ✅ Custos Variáveis (produtos, comissões)
- ✅ Lucro Operacional
- ✅ Margem de Lucro Percentual
- ✅ Regime de Competência vs Caixa
- ✅ Comparação entre períodos
- ✅ Export TXT/CSV/PDF

**Arquivos**:
- [DREPage.jsx](src/pages/DREPage.jsx)
- [useDRE.js](src/hooks/useDRE.js)
- [dreService.js](src/services/dreService.js)
- [DREDynamicView.jsx](src/components/finance/DREDynamicView.jsx)

**Função do Banco**:
```sql
fn_calculate_dre(unit_id, start_date, end_date)
```

**Rota**: `/dre`

---

#### 3.1.3 Gestão de Receitas ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar
- ✅ Vinculação: Profissional, Cliente, Unidade
- ✅ Data de competência vs data de pagamento
- ✅ Categorização hierárquica
- ✅ Formas de pagamento com taxa automática
- ✅ Status: Pending, Received, Cancelled
- ✅ Cálculo automático de taxas:
  - Pix: 0%
  - Débito: 2%
  - Crédito: 4%
- ✅ Source tracking (deduplicação via hash)
- ✅ Regime de competência

**Tabela**: `revenues`

**Arquivos**:
- [FinanceiroAdvancedPage.jsx](src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx) - Aba Receitas
- [useRevenues.js](src/hooks/useRevenues.js)
- [revenueService.js](src/services/revenueService.js)

**Rota**: `/financial` (Aba Receitas)

---

#### 3.1.4 Gestão de Despesas ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar
- ✅ Categorização como Fixa ou Variável
- ✅ Vinculação a fornecedor (party)
- ✅ Status: Pending, Paid, Cancelled
- ✅ Data de competência vs pagamento
- 🔜 Despesas recorrentes (planejado)
- 🔜 Parcelamento (planejado)
- 🔜 Anexar comprovantes (planejado)

**Tabela**: `expenses`

**Arquivos**:
- [FinanceiroAdvancedPage.jsx](src/pages/FinanceiroAdvancedPage/FinanceiroAdvancedPage.jsx) - Aba Despesas
- [useExpenses.js](src/hooks/useExpenses.js)
- [expenseService.js](src/services/expenseService.js)

**Rota**: `/financial` (Aba Despesas)

---

#### 3.1.5 Conciliação Bancária ✅
**Status**: Funcional com IA de matching

**Funcionalidades**:
- ✅ Importação de extratos (Excel/CSV)
- ✅ Detecção de duplicatas via hash SHA-256
- ✅ Enriquecimento automático:
  - Detecção de profissional por nome
  - Detecção de cliente
  - Detecção de forma de pagamento
- ✅ Preview para revisão manual
- ✅ Histórico completo de conciliações
- ✅ Matching automático com receitas existentes

**Arquivos**:
- [ConciliacaoPage.jsx](src/pages/ConciliacaoPage/ConciliacaoPage.jsx)
- [bankStatementsService.js](src/services/bankStatementsService.js)
- [reconciliationService.js](src/services/reconciliationService.js)

**Rota**: `/financial` (Aba Conciliação)

---

#### 3.1.6 Múltiplas Contas Bancárias ✅
**Status**: Funcional com auditoria completa

**Funcionalidades**:
- ✅ Cadastro de múltiplas contas por unidade
- ✅ Tipos: Corrente, Poupança, Investimento
- ✅ Saldo inicial, saldo atual, saldo disponível
- ✅ Ajustes de saldo com auditoria
- ✅ Logs de movimentação
- ✅ RLS por unidade
- ✅ Histórico completo

**Tabelas**: `bank_accounts`, `balance_adjustments`, `bank_account_balance_logs`

**Arquivos**:
- [BankAccountsPage.jsx](src/pages/BankAccountsPage/BankAccountsPage.jsx)
- [BankAccountModals/](src/organisms/BankAccountModals/)
- [bankAccountsService.js](src/services/bankAccountsService.js)

**Rota**: `/financeiro/contas-bancarias`

---

### 3.2 Módulo de Pagamentos (100% Completo)

#### 3.2.1 Formas de Pagamento ✅
**Status**: Totalmente funcional

**Funcionalidades**:
- ✅ Cadastro de formas personalizadas
- ✅ Tipos suportados:
  - Pix (D+0, 0%)
  - Débito (D+1, 2%)
  - Crédito 1x a 12x (D+30, 4%)
  - Dinheiro (D+0, 0%)
  - Boleto (D+3, 1.5%)
- ✅ Configuração de taxa percentual
- ✅ Configuração de prazo de recebimento
- ✅ Ativar/desativar por unidade
- ✅ Cálculo automático em receitas

**Tabela**: `payment_methods`

**Arquivos**:
- [PaymentMethodsPage.jsx](src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx)
- [usePaymentMethods.js](src/hooks/usePaymentMethods.js)
- [paymentMethodsService.js](src/services/paymentMethodsService.js)

**Rota**: `/cadastros/formas-pagamento`

---

### 3.3 Módulo de Caixa (100% Completo)

#### 3.3.1 Controle de Caixa ✅
**Status**: Totalmente funcional com testes E2E

**Funcionalidades**:
- ✅ Abertura de caixa com saldo inicial
- ✅ Fechamento de caixa com contagem
- ✅ Relatório de movimentações do dia
- ✅ Histórico completo de caixas
- ✅ Validação de saldo (quebra de caixa)
- ✅ Integração com comandas
- ✅ RLS por unidade

**Tabela**: `cash_registers`

**Arquivos**:
- [CashRegisterPage.jsx](src/pages/CashRegisterPage.jsx)
- [useCashRegister.js](src/hooks/useCashRegister.js)
- [cashRegisterService.js](src/services/cashRegisterService.js)
- [OpenCashModal.jsx](src/components/templates/modals/OpenCashModal.jsx)
- [CloseCashModal.jsx](src/components/templates/modals/CloseCashModal.jsx)

**Testes E2E**: [cash-register-flow.spec.ts](e2e/cash-register-flow.spec.ts)

**Rota**: `/caixa`

---

### 3.4 Módulo de Comandas/Pedidos (100% Completo)

#### 3.4.1 Sistema de Comandas ✅
**Status**: Totalmente funcional com validações atômicas

**Funcionalidades**:
- ✅ Criar comanda vinculada a profissional
- ✅ Adicionar serviços e produtos
- ✅ Cálculo automático de total
- ✅ Aplicar descontos (% ou valor fixo)
- ✅ Aplicar taxas adicionais
- ✅ Fechar comanda com pagamento
- ✅ Cancelar comanda
- ✅ Histórico de comandas
- ✅ Status: OPEN, CLOSED, CANCELLED
- ✅ Validação atômica (transações)
- ✅ Geração automática de receita ao fechar
- ✅ Performance: < 2s para listar 1000+ comandas

**Tabelas**: `orders`, `order_items`

**Arquivos**:
- [OrdersPage.jsx](src/pages/OrdersPage.jsx)
- [OrderHistoryPage.jsx](src/pages/OrderHistoryPage.jsx)
- [useOrders.js](src/hooks/useOrders.js)
- [orderService.js](src/services/orderService.js)
- [OrderModal.jsx](src/components/templates/modals/OrderModal.jsx)
- [OrderPaymentModal.jsx](src/components/templates/modals/OrderPaymentModal.jsx)

**Migrations**:
- [20251028_add_order_status_enum.sql](supabase/migrations/20251028_add_order_status_enum.sql)
- [20251028_add_discounts_and_fees_system.sql](supabase/migrations/20251028_add_discounts_and_fees_system.sql)
- [20251028_create_atomic_order_functions.sql](supabase/migrations/20251028_create_atomic_order_functions.sql)
- [20251028_create_rls_policies_orders.sql](supabase/migrations/20251028_create_rls_policies_orders.sql)

**Testes E2E**:
- [orders-flow.spec.ts](e2e/orders-flow.spec.ts)
- [orders.spec.ts](e2e/orders.spec.ts)

**Rota**: `/comandas`

---

### 3.5 Módulo de Serviços (100% Completo)

#### 3.5.1 Catálogo de Serviços ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar serviços
- ✅ Nome, descrição, preço, duração
- ✅ Vinculação a unidade
- ✅ Soft delete (is_active)
- ✅ Uso em comandas
- 🔜 Comissões por serviço (planejado)

**Tabela**: `services`

**Arquivos**:
- [ServicesPage.jsx](src/pages/ServicesPage.jsx)
- [useServices.js](src/hooks/useServices.js)
- [serviceService.js](src/services/serviceService.js)
- [ServiceFormModal.jsx](src/components/templates/modals/ServiceFormModal.jsx)

**Testes E2E**: [services-flow.spec.ts](e2e/services-flow.spec.ts)

**Rota**: `/servicos`

---

### 3.6 Módulo de Produtos (100% Completo)

#### 3.6.1 Gestão de Produtos ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar produtos
- ✅ Nome, preço, estoque
- ✅ Movimentação de estoque
- ✅ Uso em comandas
- ✅ Controle por unidade
- ✅ Soft delete (is_active)

**Tabela**: `products`

**Arquivos**:
- [ProductsPage.jsx](src/pages/ProductsPage/ProductsPage.jsx)
- [useProducts.js](src/hooks/useProducts.js)
- [productsService.js](src/services/productsService.js)
- [ProductModals/](src/molecules/ProductModals/)

**Rota**: `/cadastros/produtos`

---

### 3.7 Módulo de Clientes (60% Completo)

#### 3.7.1 CRM Básico ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Cadastro completo (nome, CPF, telefone, email)
- ✅ Histórico de atendimentos
- ✅ Observações e tags
- ✅ Status: Ativo, Inativo, Bloqueado
- ✅ Export para CSV
- ✅ Busca e filtros

**Tabela**: `parties` (type = 'client')

**Arquivos**:
- [ClientsPage.jsx](src/pages/ClientsPage/ClientsPage.jsx)
- [useClients.js](src/hooks/useClients.js)
- [ClientModals/](src/molecules/ClientModals/)

**Rota**: `/cadastros/clientes`

---

### 3.8 Módulo de Lista da Vez (100% Completo)

#### 3.8.1 Sistema de Rodízio ✅
**Status**: Totalmente funcional com Realtime

**Funcionalidades**:
- ✅ Fila ordenada por pontuação
- ✅ Sistema de rodízio justo
- ✅ Adicionar cliente na fila manualmente
- ✅ Atualização automática de pontuação após atendimento
- ✅ Reset automático mensal via cron job
- ✅ Histórico mensal completo
- ✅ Histórico diário detalhado
- ✅ Realtime (WebSocket - atualização em tempo real)
- ✅ RLS por unidade

**Tabelas**:
- `barbers_turn_list` - Lista atual
- `barbers_turn_history` - Histórico mensal
- `barbers_turn_daily_history` - Histórico diário

**Arquivos**:
- [ListaDaVezPage.jsx](src/pages/ListaDaVezPage/ListaDaVezPage.jsx)
- [TurnHistoryPage.jsx](src/pages/TurnHistoryPage/TurnHistoryPage.jsx)
- [useListaDaVez.js](src/hooks/useListaDaVez.js)
- [useFilaRealtime.js](src/hooks/useFilaRealtime.js)
- [listaDaVezService.js](src/services/listaDaVezService.js)

**Migrations**:
- `create_lista_da_vez_tables.sql`
- `20240000000007_setup_monthly_reset_cron.sql`

**Testes E2E**: [turn-list.spec.ts](e2e/turn-list.spec.ts)

**Rotas**:
- `/queue` - Lista atual
- `/queue/history` - Histórico

---

### 3.9 Módulo de Profissionais (100% Completo)

#### 3.9.1 Gestão de Profissionais ✅
**Status**: CRUD completo com RBAC

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar
- ✅ Vinculação com user_id (Supabase Auth)
- ✅ 4 Roles disponíveis:
  - Administrador (admin)
  - Gerente (gerente)
  - Barbeiro (barbeiro)
  - Recepcionista (recepcionista)
- ✅ Comissão padrão por profissional
- ✅ Status ativo/inativo
- ✅ Múltiplas unidades

**Tabela**: `professionals`

**Arquivos**:
- [ProfessionalsPage.jsx](src/pages/ProfessionalsPage/ProfessionalsPage.jsx)
- [useProfissionais.js](src/hooks/useProfissionais.js)
- [professionalService.js](src/services/professionalService.js)

**Rota**: `/professionals` (apenas admin)

---

### 3.10 Módulo de Unidades (100% Completo)

#### 3.10.1 Gestão de Unidades ✅
**Status**: CRUD completo multi-tenant

**Funcionalidades**:
- ✅ CRUD de unidades (barbearias)
- ✅ Multi-tenant (1 database, múltiplas unidades)
- ✅ Dados: Nome, endereço, telefone, email, CNPJ
- ✅ Status ativo/inativo
- ✅ Comparativo entre unidades
- ✅ Dashboard por unidade

**Tabela**: `units`

**Arquivos**:
- [UnitsPage.jsx](src/pages/UnitsPage/UnitsPage.jsx)
- [useUnits.js](src/hooks/useUnits.js)
- [unitsService.js](src/services/unitsService.js)

**Rota**: `/units` (apenas admin)

---

### 3.11 Módulo de Categorias (100% Completo)

#### 3.11.1 Categorização Hierárquica ✅
**Status**: Totalmente funcional

**Funcionalidades**:
- ✅ Categorias para receitas e despesas
- ✅ Estrutura hierárquica (categoria pai/filha)
- ✅ Tipos: Receita, Despesa Fixa, Despesa Variável
- ✅ CRUD completo
- ✅ Dropdown hierárquico inteligente
- ✅ Uso em DRE

**Tabela**: `categories`

**Arquivos**:
- [CategoriesPage.jsx](src/pages/CategoriesPage/CategoriesPage.jsx)
- [useCategories.js](src/hooks/useCategories.js)
- [CategoryHierarchicalDropdown/](src/molecules/CategoryHierarchicalDropdown/)

**Rota**: `/cadastros/categorias`

---

### 3.12 Módulo de Metas (80% Completo)

#### 3.12.1 Metas Financeiras ✅
**Status**: Funcional

**Funcionalidades**:
- ✅ Definição de metas por categoria
- ✅ Acompanhamento de progresso
- ✅ Visualização de atingimento (%)
- ✅ Período: Mensal, Trimestral, Anual
- 🔜 Notificações ao atingir meta (planejado)
- 🔜 Gamificação (planejado)

**Tabela**: `goals`

**View**: `vw_goals_detailed`

**Arquivos**:
- [GoalsPage.jsx](src/pages/GoalsPage/GoalsPage.jsx)
- [useGoals.js](src/hooks/useGoals.js)
- [goalsService.js](src/services/goalsService.js)

**Rota**: `/cadastros/metas`

---

### 3.13 Módulo de Relatórios (100% Completo)

#### 3.13.1 Dashboards Interativos ✅
**Status**: Totalmente funcional com gráficos

**Funcionalidades**:
- ✅ Dashboard executivo consolidado
- ✅ KPIs principais:
  - Receita Total
  - Despesa Total
  - Lucro Líquido
  - MRR (Monthly Recurring Revenue)
  - Clientes Ativos
  - Profissionais Ativos
- ✅ Gráficos interativos:
  - Linha (evolução temporal)
  - Barra (comparativo)
  - Pizza (distribuição)
  - Area (fluxo de caixa)
- ✅ Filtros por unidade e período
- ✅ Comparativo entre períodos
- ✅ Ranking de profissionais
- ✅ Análise de performance

**Componentes de Relatórios**:
- ✅ Relatório DRE Mensal
- ✅ Relatório Fluxo de Caixa
- ✅ Comparativo de Unidades
- ✅ Performance de Profissionais
- ✅ Ranking Table

**Arquivos**:
- [DashboardPage.jsx](src/pages/DashboardPage/DashboardPage.jsx)
- [RelatoriosPage.jsx](src/pages/RelatoriosPage/RelatoriosPage.jsx)
- [useDashboard.js](src/hooks/useDashboard.js)
- [RelatorioDREMensal.jsx](src/pages/RelatoriosPage/components/RelatorioDREMensal.jsx)
- [RelatorioFluxoCaixa.jsx](src/pages/RelatoriosPage/components/RelatorioFluxoCaixa.jsx)
- [RelatorioComparativoUnidades.jsx](src/pages/RelatoriosPage/components/RelatorioComparativoUnidades.jsx)

**Rotas**:
- `/dashboard`
- `/reports`

---

### 3.14 Módulo de Comissões (70% Completo)

#### 3.14.1 Cálculo de Comissões ✅
**Status**: Parcialmente funcional

**Funcionalidades Implementadas**:
- ✅ Relatório de comissões por profissional
- ✅ Cálculo por período
- ✅ Vinculação com serviços
- ✅ Visualização de total

**Funcionalidades Pendentes**:
- 🔜 Regras de comissão customizadas
- 🔜 Comissão fixa + variável
- 🔜 Pagamento de comissões
- 🔜 Histórico de pagamentos

**Tabela**: `professional_service_commissions`

**Arquivos**:
- [CommissionReportPage.jsx](src/pages/CommissionReportPage.jsx)
- [useCommissions.js](src/hooks/useCommissions.js)
- [professionalCommissionService.js](src/services/professionalCommissionService.js)

**Migrations**:
- `create_professional_service_commissions.sql`
- `20250125_create_professional_service_commissions.sql`

**Rota**: `/comissoes`

---

### 3.15 Módulo de Fornecedores (100% Completo)

#### 3.15.1 Cadastro de Fornecedores ✅
**Status**: CRUD completo funcional

**Funcionalidades**:
- ✅ Criar, Ler, Atualizar, Deletar
- ✅ Dados: Nome, CPF/CNPJ, telefone, email
- ✅ Vinculação com despesas
- ✅ Tipo: Pessoa Física ou Jurídica
- ✅ Status ativo/inativo

**Tabela**: `parties` (type = 'supplier')

**Arquivos**:
- [SuppliersPage.jsx](src/pages/SuppliersPage/SuppliersPage.jsx)
- [useSuppliers.js](src/hooks/useSuppliers.js)
- [SupplierModals/](src/molecules/SupplierModals/)

**Rota**: `/cadastros/fornecedores`

---

## 4. FUNCIONALIDADES EM DESENVOLVIMENTO 🚧

### 4.1 Export de Dados (Em Progresso)

**Módulos Afetados**: Fluxo de Caixa, Relatórios

**Funcionalidades Planejadas**:
- 🚧 Export para Excel (formato xlsx)
- 🚧 Export para PDF (relatórios formatados)
- ✅ Export para CSV (parcialmente implementado)
- 🚧 Export para TXT (DRE já suporta)

**Estimativa**: 5 pontos (1 dia)

---

### 4.2 Comissões Avançadas (Em Progresso)

**Status**: 70% completo

**Funcionalidades Pendentes**:
- 🚧 Regras de comissão customizadas
- 🚧 Comissão fixa + variável por profissional
- 🚧 Pagamento de comissões com tracking
- 🚧 Histórico de pagamentos

**Estimativa**: 13 pontos (2 dias)

---

## 5. FUNCIONALIDADES NÃO IMPLEMENTADAS 🔴

---

## ⚠️ ATUALIZAÇÃO DE ESCOPO (7 nov 2025)

**As seguintes funcionalidades foram REMOVIDAS do escopo deste sistema.**

Estas funcionalidades virão através de **integração via API REST com sistema externo** especializado em CRM, agendamento e marketing.

### ❌ Funcionalidades Removidas (Sistema Externo via API)

- ❌ **Calendário de Agendamentos** (RF-04.01)
- ❌ **Sistema de Fidelização** (RF-03.02)
- ❌ **Assinaturas Recorrentes** (RF-03.03)
- ❌ **Lembretes Automáticos** (RF-04.03)
- ❌ **Integração WhatsApp Business**
- ❌ **Integração Google Calendar**

**Justificativa:**
- Foco no core financeiro e operacional
- Redução de complexidade
- Sistemas especializados oferecem melhor experiência
- Mais flexibilidade para o cliente escolher ferramentas
- Menor custo de manutenção

**Documentação Completa:** Ver [ESCOPO_FINAL.md](ESCOPO_FINAL.md)

---

### 5.1 Alta Prioridade (Fase 3 - Sprint Atual)

#### 5.1.1 RF-05.01: Módulo de Comissões (Gestão Manual) 🔴
**Complexidade**: Média
**Estimativa**: 8 pontos (1.5 dias)
**Prioridade**: Alta

**Escopo Ajustado**: Gestão totalmente manual de comissões, sem cálculo automático.

**Objetivo**: Permitir gestão simples e flexível de comissões dos profissionais

**Funcionalidades Planejadas**:
- 🔴 Cadastrar comissão manualmente por profissional
- 🔴 Vincular comissão a serviço/comanda (opcional)
- 🔴 Editar valor de comissão
- 🔴 Marcar comissão como paga/pendente/cancelada
- 🔴 Filtrar comissões por período, profissional, status
- 🔴 **Exportar relatório de comissões para PDF**
- 🔴 Exibir totalizadores (total pago, pendente, por profissional)

**Tabela a Criar**:
```sql
commissions (
  id uuid primary key,
  unit_id uuid references units(id) not null,
  professional_id uuid references professionals(id) not null,
  order_id uuid references orders(id), -- Opcional
  amount decimal(10,2) not null,
  description text,
  reference_date date not null,
  status text check (status in ('pending', 'paid', 'cancelled')) default 'pending',
  paid_at timestamptz,
  paid_by uuid references auth.users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

**Arquivos a Criar**:
- `/src/pages/CommissionsPage.jsx`
- `/src/hooks/useCommissions.js`
- `/src/services/commissionService.js`
- `/src/repositories/commissionRepository.js`
- `/src/organisms/CommissionFormModal.jsx`
- `/src/organisms/CommissionReportPDF.jsx`

**Rota Proposta**: `/comissoes`

**Nota Importante**:
- ❌ **NÃO haverá cálculo automático**
- ❌ **NÃO haverá regras de comissão por serviço**
- ✅ **Gestão 100% manual pelo gerente/admin**

---

#### 5.1.2 RF-01.04: Despesas Recorrentes 🔴
**Complexidade**: Média
**Estimativa**: 8 pontos (1.5 dias)
**Prioridade**: Alta

**Funcionalidades Planejadas**:
- 🔴 Criar despesa recorrente (aluguel, salários, energia)
- 🔴 Frequência: Mensal, Trimestral, Anual
- 🔴 Geração automática de parcelas futuras via Cron Job
- 🔴 Notificação de vencimentos próximos (7 dias antes)
- 🔴 Pausar/retomar recorrência
- 🔴 Editar/cancelar despesas futuras

**Alteração de Tabela**:
```sql
ALTER TABLE expenses ADD COLUMN is_recurring boolean default false;
ALTER TABLE expenses ADD COLUMN recurrence_type text check (recurrence_type in ('monthly', 'quarterly', 'yearly'));
ALTER TABLE expenses ADD COLUMN recurrence_interval integer default 1;
ALTER TABLE expenses ADD COLUMN parent_expense_id uuid references expenses(id);
ALTER TABLE expenses ADD COLUMN installment_number integer;
ALTER TABLE expenses ADD COLUMN total_installments integer;
ALTER TABLE expenses ADD COLUMN next_occurrence_date date;
```

**Arquivos a Modificar**:
- `/src/services/expenseService.js` - Adicionar lógica de recorrência
- `/src/dtos/ExpenseDTO.js` - Validar campos de recorrência
- `/src/pages/FinanceiroAdvancedPage/DespesasAccrualTabRefactored.jsx` - UI para recorrência

**Edge Function**:
```typescript
// /supabase/functions/process-recurring-expenses/index.ts
// Executar diariamente às 00:00
```

---

#### 5.1.3 RF-01.05: Anexar Comprovantes 🔴
**Complexidade**: Baixa
**Estimativa**: 8 pontos (1.5 dias)
**Prioridade**: Média

**Funcionalidades Planejadas**:
- 🟡 Criar despesa recorrente (aluguel, salários)
- 🟡 Frequência: Mensal, Trimestral, Anual
- 🟡 Geração automática de parcelas futuras
- 🟡 Notificação de vencimentos
- 🟡 Pausar/retomar recorrência

**Alteração de Tabela**:
```sql
ALTER TABLE expenses ADD COLUMN is_recurring boolean default false;
ALTER TABLE expenses ADD COLUMN recurrence_frequency text check (recurrence_frequency in ('monthly', 'quarterly', 'annual'));
ALTER TABLE expenses ADD COLUMN recurrence_end_date date;
ALTER TABLE expenses ADD COLUMN parent_expense_id uuid references expenses(id);
```

**Arquivos a Modificar**:
- `/src/services/expenseService.js` - Adicionar lógica de recorrência
- `/src/molecules/ExpenseModal.jsx` - Adicionar campos

**Edge Function**:
```typescript
// /supabase/functions/generate-recurring-expenses/index.ts
// Executar mensalmente
```

---

#### 5.2.3 RF-01.04: Anexar Comprovantes 🟡
**Complexidade**: Baixa
**Estimativa**: 5 pontos (1 dia)
**Prioridade**: Média

**Funcionalidades Planejadas**:
- 🟡 Upload de PDF/imagens para receitas/despesas
- 🟡 Armazenamento no Supabase Storage
- 🟡 Preview de comprovantes
- 🟡 Download de comprovantes
- 🟡 Múltiplos anexos por transação

**Alteração de Tabela**:
```sql
CREATE TABLE attachments (
  id uuid primary key default uuid_generate_v4(),
  entity_type text check (entity_type in ('revenue', 'expense')),
  entity_id uuid,
  file_name text,
  file_path text,
  file_size integer,
  mime_type text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

**Supabase Storage**:
- Bucket: `receipts`
- Path: `{unit_id}/{entity_type}/{entity_id}/{filename}`

**Arquivos a Criar**:
- `/src/molecules/AttachmentUploader.jsx`
- `/src/molecules/AttachmentPreview.jsx`
- `/src/services/attachmentService.js`

---

#### 5.1.4 RF-01.06: Anexar Comprovantes 🔴
**Complexidade**: Baixa
**Estimativa**: 5 pontos (1 dia)
**Prioridade**: Alta

**Funcionalidades Planejadas**:
- 🔴 Upload de PDF/imagens (até 5MB)
- 🔴 Vincular a receitas ou despesas
- 🔴 Preview de comprovantes
- 🔴 Download de comprovantes
- 🔴 Excluir comprovantes
- 🔴 Armazenamento no Supabase Storage

**Tabela a Criar**:
```sql
CREATE TABLE financial_attachments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) not null,
  revenue_id uuid references revenues(id),
  expense_id uuid references expenses(id),
  file_path text not null,
  file_name text not null,
  file_size integer,
  mime_type varchar(100),
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now(),

  constraint fk_revenue_or_expense check (
    (revenue_id is not null and expense_id is null) or
    (revenue_id is null and expense_id is not null)
  )
);
```

**Supabase Storage**:
```javascript
// Criar bucket 'receipts'
const { data, error } = await supabase.storage.createBucket('receipts', {
  public: false,
  fileSizeLimit: 5242880, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
});
```

**Arquivos a Criar**:
- `/src/services/storageService.js`
- `/src/hooks/useFileUpload.js`
- `/src/organisms/AttachmentUploader.jsx`
- `/src/molecules/AttachmentCard.jsx`

---

**Total Fase 3 (Sprint Atual)**: 21 pontos (~4 dias de desenvolvimento)

---

### 5.2 Baixa Prioridade (Fase 5 - Opcional)

#### 5.2.1 RF-06.01: Análise Preditiva (BI) 🟢
**Complexidade**: Muito Alta
**Estimativa**: 34 pontos (5 dias)
**Prioridade**: Baixa (Opcional)

**Status**: Funcionalidade opcional para futuro distante, se houver demanda de mercado.

**Funcionalidades Planejadas**:
- 🟢 Prever receita dos próximos 3 meses
- 🟢 Identificar tendências de crescimento/queda
- 🟢 Análise de sazonalidade
- 🟢 Recomendações automáticas
- 🟢 Detecção de anomalias
- 🟢 Análise de churn de clientes

**Tecnologias Sugeridas**:
- Python (scikit-learn, pandas)
- TensorFlow.js (no frontend)
- Edge Functions com Deno

**Arquivos a Criar**:
- `/src/pages/PredictiveAnalyticsPage.jsx`
- `/src/services/predictiveService.js`
- Edge Function: `/supabase/functions/predict-revenue/index.ts`

**Nota**: Esta funcionalidade será revisitada após validação de mercado e feedback de usuários.

---

**Total Fase 5 (Opcional)**: 34 pontos (~5 dias de desenvolvimento)

---

## 6. SEGURANÇA E PERMISSÕES

### 6.1 Autenticação (Supabase Auth)

**Método**: JWT Tokens com auto-refresh

**Fluxo de Autenticação**:
1. Usuário faz login com email/password
2. Supabase Auth valida credenciais
3. Retorna JWT token + session
4. Token armazenado em localStorage
5. Todas as requisições incluem JWT no header `Authorization: Bearer <token>`
6. RLS valida `auth.uid()` em cada query SQL

**Features Implementadas**:
- ✅ Login (email/password)
- ✅ Logout
- ✅ Cadastro (SignUp)
- ✅ Recuperar senha (Forgot Password)
- ✅ Auto-refresh de token
- 🔜 Login com Google (planejado)
- 🔜 2FA (Two-Factor Authentication) (planejado)

**Arquivos**:
- [AuthContext.jsx](src/context/AuthContext.jsx)
- [LoginPage.jsx](src/pages/LoginPage/LoginPage.jsx)
- [SignUpPage.jsx](src/pages/SignUpPage/SignUpPage.jsx)
- [ForgotPasswordPage.jsx](src/pages/ForgotPasswordPage/ForgotPasswordPage.jsx)

---

### 6.2 Controle de Acesso (RBAC)

**4 Roles Implementados**:

#### 1. **Administrador (admin)** 🔴
**Permissões**:
- ✅ Acesso total ao sistema
- ✅ Gerenciar unidades
- ✅ Gerenciar profissionais e usuários
- ✅ Gerenciar configurações globais
- ✅ Ver relatórios de todas as unidades
- ✅ Acesso a todas as funcionalidades

**Casos de Uso**: Dono da rede de barbearias

---

#### 2. **Gerente (gerente)** 🟠
**Permissões**:
- ✅ Gestão financeira completa da unidade
- ✅ Criar e visualizar receitas/despesas
- ✅ Abrir e fechar caixa
- ✅ Criar e fechar comandas
- ✅ Ver relatórios da unidade
- ✅ Gerenciar metas da unidade
- ✅ Ver comissões de profissionais
- ❌ NÃO pode gerenciar profissionais
- ❌ NÃO pode gerenciar unidades

**Casos de Uso**: Gerente de uma barbearia

---

#### 3. **Barbeiro (barbeiro)** 🟡
**Permissões**:
- ✅ Ver lista da vez
- ✅ Criar comandas próprias
- ✅ Ver próprias comissões
- ✅ Atualizar perfil pessoal
- ✅ Portal dedicado do barbeiro
- ❌ NÃO pode ver receitas/despesas
- ❌ NÃO pode abrir/fechar caixa
- ❌ NÃO pode ver comissões de outros

**Casos de Uso**: Barbeiro que atende clientes

---

#### 4. **Recepcionista (recepcionista)** 🟢
**Permissões**:
- ✅ Abrir e fechar caixa
- ✅ Criar comandas para qualquer profissional
- ✅ Ver lista da vez
- ✅ Gerenciar clientes (CRUD)
- ✅ Ver agendamentos (quando implementado)
- ❌ NÃO pode ver receitas/despesas (acesso limitado)
- ❌ NÃO pode ver comissões
- ❌ NÃO pode gerenciar metas

**Casos de Uso**: Recepcionista que atende o balcão

---

### 6.3 Row-Level Security (RLS)

**Implementação**: Políticas nativas do PostgreSQL

**Principais Políticas Implementadas**:

#### Receitas
```sql
-- Ver apenas receitas da própria unidade
CREATE POLICY "view_own_unit_revenues"
ON revenues FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id FROM professionals
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Criar receitas apenas na própria unidade
CREATE POLICY "create_own_unit_revenues"
ON revenues FOR INSERT
WITH CHECK (
  unit_id IN (
    SELECT unit_id FROM professionals
    WHERE user_id = auth.uid() AND is_active = true
    AND role IN ('admin', 'gerente')
  )
);
```

#### Comandas
```sql
-- Ver comandas da unidade
CREATE POLICY "view_orders"
ON orders FOR SELECT
USING (
  unit_id IN (
    SELECT unit_id FROM professionals
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Barbeiros só veem próprias comandas
CREATE POLICY "barbers_view_own_orders"
ON orders FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM professionals
    WHERE user_id = auth.uid() AND role = 'barbeiro'
  )
);
```

#### Profissionais
```sql
-- Apenas admin pode gerenciar profissionais
CREATE POLICY "manage_professionals"
ON professionals FOR ALL
USING (
  get_user_role(auth.uid()) = 'admin'
);
```

**Tabelas com RLS Ativo**:
- ✅ `revenues` - 4 policies
- ✅ `expenses` - 4 policies
- ✅ `orders` - 6 policies
- ✅ `order_items` - 2 policies
- ✅ `professionals` - 3 policies
- ✅ `bank_accounts` - 4 policies
- ✅ `barbers_turn_list` - 3 policies
- ✅ `services` - 4 policies
- ✅ `products` - 4 policies
- ✅ `parties` (clients/suppliers) - 4 policies
- ✅ `cash_registers` - 4 policies

**Total**: 42+ policies ativas

---

### 6.4 Auditoria e Logs

**Funcionalidades Implementadas**:
- ✅ Logs de acesso (`access_logs`) - planejado
- ✅ Histórico de modificações (campo `updated_at` automático)
- ✅ Rastreamento de ações críticas:
  - Abertura/fechamento de caixa
  - Criação/fechamento de comandas
  - Ajustes de saldo bancário
- ✅ Soft delete (campo `is_active`) em todas as entidades
- ✅ Tracking de usuário que criou/modificou (`created_by`, `updated_by`)

**Triggers Automáticos**:
```sql
-- Atualizar updated_at automaticamente
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();
```

**Arquivos**:
- [useAudit.js](src/hooks/useAudit.js)
- [auditService.js](src/services/auditService.js)

---

### 6.5 Proteção de Rotas

**Componentes de Proteção**:

#### `<ProtectedRoute>`
- Requer autenticação
- Redireciona para `/login` se não autenticado

#### `<PublicRoute>`
- Apenas para usuários não autenticados
- Redireciona para `/dashboard` se já autenticado

#### `<ReceptionistRoute>`
- Bloqueia recepcionistas de áreas financeiras sensíveis

#### `<ProtectedRoute roles={['admin', 'gerente']}>`
- Requer roles específicas
- Redireciona para `/unauthorized` se não tiver permissão

**Arquivo**: [ProtectedRoute.jsx](src/components/ProtectedRoute/ProtectedRoute.jsx)

**Exemplo de Uso**:
```jsx
// Apenas admin
<Route path="/units" element={
  <ProtectedRoute roles={['admin']}>
    <UnitsPage />
  </ProtectedRoute>
} />

// Admin ou Gerente
<Route path="/financial" element={
  <ProtectedRoute roles={['admin', 'gerente']}>
    <FinanceiroAdvancedPage />
  </ProtectedRoute>
} />

// Todos autenticados
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

---

## 7. BANCO DE DADOS (PostgreSQL 17.6)

### 7.1 Resumo

- **SGBD**: PostgreSQL 17.6 (Supabase)
- **Total de Tabelas**: 35+
- **Total de Views**: 3+
- **Total de Funções**: 10+
- **Total de Triggers**: 15+
- **Total de Policies (RLS)**: 42+
- **Total de Índices**: 30+
- **Cron Jobs**: 1 (reset mensal lista da vez)

---

### 7.2 Tabelas Principais

#### **Core Tables** (3)
1. `units` - Unidades/Barbearias
2. `professionals` - Profissionais (vinculados com auth.users)
3. `auth.users` - Usuários (gerenciado pelo Supabase Auth)

#### **Financial Tables** (11)
4. `revenues` - Receitas
5. `expenses` - Despesas
6. `bank_accounts` - Contas bancárias
7. `balance_adjustments` - Ajustes de saldo
8. `bank_account_balance_logs` - Logs de movimentação
9. `payment_methods` - Formas de pagamento
10. `categories` - Categorias hierárquicas
11. `parties` - Clientes e Fornecedores (type = 'client' | 'supplier')
12. `cash_registers` - Controle de caixa
13. `goals` - Metas financeiras
14. `professional_service_commissions` - Comissões

#### **Orders Tables** (4)
15. `orders` - Comandas/Pedidos
16. `order_items` - Itens de comanda
17. `services` - Serviços
18. `products` - Produtos

#### **Turn List Tables** (3)
19. `barbers_turn_list` - Lista da vez atual
20. `barbers_turn_history` - Histórico mensal
21. `barbers_turn_daily_history` - Histórico diário

**Total**: 21 tabelas core + 14+ tabelas auxiliares = **35+ tabelas**

---

### 7.3 Views Implementadas

#### 1. `vw_demonstrativo_fluxo`
**Descrição**: Consolida entradas e saídas diárias com saldo acumulado

**Colunas**:
- `date` - Data
- `unit_id` - Unidade
- `bank_account_id` - Conta bancária
- `entradas` - Total de entradas do dia
- `saidas` - Total de saídas do dia
- `saldo_dia` - Saldo do dia (entradas - saídas)
- `saldo_acumulado` - Saldo acumulado (window function)

**SQL**:
```sql
CREATE VIEW vw_demonstrativo_fluxo AS
SELECT
  date,
  unit_id,
  bank_account_id,
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END) AS entradas,
  SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END) AS saidas,
  SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END) AS saldo_dia,
  SUM(SUM(CASE WHEN type = 'entrada' THEN amount ELSE -amount END))
    OVER (PARTITION BY unit_id, bank_account_id ORDER BY date) AS saldo_acumulado
FROM (
  SELECT date, unit_id, bank_account_id, amount, 'entrada' AS type FROM revenues
  UNION ALL
  SELECT date, unit_id, bank_account_id, amount, 'saida' AS type FROM expenses
) AS transactions
GROUP BY date, unit_id, bank_account_id
ORDER BY date;
```

**Uso**: Página de Demonstrativo de Fluxo de Caixa

---

#### 2. `vw_financial_summary`
**Descrição**: Resumo financeiro por unidade e período

**Colunas**:
- `unit_id`
- `period_start`, `period_end`
- `total_receitas`
- `total_despesas`
- `lucro_liquido`
- `margem_lucro`
- `clientes_ativos`
- `profissionais_ativos`

**Uso**: Dashboard executivo

---

#### 3. `vw_goals_detailed`
**Descrição**: Detalhamento de metas com progresso

**Colunas**:
- `goal_id`
- `category_id`
- `target_amount`
- `current_amount`
- `progress_percentage`
- `status` (atingida/não atingida)

**Uso**: Página de Metas

---

### 7.4 Funções do Banco

#### 1. `fn_calculate_dre(unit_id, start_date, end_date)`
**Descrição**: Calcula DRE automaticamente

**Retorno**: JSON
```json
{
  "receita_bruta": 50000.00,
  "deducoes": 2000.00,
  "receita_liquida": 48000.00,
  "custos_fixos": 15000.00,
  "custos_variaveis": 10000.00,
  "lucro_operacional": 23000.00,
  "margem_lucro": 46.0
}
```

**SQL**:
```sql
CREATE OR REPLACE FUNCTION fn_calculate_dre(
  p_unit_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  -- Cálculo completo do DRE
  -- (simplificado)
  SELECT json_build_object(
    'receita_bruta', COALESCE(SUM(amount), 0),
    'deducoes', COALESCE(SUM(amount * fee_percentage / 100), 0),
    -- ... outros campos
  ) INTO v_result
  FROM revenues
  WHERE unit_id = p_unit_id
    AND date BETWEEN p_start_date AND p_end_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

#### 2. `fn_update_updated_at()`
**Descrição**: Trigger automático para atualizar `updated_at`

**SQL**:
```sql
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON {table}
FOR EACH ROW
EXECUTE FUNCTION fn_update_updated_at();
```

---

#### 3. `fn_validate_dates()`
**Descrição**: Valida que `payment_date >= competence_date`

**SQL**:
```sql
CREATE OR REPLACE FUNCTION fn_validate_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_date < NEW.competence_date THEN
    RAISE EXCEPTION 'Data de pagamento não pode ser anterior à data de competência';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### 4. `fn_close_order(order_id)`
**Descrição**: Função atômica para fechar comandas e gerar receita

**SQL**:
```sql
CREATE OR REPLACE FUNCTION fn_close_order(p_order_id uuid)
RETURNS void AS $$
BEGIN
  -- 1. Validar ordem
  -- 2. Calcular total
  -- 3. Criar receita
  -- 4. Atualizar status
  -- 5. Atualizar pontuação barbeiro (lista da vez)
  -- Tudo em uma transação
END;
$$ LANGUAGE plpgsql;
```

---

#### 5. `get_user_role(user_id)`
**Descrição**: Retorna role do usuário (usado em RLS)

**SQL**:
```sql
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text AS $$
  SELECT role FROM professionals
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

---

### 7.5 Índices de Performance

**Índices Críticos Implementados**:

#### Receitas
```sql
CREATE INDEX idx_revenues_unit_date ON revenues(unit_id, date);
CREATE INDEX idx_revenues_professional ON revenues(professional_id);
CREATE INDEX idx_revenues_status ON revenues(status);
CREATE INDEX idx_revenues_source_hash ON revenues(source_hash);
CREATE INDEX idx_revenues_competence_date ON revenues(competence_date);
```

#### Despesas
```sql
CREATE INDEX idx_expenses_unit_date ON expenses(unit_id, date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);
```

#### Comandas
```sql
CREATE INDEX idx_orders_unit_status ON orders(unit_id, status);
CREATE INDEX idx_orders_professional ON orders(professional_id);
CREATE INDEX idx_orders_closed_at ON orders(closed_at);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

#### Profissionais
```sql
CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_unit ON professionals(unit_id);
CREATE INDEX idx_professionals_role ON professionals(role);
```

**Total de Índices**: 30+ (otimizados para queries frequentes)

---

### 7.6 Cron Jobs (pg_cron)

#### 1. Reset Mensal da Lista da Vez
**Execução**: 1º dia de cada mês às 00:00 (America/Sao_Paulo)

**Função**: `fn_reset_monthly_turn_list()`

**SQL**:
```sql
SELECT cron.schedule(
  'reset-monthly-turn-list',
  '0 0 1 * *', -- Min Hora Dia Mês DiaDaSemana
  'SELECT fn_reset_monthly_turn_list()'
);
```

**O que faz**:
1. Salva histórico mensal em `barbers_turn_history`
2. Reseta pontuação de todos os barbeiros para 0
3. Mantém a lista ativa

**Migration**: `20240000000007_setup_monthly_reset_cron.sql`

---

#### 2. Refresh de Materialized Views (Planejado)
**Execução**: A cada hora

**SQL**:
```sql
SELECT cron.schedule(
  'refresh-materialized-views',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_financial_summary'
);
```

---

### 7.7 Migrations

**Diretório**: `/supabase/migrations/`

**Total de Migrations**: 33+ arquivos SQL

**Principais Migrations**:

1. **Criação de Tabelas**:
   - `create_units_table.sql`
   - `create_professionals_table.sql`
   - `create_revenues_table.sql`
   - `create_expenses_table.sql`
   - `create_orders_tables.sql`
   - `create_lista_da_vez_tables.sql`
   - `create_balance_adjustments_table.sql`
   - `create_professional_service_commissions.sql`

2. **Alterações de Schema**:
   - `20251028_add_order_status_enum.sql`
   - `20251028_add_discounts_and_fees_system.sql`
   - `2024_11_05_add_source_hash_to_revenues.sql`
   - `20250124_add_source_to_revenues.sql`

3. **Views e Funções**:
   - `create_vw_demonstrativo_fluxo.sql`
   - `create_vw_goals_detailed.sql`
   - `20251028_create_atomic_order_functions.sql`
   - `20251028_create_validate_order_close_function.sql`

4. **RLS Policies**:
   - `20251028_create_rls_policies_orders.sql`
   - `fix-lista-da-vez-rls.sql`
   - `fix_bank_account_balance_logs_rls.sql`

5. **Correções e Otimizações**:
   - `fix_available_balance_logic.sql`
   - `fix_balance_adjustments_separation.sql`

6. **Cron Jobs**:
   - `20240000000007_setup_monthly_reset_cron.sql`

**Execução**:
- Via Supabase CLI: `supabase db push`
- Via Dashboard: Supabase > SQL Editor > Run migration

---

## 8. TESTES E QUALIDADE

### 8.1 Estratégia de Testes

**Pirâmide de Testes**:

```
       /\
      /  \  10% E2E Tests (Playwright)
     /----\
    /      \  20% Integration Tests (Vitest + Supabase)
   /--------\
  /          \  70% Unit Tests (Vitest)
 /____________\
```

**Objetivo de Cobertura**: 80% (atual: ~60%)

---

### 8.2 Testes Unitários (Vitest)

**Framework**: Vitest 3.2.4
**Coverage Atual**: ~60%
**Meta**: 80%

**Tipos de Testes Unitários**:

1. **Testes de Componentes React** (Testing Library)
   - Renderização
   - Interação do usuário
   - Estados

2. **Testes de Services** (Lógica de Negócio)
   - Cálculos de DRE
   - Validações de dados
   - Transformações

3. **Testes de Hooks** (Custom Hooks)
   - useDemonstrativoFluxo
   - usePeriodFilter
   - useRevenues

4. **Testes de DTOs** (Validação)
   - CreateRevenueDTO
   - CreateExpenseDTO
   - CashflowFilterDTO

**Arquivos de Teste Identificados**:
- [relatorios-refatorado.spec.js](src/__tests__/relatorios/relatorios-refatorado.spec.js)
- [usePeriodFilter.spec.js](src/hooks/__tests__/usePeriodFilter.spec.js)
- `/src/test/unit/` (diretório de testes unitários)

**Configuração**: [vite.config.test.ts](vite.config.test.ts)

**Comandos**:
```bash
# Watch mode (desenvolvimento)
pnpm test

# Single run (CI)
pnpm test:run

# Com coverage
pnpm test:coverage

# Interface visual
pnpm test:ui
```

**Exemplo de Teste**:
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KPICard } from './KPICard'

describe('KPICard', () => {
  it('deve renderizar o valor formatado', () => {
    render(<KPICard label="Receita" value={50000} />)
    expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument()
  })
})
```

---

### 8.3 Testes E2E (Playwright)

**Framework**: Playwright 1.56.0
**Browsers**: Chromium, Firefox, WebKit, Mobile (iPhone 13)

**Total de Spec Files**: 10

**Fluxos Testados**:

#### 1. **Autenticação** ([auth.spec.ts](e2e/auth.spec.ts))
- ✅ Login com sucesso
- ✅ Erro de credenciais inválidas
- ✅ Logout

#### 2. **Controle de Caixa** ([cash-register-flow.spec.ts](e2e/cash-register-flow.spec.ts))
- ✅ Abrir caixa com saldo inicial
- ✅ Registrar movimentações
- ✅ Fechar caixa com contagem
- ✅ Visualizar relatório de caixa

#### 3. **DRE** ([dre-flow.spec.ts](e2e/dre-flow.spec.ts))
- ✅ Calcular DRE do mês atual
- ✅ Calcular DRE do ano atual
- ✅ DRE com período customizado
- ✅ Visualizar estrutura hierárquica do DRE
- ✅ Exibir valores formatados corretamente
- ✅ Exibir lucro líquido positivo em verde
- ✅ Exibir loading durante cálculo
- ✅ Exibir mensagem quando não há dados
- ✅ Alternar entre períodos mantendo estado
- ✅ Export DRE como CSV
- ✅ Export DRE como TXT
- ✅ Abrir visualização para PDF
- ✅ Não permitir calcular sem selecionar unidade

#### 4. **Comandas** ([orders-flow.spec.ts](e2e/orders-flow.spec.ts), [orders.spec.ts](e2e/orders.spec.ts))
- ✅ Criar nova comanda com sucesso
- ✅ Adicionar serviços à comanda
- ✅ Adicionar produtos à comanda
- ✅ Aplicar desconto em uma comanda
- ✅ Fechar comanda com pagamento
- ✅ Cancelar comanda aberta
- ✅ Visualizar comanda no histórico após fechamento
- ✅ Buscar comandas no histórico por período
- ✅ Export histórico para CSV
- ✅ Renderização dos componentes principais
- ✅ Performance: listar 1000+ comandas em < 2s
- ✅ Atualização quando nova comanda é criada

#### 5. **Serviços** ([services-flow.spec.ts](e2e/services-flow.spec.ts))
- ✅ Admin pode criar e editar serviços
- ✅ Recepcionista cadastra serviço com sucesso
- ✅ Gerente edita serviço existente
- ✅ Validar serviço com dados inválidos
- ✅ Filtros de serviços funcionam corretamente
- ✅ Barbeiro sem permissão de editar serviço (botão não aparece)
- ✅ Ativar/desativar serviço (soft delete)
- ✅ Serviços desativados não aparecem corretamente em comandas

#### 6. **Lista da Vez** ([turn-list.spec.ts](e2e/turn-list.spec.ts))
- ✅ Visualizar fila ordenada por pontuação
- ✅ Adicionar cliente na fila
- ✅ Atualizar pontuação após atendimento
- ✅ Realtime: atualização automática

#### 7. **Financeiro** ([financial-flow.spec.ts](e2e/financial-flow.spec.ts))
- ✅ Criar receita com sucesso
- ✅ Criar despesa com sucesso
- ✅ Visualizar fluxo de caixa
- ✅ Aplicar filtros (unidade, período)

#### 8. **Conciliação** ([reconciliation.spec.ts](e2e/reconciliation.spec.ts))
- ✅ Importar extrato bancário (CSV/Excel)
- ✅ Revisar dados enriquecidos
- ✅ Aprovar importação
- ✅ Detectar duplicatas

#### 9. **Demonstrativo de Fluxo** ([demonstrativo-fluxo.spec.ts](e2e/demonstrativo-fluxo.spec.ts))
- ✅ Visualizar demonstrativo com filtros
- ✅ Exibir 6 KPIs corretamente
- ✅ Gráfico de evolução
- ✅ Tabela com saldo acumulado
- ✅ Export de dados

**Configuração**: [playwright.config.ts](playwright.config.ts)

**Comandos**:
```bash
# Rodar todos os testes
npx playwright test

# UI mode (interativo)
npx playwright test --ui

# Debug mode (passo a passo)
npx playwright test --debug

# Rodar um spec específico
npx playwright test e2e/orders-flow.spec.ts

# Rodar em um browser específico
npx playwright test --project=chromium

# Ver relatório
npx playwright show-report
```

**Exemplo de Teste E2E**:
```typescript
import { test, expect } from '@playwright/test'

test('deve criar uma comanda com sucesso', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('input[name="email"]', 'gerente@teste.com')
  await page.fill('input[name="password"]', 'senha123')
  await page.click('button[type="submit"]')

  // Ir para comandas
  await page.goto('/comandas')

  // Criar nova comanda
  await page.click('button:has-text("Nova Comanda")')
  await page.selectOption('select[name="professional_id"]', 'prof-1')
  await page.click('button:has-text("Criar")')

  // Verificar
  await expect(page.locator('text=Comanda criada com sucesso')).toBeVisible()
})
```

---

### 8.4 Qualidade de Código

**Ferramentas Configuradas**:

#### 1. **ESLint** (9.37.0)
**Uso**: Linting e análise estática

**Regras**:
- React Hooks rules
- React Refresh
- Unused vars warning
- Console logs warning (dev only)

**Comandos**:
```bash
pnpm lint           # Executar linter
pnpm lint:fix       # Corrigir automaticamente
```

**Configuração**: `.eslintrc.cjs`

---

#### 2. **Prettier** (3.6.2)
**Uso**: Formatação automática de código

**Configuração**:
- Single quotes
- Semicolons
- 2 spaces indent
- Trailing comma: es5
- Print width: 100

**Comandos**:
```bash
pnpm format         # Formatar código
pnpm format:check   # Verificar formatação
```

**Configuração**: `.prettierrc`

---

#### 3. **TypeScript** (5.7.3)
**Uso**: Type safety (parcial - projeto em migração gradual)

**Status**:
- ✅ Configuração base
- 🚧 Migração gradual de .jsx para .tsx
- 🎯 Meta: 100% TypeScript (Fase 4)

**Comandos**:
```bash
pnpm typecheck      # Verificar tipos
```

**Configuração**: `tsconfig.json`

---

### 8.5 Métricas de Qualidade

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| **Cobertura de Testes** | 80% | ~60% 🟡 |
| **Testes E2E** | 15 specs | 10 specs 🟡 |
| **ESLint Errors** | 0 | 0 ✅ |
| **TypeScript Coverage** | 100% | 30% 🔴 |
| **Lighthouse Performance** | >90 | ~85 🟡 |
| **Lighthouse Accessibility** | >90 | ~88 🟡 |

**Legenda**: ✅ Atingido | 🟡 Quase Lá | 🔴 Precisa Melhorar

---

## 9. DEPLOY E CI/CD

### 9.1 Hospedagem

**Plataforma**: Vercel
**Região**: São Paulo (South America - gru1)
**URL de Produção**: https://barber-analytics-pro.vercel.app (exemplo)

**Features do Vercel**:
- ✅ Deploy automático em push para `main`
- ✅ Preview deploys para Pull Requests
- ✅ Edge Network global (CDN)
- ✅ Serverless Functions
- ✅ Environment Variables seguras
- ✅ Analytics integrado
- ✅ Web Vitals monitoring

---

### 9.2 Variáveis de Ambiente

**Produção** (Vercel Dashboard):
```env
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Desenvolvimento** (`.env.local`):
```env
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Observação**: Nunca commitar `.env.local` (incluído no `.gitignore`)

---

### 9.3 CI/CD Pipeline

**Status Atual**: 🔴 Não Implementado (planejado para Fase 3)

**Pipeline Proposto** (GitHub Actions):

#### Workflow: `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install
      - run: npx playwright test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit, test-e2e]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Estimativa de Implementação**: 3 pontos (0.5 dia)

---

### 9.4 Migrations do Banco

**Diretório**: `/supabase/migrations/`

**Processo de Deploy**:

#### Desenvolvimento Local
```bash
# 1. Criar nova migration
supabase migration new nome_da_migration

# 2. Editar SQL gerado em supabase/migrations/

# 3. Aplicar localmente
supabase db reset

# 4. Testar

# 5. Commitar
git add supabase/migrations/
git commit -m "feat: adicionar migration X"
```

#### Produção (Supabase Dashboard)
1. Acessar Supabase Dashboard > SQL Editor
2. Copiar conteúdo da migration
3. Executar SQL
4. Verificar sucesso

**OU**

```bash
# Via CLI (recomendado)
supabase db push --linked
```

**Migrations Críticas Aplicadas**:
- ✅ Todas as 33+ migrations estão aplicadas em produção

---

### 9.5 Scripts de Deploy

#### `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext js,jsx --fix",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

### 9.6 Monitoramento e Observability

**Status Atual**: 🔴 Não Implementado

**Ferramentas Planejadas**:

#### 1. **Sentry** (Error Tracking)
**Prioridade**: Alta
**Estimativa**: 3 pontos (0.5 dia)

**Features**:
- Tracking de erros frontend
- Tracking de erros backend (Edge Functions)
- Source maps
- Release tracking
- Performance monitoring
- User feedback

**Setup**:
```bash
pnpm add @sentry/react @sentry/vite-plugin
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://...@sentry.io/...",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

---

#### 2. **Vercel Analytics** (Performance)
**Status**: ✅ Disponível (necessita ativação)

**Features**:
- Web Vitals (LCP, FID, CLS)
- Real User Monitoring
- Geographic data
- Device breakdown

**Setup**:
```bash
pnpm add @vercel/analytics
```

```javascript
// src/main.jsx
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

---

#### 3. **LogTail** ou **Better Stack** (Logs)
**Prioridade**: Média
**Estimativa**: 2 pontos (0.5 dia)

**Features**:
- Structured logging
- Log aggregation
- Search and filters
- Alerts

---

## 10. INTEGRAÇÕES EXTERNAS

### 10.1 Integrações Ativas ✅

#### 1. **Supabase** (Backend as a Service)
**Status**: ✅ Ativo
**Uso**: Database, Auth, Realtime, Storage, Edge Functions

**Features Utilizadas**:
- ✅ PostgreSQL 17.6 (Database)
- ✅ Supabase Auth (JWT)
- ✅ Realtime (WebSocket)
- ✅ Row-Level Security (RLS)
- 🔜 Storage (planejado para comprovantes)
- 🔜 Edge Functions (planejadas para automações)

**Região**: South America (São Paulo)
**Plano**: Pro Plan ($25/mês)
**Documentação**: https://supabase.com/docs

---

#### 2. **Vercel** (Hosting & CDN)
**Status**: ✅ Ativo
**Uso**: Hosting, CI/CD, Edge Network, Analytics

**Features Utilizadas**:
- ✅ Deploy automático
- ✅ Preview deploys
- ✅ Environment variables
- ✅ CDN global
- 🔜 Analytics (necessita ativação)
- 🔜 Web Vitals (necessita ativação)

**Plano**: Pro Plan ($20/mês por usuário)
**Documentação**: https://vercel.com/docs

---

### 10.2 Integrações em Teste 🚧

#### 3. **Asaas** (Gateway de Pagamentos)
**Status**: 🔄 Em Teste
**Prioridade**: Média
**Estimativa**: 13 pontos (2 dias)

**Funcionalidades Planejadas**:
- 🚧 Cobranças via Pix
- 🚧 Cobranças via Boleto
- 🚧 Cobranças via Cartão de Crédito
- 🚧 Assinaturas recorrentes (integração com RF-03.03)
- 🚧 Split de pagamentos (comissões)
- 🚧 Webhooks para atualização de status

**API**: https://docs.asaas.com/reference/api-asaas
**Custo**:
- Pix: 0.69%
- Boleto: R$ 2.49
- Cartão: 4.99% (débito), 5.99% (crédito)

**Tabelas a Criar**:
```sql
asaas_charges (
  id uuid primary key,
  subscription_id uuid references subscriptions(id),
  asaas_charge_id text unique,
  status text,
  value decimal(10,2),
  due_date date,
  payment_date date,
  created_at timestamptz
)
```

**Arquivos a Criar**:
- `/src/services/asaasService.js`
- `/supabase/functions/asaas-webhook/index.ts` (Edge Function)

---

### 10.3 Integrações Planejadas 📋

#### 4. **WhatsApp Business API** (Meta)
**Status**: 📋 Planejada
**Prioridade**: Alta (Fase 4)
**Estimativa**: 21 pontos (3 dias)

**Funcionalidades Planejadas**:
- 🔴 Envio de lembretes de agendamento
- 🔴 Confirmação de presença via botões
- 🔴 Notificação de comissões
- 🔴 Templates de mensagens pré-aprovados
- 🔴 Chat suporte (planejado)

**Dependências**: RF-04.03 (Lembretes Automáticos)

**API**: https://developers.facebook.com/docs/whatsapp
**Custo**: R$ 0.10 por mensagem (Brasil)

**Processo de Setup**:
1. Criar Meta Business Account
2. Criar WhatsApp Business App
3. Solicitar aprovação de número
4. Criar e aprovar templates de mensagens
5. Implementar webhook
6. Implementar envio

**Arquivos a Criar**:
- `/src/services/whatsappService.js`
- `/supabase/functions/whatsapp-webhook/index.ts`
- `/supabase/functions/send-whatsapp-message/index.ts`

---

#### 5. **Google Calendar API**
**Status**: 📋 Planejada
**Prioridade**: Média (Fase 5)
**Estimativa**: 13 pontos (2 dias)

**Funcionalidades Planejadas**:
- 🔴 OAuth2 com Google
- 🔴 Sincronização bidirecional de agendamentos
- 🔴 Criar eventos no Google Calendar
- 🔴 Atualizar eventos
- 🔴 Deletar eventos
- 🔴 Notificações via Google

**Dependências**: RF-04.01 (Calendário de Agendamentos)

**API**: https://developers.google.com/calendar/api
**Custo**: Gratuito (quota: 1,000,000 requests/dia)

**Arquivos a Criar**:
- `/src/services/googleCalendarService.js`
- `/src/hooks/useGoogleCalendar.js`
- `/src/organisms/GoogleCalendarSync.jsx`

---

#### 6. **Twilio** (SMS)
**Status**: 📋 Planejada
**Prioridade**: Baixa (Fase 5)
**Estimativa**: 8 pontos (1 dia)

**Funcionalidades Planejadas**:
- 🔴 Envio de SMS (lembretes, confirmações)
- 🔴 SMS para clientes sem WhatsApp

**Dependências**: RF-04.03 (Lembretes Automáticos)

**API**: https://www.twilio.com/docs/sms
**Custo**: R$ 0.35 por SMS (Brasil)

---

#### 7. **SendGrid** (E-mail)
**Status**: 📋 Planejada
**Prioridade**: Baixa (Fase 5)
**Estimativa**: 8 pontos (1 dia)

**Funcionalidades Planejadas**:
- 🔴 E-mails transacionais (lembretes, confirmações)
- 🔴 Relatórios por e-mail
- 🔴 Newsletter (opcional)

**API**: https://sendgrid.com/docs/api-reference/
**Custo**: Gratuito até 100 emails/dia

---

#### 8. **Sentry** (Error Tracking)
**Status**: 📋 Planejada
**Prioridade**: Alta (Fase 3)
**Estimativa**: 3 pontos (0.5 dia)

**Funcionalidades Planejadas**:
- 🔴 Tracking de erros frontend
- 🔴 Tracking de erros backend (Edge Functions)
- 🔴 Performance monitoring
- 🔴 User feedback

**Documentação**: https://docs.sentry.io/platforms/javascript/guides/react/
**Custo**: $26/mês (Team Plan)

---

## 11. ROADMAP E PRIORIZAÇÃO

### 11.1 Resumo de Progresso

| Fase | Status | Completude | Funcionalidades | Pontos |
|------|--------|------------|-----------------|--------|
| **Fase 1** | ✅ Concluída | 100% | Core (Auth, CRUD, RLS) | 89 pts |
| **Fase 2** | ✅ Concluída | 100% | Financeiro Avançado | 55 pts |
| **Fase 3** | 🔄 Em Progresso | 20% | Fidelização, Assinaturas, Calendário | 55 pts |
| **Fase 4** | 📋 Planejada | 0% | Lembretes, Despesas Rec., Anexos | 39 pts |
| **Fase 5** | 📋 Planejada | 0% | Integrações, BI | 68 pts |

**Total de Pontos**: 306 pontos
**Completude Geral**: 65% (200/306 pontos)

---

### 11.2 Fase 3 - Q4 2025 (Alta Prioridade) 🔴

**Período**: Outubro - Dezembro 2025
**Pontos**: 55 pontos (~7 dias)
**Objetivo**: Aumentar retenção e organizar atendimentos

#### Funcionalidades:

1. **RF-04.01: Calendário de Agendamentos** - 21 pts
   - Visualizar agenda (dia/semana/mês)
   - Criar/editar/cancelar agendamentos
   - Drag & drop
   - Detectar conflitos
   - **Impacto**: -40% no-shows

2. **RF-03.02: Sistema de Fidelização** - 13 pts
   - Acumular pontos
   - Resgatar pontos
   - Dashboard de fidelização
   - **Impacto**: +30% retenção

3. **RF-03.03: Assinaturas Recorrentes** - 21 pts
   - Planos mensais/trimestrais/anuais
   - Cobrança automática (Asaas)
   - Calcular MRR
   - **Impacto**: +40% MRR

#### Tarefas Complementares:
- 🔴 Aumentar coverage de testes para 70%
- 🔴 Completar documentação de 3 módulos
- 🔴 Implementar Sentry para error tracking

---

### 11.3 Fase 4 - Q1 2026 (Média Prioridade) 🟡

**Período**: Janeiro - Março 2026
**Pontos**: 39 pontos (~6 dias)
**Objetivo**: Automações e melhorias financeiras

#### Funcionalidades:

1. **RF-04.03: Lembretes Automáticos** - 13 pts
   - WhatsApp/SMS/E-mail 24h antes
   - Confirmação de presença
   - **Impacto**: -40% no-shows

2. **RF-01.04: Despesas Recorrentes** - 8 pts
   - Geração automática de parcelas
   - Notificação de vencimentos
   - **Impacto**: +50% eficiência financeira

3. **RF-01.04: Anexar Comprovantes** - 5 pts
   - Upload de PDF/imagens
   - Storage no Supabase
   - **Impacto**: Auditoria completa

4. **RF-Commissions.02: Comissões Avançadas** - 13 pts
   - Regras customizadas
   - Comissão fixa + variável
   - Pagamento de comissões
   - **Impacto**: +30% transparência

#### Tarefas Complementares:
- 🟡 Implementar CI/CD completo (GitHub Actions)
- 🟡 Aumentar coverage de testes para 80%
- 🟡 Completar documentação restante

---

### 11.4 Fase 5 - Q2 2026 (Baixa Prioridade) 🟢

**Período**: Abril - Junho 2026
**Pontos**: 68 pontos (~10 dias)
**Objetivo**: Integrações e BI

#### Funcionalidades:

1. **Integração WhatsApp Business API** - 21 pts
   - Meta WhatsApp API
   - Templates de mensagens
   - **Impacto**: Comunicação automática

2. **Integração Google Calendar** - 13 pts
   - Sincronização bidirecional
   - **Impacto**: +20% conveniência

3. **Análise Preditiva (BI)** - 34 pts
   - Prever receita
   - Identificar tendências
   - Recomendações automáticas
   - **Impacto**: Decisões data-driven

#### Tarefas Complementares:
- 🟢 Migração completa para TypeScript
- 🟢 Lighthouse Performance > 90
- 🟢 Publicar v3.0.0

---

### 11.5 Priorização por Impacto

**Matriz de Priorização** (Impacto x Esforço):

```
Alto Impacto, Baixo Esforço (Fazer Agora!)
└── RF-03.02: Fidelização (13 pts, +30% retenção)
└── RF-01.04: Anexar Comprovantes (5 pts, auditoria)

Alto Impacto, Alto Esforço (Planejar)
└── RF-04.01: Calendário (21 pts, -40% no-shows)
└── RF-03.03: Assinaturas (21 pts, +40% MRR)
└── Análise Preditiva (34 pts, decisões data-driven)

Baixo Impacto, Baixo Esforço (Encaixar)
└── RF-01.04: Despesas Recorrentes (8 pts)
└── Sentry (3 pts)

Baixo Impacto, Alto Esforço (Evitar)
└── Nenhum identificado
```

---

## 12. CONCLUSÃO

### 12.1 Status Atual do Produto

**Completude Geral**: 65% (200/306 pontos)

**Pontos Fortes**:
- ✅ Arquitetura sólida (Clean + DDD + Atomic Design)
- ✅ Módulo Financeiro robusto e testado (92% completo)
- ✅ Segurança implementada (RLS, JWT, 42+ policies)
- ✅ Documentação técnica extensa (~13,500 linhas)
- ✅ Testes E2E cobrindo fluxos críticos (10 spec files)
- ✅ Design System consistente (dark/light mode)
- ✅ Multi-tenant funcional (múltiplas unidades)
- ✅ Realtime implementado (WebSocket)
- ✅ Performance otimizada (< 2s para 1000+ comandas)

**Áreas de Melhoria**:
- 🔴 Coverage de testes unitários: 60% → Meta: 80%
- 🔴 Documentação de módulos: 6/13 completos
- 🔴 CI/CD não implementado (GitHub Actions)
- 🔴 Monitoring/Observability ausente (Sentry)
- 🟡 Funcionalidades críticas pendentes (3):
  - Calendário de Agendamentos (RF-04.01)
  - Sistema de Fidelização (RF-03.02)
  - Assinaturas Recorrentes (RF-03.03)

---

### 12.2 Próximos Passos Imediatos

**Sprint 1 (3 semanas)**:
1. 🎯 **RF-04.01: Calendário de Agendamentos** (21 pts)
   - Implementar visualização (dia/semana/mês)
   - Criar/editar/cancelar agendamentos
   - Drag & drop com react-big-calendar
   - Testes E2E completos

2. 📚 **Documentação**:
   - Completar 04_MODULES/04_SCHEDULER.md
   - Completar 06_API_REFERENCE.md

3. 🧪 **Testes**:
   - Aumentar coverage para 70%

**Sprint 2 (2 semanas)**:
1. 🎯 **RF-03.02: Sistema de Fidelização** (13 pts)
   - Criar tabelas loyalty_transactions e loyalty_rewards
   - Implementar acúmulo e resgate de pontos
   - Dashboard de fidelização

2. 🔧 **DevOps**:
   - Implementar CI/CD básico (GitHub Actions)
   - Configurar Sentry para error tracking

**Sprint 3 (3 semanas)**:
1. 🎯 **RF-03.03: Assinaturas Recorrentes** (21 pts)
   - Criar planos de assinatura
   - Integrar com Asaas
   - Calcular MRR
   - Dashboard de assinaturas

2. 📚 **Documentação**:
   - Completar 09_DEPLOYMENT_GUIDE.md
   - Completar 11_CONTRIBUTING.md

---

### 12.3 Riscos Identificados e Mitigações

#### Risco 1: **Escalabilidade (Multi-tenant em 1 database)**
**Impacto**: Alto
**Probabilidade**: Média
**Mitigação**:
- Monitorar performance do PostgreSQL
- Considerar sharding futuro se > 100 unidades
- Otimizar queries com índices adequados

---

#### Risco 2: **Testes Insuficientes (60% coverage)**
**Impacto**: Alto
**Probabilidade**: Alta
**Mitigação**:
- Priorizar aumento de coverage nas próximas sprints
- Focar em testes de módulos financeiros críticos
- Meta: 80% coverage até final da Fase 3

---

#### Risco 3: **Falta de Monitoring (Sem Sentry/logs)**
**Impacto**: Médio
**Probabilidade**: Alta
**Mitigação**:
- Implementar Sentry na Sprint 2 (Fase 3)
- Configurar alertas para erros críticos
- Logs estruturados em Edge Functions

---

#### Risco 4: **Dependência de Supabase (Vendor Lock-in)**
**Impacto**: Baixo
**Probabilidade**: Baixa
**Mitigação**:
- Repository Pattern permite troca futura
- PostgreSQL é open-source (portável)
- Backup diário do banco via Supabase

---

### 12.4 Avaliação Final

**Score Geral**: 8.5/10 ⭐

**Breakdown por Categoria**:

| Categoria | Score | Observação |
|-----------|-------|------------|
| **Arquitetura** | 9.5/10 | Clean Architecture + DDD excelente |
| **Funcionalidades Core** | 9.0/10 | Financeiro robusto, falta Calendário |
| **Segurança** | 9.0/10 | RLS completo, JWT, auditoria |
| **Documentação** | 8.0/10 | Extensa, mas 6 módulos pendentes |
| **Testes** | 7.0/10 | E2E bom, unitários precisam aumentar |
| **DevOps/CI/CD** | 6.0/10 | Deploy manual, sem CI/CD |
| **Integrações** | 6.0/10 | Apenas Supabase/Vercel ativos |
| **UX/Design** | 9.0/10 | Design System consistente, responsivo |

**Média Ponderada**: 8.5/10

---

### 12.5 Recomendação

O **Barber Analytics Pro** está **pronto para expansão**. A base está sólida e bem arquitetada.

**Recomendações Finais**:

1. **Foco imediato**: Implementar Fases 3 e 4 (Calendário, Fidelização, Assinaturas)
2. **Prioridade secundária**: Aumentar coverage de testes e completar documentação
3. **Longo prazo**: Implementar BI preditivo e integrações avançadas

Com execução das Fases 3 e 4, o sistema estará **100% pronto para produção em larga escala** e diferenciado no mercado.

---

## 13. ANEXOS

### 13.1 Glossário

| Termo | Definição |
|-------|-----------|
| **RLS** | Row-Level Security - Segurança a nível de linha no PostgreSQL |
| **JWT** | JSON Web Token - Token de autenticação |
| **DRE** | Demonstração do Resultado do Exercício |
| **MRR** | Monthly Recurring Revenue - Receita Recorrente Mensal |
| **Churn** | Taxa de cancelamento de clientes |
| **BaaS** | Backend as a Service |
| **SaaS** | Software as a Service |
| **RBAC** | Role-Based Access Control |
| **DTO** | Data Transfer Object |
| **E2E** | End-to-End (testes) |

---

### 13.2 Referências

**Documentação Interna**:
- [DOCUMENTACAO_INDEX.md](docs/DOCUMENTACAO_INDEX.md) - Índice geral
- [00_OVERVIEW.md](docs/00_OVERVIEW.md) - Visão executiva
- [02_ARCHITECTURE.md](docs/02_ARCHITECTURE.md) - Arquitetura detalhada
- [README.md](README.md) - Documentação principal

**Documentação Externa**:
- [Supabase Docs](https://supabase.com/docs)
- [React 19 Docs](https://react.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)

---

### 13.3 Informações de Contato

**Projeto**: Barber Analytics Pro
**Versão**: 2.0.0
**Data de Criação**: 2024
**Última Atualização**: 07 de novembro de 2025
**Autor**: Andrey Viana
**Cliente**: Barbearia Grupo Mangabeiras
**Licença**: Proprietary - All Rights Reserved © 2025

**Repositório**: github.com/andviana23/barber-analytics-pro
**Documentação**: [/docs/DOCUMENTACAO_INDEX.md](docs/DOCUMENTACAO_INDEX.md)

---

**Fim do PRD**

**Total de Páginas**: ~75
**Total de Palavras**: ~20,000
**Tempo de Leitura Estimado**: 120 minutos
