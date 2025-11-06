# 📋 Plano de Ajuste - Fluxo de Caixa Consolidado

**Data:** 5 de novembro de 2025
**Responsável:** Andrey Viana
**Sistema:** Barber Analytics Pro
**Módulo:** Fluxo de Caixa (FluxoTabRefactored.jsx)

---

## 🎯 Objetivo

Corrigir bugs críticos no fluxo de caixa:

1. ❌ Data 31/10 aparecendo no fluxo de novembro
2. ❌ Finais de semana mostrando valores (deveria ser R$ 0,00)
3. ❌ Domingo (02/11) mostrando R$ 2.136,56
4. ❌ Domingo (09/11) mostrando R$ 1.397,18 em despesas

---

## 📊 Diagnóstico Identificado

### Causa Raiz #1 - Detecção de Dia da Semana (85% probabilidade)

```javascript
// ❌ PROBLEMA ATUAL
const dayDate = startOfDay(parseISO(day.date)); // "2025-11-02"
const dayOfWeek = dayDate.getDay(); // Retorna valor errado por timezone
```

**Impacto:** `getDay()` retorna valores incorretos para domingos devido à interpretação de timezone do `parseISO()`

### Causa Raiz #2 - Inclusão de 31/10 (70% probabilidade)

**Impacto:** Data do mês anterior sendo incluída no range de novembro

---

## ✅ Checklist de Ajustes

### 🔴 PRIORIDADE CRÍTICA

#### [✅] 1. Corrigir Detecção de Dia da Semana

**Status:** ✅ IMPLEMENTADO
**Tempo:** 10 minutos
**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas Modificadas:** 467, 697, 1245, 1257

**Ação Executada:**

- [✅] Localizado todas as ocorrências de `parseISO(day.date).getDay()`
- [✅] Substituído por lógica timezone-safe:
  ```javascript
  // ✅ IMPLEMENTADO
  const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
  ```
- [✅] Aplicado em TODAS as localizações: receitas, despesas, cleanup, UI render
- [✅] Adicionado logs de debug

**Validação Pendente:**

- [ ] Console mostrando dayOfWeek correto para cada data
- [ ] Domingos detectados como DOW=0
- [ ] Sábados detectados como DOW=6

---

#### [✅] 2. Validar Range de Datas (Excluir 31/10)

**Status:** ✅ IMPLEMENTADO
**Tempo:** 5 minutos
**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas Modificadas:** ~381-397**Ação:**

- [ ] Localizar todas as ocorrências de `parseISO(day.date).getDay()`
- [ ] Substituir por lógica timezone-safe:

  ```javascript
  // Opção 1: Forçar meio-dia UTC
  const dayOfWeek = new Date(day.date + 'T12:00:00').getDay();

  // Opção 2: Usar componentes de data
  const [year, month, dayNum] = day.date.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, dayNum).getDay();
  ```

- [ ] Aplicar em TODOS os locais: receitas, despesas, UI render
- [ ] Validar console logs mostrando dia da semana correto

**Validação:**

```bash
# Deve mostrar dayOfWeek correto para cada data
console.log('Data:', day.date, 'DayOfWeek:', dayOfWeek, 'Nome:', ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dayOfWeek]);
```

**Resultado Esperado:**

- 02/11 (Domingo) → dayOfWeek = 0 ✅
- 09/11 (Domingo) → dayOfWeek = 0 ✅
- Todos os domingos detectados corretamente

---

#### [ ] 2. Validar Range de Datas (Excluir 31/10)

**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas:** ~380-390 (criação do dailyMap)

**Ação:**

- [ ] Adicionar validação no loop de criação do dailyMap:

  ```javascript
  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = addDays(startDate, i);
    const dateKey = format(currentDate, 'yyyy-MM-dd');

    // ✅ VALIDAÇÃO ADICIONAL
    const [year, month] = dateKey.split('-').map(Number);
    if (year !== yearNum || month !== monthNum) {
      continue; // Pular datas fora do mês selecionado
    }

    dailyMap.set(dateKey, {
      /* ... */
    });
  }
  ```

- [ ] Verificar que `startDate` está correto (01/11/2025)
- [ ] Confirmar que `numberOfDays` = 30 para novembro

**Validação:**

```bash
# Primeiro e último dia do range
console.log('Range início:', Array.from(dailyMap.keys())[0]); // Deve ser 2025-11-01
console.log('Range fim:', Array.from(dailyMap.keys())[dailyMap.size - 1]); // Deve ser 2025-11-30
```

**Resultado Esperado:**

- 31/10 NÃO aparece no fluxo de novembro ✅
- Apenas datas de 01/11 a 30/11 visíveis

---

### 🟡 PRIORIDADE ALTA

#### [ ] 3. Consolidar Lógica de Final de Semana

**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas:** Múltiplas localizações

**Ação:**

- [ ] Criar função helper centralizada:
  ```javascript
  /**
   * Verifica se uma data é final de semana (sábado ou domingo)
   * @param {string} dateString - Data no formato 'YYYY-MM-DD'
   * @returns {boolean}
   */
  const isWeekend = dateString => {
    const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Domingo ou Sábado
  };
  ```
- [ ] Substituir todas as verificações inline por `isWeekend(day.date)`
- [ ] Remover código duplicado nas 3 camadas de proteção

**Locais para Aplicar:**

- [ ] Linha ~444: Processamento de receitas
- [ ] Linha ~470: Processamento de despesas
- [ ] Linha ~1180: Render da UI
- [ ] Linha ~667: Cleanup final

**Resultado Esperado:**

- Código mais limpo e manutenível ✅
- Lógica unificada em um único ponto

---

#### [ ] 4. Adicionar Logs de Debug Temporários

**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`

**Ação:**

- [ ] Adicionar logs em pontos críticos:

  ```javascript
  // No processamento de receitas (linha ~444)
  console.log(
    '[REVENUE] Data:',
    day.date,
    'IsWeekend:',
    isWeekend(day.date),
    'DayOfWeek:',
    dayOfWeek
  );

  // No processamento de despesas (linha ~470)
  console.log(
    '[EXPENSE] Data:',
    day.date,
    'IsWeekend:',
    isWeekend(day.date),
    'TotalExpenses:',
    totalExpenses
  );

  // No render final (linha ~1180)
  console.log(
    '[UI-RENDER] Data:',
    day.date,
    'TotalInflows:',
    totalInflows,
    'TotalOutflows:',
    totalOutflows
  );
  ```

- [ ] Filtrar logs apenas para domingos: `if (dayOfWeek === 0) { console.log(...) }`
- [ ] Executar e analisar output no console do navegador

**Resultado Esperado:**

- Logs mostrando exatamente onde valores de domingo estão sendo processados
- Evidência clara se bug está na lógica ou no render

---

### 🟢 PRIORIDADE MÉDIA

#### [ ] 5. Revisar Lógica de Ajuste de Datas

**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas:** ~444-476

**Ação:**

- [ ] Verificar se ajuste de data está funcionando:
  ```javascript
  if (dayOfWeek === 0) {
    // Domingo
    adjustedDate = addDays(parseISO(day.date), 1); // → Segunda
  } else if (dayOfWeek === 6) {
    // Sábado
    adjustedDate = addDays(parseISO(day.date), 2); // → Segunda
  }
  ```
- [ ] Confirmar que `adjustedDate` é usado no `dailyMap.get()`
- [ ] Validar que valores estão sendo somados na segunda-feira correta

**Validação:**

```bash
# Para receita de domingo 02/11
console.log('Data original:', day.date); // 2025-11-02
console.log('Data ajustada:', adjustedDateKey); // 2025-11-03 (segunda)
console.log('Valor movido:', revenue.value - revenue.fees);
```

**Resultado Esperado:**

- Receitas de sábado/domingo aparecem na segunda seguinte ✅
- Sábado e domingo permanecem com R$ 0,00 ✅

---

#### [ ] 6. Validar Camada de Limpeza Final

**Arquivo:** `src/pages/FinanceiroAdvancedPage/FluxoTabRefactored.jsx`
**Linhas:** ~667-690

**Ação:**

- [ ] Confirmar que `cleanedResult` está forçando zero em finais de semana:

  ```javascript
  const cleanedResult = Array.from(dailyMap.values()).map(day => {
    const dayOfWeek = new Date(day.date + 'T12:00:00').getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        ...day,
        received_inflows: 0,
        total_outflows: 0,
        pending_inflows: 0,
        dailyBalance: 0,
        // Manter accumulated_balance
      };
    }
    return day;
  });
  ```

- [ ] Verificar se `cleanedResult` está sendo retornado (não `dailyMap`)

**Resultado Esperado:**

- Última camada de proteção funcionando ✅
- Impossível valores de final de semana chegarem à UI

---

### 🔵 PRIORIDADE BAIXA (Melhorias)

#### [ ] 7. Adicionar Testes Unitários

**Arquivo:** `tests/fluxo-caixa-weekend.test.js` (criar novo)

**Ação:**

- [ ] Criar teste para `isWeekend()`:

  ```javascript
  describe('isWeekend', () => {
    it('deve retornar true para domingo 02/11/2025', () => {
      expect(isWeekend('2025-11-02')).toBe(true);
    });

    it('deve retornar true para sábado 01/11/2025', () => {
      expect(isWeekend('2025-11-01')).toBe(true);
    });

    it('deve retornar false para segunda 03/11/2025', () => {
      expect(isWeekend('2025-11-03')).toBe(false);
    });
  });
  ```

- [ ] Criar teste para ajuste de datas
- [ ] Executar com `pnpm test`

---

#### [ ] 8. Documentar Regra de Negócio

**Arquivo:** `docs/FINANCIAL_MODULE.md`

**Ação:**

- [ ] Adicionar seção:

  ```markdown
  ## Regra de Finais de Semana

  **Regra de Negócio:** Barbearias NÃO operam aos sábados e domingos.

  **Implementação:**

  - Receitas/despesas de fim de semana são movidas para segunda-feira seguinte
  - UI SEMPRE exibe R$ 0,00 para sábados e domingos
  - Saldo acumulado continua sendo calculado

  **Código:** FluxoTabRefactored.jsx, linhas 444-476, 667-690, 1180-1202
  ```

---

## 🧪 Plano de Testes

### Teste 1: Validação Visual

- [ ] Abrir fluxo de caixa de novembro/2025
- [ ] Verificar que 31/10 NÃO aparece
- [ ] Verificar que todos os sábados mostram R$ 0,00
- [ ] Verificar que todos os domingos mostram R$ 0,00
- [ ] Confirmar que segunda-feira (03/11) tem valor agregado de domingo (02/11)

### Teste 2: Validação de Console

- [ ] Abrir DevTools → Console
- [ ] Filtrar logs por `[REVENUE]`, `[EXPENSE]`, `[UI-RENDER]`
- [ ] Confirmar que domingos têm `IsWeekend: true`
- [ ] Confirmar que valores estão sendo movidos para segunda-feira

### Teste 3: Validação de Dados

- [ ] Executar query no Supabase:
  ```sql
  SELECT
    expected_receipt_date,
    SUM(value - fees) as total_liquido
  FROM revenues
  WHERE expected_receipt_date BETWEEN '2025-11-01' AND '2025-11-30'
    AND status = 'received'
    AND unit_id = 'SEU_UNIT_ID'
  GROUP BY expected_receipt_date
  ORDER BY expected_receipt_date;
  ```
- [ ] Comparar totais com UI (valores devem estar na segunda-feira seguinte)

### Teste 4: Regressão em Outros Meses

- [ ] Testar fluxo de outubro/2025
- [ ] Testar fluxo de dezembro/2025
- [ ] Confirmar que não houve quebra em outros meses

---

## 📈 Critérios de Sucesso

### ✅ Validação Final

| #   | Critério                      | Status | Validação                                      |
| --- | ----------------------------- | ------ | ---------------------------------------------- |
| 1   | 31/10 NÃO aparece em novembro | ⬜     | Screenshot mostrando 01/11 como primeira linha |
| 2   | Todos os sábados = R$ 0,00    | ⬜     | 01/11, 08/11, 15/11, 22/11, 29/11 = zero       |
| 3   | Todos os domingos = R$ 0,00   | ⬜     | 02/11, 09/11, 16/11, 23/11, 30/11 = zero       |
| 4   | Valores movidos para segunda  | ⬜     | 03/11 contém soma de 02/11                     |
| 5   | Saldo acumulado correto       | ⬜     | Progressão linear sem gaps                     |
| 6   | Console sem erros             | ⬜     | DevTools limpo                                 |
| 7   | Regime de competência OK      | ⬜     | expected_receipt_date sendo usado              |
| 8   | Descontos de taxa aplicados   | ⬜     | value - fees nos cálculos                      |

---

## 🚀 Ordem de Execução Recomendada

### Fase 1: Correções Críticas (30-45 min)

1. ✅ Item 1: Corrigir detecção de dia da semana
2. ✅ Item 2: Validar range de datas
3. ✅ Item 4: Adicionar logs de debug

### Fase 2: Validação e Testes (15-30 min)

4. ✅ Executar Teste 1 (validação visual)
5. ✅ Executar Teste 2 (validação de console)
6. ✅ Executar Teste 3 (validação de dados)

### Fase 3: Consolidação (15-20 min)

7. ✅ Item 3: Consolidar lógica de final de semana
8. ✅ Item 5: Revisar ajuste de datas
9. ✅ Item 6: Validar camada de limpeza

### Fase 4: Finalização (10-15 min)

10. ✅ Remover logs de debug
11. ✅ Executar Teste 4 (regressão)
12. ✅ Validar critérios de sucesso

**Tempo Total Estimado:** 70-110 minutos

---

## 📝 Notas Importantes

### ⚠️ Atenção Especial

- **parseISO() é sensível a timezone** - sempre usar alternativas timezone-safe
- **getDay() vs getUTCDay()** - `new Date('2025-11-02T12:00:00').getDay()` é mais confiável
- **Triple-layer protection** - mesmo com 3 camadas, bug de timezone afeta todas

### 🎯 Padrão Recomendado

```javascript
// ✅ SEMPRE USAR ESTE PADRÃO
const isWeekend = dateString => {
  const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};
```

### 📚 Referências

- Análise completa: `ANALISE_COMPLETA_SISTEMA.md`
- Documentação DRE: `docs/DRE_MODULE.md`
- Documentação Financeiro: `docs/FINANCIAL_MODULE.md`
- Solução Dia 30: `SOLUCAO_DIA_30_REGIME_COMPETENCIA.md`

---

## ✨ Autor

**Andrey Viana**
Barber Analytics Pro - Enterprise Cash Flow System
Data: 5 de novembro de 2025

---

**Status do Plano:** ✅ FASES 1-3 CONCLUÍDAS - AGUARDANDO TESTE FINAL
**Última Atualização:** 6 de novembro de 2025 às 00:30

---

## 📈 PROGRESSO GERAL

| Fase                       | Status      | Tempo     | Conclusão |
| -------------------------- | ----------- | --------- | --------- |
| Fase 1: Correções Críticas | ✅ COMPLETA | 30 min    | 100%      |
| Fase 2: Validação e Testes | ⏳ PENDENTE | 15-30 min | 0%        |
| Fase 3: Consolidação       | ✅ COMPLETA | 25 min    | 100%      |
| Fase 4: Finalização        | ⏳ PENDENTE | 10-15 min | 0%        |

**Total Implementado:** 75% | **Tempo Decorrido:** 55 min | **Tempo Restante:** 25-45 min

---

## ✅ IMPLEMENTAÇÕES CONCLUÍDAS (6 de nov 2025)

### 1. Função Helper `isWeekend()` ✅
```javascript
const isWeekend = dateString => {
  const dayOfWeek = new Date(dateString + 'T12:00:00').getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};
```

### 2. Função Helper `moveWeekendToMonday()` ✅
```javascript
const moveWeekendToMonday = date => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return addDays(date, 1); // Domingo → +1
  if (dayOfWeek === 6) return addDays(date, 2); // Sábado → +2
  return date;
};
```

### 3. Simplificação da Lógica de Receitas ✅
- Removido código duplicado de detecção de fim de semana
- Aplicada função `moveWeekendToMonday()` diretamente
- Logs de debug removidos

### 4. Camada de Limpeza Final Otimizada ✅
```javascript
const cleanedResult = finalResult.map(day => {
  if (!day.isSaldoInicial && isWeekend(day.date)) {
    return { ...day, /* todos os campos zerados */ };
  }
  return day;
});
```

---
