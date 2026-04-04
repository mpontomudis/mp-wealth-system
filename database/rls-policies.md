# RLS Policies — MP Wealth System

> Jalankan seluruh script ini sekaligus di **Supabase → SQL Editor**.  
> `service_role` otomatis bypass RLS — tidak perlu policy service_role.

---

## SCRIPT LENGKAP

```sql
-- =====================================================
-- COMPLETE RLS POLICY REBUILD — MP WEALTH SYSTEM
-- =====================================================

-- ─── 1. TRANSACTIONS ──────────────────────────────────
DROP POLICY IF EXISTS "Users manage own transactions"      ON transactions;
DROP POLICY IF EXISTS "Service insert transactions"        ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions"      ON transactions;
DROP POLICY IF EXISTS "Users can select transactions"      ON transactions;
DROP POLICY IF EXISTS "Users can update transactions"      ON transactions;
DROP POLICY IF EXISTS "Users can delete transactions"      ON transactions;
DROP POLICY IF EXISTS "transactions_insert_policy"         ON transactions;
DROP POLICY IF EXISTS "transactions_select_policy"         ON transactions;
DROP POLICY IF EXISTS "transactions_update_policy"         ON transactions;
DROP POLICY IF EXISTS "transactions_delete_policy"         ON transactions;
DROP POLICY IF EXISTS "transactions_service_insert"        ON transactions;
DROP POLICY IF EXISTS "transactions_service_update"        ON transactions;

CREATE POLICY "transactions_insert_policy"
ON transactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_select_policy"
ON transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "transactions_update_policy"
ON transactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_policy"
ON transactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ─── 2. ASSETS ────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own assets"            ON assets;
DROP POLICY IF EXISTS "Users can insert own assets"        ON assets;
DROP POLICY IF EXISTS "Users can view own assets"          ON assets;
DROP POLICY IF EXISTS "Users can update own assets"        ON assets;
DROP POLICY IF EXISTS "Users can delete own assets"        ON assets;
DROP POLICY IF EXISTS "Users can insert assets"            ON assets;
DROP POLICY IF EXISTS "Users can select assets"            ON assets;
DROP POLICY IF EXISTS "Users can update assets"            ON assets;
DROP POLICY IF EXISTS "Users can delete assets"            ON assets;

CREATE POLICY "assets_insert_policy"
ON assets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets_select_policy"
ON assets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "assets_update_policy"
ON assets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets_delete_policy"
ON assets FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ─── 3. CATEGORIES ────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own categories"        ON categories;
DROP POLICY IF EXISTS "Users can manage categories"        ON categories;

CREATE POLICY "categories_insert_policy"
ON categories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_select_policy"
ON categories FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "categories_update_policy"
ON categories FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_policy"
ON categories FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ─── 4. TRADING ACCOUNTS ──────────────────────────────
DROP POLICY IF EXISTS "Users view own trading accounts"    ON trading_accounts;
DROP POLICY IF EXISTS "Users can insert trading accounts"  ON trading_accounts;
DROP POLICY IF EXISTS "Users can select trading accounts"  ON trading_accounts;
DROP POLICY IF EXISTS "Users can update trading accounts"  ON trading_accounts;
DROP POLICY IF EXISTS "Service insert trading accounts"    ON trading_accounts;
DROP POLICY IF EXISTS "Service update trading accounts"    ON trading_accounts;

CREATE POLICY "trading_accounts_insert_policy"
ON trading_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_accounts_select_policy"
ON trading_accounts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "trading_accounts_update_policy"
ON trading_accounts FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_accounts_delete_policy"
ON trading_accounts FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ─── 5. ACCOUNT METRICS SNAPSHOTS ─────────────────────
-- Tidak ada user_id — filter via subquery ke trading_accounts
DROP POLICY IF EXISTS "Users view own metrics"             ON account_metrics_snapshots;
DROP POLICY IF EXISTS "Service insert metrics"             ON account_metrics_snapshots;

CREATE POLICY "account_metrics_select_policy"
ON account_metrics_snapshots FOR SELECT TO authenticated
USING (
  account_id IN (
    SELECT id FROM trading_accounts
    WHERE user_id = auth.uid()
  )
);


-- ─── 6. TRADE HISTORY ─────────────────────────────────
-- Tidak ada user_id — filter via subquery ke trading_accounts
DROP POLICY IF EXISTS "Users view own trades"              ON trade_history;
DROP POLICY IF EXISTS "Service insert trades"              ON trade_history;
DROP POLICY IF EXISTS "Service upsert trades"              ON trade_history;

CREATE POLICY "trade_history_select_policy"
ON trade_history FOR SELECT TO authenticated
USING (
  account_id IN (
    SELECT id FROM trading_accounts
    WHERE user_id = auth.uid()
  )
);


-- ─── 7. DAILY SUMMARIES ───────────────────────────────
-- Tidak ada user_id — filter via subquery ke trading_accounts
DROP POLICY IF EXISTS "Users view own daily summaries"     ON daily_summaries;
DROP POLICY IF EXISTS "Service insert daily summaries"     ON daily_summaries;
DROP POLICY IF EXISTS "Service upsert daily summaries"     ON daily_summaries;

CREATE POLICY "daily_summaries_select_policy"
ON daily_summaries FOR SELECT TO authenticated
USING (
  account_id IN (
    SELECT id FROM trading_accounts
    WHERE user_id = auth.uid()
  )
);


-- ─── 8. BROKER PROFILES (public read, no user_id) ─────
DROP POLICY IF EXISTS "Public read broker profiles"        ON broker_profiles;

CREATE POLICY "broker_profiles_select_policy"
ON broker_profiles FOR SELECT TO authenticated
USING (is_active = true);


-- ─── 9. BUDGETS ───────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own budgets"           ON budgets;

CREATE POLICY "budgets_insert_policy"
ON budgets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_select_policy"
ON budgets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "budgets_update_policy"
ON budgets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_policy"
ON budgets FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ─── 10. WHATSAPP MESSAGES ────────────────────────────
DROP POLICY IF EXISTS "Users view own whatsapp messages"   ON whatsapp_messages;
DROP POLICY IF EXISTS "Service manage whatsapp"            ON whatsapp_messages;

CREATE POLICY "whatsapp_messages_select_policy"
ON whatsapp_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);


-- ─── 11. AI LOGS ──────────────────────────────────────
DROP POLICY IF EXISTS "Users view own ai logs"             ON ai_logs;
DROP POLICY IF EXISTS "Service manage ai_logs"             ON ai_logs;

CREATE POLICY "ai_logs_select_policy"
ON ai_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);


-- ─── 12. OCR RESULTS ──────────────────────────────────
-- Tidak ada user_id — filter via subquery ke ai_logs
DROP POLICY IF EXISTS "Users view own ocr results"         ON ocr_results;
DROP POLICY IF EXISTS "Service insert ocr"                 ON ocr_results;

CREATE POLICY "ocr_results_select_policy"
ON ocr_results FOR SELECT TO authenticated
USING (
  ai_log_id IN (
    SELECT id FROM ai_logs
    WHERE user_id = auth.uid()
  )
);


-- ─── 13. EXCHANGE RATES (public read) ─────────────────
DROP POLICY IF EXISTS "Public read exchange rates"         ON exchange_rates;
DROP POLICY IF EXISTS "Service upsert exchange_rates"      ON exchange_rates;

CREATE POLICY "exchange_rates_select_policy"
ON exchange_rates FOR SELECT TO authenticated
USING (true);


-- ─── 14. SYSTEM LOGS ──────────────────────────────────
DROP POLICY IF EXISTS "Users view own system logs"         ON system_logs;
DROP POLICY IF EXISTS "Service insert system_logs"         ON system_logs;

CREATE POLICY "system_logs_select_policy"
ON system_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);


-- ─── 15. USER PREFERENCES ─────────────────────────────
DROP POLICY IF EXISTS "Users manage own preferences"       ON user_preferences;

CREATE POLICY "user_preferences_insert_policy"
ON user_preferences FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_select_policy"
ON user_preferences FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_policy"
ON user_preferences FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- ─── VERIFY ───────────────────────────────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## Ringkasan Policy Per Tabel

| Tabel | INSERT | SELECT | UPDATE | DELETE | Catatan |
|-------|--------|--------|--------|--------|---------|
| `transactions` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | |
| `assets` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | |
| `categories` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | |
| `trading_accounts` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | |
| `budgets` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | |
| `user_preferences` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | — | |
| `account_metrics_snapshots` | — | via `trading_accounts` | — | — | service_role insert dari Edge Function |
| `trade_history` | — | via `trading_accounts` | — | — | service_role insert dari Edge Function |
| `daily_summaries` | — | via `trading_accounts` | — | — | service_role insert dari Edge Function |
| `broker_profiles` | — | `is_active = true` | — | — | Data master, no user_id |
| `whatsapp_messages` | — | `auth.uid() = user_id` | — | — | service_role insert dari Edge Function |
| `ai_logs` | — | `auth.uid() = user_id` | — | — | service_role insert dari Edge Function |
| `ocr_results` | — | via `ai_logs` | — | — | service_role insert dari Edge Function |
| `exchange_rates` | — | `true` | — | — | Public read |
| `system_logs` | — | `auth.uid() = user_id` | — | — | service_role insert dari Edge Function |

## Kenapa service_role tidak perlu policy?

Supabase service_role key **otomatis bypass RLS** — Edge Functions (`whatsapp-webhook`, `ingest-metrics`, `process-ai-message`) menggunakan `SUPABASE_SERVICE_ROLE_KEY` sehingga bisa INSERT/UPDATE ke tabel manapun tanpa policy tambahan.
