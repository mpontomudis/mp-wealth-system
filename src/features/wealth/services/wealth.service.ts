// src/features/wealth/services/wealth.service.ts
import { supabase } from '@/config/supabase';
import { getCurrentUser } from '@/lib/db';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase';
import type { TransactionType } from '@/types/supabase';

// ─── Types ───────────────────────────────────────────────────

type ServiceResponse<T> = {
  data: T | null;
  error: unknown;
};

export type TransactionFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: TransactionType;
};

export type MonthlySummary = {
  total_income_idr:  number;
  total_expense_idr: number;
  total_income_usd:  number;
  total_expense_usd: number;
  net_cashflow_idr:  number;
  net_cashflow_usd:  number;
};

// ─── Helper ──────────────────────────────────────────────────

function handleResponse<T>(data: T | null, error: unknown): ServiceResponse<T> {
  if (error) return { data: null, error };
  return { data, error: null };
}

// NOTE: Asset balance is updated server-side by the DB trigger
// `trg_sync_asset_balance` (see database/runsql.md Section 9).
// Do NOT add client-side balance update logic here — it will double-count.

// ─── Transaction Fields ───────────────────────────────────────

const TRANSACTION_FIELDS = `
  id,
  user_id,
  category_id,
  type,
  amount,
  currency,
  amount_usd,
  description,
  notes,
  fee,
  from_asset_id,
  to_asset_id,
  transaction_date,
  source,
  whatsapp_message_id,
  ai_log_id,
  deleted_at,
  created_at,
  updated_at,
  search_vector
` as const;

// ─── 1. getTransactions ───────────────────────────────────────

export async function getTransactions(
  userId: string,
  filters?: TransactionFilters
): Promise<ServiceResponse<Tables<'transactions'>[]>> {
  let query = supabase
    .from('transactions')
    .select(TRANSACTION_FIELDS)
    .eq('user_id', userId)
    .is('deleted_at' as never, null)
    .order('transaction_date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  const { data, error } = await query;

  return handleResponse(data, error);
}

// ─── 2. createTransaction ─────────────────────────────────────

export async function createTransaction(
  payload: Omit<TablesInsert<'transactions'>, 'user_id'>
): Promise<ServiceResponse<Tables<'transactions'>>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...payload, user_id: user.id })
    .select(TRANSACTION_FIELDS)
    .single();

  if (error) console.error('[createTransaction] error:', JSON.stringify(error, null, 2));
  return handleResponse(data, error);
}

// ─── 3. updateTransaction ─────────────────────────────────────

export async function updateTransaction(
  id: string,
  payload: TablesUpdate<'transactions'>
): Promise<ServiceResponse<Tables<'transactions'>>> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(TRANSACTION_FIELDS)
    .single();

  if (error) console.error('[updateTransaction] error:', JSON.stringify(error, null, 2));
  return handleResponse(data, error);
}

// ─── 4. deleteTransaction (soft) ─────────────────────────────

export async function deleteTransaction(
  id: string
): Promise<ServiceResponse<null>> {
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id);

  if (error) return { data: null, error };
  return { data: null, error: null };
}

// ─── Category Fields ─────────────────────────────────────────
const CATEGORY_FIELDS = `
  id,
  user_id,
  name,
  type,
  icon,
  color,
  parent_category_id,
  is_active,
  deleted_at,
  created_at,
  updated_at
` as const;

// ─── 5. getCategories ─────────────────────────────────────────

export async function getCategories(
  userId: string
): Promise<ServiceResponse<Tables<'categories'>[]>> {
  const { data, error } = await supabase
    .from('categories')
    .select(CATEGORY_FIELDS)
    .eq('user_id', userId)
    .is('deleted_at' as never, null)
    .order('name', { ascending: true });

  return handleResponse(data, error);
}

// ─── 6. createCategory ───────────────────────────────────────

export async function createCategory(
  payload: Omit<TablesInsert<'categories'>, 'user_id'>
): Promise<ServiceResponse<Tables<'categories'>>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...payload, user_id: user.id })
    .select(CATEGORY_FIELDS)
    .single();

  return handleResponse(data, error);
}

// ─── 7. deleteCategory (soft) ────────────────────────────────

export async function deleteCategory(
  id: string
): Promise<ServiceResponse<null>> {
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id);

  if (error) return { data: null, error };
  return { data: null, error: null };
}

// ─── Asset Fields ─────────────────────────────────────────────

const ASSET_FIELDS = `
  id,
  user_id,
  name,
  type,
  institution,
  account_number,
  balance,
  currency,
  balance_usd,
  trading_account_id,
  is_active,
  deleted_at,
  last_updated,
  created_at,
  updated_at
` as const;

// ─── 7. getAssets ─────────────────────────────────────────────

export async function getAssets(
  userId: string
): Promise<ServiceResponse<Tables<'assets'>[]>> {
  const { data, error } = await supabase
    .from('assets')
    .select(ASSET_FIELDS)
    .eq('user_id', userId)
    .is('deleted_at' as never, null)
    .order('created_at', { ascending: false });

  return handleResponse(data, error);
}

// ─── 8. createAsset ──────────────────────────────────────────

export async function createAsset(
  payload: Omit<TablesInsert<'assets'>, 'user_id'>
): Promise<ServiceResponse<Tables<'assets'>>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('assets')
    .insert({ ...payload, user_id: user.id })
    .select(ASSET_FIELDS)
    .single();

  if (error) console.error('[createAsset] error:', JSON.stringify(error, null, 2));
  return handleResponse(data, error);
}

// ─── 10. updateAsset ─────────────────────────────────────────

export async function updateAsset(
  id: string,
  payload: TablesUpdate<'assets'>
): Promise<ServiceResponse<Tables<'assets'>>> {
  const { data, error } = await supabase
    .from('assets')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ASSET_FIELDS)
    .single();

  return handleResponse(data, error);
}

// ─── 12. deleteAsset (soft) ──────────────────────────────────

export async function deleteAsset(
  id: string
): Promise<ServiceResponse<null>> {
  const { error } = await supabase
    .from('assets')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id);

  if (error) return { data: null, error };
  return { data: null, error: null };
}

// ─── 13. getMonthlySummary (client-side — no RPC needed) ──────

export async function getMonthlySummary(
  userId: string,
  year?: number,
  month?: number
): Promise<ServiceResponse<MonthlySummary>> {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, currency, amount_usd')
    .eq('user_id', userId)
    .is('deleted_at' as never, null)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate);

  if (error) return handleResponse(null, error);

  const USD_RATE = 15750;
  let total_income_idr = 0, total_expense_idr = 0;
  let total_income_usd = 0, total_expense_usd = 0;

  for (const tx of data ?? []) {
    const amt = Number(tx.amount ?? 0);
    const amtUsd = Number(tx.amount_usd ?? 0) || (tx.currency === 'USD' ? amt : amt / USD_RATE);
    const amtIdr = tx.currency === 'USD' ? amt * USD_RATE : amt;

    if (tx.type === 'income') {
      total_income_idr += amtIdr;
      total_income_usd += amtUsd;
    } else if (tx.type === 'expense') {
      total_expense_idr += amtIdr;
      total_expense_usd += amtUsd;
    }
  }

  const summary: MonthlySummary = {
    total_income_idr,
    total_expense_idr,
    total_income_usd,
    total_expense_usd,
    net_cashflow_idr: total_income_idr - total_expense_idr,
    net_cashflow_usd: total_income_usd - total_expense_usd,
  };

  return handleResponse(summary, null);
}