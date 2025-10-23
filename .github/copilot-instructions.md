# 🧠 Copilot Instructions — Barber Analytics Pro

## 🎯 Contexto do Projeto

Você está colaborando no desenvolvimento do sistema **Barber Analytics Pro** — um sistema completo de gestão para barbearias premium, desenvolvido por **Andrey Viana**, com arquitetura limpa, modular e escalável.

O sistema é **React 19 + Vite + TailwindCSS** no frontend, com **Supabase (PostgreSQL + Auth + Realtime + Edge Functions)** no backend.  
Adota **Clean Architecture**, **Domain-Driven Design (DDD)** e **Atomic Design**.

---

## 🏗️ Arquitetura Geral

### 📁 Estrutura de Pastas

src/
├── atoms/ # Componentes básicos (Button, Input, Card)
├── molecules/ # Composições simples (KPICard, Modal, Chart)
├── organisms/ # Estruturas complexas (Navbar, Sidebar, Dashboard)
├── templates/ # Layouts de página
├── pages/ # Páginas com lógica de negócio
├── services/ # Lógica de negócios e integração Supabase
├── repositories/ # Acesso a dados (CRUD)
├── hooks/ # Custom hooks reativos
├── dtos/ # Data Transfer Objects (validação)
└── utils/ # Funções auxiliares e formatação

markdown
Copiar código

---

## ⚙️ Padrões e Convenções

### 🔸 Arquitetura

- Cada módulo segue: **Repository → Service → DTO → Hook → Page**
- **Repository** acessa o Supabase diretamente
- **Service** contém regras de negócio e validações
- **DTOs** validam e transformam dados
- **Hooks** controlam estado e side effects
- **Pages** conectam componentes e UI

### 🔸 Código e Organização

- Componentes: **PascalCase**
- Funções/variáveis: **camelCase**
- Imports organizados: libs externas → internos → locais
- Funções async sempre retornam `{ data, error }`
- Evitar lógica de negócio em componentes React
- **Soft delete** (`is_active = false`) em vez de exclusão direta
- **RLS** (Row Level Security) ativo em todas as tabelas

### 🔸 Boas práticas

- Usar `React.memo` para componentes de lista
- Hooks com cache e `refetch`
- Manter consistência visual com Tailwind
- Criar componentes reutilizáveis antes de duplicar código

---

## 💰 Módulo Financeiro

- Baseado em `FINANCIAL_MODULE.md`
- Segue arquitetura: **Repository + Service + DTO**
- Entidades: `revenues`, `expenses`, `parties`, `bank_accounts`, `payment_methods`
- Cálculos automáticos (lucro líquido, margem, fluxo) em views SQL
- Processos de conciliação via `source_hash`
- Deduplicação e validações no `Service Layer`

---

## 🧾 Importação de Extratos Bancários

- Lê arquivos Excel/CSV, normaliza dados e identifica créditos
- Detecta profissional, cliente e forma de pagamento automaticamente
- Deduplicação via `source_hash`
- Revisão manual antes da gravação final
- Serviços principais:
  - `readExcelFile()`, `normalizeData()`, `enrichData()`, `insertApprovedRecords()`

---

## 💈 Lista da Vez

- Gerencia ordem de atendimento por unidade
- Reset automático mensal via **Edge Function (Supabase)** às 23:59
- Histórico mensal completo
- Funções SQL documentadas em `LISTA_DA_VEZ_MODULE.md`
- Componentes principais:
  - `ListaDaVezPage.jsx`, `useListaDaVez.js`, `listaDaVezService.js`

---

## 🧮 DRE e Relatórios

- Geração de DRE via função `fn_calculate_dre()` (Supabase)
- Visualização de KPIs em `KPICard`, `FinancialDashboard`, `CashflowChart`
- Página de relatórios central: `RelatoriosPage.jsx`

---

## 🔐 Autenticação e Permissões

- Hook: `useAuth()`
- Roles: `barbeiro`, `gerente`, `admin`
- RLS Policies aplicadas em todas as tabelas
- Controle de UI baseado em `user_metadata.role`

Exemplo de policy:

```sql
CREATE POLICY "view_own_unit"
ON revenues
FOR SELECT USING (
  unit_id IN (SELECT unit_id FROM professionals WHERE user_id = auth.uid())
);
🧠 Regras para o Copilot Chat
✅ Quando escrever código:
Seguir Clean Architecture

Não acessar o Supabase direto do componente React

Retornar { data, error } em funções async

Usar DTOs para validar inputs

Aplicar máscaras e formatações (formatCurrency, formatDate)

Usar toast.success() e toast.error() para feedback

Hooks devem incluir loading, error, refetch

✅ Quando criar novos módulos:
Nomear seguindo o padrão:

nomeService.js

useNome.js

NomePage.jsx

Incluir DTO de criação e resposta

Adicionar RLS policy no banco, se aplicável

✅ Quando gerar SQL:
Seguir snake_case

Incluir CHECK, DEFAULT e timestamps (created_at, updated_at)

Usar is_active e RLS sempre

💡 Estilo de Resposta Esperado do Copilot
Explicar brevemente a decisão arquitetural

Código limpo, comentado e consistente

Mostrar paths reais (src/services/..., src/pages/...)

Evitar respostas genéricas ou fora da estrutura do projeto

Manter o padrão Enterprise + Clean Code

🧩 Checklist de Criação de Features
Repository

Service

DTO

Hook

Componentes (Atomic)

Page

Testes

Atualizar Documentação

📈 Resultado Esperado
O Copilot deve:

Entender toda a arquitetura do Barber Analytics Pro

Manter consistência nos padrões

Criar código funcional e modular

Integrar automaticamente com os padrões existentes

Seguir Clean Architecture + DDD + Atomic Design

Evitar redundância e manter alta legibilidade

✨ Autor & Contexto
Autor: Andrey Viana
Projeto: Barber Analytics Pro
Estilo: Enterprise, Clean Code, Atomic, Multi-tenant, Supabase-first
Meta: Sistema de gestão de barbearia completo, modular e escalável.
```
