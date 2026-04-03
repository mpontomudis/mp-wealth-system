// src/features/trading/services/trading.service.ts
import { supabase } from '@/config/supabase';
import { getCurrentUser } from '@/lib/db';
import type { Tables } from '@/types/supabase';

// ─── Types ───────────────────────────────────────────────────

type ServiceResponse<T> = {
  data: T | null;
  error: unknown;
};

export type TradingAccountWithBroker = Tables<'trading_accounts'> & {
  broker_profiles?: Tables<'broker_profiles'>;
};

export type LatestMetrics = {
  id: string;
  account_id: string;
  balance: number;
  equity: number;
  floating_profit: number;
  margin: number;
  free_margin: number;
  margin_level: number;
  open_positions: number;
  total_lots: number;
  snapshot_time: string;
  data_source: 'EA' | 'MetaApi' | 'Manual';
  is_valid: boolean;
  created_at: string;
};

export type TradingAccountWithLatestMetrics = {
  id: string;
  broker_id: string;
  user_id: string;
  account_number: string;
  account_name: string | null;
  account_type: 'LIVE' | 'DEMO';
  server_name: string | null;
  base_currency: string;
  leverage: number;
  initial_deposit: number;
  is_active: boolean;
  last_sync_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  broker_profiles?: {
    id: string;
    broker_name: string;
    broker_code: string;
    api_endpoint: string | null;
    logo_url: string | null;
    is_active: boolean;
    timezone: string;
    created_at: string;
    updated_at: string;
  } | null;
  latest_metrics?: LatestMetrics | null;
};

export type EquityPoint = {
  equity: number;
  balance: number;
  snapshot_time: string;
};

export type PortfolioTotal = {
  total_equity_usd:  number;
  total_equity_idr:  number;
  total_balance_usd: number;
  total_balance_idr: number;
  total_profit_usd:  number;
  total_profit_idr:  number;
  exchange_rate:     number;
  last_updated:      string | null;
};

// ─── Helper ──────────────────────────────────────────────────

function handleResponse<T>(data: T | null, error: unknown): ServiceResponse<T> {
  if (error) return { data: null, error };
  return { data, error: null };
}

// ─── Field sets ───────────────────────────────────────────────

const TRADING_ACCOUNT_FIELDS = `
  id,
  broker_id,
  user_id,
  account_number,
  account_name,
  account_type,
  server_name,
  base_currency,
  leverage,
  initial_deposit,
  is_active,
  last_sync_at,
  deleted_at,
  created_at,
  updated_at
` as const;

const BROKER_PROFILE_FIELDS = `
  id,
  broker_name,
  broker_code,
  api_endpoint,
  logo_url,
  is_active,
  timezone,
  created_at,
  updated_at
` as const;

const METRICS_FIELDS = `
  id,
  account_id,
  balance,
  equity,
  floating_profit,
  margin,
  free_margin,
  margin_level,
  open_positions,
  total_lots,
  snapshot_time,
  data_source,
  is_valid,
  created_at
` as const;

// ─── 1. getTradingAccounts ────────────────────────────────────

export async function getTradingAccounts(
  userId: string
): Promise<ServiceResponse<TradingAccountWithBroker[]>> {
  const { data, error } = await supabase
    .from('trading_accounts')
    .select(
      `${TRADING_ACCOUNT_FIELDS},
       broker_profiles (
         ${BROKER_PROFILE_FIELDS}
       )`
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return handleResponse(data as TradingAccountWithBroker[] | null, error);
}

// ─── 2. getTradingAccountsWithLatestMetrics ───────────────────

export async function getTradingAccountsWithLatestMetrics(
  userId: string
): Promise<ServiceResponse<TradingAccountWithLatestMetrics[]>> {
  const { data: accounts, error: accountsError } = await supabase
    .from('trading_accounts')
    .select(
      `${TRADING_ACCOUNT_FIELDS},
       broker_profiles (
         ${BROKER_PROFILE_FIELDS}
       )`
    )
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (accountsError) return { data: null, error: accountsError };
  if (!accounts?.length) return { data: [], error: null };

  const accountIds = accounts.map((a) => a.id);

  const { data: snapshots, error: snapshotsError } = await supabase
    .from('account_metrics_snapshots')
    .select(METRICS_FIELDS)
    .in('account_id', accountIds)
    .order('snapshot_time', { ascending: false });

  if (snapshotsError) return { data: null, error: snapshotsError };

  // Keep only the latest snapshot per account (results already desc-sorted)
  const latestMap = new Map<string, LatestMetrics>();
  for (const snap of (snapshots ?? []) as unknown as LatestMetrics[]) {
    if (!latestMap.has(snap.account_id)) {
      latestMap.set(snap.account_id, snap);
    }
  }

  const result = accounts.map((account) => ({
    ...account,
    latest_metrics: latestMap.get(account.id) ?? null,
  })) as TradingAccountWithLatestMetrics[];

  return { data: result, error: null };
}

// ─── 3. getBrokerProfiles ─────────────────────────────────────

export async function getBrokerProfiles(): Promise<
  ServiceResponse<Tables<'broker_profiles'>[]>
> {
  const { data, error } = await supabase
    .from('broker_profiles')
    .select(BROKER_PROFILE_FIELDS)
    .eq('is_active', true)
    .order('broker_name', { ascending: true });

  return handleResponse(data, error);
}

// ─── 4. getLatestMetrics ──────────────────────────────────────

export async function getLatestMetrics(
  accountId: string
): Promise<ServiceResponse<LatestMetrics | null>> {
  const { data, error } = await supabase
    .from('account_metrics_snapshots')
    .select(METRICS_FIELDS)
    .eq('account_id', accountId)
    .order('snapshot_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  return handleResponse(data as LatestMetrics | null, error);
}

// ─── 5. getEquityHistory ──────────────────────────────────────

export async function getEquityHistory(
  accountId: string,
  limit = 100
): Promise<ServiceResponse<EquityPoint[]>> {
  const { data, error } = await supabase
    .from('account_metrics_snapshots')
    .select('equity, balance, snapshot_time')
    .eq('account_id', accountId)
    .order('snapshot_time', { ascending: false })
    .limit(limit);

  if (error) return { data: null, error };

  // Reverse to ascending order for chart rendering
  const ascending = (data ?? [])
    .map((row) => ({
      equity: row.equity,
      balance: row.balance,
      snapshot_time: row.snapshot_time,
    }))
    .reverse();

  return { data: ascending, error: null };
}

// ─── 6. getTradeHistory ───────────────────────────────────────

export async function getTradeHistory(
  accountId: string,
  limit = 50
): Promise<ServiceResponse<Tables<'trade_history'>[]>> {
  const { data, error } = await supabase
    .from('trade_history')
    .select(
      `id,
       account_id,
       ticket_number,
       symbol,
       trade_type,
       lot_size,
       open_price,
       close_price,
       stop_loss,
       take_profit,
       open_time,
       close_time,
       profit,
       net_profit,
       swap,
       commission,
       comment,
       ea_magic_number,
       is_closed,
       created_at`
    )
    .eq('account_id', accountId)
    .order('open_time', { ascending: false })
    .limit(limit);

  return handleResponse(data, error);
}

// ─── 7. createTradingAccount ──────────────────────────────────

export type CreateTradingAccountPayload = {
  broker_id:        string;
  account_number:   string;
  account_name?:    string | null;
  account_type?:    'LIVE' | 'DEMO';
  server_name?:     string | null;
  base_currency?:   string;
  leverage?:        number;
  initial_deposit?: number;
};

export async function createTradingAccount(
  payload: CreateTradingAccountPayload
): Promise<ServiceResponse<Tables<'trading_accounts'>>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('trading_accounts')
    .insert({
      user_id:          user.id,
      broker_id:        payload.broker_id,
      account_number:   payload.account_number,
      account_name:     payload.account_name ?? null,
      account_type:     payload.account_type ?? 'LIVE',
      server_name:      payload.server_name ?? null,
      base_currency:    payload.base_currency ?? 'USD',
      leverage:         payload.leverage ?? 100,
      initial_deposit:  payload.initial_deposit ?? 0,
      is_active:        true,
    })
    .select()
    .single();

  return handleResponse(data as Tables<'trading_accounts'> | null, error);
}

// ─── 8. getPortfolioTotal ─────────────────────────────────────

export async function getPortfolioTotal(
  userId: string
): Promise<ServiceResponse<PortfolioTotal>> {
  const { data, error } = await supabase.rpc('get_portfolio_total', {
    p_user_id: userId,
  });

  return handleResponse(data as PortfolioTotal | null, error);
}