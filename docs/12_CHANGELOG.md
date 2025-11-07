---
title: 'Barber Analytics Pro - Changelog'
author: 'Andrey Viana'
version: '1.0.0'
last_updated: '07/11/2025'
license: 'Proprietary - All Rights Reserved © 2025 Andrey Viana'
---

# 12 - Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## 📋 Índice

- [Unreleased](#unreleased)
- [v0.3.0 - 2025-11-07](#v030---2025-11-07)
- [v0.2.0 - 2025-10-15](#v020---2025-10-15)
- [v0.1.0 - 2025-09-01](#v010---2025-09-01)

---

## [Unreleased]

### 🚧 Em Desenvolvimento

#### Fase 3 - CRM Avançado (Q1 2026)

- **Fidelização**
  - Sistema de pontos (R$ 10 = 1 ponto)
  - Níveis: Bronze, Prata, Ouro, Platina
  - Recompensas automáticas

- **Assinaturas**
  - Planos mensais (R$ 99, R$ 189, R$ 299)
  - Integração com Asaas
  - Cobrança recorrente automática

- **Marketing**
  - Campanhas por WhatsApp
  - Segmentação de clientes
  - Templates de mensagens

---

## [v0.3.0] - 2025-11-07

### 🎉 Adicionado

#### Módulo de Relatórios

- **Dashboard Financeiro** ([#45](https://github.com/andviana23/barber-analytics-pro/issues/45))
  - 4 KPI cards: Receita Total, Despesa Total, Lucro Líquido, Margem %
  - Gráficos interativos com Recharts
  - Filtros por período e unidade
  - Export para PDF e Excel

- **Demonstrativo de Fluxo de Caixa Acumulado** ([#52](https://github.com/andviana23/barber-analytics-pro/pull/52))
  - Saldo acumulado dia a dia
  - Regime de caixa vs competência
  - Tabela com entradas, saídas e saldo
  - Gráfico de linha com área preenchida

- **Cálculo de DRE (Demonstrativo de Resultado)** ([#58](https://github.com/andviana23/barber-analytics-pro/issues/58))
  - Receita Bruta
  - (-) Deduções (taxas)
  - (=) Receita Líquida
  - (-) Custos Fixos
  - (-) Custos Variáveis
  - (=) Lucro Operacional
  - Margem percentual

#### Infraestrutura

- **Realtime Subscriptions** ([#62](https://github.com/andviana23/barber-analytics-pro/pull/62))
  - WebSocket com Supabase Realtime
  - Auto-refresh de receitas/despesas
  - Optimistic updates com TanStack Query

- **Edge Functions** ([#65](https://github.com/andviana23/barber-analytics-pro/issues/65))
  - `send-appointment-reminders`: Notificações automáticas
  - `process-bank-import`: Processamento assíncrono
  - Agendamento via pg_cron

### 🔧 Alterado

- **Performance Otimizada** ([#70](https://github.com/andviana23/barber-analytics-pro/pull/70))
  - Code splitting por módulo
  - Bundle reduction: 2.8MB → 1.9MB (-32%)
  - Lazy loading de páginas
  - Memoização de componentes pesados

- **Design System Refinado** ([#73](https://github.com/andviana23/barber-analytics-pro/issues/73))
  - Migração completa para classes utilitárias
  - Suporte a dark mode aprimorado
  - Animações com Framer Motion

### 🐛 Corrigido

- **Fluxo de Caixa** ([#68](https://github.com/andviana23/barber-analytics-pro/issues/68))
  - Corrigido cálculo de saldo acumulado com múltiplas transações no mesmo dia
  - Fixed: Saldo negativo aparecendo incorretamente

- **Logout Infinito** ([#75](https://github.com/andviana23/barber-analytics-pro/issues/75))
  - Resolvido problema de loading infinito no logout
  - Implementado timeout de 5 segundos

- **RLS Policies** ([#78](https://github.com/andviana23/barber-analytics-pro/pull/78))
  - Corrigido permissões de 'administrador' vs 'admin'
  - Normalização automática de roles

### 🗑️ Removido

- Componentes legados não utilizados (10 arquivos)
- Console.logs de debug em produção

### 🔒 Segurança

- Atualizado dependências com vulnerabilidades
  - `vite`: 5.0.0 → 5.4.2
  - `react-router-dom`: 6.20.0 → 6.26.0
- Adicionado headers de segurança no Vercel

---

## [v0.2.0] - 2025-10-15

### 🎉 Adicionado

#### Módulo Financeiro Completo

- **Receitas** ([#28](https://github.com/andviana23/barber-analytics-pro/issues/28))
  - CRUD completo de receitas
  - Cálculo automático de taxas
  - Categorização (Serviços, Produtos, Outros)
  - Status: Pendente, Pago, Cancelado

- **Despesas** ([#30](https://github.com/andviana23/barber-analytics-pro/issues/30))
  - Registro de despesas fixas e variáveis
  - Categorias customizáveis
  - Despesas recorrentes (mensal, anual)

- **Conciliação Bancária** ([#35](https://github.com/andviana23/barber-analytics-pro/pull/35))
  - Importação de extratos Excel/CSV
  - Detecção automática de duplicatas via hash
  - Matching inteligente com profissionais
  - Revisão manual antes de importar

- **Formas de Pagamento** ([#38](https://github.com/andviana23/barber-analytics-pro/issues/38))
  - 5 formas padrão (Dinheiro, PIX, Débito, Crédito, Transferência)
  - Configuração de taxas por método
  - Cálculo automático de valor líquido

- **Contas Bancárias** ([#40](https://github.com/andviana23/barber-analytics-pro/issues/40))
  - Gestão de múltiplas contas
  - Saldo calculado dinamicamente
  - Histórico de transações

#### Lista da Vez (Turn List)

- **Sistema de Pontuação** ([#42](https://github.com/andviana23/barber-analytics-pro/pull/42))
  - Ordem automática por menor pontuação
  - Reset mensal via pg_cron
  - Histórico completo de atendimentos
  - Relatórios de produtividade

### 🔧 Alterado

- **Migração React 18 → 19** ([#48](https://github.com/andviana23/barber-analytics-pro/pull/48))
  - Uso de novas features (use, Suspense improvements)
  - Atualização de dependências relacionadas

- **TanStack Query v4 → v5** ([#50](https://github.com/andviana23/barber-analytics-pro/pull/50))
  - Breaking changes resolvidos
  - Migração de configuração

### 🐛 Corrigido

- **Seleção de Unidade** ([#55](https://github.com/andviana23/barber-analytics-pro/issues/55))
  - Corrigido: Admin não conseguia selecionar unidade
  - Adicionado query para buscar unidades disponíveis

- **Data de Competência** ([#60](https://github.com/andviana23/barber-analytics-pro/issues/60))
  - Resolvido problema de dia 30 em meses de 31 dias
  - Implementado validação com date-fns

### 📚 Documentação

- Documentação completa do módulo financeiro
- Diagramas ERD atualizados
- Guia de importação de extratos

---

## [v0.1.0] - 2025-09-01

### 🎉 Adicionado

#### MVP - Infraestrutura Base

- **Autenticação** ([#1](https://github.com/andviana23/barber-analytics-pro/issues/1))
  - Login via Supabase Auth
  - JWT tokens com refresh automático
  - Proteção de rotas privadas
  - Roles: Admin, Gerente, Barbeiro, Recepcionista

- **Gestão de Unidades** ([#3](https://github.com/andviana23/barber-analytics-pro/issues/3))
  - CRUD de unidades (barbearias)
  - Seletor de unidade ativa
  - Multi-tenancy via RLS

- **Gestão de Profissionais** ([#5](https://github.com/andviana23/barber-analytics-pro/issues/5))
  - CRUD de profissionais
  - Vinculação com usuários do sistema
  - Status ativo/inativo

- **Gestão de Clientes** ([#8](https://github.com/andviana23/barber-analytics-pro/issues/8))
  - CRUD básico de clientes
  - CPF, telefone, endereço
  - Busca por nome/telefone

- **Gestão de Serviços** ([#10](https://github.com/andviana23/barber-analytics-pro/issues/10))
  - CRUD de serviços
  - Precificação
  - Duração estimada

- **Gestão de Produtos** ([#12](https://github.com/andviana23/barber-analytics-pro/issues/12))
  - CRUD de produtos
  - Controle de estoque básico
  - Precificação

#### Arquitetura

- **Clean Architecture** ([#15](https://github.com/andviana23/barber-analytics-pro/pull/15))
  - 4 camadas: Pages, Services, Repositories, Entities
  - Separação de responsabilidades
  - DTOs para validação

- **Atomic Design** ([#18](https://github.com/andviana23/barber-analytics-pro/pull/18))
  - Atoms: Button, Input, Card
  - Molecules: KPICard, Modal, SearchBar
  - Organisms: Navbar, Sidebar, Table
  - Templates: DashboardLayout, AuthLayout

- **Design System** ([#20](https://github.com/andviana23/barber-analytics-pro/issues/20))
  - TailwindCSS customizado
  - Tema claro/escuro
  - Paleta de cores profissional
  - Classes utilitárias (`.card-theme`, `.text-theme-*`)

#### DevOps

- **Vercel Deployment** ([#22](https://github.com/andviana23/barber-analytics-pro/pull/22))
  - Deploy automático via GitHub
  - Preview deployments em PRs
  - Environment variables

- **CI/CD Pipeline** ([#25](https://github.com/andviana23/barber-analytics-pro/pull/25))
  - GitHub Actions
  - Testes automatizados
  - Lint e format check

### 🔧 Configuração Inicial

- Vite 5 + React 19
- Supabase (PostgreSQL + Auth + Realtime)
- TanStack Query v5
- React Router v6
- Tailwind CSS 3.4
- Lucide React (icons)
- Recharts (gráficos)
- React Hook Form + Zod
- Vitest + Playwright

### 📚 Documentação

- README.md completo
- Guia de instalação
- Arquitetura do sistema
- Convenções de código

---

## Tipos de Mudanças

- `🎉 Adicionado` - Novas funcionalidades
- `🔧 Alterado` - Mudanças em funcionalidades existentes
- `🐛 Corrigido` - Correções de bugs
- `🗑️ Removido` - Funcionalidades removidas
- `🔒 Segurança` - Vulnerabilidades corrigidas
- `⚠️ Deprecated` - Funcionalidades obsoletas (a serem removidas)
- `📚 Documentação` - Apenas documentação

---

## Migration Guides

### v0.2.0 → v0.3.0

**Breaking Changes:** Nenhum

**Recomendações:**

1. Atualizar dependências: `pnpm install`
2. Rodar migrations: `supabase db push`
3. Revalidar queries de fluxo de caixa

### v0.1.0 → v0.2.0

**Breaking Changes:**

1. **TanStack Query v5**

   ```javascript
   // Antes (v4)
   useQuery(['revenues'], fetchRevenues);

   // Depois (v5)
   useQuery({ queryKey: ['revenues'], queryFn: fetchRevenues });
   ```

2. **React Router v6.26**

   ```javascript
   // Antes
   import { useHistory } from 'react-router-dom';
   const history = useHistory();
   history.push('/dashboard');

   // Depois
   import { useNavigate } from 'react-router-dom';
   const navigate = useNavigate();
   navigate('/dashboard');
   ```

**Migrações:**

```bash
# 1. Backup do banco
supabase db dump -f backup-pre-v0.2.0.sql

# 2. Atualizar código
git pull origin main

# 3. Instalar dependências
pnpm install

# 4. Aplicar migrations
supabase db push

# 5. Verificar
pnpm dev
```

---

## Roadmap

### ✅ Fase 1 - MVP Financeiro (Q3 2025) - CONCLUÍDO

- [x] Receitas e Despesas
- [x] Formas de Pagamento
- [x] Contas Bancárias

### ✅ Fase 2 - Relatórios (Q4 2025) - CONCLUÍDO

- [x] Fluxo de Caixa
- [x] DRE
- [x] Dashboard

### 🚧 Fase 3 - CRM Avançado (Q1 2026) - EM PROGRESSO

- [ ] Sistema de Fidelização
- [ ] Assinaturas
- [ ] Marketing/WhatsApp

### 📋 Fase 4 - Agendamentos (Q2 2026) - PLANEJADO

- [ ] Calendário de agendamentos
- [ ] Confirmações automáticas
- [ ] Lembretes via WhatsApp
- [ ] Gestão de horários

### 📋 Fase 5 - Avançado (Q3 2026) - PLANEJADO

- [ ] BI com Metabase
- [ ] Previsão de demanda (ML)
- [ ] App Mobile (React Native)
- [ ] API Pública

---

## Links Úteis

- **Repository**: https://github.com/andviana23/barber-analytics-pro
- **Issues**: https://github.com/andviana23/barber-analytics-pro/issues
- **Projects**: https://github.com/andviana23/barber-analytics-pro/projects
- **Wiki**: https://github.com/andviana23/barber-analytics-pro/wiki
- **Releases**: https://github.com/andviana23/barber-analytics-pro/releases

---

## 🔗 Navegação

- [← 11 - Contributing](./11_CONTRIBUTING.md)
- [📚 Summary](./SUMMARY.md)

---

## 📖 Referências

1. **Keep a Changelog**. Olivier Lacan. https://keepachangelog.com/
2. **Semantic Versioning**. Tom Preston-Werner. https://semver.org/
3. **Conventional Commits**. https://www.conventionalcommits.org/

---

**Última atualização:** 7 de novembro de 2025
**Versão:** 1.0.0
**Autor:** Andrey Viana
