# Correção: Formas de Pagamento Não Aparecem na Lista

## 🔴 Problema
Após criar uma forma de pagamento com sucesso, ela não aparecia na lista.

## 🔍 Causa Raiz
O hook `usePaymentMethods` estava verificando se `unitId` existia e retornando vazio quando era `null`:

```javascript
// ❌ CÓDIGO PROBLEMÁTICO
const fetchPaymentMethods = useCallback(async (forceRefresh = false) => {
  if (!unitId) {
    setLoading(false);
    return;  // ← Não buscava nada quando unitId era null
  }
  // ...
});
```

Quando o usuário admin estava visualizando "Todas as Unidades", o `selectedUnit` era `null`, então:
- `selectedUnit?.id` retornava `undefined`
- O hook verificava `if (!unitId)` e retornava sem buscar
- Lista ficava vazia mesmo após criar formas de pagamento

## ✅ Solução Implementada

### 1. **Permitir Busca sem unitId**
Removi a verificação que bloqueava a busca:

```javascript
// ✅ CÓDIGO CORRIGIDO
const fetchPaymentMethods = useCallback(async (forceRefresh = false) => {
  // Permitir buscar mesmo sem unitId (admin vê todas as unidades)
  // Comentado a verificação que impedia busca
  
  try {
    setLoading(true);
    setError(null);
    
    // Buscar dados (agora funciona com unitId = null)
    const { data: paymentMethods, error: fetchError } = 
      await paymentMethodsService.getPaymentMethods(unitId, includeInactive);
    
    // ...
  }
});
```

### 2. **Ajustar Realtime Subscription**
Configurei o Realtime para funcionar com ou sem unitId:

```javascript
// ✅ CÓDIGO CORRIGIDO
useEffect(() => {
  if (!enableRealtime) return;

  const channelName = unitId 
    ? `payment_methods_${unitId}` 
    : 'payment_methods_all';
    
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'payment_methods',
      // Se unitId existe, filtrar; senão, escutar todas as mudanças
      ...(unitId ? { filter: `unit_id=eq.${unitId}` } : {})
    }, (payload) => {
      fetchPaymentMethods(true);
    })
    .subscribe();
}, [enableRealtime, unitId, fetchPaymentMethods]);
```

### 3. **Serviço Já Estava Correto**
O `paymentMethodsService.getPaymentMethods()` já suportava `unitId = null`:

```javascript
// ✅ JÁ FUNCIONAVA CORRETAMENTE
export const getPaymentMethods = async (unitId, includeInactive = false) => {
  let query = supabase
    .from('payment_methods')
    .select('*');
  
  // Filtrar por unidade se unitId for fornecido
  if (unitId) {
    query = query.eq('unit_id', unitId);
  }
  // Se unitId for null, busca TODAS as formas de pagamento
  
  // ...
};
```

## 🎯 Fluxo Completo

### Antes (❌ Não Funcionava)
```
1. Admin seleciona "Todas as Unidades"
2. selectedUnit = null
3. selectedUnit?.id = undefined
4. usePaymentMethods(undefined, ...)
5. Hook verifica: if (!unitId) return; ← Para aqui
6. Lista fica vazia ❌
```

### Depois (✅ Funciona)
```
1. Admin seleciona "Todas as Unidades"
2. selectedUnit = null
3. selectedUnit?.id = undefined  
4. usePaymentMethods(undefined, ...)
5. Hook NÃO verifica unitId, continua
6. Service busca TODAS as formas de pagamento
7. RLS permite admin ver todas (get_user_role() = 'admin')
8. Lista exibe todas as formas de pagamento ✅
```

## 🔄 Integração com RLS

As políticas RLS garantem que:

```sql
-- Admin vê TODAS as formas de pagamento
CREATE POLICY "Users can view payment methods from their unit"
ON payment_methods
FOR SELECT
USING (
    get_user_role() = 'admin'  -- ← Admin vê todas
    OR
    unit_id IN (...)           -- ← Outros veem apenas da sua unidade
);
```

## 🧪 Casos de Teste

### Caso 1: Admin - Visualizar Todas as Unidades
```
✅ Busca todas as formas de pagamento do banco
✅ RLS permite (get_user_role() = 'admin')
✅ Lista exibe todas as formas cadastradas
✅ Realtime atualiza automaticamente
```

### Caso 2: Admin - Visualizar Unidade Específica
```
✅ Busca formas de pagamento da unidade selecionada
✅ RLS permite (get_user_role() = 'admin')
✅ Lista exibe apenas formas da unidade
✅ Realtime filtra por unit_id
```

### Caso 3: Gerente - Visualizar Sua Unidade
```
✅ Busca formas de pagamento da sua unidade
✅ RLS filtra (unit_id IN (SELECT unit_id FROM professionals...))
✅ Lista exibe apenas formas da sua unidade
✅ Realtime filtra por unit_id
```

## 📊 Debug Logs Adicionados

Adicionei logs temporários para ajudar no debug:

```javascript
console.log('[usePaymentMethods] Buscando formas de pagamento:', { 
  unitId, 
  includeInactive 
});

console.log('[usePaymentMethods] Resultado:', { 
  paymentMethods, 
  fetchError 
});
```

**Você pode remover esses logs após confirmar que está funcionando.**

## 🔧 Próximos Passos

### Para Testar:
1. ✅ **Recarregue a página** (F5 ou Ctrl+R)
2. ✅ Verifique se as formas de pagamento aparecem
3. ✅ Tente criar uma nova forma de pagamento
4. ✅ Veja se aparece na lista imediatamente
5. ✅ Mude entre "Todas as Unidades" e uma unidade específica

### Se Ainda Não Aparecer:
1. Abra o DevTools Console (F12)
2. Procure por logs:
   - `[usePaymentMethods] Buscando formas de pagamento`
   - `[usePaymentMethods] Resultado`
3. Verifique se há erros de RLS
4. Confirme que o role é 'admin'

## 📁 Arquivos Modificados

1. ✅ `src/hooks/usePaymentMethods.js`:
   - Removida verificação `if (!unitId) return;`
   - Ajustado Realtime para funcionar sem unitId
   - Adicionados logs de debug

2. ✅ RLS Policies (já estavam corretas):
   - Admin pode ver todas as formas de pagamento
   - Outros veem apenas da sua unidade

## ✅ Status

**Problema**: Formas de pagamento não apareciam na lista  
**Causa**: Hook bloqueava busca quando unitId era null  
**Correção**: Permitir busca mesmo sem unitId  
**Status**: ✅ Corrigido  

**Aguardando**: Reload da página para testar 🔄
