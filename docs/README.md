# 📚 Barber Analytics Pro — Documentação Técnica

> **Hub central com políticas arquiteturais, guias de módulos, contratos de dados, testes e deploy do Barber Analytics Pro.**
>
> **Versão:** 2.0
> **Última Atualização:** 27/10/2025
> **Projeto:** BARBER-ANALYTICS-PRO

---

## 🎯 Sobre este Documento

Este é o índice mestre da documentação técnica do **Barber Analytics Pro**, uma plataforma completa de gestão financeira e operacional para redes de barbearias. A documentação está organizada para facilitar o entendimento do sistema, desenvolvimento de novas funcionalidades e manutenção.

---

## 🚀 Início Rápido

### Para Novos Desenvolvedores
1. Leia o [README.md](../README.md) principal do projeto
2. Configure o ambiente seguindo [SETUP.md](guides/SETUP.md)
3. Entenda a arquitetura em [ARQUITETURA.md](ARQUITETURA.md)
4. Consulte o [Design System](DESIGN_SYSTEM.md)

### Para Desenvolvimento
1. Consulte os [Guias de Desenvolvimento](guides/DEVELOPMENT.md)
2. Siga as [Convenções de Código](guides/CODE_CONVENTIONS.md)
3. Implemente testes conforme [TESTING.md](TESTING.md)
4. Submeta código seguindo [CONTRIBUTING.md](guides/CONTRIBUTING.md)

### Para Deploy
1. Revise [DEPLOY.md](DEPLOY.md)
2. Configure CI/CD conforme [CI_CD.md](guides/CI_CD.md)
3. Consulte [Troubleshooting](guides/TROUBLESHOOTING.md) se necessário

---

## 📂 Estrutura da Documentação

### 🏛️ Fundamentos

| Documento | Descrição |
|-----------|-----------|
| [ARQUITETURA.md](ARQUITETURA.md) | Visão geral da arquitetura (Clean Architecture + DDD) |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Documentação técnica da arquitetura (inglês) |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Esquema completo do banco de dados |
| [CONTRATOS.md](CONTRATOS.md) | Contratos de dados, DTOs e interfaces |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Sistema de design (Atomic Design) |

### 💼 Módulos de Negócio

| Módulo | Descrição |
|--------|-----------|
| [FINANCIAL_MODULE.md](FINANCIAL_MODULE.md) | Módulo financeiro completo |
| [DRE_MODULE.md](DRE_MODULE.md) | Demonstração de Resultado do Exercício |
| [LISTA_DA_VEZ_MODULE.md](LISTA_DA_VEZ_MODULE.md) | Sistema de fila de atendimento |
| [CASH_REGISTER_MODULE.md](CASH_REGISTER_MODULE.md) | Módulo de caixa |
| [COMMISSION_REPORT_IMPLEMENTATION.md](COMMISSION_REPORT_IMPLEMENTATION.md) | Relatório de comissões |
| [IMPORT_REVENUES_FROM_STATEMENT.md](IMPORT_REVENUES_FROM_STATEMENT.md) | Importação de extratos |
| [RESET_MENSAL_CONTADORES.md](RESET_MENSAL_CONTADORES.md) | Reset mensal automático |

### 🛠️ Guias Técnicos

| Guia | Descrição |
|------|-----------|
| [guides/SETUP.md](guides/SETUP.md) | Configuração do ambiente de desenvolvimento |
| [guides/DEVELOPMENT.md](guides/DEVELOPMENT.md) | Guia completo de desenvolvimento |
| [guides/CODE_CONVENTIONS.md](guides/CODE_CONVENTIONS.md) | Padrões e convenções de código |
| [guides/CONTRIBUTING.md](guides/CONTRIBUTING.md) | Como contribuir com o projeto |
| [guides/API_DOCUMENTATION.md](guides/API_DOCUMENTATION.md) | Documentação de APIs e serviços |
| [guides/COMPONENTS.md](guides/COMPONENTS.md) | Guia de componentes React |
| [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) | Solução de problemas comuns |
| [guides/FAQ.md](guides/FAQ.md) | Perguntas frequentes |

### 🧪 Qualidade e Testes

| Documento | Descrição |
|-----------|-----------|
| [TESTING.md](TESTING.md) | Estratégia e guia de testes |
| [DTO_TESTS_IMPLEMENTATION_REPORT.md](DTO_TESTS_IMPLEMENTATION_REPORT.md) | Testes de DTOs |
| [SERVICE_TESTS_IMPLEMENTATION_REPORT.md](SERVICE_TESTS_IMPLEMENTATION_REPORT.md) | Testes de serviços |

### 🚀 Deploy e Operações

| Documento | Descrição |
|-----------|-----------|
| [DEPLOY.md](DEPLOY.md) | Guia completo de deploy |
| [guides/CI_CD.md](guides/CI_CD.md) | Integração e entrega contínua |
| [guides/MONITORING.md](guides/MONITORING.md) | Monitoramento e logs |
| [guides/SECURITY.md](guides/SECURITY.md) | Políticas de segurança e RLS |

### 📊 Relatórios e Implementações

| Documento | Descrição |
|-----------|-----------|
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |
| [DASHBOARD_REFACTOR.md](DASHBOARD_REFACTOR.md) | Refatoração do dashboard |
| [RECONCILIATION_IMPLEMENTATION_REPORT.md](../RECONCILIATION_IMPLEMENTATION_REPORT.md) | Conciliação bancária |
| [FRONTEND_INTEGRATION_FINAL_REPORT.md](../FRONTEND_INTEGRATION_FINAL_REPORT.md) | Integração frontend |
| [FASE_7_ROUTES_NAVIGATION_REPORT.md](FASE_7_ROUTES_NAVIGATION_REPORT.md) | Rotas e navegação |

---

## 🧱 Convenções Globais

### Padrões de Documentação
- Estrutura hierárquica H1 → H2 → H3 com ícones
- Links relativos entre documentos
- Exemplos de código em todos os guias técnicos
- Diagramas quando aplicável (Mermaid)

### Padrões de Código
- **Clean Architecture**: separação rigorosa de camadas
- **DDD**: Domain-Driven Design nos módulos principais
- **Atomic Design**: componentes organizados (atoms → molecules → organisms → templates → pages)
- **Clean Code**: funções pequenas, nomes descritivos, SRP

### Segurança
- RLS (Row-Level Security) em todas as tabelas sensíveis
- Autenticação via Supabase Auth
- Variáveis de ambiente para credenciais
- Auditoria de ações críticas

---

## 🗺️ Fluxo de Navegação Recomendado

### Para Entender o Sistema
```
1. README.md (visão geral)
   ↓
2. ARQUITETURA.md (estrutura técnica)
   ↓
3. DATABASE_SCHEMA.md (modelo de dados)
   ↓
4. Módulos específicos (conforme necessidade)
```

### Para Desenvolver
```
1. guides/SETUP.md (configurar ambiente)
   ↓
2. guides/DEVELOPMENT.md (workflow)
   ↓
3. guides/CODE_CONVENTIONS.md (padrões)
   ↓
4. guides/COMPONENTS.md (componentes)
   ↓
5. TESTING.md (testes)
```

### Para Deploy
```
1. TESTING.md (validar testes)
   ↓
2. guides/CI_CD.md (pipeline)
   ↓
3. DEPLOY.md (publicar)
   ↓
4. guides/MONITORING.md (monitorar)
```

---

## 📌 Referências Rápidas

### Estrutura do Projeto
```
barber-analytics-pro/
├── src/
│   ├── atoms/            # Componentes atômicos
│   ├── molecules/        # Componentes compostos
│   ├── organisms/        # Estruturas complexas
│   ├── templates/        # Layouts e modais
│   ├── pages/            # Páginas completas
│   ├── hooks/            # Hooks customizados
│   ├── services/         # Lógica de negócio
│   ├── repositories/     # Acesso ao banco
│   ├── dtos/             # Contratos de dados
│   └── utils/            # Utilitários
├── docs/                 # Esta documentação
├── supabase/            # Migrações e Edge Functions
└── tests/               # Testes E2E e unitários
```

### Links Importantes
- 🔗 [Repositório Principal](../)
- 🗄️ [Migrações SQL](../supabase/migrations/)
- 🛰️ [Edge Functions](../supabase/functions/)
- 🧪 [Testes](../tests/)
- 📦 [Package.json](../package.json)

### Ferramentas e Tecnologias
- **Frontend**: React 19, Vite 7, Tailwind CSS 3
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Testes**: Vitest, Testing Library, Playwright
- **Deploy**: Vercel
- **Qualidade**: ESLint, Prettier

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns
Consulte o [Troubleshooting Guide](guides/TROUBLESHOOTING.md)

### Perguntas Frequentes
Veja o [FAQ](guides/FAQ.md)

### Contribuindo
Leia o [Contributing Guide](guides/CONTRIBUTING.md)

### Suporte
- 💬 Issues: use o board do GitHub
- 📧 Contato: suporte interno da Barber Analytics

---

## 📝 Manutenção da Documentação

Esta documentação deve ser atualizada sempre que:
- Novos módulos forem implementados
- Arquitetura sofrer mudanças significativas
- Novas APIs ou serviços forem criados
- Processos de deploy mudarem
- Novas convenções forem adotadas

**Responsabilidade**: Todo desenvolvedor que implementar mudanças significativas deve atualizar a documentação correspondente.

---

**Última revisão completa**: 27/10/2025
**Próxima revisão planejada**: 27/01/2026
