# 📊 Barber Analytics Pro

> **Plataforma de inteligência financeira para redes de barbearias com dashboards em tempo real, conciliação automatizada e Lista da Vez integrada ao Supabase.**
>
> **Criado em:** 2025-10-22  
> **Autor:** Codex (IA)  
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🎯 Visão Geral

O Barber Analytics Pro é uma aplicação SPA construída com **React + Vite** que consome diretamente os serviços do **Supabase** (PostgreSQL, Auth, Realtime e Edge Functions). O objetivo é concentrar os principais KPIs financeiros e operacionais de uma rede de barbearias, oferecendo módulos de fluxo de caixa, DRE, conciliação bancária e fila inteligente de atendimento.

---

## 🧭 Mapa Rápido

- 🔗 **Documentação completa:** [`docs/README.md`](docs/README.md)
- 🧱 **Arquitetura:** [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
- 🛠️ **Design System:** [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- 🧪 **Testes:** [`docs/TESTING.md`](docs/TESTING.md)
- 🚀 **Deploy:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

---

## 🧰 Stack & Ferramentas

- ⚛️ **Frontend:** React 19, Vite 7, Tailwind CSS 3, React Router, TanStack Query, Framer Motion, Recharts, Chart.js
- 🗄️ **Dados & Autenticação:** Supabase (PostgreSQL, Auth, Row-Level Security, Storage, Edge Functions)
- 🧪 **Testes:** Vitest, Testing Library, Playwright (a configurar)
- 🛠️ **Tooling:** ESLint, Prettier, TypeScript (type checking em serviços), Lucide Icons

---

## 🗂️ Estrutura de Pastas

```
barber-analytics-pro/
├─ src/
│  ├─ atoms/            # Componentes atômicos (Button, Card, Input, ...)
│  ├─ molecules/        # Componentes compostos (KPICard, ClientModals, ...)
│  ├─ organisms/        # Estruturas ricas (ConciliacaoPanel, Sidebar, ...)
│  ├─ templates/        # Modais e layouts avançados
│  ├─ pages/            # Páginas completas (Dashboard, Financeiro, DRE, ...)
│  ├─ hooks/            # Hooks de dados e UI (useDRE, useListaDaVez, ...)
│  ├─ context/          # Providers (Auth, Theme, Unit, Toast)
│  ├─ services/         # Orquestração de regras de negócio
│  ├─ repositories/     # Acesso ao Supabase com whitelists/blacklists
│  ├─ dtos/             # Contratos e validações (Zod/classes)
│  └─ utils/            # Utilitários transversais
├─ docs/                # Documentação técnica e módulos de negócio
├─ supabase/            # Funções Edge (Deno) e migrações SQL
└─ tests/               # Fixtures de testes e2e/unit (em evolução)
```

---

## ⚙️ Configuração do Ambiente

```bash
cp .env.example .env            # ou .env.local
npm install
npm run dev                     # Servidor Vite (porta 5173)
```

Configurações mínimas necessárias:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

---

## 🔒 Segurança

- 🔑 Utilize apenas variáveis com prefixo `VITE_` no frontend; chaves privadas ficam em ambientes de servidor/Edge.
- 🧩 Row-Level Security por `unit_id` garante isolamento entre unidades da rede.
- 🔐 Autenticação, permissões e auditoria controladas pelo Supabase Auth + Policies.

---

## ✅ Estado Atual

- [✅] Módulos Financeiro, DRE, Lista da Vez e Importação de Extratos documentados e desenvolvidos.
- [✅] Design System com tokens/classe temáticas consolidados.
- [⚠️] Testes E2E com Playwright pendentes de configuração inicial.
- [⚠️] Diretórios `api/` e `src/api/` aguardando decisão (remover/usar).

---

## 🚀 Próximos Passos sugeridos

1. Configurar suíte Playwright (`playwright.config.ts`) com cenários de autenticação e fluxo financeiro.
2. Revisar encoding de documentos legados heredados (restante do histórico). 
3. Consolidar pipeline de CI (lint, vitest, build) antes do deploy.

---

## 🤝 Contribuindo

1. Faça um fork e crie uma branch: `git checkout -b feature/nome-da-feature`  
2. Aplique as boas práticas do Design System + DTOs  
3. Execute `npm run lint` e `npm run test` antes do PR  
4. Abra o Pull Request seguindo Conventional Commits

---

## 📬 Suporte

- 💬 Issues: use o board do GitHub
- 📧 Contato: suporte interno da Barber Analytics
- 📚 Documentação: veja a pasta [`docs/`](docs)

