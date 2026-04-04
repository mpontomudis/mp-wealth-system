# MP Wealth System v3.0.0

> **Personal Financial Command Center** — Multi-broker trading tracker, wealth manager, and WhatsApp chatbot for hands-free transaction recording.
>
> Owner: **Marlon Pontomudis** | Timezone: **WIT (Asia/Jayapura, GMT+9)**

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Summary](#database-summary)
5. [Current Features](#current-features)
6. [WhatsApp Chatbot](#whatsapp-chatbot)
7. [Shared UI Components](#shared-ui-components)
8. [Environment Variables](#environment-variables)
9. [Development Setup](#development-setup)
10. [Deployment](#deployment)
11. [Known Issues](#known-issues)
12. [Roadmap](#roadmap)
13. [Development Status](#development-status)

---

## Overview

MP Wealth System is a fullstack personal finance and trading dashboard built for a single user. It combines three pillars:

| Pillar | Description |
|--------|-------------|
| **Trading Monitor** | Track multiple broker accounts, view equity/balance/P&L, manage trading accounts manually |
| **Wealth Tracker** | Record income, expenses, and transfers; manage assets in IDR & USD |
| **WhatsApp Chatbot** | Send natural language commands via WhatsApp to record transactions, check balances, and get daily reports — no app required |

### Key Goals

- Multi-broker trading tracking (EXNESS, TICKMILL, ICM, XM, MIFX)
- Wealth management with dual-currency support (IDR / USD)
- WhatsApp-first data entry: record transactions by sending a message
- Single-user, production-grade system hosted on Vercel + Supabase

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React + TypeScript | 18 / 5.3 |
| Build Tool | Vite | 5.0 |
| Routing | React Router | v6 |
| Server State | TanStack React Query | v5 |
| Client State | Zustand | v4 |
| Forms | React Hook Form | v7 |
| Styling | Tailwind CSS | v3 |
| Charts | Recharts | v2 |
| Icons | Lucide React | 0.303 |
| Backend / Database | Supabase (PostgreSQL, Auth) | latest |
| Serverless Functions | Vercel (`api/` directory) | — |
| WhatsApp Gateway | Fonnte API | — |
| Deployment | Vercel | — |

---

## Project Structure

```
mp-wealth-system/
├── vercel.json                   # SPA routing config + function maxDuration
├── vite.config.ts                # Vite config (base: '/', outDir: dist/)
│
├── api/                          # Vercel Serverless Functions
│   └── webhooks/
│       └── whatsapp.ts           # WhatsApp webhook (Fonnte → parse → DB → reply)
│
├── database/
│   └── schema.sql                # Full PostgreSQL schema (15 tables)
│
├── mt5-ea/
│   ├── MPWealthSystem_EA.mq5     # MQL5 EA for MT5 auto-sync (planned)
│   └── README.md
│
├── supabase/
│   ├── config.toml
│   └── functions/                # Deno edge functions (legacy/future)
│       ├── _shared/
│       ├── whatsapp-webhook/
│       ├── ingest-metrics/
│       ├── process-ai-message/
│       └── update-exchange-rate/
│
└── src/
    ├── App.tsx                   # Router + RequireAuth / RedirectIfAuth guards
    ├── main.tsx                  # React entry + QueryClientProvider
    │
    ├── config/
    │   ├── supabase.ts           # Typed Supabase client
    │   └── constants.ts          # Routes, broker codes, categories
    │
    ├── types/
    │   └── supabase.ts           # Generated DB types (Tables<T>, enums, RPC)
    │
    ├── shared/
    │   ├── components/           # 18 reusable UI components (see below)
    │   ├── hooks/
    │   │   ├── useAuth.ts        # Supabase session + onAuthStateChange
    │   │   ├── useExchangeRate.ts
    │   │   ├── useDebounce.ts
    │   │   └── useLocalStorage.ts
    │   ├── services/
    │   │   └── currency.service.ts
    │   └── utils/
    │       ├── cn.ts             # Class name merger (clsx)
    │       ├── formatters.ts     # formatIDR, formatUSD, formatDate, formatPercent
    │       └── exportUtils.ts    # exportTransactionsCSV(), exportTransactionsPDF()
    │
    ├── features/
    │   ├── trading/
    │   │   ├── components/       # TradingDashboard, BrokerCard, EquityChart,
    │   │   │                     # AddTradingAccountModal
    │   │   ├── hooks/            # useTradingAccounts, usePortfolioTotal,
    │   │   │                     # useTradeHistory, useEquityChart,
    │   │   │                     # useBrokerProfiles, useAddTradingAccount
    │   │   └── services/
    │   │       └── trading.service.ts
    │   │
    │   ├── wealth/
    │   │   ├── components/       # WealthDashboard, BalanceOverview,
    │   │   │                     # TransactionList, TransactionForm, AssetList,
    │   │   │                     # BudgetForm, BudgetVsActuals
    │   │   ├── hooks/            # useTransactions, useAssets,
    │   │   │                     # useCategories, useMonthlySummary, useBudgets
    │   │   └── services/
    │   │       ├── wealth.service.ts
    │   │       └── budget.service.ts
    │   │
    │   └── ai-assistant/
    │       ├── components/       # AIAssistantPanel, WhatsAppFeed
    │       ├── hooks/            # useAILogs, useWhatsAppMessages, useOCRResults
    │       └── services/
    │           └── ai.service.ts
    │
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx     # Total Net Worth banner + layout
        ├── TradingPage.tsx
        ├── WealthPage.tsx
        ├── TransactionsPage.tsx
        ├── AssetsPage.tsx
        ├── ReportsPage.tsx       # 3-tab analytics: Overview / Categories / 6-Mo Trends + Export
        ├── BudgetPage.tsx        # Budget vs Actuals page at /budget
        ├── SettingsPage.tsx
        └── GuidePage.tsx         # v3.0 — Phase 2 features + WhatsApp chatbot guide
```

---

## Database Summary

**15 tables** in PostgreSQL via Supabase. RLS is enabled on user-scoped tables.

### Tables by Domain

#### Trading

| Table | Purpose |
|-------|---------|
| `broker_profiles` | Global broker catalog (shared, no user_id) |
| `trading_accounts` | Per-user account config (broker, type, currency, leverage) |
| `account_metrics_snapshots` | Live metrics pushed by MT5 EA (balance, equity, floating P&L) |
| `trade_history` | Closed trade records |
| `daily_summaries` | Aggregated daily account stats |

#### Wealth

| Table | Purpose |
|-------|---------|
| `categories` | Income/expense categories with parent hierarchy |
| `transactions` | All financial transactions (IDR/USD, source: manual/whatsapp/ai) |
| `assets` | Tracked assets by type (cash, bank, e_wallet, trading, investment, crypto) |
| `budgets` | Monthly budget targets per category |

#### AI / Integration

| Table | Purpose |
|-------|---------|
| `whatsapp_messages` | Incoming WhatsApp messages from Fonnte (processing_status: pending/processed/failed) |
| `ai_logs` | AI parsing results |
| `ocr_results` | Receipt/image OCR extraction results |

#### Shared

| Table | Purpose |
|-------|---------|
| `exchange_rates` | Daily USD/IDR rates |
| `system_logs` | App-wide error and info logs |
| `user_preferences` | Per-user settings (currency, theme, whatsapp_number) |

### Key Relationships

- `trading_accounts.broker_id` → `broker_profiles.id`
- `account_metrics_snapshots.account_id` → `trading_accounts.id`
- `transactions.category_id` → `categories.id`
- `transactions.from_asset_id` / `to_asset_id` → `assets.id`
- `transactions.whatsapp_message_id` → `whatsapp_messages.id`
- `ai_logs.whatsapp_message_id` → `whatsapp_messages.id`

### PostgreSQL RPC Functions

| Function | Description |
|----------|-------------|
| `get_portfolio_total(user_id)` | Aggregates equity/balance across all accounts in USD + IDR |
| `get_monthly_summary(user_id, year, month)` | Income/expense totals for a given month |

---

## Current Features

### Auth

- Email + password login via Supabase Auth
- Session persistence with auto token refresh
- Protected routes via `RequireAuth` guard

### Dashboard

- **Total Net Worth banner** — `totalAssetsIDR + tradingEquityIDR` with visual split bar (Wealth % vs Trading %)
- Portfolio overview cards (equity, balance, P&L, monthly net)
- Recharts charts for trading and wealth overview

### Trading

- Broker profiles (EXNESS, TICKMILL, ICM, XM, MIFX)
- Add/view trading accounts
- Portfolio total overview (equity, balance, P&L)
- Equity history chart

### Wealth

- Transactions: create, list, filter by type/date/category
- Assets: view and add assets (cash, bank, e_wallet, trading, investment, crypto)
- `from_asset_id` / `to_asset_id` on transactions → auto-update asset balances via DB trigger
- Dual-currency support (IDR primary, USD secondary)
- Monthly income/expense summary

### Reports

- 3-tab analytics page: **Overview**, **Categories**, **6-Mo Trends**
- Overview: KPI cards (income, expense, savings rate, net cashflow) + monthly bar chart + transaction table
- Categories: donut chart of expense breakdown per category + ranked table
- 6-Mo Trends: multi-line area chart of income, expense, and savings over last 6 months
- **Export to CSV** — pure-JS blob download with UTF-8 BOM (Excel-compatible)
- **Export to PDF** — jsPDF + autoTable: summary header + full transaction table + page footers

### Budget vs Actuals

- Create monthly/weekly/yearly budgets per expense category
- Budget vs Actuals progress bar cards: color-coded (green → yellow → red as usage increases)
- Inline category creation — create new expense categories directly from the budget form (emoji picker + color picker, no page navigation required)
- Custom dark-themed dropdowns (`CustomSelect`) replacing native `<select>` for full dark-mode compatibility
- Budget CRUD: create, edit, delete (soft-delete via `deleted_at`)

### Mobile UX

- **BottomNav** — fixed bottom navigation bar on mobile (`lg:hidden`): Dashboard, Transactions, Reports, Budget, Assets
- Layout padding adjusted (`pb-20 lg:pb-0`) to prevent content hidden behind BottomNav

### Guide

- Full in-app user guide (v3.0, accordion layout)
- 12 sections — updated for Phase 2: Reports tabs, Budget, Export, inline category creation
- Section 12: FAQ with Phase 2 troubleshooting entries

---

## WhatsApp Chatbot

### Architecture

```
WhatsApp (Marlon) → Fonnte → POST /api/webhooks/whatsapp (Vercel) → Supabase → Fonnte reply
```

### File: `api/webhooks/whatsapp.ts`

Vercel Serverless Function (TypeScript). Key functions:

| Function | Description |
|----------|-------------|
| `parseAmount(raw)` | Parse Indonesian amounts: `15rb`, `5jt`, `10.518.612`, `10518612` |
| `parseCommand(text)` | NLP parser → intent + amount + description + fromAssetHint + toAssetHint |
| `findAssetId(userId, hint)` | Fuzzy partial match on asset names |
| `findCategoryId(userId, type, hint)` | Keyword → category name → DB lookup |
| `processCommand(parsed, userId, waId)` | Route intent to transaction insert / balance / report |
| `getBalanceSummary(userId)` | List all assets + total IDR |
| `getDailyReport(userId)` | Today's transactions + income/expense/net summary |
| `sendWAReply(to, message)` | Send reply via Fonnte API |
| `getDeviceOwnerUserId()` | Lookup user_id from user_preferences (single-user fallback) |

### Supported Commands

| Send this | Result |
|-----------|--------|
| `beli kopi 15rb dari gopay` | Expense Rp 15.000, from_asset = GoPay |
| `makan siang 35rb dari bri` | Expense Rp 35.000, from_asset = BRI |
| `gaji masuk 5jt ke bri` | Income Rp 5.000.000, to_asset = BRI |
| `transfer 1jt dari bri ke bca` | Transfer Rp 1.000.000, from=BRI to=BCA |
| `saldo` | List all assets + Total IDR |
| `laporan` | Today's transaction summary |
| `bantu` | Full command guide |

### Amount Formats

`15000` · `15rb` · `15k` · `15ribu` · `5jt` · `5juta` · `1.5jt` · `10.518.612` · `10,518,612`

### Asset Matching

Partial case-insensitive match: `blubca` → "Bank BluBCA", `bri` → "BRI Utama".
If two assets share a keyword (e.g. "Bank BCA" and "Bank BluBCA"), use a unique substring: `blu` for BluBCA.

### Fonnte Setup

- Device: `6282227653512` (Fonnte WhatsApp number)
- Sender (owner): `6281356834753` (Marlon's personal number)
- Webhook URL: `https://mp-wealth-system.vercel.app/api/webhooks/whatsapp`
- **autoread must be ON** in Fonnte device settings

---

## Shared UI Components

| Component | Description |
|-----------|-------------|
| `Layout` | Sidebar + Navbar + BottomNav (mobile) + Outlet shell |
| `Sidebar` | Navigation links with active state (NavLink) |
| `Navbar` | Page title (from route) + sign out button |
| `BottomNav` | Mobile-only fixed bottom nav — 5 routes (Dashboard, Transactions, Reports, Budget, Assets) |
| `Button` | 4 variants (primary, secondary, danger, ghost) × 3 sizes + loading state |
| `Input` | Labeled input with error message and icon slot |
| `Select` | Labeled select with options array and error |
| `CustomSelect` | Fully custom dark-themed dropdown — replaces native `<select>`; supports `onAddNew` callback |
| `ExportMenu` | Dropdown button for CSV / PDF export (used in ReportsPage) |
| `Modal` | Portal modal with Escape key + 4 sizes (sm/md/lg/xl) |
| `Card` | Surface card with optional title and action slot |
| `Tabs` | Controlled/uncontrolled tab navigation |
| `Badge` | 5-variant status pill (success/danger/warning/info/neutral) |
| `StatCard` | KPI card with trend indicator, consistent height via invisible spacer |
| `CurrencyDisplay` | Dual IDR/USD display component |
| `LoadingSpinner` | Inline spinner + full-page loader |
| `EmptyState` | Icon + message + optional action button |
| `ErrorBoundary` | React class error boundary for crash recovery |

---

## Environment Variables

### Frontend (`.env` / Vercel)

```env
VITE_SUPABASE_URL=https://wizjektyboozhfxwwlnl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_ROLE_KEY=eyJ...          # service_role key (used by webhook fallback)
VITE_WHATSAPP_VERIFY_TOKEN=iRipAg5...  # Fonnte device token (also used for sending)
VITE_WHATSAPP_PHONE_NUMBER_ID=6282227653512
```

### Webhook-specific (Vercel Production)

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Primary service role key for webhook
OWNER_PHONE_NUMBER=6281356834753       # Marlon's personal WA number (command sender)
FONNTE_TOKEN=iRipAg5...                # Fonnte device token for sending replies
```

> Webhook reads: `SUPABASE_SERVICE_ROLE_KEY` → `VITE_SUPABASE_SERVICE_ROLE_KEY` → `VITE_SUPABASE_ROLE_KEY` (fallback chain)

---

## Development Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start dev server
npm run dev
# → http://localhost:5173

# Type check
npm run type-check

# Build for production
npm run build
```

---

## Deployment

### Platform: Vercel

- Vite builds to `dist/`
- `api/` directory → Vercel Serverless Functions (TypeScript)
- Set env vars in Vercel Dashboard → Settings → Environment Variables

### `vercel.json`

```json
{
  "functions": {
    "api/**/*.ts": { "maxDuration": 10 }
  },
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/" }
  ]
}
```

---

## Known Issues

- MT5 EA integration not yet active — `ingest-metrics` edge function built but EA not deployed to brokers
- Exchange rates require manual trigger or pg_cron setup
- No bulk import for historical transactions
- WhatsApp chatbot processes text messages only (images/audio stored but not parsed)
- Category pie chart in Reports shows "Other" when transactions have no category assigned — select a category when recording expenses to populate the chart

---

## Roadmap

### Phase 1 — Complete ✅

- Manual trading account entry and P&L tracking
- Wealth transactions and assets with auto balance sync
- Dashboard with Total Net Worth banner
- Reports page with monthly breakdown (English UI)
- WhatsApp chatbot via Fonnte (live, end-to-end)

### Phase 2 — Complete ✅

- Advanced reports: 3-tab analytics (Overview, Categories, 6-Mo Trends)
- Export to CSV and PDF (jsPDF + autoTable)
- Budget vs Actuals: per-category budget targets with progress bar visualization
- Inline category creation from BudgetForm (emoji picker + color picker)
- Custom dark-themed `CustomSelect` dropdown — replaces native `<select>` system-wide
- Mobile UX: fixed BottomNav for 5-route navigation on small screens

### Phase 3 — Future Automation

- MT5 EA deployment to live brokers
- Auto-sync of trading metrics via `ingest-metrics`
- AI (Claude) parsing for smarter WhatsApp commands
- OCR receipt scanning for expense entry

---

## Development Status

| Layer | Status | Notes |
|-------|--------|-------|
| Database Schema | ✅ Complete | 15 tables, RLS, triggers, RPC functions |
| TypeScript Types | ✅ Complete | All tables, enums, RPC types generated |
| Supabase Config | ✅ Complete | Client, constants, broker catalog |
| Service Layer | ✅ Complete | Trading, wealth, budget, AI, currency services |
| TanStack Query Hooks | ✅ Complete | All features covered incl. useBudgets |
| Shared UI Components | ✅ Complete | 18 components — CustomSelect, ExportMenu, BottomNav added |
| Feature Components | ✅ Complete | Trading, Wealth, Budget panels |
| Pages & Routing | ✅ Complete | 10 pages + auth guards (added BudgetPage) |
| Dashboard | ✅ Complete | Total Net Worth banner, layout consistency |
| Reports Page | ✅ Complete | 3 tabs (Overview/Categories/6-Mo Trends) + CSV/PDF export |
| Budget Page | ✅ Complete | Budget vs Actuals + inline category creation + CustomSelect |
| Guide Page | ✅ Complete | v3.0 — Phase 2 sections, 12 accordion sections |
| Mobile UX | ✅ Complete | BottomNav (5 routes), responsive layout padding |
| WhatsApp Webhook | ✅ Live | Fonnte → Vercel → Supabase → Fonnte reply |
| WhatsApp Chatbot | ✅ Live | NLP parser, asset lookup, balance, report |
| Frontend Deployment | ✅ Live | https://mp-wealth-system.vercel.app |
| MT5 EA Integration | ⏳ Pending | EA built, not yet deployed to brokers |
| AI (Claude) Parsing | ⏳ Future | Architecture ready |
| Real Trading Data | ⏳ Pending | Manual entry in progress |

> **Personal Financial Command Center** — Multi-broker trading tracker, wealth manager, and AI-ready dashboard.
>
> Owner: **Marlon Pontomudis** | Timezone: **WIT (Asia/Jayapura, GMT+9)**

---