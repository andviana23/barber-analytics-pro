-- Concede USAGE no schema e EXECUTE nas funções get_* para roles do Supabase
SET search_path TO public;

DO $$
DECLARE r record;
BEGIN
  -- Permite uso do schema
  EXECUTE 'GRANT USAGE ON SCHEMA public TO anon, authenticated';

  -- Concede EXECUTE para todas as funções que começam com get_
  FOR r IN
    SELECT p.oid::regprocedure AS regsig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'get_%'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', r.regsig);
  END LOOP;
END $$;
