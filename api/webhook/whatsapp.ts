import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env helper — fails fast at cold-start, never mid-request
// Use SUPABASE_SERVICE_ROLE_KEY (not ANON KEY) so inserts bypass RLS
// ---------------------------------------------------------------------------
function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

const supabase = createClient(
  env('SUPABASE_URL'),
  env('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Fonnte payload — supports v1 (sender/message) and v2 (from/text) field names
// ---------------------------------------------------------------------------
interface FonntePayload {
  sender?: string;
  from?: string;
  message?: string;
  text?: string;
  timestamp?: string | number;
  device?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Global try/catch — response is always sent, no hanging requests
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body = req.body as FonntePayload;
    console.log('Incoming WA:', JSON.stringify(body, null, 2));

    // Normalise field names across Fonnte versions
    const sender  = (body?.sender  ?? body?.from    ?? '').trim();
    const message = (body?.message ?? body?.text    ?? '').trim();

    console.log('Parsed:', { sender, message });

    if (!sender || !message) {
      console.warn('WA webhook: empty sender or message — ignored');
      return res.status(400).json({ success: false, error: 'Missing sender or message' });
    }

    // Insert using actual table column names: from_number, text_content
    const { error } = await supabase.from('whatsapp_messages').insert({
      from_number:  sender,
      text_content: message,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    console.log(`WA message stored — from: ${sender}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('WA webhook unhandled error:', err);
    return res.status(500).json({ success: false, error: message });
  }
}
