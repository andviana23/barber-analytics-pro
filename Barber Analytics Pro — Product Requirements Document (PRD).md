# 🧭 Barber Analytics Pro — Product Requirements Document (PRD)

**Versão:** 1.0  
**Data:** 11/10/2025  
**Responsável:** Jarvis DevIA (Arquiteto de Software e Gerente de Projeto)  
**Cliente:** Barbearia Grupo Mangabeiras  
**Status:** Em elaboração (fase de definição completa)

---

## 📘 1. Visão Geral do Produto

### 1.1 Nome do Produto

**Barber Analytics Pro**

### 1.2 Descrição

O _Barber Analytics Pro_ é uma plataforma web de **análise financeira e operacional para barbearias multiunidades**, desenvolvida para simplificar a gestão, aumentar a rentabilidade e melhorar a organização do atendimento em tempo real.

**Principais características:**

- Painéis de desempenho (KPIs e gráficos interativos)
- DRE automatizado (Demonstração de Resultado do Exercício)
- Controle de despesas fixas e variáveis
- Módulo de “Lista da Vez” (fila de atendimento justa e em tempo real)
- Comparativo entre unidades (Mangabeiras e Nova Lima)

### 1.3 Público-alvo

- Donos e gestores de barbearias
- Gerentes de unidade
- Profissionais (barbeiros) com acesso controlado

---

## 🎯 2. Objetivos do Produto

| Tipo           | Objetivo                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| Estratégico    | Fornecer uma visão completa do desempenho financeiro e operacional da barbearia |
| Operacional    | Automatizar relatórios mensais e simplificar o controle de caixa                |
| Experiencial   | Proporcionar uma interface moderna, leve e intuitiva                            |
| Analítico      | Consolidar dados de múltiplas unidades em dashboards de fácil leitura           |
| Organizacional | Garantir uma fila de atendimento justa e transparente em tempo real             |

---

## ⚙️ 3. Escopo do Produto

### 3.1 Funcionalidades Principais

#### 🧮 Módulo Financeiro / DRE

- Cadastro de **despesas fixas e variáveis**
- Registro de **receitas (serviços, assinaturas)**
- Cálculo automático de:
  - Faturamento total
  - Ticket médio
  - Lucro líquido e operacional
  - Taxa de cartão
- **DRE mensal e anual**
- Filtro por **unidade (Mangabeiras / Nova Lima)**

#### 📊 Dashboard de KPIs

- Faturamento do mês e anterior
- Lucro líquido e margem
- Número de atendimentos
- Ticket médio por barbeiro
- Ranking de profissionais
- Visualização comparativa entre unidades
- Gráficos dinâmicos (linhas, barras e pizza)
- Atualização em tempo real

#### 🪒 Lista da Vez (Fila de Atendimento)

- Barbeiros se marcam como “disponíveis”
- Sistema organiza a ordem automaticamente
- Possibilidade de:
  - Pausar atendimento
  - Pular barbeiro ausente
  - Reinserir no final da fila
- Painel visual (exibição em TV/tablet)
- Sincronização em **tempo real via Supabase Realtime**

#### 📅 Controle de Unidades

- Separação lógica de dados por unidade
- Permissão de acesso (admin, gerente, barbeiro)
- Comparação entre unidades nos relatórios

#### 📑 Relatórios e Exportação

- Relatórios mensais (PDF/Excel)
- DRE consolidado
- Relatórios de crescimento e rentabilidade

---

## 🧩 4. Stack Tecnológica

| Camada        | Tecnologia                           | Justificativa                     |
| ------------- | ------------------------------------ | --------------------------------- |
| Frontend      | React + TypeScript + Vite + Tailwind | Performance e modularidade        |
| Backend       | Supabase Edge Functions (TypeScript) | Serverless leve e integrado       |
| Banco         | Supabase PostgreSQL                  | Relacional e seguro               |
| Realtime      | Supabase Realtime                    | Sincronização instantânea da fila |
| Autenticação  | Supabase Auth                        | Multiusuário com permissões       |
| Deploy        | Vercel                               | CI/CD e escalabilidade            |
| Design System | Atomic Design + Shadcn/UI            | Coerência visual e reuso          |
| Visualização  | Recharts                             | KPIs e dashboards interativos     |

---

## 🗂️ 5. Estrutura de Dados (Modelo Lógico)

| Tabela               | Descrição                       | Campos Principais                                 |
| -------------------- | ------------------------------- | ------------------------------------------------- |
| **unidades**         | Cadastro das unidades           | id, nome, status                                  |
| **profissionais**    | Barbeiros vinculados a unidades | id, nome, unidade_id, comissao, ativo             |
| **receitas**         | Entradas financeiras            | id, unidade_id, valor, tipo, data, origem         |
| **despesas**         | Gastos fixos e variáveis        | id, unidade_id, tipo, categoria, valor, data      |
| **agendamentos**     | Serviços realizados             | id, profissional_id, valor, data, tipo_servico    |
| **assinaturas**      | Planos recorrentes              | id, unidade_id, nome, valor_mensal, status        |
| **fila_atendimento** | Ordem de atendimento            | id, unidade_id, profissional_id, posicao, status  |
| **resumo_mensal**    | KPIs por mês                    | unidade_id, mes, faturamento, lucro, ticket_medio |

---

## 🧠 6. Requisitos Funcionais

| ID    | Requisito                         | Prioridade |
| ----- | --------------------------------- | ---------- |
| RF-01 | Login de usuário autenticado      | Alta       |
| RF-02 | Cadastro de unidades              | Alta       |
| RF-03 | Lançamento de despesas e receitas | Alta       |
| RF-04 | Cálculo automático de DRE         | Alta       |
| RF-05 | Gráficos e KPIs dinâmicos         | Alta       |
| RF-06 | Gerenciamento da “Lista da Vez”   | Alta       |
| RF-07 | Atualização em tempo real da fila | Alta       |
| RF-08 | Exportação de relatórios          | Média      |
| RF-09 | Comparativo entre unidades        | Média      |
| RF-10 | Logs de ações de usuários         | Média      |

---

## 🧱 7. Requisitos Não Funcionais

| ID     | Requisito                                      | Categoria      |
| ------ | ---------------------------------------------- | -------------- |
| RNF-01 | Resposta inferior a 2 segundos                 | Desempenho     |
| RNF-02 | Interface responsiva (desktop, tablet, mobile) | Usabilidade    |
| RNF-03 | UX intuitiva (Não Me Faça Pensar)              | Usabilidade    |
| RNF-04 | Clean Architecture                             | Arquitetura    |
| RNF-05 | RLS (Row-Level Security) por unidade           | Segurança      |
| RNF-06 | Hospedagem em nuvem (Supabase + Vercel)        | Infraestrutura |
| RNF-07 | Suporte a múltiplas unidades                   | Escalabilidade |
| RNF-08 | Logs e auditoria                               | Confiabilidade |

---

## 👤 8. Perfis de Usuário

| Perfil            | Descrição                   | Permissões           |
| ----------------- | --------------------------- | -------------------- |
| **Administrador** | Dono/gestor master          | Acesso total         |
| **Gerente**       | Responsável local           | Acesso à unidade     |
| **Barbeiro**      | Profissional de atendimento | Fila e KPIs pessoais |

---

## 🔁 9. Fluxos Principais

### 9.1 Cadastro Financeiro

1. Gerente acessa “Financeiro”
2. Clica em “Nova Despesa” ou “Nova Receita”
3. Preenche formulário
4. Sistema salva no Supabase
5. DRE e KPIs atualizam automaticamente

### 9.2 Lista da Vez

1. Barbeiro marca-se “Disponível”
2. Sistema insere barbeiro na fila
3. Cliente chega → primeiro atende
4. Após finalizar → barbeiro volta ao fim da fila
5. Atualização em tempo real em todas as telas

### 9.3 Relatórios e DRE

1. Gerente acessa “Relatórios”
2. Seleciona mês e unidade
3. Sistema gera DRE e gráficos
4. Exportação em PDF/Excel

---

## 🧩 10. UX/UI Diretrizes

**Base:** _Don’t Make Me Think_ (Steve Krug) + _Atomic Design_ (Brad Frost)

- Interface “sem pensar”
- Feedback imediato
- Hierarquia visual clara
- Modo escuro/claro
- Layout modular (Atomic Design)

---

## 🧱 11. Arquitetura de Software

**Camadas:**

- Apresentação (React UI)
- Aplicação (Serviços e casos de uso)
- Domínio (Entidades puras)
- Infraestrutura (Supabase API e Realtime)

**Fluxo Geral:**

---

## 📊 12. KPIs de Produto

| Indicador                    | Meta  |
| ---------------------------- | ----- |
| Tempo médio de carregamento  | < 2s  |
| Retenção mensal de usuários  | > 90% |
| Disponibilidade              | 99,9% |
| Satisfação do usuário (NPS)  | > 85  |
| Redução de erros financeiros | -80%  |

---

## 🗓️ 13. Cronograma de Sprints

| Sprint       | Entregas                                | Duração   |
| ------------ | --------------------------------------- | --------- |
| **Sprint 1** | Setup Supabase, Auth, estrutura inicial | 2 semanas |
| **Sprint 2** | Dashboard inicial (KPIs básicos)        | 2 semanas |
| **Sprint 3** | Módulo Financeiro e DRE                 | 3 semanas |
| **Sprint 4** | Lista da Vez (Realtime)                 | 3 semanas |
| **Sprint 5** | Relatórios e exportações                | 2 semanas |
| **Sprint 6** | UI refinada e testes finais             | 2 semanas |

---

## ⚠️ 14. Riscos e Mitigações

| Risco                               | Impacto | Mitigação                    |
| ----------------------------------- | ------- | ---------------------------- |
| Problemas de sincronização Realtime | Alto    | Testes com Supabase Channels |
| Erros de cálculo de DRE             | Médio   | Funções SQL auditadas        |
| Lentidão em gráficos                | Médio   | Paginação e cache local      |
| Falhas de conexão Supabase          | Baixo   | Reconnect automático         |
| Crescimento inesperado              | Médio   | Escalabilidade automática    |

---

## ✅ 15. Critérios de Aceite

- Todas as funcionalidades testadas e aprovadas
- Dashboard < 2s
- Fila em tempo real
- DRE correto e exportável
- Layout responsivo
- Segurança de dados por unidade

---

## 🧩 16. Próximos Passos

1. Criar diagramas UML (Entidades e Casos de Uso)
2. Definir fluxos visuais (Wireframes)
3. Publicar este PRD no repositório do projeto
4. Iniciar Sprint 1 (Setup Supabase e Auth)

---

© 2025 – _Barber Analytics Pro_  
Desenvolvido com orientação de Jarvis DevIA
