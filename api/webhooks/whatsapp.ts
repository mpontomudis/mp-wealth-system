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
// Lookup user_id by phone number.
// Strategy:
//   1. Query user_preferences.whatsapp_number (normalised match)
//   2. Fallback: if OWNER_PHONE_NUMBER env matches sender → fetch first user
// ---------------------------------------------------------------------------
async function findUserByPhone(senderRaw: string): Promise<string | null> {
  const sender = normalisePhone(senderRaw);

  // Step 1: check user_preferences table
  const { data, error } = await getSupabase()
    .from('user_preferences')
    .select('user_id, whatsapp_number')
    .not('whatsapp_number', 'is', null);

  if (error) {
    console.error('user_preferences lookup error:', error.message);
  }

  const match = (data ?? []).find((row) => {
    const stored = normalisePhone(row.whatsapp_number ?? '');
    // Match exact, or handle 0xxx → 62xxx conversion
    return stored === sender || stored === `62${sender.replace(/^0/, '')}`;
  });

  if (match?.user_id) return match.user_id;

  // Step 2: fallback via OWNER_PHONE_NUMBER env var
  const ownerPhone = process.env['OWNER_PHONE_NUMBER'];
  if (ownerPhone && normalisePhone(ownerPhone) === sender) {
    // Fetch the first (and likely only) user in the system
    const { data: users } = await getSupabase()
      .from('user_preferences')
      .select('user_id')
      .limit(1)
      .single();
    if (users?.user_id) {
      console.log(`📌 Matched via OWNER_PHONE_NUMBER env fallback → ${users.user_id}`);
      return users.user_id;
    }
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

    const body = req.body as FonntePayload;
    // Log FULL raw body — critical for debugging unknown Fonnte payload formats
    console.log('📱 RAW Fonnte payload:', JSON.stringify(body, null, 2));
    console.log('📋 All keys:', Object.keys(body ?? {}));

    // Fonnte v1/v2 field normalisation — check all known variants
    const sender      = (body?.sender ?? body?.from ?? body?.phone ?? body?.number ?? '').toString().trim();
    const message     = (body?.message ?? body?.text ?? body?.body ?? body?.content ?? '').toString().trim();
    const whatsappId  = (body?.id ?? body?.messageId ?? body?.message_id ?? '').toString().trim();
    const messageType = (body?.type ?? body?.message_type ?? 'text').toString().trim();
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

    // Lookup user_id by phone number
    const userId = await findUserByPhone(effectiveSender);
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
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ success: false, error: error.message });
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

