-- =====================================================
-- MIGRATION: Financial Module Complete Schema
-- =====================================================
-- Description: Creates all core tables for the financial module
-- Author: AI Assistant
-- Created: 2025-10-22
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- 1. BANK ACCOUNTS TABLE
-- =====================================================
-- Stores information about bank accounts used by units

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    account_number VARCHAR(50),
    agency VARCHAR(20),
    account_type VARCHAR(50), -- 'Corrente', 'Poupança', 'Investimento'
    initial_balance DECIMAL(15, 2) DEFAULT 0,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT bank_accounts_name_unique UNIQUE (unit_id, name)
);

-- Indexes for bank_accounts
CREATE INDEX IF NOT EXISTS idx_bank_accounts_unit_id ON bank_accounts(unit_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_active ON bank_accounts(is_active);

-- =====================================================
-- 2. PAYMENT METHODS TABLE
-- =====================================================
-- Stores payment methods available for transactions

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- 'PIX', 'Cartão', 'Dinheiro', 'Transferência'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT payment_methods_name_unique UNIQUE (unit_id, name)
);

-- Indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_unit_id ON payment_methods(unit_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);

-- =====================================================
-- 3. PARTIES TABLE
-- =====================================================
-- Stores clients, suppliers, and other parties

CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50), -- 'Cliente', 'Fornecedor', 'Ambos'
    cpf_cnpj VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for parties
CREATE INDEX IF NOT EXISTS idx_parties_unit_id ON parties(unit_id);
CREATE INDEX IF NOT EXISTS idx_parties_is_active ON parties(is_active);
CREATE INDEX IF NOT EXISTS idx_parties_tipo ON parties(tipo);
CREATE INDEX IF NOT EXISTS idx_parties_nome ON parties(nome);

-- =====================================================
-- 4. CATEGORIES TABLE
-- =====================================================
-- Hierarchical categories for revenues and expenses

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL, -- 'Revenue', 'Expense'
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT categories_name_unique UNIQUE (unit_id, name, category_type)
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_unit_id ON categories(unit_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- =====================================================
-- 5. REVENUES TABLE
-- =====================================================
-- Stores all revenue transactions

CREATE TABLE IF NOT EXISTS revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
    
    -- Core fields
    source VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(15, 2) NOT NULL CHECK (value >= 0),
    
    -- Dates
    date DATE, -- Data de pagamento real
    expected_receipt_date DATE, -- Previsão de recebimento
    actual_receipt_date DATE, -- Data real de recebimento
    data_competencia DATE, -- Data de competência contábil
    
    -- Status and control
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Received', 'Cancelled'
    is_active BOOLEAN DEFAULT true,
    reconciled BOOLEAN DEFAULT false,
    source_hash VARCHAR(64), -- Hash para deduplicação
    
    -- Metadata
    observations TEXT,
    tags TEXT[],
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT revenues_value_positive CHECK (value >= 0)
);

-- Indexes for revenues
CREATE INDEX IF NOT EXISTS idx_revenues_unit_id ON revenues(unit_id);
CREATE INDEX IF NOT EXISTS idx_revenues_category_id ON revenues(category_id);
CREATE INDEX IF NOT EXISTS idx_revenues_party_id ON revenues(party_id);
CREATE INDEX IF NOT EXISTS idx_revenues_professional_id ON revenues(professional_id);
CREATE INDEX IF NOT EXISTS idx_revenues_account_id ON revenues(account_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date);
CREATE INDEX IF NOT EXISTS idx_revenues_expected_receipt_date ON revenues(expected_receipt_date);
CREATE INDEX IF NOT EXISTS idx_revenues_status ON revenues(status);
CREATE INDEX IF NOT EXISTS idx_revenues_is_active ON revenues(is_active);
CREATE INDEX IF NOT EXISTS idx_revenues_reconciled ON revenues(reconciled);
CREATE INDEX IF NOT EXISTS idx_revenues_source_hash ON revenues(source_hash);
CREATE INDEX IF NOT EXISTS idx_revenues_data_competencia ON revenues(data_competencia);

-- =====================================================
-- 6. EXPENSES TABLE
-- =====================================================
-- Stores all expense transactions

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    
    -- Core fields
    description VARCHAR(255) NOT NULL,
    value DECIMAL(15, 2) NOT NULL CHECK (value >= 0),
    paid_value DECIMAL(15, 2),
    
    -- Dates
    date DATE, -- Data de emissão
    expected_payment_date DATE NOT NULL, -- Data de vencimento
    payment_date DATE, -- Data de pagamento real
    actual_payment_date DATE, -- Data real de pagamento
    data_competencia DATE, -- Data de competência contábil
    
    -- Payment details
    forma_pagamento VARCHAR(50),
    
    -- Status and control
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    is_active BOOLEAN DEFAULT true,
    reconciled BOOLEAN DEFAULT false,
    source_hash VARCHAR(64), -- Hash para deduplicação
    
    -- Metadata
    observations TEXT,
    tags TEXT[],
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT expenses_value_positive CHECK (value >= 0)
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_unit_id ON expenses(unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_party_id ON expenses(party_id);
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_expected_payment_date ON expenses(expected_payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_is_active ON expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_expenses_reconciled ON expenses(reconciled);
CREATE INDEX IF NOT EXISTS idx_expenses_source_hash ON expenses(source_hash);
CREATE INDEX IF NOT EXISTS idx_expenses_data_competencia ON expenses(data_competencia);

-- =====================================================
-- 7. BANK STATEMENTS TABLE
-- =====================================================
-- Stores imported bank statement transactions

CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(20), -- 'credit', 'debit'
    balance_after DECIMAL(15, 2),
    
    -- Reconciliation
    reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_with_type VARCHAR(50), -- 'revenue', 'expense'
    reconciled_with_id UUID,
    
    -- Import metadata
    import_batch_id UUID,
    source_file VARCHAR(255),
    source_line_number INTEGER,
    source_hash VARCHAR(64) UNIQUE,
    
    -- Control
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bank_statements
CREATE INDEX IF NOT EXISTS idx_bank_statements_unit_id ON bank_statements(unit_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_account_id ON bank_statements(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_transaction_date ON bank_statements(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_statements_reconciled ON bank_statements(reconciled);
CREATE INDEX IF NOT EXISTS idx_bank_statements_import_batch_id ON bank_statements(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_source_hash ON bank_statements(source_hash);

-- =====================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parties_updated_at ON parties;
CREATE TRIGGER update_parties_updated_at
    BEFORE UPDATE ON parties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revenues_updated_at ON revenues;
CREATE TRIGGER update_revenues_updated_at
    BEFORE UPDATE ON revenues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_statements_updated_at ON bank_statements;
CREATE TRIGGER update_bank_statements_updated_at
    BEFORE UPDATE ON bank_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE bank_accounts IS 'Stores bank accounts information for each unit';
COMMENT ON TABLE payment_methods IS 'Available payment methods for transactions';
COMMENT ON TABLE parties IS 'Clients, suppliers and other transaction parties';
COMMENT ON TABLE categories IS 'Hierarchical categories for revenues and expenses';
COMMENT ON TABLE revenues IS 'All revenue transactions with competency dates';
COMMENT ON TABLE expenses IS 'All expense transactions with payment tracking';
COMMENT ON TABLE bank_statements IS 'Imported bank statement transactions for reconciliation';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
