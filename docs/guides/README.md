# 📚 Guias de Desenvolvimento

> **Central de documentação técnica do Barber Analytics Pro**

Esta pasta contém guias completos e práticos para desenvolvedores trabalhando no projeto.

---

## 📖 Guias Disponíveis

### 🚀 Começando

#### [⚙️ SETUP.md](./SETUP.md)
**Configuração completa do ambiente de desenvolvimento**

- ✅ Pré-requisitos detalhados (Node, npm, Supabase CLI)
- ✅ Instalação passo a passo
- ✅ Configuração do Supabase (projeto, migrações, RLS)
- ✅ Variáveis de ambiente explicadas
- ✅ Troubleshooting de setup
- ✅ Verificação da instalação

**Quando usar**: Primeira vez configurando o projeto localmente.

**Tempo estimado**: 30-45 minutos

---

#### [💻 DEVELOPMENT.md](./DEVELOPMENT.md)
**Workflow diário de desenvolvimento**

- 🔄 Workflow diário
- 📁 Estrutura de pastas e organização
- 🎨 Como criar novos componentes (Atomic Design)
- 💼 Como criar serviços e repositories
- 🪝 Como usar hooks customizados
- 🔍 Debug e ferramentas de desenvolvedor
- ⚡ Hot reload e otimizações

**Quando usar**: Desenvolvendo novas features ou corrigindo bugs.

**Tempo estimado**: Consulta rápida (~5 min) ou leitura completa (1 hora)

---

### 📏 Padrões e Qualidade

#### [📝 CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md)
**Padrões de código do projeto**

- 🎯 Princípios fundamentais (SOLID, DRY, KISS)
- 📛 Naming conventions (arquivos, variáveis, funções, componentes)
- ⚛️ Estrutura de componentes React
- 🎨 Clean Code principles aplicados
- ⚙️ ESLint e Prettier configs
- 💬 Comentários e documentação inline
- 🌳 Conventional Commits examples
- ✅ Code review checklist

**Quando usar**: Antes de escrever código, durante code review.

**Tempo estimado**: 30 minutos (leitura completa)

---

#### [🤝 CONTRIBUTING.md](./CONTRIBUTING.md)
**Guia completo para contribuir com o projeto**

- 🚀 Como fazer fork e setup
- 🌳 Branch naming strategy
- 📬 Pull Request process
- 👀 Code review guidelines
- ✅ O que incluir no PR
- 📋 Checklist antes de submeter
- 🐛 Como reportar bugs
- 💡 Como sugerir features

**Quando usar**: Antes de abrir um Pull Request ou reportar issue.

**Tempo estimado**: 20 minutos

---

### 🔧 Solução de Problemas

#### [🛠️ TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
**Soluções para problemas comuns**

- 📦 Problemas de instalação
- 🏗️ Erros de build
- 🗄️ Problemas com Supabase
- 🔐 Erros de autenticação
- ⚡ Performance issues
- 🐛 Erros de desenvolvimento
- 🚀 Problemas de deploy
- 🆘 Como obter ajuda

**Quando usar**: Encontrou um erro ou problema.

**Tempo estimado**: Busca rápida (~2 min por problema)

---

#### [❓ FAQ.md](./FAQ.md)
**Perguntas frequentes**

- 🏗️ Arquitetura e tecnologia
- 🗄️ Supabase e banco de dados
- 💻 Desenvolvimento
- 🧪 Testes
- 🚀 Deploy e produção
- 🔐 Segurança
- ⚡ Performance
- 🎨 Componentes e UI

**Quando usar**: Dúvidas sobre decisões de arquitetura ou "como fazer X".

**Tempo estimado**: Busca rápida (~1-2 min por pergunta)

---

## 🗺️ Mapa de Uso por Situação

### "Estou começando no projeto"
1. 📖 [SETUP.md](./SETUP.md) - Configure o ambiente
2. 📖 [DEVELOPMENT.md](./DEVELOPMENT.md) - Entenda a estrutura
3. 📖 [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md) - Aprenda os padrões
4. 📖 [FAQ.md](./FAQ.md) - Tire dúvidas comuns

---

### "Vou desenvolver uma feature"
1. 📖 [DEVELOPMENT.md](./DEVELOPMENT.md) - Workflow e estrutura
2. 📖 [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md) - Padrões a seguir
3. 📖 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Se encontrar problemas

---

### "Vou abrir um Pull Request"
1. 📖 [CONTRIBUTING.md](./CONTRIBUTING.md) - Processo completo
2. 📖 [CODE_CONVENTIONS.md](./CODE_CONVENTIONS.md) - Revisar padrões
3. ✅ Checklist do PR

---

### "Encontrei um bug"
1. 📖 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Soluções conhecidas
2. 📖 [FAQ.md](./FAQ.md) - Perguntas comuns
3. 📖 [CONTRIBUTING.md](./CONTRIBUTING.md#-reporting-bugs) - Como reportar

---

### "Tenho uma dúvida"
1. 📖 [FAQ.md](./FAQ.md) - Perguntas frequentes
2. 📖 Guia específico relevante
3. 📖 [CONTRIBUTING.md](./CONTRIBUTING.md#-como-obter-ajuda) - Onde pedir ajuda

---

## 📊 Estatísticas dos Guias

| Guia | Linhas | Tamanho | Tópicos | Nível |
|------|--------|---------|---------|-------|
| SETUP.md | 563 | 12KB | 7 | 🟢 Iniciante |
| DEVELOPMENT.md | 894 | 21KB | 8 | 🟡 Intermediário |
| CODE_CONVENTIONS.md | 790 | 17KB | 8 | 🟡 Intermediário |
| CONTRIBUTING.md | 607 | 14KB | 7 | 🟢 Iniciante |
| TROUBLESHOOTING.md | 974 | 18KB | 8 | 🟠 Avançado |
| FAQ.md | 919 | 19KB | 9 | 🟢 Todos |
| **Total** | **4,747** | **101KB** | **47** | - |

---

## 🎯 Convenções destes Guias

### Estrutura Padrão

Todos os guias seguem uma estrutura consistente:

```markdown
# 📝 Título do Guia

> **Objetivo**: Descrição clara do propósito

## 📋 Índice
[Links para seções principais]

## 🎯 Seções Principais
[Conteúdo organizado]

---

**Última atualização**: YYYY-MM-DD
**Versão do guia**: X.Y.Z
```

### Elementos Visuais

| Elemento | Significado |
|----------|-------------|
| ✅ | Bom exemplo / Recomendado |
| ❌ | Mau exemplo / Evitar |
| 💡 | Dica importante |
| ⚠️ | Atenção / Cuidado |
| 📝 | Nota informativa |
| 🔍 | Diagnóstico / Debug |

### Blocos de Código

```javascript
// ✅ Bom - com contexto e explicação
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Ruim - sem contexto
const t = i.reduce((s, x) => s + x.p, 0);
```

---

## 📚 Documentação Adicional

Estes guias complementam outras documentações do projeto:

### Documentação Principal
- 📖 [README.md](../../README.md) - Overview do projeto
- 🏛️ [ARQUITETURA.md](../ARQUITETURA.md) - Arquitetura do sistema
- 🗄️ [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) - Schema do banco
- 🎨 [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) - Componentes UI

### Módulos de Negócio
- 💰 [FINANCIAL_MODULE.md](../FINANCIAL_MODULE.md) - Módulo financeiro
- 📊 [DRE_MODULE.md](../DRE_MODULE.md) - DRE
- 💈 [LISTA_DA_VEZ_MODULE.md](../LISTA_DA_VEZ_MODULE.md) - Lista da Vez
- 💵 [CASH_REGISTER_MODULE.md](../CASH_REGISTER_MODULE.md) - Caixa

### Guias Técnicos
- 🧪 [TESTING.md](../TESTING.md) - Guia de testes
- 🚀 [DEPLOY.md](../DEPLOY.md) - Deploy e CI/CD
- 🔒 [Segurança](../SECURITY.md) - Práticas de segurança

---

## 🔄 Atualizações

Esta documentação é mantida ativamente. Contribua:

1. **Encontrou erro?** Abra uma issue
2. **Quer adicionar conteúdo?** Abra um PR
3. **Tem sugestão?** Use GitHub Discussions

### Histórico de Versões

- **v1.0.0** (2025-10-27) - Criação inicial de todos os guias
  - SETUP.md - Guia de configuração completo
  - DEVELOPMENT.md - Workflow de desenvolvimento
  - CODE_CONVENTIONS.md - Padrões de código
  - CONTRIBUTING.md - Guia de contribuição
  - TROUBLESHOOTING.md - Solução de problemas
  - FAQ.md - Perguntas frequentes

---

## 💬 Feedback

Estes guias são úteis? Tem sugestões de melhoria?

- 📧 **Email**: suporte@barberanalytics.com
- 💬 **GitHub Discussions**: [Link]
- 🐛 **Issues**: Para reportar erros na documentação

---

## ⭐ Contribuidores

Agradecimentos especiais a todos que contribuíram para esta documentação.

---

**Última atualização**: 2025-10-27
**Versão**: 1.0.0
