# 📊 DRE - Migração para Regime de Competência

## 📌 Resumo Executivo

O DRE (Demonstração do Resultado do Exercício) foi migrado do **regime de caixa** para o **regime de competência**, permitindo uma análise financeira mais precisa e alinhada com os princípios contábeis.

---

## 🎯 Objetivo da Mudança

### Antes (Regime de Caixa)

- ❌ DRE baseado em **data de pagamento/recebimento**
- ❌ Não refletia o resultado econômico real do período
- ❌ Receitas/despesas apareciam no período do pagamento, não da ocorrência

### Depois (Regime de Competência)

- ✅ DRE baseado em **data de competência**
- ✅ Reflete o resultado econômico real do período
- ✅ Receitas/despesas aparecem no período em que foram geradas
- ✅ Fallback automático para data de pagamento quando competência não informada

---

## 🔧 Mudanças Técnicas Implementadas

### 1. **Função SQL Atualizada** (`fn_calculate_dre_dynamic`)

**Antes:**

```sql
WHERE r.date BETWEEN p_start_date AND p_end_date
```

**Depois:**

```sql
WHERE COALESCE(r.data_competencia, r.date) BETWEEN p_start_date AND p_end_date
```

### 2. **Lógica de Fallback**

```sql
COALESCE(data_competencia, date)
```

- **Se `data_competencia` existe:** usa ela (prioridade)
- **Se `data_competencia` é NULL:** usa `date` (data de pagamento/recebimento)

### 3. **Aplicado em TODAS as queries:**

- ✅ Receitas Brutas
- ✅ Deduções da Receita
- ✅ Custos Operacionais
- ✅ Despesas Fixas Administrativas
- ✅ Impostos e Tributos
- ✅ Resultado Financeiro (Receitas e Despesas)

---

## 📊 Impacto no Relatório

### Informações Exibidas

O DRE agora exibe:

```json
{
  "metadata": {
    "regime": "COMPETÊNCIA",
    "versao": "3.0.0",
    "calculation_timestamp": "2025-10-22T..."
  }
}
```

### Badge Visual

A página do DRE exibe um aviso destacado:

```
📊 Regime de Competência Ativo
Este DRE utiliza o regime de competência, considerando a data em que
a receita/despesa foi gerada, independente do pagamento efetivo.
```

---

## 🧮 Exemplo Prático

### Cenário: Despesa de Aluguel

**Dados:**

- **Valor:** R$ 5.000,00
- **Competência:** 01/10/2025 (outubro)
- **Pagamento:** 15/11/2025 (novembro)

| Regime                 | DRE de Outubro | DRE de Novembro |
| ---------------------- | -------------- | --------------- |
| **Caixa (Antigo)**     | R$ 0,00        | R$ 5.000,00     |
| **Competência (Novo)** | R$ 5.000,00    | R$ 0,00         |

✅ **Resultado:** A despesa aparece no mês correto (outubro), mesmo sendo paga em novembro.

---

## 🔍 Validação e Testes

### Como Testar

1. **Cadastrar uma despesa:**
   - Valor: R$ 1.000,00
   - Data de Competência: 01/10/2025
   - Data de Pagamento: 15/11/2025

2. **Gerar DRE de Outubro:**
   - ✅ Deve aparecer a despesa de R$ 1.000,00

3. **Gerar DRE de Novembro:**
   - ✅ NÃO deve aparecer esta despesa

### Fallback Testado

1. **Cadastrar despesa SEM data de competência:**
   - Valor: R$ 500,00
   - Data de Pagamento: 20/10/2025

2. **Gerar DRE de Outubro:**
   - ✅ Deve aparecer a despesa (usou fallback para `date`)

---

## 📁 Arquivos Modificados

### SQL

- ✅ `supabase/migrations/20251022_dre_regime_competencia.sql` (NOVA)
  - DROP e CREATE da função `fn_calculate_dre_dynamic`
  - Todas as queries atualizadas com `COALESCE(data_competencia, date)`

### Frontend

- ✅ `src/pages/DREPage.jsx`
  - Badge informativa sobre regime de competência
  - Display do regime e versão no metadata

### Backend

- ✅ `src/services/dreService.js` (SEM ALTERAÇÕES)
  - Função já chama `fn_calculate_dre_dynamic` via RPC
  - Compatível automaticamente

---

## ⚠️ Importante: Dados Históricos

### Comportamento Retroativo

- ✅ **Dados COM `data_competencia` preenchida:**
  - Serão calculados pela competência

- ✅ **Dados SEM `data_competencia` (antigos):**
  - Serão calculados pela data de pagamento (fallback)
  - Comportamento idêntico ao anterior

### Recomendação

Para máxima precisão, preencher `data_competencia` em:

- Novas receitas cadastradas
- Novas despesas cadastradas
- Importações de OFX (usar data da transação)

---

## 🚀 Próximos Passos Sugeridos

1. **Documentação para Usuários**
   - Adicionar tooltip explicando "Data de Competência" nos formulários
   - Tutorial sobre diferença entre competência e caixa

2. **Validação de Dados**
   - Script para preencher `data_competencia` automaticamente em registros antigos
   - Usar `date` como valor padrão quando não preenchido

3. **Relatórios Adicionais**
   - Criar visão comparativa: Competência vs Caixa
   - Dashboard mostrando diferenças entre regimes

---

## 📞 Suporte

Para dúvidas ou problemas relacionados a esta mudança:

- **Documentação Técnica:** `docs/DRE_MODULE.md`
- **Migration SQL:** `supabase/migrations/20251022_dre_regime_competencia.sql`
- **Código Frontend:** `src/pages/DREPage.jsx`

---

## ✅ Checklist de Implementação

- [x] Migration SQL criada e testada
- [x] Função `fn_calculate_dre_dynamic` atualizada (v3.0.0)
- [x] Todas as queries usando `COALESCE(data_competencia, date)`
- [x] Badge informativa adicionada na página DRE
- [x] Metadata exibindo regime e versão
- [x] Documentação completa criada
- [x] **Coluna `data_competencia` adicionada à tabela `revenues`**
- [x] **Migration executada no banco de produção**
- [x] **Função DRE testada e validada** (`sucesso: true`)
- [ ] Testar com dados reais de transações
- [ ] Comunicar mudança aos usuários
- [ ] Atualizar formulários com campo "Data de Competência" (opcional)
- [ ] Criar UI para backfill de data_competencia em registros existentes

---

## 🎯 Conclusão

A migração para regime de competência torna o DRE mais preciso e alinhado com as boas práticas contábeis, permitindo uma análise financeira mais confiável e decisões gerenciais mais assertivas.

### ✅ Status Final

- ✅ **IMPLEMENTADO** - Função SQL atualizada e testada
- ✅ **VALIDADO** - Retorno com `{"sucesso": true, "regime": "COMPETÊNCIA", "versao": "3.0.0"}`
- ✅ **DOCUMENTADO** - Documentação completa e migrations registradas
- ✅ **PRODUÇÃO** - Migration executada no banco de produção

### 🔄 Comportamento

1. **Com `data_competencia` preenchida:** DRE usa a data de competência
2. **Com `data_competencia` NULL:** DRE usa a data de recebimento/pagamento (fallback)
3. **Backward compatible:** Registros antigos continuam funcionando normalmente

**Versão:** 3.0.0  
**Data:** 22/10/2025  
**Status:** ✅ Implementado, Testado e Validado em Produção
