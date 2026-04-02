-- =====================================================
-- MP WEALTH SYSTEM - Production Database Schema
-- =====================================================
-- Version: 2.0.0
-- Owner: Marlon Pontomudis
-- PostgreSQL 15+ | Supabase
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE account_type AS ENUM ('LIVE', 'DEMO');
CREATE TYPE account_status AS ENUM ('ONLINE', 'IDLE', 'OFFLINE', 'NEVER_SYNCED');
CREATE TYPE data_source AS ENUM ('EA', 'MetaApi', 'Manual');
CREATE TYPE trade_type AS ENUM ('BUY', 'SELL');
CREATE TYPE category_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transaction_source AS ENUM ('manual', 'whatsapp', 'ai', 'bulk_upload');
CREATE TYPE asset_type AS ENUM ('cash', 'bank', 'trading', 'investment', 'crypto');
CREATE TYPE budget_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE message_type AS ENUM ('text', 'image', 'audio', 'video', 'document');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE validation_result AS ENUM ('approved', 'rejected', 'modified');
CREATE TYPE log_level AS ENUM ('INFO', 'WARNING', 'ERROR', 'DEBUG');
CREATE TYPE theme_mode AS ENUM ('light', 'dark', 'auto');

-- =====================================================
-- TABLES - Trading Domain
-- =====================================================

CREATE TABLE broker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_name VARCHAR(50) NOT NULL,
    broker_code VARCHAR(10) NOT NULL UNIQUE,
    api_endpoint TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trading_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_id UUID NOT NULL REFERENCES broker_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    account_name VARCHAR(100),
    account_type account_type DEFAULT 'LIVE',
    server_name VARCHAR(100),
    base_currency VARCHAR(3) DEFAULT 'USD',
    leverage INTEGER DEFAULT 100,
    initial_deposit DECIMAL(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_account_per_broker UNIQUE(broker_id, account_number, user_id)
);

CREATE TABLE account_metrics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) NOT NULL,
    equity DECIMAL(15, 2) NOT NULL,
    floating_profit DECIMAL(15, 2) DEFAULT 0,
    margin DECIMAL(15, 2) DEFAULT 0,
    free_margin DECIMAL(15, 2) DEFAULT 0,
    margin_level DECIMAL(8, 2) DEFAULT 0,
    open_positions INTEGER DEFAULT 0,
    total_lots DECIMAL(10, 2) DEFAULT 0,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source data_source DEFAULT 'EA',
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    ticket_number BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    trade_type trade_type NOT NULL,
    lot_size DECIMAL(10, 2) NOT NULL,
    open_price DECIMAL(15, 5) NOT NULL,
    close_price DECIMAL(15, 5),
    stop_loss DECIMAL(15, 5),
    take_profit DECIMAL(15, 5),
    open_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ,
    profit DECIMAL(15, 2),
    commission DECIMAL(15, 2) DEFAULT 0,
    swap DECIMAL(15, 2) DEFAULT 0,
    net_profit DECIMAL(15, 2),
    ea_magic_number INTEGER,
    comment TEXT,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_trade_ticket UNIQUE(account_id, ticket_number)
);

CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    opening_balance DECIMAL(15, 2),
    closing_balance DECIMAL(15, 2),
    opening_equity DECIMAL(15, 2),
    closing_equity DECIMAL(15, 2),
    daily_profit DECIMAL(15, 2) DEFAULT 0,
    daily_profit_pct DECIMAL(8, 4) DEFAULT 0,
    max_equity DECIMAL(15, 2),
    min_equity DECIMAL(15, 2),
    max_drawdown DECIMAL(15, 2),
    max_drawdown_pct DECIMAL(8, 4),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_lots DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_daily_summary UNIQUE(account_id, summary_date)
);

-- =====================================================
-- TABLES - Wealth Tracker Domain
-- =====================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type category_type NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    icon VARCHAR(50),
    parent_category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_category_per_user UNIQUE(user_id, name, type)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'IDR',
    amount_usd DECIMAL(15, 2),
    description TEXT,
    notes TEXT,
    source transaction_source DEFAULT 'manual',
    whatsapp_message_id UUID,
    ai_log_id UUID,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector TSVECTOR
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type asset_type NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'IDR',
    balance_usd DECIMAL(15, 2),
    account_number VARCHAR(100),
    institution VARCHAR(100),
    trading_account_id UUID REFERENCES trading_accounts(id),
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    period budget_period DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLES - AI Assistant Domain
-- =====================================================

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_id VARCHAR(100) UNIQUE,
    from_number VARCHAR(50) NOT NULL,
    message_type message_type NOT NULL,
    text_content TEXT,
    media_url TEXT,
    media_type VARCHAR(50),
    processing_status processing_status DEFAULT 'pending',
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
    input_type VARCHAR(50) NOT NULL,
    input_content TEXT,
    ai_provider VARCHAR(50) DEFAULT 'claude',
    ai_model VARCHAR(100),
    parsed_data JSONB NOT NULL DEFAULT '{}',
    confidence_score DECIMAL(4, 3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_validated BOOLEAN DEFAULT false,
    validation_result validation_result,
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ
);

CREATE TABLE ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_log_id UUID NOT NULL REFERENCES ai_logs(id) ON DELETE CASCADE,
    whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
    ocr_provider VARCHAR(50) DEFAULT 'tesseract',
    raw_text TEXT,
    structured_data JSONB,
    image_url TEXT,
    image_size_bytes INTEGER,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(4, 3),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLES - Shared Resources
-- =====================================================

CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    target_currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    rate DECIMAL(15, 6) NOT NULL,
    rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source VARCHAR(50) DEFAULT 'manual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_rate_per_date UNIQUE(base_currency, target_currency, rate_date)
);

CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    account_id UUID REFERENCES trading_accounts(id),
    log_level log_level NOT NULL,
    log_type VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_currency VARCHAR(3) DEFAULT 'IDR',
    show_usd BOOLEAN DEFAULT true,
    show_idr BOOLEAN DEFAULT true,
    theme theme_mode DEFAULT 'dark',
    whatsapp_number VARCHAR(50),
    whatsapp_auto_confirm BOOLEAN DEFAULT false,
    notify_trading_updates BOOLEAN DEFAULT true,
    notify_large_expenses BOOLEAN DEFAULT true,
    large_expense_threshold DECIMAL(15, 2) DEFAULT 500000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Trading indexes
CREATE INDEX idx_trading_accounts_user ON trading_accounts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trading_accounts_broker ON trading_accounts(broker_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trading_accounts_active ON trading_accounts(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_trading_accounts_last_sync ON trading_accounts(last_sync_at DESC);

CREATE INDEX idx_metrics_account_time ON account_metrics_snapshots(account_id, snapshot_time DESC);
CREATE INDEX idx_metrics_snapshot_time ON account_metrics_snapshots(snapshot_time DESC);
CREATE INDEX idx_metrics_valid ON account_metrics_snapshots(is_valid) WHERE is_valid = true;

CREATE INDEX idx_trades_account ON trade_history(account_id);
CREATE INDEX idx_trades_open_time ON trade_history(open_time DESC);
CREATE INDEX idx_trades_symbol ON trade_history(symbol);
CREATE INDEX idx_trades_closed ON trade_history(is_closed);
CREATE INDEX idx_trades_ticket ON trade_history(ticket_number);

CREATE INDEX idx_daily_summaries_account_date ON daily_summaries(account_id, summary_date DESC);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(summary_date DESC);

-- Wealth indexes
CREATE INDEX idx_categories_user_type ON categories(user_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_active ON categories(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_transactions_user ON transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_category ON transactions(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_type ON transactions(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_source ON transactions(source) WHERE deleted_at IS NULL;
CREATE INDEX idx_transactions_search ON transactions USING GIN(search_vector);

CREATE INDEX idx_assets_user_type ON assets(user_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_active ON assets(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_budgets_user ON budgets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_budgets_active ON budgets(is_active) WHERE deleted_at IS NULL;

-- AI indexes
CREATE INDEX idx_whatsapp_user ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_status ON whatsapp_messages(processing_status);
CREATE INDEX idx_whatsapp_received ON whatsapp_messages(received_at DESC);

CREATE INDEX idx_ai_logs_user ON ai_logs(user_id);
CREATE INDEX idx_ai_logs_whatsapp ON ai_logs(whatsapp_message_id);
CREATE INDEX idx_ai_logs_validated ON ai_logs(is_validated);
CREATE INDEX idx_ai_logs_confidence ON ai_logs(confidence_score DESC);

CREATE INDEX idx_ocr_ai_log ON ocr_results(ai_log_id);

-- Shared indexes
CREATE INDEX idx_exchange_rates_active ON exchange_rates(is_active) WHERE is_active = true;
CREATE INDEX idx_exchange_rates_date ON exchange_rates(rate_date DESC);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_created ON system_logs(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_broker_profiles_updated_at BEFORE UPDATE ON broker_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Full-text search on transactions (Indonesian language)
CREATE OR REPLACE FUNCTION update_transaction_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('indonesian', COALESCE(NEW.description, '')), 'A') ||
        setweight(to_tsvector('indonesian', COALESCE(NEW.notes, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_search_vector_update
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_transaction_search_vector();

-- Auto-convert currency amounts to USD
CREATE OR REPLACE FUNCTION convert_to_usd()
RETURNS TRIGGER AS $$
DECLARE
    v_rate DECIMAL(15, 6);
BEGIN
    IF NEW.currency != 'USD' THEN
        SELECT rate INTO v_rate
        FROM exchange_rates
        WHERE base_currency = 'USD'
          AND target_currency = NEW.currency
          AND is_active = true
        ORDER BY rate_date DESC
        LIMIT 1;

        IF v_rate IS NOT NULL THEN
            NEW.amount_usd := NEW.amount / v_rate;
        END IF;
    ELSE
        NEW.amount_usd := NEW.amount;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_convert_usd BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION convert_to_usd();

CREATE OR REPLACE FUNCTION convert_asset_to_usd()
RETURNS TRIGGER AS $$
DECLARE
    v_rate DECIMAL(15, 6);
BEGIN
    IF NEW.currency != 'USD' THEN
        SELECT rate INTO v_rate
        FROM exchange_rates
        WHERE base_currency = 'USD'
          AND target_currency = NEW.currency
          AND is_active = true
        ORDER BY rate_date DESC
        LIMIT 1;

        IF v_rate IS NOT NULL THEN
            NEW.balance_usd := NEW.balance / v_rate;
        END IF;
    ELSE
        NEW.balance_usd := NEW.balance;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER asset_convert_usd BEFORE INSERT OR UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION convert_asset_to_usd();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Broker profiles (public read — shared catalog)
CREATE POLICY "Public read broker profiles" ON broker_profiles
    FOR SELECT TO authenticated USING (true);

-- Trading accounts (owner only)
CREATE POLICY "Users view own trading accounts" ON trading_accounts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users view own metrics" ON account_metrics_snapshots
    FOR SELECT TO authenticated
    USING (account_id IN (
        SELECT id FROM trading_accounts WHERE user_id = auth.uid() AND deleted_at IS NULL
    ));

CREATE POLICY "Users view own trades" ON trade_history
    FOR SELECT TO authenticated
    USING (account_id IN (
        SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users view own daily summaries" ON daily_summaries
    FOR SELECT TO authenticated
    USING (account_id IN (
        SELECT id FROM trading_accounts WHERE user_id = auth.uid()
    ));

-- Categories (owner CRUD)
CREATE POLICY "Users manage own categories" ON categories
    FOR ALL TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- Transactions (owner CRUD)
CREATE POLICY "Users manage own transactions" ON transactions
    FOR ALL TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- Assets (owner CRUD)
CREATE POLICY "Users manage own assets" ON assets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- Budgets (owner CRUD)
CREATE POLICY "Users manage own budgets" ON budgets
    FOR ALL TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- WhatsApp messages (owner view)
CREATE POLICY "Users view own whatsapp messages" ON whatsapp_messages
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- AI logs (owner view)
CREATE POLICY "Users view own ai logs" ON ai_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- OCR results (owner view via ai_logs)
CREATE POLICY "Users view own ocr results" ON ocr_results
    FOR SELECT TO authenticated
    USING (ai_log_id IN (SELECT id FROM ai_logs WHERE user_id = auth.uid()));

-- Exchange rates (public read)
CREATE POLICY "Public read exchange rates" ON exchange_rates
    FOR SELECT TO authenticated USING (true);

-- System logs (owner view)
CREATE POLICY "Users view own system logs" ON system_logs
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- User preferences (owner CRUD)
CREATE POLICY "Users manage own preferences" ON user_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role policies (for Edge Functions)
CREATE POLICY "Service insert trading accounts" ON trading_accounts
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update trading accounts" ON trading_accounts
    FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service insert metrics" ON account_metrics_snapshots
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert trades" ON trade_history
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service upsert trades" ON trade_history
    FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service insert daily summaries" ON daily_summaries
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service upsert daily summaries" ON daily_summaries
    FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service insert transactions" ON transactions
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service manage whatsapp" ON whatsapp_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manage ai_logs" ON ai_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service insert ocr" ON ocr_results
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert system_logs" ON system_logs
    FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service upsert exchange_rates" ON exchange_rates
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION get_portfolio_total(p_user_id UUID)
RETURNS TABLE(
    total_equity_usd    DECIMAL(15, 2),
    total_equity_idr    DECIMAL(15, 2),
    total_balance_usd   DECIMAL(15, 2),
    total_balance_idr   DECIMAL(15, 2),
    total_profit_usd    DECIMAL(15, 2),
    total_profit_idr    DECIMAL(15, 2),
    exchange_rate       DECIMAL(15, 6),
    last_updated        TIMESTAMPTZ
) AS $$
DECLARE
    v_rate DECIMAL(15, 6);
BEGIN
    SELECT rate INTO v_rate
    FROM exchange_rates
    WHERE base_currency = 'USD' AND target_currency = 'IDR' AND is_active = true
    ORDER BY rate_date DESC LIMIT 1;

    IF v_rate IS NULL THEN v_rate := 15750.00; END IF;

    RETURN QUERY
    SELECT
        COALESCE(SUM(ams.equity), 0)          AS total_equity_usd,
        COALESCE(SUM(ams.equity), 0) * v_rate AS total_equity_idr,
        COALESCE(SUM(ams.balance), 0)          AS total_balance_usd,
        COALESCE(SUM(ams.balance), 0) * v_rate AS total_balance_idr,
        COALESCE(SUM(ams.floating_profit), 0)          AS total_profit_usd,
        COALESCE(SUM(ams.floating_profit), 0) * v_rate AS total_profit_idr,
        v_rate AS exchange_rate,
        MAX(ams.snapshot_time) AS last_updated
    FROM (
        SELECT DISTINCT ON (account_id)
            account_id, balance, equity, floating_profit, snapshot_time
        FROM account_metrics_snapshots
        WHERE account_id IN (
            SELECT id FROM trading_accounts
            WHERE user_id = p_user_id AND deleted_at IS NULL
        )
          AND is_valid = true
        ORDER BY account_id, snapshot_time DESC
    ) ams;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_monthly_summary(
    p_user_id UUID,
    p_year  INTEGER DEFAULT EXTRACT(YEAR  FROM CURRENT_DATE)::INTEGER,
    p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE(
    total_income_idr  DECIMAL(15, 2),
    total_expense_idr DECIMAL(15, 2),
    total_income_usd  DECIMAL(15, 2),
    total_expense_usd DECIMAL(15, 2),
    net_cashflow_idr  DECIMAL(15, 2),
    net_cashflow_usd  DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount     ELSE 0 END), 0) AS total_income_idr,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount     ELSE 0 END), 0) AS total_expense_idr,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount_usd ELSE 0 END), 0) AS total_income_usd,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_usd ELSE 0 END), 0) AS total_expense_usd,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN  amount
                          WHEN type = 'expense' THEN -amount
                          ELSE 0 END), 0) AS net_cashflow_idr,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN  amount_usd
                          WHEN type = 'expense' THEN -amount_usd
                          ELSE 0 END), 0) AS net_cashflow_usd
    FROM transactions
    WHERE user_id   = p_user_id
      AND deleted_at IS NULL
      AND EXTRACT(YEAR  FROM transaction_date) = p_year
      AND EXTRACT(MONTH FROM transaction_date) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON account_metrics_snapshots, trade_history, daily_summaries,
               transactions, whatsapp_messages, ai_logs, ocr_results,
               system_logs TO service_role;
GRANT UPDATE ON trading_accounts, trade_history, daily_summaries TO service_role;
GRANT ALL ON exchange_rates TO service_role;
GRANT ALL ON whatsapp_messages, ai_logs TO service_role;
GRANT EXECUTE ON FUNCTION get_portfolio_total(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_summary(UUID, INTEGER, INTEGER) TO authenticated;

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO broker_profiles (broker_name, broker_code, logo_url) VALUES
    ('Exness',     'EXNESS',  'https://www.exness.com/favicon.ico'),
    ('Tickmill',   'TICKMILL','https://www.tickmill.com/favicon.ico'),
    ('IC Markets', 'ICM',     'https://www.icmarkets.com/favicon.ico'),
    ('XM',         'XM',      'https://www.xm.com/favicon.ico'),
    ('MiFX',       'MIFX',    'https://www.mifx.com/favicon.ico')
ON CONFLICT (broker_code) DO NOTHING;

INSERT INTO exchange_rates (base_currency, target_currency, rate, source)
VALUES ('USD', 'IDR', 15750.00, 'manual')
ON CONFLICT (base_currency, target_currency, rate_date) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
