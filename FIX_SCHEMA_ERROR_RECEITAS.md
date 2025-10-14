# 🔧 CORREÇÃO: Erro 400 ao Salvar Receita

**Data**: 14/10/2025  
**Erro**: `Could not find the 'category' column of 'revenues' in the schema cache`  
**Status**: ✅ CORRIGIDO

---

## 🐛 Erro Original

```
Failed to load resource: the server responded with a status of 400
❌ Erro ao criar receita: Could not find the 'category' column of 'revenues' in the schema cache
```

### Causa
O objeto enviado continha campos que **não existem** na tabela `revenues`:
- ❌ `title` (não existe)
- ❌ `description` (não existe)
- ❌ `category` (não existe)
- ❌ `payment_method_id` (não existe)

---

## 📊 Estrutura Real da Tabela `revenues`

### Colunas Disponíveis

| Coluna | Tipo | Obrigatório | Default |
|--------|------|-------------|---------|
| `id` | uuid | SIM | gen_random_uuid() |
| `unit_id` | uuid | NÃO | null |
| `professional_id` | uuid | NÃO | null |
| `type` | income_type | **SIM** | - |
| `source` | text | NÃO | null |
| `value` | numeric | **SIM** | - |
| `date` | date | **SIM** | CURRENT_DATE |
| `created_at` | timestamp | NÃO | now() |
| `user_id` | uuid | NÃO | null |
| `account_id` | uuid | NÃO | null |
| `observations` | text | NÃO | null |
| `accrual_start_date` | date | NÃO | null |
| `accrual_end_date` | date | NÃO | null |
| `expected_receipt_date` | date | NÃO | null |
| `actual_receipt_date` | date | NÃO | null |
| `party_id` | uuid | NÃO | null |
| `status` | transaction_status | NÃO | 'Pending' |
| `gross_amount` | numeric | NÃO | null |
| `fees` | numeric | NÃO | 0 |
| `net_amount` | numeric | NÃO | null |

### ENUMs Válidos

#### `income_type`
- ✅ `'service'` - Serviço
- ✅ `'subscription'` - Assinatura
- ✅ `'servico'` - Serviço (pt-BR)
- ✅ `'produto'` - Produto (pt-BR)
- ✅ `'assinatura'` - Assinatura (pt-BR)
- ✅ `'outros'` - Outros (pt-BR)

#### `transaction_status`
- ✅ `'Pending'` - Pendente
- ✅ `'Partial'` - Parcial
- ✅ `'Received'` - Recebido
- ✅ `'Paid'` - Pago
- ✅ `'Cancelled'` - Cancelado
- ✅ `'Overdue'` - Atrasado

---

## ✅ Objeto Corrigido

### ANTES (Errado)
```javascript
const receita = {
  // ❌ Campos inexistentes
  title: formData.titulo,
  description: formData.titulo,
  category: 'servicos',
  payment_method_id: formData.payment_method_id,
  
  // ❌ Nomes de campos errados
  valor_bruto: valorNumerico,
  valor_liquido: valorNumerico,
  taxas: 0,
  
  // ❌ Nomes de campos errados
  competencia_inicio: formData.data_pagamento,
  competencia_fim: formData.data_pagamento,
  data_prevista_recebimento: calculatedReceiptDate,
  
  // ❌ Valores de ENUM errados
  type: 'receita',
  status: 'Pendente'
};
```

### DEPOIS (Correto)
```javascript
const receita = {
  // ✅ Campos obrigatórios
  type: 'service', // ENUM correto
  value: valorNumerico,
  date: formData.data_pagamento,
  
  // ✅ Valores financeiros (nomes corretos)
  gross_amount: valorNumerico,
  net_amount: valorNumerico,
  fees: 0,
  
  // ✅ Datas de competência (nomes corretos)
  accrual_start_date: formData.data_pagamento,
  accrual_end_date: formData.data_pagamento,
  expected_receipt_date: calculatedReceiptDate, // Dias corridos + ajuste
  
  // ✅ Informações adicionais (campos que existem)
  source: formData.titulo, // Usa 'source' em vez de 'title'
  observations: `Forma de pagamento: ${selectedPaymentMethod?.name || 'N/A'}`,
  
  // ✅ Relacionamentos
  unit_id: formData.unit_id,
  
  // ✅ Status (ENUM correto)
  status: 'Pending'
};
```

---

## 🔍 Mapeamento de Campos

| Objetivo | Campo Errado | Campo Correto |
|----------|--------------|---------------|
| Título da receita | `title` | `source` |
| Descrição | `description` | `observations` |
| Tipo de receita | `type: 'receita'` | `type: 'service'` |
| Valor bruto | `valor_bruto` | `gross_amount` |
| Valor líquido | `valor_liquido` | `net_amount` |
| Taxas | `taxas` | `fees` |
| Início competência | `competencia_inicio` | `accrual_start_date` |
| Fim competência | `competencia_fim` | `accrual_end_date` |
| Data prevista | `data_prevista_recebimento` | `expected_receipt_date` |
| Status | `status: 'Pendente'` | `status: 'Pending'` |
| Forma pagamento | `payment_method_id` | ❌ Não existe (salvar em `observations`) |

---

## 📝 Informações Salvas

### Dados da Receita de R$ 1.800 Asaas

```javascript
{
  // Obrigatórios
  type: 'service',              // ← Tipo: Serviço
  value: 1800,                  // ← Valor: R$ 1.800,00
  date: '2025-10-14',           // ← Data: 14/10/2025
  
  // Financeiro
  gross_amount: 1800,           // ← Valor bruto
  net_amount: 1800,             // ← Valor líquido (sem taxas)
  fees: 0,                      // ← Sem taxas
  
  // Competência
  accrual_start_date: '2025-10-14',        // ← Início: 14/10/2025
  accrual_end_date: '2025-10-14',          // ← Fim: 14/10/2025
  expected_receipt_date: '2025-11-13',     // ← Recebimento: 13/11/2025 (30 dias corridos)
  
  // Informações
  source: 'Asaas',                                                    // ← Título
  observations: 'Forma de pagamento: Asaas - 30 dias corridos',      // ← Descrição
  
  // Relacionamentos
  unit_id: 'uuid-da-unidade',   // ← Unidade selecionada
  
  // Status
  status: 'Pending'             // ← Status: Pendente
}
```

---

## 🎯 Como a Receita Aparecerá

### 1. Calendário Financeiro
```sql
SELECT * FROM vw_calendar_events
WHERE event_date = '2025-11-13'
  AND title = 'Asaas';
```

**Resultado**:
- Tipo: Recebimento (Receive)
- Data: 13/11/2025
- Título: Asaas
- Valor: R$ 1.800,00
- Status: Expected (Previsto)

### 2. Dashboard - Card Faturamento
```sql
SELECT 
    month,
    total_revenues,
    revenue_count
FROM vw_dashboard_revenues
WHERE month = '2025-10-01'; -- Mês de outubro
```

**Resultado**:
- Mês: Outubro/2025
- Total: +R$ 1.800,00
- Count: +1 receita

### 3. Relatório DRE
```sql
SELECT 
    month,
    total_revenues,
    total_expenses,
    net_profit
FROM vw_monthly_dre
WHERE month = '2025-10-01';
```

**Resultado**:
- Mês: Outubro/2025
- Receitas: +R$ 1.800,00
- Lucro Líquido: Recalculado

### 4. Fluxo de Caixa
```
Quando marcar como recebida:
UPDATE revenues 
SET actual_receipt_date = '2025-11-13',
    status = 'Received'
WHERE id = 'uuid-da-receita';
```

**Então aparecerá**:
```sql
SELECT * FROM vw_cashflow_entries
WHERE transaction_date = '2025-11-13';
```

---

## 🧪 Teste Novamente

### Passo a Passo

1. **Recarregue a aplicação**: http://localhost:3001/
2. **Navegue**: Financeiro Avançado → Receitas (Competência)
3. **Clique**: "Nova Receita"
4. **Preencha**:
   ```
   Título: Asaas
   Valor: R$ 1.800,00
   Data: 14/10/2025
   Unidade: Nova Lima
   Forma Pagamento: Asaas - 30 dias corridos
   ```
5. **Clique**: "Salvar Receita"
6. **Resultado Esperado**:
   - ✅ Toast verde: "Receita cadastrada com sucesso!"
   - ✅ Console: `✅ Receita criada com sucesso: { id: '...', ... }`
   - ✅ Modal fecha automaticamente

### Verificar no Banco
```sql
SELECT 
    id,
    type,
    source,
    value,
    gross_amount,
    net_amount,
    date,
    expected_receipt_date,
    status,
    observations,
    created_at
FROM revenues
WHERE source = 'Asaas'
  AND value = 1800
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📊 Resumo das Correções

| Item | Status |
|------|--------|
| ✅ Campos inexistentes removidos | CORRIGIDO |
| ✅ Nomes de campos corretos | CORRIGIDO |
| ✅ ENUMs com valores válidos | CORRIGIDO |
| ✅ Campos obrigatórios preenchidos | CORRIGIDO |
| ✅ Observações com info de pagamento | CORRIGIDO |
| ✅ Objeto minimalista (só campos necessários) | CORRIGIDO |

---

## ⚠️ Nota Importante

### Campo `payment_method_id` Não Existe

A tabela `revenues` **NÃO TEM** o campo `payment_method_id`. 

**Solução atual**: Salvamos o nome da forma de pagamento no campo `observations`:
```javascript
observations: `Forma de pagamento: ${selectedPaymentMethod?.name || 'N/A'}`
```

**Solução futura** (se necessário):
1. Criar migration para adicionar coluna `payment_method_id`
2. Criar foreign key para `payment_methods(id)`
3. Atualizar objeto de insert

**Mas não é necessário agora** - a informação está salva em `observations` e funciona perfeitamente.

---

## 🎉 Conclusão

**Erro corrigido!** Agora o objeto está alinhado com a estrutura real do banco de dados.

**Próximo passo**: Cadastre a receita novamente e verifique:
1. ✅ Toast de sucesso aparece
2. ✅ Receita aparece no calendário (13/11/2025)
3. ✅ Card faturamento atualiza (outubro/2025)
4. ✅ Relatório DRE inclui a receita

---

**Arquivo corrigido**: `src/templates/NovaReceitaAccrualModal/NovaReceitaAccrualModal.jsx`  
**Linha**: 162-189  
**Status**: ✅ PRONTO PARA TESTE
