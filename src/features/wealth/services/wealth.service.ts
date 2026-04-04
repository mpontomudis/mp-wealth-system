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

// ─── Balance sync helper ──────────────────────────────────────
// multiplier: +1 = apply transaction, -1 = reverse transaction

type TxForBalance = {
  type: string;
  amount: number | string;
  fee?: number | string | null;
  from_asset_id?: string | null;
  to_asset_id?: string | null;
};

async function applyBalanceDeltas(tx: TxForBalance, multiplier: 1 | -1) {
  const amt = Number(tx.amount);
  const fee = Number(tx.fee ?? 0);

  const adjustments: { id: string; delta: number }[] = [];

  if (tx.type === 'income' && tx.to_asset_id) {
    adjustments.push({ id: tx.to_asset_id, delta: amt * multiplier });
  } else if (tx.type === 'expense' && tx.from_asset_id) {
    adjustments.push({ id: tx.from_asset_id, delta: -amt * multiplier });
  } else if (tx.type === 'transfer') {
    if (tx.from_asset_id) adjustments.push({ id: tx.from_asset_id, delta: -(amt + fee) * multiplier });
    if (tx.to_asset_id)   adjustments.push({ id: tx.to_asset_id,   delta:  amt            * multiplier });
  }

  for (const { id, delta } of adjustments) {
    const { data: asset, error: fetchErr } = await supabase
      .from('assets')
      .select('balance')
      .eq('id', id)
      .single();
    if (fetchErr || !asset) {
      console.error('[applyBalanceDeltas] failed to fetch asset', id, fetchErr);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('assets')
      .update({
        balance: Number(asset.balance) + delta,
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateErr) {
      console.error('[applyBalanceDeltas] failed to update asset', id, delta, updateErr);
    } else {
      console.log(`[applyBalanceDeltas] asset ${id} balance ${delta >= 0 ? '+' : ''}${delta}`);
    }
  }
}

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

  if (error) {
    console.error('[createTransaction] error:', JSON.stringify(error, null, 2));
    return handleResponse(data, error);
  }

  // Update asset balances
  await applyBalanceDeltas(payload, 1);

  return handleResponse(data, error);
}

// ─── 3. updateTransaction ─────────────────────────────────────

export async function updateTransaction(
  id: string,
  payload: TablesUpdate<'transactions'>
): Promise<ServiceResponse<Tables<'transactions'>>> {
  // Fetch old transaction to reverse its balance effect
  const { data: old } = await supabase
    .from('transactions')
    .select('type, amount, fee, from_asset_id, to_asset_id')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('transactions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(TRANSACTION_FIELDS)
    .single();

  if (error) {
    console.error('[updateTransaction] error:', JSON.stringify(error, null, 2));
    return handleResponse(data, error);
  }

  // Reverse old balance effects, apply new ones
  if (old) await applyBalanceDeltas(old, -1);
  await applyBalanceDeltas(payload, 1);

  return handleResponse(data, error);
}

// ─── 4. deleteTransaction (soft) ─────────────────────────────

export async function deleteTransaction(
  id: string
): Promise<ServiceResponse<null>> {
  // Fetch transaction to reverse its balance effect before soft-deleting
  const { data: tx } = await supabase
    .from('transactions')
    .select('type, amount, fee, from_asset_id, to_asset_id')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id);

  if (error) return { data: null, error };

  // Reverse balance effects of the deleted transaction
  if (tx) await applyBalanceDeltas(tx, -1);

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

// ─── 13. getMonthlySummary ────────────────────────────────────

export async function getMonthlySummary(
  userId: string,
  year?: number,
  month?: number
): Promise<ServiceResponse<MonthlySummary>> {
  const now = new Date();

  const { data, error } = await supabase.rpc('get_monthly_summary', {
    p_user_id: userId,
    p_year: year ?? now.getFullYear(),
    p_month: month ?? now.getMonth() + 1,
  });

  return handleResponse(data as MonthlySummary | null, error);
}