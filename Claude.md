Agente de IA — Barber Analytics Pro
🧭 Contexto

Este documento define as diretrizes que todo agente de IA (VSCode / Claude / Jarvis) deve seguir ao interagir, gerar ou modificar código no projeto Barber Analytics Pro.

O objetivo é garantir consistência, qualidade técnica, segurança e alinhamento com os padrões arquiteturais definidos no PRD e no Plano de Execução do sistema.

⚙️ 1. Princípios Fundamentais
1.1. Objetivo do Agente

O agente deve assistir o time de desenvolvimento com inteligência e contexto, sem substituir decisões humanas de arquitetura ou produto.

Deve sempre se apoiar em fontes confiáveis, boas práticas e nos padrões do sistema Barber Analytics Pro.

1.2. Base Filosófica

As práticas aqui definidas derivam das obras:

Clean Architecture — Robert C. Martin (Uncle Bob)

Patterns of Enterprise Application Architecture — Martin Fowler

Software Requirements — Karl Wiegers

Agile Estimating and Planning — Mike Cohn

PMBOK — PMI Institute

UML Essencial — Martin Fowler

Atomic Design — Brad Frost

Não Me Faça Pensar — Steve Krug

The Design of Everyday Things — Don Norman

Effective JavaScript — David Herman

React Up & Running — Stoyan Stefanov

🧱 2. Arquitetura e Estrutura do Sistema
2.1. Padrão Arquitetural

Clean Architecture: separação rigorosa entre camadas (Domain, Application, Infrastructure, UI)

DDD (Domain-Driven Design) aplicado nos módulos centrais (Financeiro, Lista da Vez, Dashboard)

Atomic Design aplicado à camada de interface (componentes React)

Supabase como backend e banco de dados (PostgreSQL)

2.2. Regras para Estrutura de Código

Cada módulo deve respeitar o princípio SRP (Single Responsibility Principle)

Nome de pastas e arquivos sempre em lowercase com kebab-case

Evitar duplicação de lógica — aplicar DRY (Don’t Repeat Yourself)

Manter nomes semânticos e legíveis (Clean Code)

Todo código React deve seguir o modelo component > atomic structure (atoms → molecules → organisms → templates → pages)

2.3. Integrações e Banco de Dados

Toda criação ou alteração no banco deve ser feita exclusivamente via @pgsql

O agente nunca deve sugerir queries diretas fora desse contexto

Views, triggers e funções devem seguir o padrão:

Prefixos: fn_, vw_, trg_

Linguagem: plpgsql

Documentação obrigatória com descrição e parâmetros

2.4. Segurança e Governança

Nunca expor variáveis sensíveis ou chaves de API no código

Utilizar .env.local para variáveis privadas

Implementar RLS (Row Level Security) para cada tabela Supabase

A IA não deve sugerir bypass de autenticação

🧠 3. Padrões de Código e Estilo
3.1. Clean Code

Funções pequenas e claras (máx. 20 linhas)

Evitar side effects ocultos

Usar nomes descritivos: getBarberRevenue() é melhor que getData()

Comentários apenas quando o código não for autoexplicativo

Preferir composição a herança

3.2. Clean JavaScript / React

Seguir as práticas do livro Effective JavaScript

Utilizar Hooks em vez de classes

Evitar mutação de estado direta

Usar TypeScript quando possível para segurança de tipos

Sempre validar props com PropTypes ou zod

3.3. Padrões de Commits e Branches

Branches: feature/, fix/, chore/, refactor/

Commits no padrão Conventional Commits:

feat: para novas funcionalidades

fix: para correções

refactor: para melhorias estruturais

docs: para documentação

📊 4. Padrões de Design e UX
4.1. Diretrizes Gerais

Seguir os princípios de usabilidade de Steve Krug e Don Norman:

O sistema deve ser óbvio e previsível

Interfaces devem minimizar o esforço cognitivo

Cada ação deve dar feedback visual imediato

4.2. Atomic Design

Atoms: botões, inputs, ícones, tipografia

Molecules: forms, cards, listas

Organisms: tabelas, dashboards, modais

Templates: estruturas de páginas

Pages: instâncias específicas do layout

4.3. Acessibilidade e Performance

Garantir conformidade WCAG 2.1 AA

Lighthouse score ≥ 90 em todas as métricas

Utilizar aria-labels e foco controlado via teclado

🧩 5. Metodologia de Trabalho
5.1. Framework Ágil

Baseado no Scrum e nas boas práticas do PMBOK

Sprint padrão: 2 semanas

Papéis:

Product Owner: responsável pelo backlog e prioridades

Scrum Master: garante o fluxo e a comunicação

Dev Team: desenvolvedores + IA assistiva

5.2. Estimativas e Planejamento

Seguir o método Planning Poker (Mike Cohn)

Usar story points com Fibonacci (1, 2, 3, 5, 8...)

Refinar backlog semanalmente com base em valor de negócio

5.3. Documentação e UML

Diagramas UML devem seguir UML Essencial (Martin Fowler)

Diagramas obrigatórios:

Casos de Uso (Requisitos)

Classes (Domínio)

Sequência (Fluxos críticos)

🚫 6. Regras de Prevenção de Erros e Alucinações
6.1. Sobre a IA

O agente nunca deve inventar informações, tabelas, endpoints ou padrões não existentes.

Antes de propor qualquer solução, deve verificar o PRD e o Plano de Execução.

6.2. Sobre Banco de Dados

Não criar tabelas, colunas ou chaves sem aprovação explícita do arquiteto

Toda alteração deve estar registrada em schema/updates.sql

6.3. Sobre Código e Integrações

Não sugerir pacotes ou libs não homologadas (consultar package.json)

Não reescrever lógica sem analisar dependências existentes

Sempre revisar o impacto de cada alteração no DRE e Dashboard principal

🧩 7. Fluxo de Ação do Agente IA

Ler o PRD e o Plano de Execução antes de iniciar qualquer tarefa

Identificar contexto e objetivo da ação

Verificar padrões e dependências existentes

Aplicar princípios de Clean Code / Clean Architecture

Validar alterações via @pgsql (quando envolver DB)

Documentar toda mudança no log do sistema (CHANGELOG.md)

Gerar output apenas se estiver 100% consistente com os padrões definidos

📚 8. Referências Obrigatórias

Clean Architecture — Robert C. Martin

Patterns of Enterprise Application Architecture — Martin Fowler

Software Requirements — Karl Wiegers

Agile Estimating and Planning — Mike Cohn

UML Essencial — Martin Fowler

The Scrum Handbook — Jeff Sutherland

PMBOK (4ª edição) — PMI

Atomic Design — Brad Frost

Não Me Faça Pensar — Steve Krug

The Design of Everyday Things — Don Norman

Effective JavaScript — David Herman

React Up & Running — Stoyan Stefanov

✅ 9. Conclusão

Este documento deve ser lido toda vez que o Agente IA iniciar uma sessão de desenvolvimento.

Ele é a bússola ética e técnica do projeto Barber Analytics Pro — garantindo que cada linha de código respeite clareza, propósito e excelência arquitetural.