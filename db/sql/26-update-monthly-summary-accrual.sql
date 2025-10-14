-- =====================================================
-- Migration: 26-update-monthly-summary-accrual.sql
-- Descrição: Atualizar função update_monthly_summary para suporte a competência/caixa
-- Data: 2025-10-13
-- Autor: Barber Analytics Pro
-- =====================================================

-- Recriar a função update_monthly_summary com suporte a competência/caixa
CREATE OR REPLACE FUNCTION update_monthly_summary()
RETURNS TRIGGER AS $$
DECLARE
    target_unit_id UUID;
    target_month INTEGER;
    target_year INTEGER;
    
    -- Variáveis para cálculos de competência
    comp_month INTEGER;
    comp_year INTEGER;
    
    -- Variáveis para cálculos de caixa
    cash_month INTEGER;
    cash_year INTEGER;
BEGIN
    -- Determinar a unidade
    IF TG_TABLE_NAME = 'revenues' THEN
        target_unit_id = COALESCE(NEW.unit_id, OLD.unit_id);
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        target_unit_id = COALESCE(NEW.unit_id, OLD.unit_id);
    END IF;

    -- Para REVENUES
    IF TG_TABLE_NAME = 'revenues' THEN
        
        -- Atualizar por COMPETÊNCIA (quando competencia_inicio existir)
        IF NEW.competencia_inicio IS NOT NULL OR OLD.competencia_inicio IS NOT NULL THEN
            comp_month = EXTRACT(MONTH FROM COALESCE(NEW.competencia_inicio, OLD.competencia_inicio));
            comp_year = EXTRACT(YEAR FROM COALESCE(NEW.competencia_inicio, OLD.competencia_inicio));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                comp_month,
                comp_year,
                (SELECT COALESCE(SUM(valor_liquido), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM competencia_inicio) = comp_month 
                 AND EXTRACT(YEAR FROM competencia_inicio) = comp_year),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM competencia_inicio) = comp_month 
                 AND EXTRACT(YEAR FROM competencia_inicio) = comp_year),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_revenue = (SELECT COALESCE(SUM(valor_liquido), 0) FROM revenues 
                               WHERE unit_id = target_unit_id 
                               AND EXTRACT(MONTH FROM competencia_inicio) = comp_month 
                               AND EXTRACT(YEAR FROM competencia_inicio) = comp_year),
                net_profit = EXCLUDED.total_revenue - monthly_summary.total_expenses;
        END IF;
        
        -- Atualizar por CAIXA (quando data_recebimento_efetivo existir)
        IF NEW.data_recebimento_efetivo IS NOT NULL OR OLD.data_recebimento_efetivo IS NOT NULL THEN
            cash_month = EXTRACT(MONTH FROM COALESCE(NEW.data_recebimento_efetivo, OLD.data_recebimento_efetivo));
            cash_year = EXTRACT(YEAR FROM COALESCE(NEW.data_recebimento_efetivo, OLD.data_recebimento_efetivo));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                cash_month,
                cash_year,
                (SELECT COALESCE(SUM(valor_liquido), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM data_recebimento_efetivo) = cash_month 
                 AND EXTRACT(YEAR FROM data_recebimento_efetivo) = cash_year
                 AND data_recebimento_efetivo IS NOT NULL),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM data_pagamento_efetivo) = cash_month 
                 AND EXTRACT(YEAR FROM data_pagamento_efetivo) = cash_year
                 AND data_pagamento_efetivo IS NOT NULL),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_revenue = (SELECT COALESCE(SUM(valor_liquido), 0) FROM revenues 
                               WHERE unit_id = target_unit_id 
                               AND EXTRACT(MONTH FROM data_recebimento_efetivo) = cash_month 
                               AND EXTRACT(YEAR FROM data_recebimento_efetivo) = cash_year
                               AND data_recebimento_efetivo IS NOT NULL),
                net_profit = EXCLUDED.total_revenue - monthly_summary.total_expenses;
        END IF;
        
        -- Fallback para compatibilidade com dados antigos (campo date)
        IF (NEW.competencia_inicio IS NULL AND OLD.competencia_inicio IS NULL) AND
           (NEW.data_recebimento_efetivo IS NULL AND OLD.data_recebimento_efetivo IS NULL) THEN
            target_month = EXTRACT(MONTH FROM COALESCE(NEW.date, OLD.date));
            target_year = EXTRACT(YEAR FROM COALESCE(NEW.date, OLD.date));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                target_month,
                target_year,
                (SELECT COALESCE(SUM(COALESCE(valor_liquido, value)), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM date) = target_month 
                 AND EXTRACT(YEAR FROM date) = target_year),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM date) = target_month 
                 AND EXTRACT(YEAR FROM date) = target_year),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_revenue = (SELECT COALESCE(SUM(COALESCE(valor_liquido, value)), 0) FROM revenues 
                               WHERE unit_id = target_unit_id 
                               AND EXTRACT(MONTH FROM date) = target_month 
                               AND EXTRACT(YEAR FROM date) = target_year),
                net_profit = EXCLUDED.total_revenue - monthly_summary.total_expenses;
        END IF;
        
    -- Para EXPENSES
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        
        -- Atualizar por COMPETÊNCIA (quando competencia_inicio existir)
        IF NEW.competencia_inicio IS NOT NULL OR OLD.competencia_inicio IS NOT NULL THEN
            comp_month = EXTRACT(MONTH FROM COALESCE(NEW.competencia_inicio, OLD.competencia_inicio));
            comp_year = EXTRACT(YEAR FROM COALESCE(NEW.competencia_inicio, OLD.competencia_inicio));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                comp_month,
                comp_year,
                (SELECT COALESCE(SUM(COALESCE(valor_liquido, value)), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM COALESCE(competencia_inicio, date)) = comp_month 
                 AND EXTRACT(YEAR FROM COALESCE(competencia_inicio, date)) = comp_year),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM competencia_inicio) = comp_month 
                 AND EXTRACT(YEAR FROM competencia_inicio) = comp_year),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_expenses = (SELECT COALESCE(SUM(value), 0) FROM expenses 
                                WHERE unit_id = target_unit_id 
                                AND EXTRACT(MONTH FROM competencia_inicio) = comp_month 
                                AND EXTRACT(YEAR FROM competencia_inicio) = comp_year),
                net_profit = monthly_summary.total_revenue - EXCLUDED.total_expenses;
        END IF;
        
        -- Atualizar por CAIXA (quando data_pagamento_efetivo existir)
        IF NEW.data_pagamento_efetivo IS NOT NULL OR OLD.data_pagamento_efetivo IS NOT NULL THEN
            cash_month = EXTRACT(MONTH FROM COALESCE(NEW.data_pagamento_efetivo, OLD.data_pagamento_efetivo));
            cash_year = EXTRACT(YEAR FROM COALESCE(NEW.data_pagamento_efetivo, OLD.data_pagamento_efetivo));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                cash_month,
                cash_year,
                (SELECT COALESCE(SUM(COALESCE(valor_liquido, value)), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM COALESCE(data_recebimento_efetivo, date)) = cash_month 
                 AND EXTRACT(YEAR FROM COALESCE(data_recebimento_efetivo, date)) = cash_year),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM data_pagamento_efetivo) = cash_month 
                 AND EXTRACT(YEAR FROM data_pagamento_efetivo) = cash_year
                 AND data_pagamento_efetivo IS NOT NULL),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_expenses = (SELECT COALESCE(SUM(value), 0) FROM expenses 
                                WHERE unit_id = target_unit_id 
                                AND EXTRACT(MONTH FROM data_pagamento_efetivo) = cash_month 
                                AND EXTRACT(YEAR FROM data_pagamento_efetivo) = cash_year
                                AND data_pagamento_efetivo IS NOT NULL),
                net_profit = monthly_summary.total_revenue - EXCLUDED.total_expenses;
        END IF;
        
        -- Fallback para compatibilidade com dados antigos (campo date)
        IF (NEW.competencia_inicio IS NULL AND OLD.competencia_inicio IS NULL) AND
           (NEW.data_pagamento_efetivo IS NULL AND OLD.data_pagamento_efetivo IS NULL) THEN
            target_month = EXTRACT(MONTH FROM COALESCE(NEW.date, OLD.date));
            target_year = EXTRACT(YEAR FROM COALESCE(NEW.date, OLD.date));
            
            INSERT INTO monthly_summary (unit_id, month, year, total_revenue, total_expenses, net_profit, total_appointments, average_ticket)
            VALUES (
                target_unit_id,
                target_month,
                target_year,
                (SELECT COALESCE(SUM(COALESCE(valor_liquido, value)), 0) FROM revenues 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM date) = target_month 
                 AND EXTRACT(YEAR FROM date) = target_year),
                (SELECT COALESCE(SUM(value), 0) FROM expenses 
                 WHERE unit_id = target_unit_id 
                 AND EXTRACT(MONTH FROM date) = target_month 
                 AND EXTRACT(YEAR FROM date) = target_year),
                0, 0, 0
            )
            ON CONFLICT (unit_id, month, year) DO UPDATE SET
                total_expenses = (SELECT COALESCE(SUM(value), 0) FROM expenses 
                                WHERE unit_id = target_unit_id 
                                AND EXTRACT(MONTH FROM date) = target_month 
                                AND EXTRACT(YEAR FROM date) = target_year),
                net_profit = monthly_summary.total_revenue - EXCLUDED.total_expenses;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_monthly_summary IS 'Função atualizada para calcular resumos mensais por competência ou caixa, com fallback para dados legados';

-- =====================================================
-- FUNCTION PARA GERAR DRE POR COMPETÊNCIA OU CAIXA
-- =====================================================

CREATE OR REPLACE FUNCTION get_dre_by_period(
    p_unit_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_base_calculo TEXT DEFAULT 'caixa' -- 'competencia' ou 'caixa'
)
RETURNS TABLE (
    tipo TEXT,
    categoria TEXT,
    valor_total NUMERIC,
    quantidade BIGINT
) AS $$
BEGIN
    IF p_base_calculo = 'competencia' THEN
        RETURN QUERY
        SELECT 
            'Receita'::TEXT AS tipo,
            r.type::TEXT AS categoria,
            SUM(COALESCE(r.valor_liquido, r.value)) AS valor_total,
            COUNT(*) AS quantidade
        FROM revenues r
        WHERE r.unit_id = p_unit_id
        AND COALESCE(r.competencia_inicio, r.date) BETWEEN p_start_date AND p_end_date
        GROUP BY r.type
        
        UNION ALL
        
        SELECT 
            'Despesa'::TEXT AS tipo,
            e.type::TEXT AS categoria,
            SUM(e.value) AS valor_total,
            COUNT(*) AS quantidade
        FROM expenses e
        WHERE e.unit_id = p_unit_id
        AND COALESCE(e.competencia_inicio, e.date) BETWEEN p_start_date AND p_end_date
        GROUP BY e.type;
    ELSE
        -- Base caixa
        RETURN QUERY
        SELECT 
            'Receita'::TEXT AS tipo,
            r.type::TEXT AS categoria,
            SUM(COALESCE(r.valor_liquido, r.value)) AS valor_total,
            COUNT(*) AS quantidade
        FROM revenues r
        WHERE r.unit_id = p_unit_id
        AND (
            (r.data_recebimento_efetivo IS NOT NULL AND r.data_recebimento_efetivo BETWEEN p_start_date AND p_end_date)
            OR (r.data_recebimento_efetivo IS NULL AND r.date BETWEEN p_start_date AND p_end_date)
        )
        GROUP BY r.type
        
        UNION ALL
        
        SELECT 
            'Despesa'::TEXT AS tipo,
            e.type::TEXT AS categoria,
            SUM(e.value) AS valor_total,
            COUNT(*) AS quantidade
        FROM expenses e
        WHERE e.unit_id = p_unit_id
        AND (
            (e.data_pagamento_efetivo IS NOT NULL AND e.data_pagamento_efetivo BETWEEN p_start_date AND p_end_date)
            OR (e.data_pagamento_efetivo IS NULL AND e.date BETWEEN p_start_date AND p_end_date)
        )
        GROUP BY e.type;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dre_by_period IS 'Gera DRE (Demonstração de Resultado) por competência ou caixa para um período específico';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================