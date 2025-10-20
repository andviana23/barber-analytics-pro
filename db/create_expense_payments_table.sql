-- Migration: Create expense_payments table for detailed payment tracking
-- This table stores detailed information about expense payments (baixas)

CREATE TABLE IF NOT EXISTS expense_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bank_id UUID REFERENCES bank_accounts(id),
    
    -- Financial values
    paid_value NUMERIC(10,2) NOT NULL CHECK (paid_value > 0),
    interest_value NUMERIC(10,2) DEFAULT 0 CHECK (interest_value >= 0),
    discount_value NUMERIC(10,2) DEFAULT 0 CHECK (discount_value >= 0),
    
    -- Additional information
    observation TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_expense_payments_expense_id ON expense_payments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_unit_id ON expense_payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_expense_payments_payment_date ON expense_payments(payment_date);

-- Add RLS policies
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view expense payments from their units
CREATE POLICY "Users can view expense payments from their units"
ON expense_payments FOR SELECT
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert expense payments in their units
CREATE POLICY "Users can insert expense payments in their units"
ON expense_payments FOR INSERT
WITH CHECK (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can update expense payments in their units
CREATE POLICY "Users can update expense payments in their units"
ON expense_payments FOR UPDATE
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can delete expense payments in their units
CREATE POLICY "Users can delete expense payments in their units"
ON expense_payments FOR DELETE
USING (
    unit_id IN (
        SELECT id FROM units 
        WHERE user_id = auth.uid()
    )
);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_expense_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_expense_payments_updated_at
    BEFORE UPDATE ON expense_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_payments_updated_at();

-- Add comment
COMMENT ON TABLE expense_payments IS 'Detailed payment tracking for expenses (baixas)';
COMMENT ON COLUMN expense_payments.paid_value IS 'Amount actually paid';
COMMENT ON COLUMN expense_payments.interest_value IS 'Interest charged on late payment';
COMMENT ON COLUMN expense_payments.discount_value IS 'Discount applied to payment';
COMMENT ON COLUMN expense_payments.observation IS 'Additional notes about the payment';
