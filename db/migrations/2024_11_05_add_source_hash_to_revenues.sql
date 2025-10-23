-- Migration: Add source_hash column to revenues table for deduplication
-- This column stores an MD5 hash of date-value-source to prevent duplicate imports

-- Add column if it doesn't exist
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS source_hash VARCHAR(32);

-- Create index for fast deduplication checks
CREATE INDEX IF NOT EXISTS idx_revenues_source_hash 
ON revenues(source_hash) 
WHERE source_hash IS NOT NULL;

-- Create unique index per unit to prevent duplicates within same unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenues_source_hash_unit 
ON revenues(unit_id, source_hash) 
WHERE source_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN revenues.source_hash IS 'MD5 hash of date-value-source for import deduplication';

-- Exemplo de uso:
-- SELECT source_hash FROM revenues WHERE unit_id = 'xxx' AND source_hash IN ('hash1', 'hash2');


