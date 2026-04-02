# MPWealthSystem EA — MT5 Expert Advisor

> Pushes account metrics from MetaTrader 5 to the **MP Wealth System** backend every N minutes via HTTP POST.

---

## What it does

On every timer tick (default: 5 minutes), the EA collects:

| Metric | Source |
|--------|--------|
| Balance | `AccountInfoDouble(ACCOUNT_BALANCE)` |
| Equity | `AccountInfoDouble(ACCOUNT_EQUITY)` |
| Floating P&L | `AccountInfoDouble(ACCOUNT_PROFIT)` |
| Used Margin | `AccountInfoDouble(ACCOUNT_MARGIN)` |
| Free Margin | `AccountInfoDouble(ACCOUNT_FREEMARGIN)` |
| Margin Level % | `AccountInfoDouble(ACCOUNT_MARGIN_LEVEL)` |
| Open Positions | `PositionsTotal()` |
| Total Lots | Sum of `POSITION_VOLUME` across all open positions |

…and POSTs them as JSON to the `ingest-metrics` Supabase Edge Function.

The edge function:
1. Validates the `x-api-key` header
2. Looks up the `trading_accounts` record by `account_number` + `broker_code`
3. Inserts a new row into `account_metrics_snapshots`
4. Updates `trading_accounts.last_sync_at` → triggers `is_online` status in the frontend

---

## Installation

### 1. Copy the file to MT5

Copy `MPWealthSystem_EA.mq5` to:
```
<MT5 Data Folder>\MQL5\Experts\
```

To find your MT5 data folder:  
**File → Open Data Folder → MQL5 → Experts**

### 2. Compile

In **MetaEditor** (F4 from MT5):
- Open `MPWealthSystem_EA.mq5`
- Press **F7** to compile
- Confirm "0 errors, 0 warnings" in the Errors tab

### 3. Allow WebRequest (Critical)

In MT5: **Tools → Options → Expert Advisors**

☑ **Allow WebRequest for listed URL**

Add your Supabase functions base URL:
```
https://YOUR_PROJECT.supabase.co
```

> Without this, all `WebRequest()` calls return error `4014` and no data will be sent.

### 4. Attach to a Chart

- Open any chart (e.g. EURUSD M1 — low CPU usage)
- Drag `MPWealthSystem_EA` from the Navigator panel onto the chart
- Configure the input parameters (see below)
- Click **OK**

### 5. Enable AutoTrading

Click the **AutoTrading** button in the MT5 toolbar (or press **Ctrl+E**).  
The EA icon in the top-right of the chart should show a **green smiley face** 🙂 (not red).

---

## Input Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `IngestURL` | _(empty)_ | Full URL to `ingest-metrics` edge function |
| `ApiKey` | _(empty)_ | `INGEST_API_KEY` secret value |
| `BrokerCode` | `EXNESS` | Must match exactly: `EXNESS` / `TICKMILL` / `ICM` / `XM` / `MIFX` |
| `PushIntervalMin` | `5` | How often to push metrics (minutes). Minimum: 1 |
| `PushOnInit` | `true` | Push immediately when EA starts (recommended) |
| `EnableAlerts` | `true` | Show MT5 alert popup on HTTP errors |
| `EnablePushNotify` | `false` | Send MT5 push notification to mobile on errors |

### Example values

```
IngestURL   = https://abcdefghij.supabase.co/functions/v1/ingest-metrics
ApiKey      = sup3rs3cr3tk3y
BrokerCode  = EXNESS
PushIntervalMin = 5
```

---

## JSON Payload Sent

```json
{
  "account_number": "12345678",
  "broker_code": "EXNESS",
  "balance": 10500.00,
  "equity": 10230.50,
  "floating_profit": -269.50,
  "margin": 450.00,
  "free_margin": 9780.50,
  "margin_level": 2273.44,
  "open_positions": 3,
  "total_lots": 0.30,
  "snapshot_time": "2025-04-02T08:40:00Z"
}
```

`snapshot_time` is always **GMT/UTC** in ISO 8601 format.

---

## Expected Responses

| HTTP Code | Meaning | Action |
|-----------|---------|--------|
| `200` | Success — snapshot inserted | Logged to MT5 journal |
| `401` | Wrong API key | Check `ApiKey` input parameter |
| `404` | Account or broker not found | Check `BrokerCode` + account exists in DB |
| `400` | Bad request (missing fields) | Check EA version / payload |
| `-1` | WinInet error | URL not whitelisted — see Step 3 |

---

## Verifying it works

### In MT5 Journal tab
After the EA starts, you should see:
```
MPWealthSystem EA started. Account: 12345678 | Broker: EXNESS | Interval: 5 min
MPWealthSystem: Push OK [init] B=10500.00 E=10230.50 FP=-269.50 Pos=3 Lots=0.30
```

### In Supabase Dashboard
`Table Editor → account_metrics_snapshots` should have new rows every 5 minutes.

`Table Editor → trading_accounts` → `last_sync_at` column should update each push.

### In MP Wealth System Frontend
The account card shows **green "Online"** status when `last_sync_at` is within the last 10 minutes.

---

## Running on Multiple Accounts

Attach the EA to one chart **per trading account**:

| Account | Chart | BrokerCode |
|---------|-------|-----------|
| Exness #12345678 | EURUSD M1 on Exness terminal | EXNESS |
| Tickmill #87654321 | EURUSD M1 on Tickmill terminal | TICKMILL |

Each MT5 terminal needs its own EA instance with the correct `BrokerCode` and `ApiKey`.

---

## Troubleshooting

**EA shows red X (not smiley face)**
→ AutoTrading is disabled. Press Ctrl+E.

**Journal shows "WebRequest error 4014"**
→ URL not whitelisted. Re-check Tools → Options → Expert Advisors.

**HTTP 404 — Account not found**
→ The `account_number` (MT5 login number) must exist in `trading_accounts` table with matching `broker_id`. Add the account in the MP Wealth System first.

**HTTP 401 — Unauthorized**
→ `ApiKey` input doesn't match `INGEST_API_KEY` Supabase secret.

**Push OK but frontend shows Offline**
→ `last_sync_at` not updating. Check the edge function logs in Supabase Dashboard → Edge Functions → Logs.

---

## File Structure

```
mt5-ea/
├── MPWealthSystem_EA.mq5    ← Source (edit this)
└── README.md                ← This file
```

After compiling in MetaEditor, MT5 generates:
```
MQL5/Experts/
└── MPWealthSystem_EA.ex5    ← Compiled binary (auto-generated, do not commit)
```
