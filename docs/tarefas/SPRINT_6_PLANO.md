# 📊 SPRINT 6 - PLANO EXECUTIVO

## Refinamento de Audit + Migração Manual TOP 5

> **Data Início:** 31/10/2025  
> **Sprint:** 6  
> **Status:** 🔄 EM ANDAMENTO  
> **Duração Estimada:** 1-2 dias

---

## 🎯 OBJETIVOS PRINCIPAIS

### Metas Numéricas

| Métrica             | Sprint 5 (Atual)      | Meta Sprint 6             | Δ Esperado        |
| ------------------- | --------------------- | ------------------------- | ----------------- |
| **Violações Reais** | ~420-450              | **<300**                  | **-120 a -150**   |
| **Conformidade**    | ~78-80%               | **≥85%**                  | **+5-7 pp**       |
| **Testes Passando** | 240/240               | **240/240**               | **Manter 100%**   |
| **Audit Precisão**  | ~45% falsos positivos | **<10% falsos positivos** | **+80% precisão** |

### Objetivos Qualitativos

1. ✅ **Refinar Script de Audit** (PRIORIDADE MÁXIMA)
   - Eliminar falsos positivos de classes com dark mode
   - Detectar apenas `bg-gray-*` isolados como violações
   - Atualizar métricas para refletir progresso real

2. ✅ **Migração Manual TOP 5 Arquivos**
   - DespesasAccrualTab.jsx (37 → 0)
   - CommissionReportPage.jsx (33 → 0)
   - EditProductModal.jsx (26 → 0)
   - CreateProductModal.jsx (26 → 0)
   - ContasBancariasTab.jsx (24 → 0)

3. ✅ **Manter Qualidade**
   - 100% testes passando
   - Zero regressões funcionais
   - Documentação atualizada

---

## 📋 TAREFAS DETALHADAS

### 🔴 FASE 1: REFINAR AUDIT SCRIPT (CRÍTICO)

**Problema Atual:**

```javascript
// Script atual detecta isto como VIOLAÇÃO:
className = 'bg-gray-200 dark:bg-gray-700';
// Mas este É VÁLIDO! Tem dark mode!

// Deveria detectar apenas isto:
className = 'bg-gray-200';
// Este SIM é violação (sem dark mode)
```

**Solução:**

#### Tarefa 1.1: Atualizar Lógica de Detecção

```javascript
// Adicionar ao audit script:
function hasValidDarkMode(className, colorClass) {
  // Se tem a classe de cor E tem dark:, é VÁLIDO
  const darkPattern = colorClass
    .replace('bg-', 'dark:bg-')
    .replace('text-', 'dark:text-')
    .replace('border-', 'dark:border-');

  return className.includes(colorClass) && className.includes(darkPattern);
}

function detectHardcodedColor(className) {
  const patterns = ['bg-gray-', 'text-gray-', 'border-gray-', 'bg-white'];

  for (const pattern of patterns) {
    if (className.includes(pattern)) {
      // Verificar se tem dark mode correspondente
      if (!hasValidDarkMode(className, extractColorClass(className, pattern))) {
        return true; // É VIOLAÇÃO
      }
    }
  }

  return false; // Tem dark mode, É VÁLIDO
}
```

#### Tarefa 1.2: Atualizar Detecção de Gradientes

```javascript
// Gradientes SEM bg-gradient-to-* ainda devem ser detectados
function detectInlineGradient(className) {
  // Detectar apenas gradientes que NÃO usam tokens
  if (className.includes('bg-gradient-to-')) {
    // Tem direção mas não tem token
    const hasToken =
      /bg-gradient-(primary|success|error|warning|info|purple|orange|cyan|emerald|light|dark)/.test(
        className
      );
    return !hasToken;
  }
  return false;
}
```

#### Tarefa 1.3: Teste do Audit Refinado

**Casos de Teste:**

| Classe                           | Esperado    | Razão            |
| -------------------------------- | ----------- | ---------------- |
| `bg-gray-200 dark:bg-gray-700`   | ✅ VÁLIDO   | Tem dark mode    |
| `bg-gray-200`                    | ❌ VIOLAÇÃO | Sem dark mode    |
| `bg-white dark:bg-dark-surface`  | ✅ VÁLIDO   | Tem dark mode    |
| `bg-white`                       | ❌ VIOLAÇÃO | Sem dark mode    |
| `bg-gradient-to-r from-blue-500` | ❌ VIOLAÇÃO | Gradiente inline |
| `bg-gradient-primary`            | ✅ VÁLIDO   | Usa token        |

---

### 🟡 FASE 2: MIGRAÇÃO MANUAL TOP 5

#### Tarefa 2.1: DespesasAccrualTab.jsx (37 violações)

**Análise:**

```bash
# Verificar violações específicas
grep -n "bg-gray-\|text-gray-\|border-gray-" src/pages/FinanceiroAdvancedPage/DespesasAccrualTab.jsx
```

**Estratégia:**

1. Substituir cores hardcoded por classes utilitárias
2. Usar `card-theme` em cards
3. Usar `text-theme-primary` e `text-theme-secondary`
4. Usar `input-theme` em campos
5. Validar dark mode visualmente

**Transformações Esperadas:** ~30-35

---

#### Tarefa 2.2: CommissionReportPage.jsx (33 violações)

**Estratégia:**

1. Atualizar tabelas responsivas
2. Usar Badge component para status
3. Padronizar cores de texto
4. Validar gráficos em dark mode

**Transformações Esperadas:** ~28-30

---

#### Tarefa 2.3: EditProductModal.jsx (26 violações)

**Estratégia:**

1. Usar `card-theme` no modal
2. Padronizar inputs com `input-theme`
3. Usar `btn-theme-primary` e `btn-theme-secondary`
4. Garantir consistência com CreateProductModal

**Transformações Esperadas:** ~20-24

---

#### Tarefa 2.4: CreateProductModal.jsx (26 violações)

**Estratégia:**

1. Mesmas transformações do EditProductModal
2. Garantir código idêntico onde possível
3. Validar formulário completo

**Transformações Esperadas:** ~20-24

---

#### Tarefa 2.5: ContasBancariasTab.jsx (24 violações)

**Análise:**

- 14 cores hardcoded
- 10 gradientes inline

**Estratégia:**

1. Substituir gradientes por tokens
2. Usar classes utilitárias
3. Validar tabela responsiva
4. Testar dark mode

**Transformações Esperadas:** ~20-22

---

### 🟢 FASE 3: VALIDAÇÃO E TESTES

#### Tarefa 3.1: Executar Audit Refinado

```bash
# Limpar cache
Remove-Item reports/design-system-audit.json -Force

# Executar audit com script refinado
npm run audit:design-system
```

**Métricas Esperadas:**

- Total Violações: **<300** (vs 756 atual com falsos positivos)
- Conformidade: **≥85%** (vs 72.21% atual)
- Arquivos Limpos: **≥312** (vs 265 atual)

---

#### Tarefa 3.2: Executar Testes Completos

```bash
# Testes unitários
npm run test:run

# Validar: 240/240 passing
```

---

#### Tarefa 3.3: Validação Visual (Manual)

**Páginas a Validar:**

1. DespesasAccrualTab - Light + Dark
2. CommissionReportPage - Light + Dark
3. EditProductModal - Abrir e validar campos
4. CreateProductModal - Criar produto teste
5. ContasBancariasTab - Validar tabela

**Checklist por Página:**

- [ ] Cores corretas em light mode
- [ ] Cores corretas em dark mode
- [ ] Inputs legíveis
- [ ] Botões com contraste adequado
- [ ] Sem elementos "invisíveis"
- [ ] Gráficos funcionando

---

## 📊 MÉTRICAS DE SUCESSO

### Critérios de Aceitação

**Sprint 6 será considerado SUCESSO se:**

1. ✅ **Audit Refinado**
   - Script detecta <10% de falsos positivos
   - Métricas refletem progresso real
   - Documentação do audit atualizada

2. ✅ **TOP 5 Migrados**
   - 5 arquivos com zero violações
   - ~120-140 transformações aplicadas
   - Código consistente e limpo

3. ✅ **Qualidade Mantida**
   - 240/240 testes passando
   - Sem regressões visuais
   - Documentação atualizada

4. ✅ **Metas Numéricas**
   - <300 violações reais
   - ≥85% conformidade
   - +26 arquivos limpos

---

## ⏱️ CRONOGRAMA

### Dia 1 (31/10/2025 - Manhã)

**09:00 - 10:00:** Refinar Audit Script

- Implementar lógica de dark mode
- Atualizar detecção de gradientes
- Criar testes unitários do audit

**10:00 - 11:00:** Testar Audit Refinado

- Executar em arquivos conhecidos
- Validar casos de teste
- Ajustar false positives/negatives

**11:00 - 12:00:** Executar Audit Completo

- Rodar em todos os 367 arquivos
- Gerar relatório atualizado
- Analisar resultados

### Dia 1 (Tarde)

**14:00 - 15:30:** Migração Manual (Parte 1)

- DespesasAccrualTab.jsx
- CommissionReportPage.jsx

**15:30 - 17:00:** Migração Manual (Parte 2)

- EditProductModal.jsx
- CreateProductModal.jsx

**17:00 - 18:00:** Testes e Validação

- Executar testes unitários
- Validação visual básica

### Dia 2 (01/11/2025 - Manhã) - Se necessário

**09:00 - 10:00:** Migração Manual (Final)

- ContasBancariasTab.jsx

**10:00 - 11:00:** Validação Completa

- Todos os testes
- Validação visual completa
- Verificar dark mode

**11:00 - 12:00:** Documentação

- Criar SPRINT_6_RELATORIO.md
- Atualizar RELATORIO_CONSOLIDADO.md
- Atualizar PLANO_AJUSTE_FRONTEND.md

---

## 🔧 FERRAMENTAS E SCRIPTS

### Script de Audit Refinado

**Localização:** `scripts/audit-design-system.js`

**Mudanças Principais:**

```javascript
// Antes (v1.0)
if (className.match(/bg-gray-\d+/)) {
  violations.push(...); // Falso positivo!
}

// Depois (v2.0)
if (className.match(/bg-gray-\d+/) && !hasValidDarkMode(className)) {
  violations.push(...); // Só violações reais
}
```

### Script de Migração Manual

Para os TOP 5, usaremos migração manual (não automatizada) para garantir qualidade máxima.

**Ferramentas:**

- VSCode Find/Replace com regex
- Validação linha por linha
- Teste incremental

---

## 📈 PROJEÇÃO DE RESULTADOS

### Antes do Sprint 6

| Métrica                | Valor    | Nota                 |
| ---------------------- | -------- | -------------------- |
| Violações (oficial)    | 756      | Com falsos positivos |
| Violações (real)       | ~420-450 | Estimativa           |
| Conformidade (oficial) | 72.21%   | Com falsos positivos |
| Conformidade (real)    | ~78-80%  | Estimativa           |

### Após Sprint 6 (Projeção)

| Métrica                    | Valor    | Δ               |
| -------------------------- | -------- | --------------- |
| **Violações (oficial)**    | **<300** | **-456+**       |
| **Violações (real)**       | **<300** | **-120 a -150** |
| **Conformidade (oficial)** | **≥85%** | **+12.79 pp**   |
| **Conformidade (real)**    | **≥85%** | **+5-7 pp**     |
| **Arquivos Limpos**        | **≥312** | **+47**         |

### ROI do Sprint 6

**Investimento:**

- 1-2 dias de desenvolvimento
- ~8-12 horas de trabalho

**Retorno:**

- Audit 80% mais preciso
- 120-150 violações reais eliminadas
- 5 arquivos críticos zerados
- Conformidade >85% alcançada

**ROI:** ⭐⭐⭐⭐⭐ (Excelente)

---

## 🎯 PRÓXIMOS PASSOS (Sprint 7+)

### Sprint 7: Refinamento Adicional

**Meta:** <200 violações, ≥90% conformidade

**Estratégia:**

1. Migração manual TOP 10 seguinte
2. Criar componente Badge reutilizável
3. Padronizar modais genéricos

### Sprint 8-9: Polimento Final

**Meta:** <100 violações, ≥95% conformidade

**Estratégia:**

1. Casos edge restantes
2. Documentação completa
3. Storybook para componentes principais

---

## 📝 RISCOS E MITIGAÇÕES

### Risco 1: Audit Refinado Introduz Novos Bugs

**Probabilidade:** Média
**Impacto:** Alto

**Mitigação:**

- Criar testes unitários do audit
- Validar com casos conhecidos
- Rollback disponível (Git)

### Risco 2: Migração Manual Quebra Funcionalidades

**Probabilidade:** Baixa
**Impacto:** Crítico

**Mitigação:**

- Testes unitários antes/depois
- Validação visual incremental
- Commits pequenos e frequentes

### Risco 3: Tempo Insuficiente

**Probabilidade:** Baixa
**Impacto:** Médio

**Mitigação:**

- Buffer de 1 dia adicional
- Priorizar audit refinado
- TOP 5 pode virar TOP 3 se necessário

---

## ✅ CHECKLIST DE CONCLUSÃO

### Audit Refinado

- [ ] Lógica de dark mode implementada
- [ ] Detecção de gradientes atualizada
- [ ] Testes unitários criados
- [ ] Executado em todos os arquivos
- [ ] Relatório gerado e validado
- [ ] Documentação atualizada

### Migração Manual TOP 5

- [ ] DespesasAccrualTab.jsx (0 violações)
- [ ] CommissionReportPage.jsx (0 violações)
- [ ] EditProductModal.jsx (0 violações)
- [ ] CreateProductModal.jsx (0 violações)
- [ ] ContasBancariasTab.jsx (0 violações)

### Qualidade

- [ ] 240/240 testes passando
- [ ] Validação visual completa
- [ ] Dark mode funcionando
- [ ] Sem regressões

### Documentação

- [ ] SPRINT_6_RELATORIO.md criado
- [ ] RELATORIO_CONSOLIDADO.md atualizado
- [ ] PLANO_AJUSTE_FRONTEND.md atualizado
- [ ] Audit script documentado

---

**Documento Criado:** 31/10/2025, 15:50  
**Última Atualização:** 31/10/2025, 15:50  
**Versão:** 1.0.0  
**Autor:** Equipe de Desenvolvimento  
**Status:** 🔄 PRONTO PARA EXECUÇÃO

---

✨ **PRÓXIMA AÇÃO: INICIAR FASE 1 - REFINAR AUDIT SCRIPT** ✨
