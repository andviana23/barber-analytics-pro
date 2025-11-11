# 📊 Barber Analytics Pro

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-000000.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Vercel](https://img.shields.io/badge/Vercel-Serverless-white.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

**Plataforma completa de gestão financeira e operacional para redes de barbearias**

[📚 Documentação](docs/SUMMARY.md) • [⚙️ Instalação](#-instalação) • [🏗️ Arquitetura](docs/02_ARCHITECTURE.md) • [🤝 Contribuir](docs/11_CONTRIBUTING.md)

</div>

---

## 🎯 Visão Geral

O **Barber Analytics Pro** é uma aplicação web moderna construída com **Next.js 15 + TypeScript** hospedada 100% na **Vercel**. Todo o frontend, APIs serverless e cron jobs convivem no mesmo repositório, integrando-se ao **Supabase** (PostgreSQL + Auth) e à **OpenAI API** para gerar relatórios inteligentes:

- 💰 **Gestão Financeira Completa**: DRE automatizado, fluxo de caixa, controle de despesas e receitas
- 📊 **Dashboards Inteligentes**: KPIs em tempo real com visualizações interativas
- 🏦 **Conciliação Bancária**: Importação e matching automático de extratos OFX
- 💈 **Lista da Vez**: Sistema de fila inteligente para atendimento justo entre profissionais
- 📈 **Relatórios Avançados**: DRE, análise de performance, comissões e muito mais
- 🏢 **Multi-unidade**: Gestão centralizada de múltiplas unidades com permissões granulares

### Principais Diferenciais

- ⚡ **Tempo Real**: Sincronização instantânea via Supabase Realtime e server components
- 🎨 **Design System**: Interface consistente baseada em Atomic Design
- 🔒 **Segurança**: Row-Level Security (RLS) no nível de banco de dados
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🤖 **IA Assistida**: Relatórios diários com GPT-4o via rota `/api/generate-report`
- 🧪 **Testado**: Cobertura de testes unitários, integração (Vitest) e E2E (Playwright)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação](#-instalação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)

---

## ✨ Funcionalidades

### 💼 Módulos Principais

#### 💰 Gestão Financeira

- **DRE Automatizado**: Demonstração de Resultado do Exercício com regime de competência
- **Fluxo de Caixa**: Visualização detalhada de entradas e saídas
- **📊 Demonstrativo de Fluxo de Caixa Acumulado** ⭐ **NOVO**:
  - Filtros avançados (Unidade, Conta, Período até 2 anos)
  - Tabela interativa com sorting e paginação
  - Dashboard com 6 KPIs (Saldo Inicial, Entradas, Saídas, Variação%, Tendência)
  - Export Excel/PDF/CSV (em desenvolvimento)
  - 48 testes (38 unitários + 10 E2E)
- **Categorização**: Organização hierárquica de despesas e receitas
- **Conciliação Bancária**: Importação e matching automático de extratos OFX
- **Metas Financeiras**: Definição e acompanhamento de metas por categoria

#### 📊 Business Intelligence

- **Dashboard Executivo**: KPIs consolidados com atualização em tempo real
- **Comparativo de Unidades**: Análise de performance entre diferentes unidades
- **Ranking de Profissionais**: Performance individual com comissões
- **Relatórios Customizados**: DRE mensal, análise de atendimentos, receita vs despesa

#### 💈 Operacional

- **Lista da Vez**: Sistema de fila inteligente para distribuição justa de clientes
- **Gestão de Profissionais**: Cadastro com controle de comissões e permissões
- **Controle de Serviços**: Catálogo de serviços com preços por unidade
- **Caixa**: Abertura, fechamento e controle de movimentações

#### 👥 Gestão de Acesso

- **Multi-perfil**: Administrador, Gerente, Barbeiro
- **RLS Nativo**: Segurança em nível de linha no banco de dados
- **Audit Trail**: Rastreamento completo de ações críticas

---

## 🛠️ Stack Tecnológica

### Aplicação (Next.js Monorepo)

| Tecnologia      | Versão | Uso |
| --------------- | ------ | --- |
| Next.js         | 15.x   | Framework full-stack (RSC + `/app/api`) |
| React           | 19.x   | UI declarativa e componentes compartilhados |
| TypeScript      | 5.6+   | Tipagem estática e DX consistente |
| Tailwind CSS    | 3.4+   | Estilização utilitária |
| TanStack Query  | 5.x    | Sincronização de dados client-side |
| Recharts        | 3.x    | Gráficos e dashboards |
| Zod / RHF       | 4.x / 7.x | Validação + formulários |

### Serviços & Infra

| Tecnologia/Serviço | Uso |
| ------------------ | --- |
| Vercel (Serverless + Cron) | Deploy automático, previews e cron `0 8 * * *` para `/api/generate-report` |
| Supabase (Postgres/Auth/Storage) | Persistência, RLS, Realtime e backups |
| OpenAI (GPT‑4o/GPT‑5) | Geração de relatórios e insights via SDK oficial |
| Telegram Bot API | Notificações operacionais (falhas de cron, alertas financeiros) |
| Vercel Analytics/Logs | Observabilidade nativa e log drains opcionais |

### Qualidade & Testes

| Tecnologia      | Versão | Uso |
| --------------- | ------ | --- |
| Vitest          | 3.x    | Testes unitários/integração |
| Testing Library | 16.x   | Testes de componentes |
| Playwright      | 1.56+  | Testes E2E |
| ESLint / Prettier | 9.x / 3.x | Linting e formatação |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 20.0 (ou `nvm use 20`)
- pnpm >= 9 (ou npm/yarn, se preferir)
- Conta no Supabase + acesso à Vercel CLI
- Chave da API OpenAI e bot do Telegram configurados

### Passo a Passo

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/barber-analytics-pro.git
cd barber-analytics-pro
```

2. **Instale as dependências**

```bash
pnpm install
```

3. **Configure as variáveis de ambiente**

```bash
cp .env.example .env.local
# ou sincronize da Vercel:
vercel env pull .env.local
```

Edite `.env.local` (ou use o painel da Vercel) com:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
INTERNAL_SECRET=
```

4. **Inicie o servidor de desenvolvimento**

```bash
pnpm dev
```

5. **Acesse a aplicação**

```
http://localhost:3000
```

### Configuração do Banco de Dados

As migrações são versionadas via Supabase CLI:

```bash
# login/configuração inicial
supabase login
supabase link --project-ref your-project-ref

# aplicar migrations locais
supabase db push
```

Documentação complementar:

- [INFRASTRUCTURE_v3.0.md](INFRASTRUCTURE_v3.0.md) — guia completo da arquitetura 100% Vercel
- [docs/02_ARCHITECTURE.md](docs/02_ARCHITECTURE.md) — visão de arquitetura de software
- [docs/09_DEPLOYMENT_GUIDE.md](docs/09_DEPLOYMENT_GUIDE.md) — detalhes de deploy e CI/CD

---

## 📁 Estrutura do Projeto

O repositório segue os princípios de **Clean Architecture** + **Atomic Design** sobre o `/app` do Next.js:

```
barber-analytics-pro/
├── app/
│   ├── page.tsx                  # Dashboard principal
│   ├── relatorios/page.tsx       # Histórico e alertas
│   └── api/
│       ├── generate-report/route.ts  # Cron diário (Vercel Cron)
│       ├── telegram/route.ts        # Webhook de alerta
│       └── health/route.ts          # Healthcheck
│
├── components/                # Design System (atoms → organisms)
├── lib/
│   ├── supabase.ts           # Client/server helpers
│   ├── openai.ts             # Cliente GPT-4o/GPT-5
│   └── analytics.ts          # danfojs-node + simple-statistics
├── supabase/
│   └── migrations/           # Migrações versionadas
├── tests/                    # Unit/Integration (Vitest)
├── e2e/                      # Playwright specs
├── scripts/                  # Automação (lint, release, etc.)
├── docs/                     # Documentação técnica
└── vercel.json               # Headers, redirects e regiões
```

### Organização por Camadas

#### Camada de Apresentação (UI)

- **Atoms**: Componentes básicos reutilizáveis
- **Molecules**: Combinações simples de atoms
- **Organisms**: Seções complexas com lógica de negócio
- **Templates**: Estruturas de layout
- **Pages**: Páginas completas com roteamento

#### Camada de Aplicação

- **Hooks**: Lógica reutilizável e integração com dados
- **Context**: Estado global da aplicação
- **Services**: Orquestração de casos de uso

#### Camada de Dados

- **Repositories**: Abstração de acesso ao Supabase
- **DTOs**: Contratos e validação de dados

Para mais detalhes, consulte a [Documentação de Arquitetura](docs/ARQUITETURA.md).

---

## 💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm build            # Build de produção
pnpm start            # Sobe build em modo produção local

# Qualidade de Código
pnpm lint             # Executa linter
pnpm lint:fix         # Corrige problemas automaticamente
pnpm format           # Formata código com Prettier
pnpm format:check     # Verifica formatação

# Testes
pnpm test             # Executa testes unitários (watch mode)
pnpm test:run         # Executa testes uma vez
pnpm test:ui          # Interface visual dos testes
pnpm test:coverage    # Relatório de cobertura
pnpm test:e2e         # Testes E2E com Playwright
```

### Workflow de Desenvolvimento

1. **Crie uma branch** para sua feature

```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolva** seguindo os padrões do projeto
   - Consulte [Code Conventions](docs/guides/CODE_CONVENTIONS.md)
   - Use componentes do [Design System](docs/DESIGN_SYSTEM.md)
   - Implemente testes conforme [Testing Guide](docs/TESTING.md)

3. **Valide** seu código

```bash
pnpm lint
pnpm test
pnpm build
```

4. **Commit** usando Conventional Commits

```bash
git commit -m "feat: adiciona nova funcionalidade X"
```

5. **Abra um Pull Request**

Para mais detalhes, consulte:

- [11 - Contributing](docs/11_CONTRIBUTING.md) - Guia completo de contribuição
- [08 - Testing Strategy](docs/08_TESTING_STRATEGY.md) - Estratégia de testes
- [02 - Architecture](docs/02_ARCHITECTURE.md) - Padrões arquiteturais

---

## 🧪 Testes

O projeto utiliza uma estratégia de testes em múltiplas camadas:

### Testes Unitários (Vitest)

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # Com cobertura
```

### Testes E2E (Playwright)

```bash
npx playwright test              # Executa todos os testes E2E
npx playwright test --ui         # Interface visual
npx playwright test --debug      # Modo debug
```

### Estrutura de Testes

- `tests/unit/` - Testes unitários de componentes, hooks e libs
- `e2e/` - Testes end-to-end com Playwright
- `tests/` - Fixtures e utilitários de teste

Cobertura atual:

- ✅ DTOs e validações
- ✅ Serviços principais (DRE, Financeiro)
- ✅ Fluxos críticos E2E
- ⚠️ Em expansão para todos os módulos

Veja mais em [TESTING.md](docs/TESTING.md).

---

## 🚀 Deploy

### Produção (Vercel)

O projeto está configurado para deploy automático via Vercel:

1. **Push para main** dispara deploy automático
2. **Preview deploys** para cada PR
3. **Variáveis de ambiente** configuradas no Vercel Dashboard

### Requisitos de Deploy

```bash
# Build deve passar sem erros
pnpm build

# Testes devem passar
pnpm test:run

# Linting deve estar ok
pnpm lint
```

### Configuração de Ambiente

Variáveis necessárias em produção:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
INTERNAL_SECRET=
```

Para guia completo, consulte [DEPLOY.md](docs/DEPLOY.md).

---

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ **Row-Level Security (RLS)** por tenant/unidade
- ✅ **Autenticação Supabase Auth** com helpers Next.js
- ✅ **Variáveis de Ambiente** isoladas por ambiente na Vercel
- ✅ **Validação de Dados** (Zod) em DTOs e rotas `/app/api`
- ✅ **Anonimização de PII** antes de enviar dados ao OpenAI
- ✅ **Audit Trail** (Supabase + logs serverless)
- ✅ **HTTPS Only** + headers seguros (CSP, HSTS, Referrer-Policy)

### Políticas de Segurança

1. **Client-side**: apenas chaves públicas `NEXT_PUBLIC_*`
2. **Serverless APIs**: secrets (`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INTERNAL_SECRET`) apenas no Server Runtime
3. **Banco**: RLS obrigatório + verificações de policies nas migrations
4. **APIs**: Rate limiting via Supabase + proteção adicional com `INTERNAL_SECRET`
5. **OpenAI**: payloads agregados (sem PII) e logging de `requestId`

Veja mais em [INFRASTRUCTURE_v3.0.md](INFRASTRUCTURE_v3.0.md) e [09 - Deployment Guide](docs/09_DEPLOYMENT_GUIDE.md).

---

## 📚 Documentação

### 📖 Documentação Técnica Completa

Acesse o **[Índice de Documentação](docs/SUMMARY.md)** para navegar por toda a documentação técnica (~13,500 linhas):

**Core Documentation:**

- [00 - Overview](docs/00_OVERVIEW.md) - Visão executiva do sistema
- [01 - Requirements](docs/01_REQUIREMENTS.md) - Requisitos funcionais e não-funcionais
- [02 - Architecture](docs/02_ARCHITECTURE.md) - Clean Architecture + 6 diagramas UML
- [INFRASTRUCTURE_v3.0.md](INFRASTRUCTURE_v3.0.md) - Infra 100% Vercel + OpenAI
- [03 - Domain Model](docs/03_DOMAIN_MODEL.md) - DDD, entities, value objects
- [05 - Infrastructure](docs/05_INFRASTRUCTURE.md) - Supabase: PostgreSQL, Auth, RLS, Realtime
- [06 - API Reference](docs/06_API_REFERENCE.md) - Services, Repositories, Hooks, DTOs
- [07 - Data Model](docs/07_DATA_MODEL.md) - ERD, data dictionary, views, functions
- [08 - Testing Strategy](docs/08_TESTING_STRATEGY.md) - Vitest + Playwright
- [09 - Deployment Guide](docs/09_DEPLOYMENT_GUIDE.md) - Vercel + CI/CD
- [10 - Project Management](docs/10_PROJECT_MANAGEMENT.md) - Scrum/Kanban
- [11 - Contributing](docs/11_CONTRIBUTING.md) - Git workflow + code style
- [12 - Changelog](docs/12_CHANGELOG.md) - Histórico de versões

**Module Documentation:**

- [04.01 - Financial Module](docs/04_MODULES/01_FINANCIAL.md) - Gestão financeira + DRE
- [04.02 - Payments Module](docs/04_MODULES/02_PAYMENTS.md) - Métodos de pagamento
- [04.03 - Clients Module](docs/04_MODULES/03_CLIENTS.md) - CRM + fidelização
- [04.04 - Scheduler Module](docs/04_MODULES/04_SCHEDULER.md) - Lista da Vez + agendamentos
- [04.05 - Reports Module](docs/04_MODULES/05_REPORTS.md) - Dashboard + charts
- [04.06 - Notifications Module](docs/04_MODULES/06_NOTIFICATIONS.md) - WhatsApp + SMS

**Design & Standards:**

- [Design System](docs/DESIGN_SYSTEM.md) - TailwindCSS theme + componentes

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. **Fork** o projeto
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'feat: add amazing feature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Diretrizes

- Siga os padrões de código do projeto (ESLint + Prettier)
- Escreva testes para novas funcionalidades
- Atualize a documentação relevante
- Use Conventional Commits
- Mantenha o código limpo e legível

Leia o [Guia de Contribuição](docs/guides/CONTRIBUTING.md) completo.

---

## 📝 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados © 2025 Andrey Viana.

---

## 👤 Autor

**Andrey Viana**

- 🏗️ **Arquitetura**: Clean Architecture + Domain-Driven Design (DDD)
- 🎨 **Design Pattern**: Atomic Design
- 🛠️ **Stack**: Next.js 15 + Supabase + OpenAI + TailwindCSS
- 📦 **Package Manager**: pnpm

**Desenvolvido para**: Barbearia Grupo Mangabeiras

---

## 📞 Suporte

- 💬 **Issues**: Use o board do GitHub para reportar bugs
- 📧 **Email**: suporte@barberanalytics.com
- 📚 **Documentação**: [docs/SUMMARY.md](docs/SUMMARY.md) + [INFRASTRUCTURE_v3.0.md](INFRASTRUCTURE_v3.0.md)
- ❓ **FAQ**: Veja [perguntas frequentes](docs/guides/FAQ.md)

---

<div align="center">

**Feito com ❤️ para transformar a gestão de barbearias**

[⬆ Voltar ao topo](#-barber-analytics-pro)

</div>
