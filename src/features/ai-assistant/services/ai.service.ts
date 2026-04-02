// src/features/ai-assistant/services/ai.service.ts
import { supabase } from '@/config/supabase';
import type { Tables, TablesInsert, TransactionType } from '@/types/supabase';

// ─── Types ───────────────────────────────────────────────────

type ServiceResponse<T> = {
  data: T | null;
  error: unknown;
};

type AILogParsedData = {
  amount: number;
  type: TransactionType;
  category?: string;
  description?: string;
  currency?: string;
  confidence?: number;
};

// ─── Helper ──────────────────────────────────────────────────

function handleResponse<T>(data: T | null, error: unknown): ServiceResponse<T> {
  if (error) return { data: null, error };
  return { data, error: null };
}

// ─── Parsed Data Guard ───────────────────────────────────────

function isValidParsedData(value: unknown): value is AILogParsedData {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  if (typeof obj['amount'] !== 'number' || isNaN(obj['amount']) || obj['amount'] <= 0) {
    return false;
  }

  if (obj['type'] !== 'income' && obj['type'] !== 'expense' && obj['type'] !== 'transfer') {
    return false;
  }

  return true;
}

// ─── 1. getWhatsAppMessages ───────────────────────────────────

export async function getWhatsAppMessages(
  userId: string
): Promise<ServiceResponse<Tables<'whatsapp_messages'>[]>> {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select(
      `id,
       user_id,
       whatsapp_id,
       from_number,
       message_type,
       text_content,
       media_url,
       media_type,
       processing_status,
       processed_at,
       error_message,
       received_at,
       created_at`
    )
    .eq('user_id', userId)
    .order('received_at', { ascending: false });

  return handleResponse(data, error);
}

// ─── 2. getAILogs ─────────────────────────────────────────────

export async function getAILogs(
  userId: string
): Promise<ServiceResponse<Tables<'ai_logs'>[]>> {
  const { data, error } = await supabase
    .from('ai_logs')
    .select(
      `id,
       user_id,
       whatsapp_message_id,
       input_content,
       input_type,
       parsed_data,
       confidence_score,
       validation_result,
       ai_provider,
       ai_model,
       tokens_used,
       processing_time_ms,
       is_validated,
       validated_at,
       created_at`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return handleResponse(data, error);
}

// ─── 3. getOCRResults ─────────────────────────────────────────

export async function getOCRResults(
  aiLogId: string
): Promise<ServiceResponse<Tables<'ocr_results'>[]>> {
  const { data, error } = await supabase
    .from('ocr_results')
    .select('*')
    .eq('ai_log_id', aiLogId);

  return handleResponse(data, error);
}

// ─── 4. createTransactionFromAI ───────────────────────────────

export async function createTransactionFromAI(
  aiLogId: string
): Promise<ServiceResponse<Tables<'transactions'>>> {
  // Step 1: Fetch the AI log
  const { data: aiLog, error: fetchError } = await supabase
    .from('ai_logs')
    .select(
      `id,
       user_id,
       parsed_data`
    )
    .eq('id', aiLogId)
    .single();

  if (fetchError || !aiLog) {
    return { data: null, error: fetchError ?? new Error(`AI log not found: ${aiLogId}`) };
  }

  // Step 2: Parse parsed_data JSONB
  const parsed: unknown = aiLog.parsed_data;

  // Step 3: Validate parsed data shape
  if (!isValidParsedData(parsed)) {
    return {
      data: null,
      error: new Error(
        `Invalid parsed data for AI log ${aiLogId}: ` +
        `parsed_data=${JSON.stringify(aiLog.parsed_data)}`
      ),
    };
  }

  const {
    amount,
    type,
    description,
    currency = 'IDR',
  } = parsed;

  // Step 4: Build transaction insert payload
  const payload: TablesInsert<'transactions'> = {
    user_id: aiLog.user_id ?? '',
    type,
    amount,
    currency,
    amount_usd: currency === 'USD' ? amount : 0,
    description: description ?? `AI transaction (${type})`,
    transaction_date: new Date().toISOString(),
    source: 'whatsapp',
    ai_log_id: aiLogId,
    // transaction_id on ai_logs is back-linked separately after insert
  };

  // Step 5: Insert transaction
  const { data: transaction, error: insertError } = await supabase
    .from('transactions')
    .insert(payload)
    .select('*')
    .single();

  if (insertError || !transaction) {
    return { data: null, error: insertError ?? new Error('Transaction insert returned no data') };
  }

  // Step 6: The transaction is already linked via transactions.ai_log_id.
  // No back-link needed on ai_logs in the new schema.

  return { data: transaction, error: null };
}
