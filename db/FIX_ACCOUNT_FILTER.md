# 🔧 Correção: Filtro de Contas Bancárias por Unidade

## ✅ STATUS: CORREÇÃO APLICADA COM SUCESSO!

## 📋 Problema Identificado
As contas bancárias não estavam sendo filtradas corretamente quando o usuário selecionava uma unidade diferente no modal de Nova Receita.

### Comportamento Anterior (❌ Incorreto):
- As contas eram filtradas **apenas** pela unidade do profissional logado (`userUnitId`)
- Quando o usuário mudava a unidade no dropdown, as contas **não** eram atualizadas
- O select de contas permanecia vazio ou mostrava contas da unidade errada

## 🛠️ Correções Aplicadas

### 1. Alteração na função `fetchBankAccounts`
**Antes:**
```javascript
const fetchBankAccounts = useCallback(async () => {
  // Filtrava por userUnitId (fixo)
  if (userUnitId) {
    query = query.eq('unit_id', userUnitId);
  }
}, [userUnitId]);
```

**Depois:**
```javascript
const fetchBankAccounts = useCallback(async (unitId) => {
  // Filtra pela unidade passada como parâmetro (dinâmica)
  if (unitId) {
    query = query.eq('unit_id', unitId);
  }
}, []);
```

### 2. Atualização do useEffect
**Antes:**
```javascript
useEffect(() => {
  if (userUnitId) {
    fetchBankAccounts(); // Não reagia a mudanças de unidade
  }
}, [userUnitId]);
```

**Depois:**
```javascript
useEffect(() => {
  if (formData.unitId) {
    fetchBankAccounts(formData.unitId); // Reage a mudanças na unidade selecionada
  } else {
    setBankAccounts([]); // Limpa contas quando não há unidade
  }
}, [formData.unitId, fetchBankAccounts]);
```

### 3. Limpeza da conta selecionada ao trocar unidade
**Novo código:**
```javascript
const handleInputChange = (field, value) => {
  setFormData(prev => {
    const updated = { ...prev, [field]: value };
    
    // Se a unidade mudou, limpar a conta bancária selecionada
    if (field === 'unitId') {
      updated.accountId = '';
    }
    
    return updated;
  });
  
  // ... resto do código
};
```

### 4. Correção do aviso de "Nenhuma conta cadastrada"
**Antes:**
```javascript
{bankAccounts.length === 0 && userUnitId && (
  <p>Nenhuma conta bancária cadastrada para esta unidade.</p>
)}
```

**Depois:**
```javascript
{bankAccounts.length === 0 && formData.unitId && (
  <p>Nenhuma conta bancária cadastrada para esta unidade.</p>
)}
```

### 5. Remoção de código não utilizado
- Removida a variável `userUnitId` que não era mais necessária
- Simplificada a função `fetchUserUnit` para apenas pré-selecionar a unidade

## ✨ Comportamento Atual (✅ Correto)

1. **Ao abrir o modal:**
   - Unidade do usuário é pré-selecionada automaticamente
   - Contas da unidade são carregadas imediatamente

2. **Ao trocar a unidade:**
   - Contas bancárias são recarregadas automaticamente
   - Conta previamente selecionada é limpa
   - Lista de contas reflete a nova unidade selecionada

3. **Console de debug:**
   - Mensagem `"Contas bancárias carregadas para unidade {id}: [...]"` aparece no console
   - Facilita debugging e validação

## 🧪 Como Testar

1. Acesse a página **Financeiro** → aba **Receitas**
2. Clique em **"+ Nova Receita"**
3. Observe:
   - ✅ Unidade está pré-selecionada (sua unidade)
   - ✅ Contas bancárias aparecem no dropdown
4. Mude para outra unidade no dropdown **Unidade**
5. Observe:
   - ✅ Lista de contas é atualizada automaticamente
   - ✅ Campo "Conta Bancária" é limpo
   - ✅ Novas contas da unidade selecionada aparecem
6. Abra o Console do navegador (F12)
   - ✅ Veja as mensagens de debug com as contas carregadas

## 📊 Arquivos Modificados

- ✅ `src/pages/FinanceiroPage/components/NovaReceitaModal.jsx`
  - Alteração na função `fetchBankAccounts`
  - Atualização do `useEffect` de carregamento
  - Limpeza de conta ao trocar unidade
  - Remoção de código não utilizado
  - Adição de log de debug

## 🎯 Resultado Final

Agora o modal **Nova Receita** responde dinamicamente às mudanças de unidade, garantindo que apenas as contas bancárias da unidade selecionada sejam exibidas. Isso melhora a UX e previne erros de seleção incorreta.

---

**Data da correção:** 13/10/2025
**Arquivo principal:** `NovaReceitaModal.jsx`
**Status:** ✅ Pronto para uso
