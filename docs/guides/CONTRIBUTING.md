# 🤝 Guia de Contribuição

> **Bem-vindo!** Este guia explica como contribuir com o Barber Analytics Pro de forma efetiva e alinhada com nossos padrões.

---

## 📋 Índice

- [Como Começar](#-como-começar)
- [Workflow de Contribuição](#-workflow-de-contribuição)
- [Branch Strategy](#-branch-strategy)
- [Pull Request Process](#-pull-request-process)
- [Code Review Guidelines](#-code-review-guidelines)
- [Reporting Bugs](#-reporting-bugs)
- [Sugerindo Features](#-sugerindo-features)

---

## 🚀 Como Começar

### 1. Fork o Repositório

Clique no botão **Fork** no GitHub para criar sua cópia do projeto.

```bash
# Clone seu fork
git clone https://github.com/SEU-USUARIO/barber-analytics-pro.git
cd barber-analytics-pro

# Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL/barber-analytics-pro.git

# Verifique os remotes
git remote -v
# origin    https://github.com/SEU-USUARIO/barber-analytics-pro.git (fetch)
# origin    https://github.com/SEU-USUARIO/barber-analytics-pro.git (push)
# upstream  https://github.com/ORIGINAL/barber-analytics-pro.git (fetch)
# upstream  https://github.com/ORIGINAL/barber-analytics-pro.git (push)
```

### 2. Configure o Ambiente

```bash
# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

Consulte o [Guia de Setup](./SETUP.md) para configuração detalhada.

### 3. Mantenha Sincronizado

```bash
# Atualize sua cópia local com o upstream
git checkout main
git fetch upstream
git merge upstream/main

# Atualize seu fork no GitHub
git push origin main
```

---

## 🔄 Workflow de Contribuição

### Passo a Passo Completo

```bash
# 1. Certifique-se de estar na branch main atualizada
git checkout main
git pull upstream main

# 2. Crie uma branch para sua feature/fix
git checkout -b feature/minha-feature

# 3. Faça suas alterações
# ... código ...

# 4. Adicione e commite
git add .
git commit -m "feat: descrição da feature"

# 5. Mantenha sua branch atualizada
git fetch upstream
git rebase upstream/main

# 6. Envie para seu fork
git push origin feature/minha-feature

# 7. Abra um Pull Request no GitHub
```

### Tipos de Contribuição

| Tipo | Quando usar | Branch |
|------|-------------|--------|
| **Feature** | Nova funcionalidade | `feature/nome-da-feature` |
| **Fix** | Correção de bug | `fix/descricao-do-bug` |
| **Refactor** | Melhorias sem mudança de comportamento | `refactor/descricao` |
| **Docs** | Apenas documentação | `docs/descricao` |
| **Test** | Adição/correção de testes | `test/descricao` |
| **Chore** | Tarefas de manutenção | `chore/descricao` |

---

## 🌳 Branch Strategy

### Estrutura de Branches

```
main
├── develop (opcional)
├── feature/add-revenue-export
├── feature/improve-dre-performance
├── fix/correct-rls-policies
├── refactor/simplify-auth
└── docs/update-api-docs
```

### Branch Naming

```bash
# ✅ Bom
feature/add-csv-import
fix/correct-date-formatting
refactor/extract-revenue-logic
docs/add-api-examples
test/add-dre-service-tests

# ❌ Ruim
my-changes
update
new-feature
bugfix
improvements
```

**Formato**: `<type>/<short-description-in-kebab-case>`

### Regras de Branch

1. **Sempre** crie branches a partir de `main` atualizada
2. **Nunca** commite diretamente na `main`
3. **Mantenha** branches focadas em um objetivo
4. **Delete** branches após merge
5. **Sincronize** frequentemente com upstream

---

## 📬 Pull Request Process

### Antes de Abrir o PR

#### Checklist Técnico

```bash
# ✅ Todos os testes passam
npm run test:run

# ✅ Linting está ok
npm run lint

# ✅ Formatação está correta
npm run format:check

# ✅ Build funciona
npm run build

# ✅ Sem console.log/debuggers
grep -r "console.log" src/
grep -r "debugger" src/
```

#### Checklist de Código

- [ ] Código segue [Code Conventions](./CODE_CONVENTIONS.md)
- [ ] Nomes descritivos e claros
- [ ] Comentários em código complexo
- [ ] Sem código comentado/morto
- [ ] Sem TODOs pendentes críticos

#### Checklist de Testes

- [ ] Testes unitários para nova lógica
- [ ] Testes E2E para novos fluxos (se aplicável)
- [ ] Edge cases cobertos
- [ ] Testes passam localmente

#### Checklist de Documentação

- [ ] JSDoc atualizado
- [ ] README atualizado (se necessário)
- [ ] CHANGELOG.md atualizado
- [ ] Documentação de API atualizada (se aplicável)

### Template de Pull Request

```markdown
## 📝 Descrição

Breve descrição do que foi implementado/corrigido.

## 🎯 Motivação e Contexto

Por que essa mudança é necessária? Qual problema resolve?

Closes #123 (se aplicável)

## 🧪 Como Testar

1. Vá para a página X
2. Clique em Y
3. Verifique que Z acontece

## 📸 Screenshots (se aplicável)

Antes:
![before](url)

Depois:
![after](url)

## 📋 Tipos de Mudanças

- [ ] Bug fix (mudança que corrige um issue)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (fix ou feature que causa breaking change)
- [ ] Documentação

## ✅ Checklist

- [ ] Código segue as convenções do projeto
- [ ] Fiz self-review do meu código
- [ ] Comentei código complexo
- [ ] Atualizei documentação relevante
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes novos e existentes passam localmente
- [ ] Mudanças dependentes foram mergeadas

## 📝 Notas Adicionais

Alguma informação adicional relevante para os reviewers.
```

### Criando o Pull Request

```bash
# 1. Envie sua branch
git push origin feature/minha-feature

# 2. No GitHub, clique em "New Pull Request"
# 3. Selecione:
#    - Base: upstream/main
#    - Compare: seu-fork/feature/minha-feature

# 4. Preencha o template
# 5. Adicione labels apropriadas
# 6. Atribua reviewers (se souber quem)
# 7. Clique em "Create Pull Request"
```

### Títulos de Pull Request

```bash
# ✅ Bom - segue Conventional Commits
feat(revenues): add CSV export functionality
fix(dre): correct calculation for accrual regime
refactor(auth): simplify JWT validation logic
docs(api): add examples for revenue endpoints

# ❌ Ruim - vago
Update files
Fix bug
Changes
Improvements
```

---

## 👀 Code Review Guidelines

### Para Authors (quem abre o PR)

#### Preparação

- ✅ Self-review antes de pedir review
- ✅ Adicione contexto no PR description
- ✅ Responda perguntas com clareza
- ✅ Seja receptivo a feedback

#### Respondendo Feedback

```markdown
# ✅ Bom
> Reviewer: Por que você usou useEffect aqui?

Author: Boa pergunta! Usei useEffect porque preciso buscar dados quando o filtro muda. Alternativas como useQuery não funcionam aqui porque preciso do cleanup para evitar memory leaks.

Adicionei um comentário explicando isso no código.

# ❌ Ruim
> Reviewer: Por que você usou useEffect aqui?

Author: Porque funciona.
```

#### Fazendo Mudanças

```bash
# Após receber feedback, faça as alterações
git add .
git commit -m "refactor: apply code review feedback"
git push origin feature/minha-feature

# PR será atualizado automaticamente
```

### Para Reviewers (quem revisa o PR)

#### Foco do Review

1. **Funcionalidade**: Faz o que deveria fazer?
2. **Qualidade**: Código é limpo e manutenível?
3. **Testes**: Tem cobertura adequada?
4. **Performance**: Tem problemas de performance?
5. **Segurança**: Tem vulnerabilidades?

#### Como Fazer Review

```markdown
# ✅ Bom - construtivo e específico
Ótimo trabalho! Apenas algumas sugestões:

1. Linha 45: Considere usar `useMemo` aqui para evitar recálculo:
```javascript
const sortedItems = useMemo(() =>
  items.sort((a, b) => a.value - b.value),
  [items]
);
```

2. Linha 78: Este `useEffect` pode causar loop infinito se `data` mudar.
   Adicione `data` ao dependency array ou use `useCallback`.

3. `RevenueCard.jsx`: Considere adicionar testes para o caso de `revenue.amount` ser negativo.

# ❌ Ruim - vago e não construtivo
Esse código está ruim. Refatore.
```

#### Tipos de Comentário

Use prefixos para clareza:

- **[BLOCKING]**: Deve ser corrigido antes de merge
- **[SUGGESTION]**: Sugestão de melhoria (não obrigatório)
- **[QUESTION]**: Apenas uma dúvida
- **[NITPICK]**: Detalhe muito pequeno (pode ignorar)

```markdown
[BLOCKING] Esta query SQL está vulnerável a injection. Use prepared statements.

[SUGGESTION] Considere extrair esta lógica para um hook customizado.

[QUESTION] Por que você escolheu useReducer em vez de useState aqui?

[NITPICK] Espaçamento extra na linha 42.
```

#### Aprovando o PR

- **Approve**: Código está pronto para merge
- **Request Changes**: Mudanças obrigatórias antes de merge
- **Comment**: Apenas comentários, sem aprovar/rejeitar

---

## 🐛 Reporting Bugs

### Antes de Reportar

1. ✅ Verifique se já existe issue similar
2. ✅ Teste na versão mais recente
3. ✅ Tente reproduzir em ambiente limpo
4. ✅ Colete informações de debug

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug

Descrição clara e concisa do problema.

## 🔁 Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Scroll até '...'
4. Veja o erro

## ✅ Comportamento Esperado

O que deveria acontecer.

## ❌ Comportamento Atual

O que realmente acontece.

## 📸 Screenshots

Se aplicável, adicione screenshots.

## 🖥️ Ambiente

- OS: [e.g. Windows 11, macOS 13, Ubuntu 22.04]
- Browser: [e.g. Chrome 120, Firefox 121]
- Node version: [e.g. 20.19.0]
- App version: [e.g. 2.0.0]

## 📋 Console Logs

```javascript
// Cole erros do console aqui
```

## 🔍 Contexto Adicional

Qualquer outra informação relevante.

## 💡 Possível Solução (opcional)

Se você tem ideia de como corrigir.
```

### Severidade

Use labels para indicar severidade:

- 🔥 **Critical**: Sistema quebrado, dados corrompidos
- ⚠️ **High**: Funcionalidade importante quebrada
- 📢 **Medium**: Funcionalidade secundária com problema
- 🔹 **Low**: Problema cosmético ou edge case

---

## 💡 Sugerindo Features

### Template de Feature Request

```markdown
## 🎯 Problema

Descreva o problema que a feature resolve.
Ex: "É frustrante quando tenho que exportar receitas manualmente..."

## 💡 Solução Proposta

Descrição clara da solução que você gostaria.
Ex: "Adicionar botão 'Exportar Excel' na página de Receitas..."

## 🔄 Alternativas Consideradas

Outras soluções que você pensou.

## 📝 Contexto Adicional

Screenshots, mockups, exemplos de outras aplicações, etc.

## 📊 Impacto

- Quantos usuários isso afetaria?
- Qual a frequência de uso?
- É bloqueador para algum workflow?
```

### Priorizando Features

Features são priorizadas por:

1. **Impacto**: Quantos usuários beneficia?
2. **Esforço**: Quanto tempo para implementar?
3. **Alinhamento**: Alinha com roadmap do produto?
4. **Urgência**: É bloqueador crítico?

---

## 🎨 Contribuindo com UI/UX

### Design System

Sempre use componentes do Design System existente:

```javascript
// ✅ Bom - reutiliza componentes
import { Button, Card, Input } from '../atoms';

function MyFeature() {
  return (
    <Card>
      <Input label="Nome" />
      <Button variant="primary">Salvar</Button>
    </Card>
  );
}

// ❌ Ruim - cria componentes duplicados
function MyFeature() {
  return (
    <div className="bg-white rounded p-4">
      <input type="text" placeholder="Nome" />
      <button className="bg-blue-500">Salvar</button>
    </div>
  );
}
```

### Acessibilidade

- ✅ Use semantic HTML (`<button>`, `<nav>`, `<article>`)
- ✅ Adicione ARIA labels quando necessário
- ✅ Garanta navegação por teclado
- ✅ Teste com screen reader
- ✅ Contraste de cores adequado (WCAG AA)

### Responsividade

- ✅ Mobile-first design
- ✅ Teste em diferentes resoluções
- ✅ Use breakpoints do Tailwind (`sm`, `md`, `lg`, `xl`)

---

## 🏆 Reconhecimento

Contribuidores são reconhecidos:

- 📝 Na seção de contribuidores do README
- 💬 Menções em changelogs
- 🎖️ Badges de contribuidor no GitHub

---

## 📞 Precisa de Ajuda?

- 💬 **GitHub Discussions**: Para dúvidas gerais
- 🐛 **GitHub Issues**: Para bugs e features
- 📧 **Email**: suporte@barberanalytics.com
- 📚 **Documentação**: [docs/README.md](../README.md)

---

## 📜 Código de Conduta

### Nosso Compromisso

Nós, como membros, contribuidores e líderes, nos comprometemos a fazer da participação em nossa comunidade uma experiência livre de assédio para todos.

### Padrões

Exemplos de comportamento que contribuem para um ambiente positivo:

- ✅ Demonstrar empatia e bondade
- ✅ Ser respeitoso com opiniões divergentes
- ✅ Dar e receber feedback construtivo
- ✅ Assumir responsabilidade por erros

Exemplos de comportamento inaceitável:

- ❌ Linguagem ou imagens sexualizadas
- ❌ Comentários insultuosos ou depreciativos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas de outros

### Aplicação

Instâncias de comportamento abusivo podem ser reportadas para:
**suporte@barberanalytics.com**

Todas as reclamações serão revisadas e investigadas.

---

## 📚 Recursos Adicionais

- [Setup Guide](./SETUP.md) - Configuração do ambiente
- [Development Guide](./DEVELOPMENT.md) - Workflow de desenvolvimento
- [Code Conventions](./CODE_CONVENTIONS.md) - Padrões de código
- [Testing Guide](../TESTING.md) - Como escrever testes
- [Architecture](../ARQUITETURA.md) - Arquitetura do sistema

---

**Obrigado por contribuir! 🎉**

Sua contribuição faz o Barber Analytics Pro melhor para todos.

---

**Última atualização**: 2025-10-27
**Versão do guia**: 1.0.0
