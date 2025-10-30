# 🔍 Diagnóstico: Profissionais e Formas de Pagamento não aparecem no Modal

## 📌 Problemas Identificados

### ✅ 1. Erro de Sintaxe JSX (RESOLVIDO)

- **Problema**: Tag `<Button>` não estava fechada corretamente no `OrderModal.jsx`
- **Solução**: Estrutura JSX corrigida, `Alert` movido para fora da `div` do botão
- **Status**: ✅ **CORRIGIDO**

---

### 🔍 2. Profissionais não aparecem no `<select>`

**Fluxo de carregamento:**

```
OrdersPage.jsx
  ├── unitId (de UnitContext)
  ├── useProfissionais() hook
  │   └── ProfissionaisService.getProfissionais({ unitId })
  │       └── Supabase query com RLS policies
  ├── activeProfessionals (filtro: is_active + unit_id)
  └── modalProfessionals (adiciona fallback se editando)
      └── Passa para OrderModal via prop
```

**Possíveis causas:**

#### A) Unit ID não está correto

```javascript
// OrdersPage.jsx linha ~64
const { selectedUnit } = useUnit();
const unitId = selectedUnit?.id || null;
```

- ❓ Verificar se `selectedUnit` está definido
- ❓ Verificar se o usuário selecionou uma unidade no Navbar

#### B) Hook useProfissionais não filtra por unitId

```javascript
// OrdersPage.jsx linha ~131
useEffect(() => {
  if (unitId) {
    updateProfessionalFilters({ unitId });
  }
}, [unitId, updateProfessionalFilters]);
```

- ❓ Verificar se `updateFilters` está atualizando corretamente
- ❓ Ver se `loadProfissionais` é chamado após atualizar filtros

#### C) RLS Policy bloqueando acesso

```javascript
// ProfissionaisService.js linha ~85-95
const { data, error } = await supabase
  .from('professionals')
  .select(
    `
    *,
    unit:units(id, name)
  `
  )
  .eq('unit_id', filters.unitId);
```

- ❓ Verificar políticas RLS da tabela `professionals`
- ❓ Ver se o usuário tem permissão para acessar profissionais da unidade

#### D) Filtro is_active muito restritivo

```javascript
// OrdersPage.jsx linha ~235-241
const activeProfessionals = useMemo(
  () =>
    (profissionais || []).filter(
      professional =>
        professional.is_active && (!unitId || professional.unit_id === unitId)
    ),
  [profissionais, unitId]
);
```

- ❓ Verificar se há profissionais **ativos** cadastrados na unidade
- ❓ Testar removendo temporariamente o filtro `is_active`

---

### 💳 3. Formas de Pagamento não aparecem

**Fluxo de carregamento:**

```
OrdersPage.jsx
  ├── loadFinancialDependencies() (useCallback)
  │   └── getPaymentMethods(unitId)
  │       └── Supabase query em 'payment_methods'
  └── paymentMethods (estado)
      └── Passa para OrderModal via prop
```

**Possíveis causas:**

#### A) Nenhuma forma de pagamento cadastrada

```sql
-- Verificar no banco:
SELECT * FROM payment_methods WHERE unit_id = '<seu-unit-id>' AND is_active = true;
```

#### B) RLS Policy bloqueando

```javascript
// paymentMethodsService.js
const { data, error } = await supabase
  .from('payment_methods')
  .select('*')
  .eq('unit_id', unitId)
  .eq('is_active', true);
```

- ❓ Verificar RLS policies de `payment_methods`
- ❓ Ver se o usuário logado tem permissão de leitura

---

## 🔧 Debug Adicionado

### Logs no Console do Navegador

Agora ao abrir o modal, você verá logs como:

```javascript
📊 OrdersPage - Profissionais Debug:
  unitId: "abc-123-def"
  profissionais (raw): 5
  profissionais: [{ id: "...", name: "João", ... }, ...]
  activeProfessionals: 3
  professionalsLoading: false
  professionalsError: null

💳 OrdersPage - Payment Methods Debug:
  unitId: "abc-123-def"
  paymentMethods: 2
  paymentMethods: [{ id: "...", name: "Dinheiro", ... }, ...]
  paymentMethodsLoading: false
  financialError: null

🔍 OrderModal DEBUG:
  unitId: "abc-123-def"
  professionals (total): 3
  professionals: [...]
  paymentMethods (total): 2
  paymentMethods: [...]
  clients (total): 10
```

---

## 📋 Checklist de Verificação

### 1. ✅ Abrir DevTools (F12) e ir na aba Console

### 2. ✅ Clicar em "Nova Comanda"

### 3. ✅ Observar os logs:

**Se `unitId` for `null` ou `undefined`:**

```
❌ Problema: Nenhuma unidade selecionada
✅ Solução: Selecionar uma unidade no navbar
```

**Se `profissionais (raw): 0`:**

```
❌ Problema: Hook não está carregando profissionais
✅ Verificar:
  1. Tabela 'professionals' tem registros?
  2. RLS policies permitem SELECT?
  3. Hook está chamando loadProfissionais?
```

**Se `profissionais (raw): 5` mas `activeProfessionals: 0`:**

```
❌ Problema: Filtro is_active ou unit_id está eliminando todos
✅ Solução:
  1. Verificar se há profissionais com is_active = true
  2. Verificar se unit_id bate com a unidade selecionada
```

**Se `paymentMethods: 0`:**

```
❌ Problema: Nenhuma forma de pagamento cadastrada
✅ Solução:
  1. Ir em Financeiro > Formas de Pagamento
  2. Cadastrar ao menos uma forma ativa
  3. Ou verificar RLS policies
```

---

## 🛠️ Soluções Rápidas

### Solução 1: Verificar unidade selecionada

```javascript
// No console do navegador:
localStorage.getItem('selectedUnit');
```

### Solução 2: Testar query direto no Supabase

```javascript
// No console do navegador:
import { supabase } from './services/supabase';

// Testar profissionais
const { data, error } = await supabase
  .from('professionals')
  .select('*')
  .eq('is_active', true);
console.log('Profissionais:', data, error);

// Testar formas de pagamento
const { data: pm, error: pmError } = await supabase
  .from('payment_methods')
  .select('*')
  .eq('is_active', true);
console.log('Payment Methods:', pm, pmError);
```

### Solução 3: Verificar RLS no Supabase Dashboard

```
1. Ir em https://supabase.com/dashboard
2. Selecionar projeto
3. Authentication > Policies
4. Verificar policies de 'professionals' e 'payment_methods'
5. Garantir que há policy de SELECT para o role do usuário
```

---

## 📞 Próximos Passos

1. **Abra o sistema e clique em "Nova Comanda"**
2. **Cole aqui os logs que aparecerem no console**
3. **Baseado nos logs, poderei identificar exatamente onde está o problema**

---

## 🎯 Hipótese Mais Provável

Com base na análise do código, o problema mais comum é:

**Nenhum profissional ativo cadastrado na unidade selecionada**

Para confirmar:

```sql
-- Rodar no Supabase SQL Editor:
SELECT
  p.id,
  p.name,
  p.is_active,
  p.unit_id,
  u.name as unit_name
FROM professionals p
LEFT JOIN units u ON u.id = p.unit_id
WHERE p.is_active = true
ORDER BY u.name, p.name;
```

Se retornar vazio ou não retornar profissionais da unidade atual, o problema está confirmado.

**Solução**: Cadastrar profissionais ativos para a unidade.

---

## 📝 Observações Técnicas

### Por que o código está correto mas não funciona?

O código está **arquiteturalmente correto**:

- ✅ Usa hooks separados por responsabilidade
- ✅ Filtra dados com `useMemo` para performance
- ✅ Passa props corretamente ao modal
- ✅ Valida dados antes de renderizar

O problema é **de dados**, não de código:

- ❌ Pode não haver registros no banco
- ❌ Pode haver erro de RLS bloqueando
- ❌ Pode haver filtro eliminando registros válidos

---

**Autor**: GitHub Copilot  
**Data**: 28/10/2025  
**Módulo**: Gestão de Comandas
