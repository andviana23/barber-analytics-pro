-- Concede SELECT em todas as views que começam com vw_ para os roles do Supabase API
SET search_path TO public;

DO $$
DECLARE v record;
BEGIN
  FOR v IN 
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema='public' AND table_name LIKE 'vw_%'
  LOOP
    EXECUTE format('GRANT SELECT ON TABLE %I.%I TO anon, authenticated', 'public', v.table_name);
  END LOOP;
END $$;
