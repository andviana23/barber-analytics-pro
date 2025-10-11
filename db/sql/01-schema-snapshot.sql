-- SCHEMA SNAPSHOT (public)
SET search_path TO public;

-- 1) Tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2) Columns per table
SELECT 
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- 3) Constraints (PK / FK / UNIQUE)
SELECT 
  tc.table_name,
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name  AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- 4) Indexes
SELECT 
  tab.relname AS table_name,
  idx.relname AS index_name,
  pg_get_indexdef(i.indexrelid) AS index_def
FROM pg_class tab
JOIN pg_index i ON tab.oid = i.indrelid
JOIN pg_class idx ON idx.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = tab.relnamespace
WHERE n.nspname = 'public'
ORDER BY tab.relname, idx.relname;

-- 5) ENUM types
SELECT 
  n.nspname AS schema,
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 6) Row count estimates for all public tables (fast, safe)
SELECT 
  n.nspname AS schema,
  c.relname AS table_name,
  c.reltuples::bigint AS estimated_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY estimated_rows DESC, table_name;

-- 7) Optional samples (uncomment tables that exist in your project)
-- SELECT * FROM expenses        LIMIT 5;
-- SELECT * FROM revenues        LIMIT 5;
-- SELECT * FROM units           LIMIT 5;
-- SELECT * FROM professionals   LIMIT 5;
-- SELECT * FROM service_queue   LIMIT 5;
-- SELECT * FROM monthly_summary LIMIT 5;
