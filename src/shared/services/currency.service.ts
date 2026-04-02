// src/shared/services/currency.service.ts
import { supabase } from '@/config/supabase';
import type { Tables } from '@/types/supabase';

export type ExchangeRate = Tables<'exchange_rates'>;

export async function getLatestExchangeRate(): Promise<ExchangeRate | null> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('base_currency', 'USD')
    .eq('target_currency', 'IDR')
    .order('rate_date', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}
