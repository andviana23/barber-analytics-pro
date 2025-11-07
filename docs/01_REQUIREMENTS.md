# 01 - Requirements: Barber Analytics Pro

---

**Documento:** 01_REQUIREMENTS.md
**Título:** Especificação de Requisitos
**Autor:** Andrey Viana
**Versão:** 1.0.0
**Última Atualização:** 8 de novembro de 2025
**Licença:** Proprietary

---

## 📋 Objetivo do Documento

Este documento detalha os requisitos funcionais, não-funcionais e de qualidade do sistema Barber Analytics Pro, seguindo as melhores práticas de **Requirements Engineering** (Karl Wiegers).

## 🎯 Requisitos Funcionais

### RF-01: Módulo Financeiro

#### RF-01.01: Fluxo de Caixa Acumulado

**Descrição**: O sistema deve exibir o fluxo de caixa diário com saldo acumulado.

**Prioridade**: Alta
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Exibir entradas, saídas e saldo do dia para cada data
- [ ] Calcular saldo acumulado considerando saldo inicial
- [ ] Permitir filtro por unidade, conta bancária e período
- [ ] Preencher automaticamente dias sem movimentação com zeros
- [ ] Exportar relatório para Excel/PDF

#### RF-01.02: DRE (Demonstração do Resultado do Exercício)

**Descrição**: O sistema deve gerar DRE automática por período.

**Prioridade**: Alta
**Complexidade**: Alta

**Critérios de Aceitação**:

- [ ] Calcular receita bruta, deduções, receita líquida
- [ ] Deduzir custos operacionais (fixos e variáveis)
- [ ] Calcular lucro operacional e margem
- [ ] Permitir comparação entre períodos
- [ ] Exportar DRE em formato contábil

#### RF-01.03: Receitas

**Descrição**: O sistema deve gerenciar receitas com múltiplas formas de pagamento.

**Prioridade**: Crítica
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Cadastrar receita com valor, data, profissional, cliente
- [ ] Vincular forma de pagamento (Pix, cartão, dinheiro)
- [ ] Calcular automaticamente taxa de cartão e prazo de recebimento
- [ ] Permitir status: Pendente, Recebido, Cancelado
- [ ] Registrar data esperada e data real de recebimento

#### RF-01.04: Despesas

**Descrição**: O sistema deve gerenciar despesas operacionais e fixas.

**Prioridade**: Alta
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Cadastrar despesa com valor, data, categoria, fornecedor
- [ ] Suportar despesas recorrentes (mensal, trimestral, anual)
- [ ] Permitir anexar comprovantes (PDF, imagem)
- [ ] Parcelar despesas em múltiplas parcelas
- [ ] Controlar status: Pendente, Pago, Cancelado

#### RF-01.05: Conciliação Bancária

**Descrição**: O sistema deve importar extratos bancários e conciliar lançamentos.

**Prioridade**: Média
**Complexidade**: Alta

**Critérios de Aceitação**:

- [ ] Importar arquivo Excel/CSV de extratos
- [ ] Detectar duplicatas via hash único
- [ ] Identificar automaticamente profissional, cliente e forma de pagamento
- [ ] Permitir revisão manual antes da importação final
- [ ] Registrar histórico de conciliações

### RF-02: Módulo de Pagamentos

#### RF-02.01: Formas de Pagamento

**Descrição**: O sistema deve suportar múltiplas formas de pagamento.

**Prioridade**: Crítica
**Complexidade**: Baixa

**Critérios de Aceitação**:

- [ ] Cadastrar formas: Pix, Débito, Crédito (1x a 12x), Dinheiro, Boleto
- [ ] Configurar taxa percentual por forma
- [ ] Configurar prazo de recebimento (D+0, D+1, D+30)
- [ ] Ativar/desativar formas de pagamento por unidade

#### RF-02.02: Gateway de Pagamento (Asaas)

**Descrição**: O sistema deve integrar com gateway para cobranças recorrentes.

**Prioridade**: Baixa
**Complexidade**: Alta

**Critérios de Aceitação**:

- [ ] Criar cobrança via API Asaas
- [ ] Receber webhook de confirmação de pagamento
- [ ] Atualizar status da receita automaticamente
- [ ] Registrar logs de todas as transações

### RF-03: Módulo de Clientes

#### RF-03.01: CRM

**Descrição**: O sistema deve gerenciar cadastro completo de clientes.

**Prioridade**: Alta
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Cadastrar cliente com nome, CPF, telefone, e-mail
- [ ] Registrar histórico de atendimentos
- [ ] Adicionar observações e tags
- [ ] Controlar status: Ativo, Inativo, Bloqueado
- [ ] Exportar base de clientes para CSV

#### RF-03.02: Fidelização

**Descrição**: O sistema deve gerenciar programas de fidelidade.

**Prioridade**: Média
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Acumular pontos por valor gasto
- [ ] Resgatar pontos em descontos ou serviços
- [ ] Exibir saldo de pontos no perfil do cliente
- [ ] Notificar cliente ao atingir pontuação para resgate

#### RF-03.03: Assinaturas

**Descrição**: O sistema deve gerenciar assinaturas recorrentes.

**Prioridade**: Média
**Complexidade**: Alta

**Critérios de Aceitação**:

- [ ] Criar planos: Mensal, Trimestral, Semestral, Anual
- [ ] Cobrar automaticamente via gateway
- [ ] Calcular MRR (Monthly Recurring Revenue)
- [ ] Calcular taxa de churn (cancelamentos)
- [ ] Enviar notificação de renovação

### RF-04: Módulo de Agendamentos

#### RF-04.01: Calendário

**Descrição**: O sistema deve oferecer calendário inteligente de agendamentos.

**Prioridade**: Alta
**Complexidade**: Alta

**Critérios de Aceitação**:

- [ ] Visualizar agenda por dia, semana, mês
- [ ] Filtrar por profissional ou unidade
- [ ] Arrastar e soltar para reagendar
- [ ] Bloquear horários indisponíveis
- [ ] Exibir tempo médio de atendimento

#### RF-04.02: Lista da Vez

**Descrição**: O sistema deve gerenciar ordem de atendimento de clientes sem hora marcada.

**Prioridade**: Alta
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Exibir lista ordenada por pontuação (sistema de rodízio)
- [ ] Permitir adicionar cliente na fila manualmente
- [ ] Atualizar pontuação automaticamente após atendimento
- [ ] Reset automático mensal (cron job)
- [ ] Registrar histórico mensal

#### RF-04.03: Lembretes

**Descrição**: O sistema deve enviar lembretes automáticos de agendamento.

**Prioridade**: Média
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Enviar lembrete 24h antes (WhatsApp/SMS/E-mail)
- [ ] Permitir confirmação de presença
- [ ] Notificar profissional sobre confirmação
- [ ] Reagendar automaticamente em caso de não-confirmação

### RF-05: Módulo de Relatórios

#### RF-05.01: Dashboards

**Descrição**: O sistema deve exibir dashboards interativos com KPIs principais.

**Prioridade**: Alta
**Complexidade**: Média

**Critérios de Aceitação**:

- [ ] Exibir receita total, despesa total, lucro líquido
- [ ] Exibir MRR, número de clientes ativos, taxa de churn
- [ ] Gráficos de evolução (linha, barra, pizza)
- [ ] Filtrar por unidade e período

#### RF-05.02: Ranking de Profissionais

**Descrição**: O sistema deve rankear profissionais por performance.

**Prioridade**: Média
**Complexidade**: Baixa

**Critérios de Aceitação**:

- [ ] Rankear por comissão gerada, atendimentos realizados, avaliação média
- [ ] Exibir top 10 do mês
- [ ] Exportar ranking para PDF

## 🚀 Requisitos Não-Funcionais

### RNF-01: Performance

- **RNF-01.01**: Tempo de carregamento da página inicial < 2s
- **RNF-01.02**: Tempo de resposta de consultas SQL < 300ms (P95)
- **RNF-01.03**: Suportar 500 usuários simultâneos por unidade

### RNF-02: Escalabilidade

- **RNF-02.01**: Arquitetura multi-tenant (1 database, múltiplas unidades)
- **RNF-02.02**: Suportar até 10.000 unidades sem degradação
- **RNF-02.03**: Auto-scaling via Vercel/Supabase

### RNF-03: Segurança

- **RNF-03.01**: Autenticação via JWT (Supabase Auth)
- **RNF-03.02**: RBAC com 4 roles (admin, gerente, barbeiro, recepcionista)
- **RNF-03.03**: RLS ativo em 100% das tabelas sensíveis
- **RNF-03.04**: Criptografia HTTPS obrigatória
- **RNF-03.05**: Auditoria de todas as operações financeiras

### RNF-04: Usabilidade

- **RNF-04.01**: Interface responsiva (desktop, tablet, mobile)
- **RNF-04.02**: Suporte a dark mode
- **RNF-04.03**: Acessibilidade WCAG 2.1 nível AA
- **RNF-04.04**: Tempo de treinamento < 2 horas para novo usuário

### RNF-05: Confiabilidade

- **RNF-05.01**: Uptime 99.9% (SLA)
- **RNF-05.02**: Backup diário automático
- **RNF-05.03**: Point-in-time recovery até 7 dias
- **RNF-05.04**: Rollback de deployment em < 5 minutos

### RNF-06: Manutenibilidade

- **RNF-06.01**: Cobertura de testes > 80%
- **RNF-06.02**: Documentação técnica completa
- **RNF-06.03**: CI/CD automatizado (Vercel + GitHub Actions)
- **RNF-06.04**: Logs estruturados (JSON) com rastreabilidade

## 📊 Requisitos de Qualidade

### RQ-01: Testes

| Tipo        | Cobertura Mínima | Ferramenta        |
| ----------- | ---------------- | ----------------- |
| Unit        | 80%              | Vitest            |
| Integration | 60%              | Vitest + Supabase |
| E2E         | 40%              | Playwright        |
| Performance | 100% críticos    | Lighthouse        |

### RQ-02: Code Quality

- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript (strict mode)
- **Code Review**: Obrigatório para PRs
- **Complexity**: Cyclomatic complexity < 10

### RQ-03: Monitoramento

- **APM**: Sentry (error tracking)
- **Logs**: Supabase Logs + Vercel Analytics
- **Uptime**: UptimeRobot (ping a cada 5min)

## 🔗 Rastreabilidade

| Requisito | Módulo Relacionado | Prioridade | Status          |
| --------- | ------------------ | ---------- | --------------- |
| RF-01     | Financeiro         | Alta       | ✅ Implementado |
| RF-02     | Pagamentos         | Crítica    | ✅ Implementado |
| RF-03     | Clientes           | Alta       | 🔄 Em Progresso |
| RF-04     | Agendamentos       | Alta       | 🔄 Em Progresso |
| RF-05     | Relatórios         | Média      | ✅ Implementado |

## 📚 Referências

- **IEEE 830-1998**: Standard for Software Requirements Specifications
- **Karl Wiegers** (_Software Requirements_, 2013)
- **Alistair Cockburn** (_Writing Effective Use Cases_, 2000)

---

## 🔗 Navegação

- **Anterior**: [00 - Overview](./00_OVERVIEW.md)
- **Próximo**: [02 - Architecture](./02_ARCHITECTURE.md)
- **Índice Geral**: [SUMMARY.md](./SUMMARY.md)

---
