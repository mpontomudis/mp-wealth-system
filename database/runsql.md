# RUNSQL — MP Wealth System

> File ini berisi semua SQL yang perlu dijalankan di **Supabase → SQL Editor**.  
> Jalankan per-section sesuai kebutuhan, atau jalankan semua sekaligus.  
> **Update file ini setiap ada perubahan SQL.**

---

## SECTION 1 — Fix Trigger `convert_asset_to_usd`

**Masalah:** Trigger menggunakan `NEW.amount_usd` (kolom transactions), seharusnya `NEW.balance_usd` (kolom assets).  
**Error:** `record "new" has no field "amount_usd"` → INSERT assets gagal 400.

### Step 1A — Diagnostik (jalankan ini dulu, lihat hasilnya)

```sql
-- Lihat semua trigger yang ada di tabel assets
SELECT tgname AS trigger_name, proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'assets';
```

### Step 1B — Fix (jalankan DUA QUERY TERPISAH di Supabase SQL Editor)

> ⚠️ Jalankan query pertama dulu, tunggu sukses, baru jalankan query kedua.

**Query 1 — Drop trigger lama:**
```sql
DROP TRIGGER IF EXISTS asset_convert_usd ON assets;
```

**Query 2 — Recreate function + trigger:**
```sql
DROP FUNCTION IF EXISTS convert_asset_to_usd();

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

CREATE TRIGGER asset_convert_usd
BEFORE INSERT OR UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION convert_asset_to_usd();
```

### Step 1C — Verify function sudah benar

```sql
-- Pastikan function body tidak ada "amount_usd"
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'convert_asset_to_usd'
  AND routine_schema = 'public';
```

---

## SECTION 2 — Complete RLS Policy Rebuild

**Catatan:** `service_role` otomatis bypass RLS — tidak perlu policy service_role.

```sql
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


-- ─── 8. BROKER PROFILES ───────────────────────────────
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


-- ─── 13. EXCHANGE RATES ───────────────────────────────
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
```

---

## SECTION 3 — Verify Semua Policies

```sql
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

---

## SECTION 4 — Verify Trigger Functions

```sql
-- Cek fungsi trigger assets (harus pakai balance_usd, bukan amount_usd)
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name IN ('convert_asset_to_usd', 'convert_to_usd')
  AND routine_schema = 'public';
```

---

## SECTION 6 — Fix RLS `account_metrics_snapshots` INSERT

**Masalah:** Authenticated users tidak bisa INSERT ke `account_metrics_snapshots` — hanya `service_role` yang diizinkan. Saat create trading account, initial snapshot gagal silently → balance tampil $0.

**Fix:** Tambah INSERT policy untuk authenticated user (hanya untuk account milik sendiri).

```sql
CREATE POLICY "account_metrics_snapshots_insert_policy"
ON account_metrics_snapshots FOR INSERT TO authenticated
WITH CHECK (
  account_id IN (
    SELECT id FROM trading_accounts WHERE user_id = auth.uid()
  )
);
```

---



**Masalah:** Constraint `unique_account_per_broker` tidak partial — soft-deleted accounts masih memblokir insert ulang dengan account number yang sama → **Error 409 Conflict**.

**Fix:** Ganti constraint dengan partial unique index yang hanya berlaku jika `deleted_at IS NULL`.

### Step 5A — Drop constraint lama

```sql
ALTER TABLE trading_accounts
DROP CONSTRAINT IF EXISTS unique_account_per_broker;
```

### Step 5B — Buat partial unique index

```sql
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_account_per_broker
  ON trading_accounts(broker_id, account_number, user_id)
  WHERE deleted_at IS NULL;
```

---

## SECTION 8 — Add Fee Column & E-Wallet Asset Type

**Masalah:** Tidak ada kolom `fee` untuk mencatat biaya transfer. Tidak ada tipe aset `e_wallet` untuk GoPay/OVO/DANA.

```sql
-- Tambah kolom fee ke transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fee DECIMAL(15, 2) DEFAULT NULL;

-- Tambah nilai e_wallet ke enum asset_type
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'e_wallet';
```

---

## SECTION 7 — Add Transfer From/To Account Columns

**Masalah:** Tabel `transactions` tidak memiliki kolom `from_asset_id` dan `to_asset_id` — tidak bisa melacak alur transfer antar rekening.

**Fix:** Tambah dua kolom FK opsional ke tabel `transactions`.

```sql
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS from_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS to_asset_id   UUID REFERENCES assets(id) ON DELETE SET NULL;
```

---

## Riwayat Update

| Tanggal | Section | Keterangan |
|---------|---------|------------|
| 2026-04-03 | Section 1 | Fix trigger `convert_asset_to_usd` — ganti `amount_usd` → `balance_usd` |
| 2026-04-03 | Section 2 | Rebuild semua RLS policies (15 tabel) |
| 2026-04-03 | Section 5 | Fix 409 Conflict saat add trading account — ganti UNIQUE constraint dengan partial index |
| 2026-04-03 | Section 6 | Fix initial balance $0 — tambah INSERT policy untuk account_metrics_snapshots |
| 2026-04-04 | Section 7 | Add from_asset_id & to_asset_id ke transactions untuk transfer tracking |
| 2026-04-04 | Section 8 | Add fee column ke transactions + e_wallet asset type |
