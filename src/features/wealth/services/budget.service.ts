// src/features/wealth/services/budget.service.ts
import { supabase } from '@/config/supabase';
import { getCurrentUser } from '@/lib/db';

// ─── Types ───────────────────────────────────────────────────

type ServiceResponse<T> = { data: T | null; error: unknown };

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  categories?: { id: string; name: string; icon: string | null; color: string | null; type: string } | null;
}

export type BudgetInsert = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'categories'>;
export type BudgetUpdate = Partial<BudgetInsert>;

const BUDGET_FIELDS = `
  id,
  user_id,
  category_id,
  amount,
  period,
  start_date,
  end_date,
  is_active,
  deleted_at,
  created_at,
  updated_at,
  categories ( id, name, icon, color, type )
` as const;

// ─── getBudgets ───────────────────────────────────────────────

export async function getBudgets(userId: string): Promise<ServiceResponse<Budget[]>> {
  const { data, error } = await supabase
    .from('budgets')
    .select(BUDGET_FIELDS)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return { data: data as Budget[] | null, error };
}

// ─── createBudget ─────────────────────────────────────────────

export async function createBudget(payload: BudgetInsert): Promise<ServiceResponse<Budget>> {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('budgets')
    .insert({ ...payload, user_id: user.id })
    .select(BUDGET_FIELDS)
    .single();

  if (error) console.error('[createBudget]', JSON.stringify(error, null, 2));
  return { data: data as Budget | null, error };
}

// ─── updateBudget ─────────────────────────────────────────────

export async function updateBudget(id: string, payload: BudgetUpdate): Promise<ServiceResponse<Budget>> {
  const { data, error } = await supabase
    .from('budgets')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(BUDGET_FIELDS)
    .single();

  if (error) console.error('[updateBudget]', JSON.stringify(error, null, 2));
  return { data: data as Budget | null, error };
}

// ─── deleteBudget (soft) ──────────────────────────────────────

export async function deleteBudget(id: string): Promise<ServiceResponse<null>> {
  const { error } = await supabase
    .from('budgets')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);

  return { data: null, error };
}
