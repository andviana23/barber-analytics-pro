-- Fix RLS and Policies for public.payment_methods
-- Context: Project requires RLS enabled on ALL tables. Detected RLS disabled on payment_methods.
-- Goal: Enable RLS and define clear, role-aware policies aligned with docs.

BEGIN;

-- 1) Enable RLS on table (idempotent-safe: only runs if currently disabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'payment_methods' AND c.relrowsecurity = TRUE
  ) THEN
    EXECUTE 'ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- 2) Drop legacy/ambiguous policies if present (to avoid conflicts)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'gerente_no_modify_payment_methods'
  ) THEN
    EXECUTE 'DROP POLICY "gerente_no_modify_payment_methods" ON public.payment_methods';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'gerente_select_payment_methods'
  ) THEN
    EXECUTE 'DROP POLICY "gerente_select_payment_methods" ON public.payment_methods';
  END IF;
END $$;

-- 3) SELECT policy: Admin OR Gerente (ativo e vinculado à unidade) OR Dono da unidade
CREATE POLICY "payment_methods_select"
  ON public.payment_methods
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'admin'
    OR (
      get_user_role() = 'gerente'
      AND unit_id IN (
        SELECT p.unit_id FROM professionals p
        WHERE p.user_id = auth.uid() AND p.is_active = TRUE
      )
    )
    OR unit_id IN (
      SELECT u.id FROM units u WHERE u.user_id = auth.uid()
    )
  );

-- 4) INSERT policy: Somente Admin ou Dono da unidade
CREATE POLICY "payment_methods_insert"
  ON public.payment_methods
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() = 'admin'
    OR unit_id IN (
      SELECT u.id FROM units u WHERE u.user_id = auth.uid()
    )
  );

-- 5) UPDATE policy: Somente Admin ou Dono da unidade
CREATE POLICY "payment_methods_update"
  ON public.payment_methods
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    OR unit_id IN (
      SELECT u.id FROM units u WHERE u.user_id = auth.uid()
    )
  )
  WITH CHECK (
    get_user_role() = 'admin'
    OR unit_id IN (
      SELECT u.id FROM units u WHERE u.user_id = auth.uid()
    )
  );

-- 6) DELETE policy: Somente Admin ou Dono da unidade
CREATE POLICY "payment_methods_delete"
  ON public.payment_methods
  FOR DELETE
  TO authenticated
  USING (
    get_user_role() = 'admin'
    OR unit_id IN (
      SELECT u.id FROM units u WHERE u.user_id = auth.uid()
    )
  );

COMMIT;

-- Notes:
-- - get_user_role() já normaliza 'administrador' => 'admin'.
-- - Profissional (gerente) tem apenas leitura; criação/edição/remoção restrita a admin e dono da unidade.
-- - Todas as policies direcionadas ao papel built-in 'authenticated'.
-- - Mantém alinhado com as "Regras Críticas" do projeto (docs/FIX_RLS_ADMINISTRADOR_ROLE.md).
