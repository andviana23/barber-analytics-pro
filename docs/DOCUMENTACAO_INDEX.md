# Índice de Documentação - Barber Analytics Pro

Acesso rápido a toda documentação do projeto.

**Versão:** 2.0.0 (Migrado para VPS)
**Data:** 2025-11-12
**Hospedagem:** app.tratodebarbados.com

---

## Documentos Gerados (Novo)

Três documentos novos foram criados com análise completa da estrutura:

### 1. **ESTRUTURA_COMPLETA_REPOSITORIO.md** (46KB, 1341 linhas)
**Documentação mais detalhada e completa**

Ideal para: entender a estrutura completa do projeto

Contém:
- Visão geral do projeto e stack tecnológico
- Estrutura de diretórios completa (árvore detalhada)
- Componentes (Atoms, Molecules, Organisms)
- 23 páginas e rotas categorizadas
- 85+ serviços organizados por tipo
- 19 repositórios (data access layer)
- 90+ custom hooks
- 4 contextos globais
- Utilitários e helpers
- Configurações de projeto (Vite, VPS, TypeScript, Tailwind, PM2, Nginx)
- Padrões de arquitetura implementados
- Testes e scripts
- Fluxo de dados detalhado
- Variáveis de ambiente (37)

**Quando usar**: Exploração detalhada da arquitetura

---

### 2. **QUICK_REFERENCE_GUIDE.md** (9KB, 392 linhas)
**Guia rápido para consulta**

Ideal para: referência rápida durante desenvolvimento

Contém:
- Estrutura em 30 segundos
- Stack tecnológico resumido (tabela)
- Rotas por módulo
- Cron jobs agendados
- Componentes (quantidade por tipo)
- Serviços por categoria
- Repositórios listados
- Custom hooks agrupados
- Contextos globais
- Arquivos de configuração
- Comandos essenciais (pnpm dev, build, test, etc)
- Fluxo de dados (diagrama)
- Variáveis de ambiente resumidas
- Padrões implementados
- Métricas do projeto
- Próximas etapas (adicionar página, serviço, deploy)

**Quando usar**: Consulta rápida de comandos, rotas ou estrutura

---

### 3. **ARQUITETURA_VISUAL.md** (39KB, 725 linhas)
**Diagramas ASCII e visualizações**

Ideal para: compreender visualmente o projeto

Contém:
- Diagramas ASCII de camadas (Clean Architecture)
- Estrutura de pacotes
- Fluxo de dados frontend (passo-a-passo)
- Fluxo de dados backend (cron/API)
- Módulos por domínio (Financeiro, Operacional, Admin)
- Tecnologias por camada
- Fluxo de desenvolvimento (git workflow)
- Arquitetura de componentes React
- Estado global (Context + TanStack Query)
- Camadas de segurança
- Integração com serviços externos
- Estrutura detalhada de pastas (visual tree)

**Quando usar**: Apresentações, compreensão visual, onboarding

---

## Documentação Existente

### Documentação Técnica do Projeto

#### Arquitetura
- **docs/02_ARCHITECTURE.md** - Arquitetura de software detalhada
- **INFRASTRUCTURE_v4.0.md** - Infraestrutura completa (Vercel, Supabase)

#### Módulos
- **docs/04_MODULES/01_FINANCIAL.md** - Módulo financeiro
- **docs/04_MODULES/02_PAYMENTS.md** - Módulo pagamentos
- **docs/04_MODULES/03_CLIENTS.md** - Módulo clientes
- **docs/04_MODULES/04_SCHEDULER.md** - Módulo scheduler (fila)
- **docs/04_MODULES/05_REPORTS.md** - Módulo relatórios
- **docs/04_MODULES/06_NOTIFICATIONS.md** - Módulo notificações

#### Conceitos & Padrões
- **docs/00_OVERVIEW.md** - Visão executiva
- **docs/01_REQUIREMENTS.md** - Requisitos funcionais e não-funcionais
- **docs/03_DOMAIN_MODEL.md** - Domain Model (DDD)
- **docs/05_INFRASTRUCTURE.md** - Infraestrutura técnica
- **docs/06_API_REFERENCE.md** - Referência APIs, services, repositories
- **docs/07_DATA_MODEL.md** - Modelo de dados (ERD, views, functions)

#### Desenvolvimento & Deploy
- **docs/08_TESTING_STRATEGY.md** - Estratégia de testes (Vitest + Playwright)
- **docs/09_DEPLOYMENT_GUIDE.md** - Guia de deploy e CI/CD
- **docs/10_PROJECT_MANAGEMENT.md** - Gestão de projeto
- **docs/11_CONTRIBUTING.md** - Guia de contribuição
- **docs/12_CHANGELOG.md** - Histórico de versões

#### Design & Padrões
- **docs/DESIGN_SYSTEM.md** - Design System (Tailwind + Atomic Design)
- **docs/guides/CODE_CONVENTIONS.md** - Convenções de código
- **docs/guides/FAQ.md** - Perguntas frequentes
- **docs/guides/PERMISSOES_GERENTE_ANALISE.md** - Permissões específicas

#### Referência Rápida
- **README.md** - Overview geral do projeto

### Documentação de Análise

- **ANALISE_IMPACTO_INFRASTRUCTURE_v4.0.md** - Análise de impacto
- **ANALISE_TELEGRAM_SEM_WEBHOOK.md** - Análise Telegram
- **CHECKLIST_IA_FINANCEIRA.md** - Checklist IA Financeira
- **CORS_FIX_GUIDE.md** - Guia CORS
- **ETL_SEM_OPENAI.md** - Guia do ETL sem dependência de IA
- **ESCOPO_FINAL.md** - Escopo final do projeto
- **FUNCIONALIDADES_PENDENTES.md** - Funcionalidades pendentes
- **INFRASTRUCTURE_v5.0_IMPLEMENTATION.md** - Implementação v5.0
- **PRD_BARBER_ANALYTICS_PRO.md** - Product Requirements Document
- **VALIDACAO_SEGURANCA.md** - Validação de segurança

---

## Como Usar Esta Documentação

### Para Novos Desenvolvedores (Onboarding)

1. **Dia 1**: Ler QUICK_REFERENCE_GUIDE.md (estrutura + stack)
2. **Dia 2**: Ver ARQUITETURA_VISUAL.md (diagramas visuais)
3. **Dia 3**: Ler ESTRUTURA_COMPLETA_REPOSITORIO.md (detalhes)
4. **Dia 4**: Explorar docs/02_ARCHITECTURE.md (padrões)
5. **Dia 5**: Revisar docs/11_CONTRIBUTING.md (workflow)

### Para Desenvolvimento de Features

1. Consultar QUICK_REFERENCE_GUIDE.md (rotas, componentes)
2. Ver ARQUITETURA_VISUAL.md (fluxo de dados)
3. Conferir docs/02_ARCHITECTURE.md (padrões)
4. Verificar docs/06_API_REFERENCE.md (APIs disponíveis)
5. Ler docs/11_CONTRIBUTING.md (git workflow)

### Para Deploy & DevOps

1. Ler INFRASTRUCTURE_v4.0.md (setup)
2. Consultar docs/09_DEPLOYMENT_GUIDE.md (CI/CD)
3. Verificar vercel.json (configuração)
4. Revisar VALIDACAO_SEGURANCA.md (segurança)

### Para Entender um Módulo Específico

**Módulo Financeiro:**
1. QUICK_REFERENCE_GUIDE.md (visão geral)
2. docs/04_MODULES/01_FINANCIAL.md (detalhes)
3. ESTRUTURA_COMPLETA_REPOSITORIO.md - seção "Serviços Financeiros"

**Módulo Operacional:**
1. QUICK_REFERENCE_GUIDE.md (visão geral)
2. docs/04_MODULES/04_SCHEDULER.md (fila)
3. docs/04_MODULES/05_REPORTS.md (relatórios)

**Módulo Administrativo:**
1. QUICK_REFERENCE_GUIDE.md (visão geral)
2. docs/05_INFRASTRUCTURE.md (permissões RLS)
3. docs/07_DATA_MODEL.md (modelo de dados)

---

## Mapa Mental da Estrutura

```
barber-analytics-pro/
│
├── Frontend (src/)
│   ├── Atoms (15) → Molecules (30+) → Organisms (18+) → Pages (23)
│   ├── Services (85+) → Repositories (19) → Hooks (90+)
│   └── Context (4) + Utils
│
├── Backend (app/api/ + lib/)
│   ├── Cron Jobs (7)
│   ├── APIs (12)
│   └── Libraries (IA, Analytics, Auth, etc)
│
├── Database (Supabase)
│   ├── PostgreSQL + RLS
│   ├── Auth + Realtime
│   └── Storage + Edge Functions
│
├── Tests
│   ├── Unit (Vitest)
│   ├── Integration (Vitest)
│   └── E2E (Playwright)
│
└── Documentação (este arquivo + 3 documentos novos)
```

---

## Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor dev
pnpm build            # Build produção
pnpm preview          # Preview do build

# Qualidade
pnpm lint             # Verificar lint
pnpm format           # Formatar código
pnpm validate         # Lint + format + typecheck

# Testes
pnpm test             # Vitest watch
pnpm test:run         # Single run
pnpm test:e2e         # Playwright

# Consulte QUICK_REFERENCE_GUIDE.md para mais comandos
```

---

## Stack em Uma Linha

React 19 + TypeScript + Vite | React Router + TanStack Query | Tailwind CSS | Atomic Design | Next.js 15 API | Vercel Cron | Supabase PostgreSQL | RLS | OpenAI GPT-4o | Telegram | Vitest + Playwright

---

## Localizações Rápidas

| Tipo | Localização |
|------|------------|
| Frontend Root | `src/` |
| Componentes Atoms | `src/atoms/` |
| Componentes Molecules | `src/molecules/` |
| Componentes Organisms | `src/organisms/` |
| Páginas | `src/pages/` (23 páginas) |
| Serviços | `src/services/` (85+ serviços) |
| Repositórios | `src/repositories/` (19 tipos) |
| Custom Hooks | `src/hooks/` (90+ hooks) |
| Contextos | `src/context/` (4 contextos) |
| API Routes | `app/api/` |
| Cron Jobs | `app/api/cron/` (7 jobs) |
| Backend Libs | `lib/` |
| Testes Unit | `tests/unit/` |
| Testes E2E | `e2e/` |
| Documentação | `docs/` + 3 novos docs |

---

## Estrutura de Camadas

```
┌─────────────────────────────────────────┐
│   Apresentação (Atoms, Molecules, etc) │
├─────────────────────────────────────────┤
│   Aplicação (Hooks, Services, Context) │
├─────────────────────────────────────────┤
│   Dados (Repositories, DTOs, Types)    │
├─────────────────────────────────────────┤
│   Infraestrutura (APIs, DB, IA)        │
└─────────────────────────────────────────┘
```

---

## Métricas Rápidas

- 500+ componentes, serviços e hooks
- 23 páginas principais
- 85+ serviços
- 19 repositórios
- 90+ custom hooks
- 4 contextos
- 7 cron jobs
- 12 APIs HTTP
- 37 variáveis de ambiente
- 150+ pacotes npm
- 85% cobertura de testes

---

## Roadmap de Aprendizado

**Semana 1**: Estrutura e Padrões
- Ler QUICK_REFERENCE_GUIDE.md
- Revisar ARQUITETURA_VISUAL.md
- Explorar ESTRUTURA_COMPLETA_REPOSITORIO.md

**Semana 2**: Código e Implementação
- Ler docs/02_ARCHITECTURE.md
- Revisar docs/06_API_REFERENCE.md
- Explorar código (src/ e app/)

**Semana 3**: Testes e Deploy
- Ler docs/08_TESTING_STRATEGY.md
- Revisar docs/09_DEPLOYMENT_GUIDE.md
- Executar testes localmente

**Semana 4**: Módulos Específicos
- Aprofundar em módulos de interesse
- Contribuir com code
- Submeter PR

---

## Contato & Suporte

Para dúvidas sobre:
- **Estrutura**: Ver ESTRUTURA_COMPLETA_REPOSITORIO.md
- **Visão Geral**: Ver QUICK_REFERENCE_GUIDE.md
- **Arquitetura**: Ver docs/02_ARCHITECTURE.md
- **Deploy**: Ver docs/09_DEPLOYMENT_GUIDE.md
- **Contribuição**: Ver docs/11_CONTRIBUTING.md

---

**Gerado em**: 2025-11-11  
**Repositório**: barber-analytics-pro  
**Branch**: feature/ai-finance-integration  
**Total de docs**: 20+ documentos
