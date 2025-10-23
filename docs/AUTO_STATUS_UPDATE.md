# 🔄 Auto-Atualização de Status de Receitas

## 📋 Contexto

Receitas com status `Pending` cuja `expected_receipt_date` (Data Prevista de Recebimento) já passou devem automaticamente mudar para status `Received`.

**Exemplo:**

- Receita criada em 15/10/2025
- `expected_receipt_date`: 21/10/2025
- Status inicial: `Pending`
- Data atual: 22/10/2025
- **Status esperado:** `Received` ✅

---

## ✅ Solução Implementada

### 🎯 Abordagem: Frontend Auto-Update

Foi implementada uma função `autoUpdateOverdueReceitas()` no `financeiroService.js` que:

1. **Identifica receitas vencidas**
   - Busca receitas com `status = 'Pending'`
   - Filtra por `expected_receipt_date <= data_atual`
   - Apenas receitas ativas (`is_active = true`)

2. **Atualiza em lote**
   - Status: `Pending` → `Received`
   - `actual_receipt_date`: copia `expected_receipt_date`
   - `updated_at`: timestamp atual

3. **Execução automática**
   - Chamada automaticamente ao carregar receitas (`getReceitas`)
   - Execução não-bloqueante (promise catch)
   - Logs detalhados no console

---

## 📝 Código Implementado

### `src/services/financeiroService.js`

```javascript
/**
 * 🔄 AUTO-ATUALIZAÇÃO DE STATUS
 * Verifica receitas "Pending" cuja data prevista já passou e atualiza para "Received"
 * @private
 */
async autoUpdateOverdueReceitas() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeFmt = hoje.toISOString().split('T')[0];

    console.log('⏰ Auto-Update: Verificando receitas vencidas...', { data: hojeFmt });

    // Buscar receitas Pending com data prevista <= hoje
    const { data: receitas, error } = await supabase
      .from('revenues')
      .select('id, expected_receipt_date, status')
      .eq('status', 'Pending')
      .lte('expected_receipt_date', hojeFmt)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Auto-Update: Erro ao buscar receitas:', error);
      return { updated: 0, error };
    }

    if (!receitas || receitas.length === 0) {
      console.log('✅ Auto-Update: Nenhuma receita vencida encontrada');
      return { updated: 0, error: null };
    }

    console.log(`⚠️ Auto-Update: ${receitas.length} receitas vencidas encontradas. Atualizando...`);

    // Atualizar em lote
    const { error: updateError } = await supabase
      .from('revenues')
      .update({
        status: 'Received',
        actual_receipt_date: supabase.sql`expected_receipt_date`,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'Pending')
      .lte('expected_receipt_date', hojeFmt)
      .eq('is_active', true);

    if (updateError) {
      console.error('❌ Auto-Update: Erro ao atualizar receitas:', updateError);
      return { updated: 0, error: updateError };
    }

    console.log(`✅ Auto-Update: ${receitas.length} receitas atualizadas para "Received"`);
    return { updated: receitas.length, error: null };
  } catch (err) {
    console.error('❌ Auto-Update: Erro inesperado:', err);
    return { updated: 0, error: err.message };
  }
}

async getReceitas(filters = {}, pagination = null) {
  // ...

  // 🔄 Executar auto-update antes de buscar (sem bloquear se falhar)
  this.autoUpdateOverdueReceitas().catch(err => {
    console.warn('⚠️ Auto-update falhou (não bloqueante):', err);
  });

  // ... resto do código
}
```

---

## 🔍 Fluxo de Execução

### 1️⃣ Usuário acessa página de Receitas

```
ReceitasAccrualTab → fetchReceitas() → financeiroService.getReceitas()
```

### 2️⃣ Auto-Update Automático

```javascript
getReceitas() {
  // ANTES de buscar dados:
  autoUpdateOverdueReceitas()
    .then(result => console.log(`${result.updated} receitas atualizadas`))
    .catch(err => console.warn('Auto-update falhou:', err));

  // DEPOIS busca normalmente
  return revenueRepository.findAll(filters);
}
```

### 3️⃣ SQL Executado

```sql
-- Busca receitas vencidas
SELECT id, expected_receipt_date, status
FROM revenues
WHERE status = 'Pending'
  AND expected_receipt_date <= '2025-01-22' -- data de hoje
  AND is_active = true;

-- Atualiza em lote
UPDATE revenues
SET status = 'Received',
    actual_receipt_date = expected_receipt_date,
    updated_at = NOW()
WHERE status = 'Pending'
  AND expected_receipt_date <= '2025-01-22'
  AND is_active = true;
```

---

## 📊 Logs Esperados

### Sem receitas vencidas:

```
⏰ Auto-Update: Verificando receitas vencidas... { data: '2025-01-22' }
✅ Auto-Update: Nenhuma receita vencida encontrada
```

### Com receitas vencidas:

```
⏰ Auto-Update: Verificando receitas vencidas... { data: '2025-01-22' }
⚠️ Auto-Update: 3 receitas vencidas encontradas. Atualizando...
✅ Auto-Update: 3 receitas atualizadas para "Received"
```

### Em caso de erro:

```
⏰ Auto-Update: Verificando receitas vencidas... { data: '2025-01-22' }
❌ Auto-Update: Erro ao buscar receitas: { message: 'Network error' }
⚠️ Auto-update falhou (não bloqueante): Network error
```

---

## ✅ Vantagens da Solução

### 🟢 Pros

1. **Automático**: Executa ao abrir página de receitas
2. **Transparente**: Usuário não precisa fazer nada
3. **Eficiente**: Atualização em lote (single query)
4. **Não-bloqueante**: Se falhar, página continua funcionando
5. **Logs detalhados**: Fácil debug no console
6. **Sem migrations**: Apenas código frontend

### 🔴 Limitações

- Só atualiza quando usuário abre a página
- Não executa em background (sem CRON)
- Múltiplos usuários = múltiplas execuções

### 🔄 Alternativa Futura (Backend)

Para ambiente de produção, considerar implementar uma **Supabase Edge Function** com CRON diário:

```javascript
// supabase/functions/auto-update-revenues/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

serve(async req => {
  const supabase = createClient(/* ... */);

  const hoje = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('revenues')
    .update({
      status: 'Received',
      actual_receipt_date: supabase.sql`expected_receipt_date`,
    })
    .eq('status', 'Pending')
    .lte('expected_receipt_date', hoje);

  return new Response(JSON.stringify({ success: !error }));
});
```

**CRON Schedule:**

```
0 0 * * * -- Executar diariamente às 00:00
```

---

## 🧪 Como Testar

### 1️⃣ Criar receita vencida manualmente no Supabase

```sql
INSERT INTO revenues (
  unit_id,
  party_id,
  payment_method_id,
  value,
  expected_receipt_date,
  status,
  description
) VALUES (
  'uuid-da-unidade',
  'uuid-do-cliente',
  'uuid-forma-pgto',
  150.00,
  '2025-01-20', -- data no passado
  'Pending', -- status pendente
  'Teste auto-update'
);
```

### 2️⃣ Acessar página de Receitas

- Abrir `ReceitasAccrualTab`
- Verificar console do navegador

### 3️⃣ Verificar logs

```
⏰ Auto-Update: Verificando receitas vencidas... { data: '2025-01-22' }
⚠️ Auto-Update: 1 receitas vencidas encontradas. Atualizando...
✅ Auto-Update: 1 receitas atualizadas para "Received"
```

### 4️⃣ Confirmar atualização

- Status mudou para `Received` ✅
- `actual_receipt_date` = `expected_receipt_date` ✅
- KPI "Recebido" incrementou ✅

---

## 📚 Referências

- **Arquivo modificado**: `src/services/financeiroService.js`
- **Função principal**: `autoUpdateOverdueReceitas()`
- **Chamada automática**: `getReceitas()`
- **Tabela**: `revenues`
- **Campos atualizados**: `status`, `actual_receipt_date`, `updated_at`

---

## 🎯 Resultado Final

✅ Receitas com data prevista no passado mudam automaticamente de `Pending` para `Received`  
✅ Execução transparente ao carregar página  
✅ Logs detalhados para auditoria  
✅ Não bloqueia UI se falhar  
✅ Performance otimizada (batch update)

---

**Autor:** Andrey Viana  
**Data:** 22/01/2025  
**Versão:** 1.0
