# 🎯 Integração Completa: Sistema de Metas × Financeiro

## 📋 Análise Completa Realizada

**Data:** 22/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ ANÁLISE CONCLUÍDA + PLANO DE INTEGRAÇÃO

---

## 🔍 Estado Atual do Sistema

### ✅ **Estrutura de Banco de Dados**

#### Tabela `goals`

```sql
- id (uuid, PK)
- unit_id (uuid, FK → units)
- goal_type (enum: revenue_general, subscription, product_sales, expenses, profit)
- period (enum: monthly, quarterly, yearly)
- target_value (numeric) -- Valor da meta
- achieved_value (numeric) -- Valor atingido (deprecado, usar função)
- goal_year (integer)
- goal_month (integer, nullable)
- goal_quarter (integer, nullable)
- category_id (uuid, FK → categories, nullable) -- Para metas específicas por categoria
- is_active (boolean)
- created_at, updated_at, created_by
```

#### View `vw_goals_detailed`

Calcula automaticamente:

- `achieved_value` (via função `calculate_goal_achieved_value`)
- `progress_percentage` (percentual atingido)
- `remaining_value` (valor restante)
- `status` (achieved, on_track, behind, critical)
- `period_formatted` (formatação do período)

#### Função `calculate_goal_achieved_value(p_goal_id)`

**Status Atual:** ⚠️ **FUNCIONANDO PARCIALMENTE**

**Problemas Identificados:**

1. ❌ **Usa `date` em vez de `data_competencia`**
   - Sistema agora usa regime de competência
   - Deve buscar por `COALESCE(data_competencia, date)`

2. ❌ **Status `Received` e `Partial` podem estar desatualizados**
   - Verificar se esses status ainda existem na tabela
   - Pode estar usando status antigos

3. ❌ **Não calcula metas trimestrais e anuais corretamente**
   - Apenas monthly tem implementação completa
   - Quarterly e yearly retornam 0

4. ⚠️ **Subscription usa tabela `subscription_payments`**
   - Depende de sistema de assinaturas separado
   - Pode não estar integrado com revenues

5. ❌ **Meta de Profit não considera deduções**
   - Não deduz taxa de cartão
   - Não deduz outras deduções

---

## 📊 Tipos de Metas Configurados

### 1. **Faturamento Geral (`revenue_general`)**

- Meta: R$ 78.000,00 (Nova Lima, Out/2025)
- Atingido: R$ 36.568,75 (46,88%)
- **Problema:** Cálculo funciona mas usa `date` em vez de `data_competencia`

### 2. **Assinaturas (`subscription`)**

- Meta: R$ 21.000,00 (Nova Lima, Out/2025)
- Atingido: R$ 0,00 (0%)
- **Problema:** Depende de `subscription_payments` que pode não estar populada

### 3. **Venda de Produtos (`product_sales`)**

- Meta: R$ 4.500,00 (Nova Lima, Out/2025)
- Atingido: R$ 0,00
- **Problema:** Busca `revenues.type = 'product'` mas pode não existir essa coluna

### 4. **Despesas (`expenses`)**

- Meta: R$ 74.000,00 (Nova Lima, Out/2025)
- Atingido: R$ 0,00
- **Problema:** Usa `date` em vez de `data_competencia`

### 5. **Lucro/Resultado (`profit`)**

- Meta: R$ 4.000,00 (Nova Lima, Out/2025)
- Atingido: R$ 0,00
- **Problema:** Não deduz taxa de cartão e outras deduções

---

## 🔧 Plano de Correção e Integração

### **Fase 1: Correção da Função de Cálculo** ⚡ PRIORIDADE ALTA

#### 1.1 Atualizar para Regime de Competência

```sql
-- Trocar todas as referências:
-- ❌ EXTRACT(YEAR FROM date)
-- ✅ EXTRACT(YEAR FROM COALESCE(data_competencia, date))

-- ❌ EXTRACT(MONTH FROM date)
-- ✅ EXTRACT(MONTH FROM COALESCE(data_competencia, date))
```

#### 1.2 Verificar Status de Receitas

```sql
-- Verificar quais status existem:
SELECT DISTINCT status FROM revenues;

-- Ajustar query para usar status corretos
-- Possível: 'Received', 'Pending', 'Cancelled', 'Partial'
```

#### 1.3 Implementar Cálculos Trimestrais e Anuais

```sql
-- Adicionar lógica para quarterly e yearly em TODOS os tipos de meta
-- Não apenas monthly
```

#### 1.4 Integrar Meta de Lucro com DRE

```sql
-- Meta de Profit deve usar a mesma lógica do DRE:
-- Receita Bruta - Taxa de Cartão - Deduções - Custos - Despesas Fixas - Impostos
```

#### 1.5 Verificar Coluna `type` em Revenues

```sql
-- Se não existir, criar ou usar category_id para identificar produtos
```

### **Fase 2: Criação de Dashboard de Metas** 📊

#### 2.1 Componente `MetricasMetasCard`

- Mostrar todas as metas do mês com progresso visual
- Indicador de status (achieved, on_track, behind, critical)
- Link para tela de metas

#### 2.2 Integração com Dashboard Principal

- Adicionar seção de metas no Dashboard
- Mostrar resumo: 3 metas principais
- Alerta visual quando meta está crítica

#### 2.3 Widget de Meta no Header

- Badge com progresso da meta principal do mês
- Clique abre modal com detalhes

### **Fase 3: Automação e Alertas** 🤖

#### 3.1 Trigger de Atualização Automática

```sql
-- Atualizar achieved_value automaticamente quando:
-- - Nova receita é inserida
-- - Receita é atualizada
-- - Despesa é inserida/atualizada
```

#### 3.2 Sistema de Notificações

- Notificar quando meta atinge 50%, 75%, 90%, 100%
- Alerta quando faltam 5 dias para fim do mês e meta < 70%
- Comemoração quando meta é batida

#### 3.3 Histórico de Metas

- Tabela `goals_history` para rastrear mudanças
- Gráfico de evolução mensal

### **Fase 4: Relatórios e Análises** 📈

#### 4.1 Relatório de Desempenho de Metas

- Comparativo: meta × realizado (mensal, trimestral, anual)
- Taxa de atingimento por unidade
- Ranking de metas mais atingidas

#### 4.2 Análise Preditiva

- Projeção de atingimento baseada em histórico
- Sugestão de metas para próximo período
- Análise de tendências

#### 4.3 Export de Dados

- Export Excel com todas as metas
- Gráficos prontos para apresentação
- PDF com relatório completo

---

## 🚀 Implementação Imediata

### **Script 1: Corrigir Função de Cálculo**

```sql
-- Arquivo: fix_calculate_goal_achieved_value.sql
CREATE OR REPLACE FUNCTION public.calculate_goal_achieved_value(p_goal_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal_type goal_type;
    v_category_id uuid;
    v_unit_id uuid;
    v_goal_year integer;
    v_goal_month integer;
    v_goal_quarter integer;
    v_period goal_period;
    v_achieved numeric := 0;
    v_start_date date;
    v_end_date date;
BEGIN
    -- Buscar informações da meta
    SELECT
        goal_type, category_id, unit_id,
        goal_year, goal_month, goal_quarter, period
    INTO
        v_goal_type, v_category_id, v_unit_id,
        v_goal_year, v_goal_month, v_goal_quarter, v_period
    FROM goals
    WHERE id = p_goal_id;

    -- Calcular datas com base no período
    IF v_period = 'monthly' AND v_goal_month IS NOT NULL THEN
        v_start_date := make_date(v_goal_year, v_goal_month, 1);
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::date;
    ELSIF v_period = 'quarterly' AND v_goal_quarter IS NOT NULL THEN
        v_start_date := make_date(v_goal_year, (v_goal_quarter - 1) * 3 + 1, 1);
        v_end_date := (v_start_date + INTERVAL '3 months' - INTERVAL '1 day')::date;
    ELSIF v_period = 'yearly' THEN
        v_start_date := make_date(v_goal_year, 1, 1);
        v_end_date := make_date(v_goal_year, 12, 31);
    ELSE
        RETURN 0; -- Período inválido
    END IF;

    -- RECEITAS (revenue_general, subscription, product_sales)
    IF v_goal_type IN ('revenue_general', 'subscription', 'product_sales') THEN

        IF v_category_id IS NOT NULL THEN
            -- Meta específica por categoria
            SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
            INTO v_achieved
            FROM revenues
            WHERE unit_id = v_unit_id
              AND category_id = v_category_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        ELSE
            -- Meta geral por tipo
            IF v_goal_type = 'subscription' THEN
                -- Buscar receitas de assinaturas
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues r
                JOIN categories c ON r.category_id = c.id
                WHERE r.unit_id = v_unit_id
                  AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
                  AND r.is_active = true
                  AND (c.name ILIKE '%assinatura%' OR c.name ILIKE '%subscription%');

            ELSIF v_goal_type = 'product_sales' THEN
                -- Buscar vendas de produtos
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues r
                JOIN categories c ON r.category_id = c.id
                WHERE r.unit_id = v_unit_id
                  AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
                  AND r.is_active = true
                  AND (c.name ILIKE '%produto%' OR c.name ILIKE '%product%');

            ELSE -- revenue_general
                -- Todas as receitas
                SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
                INTO v_achieved
                FROM revenues
                WHERE unit_id = v_unit_id
                  AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
                  AND is_active = true;
            END IF;
        END IF;

    -- DESPESAS
    ELSIF v_goal_type = 'expenses' THEN

        IF v_category_id IS NOT NULL THEN
            SELECT COALESCE(SUM(value), 0)
            INTO v_achieved
            FROM expenses
            WHERE unit_id = v_unit_id
              AND category_id = v_category_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        ELSE
            SELECT COALESCE(SUM(value), 0)
            INTO v_achieved
            FROM expenses
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;
        END IF;

    -- LUCRO (usa mesma lógica do DRE)
    ELSIF v_goal_type = 'profit' THEN

        DECLARE
            v_receita_bruta numeric := 0;
            v_taxa_cartao numeric := 0;
            v_deducoes numeric := 0;
            v_despesas numeric := 0;
        BEGIN
            -- Receita Bruta
            SELECT COALESCE(SUM(COALESCE(net_amount, value)), 0)
            INTO v_receita_bruta
            FROM revenues
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;

            -- Taxa de Cartão
            SELECT COALESCE(SUM(
                COALESCE(r.net_amount, r.value) * (COALESCE(pm.fee_percentage, 0) / 100.0)
            ), 0)
            INTO v_taxa_cartao
            FROM revenues r
            JOIN payment_methods pm ON r.payment_method_id = pm.id
            WHERE r.unit_id = v_unit_id
              AND COALESCE(r.data_competencia, r.date) BETWEEN v_start_date AND v_end_date
              AND r.is_active = true
              AND pm.fee_percentage > 0;

            -- Deduções
            SELECT COALESCE(SUM(value), 0)
            INTO v_deducoes
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.unit_id = v_unit_id
              AND COALESCE(e.data_competencia, e.date) BETWEEN v_start_date AND v_end_date
              AND e.is_active = true
              AND (c.name ILIKE '%dedu%' OR c.name ILIKE '%desconto%');

            -- Despesas Totais
            SELECT COALESCE(SUM(value), 0)
            INTO v_despesas
            FROM expenses
            WHERE unit_id = v_unit_id
              AND COALESCE(data_competencia, date) BETWEEN v_start_date AND v_end_date
              AND is_active = true;

            -- Lucro = Receita - Taxa - Deduções - Despesas
            v_achieved := v_receita_bruta - v_taxa_cartao - v_deducoes - v_despesas;
        END;
    END IF;

    RETURN COALESCE(v_achieved, 0);
END;
$$;

COMMENT ON FUNCTION calculate_goal_achieved_value IS
'Calcula o valor atingido de uma meta com base no tipo, período e datas.
Versão 2.0 - Integrado com sistema financeiro (regime de competência + taxa de cartão).
Suporta períodos: monthly, quarterly, yearly.
Tipos: revenue_general, subscription, product_sales, expenses, profit.';
```

### **Script 2: Trigger de Atualização Automática**

```sql
-- Trigger para atualizar metas quando receitas/despesas mudam
CREATE OR REPLACE FUNCTION refresh_goals_on_financial_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualizar view materializada se existir
    -- Ou disparar evento para o frontend recalcular

    NOTIFY goals_updated, json_build_object(
        'unit_id', COALESCE(NEW.unit_id, OLD.unit_id),
        'date', COALESCE(NEW.data_competencia, NEW.date, OLD.data_competencia, OLD.date)
    )::text;

    RETURN NEW;
END;
$$;

-- Aplicar nos triggers
CREATE TRIGGER trg_revenue_change_update_goals
AFTER INSERT OR UPDATE OR DELETE ON revenues
FOR EACH ROW
EXECUTE FUNCTION refresh_goals_on_financial_change();

CREATE TRIGGER trg_expense_change_update_goals
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION refresh_goals_on_financial_change();
```

---

## 📋 Checklist de Implementação

### ✅ Imediato (Hoje)

- [ ] Executar fix_calculate_goal_achieved_value.sql
- [ ] Testar todas as 5 metas com dados reais
- [ ] Verificar se percentuais estão corretos
- [ ] Atualizar goalsService.js com novos campos

### 🔄 Curto Prazo (Esta Semana)

- [ ] Criar componente MetricasMetasCard
- [ ] Adicionar seção de metas no Dashboard
- [ ] Implementar triggers de atualização
- [ ] Criar testes automatizados

### 📊 Médio Prazo (Este Mês)

- [ ] Relatório de desempenho de metas
- [ ] Sistema de notificações
- [ ] Histórico de metas
- [ ] Análise preditiva

### 🚀 Longo Prazo (Próximo Trimestre)

- [ ] Dashboard executivo de metas
- [ ] Gamificação (rankings, badges)
- [ ] Integração com comissões
- [ ] App mobile com widget de metas

---

## 🎯 Resultado Esperado

Após a implementação completa:

1. ✅ **Cálculo Automático**: Metas sempre atualizadas em tempo real
2. ✅ **Regime de Competência**: Dados corretos conforme DRE
3. ✅ **Taxa de Cartão Deduzida**: Lucro real considerando taxas
4. ✅ **Todos os Períodos**: Monthly, quarterly, yearly funcionando
5. ✅ **Dashboard Visual**: Progresso claro e motivador
6. ✅ **Alertas Inteligentes**: Notificações quando necessário
7. ✅ **Relatórios Completos**: Análise detalhada de performance

---

**Próximo Passo:** Executar o Script 1 para corrigir a função de cálculo.
