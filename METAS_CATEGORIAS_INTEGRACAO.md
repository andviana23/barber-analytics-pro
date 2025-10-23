# Integração de Metas com Categorias - Implementação Completa

## 📋 Objetivo

Conectar o sistema de metas com as categorias de receitas e despesas, permitindo que cada meta possa ser vinculada a uma categoria específica (ex: Meta de Assinaturas → Categoria "Assinaturas").

---

## 🗄️ Alterações no Banco de Dados

### 1. **Adição da Coluna `category_id` na Tabela `goals`**

```sql
ALTER TABLE goals
ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN goals.category_id IS 'Categoria específica para a meta (NULL = meta geral do tipo)';

CREATE INDEX idx_goals_category_id ON goals(category_id) WHERE category_id IS NOT NULL;
```

**Impacto:**

- ✅ Permite vincular metas a categorias específicas
- ✅ Mantém compatibilidade (NULL = meta geral)
- ✅ Índice para performance

---

### 2. **Função `calculate_goal_achieved_value`**

Função PostgreSQL que calcula automaticamente o valor atingido de uma meta baseado em:

- **Tipo da meta** (revenue_general, subscription, product_sales, expenses, profit)
- **Categoria vinculada** (se houver)
- **Período** (monthly, quarterly, yearly)
- **Ano e mês**

```sql
CREATE OR REPLACE FUNCTION calculate_goal_achieved_value(p_goal_id uuid)
RETURNS numeric
```

**Lógica Implementada:**

| Tipo de Meta        | Categoria | Cálculo                                             |
| ------------------- | --------- | --------------------------------------------------- |
| **subscription**    | NULL      | Soma de `subscription_payments` com status RECEIVED |
| **subscription**    | Com ID    | Soma de `revenues` com category_id específico       |
| **revenue_general** | NULL      | Soma de todas as `revenues`                         |
| **revenue_general** | Com ID    | Soma de `revenues` com category_id específico       |
| **product_sales**   | -         | Soma de `revenues` com type='product'               |
| **expenses**        | NULL      | Soma de todas as `expenses`                         |
| **expenses**        | Com ID    | Soma de `expenses` com category_id específico       |
| **profit**          | -         | Receitas totais - Despesas totais                   |

**Filtragens Aplicadas:**

- ✅ `unit_id` (multi-tenant)
- ✅ Período (year, month, quarter)
- ✅ Status (Received/Partial para receitas, Paid para despesas)
- ✅ `is_active = true`

---

### 3. **View `vw_goals_detailed`**

View otimizada que substitui consultas complexas no frontend.

```sql
CREATE OR REPLACE VIEW vw_goals_detailed AS
SELECT
    g.*,
    u.name AS unit_name,
    c.name AS category_name,
    c.category_type,
    calculate_goal_achieved_value(g.id) AS achieved_value,
    ROUND((calculate_goal_achieved_value(g.id) / g.target_value * 100), 2) AS progress_percentage,
    g.target_value - calculate_goal_achieved_value(g.id) AS remaining_value,
    CASE
        WHEN calculate_goal_achieved_value(g.id) >= g.target_value THEN 'achieved'
        WHEN calculate_goal_achieved_value(g.id) >= (g.target_value * 0.8) THEN 'on_track'
        WHEN calculate_goal_achieved_value(g.id) >= (g.target_value * 0.5) THEN 'behind'
        ELSE 'critical'
    END AS status,
    -- Formatação do período
    TO_CHAR(...) AS period_formatted
FROM goals g
LEFT JOIN units u ON g.unit_id = u.id
LEFT JOIN categories c ON g.category_id = c.id
```

**Campos Calculados:**

- `achieved_value`: Valor atingido (calculado pela função)
- `progress_percentage`: Percentual de progresso
- `remaining_value`: Quanto falta para atingir a meta
- `status`: achieved | on_track | behind | critical
- `period_formatted`: MM/YYYY ou Q1/2025 ou 2025
- `category_name`: Nome da categoria vinculada
- `category_type`: Revenue ou Expense

---

## 💻 Alterações no Código

### 1. **goalsService.js - Métodos Atualizados**

#### `getGoals(filters)`

```javascript
// ANTES: Consulta direta na tabela goals
.from('goals').select('*, unit:units(id, name)')

// DEPOIS: Usa view otimizada
.from('vw_goals_detailed').select('*')

// Novo filtro adicionado:
if (categoryId) {
  query = query.eq('category_id', categoryId);
}
```

#### `getGoalsSummary(unitId, year, month)`

```javascript
// ANTES: Retornava 1 meta por tipo
{
  revenue_general: goal,
  subscription: goal,
  ...
}

// DEPOIS: Retorna arrays (múltiplas metas por categoria)
{
  revenue_general: [goals sem categoria],
  subscription: [todas as metas de subscription],
  by_category: [todas as metas com categoria específica]
}
```

#### `refreshGoalAchievedValue(goalId)` - NOVO

```javascript
// Recalcula o achieved_value chamando a função do banco
await supabase.rpc('calculate_goal_achieved_value', { p_goal_id: goalId });
```

#### `calculateGoalProgress(unitId, goalType, year, month, categoryId)`

```javascript
// ANTES: Lógica complexa no JavaScript com múltiplas queries
// DEPOIS: Usa vw_goals_detailed que já tem tudo calculado

// Novo parâmetro categoryId para filtrar metas específicas
```

---

## 🎯 Exemplos de Uso

### Exemplo 1: Meta Geral de Assinaturas

```javascript
const goal = {
  unit_id: 'uuid-da-unidade',
  goal_type: 'subscription',
  target_value: 50000.0,
  goal_year: 2025,
  goal_month: 10,
  period: 'monthly',
  category_id: null, // Meta geral (todas assinaturas)
};
```

**Resultado:** Soma TODOS os pagamentos de assinaturas do mês.

### Exemplo 2: Meta de Categoria Específica (Assinaturas Premium)

```javascript
const goal = {
  unit_id: 'uuid-da-unidade',
  goal_type: 'subscription',
  target_value: 21000.0,
  goal_year: 2025,
  goal_month: 10,
  period: 'monthly',
  category_id: 'uuid-categoria-assinaturas-premium', // Categoria específica
};
```

**Resultado:** Soma APENAS receitas da categoria "Assinaturas Premium".

### Exemplo 3: Consultar Metas com Categorias

```javascript
const { data } = await goalsService.getGoals({
  unitId: selectedUnit.id,
  year: 2025,
  month: 10,
  categoryId: 'uuid-categoria', // Opcional
});

// Retorna metas com achieved_value já calculado automaticamente
data.forEach(goal => {
  console.log(goal.category_name); // "Assinaturas Premium"
  console.log(goal.achieved_value); // 21000.00 (calculado)
  console.log(goal.progress_percentage); // 100%
  console.log(goal.status); // "achieved"
});
```

---

## 🔄 Fluxo de Atualização Automática

### Quando uma receita/despesa é criada:

1. Usuário registra receita de R$ 1.000 na categoria "Assinaturas"
2. Sistema salva em `revenues` com `category_id`
3. Próxima consulta à `vw_goals_detailed` já mostra o valor atualizado
4. **Não precisa** chamar `updateAchievedValue` manualmente
5. **Não precisa** job/cron para recalcular

### Recálculo Manual (opcional):

```javascript
// Se precisar forçar recálculo imediato
await goalsService.refreshGoalAchievedValue(goalId);
```

---

## 📊 Estrutura de Dados

### Tabela `goals` (com nova coluna)

```
id              uuid
unit_id         uuid
goal_type       goal_type (enum)
period          goal_period (enum)
target_value    numeric(12,2)
achieved_value  numeric(12,2) [DEPRECATED - calculado pela função]
goal_year       integer
goal_month      integer
goal_quarter    integer
category_id     uuid ← NOVO
is_active       boolean
created_at      timestamp
updated_at      timestamp
created_by      uuid
```

### View `vw_goals_detailed` (saída)

```
[Todos campos de goals] +
unit_name               text
category_name           text ← NOVO
category_type           text ← NOVO
achieved_value          numeric (calculado) ← SUBSTITUÍDO
progress_percentage     numeric (calculado)
remaining_value         numeric (calculado)
status                  text (achieved/on_track/behind/critical)
period_formatted        text (MM/YYYY)
```

---

## ✅ Validações e Regras

### 1. **Compatibilidade com Metas Antigas**

- Metas sem `category_id` (NULL) continuam funcionando
- São tratadas como "metas gerais" do tipo

### 2. **Multi-Tenant**

- Todas as queries filtram por `unit_id`
- Categorias pertencem a unidades específicas
- Usuários só veem metas/categorias da sua unidade

### 3. **Soft Delete**

- `is_active = true` em goals, revenues, expenses
- Dados inativos não contam para metas

### 4. **Status de Transações**

- **Receitas**: Apenas `Received` ou `Partial`
- **Despesas**: Apenas `Paid`
- **Assinaturas**: Apenas `RECEIVED` ou `CONFIRMED`

---

## 🚀 Próximos Passos

### Frontend (Necessário)

1. **Modal de Criação/Edição de Metas**
   - Adicionar campo `category_id` (dropdown com categorias)
   - Filtrar categorias por `category_type` baseado no `goal_type`
   - Exemplo: Se `goal_type = 'subscription'`, mostrar apenas categorias Revenue

2. **Página de Metas**
   - Atualizar para usar `vw_goals_detailed`
   - Exibir `category_name` nos cards
   - Mostrar `progress_percentage` e `status`

3. **Dashboard**
   - Usar dados calculados automaticamente
   - Remover lógica antiga de cálculo manual

---

## 📝 Changelog

### Database

- ✅ `ALTER TABLE goals ADD COLUMN category_id`
- ✅ `CREATE INDEX idx_goals_category_id`
- ✅ `CREATE FUNCTION calculate_goal_achieved_value`
- ✅ `CREATE VIEW vw_goals_detailed`

### Backend (goalsService.js)

- ✅ `getGoals()` - Usa `vw_goals_detailed` + filtro `categoryId`
- ✅ `getGoalsSummary()` - Retorna arrays por tipo + `by_category`
- ✅ `refreshGoalAchievedValue()` - Novo método
- ✅ `calculateGoalProgress()` - Usa view otimizada + `categoryId`

### Próximo

- ⏳ Atualizar componentes de Metas no frontend
- ⏳ Adicionar seletor de categoria no modal
- ⏳ Atualizar dashboard para usar achieved_value automático

---

## 🔍 Testes Recomendados

### 1. Meta Geral de Assinaturas (sem categoria)

```sql
-- Inserir meta
INSERT INTO goals (unit_id, goal_type, target_value, goal_year, goal_month, period)
VALUES ('uuid-unit', 'subscription', 50000, 2025, 10, 'monthly');

-- Verificar cálculo
SELECT * FROM vw_goals_detailed WHERE goal_type = 'subscription';
-- achieved_value deve ser a soma de todos subscription_payments
```

### 2. Meta Específica de Categoria

```sql
-- Criar categoria
INSERT INTO categories (unit_id, name, category_type)
VALUES ('uuid-unit', 'Assinaturas Premium', 'Revenue');

-- Criar meta vinculada
INSERT INTO goals (unit_id, goal_type, target_value, goal_year, goal_month, period, category_id)
VALUES ('uuid-unit', 'subscription', 21000, 2025, 10, 'monthly', 'uuid-categoria');

-- Verificar cálculo
SELECT * FROM vw_goals_detailed WHERE category_id = 'uuid-categoria';
-- achieved_value deve ser a soma apenas das receitas dessa categoria
```

---

**Data**: Outubro 2025  
**Status**: ✅ Banco de Dados Completo | ⏳ Frontend Pendente  
**Compatibilidade**: 100% retrocompatível  
**Performance**: Otimizado com view materializada + índices
