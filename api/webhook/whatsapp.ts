import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Use process.env for serverless context (not import.meta.env which is Vite-only).
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel project environment variables.
// Fallback to VITE_* vars if that's what's configured in your Vercel project.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface FonntePayload {
  sender?: string;
  message?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const body = req.body as FonntePayload;

  console.log('Incoming WA:', body);

  const sender = body?.sender;
  const message = body?.message;

  if (!sender || !message) {
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

  return res.status(200).json({ success: true });
}
