-- =====================================================
-- MIGRATION: Financial Module RLS Policies
-- =====================================================
-- Description: Row Level Security policies for financial module
-- Author: AI Assistant
-- Created: 2025-10-22
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL FINANCIAL TABLES
-- =====================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get user's accessible unit IDs
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_unit_ids()
RETURNS TABLE (unit_id UUID) AS $$
BEGIN
    -- Admin can access all units
    IF (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') THEN
        RETURN QUERY SELECT id FROM units WHERE is_active = true;
    ELSE
        -- Non-admin users can only access their own unit
        RETURN QUERY 
        SELECT p.unit_id 
        FROM professionals p
        WHERE p.user_id = auth.uid() 
        AND p.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. BANK ACCOUNTS POLICIES
-- =====================================================

-- View own unit's bank accounts
CREATE POLICY "Users can view bank accounts from their unit"
    ON bank_accounts FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Admin can insert bank accounts
CREATE POLICY "Admin can insert bank accounts"
    ON bank_accounts FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Admin and managers can update bank accounts
CREATE POLICY "Admin and managers can update bank accounts"
    ON bank_accounts FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin can delete (soft delete) bank accounts
CREATE POLICY "Admin can delete bank accounts"
    ON bank_accounts FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- 2. PAYMENT METHODS POLICIES
-- =====================================================

-- View own unit's payment methods
CREATE POLICY "Users can view payment methods from their unit"
    ON payment_methods FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Admin can insert payment methods
CREATE POLICY "Admin can insert payment methods"
    ON payment_methods FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Admin and managers can update payment methods
CREATE POLICY "Admin and managers can update payment methods"
    ON payment_methods FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- =====================================================
-- 3. PARTIES POLICIES
-- =====================================================

-- View own unit's parties
CREATE POLICY "Users can view parties from their unit"
    ON parties FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- All authenticated users can insert parties (for their unit)
CREATE POLICY "Users can insert parties for their unit"
    ON parties FOR INSERT
    WITH CHECK (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can update parties from their unit
CREATE POLICY "Users can update parties from their unit"
    ON parties FOR UPDATE
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin can delete parties
CREATE POLICY "Admin can delete parties"
    ON parties FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- 4. CATEGORIES POLICIES
-- =====================================================

-- View own unit's categories
CREATE POLICY "Users can view categories from their unit"
    ON categories FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Admin can insert categories
CREATE POLICY "Admin can insert categories"
    ON categories FOR INSERT
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Admin and managers can update categories
CREATE POLICY "Admin and managers can update categories"
    ON categories FOR UPDATE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- =====================================================
-- 5. REVENUES POLICIES
-- =====================================================

-- View own unit's revenues
CREATE POLICY "Users can view revenues from their unit"
    ON revenues FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Users can insert revenues for their unit
CREATE POLICY "Users can insert revenues for their unit"
    ON revenues FOR INSERT
    WITH CHECK (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can update revenues from their unit
CREATE POLICY "Users can update revenues from their unit"
    ON revenues FOR UPDATE
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin and managers can delete revenues
CREATE POLICY "Admin and managers can delete revenues"
    ON revenues FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- =====================================================
-- 6. EXPENSES POLICIES
-- =====================================================

-- View own unit's expenses
CREATE POLICY "Users can view expenses from their unit"
    ON expenses FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Users can insert expenses for their unit
CREATE POLICY "Users can insert expenses for their unit"
    ON expenses FOR INSERT
    WITH CHECK (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can update expenses from their unit
CREATE POLICY "Users can update expenses from their unit"
    ON expenses FOR UPDATE
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin and managers can delete expenses
CREATE POLICY "Admin and managers can delete expenses"
    ON expenses FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- =====================================================
-- 7. BANK STATEMENTS POLICIES
-- =====================================================

-- View own unit's bank statements
CREATE POLICY "Users can view bank statements from their unit"
    ON bank_statements FOR SELECT
    USING (unit_id IN (SELECT get_user_unit_ids()));

-- Users can insert bank statements for their unit
CREATE POLICY "Users can insert bank statements for their unit"
    ON bank_statements FOR INSERT
    WITH CHECK (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can update bank statements from their unit (for reconciliation)
CREATE POLICY "Users can update bank statements from their unit"
    ON bank_statements FOR UPDATE
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin can delete bank statements
CREATE POLICY "Admin can delete bank statements"
    ON bank_statements FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================================================
-- 8. RECONCILIATIONS POLICIES
-- =====================================================

-- View own unit's reconciliations
CREATE POLICY "Users can view reconciliations from their unit"
    ON reconciliations FOR SELECT
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can insert reconciliations for their unit
CREATE POLICY "Users can insert reconciliations for their unit"
    ON reconciliations FOR INSERT
    WITH CHECK (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Users can update reconciliations from their unit
CREATE POLICY "Users can update reconciliations from their unit"
    ON reconciliations FOR UPDATE
    USING (
        unit_id IN (SELECT get_user_unit_ids())
    );

-- Admin and managers can delete reconciliations
CREATE POLICY "Admin and managers can delete reconciliations"
    ON reconciliations FOR DELETE
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'gerente')
        AND unit_id IN (SELECT get_user_unit_ids())
    );

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON parties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON revenues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bank_statements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reconciliations TO authenticated;

-- =====================================================
-- END OF RLS POLICIES
-- =====================================================
