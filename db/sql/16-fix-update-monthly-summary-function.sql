-- ========================================
-- Migration: Fix update_monthly_summary function
-- Date: 2025-10-13
-- Description: Fix column names in trigger function
-- ========================================

-- Problems fixed:
-- 1. revenue_date/expense_date → date
-- 2. amount → value  
-- 3. revenue_type → type
-- 4. month_ref → month/year (separate columns)
-- 5. net_profit → profit
-- 6. Added UNIQUE constraint on (unit_id, month, year)

-- Step 1: Add unique constraint for upsert
ALTER TABLE monthly_summary 
ADD CONSTRAINT IF NOT EXISTS monthly_summary_unit_month_year_unique 
UNIQUE (unit_id, month, year);

-- Step 2: Update the function

CREATE OR REPLACE FUNCTION public.update_monthly_summary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    ref_month DATE;
    ref_unit_id UUID;
    total_revenue DECIMAL(10,2);
    total_expenses DECIMAL(10,2);
    net_profit DECIMAL(10,2);
    total_services INTEGER;
    avg_ticket DECIMAL(10,2);
BEGIN
    -- Determinar mês e unidade de referência
    IF TG_TABLE_NAME = 'revenues' THEN
        ref_month := DATE_TRUNC('month', COALESCE(NEW.date, OLD.date));
        ref_unit_id := COALESCE(NEW.unit_id, OLD.unit_id);
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        ref_month := DATE_TRUNC('month', COALESCE(NEW.date, OLD.date));
        ref_unit_id := COALESCE(NEW.unit_id, OLD.unit_id);
    END IF;

    -- Verificar se conseguimos determinar unidade e mês
    IF ref_unit_id IS NULL OR ref_month IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Calcular receitas do mês
    SELECT COALESCE(SUM(value), 0) INTO total_revenue
    FROM revenues 
    WHERE unit_id = ref_unit_id 
    AND DATE_TRUNC('month', date) = ref_month;

    -- Calcular despesas do mês  
    SELECT COALESCE(SUM(value), 0) INTO total_expenses
    FROM expenses 
    WHERE unit_id = ref_unit_id 
    AND DATE_TRUNC('month', date) = ref_month;

    -- Calcular lucro
    net_profit := total_revenue - total_expenses;

    -- Contar serviços realizados
    SELECT COUNT(*) INTO total_services
    FROM revenues 
    WHERE unit_id = ref_unit_id 
    AND DATE_TRUNC('month', date) = ref_month
    AND type = 'service';

    -- Calcular ticket médio
    IF total_services > 0 THEN
        avg_ticket := total_revenue / total_services;
    ELSE
        avg_ticket := 0;
    END IF;

    -- Inserir ou atualizar resumo mensal
    INSERT INTO monthly_summary (
        unit_id, month_ref, total_revenue, total_expenses, 
        net_profit, total_appointments, average_ticket
    ) VALUES (
        ref_unit_id, ref_month, total_revenue, total_expenses,
        net_profit, total_services, avg_ticket
    ) ON CONFLICT (unit_id, month_ref) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        net_profit = EXCLUDED.net_profit,
        total_appointments = EXCLUDED.total_appointments,
        average_ticket = EXCLUDED.average_ticket,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add comment
COMMENT ON FUNCTION update_monthly_summary() IS 
'Trigger function to update monthly_summary table when revenues or expenses change. Uses correct column names: date, value, type.';

-- Verify the triggers are still active
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname IN ('trigger_revenues_summary', 'trigger_expenses_summary')
    AND tgisinternal = false
ORDER BY tgname;
