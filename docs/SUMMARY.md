# Barber Analytics Pro - Documentação Técnica

**Versão:** 1.2.0
**Última Atualização:** 11 de novembro de 2025
**Autor:** Andrey Viana

---

## 📚 Índice Geral

Esta é a documentação técnica completa do **Barber Analytics Pro**, um sistema SaaS de gestão para barbearias premium desenvolvido com **Clean Architecture**, **DDD** e **Atomic Design**.

---

## 🎯 Documentação Principal

### [00 - Overview](./00_OVERVIEW.md)

Visão geral do sistema, contexto de negócio, objetivos estratégicos e stakeholders.

**Conteúdo**:

- Missão e valores
- Problema e solução
- Módulos principais
- Stakeholders e personas
- Arquitetura de alto nível
- Métricas de sucesso
- Linha do tempo do projeto

---

### [01 - Requirements](./01_REQUIREMENTS.md)

Especificação completa de requisitos funcionais e não-funcionais.

**Conteúdo**:

- **RF-01**: Módulo Financeiro (Fluxo de Caixa, DRE, Receitas, Despesas, Conciliação)
- **RF-02**: Módulo de Pagamentos (Formas de pagamento, Gateway Asaas)
- **RF-03**: Módulo de Clientes (CRM, Fidelização, Assinaturas)
- **RF-04**: Módulo de Agendamentos (Calendário, Lista da Vez, Lembretes)
- **RF-05**: Módulo de Relatórios (Dashboards, Rankings)
- **RNF**: Performance, Escalabilidade, Segurança, Usabilidade, Confiabilidade
- **RQ**: Requisitos de qualidade (Testes, Code Quality, Monitoramento)

---

### [02 - Architecture](./02_ARCHITECTURE.md)

Arquitetura técnica do sistema com diagramas UML em PlantUML.

**Conteúdo**:

- Clean Architecture (4 camadas)
- Atomic Design (Atoms → Molecules → Organisms → Pages)
- Diagrama de Componentes (C4 Model)
- Diagrama de Sequência (Fluxo de dados)
- Arquitetura de Segurança (RLS)
- Integração com Supabase
- Deployment Architecture
- Performance & Caching
- Padrões de código

---

### [03 - Domain Model](./03_DOMAIN_MODEL.md) 🚧

Modelagem de domínio com DDD (Domain-Driven Design).

**Status**: Em desenvolvimento

**Planejado**:

- Entidades (Revenue, Expense, Order, Client)
- Value Objects (Money, CPF, Email)
- Aggregates (Order Aggregate)
- Domain Services
- Domain Events
- Ubiquitous Language

---

### [04 - Modules](./04_MODULES/) 🚧

Documentação detalhada de cada módulo do sistema.

**Status**: Em desenvolvimento

**Módulos Planejados**:

- **04.01 - Financial Module**: Receitas, despesas, fluxo de caixa, DRE ✅
- **04.02 - Payments Module**: Formas de pagamento, gateway, conciliação ✅
- **04.03 - AI Financial Module**: IA Financeira, alertas, análises ✅
- **04.04 - Clients Module**: CRM, fidelização, assinaturas
- **04.05 - Scheduler Module**: Agendamentos, calendário, lista da vez
- **04.06 - Reports Module**: Dashboards, KPIs, rankings ✅
- **04.07 - Notifications Module**: WhatsApp, SMS, e-mail, push

---

### [05 - Infrastructure](./05_INFRASTRUCTURE.md) 🚧

Infraestrutura e serviços externos.

**Status**: Em desenvolvimento

**Planejado**:

- Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- Vercel (Hosting, CI/CD, Edge Network)
- Asaas (Gateway de pagamentos)
- WhatsApp Business API
- Sentry (Error tracking)
- Google Analytics

---

### [06 - API Reference](./06_API_REFERENCE.md) ✅

Referência completa de Services, Repositories, Hooks e DTOs.

**Status**: Parcialmente implementado

**Implementado**:

- Services (cashflowService, revenueService, expenseService) ✅
- Repositories (demonstrativoFluxoRepository, revenueRepository, aiMetricsRepository, alertsRepository) ✅
- Hooks (useDemonstrativoFluxo, useRevenues, useExpenses, useHealthKPIs) ✅
- DTOs (CreateRevenueDTO, UpdateExpenseDTO) ✅
- API Routes Next.js (KPIs, Alertas, Relatórios, Cron Jobs) ✅

---

### [07 - Data Model](./07_DATA_MODEL.md) ✅

Modelo de dados completo com ERD, dicionário de dados e views.

**Conteúdo**:

- ERD em PlantUML (Módulos: Core, Financeiro, Orders, Lista da Vez)
- Dicionário de Dados (Todas as tabelas e colunas)
- Views principais (`vw_demonstrativo_fluxo`, `vw_financial_summary`)
- Funções (`fn_calculate_dre`, `fn_close_order`)
- Índices e constraints para performance
- RLS Policies

---

### [08 - Testing Strategy](./08_TESTING_STRATEGY.md) 🚧

Estratégia de testes (Unit, Integration, E2E).

**Status**: Em desenvolvimento

**Planejado**:

- Vitest (Unit tests)
- Playwright (E2E tests)
- Test coverage (>80%)
- CI/CD integration
- Mocks e fixtures
- Performance testing

---

### [09 - Deployment Guide](./09_DEPLOYMENT_GUIDE.md) 🚧

Guia completo de deployment e CI/CD.

**Status**: Em desenvolvimento

**Planejado**:

- Vercel deployment
- Environment variables
- GitHub Actions
- Database migrations
- Rollback strategy
- Monitoring e logs

---

### [10 - Project Management](./10_PROJECT_MANAGEMENT.md) 🚧

Governança e gestão do projeto.

**Status**: Em desenvolvimento

**Planejado**:

- Metodologia (Scrum/Kanban)
- Sprints e milestones
- Change control
- Code review process
- Release management

---

### [11 - Contributing](./11_CONTRIBUTING.md) 🚧

Guidelines para contribuição no projeto.

**Status**: Em desenvolvimento

**Planejado**:

- Code style (ESLint + Prettier)
- Git workflow (Gitflow)
- Pull request template
- Commit message conventions
- Branch naming

---

### [12 - Changelog](./12_CHANGELOG.md) 🚧

Histórico de mudanças estruturado.

**Status**: Em desenvolvimento

**Formato**: Keep a Changelog

---

## 🎨 Design System

### [Design System](./DESIGN_SYSTEM.md) ✅

Sistema de design completo com tokens, classes utilitárias e componentes.

**Conteúdo**:

- Tokens de cores (Light/Dark mode)
- Tipografia
- Espaçamento
- Classes utilitárias (`.card-theme`, `.btn-theme-*`, `.text-theme-*`)
- Componentes reutilizáveis
- Ícones e assets

---

## 🤖 Inteligência Artificial

### [AI Features](./AI_FEATURES.md) ✅

Documentação completa das funcionalidades de IA integradas ao sistema.

**Conteúdo**:

- **ApoIA**: Assistente financeiro com OpenAI
- **Relatórios Diários Automatizados**: Envio via Telegram às 21:00
- **Sistema de Aprendizado**: Detecção de padrões e tendências
- **Alertas Inteligentes**: Custos, metas, quedas acentuadas
- **Custos e Monitoramento**: Tracking de uso da OpenAI
- **Configuração por Unidade**: Telegram independente
- **Troubleshooting**: Guia completo de resolução de problemas

**Status**: ✅ Implementado e testado

**Modelos**:

- Primário: GPT-4o-mini (~$0.000074/relatório)
- Fallback: GPT-3.5-turbo
- Custo estimado: ~$4.44/mês para 2 unidades

---

### [Relatórios Diários - Guia Técnico](./guides/RELATORIO_DIARIO_AUTOMATICO.md) ✅

Guia técnico detalhado do sistema de relatórios diários.

**Conteúdo**:

- Arquitetura do sistema
- Fluxo de execução (6 etapas)
- Serviços implementados (5 arquivos)
- Estrutura do banco de dados
- Exemplos de relatórios
- Configuração e deployment
- Monitoramento e logs

---

### [Deploy Checklist](./DEPLOY_CHECKLIST.md) ✅

Checklist completo para deploy em produção.

**Conteúdo**:

- Status geral (IA, Telegram, BD, Config, Testes)
- Verificação de funcionalidades
- Configuração do Vercel
- Processo de deploy (staging → produção)
- Pós-deploy e monitoramento
- Plano de contingência
- Próximos passos imediatos

**Status Atual**: ⚠️ 85% Completo - Pronto para Deploy

---

## 🔧 Ferramentas e Tecnologias

### Frontend

- **Framework**: React 19
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS 3.4
- **State Management**: TanStack Query v5
- **Router**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner

### Backend

- **Database**: PostgreSQL 17.6 (Supabase)
- **Auth**: Supabase Auth (JWT)
- **Realtime**: Supabase Realtime (WebSockets)
- **Edge Functions**: Deno
- **Storage**: Supabase Storage

### DevOps

- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Analytics**: Vercel Analytics
- **Package Manager**: pnpm

### Testing

- **Unit**: Vitest
- **E2E**: Playwright
- **Coverage**: Vitest Coverage

---

## 📊 Status do Projeto

| Fase                       | Status          | Entregáveis                          | Data    |
| -------------------------- | --------------- | ------------------------------------ | ------- |
| **Fase 1: MVP**            | ✅ Concluída    | Financeiro, Caixa, Comandas          | Q1 2025 |
| **Fase 2: Fluxo de Caixa** | ✅ Concluída    | Demonstrativo Acumulado, Filtros     | Q2 2025 |
| **Fase 3: Agendamentos**   | 🔄 Em Progresso | Calendário, Lista da Vez             | Q3 2025 |
| **Fase 4: IA Financeira**  | ✅ Concluída    | ApoIA, Relatórios, Alertas, Telegram | Q4 2025 |
| **Fase 5: CRM Avançado**   | 📋 Planejada    | Assinaturas, Fidelização             | Q1 2026 |
| **Fase 6: BI & Analytics** | 📋 Planejada    | Análise avançada, ML                 | Q2 2026 |

---

## 📞 Contato

- **Autor**: Andrey Viana
- **GitHub**: [barber-analytics-pro](https://github.com/andviana23/barber-analytics-pro)
- **Repositório**: github.com/andviana23/barber-analytics-pro

---

## 📄 Licença

**Proprietary** - Todos os direitos reservados © 2025 Andrey Viana

---

## 🔄 Histórico de Atualizações

| Data       | Versão | Descrição                                                        |
| ---------- | ------ | ---------------------------------------------------------------- |
| 11/11/2025 | 1.2.0  | Adicionado IA completa, relatórios diários, Telegram por unidade |
| 08/11/2025 | 1.1.0  | Adicionado módulo IA Financeira                                  |
| 07/11/2025 | 1.0.0  | Documentação inicial completa                                    |

---

**Última compilação:** 11 de novembro de 2025, 16:55 BRT
