import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Environment helper — throws at cold-start if a required variable is missing
// rather than silently failing mid-request. Never use VITE_* here; those are
// embedded by Vite at build time and are NOT available in Node serverless env.
// ---------------------------------------------------------------------------
function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

// Initialised once per cold start (Vercel reuses the module across invocations)
const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));

// ---------------------------------------------------------------------------
// Fonnte sends different field names depending on webhook version.
// Normalise both variants: sender|from and message|text.
// ---------------------------------------------------------------------------
interface FonntePayload {
  sender?: string;   // v1 field
  from?: string;     // v2 field alias
  message?: string;  // v1 field
  text?: string;     // v2 field alias
  timestamp?: string | number;
  device?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body as FonntePayload;

  console.log('Incoming WA:', JSON.stringify(body, null, 2));

  // Normalise field names from Fonnte v1 and v2
  const sender = body?.sender ?? body?.from ?? '';
  const message = body?.message ?? body?.text ?? '';

  // Ignore empty / bot-echo payloads
  if (!sender.trim() || !message.trim()) {
    console.warn('WA webhook: empty sender or message — ignored');
    return res.status(400).json({ success: false, error: 'Missing sender or message' });
  }

  const { error } = await supabase.from('whatsapp_messages').insert({
    sender,
    message,
  });

  if (error) {
    console.error('Supabase insert error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }

  console.log(`WA message stored — from: ${sender}`);
  return res.status(200).json({ success: true });
}
