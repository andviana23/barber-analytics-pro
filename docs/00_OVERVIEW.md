# 00 - Overview: Barber Analytics Pro

---

**Documento:** 00_OVERVIEW.md
**Título:** Visão Geral do Sistema
**Autor:** Andrey Viana
**Versão:** 1.0.0
**Última Atualização:** 8 de novembro de 2025
**Licença:** Proprietary

---

## 📋 Objetivo do Documento

Este documento apresenta uma visão executiva e técnica do **Barber Analytics Pro**, detalhando o contexto de negócio, objetivos estratégicos, arquitetura de alto nível e stakeholders envolvidos no projeto.

## 🎯 Visão do Sistema

O **Barber Analytics Pro** é um sistema SaaS (Software as a Service) completo de gestão para barbearias premium, projetado para otimizar operações, aumentar receita e oferecer insights acionáveis baseados em dados.

### Missão

> Transformar barbearias tradicionais em negócios data-driven, oferecendo ferramentas profissionais de gestão financeira, operacional e estratégica.

### Valores Fundamentais

- **Excelência Técnica**: Clean Architecture, DDD e padrões enterprise
- **Experiência do Usuário**: Design intuitivo e responsivo
- **Segurança**: RLS (Row Level Security), criptografia e auditoria completa
- **Escalabilidade**: Multi-tenant architecture preparada para crescimento
- **Inovação**: Uso de tecnologias modernas (React 19, Supabase, Edge Functions)

## 🏢 Contexto de Negócio

### Problema

Barbearias enfrentam desafios críticos:

1. **Gestão Financeira Manual**: Planilhas, papel e WhatsApp geram erro, retrabalho e falta de controle
2. **Ausência de Métricas**: Proprietários não conseguem medir rentabilidade real
3. **Fluxo de Caixa Deficitário**: Falta de visão sobre entradas e saídas futuras
4. **Comissões Manuais**: Cálculos imprecisos geram conflitos e desmotivação
5. **Controle de Agendamento Precário**: Clientes frustrados com esperas e desencontros

### Solução

**Barber Analytics Pro** oferece uma plataforma integrada com:

#### Módulos Principais

| Módulo              | Descrição                                           | Valor Entregue                     |
| ------------------- | --------------------------------------------------- | ---------------------------------- |
| 📊 **Financeiro**   | Fluxo de caixa, DRE, receitas e despesas            | Visão completa da saúde financeira |
| 💰 **Pagamentos**   | Conciliação bancária, múltiplas formas de pagamento | Redução de erros em 95%            |
| 👥 **Clientes**     | CRM, histórico de atendimentos, fidelização         | Aumento de retenção em 30%         |
| 📅 **Agendamentos** | Calendário inteligente, lembretes automáticos       | Redução de no-shows em 40%         |
| 📈 **Relatórios**   | KPIs, dashboards interativos, análise preditiva     | Decisões baseadas em dados reais   |
| 🔔 **Notificações** | WhatsApp, SMS, e-mail e push notifications          | Engajamento de clientes 24/7       |

## 👥 Stakeholders

### Usuários Finais

| Perfil            | Responsabilidades             | Necessidades                             |
| ----------------- | ----------------------------- | ---------------------------------------- |
| **Admin**         | Gestão completa do sistema    | Dashboard executivo, controle total      |
| **Gerente**       | Operações diárias, relatórios | Métricas operacionais, gestão de equipe  |
| **Barbeiro**      | Atendimentos, comissões       | Fácil lançamento de serviços, ver ganhos |
| **Recepcionista** | Agendamentos, caixa           | Interface rápida, fácil check-in/out     |

### Stakeholders Técnicos

- **Desenvolvedor Frontend**: React 19, Vite, TailwindCSS
- **Desenvolvedor Backend**: Supabase, PostgreSQL, Edge Functions
- **DBA**: Schema, migrations, performance tuning
- **DevOps**: Vercel, CI/CD, monitoramento

### Stakeholders de Negócio

- **Proprietário da Barbearia**: ROI, redução de custos, insights estratégicos
- **Contador**: Exportação de dados para contabilidade, DRE automatizada
- **Investidor**: Métricas de crescimento (MRR, Churn, LTV)

## 🏗️ Arquitetura de Alto Nível

### Stack Tecnológico

```plaintext
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React 19)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Atoms    │─▶│ Molecules│─▶│ Organisms│─▶│ Pages    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                            │                                  │
│                   ┌────────▼────────┐                        │
│                   │  TanStack Query │                        │
│                   │  (State Mgmt)   │                        │
│                   └────────┬────────┘                        │
└──────────────────────────┬─┴──────────────────────────────┘
                            │ HTTPS (REST API)
┌──────────────────────────▼──────────────────────────────────┐
│                     SUPABASE (Backend)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│◀─│    RLS   │  │  Auth    │  │ Realtime │   │
│  │   (DB)   │  │(Security)│  │  (JWT)   │  │  (WS)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │                                                      │
│  ┌────▼────────────────────┐                                │
│  │  Edge Functions         │                                │
│  │  (Business Logic)       │                                │
│  └─────────────────────────┘                                │
└──────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Clean Architecture**: Separação em camadas (Presentation, Application, Domain, Infrastructure)
2. **Domain-Driven Design (DDD)**: Entidades, Value Objects, Aggregates e Domain Services
3. **Atomic Design**: Componentes reutilizáveis e escaláveis
4. **Repository Pattern**: Abstração de acesso a dados
5. **CQRS (Command Query Responsibility Segregation)**: Separação de leitura e escrita
6. **Event-Driven**: Notificações via Supabase Realtime

## 🚀 Funcionalidades-Chave

### Módulo Financeiro

- ✅ **Fluxo de Caixa Acumulado**: Visualização de saldo diário e acumulado
- ✅ **DRE (Demonstração do Resultado do Exercício)**: Automática, categorizada
- ✅ **Receitas e Despesas**: Lançamento, edição, categorização
- ✅ **Conciliação Bancária**: Importação de extratos Excel/CSV
- ✅ **Múltiplas Contas**: Gestão de várias contas bancárias
- ✅ **Ajustes de Saldo**: Correções e auditoria completa

### Módulo de Pagamentos

- ✅ **Formas de Pagamento**: Pix, cartão (débito/crédito), dinheiro, boleto
- ✅ **Taxa e Prazo de Recebimento**: Calculado automaticamente por forma de pagamento
- ✅ **Status de Receitas**: Pendente, Recebido, Cancelado
- ✅ **Taxas de Cartão**: Deduzi

ção automática de fees

### Módulo de Clientes

- ✅ **CRM Completo**: Cadastro, histórico, observações
- ✅ **Fidelização**: Pontos, cashback, assinaturas
- ✅ **Segmentação**: Tags, categorias, status
- ✅ **Assinaturas Recorrentes**: Planos mensais, trimestrais, anuais

### Módulo de Agendamentos

- ✅ **Calendário Multi-profissional**: Visualização por barbeiro
- ✅ **Gestão de Horários**: Bloqueios, folgas, feriados
- ✅ **Lembretes Automáticos**: WhatsApp, SMS, push
- ✅ **Controle de Fila**: Sistema de "Lista da Vez"

### Módulo de Relatórios

- ✅ **Dashboards Interativos**: KPIs visuais (Chart.js)
- ✅ **Ranking de Profissionais**: Comissões, atendimentos, notas
- ✅ **Evolução MRR/ARR**: Receita recorrente mensal/anual
- ✅ **Taxa de Churn**: Monitoramento de cancelamentos

## 📊 Métricas de Sucesso

### KPIs Técnicos

- **Uptime**: > 99.9%
- **Tempo de Resposta (P95)**: < 300ms
- **Performance Score (Lighthouse)**: > 90
- **Cobertura de Testes**: > 80%

### KPIs de Negócio

- **Redução de Erros Financeiros**: 95%
- **Aumento de Receita por Barbearia**: 25%
- **Redução de No-shows**: 40%
- **Tempo de Fechamento de Caixa**: -70%

## 📅 Linha do Tempo

| Fase                       | Período | Status          | Entregas                         |
| -------------------------- | ------- | --------------- | -------------------------------- |
| **Fase 1: MVP**            | Q1 2025 | ✅ Concluída    | Financeiro, Caixa, Comandas      |
| **Fase 2: Fluxo de Caixa** | Q2 2025 | ✅ Concluída    | Demonstrativo Acumulado, Filtros |
| **Fase 3: Agendamentos**   | Q3 2025 | 🔄 Em Progresso | Calendário, Lista da Vez         |
| **Fase 4: CRM Avançado**   | Q4 2025 | 📋 Planejada    | Assinaturas, Fidelização         |
| **Fase 5: BI & Analytics** | Q1 2026 | 📋 Planejada    | Análise Preditiva, AI Insights   |

## 🔒 Segurança e Compliance

### Autenticação e Autorização

- **JWT Tokens** via Supabase Auth
- **Roles-Based Access Control (RBAC)**: 4 perfis (Admin, Gerente, Barbeiro, Recepcionista)
- **Row Level Security (RLS)**: Políticas nativas do PostgreSQL
- **Auditoria**: Logs de acesso e modificações (`access_logs`)

### Proteção de Dados

- **LGPD Compliance**: Consentimento, direito ao esquecimento
- **Criptografia em Trânsito**: HTTPS obrigatório
- **Criptografia em Repouso**: Supabase Vault para dados sensíveis
- **Backup Diário**: Point-in-time recovery até 7 dias

## 🌐 Integrações Externas

| Serviço                   | Uso                      | Status       |
| ------------------------- | ------------------------ | ------------ |
| **Supabase**              | Database, Auth, Realtime | ✅ Ativo     |
| **Vercel**                | Hosting, CI/CD           | ✅ Ativo     |
| **Asaas**                 | Gateway de pagamentos    | 🔄 Em Teste  |
| **WhatsApp Business API** | Notificações             | 📋 Planejada |
| **Google Calendar**       | Sincronização de agenda  | 📋 Planejada |

## 📚 Referências Técnicas

- **Clean Architecture**: Robert C. Martin (_Clean Architecture_, 2017)
- **Domain-Driven Design**: Eric Evans (_DDD_, 2003)
- **Requirements Engineering**: Karl Wiegers (_Software Requirements_, 2013)
- **Enterprise Patterns**: Martin Fowler (_Patterns of Enterprise Application Architecture_, 2002)
- **React Performance**: Dan Abramov, React Core Team
- **Database Design**: Joe Celko (_SQL for Smarties_, 2014)

## 📞 Contato e Suporte

- **Autor**: Andrey Viana
- **GitHub**: [barber-analytics-pro](https://github.com/andrey-viana/barber-analytics-pro)
- **E-mail Técnico**: dev@barberanalytics.pro
- **E-mail Comercial**: contato@barberanalytics.pro

---

## 🔗 Navegação

- **Próximo**: [01 - Requirements](./01_REQUIREMENTS.md)
- **Índice Geral**: [SUMMARY.md](./SUMMARY.md)

---

**Fim do Documento**
