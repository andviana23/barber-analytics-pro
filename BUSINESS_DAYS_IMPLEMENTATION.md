# Business Days Implementation - Payment Methods

## Resumo das Alterações

Este documento descreve as melhorias implementadas no modal de cadastro de formas de pagamento (`NovaFormaPagamentoModal`).

## Alterações Realizadas

### 1. Campo "Unidade" Adicionado

**Objetivo**: Permitir vincular cada forma de pagamento a uma unidade específica.

**Implementação**:
- Novo campo `unit_id` no estado do formulário
- Dropdown com lista de todas as unidades ativas
- Pré-seleção da unidade atual ao criar nova forma de pagamento
- Validação obrigatória do campo
- Ícone `Building2` do Lucide React

**Código**:
```jsx
// Estado
const [formData, setFormData] = useState({
  name: '',
  fee_percentage: '',
  receipt_days: '',
  unit_id: '', // NOVO
});

// Hook para obter unidades
const { allUnits, selectedUnit } = useUnit();

// Select no formulário
<select value={formData.unit_id} onChange={...}>
  <option value="">Selecione uma unidade</option>
  {allUnits.map(unit => (
    <option key={unit.id} value={unit.id}>
      {unit.name}
    </option>
  ))}
</select>
```

### 2. Cálculo de Dias Úteis

**Objetivo**: Alterar o cálculo de prazo de recebimento de dias corridos para dias úteis (segunda a sexta, excluindo feriados).

**Implementação**:

#### a) Helper Text Atualizado
Texto explicativo mais claro sobre o conceito de dias úteis:

**Antes**:
```
"Dias até receber o pagamento (0 = recebimento imediato)"
```

**Depois**:
```
"Dias úteis até receber (segunda a sexta, exclui feriados. 0 = recebimento imediato)"
```

Com destaque em negrito na palavra "úteis".

#### b) Utilitário de Dias Úteis Criado

**Arquivo**: `src/utils/businessDays.js`

**Funcionalidades**:

1. **`isHoliday(date)`**
   - Verifica se uma data é feriado nacional brasileiro
   - Inclui feriados fixos (Ano Novo, Natal, etc.)
   - Inclui feriados móveis (Carnaval, Páscoa, Corpus Christi)
   - Usa algoritmo de Meeus/Jones/Butcher para cálculo da Páscoa

2. **`isBusinessDay(date)`**
   - Verifica se uma data é dia útil
   - Exclui sábados e domingos
   - Exclui feriados nacionais

3. **`addBusinessDays(startDate, businessDays)`**
   - Adiciona N dias úteis a uma data
   - Pula automaticamente fins de semana e feriados
   - Retorna a data final de recebimento

4. **`countBusinessDays(startDate, endDate)`**
   - Conta quantos dias úteis existem entre duas datas
   - Útil para relatórios e análises

5. **`formatDate(date)`**
   - Formata data para padrão brasileiro (DD/MM/YYYY)

**Feriados Cobertos**:

Fixos:
- 01/01 - Ano Novo
- 21/04 - Tiradentes
- 01/05 - Dia do Trabalho
- 07/09 - Independência do Brasil
- 12/10 - Nossa Senhora Aparecida
- 02/11 - Finados
- 15/11 - Proclamação da República
- 25/12 - Natal

Móveis (calculados anualmente):
- Carnaval (47 dias antes da Páscoa)
- Sexta-feira Santa (2 dias antes da Páscoa)
- Corpus Christi (60 dias após a Páscoa)

## Exemplos de Uso

### Modal de Forma de Pagamento
```javascript
// Ao criar forma de pagamento com prazo de 30 dias úteis
const paymentMethod = {
  unit_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Cartão de Crédito',
  fee_percentage: 2.5,
  receipt_days: 30 // 30 dias ÚTEIS
};
```

### Cálculo de Data de Recebimento
```javascript
import { addBusinessDays, formatDate } from '@/utils/businessDays';

// Calcular quando o pagamento será recebido
const saleDate = new Date(); // Hoje
const receiptDays = 30; // Do cadastro da forma de pagamento

const receiptDate = addBusinessDays(saleDate, receiptDays);
console.log(`Recebimento previsto: ${formatDate(receiptDate)}`);
// Exemplo: "Recebimento previsto: 15/03/2024"
```

### Verificar Dia Útil
```javascript
import { isBusinessDay } from '@/utils/businessDays';

const date = new Date(2024, 0, 1); // 01/01/2024 (Ano Novo)
console.log(isBusinessDay(date)); // false (feriado)

const date2 = new Date(2024, 0, 6); // 06/01/2024 (sábado)
console.log(isBusinessDay(date2)); // false (fim de semana)

const date3 = new Date(2024, 0, 8); // 08/01/2024 (segunda-feira)
console.log(isBusinessDay(date3)); // true (dia útil)
```

### Contar Dias Úteis Entre Datas
```javascript
import { countBusinessDays } from '@/utils/businessDays';

const start = new Date(2024, 0, 1); // 01/01/2024
const end = new Date(2024, 0, 31); // 31/01/2024

const businessDays = countBusinessDays(start, end);
console.log(`Dias úteis em janeiro/2024: ${businessDays}`);
// Resultado: ~21 dias úteis (excluindo fins de semana e Ano Novo)
```

## Integração com Fluxo Financeiro

### Cenário 1: Venda com Cartão de Crédito
```
Venda: R$ 100,00
Forma de Pagamento: Cartão de Crédito
  - Taxa: 2.5%
  - Prazo: 30 dias úteis

Cálculo:
- Valor bruto: R$ 100,00
- Taxa (2.5%): R$ 2,50
- Valor líquido: R$ 97,50
- Data venda: 02/01/2024 (terça-feira)
- Data recebimento: 12/02/2024 (30 dias úteis depois)
```

### Cenário 2: Venda em Dinheiro
```
Venda: R$ 50,00
Forma de Pagamento: Dinheiro
  - Taxa: 0%
  - Prazo: 0 dias úteis

Cálculo:
- Valor bruto: R$ 50,00
- Taxa (0%): R$ 0,00
- Valor líquido: R$ 50,00
- Data venda: 02/01/2024
- Data recebimento: 02/01/2024 (imediato)
```

## Próximos Passos (Futuro)

1. **Visualização de Data de Recebimento**
   - Mostrar data prevista de recebimento ao registrar venda
   - Exemplo: "Recebimento previsto: 15/03/2024"

2. **Dashboard de Recebimentos**
   - Calendário com previsão de entradas
   - Destacar dias úteis vs não úteis
   - Alertas para recebimentos próximos

3. **Feriados Municipais/Estaduais**
   - Permitir cadastro de feriados locais
   - Configurável por unidade

4. **Relatórios de Fluxo de Caixa**
   - Projeção baseada em dias úteis
   - Comparação planejado vs realizado

## Arquivos Modificados

1. **`src/molecules/NovaFormaPagamentoModal/NovaFormaPagamentoModal.jsx`**
   - Adicionado campo `unit_id` com dropdown
   - Atualizado helper text para dias úteis
   - Validação do campo unidade

2. **`src/utils/businessDays.js`** (NOVO)
   - Biblioteca completa de cálculo de dias úteis
   - Feriados nacionais brasileiros
   - Funções auxiliares para datas

## Validação

✅ Build bem-sucedido (23.10s)
✅ 0 erros de lint
✅ 0 erros de TypeScript
✅ Integração com UnitContext funcionando
✅ Validação de campos obrigatórios
✅ Helper text claro e objetivo

## Conclusão

As alterações implementadas:

1. **Vinculam** cada forma de pagamento a uma unidade específica
2. **Clarificam** que o prazo é contado em dias úteis (seg-sex)
3. **Excluem** automaticamente fins de semana e feriados
4. **Fornecem** utilitários reutilizáveis para cálculos financeiros
5. **Melhoram** a precisão do fluxo de caixa projetado

Todas as mudanças foram implementadas mantendo a compatibilidade com o código existente e seguindo os padrões do projeto (Atomic Design, Service Layer, Context Pattern).
