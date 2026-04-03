# MP Wealth System v2.0.0

> **Personal Financial Command Center** — Multi-broker trading tracker, wealth manager, and AI-ready dashboard.
>
> Owner: **Marlon Pontomudis** | Timezone: **WIT (Asia/Jayapura, GMT+9)**

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Summary](#database-summary)
5. [Current Features](#current-features)
6. [Shared UI Components](#shared-ui-components)
7. [Environment Variables](#environment-variables)
8. [Development Setup](#development-setup)
9. [Deployment](#deployment)
10. [Known Issues](#known-issues)
11. [Roadmap](#roadmap)
12. [Development Status](#development-status)

---

## Overview

MP Wealth System is a fullstack personal finance and trading dashboard built for a single user. It combines three pillars:

| Pillar | Description |
|--------|-------------|
| **Trading Monitor** | Track multiple broker accounts, view equity/balance/P&L, manage trading accounts manually |
| **Wealth Tracker** | Record income, expenses, and transfers; manage assets in IDR & USD |
| **AI-Ready Architecture** | Database and service layer prepared for WhatsApp + OCR parsing (implementation pending) |

### Key Goals

- Multi-broker trading tracking (EXNESS, TICKMILL, ICM, XM, MIFX)
- Wealth management with dual-currency support (IDR / USD)
- Manual-first data entry before MT5 automation is activated
- AI parsing of WhatsApp messages for automated transaction creation (future)
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
| Backend / Database | Supabase (PostgreSQL, Auth, Edge Functions) | latest |
| Deployment | Vercel | — |

---

## Project Structure

```
mp-wealth-system/
├── vercel.json                   # SPA routing config (filesystem + fallback)
├── vite.config.ts                # Vite config (base: '/', outDir: dist/)
├── database/
│   └── schema.sql                # Full PostgreSQL schema (15 tables)
│
├── mt5-ea/
│   ├── MPWealthSystem_EA.mq5     # MQL5 EA for MT5 auto-sync (planned)
│   └── README.md
│
├── supabase/
│   ├── config.toml
│   └── functions/                # Deno edge functions
│       ├── _shared/              # cors, supabase-client, ai-parser utilities
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
    │   ├── components/           # 15 reusable UI components (see below)
    │   ├── hooks/
    │   │   ├── useAuth.ts        # Supabase session + onAuthStateChange
    │   │   ├── useExchangeRate.ts
    │   │   ├── useDebounce.ts
    │   │   └── useLocalStorage.ts
    │   ├── services/
    │   │   └── currency.service.ts
    │   └── utils/
    │       ├── cn.ts             # Class name merger (clsx)
    │       └── formatters.ts     # formatIDR, formatUSD, formatDate, formatPercent
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
    │   │   │                     # TransactionList, TransactionForm, AssetList
    │   │   ├── hooks/            # useTransactions, useAssets,
    │   │   │                     # useCategories, useMonthlySummary
    │   │   └── services/
    │   │       └── wealth.service.ts
    │   │
    │   └── ai-assistant/
    │       ├── components/       # AIAssistantPanel, WhatsAppFeed
    │       ├── hooks/            # useAILogs, useWhatsAppMessages, useOCRResults
    │       └── services/
    │           └── ai.service.ts
    │
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        ├── TradingPage.tsx
        ├── WealthPage.tsx
        ├── TransactionsPage.tsx
        ├── AssetsPage.tsx
        ├── ReportsPage.tsx
        └── SettingsPage.tsx
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
| `transactions` | All financial transactions (IDR/USD, manual + AI-sourced) |
| `assets` | Tracked assets by type (cash, bank, trading, investment, crypto) |
| `budgets` | Monthly budget targets per category |

#### AI / Integration

| Table | Purpose |
|-------|---------|
| `whatsapp_messages` | Incoming WhatsApp messages from Fonnte |
| `ai_logs` | Claude AI parsing results (confidence score, parsed JSONB) |
| `ocr_results` | Receipt/image OCR extraction results |

#### Shared

| Table | Purpose |
|-------|---------|
| `exchange_rates` | Daily USD/IDR rates |
| `system_logs` | App-wide error and info logs |
| `user_preferences` | Per-user settings (currency, theme) |

### Key Relationships

- `trading_accounts.broker_id` → `broker_profiles.id`
- `account_metrics_snapshots.account_id` → `trading_accounts.id`
- `transactions.category_id` → `categories.id`
- `transactions.ai_log_id` → `ai_logs.id`
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
- Magic link (OTP email) support
- Session persistence with auto token refresh
- Protected routes via `RequireAuth` guard
- Redirect if already authenticated via `RedirectIfAuth`

### Trading

- Broker profiles available (EXNESS, TICKMILL, ICM, XM, MIFX)
- Trading accounts table ready — add/view accounts
- Add Trading Account modal with form validation
- Portfolio total overview (equity, balance, P&L)
- Equity history chart (Recharts line chart)
- Broker card per account with metrics display

### Wealth

- Transactions: create, list, filter by type/date/category
- Assets: view and add assets by type (cash, bank, trading, investment, crypto)
- Dual-currency support (IDR primary, USD secondary)
- Balance overview with net worth breakdown
- Monthly income/expense summary

### Dashboard

- Portfolio overview cards (equity, balance, P&L)
- Equity / balance / floating profit stat cards
- Recharts charts for trading and wealth overview

### Utilities

- `formatIDR()` — Indonesian Rupiah with `Rp` prefix
- `formatUSD()` — US Dollar with `$` prefix
- `formatDate()` — localized date formatting
- `formatPercent()` — percentage with sign
- `cn()` — conditional class name merging

---

## Shared UI Components

| Component | Description |
|-----------|-------------|
| `Layout` | Sidebar + Navbar + Outlet shell |
| `Sidebar` | Navigation links with active state (NavLink) |
| `Navbar` | Page title (from route) + sign out button |
| `Button` | 4 variants (primary, secondary, danger, ghost) × 3 sizes + loading state |
| `Input` | Labeled input with error message and icon slot |
| `Select` | Labeled select with options array and error |
| `Modal` | Portal modal with Escape key + 4 sizes (sm/md/lg/xl) |
| `Card` | Surface card with optional title and action slot |
| `Tabs` | Controlled/uncontrolled tab navigation |
| `Badge` | 5-variant status pill (success/danger/warning/info/neutral) |
| `StatCard` | KPI card with trend indicator |
| `CurrencyDisplay` | Dual IDR/USD display component |
| `LoadingSpinner` | Inline spinner + full-page loader |
| `EmptyState` | Icon + message + optional action button |
| `ErrorBoundary` | React class error boundary for crash recovery |

---

## Environment Variables

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> All environment variables use `import.meta.env` — no `process.env` anywhere in the codebase.

### Edge Function Secrets (`supabase secrets set`)

```env
ANTHROPIC_API_KEY=sk-ant-...
INGEST_API_KEY=your-random-secret
WHATSAPP_VERIFY_TOKEN=your-token
OWNER_PHONE_NUMBER=628xxxxxxxx
```

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
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables

### `vercel.json` (SPA Routing Fix)

```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/" }
  ]
}
```

- `handle: filesystem` — serves real static files (JS/CSS/images) first
- `src: /(.*)` → `dest: /` — fallback to `index.html` for all client-side routes
- This fixes the `"Expected a JavaScript module but got text/html"` error that occurs when JS assets are incorrectly intercepted by the SPA fallback

### Vite Config

```ts
base: '/'         // correct asset paths
outDir: 'dist'    // Vercel expects dist/
sourcemap: false  // production build
```

---

## Known Issues

- No real trading data yet — dashboard shows zeros until manual entries are added
- MT5 EA integration not yet active — `ingest-metrics` edge function is built but EA is not deployed
- AI assistant (WhatsApp parsing) is built but not yet configured with Fonnte webhook
- Exchange rates require manual trigger or pg_cron scheduler setup
- No bulk import for historical transactions yet

---

## Roadmap

### Phase 1 — Now (Manual Input)

- Manual trading account entry and P&L tracking
- Wealth transactions and assets population
- Dashboard population with real data
- Reports page with monthly breakdown

### Phase 2 — Next

- Advanced reports and analytics
- Export to CSV / PDF
- UX improvements and mobile responsiveness
- Budget vs actuals tracking

### Phase 3 — Future Automation

- MT5 EA deployment to live brokers
- Auto-sync of trading metrics via `ingest-metrics`
- WhatsApp + AI parsing via Fonnte + Claude
- OCR receipt scanning for expense entry

---

## Development Status

| Layer | Status | Notes |
|-------|--------|-------|
| Database Schema | ✅ Complete | 15 tables, RLS, triggers, RPC functions |
| TypeScript Types | ✅ Complete | All tables, enums, RPC types generated |
| Supabase Config | ✅ Complete | Client, constants, broker catalog |
| Service Layer | ✅ Complete | Trading, wealth, AI, currency services |
| TanStack Query Hooks | ✅ Complete | All features covered |
| Shared UI Components | ✅ Complete | 15 components |
| Feature Components | ✅ Complete | Trading, Wealth, AI panels |
| Pages & Routing | ✅ Complete | 8 pages + auth guards |
| Edge Functions | ✅ Complete | 4 Deno functions built |
| Frontend Deployment | ✅ Live on Vercel | vercel.json SPA routing fixed |
| MT5 EA Integration | ⏳ Pending | EA built, not yet deployed to brokers |
| WhatsApp / AI Parsing | ⏳ Pending | Architecture ready, webhook not configured |
| Real Data Population | ⏳ Pending | Manual entry in progress |

