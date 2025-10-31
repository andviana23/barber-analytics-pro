## 📋 Descrição

<!-- Descreva brevemente as mudanças deste PR -->

## 🎯 Tipo de Mudança

- [ ] 🐛 Bug fix (correção de problema que não quebra funcionalidade existente)
- [ ] ✨ Nova feature (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou feature que quebra funcionalidade existente)
- [ ] 📝 Documentação
- [ ] 🎨 Refatoração (mudança que não afeta funcionalidade)
- [ ] ⚡ Performance
- [ ] ✅ Testes
- [ ] 🔧 Chore (manutenção, configs, etc.)

## 🎨 Design System Compliance

### Checklist de Conformidade

- [ ] **Executei a auditoria local:** `npm run audit:design-system`
- [ ] **Verifiquei o ESLint:** `npm run lint`
- [ ] **Sem violações críticas** de Design System (ou justificadas abaixo)
- [ ] **Usei classes utilitárias** (`.card-theme`, `.text-theme-*`, `.btn-theme-*`)
- [ ] **Evitei cores hardcoded** (`bg-white`, `text-gray-*`, `border-gray-*`)
- [ ] **Evitei hex inline** (`bg-[#...]`, `text-[#...]`)
- [ ] **Dark mode funcional** (testado visualmente)

### Violações Justificadas (se houver)

<!--
Se houver violações inevitáveis, justifique aqui:
- Arquivo: src/path/to/file.jsx
- Linha: 123
- Motivo: Necessário para integração com biblioteca X
-->

## ✅ Testes

### Executados

- [ ] **Testes unitários:** `npm test`
- [ ] **Testes E2E:** `npm run test:e2e`
- [ ] **Testes de acessibilidade:** `npm run test:a11y`

### Cobertura

- [ ] Testes adicionados/atualizados para cobrir mudanças
- [ ] Cobertura mantida ou aumentada

## 📸 Screenshots (se aplicável)

### Light Mode

<!-- Cole screenshot do modo claro -->

### Dark Mode

<!-- Cole screenshot do modo escuro -->

## 🔗 Issues Relacionadas

<!-- Link para issues que este PR resolve -->

Closes #
Fixes #
Relates to #

## 📝 Notas Adicionais

<!-- Informações extras para revisores -->

---

## ✅ Checklist do Revisor

<!-- Para ser preenchido pelo revisor -->

- [ ] Código segue padrões do projeto
- [ ] Documentação atualizada (se necessário)
- [ ] Sem regressões visuais
- [ ] Dark mode funcional
- [ ] Performance não degradada
- [ ] Conformidade com Design System verificada

---

**🤖 Automated Checks:**

- ESLint: `barber-design-system/*` rules
- Design System Audit: threshold ≥ 65%
- Pre-commit hook: lint-staged
