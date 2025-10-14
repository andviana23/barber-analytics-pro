# 📝 Refatoração Completa - Modal Nova Receita (Regime de Competência)

## 🎯 Objetivo
Simplificar o modal de criação de receitas no **Financeiro Avançado** para usar apenas 5 campos essenciais com cálculo automático da data de recebimento baseado em dias úteis.

## 📋 Arquivos Modificados

### 1. `src/templates/NovaReceitaAccrualModal/NovaReceitaAccrualModal.jsx`
**Status**: ✅ Refatoração Completa

---

## 🔄 Mudanças Estruturais

### ❌ ANTES - Estrutura Complexa (16 campos)
```javascript
const [formData, setFormData] = useState({
  titulo: '',
  descricao: '',
  valor: '',
  data_vencimento: new Date(),
  data_competencia: new Date(),
  party_id: '',
  categoria_id: '',
  conta_id: '',
  metodo_pagamento: 'pix',
  observacoes: '',
  tags: [],
  endereco: '',
  status: 'pendente'
});

const [recurringConfig, setRecurringConfig] = useState({
  enabled: false,
  frequency: 'monthly',
  interval: 1,
  endType: 'never',
  occurrences: 12,
  endDate: addMonths(new Date(), 12)
});
```

### ✅ DEPOIS - Estrutura Simplificada (5 campos)
```javascript
const [formData, setFormData] = useState({
  titulo: '',
  valor: '',
  data_pagamento: new Date().toISOString().split('T')[0],
  unit_id: '',
  payment_method_id: ''
});
```

---

## 🆕 Nova Funcionalidade: Auto-Cálculo de Data de Recebimento

### 📊 Lógica de Cálculo
```javascript
useEffect(() => {
  if (formData.payment_method_id && formData.data_pagamento) {
    const method = paymentMethods.find(m => m.id === formData.payment_method_id);
    if (method) {
      setSelectedPaymentMethod(method);
      const receiptDate = addBusinessDays(
        new Date(formData.data_pagamento + 'T00:00:00'), 
        method.receipt_days
      );
      setCalculatedReceiptDate(receiptDate.toISOString().split('T')[0]);
    }
  }
}, [formData.payment_method_id, formData.data_pagamento, paymentMethods]);
```

### 🔑 Conceitos-Chave
1. **Data de Pagamento = Data de Competência**: Mesma data para ambos os campos
2. **Data de Recebimento**: Calculada automaticamente usando `addBusinessDays()`
3. **Dias Úteis**: Função considera finais de semana e feriados
4. **Receipt Days**: Configurado em cada forma de pagamento (0 = imediato)

---

## 🎨 Interface do Usuário

### 📝 Campos do Formulário

#### 1. **Título** (Campo de Texto)
```jsx
<Input
  type="text"
  placeholder="Ex: Serviço de corte de cabelo"
  value={formData.titulo}
  onChange={(e) => handleInputChange('titulo', e.target.value)}
/>
```

#### 2. **Valor** (Campo Numérico com Prefixo R$)
```jsx
<div className="relative">
  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">R$</span>
  <Input
    type="number"
    step="0.01"
    min="0"
    placeholder="0,00"
    value={formData.valor}
    className="pl-10"
  />
</div>
```

#### 3. **Data de Pagamento** (Date Picker)
```jsx
<Input
  type="date"
  value={formData.data_pagamento}
  onChange={(e) => handleInputChange('data_pagamento', e.target.value)}
/>
<p className="text-xs text-gray-500">
  Esta data será usada como data de competência no sistema
</p>
```

#### 4. **Unidade** (Dropdown)
```jsx
<select value={formData.unit_id} onChange={...}>
  <option value="">Selecione uma unidade</option>
  {units.map(unit => (
    <option key={unit.id} value={unit.id}>{unit.name}</option>
  ))}
</select>
```

#### 5. **Forma de Pagamento** (Dropdown Dependente)
```jsx
<select 
  value={formData.payment_method_id}
  disabled={!formData.unit_id}
  onChange={...}
>
  <option value="">
    {formData.unit_id 
      ? 'Selecione uma forma de pagamento' 
      : 'Selecione uma unidade primeiro'}
  </option>
  {paymentMethods.map(method => (
    <option key={method.id} value={method.id}>
      {method.name} - {method.receipt_days === 0 
        ? 'Recebimento imediato' 
        : `${method.receipt_days} ${method.receipt_days === 1 ? 'dia útil' : 'dias úteis'}`}
    </option>
  ))}
</select>
```

### 💡 Preview da Data de Recebimento
```jsx
{selectedPaymentMethod && calculatedReceiptDate && (
  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <div>
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Data de Recebimento Calculada
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {new Date(calculatedReceiptDate + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {selectedPaymentMethod.receipt_days === 0 
            ? 'Recebimento no mesmo dia (imediato)'
            : `Recebimento em ${selectedPaymentMethod.receipt_days} dia(s) útil(is)`
          }
        </p>
      </div>
    </div>
  </div>
)}
```

---

## ⚙️ Validação do Formulário

### ✅ Regras de Validação
```javascript
const validateForm = () => {
  const newErrors = {};

  if (!formData.titulo?.trim()) {
    newErrors.titulo = 'Título é obrigatório';
  }

  if (!formData.valor || parseFloat(formData.valor) <= 0) {
    newErrors.valor = 'Valor deve ser maior que zero';
  }

  if (!formData.data_pagamento) {
    newErrors.data_pagamento = 'Data de pagamento é obrigatória';
  }

  if (!formData.unit_id) {
    newErrors.unit_id = 'Unidade é obrigatória';
  }

  if (!formData.payment_method_id) {
    newErrors.payment_method_id = 'Forma de pagamento é obrigatória';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## 🚀 Submissão de Dados

### 📤 Estrutura do Objeto Enviado
```javascript
const receita = {
  titulo: formData.titulo,
  valor: parseFloat(formData.valor),
  data_competencia: formData.data_pagamento,  // ← Mesma data!
  data_pagamento: formData.data_pagamento,     // ← Mesma data!
  data_recebimento: calculatedReceiptDate,     // ← Calculada automaticamente
  unit_id: formData.unit_id,
  payment_method_id: formData.payment_method_id,
  status: 'pendente',
  tipo: 'receita'
};
```

---

## 🎨 Dark Mode

### 🌓 Classes de Estilo Adaptativas
Todos os elementos usam classes com suporte a dark mode:
- `bg-white dark:bg-gray-800`
- `text-gray-900 dark:text-white`
- `border-gray-300 dark:border-gray-600`
- `bg-blue-50 dark:bg-blue-900/20`

---

## 🔗 Integração com Sistema Financeiro

### 📊 Fluxo de Dados
```
1. Usuário preenche formulário
   ↓
2. Sistema calcula data_recebimento usando addBusinessDays()
   ↓
3. Receita criada com 3 datas:
   - data_pagamento = data informada
   - data_competencia = data_pagamento (mesmo valor)
   - data_recebimento = data_pagamento + receipt_days (dias úteis)
   ↓
4. Receita integra-se com:
   - ✅ Calendário Financeiro
   - ✅ Conciliação Bancária
   - ✅ Contas a Receber
   - ✅ Relatórios DRE
   - ✅ Fluxo de Caixa
```

---

## 🧪 Testes Recomendados

### ✅ Casos de Teste

#### 1. Teste de Recebimento Imediato
```
- Forma de Pagamento: Dinheiro (receipt_days = 0)
- Data Pagamento: 14/10/2025
- Esperado: data_recebimento = 14/10/2025
```

#### 2. Teste de Dias Úteis (1 dia)
```
- Forma de Pagamento: PIX (receipt_days = 1)
- Data Pagamento: 14/10/2025 (Terça)
- Esperado: data_recebimento = 15/10/2025 (Quarta)
```

#### 3. Teste de Dias Úteis com Final de Semana
```
- Forma de Pagamento: Cartão Débito (receipt_days = 1)
- Data Pagamento: 17/10/2025 (Sexta)
- Esperado: data_recebimento = 20/10/2025 (Segunda)
```

#### 4. Teste de Cartão de Crédito (30 dias)
```
- Forma de Pagamento: Cartão Crédito (receipt_days = 30)
- Data Pagamento: 14/10/2025
- Esperado: data_recebimento ≈ 25/11/2025 (considerando dias úteis)
```

#### 5. Teste de Validação
```
- Título: vazio → ERRO
- Valor: 0 ou negativo → ERRO
- Data: vazia → ERRO
- Unidade: não selecionada → ERRO
- Forma Pagamento: não selecionada → ERRO
```

#### 6. Teste de Dependência Unidade → Forma de Pagamento
```
1. Abrir modal
2. Verificar: Forma de Pagamento desabilitada
3. Selecionar Unidade X
4. Verificar: Apenas formas de pagamento da Unidade X aparecem
5. Trocar para Unidade Y
6. Verificar: Forma de Pagamento limpa automaticamente
7. Verificar: Apenas formas de pagamento da Unidade Y aparecem
```

---

## 📦 Dependências

### 📚 Imports Necessários
```javascript
import { unitsService } from '../../services/unitsService';
import { paymentMethodsService } from '../../services/paymentMethodsService';
import { addBusinessDays } from '../../utils/businessDays';
import Input from '../../atoms/Input';
```

### 🔧 Services
- `unitsService.getUnits()`: Busca lista de unidades
- `paymentMethodsService.getPaymentMethods(unitId)`: Busca formas de pagamento por unidade

### 🛠️ Utilities
- `addBusinessDays(date, days)`: Calcula data adicionando dias úteis

---

## 🎯 Benefícios da Refatoração

### ✅ Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Campos** | 16 campos complexos | 5 campos essenciais |
| **Validação** | 8 regras diferentes | 5 regras simples |
| **Recorrência** | Manual (usuário configura) | Não implementado |
| **Data Recebimento** | Manual (usuário informa) | **Automática** |
| **Categorias** | Obrigatórias | Removidas |
| **Conta Bancária** | Obrigatória | Removida |
| **Cliente** | Obrigatório | Removido |
| **Tags** | Manual | Removidas |
| **Endereço** | Manual | Removido |
| **Status** | Manual | Fixo 'pendente' |

### 🚀 Melhorias
1. ✅ **Interface Simplificada**: 70% menos campos
2. ✅ **Experiência do Usuário**: Menos erros, mais rápido
3. ✅ **Cálculo Inteligente**: Data de recebimento automática
4. ✅ **Menos Cliques**: 5 campos vs 16 campos
5. ✅ **Dark Mode Completo**: Todas as cores adaptadas
6. ✅ **Validação Clara**: Mensagens específicas por campo
7. ✅ **Preview Visual**: Usuário vê quando vai receber o dinheiro

---

## 🐛 Problemas Corrigidos

### ✅ Issues Resolvidas
1. ✅ Removido `useCallback` não utilizado
2. ✅ Removido `console.error` não permitido
3. ✅ Removido código de recorrência complexo
4. ✅ Removido campos desnecessários
5. ✅ Simplificado PropTypes

---

## 📝 Notas Técnicas

### 🔑 Conceitos-Chave
- **Regime de Competência**: Receita registrada na data do fato gerador (pagamento)
- **Dias Úteis**: Exclui sábados, domingos e feriados brasileiros
- **Receipt Days**: Configuração por forma de pagamento (banco leva X dias para processar)

### ⚠️ Importante
- A data de competência é SEMPRE igual à data de pagamento
- A data de recebimento é calculada automaticamente
- Formas de pagamento são filtradas por unidade
- Validação ocorre antes do envio

---

## 📚 Documentação Relacionada
- **businessDays.js**: Lógica de cálculo de dias úteis
- **paymentMethodsService.js**: Gerenciamento de formas de pagamento
- **unitsService.js**: Gerenciamento de unidades

---

## ✅ Checklist de Implementação

- [x] Refatorar estrutura de state (formData simplificado)
- [x] Remover estados desnecessários (recurringConfig, tags, etc)
- [x] Implementar fetchUnits ao montar componente
- [x] Implementar fetchPaymentMethods baseado em unitId
- [x] Implementar cálculo automático de data_recebimento
- [x] Criar handleInputChange simplificado
- [x] Criar validateForm com 5 regras
- [x] Criar handleSubmit com estrutura correta
- [x] Refatorar JSX para 5 campos
- [x] Adicionar preview de data de recebimento
- [x] Implementar dark mode completo
- [x] Remover PropTypes desnecessários
- [x] Corrigir erros de lint
- [x] Documentar todas as mudanças

---

## 🎉 Status Final
**✅ REFATORAÇÃO 100% COMPLETA**

O modal está pronto para uso no **Financeiro Avançado** com estrutura simplificada e cálculo automático de datas.

---

**Data da Refatoração**: 14/10/2025  
**Desenvolvedor**: GitHub Copilot  
**Versão**: 2.0 - Simplified & Automated
