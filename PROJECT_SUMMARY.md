# MP Wealth System v2.0.0

> **Personal Financial Command Center** — Multi-broker MT5 trading monitor, wealth tracker, and AI-powered WhatsApp automation.
>
> Owner: **Marlon Pontomudis** | Timezone: **WIT (Asia/Jayapura, GMT+9)**

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Feature Modules](#feature-modules)
6. [Shared Layer](#shared-layer)
7. [Edge Functions (Serverless)](#edge-functions-serverless)
8. [Authentication](#authentication)
9. [Design System](#design-system)
10. [Environment Variables](#environment-variables)
11. [Development Setup](#development-setup)
12. [Deployment](#deployment)
13. [Build Status](#build-status)

---

## Overview

MP Wealth System is a single-user personal finance dashboard combining:

| Pillar | What it does |
|--------|-------------|
| **Trading Monitor** | Tracks live MT5 accounts across 5 brokers via EA-pushed metrics snapshots |
| **Wealth Tracker** | Records income/expense/transfer transactions, manages assets in IDR & USD |
| **AI Assistant** | Parses WhatsApp messages from the owner using Claude AI to auto-create transactions |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript + Vite 5 |
| Routing | React Router v6 |
| Server state | TanStack Query v5 |
| Client state | Zustand v4 |
| Forms | React Hook Form v7 |
| Styling | Tailwind CSS v3 (custom MP design tokens) |
| Charts | Recharts v2 |
| Icons | Lucide React |
| Backend / DB | Supabase (PostgreSQL 15, RLS, Auth, Storage) |
| Edge functions | Supabase Edge Functions (Deno runtime) |
| AI | Anthropic Claude (`claude-haiku-4-5` for parsing, `claude-sonnet-4` for complex) |
| WhatsApp | Fonnte API (Indonesian gateway) |
| Exchange rates | open.er-api.com (free tier) |

---

## Project Structure

```
mp-wealth-system/
├── database/
│   └── schema.sql                   # Canonical PostgreSQL schema (15 tables)
│
├── src/
│   ├── App.tsx                      # Router + auth guards
│   ├── main.tsx                     # React entry + QueryClientProvider
│   ├── index.css                    # Tailwind directives + base styles
│   ├── vite-env.d.ts                # Vite ImportMeta types
│   │
│   ├── types/
│   │   └── supabase.ts              # All DB types (Tables<T>, enums, RPC rows)
│   │
│   ├── config/
│   │   ├── supabase.ts              # Supabase client (typed, detectSessionInUrl)
│   │   └── constants.ts             # Routes, brokers, categories, AI config
│   │
│   ├── shared/
│   │   ├── components/              # 15 reusable UI components
│   │   │   ├── Layout.tsx           # Sidebar + Navbar + Outlet shell
│   │   │   ├── Sidebar.tsx          # Nav links with active state
│   │   │   ├── Navbar.tsx           # WIT clock + user + sign out
│   │   │   ├── Card.tsx             # Surface card with title/actions
│   │   │   ├── Button.tsx           # 4 variants × 3 sizes + loading
│   │   │   ├── Input.tsx            # Labeled + error + icon slots
│   │   │   ├── Select.tsx           # Labeled select + options array
│   │   │   ├── Modal.tsx            # Portal modal + Escape key + 4 sizes
│   │   │   ├── Tabs.tsx             # Controlled/uncontrolled tab set
│   │   │   ├── Badge.tsx            # 5-variant pill badge
│   │   │   ├── StatCard.tsx         # KPI card with trend arrow
│   │   │   ├── CurrencyDisplay.tsx  # Dual USD/IDR display
│   │   │   ├── LoadingSpinner.tsx   # Spinner + PageLoader
│   │   │   ├── EmptyState.tsx       # Icon + message + action slot
│   │   │   └── ErrorBoundary.tsx    # React class error boundary
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Supabase session + onAuthStateChange
│   │   │   ├── useExchangeRate.ts   # USD/IDR rate (1h stale time)
│   │   │   ├── useDebounce.ts       # Generic debounce hook
│   │   │   └── useLocalStorage.ts   # Typed localStorage hook
│   │   │
│   │   ├── services/
│   │   │   └── currency.service.ts  # getLatestExchangeRate()
│   │   │
│   │   └── utils/
│   │       ├── cn.ts                # Class name merger
│   │       └── formatters.ts        # formatIDR, formatUSD, formatDate
│   │
│   ├── features/
│   │   ├── trading/
│   │   │   ├── services/
│   │   │   │   └── trading.service.ts   # getTradingAccountsWithLatestMetrics(),
│   │   │   │                            # getPortfolioTotal(), getTradeHistory()
│   │   │   ├── hooks/
│   │   │   │   ├── useTradingAccounts.ts
│   │   │   │   ├── usePortfolioTotal.ts
│   │   │   │   ├── useTradeHistory.ts
│   │   │   │   └── useEquityChart.ts
│   │   │   └── components/
│   │   │       ├── TradingDashboard.tsx  # Main trading overview
│   │   │       ├── BrokerCard.tsx        # Per-account metrics card
│   │   │       └── EquityChart.tsx       # Equity history line chart
│   │   │
│   │   ├── wealth/
│   │   │   ├── services/
│   │   │   │   └── wealth.service.ts    # Transactions, assets, categories, RPC
│   │   │   ├── hooks/
│   │   │   │   ├── useTransactions.ts
│   │   │   │   ├── useAssets.ts
│   │   │   │   ├── useCategories.ts
│   │   │   │   └── useMonthlySummary.ts
│   │   │   └── components/
│   │   │       ├── WealthDashboard.tsx   # StatCards + chart + tx/asset grid
│   │   │       ├── BalanceOverview.tsx   # Net worth + asset type breakdown
│   │   │       ├── TransactionList.tsx   # Filterable paginated table
│   │   │       ├── TransactionForm.tsx   # Create/edit modal (React Hook Form)
│   │   │       └── AssetList.tsx         # Asset grid + add modal
│   │   │
│   │   └── ai-assistant/
│   │       ├── services/
│   │       │   └── ai.service.ts        # AI logs, WhatsApp messages, OCR, tx creation
│   │       ├── hooks/
│   │       │   ├── useWhatsAppMessages.ts
│   │       │   ├── useAILogs.ts
│   │       │   └── useOCRResults.ts
│   │       └── components/
│   │           ├── AIAssistantPanel.tsx  # Tabbed panel (Feed / Logs / OCR)
│   │           └── WhatsAppFeed.tsx      # Message list with status badges
│   │
│   └── pages/
│       ├── LoginPage.tsx            # Email/password + magic link
│       ├── DashboardPage.tsx        # Combined overview
│       ├── TradingPage.tsx
│       ├── WealthPage.tsx
│       ├── TransactionsPage.tsx
│       ├── AssetsPage.tsx
│       ├── ReportsPage.tsx          # Monthly bar chart + summary table
│       └── SettingsPage.tsx         # Profile, preferences, sign out
│
└── supabase/
    ├── config.toml                  # Local dev config + per-function verify_jwt
    └── functions/
        ├── _shared/
        │   ├── cors.ts              # CORS headers + OPTIONS handler
        │   ├── supabase-client.ts   # Service role client + response helpers
        │   └── ai-parser.ts         # Claude Haiku transaction parser (shared)
        ├── whatsapp-webhook/        # Receives Fonnte messages → AI parse
        ├── ingest-metrics/          # MT5 EA metrics ingestion
        ├── process-ai-message/      # Manual AI reprocess (JWT auth)
        └── update-exchange-rate/    # Fetch & upsert USD/IDR rate
```

---

## Database Schema

**15 tables** across 3 domains. PostgreSQL 15 on Supabase with RLS enabled.

### Enums

| Enum | Values |
|------|--------|
| `account_type` | `LIVE`, `DEMO` |
| `data_source` | `EA`, `MetaApi`, `Manual` |
| `trade_type` | `BUY`, `SELL` |
| `transaction_type` | `income`, `expense`, `transfer` |
| `transaction_source` | `manual`, `whatsapp`, `ai`, `bulk_upload` |
| `asset_type` | `cash`, `bank`, `trading`, `investment`, `crypto` |
| `message_type` | `text`, `image`, `audio`, `video`, `document` |
| `processing_status` | `pending`, `processing`, `completed`, `failed` |
| `validation_result` | `approved`, `rejected`, `modified` |
| `log_level` | `INFO`, `WARNING`, `ERROR`, `DEBUG` |

### Tables

#### Trading Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `broker_profiles` | Global broker catalog (no user_id) | `broker_code` (EXNESS/TICKMILL/ICM/XM/MIFX), `broker_name` |
| `trading_accounts` | Static account config | `account_number`, `broker_id`, `user_id`, `account_type`, `last_sync_at` |
| `account_metrics_snapshots` | Live metrics pushed by EA | `account_id`, `balance`, `equity`, `floating_profit`, `margin_level`, `snapshot_time`, `is_valid` |
| `trade_history` | Closed trade records | `ticket_number`, `symbol`, `trade_type`, `lot_size`, `open_price`, `net_profit` |
| `open_positions` | Currently open trades | `ticket_number`, `symbol`, `trade_type`, `current_profit`, `is_active` |

#### Wealth Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `categories` | Income/expense categories | `name`, `type` (income/expense), `parent_category_id` |
| `transactions` | All financial transactions | `type`, `amount`, `currency`, `ai_log_id`, `search_vector` (tsvector) |
| `assets` | Owned assets | `asset_type`, `balance`, `balance_usd`, `currency` |
| `budgets` | Budget targets | `category_id`, `amount`, `period`, `start_date` |

#### AI / Integration Domain

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `whatsapp_messages` | Incoming Fonnte messages | `whatsapp_id`, `from_number`, `message_type`, `text_content`, `processing_status` |
| `ai_logs` | Claude AI processing records | `input_content`, `parsed_data` (JSONB), `confidence_score`, `validation_result` |
| `ocr_results` | Image OCR extraction | `raw_text`, `structured_data`, `confidence_score` |

#### Shared

| Table | Description |
|-------|-------------|
| `exchange_rates` | USD/IDR daily rates (UNIQUE per date) |
| `system_logs` | App-wide error/info logging |
| `user_preferences` | Per-user settings (currency, theme) |

### Key Design Decisions

- **`broker_profiles`** is a global catalog — no `user_id`. All users share the same broker list.
- **`trading_accounts`** stores static config only. Live metrics live in `account_metrics_snapshots`.
- **`is_online`** is derived in the frontend: `last_sync_at` within the last 10 minutes.
- **`ai_logs.parsed_data`** is JSONB `{ amount, type, currency, description, confidence }`.
- **`transactions.ai_log_id`** links back to the AI log that created it (not the reverse).
- **Full-text search** on `transactions` via `search_vector` tsvector (updated by trigger, `indonesian` language config).

### PostgreSQL Functions (RPC)

| Function | Returns | Description |
|----------|---------|-------------|
| `get_portfolio_total(p_user_id)` | `PortfolioTotalRow` | Aggregates equity/balance across all accounts in USD + IDR |
| `get_monthly_summary(p_user_id, p_year, p_month)` | `MonthlySummaryRow` | Income/expense totals for a given month |

---

## Feature Modules

### Trading

- **`getTradingAccountsWithLatestMetrics()`** — 2-query merge pattern: fetches accounts + all valid snapshots, picks the latest snapshot per `account_id` using a `Map`.
- Broker colors keyed by `broker_code`: EXNESS `#00b386`, TICKMILL `#e63e2a`, ICM `#0066cc`, XM `#ff6600`, MIFX `#8b5cf6`.
- `PortfolioTotalRow` fields: `total_equity_usd/idr`, `total_balance_usd/idr`, `total_profit_usd/idr`, `exchange_rate`, `last_updated`.

### Wealth

- Transactions support IDR and USD, with auto `amount_usd` calculation.
- Categories support parent/child hierarchy via `parent_category_id`.
- `MonthlySummaryRow` returns 6 fields: income/expense/net in both IDR and USD.
- `assets.balance` = IDR amount, `assets.balance_usd` = USD equivalent.

### AI Assistant

- WhatsApp messages arrive via Fonnte webhook → stored as `whatsapp_messages`.
- Claude `claude-haiku-4-5` parses text for transaction intent.
- Indonesian shorthand supported: `500ribu → 500000`, `1jt → 1000000`, `1.5jt → 1500000`.
- Confidence threshold: **0.7** — below this, `parsed_data` is stored but not auto-created as transaction.
- User reviews pending AI logs and approves/rejects via `validation_result`.

---

## Shared Layer

### Auth Flow

```
/login  ──[RedirectIfAuth]──► if user exists → /
        └─► LoginPage
               ├─ signInWithPassword() ──► navigate('/')
               └─ signInWithOtp()      ──► magic link email
                                              └─ click link
                                                   └─ detectSessionInUrl parses token
                                                        └─ onAuthStateChange SIGNED_IN
                                                             └─ RedirectIfAuth → /

Protected routes ──[RequireAuth]──► if no user → /login
```

### Hooks

| Hook | Purpose |
|------|---------|
| `useAuth` | Session state + `signOut()`. Subscribes to `onAuthStateChange`. |
| `useExchangeRate` | Latest USD/IDR rate. 1-hour stale time. Falls back to `15,750`. |
| `useDebounce<T>` | Debounces any value by N ms. Used for search inputs. |
| `useLocalStorage<T>` | Typed `localStorage` with JSON serialization. |

---

## Edge Functions (Serverless)

All functions run on **Deno** runtime. Shared utilities in `_shared/`.

### `whatsapp-webhook` — `verify_jwt: false`
- **GET**: Fonnte verification, returns `200 ok`
- **POST**: Receives Fonnte payload, filters to owner's phone number only, stores `whatsapp_messages`, calls Claude inline, stores `ai_logs`
- Always returns `200` to prevent Fonnte retries

### `ingest-metrics` — `verify_jwt: false`
- **POST**: MT5 EA sends account metrics
- Auth: `x-api-key` header
- Lookup chain: `broker_code → broker_id → account_id`
- Inserts `account_metrics_snapshots` + updates `trading_accounts.last_sync_at`

### `process-ai-message` — `verify_jwt: true`
- **POST**: `{ whatsapp_message_id }`
- Manually reprocesses a message through Claude AI
- Creates new `ai_logs` row, updates `processing_status`

### `update-exchange-rate` — `verify_jwt: false`
- **GET/POST**: Fetch USD/IDR from `open.er-api.com/v6/latest/USD`
- Auth: `x-api-key` header
- Upserts `exchange_rates` (ON CONFLICT by date)
- Can be triggered by Supabase pg_cron scheduler

---

## Authentication

| Mechanism | Implementation |
|-----------|---------------|
| Email + password | `supabase.auth.signInWithPassword()` |
| Magic link | `supabase.auth.signInWithOtp({ email })` |
| Session persistence | `persistSession: true` in Supabase client |
| Magic link token | `detectSessionInUrl: true` auto-parses `#access_token` fragment |
| Auto refresh | `autoRefreshToken: true` |
| Sign out | `supabase.auth.signOut()` via `useAuth().signOut()` |

---

## Design System

Custom Tailwind tokens defined in `tailwind.config.js`:

| Token | Value | Usage |
|-------|-------|-------|
| `mp-primary` | `#0A1F44` | Sidebar, buttons, active states |
| `mp-green` | `#10b981` | Income, profit, success |
| `mp-red` | `#ef4444` | Expense, loss, danger |
| `mp-blue` | `#3b82f6` | Transfer, info, USD amounts |
| `mp-gold` | `#f59e0b` | Warning, pending |
| `mp-purple` | `#8b5cf6` | AI, analytics |
| `mp-background` | `#f8fafc` | Page background |
| `mp-surface` | `#ffffff` | Cards, modals |
| `mp-border` | `#e2e8f0` | Dividers, input borders |
| `mp-text-primary` | `#0f172a` | Headings, body |
| `mp-text-secondary` | `#475569` | Labels, sublabels |
| `mp-text-muted` | `#94a3b8` | Placeholder, hints |

**Card standard:** `bg-mp-surface rounded-xl shadow-md p-6`  
**Font:** Inter (Google Fonts)

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Function Secrets (via `supabase secrets set`)

```env
ANTHROPIC_API_KEY=sk-ant-...          # Claude AI for WhatsApp parsing
INGEST_API_KEY=your-random-secret     # MT5 EA + exchange rate auth
WHATSAPP_VERIFY_TOKEN=your-token      # Fonnte webhook verification
OWNER_PHONE_NUMBER=628123456789       # Owner's WhatsApp (no + prefix)
```

---

## Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your Supabase credentials
cp .env.example .env

# 3. Apply database schema (in Supabase SQL editor or CLI)
supabase db push
# or manually run: database/schema.sql

# 4. Start dev server
npm run dev
# → http://localhost:5173

# 5. Type check
npm run type-check

# 6. Build for production
npm run build
```

### Supabase Local Dev

```bash
supabase start           # Starts local Postgres + API on ports in config.toml
supabase functions serve # Runs edge functions locally (requires Deno)
```

---

## Deployment

### Frontend (Vercel / Netlify)

```bash
npm run build
# Output: dist/
# Set environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### Edge Functions

```bash
# Set all secrets first
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set INGEST_API_KEY=your-key
supabase secrets set OWNER_PHONE_NUMBER=628xxxxxxx
supabase secrets set WHATSAPP_VERIFY_TOKEN=your-token

# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy whatsapp-webhook
supabase functions deploy ingest-metrics
supabase functions deploy process-ai-message
supabase functions deploy update-exchange-rate
```

### Fonnte Webhook Config

Set webhook URL in Fonnte dashboard:
```
https://<project>.supabase.co/functions/v1/whatsapp-webhook
```

### MT5 EA Config

The EA posts to:
```
https://<project>.supabase.co/functions/v1/ingest-metrics
Headers: x-api-key: <INGEST_API_KEY>
```

### Exchange Rate Scheduler (pg_cron)

```sql
-- Run daily at 08:00 WIT (23:00 UTC previous day)
SELECT cron.schedule(
  'update-exchange-rate',
  '0 23 * * *',
  $$SELECT net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/update-exchange-rate',
    headers := '{"x-api-key": "<INGEST_API_KEY>"}'::jsonb
  )$$
);
```

---

## Build Status

| Step | Status | Description |
|------|--------|-------------|
| 1 — Database | ✅ Done | `database/schema.sql` — 15 tables, ENUMs, RLS, triggers, RPC functions |
| 2 — Types | ✅ Done | `src/types/supabase.ts` — 954 lines, all tables + enums + RPC types |
| 3 — Config | ✅ Done | Supabase client, constants, broker codes, categories |
| 4 — Services | ✅ Done | Trading, wealth, AI service layers |
| 5 — Hooks | ✅ Done | TanStack Query hooks for all features |
| 6 — Shared UI | ✅ Done | 15 reusable components + utilities |
| 7 — Features | ✅ Done | Trading, Wealth, AI feature components |
| 8 — Pages | ✅ Done | 8 pages + React Router v6 + auth guards |
| 9 — Edge Functions | ✅ Done | 4 Deno functions + 3 shared utilities |
| 10 — MT5 EA | ✅ Done | `mt5-ea/MPWealthSystem_EA.mq5` — MQL5 EA, timer-based push, WebRequest |
| 11 — Deploy | 🔲 Pending | Testing + Vercel/Netlify deployment |

**TypeScript:** `tsc --noEmit` passes with zero errors.
