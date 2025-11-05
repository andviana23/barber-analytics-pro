# 🐛 Correção: Erro "invalid input syntax for type uuid: undefined" na Página Contas Bancárias

## 🔍 Problema Identificado

**Data:** 5 de novembro de 2025
**Erro:** `Falha ao buscar resumo financeiro: invalid input syntax for type uuid: "undefined"`
**Localização:** Página Financeiro Avançado > Contas Bancárias

### 📋 Descrição do Erro

O erro ocorria quando o componente `FinancialSeparationCard` tentava buscar dados da view `vw_financial_summary_separated` passando `unit_id=eq.undefined` como parâmetro, resultando em:

```
cwfrtqtienguzwsybvwm.supabase.co/rest/v1/vw_financial_summary_separated?select=*&unit_id=eq.undefined:1
Failed to load resource: the server responded with a status of 400 ()
```

### 🔍 Causa Raiz

O problema estava na cadeia de passagem de props:

1. **`ContasBancariasTab`** → `FinancialSeparationDemo` (❌ não passava `unitId`)
2. **`FinancialSeparationDemo`** → `FinancialSeparationCard` (❌ não passava `unitId`)
3. **`FinancialSeparationCard`** chamava `getFinancialSummarySeparated()` sem parâmetro `unitId`

```javascript
// ❌ PROBLEMA: Chamada sem unitId
const { data: summaryData, error: summaryError } =
  await bankAccountsService.getFinancialSummarySeparated();
```

## 🔧 Solução Implementada

### 1. **Atualização do `FinancialSeparationCard`**

**Arquivo:** `src/organisms/FinancialSeparationCard.jsx`

```javascript
// ✅ CORREÇÃO: Adicionado parâmetro unitId
const FinancialSeparationCard = ({ accountId, accountName, unitId }) => {
  const loadFinancialData = useCallback(async () => {
    // ✅ Passando unitId para a função
    const { data: summaryData, error: summaryError } =
      await bankAccountsService.getFinancialSummarySeparated(unitId);

    // ...resto do código
  }, [accountId, unitId]);

  useEffect(() => {
    if (accountId && unitId) {
      // ✅ Validação de ambos os parâmetros
      loadFinancialData();
    }
  }, [accountId, unitId, loadFinancialData]);
};

// ✅ PropTypes adicionados
FinancialSeparationCard.propTypes = {
  accountId: PropTypes.string.isRequired,
  accountName: PropTypes.string.isRequired,
  unitId: PropTypes.string.isRequired,
};
```

### 2. **Atualização do `FinancialSeparationDemo`**

**Arquivo:** `src/molecules/FinancialSeparationDemo.jsx`

```javascript
// ✅ CORREÇÃO: Recebendo e passando unitId
const FinancialSeparationDemo = ({ accounts, unitId }) => {
  if (!accounts || accounts.length === 0 || !unitId) {
    // ✅ Validação de unitId
    return null;
  }

  return (
    <FinancialSeparationCard
      accountId={firstActiveAccount.id}
      accountName={firstActiveAccount.name}
      unitId={unitId} // ✅ Passando unitId
    />
  );
};

// ✅ PropTypes atualizados
FinancialSeparationDemo.propTypes = {
  accounts: PropTypes.arrayOf(/* ... */),
  unitId: PropTypes.string.isRequired,
};
```

### 3. **Atualização do `ContasBancariasTab`**

**Arquivo:** `src/pages/FinanceiroAdvancedPage/ContasBancariasTab.jsx`

```javascript
// ✅ CORREÇÃO: Passando unitId do globalFilters
<FinancialSeparationDemo
  accounts={filteredAndSortedAccounts}
  unitId={globalFilters?.unitId}
/>;

// ✅ PropTypes adicionados
ContasBancariasTab.propTypes = {
  globalFilters: PropTypes.shape({
    unitId: PropTypes.string,
  }),
};
```

## ✅ Resultados da Correção

### 🎯 Problemas Resolvidos

1. **✅ Erro UUID Eliminado**: Não há mais tentativas de consulta com `unit_id=undefined`
2. **✅ Validação Robusta**: Componente só renderiza se `unitId` estiver presente
3. **✅ PropTypes Completos**: Todos os parâmetros devidamente tipados
4. **✅ Fluxo de Dados Claro**: Cadeia de passagem de props documentada

### 🔄 Fluxo Corrigido

```
ContasBancariasTab (globalFilters.unitId)
    ↓ passa unitId
FinancialSeparationDemo (unitId)
    ↓ passa unitId
FinancialSeparationCard (unitId)
    ↓ chama com unitId
bankAccountsService.getFinancialSummarySeparated(unitId)
    ↓ consulta SQL válida
vw_financial_summary_separated WHERE unit_id = UUID_VÁLIDO
```

### 🧪 Validação

- **Logs Positivos**: Não há mais mensagens de erro "invalid input syntax for type uuid"
- **Consulta SQL**: `unit_id=eq.[UUID_VÁLIDO]` em vez de `unit_id=eq.undefined`
- **Renderização**: Componente só exibe dados quando `unitId` é válido

## 📚 Aprendizados

### 🎯 Principais Lições

1. **Validação de Props**: Sempre validar parâmetros obrigatórios antes de fazer consultas
2. **Cadeia de Props**: Documentar e validar toda a cadeia de passagem de propriedades
3. **Debugging**: Logs de console ajudam a identificar parâmetros undefined
4. **PropTypes**: Essenciais para identificar problemas de tipagem em desenvolvimento

### 🔧 Boas Práticas Aplicadas

1. **Fail Fast**: Componente retorna `null` se parâmetros essenciais estão ausentes
2. **Logs Informativos**: Console logs removidos após correção
3. **Tipagem Explícita**: PropTypes para todos os parâmetros
4. **Documentação**: Comentários explicando a correção

## 🚀 Próximos Passos

1. **✅ Concluído**: Teste da correção em produção
2. **📋 Recomendado**: Audit similar em outros componentes que fazem consultas com `unitId`
3. **🔍 Sugestão**: Implementar helper para validação de UUID em serviços

---

**✅ Status:** Correção implementada e testada com sucesso
**🎯 Impacto:** Eliminação completa do erro de UUID inválido na página de Contas Bancárias
**📅 Data de Conclusão:** 5 de novembro de 2025
