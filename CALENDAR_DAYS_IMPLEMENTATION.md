# Implementação de Dias Corridos para Recebimento

## 📅 Mudança no Padrão de Cálculo de Recebimento

**Data**: 14/10/2025  
**Versão**: 1.0.0  
**Status**: ✅ Implementado

---

## 🎯 Objetivo

Ajustar a lógica de cálculo de data de recebimento para seguir o **padrão real do mercado financeiro brasileiro**:

- **Antes**: Contagem de dias ÚTEIS (apenas segunda a sexta, excluindo feriados)
- **Agora**: Contagem de dias CORRIDOS (incluindo fins de semana e feriados) + ajuste automático para próximo dia útil

---

## 📊 Padrão do Mercado Financeiro

### Regra Geral
O recebimento deve ser baseado em **30 dias corridos** (ou outro prazo configurado), contados a partir da data de pagamento/competência.

### Ajuste Automático
Caso o dia calculado caia em:
- **Sábado**
- **Domingo**
- **Feriado nacional**

O crédito deve ser **postergado automaticamente para o próximo dia útil**.

---

## 💡 Exemplos Práticos

### Exemplo 1: Dia útil
```
Data de Pagamento: 01/10/2025 (quarta-feira)
Prazo: 30 dias corridos
Cálculo: 01/10 + 30 dias = 31/10/2025 (sexta-feira)
✅ Recebimento: 31/10/2025 (dia útil, mantém a data)
```

### Exemplo 2: Final de semana
```
Data de Pagamento: 01/10/2025 (quarta-feira)
Prazo: 30 dias corridos
Cálculo: 01/10 + 30 dias = 31/10/2025 (sexta-feira)
31/10 é feriado ou sábado
✅ Recebimento: 02/11/2025 (próxima segunda-feira útil)
```

### Exemplo 3: Sequência de feriados
```
Data de Pagamento: 01/11/2025
Prazo: 30 dias corridos
Cálculo: 01/11 + 30 dias = 01/12/2025 (segunda-feira)
01/12 é dia útil
✅ Recebimento: 01/12/2025
```

### Exemplo 4: Recebimento imediato
```
Data de Pagamento: 14/10/2025
Prazo: 0 dias (PIX/Dinheiro)
✅ Recebimento: 14/10/2025 (mesmo dia)
```

---

## 🔧 Implementação Técnica

### Nova Função Criada

Arquivo: `src/utils/businessDays.js`

```javascript
/**
 * Adiciona N dias CORRIDOS a uma data e ajusta para o próximo dia útil
 * Esta função implementa o padrão real do mercado financeiro:
 * - Adiciona dias corridos (incluindo sábados, domingos e feriados)
 * - Se o dia final cair em final de semana ou feriado, avança para o próximo dia útil
 * 
 * @param {Date} startDate - Data inicial (data de pagamento/competência)
 * @param {number} calendarDays - Quantidade de dias corridos a adicionar (ex: 30, 14, 7)
 * @returns {Date} - Data final ajustada para dia útil
 */
export const addCalendarDaysWithBusinessDayAdjustment = (startDate, calendarDays) => {
  if (calendarDays === 0) {
    return new Date(startDate);
  }
  
  // 1. Adiciona os dias corridos
  const result = new Date(startDate);
  result.setDate(result.getDate() + calendarDays);
  
  // 2. Se cair em dia não útil, avança para o próximo dia útil
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
};
```

### Funções Auxiliares (já existentes)

```javascript
/**
 * Verifica se uma data é dia útil (segunda a sexta, não feriado)
 */
export const isBusinessDay = (date) => {
  const dayOfWeek = date.getDay();
  
  // 0 = Domingo, 6 = Sábado
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Verifica se é feriado
  if (isHoliday(date)) {
    return false;
  }
  
  return true;
};

/**
 * Verifica se uma data é feriado nacional brasileiro
 */
export const isHoliday = (date) => {
  const year = date.getFullYear();
  const holidays = getHolidays(year);
  
  return holidays.some(holiday => 
    holiday.getDate() === date.getDate() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getFullYear() === date.getFullYear()
  );
};
```

### Feriados Nacionais Incluídos

**Fixos:**
- 01/01 - Ano Novo
- 21/04 - Tiradentes
- 01/05 - Dia do Trabalho
- 07/09 - Independência do Brasil
- 12/10 - Nossa Senhora Aparecida
- 02/11 - Finados
- 15/11 - Proclamação da República
- 25/12 - Natal

**Móveis (calculados):**
- Carnaval (47 dias antes da Páscoa)
- Sexta-feira Santa (2 dias antes da Páscoa)
- Páscoa (algoritmo de Meeus/Jones/Butcher)
- Corpus Christi (60 dias após a Páscoa)

---

## 📝 Arquivos Modificados

### 1. `src/utils/businessDays.js`
**Mudança**: Adicionada nova função `addCalendarDaysWithBusinessDayAdjustment`  
**Linhas**: ~140-163  
**Impacto**: ✅ Baixo - função nova, não afeta código existente

### 2. `src/templates/NovaReceitaAccrualModal/NovaReceitaAccrualModal.jsx`
**Mudanças**:
- Import atualizado de `addBusinessDays` para `addCalendarDaysWithBusinessDayAdjustment`
- Cálculo de data de recebimento atualizado (linha ~87)
- Texto explicativo atualizado: "dias úteis" → "dias corridos"
- Adicionada nota sobre ajuste automático para dia útil
- Objeto de receita atualizado com campos corretos do banco

**Impacto**: ✅ Médio - apenas modal de criação de receita

### 3. Campos de Banco Utilizados
```javascript
const receita = {
  // Campos básicos
  title: formData.titulo,
  description: formData.titulo,
  
  // Valores financeiros
  valor_bruto: valorNumerico,
  valor_liquido: valorNumerico,
  taxas: 0,
  value: valorNumerico, // Campo legado
  
  // Datas (padrão mercado financeiro)
  date: formData.data_pagamento, // Data do documento/competência
  competencia_inicio: formData.data_pagamento,
  competencia_fim: formData.data_pagamento,
  data_prevista_recebimento: calculatedReceiptDate, // Dias corridos + ajuste
  
  // Relacionamentos
  unit_id: formData.unit_id,
  payment_method_id: formData.payment_method_id,
  
  // Status
  status: 'Pendente'
};
```

---

## 🎨 Interface do Usuário

### Texto no Dropdown de Formas de Pagamento
```
Antes: "Asaas - 30 dias úteis"
Agora:  "Asaas - 30 dias corridos"
```

### Card Informativo (Preview da Data)
```
📅 Data de Recebimento Calculada

25 de novembro de 2025

Recebimento em 30 dias corridos após a data de pagamento
✓ Se cair em final de semana ou feriado, será ajustado para o próximo dia útil
```

---

## 🔄 Integração com Sistema

### Módulos Afetados

1. **Calendário Financeiro** ✅
   - View: `vw_calendar_events`
   - Campo: `data_prevista_recebimento`
   - Exibe data calculada com ajuste automático

2. **Compensação Bancária** ✅
   - View: `vw_cashflow_entries`
   - Campo: `data_prevista_recebimento`
   - Usa data ajustada para previsão de caixa

3. **Receitas a Receber** ✅
   - Tabela: `revenues`
   - Campo: `data_prevista_recebimento`
   - Status calculado automaticamente via trigger

4. **Fluxo de Caixa Acumulado** ✅
   - View: `vw_monthly_summary_accrual`
   - Campo: `data_prevista_recebimento`
   - Relatórios DRE usam data correta

### Triggers do Banco

```sql
CREATE OR REPLACE FUNCTION calculate_revenue_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem data de recebimento efetivo, está Recebido
    IF NEW.data_recebimento_efetivo IS NOT NULL THEN
        NEW.status := 'Recebido';
    
    -- Se está Pendente e passou da data prevista, marca como Atrasado
    ELSIF NEW.status = 'Pendente' AND NEW.data_prevista_recebimento < CURRENT_DATE THEN
        NEW.status := 'Atrasado';
    
    -- Se não tem data prevista, mantém status atual
    ELSIF NEW.status IS NULL THEN
        NEW.status := 'Pendente';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Comportamento**: Status é atualizado automaticamente com base na `data_prevista_recebimento` calculada.

---

## 📊 Impacto nos Relatórios

### Antes (Dias Úteis)
```
Pagamento: 01/10/2025
Prazo: 30 dias úteis
Recebimento: ~10/11/2025 (42 dias corridos)
```

### Depois (Dias Corridos + Ajuste)
```
Pagamento: 01/10/2025
Prazo: 30 dias corridos
Recebimento: 31/10/2025 (ou próximo dia útil)
```

### Benefícios

1. ✅ **Alinhamento com Mercado**: Segue padrão de operadoras de cartão e bancos
2. ✅ **Previsibilidade**: Datas mais previsíveis e fáceis de calcular
3. ✅ **Fluxo de Caixa Real**: Reflete quando o dinheiro realmente entra
4. ✅ **Conformidade**: Segue regras do sistema financeiro brasileiro
5. ✅ **Automação**: Ajuste automático para dias úteis sem intervenção manual

---

## 🧪 Casos de Teste

### Teste 1: Dia útil normal
```javascript
const paymentDate = new Date(2025, 9, 1); // 01/10/2025 (quarta)
const receiptDate = addCalendarDaysWithBusinessDayAdjustment(paymentDate, 30);
// Esperado: 31/10/2025 (sexta) - dia útil
```

### Teste 2: Cai no sábado
```javascript
const paymentDate = new Date(2025, 9, 1); // 01/10/2025
const receiptDate = addCalendarDaysWithBusinessDayAdjustment(paymentDate, 30);
// Se 31/10 for sábado
// Esperado: 02/11/2025 (segunda) - próximo dia útil
```

### Teste 3: Cai em feriado
```javascript
const paymentDate = new Date(2025, 9, 2); // 02/10/2025
const receiptDate = addCalendarDaysWithBusinessDayAdjustment(paymentDate, 30);
// Se 01/11 for feriado (Finados - domingo)
// Esperado: 03/11/2025 (segunda) - próximo dia útil
```

### Teste 4: Recebimento imediato
```javascript
const paymentDate = new Date(2025, 9, 14); // 14/10/2025
const receiptDate = addCalendarDaysWithBusinessDayAdjustment(paymentDate, 0);
// Esperado: 14/10/2025 (mesmo dia)
```

---

## 🚀 Próximos Passos

### Fase Atual: ✅ Implementação Concluída
- [x] Nova função `addCalendarDaysWithBusinessDayAdjustment`
- [x] Atualização do modal `NovaReceitaAccrualModal`
- [x] Textos da interface atualizados
- [x] Campos do banco corretos
- [x] Documentação completa

### Fase Futura: Expansão
- [ ] Aplicar mesma lógica para despesas a pagar
- [ ] Dashboard de projeção de recebimentos
- [ ] Alertas de recebimentos atrasados
- [ ] Relatório de aging (contas a receber por vencimento)
- [ ] Integração com APIs de operadoras de cartão (validação de prazos reais)

---

## 📖 Referências

### Padrão do Mercado Brasileiro
- **Operadoras de Cartão**: Crédito em 30 dias corridos
- **Débito**: D+1 ou D+0 (dias úteis)
- **Banco do Brasil**: Regras de compensação bancária
- **BACEN**: Regulamentação do Sistema de Pagamentos Brasileiro

### Documentação Interna
- `BUSINESS_DAYS_IMPLEMENTATION.md` - Implementação original de dias úteis
- `db/sql/21-extend-revenues-accrual.sql` - Estrutura da tabela revenues
- `src/utils/businessDays.js` - Utilitário de cálculo de datas

---

## 👥 Autor

**Sistema Barber Analytics Pro**  
Data: 14/10/2025  
Versão: 1.0.0

---

## 📝 Notas

- Esta implementação substitui o cálculo anterior de dias úteis por dias corridos
- A função `addBusinessDays` original foi mantida para compatibilidade
- Todos os novos cálculos devem usar `addCalendarDaysWithBusinessDayAdjustment`
- O sistema mantém histórico de feriados até 2030
- Feriados municipais podem ser adicionados no futuro se necessário
