# 📊 Barber Analytics Pro

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.9-646cff.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

**Plataforma completa de gestão financeira e operacional para redes de barbearias**

[Documentação](docs/README.md) • [Instalação](#-instalação) • [Arquitetura](docs/ARQUITETURA.md) • [Contribuir](docs/guides/CONTRIBUTING.md)

</div>

---

## 🎯 Visão Geral

O **Barber Analytics Pro** é uma aplicação web moderna construída com **React + Vite** que oferece uma solução completa de gestão para redes de barbearias. Desenvolvido seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, o sistema integra-se nativamente com o **Supabase** para fornecer:

- 💰 **Gestão Financeira Completa**: DRE automatizado, fluxo de caixa, controle de despesas e receitas
- 📊 **Dashboards Inteligentes**: KPIs em tempo real com visualizações interativas
- 🏦 **Conciliação Bancária**: Importação e matching automático de extratos OFX
- 💈 **Lista da Vez**: Sistema de fila inteligente para atendimento justo entre profissionais
- 📈 **Relatórios Avançados**: DRE, análise de performance, comissões e muito mais
- 🏢 **Multi-unidade**: Gestão centralizada de múltiplas unidades com permissões granulares

### Principais Diferenciais

- ⚡ **Tempo Real**: Sincronização instantânea via Supabase Realtime
- 🎨 **Design System**: Interface consistente baseada em Atomic Design
- 🔒 **Segurança**: Row-Level Security (RLS) no nível de banco de dados
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🧪 **Testado**: Cobertura de testes unitários e E2E

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

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19.2.0 | Framework principal |
| Vite | 7.1.9 | Build tool e dev server |
| Tailwind CSS | 3.4.18 | Estilização |
| React Router | 7.9.4 | Roteamento |
| TanStack Query | 5.90.3 | Gerenciamento de estado server |
| Framer Motion | 12.23.24 | Animações |
| Recharts | 3.3.0 | Gráficos e visualizações |
| React Hook Form | 7.65.0 | Formulários |
| Zod | 4.1.12 | Validação de schemas |

### Backend & Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| Supabase | Backend as a Service (PostgreSQL, Auth, Realtime, Storage) |
| PostgreSQL | Banco de dados relacional |
| Row-Level Security | Segurança granular de dados |
| Edge Functions | Serverless functions (Deno) |
| Vercel | Hospedagem e CI/CD |

### Qualidade & Testes
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Vitest | 3.2.4 | Testes unitários |
| Testing Library | 16.3.0 | Testes de componentes |
| Playwright | 1.56.0 | Testes E2E |
| ESLint | 9.37.0 | Linting |
| Prettier | 3.6.2 | Formatação de código |

---

## 🚀 Instalação

### Pré-requisitos

- Node.js >= 20.19.0
- npm >= 10.0.0
- Conta no Supabase

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/barber-analytics-pro.git
cd barber-analytics-pro
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:5173
```

### Configuração do Banco de Dados

Execute as migrações SQL na ordem correta:
```bash
# Conecte-se ao seu projeto Supabase e execute os scripts em:
supabase/migrations/
```

Para mais detalhes, consulte o [Guia de Setup Completo](docs/guides/SETUP.md).

---

## 📁 Estrutura do Projeto

O projeto segue os princípios de **Clean Architecture** e **Atomic Design**:

```
barber-analytics-pro/
├── src/
│   ├── atoms/              # 🔹 Componentes básicos (Button, Input, Card)
│   ├── molecules/          # 🔸 Componentes compostos (KPICard, FormField)
│   ├── organisms/          # 🔶 Seções complexas (Sidebar, ConciliacaoPanel)
│   ├── templates/          # 📄 Layouts e estruturas de página
│   ├── pages/              # 📱 Páginas completas da aplicação
│   │
│   ├── hooks/              # 🪝 Custom hooks (useDRE, useListaDaVez)
│   ├── context/            # 🌐 Context providers (Auth, Theme, Unit)
│   ├── services/           # 💼 Lógica de negócio e orquestração
│   ├── repositories/       # 🗄️ Camada de acesso a dados (Supabase)
│   ├── dtos/               # 📋 Data Transfer Objects e validações
│   ├── utils/              # 🛠️ Funções utilitárias
│   └── types/              # 📝 Definições de tipos TypeScript
│
├── docs/                   # 📚 Documentação técnica completa
│   ├── guides/             # 📖 Guias de desenvolvimento
│   ├── ARQUITETURA.md      # Arquitetura do sistema
│   ├── DATABASE_SCHEMA.md  # Esquema do banco de dados
│   └── ...
│
├── supabase/
│   ├── migrations/         # 🗃️ Migrações SQL
│   └── functions/          # ⚡ Edge Functions (Deno)
│
├── tests/                  # 🧪 Testes E2E e fixtures
├── e2e/                    # 🎭 Testes Playwright
└── playwright-artifacts/   # 📊 Resultados de testes E2E
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
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build

# Qualidade de Código
npm run lint             # Executa linter
npm run lint:fix         # Corrige problemas automaticamente
npm run format           # Formata código com Prettier
npm run format:check     # Verifica formatação

# Testes
npm run test             # Executa testes unitários (watch mode)
npm run test:run         # Executa testes uma vez
npm run test:ui          # Interface visual dos testes
npm run test:coverage    # Relatório de cobertura
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
npm run lint
npm run test
npm run build
```

4. **Commit** usando Conventional Commits
```bash
git commit -m "feat: adiciona nova funcionalidade X"
```

5. **Abra um Pull Request**

Para mais detalhes, veja o [Guia de Desenvolvimento](docs/guides/DEVELOPMENT.md).

---

## 🧪 Testes

O projeto utiliza uma estratégia de testes em múltiplas camadas:

### Testes Unitários (Vitest)
```bash
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Com cobertura
```

### Testes E2E (Playwright)
```bash
npx playwright test              # Executa todos os testes E2E
npx playwright test --ui         # Interface visual
npx playwright test --debug      # Modo debug
```

### Estrutura de Testes
- `src/__tests__/` - Testes unitários de componentes e hooks
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
npm run build

# Testes devem passar
npm run test:run

# Linting deve estar ok
npm run lint
```

### Configuração de Ambiente

Variáveis necessárias em produção:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

Para guia completo, consulte [DEPLOY.md](docs/DEPLOY.md).

---

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ **Row-Level Security (RLS)**: Isolamento de dados por unidade
- ✅ **Autenticação JWT**: Via Supabase Auth
- ✅ **Variáveis de Ambiente**: Credenciais nunca no código
- ✅ **Validação de Dados**: Zod em todos os DTOs
- ✅ **Audit Trail**: Logs de ações críticas
- ✅ **HTTPS Only**: Comunicação criptografada

### Políticas de Segurança

1. **Frontend**: Apenas chaves públicas (`VITE_*`)
2. **Backend**: Secrets em Edge Functions/Environment
3. **Database**: RLS policies em todas as tabelas
4. **API**: Rate limiting via Supabase

Veja mais em [SECURITY.md](docs/guides/SECURITY.md).

---

## 📚 Documentação

### Documentação Principal
- [📖 Índice de Documentação](docs/README.md)
- [🏛️ Arquitetura](docs/ARQUITETURA.md)
- [🗄️ Banco de Dados](docs/DATABASE_SCHEMA.md)
- [🎨 Design System](docs/DESIGN_SYSTEM.md)

### Guias Técnicos
- [⚙️ Setup](docs/guides/SETUP.md)
- [💻 Development](docs/guides/DEVELOPMENT.md)
- [📝 Code Conventions](docs/guides/CODE_CONVENTIONS.md)
- [🧩 Components](docs/guides/COMPONENTS.md)
- [🔌 API](docs/guides/API_DOCUMENTATION.md)

### Módulos de Negócio
- [💰 Financial Module](docs/FINANCIAL_MODULE.md)
- [📊 DRE Module](docs/DRE_MODULE.md)
- [💈 Lista da Vez](docs/LISTA_DA_VEZ_MODULE.md)
- [💵 Cash Register](docs/CASH_REGISTER_MODULE.md)

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

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 👥 Equipe

**Desenvolvido para**: Barbearia Grupo Mangabeiras
**Arquitetura**: Clean Architecture + DDD
**Design System**: Atomic Design

---

## 📞 Suporte

- 💬 **Issues**: Use o board do GitHub para reportar bugs
- 📧 **Email**: suporte@barberanalytics.com
- 📚 **Docs**: Consulte a [documentação completa](docs/README.md)
- ❓ **FAQ**: Veja [perguntas frequentes](docs/guides/FAQ.md)

---

<div align="center">

**Feito com ❤️ para transformar a gestão de barbearias**

[⬆ Voltar ao topo](#-barber-analytics-pro)

</div>
