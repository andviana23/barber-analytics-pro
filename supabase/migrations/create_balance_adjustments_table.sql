-- Migração: Criar tabela de ajustes de saldo inicial
-- Data: 5 de novembro de 2025
-- Descrição: Tabela para armazenar ajustes manuais de saldo inicial por período

-- 1. Criar tabela balance_adjustments
CREATE TABLE IF NOT EXISTS balance_adjustments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id uuid REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    period varchar(7) NOT NULL, -- Formato YYYY-MM
    amount decimal(15,2) NOT NULL DEFAULT 0, -- Valor do ajuste (pode ser positivo ou negativo)
    reason text, -- Motivo do ajuste
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    updated_by uuid REFERENCES auth.users(id) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_unit_period UNIQUE (unit_id, period, is_active),
    CONSTRAINT valid_period_format CHECK (period ~ '^\d{4}-\d{2}$'),
    CONSTRAINT valid_month CHECK (
        CAST(split_part(period, '-', 2) AS integer) BETWEEN 1 AND 12
    )
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_balance_adjustments_unit_period
ON balance_adjustments (unit_id, period) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_balance_adjustments_created_at
ON balance_adjustments (created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE balance_adjustments ENABLE ROW LEVEL SECURITY;

-- 4. Policies de segurança
-- SELECT: Usuário pode ver ajustes de suas unidades
CREATE POLICY "balance_adjustments_select_policy" ON balance_adjustments
FOR SELECT USING (
    unit_id IN (
        SELECT unit_id
        FROM professionals
        WHERE user_id = auth.uid()
        AND is_active = true
    )
);

-- INSERT: Apenas gerentes e admins podem criar ajustes
CREATE POLICY "balance_adjustments_insert_policy" ON balance_adjustments
FOR INSERT WITH CHECK (
    unit_id IN (
        SELECT unit_id
        FROM professionals
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('gerente', 'admin', 'administrador')
    )
);

-- UPDATE: Apenas gerentes e admins podem atualizar ajustes
CREATE POLICY "balance_adjustments_update_policy" ON balance_adjustments
FOR UPDATE USING (
    unit_id IN (
        SELECT unit_id
        FROM professionals
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('gerente', 'admin', 'administrador')
    )
);

-- DELETE: Apenas admins podem fazer soft delete
CREATE POLICY "balance_adjustments_delete_policy" ON balance_adjustments
FOR UPDATE USING (
    EXISTS (
        SELECT 1
        FROM professionals
        WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('admin', 'administrador')
    )
);

-- 5. Função para validar permissões de ajuste
CREATE OR REPLACE FUNCTION fn_can_manage_balance_adjustments(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário é gerente ou admin
    RETURN EXISTS (
        SELECT 1
        FROM professionals
        WHERE user_id = p_user_id
        AND is_active = true
        AND role IN ('gerente', 'admin', 'administrador')
    );
END;
$$;

-- 6. Função para buscar saldo ajustado de um período
CREATE OR REPLACE FUNCTION fn_get_adjusted_initial_balance(
    p_unit_id uuid,
    p_period varchar(7)
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_balance decimal(15,2) := 0;
    v_adjustment decimal(15,2) := 0;
    v_adjusted_balance decimal(15,2) := 0;
    v_previous_year integer;
    v_previous_month integer;
    v_start_date date;
    v_end_date date;
BEGIN
    -- Calcular período anterior
    v_previous_year := CAST(split_part(p_period, '-', 1) AS integer);
    v_previous_month := CAST(split_part(p_period, '-', 2) AS integer);

    IF v_previous_month = 1 THEN
        v_previous_month := 12;
        v_previous_year := v_previous_year - 1;
    ELSE
        v_previous_month := v_previous_month - 1;
    END IF;

    v_start_date := make_date(v_previous_year, v_previous_month, 1);
    v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

    -- Calcular saldo original do mês anterior
    SELECT
        COALESCE(SUM(CASE WHEN r.value IS NOT NULL THEN r.value ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN e.value IS NOT NULL THEN e.value ELSE 0 END), 0)
    INTO v_original_balance
    FROM (
        SELECT value FROM revenues
        WHERE unit_id = p_unit_id
        AND is_active = true
        AND date BETWEEN v_start_date AND v_end_date
    ) r
    FULL OUTER JOIN (
        SELECT value FROM expenses
        WHERE unit_id = p_unit_id
        AND is_active = true
        AND date BETWEEN v_start_date AND v_end_date
    ) e ON true;

    -- Buscar ajuste para o período
    SELECT COALESCE(amount, 0)
    INTO v_adjustment
    FROM balance_adjustments
    WHERE unit_id = p_unit_id
    AND period = p_period
    AND is_active = true;

    -- Calcular saldo ajustado
    v_adjusted_balance := v_original_balance + v_adjustment;

    -- Retornar resultado como JSON
    RETURN json_build_object(
        'original_balance', v_original_balance,
        'adjustment', v_adjustment,
        'adjusted_balance', v_adjusted_balance,
        'period', p_period
    );
END;
$$;

-- 7. Comentários
COMMENT ON TABLE balance_adjustments IS
'Tabela para armazenar ajustes manuais de saldo inicial por período';

COMMENT ON COLUMN balance_adjustments.period IS
'Período no formato YYYY-MM para o qual o ajuste se aplica';

COMMENT ON COLUMN balance_adjustments.amount IS
'Valor do ajuste (positivo para aumento, negativo para redução)';

COMMENT ON FUNCTION fn_get_adjusted_initial_balance(uuid, varchar) IS
'Função para calcular saldo inicial ajustado de um período específico';

-- 8. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_balance_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance_adjustments_updated_at
    BEFORE UPDATE ON balance_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_adjustments_updated_at();
