import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env helper — returns undefined (not throws) so health check still works
// ---------------------------------------------------------------------------
function env(key: string): string {
  return process.env[key] ?? '';
}

// Lazy supabase client — created on first DB call, not at module load
// This prevents FUNCTION_INVOCATION_FAILED when env vars aren't set yet
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    // Support multiple naming conventions across environments
    const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
    const key = env('SUPABASE_SERVICE_ROLE_KEY')
             || env('VITE_SUPABASE_SERVICE_ROLE_KEY')
             || env('VITE_SUPABASE_ROLE_KEY');   // ← matches Vercel project var
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    _supabase = createClient(url, key, { auth: { persistSession: false } });
  }
  return _supabase;
}

// ---------------------------------------------------------------------------
// Fonnte payload — supports v1 and v2 field names
// Full payload reference: https://docs.fonnte.com/webhook
// ---------------------------------------------------------------------------
interface FonntePayload {
  sender?: string;        // v1
  from?: string;          // v2
  message?: string;       // v1 text
  text?: string;          // v2 text
  id?: string;
  messageId?: string;
  type?: string;          // 'text' | 'image' | 'audio' | 'video' | 'document'
  timestamp?: string | number;
  date?: string | number;
  url?: string;
  mimeType?: string;
  mimetype?: string;
  device?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Normalise phone numbers for comparison
// Strips +, spaces, dashes. e.g. "+62 822-2765-3512" → "6282227653512"
// ---------------------------------------------------------------------------
function normalisePhone(phone: string): string {
  return phone.replace(/[\s\-+]/g, '');
}

// ---------------------------------------------------------------------------
// Get device owner's user_id.
// All messages received by the Fonnte device belong to the device owner.
// Strategy:
//   1. Match OWNER_PHONE_NUMBER env → lookup user_preferences.whatsapp_number
//   2. Fallback: first row in user_preferences (single-user app)
// ---------------------------------------------------------------------------
async function getDeviceOwnerUserId(): Promise<string | null> {
  const ownerPhone = normalisePhone(process.env['OWNER_PHONE_NUMBER'] ?? '');

  const { data, error } = await getSupabase()
    .from('user_preferences')
    .select('user_id, whatsapp_number');

  if (error) {
    console.error('user_preferences lookup error:', error.message);
    return null;
  }

  const rows = data ?? [];

  // Try to match by owner phone number
  if (ownerPhone) {
    const match = rows.find((row) => {
      const stored = normalisePhone(row.whatsapp_number ?? '');
      return stored === ownerPhone || stored === `62${ownerPhone.replace(/^0/, '')}`;
    });
    if (match?.user_id) {
      console.log(`✅ Device owner matched by phone → ${match.user_id}`);
      return match.user_id;
    }
  }

  // Fallback: single-user app — use the only user
  if (rows.length > 0) {
    console.log(`📌 Fallback to first user → ${rows[0].user_id}`);
    return rows[0].user_id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // GET — health check + env var diagnostics
    if (req.method === 'GET') {
      return res.status(200).json({
        status: 'ok',
        endpoint: '/api/webhooks/whatsapp',
        message: 'WhatsApp webhook is live. Send POST to receive messages.',
        timestamp: new Date().toISOString(),
        env_check: {
          SUPABASE_URL:              !!(env('SUPABASE_URL') || env('VITE_SUPABASE_URL')),
          SUPABASE_SERVICE_ROLE_KEY: !!(env('SUPABASE_SERVICE_ROLE_KEY') || env('VITE_SUPABASE_SERVICE_ROLE_KEY') || env('VITE_SUPABASE_ROLE_KEY')),
          OWNER_PHONE_NUMBER:        !!env('OWNER_PHONE_NUMBER'),
        },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Log headers so we can see Content-Type Fonnte uses
    console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));

    // Fonnte sometimes sends application/x-www-form-urlencoded, not JSON
    // Vercel parses both, but we normalise here just in case
    let rawBody: Record<string, unknown> = {};
    if (typeof req.body === 'string') {
      try { rawBody = JSON.parse(req.body); } catch { rawBody = {}; }
    } else if (req.body && typeof req.body === 'object') {
      rawBody = req.body as Record<string, unknown>;
    }

    const body = rawBody as FonntePayload;
    console.log('📱 RAW Fonnte payload:', JSON.stringify(body, null, 2));
    console.log('📋 Keys received:', Object.keys(body));

    // Fonnte field normalisation — all known field name variants
    const sender      = String(body?.sender ?? body?.from ?? body?.phone ?? body?.number ?? body?.device ?? '').trim();
    const message     = String(body?.message ?? body?.text ?? body?.body ?? body?.content ?? '').trim();
    const whatsappId  = String(body?.id ?? body?.messageId ?? body?.message_id ?? '').trim();
    const messageType = String(body?.type ?? body?.message_type ?? 'text').trim();
    const mediaUrl    = (body?.url ?? body?.media_url ?? null) as string | null;
    const mediaType   = (body?.mimeType ?? body?.mimetype ?? body?.media_type ?? null) as string | null;

    // Parse timestamp → ISO string; fall back to now()
    const rawTs      = body?.timestamp ?? body?.date;
    const receivedAt = rawTs
      ? new Date(typeof rawTs === 'number' ? rawTs * 1000 : rawTs).toISOString()
      : new Date().toISOString();

    console.log('📝 Parsed:', { sender, message, whatsappId, messageType });

    // If fields empty, store raw body as text_content for debugging
    const effectiveSender  = sender  || 'unknown';
    const effectiveMessage = message || JSON.stringify(body);

    // user_id = device owner (Marlon), not the sender
    // All messages to this Fonnte device belong to the device owner
    const userId = await getDeviceOwnerUserId();
    if (!userId) {
      console.warn(`⚠️  No user found for phone: ${effectiveSender}`);
    } else {
      console.log(`✅ Matched user_id: ${userId}`);
    }

    // Insert into whatsapp_messages
    const { data: inserted, error } = await getSupabase()
      .from('whatsapp_messages')
      .insert({
        user_id:           userId,
        from_number:       effectiveSender,
        text_content:      effectiveMessage,
        whatsapp_id:       whatsappId || null,
        message_type:      messageType,
        media_url:         mediaUrl,
        media_type:        mediaType,
        processing_status: 'pending',
        received_at:       receivedAt,
      })
      .select('id')
      .single();

    if (error) {
      // Log error but still return 200 so Fonnte doesn't disable the webhook
      console.error('❌ Supabase insert error:', error);
      return res.status(200).json({ success: false, stored: false, error: error.message });
    }

    console.log(`✅ WA message stored — ID: ${inserted?.id} | from: ${sender}`);
    return res.status(200).json({
      success: true,
      message_id: inserted?.id ?? null,
      user_id: userId,
      processing: 'queued',
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('💥 WA webhook unhandled error:', err);
    return res.status(500).json({ success: false, error: message });
  }
}

