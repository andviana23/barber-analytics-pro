# ESLint Plugin: Barber Design System

Plugin ESLint customizado para garantir conformidade com o Design System do **Barber Analytics Pro**.

## 🎯 Objetivo

Detectar e prevenir violações de Design System automaticamente durante o desenvolvimento, bloqueando merge de código não conforme via CI/CD.

## 📦 Instalação

O plugin é local ao projeto (não publicado no npm):

```bash
# Já está no workspace, sem necessidade de instalação
```

## ⚙️ Configuração

O plugin já está integrado no `eslint.config.js` raiz do projeto:

```javascript
import barberDesignSystem from './eslint-plugin-barber-design-system/index.js';

export default [
  {
    plugins: {
      'barber-design-system': barberDesignSystem,
    },
    rules: {
      'barber-design-system/no-hardcoded-colors': 'error',
      'barber-design-system/prefer-theme-classes': 'warn',
      'barber-design-system/no-inline-hex-colors': 'error',
    },
  },
];
```

## 🚨 Regras Disponíveis

### 1. `no-hardcoded-colors` (error)

Detecta uso de cores hardcoded do Tailwind que não suportam dark mode:

```jsx
// ❌ ERRO
<div className="bg-white text-gray-900 border-gray-300">

// ✅ CORRETO
<div className="card-theme">
  <h1 className="text-theme-primary">...</h1>
</div>
```

**Detecta:**

- `bg-white`, `bg-gray-*`, `bg-slate-*`
- `text-gray-*`, `text-black`, `text-white`
- `border-gray-*`, `border-white`
- `ring-gray-*`

**Sugestões automáticas:**

- `bg-white` → `.card-theme` ou `bg-light-surface dark:bg-dark-surface`
- `text-gray-900` → `.text-theme-primary`
- `text-gray-600` → `.text-theme-secondary`
- `border-gray-300` → `border-light-border dark:border-dark-border`

### 2. `prefer-theme-classes` (warn)

Recomenda uso de classes utilitárias em vez de repetir `dark:` classes:

```jsx
// ⚠️ WARNING
<div className="bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary">

// ✅ MELHOR
<div className="card-theme">
  <p className="text-theme-primary">...</p>
</div>
```

**Detecta:**

- `bg-light-surface dark:bg-dark-surface` → `.card-theme`
- `text-gray-900 dark:text-white` → `.text-theme-primary`
- `text-gray-600 dark:text-gray-400` → `.text-theme-secondary`

### 3. `no-inline-hex-colors` (error)

Proíbe cores hexadecimais inline via Tailwind arbitrary values:

```jsx
// ❌ ERRO
<div className="bg-[#FFFFFF] text-[#1A1F2C]">

// ✅ CORRETO
<div className="card-theme">
  <p className="text-theme-primary">...</p>
</div>
```

**Detecta:**

- `bg-[#...]`, `text-[#...]`, `border-[#...]`, etc.

**Sugestões automáticas:**

- `#FFFFFF` → `.card-theme`
- `#1A1F2C` → `.text-theme-primary`
- `#667085` → `.text-theme-secondary`
- `#1E8CFF` → `bg-primary`

## 🔧 Uso no Desenvolvimento

### Executar lint manual:

```bash
npm run lint
```

### Executar com autofix (quando aplicável):

```bash
npm run lint:fix
```

### CI/CD (GitHub Actions):

O ESLint roda automaticamente em PRs e bloqueia merge se houver violações críticas (`error`).

## 📊 Estatísticas de Violações

Para ver estatísticas completas de violações no projeto:

```bash
npm run audit:design-system
```

Gera relatórios em:

- `reports/design-system-audit.json`
- `reports/design-system-audit.md`

## 🎯 Classes Utilitárias Recomendadas

| Uso              | Classe Utilitária       | Tokens Equivalentes                                       |
| ---------------- | ----------------------- | --------------------------------------------------------- |
| Cards            | `.card-theme`           | `bg-light-surface dark:bg-dark-surface`                   |
| Texto principal  | `.text-theme-primary`   | `text-light-text-primary dark:text-dark-text-primary`     |
| Texto secundário | `.text-theme-secondary` | `text-light-text-secondary dark:text-dark-text-secondary` |
| Botão primário   | `.btn-theme-primary`    | `bg-primary hover:bg-primary-dark`                        |
| Botão secundário | `.btn-theme-secondary`  | `bg-light-surface dark:bg-dark-surface`                   |
| Input            | `.input-theme`          | `bg-light-surface dark:bg-dark-surface border-...`        |

## 🚀 Roadmap

- [ ] **Autofix:** Implementar transformações automáticas seguras
- [ ] **VS Code Extension:** Highlight em tempo real no editor
- [ ] **Testes unitários:** Garantir qualidade das regras
- [ ] **Documentação interativa:** Exemplos no Storybook

## 📝 Licença

MIT - © 2025 Andrey Viana

---

**Última atualização:** 31 de outubro de 2025
