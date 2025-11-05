# ================================================================

# CONFIGURAÇÃO PNPM PARA BARBER ANALYTICS PRO

# ================================================================

## ✅ AMBIENTE CONFIGURADO COM SUCESSO

### 🏗️ Stack de Tecnologia

- **Node.js**: >= 20.19.0
- **Package Manager**: pnpm >= 8.0.0 (substituindo npm)
- **Frontend**: React 19 + Vite 7 + TailwindCSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Linting**: ESLint 9 + Design System custom rules
- **Formatação**: Prettier + Tailwind CSS plugin
- **Testing**: Vitest + Playwright + Testing Library
- **Quality**: SonarLint + Error Lens
- **Git Hooks**: Husky + lint-staged

### 📦 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev                    # Inicia servidor dev (localhost:5173)
pnpm build                  # Build para produção
pnpm preview                # Preview do build

# Linting e Formatação
pnpm lint                   # Executa ESLint
pnpm lint:fix               # Corrige automaticamente
pnpm format                 # Formata código com Prettier
pnpm format:check           # Verifica formatação

# Testes
pnpm test                   # Testes unitários (Vitest)
pnpm test:ui                # Interface visual dos testes
pnpm test:coverage          # Cobertura de testes
pnpm test:e2e               # Testes end-to-end (Playwright)
pnpm test:a11y              # Testes de acessibilidade
pnpm test:all               # Executa todos os testes

# Design System
pnpm audit:design-system    # Audita uso do Design System
pnpm migrate:design-system  # Migra para classes utilitárias
```

### 🔧 Configurações VS Code

#### Extensões Instaladas e Recomendadas

✅ **ESSENCIAIS**

- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Material Icon Theme (pkief.material-icon-theme)

✅ **PRODUTIVIDADE**

- Error Lens (usernamehw.errorlens)
- Import Cost (wix.vscode-import-cost)
- TODO Highlight (wayou.vscode-todo-highlight)
- Code Spell Checker (streetsidesoftware.code-spell-checker)
- GitLens (eamodio.gitlens)

✅ **QUALIDADE**

- SonarLint (sonarsource.sonarlint-vscode)
- GitHub Copilot (github.copilot)

✅ **DATABASE**

- PostgreSQL (ms-ossdata.vscode-pgsql)
- REST Client (humao.rest-client)

### ⚙️ Settings Configurados

#### Auto-formatação

- Formata ao salvar
- Organiza imports automaticamente
- Remove imports não utilizados
- Corrige ESLint automaticamente

#### Tailwind CSS

- IntelliSense ativo
- Suporte a classes dinâmicas (clsx)
- Validação ativa
- Ordenação automática de classes

#### Design System

- Detecta classes hardcoded (error)
- Sugere classes utilitárias (warning)
- Integrado ao CI/CD pipeline

### 🛡️ Regras de Qualidade

#### ESLint Rules (CRÍTICAS)

```javascript
'barber-design-system/no-hardcoded-colors': 'error'    // Bloqueia merge
'barber-design-system/prefer-theme-classes': 'warn'    // Sugere melhorias
'barber-design-system/no-inline-hex-colors': 'error'   // Bloqueia hex
```

#### Pre-commit Hooks

- Executa lint-staged nos arquivos modificados
- Formata automaticamente
- Executa testes unitários
- Bloqueia commit se houver erros críticos

### 📁 Estrutura de Pastas (Clean Architecture)

```
src/
├── atoms/         # Componentes básicos (Button, Input)
├── molecules/     # Composições (KPICard, Modal)
├── organisms/     # Estruturas complexas (Navbar, Dashboard)
├── templates/     # Layouts de página
├── pages/         # Páginas com lógica de negócio
├── services/      # Lógica de negócios
├── repositories/  # Acesso a dados (CRUD)
├── hooks/         # Custom hooks reativos
├── dtos/          # Data Transfer Objects
└── utils/         # Funções auxiliares
```

### 🎨 Design System - Classes Utilitárias

```jsx
// ❌ EVITAR - Classes hardcoded
<div className="bg-white text-gray-900 border-gray-200">

// ✅ USAR - Classes utilitárias
<div className="card-theme">
  <h1 className="text-theme-primary">Título</h1>
  <p className="text-theme-secondary">Texto</p>
  <button className="btn-theme-primary">Ação</button>
</div>
```

### 🚀 Como Usar

#### 1. **Instalar dependências**

```bash
pnpm install
```

#### 2. **Iniciar desenvolvimento**

```bash
pnpm dev
```

#### 3. **Verificar qualidade**

```bash
pnpm lint
pnpm format:check
```

#### 4. **Executar testes**

```bash
pnpm test:all
```

#### 5. **Build para produção**

```bash
pnpm build
pnpm preview
```

### 🔄 Migração de npm para pnpm

#### O que foi alterado:

1. **package.json**: Engines atualizado para pnpm >= 8.0.0
2. **Scripts**: Todos os comandos `npm` substituídos por `pnpm`
3. **Husky**: Pre-commit hooks atualizados
4. **lint-staged**: Comandos ajustados para pnpm
5. **.npmrc**: Configuração otimizada para pnpm

#### Benefícios do pnpm:

- ⚡ **Mais rápido**: Cache global e links simbólicos
- 💾 **Menor espaço**: Deduplicação eficiente
- 🔒 **Mais seguro**: Strict peer dependencies
- 📦 **Workspace nativo**: Suporte a monorepo

### 🏃‍♂️ Quick Start

```bash
# Clone e setup
git clone <repo>
cd barber-analytics-pro

# Instalar pnpm (se não tiver)
npm install -g pnpm

# Instalar dependências
pnpm install

# Iniciar desenvolvimento
pnpm dev

# Abrir no navegador
open http://localhost:5173
```

### 📋 Checklist de Verificação

- [x] ✅ pnpm install funcionando
- [x] ✅ pnpm dev iniciando corretamente
- [x] ✅ pnpm build gerando dist/
- [x] ✅ ESLint detectando problemas
- [x] ✅ Prettier formatando código
- [x] ✅ Tailwind CSS funcionando
- [x] ✅ Design System rules ativas
- [x] ✅ VS Code settings configurado
- [x] ✅ Extensions recomendadas listadas
- [x] ✅ Husky pre-commit funcionando
- [x] ✅ Git hooks configurados

### 🐛 Soluções para Problemas Comuns

#### 1. **PostCSS Warning**

```
A PostCSS plugin did not pass the `from` option
```

**Solução**: Warning benigno, não afeta funcionamento.

#### 2. **Build Warning: Chunks grandes**

```
Some chunks are larger than 500 kB
```

**Solução**: Implementar code-splitting com dynamic imports.

#### 3. **ESLint: Design System Errors**

```
Evite usar "bg-white" - não suporta dark mode
```

**Solução**: Use classes utilitárias: `.card-theme`, `.text-theme-*`

### 📊 Status do Projeto

🟢 **AMBIENTE PRONTO PARA DESENVOLVIMENTO**

- Node.js: 20.19.0+ ✅
- pnpm: 10.20.0 ✅
- VS Code: Configurado ✅
- Build: Funcionando ✅
- Dev Server: http://localhost:5173 ✅
- Linting: Ativo ✅
- Design System: Enforçado ✅

---

**Última atualização**: 4 de novembro de 2025
**Por**: Andrey Viana
**Projeto**: Barber Analytics Pro
