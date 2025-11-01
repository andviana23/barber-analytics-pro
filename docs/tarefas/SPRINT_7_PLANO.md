# 🚀 SPRINT 7 - PLANO DE EXECUÇÃO

**Sistema**: Barber Analytics Pro  
**Data**: 31 de outubro de 2025  
**Autor**: Andrey Viana  
**Status**: 🔄 EM ANDAMENTO

---

## 🎯 OBJETIVOS DO SPRINT 7

### Meta Principal

Continuar a migração manual de arquivos prioritários para alcançar:

- **Violações**: <100 (atual: 121)
- **Conformidade**: ≥89% (atual: 87.47%)
- **Arquivos 100% Limpos**: +3 arquivos (mínimo)

### Estratégia

Aplicar o mesmo processo bem-sucedido do Sprint 6 Fase 2:

1. Análise manual do arquivo
2. Migração gradual e testada
3. Validação com testes
4. Audit para verificar progresso

---

## 📋 ARQUIVOS SELECIONADOS (TOP 5)

Com base no audit atual, os próximos 5 arquivos prioritários:

### 1. ProductsPage.jsx (6 violações)

**Caminho**: `src/pages/ProductsPage/ProductsPage.jsx`  
**Violações**: 6 gradientes inline  
**Complexidade**: MÉDIA  
**Prioridade**: ALTA (página principal)

### 2. GoalsPage.jsx (6 violações restantes)

**Caminho**: `src/pages/GoalsPage/GoalsPage.jsx`  
**Violações**: 6 gradientes decorativos  
**Complexidade**: BAIXA (finalizar trabalho do Sprint 6)  
**Prioridade**: ALTA (completar 100%)

### 3. SupplierInfoModal.jsx (6 violações)

**Caminho**: `src/molecules/SupplierModals/SupplierInfoModal.jsx`  
**Violações**: 5 gradientes + 1 cor hardcoded  
**Complexidade**: MÉDIA  
**Prioridade**: ALTA (cor hardcoded crítica)

### 4. SuppliersPageRefactored.jsx (5 violações)

**Caminho**: `src/pages/SuppliersPage/SuppliersPageRefactored.jsx`  
**Violações**: 5 gradientes inline  
**Complexidade**: MÉDIA  
**Prioridade**: MÉDIA

### 5. ReceitasAccrualTab.jsx (5 violações)

**Caminho**: `src/pages/FinanceiroAdvancedPage/ReceitasAccrualTab.jsx`  
**Violações**: 5 gradientes inline  
**Complexidade**: MÉDIA  
**Prioridade**: MÉDIA

**Total Inicial**: 28 violações nos TOP 5

---

## 📊 PROJEÇÕES

### Cenário Conservador (70% redução)

- Violações eliminadas: ~20
- Violações finais: ~101
- Conformidade: ~88.5%
- Arquivos 100%: +2

### Cenário Otimista (85% redução - meta)

- Violações eliminadas: ~24
- Violações finais: **~97** ✨
- Conformidade: **~89.2%** 🎯
- Arquivos 100%: +3

### Cenário Ideal (90% redução)

- Violações eliminadas: ~25
- Violações finais: **~96**
- Conformidade: **~89.5%**
- Arquivos 100%: +4

---

## 🛠️ PROCESSO DE EXECUÇÃO

### Para Cada Arquivo:

1. **Análise**
   - Ler arquivo completo
   - Identificar todas as violações
   - Categorizar por tipo

2. **Migração**
   - Aplicar transformações manualmente
   - Testar após cada mudança
   - Corrigir erros de sintaxe

3. **Validação**
   - Executar `npm test`
   - Executar `node scripts/audit-design-system.js`
   - Verificar regressões

4. **Documentação**
   - Registrar transformações
   - Atualizar métricas
   - Marcar como concluído

---

## 📈 MÉTRICAS DE ACOMPANHAMENTO

### Estado Inicial (Sprint 6 Final)

```
Violações Totais:     121
Conformidade:         87.47%
Arquivos Limpos:      321
Arquivos Violações:   46
Testes:               240/240 (100%)
```

### Meta Sprint 7

```
Violações Totais:     <100 (meta: ~97)
Conformidade:         ≥89% (meta: ~89.2%)
Arquivos Limpos:      ≥324 (+3)
Arquivos Violações:   ≤43 (-3)
Testes:               240/240 (100%)
```

---

## 🎯 CRITÉRIOS DE SUCESSO

### Obrigatórios (Must Have)

- ✅ Reduzir violações em ≥20 unidades
- ✅ Atingir conformidade ≥88.5%
- ✅ Manter 100% testes passando
- ✅ Zero regressões funcionais

### Desejáveis (Nice to Have)

- 🎯 Alcançar <100 violações totais
- 🎯 Atingir conformidade ≥89%
- 🎯 +3 arquivos 100% limpos
- 🎯 Finalizar GoalsPage.jsx completamente

### Bônus (Stretch Goals)

- 🌟 <95 violações
- 🌟 ≥90% conformidade
- 🌟 +4 arquivos 100% limpos

---

## 📝 CHECKLIST DE EXECUÇÃO

### Preparação

- [x] Criar SPRINT_7_PLANO.md
- [x] Identificar TOP 5 arquivos
- [x] Definir metas e projeções
- [ ] Criar backup dos arquivos

### Execução (Arquivo por Arquivo)

#### 1. ProductsPage.jsx

- [ ] Análise completa
- [ ] Migração de gradientes (6)
- [ ] Testes (240/240)
- [ ] Audit verificação
- [ ] Marcar como concluído

#### 2. GoalsPage.jsx (Finalizar)

- [ ] Análise dos 6 decorativos
- [ ] Decisão: manter ou migrar
- [ ] Testes (240/240)
- [ ] Audit verificação
- [ ] Marcar como 100% limpo

#### 3. SupplierInfoModal.jsx

- [ ] Análise completa
- [ ] Migração de cor hardcoded (1)
- [ ] Migração de gradientes (5)
- [ ] Testes (240/240)
- [ ] Audit verificação
- [ ] Marcar como concluído

#### 4. SuppliersPageRefactored.jsx

- [ ] Análise completa
- [ ] Migração de gradientes (5)
- [ ] Testes (240/240)
- [ ] Audit verificação
- [ ] Marcar como concluído

#### 5. ReceitasAccrualTab.jsx

- [ ] Análise completa
- [ ] Migração de gradientes (5)
- [ ] Testes (240/240)
- [ ] Audit verificação
- [ ] Marcar como concluído

### Finalização

- [ ] Audit final completo
- [ ] Atualizar PLANO_AJUSTE_FRONTEND.md
- [ ] Criar SPRINT_7_RELATORIO_FINAL.md
- [ ] Commit e push das alterações

---

## 🔧 FERRAMENTAS E COMANDOS

### Audit

```bash
node scripts/audit-design-system.js
```

### Testes

```bash
npm test -- --run
```

### Verificar Arquivo Específico

```bash
node scripts/audit-design-system.js | Select-String -Pattern "ProductsPage"
```

---

## 📊 TRACKING DE PROGRESSO

### Violações por Arquivo

| Arquivo                     | Inicial | Atual  | Final | Redução |
| --------------------------- | ------- | ------ | ----- | ------- |
| ProductsPage.jsx            | 6       | 6      | ?     | ?       |
| GoalsPage.jsx               | 6       | 6      | ?     | ?       |
| SupplierInfoModal.jsx       | 6       | 6      | ?     | ?       |
| SuppliersPageRefactored.jsx | 5       | 5      | ?     | ?       |
| ReceitasAccrualTab.jsx      | 5       | 5      | ?     | ?       |
| **TOTAL**                   | **28**  | **28** | **?** | **?**   |

_(Será atualizado conforme progresso)_

---

## 🎓 LIÇÕES DO SPRINT 6 APLICADAS

### ✅ O que funcionou bem:

1. Migração manual = zero regressões
2. Testes após cada mudança
3. Foco em arquivos de alto impacto
4. Documentação detalhada

### 🔧 Melhorias implementadas:

1. Criar backup antes de iniciar
2. Validar sintaxe JSX com mais cuidado
3. Detectar classes duplicadas
4. Categorizar gradientes (semânticos vs decorativos)

---

## 🚀 INICIANDO SPRINT 7

**Status**: Pronto para execução  
**Primeiro arquivo**: ProductsPage.jsx  
**Comando inicial**: Análise do arquivo

---

_Documento criado em: 31/10/2025 13:26 BRT_  
_Responsável: Andrey Viana_  
_Sprint: 7 de N_
