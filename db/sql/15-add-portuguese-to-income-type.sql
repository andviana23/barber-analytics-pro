-- ========================================
-- Migration: Add Portuguese values to income_type enum
-- Date: 2025-10-13
-- Description: Add servico, produto, assinatura, outros to income_type
-- ========================================

-- Add Portuguese values to the income_type enum
-- These values allow the frontend to send Portuguese type names
ALTER TYPE income_type ADD VALUE IF NOT EXISTS 'servico';
ALTER TYPE income_type ADD VALUE IF NOT EXISTS 'produto';
ALTER TYPE income_type ADD VALUE IF NOT EXISTS 'assinatura';
ALTER TYPE income_type ADD VALUE IF NOT EXISTS 'outros';

-- Verify the enum now has all values
SELECT 
    e.enumlabel AS enum_value,
    e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
    AND t.typname = 'income_type'
ORDER BY e.enumsortorder;

-- Expected result (should include both English and Portuguese values):
-- enum_value   | enumsortorder
-- -------------|---------------
-- service      | 1
-- subscription | 2
-- servico      | 3
-- produto      | 4
-- assinatura   | 5
-- outros       | 6

-- Add comment
COMMENT ON TYPE income_type IS 
'Revenue type enum - accepts both English (service, subscription) and Portuguese (servico, produto, assinatura, outros) values';
