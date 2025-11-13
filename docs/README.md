# 📚 Documentação - Barber Analytics Pro

**Versão:** 2.0.0 (Migrado para VPS)
**Última Atualização:** 12 de novembro de 2025
**Hospedagem:** app.tratodebarbados.com

---

## 🎯 Início Rápido

### Para Desenvolvedores

1. **Primeiro contato:** [00_OVERVIEW.md](./00_OVERVIEW.md)
2. **Arquitetura:** [02_ARCHITECTURE.md](./02_ARCHITECTURE.md)
3. **Deploy VPS:** [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)
4. **Cron Jobs:** [CRON_JOBS_MANUAL.md](./CRON_JOBS_MANUAL.md)

### Guias Rápidos

- 📖 [QUICK_REFERENCE_GUIDE.md](./QUICK_REFERENCE_GUIDE.md) - Referência rápida
- 🎨 [ARQUITETURA_VISUAL.md](./ARQUITETURA_VISUAL.md) - Diagramas visuais
- 📁 [ESTRUTURA_COMPLETA_REPOSITORIO.md](./ESTRUTURA_COMPLETA_REPOSITORIO.md) - Estrutura detalhada

---

## 📂 Estrutura da Documentação

### Documentação Principal (00-12)

| Arquivo | Descrição |
|---------|-----------|
| [00_OVERVIEW.md](./00_OVERVIEW.md) | Visão geral do sistema |
| [01_REQUIREMENTS.md](./01_REQUIREMENTS.md) | Requisitos funcionais e não-funcionais |
| [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) | Arquitetura de software |
| [03_DOMAIN_MODEL.md](./03_DOMAIN_MODEL.md) | Modelo de domínio (DDD) |
| [05_INFRASTRUCTURE.md](./05_INFRASTRUCTURE.md) | Infraestrutura técnica (Supabase + VPS) |
| [06_API_REFERENCE.md](./06_API_REFERENCE.md) | Referência de APIs e serviços |
| [07_DATA_MODEL.md](./07_DATA_MODEL.md) | Modelo de dados (banco) |
| [08_TESTING_STRATEGY.md](./08_TESTING_STRATEGY.md) | Estratégia de testes |
| [09_DEPLOYMENT_GUIDE.md](./09_DEPLOYMENT_GUIDE.md) | **Guia de deploy no VPS** |
| [10_PROJECT_MANAGEMENT.md](./10_PROJECT_MANAGEMENT.md) | Gestão de projeto |
| [11_CONTRIBUTING.md](./11_CONTRIBUTING.md) | Guia de contribuição |
| [12_CHANGELOG.md](./12_CHANGELOG.md) | Histórico de versões |

### Módulos do Sistema

Documentação detalhada de cada módulo em [04_MODULES/](./04_MODULES/):

- [01_FINANCIAL.md](./04_MODULES/01_FINANCIAL.md) - Módulo financeiro
- [02_PAYMENTS.md](./04_MODULES/02_PAYMENTS.md) - Módulo de pagamentos
- [03_CLIENTS.md](./04_MODULES/03_CLIENTS.md) - Módulo de clientes
- [04_SCHEDULER.md](./04_MODULES/04_SCHEDULER.md) - Módulo de agendamentos
- [05_REPORTS.md](./04_MODULES/05_REPORTS.md) - Módulo de relatórios
- [06_NOTIFICATIONS.md](./04_MODULES/06_NOTIFICATIONS.md) - Módulo de notificações

### Guias Especializados

#### Deploy e Infraestrutura

- ⭐ **[VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md)** - Guia completo de deploy no VPS
- ⭐ **[CRON_JOBS_MANUAL.md](./CRON_JOBS_MANUAL.md)** - Manual dos 11 cron jobs ativos
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Checklist de deploy

#### Desenvolvimento

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Design system (Tailwind + Atomic Design)
- [guides/](./guides/) - Guias adicionais
  - [PERMISSOES_GERENTE_ANALISE.md](./guides/PERMISSOES_GERENTE_ANALISE.md)
  - [RELATORIO_DIARIO_AUTOMATICO.md](./guides/RELATORIO_DIARIO_AUTOMATICO.md)
  - [BACKUP_LISTA_DA_VEZ.md](./guides/BACKUP_LISTA_DA_VEZ.md)

#### Funcionalidades

- [AI_FEATURES.md](./AI_FEATURES.md) - Funcionalidades de IA
- [CHECKLIST_IA_FINANCEIRA.md](./CHECKLIST_IA_FINANCEIRA.md) - Checklist IA financeira
- [ETL_SEM_OPENAI.md](./ETL_SEM_OPENAI.md) - ETL sem dependência de IA
- [FUNCIONALIDADES_PENDENTES.md](./FUNCIONALIDADES_PENDENTES.md) - Roadmap
- [ESCOPO_FINAL.md](./ESCOPO_FINAL.md) - Escopo do projeto

#### Bugfixes e Validações

- [BUGFIX_PROFESSIONAL_DELETE.md](./BUGFIX_PROFESSIONAL_DELETE.md)
- [BUGFIX_LISTA_DA_VEZ_RECOVERY.md](./BUGFIX_LISTA_DA_VEZ_RECOVERY.md)
- [VALIDACAO_APIS_RELATORIO.md](./VALIDACAO_APIS_RELATORIO.md)
- [VALIDACAO_SEGURANCA.md](./VALIDACAO_SEGURANCA.md)
- [MAPEAMENTO_FLUXO_DADOS.md](./MAPEAMENTO_FLUXO_DADOS.md)

---

## 🚀 Migração para VPS

### O que mudou?

**Antes (v1.0):**
- Hospedado no Vercel
- Cron jobs do Vercel (limitados)
- Deploy via Vercel CLI

**Agora (v2.0):**
- ✅ **VPS Próprio:** app.tratodebarbados.com
- ✅ **Nginx:** Servidor web + proxy reverso
- ✅ **PM2:** Process manager para API Node.js
- ✅ **pg_cron:** 11 cron jobs automáticos no PostgreSQL
- ✅ **Express API:** Servidor próprio para cron jobs
- ✅ **Controle Total:** Sem limitações de plataforma

### Documentação Atualizada

Todos os seguintes arquivos foram atualizados para refletir a nova arquitetura VPS:

- ✅ [09_DEPLOYMENT_GUIDE.md](./09_DEPLOYMENT_GUIDE.md) - Migrado para VPS
- ✅ [00_OVERVIEW.md](./00_OVERVIEW.md) - Atualizado
- ✅ [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) - Guia completo VPS
- ✅ [CRON_JOBS_MANUAL.md](./CRON_JOBS_MANUAL.md) - 11 crons ativos

---

## 🛠️ Stack Tecnológico

### Frontend
- React 19 + TypeScript + Vite
- React Router + TanStack Query
- Tailwind CSS + Atomic Design

### Backend
- **VPS:** Ubuntu + Nginx + PM2
- **API:** Express.js (Node.js 20)
- **Database:** Supabase PostgreSQL
- **Cron:** pg_cron (11 jobs automáticos)
- **IA:** OpenAI GPT-4o
- **Notificações:** Telegram Bot API

### DevOps
- Git + GitHub
- PM2 (process manager)
- Nginx (reverse proxy + SSL)
- Let's Encrypt (certificados SSL)
- Supabase CLI (migrations)

---

## 📋 Comandos Úteis

### Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Rodar dev server
pnpm dev

# Build produção
pnpm build

# Testes
pnpm test
```

### Deploy no VPS

```bash
# SSH no VPS
ssh usuario@app.tratodebarbados.com

# Deploy automático
cd /var/www/barber-analytics-pro
./deploy.sh
```

### Monitoramento

```bash
# Status PM2
pm2 status

# Logs em tempo real
pm2 logs barber-api

# Logs Nginx
tail -f /var/log/nginx/barber-analytics-access.log
```

---

## 🎯 Cron Jobs Ativos

Sistema possui **11 cron jobs automáticos** via `pg_cron`:

### Diários (7)
1. ⏰ 03:00 - ETL Diário
2. ⏰ 04:00 - Validar Saldos
3. ⏰ 05:00 - Health Check
4. ⏰ 21:00 - Relatório Diário (Telegram)
5. ⏰ 22:00 - Enviar Alertas
6. ⏰ 23:30 - Backup Lista da Vez

### Semanais (1)
7. ⏰ 08:00 Segunda - Relatório Semanal

### Mensais (3)
8. ⏰ 02:00 Dia 1 - Gerar Despesas Recorrentes
9. ⏰ 02:00 Dia 1 - Cleanup Backups
10. ⏰ 09:00 Dia 1 - Fechamento Mensal
11. ⏰ 23:00 Dia 28-31 - Reset Lista da Vez

**Ver detalhes:** [CRON_JOBS_MANUAL.md](./CRON_JOBS_MANUAL.md)

---

## 🔗 Links Importantes

- **Produção:** https://app.tratodebarbados.com
- **Supabase:** https://app.supabase.com
- **Repositório:** (privado)

---

## 📞 Suporte

Para dúvidas sobre a documentação:

1. Verifique o índice em [DOCUMENTACAO_INDEX.md](./DOCUMENTACAO_INDEX.md)
2. Consulte o guia relevante acima
3. Entre em contato com o time de desenvolvimento

---

**Gerado em:** 12 de novembro de 2025
**Versão:** 2.0.0 (VPS)
**Manutenção:** Revisão trimestral
