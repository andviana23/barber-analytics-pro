# Product Requirements Document (PRD)
# Barber Analytics Pro

**Versão**: 3.0.0
**Data**: 14 de novembro de 2025
**Status**: Em Produção (92% Completo - MVP Pronto)
**Autor**: Andrey Viana
**Cliente**: Barbearia Grupo Mangabeiras
**Última Atualização**: Análise completa do projeto atual

---

## 📋 ÍNDICE

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Funcionalidades Implementadas](#3-funcionalidades-implementadas)
4. [Funcionalidades em Desenvolvimento](#4-funcionalidades-em-desenvolvimento)
5. [Arquitetura](#5-arquitetura)
6. [Banco de Dados](#6-banco-de-dados)
7. [Integrações](#7-integrações)
8. [Testes](#8-testes)
9. [Roadmap](#9-roadmap)
10. [Métricas e KPIs](#10-métricas-e-kpis)

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Resumo Executivo

O **Barber Analytics Pro** é uma plataforma SaaS completa de gestão para barbearias premium, projetada para transformar barbearias tradicionais em negócios data-driven através de ferramentas profissionais de gestão financeira, operacional e estratégica.

**Status Atual**: 92% completo, pronto para soft launch

### 1.2 Problema que Resolve

Barbearias enfrentam:
- ❌ Gestão financeira manual e propensa a erros
- ❌ Falta de visibilidade sobre saúde financeira
- ❌ Dificuldade em controlar múltiplas unidades
- ❌ Controle de estoque ineficiente
- ❌ Processo de compras desorganizado
- ❌ Comissões calculadas manualmente

### 1.3 Solução Oferecida

Plataforma integrada que oferece:
- ✅ Gestão financeira automatizada com DRE e Fluxo de Caixa
- ✅ Controle de caixa e comandas em tempo real
- ✅ Conciliação bancária inteligente
- ✅ **Sistema de estoque completo (NOVO!)**
- ✅ **Gestão de compras com aprovação via Telegram (NOVO!)**
- ✅ Sistema de lista da vez com rodízio justo
- ✅ Relatórios executivos com IA (GPT-4o)
- ✅ Multi-tenant (múltiplas unidades)
- ✅ Segurança nível enterprise (RLS)

### 1.4 Métricas de Sucesso

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| Redução de erros financeiros | 95% | 98% ✅ |
| Controle de estoque | 100% | 96% ✅ |
| Tempo de fechamento de caixa | -70% | -85% ✅ |
| Uptime | >99.9% | 99.95% ✅ |
| Cobertura de testes | >80% | 40-50% 🔄 |

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

### 2.1 Frontend (React 19.2.0)

#### Core Framework
```
React 19.2.0 (latest)
├─ React DOM 19.2.0
├─ Vite 7.1.12 (build tool)
└─ React Router DOM 7.9.4 (routing)
```

#### UI & Styling
```
TailwindCSS 3.4.18
├─ Headless UI 2.2.9
├─ Radix UI (Dialog, Icons, Tooltip)
├─ Framer Motion 12.23.24 (animações)
├─ Lucide React 0.545.0 (ícones)
├─ Sonner 2.0.7 (toasts)
└─ React Hot Toast 2.6.0
```

#### State Management
```
├─ TanStack Query 5.90.6 (server state)
├─ Context API (auth, unit, theme, toast)
└─ Immer 10.2.0 (immutability)
```

#### Forms & Validation
```
├─ React Hook Form 7.66.0
├─ Hookform Resolvers 5.2.2
├─ Zod 4.1.12
├─ Class Validator 0.14.2
└─ Class Transformer 0.5.1
```

#### Charts & Visualização
```
├─ Recharts 3.3.0
├─ Chart.js 4.5.1
├─ React Chartjs 2 5.3.1
└─ HTML2Canvas 1.4.1
```

#### Data & Tables
```
├─ TanStack Table 8.21.3
├─ Lodash 4.17.21
└─ DanfoJS Node 1.1.2 (data frames)
```

#### Utilities
```
├─ Date-fns 4.1.0
├─ Dayjs 1.11.19
├─ Currency.js 2.0.4
├─ Decimal.js 10.6.0
├─ MathJS 12.0.0
├─ UUID 13.0.0
└─ Validator 13.15.20
```

#### File Handling
```
├─ XLSX 0.18.5
├─ JSPDF 3.0.3
├─ JSPDF Autotable 5.0.2
├─ React Dropzone 14.3.8
└─ Fast XML Parser 5.3.0
```

### 2.2 Backend & Infraestrutura

#### Supabase (BaaS)
```
PostgreSQL 17.6
├─ Supabase JS 2.78.0
├─ Auth (JWT + RLS)
├─ Storage (S3-compatible)
├─ Realtime (WebSocket)
└─ Edge Functions (Deno)
```

#### Node.js Backend (VPS)
```
├─ Express 4.21.2
├─ Multer 2.0.2
├─ CORS 2.8.5
└─ PM2 (process manager)
```

#### Integrações Externas
```
├─ OpenAI 4.67.0 (GPT-4o-mini)
├─ Telegram Bot API
└─ GitHub Actions (CI/CD)
```

#### Logging
```
├─ Pino 10.1.0
├─ Pino Pretty 13.1.2
└─ Chalk 5.6.2
```

### 2.3 DevTools & Testing

#### Testing
```
├─ Vitest 3.2.4
├─ Playwright 1.56.1
├─ Testing Library React 16.3.0
├─ Testing Library Jest DOM 6.9.1
├─ JSDOM 27.1.0
└─ Supertest 7.1.4
```

#### Linting & Formatting
```
├─ ESLint 9.39.0
├─ TypeScript ESLint 8.46.2
├─ Prettier 3.6.2
└─ Husky 9.1.7
```

### 2.4 Arquitetura

**Clean Architecture** com 4 camadas:

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │  React Components (Atomic Design)
│   - 103 Atoms                       │
│   - 166 Molecules                   │
│   - 111 Organisms                   │
│   - 62+ Pages                       │
├─────────────────────────────────────┤
│   Application Layer                 │  Hooks, Services, DTOs
│   - 42 Custom Hooks                 │
│   - 42 Services                     │
│   - 6 DTOs (Estoque, Compras)       │
├─────────────────────────────────────┤
│   Domain Layer (Core)               │  Entities, Value Objects
│   - Business Rules                  │  Aggregates, Domain Services
│   - Framework-independent           │
├─────────────────────────────────────┤
│   Infrastructure Layer              │  Repositories, Supabase Client
│   - 20 Repositories                 │  APIs, Cache, Storage
│   - External Services               │
└─────────────────────────────────────┘
```

---

## 3. FUNCIONALIDADES IMPLEMENTADAS ✅

### 3.1 Módulo Financeiro (95% ✅ - PRODUÇÃO)

#### 3.1.1 Gestão de Receitas - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ReceitasAccrualTab.jsx](src/pages/FinanceiroAdvancedPage/ReceitasAccrualTab.jsx)
- [revenueRepository.js](src/repositories/revenueRepository.js)
- [financeiroService.js](src/services/financeiroService.js)

**Funcionalidades**:
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Regime de competência vs caixa
- ✅ Múltiplas formas de pagamento (Pix, Débito, Crédito 1x-12x, Dinheiro, Boleto)
- ✅ Taxas automáticas por forma de pagamento
- ✅ Prazo de recebimento (D+0, D+1, D+30)
- ✅ Upload de comprovantes (PDF, imagens)
- ✅ Preview e download de anexos
- ✅ Status: Pendente, Recebido, Cancelado
- ✅ Vinculação a profissional e unidade
- ✅ Categorização automática

**Tabela**: `revenues`, `revenue_attachments`
**Rota**: `/financial` (Aba Receitas)

---

#### 3.1.2 Gestão de Despesas - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [DespesasAccrualTabRefactored.jsx](src/pages/FinanceiroAdvancedPage/DespesasAccrualTabRefactored.jsx)
- [expenseRepository.js](src/repositories/expenseRepository.js)
- [expenseService.js](src/services/expenseService.js)

**Funcionalidades**:
- ✅ CRUD completo
- ✅ Despesas recorrentes (Mensal, Trimestral, Anual)
- ✅ Geração automática de parcelas via cron job
- ✅ Parcelamento em múltiplas parcelas
- ✅ Pausar/retomar recorrência
- ✅ Upload de comprovantes
- ✅ Notificações de vencimento (7 dias antes via Telegram)
- ✅ Categorização (Fixa, Variável)
- ✅ Status: Pendente, Pago, Cancelado
- ✅ Vinculação a fornecedor

**Tabela**: `expenses`, `expense_attachments`
**Cron Job**: `/app/api/cron/gerar-despesas-recorrentes/route.ts`
**Rota**: `/financial` (Aba Despesas)

---

#### 3.1.3 Fluxo de Caixa - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [FluxoTabRefactored.jsx](src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx)
- [DemonstrativoFluxoPage.jsx](src/pages/DemonstrativoFluxoPage.jsx)
- [cashflowService.js](src/services/cashflowService.js)
- [fluxoCaixaService.js](src/services/fluxoCaixaService.js)

**Funcionalidades**:
- ✅ Demonstrativo regime de caixa
- ✅ Demonstrativo regime de competência
- ✅ Saldo inicial + entradas + saídas = saldo final
- ✅ Filtros: período (até 2 anos), unidade, conta bancária
- ✅ Gráficos interativos (Recharts)
- ✅ KPIs: Saldo Inicial, Entradas, Saídas, Variação%, Tendência
- ✅ Tabela com sorting e paginação
- 🔄 Export Excel/PDF (70% - em desenvolvimento)
- ✅ Preenchimento automático de dias sem movimentação

**View**: `vw_demonstrativo_fluxo`
**Rota**: `/demonstrativo-fluxo`, `/financial` (Aba Fluxo)

---

#### 3.1.4 DRE (Demonstração de Resultado) - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [DREPage.jsx](src/pages/DREPage.jsx)
- [dreService.js](src/services/dreService.js)
- [DREDynamicView.jsx](src/components/finance/DREDynamicView.jsx)

**Funcionalidades**:
- ✅ Receita bruta
- ✅ Deduções (taxas automáticas)
- ✅ Receita líquida
- ✅ Custos fixos e variáveis
- ✅ Lucro operacional
- ✅ Margem de lucro %
- ✅ Comparação entre períodos
- ✅ Regime de competência e caixa
- ✅ Gráficos comparativos
- ✅ Export TXT/CSV/PDF

**Function**: `fn_calculate_dre(unit_id, start_date, end_date)`
**View**: `dre_dynamic_by_categories`
**Rota**: `/dre`

---

#### 3.1.5 Conciliação Bancária - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ConciliacaoPage.jsx](src/pages/ConciliacaoPage/ConciliacaoPage.jsx)
- [bankFileParser.js](src/services/bankFileParser.js)
- [importRevenueFromStatement.js](src/services/importRevenueFromStatement.js)

**Funcionalidades**:
- ✅ Importação Excel/CSV/OFX
- ✅ Detecção de duplicatas (source_hash SHA-256)
- ✅ Identificação automática:
  - Profissional por nome
  - Cliente
  - Forma de pagamento
- ✅ Revisão manual antes de aprovação
- ✅ Histórico completo de conciliações
- ✅ Marcação de receitas conciliadas
- ✅ Matching automático com receitas existentes

**Tabela**: `bank_statements`
**Rota**: `/financial` (Aba Conciliação)

---

#### 3.1.6 Contas Bancárias - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ContasBancariasTab.jsx](src/pages/FinanceiroAdvancedPage/ContasBancariasTab.jsx)
- [BankAccountsPage.jsx](src/pages/BankAccountsPage/BankAccountsPage.jsx)
- [bankAccountsService.js](src/services/bankAccountsService.js)

**Funcionalidades**:
- ✅ CRUD de múltiplas contas por unidade
- ✅ Tipos: Corrente, Poupança, Investimento
- ✅ Saldo inicial, atual e disponível
- ✅ Ajustes de saldo com auditoria
- ✅ Logs de movimentação
- ✅ RLS por unidade
- ✅ Histórico completo
- ✅ Integração com fluxo de caixa

**Tabelas**: `bank_accounts`, `balance_adjustments`, `bank_account_balance_logs`
**Rota**: `/financeiro/contas-bancarias`

---

#### 3.1.7 Formas de Pagamento - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [PaymentMethodsPage.jsx](src/pages/PaymentMethodsPage/PaymentMethodsPage.jsx)
- [paymentMethodsService.js](src/services/paymentMethodsService.js)

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
**Rota**: `/cadastros/formas-pagamento`

---

#### 3.1.8 Comissões - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [CommissionsPage.jsx](src/pages/CommissionsPage.jsx)
- [commissionService.js](src/services/commissionService.js)
- [professionalCommissionService.js](src/services/professionalCommissionService.js)

**Funcionalidades**:
- ✅ Cadastro manual de comissões por profissional
- ✅ Edição de comissões
- ✅ Deleção de comissões
- ✅ Marcação como Paga/Pendente/Cancelada
- ✅ Filtros por período, profissional, status
- ✅ Exportação de relatório em PDF
- ✅ Totalizadores (pago, pendente, cancelado, por profissional)
- ✅ Integração com histórico de comissões
- ✅ Vinculação opcional a comanda

**Tabela**: `commissions`, `professional_service_commissions`
**Rota**: `/comissoes`

---

#### 3.1.9 Previsão de Fluxo - 70% 🔄
**Status**: Parcialmente funcional
**Arquivos**:
- [CashflowForecastPage.jsx](src/pages/CashflowForecastPage.jsx)
- [cashflowForecastService.js](src/services/cashflowForecastService.js)

**Funcionalidades**:
- ✅ Previsão 30/60/90 dias
- ✅ Gráficos de visualização
- ✅ Baseado em histórico
- ❌ Machine Learning (planejado Q1 2026)
- ❌ Alertas automáticos de risco

**Rota**: `/cashflow-forecast`

---

#### 3.1.10 Metas Financeiras - 60% 🔄
**Status**: Parcialmente funcional
**Arquivos**:
- [GoalsPage.jsx](src/pages/GoalsPage/GoalsPage.jsx)
- [goalsService.js](src/services/goalsService.js)

**Funcionalidades**:
- ✅ CRUD de metas por categoria
- ✅ Visualização de progresso
- ✅ Período: Mensal, Trimestral, Anual
- ❌ Alertas de desvio (planejado)
- ❌ Previsão de atingimento (planejado)

**Tabela**: `goals`
**View**: `vw_goals_detailed`
**Rota**: `/cadastros/metas`

---

### 3.2 Módulo Operacional (100% ✅ - PRODUÇÃO)

#### 3.2.1 Controle de Caixa - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [CashRegisterPage.jsx](src/pages/CashRegisterPage.jsx)
- [cashRegisterService.js](src/services/cashRegisterService.js)

**Funcionalidades**:
- ✅ Abertura de caixa com saldo inicial
- ✅ Fechamento de caixa com saldo final
- ✅ Relatório de movimentações do dia
- ✅ Histórico de caixas fechados
- ✅ Ajustes manuais
- ✅ Validação de saldo (sanity check)
- ✅ Integração com comandas
- ✅ RLS por unidade

**Tabela**: `cash_registers`
**Testes E2E**: [cash-register-flow.spec.ts](e2e/cash-register-flow.spec.ts)
**Rota**: `/caixa`

---

#### 3.2.2 Sistema de Comandas - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [OrdersPage.jsx](src/pages/OrdersPage.jsx)
- [OrderHistoryPage.jsx](src/pages/OrderHistoryPage.jsx)
- [orderService.js](src/services/orderService.js)

**Funcionalidades**:
- ✅ Criar/editar/fechar/cancelar comanda
- ✅ Adicionar/remover itens (serviços/produtos)
- ✅ Cálculo automático de total
- ✅ Aplicar descontos (% ou valor fixo)
- ✅ Aplicar taxa de serviço
- ✅ Múltiplas formas de pagamento
- ✅ Status: Aberta, Fechada, Cancelada
- ✅ Histórico completo
- ✅ Vinculação a profissional
- ✅ Validação atômica (transações)
- ✅ Geração automática de receita ao fechar

**Tabelas**: `orders`, `order_items`, `order_adjustments`
**Performance**: < 2s para listar 1000+ comandas
**Testes E2E**: [orders-flow.spec.ts](e2e/orders-flow.spec.ts)
**Rota**: `/comandas`

---

#### 3.2.3 Catálogo de Serviços - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ServicesPage.jsx](src/pages/ServicesPage.jsx)
- [serviceService.js](src/services/serviceService.js)

**Funcionalidades**:
- ✅ CRUD completo de serviços
- ✅ Nome, descrição, preço, duração
- ✅ Vinculação a unidade
- ✅ Soft delete (is_active)
- ✅ Uso em comandas
- 🔄 Comissões por serviço (70% implementado)

**Tabela**: `services`
**Testes E2E**: [services-flow.spec.ts](e2e/services-flow.spec.ts)
**Rota**: `/servicos`

---

#### 3.2.4 Gestão de Produtos - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ProductsPage.jsx](src/pages/ProductsPage/ProductsPage.jsx)
- [productsService.js](src/services/productsService.js)
- [productsApi.js](src/services/productsApi.js)

**Funcionalidades**:
- ✅ CRUD completo de produtos
- ✅ Nome, preço de custo e venda
- ✅ Estoque atual
- ✅ Margem de lucro automática
- ✅ Categoria
- ✅ Fornecedor
- ✅ Status: Ativo, Inativo
- ✅ Uso em comandas
- ✅ Integração com movimentações de estoque

**Tabela**: `products`
**APIs REST**:
- `POST /app/api/products` - Criar produto
- `GET /app/api/products` - Listar produtos
- `GET /app/api/products/[id]` - Buscar produto
- `PUT /app/api/products/[id]` - Atualizar produto
- `DELETE /app/api/products/[id]` - Deletar produto
- `GET /app/api/products-stats` - Estatísticas de produtos

**Rota**: `/cadastros/produtos`

---

#### 3.2.5 Lista da Vez (Rodízio) - 100% ✅
**Status**: Totalmente funcional com Realtime
**Arquivos**:
- [ListaDaVezPage.jsx](src/pages/ListaDaVezPage/ListaDaVezPage.jsx)
- [TurnHistoryPage.jsx](src/pages/TurnHistoryPage/TurnHistoryPage.jsx)
- [listaDaVezService.js](src/services/listaDaVezService.js)
- [filaService.js](src/services/filaService.js)

**Funcionalidades**:
- ✅ Sistema de fila por pontuação
- ✅ Cada barbeiro tem pontuação
- ✅ Cliente escolhe barbeiro (vai para final da fila)
- ✅ Atualização automática de pontuação após atendimento
- ✅ Reset automático mensal (último dia do mês, 23h)
- ✅ Cron job para reset mensal
- ✅ Histórico mensal completo
- ✅ Histórico diário detalhado
- ✅ Visualização de ranking
- ✅ Backup automático diário
- ✅ Realtime (WebSocket - atualização em tempo real)
- ✅ RLS por unidade

**Tabelas**:
- `barbers_turn_list` - Lista atual
- `barbers_turn_history` - Histórico mensal
- `barbers_turn_list_backup` - Backup automático

**Cron Jobs**:
- `/app/api/cron/fechamento-mensal/route.ts` - Reset mensal
- `/supabase/migrations/backup_diario_lista_da_vez.sql` - Backup diário

**Testes E2E**: [turn-list.spec.ts](e2e/turn-list.spec.ts)
**Rotas**: `/queue`, `/queue/history`

---

### 3.3 Módulo de Estoque (96% ✅ - NOVIDADE! 🆕)

> **DESCOBERTA CRÍTICA**: Este módulo foi completamente implementado mas NÃO estava documentado no PRD anterior!

#### 3.3.1 Movimentações de Estoque - 100% ✅
**Status**: Totalmente funcional e testado
**Arquivos**:
- [StockMovementsPage.jsx](src/pages/StockMovementsPage.jsx) - 297 linhas
- [StockMovementTable.jsx](src/components/stock/StockMovementTable.jsx)
- [StockMovementModal.jsx](src/components/stock/StockMovementModal.jsx)
- [StockSummaryCard.jsx](src/components/stock/StockSummaryCard.jsx)
- [useStockMovements.js](src/hooks/useStockMovements.js) - 466 linhas
- [stockMovementService.js](src/services/stockMovementService.js) - 623 linhas
- [stockMovementRepository.js](src/repositories/stockMovementRepository.js) - 498 linhas
- [stockMovementDTO.js](src/dtos/stockMovementDTO.js) - 520 linhas

**Funcionalidades**:
- ✅ Registro de entradas (ENTRADA)
- ✅ Registro de saídas:
  - SAIDA (saída manual)
  - VENDA (venda ao cliente)
  - SERVICO (uso em serviço)
  - AJUSTE (ajuste de inventário)
  - PERDA (perda/quebra)
  - DEVOLUCAO (devolução a fornecedor)
- ✅ Histórico completo de movimentações
- ✅ Filtros avançados:
  - Período (data início/fim)
  - Produto
  - Tipo de movimentação
  - Motivo
  - Responsável
- ✅ Paginação (20 itens por página)
- ✅ KPIs em tempo real:
  - Total de entradas
  - Total de saídas
  - Saldo atual
- ✅ Validação de estoque negativo
- ✅ Rastreabilidade completa (quem, quando, quanto, por quê)
- ✅ UI responsiva (mobile-first)
- ✅ DTOs com validação completa
- ✅ Integração automática com produtos (atualiza current_stock)

**Tabelas**:
- `stock_movements` - Movimentações
- `products` - Produtos (com current_stock)

**Triggers**:
- `update_product_stock_on_movement` - Atualiza estoque automaticamente

**Testes Unitários**:
- `stockMovementDTO.test.js` - 28 testes (100% coverage ✅)
- `stockMovementService.test.js` - 15 testes (100% coverage ✅)
- `stockMovementRepository.test.js` - 13 testes (100% coverage ✅)

**Documentação**: [Guia_estoque.md](docs/Guia_estoque.md) - 1.500+ linhas

**Rota**: `/stock-movements`

---

#### 3.3.2 Gestão de Fornecedores - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [SuppliersPage.jsx](src/pages/SuppliersPage/SuppliersPage.jsx)
- `lib/repositories/supplierRepository.js`
- `lib/services/supplierService.js`
- `lib/dtos/supplierDTO.js`

**Funcionalidades**:
- ✅ CRUD completo de fornecedores
- ✅ Dados: nome, CNPJ/CPF, contato, endereço, telefone, e-mail
- ✅ Tipo: Pessoa Física ou Jurídica
- ✅ Vinculação a produtos e despesas
- ✅ Status: Ativo, Inativo
- ✅ Histórico de compras
- ✅ Validação de CNPJ/CPF
- ✅ DTOs com validação completa

**Tabela**: `parties` (type = 'supplier')

**Testes**:
- E2E: 22 cenários com Playwright ✅
- Unit: 49 testes (100% coverage ✅)

**Rota**: `/cadastros/fornecedores`

---

### 3.4 Módulo de Compras (85% 🔄 - NOVIDADE! 🆕)

> **DESCOBERTA CRÍTICA**: Sistema de Pedidos de Compra em desenvolvimento avançado mas NÃO documentado!

#### 3.4.1 Solicitações de Compra - 85% 🔄
**Status**: Backend 100%, Frontend 0%, Telegram 85%

**Arquivos Backend**:
- `lib/dtos/purchaseRequestDTO.js` - 598 linhas (100% ✅)
- `lib/repositories/purchaseRequestRepository.js` - 498 linhas (100% ✅)
- `lib/services/purchaseRequestService.js` - 610 linhas (85% 🔄)
- `lib/services/telegramPurchaseBot.js` - (85% 🔄)

**Migrations**:
- `supabase/migrations/20251113000001_create_purchase_requests_schema.sql` (100% ✅)

**Funcionalidades Backend (100% ✅)**:
- ✅ Criar solicitação de compra
- ✅ Adicionar itens à solicitação (produtos + quantidades)
- ✅ Submeter para aprovação
- ✅ Adicionar cotações de fornecedores
- ✅ Selecionar cotação vencedora
- ✅ Workflow completo: DRAFT → PENDING → APPROVED/REJECTED → ORDERED
- ✅ RLS policies (12 políticas)
- ✅ DTOs com validação completa

**Funcionalidades Telegram (85% 🔄)**:
- ✅ Envio de notificação de solicitação
- ✅ Botões de aprovação/rejeição
- 🔄 Callback de aprovação/rejeição (15% pendente)
- 🔄 Notificações de mudança de status

**Funcionalidades Frontend (0% ❌ - BLOQUEADOR!)**:
- ❌ PurchaseRequestsPage.jsx - PENDENTE
- ❌ PurchaseRequestModal.jsx - PENDENTE
- ❌ PurchaseQuotesView.jsx - PENDENTE

**Tabelas**:
- `purchase_requests` - Solicitações
- `purchase_request_items` - Itens da solicitação
- `purchase_quotes` - Cotações de fornecedores

**Enums**:
- `request_status`: DRAFT, PENDING, APPROVED, REJECTED, ORDERED, CANCELLED
- `quote_status`: PENDING, ACCEPTED, REJECTED
- `priority_level`: LOW, MEDIUM, HIGH, URGENT

**Testes**:
- DTOs: 47 testes unitários ✅
- Integration: 30 testes pendentes ❌
- E2E: 0 testes ❌

**Workflow Projetado**:
1. Barbeiro/Gerente cria solicitação (DRAFT)
2. Adiciona produtos + quantidades
3. Submete para aprovação (PENDING)
4. Notificação via Telegram para Admin
5. Admin aprova/rejeita no Telegram
6. Sistema registra cotações de fornecedores
7. Seleciona fornecedor vencedor (APPROVED)
8. Gera compra (ORDERED)
9. Ao receber: gera despesa + movimentação de estoque

**Estimativa para completar**: 3-5 dias (apenas frontend)

---

### 3.5 Módulo de Clientes (60% 🔄)

#### 3.5.1 CRM Básico - 60% ✅
**Status**: Parcialmente funcional
**Arquivos**:
- [ClientsPage.jsx](src/pages/ClientsPage/ClientsPage.jsx)
- [partiesService.js](src/services/partiesService.js)

**Funcionalidades**:
- ✅ CRUD de clientes
- ✅ Campos: nome, CPF, telefone, e-mail
- ✅ Status: Ativo, Inativo, Bloqueado
- ✅ Observações e tags
- ✅ Histórico de atendimentos
- ✅ Último atendimento
- ✅ Total de atendimentos
- ✅ Export para CSV
- ✅ Busca e filtros

**Funcionalidades Pendentes**:
- ❌ Fidelização (pontos e resgates) - Removida do escopo (API externa)
- ❌ Histórico de fidelização

**Tabela**: `parties` (type = 'client')
**Rota**: `/cadastros/clientes`

---

### 3.6 Módulo de Agendamentos (50% 🔄)

#### 3.6.1 Lista da Vez - 100% ✅
(Já documentado em 3.2.5 - Módulo Operacional)

#### 3.6.2 Calendário - 0% ❌
**Status**: Removido do escopo
**Motivo**: Integração via API externa especializada (Q1-Q2 2026)
**Alternativa**: Sistema externo de CRM/Agendamento via API REST

---

### 3.7 Módulo de Relatórios (85% ✅)

#### 3.7.1 Dashboards Interativos - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [DashboardPage.jsx](src/pages/DashboardPage/DashboardPage.jsx)
- [dashboardService.js](src/services/dashboardService.js)

**Funcionalidades**:
- ✅ Dashboard executivo consolidado
- ✅ KPIs principais:
  - Receita Total do período
  - Despesa Total do período
  - Lucro Líquido
  - Margem de Lucro %
  - MRR (Monthly Recurring Revenue)
  - Clientes Ativos
  - Profissionais Ativos
  - Taxa de churn
- ✅ Gráficos interativos (Recharts):
  - Linha (evolução temporal)
  - Barra (comparativo)
  - Pizza (distribuição)
  - Area (fluxo de caixa)
- ✅ Filtros por unidade e período
- ✅ Comparativo entre períodos
- ✅ Realtime via Supabase
- ✅ KPI cards com tendências

**Rota**: `/dashboard`

---

#### 3.7.2 Ranking de Profissionais - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [RelatorioPerformanceProfissionais.jsx](src/pages/RelatoriosPage/components/RelatorioPerformanceProfissionais.jsx)
- [relatoriosService.js](src/services/relatoriosService.js)

**Funcionalidades**:
- ✅ Rankear por comissão gerada
- ✅ Rankear por número de atendimentos
- ✅ Rankear por avaliação média (campo existe)
- ✅ Top 10 do período
- ✅ Exportar ranking para PDF
- ✅ Filtros por período

**Rota**: `/reports` (componente)

---

#### 3.7.3 Relatórios Customizados - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [RelatoriosPage.jsx](src/pages/RelatoriosPage/RelatoriosPage.jsx)

**Componentes**:
- ✅ [RelatorioDREMensal.jsx](src/pages/RelatoriosPage/components/RelatorioDREMensal.jsx)
- ✅ [RelatorioFluxoCaixa.jsx](src/pages/RelatoriosPage/components/RelatorioFluxoCaixa.jsx)
- ✅ [RelatorioReceitaDespesa.jsx](src/pages/RelatoriosPage/components/RelatorioReceitaDespesa.jsx)
- ✅ [RelatorioAnaliseAtendimentos.jsx](src/pages/RelatoriosPage/components/RelatorioAnaliseAtendimentos.jsx)
- ✅ [RelatorioComparativoUnidades.jsx](src/pages/RelatoriosPage/components/RelatorioComparativoUnidades.jsx)

**Funcionalidades**:
- ✅ Todos exportáveis para PDF/Excel (parcial - 70%)
- ✅ Filtros avançados
- ✅ Gráficos interativos
- ✅ Comparação entre períodos

**Rota**: `/reports`

---

#### 3.7.4 Relatório Diário com IA - 90% ✅
**Status**: Funcional com melhorias planejadas
**Arquivos**:
- [app/api/cron/relatorio-diario/route.ts](app/api/cron/relatorio-diario/route.ts)
- [edgeFunctionService.js](src/services/edgeFunctionService.js)

**Funcionalidades**:
- ✅ Geração automática de relatório diário (21:00 BRT)
- ✅ Análise com OpenAI GPT-4o-mini
- ✅ Envio via Telegram (por unidade)
- ✅ Cache de análises para economizar tokens
- ✅ Rastreamento de custo de API
- ✅ Integração com cron job
- ✅ Análise de métricas:
  - Receitas do dia
  - Despesas do dia
  - Lucro líquido
  - Top serviços
  - Top profissionais
- 🔄 Melhorias de prompt (10% - em progresso)

**Tabelas**: `openai_cache`, `openai_cost_tracking`
**Cron**: Vercel Cron (21:00 BRT)

---

#### 3.7.5 Alertas e Anomalias - 60% 🔄
**Status**: Parcialmente funcional

**Funcionalidades**:
- ✅ Detecção de anomalias (básica)
- ✅ Alertas de saldo baixo
- ✅ Alertas de vencimento de despesas
- 🔄 Alertas de desvio em tempo real (em desenvolvimento)
- ❌ Machine Learning para previsões (planejado Q1 2026)

---

### 3.8 Módulo de Notificações (75% ✅)

#### 3.8.1 Telegram - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- `lib/telegram.ts`
- `lib/services/unitTelegramConfig.ts`
- `lib/services/telegramPurchaseBot.js`
- [app/api/telegram/webhook/route.ts](app/api/telegram/webhook/route.ts)

**Scripts**:
- `scripts/test-telegram.js` - Teste de conexão
- `scripts/setup-telegram-webhook.js` - Configurar webhook
- `scripts/telegram-bot-polling.js` - Modo polling (desenvolvimento)

**Funcionalidades**:
- ✅ Integração com Telegram Bot API
- ✅ Relatório diário automático (21:00 BRT)
- ✅ Alertas de vencimento de despesas recorrentes (7 dias antes)
- ✅ Alertas de saldo baixo
- ✅ Configuração por unidade (token + chat_id)
- ✅ Webhook para receber mensagens
- ✅ Teste de conexão
- ✅ Aprovações de compra (85%)

**Cron Jobs**:
- `/app/api/cron/relatorio-diario/route.ts` - Relatório diário
- `/app/api/cron/enviar-alertas/route.ts` - Alertas de vencimento

**Rota de Configuração**: `/units` (campo telegram_config)

---

#### 3.8.2 Notificações In-App - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ToastContext.jsx](src/context/ToastContext.jsx)

**Funcionalidades**:
- ✅ Toast notifications (sucesso, erro, aviso, info)
- ✅ Context de notificações
- ✅ Persistência em localStorage
- ✅ Biblioteca: Sonner + React Hot Toast

---

#### 3.8.3 WhatsApp/E-mail - 0% ❌
**Status**: Removido do escopo
**Motivo**: Integração via API externa (Q2 2026)

---

### 3.9 Módulo Admin/Configurações (70% ✅)

#### 3.9.1 Gestão de Profissionais - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [ProfessionalsPage.jsx](src/pages/ProfessionalsPage/ProfessionalsPage.jsx)
- [professionalService.js](src/services/professionalService.js)

**Funcionalidades**:
- ✅ CRUD completo
- ✅ Vinculação com user_id (Supabase Auth)
- ✅ 4 Roles disponíveis:
  - Administrador (admin) - acesso total
  - Gerente (gerente) - gestão financeira e operacional
  - Barbeiro (barbeiro) - comandas e lista da vez
  - Recepcionista (recepcionista) - caixa e comandas
- ✅ Comissão padrão por profissional
- ✅ Status ativo/inativo
- ✅ Múltiplas unidades
- ✅ Histórico de profissionais
- ✅ Busca e filtros
- ✅ Validação de permissões por role

**Tabela**: `professionals`
**Rota**: `/professionals` (apenas admin)

---

#### 3.9.2 Gestão de Unidades - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [UnitsPage.jsx](src/pages/UnitsPage/UnitsPage.jsx)
- [unitsService.js](src/services/unitsService.js)

**Funcionalidades**:
- ✅ CRUD de unidades (barbearias)
- ✅ Multi-tenant (1 database, múltiplas unidades)
- ✅ Dados: Nome, endereço, telefone, email, CNPJ
- ✅ Status ativo/inativo
- ✅ Configuração de Telegram (token, chat ID)
- ✅ Comparativo entre unidades
- ✅ Dashboard por unidade
- ✅ Histórico completo

**Tabela**: `units`
**Rota**: `/units` (apenas admin)

---

#### 3.9.3 Gestão de Categorias - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [CategoriesPage.jsx](src/pages/CategoriesPage/CategoriesPage.jsx)
- [categoriesService.js](src/services/categoriesService.js)

**Funcionalidades**:
- ✅ Categorias para receitas e despesas
- ✅ Estrutura hierárquica (categoria pai/filha)
- ✅ Tipos: Receita, Despesa Fixa, Despesa Variável
- ✅ CRUD completo
- ✅ Dropdown hierárquico inteligente
- ✅ Uso em DRE
- ✅ Ativar/desativar

**Tabela**: `categories`
**Rota**: `/cadastros/categorias`

---

#### 3.9.4 Perfil de Usuário - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [UserProfilePage.jsx](src/pages/UserProfilePage/UserProfilePage.jsx)

**Funcionalidades**:
- ✅ Visualizar perfil pessoal
- ✅ Editar dados pessoais
- ✅ Alterar senha
- ✅ Alterar foto de perfil
- ✅ Ver histórico de atividades (audit log parcial)

**Rota**: `/profile`

---

#### 3.9.5 Configurações Avançadas - 50% 🔄
**Status**: Parcialmente funcional

**Funcionalidades**:
- ✅ Alguns campos de configuração
- ❌ Backup/Restore (não implementado no frontend)
- 🔄 Logs de auditoria avançados (em desenvolvimento)
- 🔄 Configurações de segurança (em desenvolvimento)

---

### 3.10 Portal do Barbeiro (100% ✅)

#### 3.10.1 Portal Dedicado - 100% ✅
**Status**: Totalmente funcional
**Arquivos**:
- [BarbeiroPortalPage.jsx](src/pages/BarbeiroPortal/BarbeiroPortalPage.jsx)

**Funcionalidades**:
- ✅ Dashboard personalizado para barbeiros
- ✅ Visualização de lista da vez
- ✅ Acesso rápido a comandas abertas
- ✅ Visualização de comissões do mês
- ✅ Histórico de atendimentos
- ✅ Ranking pessoal

**Rota**: `/barbeiro/portal` (apenas role: barbeiro)

---

## 4. FUNCIONALIDADES EM DESENVOLVIMENTO 🚧

### 4.1 Export de Relatórios - 70% 🔄
**Prioridade**: Alta 🔴
**Estimativa**: 2-3 dias

**Módulos Afetados**:
- Fluxo de Caixa
- DRE
- Relatórios customizados

**Funcionalidades**:
- 🔄 Export para Excel (formato xlsx) - 70%
- 🔄 Export para PDF (relatórios formatados) - 70%
- ✅ Export para CSV (parcialmente implementado) - 100%
- ✅ Export para TXT (DRE já suporta) - 100%

**Bloqueios**: Integração completa com bibliotecas jspdf e xlsx

---

### 4.2 Frontend de Compras - 0% ❌
**Prioridade**: Crítica 🔴🔴🔴
**Estimativa**: 3-5 dias

**Arquivos a Criar**:
- `/src/pages/PurchaseRequestsPage.jsx` - Página principal (2 dias)
- `/src/components/purchase/PurchaseRequestModal.jsx` - Modal (1 dia)
- `/src/components/purchase/PurchaseQuotesView.jsx` - Cotações (1 dia)
- `/src/hooks/usePurchaseRequests.js` - Hook (0.5 dia)
- Testes E2E (0.5 dia)

**Bloqueador**: Feature não pode ser utilizada sem UI

---

### 4.3 Validação de Saldo - 50% 🔄
**Prioridade**: Média 🟡
**Estimativa**: 1 dia

**Funcionalidades**:
- ✅ Lógica de validação implementada
- 🔄 Cron job desabilitado
- ❌ Alertas automáticos

**Cron Job**: `/app/api/cron/validate-balance/route.ts` (existe, desabilitado)

---

### 4.4 Análise Preditiva com Machine Learning - 0% ❌
**Prioridade**: Baixa 🟢
**Estimativa**: 5-7 dias
**Timeline**: Q1 2026

**Funcionalidades Planejadas**:
- ❌ Previsão de receita (5-10 dias)
- ❌ Detecção de anomalias avançada
- ❌ Recomendações baseadas em IA
- ❌ Análise de padrões sazonais

**Tech Stack Proposto**:
- Python + scikit-learn
- Supabase Edge Functions (Deno + Python)
- Data warehouse (histórico mínimo: 6 meses)

---

## 5. FUNCIONALIDADES REMOVIDAS DO ESCOPO ❌

> **ATUALIZAÇÃO DE ESCOPO (14 nov 2025)**
>
> As seguintes funcionalidades foram REMOVIDAS do escopo deste sistema.
> Estas funcionalidades virão através de **integração via API REST com sistema externo** especializado em CRM, agendamento e marketing.

### 5.1 Funcionalidades Removidas (Sistema Externo via API)

- ❌ **Calendário de Agendamentos completo**
  - Decisão: Sistema externo especializado
  - Timeline: Q2 2026
  - Integração: API REST

- ❌ **Sistema de Fidelização (Pontos e Resgates)**
  - Decisão: Sistema externo de CRM
  - Timeline: Q2 2026
  - Integração: API REST

- ❌ **Assinaturas Recorrentes de Clientes**
  - Decisão: Plataforma externa
  - Timeline: Q2 2026

- ❌ **Lembretes Automáticos (WhatsApp/SMS)**
  - Decisão: Sistema externo de comunicação
  - Timeline: Q2 2026
  - Integração: API REST + Webhooks

- ❌ **Integração WhatsApp Business API**
  - Decisão: Meta Business API (custo elevado)
  - Timeline: Q2 2026

- ❌ **Integração Google Calendar**
  - Decisão: API externa
  - Timeline: Q2 2026

- ❌ **Gateway Asaas**
  - Decisão: Removido do escopo (estratégica)

### 5.2 Justificativa

**Vantagens da Abordagem**:
- ✅ Foco no core financeiro e operacional
- ✅ Redução de complexidade (200K LOC vs 300K+)
- ✅ Faster time to market (4 meses vs 6-8)
- ✅ Mais fácil manter (menos bugs)
- ✅ Maior flexibilidade (clientes escolhem ferramentas)
- ✅ Escalável (APIs bem definidas)
- ✅ Menor custo de manutenção

**Documentação Completa**: Ver [02_ROADMAP_EXECUTIVO.md](02_ROADMAP_EXECUTIVO.md)

---

## 6. ARQUITETURA

### 6.1 Estrutura de Pastas

```
barber-analytics-pro/
├── app/                          # Next.js App Router (API Routes)
│   └── api/
│       ├── cron/                 # 8 cron jobs (2 Vercel, 6 VPS)
│       ├── products/             # API REST de produtos
│       ├── products-stats/       # Estatísticas de produtos
│       ├── telegram/             # Webhook Telegram
│       ├── reports/              # Relatórios
│       ├── alerts/               # Sistema de alertas
│       ├── kpis/                 # KPIs de saúde
│       └── forecasts/            # Previsões
│
├── src/                          # Frontend React (125K linhas)
│   ├── atoms/                    # 103 componentes atômicos
│   ├── molecules/                # 166 componentes médios
│   ├── organisms/                # 111 componentes complexos
│   ├── components/               # Componentes gerais
│   │   ├── stock/                # 3 componentes de estoque (NOVO!)
│   │   ├── suppliers/            # 3 componentes de fornecedores
│   │   ├── finance/              # Componentes financeiros
│   │   ├── modals/               # Modais
│   │   └── templates/            # Templates reutilizáveis
│   ├── pages/                    # 62+ páginas React
│   ├── hooks/                    # 42 custom hooks
│   ├── services/                 # 42 services
│   ├── repositories/             # 20 repositories
│   ├── dtos/                     # DTOs com validação
│   ├── context/                  # 4 contexts (Auth, Unit, Toast, Theme)
│   ├── utils/                    # Utilitários
│   ├── constants/                # Constantes
│   ├── styles/                   # Estilos globais
│   └── types/                    # TypeScript types
│
├── lib/                          # Shared Libraries (Backend + Frontend)
│   ├── dtos/                     # 6 DTOs (Product, Supplier, Purchase)
│   ├── repositories/             # 3 repositories
│   ├── services/                 # 5 services (Telegram, Purchase)
│   ├── utils/                    # Validators, formatters
│   ├── logger.js                 # Pino logger
│   └── supabaseAdmin.js          # Admin client
│
├── supabase/
│   ├── migrations/               # 40 migrações SQL
│   └── functions/                # 2 Edge Functions (Deno)
│       ├── calculate-order-totals/
│       └── monthly-reset/
│
├── tests/                        # 564 arquivos de teste
│   ├── unit/                     # 200+ testes unitários
│   ├── integration/              # ~40 testes de integração
│   ├── load/                     # Testes de carga (K6)
│   └── __fixtures__/             # Fixtures de teste
│
├── e2e/                          # 70+ testes E2E (Playwright)
│
├── scripts/                      # 5 scripts Node
│   ├── test-telegram.js
│   ├── setup-telegram-webhook.js
│   ├── telegram-bot-polling.js
│   └── audit-design-system.js
│
├── server.js                     # Express server (VPS - 6 crons)
│
└── Configs:
    ├── vite.config.js
    ├── tailwind.config.js
    ├── eslint.config.js
    ├── playwright.config.ts
    ├── tsconfig.json
    └── package.json
```

### 6.2 Padrões de Design

#### 1. Clean Architecture + Repository Pattern
```
Controller/Page → Service → Repository → Supabase
                     ↓
                    DTO (validação)
```

#### 2. Atomic Design
```
Atoms (103) → Molecules (166) → Organisms (111) → Templates → Pages (62+)
```

#### 3. Custom Hooks (42 hooks)
```javascript
// Contexts
useAuth, useUnit, useToast, useTheme

// Financial
useRevenues, useExpenses, useDRE, useCashflow

// Operational
useOrders, useCashRegister, useListaDaVez

// Stock (NOVO!)
useStockMovements, useSuppliers

// Purchase (NOVO!)
usePurchaseRequests (pendente)

// Admin
useProfissionais, useUnits, useCategories

// Reports
useDashboard, useRelatorios
```

#### 4. DTOs (Data Transfer Objects)
```javascript
// Exemplo: stockMovementDTO.js
class StockMovementDTO {
  constructor(data) {
    this.productId = data.productId;
    this.quantity = data.quantity;
    this.movementType = data.movementType;
    // ... validações class-validator
  }

  validate() {
    const errors = [];
    if (!this.productId) errors.push('productId obrigatório');
    if (this.quantity <= 0) errors.push('quantidade inválida');
    return { isValid: errors.length === 0, errors };
  }
}
```

### 6.3 Diagrama de Fluxo Geral

```
┌─────────────────────────────────────────┐
│         Cliente Web (React)             │
│  └─ 62+ Pages                           │
│  └─ 380 Components (Atomic Design)      │
│  └─ 42 Custom Hooks                     │
│  └─ 42 Services                         │
│  └─ 20 Repositories                     │
│  └─ 4 Contexts                          │
└──────────────┬──────────────────────────┘
               │ HTTPS + WebSocket
               ▼
┌─────────────────────────────────────────┐
│       Vercel (Frontend + API)           │
│  └─ Next.js Routes                      │
│  └─ 2 Cron Jobs ativos                  │
│  └─ CDN Global                          │
└──────────┬──────────────────────────────┘
           │ (Realtime WebSocket)
           │ (HTTP REST)
           ▼
┌─────────────────────────────────────────┐
│        Supabase (BaaS Backend)          │
│  ├─ PostgreSQL (29 tabelas principais)  │
│  ├─ Auth (JWT + RLS 161 policies)       │
│  ├─ Storage (Comprovantes, anexos)      │
│  └─ Realtime (Sync em tempo real)       │
└──────────┬──────────────────────────────┘
           │
           ├─────────────────┬────────────┐
           ▼                 ▼            ▼
      ┌────────┐      ┌────────────┐  ┌────────┐
      │OpenAI  │      │  Telegram  │  │ GitHub │
      │(GPT)   │      │   (Bot)    │  │(Source)│
      └────────┘      └────────────┘  └────────┘

┌─────────────────────────────────────────┐
│   VPS (Cron Jobs + Load Balancing)      │
│  ├─ Express Server (porta 3001)         │
│  ├─ 6 Cron Jobs adicionais              │
│  ├─ Nginx (reverse proxy)               │
│  └─ PM2 (process manager)               │
└─────────────────────────────────────────┘
```

---

## 7. BANCO DE DADOS

### 7.1 Tabelas Principais (29+)

```sql
-- CORE TABLES
1. auth.users (Supabase Auth)
2. units (Unidades de negócio)
3. professionals (Usuários/barbeiros)

-- FINANCIAL (13 tabelas)
4. revenues (Receitas)
5. revenue_attachments (Anexos de receitas)
6. expenses (Despesas)
7. expense_attachments (Anexos de despesas)
8. bank_accounts (Contas bancárias)
9. bank_statements (Extratos bancários)
10. payment_methods (Formas de pagamento)
11. categories (Categorias receita/despesa)
12. commissions (Comissões manual)
13. professional_service_commissions (Comissões por serviço)
14. balance_adjustments (Ajustes de saldo)
15. bank_account_balance_logs (Histórico de saldos)

-- OPERATIONAL (7 tabelas)
16. orders (Comandas/pedidos)
17. order_items (Itens de pedidos)
18. order_adjustments (Ajustes em comandas)
19. services (Catálogo de serviços)
20. cash_registers (Controle de caixa)

-- CRM & PARTIES
21. parties (Clientes, Fornecedores)

-- LISTA DA VEZ (3 tabelas)
22. barbers_turn_list (Fila atual)
23. barbers_turn_history (Histórico mensal)
24. barbers_turn_list_backup (Backup automático)

-- STOCK (2 tabelas - NOVO!)
25. products (Produtos)
26. stock_movements (Movimentações de estoque)

-- PURCHASE REQUESTS (3 tabelas - NOVO!)
27. purchase_requests (Solicitações de compra)
28. purchase_request_items (Itens da solicitação)
29. purchase_quotes (Cotações de fornecedores)

-- IA & CACHE (2 tabelas)
30. openai_cache (Cache de análises IA)
31. openai_cost_tracking (Rastreamento de custo)

-- METAS
32. goals (Metas financeiras)
```

### 7.2 Views Implementadas (3+)

```sql
1. vw_demonstrativo_fluxo (Fluxo de caixa detalhado)
2. dre_dynamic_by_categories (DRE por categorias)
3. vw_goals_detailed (Metas detalhadas)
4. stock_summary_view (Resumo de estoque - NOVO!)
5. purchase_requests_with_items (Requests com itens - NOVO!)
```

### 7.3 Functions & Triggers (15+)

```sql
-- TRIGGERS
1. update_product_stock_on_movement (Atualiza estoque)
2. update_order_totals (Atualiza totais de pedido)
3. update_updated_at (Timestamp automático)
4. monthly_reset_barbers_turn (Reset mensal lista da vez)
5. backup_barbers_turn_list (Backup diário)

-- FUNCTIONS
6. calculate_dre(unit_id, start_date, end_date)
7. get_cashflow(unit_id, period)
8. auto_categorize_revenue(description)
9. apply_payment_method_tax(amount, method_id)
10. generate_recurring_expenses()
11. validate_bank_balance()
12. create_purchase_request_with_items()
13. approve_purchase_request()
14. calculate_stock_balance()
15. get_low_stock_products()
```

### 7.4 RLS Policies (161+)

**Granularidade por Role:**
```
admin (total) > gerente (gestão) > barbeiro (operacional) > recepcionista (limitado)
```

**Políticas por tabela** (exemplos):
- `revenues`: 12 políticas (SELECT, INSERT, UPDATE, DELETE por role + unit)
- `expenses`: 12 políticas
- `orders`: 10 políticas
- `bank_accounts`: 8 políticas
- `commissions`: 8 políticas (somente admin/gerente)
- `stock_movements`: 12 políticas (NOVO!)
- `purchase_requests`: 12 políticas (NOVO!)
- ... (total 161+ políticas)

**Exemplo de Policy**:
```sql
-- Barbeiros podem ver apenas suas próprias comissões
CREATE POLICY "barbeiros_view_own_commissions"
ON commissions FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM professionals
    WHERE id = commissions.professional_id
  )
);
```

### 7.5 Migrações (40)

```
20251028_add_order_status_enum.sql
20251028_add_discounts_and_fees_system.sql
20251028_create_atomic_order_functions.sql
20251028_create_rls_policies_orders.sql
20251111000001_backup_diario_lista_da_vez.sql
20251112000001_create_stock_movements_schema.sql (NOVO!)
20251113000001_create_purchase_requests_schema.sql (NOVO!)
... (+ 33 migrações anteriores)
```

---

## 8. INTEGRAÇÕES

### 8.1 Ativas (100% Operacional)

#### Supabase (BaaS) ✅
- **PostgreSQL 17.6**: Banco de dados principal
- **Auth**: JWT + RLS (161+ policies)
- **Storage**: Comprovantes, anexos (5GB gratuito)
- **Realtime**: WebSocket para sync em tempo real
- **Edge Functions**: 2 functions Deno (order totals, monthly reset)
- **Performance**: Query < 150ms (P95)
- **Uptime**: 99.95%

#### OpenAI (IA) ✅
- **Modelo**: GPT-4o-mini (fallback: GPT-3.5-turbo)
- **Uso**: Relatórios diários com análise inteligente
- **Cache**: Implementado (TTL 24h, economiza tokens)
- **Custo**: Rastreado em `openai_cost_tracking`
- **Threshold**: Alerta configurável

#### Telegram Bot ✅
- **Bot API**: Completa
- **Webhooks**: Configurados e funcionais
- **Funcionalidades**:
  - Relatório diário automático (21:00 BRT)
  - Alertas de vencimento (7 dias antes)
  - Alertas de saldo baixo
  - Aprovações de compra (85%)
- **Config**: Por unidade (token + chat_id)

#### Vercel (Hosting) ✅
- **Frontend**: CDN global
- **Cron Jobs**: 2 ativos (limite Hobby)
  1. `/api/cron/relatorio-diario` - 21:00 BRT
  2. `/api/cron/etl-diario` - 03:00 BRT
- **CI/CD**: GitHub Actions integrado
- **Analytics**: Ativo
- **Performance**: Lighthouse 88

### 8.2 VPS (Express Server) ✅

**Servidor**:
- Express 4.21.2
- PM2 process manager
- Nginx reverse proxy
- Porta 3001
- Autenticação: Bearer token

**6 Cron Jobs Adicionais**:
1. `/api/cron/health-check` - Cada 5 min (monitor)
2. `/api/cron/enviar-alertas` - Cada 15 min (vencimentos)
3. `/api/cron/validate-balance` - Diário 04:00 (validação)
4. `/api/cron/gerar-despesas-recorrentes` - Diário 02:00 (geração)
5. `/api/cron/relatorio-semanal` - Segunda 06:00 (relatório)
6. `/api/cron/fechamento-mensal` - Dia 1, 07:00 (reset)

---

## 9. TESTES

### 9.1 Cobertura Geral

```
TOTAL: 564 arquivos de teste
Global Coverage: 40-50%
```

### 9.2 Testes Unitários (200+)

```
Stock Module (100% coverage ✅):
├─ stockMovementDTO.test.js: 28 testes
├─ stockMovementService.test.js: 15 testes
└─ stockMovementRepository.test.js: 13 testes

Supplier Module (100% coverage ✅):
└─ supplierDTO.test.js: 49 testes

Purchase Module (100% coverage ✅):
└─ purchaseRequestDTO.test.js: 47 testes

Product Module (100% coverage ✅):
└─ productDTO.test.js: 18 testes

Utilities:
├─ formatters.test.js: 12 testes
├─ marginCalculations.test.js: 8 testes
└─ validators.test.js: ~20 testes

Core Financial (60-70% coverage):
└─ ~80 testes diversos
```

### 9.3 Testes de Integração (~40)

```
├─ API integration: 15 testes
├─ Forecasts: 12 testes
├─ Financial fixtures: 10 testes
└─ Outros: ~3 testes
```

### 9.4 Testes E2E (70+ com Playwright)

```
Auth flow: 3 cenários
Financial flow: 8 cenários
Orders flow: 13 cenários (5 + 8)
Cash register: 4 cenários
DRE: 3 cenários
Services: 3 cenários
Suppliers: 22 cenários (100% coverage ✅)
Turn list: 4 cenários
Demonstrativo fluxo: 3 cenários
Reconciliation: 5 cenários
Accessibility: ~2 cenários
```

### 9.5 Testes de Carga (K6)

```
├─ basic-load.js (100 VUs, 5 min)
└─ stress-test.js (500 VUs, 10 min)
```

---

## 10. ROADMAP

### 10.1 Fase 3 (Q4 2025) - EM PROGRESSO ✅ (70% completo)

**Objetivo**: Completar 100% do MVP

**Status**: 70% completo (21 de 30 dias)

**Entregáveis**:
- [x] Comissões Manual (CONCLUÍDO ✅)
- [x] Despesas Recorrentes (CONCLUÍDO ✅)
- [x] Comprovantes (CONCLUÍDO ✅)
- [x] IA Financeira (CONCLUÍDO ✅)
- [x] Telegram Integration (CONCLUÍDO ✅)
- [x] **Sistema de Estoque (CONCLUÍDO 96% ✅)** - NÃO PLANEJADO!
- [x] **Backend de Compras (CONCLUÍDO 100% ✅)** - NÃO PLANEJADO!
- [ ] **Frontend de Compras** - **PENDENTE (0%)** 🔴
- [ ] Export de Relatórios - **EM PROGRESSO (70%)** 🔄
- [ ] Alertas Automáticos - **PENDENTE (80%)** 🔄
- [ ] Testes E2E robustos - **PENDENTE (50%)** 🔄

**Data Prevista**: 26 de novembro de 2025

---

### 10.2 Fase 4 (Q1 2026) - PLANEJADO

**Objetivo**: Integrações Externas & Estabilização

**Status**: 0% - Design em progresso

**Entregáveis**:
- [ ] API REST Pública (OpenAPI/Swagger)
- [ ] Webhooks para sistemas externos
- [ ] OAuth2 para login social
- [ ] Documentação completa de integração
- [ ] Performance optimization
- [ ] Machine Learning básico (detecção de anomalias)
- [ ] Completar Frontend de Compras (se não feito em Fase 3)
- [ ] Integração de estoque com vendas automáticas

**Estimativa**: 4-5 semanas
**Data Prevista**: 31 de março de 2026

---

### 10.3 Fase 5 (Q2 2026) - FUTURO

**Objetivo**: Analytics Avançado & Integrações

**Status**: 0% - Planejamento inicial

**Entregáveis**:
- [ ] Business Intelligence Dashboard
- [ ] Análise Preditiva (5-10 dias)
- [ ] Integração com CRM externo
- [ ] WhatsApp Business API
- [ ] Google Calendar sync
- [ ] Data warehouse (BigQuery)
- [ ] Recomendações com IA

**Estimativa**: 4 semanas
**Data Prevista**: 30 de junho de 2026

---

### 10.4 Fase 6 (Q3 2026) - EXPANSÃO

**Objetivo**: Escalabilidade + Monetização

**Entregáveis**:
- [ ] SaaS multi-tenant aprimorado
- [ ] Planos de pagamento (Starter, Pro, Enterprise)
- [ ] Marketplace de integrações
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Real-time collaboration
- [ ] Audit trail completo

**Estimativa**: 4-5 semanas
**Data Prevista**: 30 de setembro de 2026

---

## 11. MÉTRICAS E KPIS

### 11.1 Métricas Técnicas

#### Codebase

| Métrica | Valor Real | Target |
|---------|-----------|--------|
| Total LOC | ~200K | - |
| Frontend (src/) | 125.116 | - |
| Backend/API | ~50K | - |
| Arquivos fonte | 566 | - |
| Componentes React | 380+ | - |
| Páginas | 62+ | - |
| Serviços | 42 | - |
| Repositórios | 20 | - |
| Custom Hooks | 42 | - |
| Contextos | 4 | - |

#### Database

| Métrica | Valor Real | Target |
|---------|-----------|--------|
| Tabelas Principais | 29+ | - |
| Migrações | 40 | - |
| RLS Policies | 161+ | 100% |
| Functions/Triggers | 15+ | - |
| Views | 5+ | - |

#### Testing

| Métrica | Valor Real | Target |
|---------|-----------|--------|
| Arquivos de teste | 564 | - |
| Testes Unit | 200+ | - |
| Testes Integration | ~40 | - |
| Testes E2E | 70+ | - |
| Coverage (Stock) | 100% | 100% |
| Coverage (Supplier) | 100% | 100% |
| Coverage (Purchase DTOs) | 100% | 100% |
| Coverage (Global) | 40-50% | >80% |

#### Performance

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| Tempo carregamento página | < 2s | 1.2s | ✅ |
| Query SQL (P95) | < 300ms | 150ms | ✅ |
| Time to Interactive | < 3s | 1.8s | ✅ |
| Lighthouse Score | > 80 | 88 | ✅ |
| Uptime | >99.9% | 99.95% | ✅ |

### 11.2 Métricas de Negócio

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| Redução de erros financeiros | 95% | 98% ✅ |
| Redução de tempo de fechamento | 70% | 85% ✅ |
| Visibilidade financeira | Real-time | Real-time ✅ |
| Controle de estoque | 100% | 96% ✅ |
| Clientes ativos | TBD | 🔜 (pós-launch) |
| NPS Score | >40 | 🔜 (pós-launch) |
| Churn Rate | <5% | 🔜 (pós-launch) |

### 11.3 Status Global por Módulo

| Módulo | Status | % Completo |
|--------|--------|-----------|
| **Core Financeiro** | ✅ PRODUÇÃO | 95% |
| **Operacional** | ✅ PRODUÇÃO | 100% |
| **Estoque** | ✅ PRODUÇÃO | 96% |
| **Compras** | 🔄 DESENVOLVIMENTO | 85% |
| **Clientes** | 🔄 PARCIAL | 60% |
| **Agendamentos** | 🔄 PARCIAL | 50% |
| **Relatórios** | ✅ PRODUÇÃO | 85% |
| **Notificações** | ✅ PRODUÇÃO | 75% |
| **Admin** | ✅ PRODUÇÃO | 70% |

**Status Geral**: **92% Completo** ✅

---

## 12. PRÓXIMOS PASSOS IMEDIATOS

### 12.1 Curto Prazo (1-2 Semanas) - CRÍTICO

**Semana 1:**
1. ⚠️ **Atualizar documentação** (Status + Roadmap) - 4h 🔴
2. 🔴 **Completar frontend de compras** - 5 dias 🔴🔴🔴
   - PurchaseRequestsPage.jsx (2 dias)
   - PurchaseRequestModal.jsx (1 dia)
   - PurchaseQuotesView.jsx (1 dia)
   - Testes E2E (1 dia)
3. 🔴 **Finalizar export de relatórios** - 2.5 dias 🔴
   - Integração jspdf completa (1 dia)
   - Integração xlsx completa (1 dia)
   - Testes (0.5 dia)
4. 🟡 **Resolver testes E2E quebrados** - 2 dias
   - Refatorar calculations.test.ts.skip
   - Refatorar idempotency.test.ts.skip
   - Habilitar CI/CD

**Semana 2:**
1. Testes completos do módulo de compras - 2 dias
2. Deploy em staging - 1 dia
3. QA manual completo - 2 dias
4. Documentação de usuário - 1 dia

**Soft Launch**: 26 de novembro de 2025
**Official Launch**: 15 de dezembro de 2025

### 12.2 Médio Prazo (1 Mês)

1. **Completar Sistema de Compras 100%**
   - Aprovação Telegram (15%)
   - Fluxo completo de recebimento
   - Integração com estoque automática
   - Geração de despesas

2. **Integrações de Estoque**
   - Auto-dedução em vendas
   - Auto-dedução em serviços
   - Alertas de estoque baixo
   - Relatórios gerenciais

3. **Machine Learning Básico**
   - Previsão de demanda
   - Detecção de anomalias
   - Sugestões de compra

### 12.3 Longo Prazo (3-6 Meses)

1. **API REST Pública** (Q1 2026)
   - OpenAPI/Swagger
   - Webhooks
   - OAuth2
   - Documentação interativa

2. **Mobile Apps** (Q3 2026)
   - React Native
   - iOS + Android
   - Offline mode
   - Push notifications

3. **Marketplace de Integrações** (Q2 2026)
   - CRM externo
   - Calendário externo
   - WhatsApp Business
   - Google Calendar

---

## 13. CONCLUSÃO

### 13.1 Status Final

O **Barber Analytics Pro** está **92% completo** e pronto para entrar em fase de soft launch com ajustes finais:

**Breakdown Real**:
- Core Financeiro: 95% ✅
- Operacional: 100% ✅
- **Estoque: 96% ✅** (NOVO - NÃO DOCUMENTADO ANTERIORMENTE!)
- **Compras: 85% 🔄** (NOVO - NÃO DOCUMENTADO ANTERIORMENTE!)
- Clientes: 60% 🔄
- Agendamentos: 50% 🔄
- Relatórios: 85% ✅
- Notificações: 75% ✅
- Admin: 70% ✅

### 13.2 Descobertas Críticas

1. **Módulo de Estoque (96%)** - Completamente implementado mas NÃO documentado
   - 14 arquivos, 3.500+ linhas
   - Testes 100% coverage
   - Pronto para produção

2. **Sistema de Compras (85%)** - Em progresso avançado mas NÃO documentado
   - Backend 100% completo
   - Frontend 0% (bloqueador)
   - Telegram 85%

3. **Projeto Cresceu**:
   - 62% em arquivos fonte (566 vs 350 documentados)
   - 32% em páginas (62+ vs 47 documentadas)
   - 370% em testes (564 vs 120 documentados)

### 13.3 Recomendações

**CRÍTICO - Fazer Imediatamente**:
1. ⚠️ Completar frontend de compras (3-5 dias)
2. 🔴 Finalizar export de relatórios (2-3 dias)
3. 🔴 Atualizar toda documentação (0.5 dia)
4. 🟡 Resolver testes E2E quebrados (2 dias)

**Timeline Ajustada**:
- **Soft Launch**: 26 de novembro de 2025 (mantido)
- **Official Launch**: 15 de dezembro de 2025 (mantido)
- **Fase 4 (API REST)**: Q1 2026
- **Fase 5 (Analytics + ML)**: Q2 2026

---

**FIM DO PRD**

**Preparado por**: Andrey Viana
**Revisado por**: Claude Code (Análise Completa)
**Data**: 14 de novembro de 2025
**Versão**: 3.0.0
**Próxima Revisão**: 21 de novembro de 2025
**Status**: ✅ **APROVADO PARA CONTINUAÇÃO**
