-- ========================================
-- Migration: Add observations column to revenues
-- Date: 2025-10-13
-- Description: Add observations text field to revenues table
-- ========================================

-- Add observations column (TEXT, nullable)
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Add comment to document the column
COMMENT ON COLUMN revenues.observations IS 'Additional notes or observations about this revenue entry';

-- Verify the column was created
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'revenues'
    AND column_name = 'observations';

-- Expected result:
-- column_name  | data_type | is_nullable | column_default
-- -------------|-----------|-------------|---------------
-- observations | text      | YES         | null
