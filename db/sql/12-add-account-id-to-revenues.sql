-- ========================================
-- Add account_id field to revenues table
-- ========================================
-- This migration adds a nullable account_id column to the revenues table
-- to link revenues with bank accounts
-- ========================================

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'revenues' 
        AND column_name = 'account_id'
    ) THEN
        -- Add account_id column
        ALTER TABLE revenues 
        ADD COLUMN account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
        
        -- Add index for better query performance
        CREATE INDEX idx_revenues_account_id ON revenues(account_id);
        
        -- Add comment to document the column
        COMMENT ON COLUMN revenues.account_id IS 'Bank account associated with this revenue entry';
        
        RAISE NOTICE 'Column account_id added to revenues table successfully';
    ELSE
        RAISE NOTICE 'Column account_id already exists in revenues table';
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'revenues'
    AND column_name = 'account_id';
