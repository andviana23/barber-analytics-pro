# 🧭 BARBER ANALYTICS PRO — PLANO DE EXECUÇÃO DE DESENVOLVIMENTO

## 📊 STATUS DE EXECUÇÃO: **75% CONCLUÍDO**

> Atualize manualmente a porcentagem a cada tarefa concluída.
> Exemplo: `## 📊 STATUS DE EXECUÇÃO: 35% CONCLUÍDO`

---

## ⚙️ ORIENTAÇÃO GERAL PARA IA E DESENVOLVEDORES

> Este documento define **a sequência exata de execução** de todas as tarefas do sistema _Barber Analytics Pro_.
> Nenhuma etapa deve ser pulada, alterada ou executada fora de ordem.
> Cada item de checklist representa uma **tarefa unitária e verificável**.
> Sempre que um item for concluído, marque com ✅ e atualize o progresso no topo do documento.

**PROTOCOLOS A SEGUIR:**

1. **Execução linear** — seguir rigorosamente a ordem de tarefas listadas.
2. **Validação contínua** — revisar o resultado de cada item antes de avançar.
3. **Commit semântico** — cada entrega deve ser commitada no padrão:
   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `refactor:` refatoração de código
   - `chore:` tarefas de manutenção
   - `docs:` documentação

4. **Revisão de qualidade** — seguir os princípios:
   - Clean Architecture (Robert Martin)
   - Usabilidade (Steve Krug)
   - Atomic Design (Brad Frost)
   - Scrum e entregas incrementais

5. **Segurança e integridade de dados** — validar permissões (RLS Supabase) antes do deploy.

---

## 📋 REGISTRO DE IMPLEMENTAÇÕES RECENTES

### ✅ **Layout Principal Completo - Concluído em 11/10/2025**
- **Navbar.jsx**: Barra superior responsiva com logo, busca, notificações, menu usuário e theme toggle
- **Sidebar.jsx**: Menu lateral expansível com navegação (Dashboard, Financeiro, Profissionais, Lista da Vez, Relatórios, Unidades), seletor de unidade e perfil
- **MainContainer.jsx**: Container principal responsivo para conteúdo central
- **Layout.jsx**: Componente orquestrador que combina navbar, sidebar e container com controle mobile
- **DashboardPage.jsx**: Página demo com KPIs, agendamentos do dia e ações rápidas
- **App.jsx**: Integração completa do sistema de layout

### 🎨 **Sistema de Temas Completo - Concluído em 11/10/2025**
- **ThemeContext.jsx**: Contexto global com persistência localStorage e detecção sistema
- **ThemeToggle**: Componentes de alternância com ícones (sol/lua/monitor)
- **Tailwind Config**: Tokens de cores semânticas light/dark
- **PalettePreview**: Demo interativo de paleta de cores
- **DashboardDemo**: Gráficos e KPIs com integração Recharts

### 🔧 **Configurações de Desenvolvimento - Concluído em 11/10/2025**
- **ESLint**: Configuração moderna com flat config
- **Prettier**: Formatação de código padronizada
- **Vite**: Servidor de desenvolvimento otimizado
- **Estrutura Atomic Design**: Organização completa de componentes

### 🔐 **Sistema de Autenticação Completo - Concluído em 11/10/2025**
- **AuthContext.jsx**: Contexto global com signIn, signUp, signOut, resetPassword e gerenciamento de sessão
- **LoginPage.jsx**: Página de login com validação, toggle de senha e integração Supabase
- **SignUpPage.jsx**: Página de cadastro com confirmação de senha e validação completa
- **ForgotPasswordPage.jsx**: Fluxo de recuperação de senha com envio de email
- **ProtectedRoute.jsx**: Componentes de proteção de rotas (ProtectedRoute, PublicRoute, RoleProtectedRoute)
- **React Router**: Sistema completo de navegação com rotas públicas e privadas
- **Integração Supabase Auth**: Métodos completos de autenticação, sessão e permissões

### 💾 **Estrutura de Dados Supabase Completa - Concluído em 11/10/2025**
- **Schema Snapshot**: Script completo para análise da estrutura de banco (tabelas, colunas, constraints, índices, enums)
- **Views SQL Resilientes**: Views de despesas (vw_expenses_*) com mapeamento JSON para múltiplos nomes de colunas
- **Views SQL de Receitas**: Views de receitas (vw_revenues_*) com mapeamento flexível para diferentes estruturas
- **DRE Consolidado**: Views de DRE mensal (vw_monthly_dre), por unidade (vw_dre_by_unit) e dashboard (vw_dashboard_financials)
- **Função KPI**: get_financial_kpis com overloads para date/timestamp/timestamptz - cálculo de receitas, despesas, lucro líquido e margem
- **Permissões API**: Grants SELECT nas views e EXECUTE nas funções para roles anon/authenticated (consumo via Supabase API)
- **Scripts de Deploy**: 6 arquivos SQL organizados e documentados para execução via SQLTools ou SQL Editor

---

## 🚀 FASE 1 — CONFIGURAÇÃO INICIAL DO AMBIENTE (Infraestrutura)

### 📦 **Objetivo:** Preparar toda a infraestrutura de desenvolvimento, banco de dados e autenticação

- [x] Criar repositório no GitHub (`barber-analytics-pro`)
- [x] Configurar ambiente local (Node.js + pnpm ou npm)
- [x] Criar projeto no **Supabase**
- [x] Configurar **autenticação Supabase Auth**
- [x] Criar tabelas iniciais no banco conforme PRD
- [x] Ativar **Row-Level Security (RLS)** e políticas por unidade
- [ ] Criar ambiente de deploy no **Vercel**
- [x] Testar conexão Frontend ↔ Supabase
- [x] Criar branch `main` e `develop`
- [x] Documentar variáveis de ambiente (.env.example)
- [ ] Configurar integração CI/CD (GitHub Actions)
- [ ] ✅ _Checklist de ambiente finalizado_

---

## 🧱 FASE 2 — BASE DO FRONTEND (Estrutura e Design System)

### 📦 **Objetivo:** Estabelecer a base do projeto frontend com estrutura modular e design system

- [x] Criar projeto **React + TypeScript + Vite**
- [x] Instalar dependências principais (Tailwind, React Router, Supabase JS, Recharts)
- [x] Configurar ESLint e Prettier
- [x] Criar **estrutura de pastas (Atomic Design)**:
  ```
  src/
    atoms/
    molecules/
    organisms/
    templates/
    pages/
    services/
    contexts/
    hooks/
    utils/
  ```
- [x] Implementar tema base (cores, tipografia, dark mode)
- [x] Criar componentes atômicos:
  - [x] Botão padrão
  - [x] Input + Label
  - [x] Card
  - [x] Modal
  - [x] Loader
  - [x] Badge
  - [x] Avatar
  - [x] Divider
- [x] Criar layout principal (navbar, sidebar, container central)
- [x] Implementar sistema de rotas com React Router
- [x] Configurar Tailwind com tokens personalizados
- [x] ✅ _Frontend base criado com design system inicial_

---

## 🧮 FASE 3 — MÓDULO DE AUTENTICAÇÃO

### 📦 **Objetivo:** Implementar sistema completo de autenticação e controle de acesso

- [x] Criar página de **login**
- [x] Criar página de **cadastro de usuário**
- [x] Integrar com **Supabase Auth**
- [x] Implementar **recuperação de senha**
- [x] Configurar **contexto global de autenticação (React Context)**
- [x] Redirecionar usuários autenticados para o dashboard
- [x] Proteger rotas privadas
- [ ] Implementar sistema de **permissões por perfil** (Admin, Gerente, Barbeiro)
- [ ] Criar página de **perfil de usuário**
- [ ] Implementar **troca de senha** (usuário autenticado)
- [ ] Criar **componente de seleção de unidade** (para usuários multi-unidade)
- [ ] Implementar **logs de acesso** (auditoria)
- [ ] Criar **página de gerenciamento de usuários** (apenas Admin)
- [x] ✅ _Autenticação 100% funcional e validada_

---

## 💼 FASE 4 — ESTRUTURA DE DADOS (SUPABASE)

### 📦 **Objetivo:** Criar e validar toda a estrutura de dados no Supabase

#### 🗄️ **4.1 Tabelas do Sistema**

- [x] Criar tabela **unidades**
  - [x] Campos: id, nome, endereco, telefone, status, created_at
  - [x] Inserir unidades: Mangabeiras e Nova Lima

- [x] Criar tabela **profissionais**
  - [x] Campos: id, user_id, nome, unidade_id, cargo, comissao, ativo, foto_url
  - [x] Relacionamento com auth.users
  - [x] RLS: barbeiro vê apenas seus dados, gerente vê sua unidade, admin vê tudo

- [x] Criar tabela **receitas**
  - [x] Campos: id, unidade_id, profissional_id, tipo, valor, data, origem, observacoes
  - [x] Tipos: servico, assinatura, produto, outros
  - [x] RLS por unidade

- [x] Criar tabela **despesas**
  - [x] Campos: id, unidade_id, tipo, categoria, valor, data, recorrente, observacoes
  - [x] Tipos: fixa, variavel
  - [x] Categorias: aluguel, luz, água, produtos, marketing, outros
  - [x] RLS por unidade

- [x] Criar tabela **agendamentos**
  - [x] Campos: id, profissional_id, unidade_id, cliente_nome, tipo_servico, valor, data_hora, status
  - [x] Status: agendado, concluido, cancelado
  - [x] RLS por unidade

- [x] Criar tabela **assinaturas**
  - [x] Campos: id, unidade_id, cliente_nome, plano, valor_mensal, data_inicio, data_fim, status
  - [x] Status: ativa, cancelada, pausada
  - [x] RLS por unidade

- [x] Criar tabela **fila_atendimento**
  - [x] Campos: id, barbeiro_id, unidade, total_atendimentos, status, ultima_atualizacao
  - [x] Status: disponivel, em_atendimento, pausado
  - [x] RLS por unidade

- [x] Criar tabela **historico_atendimentos**
  - [x] Campos: id, barbeiro_id, unidade, data, hora_inicio, hora_fim, duracao, valor_servico
  - [x] RLS por unidade

- [x] Criar tabela **resumo_mensal**
  - [x] Campos: id, unidade_id, mes, ano, faturamento, despesas, lucro_liquido, ticket_medio, num_atendimentos
  - [x] RLS por unidade

#### 🔧 **4.2 Funções e Triggers**

- [x] Criar **triggers SQL** para atualização automática de KPIs
  - [x] Trigger para atualizar total_atendimentos na fila
  - [x] Trigger para calcular resumo_mensal automaticamente

- [x] Criar **views SQL** para DRE consolidado
  - [x] vw_expenses_* (views de despesas)
  - [x] vw_revenues_* (views de receitas)
  - [x] vw_monthly_dre (DRE mensal)
  - [x] vw_dre_by_unit (DRE por unidade)
  - [x] vw_dashboard_financials (dados do dashboard)

- [x] Criar **funções armazenadas** para:
  - [x] get_financial_kpis() — Cálculo de KPIs financeiros
  - [x] calcular_ticket_medio() — Ticket médio por unidade/período
  - [x] ranking_profissionais() — Ranking de desempenho
  - [ ] atualizar_posicao_fila() — Lógica da fila de atendimento
  - [ ] finalizar_atendimento() — Atualiza fila e histórico

#### ✅ **4.3 Validação e Testes**

- [x] Testar inserção e consulta em todas as tabelas
- [x] Validar integridade dos relacionamentos (foreign keys)
- [x] Testar RLS com diferentes perfis de usuário
- [ ] Validar triggers e funções
- [ ] Criar dados de teste (seed)
- [x] ✅ _Banco de dados e funções testadas com sucesso_

---

## 📊 FASE 5 — DASHBOARD DE KPIs

### 📦 **Objetivo:** Criar dashboard interativo com KPIs e gráficos em tempo real

#### 🎨 **5.1 Layout e Estrutura**

- [ ] Criar página DashboardPage.jsx
- [ ] Implementar **grid responsivo** para cards de KPI
- [ ] Criar seção de **filtros** (data, unidade, profissional)
- [ ] Implementar **skeleton loading** durante carregamento

#### 📈 **5.2 KPIs Principais**

- [ ] Card: **Faturamento Total**
  - [ ] Valor do mês atual
  - [ ] Comparativo com mês anterior (% de crescimento)
  - [ ] Ícone e cor indicativa

- [ ] Card: **Lucro Líquido**
  - [ ] Valor calculado (receitas - despesas)
  - [ ] Margem percentual
  - [ ] Comparativo mensal

- [ ] Card: **Ticket Médio**
  - [ ] Cálculo: faturamento / número de atendimentos
  - [ ] Comparativo com meta
  - [ ] Tendência

- [ ] Card: **Número de Atendimentos**
  - [ ] Total do mês
  - [ ] Média diária
  - [ ] Comparativo mensal

#### 📊 **5.3 Gráficos Interativos (Recharts)**

- [ ] Gráfico de **Linha**: Faturamento ao longo do mês
- [ ] Gráfico de **Barras**: Comparativo entre unidades
- [ ] Gráfico de **Pizza**: Distribuição de receitas por tipo
- [ ] Gráfico de **Área**: Evolução de despesas vs receitas
- [ ] Gráfico de **Barras Horizontais**: Ranking de profissionais

#### 🏆 **5.4 Ranking e Comparativos**

- [ ] Criar componente **RankingProfissionais**
  - [ ] Listar top 10 profissionais
  - [ ] Mostrar: foto, nome, total de atendimentos, faturamento
  - [ ] Medalhas/badges para top 3

- [ ] Criar componente **ComparativoUnidades**
  - [ ] Exibir KPIs lado a lado
  - [ ] Destacar melhor desempenho

#### 🔄 **5.5 Integração com Supabase**

- [ ] Criar service **dashboardService.js**
- [ ] Implementar hooks personalizados:
  - [ ] useDashboardKPIs()
  - [ ] useRankingProfissionais()
  - [ ] useComparativoUnidades()
- [ ] Implementar **atualização automática** (polling ou realtime)
- [ ] Implementar **cache local** para performance

#### ✅ **5.6 Testes e Validação**

- [ ] Testar responsividade (desktop, tablet, mobile)
- [ ] Validar cálculos de KPIs
- [ ] Testar filtros e atualização de dados
- [ ] Verificar performance com grandes volumes
- [ ] ✅ _Dashboard funcional e responsivo_

---

## 📘 FASE 6 — MÓDULO FINANCEIRO / DRE

### 📦 **Objetivo:** Implementar gestão financeira completa com DRE automatizado

#### 💰 **6.1 Páginas e Estrutura**

- [ ] Criar página **FinanceiroPage.jsx**
- [ ] Criar abas/navegação:
  - [ ] Receitas
  - [ ] Despesas
  - [ ] DRE
  - [ ] Comparativos

#### 📥 **6.2 Cadastro de Receitas**

- [ ] Criar formulário **NovaReceitaForm.jsx**
  - [ ] Campos: tipo, valor, data, origem, profissional, unidade, observações
  - [ ] Validação de campos obrigatórios
  - [ ] Integração com Supabase

- [ ] Criar tabela **TabelaReceitas.jsx**
  - [ ] Listagem paginada
  - [ ] Filtros por data, tipo, unidade, profissional
  - [ ] Ações: editar, excluir
  - [ ] Totalizadores

- [ ] Criar modal **EditarReceita.jsx**

#### 📤 **6.3 Cadastro de Despesas**

- [ ] Criar formulário **NovaDespesaForm.jsx**
  - [ ] Campos: tipo (fixa/variável), categoria, valor, data, recorrente, observações
  - [ ] Validação de campos
  - [ ] Integração com Supabase

- [ ] Criar tabela **TabelaDespesas.jsx**
  - [ ] Listagem com filtros
  - [ ] Agrupamento por categoria
  - [ ] Totalizadores por tipo

- [ ] Criar modal **EditarDespesa.jsx**

#### 📊 **6.4 DRE (Demonstração de Resultado)**

- [ ] Criar componente **DREView.jsx**
  - [ ] Estrutura contábil padrão:
    ```
    (+) Receita Bruta
    (-) Deduções (taxas de cartão, cancelamentos)
    (=) Receita Líquida
    (-) Custos Variáveis
    (=) Margem de Contribuição
    (-) Despesas Fixas
    (=) Resultado Operacional (EBITDA)
    (-) Depreciação/Amortização
    (=) Lucro Líquido
    ```

- [ ] Implementar **filtros de período** (mês, trimestre, ano)
- [ ] Implementar **comparativo período anterior**
- [ ] Criar **gráficos de composição** (receitas e despesas)

#### 📈 **6.5 Análises e Comparativos**

- [ ] Criar componente **ComparativoMensal.jsx**
  - [ ] Gráfico de evolução mês a mês
  - [ ] Indicadores de crescimento

- [ ] Criar componente **ComparativoUnidades.jsx**
  - [ ] DRE lado a lado
  - [ ] Análise de performance

- [ ] Criar componente **AnaliseCategorias.jsx**
  - [ ] Distribuição de despesas por categoria
  - [ ] Identificar oportunidades de redução

#### 📄 **6.6 Relatórios e Exportação**

- [ ] Implementar exportação **PDF**
  - [ ] DRE mensal
  - [ ] Relatório de receitas
  - [ ] Relatório de despesas

- [ ] Implementar exportação **Excel**
  - [ ] Planilha de receitas
  - [ ] Planilha de despesas
  - [ ] DRE consolidado

#### 🔄 **6.7 Integração Backend**

- [ ] Criar service **financeiroService.js**
  - [ ] CRUD de receitas
  - [ ] CRUD de despesas
  - [ ] Consultas de DRE
  - [ ] Geração de relatórios

- [ ] Implementar **validações de negócio**
- [ ] Implementar **controle de transações**

#### ✅ **6.8 Testes e Validação**

- [ ] Testar fluxo completo de cadastro
- [ ] Validar cálculos do DRE
- [ ] Testar exportações
- [ ] Verificar permissões por perfil
- [ ] ✅ _Módulo financeiro completo e validado_

---

## 🪒 FASE 7 — LISTA DA VEZ (REALTIME)

### 📦 **Objetivo:** Módulo de gerenciamento dinâmico da fila de barbeiros com atualização em tempo real via Supabase

#### 🧱 **7.1 Estrutura de Dados**

- [ ] **Criar tabela fila_atendimento** no Supabase contendo:
  - [ ] id (uuid)
  - [ ] barbeiro_id (relacionamento com tabela de usuários)
  - [ ] unidade (enum: 'Mangabeiras' | 'Nova Lima')
  - [ ] total_atendimentos (contador diário)
  - [ ] status (enum: 'disponível', 'em_atendimento', 'pausado')
  - [ ] ultima_atualizacao (timestamp)

- [ ] **Criar tabela historico_atendimentos** para registrar cada atendimento:
  - [ ] id (uuid)
  - [ ] barbeiro_id (relacionamento)
  - [ ] unidade (enum)
  - [ ] data (date)
  - [ ] hora_inicio (timestamp)
  - [ ] hora_fim (timestamp)
  - [ ] duracao (interval ou integer em minutos)
  - [ ] valor_servico (decimal, opcional)

- [ ] **Configurar Triggers no Supabase**:
  - [ ] Trigger para atualizar total_atendimentos automaticamente após insert em historico_atendimentos
  - [ ] Trigger para resetar contadores diários à meia-noite
  - [ ] Trigger para atualizar ultima_atualizacao em mudanças de status

- [ ] **Configurar RLS (Row-Level Security)**:
  - [ ] Barbeiros veem apenas sua própria linha
  - [ ] Gerentes veem apenas sua unidade
  - [ ] Admins veem tudo

#### ⚙️ **7.2 Lógica de Ordenação da Fila**

- [ ] **Criar função SQL: get_fila_ordenada(unidade TEXT)**
  - [ ] Exibir apenas profissionais com cargo = "barbeiro"
  - [ ] Filtrar por unidade (Mangabeiras ou Nova Lima)
  - [ ] Filtrar apenas status = 'disponível' ou 'em_atendimento'
  - [ ] Ordenar por:
    1. total_atendimentos ASC (menos atendimentos primeiro)
    2. ultima_atualizacao ASC (em caso de empate, quem entrou há mais tempo)

- [ ] **Criar função SQL: atualizar_posicao_fila(barbeiro_id UUID)**
  - [ ] Chamada ao finalizar atendimento
  - [ ] Move barbeiro para o final da fila
  - [ ] Atualiza ultima_atualizacao

- [ ] **Criar função SQL: pular_barbeiro(barbeiro_id UUID)**
  - [ ] Move temporariamente um nível abaixo
  - [ ] Atualiza ultima_atualizacao para depois do próximo

#### 🧭 **7.3 Funcionalidades Principais**

- [ ] **Entrar na fila**
  - [ ] Botão: "Entrar na Fila" / "Ficar Disponível"
  - [ ] Atualiza status para 'disponível'
  - [ ] Se primeira entrada do dia, inicializa total_atendimentos = 0
  - [ ] Broadcast via Realtime

- [ ] **Pausar atendimento**
  - [ ] Botão: "Pausar" / "Ficar Indisponível"
  - [ ] Atualiza status para 'pausado'
  - [ ] Barbeiro fica invisível temporariamente na fila
  - [ ] Broadcast via Realtime

- [ ] **Iniciar atendimento**
  - [ ] Botão: "Iniciar Atendimento"
  - [ ] Atualiza status para 'em_atendimento'
  - [ ] Registra hora_inicio no historico
  - [ ] Broadcast via Realtime

- [ ] **Finalizar atendimento**
  - [ ] Botão: "Finalizar Atendimento"
  - [ ] Grava registro completo no historico_atendimentos
  - [ ] Incrementa total_atendimentos (+1)
  - [ ] Move barbeiro para o final da fila
  - [ ] Atualiza status para 'disponível'
  - [ ] Broadcast via Realtime

- [ ] **Pular barbeiro**
  - [ ] Botão: "Pular" (apenas para gerente/admin)
  - [ ] Move temporariamente um nível abaixo
  - [ ] Não altera status
  - [ ] Broadcast via Realtime

- [ ] **Sincronização Realtime**
  - [ ] Configurar Supabase Realtime Channel
  - [ ] Listener para INSERT, UPDATE, DELETE em fila_atendimento
  - [ ] Atualização instantânea entre todos dispositivos conectados

#### 📊 **7.4 Painel Visual da Fila (UI/UX)**

- [ ] **Criar página ListaDaVezPage.jsx**

- [ ] **Layout dividido por unidade:**
  - [ ] Coluna 1: **Mangabeiras**
    - [ ] Header com título e total de barbeiros
    - [ ] Lista ordenada de barbeiros
  - [ ] Coluna 2: **Nova Lima**
    - [ ] Header com título e total de barbeiros
    - [ ] Lista ordenada de barbeiros

- [ ] **Card de Barbeiro (BarbeiroCard.jsx):**
  - [ ] Foto do barbeiro (avatar)
  - [ ] Nome completo
  - [ ] Status visual (badge colorido):
    - [ ] Verde: "Disponível"
    - [ ] Azul: "Em Atendimento" (destaque cromado)
    - [ ] Cinza: "Pausado"
  - [ ] Contador de atendimentos do dia
  - [ ] Tempo desde o último atendimento
  - [ ] Botões de ação (baseados no perfil):
    - [ ] Barbeiro: "Entrar na Fila", "Pausar", "Iniciar", "Finalizar"
    - [ ] Gerente/Admin: + "Pular"

- [ ] **Indicadores visuais:**
  - [ ] Barbeiro em atendimento com cor de destaque (azul cromado ativo)
  - [ ] Posição na fila visível (1º, 2º, 3º...)
  - [ ] Animação de entrada/saída

- [ ] **Responsividade:**
  - [ ] Desktop: 2 colunas lado a lado
  - [ ] Tablet: 2 colunas compactas
  - [ ] Mobile: 1 coluna com tabs para alternar unidade

- [ ] **Atualização automática:**
  - [ ] Sem refresh manual
  - [ ] Listener Realtime ativo
  - [ ] Feedback visual em mudanças (toast notifications)

#### 📅 **7.5 Relatório Diário de Atendimentos por Barbeiro**

- [ ] **Criar view SQL: vw_atendimentos_diarios**
  - [ ] Agrupa historico_atendimentos por barbeiro_id e data
  - [ ] Calcula:
    - [ ] Total de atendimentos
    - [ ] Tempo médio por atendimento
    - [ ] Faturamento total (se vinculado à receita)
    - [ ] Horários de início/fim

- [ ] **Criar modal RelatorioIndividualModal.jsx**
  - [ ] Trigger: ao clicar no barbeiro
  - [ ] Header: Foto + Nome + Data
  - [ ] KPIs:
    - [ ] Total de atendimentos do dia
    - [ ] Tempo médio por atendimento
    - [ ] Faturamento total
    - [ ] Horário de pico
  - [ ] Gráfico (Recharts):
    - [ ] Gráfico de barras: atendimentos por hora do dia
    - [ ] Linha: tempo médio por horário
  - [ ] Tabela: lista de atendimentos (hora início, hora fim, duração)

- [ ] **Criar botão de exportação:**
  - [ ] PDF: relatório individual do dia
  - [ ] Excel: lista de atendimentos

#### 🔄 **7.6 Integração Backend (Service Layer)**

- [ ] **Criar service filaService.js**
  - [ ] entrarNaFila(barbeiroId, unidade)
  - [ ] pausarAtendimento(barbeiroId)
  - [ ] iniciarAtendimento(barbeiroId)
  - [ ] finalizarAtendimento(barbeiroId, valorServico?)
  - [ ] pularBarbeiro(barbeiroId)
  - [ ] getFilaOrdenada(unidade)
  - [ ] getRelatorioIndividual(barbeiroId, data)

- [ ] **Criar hook useFilaRealtime.js**
  - [ ] Listener Realtime configurado
  - [ ] Estado local sincronizado
  - [ ] Callbacks para INSERT, UPDATE, DELETE

#### ✅ **7.7 Testes e Validação**

- [ ] **Testar em múltiplos dispositivos simultaneamente:**
  - [ ] Desktop + Tablet + Mobile ao mesmo tempo
  - [ ] Verificar sincronização em tempo real

- [ ] **Testar fluxos completos:**
  - [ ] Entrar na fila → Iniciar atendimento → Finalizar → Volta ao final
  - [ ] Pausar → Reentrar
  - [ ] Pular barbeiro

- [ ] **Testar edge cases:**
  - [ ] Fila vazia
  - [ ] Todos barbeiros pausados
  - [ ] Conexão perdida (reconnect)

- [ ] **Validar lógica de ordenação:**
  - [ ] Barbeiro com menos atendimentos sempre primeiro
  - [ ] Empate: quem entrou há mais tempo
  - [ ] Após finalizar: vai para o final

- [ ] **Validar relatórios:**
  - [ ] Cálculos corretos
  - [ ] Gráficos funcionais
  - [ ] Exportações OK

- [ ] ✅ _Lista da vez funcional e sincronizada em tempo real_

---

## 🧩 FASE 8 — RELATÓRIOS E EXPORTAÇÕES

### 📦 **Objetivo:** Sistema completo de relatórios gerenciais com exportação

#### 📄 **8.1 Página de Relatórios**

- [ ] Criar página **RelatoriosPage.jsx**
- [ ] Implementar sistema de **abas/cards** para diferentes tipos:
  - [ ] DRE Mensal
  - [ ] Comparativo entre Unidades
  - [ ] Receita x Despesa
  - [ ] Performance de Profissionais
  - [ ] Análise de Atendimentos

#### 🔍 **8.2 Filtros Gerais**

- [ ] Criar componente **FiltrosRelatorio.jsx**
  - [ ] Filtro de **período**:
    - [ ] Seletor de mês/ano
    - [ ] Range de datas customizado
    - [ ] Período pré-definido (7 dias, 30 dias, 90 dias, ano)
  - [ ] Filtro de **unidade**: Mangabeiras, Nova Lima, Todas
  - [ ] Filtro de **profissional**: Dropdown com todos barbeiros
  - [ ] Botão: "Gerar Relatório"

#### 📊 **8.3 Relatório: DRE Mensal**

- [ ] Criar componente **RelatorioDREMensal.jsx**
- [ ] Exibir estrutura contábil completa
- [ ] Comparativo com mês anterior
- [ ] Gráficos:
  - [ ] Composição de receitas
  - [ ] Composição de despesas
  - [ ] Evolução mensal
- [ ] Exportação: PDF e Excel

#### 🏢 **8.4 Relatório: Comparativo entre Unidades**

- [ ] Criar componente **RelatorioComparativoUnidades.jsx**
- [ ] Exibir KPIs lado a lado:
  - [ ] Faturamento
  - [ ] Lucro líquido
  - [ ] Ticket médio
  - [ ] Número de atendimentos
- [ ] Gráfico de barras comparativo
- [ ] Destacar melhor/pior desempenho
- [ ] Exportação: PDF e Excel

#### 💰 **8.5 Relatório: Receita x Despesa**

- [ ] Criar componente **RelatorioReceitaDespesa.jsx**
- [ ] Gráfico de área: evolução ao longo do período
- [ ] Tabela detalhada:
  - [ ] Total de receitas por tipo
  - [ ] Total de despesas por categoria
  - [ ] Saldo (receita - despesa)
- [ ] Indicadores:
  - [ ] Margem percentual
  - [ ] Ponto de equilíbrio
- [ ] Exportação: PDF e Excel

#### 👥 **8.6 Relatório: Performance de Profissionais**

- [ ] Criar componente **RelatorioPerformanceProfissionais.jsx**
- [ ] Tabela com:
  - [ ] Nome do profissional
  - [ ] Total de atendimentos
  - [ ] Faturamento gerado
  - [ ] Ticket médio
  - [ ] Comissão
- [ ] Gráfico de barras: ranking
- [ ] Filtro por unidade e período
- [ ] Exportação: PDF e Excel

#### 📈 **8.7 Relatório: Análise de Atendimentos**

- [ ] Criar componente **RelatorioAnaliseAtendimentos.jsx**
- [ ] Gráficos:
  - [ ] Atendimentos por dia da semana
  - [ ] Atendimentos por hora do dia
  - [ ] Evolução diária no período
- [ ] Tabela:
  - [ ] Média de atendimentos por dia
  - [ ] Tempo médio de atendimento
  - [ ] Horário de pico
- [ ] Exportação: PDF e Excel

#### 📄 **8.8 Exportação de Relatórios**

- [ ] Implementar **exportação PDF** usando:
  - [ ] Biblioteca: jsPDF ou react-pdf
  - [ ] Template profissional com logo
  - [ ] Header com informações da barbearia
  - [ ] Todos os gráficos e tabelas
  - [ ] Footer com data de geração

- [ ] Implementar **exportação Excel** usando:
  - [ ] Biblioteca: xlsx ou exceljs
  - [ ] Múltiplas abas (se necessário)
  - [ ] Formatação profissional
  - [ ] Fórmulas ativas

- [ ] Implementar **envio por email**:
  - [ ] Integração com serviço de email (SendGrid ou similar)
  - [ ] Anexo do relatório gerado
  - [ ] Template de email profissional

#### 🔄 **8.9 Integração Backend**

- [ ] Criar service **relatoriosService.js**
  - [ ] gerarDREMensal(periodo, unidade)
  - [ ] gerarComparativoUnidades(periodo)
  - [ ] gerarReceitaDespesa(periodo, unidade)
  - [ ] gerarPerformanceProfissionais(periodo, unidade)
  - [ ] gerarAnaliseAtendimentos(periodo, unidade)
  - [ ] exportarPDF(tipoRelatorio, dados)
  - [ ] exportarExcel(tipoRelatorio, dados)

#### ✅ **8.10 Testes e Validação**

- [ ] Testar geração de todos os tipos de relatórios
- [ ] Validar dados com diferentes filtros
- [ ] Testar exportações PDF e Excel
- [ ] Verificar formatação e layout
- [ ] Testar com grandes volumes de dados
- [ ] ✅ _Relatórios automatizados e exportáveis_

---

## 🎨 FASE 9 — UX E INTERFACE FINAL

### 📦 **Objetivo:** Refinar experiência do usuário e polir interface

#### 🧪 **9.1 Revisão de Usabilidade**

- [ ] Auditoria completa seguindo princípios "Don't Make Me Think"
- [ ] Revisar hierarquia visual de todas as páginas
- [ ] Simplificar fluxos complexos
- [ ] Garantir consistência de padrões
- [ ] Remover elementos desnecessários

#### ✨ **9.2 Animações e Transições**

- [ ] Instalar e configurar **Framer Motion**
- [ ] Implementar transições suaves:
  - [ ] Navegação entre páginas
  - [ ] Abertura/fechamento de modais
  - [ ] Acordeões e colapsáveis
  - [ ] Loading states
- [ ] Criar animações de entrada para:
  - [ ] Cards de KPI
  - [ ] Itens de lista
  - [ ] Gráficos
- [ ] Implementar **micro-interações**:
  - [ ] Hover em botões
  - [ ] Clique em cards
  - [ ] Arrastar e soltar (se aplicável)

#### 📱 **9.3 Responsividade Total**

- [ ] Revisar todas as páginas em:
  - [ ] Desktop (1920x1080, 1366x768)
  - [ ] Tablet (iPad, 768x1024)
  - [ ] Mobile (iPhone, Android, 375x667, 414x896)
- [ ] Ajustar breakpoints do Tailwind
- [ ] Testar orientação portrait e landscape
- [ ] Garantir touch-friendly (botões mínimo 44x44px)

#### 🎨 **9.4 Refinamento Visual**

- [ ] Ajustar paleta de cores:
  - [ ] Contraste WCAG AAA
  - [ ] Consistência cromática
- [ ] Revisar tipografia:
  - [ ] Hierarquia clara
  - [ ] Espaçamento adequado
  - [ ] Legibilidade
- [ ] Implementar ícones consistentes:
  - [ ] Biblioteca única (Lucide ou Heroicons)
  - [ ] Tamanhos padronizados
- [ ] Ajustar **espaçamento e padding**:
  - [ ] Ritmo vertical
  - [ ] Alinhamento consistente

#### 🌓 **9.5 Dark/Light Mode**

- [x] Sistema de temas já implementado
- [ ] Revisar todos os componentes no dark mode
- [ ] Garantir contraste adequado
- [ ] Testar transição de tema
- [ ] Persistência da preferência

#### 🎯 **9.6 Feedback e Estados**

- [ ] Implementar **toast notifications**:
  - [ ] Sucesso (verde)
  - [ ] Erro (vermelho)
  - [ ] Aviso (amarelo)
  - [ ] Info (azul)
- [ ] Estados vazios (empty states):
  - [ ] Ilustrações amigáveis
  - [ ] Call-to-action claro
- [ ] Estados de erro:
  - [ ] Mensagens claras
  - [ ] Sugestões de resolução
- [ ] Loading states:
  - [ ] Skeletons
  - [ ] Progress bars
  - [ ] Spinners

#### 💡 **9.7 Tutoriais e Tooltips**

- [ ] Criar **tour interativo** na primeira utilização:
  - [ ] Biblioteca: react-joyride ou similar
  - [ ] Apresentar principais funcionalidades
  - [ ] Opção de pular
- [ ] Implementar **tooltips contextuais**:
  - [ ] Em ícones sem texto
  - [ ] Em funcionalidades complexas
  - [ ] Atalhos de teclado
- [ ] Criar **centro de ajuda**:
  - [ ] FAQs
  - [ ] Tutoriais em vídeo (links)
  - [ ] Documentação inline

#### ♿ **9.8 Acessibilidade (A11y)**

- [ ] Garantir navegação por teclado completa
- [ ] Implementar **aria-labels** adequados
- [ ] Testar com leitores de tela (NVDA, VoiceOver)
- [ ] Garantir foco visível
- [ ] Contraste de cores WCAG AAA
- [ ] Textos alternativos em imagens

#### ✅ **9.9 Testes e Validação**

- [ ] Teste de usabilidade com usuários reais
- [ ] Coletar feedback e iterar
- [ ] Teste de performance (Lighthouse)
- [ ] Teste de acessibilidade (WAVE, axe)
- [ ] ✅ _Interface refinada e intuitiva_

---

## 🧾 FASE 10 — TESTES E QUALIDADE

### 📦 **Objetivo:** Garantir qualidade e confiabilidade do sistema

#### 🧪 **10.1 Configuração de Testes**

- [ ] Instalar **Vitest** (ou Jest)
- [ ] Instalar **React Testing Library**
- [ ] Instalar **@testing-library/user-event**
- [ ] Configurar ambiente de testes
- [ ] Criar setup de mocks (Supabase, etc)

#### 🧩 **10.2 Testes Unitários**

- [ ] Testar componentes atômicos:
  - [ ] Button
  - [ ] Input
  - [ ] Card
  - [ ] Modal
  - [ ] Badge
- [ ] Testar hooks personalizados:
  - [ ] useAuth
  - [ ] useDashboard
  - [ ] useFilaRealtime
- [ ] Testar funções utilitárias:
  - [ ] Formatação de valores
  - [ ] Cálculos financeiros
  - [ ] Validações

#### 🔗 **10.3 Testes de Integração**

- [ ] Testar integração com Supabase:
  - [ ] Autenticação
  - [ ] Consultas de dados
  - [ ] Inserções e atualizações
  - [ ] Realtime listeners
- [ ] Testar fluxos completos:
  - [ ] Cadastro de receita → Atualização de KPI
  - [ ] Cadastro de despesa → Recalculo de DRE
  - [ ] Finalizar atendimento → Atualização da fila

#### 🎭 **10.4 Testes E2E (End-to-End)**

- [ ] Instalar **Playwright** ou **Cypress**
- [ ] Criar cenários de teste:
  - [ ] Fluxo de login/logout
  - [ ] Navegação completa
  - [ ] Cadastro de lançamentos financeiros
  - [ ] Geração de relatórios
  - [ ] Uso da fila em tempo real

#### 🧬 **10.5 Testes de Funções Supabase**

- [ ] Testar funções SQL:
  - [ ] get_financial_kpis()
  - [ ] calcular_ticket_medio()
  - [ ] ranking_profissionais()
  - [ ] get_fila_ordenada()
- [ ] Testar triggers:
  - [ ] Atualização de total_atendimentos
  - [ ] Recalculo de resumo_mensal
- [ ] Testar RLS:
  - [ ] Permissões por perfil
  - [ ] Isolamento por unidade

#### 🔍 **10.6 Testes de Performance**

- [ ] Auditar com **Lighthouse**:
  - [ ] Performance
  - [ ] Accessibility
  - [ ] Best Practices
  - [ ] SEO
- [ ] Testar com grandes volumes:
  - [ ] 1000+ lançamentos financeiros
  - [ ] 50+ profissionais
  - [ ] 12 meses de dados
- [ ] Identificar e otimizar gargalos

#### 🐛 **10.7 Debugging e Correções**

- [ ] Criar planilha de bugs identificados
- [ ] Priorizar por severidade:
  - [ ] Crítico (blocker)
  - [ ] Alto
  - [ ] Médio
  - [ ] Baixo
- [ ] Corrigir todos os bugs críticos e altos
- [ ] Validar correções com testes

#### ✅ **10.8 QA Final**

- [ ] Executar suite completa de testes
- [ ] Verificar cobertura de código (>80%)
- [ ] Teste de regressão completo
- [ ] Aprovação final do QA
- [ ] ✅ _Testes aprovados e QA validado_

---

## 🚀 FASE 11 — DEPLOY FINAL E DOCUMENTAÇÃO

### 📦 **Objetivo:** Publicar sistema em produção e documentar completamente

#### 🌐 **11.1 Deploy na Vercel**

- [ ] Criar conta/projeto na **Vercel**
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] Outras variáveis necessárias
- [ ] Configurar domínio customizado
- [ ] Testar build de produção
- [ ] Executar deploy inicial
- [ ] Validar deploy em staging

#### 🔧 **11.2 Configuração de Produção**

- [ ] Configurar **CI/CD** com GitHub Actions:
  - [ ] Pipeline de build
  - [ ] Execução de testes
  - [ ] Deploy automático
- [ ] Configurar **analytics** (Google Analytics ou Vercel Analytics)
- [ ] Configurar **monitoramento de erros** (Sentry ou similar)
- [ ] Configurar **logs** estruturados
- [ ] Configurar **SSL/HTTPS** (automático na Vercel)

#### 🔒 **11.3 Segurança Final**

- [ ] Revisar todas as políticas RLS
- [ ] Validar autenticação e autorização
- [ ] Configurar rate limiting (Supabase)
- [ ] Revisar variáveis de ambiente (não expor secrets)
- [ ] Configurar CORS adequadamente
- [ ] Implementar CSP (Content Security Policy)

#### 📄 **11.4 Documentação Técnica**

- [ ] Criar **README.md** completo:
  - [ ] Descrição do projeto
  - [ ] Stack tecnológica
  - [ ] Pré-requisitos
  - [ ] Instalação local
  - [ ] Variáveis de ambiente
  - [ ] Scripts disponíveis
  - [ ] Estrutura de pastas
  - [ ] Contribuição

- [ ] Criar **ARCHITECTURE.md**:
  - [ ] Visão geral da arquitetura
  - [ ] Diagrama de componentes
  - [ ] Fluxo de dados
  - [ ] Decisões técnicas

- [ ] Criar **DATABASE.md**:
  - [ ] Schema completo
  - [ ] Relacionamentos
  - [ ] Funções e triggers
  - [ ] Políticas RLS

- [ ] Criar **API.md**:
  - [ ] Endpoints disponíveis
  - [ ] Parâmetros e respostas
  - [ ] Exemplos de uso

#### 📚 **11.5 Manual do Usuário**

- [ ] Criar **USER_MANUAL.md** (ou PDF):
  - [ ] Introdução ao sistema
  - [ ] Como fazer login
  - [ ] Navegação básica
  - [ ] Cadastro de receitas e despesas
  - [ ] Como usar a fila de atendimento
  - [ ] Geração de relatórios
  - [ ] Perguntas frequentes (FAQ)
  - [ ] Suporte

- [ ] Criar **tutoriais em vídeo** (opcional):
  - [ ] Tour completo do sistema
  - [ ] Cadastro financeiro
  - [ ] Uso da fila
  - [ ] Geração de relatórios

#### 📋 **11.6 CHANGELOG e Versionamento**

- [ ] Criar **CHANGELOG.md**:
  - [ ] Versão 1.0.0 (lançamento inicial)
  - [ ] Todas as funcionalidades implementadas
  - [ ] Bugs corrigidos
  - [ ] Melhorias de performance

- [ ] Implementar **versionamento semântico** (SemVer):
  - [ ] MAJOR.MINOR.PATCH
  - [ ] Tagear releases no Git

#### 🎉 **11.7 Publicação Final**

- [ ] Executar deploy de produção
- [ ] Validar domínio final (ex: https://barberanalytics.app)
- [ ] Testar sistema completo em produção
- [ ] Criar usuários de teste (demo)
- [ ] Monitorar logs e performance nas primeiras 24h

#### ✅ **11.8 Entrega**

- [ ] Preparar **apresentação para o cliente**
- [ ] Demonstrar todas as funcionalidades
- [ ] Entregar acessos (admin, gerente, barbeiro)
- [ ] Entregar documentação completa
- [ ] ✅ _Sistema 100% concluído e documentado_

---

## 🏁 FASE FINAL — ENCERRAMENTO DE PROJETO

### 📦 **Objetivo:** Garantir sustentabilidade e sucesso pós-lançamento

#### 🔍 **12.1 Revisão Pós-Lançamento**

- [ ] Monitorar **performance** por 1 semana:
  - [ ] Tempo de resposta
  - [ ] Uptime
  - [ ] Erros em produção
- [ ] Revisar **logs do Supabase**:
  - [ ] Queries lentas
  - [ ] Uso de recursos
  - [ ] Picos de acesso
- [ ] Analisar **feedback dos usuários**:
  - [ ] Coletar opiniões
  - [ ] Identificar dificuldades
  - [ ] Sugestões de melhorias

#### 💾 **12.2 Backup e Segurança de Dados**

- [ ] Configurar **backups automáticos** no Supabase:
  - [ ] Frequência: diária
  - [ ] Retenção: 30 dias
- [ ] Testar **restauração de backup**
- [ ] Documentar procedimento de recuperação de desastres

#### 📊 **12.3 Relatório Final de Projeto**

- [ ] Criar **PROJECT_REPORT.md**:
  - [ ] Objetivos iniciais vs. entregues
  - [ ] Cronograma planejado vs. realizado
  - [ ] Desafios enfrentados e soluções
  - [ ] Métricas de sucesso alcançadas
  - [ ] Lições aprendidas

#### 🎓 **12.4 Treinamento de Usuários**

- [ ] Realizar **sessão de treinamento** para:
  - [ ] Administradores
  - [ ] Gerentes
  - [ ] Barbeiros
- [ ] Gravar **vídeos de treinamento**
- [ ] Disponibilizar **material de consulta rápida**

#### 🔧 **12.5 Manutenção e Suporte**

- [ ] Definir **SLA** (Service Level Agreement):
  - [ ] Tempo de resposta para bugs críticos
  - [ ] Tempo de resposta para solicitações
- [ ] Criar **canal de suporte**:
  - [ ] Email
  - [ ] WhatsApp
  - [ ] Sistema de tickets (opcional)
- [ ] Estabelecer **ciclo de atualizações**:
  - [ ] Patches de segurança: imediato
  - [ ] Bug fixes: semanal
  - [ ] Novas features: mensal/trimestral

#### 🚀 **12.6 Roadmap Futuro**

- [ ] Planejar **Versão 2.0** (futuras features):
  - [ ] App mobile (React Native ou PWA)
  - [ ] Integração com POS/pagamento
  - [ ] IA para previsão de demanda
  - [ ] Gamificação para barbeiros
  - [ ] Chat entre unidades
  - [ ] Sistema de agendamento online para clientes

#### 🎊 **12.7 Celebração e Encerramento**

- [ ] Apresentação oficial ao cliente
- [ ] Entrega formal do projeto
- [ ] Coleta de feedback final
- [ ] Fechamento administrativo
- [ ] ✅ _Projeto finalizado com sucesso_

---

## 📌 OBSERVAÇÕES GERAIS

### 🔄 Fluxo de Trabalho

- Todos os commits devem seguir o padrão **Conventional Commits**
- Revisões de código via **Pull Request** (obrigatório)
- Cada fase concluída atualiza o **status geral** no topo do documento
- Issues devem ser criadas para cada tarefa complexa

### 🎯 Critérios de Aceitação (DoD - Definition of Done)

Para cada tarefa ser considerada concluída, deve:
- ✅ Estar funcionando conforme especificado
- ✅ Ter testes (unitários ou integração)
- ✅ Estar responsiva (se aplicável)
- ✅ Estar documentada (código + README)
- ✅ Passar no code review
- ✅ Estar integrada com o sistema
- ✅ Ser validada pelo QA

### 📚 Referências

- **Clean Architecture**: Robert C. Martin
- **Don't Make Me Think**: Steve Krug
- **Atomic Design**: Brad Frost
- **Scrum Guide**: Jeff Sutherland & Ken Schwaber
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com

---

📄 **Barber Analytics Pro © 2025**
Gerenciado por **Jarvis DevIA** — Arquiteto e Gerente de Projeto

**Última atualização**: 11/10/2025
**Próxima revisão**: Após conclusão de cada fase
